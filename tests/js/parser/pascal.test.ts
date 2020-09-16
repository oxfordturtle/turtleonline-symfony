import lexify from '../../../app/js/lexer/lexify'
import parser from '../../../app/js/parser/parser'

test('Parser: Pascal: test 1', function (): void {
  const code = `PROGRAM test; Begin End.`
  const lexemes = lexify(code, 'Pascal')
  const program = parser(lexemes, 'Pascal')
  expect(program.name).toBe('test')
  expect(program.variables.length).toBe(0)
  expect(program.memoryNeeded).toBe(0)
  expect(program.lexemes.length).toBe(0)
})
