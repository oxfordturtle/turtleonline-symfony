/**
 * tests whether code from examples in the offline system matches code from
 * examples in the online system
 */
import fs from 'fs'
import { examples, Example } from '../../../app/js/constants/examples'
import { Language, extensions } from '../../../app/js/constants/languages'

// run separate tests for each example
for (const example of examples) {
  test(`Examples: BASIC: Code: ${example.groupId}: ${example.id}`, function () {
    const [onlineCode, offlineCode] = getCode(example, 'BASIC')
    expect(onlineCode).toEqual(offlineCode)
  })

  test(`Examples: Pascal: Code: ${example.groupId}: ${example.id}`, function () {
    const [onlineCode, offlineCode] = getCode(example, 'Pascal')
    expect(onlineCode).toEqual(offlineCode)
  })
}

/** gets code from both systems */
function getCode (example: Example, language: Language): [string, string] {
  const onlineCodePath = `public/examples/${language}/${example.groupId}/${example.id}.${extensions[language]}`
  const offlineCodePath = `tests/js/examples/${language}/${example.groupId}/${example.id}.tmx`
  const onlineCode = fs.readFileSync(onlineCodePath, 'utf-8').trim()
  const offlineCode = JSON.parse(fs.readFileSync(offlineCodePath, 'utf-8')).code.trim()
  return [onlineCode, offlineCode]
}
