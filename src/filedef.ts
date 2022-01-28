import * as packages from "./package"
import * as fs from "fs"

export class index {
    next_pkg_id: number;
    packages: Array<packages.Package>
    constructor() {
        this.next_pkg_id = 0;
        this.packages = [];
    }
}

export function get_index(): index {
    let f = fs.readFileSync("./assets/pkg_index.json", "utf-8");
    return JSON.parse(f);
}

export function write(file: index | tracked | conf, name: string) {
    switch(name) {
        case "index":
            fs.writeFileSync("./assets/pkg_index.json", JSON.stringify(file))
            break;
        case "tracked":
            fs.writeFileSync("./assets/pkgs_to_track.json", JSON.stringify(file))
            break;
        case "conf":
            fs.writeFileSync("./assets/conf.json", JSON.stringify(file))
            break;
    }
} 

export class tracked {
    cf_ids: Array<number>;
    packages: Array<packages.TrackedPackage>
    constructor() {
        this.cf_ids = [];
        this.packages = [];
    }
}

export function get_tracked(): tracked {
    let f = fs.readFileSync("./assets/pkgs_to_track.json", "utf-8");
    return JSON.parse(f);
}

export class conf {
    api_type: number;
    name: string;
    constructor() {
        this.api_type = 1;
        this.name = "My mod repository";
    }
}

export function get_conf(): conf {
    let f = fs.readFileSync("./assets/conf.json", "utf-8");
    return JSON.parse(f);
}