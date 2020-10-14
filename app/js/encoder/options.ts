/**
 * Compiler options.
 */
import { defaults } from '../constants/properties'

export type Options = {
  canvasStartSize: number,
  setupDefaultKeyBuffer: boolean,
  turtleAttributesAsGlobals: boolean,
  initialiseLocals: boolean,
  allowCSTR: boolean,
  separateReturnStack: boolean,
  separateMemoryControlStack: boolean,
  separateSubroutineRegisterStack: boolean
}

export const defaultOptions: Options = {
  canvasStartSize: defaults.canvasStartSize,
  setupDefaultKeyBuffer: defaults.setupDefaultKeyBuffer,
  turtleAttributesAsGlobals: defaults.turtleAttributesAsGlobals,
  initialiseLocals: defaults.initialiseLocals,
  allowCSTR: defaults.allowCSTR,
  separateReturnStack: defaults.separateReturnStack,
  separateMemoryControlStack: defaults.separateMemoryControlStack,
  separateSubroutineRegisterStack: defaults.separateSubroutineRegisterStack
}

