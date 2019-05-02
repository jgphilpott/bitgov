import os

pwd = os.getcwd()

sparks = (("159.89.112.99", 4242), ("134.209.103.162", 4242))

def magic_touch(path, name, extension, data):
    with open(path + "/" + name + "." + extension, "w") as outfile:
        outfile.write(str(data))

if not os.path.exists(pwd + "/bitgov/nodes"):
    path = pwd + "/bitgov/nodes"
    os.makedirs(path)
    magic_touch(path, "clients", "txt", "")
    magic_touch(path, "masters", "txt", "")
    magic_touch(path, "sparks", "txt", sparks)

if not os.path.exists(pwd + "/bitgov/ledger"):
    path = pwd + "/bitgov/ledger"
    os.makedirs(path)
