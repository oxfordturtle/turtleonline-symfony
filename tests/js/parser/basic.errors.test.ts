import lexify from '../../../app/js/lexer/lexify'
import parser from '../../../app/js/parser/parser'

test('Parser: BASIC: error test 1', function (): void {
  const code = 'DEF END'
  const lexemes = lexify(code, 'BASIC')
  expect(() => {
    parser(lexemes, 'BASIC')
  }).toThrow('Subroutines must be defined after program "END". ("DEF", line 1, index 1)')
})
