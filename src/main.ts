import express from "express"
import * as util from "./util"
import * as config from "./config"
import * as filedef from "./filedef"
import * as packages from "./package"
import * as web_interface from "./web_interface"
import * as cfapi from "./cfapi"

config.ensure_files()
const c = filedef.get_conf()

const app = express();
export const PORT = 5000;
export const REPOSITORY = `${c.repository}:${PORT}`

app.get("/", (req, res) => {
    let html = web_interface.default_template(web_interface.package_list(filedef.get_index().packages));
    res.send(html);
});

app.get("/v1/get_available_packages", (req, res) => {
    let idx = filedef.get_index().packages
    res.send(JSON.stringify(idx))
})

app.get("/v1/download_release/:slug/:rel_id", (req, res) => {
    let lloc = packages.Locator.from_short_slug(`${REPOSITORY}->${req.params.slug}->${req.params.rel_id}`)
    let redirect_url = packages.locator_to_release(lloc, filedef.get_index().packages).direct_link;
    res.redirect(redirect_url);
});

async function main() {
    util.print_debug("Starting server...");
    let to_index = filedef.get_tracked().cf_ids;
    for (const cf_id of to_index) {
        cfapi.index_package(cf_id);
    }
    app.listen(PORT, () => {
        util.print_debug(`Server started at ${PORT}`);
    });
    
}

main();