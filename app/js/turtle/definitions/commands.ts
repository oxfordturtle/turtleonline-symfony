/*
 * An array of commands. Used by the compiler, the usage analyser, and the help component.
 */
import { Names } from './languages.ts'
import { Type } from './types.ts'
import { PCode } from './pcodes.ts'

export class Command {
  readonly names: Names
  readonly code: number[]
  readonly parameters: Parameter[]
  readonly returns: Type|null
  readonly category: number
  readonly level: number
  readonly description: string
  constructor (
    names: Names,
    code: number[], parameters: Parameter[], returns: Type|null,
    category: number,
    level: number,
    description: string
  ) {
    this.names = names
    this.code = code
    this.parameters = parameters
    this.returns = returns
    this.category = category
    this.level = level
    this.description = description
  }
}

export class Parameter {
  readonly name: string
  readonly type: Type
  readonly byref: boolean
  readonly length: number
  constructor (name: string, type: Type, byref: boolean, length: number) {
    this.name = name
    this.type = type
    this.byref = byref
    this.length = length
  }
}

export const commands: Command[] = [
  // 0. Turtle: relative movement
  new Command(
    { BASIC: 'FORWARD', Pascal: 'forward', Python: 'forward' },
    [PCode.fwrd],
    [new Parameter('n', 'integer', false, 1)],
    null, 0, 0,
    'Moves the Turtle forward <code>n</code> units, drawing as it goes (unless the pen is up).'
  ),
  new Command(
    { BASIC: 'BACK', Pascal: 'back', Python: 'back' },
    [PCode.back],
    [new Parameter('n', 'integer', false, 1)],
    null, 0, 0,
    'Moves the Turtle back <code>n</code> units, drawing as it goes (unless the pen is up).'
  ),
  new Command(
    { BASIC: 'LEFT', Pascal: 'left', Python: 'left' },
    [PCode.left],
    [new Parameter('n', 'integer', false, 1)],
    null, 0, 0,
    'Rotates the Turtle left by <code>n</code> degrees.'
  ),
  new Command(
    { BASIC: 'RIGHT', Pascal: 'right', Python: 'right' },
    [PCode.rght],
    [new Parameter('n', 'integer', false, 1)],
    null, 0, 0,
    'Rotates the Turtle right by <code>n</code> degrees.'
  ),
  new Command(
    { BASIC: 'DRAWXY', Pascal: 'drawxy', Python: 'drawxy' },
    [PCode.drxy],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1)
    ],
    null, 0, 1,
    'Moves the Turtle in a straight line to a point <code>x</code> units away along the x-axis and <code>y</code> units away along the y-axis, drawing as it goes (unless the pen is up).'
  ),
  new Command(
    { BASIC: 'MOVEXY', Pascal: 'movexy', Python: 'movexy' },
    [PCode.mvxy],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1)
    ],
    null, 0, 1,
    'Moves the Turtle in a straight line to a point <code>x</code> units away along the x-axis and <code>y</code> units away along the y-axis, <em>without</em> drawing (regardless of the current pen status).'
  ),
  // 1. Turtle: absolute movement
  new Command(
    { BASIC: 'HOME', Pascal: 'home', Python: 'home' },
    [PCode.home],
    [], null, 1, 0,
    'Moves the Turtle back to its starting position in the centre of the canvas, facing north, drawing as it goes (unless the pen is up).'
  ),
  new Command(
    { BASIC: 'SETX', Pascal: 'setx', Python: 'setx' },
    [PCode.setx],
    [new Parameter('x', 'integer', false, 1)],
    null, 1, 0,
    'Sets the Turtle&rsquo;s <code>x</code> coordinate directly (without movement or drawing on the canvas). This can also be achieved by direct assignment of the global variable <code>turtx</code>.'
  ),
  new Command(
    { BASIC: 'SETY', Pascal: 'sety', Python: 'sety' },
    [PCode.sety],
    [new Parameter('y', 'integer', false, 1)],
    null, 1, 0,
    'Sets the Turtle&rsquo;s <code>y</code> coordinate directly (without movement or drawing on the canvas). This can also be achieved by direct assignment of the global variable <code>turty</code>.'
  ),
  new Command(
    { BASIC: 'SETXY', Pascal: 'setxy', Python: 'setxy' },
    [PCode.toxy],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1)
    ],
    null, 1, 0,
    'Sets the Turtle&rsquo;s <code>x</code> and <code>y</code> coordinates directly (without movement or drawing on the canvas). This can also be achieved by direct assingment of the global variables <code>turtx</code> and <code>turty</code>.'
  ),
  new Command(
    { BASIC: 'DIRECTION', Pascal: 'direction', Python: 'direction' },
    [PCode.setd],
    [new Parameter('n', 'integer', false, 1)],
    null, 1, 0,
    'Sets the Turtle&rsquo;s direction to <code>n</code> degrees (0 for north, 90 for east, 180 for south, 270 for west). This can also be achieved by direct assignment of the global variable <code>turtd</code>. Note that the number of degrees in a circle (360 by default) can be changed with the <code>angles</code> command.'
  ),
  new Command(
    { BASIC: 'ANGLES', Pascal: 'angles', Python: 'angles' },
    [PCode.angl],
    [new Parameter('degrees', 'integer', false, 1)],
    null, 1, 1,
    'Sets the number of <code>degrees</code> in a circle (360 by default).'
  ),
  new Command(
    { BASIC: 'TURNXY', Pascal: 'turnxy', Python: 'turnxy' },
    [PCode.turn],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1)
    ],
    null, 1, 1,
    'Turns the Turtle to face the point <code>x</code> units away alongthe x-axis and <code>y</code> units away along the y-axis.'
  ),
  // 2. Turtle: shape drawing
  new Command(
    { BASIC: 'CIRCLE', Pascal: 'circle', Python: 'circle' },
    [PCode.circ],
    [new Parameter('radius', 'integer', false, 1)],
    null, 2, 0,
    'Draws a circle outline in the Turtle&rsquo;s current colour and thickness, of the given <code>radius</code>, centred on the Turtle&rsquo;s current location.'
  ),
  new Command(
    { BASIC: 'BLOT', Pascal: 'blot', Python: 'blot' },
    [PCode.blot],
    [new Parameter('radius', 'integer', false, 1)],
    null, 2, 0,
    'Draws a filled circle in the Turtle&rsquo;s current colour, of the given <code>radius</code>, centred on the Turtle&rsquo;s current location.'
  ),
  new Command(
    { BASIC: 'ELLIPSE', Pascal: 'ellipse', Python: 'ellipse' },
    [PCode.elps],
    [
      new Parameter('Xradius', 'integer', false, 1),
      new Parameter('Yradius', 'integer', false, 1)
    ],
    null, 2, 0,
    'Draws an ellipse outline in the Turtle&rsquo;s current colour and thickness, of the given <code>Xradius</code> and <code>Yradius</code>, centred on the Turtle&rsquo;s current location.'
  ),
  new Command(
    { BASIC: 'ELLBLOT', Pascal: 'ellblot', Python: 'ellblot' },
    [PCode.eblt],
    [
      new Parameter('Xradius', 'integer', false, 1),
      new Parameter('Yradius', 'integer', false, 1)
    ],
    null, 2, 0,
    'Draws a filled ellipse in the Turtle&rsquo;s current colour, of the given <code>Xradius</code> and <code>Yradius</code>, centred on the Turtle&rsquo;s current location.'
  ),
  new Command(
    { BASIC: 'POLYLINE', Pascal: 'polyline', Python: 'polyline' },
    [PCode.poly],
    [new Parameter('n', 'integer', false, 1)],
    null, 2, 1,
    'Draws a polygon outline in the Turtle&rsquo;s current colour and thickness, connecting the last <code>n</code> locations that the Turtle has visited.'
  ),
  new Command(
    { BASIC: 'POLYGON', Pascal: 'polygon', Python: 'polygon' },
    [PCode.pfil],
    [new Parameter('n', 'integer', false, 1)],
    null, 2, 1,
    'Draws a filled polygon in the Turtle&rsquo;s current colour and thickness, connecting the last <code>n</code> locations that the Turtle has visited.'
  ),
  new Command(
    { BASIC: 'FORGET', Pascal: 'forget', Python: 'forget' },
    [PCode.frgt],
    [new Parameter('n', 'integer', false, 1)],
    null, 2, 1,
    'Makes the Turtle &ldquo;forget&rdquo; the last <code>n</code> points it has visited. Used in conjunction with <code>polyline</code> and <code>polygon</code>.'
  ),
  new Command(
    { BASIC: 'REMEMBER', Pascal: 'remember', Python: 'remember' },
    [PCode.rmbr],
    [], null, 2, 1,
    'Makes the Turtle &ldquo;remember&rdquo; its current location. This is only necessary if its current location was set by a direct assignment of the global variables <code>turtx</code> and <code>turty</code>; when using the standard moving commands, the Turtle automatically remembers where it has been.'
  ),
  new Command(
    { BASIC: 'BOX', Pascal: 'box', Python: 'box' },
    [PCode.box],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1),
      new Parameter('colour', 'integer', false, 1),
      new Parameter('border', 'boolean', false, 1)
    ],
    null, 2, 1,
    'Draws a box of width <code>x</code> and height <code>y</code>, with the top left corner in the Turtle&rsquo;s current location, filled with the specified <code>colour</code>. If <code>border</code> is <code>true</code>, a border is drawn around the box in the Turtle&rsquo;s current colour and and thickness. This is intended to be used with the <code>print</code> command, to provide a box for framing text.'
  ),
  // 3. Other Turtle commands
  new Command(
    { BASIC: 'COLOUR', Pascal: 'colour', Python: 'colour' },
    [PCode.colr],
    [new Parameter('colour', 'integer', false, 1)],
    null, 3, 0,
    'Sets the <code>colour</code> of the Turtle&rsquo;s pen. Takes as an argument either an RGB value, or one of the Turtle System&rsquo;s fifty predefined colour constants (see the <b>Colours</b> tab). This can also be achieved by direct assignment of the global variable <code>turtc</code>.'
  ),
  new Command(
    { BASIC: 'RNDCOL', Pascal: 'randcol', Python: 'randcol' },
    [PCode.rand, PCode.incr, PCode.rgb, PCode.colr],
    [new Parameter('n', 'integer', false, 1)],
    null, 3, 0,
    'Assigns a random colour to the Turte&rsquo;s pen, between 1 and <code>n</code> (maximum 50). The colours are taken from the Turtle System&rsquo;s fifty predefined colours, which are each assigned a number between 1 and 50 (see the <b>Colours</b> tab).'
  ),
  new Command(
    { BASIC: 'THICKNESS', Pascal: 'thickness', Python: 'thickness' },
    [PCode.thik],
    [new Parameter('thickness', 'integer', false, 1)],
    null, 3, 0,
    'Sets the <code>thickness</code> of the Turtle&rsquo;s pen (for line drawing, and outlines of circles, ellipses, boxes, and polygons). This can also be achieved by direct assignment of the global variable <code>turtp</code>.'
  ),
  new Command(
    { BASIC: 'PENUP', Pascal: 'penup', Python: 'penup' },
    [PCode.ldin, 0, PCode.pen],
    [], null, 3, 0,
    'Lifts the Turtle&rsquo;s pen, so that subsequent movement will not draw a line on the Canvas.'
  ),
  new Command(
    { BASIC: 'PENDOWN', Pascal: 'pendown', Python: 'pendown' },
    [PCode.ldin, -1, PCode.pen],
    [], null, 3, 0,
    'Lowers the Turtle&rsquo;s pen, so that subsequent movement will draw a line on the Canvas.'
  ),
  new Command(
    { BASIC: 'OUTPUT', Pascal: 'output', Python: 'output' },
    [PCode.outp],
    [
      new Parameter('clear', 'boolean', false, 1),
      new Parameter('colour', 'integer', false, 1),
      new Parameter('tofront', 'boolean', false, 1)
    ],
    null, 3, 1,
    'Modifies the textual output. If the first argument is <code>true</code>, it clears any existing text. The second argument specifies the background colour, and the third argument is for switching the display. If the third argument is <code>true</code>, it switches to the <b>Output</b> tab, while if it is <code>false</code>, it switches to the <b>Canvas and Console</b> tab.'
  ),
  new Command(
    { BASIC: 'CONSOLE', Pascal: 'console', Python: 'console' },
    [PCode.cons],
    [
      new Parameter('clear', 'boolean', false, 1),
      new Parameter('colour', 'integer', false, 1)
    ],
    null, 3, 1,
    'Modifies the Console; if the first argument is <code>true</code>, it clears any existing text, while the second argument specifies the background colour.'
  ),
  new Command(
    { BASIC: 'RGB', Pascal: 'rgb', Python: 'rgb' },
    [PCode.rgb],
    [new Parameter('colour', 'integer', false, 1)],
    'integer', 3, 2,
    'Returns the RGB value of the input <code>colour</code> (an integer between 1 and 50). For example, <code>rgb(red)=255</code>.'
  ),
  new Command(
    { BASIC: 'MIXCOLS', Pascal: 'mixcols', Python: 'mixcols' },
    [PCode.mixc],
    [
      new Parameter('colour1', 'integer', false, 1),
      new Parameter('colour1', 'integer', false, 1),
      new Parameter('proportion1', 'integer', false, 1),
      new Parameter('proportion2', 'integer', false, 1)
    ],
    'integer', 3, 2,
    'Mixes the given colours in the given proportions.'
  ),
  new Command(
    { BASIC: 'NEWTURTLE', Pascal: 'newturtle', Python: 'newturtle' },
    [PCode.ldin, 0, PCode.sptr],
    [new Parameter('array', 'integer', true, 5)],
    null, 3, 2,
    'Points the Turtle to a custom array in memory (this must be an array of five integers, corresponding to the Turtle&rsquo;s five properties, <code>turtx</code>, <code>turty</code>, <code>turtd</code>, <code>turtp</code>, and <code>turtc</code>). Use repeatedly to simulate multiple Turtles.'
  ),
  new Command(
    { BASIC: 'OLDTURTLE', Pascal: 'oldturtle', Python: 'oldturtle' },
    [PCode.oldt],
    [], null, 3, 2,
    'Points the Turtle back to the default (built-in) array in memory. Use in conjunction with <code>newturtle</code>.'
  ),
  // 4. Canvas operations
  new Command(
    { BASIC: 'UPDATE', Pascal: 'update', Python: 'update' },
    [PCode.ldin, -1, PCode.udat],
    [], null, 4, 0,
    'Makes the Machine update the Canvas, and continue updating with all subsequent drawing commands. Used in conjunction with <em>noupdate</em>.'
  ),
  new Command(
    { BASIC: 'NOUPDATE', Pascal: 'noupdate', Python: 'noupdate' },
    [PCode.ldin, 0, PCode.udat],
    [], null, 4, 0,
    'Makes the Machine refrain from updating the Canvas when executing all subsequent drawing commands, until <em>update</em> is called. Use this to create smooth animations, by queueing up several drawing commands to execute simultaneously.'
  ),
  new Command(
    { BASIC: 'BLANK', Pascal: 'blank', Python: 'blank' },
    [PCode.blnk],
    [new Parameter('colour', 'integer', false, 1)],
    null, 4, 0,
    'Blanks the entire Canvas with the specified <code>colour</code>.'
  ),
  new Command(
    { BASIC: 'CANVAS', Pascal: 'canvas', Python: 'canvas' },
    [PCode.canv],
    [
      new Parameter('x1', 'integer', false, 1),
      new Parameter('y1', 'integer', false, 1),
      new Parameter('x2', 'integer', false, 1),
      new Parameter('y2', 'integer', false, 1)
    ],
    null, 4, 1,
    'Sets the top left Canvas coordinate to <code>(x1,y1)</code>, and the Canvas width and height to <code>x2</code> and <code>y2</code> respectively. Note that the width and height fix the number of virtual points on the Canvas, not the number of actual pixels.'
  ),
  new Command(
    { BASIC: 'RESOLUTION', Pascal: 'resolution', Python: 'resolution' },
    [PCode.reso],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1)
    ],
    null, 4, 1,
    'Sets the Canvas resolution, i.e. the number of actual pixels in the <code>x</code> and <code>y</code> dimensions. To be used in conjunction with the <code>canvas</code> command, typically to set the number of actual pixels equal to the number of virtual points on the Canvas.'
  ),
  new Command(
    { BASIC: 'PIXSET', Pascal: 'pixset', Python: 'pixset' },
    [PCode.pixs],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1),
      new Parameter('colour', 'integer', false, 1)
    ],
    null, 4, 2,
    'Sets the <code>colour</code> at point <code>(x,y)</code>.'
  ),
  new Command(
    { BASIC: 'PIXCOL', Pascal: 'pixcol', Python: 'pixcol' },
    [PCode.pixc],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1)
    ],
    'integer', 4, 2,
    'Returns the RGB value of the colour at point <code>(x,y)</code>.'
  ),
  new Command(
    { BASIC: 'RECOLOUR', Pascal: 'recolour', Python: 'recolour' },
    [PCode.rcol],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1),
      new Parameter('colour', 'integer', false, 1)
    ],
    null, 4, 2,
    'Floods the Canvas with the specified <code>colour</code>, starting at point <code>(x,y)</code>, until reaching any different colour.'
  ),
  new Command(
    { BASIC: 'FILL', Pascal: 'fill', Python: 'fill' },
    [PCode.fill],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1),
      new Parameter('colour', 'integer', false, 1),
      new Parameter('boundary', 'integer', false, 1)
    ],
    null, 4, 2,
    'Floods the Canvas with the specified <code>colour</code>, starting at point <code>(x,y)</code>, until reaching the <code>boundary</code> colour.'
  ),
  // 5. General arithmetic functions
  new Command(
    { BASIC: 'INC', Pascal: 'inc', Python: 'inc' },
    [PCode.dupl, PCode.lptr, PCode.incr, PCode.swap, PCode.sptr],
    [new Parameter('variable', 'integer', true, 1)],
    null, 5, 0,
    'Increments the specified <code>variable</code> by 1.'
  ),
  new Command(
    { BASIC: 'DEC', Pascal: 'dec', Python: 'dec' },
    [PCode.dupl, PCode.lptr, PCode.decr, PCode.swap, PCode.sptr],
    [new Parameter('variable', 'integer', true, 1)],
    null, 5, 0,
    'Decrements the specified <code>variable</code> by 1.'
  ),
  new Command(
    { BASIC: 'ABS', Pascal: 'abs', Python: 'abs' },
    [PCode.abs],
    [new Parameter('n', 'integer', false, 1)],
    'integer', 5, 0,
    'Returns the absolute value of <code>n</code>, i.e. <code>n</code> if positive, <code>-n</code> if negative.'
  ),
  new Command(
    { BASIC: 'SGN', Pascal: 'sign', Python: 'sign' },
    [PCode.sign],
    [new Parameter('a', 'integer', false, 1)],
    'integer', 5, 1,
    'Returns <code>+1</code> if <code>a</code> is positive, <code>-1</code> if <code>a</code> is negative, and <code>0</code> otherwise.'
  ),
  new Command(
    { BASIC: 'MAX', Pascal: 'max', Python: 'max' },
    [PCode.maxi],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1)
    ],
    'integer', 5, 1,
    'Returns the maximum of <code>a</code> and <code>b</code>.'
  ),
  new Command(
    { BASIC: 'MIN', Pascal: 'min', Python: 'min' },
    [PCode.mini],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1)
    ],
    'integer', 5, 1,
    'Returns the minimum of <code>a</code> and <code>b</code>.'
  ),
  new Command(
    { BASIC: 'SQR', Pascal: 'sqrt', Python: 'sqrt' },
    [PCode.sqrt],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 5, 1,
    'Returns <code>&radic;a</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'HYPOT', Pascal: 'hypot', Python: 'hypot' },
    [PCode.hyp],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 5, 1,
    'Returns <code>&radic;(a<sup>2</sup>+b<sup>2</sup>)</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'RND', Pascal: null, Python: null },
    [PCode.rand, PCode.incr],
    [new Parameter('n', 'integer', false, 1)],
    'integer', 5, 1,
    'Returns a random integer between 1 and <code>n</code>.'
  ),
  new Command(
    { BASIC: null, Pascal: 'random', Python: null },
    [PCode.rand],
    [new Parameter('n', 'integer', false, 1)],
    'integer', 5, 1,
    'Returns a random non-negative integer less than <code>n</code>.'
  ),
  new Command(
    { BASIC: null, Pascal: null, Python: 'randint' },
    [PCode.swap, PCode.dupl, PCode.rota, PCode.incr, PCode.swap, PCode.subt, PCode.rand, PCode.plus],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1)
    ],
    'integer', 5, 1,
    'Returns a random integer between <code>a</code> and <code>b</code>.'
  ),
  new Command(
    { BASIC: 'RNDSEED', Pascal: 'randseed', Python: 'randseed' },
    [PCode.seed],
    [new Parameter('seed', 'integer', false, 1)],
    'integer', 5, 1,
    'Initialises the random number generator with the given <code>seed</code>, and returns that seed. If <code>seed</code> is 0, the seed is set from the current system clock.'
  ),
  new Command(
    { BASIC: 'POWER', Pascal: 'power', Python: 'power' },
    [PCode.powr],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('c', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 5, 2,
    'Returns <code>(a/b)<sup>c</sup></code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'ROOT', Pascal: 'root', Python: 'root' },
    [PCode.root],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('c', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 5, 2,
    'Returns <code><sup>c</sup>&radic;(a/b)</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'DIVMULT', Pascal: 'divmult', Python: 'divmult' },
    [PCode.divm],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 5, 2,
    'Returns <code>a/b</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'MAXINT', Pascal: 'maxint', Python: 'maxint' },
    [PCode.mxin],
    [], 'integer', 5, 2,
    'Returns the maximum integer that the Machine can deal with (2<sup>31</sup>-1).'
  ),
  // 6. Trig / exp / log functions
  new Command(
    { BASIC: 'SIN', Pascal: 'sin', Python: 'sin' },
    [PCode.sin],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 6, 1,
    'Returns <code>sin(a/b)</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'COS', Pascal: 'cos', Python: 'cos' },
    [PCode.cos],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 6, 1,
    'Returns <code>cos(a/b)</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'TAN', Pascal: 'tan', Python: 'tan' },
    [PCode.tan],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 6, 1,
    'Returns <code>tan(a/b)</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'PI', Pascal: 'pi', Python: 'pi' },
    [PCode.pi],
    [new Parameter('mult', 'integer', false, 1)],
    'integer', 6, 1,
    'Returns the value of Pi, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'EXP', Pascal: 'exp', Python: 'exp' },
    [PCode.exp],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 6, 1,
    'Returns <code>a<sup>b</sup></code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'LN', Pascal: 'ln', Python: 'ln' },
    [PCode.ln],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 6, 1,
    'Returns <code>ln(a/b)</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'ANTILOG', Pascal: 'antilog', Python: 'antilog' },
    [PCode.alog],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 6, 2,
    'Returns <code>antilog<sub>10</sub>(a/b)</code> - i.e. <code>10<sup>a/b</sub></code> - multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'LOG10', Pascal: 'log10', Python: 'log10' },
    [PCode.log],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 6, 2,
    'Returns <code>log<sub>10</sub>(a/b)</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'ASN', Pascal: 'arcsin', Python: 'asin' },
    [PCode.asin],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 6, 2,
    'Returns <code>arcsin(a/b)</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'ACS', Pascal: 'arccos', Python: 'acos' },
    [PCode.acos],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 6, 2,
    'Returns <code>arccos(a/b)</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'ATN', Pascal: 'arctan', Python: 'atan' },
    [PCode.atan],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 6, 2,
    'Returns <code>arctan(a/b)</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  // 7. String operations
  new Command(
    { BASIC: 'WRITE', Pascal: 'write', Python: 'write' },
    [PCode.writ],
    [new Parameter('string', 'string', false, 1)],
    null, 7, 0,
    'Writes the input <code>string</code> to the console and textual output area of the System.'
  ),
  new Command(
    { BASIC: 'WRITELN', Pascal: 'writeln', Python: 'writeline' },
    [PCode.writ, PCode.newl],
    [new Parameter('string', 'string', false, 1)],
    null, 7, 0,
    'Writes the input <code>string</code> to the console and textual output area of the System, followed by a line break.'
  ),
  new Command(
    { BASIC: 'PRINT', Pascal: 'print', Python: 'print' },
    [PCode.prnt],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('font', 'integer', false, 1),
      new Parameter('size', 'integer', false, 1)
    ],
    null, 7, 0,
    'Prints the input <code>string</code> in the Turtle&rsquo;s current colour and at the Turtle&rsquo;s current location, in the specified <code>font</code> and <code>size</code>. Can be used in conjunction with the <code>box</code> drawing command. For a list of available fonts, see the <b>Constants</b> tab.'
  ),
  new Command(
    { BASIC: 'LCASE$', Pascal: 'lowercase', Python: 'lower' },
    [PCode.ldin, 1, PCode.case],
    [new Parameter('string', 'string', false, 1)],
    'string', 7, 1,
    'Returns the input <code>string</code> as all lowercase.'
  ),
  new Command(
    { BASIC: 'UCASE$', Pascal: 'uppercase', Python: 'upper' },
    [PCode.ldin, 2, PCode.case],
    [new Parameter('string', 'string', false, 1)],
    'string', 7, 1,
    'Returns the input <code>string</code> as all uppercase.'
  ),
  new Command(
    { BASIC: null, Pascal: 'initcap', Python: 'capitalize' },
    [PCode.ldin, 3, PCode.case],
    [new Parameter('string', 'string', false, 1)],
    'string', 7, 1,
    'Returns the input <code>string</code> with the first letter capitalized.'
  ),
  new Command(
    { BASIC: null, Pascal: 'titlecase', Python: 'titlecase' },
    [PCode.ldin, 4, PCode.case],
    [new Parameter('string', 'string', false, 1)],
    'string', 7, 1,
    'Returns the input <code>string</code> in title case (i.e. the first letter of each word capitalized).'
  ),
  new Command(
    { BASIC: null, Pascal: 'swapcase', Python: 'swapcase' },
    [PCode.ldin, 5, PCode.case],
    [new Parameter('string', 'string', false, 1)],
    'string', 7, 1,
    'Returns the input <code>string</code> with all the cases swapped.'
  ),
  new Command(
    { BASIC: 'LEN', Pascal: 'length', Python: 'len' },
    [PCode.slen],
    [new Parameter('string', 'string', false, 1)],
    'integer', 7, 1,
    'Returns the length of the input <code>string</code> (i.e. the number of characters).'
  ),
  new Command(
    { BASIC: 'DEL$', Pascal: 'delete', Python: null },
    [PCode.dels],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('index', 'integer', false, 1),
      new Parameter('length', 'integer', false, 1)
    ],
    'string', 7, 2,
    'Returns the input <code>string</code> with some characters removed, starting at the given <code>index</code> and of the specified <code>length</code>.'
  ),
  new Command(
    { BASIC: 'LEFT$', Pascal: null, Python: null },
    [PCode.ldin, 1, PCode.swap, PCode.copy],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('length', 'integer', false, 1)
    ],
    'string', 7, 2,
    'Returns a copy of the characters in the input <code>string</code>, starting on the left and of the specified <code>length</code>.'
  ),
  new Command(
    { BASIC: 'MID$', Pascal: 'copy', Python: 'copy' },
    [PCode.copy],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('index', 'integer', false, 1),
      new Parameter('length', 'integer', false, 1)
    ],
    'string', 7, 2,
    'Returns a copy of the characters in the input <code>string</code>, starting at the given <code>index</code> and of the specified <code>length</code>.'
  ),
  new Command(
    { BASIC: 'RIGHT$', Pascal: null, Python: null },
    [PCode.swap, PCode.dupl, PCode.slen, PCode.incr, PCode.rota, PCode.subt, PCode.mxin, PCode.copy],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('length', 'integer', false, 1)
    ],
    'string', 7, 2,
    'Returns a copy of the characters in the input <code>string</code>, starting on the right and of the specified <code>length</code>.'
  ),
  new Command(
    { BASIC: 'INS$', Pascal: null, Python: 'insert' },
    [PCode.rota, PCode.rota, PCode.inss],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('index', 'integer', false, 1),
      new Parameter('substr', 'string', false, 1)
    ],
    'string', 7, 2,
    'Returns the input <code>string</code> with the specified <code>substring</code> inserted at the given <code>index</code>.'
  ),
  new Command(
    { BASIC: null, Pascal: 'insert', Python: null },
    [PCode.inss],
    [
      new Parameter('substr', 'string', false, 1),
      new Parameter('string', 'string', false, 1),
      new Parameter('index', 'integer', false, 1)
    ],
    'string', 7, 2,
    'Returns the input <code>string</code> with the specified <code>substring</code> inserted at the given <code>index</code>.'
  ),
  new Command(
    { BASIC: 'PAD$', Pascal: 'pad', Python: 'pad' },
    [PCode.spad],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('padding', 'string', false, 1),
      new Parameter('length', 'integer', false, 1)
    ],
    'string', 7, 2,
    'Returns the input <code>string</code> with the input <code>padding</code> added either before or after to make a string of minimum given <code>length</cope>. The <code>padding</code> is placed before if <code>length</code> is positive, after if it is negative.'
  ),
  new Command(
    { BASIC: 'REPLACE$', Pascal: 'replace', Python: 'replace' },
    [PCode.repl],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('substr', 'string', false, 1),
      new Parameter('replace', 'string', false, 1),
      new Parameter('n', 'integer', false, 1)
    ],
    'string', 7, 2,
    'Returns the input <code>string</code> with up to <code>n</code> occurences of <code>substring</code> replaced by <code>replace</code>. Set <code>n</code> equal to <code>0</code> to replace every occurence.'
  ),
  new Command(
    { BASIC: 'INSTR', Pascal: null, Python: 'find' },
    [PCode.swap, PCode.poss],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('substr', 'string', false, 1)
    ],
    'integer', 7, 2,
    'Searches for the input <code>substring</code> within the given <code>string</code>; returns the index of the first character if found, 0 otherwise.'
  ),
  new Command(
    { BASIC: null, Pascal: 'pos', Python: null },
    [PCode.poss],
    [
      new Parameter('substr', 'string', false, 1),
      new Parameter('string', 'string', false, 1)
    ],
    'integer', 7, 2,
    'Searches for the input <code>substring</code> within the given <code>string</code>; returns the index of the first character if found, 0 otherwise.'
  ),
  // 8. Type conversion routines
  new Command(
    { BASIC: 'STR$', Pascal: 'str', Python: 'str' },
    [PCode.itos],
    [new Parameter('n', 'integer', false, 1)],
    'string', 8, 0,
    'Returns the integer <code>n</code> as a string, e.g. <code>str(12)=\'12\'</code>.'
  ),
  new Command(
    { BASIC: 'VAL', Pascal: 'val', Python: 'int' },
    [PCode.ldin, 0, PCode.sval],
    [new Parameter('string', 'string', false, 1)],
    'integer', 8, 0,
    'Returns the input <code>string</code> as an integer, e.g. <code>val(\'12\')=12</code>. Returns <code>0</code> if the string cannot be converted (i.e. if it is not an integer string).'
  ),
  new Command(
    { BASIC: 'VALDEF', Pascal: 'valdef', Python: 'intdef' },
    [PCode.sval],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('default', 'integer', false, 1)
    ],
    'integer', 8, 0,
    'Returns the input <code>string</code> as an integer, e.g. <code>val(\'12\')=12</code>. Returns the specified <code>default</code> value if the string cannot be converted (i.e. if it is not an integer string).'
  ),
  new Command(
    { BASIC: 'QSTR$', Pascal: 'qstr', Python: 'qstr' },
    [PCode.qtos],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1),
      new Parameter('decplaces', 'integer', false, 1)
    ],
    'string', 8, 1,
    'Returns the value of <code>a/b</code> to the specified number of decimal places, as a decimal string, e.g. <code>qstr(2,3,4)=\'0.6667\'</code>.'
  ),
  new Command(
    { BASIC: 'QVAL', Pascal: 'qval', Python: 'qval' },
    [PCode.qval],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('mult', 'integer', false, 1),
      new Parameter('default', 'integer', false, 1)
    ],
    'integer', 8, 1,
    'Returns the input decimal <code>string</code> as an integer, multiplied by <code>mult</code> and rounded to the nearest integer, e.g. <code>qval(\'1.5\',10)=15</code>. Returns the specified <code>default</code> value if the string cannot be converted (i.e. if it is not a decimal string).'
  ),
  new Command(
    { BASIC: 'CHR$', Pascal: 'chr', Python: 'chr' },
    [PCode.ctos],
    [new Parameter('n', 'integer', false, 1)],
    'string', 8, 2,
    'Returns the character with ASCII character code <code>n</code>.'
  ),
  new Command(
    { BASIC: 'ASC', Pascal: 'ord', Python: 'ord' },
    [PCode.sasc],
    [new Parameter('char', 'string', false, 1)],
    'integer', 8, 2,
    'Returns the ASCII code of the input character, or of the first character of the input string.'
  ),
  new Command(
    { BASIC: 'BOOLINT', Pascal: 'boolint', Python: null },
    [PCode.null],
    [new Parameter('boolean', 'boolean', false, 1)],
    'integer', 8, 2,
    'Returns the input <code>boolean</code> as an integer (-1 for <code>true</code>, 0 for <code>false</code>).'
  ),
  new Command(
    { BASIC: null, Pascal: null, Python: 'boolint' },
    [PCode.abs],
    [new Parameter('boolean', 'boolean', false, 1)],
    'integer', 8, 2,
    'Returns the input <code>boolean</code> as an integer (1 for <code>true</code>, 0 for <code>false</code>).'
  ),
  new Command(
    { BASIC: 'HEX$', Pascal: 'hexstr', Python: 'hex' },
    [PCode.hexs],
    [
      new Parameter('n', 'integer', false, 1),
      new Parameter('minlength', 'integer', false, 1)
    ],
    'string', 8, 2,
    'Returns a string representation of integer <code>n</code> in hexadecimal format, padded with leading zeros as up to <code>minlength</code>, e.g. <code>hexstr(255,6)=\'0000FF\'</code>.'
  ),
  // 9. Input and timing routines
  new Command(
    { BASIC: 'PAUSE', Pascal: 'pause', Python: 'pause' },
    [PCode.wait],
    [new Parameter('m', 'integer', false, 1)],
    null, 9, 0,
    'Makes the Turtle Machine wait <code>m</code> milliseconds before performing the next operation. This is useful for controlling the speed of animations.'
  ),
  new Command(
    { BASIC: 'HALT', Pascal: 'halt', Python: 'halt' },
    [PCode.halt],
    [], null, 9, 0,
    'Halts the program.'
  ),
  new Command(
    { BASIC: 'GETLINE$', Pascal: 'readln', Python: 'readline' },
    [PCode.rdln],
    [], 'string', 9, 0,
    'Waits for the RETURN key to be pressed, then returns everything in the keybuffer up to (and not including) the new line character.'
  ),
  new Command(
    { BASIC: 'INPUT$', Pascal: null, Python: 'input' },
    [PCode.writ, PCode.newl, PCode.rdln],
    [new Parameter('prompt', 'string', false, 1)],
    'string', 9, 0,
    'Gives an input prompt, then returns the input when the RETURN key is pressed (using the keybuffer).'
  ),
  new Command(
    { BASIC: 'CURSOR', Pascal: 'cursor', Python: 'cursor' },
    [PCode.curs],
    [new Parameter('cursorcode', 'integer', false, 1)],
    null, 9, 1,
    'Sets which cursor to display (1-15) when the mouse pointer is over the canvas. 0 hides the cursor; any value outside the range 0-15 resets the default cursor. For a list of available cursors, see the <b>Cursors</b> tab.'
  ),
  new Command(
    { BASIC: 'KEYECHO', Pascal: 'keyecho', Python: 'keyecho' },
    [PCode.kech],
    [new Parameter('on', 'boolean', false, 1)],
    null, 9, 1,
    'Turns the keyboard echo to the console on (<code>true</code>) or off (<code>false</code>).'
  ),
  new Command(
    { BASIC: 'DETECT', Pascal: 'detect', Python: 'detect' },
    [PCode.tdet],
    [
      new Parameter('keycode', 'integer', false, 1),
      new Parameter('m', 'integer', false, 1)
    ],
    'boolean', 9, 1,
    'Waits a maximum of <code>m</code> milliseconds for the key with the specified <code>keycode</code> to be pressed; returns <code>true</code> if pressed (and stops waiting), <code>false</code> otherwise.'
  ),
  new Command(
    { BASIC: 'GET$', Pascal: 'read', Python: 'read' },
    [PCode.read],
    [new Parameter('n', 'integer', false, 1)],
    'string', 9, 1,
    'Returns the first <code>n</code> characters from the keybuffer as a string.'
  ),
  new Command(
    { BASIC: 'TIME', Pascal: 'time', Python: 'time' },
    [PCode.time],
    [], 'integer', 9, 1,
    'Returns the time (in milliseconds) since the program began.'
  ),
  new Command(
    { BASIC: 'TIMESET', Pascal: 'timeset', Python: 'timeset' },
    [PCode.tset],
    [new Parameter('m', 'integer', false, 1)],
    null, 9, 1,
    'Artificially sets the time since the program began to <code>m</code> milliseconds.'
  ),
  new Command(
    { BASIC: 'RESET', Pascal: 'reset', Python: 'reset' },
    [PCode.iclr],
    [new Parameter('?input', 'integer', false, 1)],
    null, 9, 2,
    'Resets the specified <code>?input</code> (<code>?mousex</code>, <code>?mousey</code>, <code>?click</code>, etc.) to its initial value (i.e. -1).'
  ),
  new Command(
    { BASIC: 'KEYSTATUS', Pascal: 'keystatus', Python: 'keystatus' },
    [PCode.inpt],
    [new Parameter('keycode', 'integer', false, 1)],
    'integer', 9, 2,
    'Returns the <code>?kshift</code> value for the most recent press of the key with the specified <code>keycode</code>.'
  ),
  new Command(
    { BASIC: 'KEYBUFFER', Pascal: 'keybuffer', Python: 'keybuffer' },
    [PCode.bufr, PCode.ldin, 1, PCode.sptr, PCode.hfix],
    [new Parameter('n', 'integer', false, 1)],
    null, 9, 2,
    'Creates a new custom keybuffer of length <code>n</code>. A keybuffer of length 32 is available by default; use this command if you need a larger buffer.'
  ),
  // 10. file processing
  new Command(
    { BASIC: 'CHDIR', Pascal: 'chdir', Python: 'chdir' },
    [PCode.chdr],
    [new Parameter('directory name', 'string', false, 1)],
    null,
    10,
    1,
    'Change current directory'
  ),
  new Command(
    { BASIC: 'RMDIR', Pascal: 'rmdir', Python: 'rmdir' },
    [PCode.ldin, 1, PCode.diry, PCode.ldin, 128, PCode.less],
    [new Parameter('subdirectory name', 'string', false, 1)],
    'boolean',
    10,
    1,
    'Remove subdirectory'
  ),
  new Command(
    { BASIC: 'MKDIR', Pascal: 'mkdir', Python: 'mkdir' },
    [PCode.ldin, 2, PCode.diry, PCode.ldin, 127, PCode.more],
    [new Parameter('subdirectory name', 'string', false, 1)],
    'boolean',
    10,
    1,
    'Make subdirectory of base directory'
  ),
  new Command(
    { BASIC: null, Pascal: 'openfile', Python: 'openfile' },
    [PCode.open],
    [
      new Parameter('filename', 'string', false, 1),
      new Parameter('mode', 'integer', false, 1)
    ],
    'integer',
    10,
    1,
    'Open file (1: read, 2:append, 3: write)'
  ),
  new Command(
    { BASIC: 'OPENIN', Pascal: null, Python: null },
    [PCode.ldin, 1, PCode.open],
    [new Parameter('filename', 'string', false, 1)],
    'integer',
    10,
    1,
    'Open file to read'
  ),
  new Command(
    { BASIC: 'OPENUP', Pascal: null, Python: null },
    [PCode.ldin, 2, PCode.open],
    [new Parameter('filename', 'string', false, 1)],
    'integer',
    10,
    1,
    'Open file to append'
  ),
  new Command(
    { BASIC: 'OPENOUT', Pascal: null, Python: null },
    [PCode.ldin, 4, PCode.open],
    [new Parameter('filename', 'string', false, 1)],
    'integer',
    10,
    1,
    'Open file to write'
  ),
  new Command(
    { BASIC: 'CLOSE#', Pascal: 'closefile', Python: 'closefile' },
    [PCode.clos],
    [new Parameter('file handle', 'integer', false, 1)],
    null,
    10,
    1,
    'Close file'
  ),
  new Command(
    { BASIC: 'DELETEFILE', Pascal: 'deletefile', Python: 'deletefile' },
    [PCode.ldin, 1, PCode.file, PCode.ldin, 128, PCode.less],
    [new Parameter('filename', 'string', false, 1)],
    'boolean',
    10,
    1,
    'Delete file'
  ),
  new Command(
    { BASIC: 'FREAD#', Pascal: 'fread', Python: 'fread' },
    [PCode.frds],
    [
      new Parameter('file handle', 'integer', false, 1),
      new Parameter('max length', 'integer', false, 1)
    ],
    'string',
    10,
    1,
    'Read characters from file'
  ),
  new Command(
    { BASIC: 'FREADLN#', Pascal: 'freadln', Python: 'freadln' },
    [PCode.frln],
    [new Parameter('file handle', 'integer', false, 1)],
    'string',
    10,
    1,
    'Read line from file'
  ),
  new Command(
    { BASIC: 'PRINT#', Pascal: 'fwrite', Python: 'fwrite' },
    [PCode.fwrs],
    [
      new Parameter('file handle', 'integer', false, 1),
      new Parameter('string', 'string', false, 1)
    ],
    null,
    10,
    1,
    'Write string to file'
  ),
  new Command(
    { BASIC: 'PRINTLN#', Pascal: 'fwriteln', Python: 'fwriteln' },
    [PCode.fwln],
    [
      new Parameter('file handle', 'integer', false, 1),
      new Parameter('string', 'string', false, 1)
    ],
    null,
    10,
    1,
    'Write line to file'
  ),
  new Command(
    { BASIC: 'EOF#', Pascal: 'eof', Python: 'eof' },
    [PCode.eof],
    [new Parameter('file handle', 'integer', false, 1)],
    'boolean',
    10,
    1,
    'Test for end of file'
  ),
  new Command(
    { BASIC: 'CHECKDIR', Pascal: 'checkdir', Python: 'checkdir' },
    [PCode.ldin, 0, PCode.diry, PCode.ldin, 127, PCode.more],
    [
      new Parameter('directory name', 'string', false, 1),
      new Parameter('code', 'integer', false, 1)
    ],
    'integer',
    10,
    2,
    'Create/delete/check directory'
  ),
  new Command(
    { BASIC: 'CHECKFILE', Pascal: 'checkfile', Python: 'checkfile' },
    [PCode.ldin, 0, PCode.file, PCode.ldin, 127, PCode.more],
    [
      new Parameter('filename', 'string', false, 1),
      new Parameter('code', 'integer', false, 1)
    ],
    'integer',
    10,
    2,
    'Create/delete/check file'
  ),
  new Command(
    { BASIC: 'COPYFILE', Pascal: 'copyfile', Python: 'copyfile' },
    [PCode.ldin, 3, PCode.fmov],
    [
      new Parameter('old name', 'string', false, 1),
      new Parameter('new name', 'string', false, 1)
    ],
    'boolean',
    10,
    2,
    'Copy file'
  ),
  new Command(
    { BASIC: 'DIREXISTS', Pascal: 'direxists', Python: 'direxists' },
    [PCode.ldin, 0, PCode.diry, PCode.ldin, 127, PCode.more],
    [new Parameter('subdirectory name', 'string', false, 1)],
    'boolean',
    10,
    2,
    'Check whether subdirectory exists'
  ),
  new Command(
    { BASIC: 'FILEEXISTS', Pascal: 'fileexists', Python: 'fileexists' },
    [PCode.ldin, 0, PCode.file, PCode.ldin, 127, PCode.more],
    [new Parameter('filename', 'string', false, 1)],
    'boolean',
    10,
    2,
    'Check whether file exists'
  ),
  new Command(
    { BASIC: 'FINDDIR', Pascal: 'finddir', Python: 'finddir' },
    [PCode.dupl, PCode.lptr, PCode.rota, PCode.fdir, PCode.swap, PCode.rota, PCode.sptr],
    [
      new Parameter('directory name pattern', 'string', false, 1),
      new Parameter('file handle', 'integer', false, 1)
    ],
    'string',
    10,
    2,
    'Find first directory matching pattern'
  ),
  new Command(
    { BASIC: 'FINDFIRST', Pascal: 'findfirst', Python: 'findfirst' },
    [PCode.dupl, PCode.lptr, PCode.rota, PCode.ffnd, PCode.swap, PCode.rota, PCode.sptr],
    [
      new Parameter('filename pattern', 'string', false, 1),
      new Parameter('file handle', 'integer', false, 1)
    ],
    'string',
    10,
    2,
    'Find first file matching pattern'
  ),
  new Command(
    { BASIC: 'FINDNEXT', Pascal: 'findnext', Python: 'findnext' },
    [PCode.fnxt],
    [new Parameter('file handle', 'integer', false, 1)],
    'string',
    10,
    2,
    'Find next file/directory matching pattern'
  ),
  new Command(
    { BASIC: 'RENAMEFILE', Pascal: 'renamefile', Python: 'renamefile' },
    [PCode.ldin, 1, PCode.fmov],
    [
      new Parameter('old filename', 'string', false, 1),
      new Parameter('new filename', 'string', false, 1)
    ],
    'boolean',
    10,
    2,
    'Rename file'
  ),
  new Command(
    { BASIC: 'MOVEFILE', Pascal: 'movefile', Python: 'movefile' },
    [PCode.ldin, 2, PCode.fmov],
    [
      new Parameter('old filename', 'string', false, 1),
      new Parameter('new filename', 'string', false, 1)
    ],
    'boolean',
    10,
    2,
    'Move file'
  ),
  new Command(
    { BASIC: 'RESTARTFILE', Pascal: 'restartfile', Python: 'restartfile' },
    [PCode.fbeg],
    [new Parameter('file handle', 'integer', false, 1)],
    null,
    10,
    2,
    'Restart file'
  ),
  new Command(
    { BASIC: 'EOLN#', Pascal: 'eoln', Python: 'eoln' },
    [PCode.eoln],
    [new Parameter('file handle', 'integer', false, 1)],
    'boolean',
    10,
    2,
    'Test for end of line in file'
  ),
  // 11. Turtle Machine monitoring
  new Command(
    { BASIC: 'DUMP', Pascal: 'dump', Python: 'dump' },
    [PCode.dump],
    [], null,
    11,
    2,
    '&ldquo;Dumps&rdquo; the current memory state into the display in the memory tab.'
  ),
  new Command(
    { BASIC: 'HEAPRESET', Pascal: 'heapreset', Python: 'heapreset' },
    [PCode.hrst],
    [], null,
    11,
    2,
    'Resets the memory heap to the initial global value.'
  ),
  new Command(
    { BASIC: 'PEEK', Pascal: 'peek', Python: 'peek' },
    [PCode.peek],
    [new Parameter('address', 'integer', false, 1)],
    null,
    11,
    2,
    'Peek at the value of the memory at the given <code>address</code>.'
  ),
  new Command(
    { BASIC: 'POKE', Pascal: 'poke', Python: 'poke' },
    [PCode.poke],
    [
      new Parameter('address', 'integer', false, 1),
      new Parameter('value', 'integer', false, 1)
    ],
    null,
    11,
    2,
    'Poke the <code>value</code> into the memory at the given <code>address</code>.'
  ),
  new Command(
    { BASIC: 'TRACE', Pascal: 'trace', Python: 'trace' },
    [PCode.trac],
    [new Parameter('on', 'boolean', false, 1)],
    null,
    11,
    2,
    'Turns the PCode trace facility on (<code>true</code>) or off (<code>false</code>).'
  ),
  new Command(
    { BASIC: 'WATCH', Pascal: 'watch', Python: 'watch' },
    [PCode.memw],
    [new Parameter('address', 'integer', false, 1)],
    null,
    11,
    2,
    'Sets an <code>address</code> in memory for the trace facility to watch.'
  )
]
