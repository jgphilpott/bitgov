from socket import AF_INET, SOCK_STREAM
from bitgov.protocol import server_config, client_broadcast
from bitgov.utilities import find_available_port, get_nodes

IPv4 = AF_INET
TCP = SOCK_STREAM
HOST = "127.0.0.1"

def connect():
    PORT=find_available_port(IPv4, TCP, HOST)
    print("\n\033[0;37mAttempting to connect with the \033[1;37mBitGov\033[0;37m network.\033[0;0m 📡\n")
    server = server_config(IPv4, TCP, HOST, PORT)
    get_nodes(server)

def broadcast(data=None, PORT=65535):
    client_broadcast(IPv4, TCP, HOST, PORT, data)
