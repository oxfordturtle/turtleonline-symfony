/*
 * System State
 *
 * This module exports a "send" function for moving the application state forward, and an "on" function
 * for registering callbacks to execute after the state has changed. This module is thus the central
 * hub of the application; other modules can "send" it incoming signals to trigger a state change, and
 * register things to do "on" the sending of outgoing messages.
 *
 * For clarity, "signals" are incoming, "messages" are outgoing. Conceptually, signals are requests
 * sent to this module, asking to change the state (which may result in an error being thrown rather
 * than a state change); messages are things sent by this module indicating a successful state change,
 * including also the new values of any relevant state variables.
 */
import exampleNames from '../definitions/exampleNames.js'
import extensions from '../definitions/extensions.js'
import { languages } from '../definitions/languages.ts'
import compile from '../compile/index.js'
import lexer from '../compile/lexer/index.js'
import { get, set } from './variables.js'
import * as machine from './machine.js'

// function for "sending" signals to this module, asking it to update the state
export function send (signal, data) {
  const a = document.createElement('a') // a element for downloading files
  let files, bits, blob, date, ext, filename, json // things needed in the switch below

  try {
    // try to change the state depending on the signal
    switch (signal) {
      case 'ready':
        reply('file-changed')
        reply('fullscreen-changed', get('fullscreen'))
        reply('show-canvas-changed', get('show-canvas'))
        reply('show-output-changed', get('show-output'))
        reply('show-memory-changed', get('show-memory'))
        reply('draw-count-max-changed', get('draw-count-max'))
        reply('code-count-max-changed', get('code-count-max'))
        reply('small-size-changed', get('small-size'))
        reply('stack-size-changed', get('stack-size'))
        reply('group-changed', get('group'))
        reply('simple-changed', get('simple'))
        reply('intermediate-changed', get('intermediate'))
        reply('advanced-changed', get('advanced'))
        break

      case 'set-current-file-index':
        set('current-file-index', data)
        set('language', get('file').language)
        set('compiled', false)
        reply('file-changed')
        reply('show-component', 'code')
        break

      case 'close-current-file':
        files = get('files')
        files.splice(get('current-file-index'), 1)
        set('files', files)
        if (files.length === 0) {
          send('new-program')
        } else {
          if (get('current-file-index') > files.length - 1) {
            send('set-current-file-index', get('current-file-index') - 1)
          } else {
            send('set-current-file-index', get('current-file-index'))
          }
          reply('file-changed')
        }
        break

      case 'new-program':
        set('new-current-file')
        set('name', '')
        set('code', '')
        set('compiled', false)
        set('usage', [])
        set('lexemes', [])
        set('pcode', [])
        reply('file-changed')
        reply('show-component', 'code')
        break

      case 'new-skeleton-program':
        set('new-current-file')
        set('name', 'Skeleton program')
        set('compiled', false)
        set('usage', [])
        set('lexemes', [])
        set('pcode', [])
        switch (get('language')) {
          case 'BASIC':
            set('code', 'REM progname\n\nvar1% = 100\nCOLOUR(GREEN)\nBLOT(var1%)\nEND')
            break

          case 'Pascal':
            set('code', 'PROGRAM progname;\nVAR var1: integer;\nBEGIN\n  var1 := 100;\n  colour(green);\n  blot(var1)\nEND.')
            break

          case 'Python':
            set('code', '# progname\n\nvar1: int = 100\ncolour(green)\nblot(var1)')
            break
        }
        reply('file-changed')
        reply('show-component', 'code')
        break

      case 'save-local':
        blob = new window.Blob([get('code')], { type: 'text/plain;charset=utf-8' })
        a.setAttribute('href', URL.createObjectURL(blob))
        a.setAttribute('download', `${get('name') || 'filename'}.${extensions[get('language')]}`)
        a.click()
        break

      case 'save-remote':
        throw error('Feature not yet available.')

      case 'open-remote':
        throw error('Feature not yet available.')

      case 'save-tgx-program':
        maybeCompile()
        date = new Date()
        json = JSON.stringify({
          format: 1,
          language: get('language'),
          version: 12,
          name: get('name'),
          author: 'unknown', // TODO: could get signed in username
          date: `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`,
          time: `${date.getSeconds()}:${date.getMinutes()}:${date.getSeconds()}`,
          code: get('code'),
          usage: get('usage'),
          pcode: get('pcode')
        }, null, 2)
        blob = new window.Blob([json], { type: 'text/plain;charset=utf-8' })
        a.setAttribute('href', URL.createObjectURL(blob))
        a.setAttribute('download', `${get('name') || 'filename'}.tgx`)
        a.click()
        break

      case 'set-language':
        if (!languages.includes(data)) {
          throw error(`Unknown language "${data}".`)
        }
        set('language', data)
        reply('language-changed', get('language'))
        break

      case 'set-example':
        if (!exampleNames[data]) {
          throw error(`Unknown example "${data}".`)
        }
        window.fetch(`/examples/${get('language')}/${data}.${extensions[get('language')]}`).then(response => {
          if (response.ok) {
            response.text().then(content => {
              set('new-current-file')
              set('name', exampleNames[data])
              set('compiled', false)
              set('code', content.trim())
              set('usage', [])
              set('lexemes', [])
              set('pcode', [])
              reply('file-changed')
              reply('show-component', 'code')
            })
          } else {
            // reply instead of throwing an error, because the error won't be caught in this promise
            reply('error', error(`Couldn't retrieve example "${data}".`))
          }
        })
        break

      case 'load-remote-file':
        filename = data.split('/').pop()
        window.fetch(data).then((response) => {
          if (response.ok) {
            response.text().then((content) => {
              send('set-file', { filename, content })
            })
          } else {
            // reply instead of throwing error, because it won't be caught in this promise
            reply('error', error(`Couldn't retrieve file at "${data}".`))
          }
        })
        break

      case 'set-file':
        bits = data.filename.split('.')
        ext = bits.pop()
        filename = bits.join('.')
        switch (ext) {
          case 'tbas': // fallthrough
          case 'tgb': // support old file extension
            set('new-current-file')
            set('language', 'BASIC')
            set('name', filename)
            set('compiled', false)
            set('code', data.content.trim())
            set('usage', [])
            set('lexemes', [])
            set('pcode', [])
            break

          case 'tpas': // fallthrough
          case 'tgp': // support old file extension
            set('new-current-file')
            set('language', 'Pascal')
            set('name', filename)
            set('compiled', false)
            set('code', data.content.trim())
            set('usage', [])
            set('lexemes', [])
            set('pcode', [])
            break

          case 'tpy': // fallthrough
          case 'tgy': // support old file extension
            set('new-current-file')
            set('language', 'Python')
            set('name', filename)
            set('compiled', false)
            set('code', data.content.trim())
            set('usage', [])
            set('lexemes', [])
            set('pcode', [])
            break

          case 'tgx':
            json = validateTGX(data.content)
            set('language', json.language)
            set('name', json.name)
            set('compiled', true)
            set('code', json.code.trim())
            set('usage', json.usage)
            set('lexemes', lexer(json.code.trim(), get('language')))
            set('pcode', json.pcode)
            break

          default:
            throw error('Invalid file type.')
        }
        reply('language-changed', get('language'))
        break

      case 'set-name':
        set('name', data)
        reply('name-changed', get('name'))
        break

      case 'set-code':
        set('code', data)
        set('compiled', false)
        reply('code-changed', { code: get('code'), language: get('language') })
        break

      case 'toggle-fullscreen':
        set('fullscreen', !get('fullscreen'))
        reply('fullscreen-changed', get('fullscreen'))
        break

      case 'toggle-assembler':
        set('assembler', !get('assembler'))
        reply('pcode-changed', { pcode: get('pcode'), assembler: get('assembler'), decimal: get('decimal') })
        break

      case 'toggle-decimal':
        set('decimal', !get('decimal'))
        reply('pcode-changed', { pcode: get('pcode'), assembler: get('assembler'), decimal: get('decimal') })
        break

      case 'toggle-show-canvas':
        set('show-canvas', !get('show-canvas'))
        reply('show-canvas-changed', get('show-canvas'))
        break

      case 'toggle-show-output':
        set('show-output', !get('show-output'))
        reply('show-output-changed', get('show-output'))
        break

      case 'toggle-show-memory':
        set('show-memory', !get('show-memory'))
        reply('show-memory-changed', get('show-memory'))
        break

      case 'show-settings':
        reply('show-settings')
        break

      case 'set-draw-count-max':
        set('draw-count-max', data)
        reply('draw-count-max-changed', get('draw-count-max'))
        break

      case 'set-code-count-max':
        set('code-count-max', data)
        reply('code-count-max-changed', get('code-count-max'))
        break

      case 'set-small-size':
        set('small-size', data)
        reply('small-size-changed', get('small-size'))
        break

      case 'set-stack-size':
        set('stack-size', data)
        reply('stack-size-changed', get('stack-size'))
        break

      case 'reset-machine-options':
        set('show-canvas', true)
        set('show-output', false)
        set('show-memory', true)
        set('draw-count-max', 4)
        set('code-count-max', 100000)
        set('small-size', 60)
        set('stack-size', 20000)
        reply('show-canvas-changed', get('show-canvas'))
        reply('show-output-changed', get('show-output'))
        reply('show-memory-changed', get('show-memory'))
        reply('draw-count-max-changed', get('draw-count-max'))
        reply('code-count-max-changed', get('code-count-max'))
        reply('small-size-changed', get('small-size'))
        reply('stack-size-changed', get('stack-size'))
        break

      case 'set-group':
        set('group', data)
        reply('help-options-changed', get('help-options'))
        break

      case 'toggle-simple':
        set('simple', !get('simple'))
        reply('help-options-changed', get('help-options'))
        break

      case 'toggle-intermediate':
        set('intermediate', !get('intermediate'))
        reply('help-options-changed', get('help-options'))
        break

      case 'toggle-advanced':
        set('advanced', !get('advanced'))
        reply('help-options-changed', get('help-options'))
        break

      case 'machine-run-pause':
        if (machine.isRunning()) {
          if (machine.isPaused()) {
            machine.play()
          } else {
            machine.pause()
          }
        } else {
          maybeCompile()
          machine.run(get('pcode'), get('machine-options'))
        }
        break

      case 'machine-halt':
        if (machine.isRunning()) {
          machine.halt()
        }
        break

      case 'dump-memory':
        reply('dump-memory', machine.dump())
        break

      default:
        // by default, just pass the signal through for any module to pick up
        reply(signal, data)
        break
    }
  } catch (error) {
    // catch any error, and send it as a reply, so that any module can do what they want with it
    // what currently happens is the main module creates a popup showing the error
    reply('error', error)
  }
}

