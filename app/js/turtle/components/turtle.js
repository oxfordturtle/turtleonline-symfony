/*
 * The turtle properties display (shown above the canvas).
 */
import * as dom from './dom.js'
import { on } from '../state/machine.js'

// the turtle properties display elements
const turtX = dom.createElement('span', { classes: 'turtle-value', content: '500' })
const turtY = dom.createElement('span', { classes: 'turtle-value', content: '500' })
const turtD = dom.createElement('span', { classes: 'turtle-value turtle-direction', content: '0' })
const turtA = dom.createElement('span', { classes: 'turtle-value turtle-direction', content: '360' })
const turtT = dom.createElement('span', { classes: 'turtle-value turtle-thickness', content: '2' })
const turtC = dom.createElement('span', { classes: 'turtle-value turtle-colour', content: '0' })

// the main display component (exported)
export default dom.createElement('div', {
  classes: 'turtle-properties',
  content: [
    dom.createElement('div', {
      classes: 'turtle-property',
      content: [
        dom.createElement('span', { classes: 'turtle-label', content: 'X' }),
        turtX
      ]
    }),
    dom.createElement('div', {
      classes: 'turtle-property',
      content: [
        dom.createElement('span', { classes: 'turtle-label', content: 'Y' }),
        turtY
      ]
    }),
    dom.createElement('div', {
      classes: 'turtle-property',
      content: [
        dom.createElement('span', { classes: 'turtle-label', content: '<i class="fa fa-compass"></i>' }),
        turtD,
        dom.createTextNode('/'),
        turtA
      ]
    }),
    dom.createElement('div', {
      classes: 'turtle-property',
      content: [
        dom.createElement('span', { classes: 'turtle-label', content: '<i class="fa fa-pen"></i>' }),
        turtT
      ]
    }),
    dom.createElement('div', {
      classes: 'turtle-property',
      content: [
        dom.createElement('span', { classes: 'turtle-label', content: '<i class="fa fa-palette"></i>' }),
        turtC
      ]
    })
  ]
})

// register to keep in sync with the machine state
on('turtx-changed', function (x) {
  turtX.innerHTML = x.toString(10)
})

on('turty-changed', function (y) {
  turtY.innerHTML = y.toString(10)
})

on('turtd-changed', function (d) {
  turtD.innerHTML = d.toString(10)
})

on('turta-changed', function (a) {
  turtA.innerHTML = a.toString(10)
})

on('turtt-changed', function (t) {
  turtT.innerHTML = t.toString(10)
})

on('turtc-changed', function (c) {
  turtC.style.background = c
})
