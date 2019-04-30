import socket
import multiprocessing
from bitgov.protocol import *

HOST = "0.0.0.0"
PORT = 4242
IPv4 = socket.AF_INET
TCP = socket.SOCK_STREAM
BUFF = 1024

def connect():
    print("\n\033[0;37mAttempting to connect with the \033[1;37mBitGov\033[0;37m network.\033[0;0m 📡\n")
    multiprocessing.Process(target=server_config, args=(HOST, PORT, IPv4, TCP, BUFF)).start()

def broadcast(message=None):
    client_send(HOST, PORT, IPv4, TCP, BUFF, message)
