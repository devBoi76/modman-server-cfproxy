let prmpt = require("prompt-sync")({ sigint: true });
import * as packages from "./package"
import * as xmlhpr from "xmlhttprequest"
import * as fs from "fs"

export const colors = {
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
}

export function print_error(text: string) {
	console.log(`${colors.BgRedBright}${colors.FgBlack}[ERROR]${colors.Reset}${colors.Bright} ${text}${colors.Reset}`);
}
export function print_note(text: string) {
	console.log(`${colors.BgCyan}${colors.FgBlack}[NOTE]${colors.Reset} ${text}`);
}

export function print_debug(text: any) {
	console.log(`${colors.BgYellowBright + colors.FgBlack}[DEBUG]${colors.Reset + colors.Dim} ${text}${colors.Reset}`);
}

export function print_release(release: packages.Release, known_packages: Array<packages.Package>): void {
    let a = packages.locator_to_package(packages.Locator.from_short_slug(release.parent_locator), known_packages);
	if(release.is_dependency){
		console.log(`${colors.BgGreen}${colors.FgBlack}[Dependency]${colors.Reset} ${a.name} version ${release.version} for Minecraft ${release.game_version}`)
		return;
	}
	console.log(`${colors.BgGreen}${colors.FgBlack}[Release]${colors.Reset} ${a.name} version ${release.version} for minecraft ${release.game_version}`)
}

export const range = (start, stop, step) => Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step));

export function arr_eq(arrOne: Array<any>, arrTwo: Array<any>): boolean {
	return JSON.stringify(arrOne) == JSON.stringify(arrTwo)
}

export function get_sync(uri: string) {
	var request = new xmlhpr.XMLHttpRequest();
	request.open('GET', uri, false);
	request.send();
	return request.responseText;
}

// export function is_file(path: string) {
//     const stats = fs.statSync(path);
//     return stats.isFile() || stats.isDirectory();
// }