from socket import socket
from threading import Thread
from multiprocessing import Process
from bitgov.protocol.utilities import process_incoming, process_outgoing, switch

def server_config(IPv, PROTOCOL, host, port):

    print("\033[1;33mSetting up the server.. \033[0;0m", end="")

    try:
        with socket(IPv, PROTOCOL) as sock:
            sock.bind((host, port))
            sock.listen()
            server = Process(target=server_accept, args=(sock,))
            server.start()
            print("\033[1;32mSuccess!\033[0;0m 👍")
            print("\033[1;33mServer listening on port: \033[1;32m{}\033[0;0m\n".format(str(port)))
            return server
    except:
        print("\033[1;31mConfiguration Error!\033[0;0m ⛔\n")

def server_accept(sock):
    while True:
        connection, address = sock.accept()
        Thread(target=server_connection, args=(connection, address)).start()

def server_connection(connection, address):
    with connection:
        print("\033[1;33mConnected with: \033[1;32m{}:{}\033[0;0m".format(address[0], address[1]))
        request = process_incoming(connection)
        print("\033[1;33mReceived:\033[1;32m {}\033[0;0m\n".format(request))
        response = switch(request, address)
        connection.sendall(process_outgoing(response))
