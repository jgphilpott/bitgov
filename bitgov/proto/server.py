import socket

def start_server(HOST, PORT, IPv, PROTOCOL):
    with socket.socket(IPv, PROTOCOL) as sock:
        sock.bind((HOST, PORT))
        sock.listen()
        conn, addr = sock.accept()
        with conn:
            print("Connected by", addr)
            while True:
                data = conn.recv(1024)
                if not data:
                    break
                conn.sendall(data)
