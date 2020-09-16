import lexify from '../../../app/js/lexer/lexify'
import parser from '../../../app/js/parser/parser'

test('Parser: BASIC: test 1', function (): void {
  const code = `END`
  const lexemes = lexify(code, 'BASIC')
  const program = parser(lexemes, 'BASIC')
  expect(program.name).toBe('!')
  expect(program.variables.length).toBe(0)
  expect(program.memoryNeeded).toBe(0)
  expect(program.lexemes.length).toBe(0)
})
