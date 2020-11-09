// module imports
import { defaults } from '../constants/properties'

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
  showCanvasOnRun: defaults.showCanvasOnRun,
  showOutputOnWrite: defaults.showOutputOnWrite,
  showMemoryOnDump: defaults.showMemoryOnDump,
  drawCountMax: defaults.drawCountMax,
  codeCountMax: defaults.codeCountMax,
  smallSize: defaults.smallSize,
  stackSize: defaults.stackSize,
  traceOnRun: defaults.traceOnRun,
  activateHCLR: defaults.activateHCLR,
  preventStackCollision: defaults.preventStackCollision,
  rangeCheckArrays: defaults.rangeCheckArrays
}
