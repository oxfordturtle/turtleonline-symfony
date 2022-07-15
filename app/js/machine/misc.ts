/** mixes two colours */
export function mixBytes (byte1: number, byte2: number, proportion1: number, proportion2: number): number {
  return Math.round(((byte1 * proportion1) + (byte2 * proportion2)) / (proportion1 + proportion2))
}

/** gets an inputcode from a KeyboardEvent.key property */
export function inputcodeFromKey (key: string): number {
  switch (key) {
    case 'Backspace':
      return 8
    case 'Tab':
      return 9
    case 'Enter':
      return 13
    case 'Shift':
      return 16
    case 'Control':
      return 17
    case 'Alt':
      return 18
    case 'Pause':
      return 19
    case 'CapsLock':
      return 20
    case 'Escape':
      return 27
    case ' ': // space
      return 32
    case 'PageUp':
      return 33
    case 'PageDown':
      return 34
    case 'End':
      return 35
    case 'Home':
      return 36
    case 'ArrowLeft':
      return 37
    case 'ArrowUp':
      return 38
    case 'ArrowRight':
      return 39
    case 'ArrowDown':
      return 40
    case 'Insert':
      return 45
    case 'Delete':
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
    case 'Meta':
      return 91
    case '*': //check
      return 106
    case '+': //check
      return 107
    case '-': //check
      return 109
    case '.': //check
      return 110
    case '/': //check
      return 111
    case 'F1':
      return 112
    case 'F2':
      return 113
    case 'F3':
      return 114
    case 'F4':
      return 115
    case 'F5':
      return 116
    case 'F6':
      return 117
    case 'F7':
      return 118
    case 'F8':
      return 119
    case 'F9':
      return 120
    case 'F10':
      return 121
    case 'F11':
      return 122
    case 'F12':
      return 123
    case 'NumLock':
      return 144
    case 'ScrollLock':
      return 145
    case ';':
      return 186
    case '=':
      return 187
    case ',':
      return 188
    //case '-':
    //  return 189
    //case '.':
    //  return 190
    //case '/':
    //  return 191
    case '\'':
      return 192
    case '[':
      return 219
    //case '/':
    //  return 220
    case ']':
      return 221
    case '#':
      return 222
    case '`':
      return 223
    default:
      return key.charCodeAt(0)
  }
}
