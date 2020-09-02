/*
 * Arrays of native Turtle commands and their categories.
 */
import { Language } from './languages'
import { PCode } from './pcodes'
import { VariableType } from '../parser/routine'

/** command class definition */
export class Command {
  readonly names: Record<Language, string|null>
  readonly code: number[]
  readonly parameters: Parameter[]
  readonly returns: VariableType|null
  readonly category: number
  readonly level: number
  readonly description: string

  constructor (
    names: Record<Language, string|null>,
    code: number[], parameters: Parameter[], returns: VariableType|null,
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

/** parameter class definition */
export class Parameter {
  readonly name: string
  readonly type: VariableType
  readonly isReferenceParameter: boolean
  readonly length: number

  constructor (name: string, type: VariableType, isReferenceParameter: boolean, length: number) {
    this.name = name
    this.type = type
    this.isReferenceParameter = isReferenceParameter
    this.length = length
  }
}

/** array of commands */
export const commands: Command[] = [
  // 0. Turtle: relative movement
  new Command(
    { BASIC: 'FORWARD', C: 'forward', Pascal: 'forward', Python: 'forward', TypeScript: 'forward' },
    [PCode.fwrd],
    [new Parameter('n', 'integer', false, 1)],
    null, 0, 0,
    'Moves the Turtle forward <code>n</code> units, drawing as it goes (unless the pen is up).'
  ),
  new Command(
    { BASIC: 'BACK', C: 'back', Pascal: 'back', Python: 'back', TypeScript: 'back' },
    [PCode.back],
    [new Parameter('n', 'integer', false, 1)],
    null, 0, 0,
    'Moves the Turtle back <code>n</code> units, drawing as it goes (unless the pen is up).'
  ),
  new Command(
    { BASIC: 'LEFT', C: 'leff', Pascal: 'left', Python: 'left', TypeScript: 'left' },
    [PCode.left],
    [new Parameter('n', 'integer', false, 1)],
    null, 0, 0,
    'Rotates the Turtle left by <code>n</code> degrees.'
  ),
  new Command(
    { BASIC: 'RIGHT', C: 'right', Pascal: 'right', Python: 'right', TypeScript: 'right' },
    [PCode.rght],
    [new Parameter('n', 'integer', false, 1)],
    null, 0, 0,
    'Rotates the Turtle right by <code>n</code> degrees.'
  ),
  new Command(
    { BASIC: 'DRAWXY', C: 'drawxy', Pascal: 'drawxy', Python: 'drawxy', TypeScript: 'drawxy' },
    [PCode.drxy],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1)
    ],
    null, 0, 1,
    'Moves the Turtle in a straight line to a point <code>x</code> units away along the x-axis and <code>y</code> units away along the y-axis, drawing as it goes (unless the pen is up).'
  ),
  new Command(
    { BASIC: 'MOVEXY', C: 'movexy', Pascal: 'movexy', Python: 'movexy', TypeScript: 'movexy' },
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
    { BASIC: 'HOME', C: 'home', Pascal: 'home', Python: 'home', TypeScript: 'home' },
    [PCode.home],
    [], null, 1, 0,
    'Moves the Turtle back to its starting position in the centre of the canvas, facing north, drawing as it goes (unless the pen is up).'
  ),
  new Command(
    { BASIC: 'SETX', C: 'setx', Pascal: 'setx', Python: 'setx', TypeScript: 'setx' },
    [PCode.setx],
    [new Parameter('x', 'integer', false, 1)],
    null, 1, 0,
    'Sets the Turtle&rsquo;s <code>x</code> coordinate directly (without movement or drawing on the canvas). This can also be achieved by direct assignment of the global variable <code>turtx</code>.'
  ),
  new Command(
    { BASIC: 'SETY', C: 'sety', Pascal: 'sety', Python: 'sety', TypeScript: 'sety' },
    [PCode.sety],
    [new Parameter('y', 'integer', false, 1)],
    null, 1, 0,
    'Sets the Turtle&rsquo;s <code>y</code> coordinate directly (without movement or drawing on the canvas). This can also be achieved by direct assignment of the global variable <code>turty</code>.'
  ),
  new Command(
    { BASIC: 'SETXY', C: 'sety', Pascal: 'setxy', Python: 'setxy', TypeScript: 'setxy' },
    [PCode.toxy],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1)
    ],
    null, 1, 0,
    'Sets the Turtle&rsquo;s <code>x</code> and <code>y</code> coordinates directly (without movement or drawing on the canvas). This can also be achieved by direct assingment of the global variables <code>turtx</code> and <code>turty</code>.'
  ),
  new Command(
    { BASIC: 'DIRECTION', C: 'direction', Pascal: 'direction', Python: 'direction', TypeScript: 'direction' },
    [PCode.setd],
    [new Parameter('n', 'integer', false, 1)],
    null, 1, 0,
    'Sets the Turtle&rsquo;s direction to <code>n</code> degrees (0 for north, 90 for east, 180 for south, 270 for west). This can also be achieved by direct assignment of the global variable <code>turtd</code>. Note that the number of degrees in a circle (360 by default) can be changed with the <code>angles</code> command.'
  ),
  new Command(
    { BASIC: 'ANGLES', C: 'angles', Pascal: 'angles', Python: 'angles', TypeScript: 'angles' },
    [PCode.angl],
    [new Parameter('degrees', 'integer', false, 1)],
    null, 1, 1,
    'Sets the number of <code>degrees</code> in a circle (360 by default).'
  ),
  new Command(
    { BASIC: 'TURNXY', C: 'turnxy', Pascal: 'turnxy', Python: 'turnxy', TypeScript: 'turnxy' },
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
    { BASIC: 'CIRCLE', C: 'circle', Pascal: 'circle', Python: 'circle', TypeScript: 'circle' },
    [PCode.circ],
    [new Parameter('radius', 'integer', false, 1)],
    null, 2, 0,
    'Draws a circle outline in the Turtle&rsquo;s current colour and thickness, of the given <code>radius</code>, centred on the Turtle&rsquo;s current location.'
  ),
  new Command(
    { BASIC: 'BLOT', C: 'blot', Pascal: 'blot', Python: 'blot', TypeScript: 'blot' },
    [PCode.blot],
    [new Parameter('radius', 'integer', false, 1)],
    null, 2, 0,
    'Draws a filled circle in the Turtle&rsquo;s current colour, of the given <code>radius</code>, centred on the Turtle&rsquo;s current location.'
  ),
  new Command(
    { BASIC: 'ELLIPSE', C: 'ellipse', Pascal: 'ellipse', Python: 'ellipse', TypeScript: 'ellipse' },
    [PCode.elps],
    [
      new Parameter('Xradius', 'integer', false, 1),
      new Parameter('Yradius', 'integer', false, 1)
    ],
    null, 2, 0,
    'Draws an ellipse outline in the Turtle&rsquo;s current colour and thickness, of the given <code>Xradius</code> and <code>Yradius</code>, centred on the Turtle&rsquo;s current location.'
  ),
  new Command(
    { BASIC: 'ELLBLOT', C: 'ellblot', Pascal: 'ellblot', Python: 'ellblot', TypeScript: 'ellblot' },
    [PCode.eblt],
    [
      new Parameter('Xradius', 'integer', false, 1),
      new Parameter('Yradius', 'integer', false, 1)
    ],
    null, 2, 0,
    'Draws a filled ellipse in the Turtle&rsquo;s current colour, of the given <code>Xradius</code> and <code>Yradius</code>, centred on the Turtle&rsquo;s current location.'
  ),
  new Command(
    { BASIC: 'POLYLINE', C: 'polyline', Pascal: 'polyline', Python: 'polyline', TypeScript: 'polyline' },
    [PCode.poly],
    [new Parameter('n', 'integer', false, 1)],
    null, 2, 1,
    'Draws a polygon outline in the Turtle&rsquo;s current colour and thickness, connecting the last <code>n</code> locations that the Turtle has visited.'
  ),
  new Command(
    { BASIC: 'POLYGON', C: 'polygon', Pascal: 'polygon', Python: 'polygon', TypeScript: 'polygon' },
    [PCode.pfil],
    [new Parameter('n', 'integer', false, 1)],
    null, 2, 1,
    'Draws a filled polygon in the Turtle&rsquo;s current colour and thickness, connecting the last <code>n</code> locations that the Turtle has visited.'
  ),
  new Command(
    { BASIC: 'FORGET', C: 'forget', Pascal: 'forget', Python: 'forget', TypeScript: 'forget' },
    [PCode.frgt],
    [new Parameter('n', 'integer', false, 1)],
    null, 2, 1,
    'Makes the Turtle &ldquo;forget&rdquo; the last <code>n</code> points it has visited. Used in conjunction with <code>polyline</code> and <code>polygon</code>.'
  ),
  new Command(
    { BASIC: 'REMEMBER', C: 'remember', Pascal: 'remember', Python: 'remember', TypeScript: 'remember' },
    [PCode.rmbr],
    [], null, 2, 1,
    'Makes the Turtle &ldquo;remember&rdquo; its current location. This is only necessary if its current location was set by a direct assignment of the global variables <code>turtx</code> and <code>turty</code>; when using the standard moving commands, the Turtle automatically remembers where it has been.'
  ),
  new Command(
    { BASIC: 'BOX', C: 'box', Pascal: 'box', Python: 'box', TypeScript: 'box' },
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
    { BASIC: 'COLOUR', C: 'colour', Pascal: 'colour', Python: 'colour', TypeScript: 'colour' },
    [PCode.colr],
    [new Parameter('colour', 'integer', false, 1)],
    null, 3, 0,
    'Sets the <code>colour</code> of the Turtle&rsquo;s pen. Takes as an argument either an RGB value, or one of the Turtle System&rsquo;s fifty predefined colour constants (see the <b>Colours</b> tab). This can also be achieved by direct assignment of the global variable <code>turtc</code>.'
  ),
  new Command(
    { BASIC: 'RNDCOL', C: 'randcol', Pascal: 'randcol', Python: 'randcol', TypeScript: 'randcol' },
    [PCode.rand, PCode.incr, PCode.rgb, PCode.colr],
    [new Parameter('n', 'integer', false, 1)],
    null, 3, 0,
    'Assigns a random colour to the Turte&rsquo;s pen, between 1 and <code>n</code> (maximum 50). The colours are taken from the Turtle System&rsquo;s fifty predefined colours, which are each assigned a number between 1 and 50 (see the <b>Colours</b> tab).'
  ),
  new Command(
    { BASIC: 'THICKNESS', C: 'thickness', Pascal: 'thickness', Python: 'thickness', TypeScript: 'thickness' },
    [PCode.thik],
    [new Parameter('thickness', 'integer', false, 1)],
    null, 3, 0,
    'Sets the <code>thickness</code> of the Turtle&rsquo;s pen (for line drawing, and outlines of circles, ellipses, boxes, and polygons). This can also be achieved by direct assignment of the global variable <code>turtt</code>.'
  ),
  new Command(
    { BASIC: 'PENUP', C: 'penup', Pascal: 'penup', Python: 'penup', TypeScript: 'penup' },
    [PCode.ldin, 0, PCode.pen],
    [], null, 3, 0,
    'Lifts the Turtle&rsquo;s pen, so that subsequent movement will not draw a line on the Canvas.'
  ),
  new Command(
    { BASIC: 'PENDOWN', C: 'pendown', Pascal: 'pendown', Python: 'pendown', TypeScript: 'pendown' },
    [PCode.ldin, -1, PCode.pen],
    [], null, 3, 0,
    'Lowers the Turtle&rsquo;s pen, so that subsequent movement will draw a line on the Canvas.'
  ),
  new Command(
    { BASIC: 'OUTPUT', C: 'output', Pascal: 'output', Python: 'output', TypeScript: 'output' },
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
    { BASIC: 'CONSOLE', C: 'console', Pascal: 'console', Python: 'console', TypeScript: 'console' },
    [PCode.cons],
    [
      new Parameter('clear', 'boolean', false, 1),
      new Parameter('colour', 'integer', false, 1)
    ],
    null, 3, 1,
    'Modifies the Console; if the first argument is <code>true</code>, it clears any existing text, while the second argument specifies the background colour.'
  ),
  new Command(
    { BASIC: 'RGB', C: 'rgb', Pascal: 'rgb', Python: 'rgb', TypeScript: 'rgb' },
    [PCode.rgb],
    [new Parameter('colour', 'integer', false, 1)],
    'integer', 3, 2,
    'Returns the RGB value of the input <code>colour</code> (an integer between 1 and 50). For example, <code>rgb(red)=255</code>.'
  ),
  new Command(
    { BASIC: 'MIXCOLS', C: 'mixcols', Pascal: 'mixcols', Python: 'mixcols', TypeScript: 'mixcols' },
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
    { BASIC: 'NEWTURTLE', C: 'newturtle', Pascal: 'newturtle', Python: 'newturtle', TypeScript: 'newturtle' },
    [PCode.ldin, 0, PCode.sptr],
    [new Parameter('array', 'integer', true, 5)],
    null, 3, 2,
    'Points the Turtle to a custom array in memory (this must be an array of five integers, corresponding to the Turtle&rsquo;s five properties, <code>turtx</code>, <code>turty</code>, <code>turtd</code>, <code>turtt</code>, and <code>turtc</code>). Use repeatedly to simulate multiple Turtles.'
  ),
  new Command(
    { BASIC: 'OLDTURTLE', C: 'oldturtle', Pascal: 'oldturtle', Python: 'oldturtle', TypeScript: 'oldturtle' },
    [PCode.oldt],
    [], null, 3, 2,
    'Points the Turtle back to the default (built-in) array in memory. Use in conjunction with <code>newturtle</code>.'
  ),
  // 4. Canvas operations
  new Command(
    { BASIC: 'UPDATE', C: 'update', Pascal: 'update', Python: 'update', TypeScript: 'update' },
    [PCode.ldin, -1, PCode.udat],
    [], null, 4, 0,
    'Makes the Machine update the Canvas, and continue updating with all subsequent drawing commands. Used in conjunction with <em>noupdate</em>.'
  ),
  new Command(
    { BASIC: 'NOUPDATE', C: 'noupdate', Pascal: 'noupdate', Python: 'noupdate', TypeScript: 'noupdate' },
    [PCode.ldin, 0, PCode.udat],
    [], null, 4, 0,
    'Makes the Machine refrain from updating the Canvas when executing all subsequent drawing commands, until <em>update</em> is called. Use this to create smooth animations, by queueing up several drawing commands to execute simultaneously.'
  ),
  new Command(
    { BASIC: 'BLANK', C: 'blank', Pascal: 'blank', Python: 'blank', TypeScript: 'blank' },
    [PCode.blnk],
    [new Parameter('colour', 'integer', false, 1)],
    null, 4, 0,
    'Blanks the entire Canvas with the specified <code>colour</code>.'
  ),
  new Command(
    { BASIC: 'CANVAS', C: 'canvas', Pascal: 'canvas', Python: 'canvas', TypeScript: 'canvas' },
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
    { BASIC: 'RESOLUTION', C: 'resolution', Pascal: 'resolution', Python: 'resolution', TypeScript: 'resolution' },
    [PCode.reso],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1)
    ],
    null, 4, 1,
    'Sets the Canvas resolution, i.e. the number of actual pixels in the <code>x</code> and <code>y</code> dimensions. To be used in conjunction with the <code>canvas</code> command, typically to set the number of actual pixels equal to the number of virtual points on the Canvas.'
  ),
  new Command(
    { BASIC: 'PIXSET', C: 'pixset', Pascal: 'pixset', Python: 'pixset', TypeScript: 'pixset' },
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
    { BASIC: 'PIXCOL', C: 'pixcol', Pascal: 'pixcol', Python: 'pixcol', TypeScript: 'pixcol' },
    [PCode.pixc],
    [
      new Parameter('x', 'integer', false, 1),
      new Parameter('y', 'integer', false, 1)
    ],
    'integer', 4, 2,
    'Returns the RGB value of the colour at point <code>(x,y)</code>.'
  ),
  new Command(
    { BASIC: 'RECOLOUR', C: 'recolour', Pascal: 'recolour', Python: 'recolour', TypeScript: 'recolour' },
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
    { BASIC: 'FILL', C: 'fill', Pascal: 'fill', Python: 'fill', TypeScript: 'fill' },
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
    { BASIC: 'INC', C: 'inc', Pascal: 'inc', Python: 'inc', TypeScript: 'inc' },
    [PCode.dupl, PCode.lptr, PCode.incr, PCode.swap, PCode.sptr],
    [new Parameter('variable', 'integer', true, 1)],
    null, 5, 0,
    'Increments the specified <code>variable</code> by 1.'
  ),
  new Command(
    { BASIC: 'DEC', C: 'dec', Pascal: 'dec', Python: 'dec', TypeScript: 'dec' },
    [PCode.dupl, PCode.lptr, PCode.decr, PCode.swap, PCode.sptr],
    [new Parameter('variable', 'integer', true, 1)],
    null, 5, 0,
    'Decrements the specified <code>variable</code> by 1.'
  ),
  new Command(
    { BASIC: 'ABS', C: 'abs', Pascal: 'abs', Python: 'abs', TypeScript: 'abs' },
    [PCode.abs],
    [new Parameter('n', 'integer', false, 1)],
    'integer', 5, 0,
    'Returns the absolute value of <code>n</code>, i.e. <code>n</code> if positive, <code>-n</code> if negative.'
  ),
  new Command(
    { BASIC: 'SGN', C: 'sign', Pascal: 'sign', Python: 'sign', TypeScript: 'sign' },
    [PCode.sign],
    [new Parameter('a', 'integer', false, 1)],
    'integer', 5, 1,
    'Returns <code>+1</code> if <code>a</code> is positive, <code>-1</code> if <code>a</code> is negative, and <code>0</code> otherwise.'
  ),
  new Command(
    { BASIC: 'MAX', C: 'max', Pascal: 'max', Python: 'max', TypeScript: 'max' },
    [PCode.maxi],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1)
    ],
    'integer', 5, 1,
    'Returns the maximum of <code>a</code> and <code>b</code>.'
  ),
  new Command(
    { BASIC: 'MIN', C: 'min', Pascal: 'min', Python: 'min', TypeScript: 'min' },
    [PCode.mini],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1)
    ],
    'integer', 5, 1,
    'Returns the minimum of <code>a</code> and <code>b</code>.'
  ),
  new Command(
    { BASIC: 'SQR', C: 'sqrt', Pascal: 'sqrt', Python: 'sqrt', TypeScript: 'sqrt' },
    [PCode.sqrt],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('mult', 'integer', false, 1)
    ],
    'integer', 5, 1,
    'Returns <code>&radic;a</code>, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'HYPOT', C: 'hypot', Pascal: 'hypot', Python: 'hypot', TypeScript: 'hypot' },
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
    { BASIC: 'RND', C: null, Pascal: null, Python: null, TypeScript: null },
    [PCode.rand, PCode.incr],
    [new Parameter('n', 'integer', false, 1)],
    'integer', 5, 1,
    'Returns a random integer between 1 and <code>n</code>.'
  ),
  new Command(
    { BASIC: null, C: 'rand', Pascal: 'random', Python: null, TypeScript: 'random' },
    [PCode.rand],
    [new Parameter('n', 'integer', false, 1)],
    'integer', 5, 1,
    'Returns a random non-negative integer less than <code>n</code>.'
  ),
  new Command(
    { BASIC: null, C: null, Pascal: null, Python: 'randint', TypeScript: null },
    [PCode.swap, PCode.dupl, PCode.rota, PCode.incr, PCode.swap, PCode.subt, PCode.rand, PCode.plus],
    [
      new Parameter('a', 'integer', false, 1),
      new Parameter('b', 'integer', false, 1)
    ],
    'integer', 5, 1,
    'Returns a random integer between <code>a</code> and <code>b</code>.'
  ),
  new Command(
    { BASIC: 'RNDSEED', C: 'srand', Pascal: 'randseed', Python: 'randseed', TypeScript: 'randseed' },
    [PCode.seed],
    [new Parameter('seed', 'integer', false, 1)],
    'integer', 5, 1,
    'Initialises the random number generator with the given <code>seed</code>, and returns that seed. If <code>seed</code> is 0, the seed is set from the current system clock.'
  ),
  new Command(
    { BASIC: 'POWER', C: 'pow', Pascal: 'power', Python: 'power', TypeScript: 'pow' },
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
    { BASIC: 'ROOT', C: 'root', Pascal: 'root', Python: 'root', TypeScript: 'root' },
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
    { BASIC: 'DIVMULT', C: 'divmult', Pascal: 'divmult', Python: 'divmult', TypeScript: 'divmult' },
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
    { BASIC: 'MAXINT', C: 'maxint', Pascal: 'maxint', Python: 'maxint', TypeScript: 'maxint' },
    [PCode.mxin],
    [], 'integer', 5, 2,
    'Returns the maximum integer that the Machine can deal with (2<sup>31</sup>-1).'
  ),
  // 6. Trig / exp / log functions
  new Command(
    { BASIC: 'SIN', C: 'sin', Pascal: 'sin', Python: 'sin', TypeScript: 'sin' },
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
    { BASIC: 'COS', C: 'cos', Pascal: 'cos', Python: 'cos', TypeScript: 'cos' },
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
    { BASIC: 'TAN', C: 'tan', Pascal: 'tan', Python: 'tan', TypeScript: 'tan' },
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
    { BASIC: 'PI', C: 'pi', Pascal: 'pi', Python: 'pi', TypeScript: 'PI' },
    [PCode.pi],
    [new Parameter('mult', 'integer', false, 1)],
    'integer', 6, 1,
    'Returns the value of Pi, multiplied by <code>mult</code> and rounded to the nearest integer. Use the multiplier to approximate real numbers.'
  ),
  new Command(
    { BASIC: 'EXP', C: 'exp', Pascal: 'exp', Python: 'exp', TypeScript: 'exp' },
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
    { BASIC: 'LN', C: 'log', Pascal: 'ln', Python: 'ln', TypeScript: 'log' },
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
    { BASIC: 'ANTILOG', C: 'antilog', Pascal: 'antilog', Python: 'antilog', TypeScript: 'antilog' },
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
    { BASIC: 'LOG10', C: 'log10', Pascal: 'log10', Python: 'log10', TypeScript: 'log10' },
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
    { BASIC: 'ASN', C: 'asin', Pascal: 'arcsin', Python: 'asin', TypeScript: 'asin' },
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
    { BASIC: 'ACS', C: 'acos', Pascal: 'arccos', Python: 'acos', TypeScript: 'acos' },
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
    { BASIC: 'ATN', C: 'atan', Pascal: 'arctan', Python: 'atan', TypeScript: 'atan' },
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
    { BASIC: 'WRITE', C: 'write', Pascal: 'write', Python: 'write', TypeScript: 'write' },
    [PCode.writ],
    [new Parameter('string', 'string', false, 1)],
    null, 7, 0,
    'Writes the input <code>string</code> to the console and textual output area of the System.'
  ),
  new Command(
    { BASIC: 'WRITELN', C: 'writeline', Pascal: 'writeln', Python: 'writeline', TypeScript: 'writeline' },
    [PCode.writ, PCode.newl],
    [new Parameter('string', 'string', false, 1)],
    null, 7, 0,
    'Writes the input <code>string</code> to the console and textual output area of the System, followed by a line break.'
  ),
  new Command(
    { BASIC: 'PRINT', C: 'print', Pascal: 'print', Python: 'print', TypeScript: 'print' },
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
    { BASIC: 'LCASE$', C: 'strlwr', Pascal: 'lowercase', Python: 'lower', TypeScript: 'lowercase' },
    [PCode.ldin, 1, PCode.case],
    [new Parameter('string', 'string', false, 1)],
    'string', 7, 1,
    'Returns the input <code>string</code> as all lowercase.'
  ),
  new Command(
    { BASIC: 'UCASE$', C: 'strupr', Pascal: 'uppercase', Python: 'upper', TypeScript: 'uppercase' },
    [PCode.ldin, 2, PCode.case],
    [new Parameter('string', 'string', false, 1)],
    'string', 7, 1,
    'Returns the input <code>string</code> as all uppercase.'
  ),
  new Command(
    { BASIC: null, C: 'strinit', Pascal: 'initcap', Python: 'capitalize', TypeScript: 'initcap' },
    [PCode.ldin, 3, PCode.case],
    [new Parameter('string', 'string', false, 1)],
    'string', 7, 1,
    'Returns the input <code>string</code> with the first letter capitalized.'
  ),
  new Command(
    { BASIC: null, C: 'strtitle', Pascal: 'titlecase', Python: 'titlecase', TypeScript: 'titlecase' },
    [PCode.ldin, 4, PCode.case],
    [new Parameter('string', 'string', false, 1)],
    'string', 7, 1,
    'Returns the input <code>string</code> in title case (i.e. the first letter of each word capitalized).'
  ),
  new Command(
    { BASIC: null, C: 'strswap', Pascal: 'swapcase', Python: 'swapcase', TypeScript: 'swapcase' },
    [PCode.ldin, 5, PCode.case],
    [new Parameter('string', 'string', false, 1)],
    'string', 7, 1,
    'Returns the input <code>string</code> with all the cases swapped.'
  ),
  new Command(
    { BASIC: 'LEN', C: 'strlen', Pascal: 'length', Python: 'len', TypeScript: 'length' },
    [PCode.slen],
    [new Parameter('string', 'string', false, 1)],
    'integer', 7, 1,
    'Returns the length of the input <code>string</code> (i.e. the number of characters).'
  ),
  new Command(
    { BASIC: 'DEL$', C: 'strdel', Pascal: 'delete', Python: null, TypeScript: null },
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
    { BASIC: 'LEFT$', C: null, Pascal: null, Python: null, TypeScript: null },
    [PCode.ldin, 1, PCode.swap, PCode.copy],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('length', 'integer', false, 1)
    ],
    'string', 7, 2,
    'Returns a copy of the characters in the input <code>string</code>, starting on the left and of the specified <code>length</code>.'
  ),
  new Command(
    { BASIC: 'MID$', C: 'strcpy', Pascal: 'copy', Python: 'copy', TypeScript: null },
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
    { BASIC: 'RIGHT$', C: null, Pascal: null, Python: null, TypeScript: null },
    [PCode.swap, PCode.dupl, PCode.slen, PCode.incr, PCode.rota, PCode.subt, PCode.mxin, PCode.copy],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('length', 'integer', false, 1)
    ],
    'string', 7, 2,
    'Returns a copy of the characters in the input <code>string</code>, starting on the right and of the specified <code>length</code>.'
  ),
  new Command(
    { BASIC: 'INS$', C: null, Pascal: null, Python: 'insert', TypeScript: null },
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
    { BASIC: null, C: null, Pascal: 'insert', Python: null, TypeScript: null },
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
    { BASIC: 'PAD$', C: 'pad', Pascal: 'pad', Python: 'pad', TypeScript: 'pad' },
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
    { BASIC: 'REPLACE$', C: null, Pascal: 'replace', Python: 'replace', TypeScript: null },
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
    { BASIC: 'INSTR', C: null, Pascal: null, Python: 'find', TypeScript: null },
    [PCode.swap, PCode.poss],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('substr', 'string', false, 1)
    ],
    'integer', 7, 2,
    'Searches for the input <code>substring</code> within the given <code>string</code>; returns the index of the first character if found, 0 otherwise.'
  ),
  new Command(
    { BASIC: null, C: null, Pascal: 'pos', Python: null, TypeScript: null },
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
    { BASIC: 'STR$', C: null, Pascal: 'str', Python: 'str', TypeScript: null },
    [PCode.itos],
    [new Parameter('n', 'integer', false, 1)],
    'string', 8, 0,
    'Returns the integer <code>n</code> as a string, e.g. <code>str(12)=\'12\'</code>.'
  ),
  new Command(
    { BASIC: 'VAL', C: null, Pascal: 'val', Python: 'int', TypeScript: null },
    [PCode.ldin, 0, PCode.sval],
    [new Parameter('string', 'string', false, 1)],
    'integer', 8, 0,
    'Returns the input <code>string</code> as an integer, e.g. <code>val(\'12\')=12</code>. Returns <code>0</code> if the string cannot be converted (i.e. if it is not an integer string).'
  ),
  new Command(
    { BASIC: 'VALDEF', C: null, Pascal: 'valdef', Python: 'intdef', TypeScript: null },
    [PCode.sval],
    [
      new Parameter('string', 'string', false, 1),
      new Parameter('default', 'integer', false, 1)
    ],
    'integer', 8, 0,
    'Returns the input <code>string</code> as an integer, e.g. <code>val(\'12\')=12</code>. Returns the specified <code>default</code> value if the string cannot be converted (i.e. if it is not an integer string).'
  ),
  new Command(
    { BASIC: 'QSTR$', C: null, Pascal: 'qstr', Python: 'qstr', TypeScript: null },
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
    { BASIC: 'QVAL', C: null, Pascal: 'qval', Python: 'qval', TypeScript: null },
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
    { BASIC: 'CHR$', C: null, Pascal: 'chr', Python: 'chr', TypeScript: null },
    [PCode.ctos],
    [new Parameter('n', 'integer', false, 1)],
    'string', 8, 2,
    'Returns the character with ASCII character code <code>n</code>.'
  ),
  new Command(
    { BASIC: 'ASC', C: null, Pascal: 'ord', Python: 'ord', TypeScript: null },
    [PCode.sasc],
    [new Parameter('char', 'string', false, 1)],
    'integer', 8, 2,
    'Returns the ASCII code of the input character, or of the first character of the input string.'
  ),
  new Command(
    { BASIC: 'BOOLINT', C: null, Pascal: 'boolint', Python: null, TypeScript: null },
    [PCode.null],
    [new Parameter('boolean', 'boolean', false, 1)],
    'integer', 8, 2,
    'Returns the input <code>boolean</code> as an integer (-1 for <code>true</code>, 0 for <code>false</code>).'
  ),
  new Command(
    { BASIC: null, C: null, Pascal: null, Python: 'boolint', TypeScript: null },
    [PCode.abs],
    [new Parameter('boolean', 'boolean', false, 1)],
    'integer', 8, 2,
    'Returns the input <code>boolean</code> as an integer (1 for <code>true</code>, 0 for <code>false</code>).'
  ),
  new Command(
    { BASIC: 'HEX$', C: 'hex', Pascal: 'hexstr', Python: 'hex', TypeScript: 'hex' },
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
    { BASIC: 'PAUSE', C: 'pause', Pascal: 'pause', Python: 'pause', TypeScript: 'pause' },
    [PCode.wait],
    [new Parameter('m', 'integer', false, 1)],
    null, 9, 0,
    'Makes the Turtle Machine wait <code>m</code> milliseconds before performing the next operation. This is useful for controlling the speed of animations.'
  ),
  new Command(
    { BASIC: 'HALT', C: 'halt', Pascal: 'halt', Python: 'halt', TypeScript: 'halt' },
    [PCode.halt],
    [], null, 9, 0,
    'Halts the program.'
  ),
  new Command(
    { BASIC: 'GETLINE$', C: 'readline', Pascal: 'readln', Python: 'readline', TypeScript: 'readline' },
    [PCode.rdln],
    [], 'string', 9, 0,
    'Waits for the RETURN key to be pressed, then returns everything in the keybuffer up to (and not including) the new line character.'
  ),
  new Command(
    { BASIC: 'INPUT$', C: 'scan', Pascal: 'input', Python: 'input', TypeScript: 'input' },
    [PCode.writ, PCode.newl, PCode.rdln],
    [new Parameter('prompt', 'string', false, 1)],
    'string', 9, 0,
    'Gives an input prompt, then returns the input when the RETURN key is pressed (using the keybuffer).'
  ),
  new Command(
    { BASIC: 'CURSOR', C: 'cursor', Pascal: 'cursor', Python: 'cursor', TypeScript: 'cursor' },
    [PCode.curs],
    [new Parameter('cursorcode', 'integer', false, 1)],
    null, 9, 1,
    'Sets which cursor to display (1-15) when the mouse pointer is over the canvas. 0 hides the cursor; any value outside the range 0-15 resets the default cursor. For a list of available cursors, see the <b>Cursors</b> tab.'
  ),
  new Command(
    { BASIC: 'KEYECHO', C: 'keyecho', Pascal: 'keyecho', Python: 'keyecho', TypeScript: 'keyecho' },
    [PCode.kech],
    [new Parameter('on', 'boolean', false, 1)],
    null, 9, 1,
    'Turns the keyboard echo to the console on (<code>true</code>) or off (<code>false</code>).'
  ),
  new Command(
    { BASIC: 'DETECT', C: 'detect', Pascal: 'detect', Python: 'detect', TypeScript: 'detect' },
    [PCode.tdet],
    [
      new Parameter('keycode', 'integer', false, 1),
      new Parameter('m', 'integer', false, 1)
    ],
    'boolean', 9, 1,
    'Waits a maximum of <code>m</code> milliseconds for the key with the specified <code>keycode</code> to be pressed; returns <code>true</code> if pressed (and stops waiting), <code>false</code> otherwise.'
  ),
  new Command(
    { BASIC: 'GET$', C: 'read', Pascal: 'read', Python: 'read', TypeScript: 'read' },
    [PCode.read],
    [new Parameter('n', 'integer', false, 1)],
    'string', 9, 1,
    'Returns the first <code>n</code> characters from the keybuffer as a string.'
  ),
  new Command(
    { BASIC: 'TIME', C: 'time', Pascal: 'time', Python: 'time', TypeScript: 'time' },
    [PCode.time],
    [], 'integer', 9, 1,
    'Returns the time (in milliseconds) since the program began.'
  ),
  new Command(
    { BASIC: 'TIMESET', C: 'timeset', Pascal: 'timeset', Python: 'timeset', TypeScript: 'timeset' },
    [PCode.tset],
    [new Parameter('m', 'integer', false, 1)],
    null, 9, 1,
    'Artificially sets the time since the program began to <code>m</code> milliseconds.'
  ),
  new Command(
    { BASIC: 'RESET', C: 'reset', Pascal: 'reset', Python: 'reset', TypeScript: 'reset' },
    [PCode.iclr],
    [new Parameter('?input', 'integer', false, 1)],
    null, 9, 2,
    'Resets the specified <code>?input</code> (<code>?mousex</code>, <code>?mousey</code>, <code>?click</code>, etc.) to its initial value (i.e. -1).'
  ),
  new Command(
    { BASIC: 'KEYSTATUS', C: 'keystatus', Pascal: 'keystatus', Python: 'keystatus', TypeScript: 'keystatus' },
    [PCode.inpt],
    [new Parameter('keycode', 'integer', false, 1)],
    'integer', 9, 2,
    'Returns the <code>?kshift</code> value for the most recent press of the key with the specified <code>keycode</code>.'
  ),
  new Command(
    { BASIC: 'KEYBUFFER', C: 'keybuffer', Pascal: 'keybuffer', Python: 'keybuffer', TypeScript: 'keybuffer' },
    [PCode.bufr, PCode.ldin, 1, PCode.sptr, PCode.hfix],
    [new Parameter('n', 'integer', false, 1)],
    null, 9, 2,
    'Creates a new custom keybuffer of length <code>n</code>. A keybuffer of length 32 is available by default; use this command if you need a larger buffer.'
  ),
  // 10. file processing
  new Command(
    { BASIC: 'CHDIR', C: null, Pascal: 'chdir', Python: 'chdir', TypeScript: null },
    [PCode.chdr],
    [new Parameter('directory name', 'string', false, 1)],
    null,
    10,
    1,
    'Changes the current directory.'
  ),
  new Command(
    { BASIC: 'RMDIR', C: null, Pascal: 'rmdir', Python: 'rmdir', TypeScript: null },
    [PCode.ldin, 1, PCode.diry, PCode.ldin, 128, PCode.less],
    [new Parameter('subdirectory name', 'string', false, 1)],
    'boolean',
    10,
    1,
    'Removes a subdirectory.'
  ),
  new Command(
    { BASIC: 'MKDIR', C: null, Pascal: 'mkdir', Python: 'mkdir', TypeScript: null },
    [PCode.ldin, 2, PCode.diry, PCode.ldin, 127, PCode.more],
    [new Parameter('subdirectory name', 'string', false, 1)],
    'boolean',
    10,
    1,
    'Creates a subdirectory.'
  ),
  new Command(
    { BASIC: null, C: null, Pascal: 'openfile', Python: 'openfile', TypeScript: null },
    [PCode.open],
    [
      new Parameter('filename', 'string', false, 1),
      new Parameter('mode', 'integer', false, 1)
    ],
    'integer',
    10,
    1,
    'Opens a file (1: read, 2: append, 3: write).'
  ),
  new Command(
    { BASIC: 'OPENIN', C: null, Pascal: null, Python: null, TypeScript: null },
    [PCode.ldin, 1, PCode.open],
    [new Parameter('filename', 'string', false, 1)],
    'integer',
    10,
    1,
    'Open a file for reading.'
  ),
  new Command(
    { BASIC: 'OPENUP', C: null, Pascal: null, Python: null, TypeScript: null },
    [PCode.ldin, 2, PCode.open],
    [new Parameter('filename', 'string', false, 1)],
    'integer',
    10,
    1,
    'Opens a file for appending.'
  ),
  new Command(
    { BASIC: 'OPENOUT', C: null, Pascal: null, Python: null, TypeScript: null },
    [PCode.ldin, 4, PCode.open],
    [new Parameter('filename', 'string', false, 1)],
    'integer',
    10,
    1,
    'Opens a file for writing.'
  ),
  new Command(
    { BASIC: 'CLOSE#', C: null, Pascal: 'closefile', Python: 'closefile', TypeScript: null },
    [PCode.clos],
    [new Parameter('file handle', 'integer', false, 1)],
    null,
    10,
    1,
    'Closes a file.'
  ),
  new Command(
    { BASIC: 'DELETEFILE', C: null, Pascal: 'deletefile', Python: 'deletefile', TypeScript: null },
    [PCode.ldin, 1, PCode.file, PCode.ldin, 128, PCode.less],
    [new Parameter('filename', 'string', false, 1)],
    'boolean',
    10,
    1,
    'Deletes a file.'
  ),
  new Command(
    { BASIC: 'FREAD#', C: null, Pascal: 'fread', Python: 'fread', TypeScript: null },
    [PCode.frds],
    [
      new Parameter('file handle', 'integer', false, 1),
      new Parameter('n', 'integer', false, 1)
    ],
    'string',
    10,
    1,
    'Reads n characters (maximum) from a file.'
  ),
  new Command(
    { BASIC: 'FREADLN#', C: null, Pascal: 'freadln', Python: 'freadln', TypeScript: null },
    [PCode.frln],
    [new Parameter('file handle', 'integer', false, 1)],
    'string',
    10,
    1,
    'Reads a line from a file.'
  ),
  new Command(
    { BASIC: 'PRINT#', C: null, Pascal: 'fwrite', Python: 'fwrite', TypeScript: null },
    [PCode.fwrs],
    [
      new Parameter('file handle', 'integer', false, 1),
      new Parameter('string', 'string', false, 1)
    ],
    null,
    10,
    1,
    'Writes a string to a file.'
  ),
  new Command(
    { BASIC: 'PRINTLN#', C: null, Pascal: 'fwriteln', Python: 'fwriteln', TypeScript: null },
    [PCode.fwln],
    [
      new Parameter('file handle', 'integer', false, 1),
      new Parameter('string', 'string', false, 1)
    ],
    null,
    10,
    1,
    'Writes a line to a file.'
  ),
  new Command(
    { BASIC: 'EOF#', C: null, Pascal: 'eof', Python: 'eof', TypeScript: null },
    [PCode.eof],
    [new Parameter('file handle', 'integer', false, 1)],
    'boolean',
    10,
    1,
    'Tests for the end of file.'
  ),
  new Command(
    { BASIC: 'CHECKDIR', C: null, Pascal: 'checkdir', Python: 'checkdir', TypeScript: null },
    [PCode.ldin, 0, PCode.diry, PCode.ldin, 127, PCode.more],
    [
      new Parameter('directory name', 'string', false, 1),
      new Parameter('code', 'integer', false, 1)
    ],
    'integer',
    10,
    2,
    'Creates/deletes/checks a directory.'
  ),
  new Command(
    { BASIC: 'CHECKFILE', C: null, Pascal: 'checkfile', Python: 'checkfile', TypeScript: null },
    [PCode.ldin, 0, PCode.file, PCode.ldin, 127, PCode.more],
    [
      new Parameter('filename', 'string', false, 1),
      new Parameter('code', 'integer', false, 1)
    ],
    'integer',
    10,
    2,
    'Creates/deletes/checks a file.'
  ),
  new Command(
    { BASIC: 'COPYFILE', C: null, Pascal: 'copyfile', Python: 'copyfile', TypeScript: null },
    [PCode.ldin, 3, PCode.fmov],
    [
      new Parameter('old name', 'string', false, 1),
      new Parameter('new name', 'string', false, 1)
    ],
    'boolean',
    10,
    2,
    'Copies a file.'
  ),
  new Command(
    { BASIC: 'DIREXISTS', C: null, Pascal: 'direxists', Python: 'direxists', TypeScript: null },
    [PCode.ldin, 0, PCode.diry, PCode.ldin, 127, PCode.more],
    [new Parameter('subdirectory name', 'string', false, 1)],
    'boolean',
    10,
    2,
    'Checks whether a subdirectory exists.'
  ),
  new Command(
    { BASIC: 'FILEEXISTS', C: null, Pascal: 'fileexists', Python: 'fileexists', TypeScript: null },
    [PCode.ldin, 0, PCode.file, PCode.ldin, 127, PCode.more],
    [new Parameter('filename', 'string', false, 1)],
    'boolean',
    10,
    2,
    'Checks whether a file exists.'
  ),
  new Command(
    { BASIC: 'FINDDIR', C: null, Pascal: 'finddir', Python: 'finddir', TypeScript: null },
    [PCode.dupl, PCode.lptr, PCode.rota, PCode.fdir, PCode.swap, PCode.rota, PCode.sptr],
    [
      new Parameter('directory name pattern', 'string', false, 1),
      new Parameter('file handle', 'integer', false, 1)
    ],
    'string',
    10,
    2,
    'Finds the first directory matching the pattern.'
  ),
  new Command(
    { BASIC: 'FINDFIRST', C: null, Pascal: 'findfirst', Python: 'findfirst', TypeScript: null },
    [PCode.dupl, PCode.lptr, PCode.rota, PCode.ffnd, PCode.swap, PCode.rota, PCode.sptr],
    [
      new Parameter('filename pattern', 'string', false, 1),
      new Parameter('file handle', 'integer', false, 1)
    ],
    'string',
    10,
    2,
    'Finds the first file matching the pattern.'
  ),
  new Command(
    { BASIC: 'FINDNEXT', C: null, Pascal: 'findnext', Python: 'findnext', TypeScript: null },
    [PCode.fnxt],
    [new Parameter('file handle', 'integer', false, 1)],
    'string',
    10,
    2,
    'Finds the next file/directory matching a pattern.'
  ),
  new Command(
    { BASIC: 'RENAMEFILE', C: null, Pascal: 'renamefile', Python: 'renamefile', TypeScript: null },
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
    { BASIC: 'MOVEFILE', C: null, Pascal: 'movefile', Python: 'movefile', TypeScript: null },
    [PCode.ldin, 2, PCode.fmov],
    [
      new Parameter('old filename', 'string', false, 1),
      new Parameter('new filename', 'string', false, 1)
    ],
    'boolean',
    10,
    2,
    'Moves a file.'
  ),
  new Command(
    { BASIC: 'RESTARTFILE', C: null, Pascal: 'restartfile', Python: 'restartfile', TypeScript: null },
    [PCode.fbeg],
    [new Parameter('file handle', 'integer', false, 1)],
    null,
    10,
    2,
    'Restarts reading a file.'
  ),
  new Command(
    { BASIC: 'EOLN#', C: null, Pascal: 'eoln', Python: 'eoln', TypeScript: null },
    [PCode.eoln],
    [new Parameter('file handle', 'integer', false, 1)],
    'boolean',
    10,
    2,
    'Tests for end of line in a file.'
  ),
  // 11. Turtle Machine monitoring
  new Command(
    { BASIC: 'DUMP', C: 'dump', Pascal: 'dump', Python: 'dump', TypeScript: 'dump' },
    [PCode.dump],
    [], null,
    11,
    2,
    '&ldquo;Dumps&rdquo; the current memory state into the display in the memory tab.'
  ),
  new Command(
    { BASIC: 'HEAPRESET', C: 'heapreset', Pascal: 'heapreset', Python: 'heapreset', TypeScript: 'heapreset' },
    [PCode.hrst],
    [], null,
    11,
    2,
    'Resets the memory heap to the initial global value.'
  ),
  new Command(
    { BASIC: 'PEEK', C: 'peek', Pascal: 'peek', Python: 'peek', TypeScript: 'peek' },
    [PCode.peek],
    [new Parameter('address', 'integer', false, 1)],
    null,
    11,
    2,
    'Peek at the value of the memory at the given <code>address</code>.'
  ),
  new Command(
    { BASIC: 'POKE', C: 'poke', Pascal: 'poke', Python: 'poke', TypeScript: 'poke' },
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
    { BASIC: 'TRACE', C: 'trace', Pascal: 'trace', Python: 'trace', TypeScript: 'trace' },
    [PCode.trac],
    [new Parameter('on', 'boolean', false, 1)],
    null,
    11,
    2,
    'Turns the PCode trace facility on (<code>true</code>) or off (<code>false</code>).'
  ),
  new Command(
    { BASIC: 'WATCH', C: 'watch', Pascal: 'watch', Python: 'watch', TypeScript: 'watch' },
    [PCode.memw],
    [new Parameter('address', 'integer', false, 1)],
    null,
    11,
    2,
    'Sets an <code>address</code> in memory for the trace facility to watch.'
  )
]
