import lexify from '../../../app/js/lexer/lexify'
import parser from '../../../app/js/parser/parser'
import { Program } from '../../../app/js/parser/routine'

test('Parser: BASIC: test 1', function (): void {
  const code = `END`
  const lexemes = lexify(code, 'BASIC')
  const routines = parser(lexemes, 'BASIC')
  expect(routines.length).toBe(1)
  expect(routines[0]).toBeInstanceOf(Program)
  expect(routines[0].name).toBe('!')
  expect(routines[0].variables.length).toBe(0)
  expect(routines[0].memoryNeeded).toBe(0)
  expect(routines[0].lexemes.length).toBe(0)
})
