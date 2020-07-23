/**
 * Binds select/input elements to state properties.
 */
import state from '../state/index'
import { properties } from '../state/storage'
import { Message } from '../state/messages'
import { languages } from '../definitions/languages'
import { modes } from '../definitions/modes'
import { option } from '../tools/elements'
import { categories } from '../definitions/categories'

export default init()

function init (): void {
  for (const property of properties) {
    state.on(`${property}Changed` as Message, () => {
      for (const element of document.querySelectorAll(`[data-binding="${property}"]`)) {
        const input = element as HTMLInputElement|HTMLSelectElement
        if (input.type === 'radio') {
          (input as HTMLInputElement).checked = (input.value === state[property])
        } else if (input.type === 'checkbox') {
          (input as HTMLInputElement).checked = state[property] as boolean
        } else {
          input.value = state[property] as string
        }
      }
    })
  }

  for (const element of document.querySelectorAll('[data-binding]')) {
    const input = element as HTMLInputElement|HTMLSelectElement
    const property = input.dataset.binding
    const eventType = input.getAttribute('type') === 'text' ? 'keyup' : 'change'
    input.addEventListener(eventType, () => {
      if (property in state) {
        const value = (input.type === 'checkbox') ? (input as HTMLInputElement).checked : input.value
        state[property] = value
      }
    })

    switch (property) {
      case 'language':
        for (const language of languages) {
          input.appendChild(option({ value: language, content: `Turtle ${language}` }))
        }
        break
  
      case 'mode':
        for (const mode of modes) {
          input.appendChild(option({ value: mode, content: `${mode.charAt(0).toUpperCase()}${mode.slice(1)} Mode` }))
        }
        break

      case 'commandsCategoryIndex':
        for (const category of categories) {
          input.appendChild(option({ value: category.index.toString(10), content: `${(category.index + 1).toString(10)}. ${category.title}` }))
        }
    }
  }
}
