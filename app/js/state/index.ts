/**
 * The turtle system state.
 */
import { Menu } from './menu'
import { Mode } from './modes'
import { on, send } from './messages'
import * as session from './session'
import { Language } from '../definitions/languages'

class State {
  // session variables (saved to session storage)
  #fullscreen: boolean
  // local variables (saved to local storage)
  #mode: Mode
  language: Language
  currentFileIndex: number

  // constructor
  constructor () {
    // refresh session variables (or set defaults)
    this.#fullscreen = session.get('fullscreen') as boolean || false
    // refresh local variables (or set defaults)
    this.#mode = session.get('mode') as Mode || 'normal'
  }

  // getters for session variables
  get fullscreen (): boolean {
    return this.#fullscreen
  }

  // getters for local variables
  get mode (): Mode {
    return this.#mode
  }

  // setters for session variables
  set fullscreen (fullscreen: boolean) {
    this.#fullscreen = fullscreen
    send('fullscreen-changed', fullscreen)
    session.set('fullscreen', fullscreen)
  }

  // setters for local variables
  set mode (mode: Mode) {
    this.#mode = mode
    send('mode-changed', mode)
    session.set('mode', mode)
  }

  // other state change methods
  ready (): void {
    // signal to update page with session variables
    send('fullscreen-changed', this.fullscreen)
    // signal to update page with local variables
    send('mode-changed', this.mode)
  }

  play (): void {
    send('machine-played')
  }

  pause (): void {
    send('machine-paused')
  }

  halt (): void {
    send('machine-halted')
  }

  // expose on method from messages module
  on = on
}

export default new State()
