from socket import AF_INET, SOCK_STREAM
from bitgov.protocol import server_config, client_send

HOST = "0.0.0.0"
PORT = 4242
IPv4 = AF_INET
TCP = SOCK_STREAM
BUFF = 1024

def connect():
    print("\n\033[0;37mAttempting to connect with the \033[1;37mBitGov\033[0;37m network.\033[0;0m 📡\n")
    server_config(HOST, PORT, IPv4, TCP, BUFF)

def broadcast(message=None):
    client_send(HOST, PORT, IPv4, TCP, BUFF, message)
