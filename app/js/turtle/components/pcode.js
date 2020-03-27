/*
 * The program pcode component.
 */
import * as dom from './dom.js'
import { PCode, pcodeArgs } from '../definitions/pcodes.ts'
import state from '../state/index.ts'

// radio options
const assemblerInput = dom.createElement('input', { type: 'radio', name: 'pcodeOptions1' })
const machineInput = dom.createElement('input', { type: 'radio', name: 'pcodeOptions1' })
const decimalInput = dom.createElement('input', { type: 'radio', name: 'pcodeOptions2' })
const hexadecimalInput = dom.createElement('input', { type: 'radio', name: 'pcodeOptions2' })

// the checkbox div (exported)
export const options = dom.createElement('div', {
  classes: 'turtle-checkboxes',
  content: [
    dom.createElement('label', { content: [assemblerInput, dom.createTextNode('Assembler Code')] }),
    dom.createElement('label', { content: [machineInput, dom.createTextNode('Machine Code')] }),
    dom.createElement('label', { content: [decimalInput, dom.createTextNode('Decimal')] }),
    dom.createElement('label', { content: [hexadecimalInput, dom.createTextNode('Hexadecimal')] })
  ]
})

// the pcode display (exported)
export const list = dom.createElement('ol', { classes: 'turtle-pcode' })

// setup event listeners on interactive elements
assemblerInput.addEventListener('change', () => {
  state.assembler = !state.assembler
})

machineInput.addEventListener('change', () => {
  state.assembler = !state.assembler
})

decimalInput.addEventListener('change', () => {
  state.decimal = !state.decimal
})

hexadecimalInput.addEventListener('change', () => {
  state.decimal = !state.decimal
})

// register to keep in sync with the application state
state.on('pcode-changed', ({ pcode, assembler, decimal }) => {
  if (assembler) {
    assemblerInput.setAttribute('checked', 'checked')
  } else {
    machineInput.setAttribute('checked', 'checked')
  }
  if (decimal) {
    decimalInput.setAttribute('checked', 'checked')
  } else {
    hexadecimalInput.setAttribute('checked', 'checked')
  }
  dom.setContent(list, pcode.map(pcodeListItem.bind(null, assembler, decimal)))
})

// function to create a list item from a line of PCode
function pcodeListItem (assembler, decimal, line) {
  const content = assembler
    ? assemble(line, 0, decimal)
    : line.reduce((sofar, current) => sofar.concat(cell(current, decimal)), [])
  while (content.length % 8 > 0) {
    content.push(dom.createElement('div'))
  }
  return dom.createElement('li', { content })
}

// function to create an array of divs for assembler code from a line of PCode
function assemble (line, index, decimal) {
  const hit = PCode[line[index]]
  const pcode = hit ? [cell(hit.toUpperCase())] : [cell(line[index], decimal)]
  let args = 0
  if (hit) {
    if (pcodeArgs(line[index]) < 0) {
      const length = line[index + 1]
      pcode.push(cell(length, decimal))
      args += 1
      while (args <= length) {
        args += 1
        pcode.push(cell(String.fromCharCode(line[index + args])))
      }
    } else {
      while (args < pcodeArgs(line[index])) {
        args += 1
        pcode.push(cell(line[index + args], decimal))
      }
    }
  }
  if (index + args < line.length - 1) {
    return pcode.concat(assemble(line, index + args + 1, decimal))
  }
  return pcode
}

// function to create a div element from a PCode
function cell (content, decimal) {
  if (content === null || content === undefined) {
    return dom.createElement('div', { content: ':(' })
  } else if (decimal === undefined) {
    return dom.createElement('div', { content })
  } else if (decimal) {
    return dom.createElement('div', { content: content.toString(10) })
  } else {
    return dom.createElement('div', { content: content.toString(16).toUpperCase() })
  }
}
