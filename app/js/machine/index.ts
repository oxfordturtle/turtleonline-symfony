/*
 * The Virtual Turtle Machine.
 */
import { colours } from './colours'
import { PCode } from './pcodes'
import memory from './memory'
import { Options } from './options'
import MachineError from './error'

// the canvas and its 2d drawing context
// the canvas element will send this to the machine when it's ready
let canvas, context

// function for "sending" signals to this module
export function send (signal, data) {
  switch (signal) {
    case 'canvasContextReady':
      canvas = data.canvas
      context = data.context
      context.imageSmoothingEnabled = false
      globalThis.context = context
      break
  }
}

// function for registering callbacks on the record of outgoing messages
// (unlike the state module, only allow one callback for each message)
export function on (message, callback) {
  replies[message] = callback
}

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
  reply('resolution', { width: 1000, height: 1000 })
  reply('console', { clear: true, colour: '#FFFFFF' })
  reply('output', { clear: true, colour: '#FFFFFF' })
  reply('turtxChanged', 500)
  reply('turtyChanged', 500)
  reply('turtdChanged', 0)
  reply('turtaChanged', 360)
  reply('turttChanged', 2)
  reply('turtcChanged', '#000')
}

// run the machine
export function run (pcode: number[][], options: Options) {
  // reset machine components
  reset()
  // optionally show the canvas
  if (options.showCanvasOnRun) {
    reply('showCanvas')
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
  reply('canvas', { startx: 0, starty: 0, sizex: 1000, sizey: 1000 })
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
  reply('played')
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
    reply('cursor', 1)
    // reset the machine status
    status.running = false
    status.paused = false
    // send the stopped signal (via the main state module)
    reply('halted')
  }
}

// play the machine
export function play () {
  status.paused = false
  reply('unpaused')
}

// pause the machine
export function pause () {
  status.paused = true
  reply('paused')
}

// record of replies (callbacks to execute when sending signals out); the main state module
// specifies these functions, because they require things in scope from that module
const replies = {}

