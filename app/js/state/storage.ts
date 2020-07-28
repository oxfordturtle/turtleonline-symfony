/**
 * Session storage tools.
 */
import { Property, defaults } from './properties'

/** load a property from local/session storage */
export function load (property: Property): any {
  return (sessionStorage.getItem(property) === null)
    ? defaults[property]
    : JSON.parse(sessionStorage.getItem(property))
}

/** save a property to local/session storage */
export function save (property: Property, value: any): void {
  sessionStorage.setItem(property, JSON.stringify(value))
}
