/*
 * An array of machine pcodes.
 */
export default [
  // 0x00s - basic stack operations, conversion operators
  { code: 0x00, args: 0, str: 'NULL' },
  { code: 0x01, args: 0, str: 'DUPL' },
  { code: 0x02, args: 0, str: 'SWAP' },
  { code: 0x03, args: 0, str: 'ROTA' },
  { code: 0x04, args: 0, str: 'INCR' },
  { code: 0x05, args: 0, str: 'DECR' },
  { code: 0x06, args: 0, str: 'SHFT' },
  { code: 0x07, args: 0, str: 'MXIN' },
  { code: 0x08, args: 0, str: 'HSTR' },
  { code: 0x09, args: 0, str: 'CTOS' },
  { code: 0x0A, args: 0, str: 'SASC' },
  { code: 0x0B, args: 0, str: 'ITOS' },
  { code: 0x0C, args: 0, str: 'HEXS' },
  { code: 0x0D, args: 0, str: 'SVAL' },
  { code: 0x0E, args: 0, str: 'QTOS' },
  { code: 0x0F, args: 0, str: 'QVAL' },
  // 0x10s - Boolean operators, integer operators
  { code: 0x10, args: 0, str: 'NOT' },
  { code: 0x11, args: 0, str: 'AND' },
  { code: 0x12, args: 0, str: 'OR' },
  { code: 0x13, args: 0, str: 'XOR' },
  { code: 0x14, args: 0, str: 'BAND' },
  { code: 0x15, args: 0, str: 'BOR' },
  { code: 0x16, args: 0, str: 'NEG' },
  { code: 0x17, args: 0, str: 'ABS' },
  { code: 0x18, args: 0, str: 'SIGN' },
  { code: 0x19, args: 0, str: 'PLUS' },
  { code: 0x1A, args: 0, str: 'SUBT' },
  { code: 0x1B, args: 0, str: 'MULT' },
  { code: 0x1C, args: 0, str: 'DIVR' },
  { code: 0x1D, args: 0, str: 'DIV' },
  { code: 0x1E, args: 0, str: 'MOD' },
  { code: 0x1F, args: 0, str: 'RAND' },
  // 0x20s - comparison operators
  { code: 0x20, args: 0, str: 'EQAL' },
  { code: 0x21, args: 0, str: 'NOEQ' },
  { code: 0x22, args: 0, str: 'LESS' },
  { code: 0x23, args: 0, str: 'MORE' },
  { code: 0x24, args: 0, str: 'LSEQ' },
  { code: 0x25, args: 0, str: 'MREQ' },
  { code: 0x26, args: 0, str: 'MAXI' },
  { code: 0x27, args: 0, str: 'MINI' },
  { code: 0x28, args: 0, str: 'SEQL' },
  { code: 0x29, args: 0, str: 'SNEQ' },
  { code: 0x2A, args: 0, str: 'SLES' },
  { code: 0x2B, args: 0, str: 'SMOR' },
  { code: 0x2C, args: 0, str: 'SLEQ' },
  { code: 0x2D, args: 0, str: 'SMEQ' },
  { code: 0x2E, args: 0, str: 'SMAX' },
  { code: 0x2F, args: 0, str: 'SMIN' },
  // 0x30s - pseudo-real operators
  { code: 0x30, args: 0, str: 'DIVM' },
  { code: 0x31, args: 0, str: 'SQRT' },
  { code: 0x32, args: 0, str: 'HYP' },
  { code: 0x33, args: 0, str: 'ROOT' },
  { code: 0x34, args: 0, str: 'POWR' },
  { code: 0x35, args: 0, str: 'LOG' },
  { code: 0x36, args: 0, str: 'ALOG' },
  { code: 0x37, args: 0, str: 'LN' },
  { code: 0x38, args: 0, str: 'EXP' },
  { code: 0x39, args: 0, str: 'SIN' },
  { code: 0x3A, args: 0, str: 'COS' },
  { code: 0x3B, args: 0, str: 'TAN' },
  { code: 0x3C, args: 0, str: 'ASIN' },
  { code: 0x3D, args: 0, str: 'ACOS' },
  { code: 0x3E, args: 0, str: 'ATAN' },
  { code: 0x3F, args: 0, str: 'PI' },
  // 0x40s - string operators
  { code: 0x40, args: 0, str: 'SCAT' },
  { code: 0x41, args: 0, str: 'SLEN' },
  { code: 0x42, args: 0, str: 'CASE' },
  { code: 0x43, args: 0, str: 'COPY' },
  { code: 0x44, args: 0, str: 'DELS' },
  { code: 0x45, args: 0, str: 'INSS' },
  { code: 0x46, args: 0, str: 'POSS' },
  { code: 0x47, args: 0, str: 'REPL' },
  { code: 0x48, args: 0, str: 'SPAD' },
  undefined, // 0x49
  undefined, // 0x4A
  undefined, // 0x4B
  undefined, // 0x4C
  undefined, // 0x4D
  undefined, // 0x4E
  undefined, // 0x4F
  // 0x50s - turtle settings and movement
  { code: 0x50, args: 0, str: 'HOME' },
  { code: 0x51, args: 0, str: 'SETX' },
  { code: 0x52, args: 0, str: 'SETY' },
  { code: 0x53, args: 0, str: 'SETD' },
  { code: 0x54, args: 0, str: 'ANGL' },
  { code: 0x55, args: 0, str: 'THIK' },
  { code: 0x56, args: 0, str: 'COLR' },
  { code: 0x57, args: 0, str: 'PEN' },
  { code: 0x58, args: 0, str: 'TOXY' },
  { code: 0x59, args: 0, str: 'MVXY' },
  { code: 0x5A, args: 0, str: 'DRXY' },
  { code: 0x5B, args: 0, str: 'FWRD' },
  { code: 0x5C, args: 0, str: 'BACK' },
  { code: 0x5D, args: 0, str: 'LEFT' },
  { code: 0x5E, args: 0, str: 'RGHT' },
  { code: 0x5F, args: 0, str: 'TURN' },
  // 0x60s - colour operators, shapes and fills
  { code: 0x60, args: 0, str: 'BLNK' },
  { code: 0x61, args: 0, str: 'RCOL' },
  { code: 0x62, args: 0, str: 'FILL' },
  { code: 0x63, args: 0, str: 'PIXC' },
  { code: 0x64, args: 0, str: 'PIXS' },
  { code: 0x65, args: 0, str: 'RGB' },
  { code: 0x66, args: 0, str: 'MIXC' },
  { code: 0x67, args: 0, str: 'RMBR' },
  { code: 0x68, args: 0, str: 'FRGT' },
  { code: 0x69, args: 0, str: 'POLY' },
  { code: 0x6A, args: 0, str: 'PFIL' },
  { code: 0x6B, args: 0, str: 'CIRC' },
  { code: 0x6C, args: 0, str: 'BLOT' },
  { code: 0x6D, args: 0, str: 'ELPS' },
  { code: 0x6E, args: 0, str: 'EBLT' },
  { code: 0x6F, args: 0, str: 'BOX' },
  // 0x70s - loading from stack, storing from stack, pointer and array operations
  { code: 0x70, args: 1, str: 'LDIN' },
  { code: 0x71, args: 1, str: 'LDVG' },
  { code: 0x72, args: 2, str: 'LDVV' },
  { code: 0x73, args: 2, str: 'LDVR' },
  { code: 0x74, args: 1, str: 'LDAG' },
  { code: 0x75, args: 2, str: 'LDAV' },
  { code: 0x76, args: -1, str: 'LSTR' },
  { code: 0x77, args: 1, str: 'STVG' },
  { code: 0x78, args: 2, str: 'STVV' },
  { code: 0x79, args: 2, str: 'STVR' },
  { code: 0x7A, args: 0, str: 'LPTR' },
  { code: 0x7B, args: 0, str: 'SPTR' },
  { code: 0x7C, args: 0, str: 'ZPTR' },
  { code: 0x7D, args: 0, str: 'CPTR' },
  { code: 0x7E, args: 0, str: 'CSTR' },
  { code: 0x7F, args: 0, str: 'TEST' },
  // 0x80s - flow control, memory control
  { code: 0x80, args: 1, str: 'JUMP' },
  { code: 0x81, args: 1, str: 'IFNO' },
  { code: 0x82, args: 0, str: 'HALT' },
  { code: 0x83, args: 1, str: 'SUBR' },
  { code: 0x84, args: 0, str: 'RETN' },
  { code: 0x85, args: 1, str: 'PSSR' },
  { code: 0x86, args: 0, str: 'PLSR' },
  { code: 0x87, args: 0, str: 'PSRJ' },
  { code: 0x88, args: 0, str: 'PLRJ' },
  { code: 0x89, args: 0, str: 'LDMT' },
  { code: 0x8A, args: 0, str: 'STMT' },
  { code: 0x8B, args: 2, str: 'MEMC' },
  { code: 0x8C, args: 1, str: 'MEMR' },
  { code: 0x8D, args: 0, str: 'HFIX' },
  { code: 0x8E, args: 0, str: 'HCLR' },
  { code: 0x8F, args: 0, str: 'HRST' },
  // 0x90s - runtime variables, debugging
  { code: 0x90, args: 0, str: 'CANV' },
  { code: 0x91, args: 0, str: 'RESO' },
  { code: 0x92, args: 0, str: 'UDAT' },
  { code: 0x93, args: 0, str: 'SEED' },
  undefined, // 0x94
  undefined, // 0x95
  undefined, // 0x96
  undefined, // 0x97
  { code: 0x98, args: 0, str: 'TRAC' },
  { code: 0x99, args: 0, str: 'MEMW' },
  { code: 0x9A, args: 0, str: 'DUMP' },
  { code: 0x9B, args: 0, str: 'PEEK' },
  { code: 0x9C, args: 0, str: 'POKE' },
  undefined, // 0x9D
  undefined, // 0x9E
  undefined, // 0x9F
  // 0xA0s - text output, timing
  { code: 0xA0, args: 0, str: 'INPT' },
  { code: 0xA1, args: 0, str: 'ICLR' },
  { code: 0xA2, args: 0, str: 'BUFR' },
  { code: 0xA3, args: 0, str: 'READ' },
  { code: 0xA4, args: 0, str: 'RDLN' },
  { code: 0xA5, args: 0, str: 'KECH' },
  { code: 0xA6, args: 0, str: 'OUTP' },
  { code: 0xA7, args: 0, str: 'CONS' },
  { code: 0xA8, args: 0, str: 'PRNT' },
  { code: 0xA9, args: 0, str: 'WRIT' },
  { code: 0xAA, args: 0, str: 'NEWL' },
  { code: 0xAB, args: 0, str: 'CURS' },
  { code: 0xAC, args: 0, str: 'TIME' },
  { code: 0xAD, args: 0, str: 'TSET' },
  { code: 0xAE, args: 0, str: 'WAIT' },
  { code: 0xAF, args: 0, str: 'TDET' },
  // 0xB0s - file processing
  { code: 0xB0, args: 0, str: 'CHDR' },
  { code: 0xB1, args: 0, str: 'FILE' },
  { code: 0xB2, args: 0, str: 'DIRY' },
  { code: 0xB3, args: 0, str: 'OPEN' },
  { code: 0xB4, args: 0, str: 'CLOS' },
  { code: 0xB5, args: 0, str: 'FBEG' },
  { code: 0xB6, args: 0, str: 'EOF' },
  { code: 0xB7, args: 0, str: 'EOLN' },
  { code: 0xB8, args: 0, str: 'FRDS' },
  { code: 0xB9, args: 0, str: 'FRLN' },
  { code: 0xBA, args: 0, str: 'FWRS' },
  { code: 0xBB, args: 0, str: 'FWLN' },
  { code: 0xBC, args: 0, str: 'FFND' },
  { code: 0xBD, args: 0, str: 'FDIR' },
  { code: 0xBE, args: 0, str: 'FNXT' },
  { code: 0xBF, args: 0, str: 'FMOV' },
  // 0xC0s - empty
  undefined, // 0xC0
  undefined, // 0xC1
  undefined, // 0xC2
  undefined, // 0xC3
  undefined, // 0xC4
  undefined, // 0xC5
  undefined, // 0xC6
  undefined, // 0xC7
  undefined, // 0xC8
  undefined, // 0xC9
  undefined, // 0xCA
  undefined, // 0xCB
  undefined, // 0xCC
  undefined, // 0xCD
  undefined, // 0xCE
  undefined, // 0xCF
  // 0xD0s - empty
  undefined, // 0xD0
  undefined, // 0xD1
  undefined, // 0xD2
  undefined, // 0xD3
  undefined, // 0xD4
  undefined, // 0xD5
  undefined, // 0xD6
  undefined, // 0xD7
  undefined, // 0xD8
  undefined, // 0xD9
  undefined, // 0xDA
  undefined, // 0xDB
  undefined, // 0xDC
  undefined, // 0xDD
  undefined, // 0xDE
  undefined, // 0xDF
  // 0xE0s - dummy codes
  { code: 0xE0, args: -2, str: 'DOP' },
  { code: 0xE1, args: -2, str: 'FOP' },
  { code: 0xE2, args: -2, str: 'ILIN' },
  { code: 0xE3, args: -2, str: 'LEFS' },
  { code: 0xE4, args: -2, str: 'NEWT' },
  { code: 0xE5, args: -2, str: 'OLDT' },
  { code: 0xE6, args: -2, str: 'RGTS' },
  { code: 0xE7, args: -2, str: 'RNDC' },
  { code: 0xE8, args: -2, str: 'SVD0' },
  { code: 0xE9, args: -2, str: 'WRLN' },
  // 0xF0s - empty
  undefined, // 0xF0
  undefined, // 0xF1
  undefined, // 0xF2
  undefined, // 0xF3
  undefined, // 0xF4
  undefined, // 0xF5
  undefined, // 0xF6
  undefined, // 0xF7
  undefined, // 0xF8
  undefined, // 0xF9
  undefined, // 0xFA
  undefined, // 0xFB
  undefined, // 0xFC
  undefined, // 0xFD
  undefined, // 0xFE
  undefined // 0xFF
]
