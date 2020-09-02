import lexify from '../../../app/js/lexer/lexify'
import parser from '../../../app/js/parser/parser'
import { Program } from '../../../app/js/parser/routine'

test('Parser: Python: test 1', function (): void {
  const code = ''
  const lexemes = lexify(code, 'Python')
  const routines = parser(lexemes, 'Python')
  expect(routines.length).toBe(1)
  expect(routines[0]).toBeInstanceOf(Program)
  expect(routines[0].name).toBe('!')
  expect(routines[0].variables.length).toBe(0)
  expect(routines[0].memoryNeeded).toBe(0)
  expect(routines[0].lexemes.length).toBe(0)
})
