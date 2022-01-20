from main import app
import os
import json
import time
import util
from cfapi import REPOSITORY

class Package:
    id: int = -1
    name: str = ""
    description: str = ""
    repository: str = app.config["REPO_URL"]
    repository_id: int = -1
    releases: list = []
    authors: list = []
    slug: str = ""

    def __init__(self, id, name, slug, description, authors, repository_id, repository=app.config["REPO_URL"], releases = []):
        self.id = id
        self.name = name
        self.slug = slug
        self.description = description
        self.authors = authors
        self.repository = repository
        self.repository_id = repository_id
        self.releases = releases
        
    @classmethod
    def create_new(cls, name, slug, description, authors, repository=app.config['REPO_URL'], repository_id=None):
        f = open("./assets/pkg_index.json", "r")
        j = util.get_idx()
        if repository_id:
            print(repository_id)
            p = cls(
                id=j["next_pkg_id"], 
                name=name,
                slug=slug,
                description=description,
                authors=authors,
                repository=repository,
                repository_id=repository_id
                )
        else:
            p = cls(
            id=j["next_pkg_id"], 
            name=name, 
            slug=slug,
            description=description,
            authors=authors,
            repository=repository,
            repository_id=j["next_pkg_id"]
            )
        # os.mkdir(f"./assets/{j['next_pkg_id']}")
        j["next_pkg_id"] += 1
        j["packages"].append(p.as_json())
        f = open("./assets/pkg_index.json", "w")
        f.write(json.dumps(j))
        f.close()
        
        return p

    @classmethod
    def obj_from_id(cls, id: int):
        f = open("./assets/pkg_index.json", "r")
        j = json.loads(f.read())
        f.close()
        p_json = j['packages'][id]
        p = cls(
            id=p_json['id'],
            name=p_json['name'],
            slug=p_json['slug'],
            description=p_json['description'],
            authors=p_json['authors'],
            repository=p_json['repository'],
            repository_id=p_json['repository_id'],
            releases=p_json['releases']
        )
        return p

    def as_json(self):
        j = json.loads('{}')
        j['id'] = self.id
        j['name'] = self.name
        j['slug'] = self.slug
        j['description'] = self.description
        j['authors'] = self.authors
        j['repository'] = self.repository
        j['repository_id'] = self.repository_id
        j['releases'] = self.releases
        return j
    
    def next_release_id(self):
        return len(self.releases)

class Release:
    id: int = 1
    version: str = ""
    game_version: str = ""
    deps: list = []
    parent_package_id: int = 1
    released: int = 0
    downloads: int = 0
    direct_link: str = ""
    prefer_link: bool = False

    def __init__(self, id, version, game_version, deps: list, parent_package_id: int, direct_link: str, prefer_link: bool = False, released=time.time_ns()):
        self.id = id
        self.version = version
        self.game_version = game_version
        self.deps = deps
        self.parent_package_id = parent_package_id
        self.released = released
        self.direct_link = direct_link
        self.prefer_link = prefer_link
    
    @classmethod
    def create_new(cls, version, game_version, deps: list, parent_package_id: int, direct_link = None, prefer_link: bool = False, released=time.time_ns()):
        f = open("./assets/pkg_index.json")
        j = json.loads(f.read())

        this_id = len(j['packages'][parent_package_id]['releases'])

        if direct_link:
            dlink = direct_link
        else:
            dlink = app.config["REPO_URL"] + f"/v1/download_release/{parent_package_id}/{this_id}"

        rel = cls(
            id=this_id,
            version=version,
            game_version=game_version,
            deps=deps,
            parent_package_id=parent_package_id,
            direct_link=dlink,
            prefer_link=prefer_link,
            released=released
        )

        j['packages'][parent_package_id]['releases'].append(rel.as_json())
        f = open("./assets/pkg_index.json", "w")
        f.write(json.dumps(j))
        f.close()
        # os.mkdir(f"./assets/{parent_package_id}/{this_id}")
    
    @classmethod 
    def obj_from_id(cls, pkg_id, release_id):
        f = open("./assets/pkg_index.json", "r")
        j = json.loads(f.read())

        rel_json = j['packages'][pkg_id]['releases'][release_id]

        rel = cls(
            id = rel_json['id'],
            version = rel_json['version'],
            game_version = rel_json['game_version'],
            deps = rel_json['deps'],
            parent_package_id = rel_json['parent_package_id'],
            released = rel_json['released'],
            direct_link=rel_json['direct_link'],
            prefer_link = j['prefer_link']
        )

    def as_json(self):
        j = json.loads('{}')
        j['id'] = self.id
        j['version'] = self.version
        j['game_version'] = self.game_version
        # j['deps'] = []
        j['deps'] = self.deps
        j['parent_package_id'] = self.parent_package_id
        j['released'] = self.released
        j['downloads'] = self.downloads
        j['direct_link'] = self.direct_link
        j['prefer_link'] = self.prefer_link
        return j

class Dependency:
    pkg_id: int = 1
    release_id: int = 1
    repo: str = REPOSITORY

    def __init__(self, pkg_id, release_id):
        self.pkg_id = pkg_id
        self.release_id = release_id
    
    @classmethod
    def create_new(cls, release):
        d = cls(
        pkg_id = release['parent_package_id'],
        release_id = release['id']
        )
        return d


    def as_json(self):
        j = json.loads("{}")
        j['pkg_id'] = self.pkg_id
        j['release_id'] = self.release_id
        return j

def next_id() -> int: 
    f = open("./assets/pkg_index.json", "r")
    j = json.loads(f.read())
    return j["next_pkg_id"]

def release_compatible(r1: str, r2: str) -> bool:
    arr1 = r1.split(".")
    arr2 = r2.split(".")
    a = (r1 == r2) or (arr1[:2] == arr2[:2])
    # print(f"{arr1} {arr2} {a}")
    return a

def sort_by_timestamp(rel):
    return rel['released']

def get_newest_release(pkg_id: int, game_version: str) -> Release:
    pkg = Package.obj_from_id(pkg_id)
    
    rels = [rel for rel in pkg.releases if release_compatible(rel['game_version'], game_version)]
    
    if len(rels) == 0 or rels == None:
        rels = pkg.releases
        print(f"compatible version for {pkg.name} mc {game_version} not found, selecting latest release")

    # print(rels)
    rels.sort(key=sort_by_timestamp)
    # print(rels)
    rels.reverse()
    return rels[0]