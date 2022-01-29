import * as util from "./util"
import * as filedef from "./filedef"
import * as fs from "fs"

export function ensure_files() {
    if(!fs.existsSync("./assets")) {
        fs.mkdirSync("./assets");
    }
    if(!fs.existsSync("./assets/conf.json")) {
        fs.writeFileSync("./assets/conf.json", JSON.stringify(new filedef.Config()));
    }
    if(!fs.existsSync("./assets/pkg_index.json")) {
        fs.writeFileSync("./assets/pkg_index.json", JSON.stringify(new filedef.Index()));
    }
    if(!fs.existsSync("./assets/pkgs_to_track.json")) {
        fs.writeFileSync("./assets/pkgs_to_track.json", JSON.stringify(new filedef.Tracked()));
    }
}