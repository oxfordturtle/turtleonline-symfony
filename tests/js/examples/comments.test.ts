/**
 * tests whether example program comments are consistent across all languages
 * 
 * uses Pascal comments as the model, and checks the others match
 */
import fs from 'fs'
import { examples, Example } from '../../../app/js/constants/examples'
import { Language, extensions } from '../../../app/js/constants/languages'
import lexify from '../../../app/js/lexer/lexify'

// run separate tests for each example
for (const example of examples) {
  test(`Examples: BASIC: Comments: ${example.groupId}: ${example.id}`, function () {
    const commentsPascal = getComments(example, 'Pascal')
    const comments = getComments(example, 'BASIC')
    expect(comments).toEqual(commentsPascal)
  })

  test(`Examples: Python: Comments: ${example.groupId}: ${example.id}`, function () {
    const commentsPascal = getComments(example, 'Pascal')
    const comments = getComments(example, 'Python')
    expect(comments).toEqual(commentsPascal)
  })
}

/** gets comments for an example */
function getComments (example: Example, language: Language): string[] {
  const codePath = `public/examples/${language}/${example.groupId}/${example.id}.${extensions[language]}`
  const code = fs.readFileSync(codePath, 'utf-8')
  const lexemes = lexify(code, language)
  const comments = lexemes.filter(x => x.type === 'comment').map(x => x.value as string)

  if (language === 'BASIC') {
    // change comments order to match Pascal
    if (example.id === 'BouncingFace') {
      const first6 = comments.splice(0, 6)
      comments.push(...first6)
      const third = comments.splice(2, 1)
      comments.push(third[0])
    }
    if (example.id === 'BouncingFace') {
      const drawsEye = comments.splice(8, 1)
      const drawHead = comments.pop() as string
      const first2 = comments.splice(0, 2)
      comments.unshift(drawHead)
      comments.unshift(drawsEye[0])
      comments.unshift(...first2)
    }
    if (example.id === 'BouncingTriangle') {
      const last = comments.pop() as string
      comments.unshift(last)
    }
    if (example.id === 'BouncingShapes') {
      const last = comments.pop() as string
      comments.unshift(last)
    }
    if (example.id === 'GravitySteps') {
      const last2 = comments.splice(comments.length - 3, 2)
      comments.unshift(...last2)
    }
    if (example.id === 'SolarSystem') {
      const last9 = comments.splice(comments.length - 10, 9)
      comments.unshift(...last9)
    }
    if (example.id === 'ColourSpiral') {
      const last = comments.pop() as string
      comments.unshift(last)
    }
    if (example.id === 'SimpleProc') {
      const last = comments.pop() as string
      comments.unshift(last)
    }
    if (example.id === 'ParameterProc') {
      const last2 = comments.splice(comments.length - 2, 2)
      comments.unshift(...last2)
    }
    if (example.id === 'ResizableFace') {
      const drawFace = comments.shift() as string
      const drawsFace = comments.shift() as string
      const drawsEye = comments.pop() as string
      comments.push(drawFace)
      comments.unshift(drawsEye)
      comments.unshift(drawsFace)
    }
    if (example.id === 'Polygons') {
      const last7 = comments.splice(comments.length - 7, 7)
      comments.unshift(...last7)
    }
    if (example.id === 'Stars') {
      const first4 = comments.splice(0, 4)
      comments.push(...first4)
    }
    if (example.id === 'PolygonRings') {
      const first2 = comments.splice(0, 2)
      comments.push(...first2)
    }
    if (example.id === 'Triangle2') {
      const first2 = comments.splice(0, 2)
      comments.push(...first2)
    }
    if (example.id === 'Triangle3') {
      const last2 = comments.splice(comments.length - 2, 2)
      comments.unshift(...last2)
    }
    if (example.id === 'Triangles') {
      const first2 = comments.splice(0, 2)
      comments.push(...first2)
    }
    if (example.id === 'Factorials') {
      const last2 = comments.splice(comments.length - 2, 2)
      comments.unshift(...last2)
    }
    if (example.id === 'Clock') {
      const last4 = comments.splice(comments.length - 4, 4)
      comments.unshift(...last4)
    }
    if (example.id === 'DigitalClock') {
      const last3 = comments.splice(comments.length - 3, 3)
      comments.unshift(...last3)
    }
    if (example.id === 'Flashlights') {
      const last6 = comments.splice(comments.length - 6, 6)
      comments.unshift(...last6)
    }
    if (example.id === 'RefParams') {
      const last5 = comments.splice(comments.length - 5, 5)
      const first3 = comments.splice(0, 3)
      comments.unshift(...last5)
      comments.unshift(...first3)
    }
    if (example.id === 'Balls3D') {
      const last5 = comments.splice(comments.length - 5, 5)
      comments.unshift(...last5)
    }
    if (example.id === 'UserStringFunctions') {
      const first2 = comments.splice(0, 2)
      comments.push(...first2)
    }
    if (example.id === 'MathFunctions') {
      const first2 = comments.splice(0, 2)
      const last3 = comments.splice(comments.length - 3, 3)
      comments.unshift(...last3)
      comments.unshift(...first2)
    }
    if (example.id === 'TrigGraphs') {
      const early4 = comments.splice(1, 4)
      comments.push(...early4)
    }
    // modify text to mask intended differences with Pascal comments
    for (let i = 0; i < comments.length; i += 1) {
      comments[i] = comments[i]
        .replace(/\bRND\((.*?)\)/, 'random($1)')
        .replace(/\bCHR\$\((.*?)\)/, 'chr($1)')
        .replace(/\bMID\$/, 'COPY')
        .replace(/\bINS\$/, 'INSERT')
        .replace(/\bLEN\b/, 'LENGTH')
        .replace(/\bLCASE\b/, 'LOWERCASE')
        .replace(/\bUCASE\b/, 'UPPERCASE')
        .replace(/\bINSTR\b/, 'POS')
        .replace(/%/, '')
        .replace(/\$/, '')
        .replace(/PROC/, '')
        .replace(/FN/, '')
        .replace(/TRUE/, 'true')
        .replace(/FALSE/, 'false')
        .replace(/keyword "RETURN"/, 'keyword "var"')
        .replace(/between 1 and 8/, 'between 0 and 7')
        .replace(/random\(2\) returns 2/, 'random(2) returns 0')
    }
  }

  if (language === 'Python') {
    // modify text to mask intended differences with Pascal comments
    for (let i = 0; i < comments.length; i += 1) {
      comments[i] = comments[i]
        .replace(/from 0 to 199/, 'from 1 to 200')
        .replace(/from 0 to 299/, 'from 1 to 300')
    }
  }

  return comments
}
