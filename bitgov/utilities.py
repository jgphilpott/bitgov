from os import getcwd
from socket import socket
from ast import literal_eval

def find_available_port(IPv, PROTOCOL, HOST):

    PORT = 65535

    for _ in range(PORT):
        try:
            sock = socket(IPv, PROTOCOL)
            available = sock.connect_ex((HOST, PORT))
            if available != 0:
                break
            PORT -= 1
        except:
            PORT -= 1

    return PORT

def get_nodes(server):

    print("\033[0;33mConnecting with nodes.. \033[0;0m", end="")
    print(server)
    print("")

    # cwd = getcwd()
    # nodes_path = cwd + "/bitgov/nodes"
    #
    # with open(nodes_path + "/masters.txt", "r") as masters_list:
    #     masters = literal_eval(masters_list.read())
    #
    # if None in masters:
    #
    #     with open(nodes_path + "/sparks.txt", "r") as sparks_list:
    #         sparks = literal_eval(sparks_list.read())[0]
    #
    #     for spark in sparks:
    #         print(spark)
    #
    # else:
    #     pass

    # check if this is the first connection
        # if yes
            # use sparks
        # else
            # use masters

    # if sparks/masters fail to connect..
    # if server.is_alive():
    #     server.terminate()

    # print status and node list
