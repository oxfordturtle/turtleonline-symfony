/*
 * The Virtual Turtle Machine.
 */
import Memory from './memory'
import { defaultOptions, Options } from './options'
import { keycodeFromKey, mixBytes } from './misc'
import { Turtle } from './turtle'
import { colours } from '../constants/colours'
import { PCode } from '../constants/pcodes'
import { MachineError } from '../tools/error'
import { send } from '../tools/hub'
import hex from '../tools/hex'

/** the virtual turtle machine */
class Machine {
  canvas: HTMLCanvasElement = document.createElement('canvas')
  context: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D
  memory: Memory = new Memory()
  running: boolean = false
  paused: boolean = false
  pcode: number[][] = []
  line: number = 0
  code: number = 0
  options: Options = defaultOptions
  startx: number = 0
  starty: number = 0
  sizex: number = 1000
  sizey: number = 1000
  width: number = 1000
  height: number = 1000
  doubled: boolean = false
  detectKeycode: number = 0
  detectTimeoutID: number = 0
  readlineTimeoutID: number = 0

  /** resets the machine */
  reset (): void {
    // reset the virtual canvas
    this.startx = 0
    this.starty = 0
    this.sizex = 1000
    this.sizey = 1000
    this.width = 1000
    this.height = 1000
    this.doubled = false
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
  run (pcode: number[][], options: Options): void {
    // reset the machine
    this.reset()
    // save pcode and options for program execution
    this.pcode = pcode
    this.options = options
    // set line and code indexes to zero
    this.line = 0
    this.code = 0
    // optionally show the canvas
    if (this.options.showCanvasOnRun) {
      send('selectTab', 'canvas')
    }
    // setup machine memory
    this.memory.init(this.options)
    // setup the machine status
    this.running = true
    this.paused = false
    // add event listeners
    window.addEventListener('keydown', this.storeKey)
    window.addEventListener('keyup', this.releaseKey)
    window.addEventListener('keypress', this.putInBuffer)
    this.canvas.addEventListener('contextmenu', this.preventDefault)
    this.canvas.addEventListener('mousemove', this.storeMouseXY)
    this.canvas.addEventListener('touchmove', this.preventDefault)
    this.canvas.addEventListener('touchmove', this.storeMouseXY)
    this.canvas.addEventListener('mousedown', this.preventDefault)
    this.canvas.addEventListener('mousedown', this.storeClickXY)
    this.canvas.addEventListener('touchstart', this.storeClickXY)
    this.canvas.addEventListener('mouseup', this.releaseClickXY)
    this.canvas.addEventListener('touchend', this.releaseClickXY)
    // send the started signal (via the main state module)
    send('played')
    // execute the first block of code (which will in turn trigger execution of the next block)
    this.execute()
  }

  /** halts execution of the current program */
  halt (): void {
    if (this.running) {
      // remove event listeners
      window.removeEventListener('keydown', this.storeKey)
      window.removeEventListener('keyup', this.releaseKey)
      window.removeEventListener('keypress', this.putInBuffer)
      window.removeEventListener('keyup', this.detect)
      window.removeEventListener('keyup',this.readline)
      this.canvas.removeEventListener('contextmenu', this.preventDefault)
      this.canvas.removeEventListener('mousemove', this.storeMouseXY)
      this.canvas.removeEventListener('touchmove', this.preventDefault)
      this.canvas.removeEventListener('touchmove', this.storeMouseXY)
      this.canvas.removeEventListener('mousedown', this.preventDefault)
      this.canvas.removeEventListener('mousedown', this.storeClickXY)
      this.canvas.removeEventListener('touchstart', this.storeClickXY)
      this.canvas.removeEventListener('mouseup', this.releaseClickXY)
      this.canvas.removeEventListener('touchend', this.releaseClickXY)
      // reset the canvas cursor
      send('cursor', 1)
      // reset the machine status
      this.running = false
      this.paused = false
      // send the stopped signal (via the main state module)
      send('halted')
    }
  }

  /** pauses execution of the current program */
  pause (): void {
    this.paused = true
    send('paused')
  }

  /** plays (unpauses) execution of the current program */
  play (): void {
    this.paused = false
    send('unpaused')
  }

  /** executes a block of pcode */
  execute (): void {
    // don't do anything if we're not running
    if (!this.running) {
      return
    }

    // try again in 1 millisecond if the machine is paused
    if (this.paused) {
      setTimeout(this.execute, 1)
      return
    }

    // in case of detect or readline, remove the event listeners the first time we carry on with the
    // program execution after they have been called
    window.removeEventListener('keyup', this.detect)
    window.removeEventListener('keyup', this.readline)

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
    let lineAndCode: [number, number]|undefined
    try {
      while (drawCount < this.options.drawCountMax && (codeCount <= this.options.codeCountMax)) {
        switch (this.pcode[this.line][this.code]) {
          // 0x0 - basic stack operations, conversion operators
          case PCode.null:
            break

          case PCode.dupl:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.stack.push(n1, n1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            } 
            break

          case PCode.swap:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n2, n1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.rota:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              this.memory.stack.push(n2, n3, n1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.incr:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.stack.push(n1 + 1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.decr:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.stack.push(n1 - 1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.mxin:
            this.memory.stack.push(Math.pow(2, 31) - 1)
            break

          case PCode.rand:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.stack.push(Math.floor(this.memory.random() * Math.abs(n1)))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.hstr:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              s1 = this.memory.getHeapString(n1)
              this.memory.makeHeapString(s1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.ctos:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.makeHeapString(String.fromCharCode(n1))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.sasc:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              s1 = this.memory.getHeapString(n1)
              if (s1.length === 0) {
                this.memory.stack.push(0)
              } else {
                this.memory.stack.push(s1.charCodeAt(0))
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.itos:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.makeHeapString(n1.toString(10))
            }  else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.hexs:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s1 = n1.toString(16).toUpperCase()
              while (s1.length < n2) {
                s1 = '0' + s1
              }
              this.memory.makeHeapString(s1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.sval:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s1 = this.memory.getHeapString(n1)
              if (s1[0] === '#') {
                n3 = isNaN(parseInt(s1.slice(1), 16)) ? n2 : parseInt(s1.slice(1), 16)
              } else {
                n3 = isNaN(parseInt(s1, 10)) ? n2 : parseInt(s1, 10)
              }
              this.memory.stack.push(n3)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.qtos:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              n1 = (n2 / n3)
              this.memory.makeHeapString(n1.toFixed(n4))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.qval:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              s1 = this.memory.getHeapString(n1)
              n4 = isNaN(parseFloat(s1)) ? n3 : parseFloat(s1)
              this.memory.stack.push(Math.round(n4 * n2))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          // 0x10s - Boolean operators, integer operators
          case PCode.not:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.stack.push(~n1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.and:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 & n2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.or:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 | n2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.xor:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 ^ n2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.andl:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 && n2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.orl:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 || n2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.shft:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              if (n2 < 0) {
                this.memory.stack.push(n1 << -n2)
              } else {
                this.memory.stack.push(n1 >> n2)
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.neg:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.stack.push(-n1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.abs:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.stack.push(Math.abs(n1))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.sign:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.stack.push(Math.sign(n1))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.plus:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 + n2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.subt:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 - n2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.mult:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 * n2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.divr:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(Math.round(n1 / n2))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.div:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(Math.floor(n1 / n2))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.mod:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 % n2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          // 0x20s - comparison operators
          case PCode.eqal:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 === n2 ? -1 : 0)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.noeq:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 !== n2 ? -1 : 0)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.less:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 < n2 ? -1 : 0)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.more:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 > n2 ? -1 : 0)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.lseq:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 <= n2 ? -1 : 0)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.mreq:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(n1 >= n2 ? -1 : 0)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.maxi:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(Math.max(n1, n2))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.mini:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(Math.min(n1, n2))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.seql:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s2 = this.memory.getHeapString(n2)
              s1 = this.memory.getHeapString(n1)
              this.memory.stack.push(s1 === s2 ? -1 : 0)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.sneq:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s2 = this.memory.getHeapString(n2)
              s1 = this.memory.getHeapString(n1)
              this.memory.stack.push(s1 !== s2 ? -1 : 0)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.sles:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s2 = this.memory.getHeapString(n1)
              s1 = this.memory.getHeapString(n2)
              this.memory.stack.push(n1 < n2 ? -1 : 0)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.smor:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s2 = this.memory.getHeapString(n2)
              s1 = this.memory.getHeapString(n1)
              this.memory.stack.push(n1 > n2 ? -1 : 0)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.sleq:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s2 = this.memory.getHeapString(n2)
              s1 = this.memory.getHeapString(n1)
              this.memory.stack.push(s1 <= s2 ? -1 : 0)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.smeq:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s2 = this.memory.getHeapString(n2)
              s1 = this.memory.getHeapString(n1)
              this.memory.stack.push(s1 >= s2 ? -1 : 0)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.smax:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s2 = this.memory.getHeapString(n2)
              s1 = this.memory.getHeapString(n1)
              this.memory.makeHeapString(s2 > s1 ? s2 : s1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.smin:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s2 = this.memory.getHeapString(n2)
              s1 = this.memory.getHeapString(n1)
              this.memory.makeHeapString(s2 < s1 ? s2 : s1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          // 0x30s - pseudo-real operators
          case PCode.divm:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              this.memory.stack.push(Math.round((n1 / n2) * n3))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.sqrt:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(Math.round(Math.sqrt(n1) * n2))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.hyp:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              this.memory.stack.push(Math.round(Math.sqrt((n1 * n1) + (n2 * n2)) * n3))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.root:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              this.memory.stack.push(Math.round(Math.pow(n1 / n2, 1 / n3) * n4))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.powr:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              this.memory.stack.push(Math.round(Math.pow(n1 / n2, n3) * n4))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.log:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              this.memory.stack.push(Math.round((Math.log(n1 / n2) / Math.LN10) * n3))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.alog:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              this.memory.stack.push(Math.round(Math.pow(10, n1 / n2) * n3))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.ln:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              this.memory.stack.push(Math.round(Math.log(n1 / n2) * n3))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.exp:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              this.memory.stack.push(Math.round(Math.exp(n1 / n2) * n3))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.sin:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              n1 = (n2 / n3) * (2 * Math.PI) / this.memory.turta
              this.memory.stack.push(Math.round(Math.sin(n1) * n4))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.cos:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              n1 = (n2 / n3) * (2 * Math.PI) / this.memory.turta
              this.memory.stack.push(Math.round(Math.cos(n1) * n4))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.tan:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              n1 = (n2 / n3) * (2 * Math.PI) / this.memory.turta
              this.memory.stack.push(Math.round(Math.tan(n1) * n4))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.asin:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              n1 = this.memory.turta / (2 * Math.PI)
              this.memory.stack.push(Math.round(Math.asin(n2 / n3) * n4 * n1))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.acos:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              n1 = this.memory.turta / (2 * Math.PI)
              this.memory.stack.push(Math.round(Math.acos(n2 / n3) * n4 * n1))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.atan:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              n1 = this.memory.turta / (2 * Math.PI)
              this.memory.stack.push(Math.round(Math.atan2(n2, n3) * n4 * n1))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.pi:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.stack.push(Math.round(Math.PI * n1))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          // 0x40s - string operators
          case PCode.scat:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s2 = this.memory.getHeapString(n2)
              s1 = this.memory.getHeapString(n1)
              this.memory.makeHeapString(s1 + s2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.slen:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              s1 = this.memory.getHeapString(n1)
              this.memory.stack.push(s1.length)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.case:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s1 = this.memory.getHeapString(n1)
              switch (n2) {
                case 1:
                  // lowercase
                  this.memory.makeHeapString(s1.toLowerCase())
                  break
                case 2:
                  // uppercase
                  this.memory.makeHeapString(s1.toUpperCase())
                  break
                case 3:
                  // capitalise first letter
                  if (s1.length > 0) {
                    this.memory.makeHeapString(s1[0].toUpperCase() + s1.slice(1))
                  } else {
                    this.memory.makeHeapString(s1)
                  }
                  break
                case 4:
                  // capitalise first letter of each word
                  s1 = s1.split(' ').map(x => x[0].toUpperCase() + x.slice(0)).join(' ')
                  this.memory.makeHeapString(s1)
                  break
                case 5:
                  // swap case
                  s1 = s1.split('').map(x => (x === x.toLowerCase()) ? x.toUpperCase() : x.toLowerCase()).join('')
                  this.memory.makeHeapString(s1)
                  break
                default:
                  // this should be impossible
                  this.memory.makeHeapString(s1)
                  break
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.copy:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              s1 = this.memory.getHeapString(n1)
              this.memory.makeHeapString(s1.substr(n2 - 1, n3))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.dels:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            if (n2 !== undefined && n3 !== undefined && n4 !==undefined) {
              s2 = this.memory.getHeapString(n2)
              s1 = s2.substr(0, n3 - 1) + s2.substr((n3 - 1) + n4)
              this.memory.makeHeapString(s1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.inss:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            if (n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              s3 = this.memory.getHeapString(n3)
              s2 = this.memory.getHeapString(n2)
              s1 = s3.substr(0, n4 - 1) + s2 + s3.substr(n4 - 1)
              this.memory.makeHeapString(s1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.poss:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              s2 = this.memory.getHeapString(n2)
              s1 = this.memory.getHeapString(n1)
              this.memory.stack.push(s2.indexOf(s1) + 1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.repl:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              s3 = this.memory.getHeapString(n3)
              s2 = this.memory.getHeapString(n2)
              s1 = this.memory.getHeapString(n1)
              if (n4 > 0) {
                while (n4 > 0) {
                  s1 = s1.replace(s2, s3)
                  n4 = n4 - 1
                }
                this.memory.makeHeapString(s1)
              } else {
                this.memory.makeHeapString(s1.replace(new RegExp(s2, 'g'), s3))
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.spad:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              s2 = this.memory.getHeapString(n2)
              s1 = this.memory.getHeapString(n1)
              while ((s1.length + s2.length) <= Math.abs(n3)) {
                if (n3 < 0) {
                  s1 = s1 + s2
                } else {
                  s1 = s2 + s1
                }
              }
              this.memory.makeHeapString(s1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.trim:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              s1 = this.memory.getHeapString(n1)
              this.memory.makeHeapString(s1.trim())
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          // 0x50s - turtle settings and movement
          case PCode.home:
            n1 = this.startx + (this.sizex / 2)
            n2 = this.starty + (this.sizey / 2)
            this.memory.turtx = Math.round(n1)
            this.memory.turty = Math.round(n2)
            this.memory.turtd = 0
            send('turtxChanged', this.memory.turtx)
            send('turtyChanged', this.memory.turty)
            send('turtdChanged', this.memory.turtd)
            this.memory.coords.push([this.memory.turtx, this.memory.turty])
            break

          case PCode.setx:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.turtx = n1
              send('turtxChanged', n1)
              this.memory.coords.push([this.memory.turtx, this.memory.turty])
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.sety:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.turty = n1
              send('turtyChanged', n1)
              this.memory.coords.push([this.memory.turtx, this.memory.turty])
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.setd:
            n2 = this.memory.stack.pop()
            if (n2 !== undefined) {
              n1 = n2 % this.memory.turta
              this.memory.turtd = n1
              send('turtdChanged', n1)
            }
            break

          case PCode.angl:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              if (this.memory.turta === 0) {
                // this should only happen at the start of the program before angles is set for the first time
                this.memory.turta = n1
              }
              if (n1 === 0) {
                // never let angles be set to zero
                throw new MachineError('Angles cannot be set to zero.')
              }
              n2 = Math.round(n1 + this.memory.turtd * n1 / this.memory.turta)
              this.memory.turtd = n2 % n1
              this.memory.turta = n1
              send('turtdChanged', n2 % n1)
              send('turtaChanged', n1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.thik:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              n2 = Math.abs(n1)
              bool1 = n1 < 0
              bool2 = this.memory.turtt < 0
              if (bool1) { // reverse pen status
                this.memory.turtt = bool2 ? n2 : -n2
              } else { // leave pen status as it is
                this.memory.turtt = bool2 ? -n2 : n2
              }
              send('turttChanged', this.memory.turtt)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.colr:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.turtc = n1
              send('turtcChanged', hex(n1))
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.pen:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              bool1 = (n1 !== 0) // pen up or down
              n2 = Math.abs(this.memory.turtt) // current thickness
              n3 = bool1 ? n2 : -n2 // positive or negative depending on whether pen is down or up
              this.memory.turtt = n3
              send('turttChanged', n3)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.toxy:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.turtx = n1
              this.memory.turty = n2
              send('turtxChanged', n1)
              send('turtyChanged', n2)
              this.memory.coords.push([n1, n2])
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.mvxy:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              n2 += this.memory.turty
              n1 += this.memory.turtx
              this.memory.turtx = n1
              this.memory.turty = n2
              send('turtxChanged', n1)
              send('turtyChanged', n2)
              this.memory.coords.push([n1, n2])
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.drxy:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              n2 += this.memory.turty
              n1 += this.memory.turtx
              if (this.memory.turtt > 0) {
                send('line', { turtle: this.turtle(), x: this.turtx(n1), y: this.turty(n2) })
                if (this.memory.update) {
                  drawCount += 1
                }
              }
              this.memory.turtx = n1
              this.memory.turty = n2
              send('turtxChanged', n1)
              send('turtyChanged', n2)
              this.memory.coords.push([n1, n2])
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.fwrd:
            n3 = this.memory.stack.pop() // distance
            if (n3 !== undefined) {
              n4 = this.memory.turtd // turtle direction
              // work out final y coordinate
              n2 = Math.cos(n4 * Math.PI / (this.memory.turta / 2))
              n2 = -Math.round(n2 * n3)
              n2 += this.memory.turty
              // work out final x coordinate
              n1 = Math.sin(n4 * Math.PI / (this.memory.turta / 2))
              n1 = Math.round(n1 * n3)
              n1 += this.memory.turtx
              if (this.memory.turtt > 0) {
                send('line', { turtle: this.turtle(), x: this.turtx(n1), y: this.turty(n2) })
                if (this.memory.update) {
                  drawCount += 1
                }
              }
              this.memory.turtx = n1
              this.memory.turty = n2
              send('turtxChanged', n1)
              send('turtyChanged', n2)
              this.memory.coords.push([n1, n2])
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.back:
            n3 = this.memory.stack.pop() // distance
            if (n3 !== undefined) {
              n4 = this.memory.turtd // turtle direction
              // work out final y coordinate
              n2 = Math.cos(n4 * Math.PI / (this.memory.turta / 2))
              n2 = Math.round(n2 * n3)
              n2 += this.memory.turty
              // work out final x coordinate
              n1 = Math.sin(n4 * Math.PI / (this.memory.turta / 2))
              n1 = -Math.round(n1 * n3)
              n1 += this.memory.turtx
              if (this.memory.turtt > 0) {
                send('line', { turtle: this.turtle(), x: this.turtx(n1), y: this.turty(n2) })
                if (this.memory.update) {
                  drawCount += 1
                }
              }
              this.memory.turtx = n1
              this.memory.turty = n2
              send('turtxChanged', n1)
              send('turtyChanged', n2)
              this.memory.coords.push([n1, n2])
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.left:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              n2 = (this.memory.turtd - n1) % this.memory.turta
              this.memory.turtd = n2
              send('turtdChanged', n2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.rght:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              n2 = (this.memory.turtd + n1) % this.memory.turta
              this.memory.turtd = n2
              send('turtdChanged', n2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.turn:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
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
              n3 = Math.round(n3 * this.memory.turta / Math.PI / 2) % this.memory.turta
              this.memory.turtd = n3
              send('turtdChanged', n1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          // 0x60s - colour operators, shapes and fills
          case PCode.blnk:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              send('blank', hex(n1))
              if (this.memory.update) {
                drawCount += 1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.rcol:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              send('flood', { x: n1, y: n2, c1: n3, c2: 0, boundary: false })
              if (this.memory.update) {
                drawCount += 1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.fill:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              send('flood', { x: n1, y: n2, c1: n3, c2: n4, boundary: true })
              if (this.memory.update) {
                drawCount += 1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.pixc:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            if (n2 !== undefined && n3 !== undefined) {
              image = this.context.getImageData(this.turtx(n2), this.turty(n3), 1, 1)
              this.memory.stack.push((image.data[0] * 65536) + (image.data[1] * 256) + image.data[2])
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.pixs:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              send('pixset', { x: this.turtx(n1), y: this.turty(n2), n3, doubled: this.doubled })
              if (this.memory.update) {
                drawCount += 1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.rgb:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              n1 = n1 % 50
              if (n1 <= 0) {
                n1 += 50
              }
              n1 = colours[n1 - 1].value
              this.memory.stack.push(n1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.mixc:
            n4 = this.memory.stack.pop() // second proportion
            n3 = this.memory.stack.pop() // first proportion
            n2 = this.memory.stack.pop() // second colour
            n1 = this.memory.stack.pop() // first colour
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              r = mixBytes(Math.floor(n1 / 0x10000), Math.floor(n2 / 0x10000), n3, n4) // red byte
              g = mixBytes(Math.floor((n1 & 0xFF00) / 0x100), Math.floor((n2 & 0xFF00) / 0x100), n3, n4) // green byte
              b = mixBytes(n1 & 0xFF, n2 & 0xFF, n3, n4) // blue byte
              this.memory.stack.push((r * 0x10000) + (g * 0x100) + b)
            }
            break

          case PCode.rmbr:
            this.memory.coords.push([this.memory.turtx, this.memory.turty])
            break

          case PCode.frgt:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.coords.length -= n1
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.poly:
            n3 = this.memory.stack.pop()
            if (n3 !== undefined) {
              n2 = this.memory.coords.length
              n1 = (n3 > n2) ? 0 : n2 - n3
              send('poly', { turtle: this.turtle(), coords: this.memory.coords.slice(n1, n2).map(this.vcoords), fill: false })
              if (this.memory.update) {
                drawCount += 1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.pfil:
            n3 = this.memory.stack.pop()
            if (n3 !== undefined) {
              n2 = this.memory.coords.length
              n1 = (n3 > n2) ? 0 : n2 - n3
              send('poly', { turtle: this.turtle(), coords: this.memory.coords.slice(n1, n2).map(this.vcoords), fill: true })
              if (this.memory.update) {
                drawCount += 1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.circ:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              send('arc', { turtle: this.turtle(), x: this.turtx(n1 + this.startx), y: this.turty(n1 + this.starty), fill: false })
              if (this.memory.update) {
                drawCount += 1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.blot:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              send('arc', { turtle: this.turtle(), x: this.turtx(n1 + this.startx), y: this.turty(n1 + this.starty), fill: true })
              if (this.memory.update) {
                drawCount += 1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.elps:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              send('arc', { turtle: this.turtle(), x: this.turtx(n1 + this.startx), y: this.turty(n2 + this.starty), fill: false })
              if (this.memory.update) {
                drawCount += 1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.eblt:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              send('arc', { turtle: this.turtle(), x: this.turtx(n1 + this.startx), y: this.turty(n2 + this.starty), fill: true })
              if (this.memory.update) {
                drawCount += 1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.box:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              bool1 = (n4 !== 0)
              n2 += this.memory.turty
              n1 += this.memory.turtx
              send('box', { turtle: this.turtle(), x: this.turtx(n1), y: this.turty(n2), fill: hex(n3), border: bool1 })
              if (this.memory.update) {
                drawCount += 1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          // 0x70s - loading from stack, storing from stack, pointer and array operations
          case PCode.ldin:
            n1 = this.pcode[this.line][this.code + 1]
            this.memory.stack.push(n1)
            this.code += 1
            break

          case PCode.ldvg:
            n1 = this.pcode[this.line][this.code + 1]
            this.memory.stack.push(this.memory.main[n1])
            this.code += 1
            break

          case PCode.ldvv:
            n1 = this.pcode[this.line][this.code + 1]
            n2 = this.pcode[this.line][this.code + 2]
            this.memory.stack.push(this.memory.main[this.memory.main[n1] + n2])
            this.code += 2
            break

          case PCode.ldvr:
            n1 = this.pcode[this.line][this.code + 1]
            n2 = this.pcode[this.line][this.code + 2]
            this.memory.stack.push(this.memory.main[this.memory.main[this.memory.main[n1] + n2]])
            this.code += 2
            break

          case PCode.ldag:
            n1 = this.pcode[this.line][this.code + 1]
            this.memory.stack.push(n1)
            this.code += 1
            break

          case PCode.ldav:
            n1 = this.pcode[this.line][this.code + 1]
            n2 = this.pcode[this.line][this.code + 2]
            this.memory.stack.push(this.memory.main[n1] + n2)
            this.code += 2
            break

          case PCode.lstr:
            this.code += 1
            n1 = this.pcode[this.line][this.code] // length of the string
            n2 = this.code + n1 // end of the string
            s1 = ''
            while (this.code < n2) {
              this.code += 1
              s1 += String.fromCharCode(this.pcode[this.line][this.code])
            }
            this.memory.makeHeapString(s1)
            break

          case PCode.stvg:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.main[this.pcode[this.line][this.code + 1]] = n1
              this.code += 1
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.stvv:
            n1 = this.pcode[this.line][this.code + 1]
            n2 = this.pcode[this.line][this.code + 2]
            n3 = this.memory.stack.pop()
            if (n3 !== undefined) {
              this.memory.main[this.memory.main[n1] + n2] = n3
              this.code += 2
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.stvr:
            n1 = this.pcode[this.line][this.code + 1]
            n2 = this.pcode[this.line][this.code + 2]
            n3 = this.memory.stack.pop()
            if (n3 !== undefined) {
              this.memory.main[this.memory.main[this.memory.main[n1] + n2]] = n3
              this.code += 2
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.lptr:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.stack.push(this.memory.main[n1])
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.sptr:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.main[n2] = n1
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.zptr:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.zero(n1, n2)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.cptr:
            n3 = this.memory.stack.pop() // length
            n2 = this.memory.stack.pop() // target
            n1 = this.memory.stack.pop() // source
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              this.memory.copy(n1, n2, n3)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.cstr:
            n2 = this.memory.stack.pop() // target
            n1 = this.memory.stack.pop() // source
            if (n1 !== undefined && n2 !== undefined) {
              n4 = this.memory.main[n2 - 1] // maximum length of target
              n3 = this.memory.main[n1] // length of source
              this.memory.copy(n1, n2, Math.min(n3, n4) + 1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.test:
            n2 = this.memory.stack[this.memory.stack.length - 1] // leave the stack unchanged
            n1 = this.memory.stack[this.memory.stack.length - 2]
            if (n1 !== undefined && n2 !== undefined) {
              if ((n1 < 0) || (n1 >= this.memory.main[n2])) {
                // TODO: make range check a runtime option
                throw new MachineError('Array index out of range.')
              }
            }
            break

          // 0x80s - flow control, memory control
          case PCode.jump:
            this.line = this.pcode[this.line][this.code + 1] - 1
            this.code = -1
            break

          case PCode.ifno:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              if (n1 === 0) {
                this.line = this.pcode[this.line][this.code + 1] - 1
                this.code = -1
              } else {
                this.code += 1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.halt:
            this.halt()
            return

          case PCode.subr:
            if (this.memory.heapGlobal === -1) {
              this.memory.heapGlobal = this.memory.heapPerm
            }
            this.memory.returnStack.push([this.line, this.code + 1])
            this.line = this.pcode[this.line][this.code + 1] - 1
            this.code = -1
            break

          case PCode.retn:
            lineAndCode = this.memory.returnStack.pop()
            if (lineAndCode !== undefined) {
              this.line = lineAndCode[0]
              this.code = lineAndCode[1]
            } else {
              throw new MachineError('RETN called on empty return stack.')
            }
            break

          case PCode.pssr:
            this.memory.subroutineStack.push(this.pcode[this.line][this.code + 1])
            this.code += 1
            break

          case PCode.plsr:
            this.memory.subroutineStack.pop()
            break

          case PCode.psrj:
            this.memory.stack.push(this.line + 1)
            break

          case PCode.plrj:
            this.memory.returnStack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.line = n1 - 1
              this.code = -1
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.ldmt:
            this.memory.stack.push(this.memory.memoryStack.length - 1)
            break

          case PCode.stmt:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.memoryStack.push(n1)
              this.memory.stackTop = Math.max(n1, this.memory.stackTop)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.memc:
            n1 = this.pcode[this.line][this.code + 1]
            n2 = this.pcode[this.line][this.code + 2]
            n3 = this.memory.memoryStack.pop()
            if (n3 !== undefined) {
              // heap overflow check
              if (n3 + n2 > this.options.stackSize) {
                throw new MachineError('Memory stack has overflowed into memory heap. Probable cause is unterminated recursion.')
              }
              this.memory.memoryStack.push(this.memory.main[n1])
              this.memory.stackTop = Math.max(this.memory.main[n1], this.memory.stackTop)
              this.memory.main[n1] = n3
              this.memory.memoryStack.push(n3 + n2)
              this.memory.stackTop = Math.max(n3 + n2, this.memory.stackTop)
              this.code += 2
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.memr:
            this.memory.memoryStack.pop()
            n1 = this.pcode[this.line][this.code + 1]
            n2 = this.memory.memoryStack.pop()
            if (n2 !== undefined) {
              this.memory.memoryStack.push(this.memory.main[n1])
              this.memory.stackTop = Math.max(this.memory.main[n1], this.memory.stackTop)
              this.memory.main[n1] = n2
              this.code += 2
            } else {
              throw new MachineError('MEMR called on empty this.memory stack.')
            }
            break

          case PCode.hfix:
            this.memory.heapPerm = this.memory.heapTemp
            break

          case PCode.hclr:
            this.memory.heapTemp = this.memory.heapPerm
            break

          case PCode.hrst:
            if (this.memory.heapGlobal > -1) {
              this.memory.heapTemp = this.memory.heapGlobal
              this.memory.heapPerm = this.memory.heapGlobal
            }
            break

          // 0x90s - runtime variables, debugging
          case PCode.canv:
            n4 = this.memory.stack.pop()
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined && n4 !== undefined) {
              this.sizey = n4
              this.sizex = n3
              this.starty = n2
              this.startx = n1
              send('canvas', {
                startx: this.startx,
                starty: this.starty,
                sizex: this.sizex,
                sizey: this.sizey,
                width: this.width,
                height: this.height,
                doubled: this.doubled
              })
              this.memory.turtx = Math.round(this.startx + (this.sizex / 2))
              this.memory.turty = Math.round(this.starty + (this.sizey / 2))
              this.memory.turtd = 0
              send('turtxChanged', this.memory.turtx)
              send('turtyChanged', this.memory.turty)
              send('turtdChanged', this.memory.turtd)
              this.memory.coords.push([this.memory.turtx, this.memory.turty])
              drawCount = this.options.drawCountMax // force update
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.reso:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              if (Math.min(n1, n2) <= this.options.smallSize) {
                n1 *= 2
                n2 *= 2
                this.doubled = true
              } else {
                this.doubled = false
              }
              this.width = n1
              this.height = n2
              send('resolution', { width: n1, height: n2 })
              send('blank', '#FFFFFF')
              drawCount = this.options.drawCountMax // force update
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.udat:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              bool1 = (n1 !== 0)
              this.memory.update = bool1
              if (bool1) {
                drawCount = this.options.drawCountMax // force update
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.seed:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              if (n1 === 0) {
                this.memory.stack.push(this.memory.seed)
              } else {
                this.memory.seed = n1
                this.memory.stack.push(n1)
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.trac:
            // not implemented -
            // just pop the top off the stack
            this.memory.stack.pop()
            break

          case PCode.memw:
            // not implemented -
            // just pop the top off the stack
            this.memory.stack.pop()
            break

          case PCode.dump:
            send('memoryDumped', this.memory.dump())
            if (this.options.showMemoryOnDump) {
              send('selectTab', 'memory')
            }
            break

          case PCode.peek:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.memory.stack.push(this.memory.main[n1])
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.poke:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.main[n1] = n2
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          // 0xA0s - text output, timing
          case PCode.inpt:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              if (n1 < 0) {
                this.memory.stack.push(this.memory.query[-n1])
              } else {
                this.memory.stack.push(this.memory.keys[n1])
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.iclr:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              if (n1 < 0) {
                // reset query value
                this.memory.query[-n1] = -1
              } else if (n1 === 0) {
                // reset keybuffer
                this.memory.main[this.memory.main[1] + 1] = this.memory.main[1] + 3
                this.memory.main[this.memory.main[1] + 2] = this.memory.main[1] + 3
              } else {
                // reset key value
                this.memory.keys[n1] = -1
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.bufr:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              if (n1 > 0) {
                n2 = this.memory.heapTemp + 4
                this.memory.stack.push(this.memory.heapTemp + 1)
                this.memory.main[this.memory.heapTemp + 1] = n2 + n1
                this.memory.main[this.memory.heapTemp + 2] = n2
                this.memory.main[this.memory.heapTemp + 3] = n2
                this.memory.main.fill(0, n2, n2 + n1)
                this.memory.heapTemp = n2 + n1
                this.memory.heapMax = Math.max(this.memory.heapTemp, this.memory.heapMax)
              }
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.read:
            n1 = this.memory.stack.pop() // maximum number of characters to read
            n2 = this.memory.main[1] // the address of the buffer
            n3 = this.memory.main[this.memory.main[1]] // the address of the end of the buffer
            s1 = '' // the string read from the buffer
            r = this.memory.main[n2 + 1]
            g = this.memory.main[n2 + 2]
            if (n1 !== undefined) {
              if (n1 === 0) {
                while (r !== g) {
                  s1 += String.fromCharCode(this.memory.main[r])
                  r = (r < n3)
                    ? r + 1
                    : n3 + 3 // loop back to the start
                }
              } else {
                while (r !== g && s1.length <= n1) {
                  s1 += String.fromCharCode(this.memory.main[r])
                  if (r < n3) {
                    r += 1
                  } else {
                    r = n3 + 3 // loop back to the start
                  }
                }
                this.memory.main[n2 + 1] = r
              }
              this.memory.makeHeapString(s1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.rdln:
            n1 = Math.pow(2, 31) - 1 // as long as possible
            this.code += 1
            if (this.code === this.pcode[this.line].length) {
              this.line += 1
              this.code = 0
            }
            this.readlineTimeoutID = window.setTimeout(this.execute, n1)
            window.addEventListener('keyup', this.readline)
            return

          case PCode.kech:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              bool1 = (n1 !== 0)
              this.memory.keyecho = bool1
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.outp:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
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
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            if (n2 !== undefined && n3 !== undefined) {
              bool1 = (n2 !== 0)
              send('console', { clear: bool1, colour: hex(n3) })
            }
            break

          case PCode.prnt:
            n3 = this.memory.stack.pop()
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined && n3 !== undefined) {
              s1 = this.memory.getHeapString(n1)
              send('print', { turtle: this.turtle(), string: n1, font: n2, size: n3 })
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.writ:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              s1 = this.memory.getHeapString(n1)
              send('write', n1)
              send('log', n1)
              if (this.options.showOutputOnWrite) {
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
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              send('cursor', n1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.time:
            n1 = Date.now()
            n1 = n1 - this.memory.startTime
            this.memory.stack.push(n1)
            break

          case PCode.tset:
            n1 = Date.now()
            n2 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.startTime = n1 - n2
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            break

          case PCode.wait:
            n1 = this.memory.stack.pop()
            if (n1 !== undefined) {
              this.code += 1
              if (this.code === this.pcode[this.line].length) {
                this.line += 1
                this.code = 0
              }
              window.setTimeout(this.execute, n1)
            } else {
              throw new MachineError('Stack operation called on empty stack.')
            }
            return

          case PCode.tdet:
            n2 = this.memory.stack.pop()
            n1 = this.memory.stack.pop()
            if (n1 !== undefined && n2 !== undefined) {
              this.memory.stack.push(0)
              this.code += 1
              if (this.code === this.pcode[this.line].length) {
                this.line += 1
                this.code = 0
              }
              this.detectKeycode = n2
              this.detectTimeoutID = window.setTimeout(this.execute, n1)
              window.addEventListener('keyup', this.detect)
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
            console.log(this.line)
            console.log(this.code)
            throw new MachineError(`Unknown PCode 0x${this.pcode[this.line][this.code].toString(16)}.`)
        }
        codeCount += 1
        this.code += 1
        if (!this.pcode[this.line]) {
          throw new MachineError('The program has tried to jump to a line that does not exist. This is either a bug in our compiler, or in your assembled code.')
        }
        if (this.code === this.pcode[this.line].length) { // line wrap
          this.line += 1
          this.code = 0
        }
      }
    } catch (error) {
      this.halt()
      send('error', error)
    }
    // setTimeout (with no delay) instead of direct recursion means the function will return and the
    // canvas will be updated
    setTimeout(this.execute, 0)
  }

  /** stores a key press */
  storeKey (event: KeyboardEvent): void {
    // backspace
    if (event.key === 'Backspace') {
      event.preventDefault() // don't go back a page in the browser!
      const buffer = this.memory.main[1]
      if (buffer > 0) { // there is a keybuffer
        if (this.memory.main[buffer + 1] !== this.memory.main[buffer + 2]) { // the keybuffer has something in it
          if (this.memory.main[buffer + 2] === buffer + 3) {
            this.memory.main[buffer + 2] = this.memory.main[buffer] // go "back" to the end
          } else {
            this.memory.main[buffer + 2] -= 1 // go back one
          }
          if (this.memory.keyecho) {
            send('backspace')
          }
        }
        // put buffer length in keys array
        if (this.memory.main[buffer + 2] >= this.memory.main[buffer + 1]) {
          this.memory.keys[0] = this.memory.main[buffer + 2] - this.memory.main[buffer + 1]
        } else {
          this.memory.keys[0] = this.memory.main[buffer + 2] - this.memory.main[buffer + 1] + this.memory.main[buffer] - buffer - 2
        }
      }
    }
    // arrow keys
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault() // don't scroll the page
    }
    // normal case
    const keycode = keycodeFromKey(event.key)
    this.memory.query[9] = keycode
    this.memory.query[10] = 128
    if (event.shiftKey) {
      this.memory.query[10] += 8
    }
    if (event.altKey) {
      this.memory.query[10] += 16
    }
    if (event.ctrlKey) {
      this.memory.query[10] += 32
    }
    this.memory.keys[keycode] = this.memory.query[10]
  }

  /** stores that a key has been released */
  releaseKey (event: KeyboardEvent): void {
    const keycode = keycodeFromKey(event.key)
    // keyup should set positive value to negative; use Math.abs to ensure the result is negative,
    // in case two keydown events fire close together, before the first keyup event fires
    this.memory.query[9] = -Math.abs(this.memory.query[9])
    this.memory.query[10] = -Math.abs(this.memory.query[10])
    this.memory.keys[keycode] = -Math.abs(this.memory.keys[keycode])
  }

  /** puts a key in the keybuffer */
  putInBuffer (event: KeyboardEvent): void {
    const keycode = keycodeFromKey(event.key)
    const buffer = this.memory.main[1]
    if (buffer > 0) { // there is a keybuffer
      let next = 0
      if (this.memory.main[buffer + 2] === this.memory.main[buffer]) {
        next = buffer + 3 // loop back round to the start
      } else {
        next = this.memory.main[buffer + 2] + 1
      }
      if (next !== this.memory.main[buffer + 1]) {
        this.memory.main[this.memory.main[buffer + 2]] = keycode
        this.memory.main[buffer + 2] = next
        // put buffer length in keys array
        if (this.memory.main[buffer + 2] >= this.memory.main[buffer + 1]) {
          this.memory.keys[0] = this.memory.main[buffer + 2] - this.memory.main[buffer + 1]
        } else {
          this.memory.keys[0] = this.memory.main[buffer + 2] - this.memory.main[buffer + 1] + this.memory.main[buffer] - buffer - 2
        }
        // maybe show in the console
        if (this.memory.keyecho) {
          send('log', String.fromCharCode(keycode))
        }
      }
    }
  }

  /** stores mouse coordinates in virtual memory */
  storeMouseXY (event: MouseEvent|TouchEvent): void {
    switch (event.type) {
      case 'mousemove':
        this.memory.query[7] = this.virtx((event as MouseEvent).clientX)
        this.memory.query[8] = this.virty((event as MouseEvent).clientY)
        break

      case 'touchmove': // fallthrough
      case 'touchstart':
        this.memory.query[7] = this.virtx((event as TouchEvent).touches[0].clientX)
        this.memory.query[8] = this.virty((event as TouchEvent).touches[0].clientY)
        break
    }
  }

  /** stores mouse click coordinates in virtual memory */
  storeClickXY (event: MouseEvent|TouchEvent): void {
    const now = Date.now()
    this.memory.query[4] = 128
    if (event.shiftKey) {
      this.memory.query[4] += 8
    }
    if (event.altKey) {
      this.memory.query[4] += 16
    }
    if (event.ctrlKey) {
      this.memory.query[4] += 32
    }
    if (now - this.memory.query[11] < 300) {
      this.memory.query[4] += 64 // double-click
    }
    this.memory.query[11] = now // save to check for next double-click
    switch (event.type) {
      case 'mousedown':
        this.memory.query[5] = this.virtx((event as MouseEvent).clientX)
        this.memory.query[6] = this.virty((event as MouseEvent).clientY)
        switch ((event as MouseEvent).button) {
          case 0:
            this.memory.query[4] += 1
            this.memory.query[1] = this.memory.query[4]
            this.memory.query[2] = -1
            this.memory.query[3] = -1
            break

          case 1:
            this.memory.query[4] += 4
            this.memory.query[1] = -1
            this.memory.query[2] = -1
            this.memory.query[3] = this.memory.query[4]
            break

          case 2:
            this.memory.query[4] += 2
            this.memory.query[1] = -1
            this.memory.query[2] = this.memory.query[4]
            this.memory.query[3] = -1
            break
        }
        break

      case 'touchstart':
        this.memory.query[5] = this.virtx((event as TouchEvent).touches[0].clientX)
        this.memory.query[6] = this.virty((event as TouchEvent).touches[0].clientY)
        this.memory.query[4] += 1
        this.memory.query[1] = this.memory.query[4]
        this.memory.query[2] = -1
        this.memory.query[3] = -1
        this.storeMouseXY(event)
        break
    }
  }

  /** stores mouse release coordinates in virtual memory */
  releaseClickXY (event: MouseEvent|TouchEvent): void {
    this.memory.query[4] = -this.memory.query[4]
    switch (event.type) {
      case 'mouseup':
        switch ((event as MouseEvent).button) {
          case 0:
            this.memory.query[1] = -this.memory.query[1]
            break

          case 1:
            this.memory.query[2] = -this.memory.query[3]
            break

          case 2:
            this.memory.query[2] = -this.memory.query[2]
            break
        }
        break

      case 'touchend':
        this.memory.query[1] = -this.memory.query[1]
        break
    }
  }

  /** prevents event default (for blocking context menus on right click) */
  preventDefault (event: Event): void {
    event.preventDefault()
  }

  /** breaks out of DETECT loop and resumes program execution if the right key is pressed */
  detect (event: KeyboardEvent): void {
    if (keycodeFromKey(event.key) === this.detectKeycode) {
      this.memory.stack.pop()
      this.memory.stack.push(-1) // -1 for true
      window.clearTimeout(this.detectTimeoutID)
      this.execute()
    }
  }

  /** breaks out of READLINE loop and resumes program execution if ENTER is pressed */
  readline (event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      // get heap string from the buffer, up to the first ENTER
      const bufferAddress = this.memory.main[1]
      const bufferEndAddress = this.memory.main[this.memory.main[1]]
      let string = ''
      let readNextAddress = this.memory.main[bufferAddress + 1]
      const readLastAddress = this.memory.main[bufferAddress + 2]
      while (readNextAddress !== readLastAddress && this.memory.main[readNextAddress] !== 13) {
        string += String.fromCharCode(this.memory.main[readNextAddress])
        readNextAddress = (readNextAddress < bufferEndAddress)
          ? readNextAddress + 1
          : bufferEndAddress + 3 // loop back to the start
      }
      // move past the ENTER
      this.memory.main[bufferAddress + 1] = (readNextAddress < bufferEndAddress)
        ? readNextAddress + 1
        : bufferEndAddress + 3 // loop back to the start
      // put the string on the heap
      this.memory.makeHeapString(string)
      // clear the timeout and resume ordinary pcode execution
      window.clearTimeout(this.readlineTimeoutID)
      this.execute()
    }
  }

  /** gets current turtle properties */
  turtle (): Turtle {
    return {
      x: this.turtx(this.memory.turtx),
      y: this.turty(this.memory.turty),
      d: this.memory.turtd,
      a: this.memory.turta,
      p: this.turtt(this.memory.turtt),
      c: hex(this.memory.turtc)
    }
  }

  /** converts turtx to virtual canvas coordinate */
  turtx (x: number): number {
    const exact = ((x - this.startx) * this.width) / this.sizex
    return this.doubled ? Math.round(exact) + 1 : Math.round(exact)
  }

  /** converts turty to virtual canvas coordinate */
  turty (y: number): number {
    const exact = ((y - this.starty) * this.height) / this.sizey
    return this.doubled ? Math.round(exact) + 1 : Math.round(exact)
  }

  /** converts turtt to virtual canvas thickness */
  turtt (t: number): number {
    return this.doubled ? t * 2 : t
  }

  /** maps turtle coordinates to virtual turtle coordinates */
  vcoords (coords: [number, number]): [number, number] {
    return [this.turtx(coords[0]), this.turty(coords[1])]
  }

  /** converts x to virtual canvas coordinate */
  virtx (x: number): number {
    const { left, width } = this.canvas.getBoundingClientRect()
    const exact = (((x - left) * this.sizex) / width) + this.startx
    return Math.round(exact)
  }

  /** converts y to virtual canvas coordinate */
  virty (y: number): number {
    const { height, top } = this.canvas.getBoundingClientRect()
    const exact = (((y - top) * this.sizey) / height) + this.starty
    return Math.round(exact)
  }
}

// export a new machine object
export default new Machine()
