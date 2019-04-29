import socket
from bitgov.proto.server import *
from bitgov.proto.client import *

HOST = "0.0.0.0"
PORT = 4242
IPv4 = socket.AF_INET
TCP = socket.SOCK_STREAM

def connect():
    start_server(HOST, PORT, IPv4, TCP)

def broadcast(message):
    client_send(HOST, PORT, IPv4, TCP, message)

connect()

message = "BitGov!"
broadcast(message)
