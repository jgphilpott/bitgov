from socket import socket
from multiprocessing import Process
from bitgov.protocol.utilities import process_incoming, process_outgoing

def client_broadcast(HOST, PORT, IPv, PROTOCOL, data):
    try:
        with socket(IPv, PROTOCOL) as sock:
            sock.connect((HOST, PORT))
            print("\n\033[0;33mBroadcasting to: \033[1;33m{}:{}\033[0;0m".format(HOST, PORT))
            Process(target=client_send, args=(sock, data)).start()
    except:
        print("\n\033[0;31mBroadcast Error!\033[0;0m ⛔\n")

def client_send(connection, data):
    connection.sendall(process_outgoing(data))
    response = process_incoming(connection)
    print("\033[1;32mResponse:\033[0;32m {}\033[0;0m\n".format(response))