// function for executing any registered callbacks following a state change
function reply (message: any, data: any = null) {
  // execute the callback registered for this message (if any)
  if (replies[message]) {
    replies[message](data)
  }
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
          reply('backspace')
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
        reply('log', String.fromCharCode(pressedKey))
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
function execute (pcode, line, code, options) {
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
  let drawCount = 0
  let codeCount = 0
  let a, b, c, d, e, f, g // miscellanous variables for working things out on the fly
  try {
    while (drawCount < options.drawCountMax && (codeCount <= options.codeCountMax)) {
      switch (pcode[line][code]) {
        // 0x0 - basic stack operations, conversion operators
        case PCode.null:
          break

        case PCode.dupl:
          a = memory.stack.pop()
          memory.stack.push(a, a)
          break

        case PCode.swap:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(b, a)
          break

        case PCode.rota:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(b, c, a)
          break

        case PCode.incr:
          a = memory.stack.pop()
          memory.stack.push(a + 1)
          break

        case PCode.decr:
          a = memory.stack.pop()
          memory.stack.push(a - 1)
          break

        case PCode.mxin:
          memory.stack.push(Math.pow(2, 31) - 1)
          break

        case PCode.rand:
          a = memory.stack.pop()
          memory.stack.push(Math.floor(memory.random() * Math.abs(a)))
          break

        case PCode.hstr:
          a = memory.getHeapString(memory.stack.pop())
          memory.makeHeapString(a)
          break

        case PCode.ctos:
          a = memory.stack.pop()
          memory.makeHeapString(String.fromCharCode(a))
          break

        case PCode.sasc:
          a = memory.getHeapString(memory.stack.pop())
          if (a.length === 0) {
            memory.stack.push(0)
          } else {
            memory.stack.push(a.charCodeAt(0))
          }
          break

        case PCode.itos:
          a = memory.stack.pop()
          memory.makeHeapString(a.toString())
          break

        case PCode.hexs:
          b = memory.stack.pop()
          a = memory.stack.pop().toString(16).toUpperCase()
          while (a.length < b) {
            a = '0' + a
          }
          memory.makeHeapString(a)
          break

        case PCode.sval:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.getHeapString(b)
          if (a[0] === '#') {
            d = isNaN(parseInt(a.slice(1), 16)) ? c : parseInt(a.slice(1), 16)
          } else {
            d = isNaN(parseInt(a, 10)) ? c : parseInt(a, 10)
          }
          memory.stack.push(d)
          break

        case PCode.qtos:
          d = memory.stack.pop()
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = (b / c)
          memory.makeHeapString(a.toFixed(d))
          break

        case PCode.qval:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.getHeapString(memory.stack.pop())
          d = isNaN(parseFloat(a)) ? c : parseFloat(a)
          memory.stack.push(Math.round(d * b))
          break

        // 0x10s - Boolean operators, integer operators
        case PCode.not:
          a = memory.stack.pop()
          memory.stack.push(~a)
          break

        case PCode.and:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a & b)
          break

        case PCode.or:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a | b)
          break

        case PCode.xor:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a ^ b)
          break

        case PCode.andl:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a && b)
          break

        case PCode.orl:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a || b)
          break

        case PCode.shft:
          b = memory.stack.pop()
          a = memory.stack.pop()
          if (b < 0) {
            memory.stack.push(a << -b)
          } else {
            memory.stack.push(a >> b)
          }
          break

        case PCode.neg:
          a = memory.stack.pop()
          memory.stack.push(-a)
          break

        case PCode.abs:
          a = memory.stack.pop()
          memory.stack.push(Math.abs(a))
          break

        case PCode.sign:
          a = memory.stack.pop()
          memory.stack.push(Math.sign(a))
          break

        case PCode.plus:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a + b)
          break

        case PCode.subt:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a - b)
          break

        case PCode.mult:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a * b)
          break

        case PCode.divr:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.round(a / b))
          break

        case PCode.div:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.floor(a / b))
          break

        case PCode.mod:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a % b)
          break

        // 0x20s - comparison operators
        case PCode.eqal:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a === b ? -1 : 0)
          break

        case PCode.noeq:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a !== b ? -1 : 0)
          break

        case PCode.less:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a < b ? -1 : 0)
          break

        case PCode.more:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a > b ? -1 : 0)
          break

        case PCode.lseq:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a <= b ? -1 : 0)
          break

        case PCode.mreq:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(a >= b ? -1 : 0)
          break

        case PCode.maxi:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.max(a, b))
          break

        case PCode.mini:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.min(a, b))
          break

        case PCode.seql:
          b = memory.getHeapString(memory.stack.pop())
          a = memory.getHeapString(memory.stack.pop())
          memory.stack.push(a === b ? -1 : 0)
          break

        case PCode.sneq:
          b = memory.getHeapString(memory.stack.pop())
          a = memory.getHeapString(memory.stack.pop())
          memory.stack.push(a !== b ? -1 : 0)
          break

        case PCode.sles:
          b = memory.getHeapString(memory.stack.pop())
          a = memory.getHeapString(memory.stack.pop())
          memory.stack.push(a < b ? -1 : 0)
          break

        case PCode.smor:
          b = memory.getHeapString(memory.stack.pop())
          a = memory.getHeapString(memory.stack.pop())
          memory.stack.push(a > b ? -1 : 0)
          break

        case PCode.sleq:
          b = memory.getHeapString(memory.stack.pop())
          a = memory.getHeapString(memory.stack.pop())
          memory.stack.push(a <= b ? -1 : 0)
          break

        case PCode.smeq:
          b = memory.getHeapString(memory.stack.pop())
          a = memory.getHeapString(memory.stack.pop())
          memory.stack.push(a >= b ? -1 : 0)
          break

        case PCode.smax:
          b = memory.getHeapString(memory.stack.pop())
          a = memory.getHeapString(memory.stack.pop())
          memory.makeHeapString(b > a ? b : a)
          break

        case PCode.smin:
          b = memory.getHeapString(memory.stack.pop())
          a = memory.getHeapString(memory.stack.pop())
          memory.makeHeapString(b < a ? b : a)
          break

        // 0x30s - pseudo-real operators
        case PCode.divm:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.round((a / b) * c))
          break

        case PCode.sqrt:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.round(Math.sqrt(a) * b))
          break

        case PCode.hyp:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.round(Math.sqrt((a * a) + (b * b)) * c))
          break

        case PCode.root:
          d = memory.stack.pop()
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.round(Math.pow(a / b, 1 / c) * d))
          break

        case PCode.powr:
          d = memory.stack.pop()
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.round(Math.pow(a / b, c) * d))
          break

        case PCode.log:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.round((Math.log(a / b) / Math.LN10) * c))
          break

        case PCode.alog:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.round(Math.pow(10, a / b) * c))
          break

        case PCode.ln:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.round(Math.log(a / b) * c))
          break

        case PCode.exp:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(Math.round(Math.exp(a / b) * c))
          break

        case PCode.sin:
          d = memory.stack.pop()
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = (b / c) * (2 * Math.PI) / memory.turta
          memory.stack.push(Math.round(Math.sin(a) * d))
          break

        case PCode.cos:
          d = memory.stack.pop()
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = (b / c) * (2 * Math.PI) / memory.turta
          memory.stack.push(Math.round(Math.cos(a) * d))
          break

        case PCode.tan:
          d = memory.stack.pop()
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = (b / c) * (2 * Math.PI) / memory.turta
          memory.stack.push(Math.round(Math.tan(a) * d))
          break

        case PCode.asin:
          d = memory.stack.pop()
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.turta / (2 * Math.PI)
          memory.stack.push(Math.round(Math.asin(b / c) * d * a))
          break

        case PCode.acos:
          d = memory.stack.pop()
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.turta / (2 * Math.PI)
          memory.stack.push(Math.round(Math.acos(b / c) * d * a))
          break

        case PCode.atan:
          d = memory.stack.pop()
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.turta / (2 * Math.PI)
          memory.stack.push(Math.round(Math.atan2(b, c) * d * a))
          break

        case PCode.pi:
          a = memory.stack.pop()
          memory.stack.push(Math.round(Math.PI * a))
          break

        // 0x40s - string operators
        case PCode.scat:
          b = memory.getHeapString(memory.stack.pop())
          a = memory.getHeapString(memory.stack.pop())
          memory.makeHeapString(a + b)
          break

        case PCode.slen:
          a = memory.getHeapString(memory.stack.pop())
          memory.stack.push(a.length)
          break

        case PCode.case:
          b = memory.stack.pop()
          a = memory.getHeapString(memory.stack.pop())
          switch (b) {
            case 1:
              // lowercase
              memory.makeHeapString(a.toLowerCase())
              break

            case 2:
              // uppercase
              memory.makeHeapString(a.toUpperCase())
              break

            case 3:
              // capitalise first letter
              if (a.length > 0) {
                memory.makeHeapString(a[0].toUpperCase() + a.slice(0))
              } else {
                memory.makeHeapString(a)
              }
              break

            case 4:
              // capitalise first letter of each word
              a = a.split(' ').map(x => x[0].toUpperCase() + x.slice(0)).join(' ')
              memory.makeHeapString(a)
              break

            case 5:
              // TODO: swap case
              a = a.split('').map(x => (x === x.toLowerCase()) ? x.toUpperCase() : x.toLowerCase()).join('')
              memory.makeHeapString(a)
              break

            default:
              // this should be impossible
              memory.makeHeapString(a)
              break
          }
          break

        case PCode.copy:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.getHeapString(memory.stack.pop())
          memory.makeHeapString(a.substr(b - 1, c))
          break

        case PCode.dels:
          d = memory.stack.pop()
          c = memory.stack.pop()
          b = memory.getHeapString(memory.stack.pop())
          a = b.substr(0, c - 1) + b.substr((c - 1) + d)
          memory.makeHeapString(a)
          break

        case PCode.inss:
          d = memory.stack.pop()
          c = memory.getHeapString(memory.stack.pop())
          b = memory.getHeapString(memory.stack.pop())
          a = c.substr(0, d - 1) + b + c.substr(d - 1)
          memory.makeHeapString(a)
          break

        case PCode.poss:
          b = memory.getHeapString(memory.stack.pop())
          a = memory.getHeapString(memory.stack.pop())
          memory.stack.push(b.indexOf(a) + 1)
          break

        case PCode.repl:
          d = memory.stack.pop()
          c = memory.getHeapString(memory.stack.pop())
          b = memory.getHeapString(memory.stack.pop())
          a = memory.getHeapString(memory.stack.pop())
          if (d > 0) {
            while (d > 0) {
              a = a.replace(b, c)
              d = d - 1
            }
            memory.makeHeapString(a)
          } else {
            memory.makeHeapString(a.replace(new RegExp(b, 'g'), c))
          }
          break

        case PCode.spad:
          d = memory.stack.pop()
          c = Math.abs(d)
          b = memory.getHeapString(memory.stack.pop())
          a = memory.getHeapString(memory.stack.pop())
          while ((a.length + b.length) <= c) {
            if (d < 0) {
              a = a + b
            } else {
              a = b + a
            }
          }
          memory.makeHeapString(a)
          break

        case PCode.trim:
          a = memory.getHeapString(memory.stack.pop())
          memory.makeHeapString(a.trim())
          break

        // 0x50s - turtle settings and movement
        case PCode.home:
          a = vcanvas.startx + (vcanvas.sizex / 2)
          b = vcanvas.starty + (vcanvas.sizey / 2)
          memory.turtx = Math.round(a)
          memory.turty = Math.round(b)
          memory.turtd = 0
          reply('turtxChanged', memory.turtx)
          reply('turtyChanged', memory.turty)
          reply('turtdChanged', memory.turtd)
          memory.coords.push([memory.turtx, memory.turty])
          break

        case PCode.setx:
          a = memory.stack.pop()
          memory.turtx = a
          reply('turtxChanged', a)
          memory.coords.push([memory.turtx, memory.turty])
          break

        case PCode.sety:
          a = memory.stack.pop()
          memory.turty = a
          reply('turtyChanged', a)
          memory.coords.push([memory.turtx, memory.turty])
          break

        case PCode.setd:
          a = memory.stack.pop() % memory.turta
          memory.turtd = a
          reply('turtdChanged', a)
          break

        case PCode.angl:
          a = memory.stack.pop()
          if (memory.turta === 0) {
            // this should only happen at the start of the program before angles is set for the first time
            memory.turta = a
          }
          if (a === 0) {
            // never let angles be set to zero
            halt()
            throw error('Angles cannot be set to zero.')
          }
          b = Math.round(a + memory.turtd * a / memory.turta)
          memory.turtd = b % a
          memory.turta = a
          reply('turtdChanged', b % a)
          reply('turtaChanged', a)
          break

        case PCode.thik:
          a = memory.stack.pop()
          b = Math.abs(a)
          c = a < 0
          d = memory.turtt < 0
          if (c) { // reverse pen status
            memory.turtt = d ? b : -b
          } else { // leave pen status as it is
            memory.turtt = d ? -b : b
          }
          reply('turttChanged', memory.turtt)
          break

        case PCode.colr:
          a = memory.stack.pop()
          memory.turtc = a
          reply('turtcChanged', hex(a))
          break

        case PCode.pen:
          a = (memory.stack.pop() !== 0) // pen up or down
          b = Math.abs(memory.turtt) // current thickness
          c = a ? b : -b // positive or negative depending on whether pen is down or up
          memory.turtt = c
          reply('turttChanged', c)
          break

        case PCode.toxy:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.turtx = a
          memory.turty = b
          reply('turtxChanged', a)
          reply('turtyChanged', b)
          memory.coords.push([a, b])
          break

        case PCode.mvxy:
          b = memory.stack.pop() + memory.turty
          a = memory.stack.pop() + memory.turtx
          memory.turtx = a
          memory.turty = b
          reply('turtxChanged', a)
          reply('turtyChanged', b)
          memory.coords.push([a, b])
          break

        case PCode.drxy:
          b = memory.stack.pop() + memory.turty
          a = memory.stack.pop() + memory.turtx
          if (memory.turtt > 0) {
            reply('line', { turtle: turtle(), x: turtx(a), y: turty(b) })
            if (memory.update) {
              drawCount += 1
            }
          }
          memory.turtx = a
          memory.turty = b
          reply('turtxChanged', a)
          reply('turtyChanged', b)
          memory.coords.push([a, b])
          break

        case PCode.fwrd:
          c = memory.stack.pop() // distance
          d = memory.turtd // turtle direction
          // work out final y coordinate
          b = Math.cos(d * Math.PI / (memory.turta / 2))
          b = -Math.round(b * c)
          b += memory.turty
          // work out final x coordinate
          a = Math.sin(d * Math.PI / (memory.turta / 2))
          a = Math.round(a * c)
          a += memory.turtx
          if (memory.turtt > 0) {
            reply('line', { turtle: turtle(), x: turtx(a), y: turty(b) })
            if (memory.update) {
              drawCount += 1
            }
          }
          memory.turtx = a
          memory.turty = b
          reply('turtxChanged', a)
          reply('turtyChanged', b)
          memory.coords.push([a, b])
          break

        case PCode.back:
          c = memory.stack.pop() // distance
          d = memory.turtd // turtle direction
          // work out final y coordinate
          b = Math.cos(d * Math.PI / (memory.turta / 2))
          b = Math.round(b * c)
          b += memory.turty
          // work out final x coordinate
          a = Math.sin(d * Math.PI / (memory.turta / 2))
          a = -Math.round(a * c)
          a += memory.turtx
          if (memory.turtt > 0) {
            reply('line', { turtle: turtle(), x: turtx(a), y: turty(b) })
            if (memory.update) {
              drawCount += 1
            }
          }
          memory.turtx = a
          memory.turty = b
          reply('turtxChanged', a)
          reply('turtyChanged', b)
          memory.coords.push([a, b])
          break

        case PCode.left:
          a = (memory.turtd - memory.stack.pop()) % memory.turta
          memory.turtd = a
          reply('turtdChanged', a)
          break

        case PCode.rght:
          a = (memory.turtd + memory.stack.pop()) % memory.turta
          memory.turtd = a
          reply('turtdChanged', a)
          break

        case PCode.turn:
          b = memory.stack.pop()
          a = memory.stack.pop()
          if (Math.abs(b) >= Math.abs(a)) {
            c = Math.atan(-a / b)
            if (b > 0) {
              c += Math.PI
            } else if (a < 0) {
              c += 2
              c *= Math.PI
            }
          } else {
            c = Math.atan(b / a)
            if (a > 0) {
              c += Math.PI
            } else {
              c += 3
              c *= Math.PI
            }
            c /= 2
          }
          c = Math.round(c * memory.turta / Math.PI / 2) % memory.turta
          memory.turtd = c
          reply('turtdChanged', a)
          break

        // 0x60s - colour operators, shapes and fills
        case PCode.blnk:
          a = memory.stack.pop()
          reply('blank', hex(a))
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.rcol:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.stack.pop()
          reply('flood', { x: a, y: b, c1: c, c2: 0, boundary: false })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.fill:
          d = memory.stack.pop()
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.stack.pop()
          reply('flood', { x: a, y: b, c1: c, c2: d, boundayr: true })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.pixc:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = context.getImageData(turtx(b), turty(c), 1, 1)
          memory.stack.push((a.data[0] * 65536) + (a.data[1] * 256) + a.data[2])
          break

        case PCode.pixs:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.stack.pop()
          reply('pixset', { x: turtx(a), y: turty(b), c, doubled: vcanvas.doubled })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.rgb:
          a = memory.stack.pop()
          a = a % 50
          if (a <= 0) a += 50
          a = colours[a - 1].value
          memory.stack.push(a)
          break

        case PCode.mixc:
          d = memory.stack.pop() // second proportion
          c = memory.stack.pop() // first proportion
          b = memory.stack.pop() // second colour
          a = memory.stack.pop() // first colour
          e = mixBytes(Math.floor(a / 0x10000), Math.floor(b / 0x10000), c, d) // red byte
          f = mixBytes(Math.floor((a & 0xFF00) / 0x100), Math.floor((b & 0xFF00) / 0x100), c, d) // green byte
          g = mixBytes(a & 0xFF, b & 0xFF, c, d) // blue byte
          memory.stack.push((e * 0x10000) + (f * 0x100) + g)
          break

        case PCode.rmbr:
          memory.coords.push([memory.turtx, memory.turty])
          break

        case PCode.frgt:
          memory.coords.length -= memory.stack.pop()
          break

        case PCode.poly:
          c = memory.stack.pop()
          b = memory.coords.length
          a = (c > b) ? 0 : b - c
          reply('poly', { turtle: turtle(), coords: memory.coords.slice(a, b).map(vcoords), fill: false })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.pfil:
          c = memory.stack.pop()
          b = memory.coords.length
          a = (c > b) ? 0 : b - c
          reply('poly', { turtle: turtle(), coords: memory.coords.slice(a, b).map(vcoords), fill: true })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.circ:
          a = memory.stack.pop()
          reply('arc', { turtle: turtle(), x: turtx(a + vcanvas.startx), y: turty(a + vcanvas.starty), fill: false })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.blot:
          a = memory.stack.pop()
          reply('arc', { turtle: turtle(), x: turtx(a + vcanvas.startx), y: turty(a + vcanvas.starty), fill: true })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.elps:
          b = memory.stack.pop()
          a = memory.stack.pop()
          reply('arc', { turtle: turtle(), x: turtx(a + vcanvas.startx), y: turty(b + vcanvas.starty), fill: false })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.eblt:
          b = memory.stack.pop()
          a = memory.stack.pop()
          reply('arc', { turtle: turtle(), x: turtx(a + vcanvas.startx), y: turty(b + vcanvas.starty), fill: true })
          if (memory.update) {
            drawCount += 1
          }
          break

        case PCode.box:
          d = (memory.stack.pop() !== 0) // border
          c = memory.stack.pop() // fill colour
          b = memory.turty + memory.stack.pop() // end y coordinate
          a = memory.turtx + memory.stack.pop() // end x coordinate
          reply('box', { turtle: turtle(), x: turtx(a), y: turty(b), fill: hex(c), border: d })
          if (memory.update) {
            drawCount += 1
          }
          break

        // 0x70s - loading from stack, storing from stack, pointer and array operations
        case PCode.ldin:
          a = pcode[line][code + 1]
          memory.stack.push(a)
          code += 1
          break

        case PCode.ldvg:
          a = pcode[line][code + 1]
          memory.stack.push(memory.main[a])
          code += 1
          break

        case PCode.ldvv:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          memory.stack.push(memory.main[memory.main[a] + b])
          code += 2
          break

        case PCode.ldvr:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          memory.stack.push(memory.main[memory.main[memory.main[a] + b]])
          code += 2
          break

        case PCode.ldag:
          a = pcode[line][code + 1]
          memory.stack.push(a)
          code += 1
          break

        case PCode.ldav:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          memory.stack.push(memory.main[a] + b)
          code += 2
          break

        case PCode.lstr:
          code += 1
          a = pcode[line][code] // length of the string
          b = code + a // end of the string
          c = ''
          while (code < b) {
            code += 1
            c += String.fromCharCode(pcode[line][code])
          }
          memory.makeHeapString(c)
          break

        case PCode.stvg:
          a = memory.stack.pop()
          memory.main[pcode[line][code + 1]] = a
          code += 1
          break

        case PCode.stvv:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          c = memory.stack.pop()
          memory.main[memory.main[a] + b] = c
          code += 2
          break

        case PCode.stvr:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          c = memory.stack.pop()
          memory.main[memory.main[memory.main[a] + b]] = c
          code += 2
          break

        case PCode.lptr:
          a = memory.stack.pop()
          memory.stack.push(memory.main[a])
          break

        case PCode.sptr:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.main[b] = a
          break

        case PCode.zptr:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.zero(a, b)
          break

        case PCode.cptr:
          c = memory.stack.pop() // length
          b = memory.stack.pop() // target
          a = memory.stack.pop() // source
          memory.copy(a, b, c)
          break

        case PCode.cstr:
          b = memory.stack.pop() // target
          a = memory.stack.pop() // source
          d = memory.main[b - 1] // maximum length of target
          c = memory.main[a] // length of source
          memory.copy(a, b, Math.min(c, d) + 1)
          break

        case PCode.test:
          b = memory.stack[memory.stack.length - 1] // leave the stack unchanged
          a = memory.stack[memory.stack.length - 2]
          if ((a < 0) || (a >= memory.main[b])) {
            // TODO: make range check a runtime option
            halt()
            throw error('Array index out of range.')
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
          memory.returnStack.push(line + 1)
          line = pcode[line][code + 1] - 1
          code = -1
          break

        case PCode.retn:
          line = memory.returnStack.pop()
          code = -1
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
          a = memory.stack.pop()
          memory.memoryStack.push(a)
          memory.stackTop = Math.max(a, memory.stackTop)
          break

        case PCode.memc:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          c = memory.memoryStack.pop()
          // heap overflow check
          if (c + b > options.stackSize) {
            halt()
            throw error('Memory stack has overflowed into memory heap. Probable cause is unterminated recursion.')
          }
          memory.memoryStack.push(memory.main[a])
          memory.stackTop = Math.max(memory.main[a], memory.stackTop)
          memory.main[a] = c
          memory.memoryStack.push(c + b)
          memory.stackTop = Math.max(c + b, memory.stackTop)
          code += 2
          break

        case PCode.memr:
          memory.memoryStack.pop()
          a = pcode[line][code + 1]
          b = memory.memoryStack.pop()
          memory.memoryStack.push(memory.main[a])
          memory.stackTop = Math.max(memory.main[a], memory.stackTop)
          memory.main[a] = b
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
          reply('canvas', vcanvas)
          memory.turtx = Math.round(vcanvas.startx + (vcanvas.sizex / 2))
          memory.turty = Math.round(vcanvas.starty + (vcanvas.sizey / 2))
          memory.turtd = 0
          reply('turtxChanged', memory.turtx)
          reply('turtyChanged', memory.turty)
          reply('turtdChanged', memory.turtd)
          memory.coords.push([memory.turtx, memory.turty])
          drawCount = options.drawCountMax // force update
          break

        case PCode.reso:
          b = memory.stack.pop()
          a = memory.stack.pop()
          if (Math.min(a, b) <= options.smallSize) {
            a = a * 2
            b = b * 2
            vcanvas.doubled = true
          } else {
            vcanvas.doubled = false
          }
          vcanvas.width = a
          vcanvas.height = b
          reply('resolution', { width: a, height: b })
          reply('blank', '#FFFFFF')
          drawCount = options.drawCountMax // force update
          break

        case PCode.udat:
          a = (memory.stack.pop() !== 0)
          memory.update = a
          if (a) {
            drawCount = options.drawCountMax // force update
          }
          break

        case PCode.seed:
          a = memory.stack.pop()
          if (a === 0) {
            memory.stack.push(memory.seed)
          } else {
            memory.seed = a
            memory.stack.push(a)
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
          reply('memoryDumped', dump())
          if (options.showMemory) {
            reply('showMemory')
          }
          break

        case PCode.peek:
          a = memory.stack.pop()
          memory.stack.push(memory.main[a])
          break

        case PCode.poke:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.main[a] = b
          break

        // 0xA0s - text output, timing
        case PCode.inpt:
          a = memory.stack.pop()
          if (a < 0) {
            memory.stack.push(memory.query[-a])
          } else {
            memory.stack.push(memory.keys[a])
          }
          break

        case PCode.iclr:
          a = memory.stack.pop()
          if (a < 0) {
            // reset query value
            memory.query[-a] = -1
          } else if (a === 0) {
            // reset keybuffer
            memory.main[memory.main[1] + 1] = memory.main[1] + 3
            memory.main[memory.main[1] + 2] = memory.main[1] + 3
          } else {
            // reset key value
            memory.keys[a] = -1
          }
          break

        case PCode.bufr:
          a = memory.stack.pop()
          if (a > 0) {
            b = memory.heapTemp + 4
            memory.stack.push(memory.heapTemp + 1)
            memory.main[memory.heapTemp + 1] = b + a
            memory.main[memory.heapTemp + 2] = b
            memory.main[memory.heapTemp + 3] = b
            memory.main.fill(0, b, b + a)
            memory.heapTemp = b + a
            memory.heapMax = Math.max(memory.heapTemp, memory.heapMax)
          }
          break

        case PCode.read:
          a = memory.stack.pop() // maximum number of characters to read
          b = memory.main[1] // the address of the buffer
          c = memory.main[memory.main[1]] // the address of the end of the buffer
          d = '' // the string read from the buffer
          e = memory.main[b + 1]
          f = memory.main[b + 2]
          if (a === 0) {
            while (e !== f) {
              d += String.fromCharCode(memory.main[e])
              e = (e < c)
                ? e + 1
                : c + 3 // loop back to the start
            }
          } else {
            while (e !== f && d.length <= a) {
              d += String.fromCharCode(memory.main[e])
              if (e < c) {
                e += 1
              } else {
                e = c + 3 // loop back to the start
              }
            }
            memory.main[b + 1] = e
          }
          memory.makeHeapString(d)
          break

        case PCode.rdln:
          a = Math.pow(2, 31) - 1 // as long as possible
          code += 1
          if (code === pcode[line].length) {
            line += 1
            code = 0
          }
          b = setTimeout(execute, a, pcode, line, code, options)
          memory.readline = readlineProto.bind(null, b, pcode, line, code, options)
          window.addEventListener('keyup', memory.readline)
          return

        case PCode.kech:
          a = (memory.stack.pop() !== 0)
          memory.keyecho = a
          break

        case PCode.outp:
          c = (memory.stack.pop() !== 0)
          b = memory.stack.pop()
          a = (memory.stack.pop() !== 0)
          reply('output', { clear: a, colour: hex(b) })
          if (c) {
            reply('showOutput')
          } else {
            reply('showCanvas')
          }
          break

        case PCode.cons:
          b = memory.stack.pop()
          a = (memory.stack.pop() !== 0)
          reply('console', { clear: a, colour: hex(b) })
          break

        case PCode.prnt:
          c = memory.stack.pop()
          b = memory.stack.pop()
          a = memory.getHeapString(memory.stack.pop())
          reply('print', { turtle: turtle(), string: a, font: b, size: c })
          break

        case PCode.writ:
          a = memory.getHeapString(memory.stack.pop())
          reply('write', a)
          reply('log', a)
          if (options.showOutput) {
            reply('showOutput')
          }
          break

        case PCode.newl:
          reply('write', '\n')
          reply('log', '\n')
          break

        case PCode.curs:
          a = memory.stack.pop()
          reply('cursor', a)
          break

        case PCode.time:
          a = Date.now()
          a = a - memory.startTime
          memory.stack.push(a)
          break

        case PCode.tset:
          a = Date.now()
          b = memory.stack.pop()
          memory.startTime = a - b
          break

        case PCode.wait:
          a = memory.stack.pop()
          code += 1
          if (code === pcode[line].length) {
            line += 1
            code = 0
          }
          setTimeout(execute, a, pcode, line, code, options)
          return

        case PCode.tdet:
          b = memory.stack.pop()
          a = memory.stack.pop()
          memory.stack.push(0)
          code += 1
          if (code === pcode[line].length) {
            line += 1
            code = 0
          }
          c = setTimeout(execute, a, pcode, line, code, options)
          memory.detect = detectProto.bind(null, b, c, pcode, line, code, options)
          window.addEventListener('keyup', memory.detect)
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
          halt()
          throw error('File processing has not yet been implemented in the online Turtle System. We are working on introducing this very soon. In the meantime, please run this program using the downloable system to run this program.')

        // anything else is an error
        default:
          halt()
          console.log(line)
          console.log(code)
          throw error(`Unknown PCode 0x${pcode[line][code].toString(16)}.`)
      }
      codeCount += 1
      code += 1
      if (!pcode[line]) {
        halt()
        throw error('The program has tried to jump to a line that does not exist. This is either a bug in our compiler, or in your assembled code.')
      }
      if (code === pcode[line].length) { // line wrap
        line += 1
        code = 0
      }
    }
  } catch (error) {
    reply('error', error)
  }
  // setTimeout (with no delay) instead of direct recursion means the function will return and the
  // canvas will be updated
  setTimeout(execute, 0, pcode, line, code, options)
}

