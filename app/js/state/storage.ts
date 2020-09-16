/**
 * Session storage tools.
 */
import { Property, defaults } from '../constants/properties'

/** load a property from local/session storage */
export function load (property: Property): any {
  const fromStorage = sessionStorage.getItem(property)
  return (fromStorage !== null) ? JSON.parse(fromStorage) : defaults[property]
}

/** save a property to local/session storage */
export function save (property: Property, value: any): void {
  sessionStorage.setItem(property, JSON.stringify(value))
}
