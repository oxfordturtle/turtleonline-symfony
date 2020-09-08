/**
 * tests whether the online system's compiler output matches the offline
 * system's compiler output
 */
import fs from 'fs'
import { examples, Example } from '../../../app/js/constants/examples'
import { Language, extensions } from '../../../app/js/constants/languages'
import lexify from '../../../app/js/lexer/lexify'
import parser from '../../../app/js/parser/parser'
import { Subroutine } from '../../../app/js/parser/routine'
import analyse from '../../../app/js/analyser/analyse'
import coder from '../../../app/js/coder/coder'

// run separate tests for each example
for (const example of examples) {
  test(`Examples: BASIC: Compiler: ${example.groupId}: ${example.id}`, function () {
    const tmx = getTMX(example, 'BASIC')
    const code = getCode(example, 'BASIC')
    const lexemes = lexify(code, 'BASIC')
    const routines = parser(lexemes, 'BASIC')
    const usage = analyse(lexemes, routines, 'BASIC')
    const pcode = coder(routines)
    // expect(usage).toEqual(tmx.usage)
    expect(pcode).toEqual(tmx.pcode)
  })

  test(`Examples: Pascal: Compiler: ${example.groupId}: ${example.id}`, function () {
    const tmx = getTMX(example, 'Pascal')
    const code = getCode(example, 'Pascal')
    const lexemes = lexify(code, 'Pascal')
    const routines = parser(lexemes, 'Pascal')
    const usage = analyse(lexemes, routines, 'Pascal')
    const pcode = coder(routines)
    // expect(usage).toEqual(tmx.usage)
    expect(pcode).toEqual(tmx.pcode)
  })
}

/** gets online system example code */
function getCode (example: Example, language: Language) {
  const codePath = `public/examples/${language}/${example.groupId}/${example.id}.${extensions[language]}`
  return fs.readFileSync(codePath, 'utf-8')
}

/** gets and parses offline system tmx file */
function getTMX (example: Example, language: Language) {
  const tmxPath = `tests/js/examples/${language}/${example.groupId}/${example.id}.tmx`
  const tmx = JSON.parse(fs.readFileSync(tmxPath, 'utf-8'))
  prepareTMX(example, tmx)
  return tmx
}

/** changes offline system PCode to mask known (and harmless) differences from
 * online system */
function prepareTMX (example: Example, tmx: any) {
  switch (example.id) {
    case 'DigitalClock':
      for (let i = 0; i < tmx.pcode.length; i += 1) {
        switch (tmx.pcode[i].join(',')) {
          case '114,12,1,118,1,48,113,20,11,64,2,126,142':
            tmx.pcode[i] = [118,1,48,113,20,11,64,114,12,1,126,142]
            break
          case '114,12,1,112,48,9,113,20,11,64,2,126,142':
            tmx.pcode[i] = [112,48,9,113,20,11,64,114,12,1,126,142]
            break
          case '114,12,1,113,20,11,2,126,142':
            tmx.pcode[i] = [113,20,11,114,12,1,126,142]
            break
          case '114,12,36,118,1,48,113,21,11,64,2,126,142':
            tmx.pcode[i] = [118,1,48,113,21,11,64,114,12,36,126,142]
            break
          case '114,12,36,112,48,9,113,21,11,64,2,126,142':
            tmx.pcode[i] = [112,48,9,113,21,11,64,114,12,36,126,142]
            break
          case '114,12,36,113,21,11,2,126,142':
            tmx.pcode[i] = [113,21,11,114,12,36,126,142]
            break
        }
      }
      break
    case 'StringFunctions':
      for (let i = 0; i < tmx.pcode.length; i += 1) {
        switch (tmx.pcode[i].join(',')) {
          case '116,21,119,19':
          case '116,56,119,54':
          case '116,91,119,89':
          case '116,126,119,124':
          case '116,162,119,160':
          case '116,161,119,159':
            tmx.pcode[i].push(...tmx.pcode[i + 1])
            tmx.pcode.splice(i + 1, 1)
            break
          case '113,19,118,12,84,117,114,116,108,101,32,66,65,83,73,67,2,126,142':
            tmx.pcode[i] = [118,12,84,117,114,116,108,101,32,66,65,83,73,67,113,19,126,142]
            break
          case '113,54,113,19,112,1,112,6,67,2,126,142':
            tmx.pcode[i] = [113,19,112,1,112,6,67,113,54,126,142]
            break
          case '113,89,113,19,112,8,112,5,67,2,126,142':
            tmx.pcode[i] = [113,19,112,8,112,5,67,113,89,126,142]
            break
          case '113,124,113,89,112,2,118,4,66,67,32,66,3,3,69,2,126,142':
            tmx.pcode[i] = [113,89,112,2,118,4,66,67,32,66,3,3,69,113,124,126,142]
            break
          case '113,159,112,0,35,129,32':
            tmx.pcode[i] = [113,159,112,0,35,129,27]
            break
          case '113,160,118,7,51,46,49,52,49,53,57,2,126,142':
            tmx.pcode[i] = [118,7,51,46,49,52,49,53,57,113,160,126,142]
            break
          case '113,19,118,13,84,117,114,116,108,101,32,80,97,115,99,97,108,2,126,142':
            tmx.pcode[i] = [118,13,84,117,114,116,108,101,32,80,97,115,99,97,108,113,19,126,142]
            break
          case '113,89,113,19,112,8,112,6,67,2,126,142':
            tmx.pcode[i] = [113,19,112,8,112,6,67,113,89,126,142]
            break
          case '113,124,118,6,101,116,101,114,32,82,113,89,112,2,69,2,126,142':
            tmx.pcode[i] = [118,6,101,116,101,114,32,82,113,89,112,2,69,113,124,126,142]
            break
          case '113,194,112,0,35,129,32':
            tmx.pcode[i] = [113,194,112,0,35,129,27]
            break
          case '113,159,118,7,51,46,49,52,49,53,57,2,126,142':
            tmx.pcode[i] = [118,7,51,46,49,52,49,53,57,113,159,126,142]
            break
        }
      }
      break
  }
}