// function for registering callbacks on the record of outgoing messages
export function on (message, callback) {
  if (replies[message]) {
    replies[message].push(callback)
  } else {
    replies[message] = [callback]
  }
}

// a record of outgoing messages, to which other modules can attach callbacks (and which are then
// executed by the reply function)
const replies = {}

// function for executing any registered callbacks following a state change
function reply (message, data) {
  // execute any callbacks registered for this message
  if (replies[message]) {
    replies[message].forEach(callback => callback(data))
  }

  // if the language has changed, reply that the file has changed as well
  if (message === 'language-changed') {
    reply('help-options-changed', get('help-options'))
  }

  // if the file has changed, reply that the file properties have changed as well
  if (message === 'file-changed') {
    reply('language-changed', get('file').language)
    reply('files-changed', { files: get('files'), currentFileIndex: get('current-file-index') })
    reply('current-file-index-changed', get('current-file-index'))
    reply('name-changed', get('name'))
    reply('code-changed', { code: get('code'), language: get('language') })
    reply('usage-changed', { usage: get('usage'), language: get('language') })
    reply('lexemes-changed', { lexemes: get('lexemes'), language: get('language') })
    reply('pcode-changed', { pcode: get('pcode'), assembler: get('assembler'), decimal: get('decimal') })
  }

  // if fullscreen has changed, reply that the code has changed
  // (this ensures the code div resizes itself appropriately)
  if (message === 'fullscreen-changed') {
    reply('code-changed', { code: get('code'), language: get('language') })
  }
}

