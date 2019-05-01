import os
import time

def get_nodes(server):

    time.sleep(3)
    print("getting nodes")

    # check if this is the first connection
        # if yes
            # use sparks
        # else
            # use node list

    # if sparks/nodes fail to connect..
    if server.is_alive():
        server.terminate()

    # print status and node list
