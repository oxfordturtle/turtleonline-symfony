/**
 * Compiler options.
 */
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
  canvasStartSize: 1000,
  setupDefaultKeyBuffer: true,
  turtleAttributesAsGlobals: true,
  initialiseLocals: true,
  allowCSTR: true,
  separateReturnStack: false,
  separateMemoryControlStack: false,
  separateSubroutineRegisterStack: false
}