// create a machine runtime error
function error (message: string): MachineError {
  return new MachineError(message)
}

// prototype key detection function
function detectProto (keyCode, timeoutID, pcode, line, code, options, event) {
  const pressedKey = event.keyCode || event.charCode
  if (pressedKey === keyCode) {
    memory.stack.pop()
    memory.stack.push(-1) // -1 for true
    window.clearTimeout(timeoutID)
    execute(pcode, line, code, options)
  }
}

// prototype line reading function
function readlineProto (timeoutID, pcode, line, code, options, event) {
  const pressedKey = event.keyCode || event.charCode
  if (pressedKey === 13) {
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
function turtle () {
  return ({
    x: turtx(memory.turtx),
    y: turty(memory.turty),
    d: memory.turtd,
    a: memory.turta,
    p: turtt(memory.turtt),
    c: hex(memory.turtc)
  })
}

// convert turtx to virtual canvas coordinate
function turtx (x) {
  const exact = ((x - vcanvas.startx) * vcanvas.width) / vcanvas.sizex
  return vcanvas.doubled ? Math.round(exact) + 1 : Math.round(exact)
}

// convert turty to virtual canvas coordinate
function turty (y) {
  const exact = ((y - vcanvas.starty) * vcanvas.height) / vcanvas.sizey
  return vcanvas.doubled ? Math.round(exact) + 1 : Math.round(exact)
}

// convert turtt to virtual canvas thickness
function turtt (t) {
  return vcanvas.doubled ? t * 2 : t
}

// map turtle coordinates to virtual turtle coordinates
function vcoords ([x, y]) {
  return [turtx(x), turty(y)]
}

// convert x to virtual canvas coordinate
function virtx (x) {
  const { left, width } = canvas.getBoundingClientRect()
  const exact = (((x - left) * vcanvas.sizex) / width) + vcanvas.startx
  return Math.round(exact)
}

// convert y to virtual canvas coordinate
function virty (y) {
  const { height, top } = canvas.getBoundingClientRect()
  const exact = (((y - top) * vcanvas.sizey) / height) + vcanvas.starty
  return Math.round(exact)
}

// convert a number to css colour #000000 format
function hex (colour) {
  return `#${padded(colour.toString(16))}`
}

// mix two colours
function mixBytes (byte1, byte2, proportion1, proportion2) {
  return Math.round(((byte1 * proportion1) + (byte2 * proportion2)) / (proportion1 + proportion2))
}

// padd a string with leading zeros
function padded (string) {
  return ((string.length < 6) ? padded(`0${string}`) : string)
}
