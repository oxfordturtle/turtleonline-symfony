/*
The program file component.
*/
import './style.scss'
import * as dom from '../dom'
import exampleGroups from '../../constants/exampleGroups'
import exampleNames from '../../constants/exampleNames'
import { on, send } from '../../state'

// current file select
const currentFileSelect = dom.createElement('select')

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
    dom.createElement('h2', { content: 'Current File' }),
    currentFileSelect,
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

export const openExample = dom.createElement('div', {
  classes: 'turtle-file',
  content: [
    dom.createElement('h2', { content: 'Open Example' }),
    dom.createElement('div', {
      classes: 'turtle-examples',
      content: exampleGroups.map(group => {
        return dom.createElement('ul', {
          content: group.examples.map(example => {
            const li = dom.createElement('li', {
              content: exampleNames[example]
            })
            li.addEventListener('click', () => {
              send('set-example', example)
            })
            return li
          })
        })
      })
    })
  ]
})

// subscribe to keep in sync with the system state
on('files-changed', ({ files, currentFileIndex }) => {
  dom.setContent(currentFileSelect, files.map((file, index) => {
    return dom.createElement('option', { value: index, content: `${index + 1} [${file.language}] ${file.name || '[no name]'}` })
  }))
  currentFileSelect.value = currentFileIndex
})

// setup event listeners on interactive elements
currentFileSelect.addEventListener('change', () => {
  send('set-current-file-index', currentFileSelect.value)
})

saveLocalButton.addEventListener('click', () => {
  send('save-program')
})

saveRemoteButton.addEventListener('click', () => {
  // TODO
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
  // TODO
})

/*
exampleGroupMenu.addEventListener('change', () => {
  dom.setContent(exampleMenu, examples.menu[exampleGroupMenu.value].examples.map(createExampleOption))
})

exampleMenu.addEventListener('change', () => {
  send('set-example', exampleMenu.value)
})
*/
