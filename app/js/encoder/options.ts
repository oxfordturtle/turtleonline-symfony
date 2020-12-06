import { defaults } from '../constants/properties'

/** compiler options */
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

/** default compiler options */
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

