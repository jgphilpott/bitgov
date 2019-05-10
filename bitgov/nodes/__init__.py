from os import getcwd, makedirs
from os.path import exists
from bitgov.utilities import write
from bitgov.nodes.utilities import *
from bitgov.protocol.utilities import client_get

cwd = getcwd()
nodes_path = cwd + "/bitgov/node_sets"

empty_set = {None}
sparks_set = ({("159.89.112.99", 65535)},)

if not exists(nodes_path):
    makedirs(nodes_path)
    write(nodes_path, "clients", "txt", empty_set)
    write(nodes_path, "masters", "txt", empty_set)
    write(nodes_path, "sparks", "txt", sparks_set)

def spark_check(sparks, port):

    for spark in sparks:
        ip = client_get(spark[0], spark[1], {"type": "ip_check"})
        if ip:
            address = (ip["address"][0], port)
            break
        else:
            address = None

    if address in sparks:
        print("\033[1;32mSuccess!\033[0;0m 👍")
        print("\033[1;33mYour status is: \033[1;32mSpark\033[0;0m 🥇\n")

def get_masters(set):

    for item in set:
        masters_set = client_get(item[0], item[1], {"type": "get_masters"})
        print(masters_set)

def get_nodes(server, port):

    print("\033[1;33mConnecting with nodes.. \033[0;0m", end="")

    masters = get_masters_set()
    sparks = get_sparks_set()

    if server is not None:
        if None not in masters:
            pass
        else:
            spark_check(sparks, port)
            get_masters(sparks)
    else:
        pass
