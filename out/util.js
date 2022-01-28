"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_sync = exports.arr_eq = exports.range = exports.print_release = exports.print_debug = exports.print_note = exports.print_error = exports.colors = void 0;
let prmpt = require("prompt-sync")({ sigint: true });
const packages = __importStar(require("./package"));
const xmlhpr = __importStar(require("xmlhttprequest"));
exports.colors = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",
    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgRedBright: "\x1b[91m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgRedBright: "\x1b[101m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgYellowBright: "\x1b[103m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m"
};
function print_error(text) {
    console.log(`${exports.colors.BgRedBright}${exports.colors.FgBlack}[ERROR]${exports.colors.Reset}${exports.colors.Bright} ${text}${exports.colors.Reset}`);
}
exports.print_error = print_error;
function print_note(text) {
    console.log(`${exports.colors.BgCyan}${exports.colors.FgBlack}[NOTE]${exports.colors.Reset} ${text}`);
}
exports.print_note = print_note;
function print_debug(text) {
    console.log(`${exports.colors.BgYellowBright + exports.colors.FgBlack}[DEBUG]${exports.colors.Reset + exports.colors.Dim} ${text}${exports.colors.Reset}`);
}
exports.print_debug = print_debug;
function print_release(release, known_packages) {
    let a = packages.locator_to_package(packages.Locator.from_short_slug(release.parent_locator), known_packages);
    if (release.is_dependency) {
        console.log(`${exports.colors.BgGreen}${exports.colors.FgBlack}[Dependency]${exports.colors.Reset} ${a.name} version ${release.version} for Minecraft ${release.game_version}`);
        return;
    }
    console.log(`${exports.colors.BgGreen}${exports.colors.FgBlack}[Release]${exports.colors.Reset} ${a.name} version ${release.version} for minecraft ${release.game_version}`);
}
exports.print_release = print_release;
const range = (start, stop, step) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
exports.range = range;
function arr_eq(arrOne, arrTwo) {
    return JSON.stringify(arrOne) == JSON.stringify(arrTwo);
}
exports.arr_eq = arr_eq;
function get_sync(uri) {
    var request = new xmlhpr.XMLHttpRequest();
    request.open('GET', uri, false);
    request.send();
    return request.responseText;
}
exports.get_sync = get_sync;
// export function is_file(path: string) {
//     const stats = fs.statSync(path);
//     return stats.isFile() || stats.isDirectory();
// }
//# sourceMappingURL=util.js.map