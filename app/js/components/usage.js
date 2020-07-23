/*
 * The program usage component.
 */
import * as dom from './dom'
import highlight from '../compile/highlight'
import state from '../state/index'

// the usage table body
const tableBody = dom.createElement('tbody')

// the usage element (exported)
export default dom.createElement('div', {
  classes: 'turtle-usage',
  content: [
    dom.createElement('table', {
      classes: 'turtle-usage-table',
      content: [
        dom.createElement('thead', {
          content: [
            dom.createElement('tr', {
              content: [
                dom.createElement('th', { content: 'Expression' }),
                dom.createElement('th', { content: 'Level' }),
                dom.createElement('th', { content: 'Count' }),
                dom.createElement('th', { content: 'Program Lines' })
              ]
            })
          ]
        }),
        tableBody
      ]
    })
  ]
})

// register to keep in sync with the application state
state.on('usageChanged', ({ usage, language }) => {
  dom.setContent(tableBody, usage.map(categoryFragment.bind(null, language)))
})

// function to convert a category into a document fragment
function categoryFragment (language, category) {
  return dom.createFragment([
    dom.createElement('tr', {
      classes: 'turtle-category-heading',
      content: [
        dom.createElement('th', { colspan: '4', content: category.title })
      ]
    }),
    dom.createFragment(category.expressions.map(expressionRow.bind(null, language))),
    dom.createElement('tr', {
      content: [
        dom.createElement('td'),
        dom.createElement('td', { content: 'TOTAL:' }),
        dom.createElement('td', { content: category.total.toString(10) }),
        dom.createElement('td')
      ]
    })
  ])
}

// function to convert an expression into a table row
function expressionRow (language, expression) {
  return dom.createElement('tr', {
    content: [
      dom.createElement('td', {
        content: [
          dom.createElement('code', { content: highlight(expression.name, language) })
        ]
      }),
      dom.createElement('td', { content: expression.level.toString(10) }),
      dom.createElement('td', { content: expression.count.toString(10) }),
      dom.createElement('td', { content: expression.lines.replace(/\s/g, ', ') })
    ]
  })
}
