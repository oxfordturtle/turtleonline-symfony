// load a property from local/session storage
export function load (property: Property, defaultValue: any) {
  return (storage(property).getItem(property) === null)
    ? defaultValue
    : JSON.parse(storage(property).getItem(property))
}

// save a property to local/session storage
export function save (property: Property, value: any) {
  storage(property).setItem(property, JSON.stringify(value))
}

// get session/local storage from property
function storage (property: Property) {
  switch (property) {
    case 'fullscreen': // fallthrough
    case 'load-corresponding-example': // fallthrough
    case 'language': // fallthrough
    case 'show-canvas': // fallthrough
    case 'show-output': // fallthrough
    case 'show-memory': // fallthrough
    case 'draw-count-max': // fallthrough
    case 'code-count-max': // fallthrough
    case 'small-size': // fallthrough
    case 'stack-size':
      return window.localStorage

    case 'menu': // fallthrough
    case 'files': // fallthrough
    case 'current-file-index': // fallthrough
    case 'example': // fallthrough
    case 'lexemes': // fallthrough
    case 'usage': // fallthrough
    case 'routines': // fallthrough
    case 'pcode': // fallthrough
    case 'assembler': // fallthrough
    case 'decimal':
      return window.sessionStorage
  }
}

// session/local storage properties
type Property = 'fullscreen'
              | 'menu'
              | 'load-corresponding-example'
              | 'language'
              | 'files'
              | 'current-file-index'
              | 'example'
              | 'lexemes'
              | 'usage'
              | 'routines'
              | 'pcode'
              | 'assembler'
              | 'decimal'
              | 'show-canvas'
              | 'show-output'
              | 'show-memory'
              | 'draw-count-max'
              | 'code-count-max'
              | 'small-size'
              | 'stack-size'
