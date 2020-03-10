/*
 * The program pcode component.
 */
import * as dom from './dom.js'
import pcodes from '../constants/pcodes.js'
import { send, on } from '../state/index.js'

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
  send('toggle-assembler')
})

machineInput.addEventListener('change', () => {
  send('toggle-assembler')
})

decimalInput.addEventListener('change', () => {
  send('toggle-decimal')
})

hexadecimalInput.addEventListener('change', () => {
  send('toggle-decimal')
})

// register to keep in sync with the application state
on('pcode-changed', ({ pcode, assembler, decimal }) => {
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
  const hit = pcodes[line[index]]
  const pcode = hit ? [cell(hit.str)] : [cell(line[index], decimal)]
  let args = 0
  if (hit) {
    if (hit.args < 0) {
      const length = line[index + 1]
      args += 1
      while (args <= length) {
        args += 1
        pcode.push(cell(String.fromCharCode(line[index + args])))
      }
    } else {
      while (args < hit.args) {
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
