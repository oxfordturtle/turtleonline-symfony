/*
 * The Virtual Turtle Machine.
 */
import memory from './memory'
import { Options } from './options'
import { Turtle } from './turtle'
import { colours } from '../constants/colours'
import { PCode } from '../constants/pcodes'
import { MachineError } from '../tools/error'
import { on, send } from '../tools/hub'

// the canvas and its 2d drawing context
// the canvas element will send this to the machine when it's ready
let canvas: HTMLCanvasElement
let context: CanvasRenderingContext2D

on('canvasContextReady', function (data: { canvas: HTMLCanvasElement, context: CanvasRenderingContext2D }) {
  canvas = data.canvas
  context = data.context
  context.imageSmoothingEnabled = false
})

// get machine status
export function isRunning () {
  return status.running
}

export function isPaused () {
  return status.paused
}

// get machine memory
export function dump () {
  return memory.dump()
}

// reset machine components
export function reset () {
  send('resolution', { width: 1000, height: 1000 })
  send('console', { clear: true, colour: '#FFFFFF' })
  send('output', { clear: true, colour: '#FFFFFF' })
  send('turtxChanged', 500)
  send('turtyChanged', 500)
  send('turtdChanged', 0)
  send('turtaChanged', 360)
  send('turttChanged', 2)
  send('turtcChanged', '#000')
}

// run the machine
export function run (pcode: number[][], options: Options) {
  // reset machine components
  reset()
  // optionally show the canvas
  if (options.showCanvasOnRun) {
    send('selectTab', 'canvas')
  }
  // setup the virtual canvas
  // N.B. pcode for every program does most of this anyway; reconsider?
  vcanvas.startx = 0
  vcanvas.starty = 0
  vcanvas.sizex = 1000
  vcanvas.sizey = 1000
  vcanvas.width = 1000
  vcanvas.height = 1000
  vcanvas.doubled = false
  send('canvas', { startx: 0, starty: 0, sizex: 1000, sizey: 1000 })
  // setup machine memory
  memory.init(options)
  // setup the machine status
  status.running = true
  status.paused = false
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
  execute(pcode, 0, 0, options)
}

// halt the machine
export function halt () {
  if (status.running) {
    // remove event listeners
    window.removeEventListener('keydown', storeKey)
    window.removeEventListener('keyup', releaseKey)
    window.removeEventListener('keypress', putInBuffer)
    window.removeEventListener('keyup', memory.detect)
    window.removeEventListener('keyup', memory.readline)
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
    status.running = false
    status.paused = false
    // send the stopped signal (via the main state module)
    send('halted')
  }
}

// play the machine
export function play () {
  status.paused = false
  send('unpaused')
}

// pause the machine
export function pause () {
  status.paused = true
  send('paused')
}

// the machine status
const status = {
  running: false,
  paused: false
}

// the virtual canvas
const vcanvas = {
  startx: 0,
  starty: 0,
  sizex: 1000,
  sizey: 1000,
  width: 1000,
  height: 1000,
  doubled: false
}

