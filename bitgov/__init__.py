from os import getcwd, makedirs
from os.path import exists
from bitgov.network import connect, broadcast

cwd = getcwd()
ledger_path = cwd + "/bitgov/ledger"

if not exists(ledger_path):
    makedirs(ledger_path)
