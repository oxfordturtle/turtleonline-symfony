// type imports
import type { Options } from './options'
import type { Turtle } from './turtle'

// module imports
import * as memory from './memory'
import { defaultOptions } from './options'
import { mixBytes } from './misc'
import { colours } from '../constants/colours'
import { PCode } from '../constants/pcodes'
import { MachineError } from '../tools/error'
import { send } from '../tools/hub'
import hex from '../tools/hex'

// machine variables
let canvas: HTMLCanvasElement = document.createElement('canvas')
let context: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D
let running: boolean = false
let paused: boolean = false
let pcode: number[][] = []
let line: number = 0
let code: number = 0
let options: Options = defaultOptions

// the virtual canvas
let startx: number = 0
let starty: number = 0
let sizex: number = 1000
let sizey: number = 1000
let width: number = 1000
let height: number = 1000
let doubled: boolean = false

let detectInputcode: number = 0
let detectTimeoutID: number = 0
let readlineTimeoutID: number = 0

// runtime variables
let startTime: number = 0
let update: boolean = false
let keyecho: boolean = false
let seed: number = 0

/** sets the canvas and context */
export function setCanvasAndContext (can: HTMLCanvasElement, con: CanvasRenderingContext2D): void {
  canvas = can
  context = con
}

/** resets the machine */
export function reset (): void {
  // reset the virtual canvas
  startx = 0
  starty = 0
  sizex = 1000
  sizey = 1000
  width = 1000
  height = 1000
  doubled = false
  // send reset machine components signals
  send('resolution', { width: 1000, height: 1000 })
  send('console', { clear: true, colour: '#FFFFFF' })
  send('output', { clear: true, colour: '#FFFFFF' })
  send('turtxChanged', 500)
  send('turtyChanged', 500)
  send('turtdChanged', 0)
  send('turtaChanged', 360)
  send('turttChanged', 2)
  send('turtcChanged', '#000')
  send('canvas', { startx: 0, starty: 0, sizex: 1000, sizey: 1000 })
}

/** runs a program with the given pcode and options */
export function run (p: number[][], o: Options): void {
  // reset the machine
  reset()
  // save pcode and options for program execution
  pcode = p
  options = o
  // set line and code indexes to zero
  line = 0
  code = 0
  // optionally show the canvas
  if (options.showCanvasOnRun) {
    send('selectTab', 'canvas')
  }
  // setup machine memory
  memory.init(options)
  // setup runtime variables
  startTime = Date.now()
  update = true
  keyecho = true
  seed = Date.now()
  // setup the machine status
  running = true
  paused = false
  // add event listeners
  window.addEventListener('keydown', storeKey)
  window.addEventListener('keyup', releaseKey)
  window.addEventListener('keypress', putInBuffer)
  canvas.addEventListener('contextmenu', preventDefault)
  canvas.addEventListener('mousemove', storeMouseXY)
  canvas.addEventListener('touchmove', preventDefault)
  canvas.addEventListener('touchmove', storeMouseXY)
  canvas.addEventListener('mousedown', preventDefault)
  canvas.addEventListener('mousedown', storeClickXY)
  canvas.addEventListener('touchstart', storeClickXY)
  canvas.addEventListener('mouseup', releaseClickXY)
  canvas.addEventListener('touchend', releaseClickXY)
  // send the started signal (via the main state module)
  send('played')
  // execute the first block of code (which will in turn trigger execution of the next block)
  execute()
}

/** halts execution of the current program */
export function halt (): void {
  if (running) {
    // remove event listeners
    window.removeEventListener('keydown', storeKey)
    window.removeEventListener('keyup', releaseKey)
    window.removeEventListener('keypress', putInBuffer)
    window.removeEventListener('keyup', detect)
    window.removeEventListener('mouseup', detect)
    window.removeEventListener('keyup',readline)
    canvas.removeEventListener('contextmenu', preventDefault)
    canvas.removeEventListener('mousemove', storeMouseXY)
    canvas.removeEventListener('touchmove', preventDefault)
    canvas.removeEventListener('touchmove', storeMouseXY)
    canvas.removeEventListener('mousedown', preventDefault)
    canvas.removeEventListener('mousedown', storeClickXY)
    canvas.removeEventListener('touchstart', storeClickXY)
    canvas.removeEventListener('mouseup', releaseClickXY)
    canvas.removeEventListener('touchend', releaseClickXY)
    // reset the canvas cursor
    send('cursor', 1)
    // reset the machine status
    running = false
    paused = false
    // send the stopped signal (via the main state module)
    send('halted')
  }
}

/** gets whether the machine is running */
export function isRunning (): boolean {
  return running
}

/** gets whether the machine is paused */
export function isPaused (): boolean {
  return paused
}

/** pauses execution of the current program */
export function pause (): void {
  paused = true
  send('paused')
}

/** plays (unpauses) execution of the current program */
export function play (): void {
  paused = false
  send('unpaused')
}

