from bitgov.nodes.utilities import *
from bitgov.protocol.utilities import get

def spark_check(sparks, port):

    for spark in sparks:
        ip = get(spark[0], spark[1], {"type": "ip_check"})
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
        masters_set = get(item[0], item[1], {"type": "get_masters"})
        print(masters_set)
        print(nodes_path)

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
