/*
 * The Virtual Turtle Machine.
 */
import colours from '../constants/colours.js'
import pc from '../constants/pc.js'

// machine constants
const turtxIndex = 1
const turtyIndex = 2
const turtdIndex = 3
const turtaIndex = 4
const turtpIndex = 5
const turtcIndex = 6

// the canvas and its 2d drawing context
// the canvas element will send this to the machine when it's ready
let canvas, context

// function for "sending" signals to this module
export function send (signal, data) {
  switch (signal) {
    case 'canvas-context-ready':
      canvas = data.canvas
      context = data.context
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

// run the machine
export function run (pcode, options) {
  // clear the console and output
  reply('resolution', { width: 1000, height: 1000 })
  reply('console', { clear: true, colour: '#FFFFFF' })
  reply('output', { clear: true, colour: '#FFFFFF' })
  // optionally show the canvas
  if (options.showCanvas) {
    reply('show-canvas')
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
  reply('machine-started')
  // execute the first block of code (which will in turn trigger execution of the next block)
  execute(pcode, 0, 0, options)
}

// halt the machine
export function halt () {
  // remove event listeners
  window.removeEventListener('keydown', storeKey)
  window.removeEventListener('keyup', releaseKey)
  window.removeEventListener('keypress', putInBuffer)
  window.removeEventListener('keyup', runtime.detect)
  window.removeEventListener('keydown', runtime.readline)
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
  reply('machine-stopped')
}

// play the machine
export function play () {
  status.paused = false
  reply('machine-unpaused')
}

// pause the machine
export function pause () {
  status.paused = true
  reply('machine-paused')
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
  window.removeEventListener('keydown', runtime.readline)

  // execute as much code as possible
  let drawCount = 0
  let codeCount = 0
  let a, b, c, d, e, f, g // miscellanous variables for working things out on the fly
  try {
    while (drawCount < options.drawCountMax && (codeCount <= options.codeCountMax)) {
      switch (pcode[line][code]) {
        // 0x0 - basic stack operations, conversion operators
        case pc.null:
          break

        case pc.dupl:
          a = stack.pop()
          stack.push(a, a)
          break

        case pc.swap:
          b = stack.pop()
          a = stack.pop()
          stack.push(b, a)
          break

        case pc.rota:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(b, c, a)
          break

        case pc.incr:
          a = stack.pop()
          stack.push(a + 1)
          break

        case pc.decr:
          a = stack.pop()
          stack.push(a - 1)
          break

        case pc.mxin:
          stack.push(Math.pow(2, 31) - 1)
          break

        case pc.rand:
          a = stack.pop()
          stack.push(Math.floor(random() * Math.abs(a)))
          break

        case pc.hstr:
          a = getHeapString(stack.pop())
          makeHeapString(a)
          break

        case pc.ctos:
          a = stack.pop()
          makeHeapString(String.fromCharCode(a))
          break

        case pc.sasc:
          a = getHeapString(stack.pop())
          if (a.length === 0) {
            stack.push(0)
          } else {
            stack.push(a.charCodeAt(0))
          }
          break

        case pc.itos:
          a = stack.pop()
          makeHeapString(a.toString())
          break

        case pc.hexs:
          b = stack.pop()
          a = stack.pop().toString(16).toUpperCase()
          while (a.length < b) {
            a = '0' + a
          }
          makeHeapString(a)
          break

        case pc.sval:
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

        case pc.qtos:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = (b / c)
          makeHeapString(a.toFixed(d))
          break

        case pc.qval:
          c = stack.pop()
          b = stack.pop()
          a = getHeapString(stack.pop())
          d = isNaN(parseFloat(a)) ? c : parseFloat(a)
          stack.push(Math.round(d * b))
          break

        // 0x10s - Boolean operators, integer operators
        case pc.not:
          a = stack.pop()
          stack.push(~a)
          break

        case pc.and:
          b = stack.pop()
          a = stack.pop()
          stack.push(a & b)
          break

        case pc.or:
          b = stack.pop()
          a = stack.pop()
          stack.push(a | b)
          break

        case pc.xor:
          b = stack.pop()
          a = stack.pop()
          stack.push(a ^ b)
          break

        case pc.andl:
          b = stack.pop()
          a = stack.pop()
          stack.push(a && b)
          break

        case pc.orl:
          b = stack.pop()
          a = stack.pop()
          stack.push(a || b)
          break

        case pc.shft:
          b = stack.pop()
          a = stack.pop()
          if (b < 0) {
            stack.push(a << -b)
          } else {
            stack.push(a >> b)
          }
          break

        case pc.neg:
          a = stack.pop()
          stack.push(-a)
          break

        case pc.abs:
          a = stack.pop()
          stack.push(Math.abs(a))
          break

        case pc.sign:
          a = stack.pop()
          stack.push(Math.sign(a))
          break

        case pc.plus:
          b = stack.pop()
          a = stack.pop()
          stack.push(a + b)
          break

        case pc.subt:
          b = stack.pop()
          a = stack.pop()
          stack.push(a - b)
          break

        case pc.mult:
          b = stack.pop()
          a = stack.pop()
          stack.push(a * b)
          break

        case pc.divr:
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(a / b))
          break

        case pc.div:
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.floor(a / b))
          break

        case pc.mod:
          b = stack.pop()
          a = stack.pop()
          stack.push(a % b)
          break

        // 0x20s - comparison operators
        case pc.eqal:
          b = stack.pop()
          a = stack.pop()
          stack.push(a === b ? -1 : 0)
          break

        case pc.noeq:
          b = stack.pop()
          a = stack.pop()
          stack.push(a !== b ? -1 : 0)
          break

        case pc.less:
          b = stack.pop()
          a = stack.pop()
          stack.push(a < b ? -1 : 0)
          break

        case pc.more:
          b = stack.pop()
          a = stack.pop()
          stack.push(a > b ? -1 : 0)
          break

        case pc.lseq:
          b = stack.pop()
          a = stack.pop()
          stack.push(a <= b ? -1 : 0)
          break

        case pc.mreq:
          b = stack.pop()
          a = stack.pop()
          stack.push(a >= b ? -1 : 0)
          break

        case pc.maxi:
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.max(a, b))
          break

        case pc.mini:
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.min(a, b))
          break

        case pc.seql:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(a === b ? -1 : 0)
          break

        case pc.sneq:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(a !== b ? -1 : 0)
          break

        case pc.sles:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(a < b ? -1 : 0)
          break

        case pc.smor:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(a > b ? -1 : 0)
          break

        case pc.sleq:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(a <= b ? -1 : 0)
          break

        case pc.smeq:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(a >= b ? -1 : 0)
          break

        case pc.smax:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          makeHeapString(Math.max(a, b))
          break

        case pc.smin:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          makeHeapString(Math.min(a, b))
          break

        // 0x30s - pseudo-real operators
        case pc.divm:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round((a / b) * c))
          break

        case pc.sqrt:
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.sqrt(a) * b))
          break

        case pc.hyp:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.sqrt((a * a) + (b * b)) * c))
          break

        case pc.root:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.pow(a / b, 1 / c) * d))
          break

        case pc.powr:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.pow(a / b, c) * d))
          break

        case pc.log:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round((Math.log(a / b) / Math.LN10) * c))
          break

        case pc.alog:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.pow(10, a / b) * c))
          break

        case pc.ln:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.log(a / b) * c))
          break

        case pc.exp:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          stack.push(Math.round(Math.exp(a / b) * c))
          break

        case pc.sin:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = (b / c) * (2 * Math.PI) / memory[memory[0] + turtaIndex]
          stack.push(Math.round(Math.sin(a) * d))
          break

        case pc.cos:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = (b / c) * (2 * Math.PI) / memory[memory[0] + turtaIndex]
          stack.push(Math.round(Math.cos(a) * d))
          break

        case pc.tan:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = (b / c) * (2 * Math.PI) / memory[memory[0] + turtaIndex]
          stack.push(Math.round(Math.tan(a) * d))
          break

        case pc.asin:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = memory[memory[0] + turtaIndex] / (2 * Math.PI)
          stack.push(Math.round(Math.asin(b / c) * d * a))
          break

        case pc.acos:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = memory[memory[0] + turtaIndex] / (2 * Math.PI)
          stack.push(Math.round(Math.acos(b / c) * d * a))
          break

        case pc.atan:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = memory[memory[0] + turtaIndex] / (2 * Math.PI)
          stack.push(Math.round(Math.atan2(b, c) * d * a))
          break

        case pc.pi:
          a = stack.pop()
          stack.push(Math.round(Math.PI * a))
          break

        // 0x40s - string operators
        case pc.scat:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          makeHeapString(a + b)
          break

        case pc.slen:
          a = getHeapString(stack.pop())
          stack.push(a.length)
          break

        case pc.case:
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

        case pc.copy:
          c = stack.pop()
          b = stack.pop()
          a = getHeapString(stack.pop())
          makeHeapString(a.substr(b - 1, c))
          break

        case pc.dels:
          d = stack.pop()
          c = stack.pop()
          b = getHeapString(stack.pop())
          a = b.substr(0, c - 1) + b.substr((c - 1) + d)
          makeHeapString(a)
          break

        case pc.inss:
          d = stack.pop()
          c = getHeapString(stack.pop())
          b = getHeapString(stack.pop())
          a = c.substr(0, d - 1) + b + c.substr(d - 1)
          makeHeapString(a)
          break

        case pc.poss:
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          stack.push(b.indexOf(a) + 1)
          break

        case pc.repl:
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

        case pc.spad:
          d = stack.pop()
          c = Math.abs(d)
          b = getHeapString(stack.pop())
          a = getHeapString(stack.pop())
          while ((a.length + b.length) < d) {
            if (d < 0) {
              a = b + a
            } else {
              a = a + b
            }
          }
          makeHeapString(a)
          break

        case pc.trim:
          a = getHeapString(stack.pop())
          makeHeapString(a.trim())
          break

        // 0x50s - turtle settings and movement
        case pc.home:
          a = vcanvas.startx + (vcanvas.sizex / 2)
          b = vcanvas.starty + (vcanvas.sizey / 2)
          memory[memory[0] + turtxIndex] = Math.round(a)
          memory[memory[0] + turtyIndex] = Math.round(b)
          memory[memory[0] + turtdIndex] = 0
          reply('turtx-changed', memory[memory[0] + turtxIndex])
          reply('turty-changed', memory[memory[0] + turtyIndex])
          reply('turtd-changed', memory[memory[0] + turtdIndex])
          coords.push([memory[memory[0] + turtxIndex], memory[memory[0] + turtyIndex]])
          break

        case pc.setx:
          a = stack.pop()
          memory[memory[0] + turtxIndex] = a
          reply('turtx-changed', a)
          coords.push([memory[memory[0] + turtxIndex], memory[memory[0] + turtyIndex]])
          break

        case pc.sety:
          a = stack.pop()
          memory[memory[0] + turtyIndex] = a
          reply('turty-changed', a)
          coords.push([memory[memory[0] + turtxIndex], memory[memory[0] + turtyIndex]])
          break

        case pc.setd:
          a = stack.pop() % memory[memory[0] + turtaIndex]
          memory[memory[0] + turtdIndex] = a
          reply('turtd-changed', a)
          break

        case pc.angl:
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
          reply('turtd-changed', b % a)
          reply('turta-changed', a)
          break

        case pc.thik:
          a = stack.pop()
          if ((a < 0) && (memory[memory[0] + turtpIndex] < 0)) {
            // negative value reverses pen status
            a = -a
          }
          memory[memory[0] + turtpIndex] = a
          reply('turtp-changed', a)
          break

        case pc.colr:
          a = stack.pop()
          memory[memory[0] + turtcIndex] = a
          reply('turtc-changed', hex(a))
          break

        case pc.pen:
          a = (stack.pop() !== 0) // pen up or down
          b = Math.abs(memory[memory[0] + turtpIndex]) // current thickness
          c = a ? b : -b // positive or negative depending on whether pen is down or up
          memory[memory[0] + turtpIndex] = c
          reply('turtp-changed', c)
          break

        case pc.toxy:
          b = stack.pop()
          a = stack.pop()
          memory[memory[0] + turtxIndex] = a
          memory[memory[0] + turtyIndex] = b
          reply('turtx-changed', a)
          reply('turty-changed', b)
          coords.push([a, b])
          break

        case pc.mvxy:
          b = stack.pop() + memory[memory[0] + turtyIndex]
          a = stack.pop() + memory[memory[0] + turtxIndex]
          memory[memory[0] + turtxIndex] = a
          memory[memory[0] + turtyIndex] = b
          reply('turtx-changed', a)
          reply('turty-changed', b)
          coords.push([a, b])
          break

        case pc.drxy:
          b = stack.pop() + memory[memory[0] + turtyIndex]
          a = stack.pop() + memory[memory[0] + turtxIndex]
          if (memory[memory[0] + turtpIndex] > 0) {
            reply('line', { turtle: turtle(), x: turtx(a), y: turty(b) })
            if (runtime.update) {
              drawCount += 1
            }
          }
          memory[memory[0] + turtxIndex] = a
          memory[memory[0] + turtyIndex] = b
          reply('turtx-changed', a)
          reply('turty-changed', b)
          coords.push([a, b])
          break

        case pc.fwrd:
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
          if (memory[memory[0] + turtpIndex] > 0) {
            reply('line', { turtle: turtle(), x: turtx(a), y: turty(b) })
            if (runtime.update) {
              drawCount += 1
            }
          }
          memory[memory[0] + turtxIndex] = a
          memory[memory[0] + turtyIndex] = b
          reply('turtx-changed', a)
          reply('turty-changed', b)
          coords.push([a, b])
          break

        case pc.back:
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
          if (memory[memory[0] + turtpIndex] > 0) {
            reply('line', { turtle: turtle(), x: turtx(a), y: turty(b) })
            if (runtime.update) {
              drawCount += 1
            }
          }
          memory[memory[0] + turtxIndex] = a
          memory[memory[0] + turtyIndex] = b
          reply('turtx-changed', a)
          reply('turty-changed', b)
          coords.push([a, b])
          break

        case pc.left:
          a = (memory[memory[0] + turtdIndex] - stack.pop()) % memory[memory[0] + turtaIndex]
          memory[memory[0] + turtdIndex] = a
          reply('turtd-changed', a)
          break

        case pc.rght:
          a = (memory[memory[0] + turtdIndex] + stack.pop()) % memory[memory[0] + turtaIndex]
          memory[memory[0] + turtdIndex] = a
          reply('turtd-changed', a)
          break

        case pc.turn:
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
          reply('turtd-changed', a)
          break

        // 0x60s - colour operators, shapes and fills
        case pc.blnk:
          a = stack.pop()
          reply('blank', hex(a))
          if (runtime.update) {
            drawCount += 1
          }
          break

        case pc.rcol:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          reply('flood', { x: a, y: b, c1: c, c2: 0, boundary: false })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case pc.fill:
          d = stack.pop()
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          reply('flood', { x: a, y: b, c1: c, c2: d, boundayr: true })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case pc.pixc:
          c = stack.pop()
          b = stack.pop()
          a = context.getImageData(turtx(b), turty(c), 1, 1)
          stack.push((a.data[0] * 65536) + (a.data[1] * 256) + a.data[2])
          break

        case pc.pixs:
          c = stack.pop()
          b = stack.pop()
          a = stack.pop()
          reply('pixset', { x: turtx(a), y: turty(b), c, doubled: vcanvas.doubled })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case pc.rgb:
          a = stack.pop()
          a = a % 50
          if (a <= 0) a += 50
          a = colours[a - 1].value
          stack.push(a)
          break

        case pc.mixc:
          d = stack.pop() // second proportion
          c = stack.pop() // first proportion
          b = stack.pop() // second colour
          a = stack.pop() // first colour
          e = mixBytes(Math.floor(a / 0x10000), Math.floor(b / 0x10000), c, d) // red byte
          f = mixBytes(Math.floor((a & 0xFF00) / 0x100), Math.floor((b & 0xFF00) / 0x100), c, d) // green byte
          g = mixBytes(a & 0xFF, b & 0xFF, c, d) // blue byte
          stack.push((e * 0x10000) + (f * 0x100) + g)
          break

        case pc.rmbr:
          coords.push([memory[memory[0] + turtxIndex], memory[memory[0] + turtyIndex]])
          break

        case pc.frgt:
          coords.length -= stack.pop()
          break

        case pc.poly:
          c = stack.pop()
          b = coords.length
          a = (c > b) ? 0 : b - c
          reply('poly', { turtle: turtle(), coords: coords.slice(a, b).map(vcoords), fill: false })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case pc.pfil:
          c = stack.pop()
          b = coords.length
          a = (c > b) ? 0 : b - c
          reply('poly', { turtle: turtle(), coords: coords.slice(a, b).map(vcoords), fill: true })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case pc.circ:
          a = stack.pop()
          reply('arc', { turtle: turtle(), x: turtx(a + vcanvas.startx), y: turty(a + vcanvas.starty), fill: false })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case pc.blot:
          a = stack.pop()
          reply('arc', { turtle: turtle(), x: turtx(a + vcanvas.startx), y: turty(a + vcanvas.starty), fill: true })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case pc.elps:
          b = stack.pop()
          a = stack.pop()
          reply('arc', { turtle: turtle(), x: turtx(a + vcanvas.startx), y: turty(b + vcanvas.starty), fill: false })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case pc.eblt:
          b = stack.pop()
          a = stack.pop()
          reply('arc', { turtle: turtle(), x: turtx(a + vcanvas.startx), y: turty(b + vcanvas.starty), fill: true })
          if (runtime.update) {
            drawCount += 1
          }
          break

        case pc.box:
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
        case pc.ldin:
          a = pcode[line][code + 1]
          stack.push(a)
          code += 1
          break

        case pc.ldvg:
          a = pcode[line][code + 1]
          stack.push(memory[a])
          code += 1
          break

        case pc.ldvv:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          stack.push(memory[memory[a] + b])
          code += 2
          break

        case pc.ldvr:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          stack.push(memory[memory[memory[a] + b]])
          code += 2
          break

        case pc.ldag:
          a = pcode[line][code + 1]
          stack.push(a)
          code += 1
          break

        case pc.ldav:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          stack.push(memory[a] + b)
          code += 2
          break

        case pc.lstr:
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

        case pc.stvg:
          a = stack.pop()
          memory[pcode[line][code + 1]] = a
          code += 1
          break

        case pc.stvv:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          c = stack.pop()
          memory[memory[a] + b] = c
          code += 2
          break

        case pc.stvr:
          a = pcode[line][code + 1]
          b = pcode[line][code + 2]
          c = stack.pop()
          memory[memory[memory[a] + b]] = c
          code += 2
          break

        case pc.lptr:
          a = stack.pop()
          stack.push(memory[a])
          break

        case pc.sptr:
          b = stack.pop()
          a = stack.pop()
          memory[b] = a
          break

        case pc.zptr:
          b = stack.pop()
          a = stack.pop()
          zero(a, b)
          break

        case pc.cptr:
          c = stack.pop() // length
          b = stack.pop() // target
          a = stack.pop() // source
          copy(a, b, c)
          break

        case pc.cstr:
          b = stack.pop() // target
          a = stack.pop() // source
          d = memory[b - 1] // maximum length of target
          c = memory[a] // length of source
          copy(a, b, Math.min(c, d) + 1)
          break

        case pc.test:
          b = stack[stack.length - 1] // leave the stack unchanged
          a = stack[stack.length - 2]
          if ((a < 0) || (a >= memory[b])) {
            // TODO: make range check a runtime option
            halt()
            throw error('Array index out of range.')
          }
          break

        // 0x80s - flow control, memory control
        case pc.jump:
          line = pcode[line][code + 1] - 1
          code = -1
          break

        case pc.ifno:
          if (stack.pop() === 0) {
            line = pcode[line][code + 1] - 1
            code = -1
          } else {
            code += 1
          }
          break

        case pc.halt:
          halt()
          return

        case pc.subr:
          if (markers.heapGlobal === -1) {
            markers.heapGlobal = markers.heapPerm
          }
          returnStack.push(line + 1)
          line = pcode[line][code + 1] - 1
          code = -1
          break

        case pc.retn:
          line = returnStack.pop()
          code = -1
          break

        case pc.pssr:
          subroutineStack.push(pcode[line][code + 1])
          code += 1
          break

        case pc.plsr:
          subroutineStack.pop()
          break

        case pc.psrj:
          stack.push(line + 1)
          break

        case pc.plrj:
          returnStack.pop()
          line = (stack.pop() - 1)
          code = -1
          break

        case pc.ldmt:
          stack.push(memoryStack.length - 1)
          break

        case pc.stmt:
          a = stack.pop()
          memoryStack.push(a)
          markers.stackTop = Math.max(a, markers.stackTop)
          break

        case pc.memc:
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

        case pc.memr:
          memoryStack.pop()
          a = pcode[line][code + 1]
          b = memoryStack.pop()
          memoryStack.push(memory[a])
          markers.stackTop = Math.max(memory[a], markers.stackTop)
          memory[a] = b
          code += 2
          break

        case pc.hfix:
          markers.heapPerm = markers.heapTemp
          break

        case pc.hclr:
          markers.heapTemp = markers.heapPerm
          break

        case pc.hrst:
          if (markers.heapGlobal > -1) {
            markers.heapTemp = markers.heapGlobal
            markers.heapPerm = markers.heapGlobal
          }
          break

        // 0x90s - runtime variables, debugging
        case pc.canv:
          vcanvas.sizey = stack.pop()
          vcanvas.sizex = stack.pop()
          vcanvas.starty = stack.pop()
          vcanvas.startx = stack.pop()
          reply('canvas', vcanvas)
          memory[memory[0] + turtxIndex] = Math.round(vcanvas.startx + (vcanvas.sizex / 2))
          memory[memory[0] + turtyIndex] = Math.round(vcanvas.starty + (vcanvas.sizey / 2))
          memory[memory[0] + turtdIndex] = 0
          reply('turtx-changed', memory[memory[0] + turtxIndex])
          reply('turty-changed', memory[memory[0] + turtyIndex])
          reply('turtd-changed', memory[memory[0] + turtdIndex])
          coords.push([memory[memory[0] + turtxIndex], memory[memory[0] + turtyIndex]])
          drawCount = options.drawCountMax // force runtime.update
          break

        case pc.reso:
          b = stack.pop()
          a = stack.pop()
          if (Math.min(a, b) <= options.smallSize) {
            a = a * 2
            b = b * 2
            vcanvas.doubled = true
          }
          vcanvas.width = a
          vcanvas.height = b
          reply('resolution', { width: a, height: b })
          reply('blank', '#FFFFFF')
          drawCount = options.drawCountMax // force runtime.update
          break

        case pc.udat:
          a = (stack.pop() !== 0)
          runtime.update = a
          if (a) {
            drawCount = options.drawCountMax // force update
          }
          break

        case pc.seed:
          a = stack.pop()
          if (a === 0) {
            stack.push(runtime.seed)
          } else {
            runtime.seed = a
            stack.push(a)
          }
          break

        case pc.trac:
          // not implemented -
          // just pop the top off the stack
          stack.pop()
          break

        case pc.memw:
          // not implemented -
          // just pop the top off the stack
          stack.pop()
          break

        case pc.dump:
          reply('memory-dumped', dump())
          if (options.showMemory) {
            reply('show-memory')
          }
          break

        case pc.peek:
          a = stack.pop()
          stack.push(memory[a])
          break

        case pc.poke:
          b = stack.pop()
          a = stack.pop()
          memory[a] = b
          break

        // 0xA0s - text output, timing
        case pc.inpt:
          a = stack.pop()
          if (a < 0) {
            stack.push(query[-a])
          } else {
            stack.push(keys[a])
          }
          break

        case pc.iclr:
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

        case pc.bufr:
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

        case pc.read:
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

        case pc.rdln:
          a = Math.pow(2, 31) - 1 // as long as possible
          code += 1
          if (code === pcode[line].length) {
            line += 1
            code = 0
          }
          b = setTimeout(execute, a, pcode, line, code, options)
          runtime.readline = readlineProto.bind(null, b, pcode, line, code, options)
          window.addEventListener('keydown', runtime.readline)
          return

        case pc.kech:
          a = (stack.pop() !== 0)
          runtime.keyecho = a
          break

        case pc.outp:
          c = (stack.pop() !== 0)
          b = stack.pop()
          a = (stack.pop() !== 0)
          reply('output', { clear: a, colour: hex(b) })
          if (c) {
            reply('show-output')
          } else {
            reply('show-canvas')
          }
          break

        case pc.cons:
          b = stack.pop()
          a = (stack.pop() !== 0)
          reply('console', { clear: a, colour: hex(b) })
          break

        case pc.prnt:
          c = stack.pop()
          b = stack.pop()
          a = getHeapString(stack.pop())
          reply('print', { turtle: turtle(), string: a, font: b, size: c })
          break

        case pc.writ:
          a = getHeapString(stack.pop())
          reply('write', a)
          reply('log', a)
          if (options.showOutput) {
            reply('show-output')
          }
          break

        case pc.newl:
          reply('write', '\n')
          reply('log', '\n')
          break

        case pc.curs:
          a = stack.pop()
          reply('cursor', a)
          break

        case pc.time:
          a = Date.now()
          a = a - runtime.startTime
          stack.push(a)
          break

        case pc.tset:
          a = Date.now()
          b = stack.pop()
          runtime.startTime = a - b
          break

        case pc.wait:
          a = stack.pop()
          code += 1
          if (code === pcode[line].length) {
            line += 1
            code = 0
          }
          setTimeout(execute, a, pcode, line, code, options)
          return

        case pc.tdet:
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
        case pc.chdr:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.file:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.diry:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.open:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.clos:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.fbeg:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.eof:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.eoln:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.frds:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.frln:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.fwrs:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.fwnl:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.ffnd:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.fdir:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.fnxt:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        case pc.fmov:
          // not yet implemented
          halt()
          throw error('File processing has not yet been implemented.')

        // anything else is an error
        default:
          halt()
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
    p: turtp(memory[memory[0] + turtpIndex]),
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

// convert turtp to virtual canvas thickness
function turtp (p) {
  return vcanvas.doubled ? p * 2 : p
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
