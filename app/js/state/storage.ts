// tpe imports
import type { Property } from '../constants/properties'

// module imports
import { defaults } from '../constants/properties'

/** loads a property from local/session storage */
export function load (property: Property): any {
  const fromStorage = sessionStorage.getItem(property)
  return (fromStorage !== null) ? JSON.parse(fromStorage) : defaults[property]
}

/** saves a property to local/session storage */
export function save (property: Property, value: any): void {
  sessionStorage.setItem(property, JSON.stringify(value))
}
