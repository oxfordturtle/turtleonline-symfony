import Comment from '../../compiler/lexer/comment'
import state from '../../state/index'
import { fill, tr, td } from '../../tools/elements'

const commentsTableBody = document.querySelector('[data-component="commentsTableBody"]') as HTMLElement

if (commentsTableBody) {
  state.on('commentsChanged', function (): void {
    fill(commentsTableBody, state.comments.map(commentTableRow))
  })
}

function commentTableRow (comment: Comment): HTMLTableRowElement {
  return tr({ content: [
    td({ content: comment.line.toString(10) }),
    td({ content: comment.index.toString(10) }),
    td({ content: comment.content })
  ] })
}
