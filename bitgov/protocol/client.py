from socket import socket
from multiprocessing import Process
from bitgov.protocol.utilities import process_incoming, process_outgoing

def client_broadcast(IPv, PROTOCOL, host, port, request):
    try:
        with socket(IPv, PROTOCOL) as sock:
            sock.connect((host, port))
            print("\n\033[1;33mBroadcasting to: \033[1;32m{}:{}\033[0;0m".format(host, port))
            Process(target=client_send, args=(sock, request)).start()
    except:
        print("\n\033[1;31mBroadcast Error!\033[0;0m ⛔\n")

def client_send(connection, request):
    connection.sendall(process_outgoing(request))
    response = process_incoming(connection)
    print("\033[1;33mResponse:\033[1;32m {}\033[0;0m\n".format(response))
