import socket
import threading
from bitgov.protocol import *

HOST = "0.0.0.0"
PORT = 4242
IPv4 = socket.AF_INET
TCP = socket.SOCK_STREAM

sparks = ("138.197.142.143",)

def connect():
    threading.Thread(target=server_start, args=(HOST, PORT, IPv4, TCP)).start()

def broadcast(message=None):
    client_send(HOST, PORT, IPv4, TCP, message)
