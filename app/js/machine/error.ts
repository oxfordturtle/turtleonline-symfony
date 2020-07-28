/*
 * Machine error object.
 */
export default class MachineError extends Error {
  constructor (message: string) {
    super(message)
  }
}
