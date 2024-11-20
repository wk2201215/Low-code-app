"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateElectronApp = exports.UpdateSourceType = void 0;
const assert_1 = __importDefault(require("assert"));
const is_url_1 = __importDefault(require("is-url"));
const ms_1 = __importDefault(require("ms"));
const github_url_to_object_1 = __importDefault(require("github-url-to-object"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const util_1 = require("util");
const electron_1 = require("electron");
var UpdateSourceType;
(function (UpdateSourceType) {
    UpdateSourceType[UpdateSourceType["ElectronPublicUpdateService"] = 0] = "ElectronPublicUpdateService";
    UpdateSourceType[UpdateSourceType["StaticStorage"] = 1] = "StaticStorage";
})(UpdateSourceType = exports.UpdateSourceType || (exports.UpdateSourceType = {}));
const pkg = require('../package.json');
const userAgent = (0, util_1.format)('%s/%s (%s: %s)', pkg.name, pkg.version, os_1.default.platform(), os_1.default.arch());
const supportedPlatforms = ['darwin', 'win32'];
function updateElectronApp(opts = {}) {
    // check for bad input early, so it will be logged during development
    const safeOpts = validateInput(opts);
    // don't attempt to update during development
    if (!electron_1.app.isPackaged) {
        const message = 'update-electron-app config looks good; aborting updates since app is in development mode';
        opts.logger ? opts.logger.log(message) : console.log(message);
        return;
    }
    if (safeOpts.electron.app.isReady())
        initUpdater(safeOpts);
    else
        electron_1.app.on('ready', () => initUpdater(safeOpts));
}
exports.updateElectronApp = updateElectronApp;
function initUpdater(opts) {
    const { updateSource, updateInterval, logger, electron } = opts;
    // exit early on unsupported platforms, e.g. `linux`
    if (!supportedPlatforms.includes(process === null || process === void 0 ? void 0 : process.platform)) {
        log(`Electron's autoUpdater does not support the '${process.platform}' platform. Ref: https://www.electronjs.org/docs/latest/api/auto-updater#platform-notices`);
        return;
    }
    const { app, autoUpdater, dialog } = electron;
    let feedURL;
    let serverType = 'default';
    switch (updateSource.type) {
        case UpdateSourceType.ElectronPublicUpdateService: {
            feedURL = `${updateSource.host}/${updateSource.repo}/${process.platform}-${process.arch}/${app.getVersion()}`;
            break;
        }
        case UpdateSourceType.StaticStorage: {
            feedURL = updateSource.baseUrl;
            if (process.platform === 'darwin') {
                feedURL += '/RELEASES.json';
                serverType = 'json';
            }
            break;
        }
    }
    const requestHeaders = { 'User-Agent': userAgent };
    function log(...args) {
        logger.log(...args);
    }
    log('feedURL', feedURL);
    log('requestHeaders', requestHeaders);
    autoUpdater.setFeedURL({
        url: feedURL,
        headers: requestHeaders,
        serverType,
    });
    autoUpdater.on('error', (err) => {
        log('updater error');
        log(err);
    });
    autoUpdater.on('checking-for-update', () => {
        log('checking-for-update');
    });
    autoUpdater.on('update-available', () => {
        log('update-available; downloading...');
    });
    autoUpdater.on('update-not-available', () => {
        log('update-not-available');
    });
    if (opts.notifyUser) {
        autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
            log('update-downloaded', [event, releaseNotes, releaseName, releaseDate, updateURL]);
            const dialogOpts = {
                type: 'info',
                buttons: ['Restart', 'Later'],
                title: 'Application Update',
                message: process.platform === 'win32' ? releaseNotes : releaseName,
                detail: 'A new version has been downloaded. Restart the application to apply the updates.',
            };
            dialog.showMessageBox(dialogOpts).then(({ response }) => {
                if (response === 0)
                    autoUpdater.quitAndInstall();
            });
        });
    }
    // check for updates right away and keep checking later
    autoUpdater.checkForUpdates();
    setInterval(() => {
        autoUpdater.checkForUpdates();
    }, (0, ms_1.default)(updateInterval));
}
function guessRepo(electron) {
    var _a;
    const pkgBuf = fs_1.default.readFileSync(path_1.default.join(electron.app.getAppPath(), 'package.json'));
    const pkg = JSON.parse(pkgBuf.toString());
    const repoString = ((_a = pkg.repository) === null || _a === void 0 ? void 0 : _a.url) || pkg.repository;
    const repoObject = (0, github_url_to_object_1.default)(repoString);
    (0, assert_1.default)(repoObject, "repo not found. Add repository string to your app's package.json file");
    return `${repoObject.user}/${repoObject.repo}`;
}
function validateInput(opts) {
    var _a;
    const defaults = {
        host: 'https://update.electronjs.org',
        updateInterval: '10 minutes',
        logger: console,
        notifyUser: true,
    };
    const { host, updateInterval, logger, notifyUser } = Object.assign({}, defaults, opts);
    // allows electron to be mocked in tests
    const electron = opts.electron || require('electron');
    let updateSource = opts.updateSource;
    // Handle migration from old properties + default to update service
    if (!updateSource) {
        updateSource = {
            type: UpdateSourceType.ElectronPublicUpdateService,
            repo: opts.repo || guessRepo(electron),
            host,
        };
    }
    switch (updateSource.type) {
        case UpdateSourceType.ElectronPublicUpdateService: {
            (0, assert_1.default)((_a = updateSource.repo) === null || _a === void 0 ? void 0 : _a.includes('/'), 'repo is required and should be in the format `owner/repo`');
            (0, assert_1.default)(updateSource.host && (0, is_url_1.default)(updateSource.host) && updateSource.host.startsWith('https:'), 'host must be a valid HTTPS URL');
            break;
        }
        case UpdateSourceType.StaticStorage: {
            (0, assert_1.default)(updateSource.baseUrl &&
                (0, is_url_1.default)(updateSource.baseUrl) &&
                updateSource.baseUrl.startsWith('https:'), 'baseUrl must be a valid HTTPS URL');
            break;
        }
    }
    (0, assert_1.default)(typeof updateInterval === 'string' && updateInterval.match(/^\d+/), 'updateInterval must be a human-friendly string interval like `20 minutes`');
    (0, assert_1.default)((0, ms_1.default)(updateInterval) >= 5 * 60 * 1000, 'updateInterval must be `5 minutes` or more');
    (0, assert_1.default)(logger && typeof logger.log, 'function');
    return { updateSource, updateInterval, logger, electron, notifyUser };
}
//# sourceMappingURL=index.js.map