/*
 * The program file component.
 */
import * as dom from './dom.js'
import exampleGroups from '../definitions/exampleGroups.js'
import exampleNames from '../definitions/exampleNames.js'
import { send } from '../state/index.js'

// buttons
const saveLocalButton = dom.createElement('button', { content: 'Save on My Computer' })
const saveRemoteButton = dom.createElement('button', { content: 'Save on turtle.ox.ac.uk' })
const newBlankButton = dom.createElement('button', { content: 'New Blank Program' })
const newSkeletonButton = dom.createElement('button', { content: 'New Skeleton Program' })
const openLocalButton = dom.createElement('button', { content: 'Open from My Computer' })
const openRemoteButton = dom.createElement('button', { content: 'Open from turtle.ox.ac.uk' })

// invisible file input (for opening a local file)
const fileInput = dom.createElement('input', { type: 'file' })

// file display elements
export const currentFile = dom.createElement('div', {
  classes: 'turtle-file',
  content: [
    dom.createElement('h2', { content: 'Save Current File' }),
    dom.createElement('div', { classes: 'turtle-buttons', content: [saveLocalButton, saveRemoteButton] })
  ]
})

export const newFile = dom.createElement('div', {
  classes: 'turtle-file',
  content: [
    dom.createElement('h2', { content: 'New File' }),
    dom.createElement('div', { classes: 'turtle-buttons', content: [newBlankButton, newSkeletonButton] })
  ]
})

export const openFile = dom.createElement('div', {
  classes: 'turtle-file',
  content: [
    dom.createElement('h2', { content: 'Open File' }),
    dom.createElement('div', { classes: 'turtle-buttons', content: [openLocalButton, openRemoteButton] })
  ]
})

function exampleGroupList (group, index) {
  return dom.createFragment([
    dom.createElement('h3', { content: `${index + 1}. ${group.title}` }),
    dom.createElement('ol', { content: group.examples.map(exampleGroupListItem) })
  ])
}

function exampleGroupListItem (example, index) {
  const li = dom.createElement('li', { content: `${index + 1}. ${exampleNames[example]}` })
  li.addEventListener('click', () => {
    send('set-example', example)
  })
  return li
}

export const openExample = dom.createElement('div', {
  classes: 'turtle-file',
  content: [
    dom.createElement('h2', { content: 'Open Example' }),
    dom.createElement('div', {
      classes: 'turtle-examples',
      content: exampleGroups.map(exampleGroupList)
    })
  ]
})

// setup event listeners on interactive elements
saveLocalButton.addEventListener('click', () => {
  send('save-local')
})

saveRemoteButton.addEventListener('click', () => {
  send('save-remote')
})

newBlankButton.addEventListener('click', () => {
  send('new-program')
})

newSkeletonButton.addEventListener('click', () => {
  send('new-skeleton-program')
})

openLocalButton.addEventListener('click', () => {
  fileInput.click()
})

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0]
  const fr = new window.FileReader()
  fr.onload = () => {
    send('set-file', { filename: file.name, content: fr.result })
    // reset the file input so that the change event definitely triggers next time
    fileInput.type = ''
    fileInput.type = 'file'
  }
  fr.readAsText(file)
})

openRemoteButton.addEventListener('click', () => {
  send('open-remote')
})
