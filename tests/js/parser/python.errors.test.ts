import lexify from '../../../app/js/lexer/lexify'
import parser from '../../../app/js/parser/parser'

test('Parser: Python: error test 1', function (): void {
  const code = 'turtx: int'
  const lexemes = lexify(code, 'Python')
  expect(() => {
    parser(lexemes, 'Python')
  }).toThrow('"turtx" is the name of a predefined Turtle attribute, and cannot be given a type specification. ("turtx", line 1.1)')
})
