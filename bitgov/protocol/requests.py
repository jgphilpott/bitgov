from bitgov.nodes.utilities import get_masters_set

def get_masters(data, address):
    return {"type": "get_masters", "set": get_masters_set()}

def ip_check(data, address):
    return {"type": "ip_check", "address": address}
