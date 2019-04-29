import socket

def client_send(HOST, PORT, IPv, PROTOCOL, message):
    with socket.socket(IPv, PROTOCOL) as sock:
        sock.connect((HOST, PORT))
        sock.sendall(bytes(str(message), "utf-8"))
        data = sock.recv(1024)
        print("Received:", data)
