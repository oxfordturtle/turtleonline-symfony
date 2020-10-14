/*
 * The machine memory component.
 */
import { fill, td, th, tr } from '../../tools/elements'
import { on } from '../../tools/hub'

// the memory table bodies
const stackTableBody = document.querySelector('[data-component="memoryStackTableBody"]') as HTMLElement
const heapTableBody = document.querySelector('[data-component="memoryHeapTableBody"]') as HTMLElement

const wrap = 10

if (stackTableBody && heapTableBody) {
  // register to keep in sync with system state
  on('memoryDumped', function (memory: { stack: number[], heap: number[], heapBase: number }): void {
    const stackSplit: number[][] = []
    const heapSplit: number[][] = []
    while (memory.stack.length > 0) {
      stackSplit.push(memory.stack.splice(0, wrap))
    }
    while (memory.heap.length > 0) {
      heapSplit.push(memory.heap.splice(0, wrap))
    }
    fill(stackTableBody, stackSplit.map(tableRow.bind(null, 0)))
    fill(heapTableBody, heapSplit.map(tableRow.bind(null, memory.heapBase)))
  })
}

// function to create a tr row of bytes
function tableRow (offset: number, bytes: number[], index: number) {
  const content = bytes.map(byte => td({ content: byte.toString(10) }))
  content.unshift(th({ content: (offset + index * wrap).toString(10) }))
  return tr({ content })
}
