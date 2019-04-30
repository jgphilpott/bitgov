import socket

def client_send(HOST, PORT, IPv, PROTOCOL, BUFF, message):

    with socket.socket(IPv, PROTOCOL) as sock:

        sock.connect((HOST, PORT))
        sock.sendall(bytes(str(message), "utf-8"))

        response = b""
        while True:
            fragment = sock.recv(BUFF)
            response += fragment
            if len(fragment) < BUFF:
                break

        print("Received:", response)
