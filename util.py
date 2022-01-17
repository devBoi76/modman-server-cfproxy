import time, json
def time_ms():
    return int(time.time() * 1000)
def get_idx():
    return json.loads(open("./assets/pkg_index.json").read())
def get_cf_idx():
    # f = open("./assets/pkgs_to_track.json", "r")
    # a = f.read()
    # f.close()
    # print(a)
    # return json.loads(a)
    return json.loads(open("./assets/pkgs_to_track.json").read())
def get_conf():
    return json.loads(open("./assets/conf.json").read())

def arr_add(arr, item):
    if arr == None:
        return [item]
    if arr.__contains__(item):
        return arr
    return arr + [item]
