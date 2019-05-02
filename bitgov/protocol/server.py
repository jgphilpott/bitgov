from socket import socket
from multiprocessing import Process
from bitgov.utilities import get_nodes

def server_config(HOST, PORT, IPv, PROTOCOL, BUFF):

    print("\033[0;33mSetting up the server.. \033[0;0m", end="")

    try:
        with socket(IPv, PROTOCOL) as sock:
            try:
                sock.bind((HOST, PORT))
                sock.listen()
                server_accept(sock)
                # server = Process(target=server_accept, args=(sock,))
                # server.start()
                print("\033[1;32mSuccess!\033[0;0m 👍")
                get_nodes(server)
            except:
                print("\033[0;31mPort Error!\033[0;0m ⛔")
                get_nodes(None)
    except:
        print("\033[0;31mConfiguration Error!\033[0;0m ⛔")
        get_nodes(None)

def server_accept(sock):

    while True:

        connection, address = sock.accept()
        connection.setblocking(False)

        with connection:
            print("Connected with:", address)
            request = b""
            while True:
                try:
                    fragment = connection.recv(BUFF)
                except:
                    break
                request += fragment

            print("Received:", request)
            connection.sendall(request)
