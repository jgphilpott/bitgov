import os

def get_nodes(server):

    print("here")

    # check if this is the first connection
        # if yes
            # use sparks
        # else
            # use masters

    # if sparks/masters fail to connect..
    if server.is_alive():
        server.terminate()

    # print status and node list
