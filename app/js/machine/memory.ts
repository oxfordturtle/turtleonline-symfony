/**
 * Turtle virtual machine memory.
 */
import { Options } from './options'

// offsets for turtle properties
const turtxIndex = 1
const turtyIndex = 2
const turtdIndex = 3
const turtaIndex = 4
const turttIndex = 5
const turtcIndex = 6

/** the machine memory class */
class Memory {
  // the memory arrays
  main: number[] = []
  keys: number[] = []
  query: number[] = []
  // the memory stacks
  coords: [number, number][] = []
  stack: number[] = []
  memoryStack: number[] = []
  returnStack: number[] = []
  subroutineStack: number[] = []
  // stack top and heapBase markers
  stackTop: number
  heapGlobal: number
  heapBase: number
  heapTemp: number
  heapPerm: number
  heapMax: number
  // runtime variables
  startTime: number
  update: boolean
  keyecho: boolean
  detect: any
  readline: any
  seed: number

  /** initialises the machine memory */
  init (options: Options): void {
    // set up the memory arrays
    this.main.length = 0x200000
    this.keys.length = 0x100
    this.query.length = 0x10
    this.main.fill(0)
    this.keys.fill(-1)
    this.query.fill(-1)
    // setup the memory stacks
    this.coords.length = 0
    this.stack.length = 0
    this.memoryStack.length = 0
    this.returnStack.length = 0
    this.subroutineStack.length = 0
    // set up stack top and markers.heapBase markers
    this.stackTop = 0
    this.heapGlobal = -1
    this.heapBase = options.stackSize
    this.heapTemp = this.heapBase
    this.heapPerm = this.heapTemp
    this.heapMax = this.heapTemp
    // setup runtime variables (global to this module)
    this.startTime = Date.now()
    this.update = true
    this.keyecho = true
    this.detect = null
    this.readline = null
    this.seed = Date.now()
  }

  /** returns the value at the given address in main memory */
  peek (address: number): number {
    return this.main[address]
  }

  /** writes the given value at the given address in main memory */
  poke (address: number, value: number): void {
    this.main[address] = value
  }

  /** returns the value at the address stored at the given address */
  peekAddress (address: number): number {
    return this.main[this.main[address]]
  }

  /** writes the given value at the address stored at the given address */
  pokeAddress (address: number, value: number): void {
    this.main[this.main[address]] = value
  }

  /** returns the value at the address stored at the given address with offset */
  peekAddressOffset (address: number, offset: number): number {
    return this.main[this.main[address] + offset]
  }

  /** writes the given value at the address stored at the given address with offset */
  pokeAddressOffset (address: number, offset: number, value: number): void {
    this.main[this.main[address] + offset] = value
  }

  /** returns the value at the given address in the keys array */
  peekKeys (address: number): number {
    return this.keys[address]
  }

  /** writes the given value at the given address in the keys array */
  pokeKeys (address: number, value: number): void {
    this.keys[address] = value
  }

  /** returns the value at the given address in the query array */
  peekQuery (address: number): number {
    return this.query[address]
  }

  /** writes the given value at the given address in the query array */
  pokeQuery (address: number, value: number): void {
    this.query[address] = value
  }

  /** gets the turtx value */
  get turtx (): number {
    return this.peekAddressOffset(0, turtxIndex)
  }

  /** gets the turty value */
  get turty (): number {
    return this.peekAddressOffset(0, turtyIndex)
  }

  /** gets the turtd value */
  get turtd (): number {
    return this.peekAddressOffset(0, turtdIndex)
  }

  /** gets the turta value */
  get turta (): number {
    return this.peekAddressOffset(0, turtaIndex)
  }

  /** gets the turtx value */
  get turtt (): number {
    return this.peekAddressOffset(0, turttIndex)
  }

  /** gets the turtc value */
  get turtc (): number {
    return this.peekAddressOffset(0, turtcIndex)
  }

  /** sets the turtx value */
  set turtx (turtx: number) {
    this.pokeAddressOffset(0, turtxIndex, turtx)
  }

  /** sets the turty value */
  set turty (turty: number) {
    this.pokeAddressOffset(0, turtyIndex, turty)
  }

  /** sets the turtd value */
  set turtd (turtd: number) {
    this.pokeAddressOffset(0, turtdIndex, turtd)
  }

  /** sets the turta value */
  set turta (turta: number) {
    this.pokeAddressOffset(0, turtaIndex, turta)
  }

  /** sets the turtx value */
  set turtt (turtt: number) {
    this.pokeAddressOffset(0, turttIndex, turtt)
  }

  /** sets the turtc value */
  set turtc (turtc: number) {
    this.pokeAddressOffset(0, turtcIndex, turtc)
  }

  /** gets all Turtle properties */
  get turtle () {
    return {
      x: this.turtx,
      y: this.turty,
      d: this.turtd,
      a: this.turta,
      t: this.turtt,
      c: this.turtc
    }
  }

  /** makes a string on the heap */
  makeHeapString (string: string): void {
    const stringArray = Array.from(string).map(c => c.charCodeAt(0))
    this.stack.push(this.heapTemp + 1)
    this.heapTemp += 1
    this.main[this.heapTemp] = string.length
    for (const code of stringArray) {
      this.heapTemp += 1
      this.main[this.heapTemp] = code
    }
    this.heapMax = Math.max(this.heapTemp, this.heapMax)
  }

  /** gets a string from the heap */
  getHeapString (address: number): string {
    const length = this.main[address]
    const start = address + 1
    const charArray = this.main.slice(start, start + length)
    const string = charArray.map(c => String.fromCharCode(c)).join('')
    if (address + length + 1 > this.heapPerm) {
      this.heapTemp = address + length
    }
    return string
  }

  /** fills a chunk of main memory with zeros */
  zero (start: number, length: number): void {
    if (length > 0) {
      this.main[start] = 0
      this.zero(start + 1, length - 1)
    }
  }

  /** copies one chunk of memory into another */
  copy (source: number, target: number, length: number): void {
    if (length > 0) {
      this.main[target] = this.main[source]
      this.copy(source + 1, target + 1, length - 1)
    }
  }

  // generates a pseudo-random number (using seed value)
  random (): number {
    const x = Math.sin(this.seed++) * 10000
    return x - Math.floor(x)
  }

  /** exports the contents of the main memory (for display) */
  dump (): { stack: number[], heap: number[], heapBase: number } {
    const stack = this.main.slice(0, this.stackTop + 1)
    const heap = this.main.slice(this.heapBase, this.heapMax)
    return { stack, heap, heapBase: this.heapBase }
  }
}

export default new Memory()
