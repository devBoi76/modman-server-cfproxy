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
    # print(j)
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
    # print(f"has_pkg_from_cf: {cf_id}")
    j = util.get_cf_idx()['packages']
    # print(j)
    # pkgs = [pkg for pkg in j if pkg['cf_id'] == cf_id]
    pkgs = list(filter(lambda pkg: pkg['cf_id'] == cf_id, j))
    if len(pkgs) == 0:
        return -1
    return pkgs[0]['local_id']

def add_pkg_to_idx(cf_id: int):
    # first, we build the dependency tree
    
    dependency_list = {f"{cf_id}": []}
    root = cf_id
    ids_todo = [cf_id]
    resolved_ids = []
    search_for_deps = True
    while search_for_deps:
        print(dependency_list)
        if len(ids_todo) == 0:
            search_for_deps = False
            break
        
        current_id = ids_todo.pop()
        print(f"doing {current_id}")

        releases = get_releases(current_id)
        
        started_at = dependency_list
        for rel in releases:
            for dep in rel['dependencies']:
                if dep['type'] != 2:
                    if resolved_ids.count(dep['addonId']) == 0:
                        ids_todo = util.arr_add(ids_todo, dep['addonId'])
                    try:
                        dependency_list[f"{current_id}"] = util.arr_add(dependency_list[f"{current_id}"], dep['addonId'])
                    except:
                        dependency_list[f"{current_id}"] = util.arr_add(None, dep['addonId'])
                else:
                    print(f"Ignoring optional (pass 1) {dep} for {current_id}")
        
        resolved_ids = util.arr_add(resolved_ids, current_id)

    # at this point we have all the needed packages
    
    # make an array with the order of installation
    # ids_todo can be reused cuz they're empty
    left_to_resolve = dependency_list
    all_done = False
    ids_todo = [root]
    ordered = [root] # end with the root
    while not all_done:
        if len(ids_todo) == 0: # no more unresolved packages
            all_done = True
            break

        print(ordered)
        current_id = ids_todo.pop()
        
        try:
            _ = left_to_resolve[f"{current_id}"]
        except:
            left_to_resolve[f"{current_id}"] = []

        for dep in left_to_resolve[f"{current_id}"]:
            ids_todo.append(dep)
            # always move the required id to the top
            ordered = list(filter(lambda id: id != dep, ordered))
            ordered.append(dep)
    
    print(f"final order: {ordered}")

    all_added = False
    while not all_added:
        if len(ordered) == 0:
            all_added = True
            break

        current_id = ordered.pop()
        print(f"installing {current_id}")
        if has_pkg_from_cf(current_id) > -1:
            print(f"has {current_id}")
            continue

        # add the package to our index
        pkg = get_package(current_id)
        rels = get_releases(current_id)
        print(f"{len(rels)} releases")
        authors = []
        for au in pkg['authors']:
            authors.append(au['name'])

        p = package.Package.create_new(pkg['name'], pkg['slug'], pkg['summary'], authors, repository=REPOSITORY, repository_id=current_id)

        # do everything we have to with the index file
        add_pkg_to_tracked(p.repository_id)
        
        cf_idx = util.get_cf_idx()
        cf_idx['packages'].append({"cf_id": current_id, "local_id": p.id, "last_modified": util.time_ms()})
        f = open("./assets/pkgs_to_track.json", "w")
        f.write(json.dumps(cf_idx))
        f.close()


        for rel in rels:
            if len(rel['gameVersion']) == 0:
                print(f"game version not found for {rel['displayName']} id {rel['id']}. Skipping")
                continue
            deps = []
            for dep in rel['dependencies']:
                if dep['type'] != 2:
                    depid = has_pkg_from_cf(dep['addonId'])
                    deps.append( {"pkg_id": depid, "release_id": package.get_newest_release(depid, rel['gameVersion'][0])['id'], "repo": REPOSITORY})
                else:
                    print(f"Ignoring optional (pass 2) {dep} for {p.id}")
            
            r = package.Release.create_new("unknown", rel['gameVersion'][0], deps, p.id, released=util.iso_str_to_ms(rel['fileDate']), direct_link=rel['downloadUrl'].replace("https://edge.", "https://media."), prefer_link=True)

def update_releases(local_id: int):
    p = package.Package.obj_from_id(local_id)
    releases = get_releases(p.repository_id)

    
    new_releases = len(releases) - len(p.releases)
    print(f"New releases for {p.name}: {new_releases}")
    
    
    # for rel in releases:
    #     package.Release.create_new("unknown", rel['gameVersion'][0], [], p.id, direct_link=rel['downloadUrl'].replace("https://edge.", "https://media."), prefer_link=True)
    # set_last_indexed(local_id, util.time_ms())

def create_tracked_pkgs(cf_ids):
    for id in cf_ids:
        print(f"create_tracked_pkgs() {id}")
        if has_pkg_from_cf(id) > -1:
            # update_releases(has_pkg_from_cf(id))
            continue
        
        else:
            add_pkg_to_idx(id)

def crawl_curseforge(start_index: int):
    page_size = 50
    i = start_index
    while True:
        packages = get_page(i)
        for pkg in packages:
            create_tracked_pkgs([pkg['id']])

        i += 1


@functools.lru_cache(maxsize=256)
def get_package(cf_id: int):
    got_result = False
    while not got_result:
        a = requests.get(BASE_URL+ f"/{cf_id}/", headers={"User-Agent": USER_AGENT}).text
        try:
            pkg = json.loads(a)
            got_result = True
        except:
            continue
    # print(a)
    return pkg

@functools.lru_cache(maxsize=256)
def get_releases(cf_id: int):
    got_result = False
    while not got_result:
        a = requests.get(BASE_URL+ f"/{cf_id}/files/", headers={"User-Agent": USER_AGENT}).text
        try:
            releases = json.loads(a)
            got_result = True
        except:
            continue

    # print(a)
    return releases

def get_page(page: int):
    PAGE_SIZE=50

    got_result = False
    while not got_result:
        a = requests.get(BASE_URL+ f"/search?gameId=432&sectionId=6&pageSize={PAGE_SIZE}&index={page}", headers={"User-Agent": USER_AGENT}).text
        try:
            packages = json.loads(a)
            got_result = True
        except:
            continue

    print(a)
    return packages