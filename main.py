from flask import Flask, make_response, send_from_directory, request
import os
import package
import json
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
    resp = make_response(send_from_directory(f"./assets/{pkg_id}/{release_id}","file.jar"))
    f = open("./assets/pkg_index.json")
    j = json.loads(f.read())
    j['packages'][int(pkg_id)]['releases'][int(release_id)]['downloads'] += 1
    f = open("./assets/pkg_index.json", "w")
    f.write(json.dumps(j))
    f.close()

    return resp

@app.route("/v1/get_available_packages")
def get_available_packages():
    f = open("./assets/pkg_index.json")
    r = make_response(json.dumps(json.loads(f.read())['packages']))
    r.headers.set("Content-Type", "application/json")
    return r

@app.post("/v1/create_package")
def create_package_post():
    name = request.form.get("name", None)
    description = request.form.get("description", None);
    if name == None or description == None:
        return "Bad Request", 400
    
    package.Package.create_new("Very Cool Mod", "This is a very cool mod")
    return "OK", 200

@app.post("/v1/create_release")
def create_release_post():
    version = request.form.get("version", None)
    game_version = request.form.get("game_version", None)
    deps = request.form.get("deps", None)
    parent_package_id = int(request.form.get("parent_package_id", None))

    if version == None or game_version == None or deps == None or parent_package_id == None:
        return "Bad Request", 400
    deps = json.loads(deps)
    package.Release.create_new(version, game_version, deps, parent_package_id)
    return "OK", 200

@app.post("/v1/upload_release_file/<pkg_id>/<release_id>")
def upload_release_file_post(pkg_id, release_id):
    
    file = request.files["file"]
    file.save(f"./assets/{pkg_id}/{release_id}/file.jar")

    return "OK", 200


if __name__ == "__main__":
    setup()
    # of2 = package.Package.create_new("OptiFine2", "A performance enchancing mod but better")
    # package.Release.create_new("HD_U_G9", "1.16.5", [], of2.id)
    app.run()


