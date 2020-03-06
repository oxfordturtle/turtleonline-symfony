/*
The machine canvas component.
*/
import './style.scss'
import * as dom from '../dom'
import cursors from '../../constants/cursors'
import fonts from '../../constants/fonts'
import { send, on } from '../../state/machine'

// the canvas element and its 2d drawing context
const canvas = dom.createElement('canvas', { width: '1000', height: '1000' })
const context = canvas.getContext('2d')

// the canvas x-coordinates
const xcoords = [
  dom.createElement('span', { content: '0' }),
  dom.createElement('span', { content: '250' }),
  dom.createElement('span', { content: '500' }),
  dom.createElement('span', { content: '750' }),
  dom.createElement('span', { content: '999' })
]

// the canvas y-coordinates
const ycoords = [
  dom.createElement('span', { content: '0' }),
  dom.createElement('span', { content: '250' }),
  dom.createElement('span', { content: '500' }),
  dom.createElement('span', { content: '750' }),
  dom.createElement('span', { content: '999' })
]

// the whole compoment (exported)
export default dom.createElement('div', {
  classes: 'turtle-canvas',
  content: [
    dom.createElement('div', {
      classes: 'turtle-canvas-left',
      content: [
        dom.createElement('div'),
        dom.createElement('div', {
          classes: 'turtle-canvas-coords',
          content: [
            ycoords[0],
            ycoords[1],
            ycoords[2],
            ycoords[3],
            ycoords[4]
          ]
        })
      ]
    }),
    dom.createElement('div', {
      classes: 'turtle-canvas-right',
      content: [
        dom.createElement('div', {
          classes: 'turtle-canvas-coords',
          content: [
            xcoords[0],
            xcoords[1],
            xcoords[2],
            xcoords[3],
            xcoords[4]
          ]
        }),
        dom.createElement('div', { classes: 'turtle-canvas-wrapper', content: [canvas] })
      ]
    })
  ]
})

// give the machine access to the canvas and context so it can read pixels, add/remove event listeners etc.
// (the machine can't import this module, because this module needs to import the machine)
send('canvas-context-ready', { canvas, context })

// register to keep in sync with the turtle machine...

// set the canvas resolution
on('resolution', function ({ width, height }) {
  canvas.width = width
  canvas.height = height
})

// set the virtual canvas dimensions (updates coordinates display)
on('canvas', function ({ startx, starty, sizex, sizey }) {
  xcoords[0].innerHTML = startx
  xcoords[1].innerHTML = Math.round((startx + sizex) / 4)
  xcoords[2].innerHTML = Math.round((startx + sizex) / 2)
  xcoords[3].innerHTML = Math.round((startx + sizex) / 4 * 3)
  xcoords[4].innerHTML = Math.round((startx + sizex) - 1)
  ycoords[0].innerHTML = starty
  ycoords[1].innerHTML = Math.round((starty + sizey) / 4)
  ycoords[2].innerHTML = Math.round((starty + sizey) / 2)
  ycoords[3].innerHTML = Math.round((starty + sizey) / 4 * 3)
  ycoords[4].innerHTML = Math.round((starty + sizey) - 1)
})

// set the canvas cursor
on('cursor', function (code) {
  const corrected = (code < 0 || code > 15) ? 1 : code
  canvas.style.cursor = cursors[corrected].css
})

// draw text on the canvas
on('print', function ({ turtle, string, font, size }) {
  context.textBaseline = 'top'
  context.fillStyle = turtle.c
  context.font = `${size}pt ${fonts[font & 0xF].css}`
  if ((font & 0x10) > 0) {
    context.font = `bold ${context.font}`
  }
  if ((font & 0x20) > 0) {
    context.font = `italic ${context.font}`
  }
  context.fillText(string, turtle.x, turtle.y)
})

// draw a line on the canvas
on('line', function ({ turtle, x, y }) {
  context.beginPath()
  context.moveTo(turtle.x, turtle.y)
  context.lineTo(x, y)
  context.lineCap = 'round'
  context.lineWidth = turtle.t
  context.strokeStyle = turtle.c
  context.stroke()
})

// draw a polygon (optionally filled)
on('poly', function ({ turtle, coords, fill }) {
  context.beginPath()
  coords.forEach((coords, index) => {
    if (index === 0) {
      context.moveTo(coords[0], coords[1])
    } else {
      context.lineTo(coords[0], coords[1])
    }
  })
  if (fill) {
    context.closePath()
    context.fillStyle = turtle.c
    context.fill()
  } else {
    context.lineCap = 'round'
    context.lineWidth = turtle.t
    context.strokeStyle = turtle.c
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
    context.lineWidth = turtle.t
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
    context.lineWidth = turtle.t
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
on('blank', function (colour) {
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
