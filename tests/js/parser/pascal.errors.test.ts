import lexify from '../../../app/js/lexer/lexify'
import parser from '../../../app/js/parser/parser'

test('Parser: Pascal: error test 1', function (): void {
  const code = ''
  const lexemes = lexify(code, 'Pascal')
  expect(() => {
    parser(lexemes, 'Pascal')
  }).toThrow('Program must begin with keyword "PROGRAM".')
})
