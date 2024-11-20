export interface ILogger {
    log(message: string): void;
    info(message: string): void;
    error(message: string): void;
    warn(message: string): void;
}
export declare enum UpdateSourceType {
    ElectronPublicUpdateService = 0,
    StaticStorage = 1
}
export interface IElectronUpdateServiceSource {
    type: UpdateSourceType.ElectronPublicUpdateService;
    /**
     * @param {String} repo A GitHub repository in the format `owner/repo`.
     *                      Defaults to your `package.json`'s `"repository"` field
     */
    repo?: string;
    /**
     * @param {String} host Defaults to `https://update.electronjs.org`
     */
    host?: string;
}
export interface IStaticUpdateSource {
    type: UpdateSourceType.StaticStorage;
    /**
     * @param {String} baseUrl Base URL for your static storage provider where your
     *                         updates are stored
     */
    baseUrl: string;
}
export type IUpdateSource = IElectronUpdateServiceSource | IStaticUpdateSource;
export interface IUpdateElectronAppOptions<L = ILogger> {
    /**
     * @param {String} repo A GitHub repository in the format `owner/repo`.
     *                      Defaults to your `package.json`'s `"repository"` field
     * @deprecated Use the new `updateSource` option
     */
    readonly repo?: string;
    /**
     * @param {String} host Defaults to `https://update.electronjs.org`
     * @deprecated Use the new `updateSource` option
     */
    readonly host?: string;
    readonly updateSource?: IUpdateSource;
    /**
     * @param {String} updateInterval How frequently to check for updates. Defaults to `10 minutes`.
     *                                Minimum allowed interval is `5 minutes`.
     */
    readonly updateInterval?: string;
    /**
     * @param {Object} logger A custom logger object that defines a `log` function.
     *                        Defaults to `console`. See electron-log, a module
     *                        that aggregates logs from main and renderer processes into a single file.
     */
    readonly logger?: L;
    /**
     * @param {Boolean} notifyUser Defaults to `true`.  When enabled the user will be
     *                             prompted to apply the update immediately after download.
     */
    readonly notifyUser?: boolean;
}
export declare function updateElectronApp(opts?: IUpdateElectronAppOptions): void;
