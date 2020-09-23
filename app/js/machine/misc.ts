/**
 * Miscellaneous functions needed by the machine at runtime.
 */

/** mixes two colours */
export function mixBytes (byte1: number, byte2: number, proportion1: number, proportion2: number): number {
  return Math.round(((byte1 * proportion1) + (byte2 * proportion2)) / (proportion1 + proportion2))
}

/** gets a keycode from a KeyboardEvent.key property */
export function keycodeFromKey (key: string): number {
  switch (key.toLowerCase()) {
    case 'backspace':
      return 8
    case 'tab':
      return 9
    case 'enter':
      return 13
    case 'shift':
      return 16
    case 'control':
      return 17
    case 'alt':
      return 18
    case 'pause': // check
      return 19
    case 'capslock':
      return 20
    case 'escape':
      return 27
    case ' ': // space
      return 32
    case 'pgup': // check
      return 33
    case 'pgdn': // check
      return 34
    case 'end': // check
      return 35
    case 'home': // check
      return 36
    case 'arrowleft':
      return 37
    case 'arrowup':
      return 38
    case 'arrowright':
      return 39
    case 'arrowdown':
      return 40
    case 'insert': // check
      return 45
    case 'delete': // check
      return 46
    case '0':
      return 48
    case '1':
      return 49
    case '2':
      return 50
    case '3':
      return 51
    case '4':
      return 52
    case '5':
      return 53
    case '6':
      return 54
    case '7':
      return 55
    case '8':
      return 56
    case '9':
      return 57
    case 'a':
      return 65
    case 'b':
      return 66
    case 'c':
      return 67
    case 'd':
      return 68
    case 'e':
      return 69
    case 'f':
      return 70
    case 'g':
      return 71
    case 'h':
      return 72
    case 'i':
      return 73
    case 'j':
      return 74
    case 'k':
      return 75
    case 'l':
      return 76
    case 'm':
      return 77
    case 'n':
      return 78
    case 'o':
      return 79
    case 'p':
      return 80
    case 'q':
      return 81
    case 'r':
      return 82
    case 's':
      return 83
    case 't':
      return 84
    case 'u':
      return 85
    case 'v':
      return 86
    case 'w':
      return 87
    case 'x':
      return 88
    case 'y':
      return 89
    case 'z':
      return 90
    case 'lwin': // check
      return 91
    case 'rwin': // check
      return 92
    case '#0': //check
      return 96
    case '#1': //check
      return 97
    case '#2': //check
      return 98
    case '#3': //check
      return 99
    case '#4': //check
      return 100
    case '#5': //check
      return 101
    case '#6': //check
      return 102
    case '#7': //check
      return 103
    case '#8': //check
      return 104
    case '#9': //check
      return 105
    case 'multiply': //check
      return 106
    case 'add': //check
      return 107
    case 'subtract': //check
      return 109
    case 'decimal': //check
      return 110
    case 'divide': //check
      return 111
    case 'f1':
      return 112
    case 'f2':
      return 113
    case 'f3':
      return 114
    case 'f4':
      return 115
    case 'f5':
      return 116
    case 'f6':
      return 117
    case 'f7':
      return 118
    case 'f8':
      return 119
    case 'f9':
      return 120
    case 'f10':
      return 121
    case 'f11':
      return 122
    case 'f12':
      return 123
    case 'numlock': //check
      return 144
    case 'scrolllock': //check
      return 145
    case ';':
      return 186
    case '=':
      return 187
    case ',':
      return 188
    case '-':
      return 189
    case '.':
      return 190
    case '/':
      return 191
    case '\'':
      return 192
    case '[':
      return 219
    case '/':
      return 220
    case ']':
      return 221
    case '#':
      return 222
    case '`':
      return 223
    default:
      return 0
  }
}
