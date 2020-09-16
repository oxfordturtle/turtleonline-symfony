/**
 * The central communications hub of the application. Implements a basic pub/sub model
 */
import { Message } from '../constants/messages'

/** record of functions to call when message is sent */
const replies: Partial<Record<Message, Reply[]>> = {}

/** registers a function to call when message is sent */
export function on (message: Message, callback: Reply) {
  if (replies[message]) {
    (replies[message] as Reply[]).push(callback)
  } else {
    replies[message] = [callback]
  }
}

/** 'sends' a message (i.e. executes all callbacks) */
export function send (message: Message, data: any = null): void {
  // execute any callbacks registered for this message
  if (replies[message]) {
    for (const reply of replies[message] as Reply[]) {
      reply(data)
    }
  }

  // if the file has changed, reply that the file properties have changed as well
  if (message === 'currentFileIndexChanged') {
    send('filenameChanged')
    send('codeChanged')
  }
}

/** signature for reply functions */
export type Reply = (data: any) => void
