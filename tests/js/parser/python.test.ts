import lexify from '../../../app/js/lexer/lexify'
import parser from '../../../app/js/parser/parser'

test('Parser: Python: test 1', function (): void {
  const code = ''
  const lexemes = lexify(code, 'Python')
  const program = parser(lexemes, 'Python')
  expect(program.name).toBe('!')
  expect(program.variables.length).toBe(0)
  expect(program.memoryNeeded).toBe(0)
})
