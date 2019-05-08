from os import getcwd, makedirs
from os.path import exists
from ast import literal_eval
from bitgov.utilities import read, write

cwd = getcwd()
nodes_path = cwd + "/bitgov/nodes/sets"

sparks = ({("159.89.112.99", 65535)},)

if not exists(nodes_path):
    makedirs(nodes_path)
    write(nodes_path, "clients", "txt", {None})
    write(nodes_path, "masters", "txt", {None})
    write(nodes_path, "sparks", "txt", sparks)

def get_clients_set():
    return literal_eval(read(nodes_path, "clients", "txt"))

def get_masters_set():
    return literal_eval(read(nodes_path, "masters", "txt"))

def get_sparks_set():
    return literal_eval(read(nodes_path, "sparks", "txt"))[0]

def get_nodes(server):

    print("\033[1;33mConnecting with nodes.. \033[0;0m", end="")

    masters = get_masters_set()
    sparks = get_sparks_set()

    if server is not None:
        if None not in masters:
            pass
        else:
            for spark in sparks:
                print(spark)
            print("")
    else:
        pass

    # if sparks/masters fail to connect..
    # if server.is_alive():
    #     server.terminate()

    # print status and node list
