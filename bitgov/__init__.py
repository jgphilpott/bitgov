from os import getcwd, makedirs
from os.path import exists

cwd = getcwd()

sparks = (("159.89.112.99", 4242), ("134.209.103.162", 4242))

def magic_touch(path, name, extension, data):
    with open(path + "/" + name + "." + extension, "w") as outfile:
        outfile.write(str(data))

if not exists(cwd + "/bitgov/ledger"):
    path = cwd + "/bitgov/ledger"
    makedirs(path)

if not exists(cwd + "/bitgov/nodes"):
    path = cwd + "/bitgov/nodes"
    makedirs(path)
    magic_touch(path, "clients", "txt", [])
    magic_touch(path, "masters", "txt", [])
    magic_touch(path, "sparks", "txt", sparks)
