/*
 * The machine memory component.
 */
import * as dom from './dom.js'
import { send, on } from '../state/index.js'

// the memory dump button
const dumpButton = dom.createElement('button', { content: 'Show Current State' })

// the memory table bodies
const stackTableBody = dom.createElement('tbody')
const heapTableBody = dom.createElement('tbody')

// the buttons div (exported)
export const buttons = dom.createElement('div', { classes: 'turtle-buttons', content: [dumpButton] })

// the memory stack table (exported)
export const stack = dom.createElement('div', {
  classes: 'turtle-memory-container',
  content: [
    dom.createElement('table', {
      content: [
        dom.createElement('thead', {
          content: [
            dom.createElement('tr', {
              content: [
                dom.createElement('td', { content: 'Stack' }),
                dom.createElement('th', { content: '+0' }),
                dom.createElement('th', { content: '+1' }),
                dom.createElement('th', { content: '+2' }),
                dom.createElement('th', { content: '+3' }),
                dom.createElement('th', { content: '+4' }),
                dom.createElement('th', { content: '+5' }),
                dom.createElement('th', { content: '+6' }),
                dom.createElement('th', { content: '+7' })
              ]
            })
          ]
        }),
        stackTableBody
      ]
    })
  ]
})

// the memory heap table (exported)
export const heap = dom.createElement('div', {
  classes: 'turtle-memory-container',
  content: [
    dom.createElement('table', {
      content: [
        dom.createElement('thead', {
          content: [
            dom.createElement('tr', {
              content: [
                dom.createElement('td', { content: 'Heap' }),
                dom.createElement('th', { content: '+0' }),
                dom.createElement('th', { content: '+1' }),
                dom.createElement('th', { content: '+2' }),
                dom.createElement('th', { content: '+3' }),
                dom.createElement('th', { content: '+4' }),
                dom.createElement('th', { content: '+5' }),
                dom.createElement('th', { content: '+6' }),
                dom.createElement('th', { content: '+7' })
              ]
            })
          ]
        }),
        heapTableBody
      ]
    })
  ]
})

// add event listeners to interactive elements
dumpButton.addEventListener('click', (e) => {
  send('dump-memory')
  dumpButton.blur()
})

// register to keep in sync with system state
on('dump-memory', (memory) => {
  const stackSplit = []
  const heapSplit = []
  while (memory.stack.length > 0) {
    stackSplit[stackSplit.length] = memory.stack.splice(0, 8)
  }
  while (memory.heap.length > 0) {
    heapSplit[heapSplit.length] = memory.heap.splice(0, 8)
  }
  dom.setContent(stackTableBody, stackSplit.map(tableRow.bind(null, 0)))
  dom.setContent(heapTableBody, heapSplit.map(tableRow.bind(null, 0)))
})

// function to create a tr row of bytes
function tableRow (offset, bytes, index) {
  const content = bytes.map(byte => dom.createElement('td', { content: byte.toString(10) }))
  content.unshift(dom.createElement('th', { content: (offset + index * 8).toString(10) }))
  return dom.createElement('tr', { content })
}
