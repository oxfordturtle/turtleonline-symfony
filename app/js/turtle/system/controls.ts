/**
 * The controls bar.
 */
import { button, div, fill, i, option, select } from '../tools'
import state from '../state/index'
import { Tab, tabs } from '../state/tabs'

// create and export the elements
const menuButton = button(
  {
    'aria-label': 'system menu',
    on: ['click', () => {
      state.menuOpen = !state.menuOpen
      menuButton.blur()
    }]
  },
  [
    i({ className: 'fa fa-bars' })
  ]
)

const tabSelect = select(
  {
    on: ['change', () => {
      state.tab = tabSelect.value as Tab
      tabSelect.blur()
    }]
  },
  tabs.map((tab) => option({ value: tab[0] }, tab[1]))
)

const playButton = button(
  {
    'aria-label': 'play',
    on: ['click', () => {
      state.play()
      playButton.blur()
    }]
  },
  [
    i({ className: 'fa fa-play' })
  ]
)

const haltButton = button(
  {
    'aria-label': 'halt',
    disabled: 'disabled',
    on: ['click', () => {
      state.halt()
      haltButton.blur()
    }]
  },
  [
    i({ className: 'fa fa-stop' })
  ]
)

const maximizeButton = button(
  {
    'aria-label': 'maximize',
    on: ['click', () => {
      state.fullscreen = !state.fullscreen
      maximizeButton.blur()
    }]
  },
  [
    i({ className: 'fa fa-expand' })
  ]
)

export default div({ className: 'turtle-controls' }, [
  div({}, [menuButton]),
  div({}, [tabSelect, playButton, haltButton, maximizeButton])
])

// subscribe to keep in sync with state
state.on('tab-changed', (tab: string) => { tabSelect.value = tab })

state.on('machine-played', () => {
  fill(playButton, [i({ className: 'fa fa-pause' })])
  haltButton.removeAttribute('disabled')
})

state.on('machine-paused', () => {
  fill(playButton, [i({ className: 'fa fa-play' })])
})

state.on('machine-unpaused', () => {
  fill(playButton, [i({ className: 'fa fa-pause' })])
})

state.on('machine-halted', () => {
  fill(playButton, [i({ className: 'fa fa-play' })])
  haltButton.setAttribute('disabled', 'disabled')
})

state.on('fullscreen-changed', (fullscreen: boolean) => {
  if (fullscreen) {
    fill(maximizeButton, [i({ className: 'fa fa-compress' })])
    document.body.classList.remove('site')
    document.body.classList.add('pwa')
  } else {
    fill(maximizeButton, [i({ className: 'fa fa-expand' })])
    document.body.classList.add('site')
    document.body.classList.remove('pwa')
  }
})
