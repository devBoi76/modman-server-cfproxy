import requests, json, time, os, functools

import package
import util
# All of this is based on https://github.com/Mondanzo/mc-curseforge-api
BASE_URL = "https://addons-ecs.forgesvc.net/api/v2/addon"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0"
REPOSITORY = "https://curseforge.com"

def add_pkg_to_tracked(cf_id: int):
    j = util.get_cf_idx()
    j['cf_ids'] = util.arr_add(j['cf_ids'], cf_id)
    print(j)
    f = open("./assets/pkgs_to_track.json", "w")
    f.write(json.dumps(j))
    f.close()

def link_id(cf_id: int, local_id: int):
    j = util.get_cf_idx()
    for i, pkg in j['packages']:
        if(pkg['cf_id'] == cf_id):
            j['packages'][i]['local_id'] = local_id
            break
    
    f = open("./assets/pkgs_to_track.json", "w")
    f.write(json.dumps(j))

def set_last_indexed(local_id: int, last_modified):
    j = util.get_cf_idx()
    for i, pkg in j['packages']:
        if(pkg['local_id'] == local_id):
            j['packages'][i]['last_modified'] = last_modified
            break
    
    f = open("./assets/pkgs_to_track.json", "w")
    f.write(json.dumps(j))

def has_pkg_from_cf(cf_id: int) -> int:
    print(f"has_pkg_from_cf: {cf_id}")
    j = util.get_cf_idx()['packages']
    # print(j)
    # pkgs = [pkg for pkg in j if pkg['cf_id'] == cf_id]
    pkgs = list(filter(lambda pkg: pkg['cf_id'] == cf_id, j))
    if len(pkgs) == 0:
        return -1
    return pkgs[0]['local_id']

def add_pkg_to_idx(cf_id: int):
    
    pkgs_to_add = [cf_id] # set
    to_add = 1
    added_pkgs = []
    added = 0
    rels_to_resolve = []
    iterator = 0
    
    while to_add > added:
        cf_id = pkgs_to_add[iterator]
        
        print(f"pkgs_to_add: {pkgs_to_add}")
        print(f"adding pkg: {cf_id}")
        add_pkg_to_tracked(cf_id)
        if has_pkg_from_cf(cf_id) == -1:
            pkg = get_package(cf_id)
            releases = get_releases(cf_id)
            j = util.get_idx()

            p = package.Package.create_new(pkg['name'], pkg['summary'], repository=REPOSITORY, repository_id=cf_id)
            
            cfidx = util.get_cf_idx()
            cfidx['packages'].append({"cf_id": cf_id, "local_id": p.id, "last_modified": util.time_ms()})
            print(cfidx)
            f = open("./assets/pkgs_to_track.json", "w")
            f.write(json.dumps(cfidx))
            f.close()

            for i, rel in enumerate(releases):
                deps = []
                print(rel['dependencies'])
                print(i)
                for dep in rel['dependencies']:
                    a = has_pkg_from_cf(dep['addonId'])
                    b = rel['gameVersion'][0]
                    print('start')
                    addon_versions = map(lambda r: r['gameVersion'][0], get_releases(dep['addonId']))
                    override_ver = True
                    print('end')

                    
                    for ver in addon_versions:
                        if package.release_compatible(ver, b):
                            override_ver = False
                            break

                    if a > -1:
                        deps.append( package.Dependency(package.get_newest_release(a, rel['game_version'][0], override_ver=override_ver)))
                    else:
                        rel['parent_id'] = p.id
                        rels_to_resolve.append(rel)
                        pkgs_to_add = util.arr_add(pkgs_to_add, dep['addonId'])
                        to_add = len(pkgs_to_add)
                        print(f"adding id: {dep['addonId']}")

                package.Release.create_new("unknown", rel['gameVersion'][0], deps, p.id, direct_link=rel['downloadUrl'].replace("https://edge.", "https://media."), prefer_link=True)
        iterator += 1
        added_pkgs.append(cf_id)
        added += 1
        print(pkgs_to_add)
    
    for rel in rels_to_resolve:
        deps = []
        for dep in rel['dependencies']:
            a = has_pkg_from_cf(dep['addonId'])
            if a > -1:
                a = has_pkg_from_cf(dep['addonId'])
                b = rel['gameVersion'][0]
                print('start2')
                addon_versions = map(lambda r: r['gameVersion'][0], get_releases(dep['addonId']))
                override_ver = True
                print('end2')

                
                for ver in addon_versions:
                    if package.release_compatible(ver, b):
                        override_ver = False
                        break
                deps.append( package.Dependency(package.get_newest_release(a, rel['gameVersion'][0], override_ver=override_ver)))
            else:
                print("UNREACHABLE ERROR - PKG FOR DEPENDENCY NOT FOUND")

        package.Release.create_new("unknown", rel['gameVersion'][0], deps, rel['parent_id'], direct_link=rel['downloadUrl'].replace("https://edge.", "https://media."), prefer_link=True)

def update_package(local_id: int):
    p = package.Package.obj_from_id(local_id)
    releases = get_releases(p.repository_id)
    
    os.rmdir(f"./assets/{local_id}/")
    
    for rel in releases:
        package.Release.create_new("unknown", rel['gameVersion'][0], [], p.id, direct_link=rel['downloadUrl'].replace("https://edge.", "https://media."), prefer_link=True)
    set_last_indexed(local_id, util.time_ms())

def create_tracked_pkgs():
    j = util.get_cf_idx()
    cf_ids = j['cf_ids']
    for id in cf_ids:
        print(f"create_tracked_pkgs() {id}")
        if has_pkg_from_cf(id) > -1:
            continue
        else:
            add_pkg_to_idx(id)

def get_package(cf_id: int):
    a = requests.get(BASE_URL+ f"/{cf_id}/", headers={"User-Agent": USER_AGENT}).text
    # print(a)
    pkg = json.loads(a)
    return pkg

@functools.lru_cache(maxsize=256)
def get_releases(cf_id: int):
    a = requests.get(BASE_URL+ f"/{cf_id}/files/", headers={"User-Agent": USER_AGENT}).text
    # print(a)
    releases = json.loads(a)
    return releases
