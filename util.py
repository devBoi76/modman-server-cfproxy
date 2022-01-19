import time, datetime, json
def time_ms():
    return int(time.time() * 1000)
def iso_str_to_ms(iso: str):
    desired_len = 19
    return int(datetime.datetime.fromisoformat(iso[:desired_len - len(iso)]).timestamp() * 1000)
def get_idx():
    return json.loads(open("./assets/pkg_index.json").read())
def get_cf_idx():
    return json.loads(open("./assets/pkgs_to_track.json").read())
def get_conf():
    return json.loads(open("./assets/conf.json").read())

def arr_add(arr, item):
    if arr == None or len(arr) == 0:
        return [item]
    if arr.__contains__(item):
        return arr
    return arr + [item]
