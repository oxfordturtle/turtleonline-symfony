/** converts a number to a CSS hexadecimal string */
export default function hex (colour: number): string {
  return `#${padded(colour.toString(16))}`
}

/** pads a string with leading zeros */
function padded (string: string): string {
  return ((string.length < 6) ? padded(`0${string}`) : string)
}
