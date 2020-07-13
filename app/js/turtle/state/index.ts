import { Tab } from './tabs'
import { Message, Reply } from './messages'

class State {
  // state variables
  #menuOpen: boolean
  #tab: Tab
  #fullscreen: boolean
  #replies: Partial<Record<Message, Reply[]>>

  // constructor
  constructor () {
    this.#menuOpen = false
    this.#tab = 'canvas'
    this.#fullscreen = false
    this.#replies = {}
  }

  // getters
  get menuOpen (): boolean {
    return this.#menuOpen
  }

  get fullscreen (): boolean {
    return this.#fullscreen
  }

  // setters
  set menuOpen (menuOpen: boolean) {
    this.#menuOpen = menuOpen
    this.send('menu-open-changed', menuOpen)
  }

  set tab (tab: Tab) {
    this.#tab = tab
    this.send('tab-changed', tab)
  }

  set fullscreen (fullscreen: boolean) {
    this.#fullscreen = fullscreen
    this.send('fullscreen-changed', fullscreen)
  }

  // other state change methods
  ready (): void {
    this.send('tab-changed', this.#tab)
  }

  play (): void {
    this.send('machine-played')
  }

  pause (): void {
    this.send('machine-paused')
  }

  halt (): void {
    this.send('machine-halted')
  }

  // register callbacks
  on (message: Message, callback: Reply) {
    if (!this.#replies[message]) {
      this.#replies[message] = [callback]
    } else {
      this.#replies[message].push(callback)
    }
  }

  // send signals to subscribed listeners
  send (message: Message, data?: any) {
    if (this.#replies[message]) {
      for (const callback of this.#replies[message]) {
        callback(data)
      }
    }
  }
}

export default new State()
