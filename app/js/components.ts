import { fill, option } from './tools'
import { tabs } from './state/tabs'
import { languages } from './definitions/languages'

for (const tabMenu of document.querySelectorAll('[data-component="tab-menu"]')) {
  fill(tabMenu as HTMLElement, tabs.map(tab => option({ value: tab[0], content: tab[1] })))
}

for (const languageSelect of document.querySelectorAll('[data-language-select]')) {
  fill(languageSelect as HTMLElement, languages.map(language => option({ value: language, content: language })))
}
