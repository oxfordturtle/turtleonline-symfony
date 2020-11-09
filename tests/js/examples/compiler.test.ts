/**
 * Tests that all the example programs compile correctly.
 */
import fs from 'fs'
import { groups, Example } from '../../../app/js/constants/examples'
import { Language, languages, extensions } from '../../../app/js/constants/languages'
import parser from '../../../app/js/parser/parser'
import encoder from '../../../app/js/encoder/program'

// create pcode (temporary)
/*for (const language of languages) {
  for (const group of groups.slice(1, 4)) {
    for (const example of group.examples) {
      test(`Examples: ${language}: ${example.groupId}: ${example.id}`, function () {
        const code = getCode(example, language)
        const program = parser(code, language)
        const pcode = encoder(program)
        fs.writeFileSync(`tests/js/examples/${language}/${group.id}/${example.id}.json`, JSON.stringify(pcode))
      })
    }
  }
}*/

// run tests
for (const language of languages) {
  for (const group of groups.slice(1, 4)) {
    for (const example of group.examples) {
      test(`Examples: ${language}: ${group.index}. ${group.id}: ${example.id}`, function () {
        const code = getCode(example, language)
        const testPCode = getPCode(example, language)
        const program = parser(code, language)
        const pcode = encoder(program)
        expect(pcode).toEqual(testPCode)
      })
    }
  }
}

/** gets example code for compiling */
function getCode (example: Example, language: Language) {
  const codePath = `public/examples/${language}/${example.groupId}/${example.id}.${extensions[language]}`
  return fs.readFileSync(codePath, 'utf-8')
}

/** gets example pcode for testing against */
function getPCode (example: Example, language: Language) {
  const codePath = `tests/js/examples/${language}/${example.groupId}/${example.id}.json`
  return JSON.parse(fs.readFileSync(codePath, 'utf-8'))
}