// window event listeners
function storeKey (event) {
  const pressedKey = event.keyCode || event.charCode
  // backspace
  if (pressedKey === 8) {
    event.preventDefault() // don't go back a page in the browser!
    const buffer = memory.main[1]
    if (buffer > 0) { // there is a keybuffer
      if (memory.main[buffer + 1] !== memory.main[buffer + 2]) { // the keybuffer has something in it
        if (memory.main[buffer + 2] === buffer + 3) {
          memory.main[buffer + 2] = memory.main[buffer] // go "back" to the end
        } else {
          memory.main[buffer + 2] -= 1 // go back one
        }
        if (memory.keyecho) {
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
  if (pressedKey >= 37 && pressedKey <= 40) {
    event.preventDefault() // don't scroll the page
  }
  // normal case
  memory.query[9] = pressedKey
  memory.query[10] = 128
  if (event.shiftKey) memory.query[10] += 8
  if (event.altKey) memory.query[10] += 16
  if (event.ctrlKey) memory.query[10] += 32
  memory.keys[pressedKey] = memory.query[10]
}

function releaseKey (event) {
  const pressedKey = event.keyCode || event.charCode
  // keyup should set positive value to negative; use Math.abs to ensure the result is negative,
  // in case two keydown events fire close together, before the first keyup event fires
  memory.query[9] = -Math.abs(memory.query[9])
  memory.query[10] = -Math.abs(memory.query[10])
  memory.keys[pressedKey] = -Math.abs(memory.keys[pressedKey])
}

function putInBuffer (event) {
  const pressedKey = event.keyCode || event.charCode
  const buffer = memory.main[1]
  if (buffer > 0) { // there is a keybuffer
    let next = 0
    if (memory.main[buffer + 2] === memory.main[buffer]) {
      next = buffer + 3 // loop back round to the start
    } else {
      next = memory.main[buffer + 2] + 1
    }
    if (next !== memory.main[buffer + 1]) {
      memory.main[memory.main[buffer + 2]] = pressedKey
      memory.main[buffer + 2] = next
      // put buffer length in keys array
      if (memory.main[buffer + 2] >= memory.main[buffer + 1]) {
        memory.keys[0] = memory.main[buffer + 2] - memory.main[buffer + 1]
      } else {
        memory.keys[0] = memory.main[buffer + 2] - memory.main[buffer + 1] + memory.main[buffer] - buffer - 2
      }
      // maybe show in the console
      if (memory.keyecho) {
        send('log', String.fromCharCode(pressedKey))
      }
    }
  }
}

// store mouse coordinates in virtual memory
function storeMouseXY (event) {
  switch (event.type) {
    case 'mousemove':
      memory.query[7] = virtx(event.clientX)
      memory.query[8] = virty(event.clientY)
      break

    case 'touchmove': // fallthrough
    case 'touchstart':
      memory.query[7] = virtx(event.touches[0].clientX)
      memory.query[8] = virty(event.touches[0].clientY)
      break
  }
}

// store mouse click coordinates in virtual memory
function storeClickXY (event) {
  const now = Date.now()
  memory.query[4] = 128
  if (event.shiftKey) memory.query[4] += 8
  if (event.altKey) memory.query[4] += 16
  if (event.ctrlKey) memory.query[4] += 32
  if (now - memory.query[11] < 300) memory.query[4] += 64 // double-click
  memory.query[11] = now // save to check for next double-click
  switch (event.type) {
    case 'mousedown':
      memory.query[5] = virtx(event.clientX)
      memory.query[6] = virty(event.clientY)
      switch (event.button) {
        case 0:
          memory.query[4] += 1
          memory.query[1] = memory.query[4]
          memory.query[2] = -1
          memory.query[3] = -1
          break

        case 1:
          memory.query[4] += 4
          memory.query[1] = -1
          memory.query[2] = -1
          memory.query[3] = memory.query[4]
          break

        case 2:
          memory.query[4] += 2
          memory.query[1] = -1
          memory.query[2] = memory.query[4]
          memory.query[3] = -1
          break
      }
      break

    case 'touchstart':
      memory.query[5] = virtx(event.touches[0].clientX)
      memory.query[6] = virty(event.touches[0].clientY)
      memory.query[4] += 1
      memory.query[1] = memory.query[4]
      memory.query[2] = -1
      memory.query[3] = -1
      storeMouseXY(event)
      break
  }
}

// store mouse release coordinates in virtual memory
function releaseClickXY (event) {
  memory.query[4] = -memory.query[4]
  switch (event.type) {
    case 'mouseup':
      switch (event.button) {
        case 0:
          memory.query[1] = -memory.query[1]
          break

        case 1:
          memory.query[2] = -memory.query[3]
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

// prevent default (for blocking context menus on right click)
function preventDefault (event) {
  event.preventDefault()
}

// execute a block of code
function execute (pcode: number[][], line: number, code: number, options: Options) {
  // don't do anything if we're not running
  if (!status.running) {
    return
  }

  // try again in 1 millisecond if the machine is paused
  if (status.paused) {
    setTimeout(execute, 1, pcode, line, code, options)
    return
  }

  // in case of detect or readline, remove the event listeners the first time we carry on with the
  // program execution after they have been called
  window.removeEventListener('keyup', memory.detect)
  window.removeEventListener('keyup', memory.readline)

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
            memory.stack.push(Math.floor(memory.random() * Math.abs(n1)))
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
            memory.stack.push(Math.round(n1 / n2))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.div:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(Math.floor(n1 / n2))
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
            n1 = (n2 / n3) * (2 * Math.PI) / memory.turta
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
            n1 = (n2 / n3) * (2 * Math.PI) / memory.turta
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
            n1 = (n2 / n3) * (2 * Math.PI) / memory.turta
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
            n1 = memory.turta / (2 * Math.PI)
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
            n1 = memory.turta / (2 * Math.PI)
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
            n1 = memory.turta / (2 * Math.PI)
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
            s1 = memory.getHeapString(n1)
            memory.stack.push(s1.length)
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
                // capitalise first letter of each word
                s1 = s1.split(' ').map(x => x[0].toUpperCase() + x.slice(0)).join(' ')
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
          n1 = vcanvas.startx + (vcanvas.sizex / 2)
          n2 = vcanvas.starty + (vcanvas.sizey / 2)
          memory.turtx = Math.round(n1)
          memory.turty = Math.round(n2)
          memory.turtd = 0
          send('turtxChanged', memory.turtx)
          send('turtyChanged', memory.turty)
          send('turtdChanged', memory.turtd)
          memory.coords.push([memory.turtx, memory.turty])
          break

        case PCode.setx:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.turtx = n1
            send('turtxChanged', n1)
            memory.coords.push([memory.turtx, memory.turty])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.sety:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.turty = n1
            send('turtyChanged', n1)
            memory.coords.push([memory.turtx, memory.turty])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.setd:
          n2 = memory.stack.pop()
          if (n2 !== undefined) {
            n1 = n2 % memory.turta
            memory.turtd = n1
            send('turtdChanged', n1)
          }
          break

        case PCode.angl:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            if (memory.turta === 0) {
              // this should only happen at the start of the program before angles is set for the first time
              memory.turta = n1
            }
            if (n1 === 0) {
              // never let angles be set to zero
              throw new MachineError('Angles cannot be set to zero.')
            }
            n2 = Math.round(n1 + memory.turtd * n1 / memory.turta)
            memory.turtd = n2 % n1
            memory.turta = n1
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
            bool2 = memory.turtt < 0
            if (bool1) { // reverse pen status
              memory.turtt = bool2 ? n2 : -n2
            } else { // leave pen status as it is
              memory.turtt = bool2 ? -n2 : n2
            }
            send('turttChanged', memory.turtt)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.colr:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            memory.turtc = n1
            send('turtcChanged', hex(n1))
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.pen:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            bool1 = (n1 !== 0) // pen up or down
            n2 = Math.abs(memory.turtt) // current thickness
            n3 = bool1 ? n2 : -n2 // positive or negative depending on whether pen is down or up
            memory.turtt = n3
            send('turttChanged', n3)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.toxy:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.turtx = n1
            memory.turty = n2
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
            n2 += memory.turty
            n1 += memory.turtx
            memory.turtx = n1
            memory.turty = n2
            send('turtxChanged', n1)
            send('turtyChanged', n2)
            memory.coords.push([n1, n2])
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.drxy:
          n2 = memory.stack.pop() + memory.turty
          n1 = memory.stack.pop() + memory.turtx
          if (memory.turtt > 0) {
            send('line', { turtle: turtle(), x: turtx(n1), y: turty(n2) })
            if (memory.update) {
              drawCount += 1
            }
          }
          memory.turtx = n1
          memory.turty = n2
          send('turtxChanged', n1)
          send('turtyChanged', n2)
          memory.coords.push([n1, n2])
          break

        case PCode.fwrd:
          n3 = memory.stack.pop() // distance
          n4 = memory.turtd // turtle direction
          // work out final y coordinate
          n2 = Math.cos(n4 * Math.PI / (memory.turta / 2))
          n2 = -Math.round(n2 * n3)
          n2 += memory.turty
          // work out final x coordinate
          n1 = Math.sin(n4 * Math.PI / (memory.turta / 2))
          n1 = Math.round(n1 * n3)
          n1 += memory.turtx
          if (memory.turtt > 0) {
            send('line', { turtle: turtle(), x: turtx(n1), y: turty(n2) })
            if (memory.update) {
              drawCount += 1
            }
          }
          memory.turtx = n1
          memory.turty = n2
          send('turtxChanged', n1)
          send('turtyChanged', n2)
          memory.coords.push([n1, n2])
          break

        case PCode.back:
          n3 = memory.stack.pop() // distance
          n4 = memory.turtd // turtle direction
          // work out final y coordinate
          n2 = Math.cos(n4 * Math.PI / (memory.turta / 2))
          n2 = Math.round(n2 * n3)
          n2 += memory.turty
          // work out final x coordinate
          n1 = Math.sin(n4 * Math.PI / (memory.turta / 2))
          n1 = -Math.round(n1 * n3)
          n1 += memory.turtx
          if (memory.turtt > 0) {
            send('line', { turtle: turtle(), x: turtx(n1), y: turty(n2) })
            if (memory.update) {
              drawCount += 1
            }
          }
          memory.turtx = n1
          memory.turty = n2
          send('turtxChanged', n1)
          send('turtyChanged', n2)
          memory.coords.push([n1, n2])
          break

        case PCode.left:
          n1 = (memory.turtd - memory.stack.pop()) % memory.turta
          memory.turtd = n1
          send('turtdChanged', n1)
          break

        case PCode.rght:
          n1 = (memory.turtd + memory.stack.pop()) % memory.turta
          memory.turtd = n1
          send('turtdChanged', n1)
          break

        case PCode.turn:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
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
          n3 = Math.round(n3 * memory.turta / Math.PI / 2) % memory.turta
          memory.turtd = n3
          send('turtdChanged', n1)
          break

        // 0x60s - colour operators, shapes and fills
        case PCode.blnk:
          n1 = memory.stack.pop()
          send('blank', hex(n1))
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.rcol:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          send('flood', { x: n1, y: n2, c1: n3, c2: 0, boundary: false })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.fill:
          n4 = memory.stack.pop()
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          send('flood', { x: n1, y: n2, c1: n3, c2: d, boundary: true })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.pixc:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = context.getImageData(turtx(n2), turty(n3), 1, 1)
          memory.stack.push((n1.data[0] * 65536) + (n1.data[1] * 256) + n1.data[2])
          break

        case PCode.pixs:
          n3 = memory.stack.pop()
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          send('pixset', { x: turtx(n1), y: turty(n2), n3, doubled: vcanvas.doubled })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.rgb:
          n1 = memory.stack.pop()
          n1 = n1 % 50
          if (n1 <= 0) n1 += 50
          n1 = colours[n1 - 1].value
          memory.stack.push(n1)
          break

        case PCode.mixc:
          n4 = memory.stack.pop() // second proportion
          n3 = memory.stack.pop() // first proportion
          n2 = memory.stack.pop() // second colour
          n1 = memory.stack.pop() // first colour
          e = mixBytes(Math.floor(n1 / 0x10000), Math.floor(n2 / 0x10000), n3, n4) // red byte
          f = mixBytes(Math.floor((n1 & 0xFF00) / 0x100), Math.floor((n2 & 0xFF00) / 0x100), n3, n4) // green byte
          g = mixBytes(n1 & 0xFF, n2 & 0xFF, n3, n4) // blue byte
          memory.stack.push((e * 0x10000) + (f * 0x100) + g)
          break

        case PCode.rmbr:
          memory.coords.push([memory.turtx, memory.turty])
          break

        case PCode.frgt:
          memory.coords.length -= memory.stack.pop()
          break

        case PCode.poly:
          n3 = memory.stack.pop()
          n2 = memory.coords.length
          n1 = (n3 > n2) ? 0 : n2 - n3
          send('poly', { turtle: turtle(), coords: memory.coords.slice(n1, n2).map(vcoords), fill: false })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.pfil:
          n3 = memory.stack.pop()
          n2 = memory.coords.length
          n1 = (n3 > n2) ? 0 : n2 - n3
          send('poly', { turtle: turtle(), coords: memory.coords.slice(n1, n2).map(vcoords), fill: true })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.circ:
          n1 = memory.stack.pop()
          send('arc', { turtle: turtle(), x: turtx(n1 + vcanvas.startx), y: turty(n1 + vcanvas.starty), fill: false })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.blot:
          n1 = memory.stack.pop()
          send('arc', { turtle: turtle(), x: turtx(n1 + vcanvas.startx), y: turty(n1 + vcanvas.starty), fill: true })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.elps:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          send('arc', { turtle: turtle(), x: turtx(n1 + vcanvas.startx), y: turty(n2 + vcanvas.starty), fill: false })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.eblt:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          send('arc', { turtle: turtle(), x: turtx(n1 + vcanvas.startx), y: turty(n2 + vcanvas.starty), fill: true })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.box:
          n4 = (memory.stack.pop() !== 0) // border
          n3 = memory.stack.pop() // fill colour
          n2 = memory.turty + memory.stack.pop() // end y coordinate
          n1 = memory.turtx + memory.stack.pop() // end x coordinate
          send('box', { turtle: turtle(), x: turtx(n1), y: turty(n2), fill: hex(n3), border: n4 })
          if (memory.update) {
            drawCount += 1
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
          memory.stack.push(memory.main[n1])
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
          n3 = ''
          while (code < n2) {
            code += 1
            n3 += String.fromCharCode(pcode[line][code])
          }
          memory.makeHeapString(n3)
          break

        case PCode.stvg:
          n1 = memory.stack.pop()
          memory.main[pcode[line][code + 1]] = n1
          code += 1
          break

        case PCode.stvv:
          n1 = pcode[line][code + 1]
          n2 = pcode[line][code + 2]
          n3 = memory.stack.pop()
          memory.main[memory.main[n1] + n2] = n3
          code += 2
          break

        case PCode.stvr:
          n1 = pcode[line][code + 1]
          n2 = pcode[line][code + 2]
          n3 = memory.stack.pop()
          memory.main[memory.main[memory.main[n1] + n2]] = n3
          code += 2
          break

        case PCode.lptr:
          n1 = memory.stack.pop()
          memory.stack.push(memory.main[n1])
          break

        case PCode.sptr:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          memory.main[n2] = n1
          break

        case PCode.zptr:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          memory.zero(n1, n2)
          break

        case PCode.cptr:
          n3 = memory.stack.pop() // length
          n2 = memory.stack.pop() // target
          n1 = memory.stack.pop() // source
          memory.copy(n1, n2, n3)
          break

        case PCode.cstr:
          n2 = memory.stack.pop() // target
          n1 = memory.stack.pop() // source
          n4 = memory.main[n2 - 1] // maximum length of target
          n3 = memory.main[n1] // length of source
          memory.copy(n1, n2, Math.min(n3, n4) + 1)
          break

        case PCode.test:
          n2 = memory.stack[memory.stack.length - 1] // leave the stack unchanged
          n1 = memory.stack[memory.stack.length - 2]
          if ((n1 < 0) || (n1 >= memory.main[n2])) {
            // TODO: make range check a runtime option
            throw new MachineError('Array index out of range.')
          }
          break

        // 0x80s - flow control, memory control
        case PCode.jump:
          line = pcode[line][code + 1] - 1
          code = -1
          break

        case PCode.ifno:
          if (memory.stack.pop() === 0) {
            line = pcode[line][code + 1] - 1
            code = -1
          } else {
            code += 1
          }
          break

        case PCode.halt:
          halt()
          return

        case PCode.subr:
          if (memory.heapGlobal === -1) {
            memory.heapGlobal = memory.heapPerm
          }
          memory.returnStack.push([line, code + 1])
          line = pcode[line][code + 1] - 1
          code = -1
          break

        case PCode.retn:
          [line, code] = memory.returnStack.pop()
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
          line = (memory.stack.pop() - 1)
          code = -1
          break

        case PCode.ldmt:
          memory.stack.push(memory.memoryStack.length - 1)
          break

        case PCode.stmt:
          n1 = memory.stack.pop()
          memory.memoryStack.push(n1)
          memory.stackTop = Math.max(n1, memory.stackTop)
          break

        case PCode.memc:
          n1 = pcode[line][code + 1]
          n2 = pcode[line][code + 2]
          n3 = memory.memoryStack.pop()
          // heap overflow check
          if (n3 + n2 > options.stackSize) {
            throw new MachineError('Memory stack has overflowed into memory heap. Probable cause is unterminated recursion.')
          }
          memory.memoryStack.push(memory.main[n1])
          memory.stackTop = Math.max(memory.main[n1], memory.stackTop)
          memory.main[n1] = n3
          memory.memoryStack.push(n3 + n2)
          memory.stackTop = Math.max(n3 + n2, memory.stackTop)
          code += 2
          break

        case PCode.memr:
          memory.memoryStack.pop()
          n1 = pcode[line][code + 1]
          n2 = memory.memoryStack.pop()
          memory.memoryStack.push(memory.main[n1])
          memory.stackTop = Math.max(memory.main[n1], memory.stackTop)
          memory.main[n1] = n2
          code += 2
          break

        case PCode.hfix:
          memory.heapPerm = memory.heapTemp
          break

        case PCode.hclr:
          memory.heapTemp = memory.heapPerm
          break

        case PCode.hrst:
          if (memory.heapGlobal > -1) {
            memory.heapTemp = memory.heapGlobal
            memory.heapPerm = memory.heapGlobal
          }
          break

        // 0x90s - runtime variables, debugging
        case PCode.canv:
          vcanvas.sizey = memory.stack.pop()
          vcanvas.sizex = memory.stack.pop()
          vcanvas.starty = memory.stack.pop()
          vcanvas.startx = memory.stack.pop()
          send('canvas', vcanvas)
          memory.turtx = Math.round(vcanvas.startx + (vcanvas.sizex / 2))
          memory.turty = Math.round(vcanvas.starty + (vcanvas.sizey / 2))
          memory.turtd = 0
          send('turtxChanged', memory.turtx)
          send('turtyChanged', memory.turty)
          send('turtdChanged', memory.turtd)
          memory.coords.push([memory.turtx, memory.turty])
          drawCount = options.drawCountMax // force update
          break

        case PCode.reso:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (Math.min(n1, n2) <= options.smallSize) {
            n1 = n1 * 2
            n2 = n2 * 2
            vcanvas.doubled = true
          } else {
            vcanvas.doubled = false
          }
          vcanvas.width = n1
          vcanvas.height = n2
          send('resolution', { width: n1, height: n2 })
          send('blank', '#FFFFFF')
          drawCount = options.drawCountMax // force update
          break

        case PCode.udat:
          n1 = (memory.stack.pop() !== 0)
          memory.update = n1
          if (n1) {
            drawCount = options.drawCountMax // force update
          }
          break

        case PCode.seed:
          n1 = memory.stack.pop()
          if (n1 === 0) {
            memory.stack.push(memory.seed)
          } else {
            memory.seed = n1
            memory.stack.push(n1)
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
          send('memoryDumped', dump())
          if (options.showMemoryOnDump) {
            send('selectTab', 'memory')
          }
          break

        case PCode.peek:
          n1 = memory.stack.pop()
          memory.stack.push(memory.main[n1])
          break

        case PCode.poke:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          memory.main[n1] = n2
          break

        // 0xA0s - text output, timing
        case PCode.inpt:
          n1 = memory.stack.pop()
          if (n1 < 0) {
            memory.stack.push(memory.query[-n1])
          } else {
            memory.stack.push(memory.keys[n1])
          }
          break

        case PCode.iclr:
          n1 = memory.stack.pop()
          if (n1 < 0) {
            // reset query value
            memory.query[-n1] = -1
          } else if (n1 === 0) {
            // reset keybuffer
            memory.main[memory.main[1] + 1] = memory.main[1] + 3
            memory.main[memory.main[1] + 2] = memory.main[1] + 3
          } else {
            // reset key value
            memory.keys[n1] = -1
          }
          break

        case PCode.bufr:
          n1 = memory.stack.pop()
          if (n1 > 0) {
            n2 = memory.heapTemp + 4
            memory.stack.push(memory.heapTemp + 1)
            memory.main[memory.heapTemp + 1] = n2 + n1
            memory.main[memory.heapTemp + 2] = n2
            memory.main[memory.heapTemp + 3] = n2
            memory.main.fill(0, n2, n2 + n1)
            memory.heapTemp = n2 + n1
            memory.heapMax = Math.max(memory.heapTemp, memory.heapMax)
          }
          break

        case PCode.read:
          n1 = memory.stack.pop() // maximum number of characters to read
          n2 = memory.main[1] // the address of the buffer
          n3 = memory.main[memory.main[1]] // the address of the end of the buffer
          n4 = '' // the string read from the buffer
          e = memory.main[n2 + 1]
          f = memory.main[n2 + 2]
          if (n1 === 0) {
            while (e !== f) {
              n4 += String.fromCharCode(memory.main[e])
              e = (e < n3)
                ? e + 1
                : n3 + 3 // loop back to the start
            }
          } else {
            while (e !== f && n4.length <= n1) {
              n4 += String.fromCharCode(memory.main[e])
              if (e < n3) {
                e += 1
              } else {
                e = n3 + 3 // loop back to the start
              }
            }
            memory.main[n2 + 1] = e
          }
          memory.makeHeapString(n4)
          break

        case PCode.rdln:
          n1 = Math.pow(2, 31) - 1 // as long as possible
          code += 1
          if (code === pcode[line].length) {
            line += 1
            code = 0
          }
          n2 = setTimeout(execute, n1, pcode, line, code, options)
          memory.readline = readlineProto.bind(null, n2, pcode, line, code, options)
          window.addEventListener('keyup', memory.readline)
          return

        case PCode.kech:
          n1 = (memory.stack.pop() !== 0)
          memory.keyecho = n1
          break

        case PCode.outp:
          n3 = (memory.stack.pop() !== 0)
          n2 = memory.stack.pop()
          n1 = (memory.stack.pop() !== 0)
          send('output', { clear: n1, colour: hex(n2) })
          if (n3) {
            send('selectTab', 'output')
          } else {
            send('selectTab', 'canvas')
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
            send('print', { turtle: turtle(), string: n1, font: n2, size: n3 })
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          break

        case PCode.writ:
          n1 = memory.stack.pop()
          if (n1 !== undefined) {
            s1 = memory.getHeapString(n1)
            send('write', n1)
            send('log', n1)
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
          n1 = n1 - memory.startTime
          memory.stack.push(n1)
          break

        case PCode.tset:
          n1 = Date.now()
          n2 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.startTime = n1 - n2
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
            window.setTimeout(execute, n1, pcode, line, code, options)
          } else {
            throw new MachineError('Stack operation called on empty stack.')
          }
          return

        case PCode.tdet:
          n2 = memory.stack.pop()
          n1 = memory.stack.pop()
          if (n1 !== undefined && n2 !== undefined) {
            memory.stack.push(0)
            code += 1
            if (code === pcode[line].length) {
              line += 1
              code = 0
            }
            n3 = window.setTimeout(execute, n1, pcode, line, code, options)
            memory.detect = detectProto.bind(null, n2, n3, pcode, line, code, options)
            window.addEventListener('keyup', memory.detect)
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
          throw new MachineError('File processing has not yet been implemented in the online Turtle System. We are working on introducing this very soon. In the meantime, please run this program using the downloable system to run this program.')

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
  setTimeout(execute, 0, pcode, line, code, options)
}

// prototype key detection function
function detectProto (keycode: number, timeoutID: number, pcode: number[][], line: number, code: number, options: Options, event: KeyboardEvent): void {
  if (keycodeFromKey(event.key) === keycode) {
    memory.stack.pop()
    memory.stack.push(-1) // -1 for true
    window.clearTimeout(timeoutID)
    execute(pcode, line, code, options)
  }
}

// prototype line reading function
function readlineProto (timeoutID: number, pcode: number[][], line: number, code: number, options: Options, event: KeyboardEvent): void {
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
    window.clearTimeout(timeoutID)
    execute(pcode, line, code, options)
  }
}

// get current turtle properties
function turtle (): Turtle {
  return {
    x: turtx(memory.turtx),
    y: turty(memory.turty),
    d: memory.turtd,
    a: memory.turta,
    p: turtt(memory.turtt),
    c: hex(memory.turtc)
  }
}

// convert turtx to virtual canvas coordinate
function turtx (x: number): number {
  const exact = ((x - vcanvas.startx) * vcanvas.width) / vcanvas.sizex
  return vcanvas.doubled ? Math.round(exact) + 1 : Math.round(exact)
}

// convert turty to virtual canvas coordinate
function turty (y: number): number {
  const exact = ((y - vcanvas.starty) * vcanvas.height) / vcanvas.sizey
  return vcanvas.doubled ? Math.round(exact) + 1 : Math.round(exact)
}

// convert turtt to virtual canvas thickness
function turtt (t: number): number {
  return vcanvas.doubled ? t * 2 : t
}

// map turtle coordinates to virtual turtle coordinates
function vcoords (coords: [number, number]): [number, number] {
  return [turtx(coords[0]), turty(coords[1])]
}

// convert x to virtual canvas coordinate
function virtx (x: number): number {
  const { left, width } = canvas.getBoundingClientRect()
  const exact = (((x - left) * vcanvas.sizex) / width) + vcanvas.startx
  return Math.round(exact)
}

// convert y to virtual canvas coordinate
function virty (y: number): number {
  const { height, top } = canvas.getBoundingClientRect()
  const exact = (((y - top) * vcanvas.sizey) / height) + vcanvas.starty
  return Math.round(exact)
}

// convert a number to css colour #000000 format
function hex (colour: number): string {
  return `#${padded(colour.toString(16))}`
}

// mix two colours
function mixBytes (byte1: number, byte2: number, proportion1: number, proportion2: number): number {
  return Math.round(((byte1 * proportion1) + (byte2 * proportion2)) / (proportion1 + proportion2))
}

// padd a string with leading zeros
function padded (string: string): string {
  return ((string.length < 6) ? padded(`0${string}`) : string)
}

/** get a keycode from a KeyboardEvent.key property */
function keycodeFromKey (key: string): number {
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