/** executes a block of pcode */
function execute (): void {
  // don't do anything if we're not running
  if (!running) {
    return
  }

  // try again in 1 millisecond if the machine is paused
  if (paused) {
    setTimeout(execute, 1)
    return
  }

  // in case of detect or readline, remove the event listeners the first time we carry on with the
  // program execution after they have been called
  window.removeEventListener('keyup', detect)
  window.removeEventListener('mouseup', detect)
  window.removeEventListener('keyup', readline)

  // execute any delayed heap clear calls
  memory.delayedHeapClear()

  // execute as much code as possible
  let drawCount: number = 0
  let codeCount: number = 0
  let n1: number|undefined
  let n2: number|undefined
  let n3: number|undefined
  let n4: number|undefined
  let bool1: boolean
  let bool2 : boolean
  let s1: string
  let s2: string
  let s3: string
  let image: ImageData
  let r: number
  let g: number
  let b: number
  try {
    while (drawCount < options.drawCountMax && (codeCount <= options.codeCountMax)) {
      switch (pcode[line][code]) {
        // 0x0 - basic stack operations, conversion operators
        case PCode.null:
          break

        case PCode.dupl:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.stack.push(n1, n1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          } 
          break

        case PCode.swap:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n2, n1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.rota:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            memory.stack.push(n2, n3, n1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.incr:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.stack.push(n1 + 1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.decr:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.stack.push(n1 - 1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.mxin:
          memory.stack.push(Math.pow(2, 31) - 1)
          break

        case PCode.rand:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            n2 = Math.sin(seed++) * 10000
            n2 = n2 - Math.floor(n2)
            memory.stack.push(Math.floor(n2 * Math.abs(n1)))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.hstr:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            s1 = memory.getHeapString(n1)
            memory.makeHeapString(s1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.ctos:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.makeHeapString(String.fromCharCode(n1))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.sasc:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            s1 = memory.getHeapString(n1)
            if (s1.length === 0) {
              memory.stack.push(0)
            } else {
              memory.stack.push(s1.charCodeAt(0))
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.itos:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.makeHeapString(n1.toString(10))
          }  else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.hexs:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s1 = n1.toString(16).toUpperCase()
            while (s1.length < n2) {
              s1 = '0' + s1
            }
            memory.makeHeapString(s1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.sval:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s1 = memory.getHeapString(n1)
            if (s1[0] === '#') {
              n3 = isNaN(parseInt(s1.slice(1), 16)) ? n2 : parseInt(s1.slice(1), 16)
            } else {
              n3 = isNaN(parseInt(s1, 10)) ? n2 : parseInt(s1, 10)
            }
            memory.stack.push(n3)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.qtos:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            n1 = (n2 / n3)
            memory.makeHeapString(n1.toFixed(n4))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.qval:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            s1 = memory.getHeapString(n1)
            n4 = isNaN(parseFloat(s1)) ? n3 : parseFloat(s1)
            memory.stack.push(Math.round(n4 * n2))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        // 0x10s - Boolean operators, integer operators
        case PCode.not:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.stack.push(~n1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.and:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 & n2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.or:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 | n2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.xor:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 ^ n2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.andl:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 && n2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.orl:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 || n2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.shft:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            if (n2 < 0) {
              memory.stack.push(n1 << -n2)
            } else {
              memory.stack.push(n1 >> n2)
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.neg:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.stack.push(-n1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.abs:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.stack.push(Math.abs(n1))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.sign:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.stack.push(Math.sign(n1))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.plus:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 + n2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.subt:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 - n2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.mult:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 * n2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.divr:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            if (n2 === 0) {
              throw new MachineError('Cannot divide by zero.')
            }
            n3 = n1 / n2
            memory.stack.push(Math.round(n3))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.div:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            if (n2 === 0) {
              throw new MachineError('Cannot divide by zero.')
            }
            n3 = n1 / n2
            memory.stack.push((n3 > 0) ? Math.floor(n3) : Math.ceil(n3))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.mod:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 % n2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        // 0x20s - comparison operators
        case PCode.eqal:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 === n2 ? -1 : 0)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.noeq:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 !== n2 ? -1 : 0)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.less:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 < n2 ? -1 : 0)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.more:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 > n2 ? -1 : 0)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.lseq:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 <= n2 ? -1 : 0)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.mreq:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(n1 >= n2 ? -1 : 0)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.maxi:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(Math.max(n1, n2))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.mini:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(Math.min(n1, n2))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.seql:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s2 = memory.getHeapString(n2)
            s1 = memory.getHeapString(n1)
            memory.stack.push(s1 === s2 ? -1 : 0)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.sneq:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s2 = memory.getHeapString(n2)
            s1 = memory.getHeapString(n1)
            memory.stack.push(s1 !== s2 ? -1 : 0)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.sles:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s2 = memory.getHeapString(n1)
            s1 = memory.getHeapString(n2)
            memory.stack.push(n1 < n2 ? -1 : 0)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.smor:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s2 = memory.getHeapString(n2)
            s1 = memory.getHeapString(n1)
            memory.stack.push(n1 > n2 ? -1 : 0)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.sleq:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s2 = memory.getHeapString(n2)
            s1 = memory.getHeapString(n1)
            memory.stack.push(s1 <= s2 ? -1 : 0)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.smeq:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s2 = memory.getHeapString(n2)
            s1 = memory.getHeapString(n1)
            memory.stack.push(s1 >= s2 ? -1 : 0)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.smax:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s2 = memory.getHeapString(n2)
            s1 = memory.getHeapString(n1)
            memory.makeHeapString(s2 > s1 ? s2 : s1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.smin:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s2 = memory.getHeapString(n2)
            s1 = memory.getHeapString(n1)
            memory.makeHeapString(s2 < s1 ? s2 : s1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        // 0x30s - pseudo-real operators
        case PCode.divm:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            memory.stack.push(Math.round((n1 / n2) * n3))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.sqrt:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(Math.round(Math.sqrt(n1) * n2))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.hyp:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            memory.stack.push(Math.round(Math.sqrt((n1 * n1) + (n2 * n2)) * n3))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.root:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            memory.stack.push(Math.round(Math.pow(n1 / n2, 1 / n3) * n4))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.powr:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            memory.stack.push(Math.round(Math.pow(n1 / n2, n3) * n4))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.log:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            memory.stack.push(Math.round((Math.log(n1 / n2) / Math.LN10) * n3))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.alog:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            memory.stack.push(Math.round(Math.pow(10, n1 / n2) * n3))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.ln:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            memory.stack.push(Math.round(Math.log(n1 / n2) * n3))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.exp:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            memory.stack.push(Math.round(Math.exp(n1 / n2) * n3))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.sin:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            n1 = (n2 / n3) * (2 * Math.PI) / memory.getTurtA()
            memory.stack.push(Math.round(Math.sin(n1) * n4))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.cos:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            n1 = (n2 / n3) * (2 * Math.PI) / memory.getTurtA()
            memory.stack.push(Math.round(Math.cos(n1) * n4))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.tan:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            n1 = (n2 / n3) * (2 * Math.PI) / memory.getTurtA()
            memory.stack.push(Math.round(Math.tan(n1) * n4))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.asin:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            n1 = memory.getTurtA() / (2 * Math.PI)
            memory.stack.push(Math.round(Math.asin(n2 / n3) * n4 * n1))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.acos:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            n1 = memory.getTurtA() / (2 * Math.PI)
            memory.stack.push(Math.round(Math.acos(n2 / n3) * n4 * n1))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.atan:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            n1 = memory.getTurtA() / (2 * Math.PI)
            memory.stack.push(Math.round(Math.atan2(n2, n3) * n4 * n1))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.pi:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.stack.push(Math.round(Math.PI * n1))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        // 0x40s - string operators
        case PCode.scat:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s2 = memory.getHeapString(n2)
            s1 = memory.getHeapString(n1)
            memory.makeHeapString(s1 + s2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.slen:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.stack.push(memory.main[n1])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.case:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s1 = memory.getHeapString(n1)
            switch (n2) {
              case 1:
                // lowercase
                memory.makeHeapString(s1.toLowerCase())
                break
              case 2:
                // uppercase
                memory.makeHeapString(s1.toUpperCase())
                break
              case 3:
                // capitalise first letter
                if (s1.length > 0) {
                  memory.makeHeapString(s1[0].toUpperCase() + s1.slice(1))
                } else {
                  memory.makeHeapString(s1)
                }
                break
              case 4:
                // capitalise first letter of each word (and make the rest lowercase)
                s1 = s1.split(' ').map(x => x[0].toUpperCase() + x.slice(1).toLowerCase()).join(' ')
                memory.makeHeapString(s1)
                break
              case 5:
                // swap case
                s1 = s1.split('').map(x => (x === x.toLowerCase()) ? x.toUpperCase() : x.toLowerCase()).join('')
                memory.makeHeapString(s1)
                break
              default:
                // this should be impossible
                memory.makeHeapString(s1)
                break
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.copy:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            s1 = memory.getHeapString(n1)
            memory.makeHeapString(s1.substr(n2 - 1, n3))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.dels:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          if (n2 !== undefined && n3 !== undefined && n4 !==undefined) {
            s2 = memory.getHeapString(n2)
            s1 = s2.substr(0, n3 - 1) + s2.substr((n3 - 1) + n4)
            memory.makeHeapString(s1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.inss:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            s3 = memory.getHeapString(n3)
            s2 = memory.getHeapString(n2)
            s1 = s3.substr(0, n4 - 1) + s2 + s3.substr(n4 - 1)
            memory.makeHeapString(s1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.poss:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            s2 = memory.getHeapString(n2)
            s1 = memory.getHeapString(n1)
            memory.stack.push(s2.indexOf(s1) + 1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.repl:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            s3 = memory.getHeapString(n3)
            s2 = memory.getHeapString(n2)
            s1 = memory.getHeapString(n1)
            if (n4 > 0) {
              while (n4 > 0) {
                s1 = s1.replace(s2, s3)
                n4 = n4 - 1
              }
              memory.makeHeapString(s1)
            } else {
              memory.makeHeapString(s1.replace(new RegExp(s2, 'g'), s3))
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.spad:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            s2 = memory.getHeapString(n2)
            s1 = memory.getHeapString(n1)
            while ((s1.length + s2.length) <= Math.abs(n3)) {
              if (n3 < 0) {
                s1 = s1 + s2
              } else {
                s1 = s2 + s1
              }
            }
            memory.makeHeapString(s1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.trim:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            s1 = memory.getHeapString(n1)
            memory.makeHeapString(s1.trim())
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        // 0x50s - turtle settings and movement
        case PCode.home:
          n1 = startx + (sizex / 2)
          n2 = starty + (sizey / 2)
          memory.setTurtX(Math.round(n1))
          memory.setTurtY(Math.round(n2))
          memory.setTurtD(0)
          send('turtxChanged', memory.getTurtX())
          send('turtyChanged', memory.getTurtY())
          send('turtdChanged', memory.getTurtD())
          memory.coords.push([memory.getTurtX(), memory.getTurtY()])
          break

        case PCode.setx:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.setTurtX(n1)
            send('turtxChanged', n1)
            memory.coords.push([memory.getTurtX(), memory.getTurtY()])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.sety:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.setTurtY(n1)
            send('turtyChanged', n1)
            memory.coords.push([memory.getTurtX(), memory.getTurtY()])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.setd:
          n2 = memory.stack.pop()
          if (n2 !== undefined) {
            n1 = n2 % memory.getTurtA()
            memory.setTurtD(n1)
            send('turtdChanged', n1)
          }
          break

        case PCode.angl:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            if (memory.getTurtA() === 0) {
              // this should only happen at the start of the program before angles is set for the first time
              memory.setTurtA(n1)
            }
            if (n1 === 0) {
              // never let angles be set to zero
              throw new MachineError('Angles cannot be set to zero.')
            }
            n2 = Math.round(n1 + memory.getTurtD() * n1 / memory.getTurtA())
            memory.setTurtD(n2 % n1)
            memory.setTurtA(n1)
            send('turtdChanged', n2 % n1)
            send('turtaChanged', n1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.thik:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            n2 = Math.abs(n1)
            bool1 = n1 < 0
            bool2 = memory.getTurtT() < 0
            if (bool1) { // reverse pen status
              memory.setTurtT(bool2 ? n2 : -n2)
            } else { // leave pen status as it is
              memory.setTurtT(bool2 ? -n2 : n2)
            }
            send('turttChanged', memory.getTurtT())
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.colr:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.setTurtC(n1)
            send('turtcChanged', hex(n1))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.pen:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            bool1 = (n1 !== 0) // pen up or down
            n2 = Math.abs(memory.getTurtT()) // current thickness
            n3 = bool1 ? n2 : -n2 // positive or negative depending on whether pen is down or up
            memory.setTurtT(n3)
            send('turttChanged', n3)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.toxy:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.setTurtX(n1)
            memory.setTurtY(n2)
            send('turtxChanged', n1)
            send('turtyChanged', n2)
            memory.coords.push([n1, n2])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.mvxy:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            n2 += memory.getTurtY()
            n1 += memory.getTurtX()
            memory.setTurtX(n1)
            memory.setTurtY(n2)
            send('turtxChanged', n1)
            send('turtyChanged', n2)
            memory.coords.push([n1, n2])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.drxy:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            n2 += memory.getTurtY()
            n1 += memory.getTurtX()
            if (memory.getTurtT() > 0) {
              send('line', { turtle: turtle(), x: turtx(n1), y: turty(n2) })
              if (update) {
                drawCount += 1
              }
            }
            memory.setTurtX(n1)
            memory.setTurtY(n2)
            send('turtxChanged', n1)
            send('turtyChanged', n2)
            memory.coords.push([n1, n2])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.fwrd:
          n3 = memory.stack.pop() // distance
          if (n3 !== undefined) {
            n4 = memory.getTurtD() // turtle direction
            // work out final y coordinate
            n2 = Math.cos(n4 * Math.PI / (memory.getTurtA() / 2))
            n2 = -Math.round(n2 * n3)
            n2 += memory.getTurtY()
            // work out final x coordinate
            n1 = Math.sin(n4 * Math.PI / (memory.getTurtA() / 2))
            n1 = Math.round(n1 * n3)
            n1 += memory.getTurtX()
            if (memory.getTurtT() > 0) {
              send('line', { turtle: turtle(), x: turtx(n1), y: turty(n2) })
              if (update) {
                drawCount += 1
              }
            }
            memory.setTurtX(n1)
            memory.setTurtY(n2)
            send('turtxChanged', n1)
            send('turtyChanged', n2)
            memory.coords.push([n1, n2])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.back:
          n3 = memory.stack.pop() // distance
          if (n3 !== undefined) {
            n4 = memory.getTurtD() // turtle direction
            // work out final y coordinate
            n2 = Math.cos(n4 * Math.PI / (memory.getTurtA() / 2))
            n2 = Math.round(n2 * n3)
            n2 += memory.getTurtY()
            // work out final x coordinate
            n1 = Math.sin(n4 * Math.PI / (memory.getTurtA() / 2))
            n1 = -Math.round(n1 * n3)
            n1 += memory.getTurtX()
            if (memory.getTurtT() > 0) {
              send('line', { turtle: turtle(), x: turtx(n1), y: turty(n2) })
              if (update) {
                drawCount += 1
              }
            }
            memory.setTurtX(n1)
            memory.setTurtY(n2)
            send('turtxChanged', n1)
            send('turtyChanged', n2)
            memory.coords.push([n1, n2])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.left:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            n2 = (memory.getTurtD() - n1) % memory.getTurtA()
            memory.setTurtD(n2)
            send('turtdChanged', n2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.rght:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            n2 = (memory.getTurtD() + n1) % memory.getTurtA()
            memory.setTurtD(n2)
            send('turtdChanged', n2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.turn:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            if (Math.abs(n2) >= Math.abs(n1)) {
              n3 = Math.atan(-n1 / n2)
              if (n2 > 0) {
                n3 += Math.PI
              } else if (n1 < 0) {
                n3 += 2
                n3 *= Math.PI
              }
            } else {
              n3 = Math.atan(n2 / n1)
              if (n1 > 0) {
                n3 += Math.PI
              } else {
                n3 += 3
                n3 *= Math.PI
              }
              n3 /= 2
            }
            n3 = Math.round(n3 * memory.getTurtA() / Math.PI / 2) % memory.getTurtA()
            memory.setTurtD(n3)
            send('turtdChanged', n1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        // 0x60s - colour operators, shapes and fills
        case PCode.blnk:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            send('blank', hex(n1))
            if (update) {
              drawCount += 1
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.rcol:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            send('flood', { x: turtx(n1), y: turty(n2), c1: n3, c2: 0, boundary: false })
            if (update) {
              drawCount += 1
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.fill:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            send('flood', { x: turtx(n1), y: turty(n2), c1: n3, c2: n4, boundary: true })
            if (update) {
              drawCount += 1
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.pixc:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          if (n2 !== undefined && n3 !== undefined) {
            image = context.getImageData(turtx(n2), turty(n3), 1, 1)
            memory.stack.push((image.data[0] * 65536) + (image.data[1] * 256) + image.data[2])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.pixs:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            send('pixset', { x: turtx(n1), y: turty(n2), c: n3, doubled: doubled })
            if (update) {
              drawCount += 1
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.rgb:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            n1 = n1 % 50
            if (n1 <= 0) {
              n1 += 50
            }
            n1 = colours[n1 - 1].value
            memory.stack.push(n1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.mixc:
          n4 = memory.stack.pop() // second proportion
          n3 = memory.stack.pop() // first proportion
          n2 = memory.stack.pop() // second colour
          n1 = memory.stack.pop() // first colour
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            r = mixBytes(Math.floor(n1 / 0x10000), Math.floor(n2 / 0x10000), n3, n4) // red byte
            g = mixBytes(Math.floor((n1 & 0xFF00) / 0x100), Math.floor((n2 & 0xFF00) / 0x100), n3, n4) // green byte
            b = mixBytes(n1 & 0xFF, n2 & 0xFF, n3, n4) // blue byte
            memory.stack.push((r * 0x10000) + (g * 0x100) + b)
          }
          break

        case PCode.rmbr:
          memory.coords.push([memory.getTurtX(), memory.getTurtY()])
          break

        case PCode.frgt:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.coords.length -= n1
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.poly:
          n3 = memory.stack.pop()
          if (n3 !== undefined) {
            n2 = memory.coords.length
            n1 = (n3 > n2) ? 0 : n2 - n3
            send('poly', { turtle: turtle(), coords: memory.coords.slice(n1, n2).map(vcoords), fill: false })
            if (update) {
              drawCount += 1
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.pfil:
          n3 = memory.stack.pop()
          if (n3 !== undefined) {
            n2 = memory.coords.length
            n1 = (n3 > n2) ? 0 : n2 - n3
            send('poly', { turtle: turtle(), coords: memory.coords.slice(n1, n2).map(vcoords), fill: true })
            if (update) {
              drawCount += 1
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.circ:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            send('arc', { turtle: turtle(), x: turtx(n1 + startx), y: turty(n1 + starty), fill: false })
            if (update) {
              drawCount += 1
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.blot:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            send('arc', { turtle: turtle(), x: turtx(n1 + startx), y: turty(n1 + starty), fill: true })
            if (update) {
              drawCount += 1
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.elps:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            send('arc', { turtle: turtle(), x: turtx(n1 + startx), y: turty(n2 + starty), fill: false })
            if (update) {
              drawCount += 1
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.eblt:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            send('arc', { turtle: turtle(), x: turtx(n1 + startx), y: turty(n2 + starty), fill: true })
            if (update) {
              drawCount += 1
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.box:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            bool1 = (n4 !== 0)
            n2 += memory.getTurtY()
            n1 += memory.getTurtX()
            send('box', { turtle: turtle(), x: turtx(n1), y: turty(n2), fill: hex(n3), border: bool1 })
            if (update) {
              drawCount += 1
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        // 0x70s - loading from stack, storing from stack, pointer and array operations
        case PCode.ldin:
          n1 = pcode[line][code + 1]
          memory.stack.push(n1)
          code += 1
          break

        case PCode.ldvg:
          n1 = pcode[line][code + 1]
          memory.stack.push(memory.peek(n1))
          code += 1
          break

        case PCode.ldvv:
          n1 = pcode[line][code + 1]
          n2 = pcode[line][code + 2]
          memory.stack.push(memory.main[memory.main[n1] + n2])
          code += 2
          break

        case PCode.ldvr:
          n1 = pcode[line][code + 1]
          n2 = pcode[line][code + 2]
          memory.stack.push(memory.main[memory.main[memory.main[n1] + n2]])
          code += 2
          break

        case PCode.ldag:
          n1 = pcode[line][code + 1]
          memory.stack.push(n1)
          code += 1
          break

        case PCode.ldav:
          n1 = pcode[line][code + 1]
          n2 = pcode[line][code + 2]
          memory.stack.push(memory.main[n1] + n2)
          code += 2
          break

        case PCode.lstr:
          code += 1
          n1 = pcode[line][code] // length of the string
          n2 = code + n1 // end of the string
          s1 = ''
          while (code < n2) {
            code += 1
            s1 += String.fromCharCode(pcode[line][code])
          }
          memory.makeHeapString(s1)
          break

        case PCode.stvg:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.main[pcode[line][code + 1]] = n1
            code += 1
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.stvv:
          n1 = pcode[line][code + 1]
          n2 = pcode[line][code + 2]
          n3 = memory.stack.pop()
          if (n3 !== undefined) {
            memory.main[memory.main[n1] + n2] = n3
            code += 2
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.stvr:
          n1 = pcode[line][code + 1]
          n2 = pcode[line][code + 2]
          n3 = memory.stack.pop()
          if (n3 !== undefined) {
            memory.main[memory.main[memory.main[n1] + n2]] = n3
            code += 2
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.lptr:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.stack.push(memory.main[n1])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.sptr:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.main[n2] = n1
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.zptr:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.zero(n1, n2)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.cptr:
          n3 = memory.stack.pop() // length
          n2 = memory.stack.pop() // target
          n1 = memory.stack.pop() // source
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            memory.copy(n1, n2, n3)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.cstr:
          n2 = memory.stack.pop() // target
          n1 = memory.stack.pop() // source
          if (n1 !== undefined && n2 !== undefined) {
            n4 = memory.main[n2 - 1] // maximum length of target
            n3 = memory.main[n1] // length of source
            memory.copy(n1, n2, Math.min(n3, n4) + 1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.test:
          n2 = memory.stack[memory.stack.length - 1] // leave the stack unchanged
          n1 = memory.stack[memory.stack.length - 2]
          if (n1 !== undefined && n2 !== undefined) {
            if ((n1 < 0) || (n1 > memory.main[n2])) {
              // TODO: make range check a runtime option
              throw new MachineError(`Array index out of range (${line}, ${code}).`)
            }
          }
          break

        // 0x80s - flow control, memory control
        case PCode.jump:
          line = pcode[line][code + 1] - 1
          code = -1
          break

        case PCode.ifno:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            if (n1 === 0) {
              line = pcode[line][code + 1] - 1
              code = -1
            } else {
              code += 1
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.halt:
          halt()
          return

        case PCode.subr:
          if (memory.getHeapGlobal() === -1) {
            memory.setHeapGlobal(memory.getHeapPerm())
          }
          memory.returnStack.push(line + 1)
          line = pcode[line][code + 1] - 1
          code = -1
          break

        case PCode.retn:
          n1 = memory.returnStack.pop()
          if (n1 !== undefined) {
            line = n1
            code = -1
          } else {
            throw new MachineError('RETN called on empty return stack.')
          }
          break

        case PCode.pssr:
          memory.subroutineStack.push(pcode[line][code + 1])
          code += 1
          break

        case PCode.plsr:
          memory.subroutineStack.pop()
          break

        case PCode.psrj:
          memory.stack.push(line + 1)
          break

        case PCode.plrj:
          memory.returnStack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            line = n1 - 1
            code = -1
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.ldmt:
          memory.stack.push(memory.memoryStack.length - 1)
          break

        case PCode.stmt:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.memoryStack.push(n1)
            memory.setStackTop(n1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.memc:
          n1 = pcode[line][code + 1]
          n2 = pcode[line][code + 2]
          n3 = memory.memoryStack.pop()
          if (n3 !== undefined) {
            // heap overflow check
            if (n3 + n2 > options.stackSize) {
              throw new MachineError('Memory stack has overflowed into memory heap. Probable cause is unterminated recursion.')
            }
            memory.memoryStack.push(memory.main[n1])
            memory.setStackTop(memory.main[n1])
            memory.main[n1] = n3
            memory.memoryStack.push(n3 + n2)
            memory.setStackTop(n3 + n2)
            code += 2
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.memr:
          memory.memoryStack.pop()
          n1 = pcode[line][code + 1]
          n2 = memory.memoryStack.pop()
          if (n2 !== undefined) {
            memory.memoryStack.push(memory.main[n1])
            memory.setStackTop(memory.main[n1])
            memory.main[n1] = n2
            code += 2
          } else {
            throw new MachineError('MEMR called on empty memory stack.')
          }
          break

        case PCode.hfix:
          memory.heapFix()
          break

        case PCode.hclr:
          //memory.heapClear()
          break

        case PCode.hrst:
          memory.heapReset()
          break

        // 0x90s - runtime variables, debugging
        case PCode.canv:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
            sizey = n4
            sizex = n3
            starty = n2
            startx = n1
            send('canvas', {
              startx: startx,
              starty: starty,
              sizex: sizex,
              sizey: sizey,
              width: width,
              height: height,
              doubled: doubled
            })
            memory.setTurtX(Math.round(startx + (sizex / 2)))
            memory.setTurtY(Math.round(starty + (sizey / 2)))
            memory.setTurtD(0)
            send('turtxChanged', memory.getTurtX())
            send('turtyChanged', memory.getTurtY())
            send('turtdChanged', memory.getTurtD())
            memory.coords.push([memory.getTurtX(), memory.getTurtY()])
            drawCount = options.drawCountMax // force update
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.reso:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            if (Math.min(n1, n2) <= options.smallSize) {
              n1 *= 2
              n2 *= 2
              doubled = true
            } else {
              doubled = false
            }
            width = n1
            height = n2
            send('resolution', { width: n1, height: n2 })
            send('blank', '#FFFFFF')
            drawCount = options.drawCountMax // force update
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.udat:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            bool1 = (n1 !== 0)
            update = bool1
            if (bool1) {
              drawCount = options.drawCountMax // force update
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.seed:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            if (n1 === 0) {
              memory.stack.push(seed)
            } else {
              seed = n1
              memory.stack.push(n1)
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.trac:
          // not implemented -
          // just pop the top off the stack
          memory.stack.pop()
          break

        case PCode.memw:
          // not implemented -
          // just pop the top off the stack
          memory.stack.pop()
          break

        case PCode.dump:
          send('memoryDumped', memory.dump())
          if (options.showMemoryOnDump) {
            send('selectTab', 'memory')
          }
          break

        case PCode.peek:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.stack.push(memory.main[n1])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.poke:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.main[n1] = n2
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        // 0xA0s - text output, timing
        case PCode.stat:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            if (-11 <= n1 && n1 < 0) {
              // lookup query value
              memory.stack.push(memory.query[-n1])
            } else if (0 < n1 && n1 < 256) {
              // lookup key value
              memory.stack.push(memory.keys[n1])
            } else {
              // return 0 for anything outside the range
              memory.stack.push(0)
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.iclr:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            if (-11 <= n1 && n1 < 0) {
              // reset query value
              memory.query[-n1] = -1
            } else if (n1 === 0) {
              // reset keybuffer
              memory.main[memory.main[1] + 1] = memory.main[1] + 3
              memory.main[memory.main[1] + 2] = memory.main[1] + 3
            } else if (0 < n1 && n1 < 256) {
              // reset key value
              memory.keys[n1] = -1
            } else if (n1 === 256) {
              // reset everything
              memory.keys.fill(-1)
              memory.query.fill(-1)
            } else {
              // for any value outside the range (-11, 256) we don't do anything
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.bufr:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            if (n1 > 0) {
              n2 = memory.getHeapTemp() + 3
              memory.stack.push(memory.getHeapTemp() + 1)
              memory.main[memory.getHeapTemp() + 1] = n1 + n2
              memory.main[memory.getHeapTemp() + 2] = n2 + 1
              memory.main[memory.getHeapTemp() + 3] = n2 + 1
              memory.main.fill(0, n2 + 1, n2 + n1)
              memory.setHeapTemp(n2 + n1)
              memory.setHeapMax(memory.getHeapTemp())
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.read:
          n1 = memory.stack.pop() // maximum number of characters to read
          n2 = memory.main[1] // the address of the buffer
          n3 = memory.main[memory.main[1]] // the address of the end of the buffer
          s1 = '' // the string read from the buffer
          r = memory.main[n2 + 1]
          g = memory.main[n2 + 2]
          if (n1 !== undefined) {
            if (n1 === 0) {
              while (r !== g) {
                s1 += String.fromCharCode(memory.main[r])
                r = (r < n3)
                  ? r + 1
                  : n3 + 3 // loop back to the start
              }
            } else {
              while (r !== g && s1.length <= n1) {
                s1 += String.fromCharCode(memory.main[r])
                if (r < n3) {
                  r += 1
                } else {
                  r = n3 + 3 // loop back to the start
                }
              }
              memory.main[n2 + 1] = r
            }
            memory.makeHeapString(s1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.rdln:
          n1 = Math.pow(2, 31) - 1 // as long as possible
          code += 1
          if (code === pcode[line].length) {
            line += 1
            code = 0
          }
          readlineTimeoutID = window.setTimeout(execute, n1)
          window.addEventListener('keyup', readline)
          return

        case PCode.kech:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            bool1 = (n1 !== 0)
            keyecho = bool1
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.outp:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            bool2 = (n3 !== 0)
            bool1 = (n1 !== 0)
            send('output', { clear: bool1, colour: hex(n2) })
            if (bool2) {
              send('selectTab', 'output')
            } else {
              send('selectTab', 'canvas')
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.cons:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          if (n2 !== undefined && n3 !== undefined) {
            bool1 = (n2 !== 0)
            send('console', { clear: bool1, colour: hex(n3) })
          }
          break

        case PCode.prnt:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
            s1 = memory.getHeapString(n1)
            send('print', { turtle: turtle(), string: s1, font: n2, size: n3 })
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.writ:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            s1 = memory.getHeapString(n1)
            send('write', s1)
            send('log', s1)
            if (options.showOutputOnWrite) {
              send('selectTab', 'output')
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.newl:
          send('write', '\n')
          send('log', '\n')
          break

        case PCode.curs:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            send('cursor', n1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.time:
          n1 = Date.now()
          n1 = n1 - startTime
          memory.stack.push(n1)
          break

        case PCode.tset:
          n1 = Date.now()
          n2 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            startTime = n1 - n2
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.wait:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            code += 1
            if (code === pcode[line].length) {
              line += 1
              code = 0
            }
            window.setTimeout(execute, n1)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          return

        case PCode.tdet:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            if (-11 <= n1 && n1 < 256) {
              memory.stack.push(0)
              code += 1
              if (code === pcode[line].length) {
                line += 1
                code = 0
              }
              detectInputcode = n1
              n3 = n2 === 0 ? Math.pow(2, 31) - 1 : n2 // 0 means "as long as possible"
              detectTimeoutID = window.setTimeout(execute, n3)
              window.addEventListener('keyup', detect)
              window.addEventListener('mouseup', detect)
            }
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          return

        // 0xB0s - file processing
        case PCode.chdr: // fallthrough
        case PCode.file: // fallthrough
        case PCode.diry: // fallthrough
        case PCode.open: // fallthrough
        case PCode.clos: // fallthrough
        case PCode.fbeg: // fallthrough
        case PCode.eof: // fallthrough
        case PCode.eoln: // fallthrough
        case PCode.frds: // fallthrough
        case PCode.frln: // fallthrough
        case PCode.fwrs: // fallthrough
        case PCode.fwln: // fallthrough
        case PCode.ffnd: // fallthrough
        case PCode.fdir: // fallthrough
        case PCode.fnxt: // fallthrough
        case PCode.fmov:
          // not yet implemented
          throw new MachineError('File processing has not yet been implemented in the online Turtle System. We are working on introducing this very soon. In the meantime, please run this program using the downloable system.')

        // anything else is an error
        default:
          console.log(line)
          console.log(code)
          throw new MachineError(`Unknown PCode 0x${pcode[line][code].toString(16)}.`)
      }
      codeCount += 1
      code += 1
      if (!pcode[line]) {
        throw new MachineError('The program has tried to jump to a line that does not exist. This is either a bug in our compiler, or in your assembled code.')
      }
      if (code === pcode[line].length) { // line wrap
        line += 1
        code = 0
      }
    }
  } catch (error) {
    halt()
    send('error', error)
  }
  // setTimeout (with no delay) instead of direct recursion means the function will return and the
  // canvas will be updated
  setTimeout(execute, 0)
}

/** stores a key press */
function storeKey (event: KeyboardEvent): void {
  // backspace
  if (event.key === 'Backspace') {
    event.preventDefault() // don't go back a page in the browser!
    const buffer = memory.main[1]
    if (buffer > 0) { // there is a keybuffer
      if (memory.main[buffer + 1] !== memory.main[buffer + 2]) { // the keybuffer has something in it
        if (memory.main[buffer + 2] === buffer + 3) {
          memory.main[buffer + 2] = memory.main[buffer] // go "back" to the end
        } else {
          memory.main[buffer + 2] -= 1 // go back one
        }
        if (keyecho) {
          send('backspace')
        }
      }
      // put buffer length in keys array
      if (memory.main[buffer + 2] >= memory.main[buffer + 1]) {
        memory.keys[0] = memory.main[buffer + 2] - memory.main[buffer + 1]
      } else {
        memory.keys[0] = memory.main[buffer + 2] - memory.main[buffer + 1] + memory.main[buffer] - buffer - 2
      }
    }
  }
  // arrow keys
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault() // don't scroll the page
  }
  // normal case
  const keycode = event.keyCode // inputcodeFromKey(event.key)
  memory.query[9] = keycode
  memory.query[10] = 128
  memory.query[11] = keycode
  if (event.shiftKey) {
    memory.query[10] += 8
  }
  if (event.altKey) {
    memory.query[10] += 16
  }
  if (event.ctrlKey) {
    memory.query[10] += 32
  }
  memory.keys[keycode] = memory.query[10]
}

/** stores that a key has been released */
function releaseKey (event: KeyboardEvent): void {
  const keycode = event.keyCode // inputcodeFromKey(event.key)
  // keyup should set positive value to negative; use Math.abs to ensure the result is negative,
  // in case two keydown events fire close together, before the first keyup event fires
  memory.query[9] = -Math.abs(memory.query[9])
  memory.query[10] = -Math.abs(memory.query[10])
  memory.keys[keycode] = -Math.abs(memory.keys[keycode])
}

/** puts a key in the keybuffer */
function putInBuffer (event: KeyboardEvent): void {
  const keycode = event.keyCode // inputcodeFromKey(event.key)
  const buffer = memory.main[1]
  if (buffer > 0) { // there is a keybuffer
    let next = 0
    if (memory.main[buffer + 2] === memory.main[buffer]) {
      next = buffer + 3 // loop back round to the start
    } else {
      next = memory.main[buffer + 2] + 1
    }
    if (next !== memory.main[buffer + 1]) {
      memory.main[memory.main[buffer + 2]] = keycode
      memory.main[buffer + 2] = next
      // put buffer length in keys array
      if (memory.main[buffer + 2] >= memory.main[buffer + 1]) {
        memory.keys[0] = memory.main[buffer + 2] - memory.main[buffer + 1]
      } else {
        memory.keys[0] = memory.main[buffer + 2] - memory.main[buffer + 1] + memory.main[buffer] - buffer - 2
      }
      // maybe show in the console
      if (keyecho) {
        send('log', String.fromCharCode(keycode))
      }
    }
  }
}

/** stores mouse coordinates in virtual memory */
function storeMouseXY (event: MouseEvent|TouchEvent): void {
  switch (event.type) {
    case 'mousemove':
      memory.query[7] = virtx((event as MouseEvent).clientX)
      memory.query[8] = virty((event as MouseEvent).clientY)
      break

    case 'touchmove': // fallthrough
    case 'touchstart':
      memory.query[7] = virtx((event as TouchEvent).touches[0].clientX)
      memory.query[8] = virty((event as TouchEvent).touches[0].clientY)
      break
  }
}

/** stores mouse click coordinates in virtual memory */
function storeClickXY (event: MouseEvent|TouchEvent): void {
  const now = Date.now()
  memory.query[4] = 128
  if (event.shiftKey) {
    memory.query[4] += 8
  }
  if (event.altKey) {
    memory.query[4] += 16
  }
  if (event.ctrlKey) {
    memory.query[4] += 32
  }
  if (now - memory.query[11] < 300) {
    memory.query[4] += 64 // double-click
  }
  memory.query[11] = now // save to check for next double-click
  switch (event.type) {
    case 'mousedown':
      memory.query[5] = virtx((event as MouseEvent).clientX)
      memory.query[6] = virty((event as MouseEvent).clientY)
      switch ((event as MouseEvent).button) {
        case 0:
          memory.query[4] += 1
          memory.query[1] = memory.query[4]
          memory.query[2] = -1
          memory.query[3] = -1
          memory.query[11] = 1 // 1 for lmouse
          break

        case 1:
          memory.query[4] += 4
          memory.query[1] = -1
          memory.query[2] = -1
          memory.query[3] = memory.query[4]
          memory.query[11] = 3 // 3 for rmouse
          break

        case 2:
          memory.query[4] += 2
          memory.query[1] = -1
          memory.query[2] = memory.query[4]
          memory.query[3] = -1
          memory.query[11] = 2 // 2 for rmouse
          break
      }
      break

    case 'touchstart':
      memory.query[5] = virtx((event as TouchEvent).touches[0].clientX)
      memory.query[6] = virty((event as TouchEvent).touches[0].clientY)
      memory.query[4] += 1
      memory.query[1] = memory.query[4]
      memory.query[2] = -1
      memory.query[3] = -1
      storeMouseXY(event)
      break
  }
}

/** stores mouse release coordinates in virtual memory */
function releaseClickXY (event: MouseEvent|TouchEvent): void {
  memory.query[4] = -memory.query[4]
  switch (event.type) {
    case 'mouseup':
      switch ((event as MouseEvent).button) {
        case 0:
          memory.query[1] = -memory.query[1]
          break

        case 1:
          memory.query[3] = -memory.query[3]
          break

        case 2:
          memory.query[2] = -memory.query[2]
          break
      }
      break

    case 'touchend':
      memory.query[1] = -memory.query[1]
      break
  }
}

/** prevents event default (for blocking context menus on right click) */
function preventDefault (event: Event): void {
  event.preventDefault()
}

/** breaks out of DETECT loop and resumes program execution if the right key/button is pressed */
function detect (event: KeyboardEvent|MouseEvent): void {
  let rightThingPressed = false
  // -11 is \mousekey - returns whatever was clicked/pressed
  if (detectInputcode === -11) rightThingPressed = true
  // -10 and -9 return for any key (not for mouse)
  if ((detectInputcode === -9 || detectInputcode === -10) && (event as KeyboardEvent).keyCode !== undefined) rightThingPressed = true
  // -8 to -4 - returns for any mouse click
  if ((-8 <= detectInputcode && detectInputcode <= -4) && (event as KeyboardEvent).keyCode === undefined) rightThingPressed = true
  // specific mouse button cases
  if (detectInputcode === -3 && (event as MouseEvent).button == 1) rightThingPressed = true
  if (detectInputcode === -2 && (event as MouseEvent).button == 2) rightThingPressed = true
  if (detectInputcode === -1 && (event as MouseEvent).button == 0) rightThingPressed = true
  // keybuffer
  if (detectInputcode === 0 && (event as KeyboardEvent).keyCode !== undefined) rightThingPressed = true
  // otherwise return if the key pressed matches the detectInputcode
  if ((event as KeyboardEvent).keyCode === detectInputcode) rightThingPressed = true
  if (rightThingPressed) {
    const returnValue = (detectInputcode < 0) ? memory.query[-detectInputcode] : memory.keys[detectInputcode]
    memory.stack.pop()
    // the event listener that negates the input (onkeyup or onmouseup) is called first, so by the
    // time this listener is called it will be negative - but for consistency with the downloadable
    // system we want it to be positive
    memory.stack.push(Math.abs(returnValue))
    window.clearTimeout(detectTimeoutID)
    execute()
  }
}

/** breaks out of READLINE loop and resumes program execution if ENTER is pressed */
function readline (event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    // get heap string from the buffer, up to the first ENTER
    const bufferAddress = memory.main[1]
    const bufferEndAddress = memory.main[memory.main[1]]
    let string = ''
    let readNextAddress = memory.main[bufferAddress + 1]
    const readLastAddress = memory.main[bufferAddress + 2]
    while (readNextAddress !== readLastAddress && memory.main[readNextAddress] !== 13) {
      string += String.fromCharCode(memory.main[readNextAddress])
      readNextAddress = (readNextAddress < bufferEndAddress)
        ? readNextAddress + 1
        : bufferEndAddress + 3 // loop back to the start
    }
    // move past the ENTER
    memory.main[bufferAddress + 1] = (readNextAddress < bufferEndAddress)
      ? readNextAddress + 1
      : bufferEndAddress + 3 // loop back to the start
    // put the string on the heap
    memory.makeHeapString(string)
    // clear the timeout and resume ordinary pcode execution
    window.clearTimeout(readlineTimeoutID)
    execute()
  }
}

/** gets current turtle properties */
function turtle (): Turtle {
  return {
    x: turtx(memory.getTurtX()),
    y: turty(memory.getTurtY()),
    d: memory.getTurtD(),
    a: memory.getTurtA(),
    p: turtt(memory.getTurtT()),
    c: hex(memory.getTurtC())
  }
}

/** converts turtx to virtual canvas coordinate */
function turtx (x: number): number {
  const exact = ((x - startx) * width) / sizex
  return doubled ? Math.round(exact) + 1 : Math.round(exact)
}

/** converts turty to virtual canvas coordinate */
function turty (y: number): number {
  const exact = ((y - starty) * height) / sizey
  return doubled ? Math.round(exact) + 1 : Math.round(exact)
}

/** converts turtt to virtual canvas thickness */
function turtt (t: number): number {
  return doubled ? t * 2 : t
}

/** maps turtle coordinates to virtual turtle coordinates */
function vcoords (coords: [number, number]): [number, number] {
  return [turtx(coords[0]), turty(coords[1])]
}

/** converts x to virtual canvas coordinate */
function virtx (x: number): number {
  const { left, width } = canvas.getBoundingClientRect()
  const exact = (((x - left) * sizex) / width) + startx
  return Math.floor(exact)
}

/** converts y to virtual canvas coordinate */
function virty (y: number): number {
  const { height, top } = canvas.getBoundingClientRect()
  const exact = (((y - top) * sizey) / height) + starty
  return Math.floor(exact)
}
