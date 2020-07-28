/*
 * The Virtual Turtle Machine.
 */
import { colours } from '../definitions/colours'
import { PCode } from '../definitions/pcodes'

// machine constants
const turtxIndex = 1
const turtyIndex = 2
const turtdIndex = 3
const turtaIndex = 4
const turttIndex = 5
const turtcIndex = 6

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
  const stack = memory.slice(0, markers.stackTop + 1)
  const heap = memory.slice(markers.heapBase, markers.heapMax)
  return { stack, heap, heapBase: markers.heapBase }
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
export function run (pcode, options) {
  // reset machine components
  reset()
  // optionally show the canvas
  if (options.showCanvas) {
    reply('showCanvas')
  }
  // set up the memory arrays
  memory.length = 0x200000
  keys.length = 0x100
  query.length = 0x10
  memory.fill(0)
  keys.fill(-1)
  query.fill(-1)
  // setup the stacks
  coords.length = 0
  stack.length = 0
  memoryStack.length = 0
  returnStack.length = 0
  subroutineStack.length = 0
  // set up stack top and markers.heapBase markers
  markers.stackTop = 0
  markers.heapGlobal = -1
  markers.heapBase = options.stackSize
  markers.heapTemp = markers.heapBase
  markers.heapPerm = markers.heapTemp
  markers.heapMax = markers.heapTemp
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
  // setup runtime variables (global to this module)
  runtime.startTime = Date.now()
  runtime.update = true
  runtime.keyecho = true
  runtime.detect = null
  runtime.readline = null
  runtime.seed = Date.now()
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
    window.removeEventListener('keyup', runtime.detect)
    window.removeEventListener('keyup', runtime.readline)
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
function reply (message, data) {
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

// the machine memory (global, so they don't have to be passed around all the time)
const memory = []
const keys = []
const query = []
const coords = []
const stack = []
const memoryStack = []
const returnStack = []
const subroutineStack = []
const markers = {}
const vcanvas = {}
const runtime = {}

// window event listeners
function storeKey (event) {
  const pressedKey = event.keyCode || event.charCode
  // backspace
  if (pressedKey === 8) {
    event.preventDefault() // don't go back a page in the browser!
    const buffer = memory[1]
    if (buffer > 0) { // there is a keybuffer
      if (memory[buffer + 1] !== memory[buffer + 2]) { // the keybuffer has something in it
        if (memory[buffer + 2] === buffer + 3) {
          memory[buffer + 2] = memory[buffer] // go "back" to the end
        } else {
          memory[buffer + 2] -= 1 // go back one
        }
        if (runtime.keyecho) {
          reply('backspace')
        }
      }
      // put buffer length in keys array
      if (memory[buffer + 2] >= memory[buffer + 1]) {
        keys[0] = memory[buffer + 2] - memory[buffer + 1]
      } else {
        keys[0] = memory[buffer + 2] - memory[buffer + 1] + memory[buffer] - buffer - 2
      }
    }
  }
  // arrow keys
  if (pressedKey >= 37 && pressedKey <= 40) {
    event.preventDefault() // don't scroll the page
  }
  // normal case
  query[9] = pressedKey
  query[10] = 128
  if (event.shiftKey) query[10] += 8
  if (event.altKey) query[10] += 16
  if (event.ctrlKey) query[10] += 32
  keys[pressedKey] = query[10]
}

function releaseKey (event) {
  const pressedKey = event.keyCode || event.charCode
  // keyup should set positive value to negative; use Math.abs to ensure the result is negative,
  // in case two keydown events fire close together, before the first keyup event fires
  query[9] = -Math.abs(query[9])
  query[10] = -Math.abs(query[10])
  keys[pressedKey] = -Math.abs(keys[pressedKey])
}

function putInBuffer (event) {
  const pressedKey = event.keyCode || event.charCode
  const buffer = memory[1]
  if (buffer > 0) { // there is a keybuffer
    let next = 0
    if (memory[buffer + 2] === memory[buffer]) {
      next = buffer + 3 // loop back round to the start
    } else {
      next = memory[buffer + 2] + 1
    }
    if (next !== memory[buffer + 1]) {
      memory[memory[buffer + 2]] = pressedKey
      memory[buffer + 2] = next
      // put buffer length in keys array
      if (memory[buffer + 2] >= memory[buffer + 1]) {
        keys[0] = memory[buffer + 2] - memory[buffer + 1]
      } else {
        keys[0] = memory[buffer + 2] - memory[buffer + 1] + memory[buffer] - buffer - 2
      }
      // maybe show in the console
      if (runtime.keyecho) {
        reply('log', String.fromCharCode(pressedKey))
      }
    }
  }
}

// store mouse coordinates in virtual memory
function storeMouseXY (event) {
  switch (event.type) {
    case 'mousemove':
      query[7] = virtx(event.clientX)
      query[8] = virty(event.clientY)
      break

    case 'touchmove': // fallthrough
    case 'touchstart':
      query[7] = virtx(event.touches[0].clientX)
      query[8] = virty(event.touches[0].clientY)
      break
  }
}

// store mouse click coordinates in virtual memory
function storeClickXY (event) {
  const now = Date.now()
  query[4] = 128
  if (event.shiftKey) query[4] += 8
  if (event.altKey) query[4] += 16
  if (event.ctrlKey) query[4] += 32
  if (now - query[11] < 300) query[4] += 64 // double-click
  query[11] = now // save to check for next double-click
  switch (event.type) {
    case 'mousedown':
      query[5] = virtx(event.clientX)
      query[6] = virty(event.clientY)
      switch (event.button) {
        case 0:
          query[4] += 1
          query[1] = query[4]
          query[2] = -1
          query[3] = -1
          break

        case 1:
          query[4] += 4
          query[1] = -1
          query[2] = -1
          query[3] = query[4]
          break

        case 2:
          query[4] += 2
          query[1] = -1
          query[2] = query[4]
          query[3] = -1
          break
      }
      break

    case 'touchstart':
      query[5] = virtx(event.touches[0].clientX)
      query[6] = virty(event.touches[0].clientY)
      query[4] += 1
      query[1] = query[4]
      query[2] = -1
      query[3] = -1
      storeMouseXY(event)
      break
  }
}

// store mouse release coordinates in virtual memory
function releaseClickXY (event) {
  query[4] = -query[4]
  switch (event.type) {
    case 'mouseup':
      switch (event.button) {
        case 0:
          query[1] = -query[1]
          break

        case 1:
          query[2] = -query[3]
          break

        case 2:
          query[2] = -query[2]
          break
      }
      break

    case 'touchend':
      query[1] = -query[1]
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

  // in case of runtime.detect or runtime.readline, remove the event listeners the first time we carry on with the
  // program execution after they have been called
  window.removeEventListener('keyup', runtime.detect)
  window.removeEventListener('keyup', runtime.readline)

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
          a = stack.pop()
          stack.push(a, a)
          break

        case PCode.swap:
          b = stack.pop()
          a = stack.pop()
          stack.push(b, a)
          break

        case PCode.rota:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(b, c, a)
          break

        case PCode.incr:
          a = stack.pop()
          stack.push(a + 1)
          break

        case PCode.decr:
          a = stack.pop()
          stack.push(a - 1)
          break

        case PCode.mxin:
          stack.push(Math.pow(2, 31) - 1)
          break

        case PCode.rand:
          a = stack.pop()
          stack.push(Math.floor(random() * Math.abs(a)))
          break

        case PCode.hstr:
          a = getHeapString(stack.pop())
          makeHeapString(a)
          break

        case PCode.ctos:
          a = stack.pop()
          makeHeapString(String.fromCharCode(a))
          break

        case PCode.sasc:
          a = getHeapString(stack.pop())
          if (a.length === 0) {
            stack.push(0)
          } else {
            stack.push(a.charCodeAt(0))
          }
          break

        case PCode.itos:
          a = stack.pop()
          makeHeapString(a.toString())
          break

        case PCode.hexs:
          b = stack.pop()
          a = stack.pop().toString(16).toUpperCase()
          while (a.length < b) {
            a = '0' + a
          }
          makeHeapString(a)
          break

        case PCode.sval:
          c = stack.pop()
          b = stack.pop()
          a = getHeapString(b)
          if (a[0] === '#') {
            d = isNaN(parseInt(a.slice(1), 16)) ? c : parseInt(a.slice(1), 16)
          } else {
            d = isNaN(parseInt(a, 10)) ? c : parseInt(a, 10)
          }
          stack.push(d)
          break

        case PCode.qtos:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = (b / c)
          makeHeapString(a.toFixed(d))
          break

        case PCode.qval:
          c = stack.pop()
          b = stack.pop()
          a = getHeapString(stack.pop())
          d = isNaN(parseFloat(a)) ? c : parseFloat(a)
          stack.push(Math.round(d * b))
          break

        // 0x10s - Boolean operators, integer operators
        case PCode.not:
          a = stack.pop()
          stack.push(~a)
          break

        case PCode.and:
          b = stack.pop()
          a = stack.pop()
          stack.push(a & b)
          break

        case PCode.or:
          b = stack.pop()
          a = stack.pop()
          stack.push(a | b)
          break

        case PCode.xor:
          b = stack.pop()
          a = stack.pop()
          stack.push(a ^ b)
          break

        case PCode.andl:
          b = stack.pop()
          a = stack.pop()
          stack.push(a && b)
          break

        case PCode.orl:
          b = stack.pop()
          a = stack.pop()
          stack.push(a || b)
          break

        case PCode.shft:
          b = stack.pop()
          a = stack.pop()
          if (b < 0) {
            stack.push(a << -b)
          } else {
            stack.push(a >> b)
          }
          break

        case PCode.neg:
          a = stack.pop()
          stack.push(-a)
          break

        case PCode.abs:
          a = stack.pop()
          stack.push(Math.abs(a))
          break

        case PCode.sign:
          a = stack.pop()
          stack.push(Math.sign(a))
          break

        case PCode.plus:
          b = stack.pop()
          a = stack.pop()
          stack.push(a + b)
          break

        case PCode.subt:
          b = stack.pop()
          a = stack.pop()
          stack.push(a - b)
          break

        case PCode.mult:
          b = stack.pop()
          a = stack.pop()
          stack.push(a * b)
          break

        case PCode.divr:
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(a / b))
          break

        case PCode.div:
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.floor(a / b))
          break

        case PCode.mod:
          b = stack.pop()
          a = stack.pop()
          stack.push(a % b)
          break

        // 0x20s - comparison operators
        case PCode.eqal:
          b = stack.pop()
          a = stack.pop()
          stack.push(a === b ? -1 : 0)
          break

        case PCode.noeq:
          b = stack.pop()
          a = stack.pop()
          stack.push(a !== b ? -1 : 0)
          break

        case PCode.less:
          b = stack.pop()
          a = stack.pop()
          stack.push(a < b ? -1 : 0)
          break

        case PCode.more:
          b = stack.pop()
          a = stack.pop()
          stack.push(a > b ? -1 : 0)
          break

        case PCode.lseq:
          b = stack.pop()
          a = stack.pop()
          stack.push(a <= b ? -1 : 0)
          break

        case PCode.mreq:
          b = stack.pop()
          a = stack.pop()
          stack.push(a >= b ? -1 : 0)
          break

        case PCode.maxi:
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.max(a, b))
          break

        case PCode.mini:
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.min(a, b))
          break

        case PCode.seql:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(a === b ? -1 : 0)
          break

        case PCode.sneq:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(a !== b ? -1 : 0)
          break

        case PCode.sles:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(a < b ? -1 : 0)
          break

        case PCode.smor:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(a > b ? -1 : 0)
          break

        case PCode.sleq:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(a <= b ? -1 : 0)
          break

        case PCode.smeq:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(a >= b ? -1 : 0)
          break

        case PCode.smax:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          makeHeapString(Math.max(a, b))
          break

        case PCode.smin:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          makeHeapString(Math.min(a, b))
          break

        // 0x30s - pseudo-real operators
        case PCode.divm:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round((a / b) * c))
          break

        case PCode.sqrt:
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.sqrt(a) * b))
          break

        case PCode.hyp:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.sqrt((a * a) + (b * b)) * c))
          break

        case PCode.root:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.pow(a / b, 1 / c) * d))
          break

        case PCode.powr:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.pow(a / b, c) * d))
          break

        case PCode.log:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round((Math.log(a / b) / Math.LN10) * c))
          break

        case PCode.alog:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.pow(10, a / b) * c))
          break

        case PCode.ln:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.log(a / b) * c))
          break

        case PCode.exp:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.exp(a / b) * c))
          break

        case PCode.sin:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = (b / c) * (2 * Math.PI) / memory[memory[0] + turtaIndex]
          stack.push(Math.round(Math.sin(a) * d))
          break

        case PCode.cos:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = (b / c) * (2 * Math.PI) / memory[memory[0] + turtaIndex]
          stack.push(Math.round(Math.cos(a) * d))
          break

        case PCode.tan:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = (b / c) * (2 * Math.PI) / memory[memory[0] + turtaIndex]
          stack.push(Math.round(Math.tan(a) * d))
          break

        case PCode.asin:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = memory[memory[0] + turtaIndex] / (2 * Math.PI)
          stack.push(Math.round(Math.asin(b / c) * d * a))
          break

        case PCode.acos:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = memory[memory[0] + turtaIndex] / (2 * Math.PI)
          stack.push(Math.round(Math.acos(b / c) * d * a))
          break

        case PCode.atan:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = memory[memory[0] + turtaIndex] / (2 * Math.PI)
          stack.push(Math.round(Math.atan2(b, c) * d * a))
          break

        case PCode.pi:
          a = stack.pop()
          stack.push(Math.round(Math.PI * a))
          break

        // 0x40s - string operators
        case PCode.scat:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          makeHeapString(a + b)
          break

        case PCode.slen:
          a = getHeapString(stack.pop())
          stack.push(a.length)
          break

        case PCode.case:
          b = stack.pop()
          a = getHeapString(stack.pop())
          switch (b) {
            case 1:
              // lowercase
              makeHeapString(a.toLowerCase())
              break

            case 2:
              // uppercase
              makeHeapString(a.toUpperCase())
              break

            case 3:
              // capitalise first letter
              if (a.length > 0) {
                makeHeapString(a[0].toUpperCase() + a.slice(0))
              } else {
                makeHeapString(a)
              }
              break

            case 4:
              // capitalise first letter of each word
              a = a.split(' ').map(x => x[0].toUpperCase() + x.slice(0)).join(' ')
              makeHeapString(a)
              break

            case 5:
              // TODO: swap case
              a = a.split('').map(x => (x === x.toLowerCase()) ? x.toUpperCase() : x.toLowerCase()).join('')
              makeHeapString(a)
              break

            default:
              // this should be impossible
              makeHeapString(a)
              break
          }
          break

        case PCode.copy:
          c = stack.pop()
          b = stack.pop()
          a = getHeapString(stack.pop())
          makeHeapString(a.substr(b - 1, c))
          break

        case PCode.dels:
          d = stack.pop()
          c = stack.pop()
          b = getHeapString(stack.pop())
          a = b.substr(0, c - 1) + b.substr((c - 1) + d)
          makeHeapString(a)
          break

        case PCode.inss:
          d = stack.pop()
          c = getHeapString(stack.pop())
          b = getHeapString(stack.pop())
          a = c.substr(0, d - 1) + b + c.substr(d - 1)
          makeHeapString(a)
          break

        case PCode.poss:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(b.indexOf(a) + 1)
          break

        case PCode.repl:
          d = stack.pop()
          c = getHeapString(stack.pop())
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          if (d > 0) {
            while (d > 0) {
              a = a.replace(b, c)
              d = d - 1
            }
            makeHeapString(a)
          } else {
            makeHeapString(a.replace(new RegExp(b, 'g'), c))
          }
          break

        case PCode.spad:
          d = stack.pop()
          c = Math.abs(d)
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          while ((a.length + b.length) <= c) {
            if (d < 0) {
              a = a + b
            } else {
              a = b + a
            }
          }
          makeHeapString(a)
          break

        case PCode.trim:
          a = getHeapString(stack.pop())
          makeHeapString(a.trim())
          break

        // 0x50s - turtle settings and movement
        case PCode.home:
          a = vcanvas.startx + (vcanvas.sizex / 2)
          b = vcanvas.starty + (vcanvas.sizey / 2)
          memory[memory[0] + turtxIndex] = Math.round(a)
          memory[memory[0] + turtyIndex] = Math.round(b)
          memory[memory[0] + turtdIndex] = 0
          reply('turtxChanged', memory[memory[0] + turtxIndex])
          reply('turtyChanged', memory[memory[0] + turtyIndex])
          reply('turtdChanged', memory[memory[0] + turtdIndex])
          coords.push([memory[memory[0] + turtxIndex], memory[memory[0] + turtyIndex]])
          break

        case PCode.setx:
          a = stack.pop()
          memory[memory[0] + turtxIndex] = a
          reply('turtxChanged', a)
          coords.push([memory[memory[0] + turtxIndex], memory[memory[0] + turtyIndex]])
          break

        case PCode.sety:
          a = stack.pop()
          memory[memory[0] + turtyIndex] = a
          reply('turtyChanged', a)
          coords.push([memory[memory[0] + turtxIndex], memory[memory[0] + turtyIndex]])
          break

        case PCode.setd:
          a = stack.pop() % memory[memory[0] + turtaIndex]
          memory[memory[0] + turtdIndex] = a
          reply('turtdChanged', a)
          break

        case PCode.angl:
          a = stack.pop()
          if (memory[memory[0] + turtaIndex] === 0) {
            // this should only happen at the start of the program before angles is set for the first time
            memory[memory[0] + turtaIndex] = a
          }
          if (a === 0) {
            // never let angles be set to zero
            halt()
            throw error('Angles cannot be set to zero.')
          }
          b = Math.round(a + memory[memory[0] + turtdIndex] * a / memory[memory[0] + turtaIndex])
          memory[memory[0] + turtdIndex] = b % a
          memory[memory[0] + turtaIndex] = a
          reply('turtdChanged', b % a)
          reply('turtaChanged', a)
          break

        case PCode.thik:
          a = stack.pop()
          b = Math.abs(a)
          c = a < 0
          d = memory[memory[0] + turttIndex] < 0
          if (c) { // reverse pen status
            memory[memory[0] + turttIndex] = d ? b : -b
          } else { // leave pen status as it is
            memory[memory[0] + turttIndex] = d ? -b : b
          }
          reply('turttChanged', memory[memory[0] + turttIndex])
          break

        case PCode.colr:
          a = stack.pop()
          memory[memory[0] + turtcIndex] = a
          reply('turtcChanged', hex(a))
          break

        case PCode.pen:
          a = (stack.pop() !== 0) // pen up or down
          b = Math.abs(memory[memory[0] + turttIndex]) // current thickness
          c = a ? b : -b // positive or negative depending on whether pen is down or up
          memory[memory[0] + turttIndex] = c
          reply('turttChanged', c)
          break

        case PCode.toxy:
          b = stack.pop()
          a = stack.pop()
          memory[memory[0] + turtxIndex] = a
          memory[memory[0] + turtyIndex] = b
          reply('turtxChanged', a)
          reply('turtyChanged', b)
          coords.push([a, b])
          break

        case PCode.mvxy:
          b = stack.pop() + memory[memory[0] + turtyIndex]
          a = stack.pop() + memory[memory[0] + turtxIndex]
          memory[memory[0] + turtxIndex] = a
          memory[memory[0] + turtyIndex] = b
          reply('turtxChanged', a)
          reply('turtyChanged', b)
          coords.push([a, b])
          break

        case PCode.drxy:
          b = stack.pop() + memory[memory[0] + turtyIndex]
          a = stack.pop() + memory[memory[0] + turtxIndex]
          if (memory[memory[0] + turttIndex] > 0) {
            reply('line', { turtle: turtle(), x: turtx(a), y: turty(b) })
            if (runtime.update) {
              drawCount += 1
            }
          }
          memory[memory[0] + turtxIndex] = a
          memory[memory[0] + turtyIndex] = b
          reply('turtxChanged', a)
          reply('turtyChanged', b)
          coords.push([a, b])
          break

        case PCode.fwrd:
          c = stack.pop() // distance
          d = memory[memory[0] + turtdIndex] // turtle direction
          // work out final y coordinate
          b = Math.cos(d * Math.PI / (memory[memory[0] + turtaIndex] / 2))
          b = -Math.round(b * c)
          b += memory[memory[0] + turtyIndex]
          // work out final x coordinate
          a = Math.sin(d * Math.PI / (memory[memory[0] + turtaIndex] / 2))
          a = Math.round(a * c)
          a += memory[memory[0] + turtxIndex]
          if (memory[memory[0] + turttIndex] > 0) {
            reply('line', { turtle: turtle(), x: turtx(a), y: turty(b) })
            if (runtime.update) {
              drawCount += 1
            }
          }
          memory[memory[0] + turtxIndex] = a
          memory[memory[0] + turtyIndex] = b
          reply('turtxChanged', a)
          reply('turtyChanged', b)
          coords.push([a, b])
          break

        case PCode.back:
          c = stack.pop() // distance
          d = memory[memory[0] + turtdIndex] // turtle direction
          // work out final y coordinate
          b = Math.cos(d * Math.PI / (memory[memory[0] + turtaIndex] / 2))
          b = Math.round(b * c)
          b += memory[memory[0] + turtyIndex]
          // work out final x coordinate
          a = Math.sin(d * Math.PI / (memory[memory[0] + turtaIndex] / 2))
          a = -Math.round(a * c)
          a += memory[memory[0] + turtxIndex]
          if (memory[memory[0] + turttIndex] > 0) {
            reply('line', { turtle: turtle(), x: turtx(a), y: turty(b) })
            if (runtime.update) {
              drawCount += 1
            }
          }
          memory[memory[0] + turtxIndex] = a
          memory[memory[0] + turtyIndex] = b
          reply('turtxChanged', a)
          reply('turtyChanged', b)
          coords.push([a, b])
          break

        case PCode.left:
          a = (memory[memory[0] + turtdIndex] - stack.pop()) % memory[memory[0] + turtaIndex]
          memory[memory[0] + turtdIndex] = a
          reply('turtdChanged', a)
          break

        case PCode.rght:
          a = (memory[memory[0] + turtdIndex] + stack.pop()) % memory[memory[0] + turtaIndex]
          memory[memory[0] + turtdIndex] = a
          reply('turtdChanged', a)
          break

        case PCode.turn:
          b = stack.pop()
          a = stack.pop()
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
          c = Math.round(c * memory[memory[0] + turtaIndex] / Math.PI / 2) % memory[memory[0] + turtaIndex]
          memory[memory[0] + turtdIndex] = c
          reply('turtdChanged', a)
          break

        // 0x60s - colour operators, shapes and fills
        case PCode.blnk:
          a = stack.pop()
          reply('blank', hex(a))
          if (runtime.update) {
            drawCount += 1
          }
          break

        case PCode.rcol:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          reply('flood', { x: a, y: b, c1: c, c2: 0, boundary: false })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case PCode.fill:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          reply('flood', { x: a, y: b, c1: c, c2: d, boundayr: true })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case PCode.pixc:
          c = stack.pop()
          b = stack.pop()
          a = context.getImageData(turtx(b), turty(c), 1, 1)
          stack.push((a.data[0] * 65536) + (a.data[1] * 256) + a.data[2])
          break

        case PCode.pixs:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          reply('pixset', { x: turtx(a), y: turty(b), c, doubled: vcanvas.doubled })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case PCode.rgb:
          a = stack.pop()
          a = a % 50
          if (a <= 0) a += 50
          a = colours[a - 1].value
          stack.push(a)
          break

        case PCode.mixc:
          d = stack.pop() // second proportion
          c = stack.pop() // first proportion
          b = stack.pop() // second colour
          a = stack.pop() // first colour
          e = mixBytes(Math.floor(a / 0x10000), Math.floor(b / 0x10000), c, d) // red byte
          f = mixBytes(Math.floor((a & 0xFF00) / 0x100), Math.floor((b & 0xFF00) / 0x100), c, d) // green byte
          g = mixBytes(a & 0xFF, b & 0xFF, c, d) // blue byte
          stack.push((e * 0x10000) + (f * 0x100) + g)
          break

        case PCode.rmbr:
          coords.push([memory[memory[0] + turtxIndex], memory[memory[0] + turtyIndex]])
          break

        case PCode.frgt:
          coords.length -= stack.pop()
          break

        case PCode.poly:
          c = stack.pop()
          b = coords.length
          a = (c > b) ? 0 : b - c
          reply('poly', { turtle: turtle(), coords: coords.slice(a, b).map(vcoords), fill: false })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case PCode.pfil:
          c = stack.pop()
          b = coords.length
          a = (c > b) ? 0 : b - c
          reply('poly', { turtle: turtle(), coords: coords.slice(a, b).map(vcoords), fill: true })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case PCode.circ:
          a = stack.pop()
          reply('arc', { turtle: turtle(), x: turtx(a + vcanvas.startx), y: turty(a + vcanvas.starty), fill: false })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case PCode.blot:
          a = stack.pop()
          reply('arc', { turtle: turtle(), x: turtx(a + vcanvas.startx), y: turty(a + vcanvas.starty), fill: true })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case PCode.elps:
          b = stack.pop()
          a = stack.pop()
          reply('arc', { turtle: turtle(), x: turtx(a + vcanvas.startx), y: turty(b + vcanvas.starty), fill: false })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case PCode.eblt:
          b = stack.pop()
          a = stack.pop()
          reply('arc', { turtle: turtle(), x: turtx(a + vcanvas.startx), y: turty(b + vcanvas.starty), fill: true })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case PCode.box:
          d = (stack.pop() !== 0) // border
          c = stack.pop() // fill colour
          b = memory[memory[0] + turtyIndex] + stack.pop() // end y coordinate
          a = memory[memory[0] + turtxIndex] + stack.pop() // end x coordinate
          reply('box', { turtle: turtle(), x: turtx(a), y: turty(b), fill: hex(c), border: d })
          if (runtime.update) {
            drawCount += 1
          }
          break

        // 0x70s - loading from stack, storing from stack, pointer and array operations
        case PCode.ldin:
          a = pcode[line][code + 1]
          stack.push(a)
          code += 1
          break

        case PCode.ldvg:
          a = pcode[line][code + 1]
          stack.push(memory[a])
          code += 1
          break

        case PCode.ldvv:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          stack.push(memory[memory[a] + b])
          code += 2
          break

        case PCode.ldvr:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          stack.push(memory[memory[memory[a] + b]])
          code += 2
          break

        case PCode.ldag:
          a = pcode[line][code + 1]
          stack.push(a)
          code += 1
          break

        case PCode.ldav:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          stack.push(memory[a] + b)
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
          makeHeapString(c)
          break

        case PCode.stvg:
          a = stack.pop()
          memory[pcode[line][code + 1]] = a
          code += 1
          break

        case PCode.stvv:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          c = stack.pop()
          memory[memory[a] + b] = c
          code += 2
          break

        case PCode.stvr:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          c = stack.pop()
          memory[memory[memory[a] + b]] = c
          code += 2
          break

        case PCode.lptr:
          a = stack.pop()
          stack.push(memory[a])
          break

        case PCode.sptr:
          b = stack.pop()
          a = stack.pop()
          memory[b] = a
          break

        case PCode.zptr:
          b = stack.pop()
          a = stack.pop()
          zero(a, b)
          break

        case PCode.cptr:
          c = stack.pop() // length
          b = stack.pop() // target
          a = stack.pop() // source
          copy(a, b, c)
          break

        case PCode.cstr:
          b = stack.pop() // target
          a = stack.pop() // source
          d = memory[b - 1] // maximum length of target
          c = memory[a] // length of source
          copy(a, b, Math.min(c, d) + 1)
          break

        case PCode.test:
          b = stack[stack.length - 1] // leave the stack unchanged
          a = stack[stack.length - 2]
          if ((a < 0) || (a >= memory[b])) {
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
          if (stack.pop() === 0) {
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
          if (markers.heapGlobal === -1) {
            markers.heapGlobal = markers.heapPerm
          }
          returnStack.push(line + 1)
          line = pcode[line][code + 1] - 1
          code = -1
          break

        case PCode.retn:
          line = returnStack.pop()
          code = -1
          break

        case PCode.pssr:
          subroutineStack.push(pcode[line][code + 1])
          code += 1
          break

        case PCode.plsr:
          subroutineStack.pop()
          break

        case PCode.psrj:
          stack.push(line + 1)
          break

        case PCode.plrj:
          returnStack.pop()
          line = (stack.pop() - 1)
          code = -1
          break

        case PCode.ldmt:
          stack.push(memoryStack.length - 1)
          break

        case PCode.stmt:
          a = stack.pop()
          memoryStack.push(a)
          markers.stackTop = Math.max(a, markers.stackTop)
          break

        case PCode.memc:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          c = memoryStack.pop()
          // heap overflow check
          if (c + b > options.stackSize) {
            halt()
            throw error('Memory stack has overflowed into memory heap. Probable cause is unterminated recursion.')
          }
          memoryStack.push(memory[a])
          markers.stackTop = Math.max(memory[a], markers.stackTop)
          memory[a] = c
          memoryStack.push(c + b)
          markers.stackTop = Math.max(c + b, markers.stackTop)
          code += 2
          break

        case PCode.memr:
          memoryStack.pop()
          a = pcode[line][code + 1]
          b = memoryStack.pop()
          memoryStack.push(memory[a])
          markers.stackTop = Math.max(memory[a], markers.stackTop)
          memory[a] = b
          code += 2
          break

        case PCode.hfix:
          markers.heapPerm = markers.heapTemp
          break

        case PCode.hclr:
          markers.heapTemp = markers.heapPerm
          break

        case PCode.hrst:
          if (markers.heapGlobal > -1) {
            markers.heapTemp = markers.heapGlobal
            markers.heapPerm = markers.heapGlobal
          }
          break

        // 0x90s - runtime variables, debugging
        case PCode.canv:
          vcanvas.sizey = stack.pop()
          vcanvas.sizex = stack.pop()
          vcanvas.starty = stack.pop()
          vcanvas.startx = stack.pop()
          reply('canvas', vcanvas)
          memory[memory[0] + turtxIndex] = Math.round(vcanvas.startx + (vcanvas.sizex / 2))
          memory[memory[0] + turtyIndex] = Math.round(vcanvas.starty + (vcanvas.sizey / 2))
          memory[memory[0] + turtdIndex] = 0
          reply('turtxChanged', memory[memory[0] + turtxIndex])
          reply('turtyChanged', memory[memory[0] + turtyIndex])
          reply('turtdChanged', memory[memory[0] + turtdIndex])
          coords.push([memory[memory[0] + turtxIndex], memory[memory[0] + turtyIndex]])
          drawCount = options.drawCountMax // force runtime.update
          break

        case PCode.reso:
          b = stack.pop()
          a = stack.pop()
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
          drawCount = options.drawCountMax // force runtime.update
          break

        case PCode.udat:
          a = (stack.pop() !== 0)
          runtime.update = a
          if (a) {
            drawCount = options.drawCountMax // force update
          }
          break

        case PCode.seed:
          a = stack.pop()
          if (a === 0) {
            stack.push(runtime.seed)
          } else {
            runtime.seed = a
            stack.push(a)
          }
          break

        case PCode.trac:
          // not implemented -
          // just pop the top off the stack
          stack.pop()
          break

        case PCode.memw:
          // not implemented -
          // just pop the top off the stack
          stack.pop()
          break

        case PCode.dump:
          reply('memoryDumped', dump())
          if (options.showMemory) {
            reply('showMemory')
          }
          break

        case PCode.peek:
          a = stack.pop()
          stack.push(memory[a])
          break

        case PCode.poke:
          b = stack.pop()
          a = stack.pop()
          memory[a] = b
          break

        // 0xA0s - text output, timing
        case PCode.inpt:
          a = stack.pop()
          if (a < 0) {
            stack.push(query[-a])
          } else {
            stack.push(keys[a])
          }
          break

        case PCode.iclr:
          a = stack.pop()
          if (a < 0) {
            // reset query value
            query[-a] = -1
          } else if (a === 0) {
            // reset keybuffer
            memory[memory[1] + 1] = memory[1] + 3
            memory[memory[1] + 2] = memory[1] + 3
          } else {
            // reset key value
            keys[a] = -1
          }
          break

        case PCode.bufr:
          a = stack.pop()
          if (a > 0) {
            b = markers.heapTemp + 4
            stack.push(markers.heapTemp + 1)
            memory[markers.heapTemp + 1] = b + a
            memory[markers.heapTemp + 2] = b
            memory[markers.heapTemp + 3] = b
            memory.fill(0, b, b + a)
            markers.heapTemp = b + a
            markers.heapMax = Math.max(markers.heapTemp, markers.heapMax)
          }
          break

        case PCode.read:
          a = stack.pop() // maximum number of characters to read
          b = memory[1] // the address of the buffer
          c = memory[memory[1]] // the address of the end of the buffer
          d = '' // the string read from the buffer
          e = memory[b + 1]
          f = memory[b + 2]
          if (a === 0) {
            while (e !== f) {
              d += String.fromCharCode(memory[e])
              e = (e < c)
                ? e + 1
                : c + 3 // loop back to the start
            }
          } else {
            while (e !== f && d.length <= a) {
              d += String.fromCharCode(memory[e])
              if (e < c) {
                e += 1
              } else {
                e = c + 3 // loop back to the start
              }
            }
            memory[b + 1] = e
          }
          makeHeapString(d)
          break

        case PCode.rdln:
          a = Math.pow(2, 31) - 1 // as long as possible
          code += 1
          if (code === pcode[line].length) {
            line += 1
            code = 0
          }
          b = setTimeout(execute, a, pcode, line, code, options)
          runtime.readline = readlineProto.bind(null, b, pcode, line, code, options)
          window.addEventListener('keyup', runtime.readline)
          return

        case PCode.kech:
          a = (stack.pop() !== 0)
          runtime.keyecho = a
          break

        case PCode.outp:
          c = (stack.pop() !== 0)
          b = stack.pop()
          a = (stack.pop() !== 0)
          reply('output', { clear: a, colour: hex(b) })
          if (c) {
            reply('showOutput')
          } else {
            reply('showCanvas')
          }
          break

        case PCode.cons:
          b = stack.pop()
          a = (stack.pop() !== 0)
          reply('console', { clear: a, colour: hex(b) })
          break

        case PCode.prnt:
          c = stack.pop()
          b = stack.pop()
          a = getHeapString(stack.pop())
          reply('print', { turtle: turtle(), string: a, font: b, size: c })
          break

        case PCode.writ:
          a = getHeapString(stack.pop())
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
          a = stack.pop()
          reply('cursor', a)
          break

        case PCode.time:
          a = Date.now()
          a = a - runtime.startTime
          stack.push(a)
          break

        case PCode.tset:
          a = Date.now()
          b = stack.pop()
          runtime.startTime = a - b
          break

        case PCode.wait:
          a = stack.pop()
          code += 1
          if (code === pcode[line].length) {
            line += 1
            code = 0
          }
          setTimeout(execute, a, pcode, line, code, options)
          return

        case PCode.tdet:
          b = stack.pop()
          a = stack.pop()
          stack.push(0)
          code += 1
          if (code === pcode[line].length) {
            line += 1
            code = 0
          }
          c = setTimeout(execute, a, pcode, line, code, options)
          runtime.detect = detectProto.bind(null, b, c, pcode, line, code, options)
          window.addEventListener('keyup', runtime.detect)
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
        case PCode.fwnl: // fallthrough
        case PCode.ffnd: // fallthrough
        case PCode.fdir: // fallthrough
        case PCode.fnxt: // fallthrough
        case PCode.fmov:
          // not yet implemented
          halt()
          console.log(line)
          console.log(code)
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
  // canvas will be runtime.updated
  setTimeout(execute, 0, pcode, line, code, options)
}

// create a machine runtime error
function error (message) {
  const err = new Error(message)
  err.type = 'Machine'
  return err
}

// make a string on the heap
function makeHeapString (string) {
  const stringArray = Array.from(string).map(c => c.charCodeAt(0))
  stack.push(markers.heapTemp + 1)
  markers.heapTemp += 1
  memory[markers.heapTemp] = string.length
  stringArray.forEach((code) => {
    markers.heapTemp += 1
    memory[markers.heapTemp] = code
  })
  markers.heapMax = Math.max(markers.heapTemp, markers.heapMax)
}

// get a string from the heap
function getHeapString (address) {
  const length = memory[address]
  const start = address + 1
  const charArray = memory.slice(start, start + length)
  const string = charArray.reduce((a, b) => a + String.fromCharCode(b), '')
  if (address + length + 1 > markers.heapPerm) {
    markers.heapTemp = address + length
  }
  return string
}

// fill a chunk of main memory with zeros
function zero (start, length) {
  if (length > 0) {
    memory[start] = 0
    zero(start + 1, length - 1)
  }
}

// copy one chunk of memory into another
function copy (source, target, length) {
  if (length > 0) {
    memory[target] = memory[source]
    copy(source + 1, target + 1, length - 1)
  }
}

// prototype key detection function
function detectProto (keyCode, timeoutID, pcode, line, code, options, event) {
  const pressedKey = event.keyCode || event.charCode
  if (pressedKey === keyCode) {
    stack.pop()
    stack.push(-1) // -1 for true
    window.clearTimeout(timeoutID)
    execute(pcode, line, code, options)
  }
}

// prototype line reading function
function readlineProto (timeoutID, pcode, line, code, options, event) {
  const pressedKey = event.keyCode || event.charCode
  if (pressedKey === 13) {
    // get heap string from the buffer, up to the first ENTER
    const bufferAddress = memory[1]
    const bufferEndAddress = memory[memory[1]]
    let string = ''
    let readNextAddress = memory[bufferAddress + 1]
    const readLastAddress = memory[bufferAddress + 2]
    while (readNextAddress !== readLastAddress && memory[readNextAddress] !== 13) {
      string += String.fromCharCode(memory[readNextAddress])
      readNextAddress = (readNextAddress < bufferEndAddress)
        ? readNextAddress + 1
        : bufferEndAddress + 3 // loop back to the start
    }
    // move past the ENTER
    memory[bufferAddress + 1] = (readNextAddress < bufferEndAddress)
      ? readNextAddress + 1
      : bufferEndAddress + 3 // loop back to the start
    // put the string on the heap
    makeHeapString(string)
    // clear the timeout and resume ordinary pcode execution
    window.clearTimeout(timeoutID)
    execute(pcode, line, code, options)
  }
}

// get current turtle properties
function turtle () {
  return ({
    x: turtx(memory[memory[0] + turtxIndex]),
    y: turty(memory[memory[0] + turtyIndex]),
    d: memory[memory[0] + turtdIndex],
    a: memory[memory[0] + turtaIndex],
    p: turtt(memory[memory[0] + turttIndex]),
    c: hex(memory[memory[0] + turtcIndex])
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

// generate a pseudo-random number
function random () {
  const x = Math.sin(runtime.seed++) * 10000
  return x - Math.floor(x)
}
