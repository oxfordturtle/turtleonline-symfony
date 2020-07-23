/*
 * Functions for interacting with the dom.
 */

// create an element
export function createElement (type, options = {}) {
  const element = document.createElement(type)
  Object.keys(options).forEach(option => {
    switch (option) {
      case 'classes':
        options.classes.split(' ').forEach(x => { element.classList.add(x) })
        break

      case 'content':
        setContent(element, options.content)
        break

      case 'value':
        element.value = options.value
        break

      default:
        element.setAttribute(option, options[option])
        break
    }
  })
  return element
}

// create a text node
export function createTextNode (text) {
  return document.createTextNode(text)
}

// create a document fragment
export function createFragment (content = null) {
  const fragment = document.createDocumentFragment()
  if (content) {
    setContent(fragment, content)
  }
  return fragment
}

// set the content of an element
export function setContent (element, content) {
  if (typeof content === 'object') {
    const fragment = document.createDocumentFragment()
    content.forEach(x => { fragment.appendChild(x) })
    element.innerHTML = ''
    element.appendChild(fragment)
  } else {
    element.innerHTML = content
  }
}

// create a link/button with an icon and text
export function createIconWithText (type, options) {
  return createElement(type, {
    classes: options.active ? 'turtle-icon-text active' : 'turtle-icon-text',
    title: options.text,
    content: [
      createElement('span', {
        classes: 'icon',
        content: [createElement('i', { classes: options.icon })]
      }),
      createElement('span', { classes: 'text', content: options.text })
    ]
  })
}
