import lexify from '../../../app/js/lexer/lexify'
import parser from '../../../app/js/parser/parser'
import { Program } from '../../../app/js/parser/routine'

test('Parser: Pascal: test 1', function (): void {
  const code = `PROGRAM test; Begin End.`
  const lexemes = lexify(code, 'Pascal')
  const routines = parser(lexemes, 'Pascal')
  expect(routines.length).toBe(1)
  expect(routines[0]).toBeInstanceOf(Program)
  expect(routines[0].name).toBe('test')
  expect(routines[0].variables.length).toBe(0)
  expect(routines[0].memoryNeeded).toBe(0)
  expect(routines[0].lexemes.length).toBe(0)
})
