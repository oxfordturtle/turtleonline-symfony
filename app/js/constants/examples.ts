/*
 * Details of example programs.
 *
 * Example program code is stored in the /public/examples directory, to be
 * fetched as needed.
 */
import type { Language } from './languages'

/** Example class */
export class Example {
  readonly groupId: string
  readonly id: string
  readonly names: Record<Language, string>

  /** constructor */
  constructor (groupId: string, id: string, names: Record<Language, string>|string) {
    this.groupId = groupId
    this.id = id
    this.names = (typeof names === 'string')
      ? { BASIC: names, C: names, Java: names, Pascal: names, Python: names, TypeScript: names }
      : names
  }
}

/** Example group class */
export class Group {
  readonly index: number
  readonly id: string
  readonly title: string
  readonly examples: Example[]

  /** constructor */
  constructor (index: number, id: string, title: string) {
    this.index = index
    this.id = id
    this.title = title
    this.examples = examples.filter(x => x.groupId === id)
  }
}

/** array of examples */
export const examples: Example[] = [
  // examples 0 - CSAC (not to be shown in the menu)
  new Example('CSAC', 'LifeStart', 'Initialising Conway’s Game of Life'),
  new Example('CSAC', 'Mandelbrot', 'Mandelbrot set'),
  new Example('CSAC', 'MandelbrotMini', 'Mandelbrot mini'),
  new Example('CSAC', 'MandelbrotSpectrum', 'Mandelbrot spectrum'),
  new Example('CSAC', 'MandelbrotMiniSpectrum', 'Mandelbrot mini spectrum'),
  new Example('CSAC', 'SierpinskiColour', 'Sierpinski colour'),
  new Example('CSAC', 'SierpinskiIFS', 'Sierpinski IFS'),
  new Example('CSAC', 'BarnsleyColour', 'Barnsley colour'),
  new Example('CSAC', 'BarnsleyIFS', 'Barnsley IFS'),
  new Example('CSAC', 'DragonColour', 'Dragon colour'),
  new Example('CSAC', 'DragonIFS', 'Dragon IFS'),
  new Example('CSAC', 'TreeIFS', 'Tree IFS'),
  new Example('CASC', 'WaveSuperposer', 'Hugh Wallis’s wave superposer'),
  // examples 1 - Drawing
  new Example('Drawing', 'DrawPause', 'Simple drawing with pauses'),
  new Example('Drawing', 'SmileyFace', 'Smiley face (using PENUP and ELLBLOT)'),
  new Example('Drawing', 'ThePlough', 'The plough (using SETXY and POLYLINE)'),
  new Example('Drawing', 'OlympicRings', 'Olympic rings (using a variable)'),
  new Example('Drawing', 'ForLoop', 'FOR (counting) loop'),
  new Example('Drawing', 'TriangleSpin', 'Spinning triangle pattern'),
  new Example('Drawing', 'Circles', 'Circling circles'),
  new Example('Drawing', 'NestedLoops', 'Nested FOR loops'),
  new Example('Drawing', 'RandomLines', 'Random lines pattern'),
  new Example('Drawing', 'RandomEllipses', 'Random ellipses pattern'),
  // examples 2 - Procedures
  new Example('Procedures', 'ColourSpiral', 'Spiral of colours (simple PCODE)'),
  new Example('Procedures', 'SimpleProc', 'Simple procedure (using REPEAT)'),
  new Example('Procedures', 'ParameterProc', 'Procedure with parameter'),
  new Example('Procedures', 'ResizableFace', 'Resizable face (nested procedures)'),
  new Example('Procedures', 'Polygons', 'Polygons (two parameters)'),
  new Example('Procedures', 'Stars', 'Stars (using ANGLES and FORGET)'),
  new Example('Procedures', 'PolygonRings', 'Polygon rings (three parameters)'),
  new Example('Procedures', 'Triangle1', 'Simple triangle'),
  new Example('Procedures', 'Triangle2', 'Triangle procedure'),
  new Example('Procedures', 'Triangle3', 'Triangle procedure with limit'),
  new Example('Procedures', 'Triangles', 'Recursive triangles'),
  new Example('Procedures', 'Factorials', 'Recursive factorials'),
  // examples 3 - Further
  new Example('Further', 'YouAreHere', 'Text and arrow (using PRINT)'),
  new Example('Further', 'CycleColours', 'Cycling colours (using MOD)'),
  new Example('Further', 'Clock', 'Analogue clock (using REPEAT)'),
  new Example('Further', 'DigitalClock', 'Digital clock (using IF and WHILE)'),
  new Example('Further', 'Flashlights', 'Flashlights (using Booleans)'),
  new Example('Further', 'RefParams', 'Reference parameters'),
  new Example('Further', 'Balls3D', '3D colour effects'),
  new Example('Further', 'StringFunctions', 'Standard string functions'),
  new Example('Further', 'UserStringFunctions', 'User-defined string functions'),
  new Example('Further', 'MathFunctions', 'Mathematical functions'),
  new Example('Further', 'TrigGraphs', 'Trigonometric graphs'),
  // examples 4 - Movement
  new Example('Movement', 'MovingBall', 'Moving ball (using variables)'),
  new Example('Movement', 'BouncingBall', 'Bouncing ball (using variables)'),
  new Example('Movement', 'TurtleMove', 'Moving ball (using Turtle)'),
  new Example('Movement', 'TurtleBounce', 'Bouncing ball (using Turtle)'),
  new Example('Movement', 'BouncingFace', 'Bouncing face'),
  new Example('Movement', 'MultiBounce', 'Multiple bouncing balls'),
  new Example('Movement', 'BouncingTriangle', 'Bouncing triangle'),
  new Example('Movement', 'BouncingShapes', 'Multiple bouncing shapes'),
  new Example('Movement', 'GravitySteps', 'Movement under gravity'),
  new Example('Movement', 'SolarSystem', 'Solar system'),
  // examples 5 - Interaction
  new Example('Interaction', 'AskInput', 'Asking for typed input'),
  new Example('Interaction', 'QuickClick', 'Mouse reaction game'),
  new Example('Interaction', 'TypingTest', 'Typing test (checking characters)'),
  new Example('Interaction', 'TypingTestKeys', 'Typing test (checking keys)'),
  new Example('Interaction', 'IterationGame', 'Iteration game (Collatz sequence)'),
  new Example('Interaction', 'SpongeThrow', 'Throwing sponges at a moving face'),
  new Example('Interaction', 'Arcade', 'Arcade shooting game'),
  new Example('Interaction', 'SnakeGame', 'Snake (classic game)'),
  new Example('Interaction', 'SimpleDraw', 'Drawing to the mouse'),
  new Example('Interaction', 'PaintApp', 'Painting application'),
  new Example('Interaction', 'MultipleTurtles', 'Multiple turtles and varying ANGLES'),
  // examples 6 - Files
  new Example('Files', 'WriteAndReadFile', 'Writing and reading a text file'),
  new Example('Files', 'RenameAndDeleteFile', 'Renaming and deleting a file'),
  new Example('Files', 'FileSearching', 'File searching'),
  new Example('Files', 'SaveCSV', 'Saving a CSV file'),
  new Example('Files', 'ReadCSV', 'Reading a CSV file'),
  new Example('Files', 'RandomSentences', 'Random sentences (using files)'),
  new Example('Files', 'FileCommands', 'File commands'),
  new Example('Files', 'DirectoryCommands', 'Directory commands'),
  // examples 7 - Cellular
  new Example('Cellular', 'Disease', 'Spread of disease'),
  new Example('Cellular', 'TippingPoint', 'Tipping point (city epidemic)'),
  new Example('Cellular', 'GameOfLife', 'Conway’s Game of Life'),
  new Example('Cellular', 'LifeArrays', 'Game of Life, using arrays'),
  new Example('Cellular', 'Automata', 'One-dimensional cellular automata'),
  new Example('Cellular', 'Diffusion', 'A model of diffusion'),
  new Example('Cellular', 'Dendrites', 'Dendritic crystal growth'),
  new Example('Cellular', 'Schelling', 'Schelling’s segregation model'),
  new Example('Cellular', 'IteratedPD', 'Iterated Prisoner’s Dilemma'),
  // examples 8 - Models
  new Example('Models', 'AimCannon', 'Firing a cannon (manual)'),
  new Example('Models', 'AutoCannon', 'Firing a cannon (automatic)'),
  new Example('Models', 'Launch', 'Launching a rocket into orbit'),
  new Example('Models', 'BrownianMotion', 'Brownian motion'),
  new Example('Models', 'Cheetahs', 'Cheetahs and gazelles'),
  new Example('Models', 'SexRatio', 'The sex ratio'),
  new Example('Models', 'Flocking', 'Flocking behaviour'),
  new Example('Models', 'Roads', 'Town road simulation'),
  new Example('Models', 'Interference', 'Wave interference tutor'),
  new Example('Models', 'TwoSlits', 'Interference from two slits'),
  // examples 9 - Fractals
  new Example('Fractals', 'RecursionFactory', 'Recursion factory'),
  new Example('Fractals', 'RecursiveTree', 'Recursive tree'),
  new Example('Fractals', 'KochSnowflake', 'Koch snowflake'),
  new Example('Fractals', 'SquareKoch', 'Square Koch fractal curves'),
  new Example('Fractals', 'Sierpinski', 'Sierpinski triangle (by deletion)'),
  new Example('Fractals', 'SierpinskiDots', 'Sierpinski triangle (by random dots)'),
  new Example('Fractals', 'IFSBackground', 'Iterated function systems (IFS) background'),
  new Example('Fractals', 'IFSColour', 'IFS mappings on coloured background'),
  new Example('Fractals', 'IFSDemonstrator', 'IFS demonstrator program'),
  new Example('Fractals', 'Logistic', 'Logistic equation'),
  new Example('Fractals', 'LogisticSpider', 'Logistic spider'),
  new Example('Fractals', 'MandelbrotDemo', 'Mandelbrot multi-colour'),
  new Example('Fractals', 'MandelbrotSpectrumDemo', 'Mandelbrot spectral colours'),
  new Example('Fractals', 'Quine', 'Quine (self-replicating) program'),
  // examples 10 - Logic&CS
  new Example('Logic&CS', 'Hanoi', 'Tower of Hanoi by recursion'),
  new Example('Logic&CS', 'IterateRoot', 'Square roots by iteration'),
  new Example('Logic&CS', 'Fibonaccis', 'Fibonaccis (using ARRAY and TIME)'),
  new Example('Logic&CS', 'Sorting', 'Comparison of sorting methods'),
  new Example('Logic&CS', 'SortingStrings', 'Comparison of sorting methods (strings)'),
  new Example('Logic&CS', 'NoughtsAndCrosses', 'Noughts and crosses'),
  new Example('Logic&CS', 'NimLearn', 'Nim learning program'),
  new Example('Logic&CS', 'MultiNim', 'Nim with multiple piles'),
  new Example('Logic&CS', 'KnightsTour', 'Knight’s Tour program')
  // these last two examples don't yet compile properly :(
  // new Example('Logic&CS', 'TuringMachines', 'Turing machine simulator'),
  // new Example('Logic&CS', 'Syllogisms', 'Syllogism testing program')
]

/** array of example groups */
export const groups: Group[] = [
  new Group(0, 'CSAC', 'other CSAC programs'),
  new Group(1, 'Drawing', 'drawing and counting loops'),
  new Group(2, 'Procedures', 'procedures and simple recursion'),
  new Group(3, 'Further', 'further commands and structures'),
  new Group(4, 'Movement', 'smooth movement and bouncing'),
  // new Group(5, 'Files', 'file and directory handling'),
  new Group(5, 'Interaction', 'user input, interaction and games'),
  new Group(6, 'Cellular', 'cellular models'),
  new Group(7, 'Models', 'other models'),
  new Group(8, 'Fractals', 'self-similarity and chaos'),
  new Group(9, 'Logic&CS', 'computer science and logic')
]
