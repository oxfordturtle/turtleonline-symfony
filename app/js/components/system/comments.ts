// type imports
import type { CommentLexeme } from '../../lexer/lexeme'

// module imports
import state from '../../state/index'
import { fill, tr, td } from '../../tools/elements'
import { on } from '../../tools/hub'

// get relevant elements
const commentsTableBody = document.querySelector('[data-component="commentsTableBody"]') as HTMLElement

if (commentsTableBody) {
  // register to keep in sync with system state
  on('lexemesChanged', function (): void {
    fill(commentsTableBody, state.comments.map(commentTableRow))
  })
}

function commentTableRow (comment: CommentLexeme): HTMLTableRowElement {
  return tr({ content: [
    td({ content: comment.line.toString(10) }),
    td({ content: comment.value })
  ] })
}
