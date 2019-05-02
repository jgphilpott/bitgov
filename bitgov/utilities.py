from os import getcwd
from ast import literal_eval

def get_nodes(server):

    cwd = getcwd()

    with open(cwd + "/bitgov/nodes/masters.txt", "r") as masters_list:
        masters = masters_list.read()
        print(type(literal_eval(masters)))

    # check if this is the first connection
        # if yes
            # use sparks
        # else
            # use masters

    # if sparks/masters fail to connect..
    # if server.is_alive():
    #     server.terminate()

    # print status and node list
