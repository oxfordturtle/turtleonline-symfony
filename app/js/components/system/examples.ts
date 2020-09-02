import { Example, Group, groups } from '../../constants/examples'
import { fill, a, span, i, div } from '../../tools/elements'
import state from '../../state/index'
import { closeMenu, toggleMenu } from '../view'

const examplesMenu = document.querySelector('[data-component="examplesMenu"]')

if (examplesMenu) {
  const groupLinks = groups.slice(1).map(exampleGroupLink)
  const groupMenus = groups.slice(1).map(exampleGroupMenu)
  fill(examplesMenu as HTMLElement, groupLinks.concat(groupMenus))
}

function exampleGroupLink (group: Group): HTMLElement {
  return a({
    on: ['click', function () {
      toggleMenu(group.id)
    } ],
    'data-action': 'toggleMenu',
    'data-arg': group.id,
    content: [
      span({ content: `Examples ${group.index.toString(10)} - ${group.title}` }),
      i({ className: 'fa fa-caret-right', 'aria-hidden': 'true' })
    ]
  })
}

function exampleGroupMenu (group: Group): HTMLElement {
  return div({
    className: 'system-sub-menu',
    'data-menu': group.id,
    content: [
      a({
        on: ['click', function () {
          closeMenu(group.id)
        } ],
        'data-action': 'closeMenu',
        'data-arg': group.id,
        content: [
          i({ className: 'fa fa-caret-left', 'aria-hidden': 'true' }),
          span({ content: 'back' })
        ]
      }) as HTMLElement
    ].concat(group.examples.map(exampleLink))
  })
}

function exampleLink (example: Example): HTMLElement {
  return a({
    on: ['click', function () {
      state.openExampleFile(example.id)
    }],
    content: [span({ content: example.names[state.language] })]
  })
}
