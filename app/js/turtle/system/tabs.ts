import { div } from '../tools'
import canvas from '../components/canvas'
import comments from '../components/comments'
import memory from '../components/memory'
import output from '../components/output'
import pcode from '../components/pcode'
import syntax from '../components/syntax'
import usage from '../components/usage'
import vars from '../components/vars'
import state from '../state/index'
import { Tab } from '../state/tabs'

const tabs = div(
  {
    className: 'turtle-tabs'
  },
  [
    canvas,
    output,
    usage,
    comments,
    syntax,
    vars,
    pcode,
    memory
  ]
)

export default tabs

// subsribe to keep in sync with system state
state.on('tab-changed', (tab: Tab) => {
  for (const child of tabs.children) {
    child.classList.remove('active')
  }
  switch (tab) {
    case 'canvas':
      canvas.classList.add('active')
      break

    case 'output':
      output.classList.add('active')
      break

    case 'usage':
      usage.classList.add('active')
      break

    case 'comments':
      comments.classList.add('active')
      break

    case 'syntax':
      syntax.classList.add('active')
      break

    case 'vars':
      vars.classList.add('active')
      break

    case 'pcode':
      pcode.classList.add('active')
      break

    case 'memory':
      memory.classList.add('active')
      break

  }
})