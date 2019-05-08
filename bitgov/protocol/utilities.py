def process_incoming(connection):

    connection.settimeout(12)

    data = ""
    data_length = 0
    maximum = 1048576

    fragment_count = 0
    fragment_size = 1024

    while True:

        fragment = connection.recv(fragment_size).decode("utf-8")

        if fragment_count == 0:
            if "~" in fragment:
                try:
                    split = fragment.split("~", 1)
                    data_length = int(split[0])
                    if data_length > maximum:
                        print("\033[1;31mInvalid: Declared length larger than maximum!\033[0;0m ⛔")
                        data = None
                        break
                    data += split[1]
                except:
                    print("\033[1;31mInvalid: Declared length not an integer!\033[0;0m ⛔")
                    data = None
                    break
            else:
                print("\033[1;31mInvalid: No length declared!\033[0;0m ⛔")
                data = None
                break
        else:
            data += fragment

        fragment_count += 1

        if len(data) == data_length:
            break
        elif len(data) > data_length:
            print("\033[1;31mInvalid: Data longer than declared length!\033[0;0m ⛔")
            data = None
            break
        elif len(fragment) < fragment_size:
            print("\033[1;31mInvalid: Data shorter than declared length!\033[0;0m ⛔")
            data = None
            break

    return data

def process_outgoing(data):
    return bytes(str(len(str(data))) + "~" + str(data), "utf-8")
