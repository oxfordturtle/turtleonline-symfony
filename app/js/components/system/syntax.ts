/*
 * The program lexemes component.
 */
import highlight from '../../compile/highlight'
import state from '../../state/index'
import { fill, tr, td, code } from '../../tools/elements'

// the lexemes table body
const syntaxTableBody = document.querySelector('[data-component="syntaxTableBody"]') as HTMLElement

if (syntaxTableBody) {
// register to keep in sync with the application state
  state.on('lexemesChanged', function () {
    fill(syntaxTableBody, state.lexemes.map(tableBodyRow))
  })
}

// function to create a table body row from a lexeme
function tableBodyRow (lexeme: any, index: number): HTMLTableRowElement {
  return tr({
    content: [
      td({ content: `${index + 1}` }),
      td({ content: lexeme.line.toString(10) }),
      td({
        className: 'wide',
        content: [
          code({ content: lexeme.content ? highlight(lexeme.content, state.language) : '' })
        ]
      }),
      td({ className: 'wide', content: lexeme.type })
    ]
  })
}
