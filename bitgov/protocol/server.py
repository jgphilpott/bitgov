from socket import socket
from threading import Thread
from multiprocessing import Process
from bitgov.protocol.utilities import process_incoming, process_outgoing

def server_config(HOST, PORT, IPv, PROTOCOL):

    print("\033[0;33mSetting up the server.. \033[0;0m", end="")

    try:
        with socket(IPv, PROTOCOL) as sock:
            sock.bind((HOST, PORT))
            sock.listen()
            server = Process(target=server_accept, args=(sock,))
            server.start()
            print("\033[1;32mSuccess!\033[0;0m 👍")
            print("\033[0;33mServer running on port: \033[1;33m{}\033[0;0m\n".format(str(PORT)))
            return server
    except:
        print("\033[0;31mConfiguration Error!\033[0;0m ⛔\n")

def server_accept(sock):
    while True:
        connection, address = sock.accept()
        Thread(target=server_connection, args=(connection, address)).start()

def server_connection(connection, address):
    with connection:
        print("\033[0;33mConnected with: \033[1;33m{}:{}\033[0;0m".format(address[0], address[1]))
        request = process_incoming(connection)
        print("\033[1;32mReceived:\033[0;32m {}\033[0;0m\n".format(request))
        connection.sendall(process_outgoing(request))
