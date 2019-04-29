import socket

def server_start(HOST, PORT, IPv, PROTOCOL):
    with socket.socket(IPv, PROTOCOL) as sock:
        sock.bind((HOST, PORT))
        sock.listen()
        while True:
            connection, address = sock.accept()
            with connection:
                print("Connected with:", address)
                data = connection.recv(1024)
                connection.sendall(data)
