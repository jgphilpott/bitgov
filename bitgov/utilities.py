def read(path, name, extension):
    with open(path + "/" + name + "." + extension, "r") as document:
        return document.read()

def write(path, name, extension, data):
    with open(path + "/" + name + "." + extension, "w") as document:
        document.write(str(data))
