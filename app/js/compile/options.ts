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
