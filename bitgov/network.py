from socket import AF_INET, SOCK_STREAM
from bitgov.protocol import server_config, client_broadcast
from bitgov.nodes import get_nodes

IPv4 = AF_INET
TCP = SOCK_STREAM

def connect():
    HOST = "0.0.0.0"
    PORT = 4242
    print("\n\033[0;37mAttempting to connect with the \033[1;37mBitGov\033[0;37m network.\033[0;0m 📡\n")
    server = server_config(HOST, PORT, IPv4, TCP)
    get_nodes(server)

def broadcast(data=None, HOST="0.0.0.0"):
    client_broadcast(HOST, PORT, IPv4, TCP, data)
