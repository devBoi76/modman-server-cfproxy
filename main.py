from flask import Flask, make_response, send_from_directory, request, redirect
import time, datetime
import os
import package
import json
import cfapi
import util
app = Flask(__name__)

app.config["REPO_URL"] = "http://localhost:5000"

def setup():
    if(not os.path.isdir("./assets")):
        os.mkdir("./assets");
    if(not os.path.isfile("./assets/pkg_index.json")):
        f = open("./assets/pkg_index.json", "w")
        f.write('{"next_pkg_id": 0, "packages":[]}')
        f.close()
    if(not os.path.isfile("./assets/conf.json")):
        f = open("./assets/conf.json", "w")
        f.write('{"api_type": 1, "name": "My Mod Repository"}')
        f.close()
    if(not os.path.isfile("./assets/pkgs_to_track.json")):
        f = open("./assets/pkgs_to_track.json", "w")
        f.write('{"cf_ids": [], "packages": []}')
        f.close()

def update_packages():
    idx = util.get_idx()
    j = util.get_cf_idx()
    for i, pkg in enumerate(j['packages']):
        cfp = cfapi.get_package(pkg['cf_id'])
        if pkg['last_modified'] < int(datetime.datetime.fromisoformat(cfp['dateModified'][:-5]).timestamp() * 1000):
            cfapi.update_package(pkg['local_id'])


@app.route("/")
def hello():
    return "super secret don't look"


# v1 is used for the normal communication method where the server returns a list of all available packages
# v2 is the "direct" mode, where the client asks for once specific package

@app.route("/get_repo_info")
def get_repo_info():
    f = open("./assets/conf.json")
    j = json.loads(f.read())
    return j

@app.route("/v1/download_release/<pkg_id>/<release_id>")
def get_file(pkg_id, release_id):
    f = open("./assets/pkg_index.json")
    j = json.loads(f.read())
    j['packages'][int(pkg_id)]['releases'][int(release_id)]['downloads'] += 1

    return redirect(j['packages'][int(pkg_id)]['releases'][int(release_id)]['direct_link'])

    return resp

@app.route("/v1/get_available_packages")
def get_available_packages():
    f = open("./assets/pkg_index.json")
    r = make_response(json.dumps(json.loads(f.read())['packages']))
    r.headers.set("Content-Type", "application/json")
    return r

if __name__ == "__main__":
    setup()
    cfapi.create_tracked_pkgs()
    app.run()


