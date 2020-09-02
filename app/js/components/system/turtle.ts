/*
 * The turtle properties display (shown above the canvas).
 */
import { on } from '../../tools/hub'

// get relevant elements
const turtX = document.querySelector('[data-component="turtxDisplay"]') as HTMLSpanElement
const turtY = document.querySelector('[data-component="turtyDisplay"]') as HTMLSpanElement
const turtD = document.querySelector('[data-component="turtdDisplay"]') as HTMLSpanElement
const turtA = document.querySelector('[data-component="turtaDisplay"]') as HTMLSpanElement
const turtT = document.querySelector('[data-component="turttDisplay"]') as HTMLSpanElement
const turtC = document.querySelector('[data-component="turtcDisplay"]') as HTMLSpanElement

if (turtX && turtY && turtD && turtA && turtT && turtC) {
  // register to keep in sync with the machine state
  on('turtxChanged', function (x: number) {
    turtX.innerHTML = x.toString(10)
  })

  on('turtyChanged', function (y: number) {
    turtY.innerHTML = y.toString(10)
  })

  on('turtdChanged', function (d: number) {
    turtD.innerHTML = d.toString(10)
  })

  on('turtaChanged', function (a: number) {
    turtA.innerHTML = a.toString(10)
  })

  on('turttChanged', function (t: number) {
    const penup = (t < 0)
    const thickness = Math.abs(t)
    turtT.innerHTML = penup ? `(${thickness.toString(10)})` : thickness.toString(10)
  })

  on('turtcChanged', function (c: string) {
    turtC.style.background = c
  })
}