// compile the current program (if it isn't already compiled)
function maybeCompile () {
  const files = get('files')
  if (!get('compiled')) {
    const result = compile(get('code'), get('language'))
    files[get('current-file-index')].language = get('language')
    set('files', files)
    set('usage', result.usage)
    set('lexemes', result.lexemes)
    set('pcode', result.pcode)
    set('compiled', true)
    reply('usage-changed', { usage: result.usage, language: get('language') })
    reply('lexemes-changed', { lexemes: result.lexemes, language: get('language') })
    reply('pcode-changed', { pcode: result.pcode, assembler: get('assembler'), decimal: get('decimal') })
    reply('files-changed', { files: get('files'), currentFileIndex: get('current-file-index') })
  }
}

// validate file input as TGX
function validateTGX (data) {
  try {
    const json = JSON.parse(data)
    if (json.language && json.name && json.code && json.usage && json.pcode) {
      return json
    }
    throw error('Invalid TGX file.')
  } catch (ignore) {
    throw error('Invalid TGX file.')
  }
}

// create an error object
function error (message) {
  const err = new Error(message)
  err.type = 'System'
  return err
}

// register to pass some machine signals on from here
machine.on('show-canvas', send.bind(null, 'show-component', 'canvas'))
machine.on('show-output', send.bind(null, 'show-component', 'output'))
machine.on('show-memory', send.bind(null, 'show-component', 'memory'))
