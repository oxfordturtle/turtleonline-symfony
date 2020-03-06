/*
The program lexemes component.
*/
import './style.scss'
import * as dom from '../dom'
import highlight from '../../compiler/highlight'
import { on } from '../../state'

// the lexemes table body
const tableBody = dom.createElement('tbody')

// the lexemes table
const table = dom.createElement('table', {
  classes: 'turtle-lexemes-table',
  content: [
    dom.createElement('thead', {
      content: [
        dom.createElement('tr', {
          content: [
            dom.createElement('th', { content: 'Lex' }),
            dom.createElement('th', { content: 'Line' }),
            dom.createElement('th', { content: 'String' }),
            dom.createElement('th', { classes: 'turtle-wide', content: 'Type' })
          ]
        })
      ]
    }),
    tableBody
  ]
})

// the lexemes element (exported)
export default dom.createElement('div', {
  classes: 'turtle-lexemes',
  content: [table]
})

// function to create a table body row from a lexeme
function tableBodyRow (language, lexeme, index) {
  return dom.createElement('tr', {
    content: [
      dom.createElement('td', { content: `${index + 1}` }),
      dom.createElement('td', { content: lexeme.line.toString(10) }),
      dom.createElement('td', {
        classes: 'turtle-cell-wide',
        content: [
          dom.createElement('code', {
            content: lexeme.content ? highlight(lexeme.content, language) : ''
          })
        ]
      }),
      dom.createElement('td', { classes: 'turtle-cell-wide', content: lexeme.type })
    ]
  })
}

// register to keep in sync with the application state
on('lexemes-changed', ({ lexemes, language }) => {
  dom.setContent(tableBody, lexemes.map(tableBodyRow.bind(null, language)))
})
