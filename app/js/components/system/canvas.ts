// type imports
import type { Turtle } from '../../machine/turtle'

// module imports
import { cursors } from '../../constants/cursors'
import { fonts } from '../../constants/fonts'
import * as machine from '../../machine/index'
import { on } from '../../tools/hub'

// get relevant elements
const canvas = document.querySelector('[data-component="canvas"]') as HTMLCanvasElement
const xcoords = document.querySelector('[data-component="canvasXCoords"]') as HTMLDivElement
const ycoords = document.querySelector('[data-component="canvasYCoords"]') as HTMLDivElement

if (canvas && xcoords && ycoords) {
  // get relevant sub-elements
  const context = canvas.getContext('2d') as CanvasRenderingContext2D
  const xcoords1 = xcoords.querySelector(':nth-child(1)') as HTMLElement
  const xcoords2 = xcoords.querySelector(':nth-child(2)') as HTMLElement
  const xcoords3 = xcoords.querySelector(':nth-child(3)') as HTMLElement
  const xcoords4 = xcoords.querySelector(':nth-child(4)') as HTMLElement
  const xcoords5 = xcoords.querySelector(':nth-child(5)') as HTMLElement
  const ycoords1 = ycoords.querySelector(':nth-child(1)') as HTMLElement
  const ycoords2 = ycoords.querySelector(':nth-child(2)') as HTMLElement
  const ycoords3 = ycoords.querySelector(':nth-child(3)') as HTMLElement
  const ycoords4 = ycoords.querySelector(':nth-child(4)') as HTMLElement
  const ycoords5 = ycoords.querySelector(':nth-child(5)') as HTMLElement

  // give the machine access to the canvas and context so it can read pixels, add/remove event listeners etc.
  // (the machine can't import this module, because this module needs to import the machine)
  machine.setCanvasAndContext(canvas, context)

  // set the canvas resolution
  on('resolution', function (data: { width: number, height: number }): void {
    canvas.style.imageRendering = (data.width < 500 || data.height < 500) ? 'pixelated' : 'auto'
    canvas.width = data.width
    canvas.height = data.height
  })

  // set the virtual canvas dimensions (updates coordinates display)
  on('canvas', function (data: { startx: number, starty: number, sizex: number, sizey: number }): void {
    xcoords1.innerHTML = data.startx.toString(10)
    xcoords2.innerHTML = Math.round((data.startx + data.sizex) / 4).toString(10)
    xcoords3.innerHTML = Math.round((data.startx + data.sizex) / 2).toString(10)
    xcoords4.innerHTML = Math.round((data.startx + data.sizex) / 4 * 3).toString(10)
    xcoords5.innerHTML = Math.round((data.startx + data.sizex) - 1).toString(10)
    ycoords1.innerHTML = data.starty.toString(10)
    ycoords2.innerHTML = Math.round((data.starty + data.sizey) / 4).toString(10)
    ycoords3.innerHTML = Math.round((data.starty + data.sizey) / 2).toString(10)
    ycoords4.innerHTML = Math.round((data.starty + data.sizey) / 4 * 3).toString(10)
    ycoords5.innerHTML = Math.round((data.starty + data.sizey) - 1).toString(10)
  })

  // set the canvas cursor
  on('cursor', function (code: number): void {
    const corrected = (code < 0 || code > 15) ? 1 : code
    canvas.style.cursor = cursors[corrected].css
  })

  // draw text on the canvas
  on('print', function (data: { turtle: Turtle, string: string, font: number, size: number }): void {
    context.textBaseline = 'hanging'
    context.fillStyle = data.turtle.c
    context.font = `${data.size}pt ${fonts[data.font & 0xF].css}`
    if ((data.font & 0x10) > 0) {
      // bold text
      context.font = `bold ${context.font}`
    }
    if ((data.font & 0x20) > 0) {
      // italic text
      context.font = `italic ${context.font}`
    }
    if ((data.font & 0x40) > 0) {
      // underlined text
      // TODO ...
    }
    if ((data.font & 0x80) > 0) {
      // strikethrough text
      // TODO ...
    }
    context.fillText(data.string, data.turtle.x, data.turtle.y)
  })

  // draw a line on the canvas
  on('line', function (data: { turtle: Turtle, x: number, y: number }): void {
    context.beginPath()
    context.moveTo(data.turtle.x, data.turtle.y)
    context.lineTo(data.x, data.y)
    context.lineCap = 'round'
    context.lineWidth = Math.abs(data.turtle.p)
    context.strokeStyle = data.turtle.c
    context.stroke()
  })

  // draw a polygon (optionally filled)
  on('poly', function (data: { turtle: Turtle, coords: [number, number][], fill: boolean }): void {
    context.beginPath()
    data.coords.forEach((coords, index) => {
      if (index === 0) {
        context.moveTo(coords[0], coords[1])
      } else {
        context.lineTo(coords[0], coords[1])
      }
    })
    if (data.fill) {
      context.closePath()
      context.fillStyle = data.turtle.c
      context.fill()
    } else {
      context.lineCap = 'round'
      context.lineWidth = Math.abs(data.turtle.p)
      context.strokeStyle = data.turtle.c
      context.stroke()
    }
  })

  // draw a circle/ellipse (optionally filled)
  on('arc', function (data: { turtle: Turtle, x: number, y: number, fill: boolean }): void {
    context.beginPath()
    if (data.x === data.y) {
      context.arc(data.turtle.x, data.turtle.y, data.x, 0, 2 * Math.PI, false)
    } else {
      context.save()
      context.translate(data.turtle.x - data.x, data.turtle.y - data.y)
      context.scale(data.x, data.y)
      context.arc(1, 1, 1, 0, 2 * Math.PI, false)
      context.restore()
    }
    if (data.fill) {
      context.fillStyle = data.turtle.c
      context.fill()
    } else {
      context.lineWidth = Math.abs(data.turtle.p)
      context.strokeStyle = data.turtle.c
      context.stroke()
    }
  })

  // draw a box
  on('box', function (data: { turtle: Turtle, x: number, y: number, fill: string, border: boolean }): void {
    context.beginPath()
    context.moveTo(data.turtle.x, data.turtle.y)
    context.lineTo(data.x, data.turtle.y)
    context.lineTo(data.x, data.y)
    context.lineTo(data.turtle.x, data.y)
    context.closePath()
    context.fillStyle = data.fill
    context.fill()
    if (data.border) {
      context.lineCap = 'round'
      context.lineWidth = Math.abs(data.turtle.p)
      context.strokeStyle = data.turtle.c
      context.stroke()
    }
  })

  // set the colour of a canvas pixel
  on('pixset', function (data: { x: number, y: number, c: number, doubled: boolean }): void {
    const img = context.createImageData(1, 1)
    img.data[0] = (data.c >> 16) & 0xff
    img.data[1] = (data.c >> 8) & 0xff
    img.data[2] = data.c & 0xff
    img.data[3] = 0xff
    context.putImageData(img, data.x, data.y)
    if (data.doubled) {
      context.putImageData(img, data.x - 1, data.y)
      context.putImageData(img, data.x, data.y - 1)
      context.putImageData(img, data.x - 1, data.y - 1)
    }
  })

  // black the canvas in the given colour
  on('blank', function (colour: string): void {
    context.fillStyle = colour
    context.fillRect(0, 0, canvas.width, canvas.height)
  })

  // flood a portion of the canvas
  on('flood', function (data: { x: number, y: number, c1: number, c2: number, boundary: boolean }): void {
    const img = context.getImageData(0, 0, canvas.width, canvas.height)
    const pixStack: number[] = []
    const dx = [0, -1, 1, 0]
    const dy = [-1, 0, 0, 1]
    let i = 0
    let offset = (((data.y * canvas.width) + data.x) * 4)
    const c3 = (256 * 256 * img.data[offset]) + (256 * img.data[offset + 1]) + img.data[offset + 2]
    let nextX: number
    let nextY: number
    let nextC: number
    let test1: boolean
    let test2: boolean
    let test3: boolean
    let tx = data.x
    let ty = data.y
    pixStack.push(tx)
    pixStack.push(ty)
    while (pixStack.length > 0) {
      ty = pixStack.pop() as number
      tx = pixStack.pop() as number
      for (i = 0; i < 4; i += 1) {
        nextX = tx + dx[i]
        nextY = ty + dy[i]
        test1 = (nextX > 0 && nextX <= canvas.width)
        test2 = (nextY > 0 && nextY <= canvas.height)
        if (test1 && test2) {
          offset = (((nextY * canvas.width) + nextX) * 4)
          nextC = (256 * 256 * img.data[offset])
          nextC += (256 * img.data[offset + 1])
          nextC += img.data[offset + 2]
          test1 = (nextC !== data.c1)
          test2 = ((nextC !== data.c2) || !data.boundary)
          test3 = ((nextC === c3) || data.boundary)
          if (test1 && test2 && test3) {
            offset = (((nextY * canvas.width) + nextX) * 4)
            img.data[offset] = ((data.c1 & 0xFF0000) >> 16)
            img.data[offset + 1] = ((data.c1 & 0xFF00) >> 8)
            img.data[offset + 2] = (data.c1 & 0xFF)
            pixStack.push(nextX)
            pixStack.push(nextY)
          }
        }
      }
    }
    context.putImageData(img, 0, 0)
  })
}
