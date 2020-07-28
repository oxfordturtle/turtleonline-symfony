/*
 * The machine canvas component.
 */
import { cursors } from '../../machine/cursors'
import { fonts } from '../../machine/fonts'
import { Turtle } from '../../machine/turtle'
import { send, on } from '../../machine/index'

// get relevant elements
const canvas = document.querySelector('[data-component="canvas"]') as HTMLCanvasElement
const xcoords = document.querySelector('[data-component="canvasXCoords"]') as HTMLDivElement
const ycoords = document.querySelector('[data-component="canvasYCoords"]') as HTMLDivElement

if (canvas && xcoords && ycoords) {
  const context = canvas.getContext('2d')
  // give the machine access to the canvas and context so it can read pixels, add/remove event listeners etc.
  // (the machine can't import this module, because this module needs to import the machine)
  send('canvasContextReady', { canvas, context })

  // set the canvas resolution
  on('resolution', function (data: { width: number, height: number }): void {
    canvas.style.imageRendering = (data.width < 500 || data.height < 500) ? 'pixelated' : 'auto'
    canvas.width = data.width
    canvas.height = data.height
  })

  // set the virtual canvas dimensions (updates coordinates display)
  on('canvas', function (data: { startx: number, starty: number, sizex: number, sizey: number }): void {
    xcoords.querySelector(':nth-child(1)').innerHTML = data.startx.toString(10)
    xcoords.querySelector(':nth-child(2)').innerHTML = Math.round((data.startx + data.sizex) / 4).toString(10)
    xcoords.querySelector(':nth-child(3)').innerHTML = Math.round((data.startx + data.sizex) / 2).toString(10)
    xcoords.querySelector(':nth-child(4)').innerHTML = Math.round((data.startx + data.sizex) / 4 * 3).toString(10)
    xcoords.querySelector(':nth-child(5)').innerHTML = Math.round((data.startx + data.sizex) - 1).toString(10)
    ycoords.querySelector(':nth-child(1)').innerHTML = data.starty.toString(10)
    ycoords.querySelector(':nth-child(2)').innerHTML = Math.round((data.starty + data.sizey) / 4).toString(10)
    ycoords.querySelector(':nth-child(3)').innerHTML = Math.round((data.starty + data.sizey) / 2).toString(10)
    ycoords.querySelector(':nth-child(4)').innerHTML = Math.round((data.starty + data.sizey) / 4 * 3).toString(10)
    ycoords.querySelector(':nth-child(5)').innerHTML = Math.round((data.starty + data.sizey) - 1).toString(10)
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
  on('poly', function (data: { turtle: Turtle, coords: [number, number][], fill: boolean }) {
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
  on('arc', function ({ turtle, x, y, fill }) {
    context.beginPath()
    if (x === y) {
      context.arc(turtle.x, turtle.y, x, 0, 2 * Math.PI, false)
    } else {
      context.save()
      context.translate(turtle.x - x, turtle.y - y)
      context.scale(x, y)
      context.arc(1, 1, 1, 0, 2 * Math.PI, false)
      context.restore()
    }
    if (fill) {
      context.fillStyle = turtle.c
      context.fill()
    } else {
      context.lineWidth = Math.abs(turtle.p)
      context.strokeStyle = turtle.c
      context.stroke()
    }
  })

  // draw a box
  on('box', function ({ turtle, x, y, fill, border }) {
    context.beginPath()
    context.moveTo(turtle.x, turtle.y)
    context.lineTo(x, turtle.y)
    context.lineTo(x, y)
    context.lineTo(turtle.x, y)
    context.closePath()
    context.fillStyle = fill
    context.fill()
    if (border) {
      context.lineCap = 'round'
      context.lineWidth = Math.abs(turtle.p)
      context.strokeStyle = turtle.c
      context.stroke()
    }
  })

  // set the colour of a canvas pixel
  on('pixset', function ({ x, y, c, doubled }) {
    const img = context.createImageData(1, 1)
    img.data[0] = (c >> 16) & 0xff
    img.data[1] = (c >> 8) & 0xff
    img.data[2] = c & 0xff
    img.data[3] = 0xff
    context.putImageData(img, x, y)
    if (doubled) {
      context.putImageData(img, x - 1, y)
      context.putImageData(img, x, y - 1)
      context.putImageData(img, x - 1, y - 1)
    }
  })

  // black the canvas in the given colour
  on('blank', function (colour: string): void {
    context.fillStyle = colour
    context.fillRect(0, 0, canvas.width, canvas.height)
  })

  // flood a portion of the canvas
  on('flood', function ({ x, y, c1, c2, boundary }) {
    const img = context.getImageData(0, 0, canvas.width, canvas.height)
    const pixStack = []
    const dx = [0, -1, 1, 0]
    const dy = [-1, 0, 0, 1]
    let i = 0
    let offset = (((y * canvas.width) + x) * 4)
    const c3 = (256 * 256 * img.data[offset]) + (256 * img.data[offset + 1]) + img.data[offset + 2]
    let nextX
    let nextY
    let nextC
    let test1
    let test2
    let test3
    let tx = x
    let ty = y
    pixStack.push(tx)
    pixStack.push(ty)
    while (pixStack.length > 0) {
      ty = pixStack.pop()
      tx = pixStack.pop()
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
          test1 = (nextC !== c1)
          test2 = ((nextC !== c2) || !boundary)
          test3 = ((nextC === c3) || boundary)
          if (test1 && test2 && test3) {
            offset = (((nextY * canvas.width) + nextX) * 4)
            img.data[offset] = ((c1 & 0xFF0000) >> 16)
            img.data[offset + 1] = ((c1 & 0xFF00) >> 8)
            img.data[offset + 2] = (c1 & 0xFF)
            pixStack.push(nextX)
            pixStack.push(nextY)
          }
        }
      }
    }
    context.putImageData(img, 0, 0)
  })
}
