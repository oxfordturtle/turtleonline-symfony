/**
 * Machine runtime options.
 */
export type Options = {
  showCanvasOnRun: boolean
  showOutputOnWrite: boolean
  showMemoryOnDump: boolean
  drawCountMax: number
  codeCountMax: number
  smallSize: number
  stackSize: number
  traceOnRun: boolean
  activateHCLR: boolean
  preventStackCollision: boolean
  rangeCheckArrays: boolean
}

export const defaultOptions: Options = {
  showCanvasOnRun: true,
  showOutputOnWrite: false,
  showMemoryOnDump: true,
  drawCountMax: 4,
  codeCountMax: 100000,
  smallSize: 60,
  stackSize: 20000,
  traceOnRun: false,
  activateHCLR: true,
  preventStackCollision: true,
  rangeCheckArrays: true
}
