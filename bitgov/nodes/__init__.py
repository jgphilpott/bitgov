from os import makedirs
from os.path import exists
from bitgov.utilities import write
from bitgov.nodes.connect import get_nodes
from bitgov.nodes.utilities import nodes_path

empty_set = {None}
sparks_set = ({("159.89.112.99", 65535)},)

if not exists(nodes_path):
    makedirs(nodes_path)
    write(nodes_path, "clients", "txt", empty_set)
    write(nodes_path, "masters", "txt", empty_set)
    write(nodes_path, "sparks", "txt", sparks_set)
