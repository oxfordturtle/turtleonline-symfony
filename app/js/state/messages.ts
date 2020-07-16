/**
 * The central communications hub; other modules use this to send messages to
 * each other, and register callbacks on outgoing messages.
 */

// message type
export type Message = typeof messages[number]

// an array of messages
const messages = [
  'menus-open-changed',
  'menu-changed',
  'fullscreen-changed',
  'tab-changed',
  'mode-changed',
  'machine-played',
  'machine-paused',
  'machine-unpaused',
  'machine-halted'
] as const

// reply (callback type signature)
export type Reply = (data: any) => void

// record of callbacks to execute when sending a message
const replies: Partial<Record<Message, Reply[]>> = {}

// registers a callback on a message
export function on (message: Message, callback: Reply) {
  if (!replies[message]) {
    replies[message] = [callback]
  } else {
    replies[message].push(callback)
  }
}

// sends a message
export function send (message: Message, data?: any) {
  if (replies[message]) {
    for (const callback of replies[message]) {
      callback(data)
    }
  }
}
