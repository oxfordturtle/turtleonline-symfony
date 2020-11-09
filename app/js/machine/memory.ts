// type imports
import type { Options } from './options'

// the memory arrays
export const main: number[] = []
export const keys: number[] = []
export const query: number[] = []

// the memory stacks
export const coords: [number, number][] = []
export const stack: number[] = []
export const memoryStack: number[] = []
export const returnStack: number[] = []
export const subroutineStack: number[] = []

// stack top and heapBase markers
let stackTop: number = 0
let heapGlobal: number = 0
let heapBase: number = 0
let heapTemp: number = 0
let heapPerm: number = 0
let heapMax: number = 0
let heapClearPending: boolean = false

// offsets for turtle properties
const turtxIndex = 1
const turtyIndex = 2
const turtdIndex = 3
const turtaIndex = 4
const turttIndex = 5
const turtcIndex = 6

/** initialises the machine memory */
export function init (options: Options): void {
  // set up the memory arrays
  main.length = 0x200000
  keys.length = 0x100
  query.length = 0x10
  main.fill(0)
  keys.fill(-1)
  query.fill(-1)
  // setup the memory stacks
  coords.length = 0
  stack.length = 0
  memoryStack.length = 0
  returnStack.length = 0
  subroutineStack.length = 0
  // set up stack top and markers.heapBase markers
  stackTop = 0
  heapGlobal = -1
  heapBase = options.stackSize - 1
  heapTemp = heapBase
  heapPerm = heapTemp
  heapMax = heapTemp
}

/** returns the value at the given address in main memory */
export function peek (address: number): number {
  return main[address]
}

/** writes the given value at the given address in main memory */
export function poke (address: number, value: number): void {
  main[address] = value
}

/** returns the value at the address stored at the given address */
export function peekAddress (address: number): number {
  return main[main[address]]
}

/** writes the given value at the address stored at the given address */
export function pokeAddress (address: number, value: number): void {
  main[main[address]] = value
}

/** returns the value at the address stored at the given address with offset */
export function peekAddressOffset (address: number, offset: number): number {
  return main[main[address] + offset]
}

/** writes the given value at the address stored at the given address with offset */
export function pokeAddressOffset (address: number, offset: number, value: number): void {
  main[main[address] + offset] = value
}

/** returns the value at the given address in the keys array */
export function peekKeys (address: number): number {
  return keys[address]
}

/** writes the given value at the given address in the keys array */
export function pokeKeys (address: number, value: number): void {
  keys[address] = value
}

/** returns the value at the given address in the query array */
export function peekQuery (address: number): number {
  return query[address]
}

/** writes the given value at the given address in the query array */
export function pokeQuery (address: number, value: number): void {
  query[address] = value
}

/** gets the turtx value */
export function getTurtX (): number {
  return peekAddressOffset(0, turtxIndex)
}

/** gets the turty value */
export function getTurtY (): number {
  return peekAddressOffset(0, turtyIndex)
}

/** gets the turtd value */
export function getTurtD (): number {
  return peekAddressOffset(0, turtdIndex)
}

/** gets the turta value */
export function getTurtA (): number {
  return peekAddressOffset(0, turtaIndex)
}

/** gets the turtx value */
export function getTurtT (): number {
  return peekAddressOffset(0, turttIndex)
}

/** gets the turtc value */
export function getTurtC (): number {
  return peekAddressOffset(0, turtcIndex)
}

/** sets the turtx value */
export function setTurtX (turtx: number) {
  pokeAddressOffset(0, turtxIndex, turtx)
}

/** sets the turty value */
export function setTurtY (turty: number) {
  pokeAddressOffset(0, turtyIndex, turty)
}

/** sets the turtd value */
export function setTurtD (turtd: number) {
  pokeAddressOffset(0, turtdIndex, turtd)
}

/** sets the turta value */
export function setTurtA (turta: number) {
  pokeAddressOffset(0, turtaIndex, turta)
}

/** sets the turtx value */
export function setTurtT (turtt: number) {
  pokeAddressOffset(0, turttIndex, turtt)
}

/** sets the turtc value */
export function setTurtC (turtc: number) {
  pokeAddressOffset(0, turtcIndex, turtc)
}

/** gets all Turtle properties */
export function getTurtle () {
  return {
    x: getTurtX(),
    y: getTurtY(),
    d: getTurtD(),
    a: getTurtA(),
    t: getTurtT(),
    c: getTurtC()
  }
}

/** gets the heap global */
export function getHeapGlobal (): number {
  return heapGlobal
}

/** sets the heap global */
export function setHeapGlobal (value: number): void {
  heapGlobal = value
}

/** gets the heap perm */
export function getHeapPerm (): number {
  return heapPerm
}

/** sets the stack top */
export function setStackTop (value: number): void {
  stackTop = Math.max(value, stackTop)
}

/** gets the heap temp value */
export function getHeapTemp (): number {
  return heapTemp
}

/** sets the heap temp value */
export function setHeapTemp (value: number): void {
  heapTemp = value
}

/** sets the heap max value */
export function setHeapMax (value: number): void {
  Math.max(value, heapMax)
}

/** fixes the top of the heap */
export function heapFix (): void {
  heapPerm = heapTemp
}

/** clears the heap */
export function heapClear (): void {
  if (stack.length === 0) { // to avoid the problem of e.g.
    heapTemp = heapPerm     // pending string concatenation
  } else {
    heapClearPending = true
  }
}

/** executes a delayed heap clear (called at the start of each cycle) */
export function delayedHeapClear (): void {
  if (heapClearPending) {
    heapClearPending = false
    heapClear()
  }
}

/** resets the heap */
export function heapReset (): void {
  if (heapGlobal > -1) {
    heapTemp = heapGlobal
    heapPerm = heapGlobal
  }
}

/** makes a string on the heap */
export function makeHeapString (string: string): void {
  const stringArray = Array.from(string).map(c => c.charCodeAt(0))
  stack.push(heapTemp + 1)
  heapTemp += 1
  main[heapTemp] = string.length
  for (const code of stringArray) {
    heapTemp += 1
    main[heapTemp] = code
  }
  heapMax = Math.max(heapTemp, heapMax)
}

/** gets a string from the heap */
export function getHeapString (address: number): string {
  // TODO: throw error (or something) in case there is no string at the given
  // address on the heap
  const length = main[address]
  const start = address + 1
  const charArray = main.slice(start, start + length)
  const string = charArray.map(c => String.fromCharCode(c)).join('')
  if (address + length + 1 > heapPerm) {
    heapTemp = address + length
  }
  return string
}

/** fills a chunk of main memory with zeros */
export function zero (start: number, length: number): void {
  if (length > 0) {
    main[start] = 0
    zero(start + 1, length - 1)
  }
}

/** copies one chunk of memory into another */
export function copy (source: number, target: number, length: number): void {
  if (length > 0) {
    main[target] = main[source]
    copy(source + 1, target + 1, length - 1)
  }
}

/** exports the contents of the main memory (for display) */
export function dump (): { stack: number[], heap: number[], heapBase: number } {
  const stack = main.slice(0, stackTop + 1)
  const heap = main.slice(heapBase + 1, heapMax + 1)
  return { stack, heap, heapBase: heapBase + 1 }
}
