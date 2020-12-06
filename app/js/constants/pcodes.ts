/*
 * Machine PCodes.
 */

/** record of PCodes */
export enum PCode {
  // 0x00s - basic stack operations, conversion operators
  null = 0x00,
  dupl = 0x01,
  swap = 0x02,
  rota = 0x03,
  incr = 0x04,
  decr = 0x05,
  mxin = 0x06,
  rand = 0x07,
  hstr = 0x08,
  ctos = 0x09,
  sasc = 0x0A,
  itos = 0x0B,
  hexs = 0x0C,
  sval = 0x0D,
  qtos = 0x0E,
  qval = 0x0F,
  // 0x10s - Boolean operators, integer operators
  not = 0x10,
  and = 0x11,
  or = 0x12,
  xor = 0x13,
  andl = 0x14,
  orl = 0x15,
  shft = 0x16,
  neg = 0x17,
  abs = 0x18,
  sign = 0x19,
  plus = 0x1A,
  subt = 0x1B,
  mult = 0x1C,
  divr = 0x1D,
  div = 0x1E,
  mod = 0x1F,
  // 0x20s - comparison operators
  eqal = 0x20,
  noeq = 0x21,
  less = 0x22,
  more = 0x23,
  lseq = 0x24,
  mreq = 0x25,
  maxi = 0x26,
  mini = 0x27,
  seql = 0x28,
  sneq = 0x29,
  sles = 0x2a,
  smor = 0x2b,
  sleq = 0x2c,
  smeq = 0x2d,
  smax = 0x2e,
  smin = 0x2f,
  // 0x30s - pseudo-real operators
  divm = 0x30,
  sqrt = 0x31,
  hyp = 0x32,
  root = 0x33,
  powr = 0x34,
  log = 0x35,
  alog = 0x36,
  ln = 0x37,
  exp = 0x38,
  sin = 0x39,
  cos = 0x3a,
  tan = 0x3b,
  asin = 0x3c,
  acos = 0x3d,
  atan = 0x3e,
  pi = 0x3f,
  // 0x40s - string operators
  scat = 0x40,
  slen = 0x41,
  case = 0x42,
  copy = 0x43,
  dels = 0x44,
  inss = 0x45,
  poss = 0x46,
  repl = 0x47,
  spad = 0x48,
  trim = 0x49,
  // 0x50s - turtle settings and movement
  home = 0x50,
  setx = 0x51,
  sety = 0x52,
  setd = 0x53,
  angl = 0x54,
  thik = 0x55,
  pen = 0x56,
  colr = 0x57,
  toxy = 0x58,
  mvxy = 0x59,
  drxy = 0x5a,
  fwrd = 0x5b,
  back = 0x5c,
  left = 0x5d,
  rght = 0x5e,
  turn = 0x5f,
  // 0x60s - colour operators, shapes and fills
  blnk = 0x60,
  rcol = 0x61,
  fill = 0x62,
  pixc = 0x63,
  pixs = 0x64,
  rgb = 0x65,
  mixc = 0x66,
  rmbr = 0x67,
  frgt = 0x68,
  poly = 0x69,
  pfil = 0x6a,
  circ = 0x6b,
  blot = 0x6c,
  elps = 0x6d,
  eblt = 0x6e,
  box = 0x6f,
  // 0x70s - loading from stack, storing from stack, pointer and array operations
  ldin = 0x70,
  ldvg = 0x71,
  ldvv = 0x72,
  ldvr = 0x73,
  ldag = 0x74,
  ldav = 0x75,
  lstr = 0x76,
  stvg = 0x77,
  stvv = 0x78,
  stvr = 0x79,
  lptr = 0x7a,
  sptr = 0x7b,
  zptr = 0x7c,
  cptr = 0x7d,
  cstr = 0x7e,
  test = 0x7f,
  // 0x80s - flow control, memory control
  jump = 0x80,
  ifno = 0x81,
  halt = 0x82,
  subr = 0x83,
  retn = 0x84,
  pssr = 0x85,
  plsr = 0x86,
  psrj = 0x87,
  plrj = 0x88,
  ldmt = 0x89,
  stmt = 0x8a,
  memc = 0x8b,
  memr = 0x8c,
  hfix = 0x8d,
  hclr = 0x8e,
  hrst = 0x8f,
  // 0x90s - runtime variables, debugging
  canv = 0x90,
  reso = 0x91,
  udat = 0x92,
  seed = 0x93,
  trac = 0x98,
  memw = 0x99,
  dump = 0x9a,
  peek = 0x9b,
  poke = 0x9c,
  // 0xa0s - text output, timing
  inpt = 0xa0,
  iclr = 0xa1,
  bufr = 0xa2,
  read = 0xa3,
  rdln = 0xa4,
  kech = 0xa5,
  outp = 0xa6,
  cons = 0xa7,
  prnt = 0xa8,
  writ = 0xa9,
  newl = 0xaa,
  curs = 0xab,
  time = 0xac,
  tset = 0xad,
  wait = 0xae,
  tdet = 0xaf,
  // 0xb0s - file processing
  chdr = 0xb0,
  file = 0xb1,
  diry = 0xb2,
  open = 0xb3,
  clos = 0xb4,
  fbeg = 0xb5,
  eof = 0xb6,
  eoln = 0xb7,
  frds = 0xb8,
  frln = 0xb9,
  fwrs = 0xba,
  fwln = 0xbb,
  ffnd = 0xbc,
  fdir = 0xbd,
  fnxt = 0xbe,
  fmov = 0xbf,
  // 0xe0s - dummy codes
  dopr = 0xe0,
  fopr = 0xe1,
  ilin = 0xe2,
  lefs = 0xe3,
  newt = 0xe4,
  oldt = 0xe5,
  rgts = 0xe6,
  rndc = 0xe7,
  svd0 = 0xe8,
  wrln = 0xe9
}

/** returns the number of code arguments of the given PCode (used by the assembler) */
export function pcodeArgs (pcode: PCode): number {
  switch (pcode) {
    case PCode.lstr:
      return -1 // varies; the next code specifies how many

    case PCode.ldin: // fallthrough
    case PCode.ldvg: // fallthrough
    case PCode.ldag: // fallthrough
    case PCode.stvg: // fallthrough
    case PCode.jump: // fallthrough
    case PCode.ifno: // fallthrough
    case PCode.subr: // fallthrough
    case PCode.pssr: // fallthrough
    case PCode.memr:
      return 1

    case PCode.ldvv: // fallthrough
    case PCode.ldvr: // fallthrough
    case PCode.ldav: // fallthrough
    case PCode.stvv: // fallthrough
    case PCode.stvr: // fallthrough
    case PCode.memc:
      return 2

    default:
      return 0
  }
}
