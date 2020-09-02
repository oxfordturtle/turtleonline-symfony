import { Lexeme } from '../../lexer/lexeme'
import state from '../../state/index'
import { fill, tr, td } from '../../tools/elements'
import { on } from '../../tools/hub'

const commentsTableBody = document.querySelector('[data-component="commentsTableBody"]') as HTMLElement

if (commentsTableBody) {
  on('lexemesChanged', function (): void {
    fill(commentsTableBody, state.comments.map(commentTableRow))
  })
}

function commentTableRow (comment: Lexeme): HTMLTableRowElement {
  return tr({ content: [
    td({ content: comment.line.toString(10) }),
    td({ content: comment.value })
  ] })
}
