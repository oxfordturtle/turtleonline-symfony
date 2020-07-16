/**
 * Functions for getting and setting session/local storage properties.
 */

// get property
export function get (property: Property): any {
  if (sessionProperties.includes(property as SessionProperty)) {
    return JSON.parse(sessionStorage.getItem(property))
  } else if (localProperties.includes(property as LocalProperty)) {
    return JSON.parse(localStorage.getItem(property))
  }
}

// set property
export function set (property: Property, value: any): void {
  if (sessionProperties.includes(property as SessionProperty)) {
    sessionStorage.setItem(property, JSON.stringify(value))
  } else if (localProperties.includes(property as LocalProperty)) {
    localStorage.setItem(property, JSON.stringify(value))
  }
}

// type definitions
type Property = SessionProperty|LocalProperty

type SessionProperty = typeof sessionProperties[number]

type LocalProperty = typeof localProperties[number]

const sessionProperties = [
  'fullscreen',
  'tab'
] as const

const localProperties = [
  'mode'
] as const
  