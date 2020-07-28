/*
 * System error object.
 */
export default class SystemError extends Error {
  constructor (message: string) {
    super(message)
  }
}
