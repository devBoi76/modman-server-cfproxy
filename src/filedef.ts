import * as packages from "./package"
import * as fs from "fs"

// This file is meant to define the layout of files that modman server interfaces with and provide helper functions to interface with them

export class Index {
    next_pkg_id: number;
    packages: Array<packages.Package>
    constructor() {
        this.next_pkg_id = 0;
        this.packages = [];
    }
}

export function get_index(): Index {
    let f = fs.readFileSync("./assets/pkg_index.json", "utf-8");
    return JSON.parse(f);
}

export function write(file: Index | Tracked | Config, name: "index"|"tracked"|"conf") {
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

export class Tracked {
    cf_ids: Array<number>;
    packages: Array<packages.TrackedPackage>
    constructor() {
        this.cf_ids = [];
        this.packages = [];
    }
}

export function get_tracked(): Tracked {
    let f = fs.readFileSync("./assets/pkgs_to_track.json", "utf-8");
    return JSON.parse(f);
}

export class Config {
    api_type: number;
    name: string;
    crawl: boolean;
    repository: string;
    constructor() {
        this.api_type = 1;
        this.name = "My mod repository";
        this.crawl = false;
        this.repository = "http://localhost"
    }
}

export function get_conf(): Config {
    let f = fs.readFileSync("./assets/conf.json", "utf-8");
    return JSON.parse(f);
}