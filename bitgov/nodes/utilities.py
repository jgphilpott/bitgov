from os import getcwd
from ast import literal_eval
from bitgov.utilities import read

cwd = getcwd()
nodes_path = cwd + "/bitgov/node_sets"

def get_clients_set():
    return literal_eval(read(nodes_path, "clients", "txt"))

def get_masters_set():
    return literal_eval(read(nodes_path, "masters", "txt"))

def get_sparks_set():
    return literal_eval(read(nodes_path, "sparks", "txt"))[0]
