# Minimal local stand-in for the genlayer module, so the contract can run off-chain in tests.
# It is NOT the real SDK. Tests set gl.message.sender_address and the nondet mocks directly.
class Address:
    def __init__(self, hexstr):
        self._h = hexstr
    @property
    def as_hex(self):
        return self._h
    def __eq__(self, other):
        return isinstance(other, Address) and self._h.lower() == other._h.lower()
    def __hash__(self):
        return hash(self._h.lower())

class _TreeMap:
    def __class_getitem__(cls, item):
        return dict
TreeMap = _TreeMap

u256 = int
u32 = int

def allow_storage(c):
    return c

class _Public:
    @staticmethod
    def view(f): return f
    @staticmethod
    def write(f): return f

class _Return:
    def __init__(self, calldata):
        self.calldata = calldata

class _Vm:
    Result = object
    Return = _Return
    @staticmethod
    def run_nondet_unsafe(leader_fn, validator_fn):
        res = leader_fn()
        if not validator_fn(_Return(res)):
            raise Exception("consensus not reached")
        return res

class _Web:
    render = None

class _Nondet:
    web = _Web()
    exec_prompt = None

class _Msg:
    sender_address = Address("0x0000000000000000000000000000000000000000")

class _Gl:
    Contract = object
    public = _Public()
    vm = _Vm()
    nondet = _Nondet()
    message = _Msg()

gl = _Gl()
