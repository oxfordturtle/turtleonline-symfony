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
