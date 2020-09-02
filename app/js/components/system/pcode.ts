/*
 * The program pcode component.
 */
import { PCode, pcodeArgs } from '../../constants/pcodes'
import state from '../../state/index'
import { fill, div, li } from '../../tools/elements'
import { on } from '../../tools/hub'

// the pcode display
const list = document.querySelector('[data-component="pcodeList"]') as HTMLElement

if (list) {
// register to keep in sync with the application state
on('pcodeChanged', function () {
  fill(list, state.pcode.map(pcodeListItem))
})

}

// function to create a list item from a line of PCode
function pcodeListItem (line: number[]) {
  const content = state.assembler
    ? assemble(line, 0)
    : line.reduce((sofar, current) => sofar.concat(cell(current)), [])
  while (content.length % 8 > 0) {
    content.push(div())
  }
  return li({ content })
}

// function to create an array of divs for assembler code from a line of PCode
function assemble (line: number[], index: number) {
  const hit = PCode[line[index]]
  const pcode = hit ? [cell(hit.toUpperCase())] : [cell(line[index])]
  let args = 0
  if (hit) {
    if (pcodeArgs(line[index]) < 0) {
      const length = line[index + 1]
      pcode.push(cell(length))
      args += 1
      while (args <= length) {
        args += 1
        pcode.push(cell(String.fromCharCode(line[index + args])))
      }
    } else {
      while (args < pcodeArgs(line[index])) {
        args += 1
        pcode.push(cell(line[index + args]))
      }
    }
  }
  if (index + args < line.length - 1) {
    return pcode.concat(assemble(line, index + args + 1))
  }
  return pcode
}

// function to create a div element from a PCode
function cell (content: number|string) {
  if (content === null || content === undefined) {
    return div({ content: ':(' })
  } else if (typeof content === 'string') {
    return div({ content })
  } else if (state.decimal) {
    return div({ content: content.toString(10) })
  } else {
    return div({ content: content.toString(16).toUpperCase() })
  }
}
