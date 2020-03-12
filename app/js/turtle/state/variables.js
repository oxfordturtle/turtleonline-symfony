/*
 * Getter and setter for system state variables.
 *
 * The system state is a load of variables, representing the current state of the system (not including
 * the virtual machine, which for clarity has its own module). Getters and setters for these state
 * variables are defined here. This module also initializes the variables and saves them to local
 * storage, so that the state is maintained between sessions.
 */
export function set (item, value) {
  const files = get('files')
  switch (item) {
    case 'new-current-file':
      files.push({ name: '', code: '', language: get('language') })
      set('files', files)
      set('current-file-index', files.length - 1)
      break

    case 'name': // fallthrough
    case 'code':
      files[get('current-file-index')][item] = value
      set('files', files)
      break

    default:
      window.localStorage.setItem(item, JSON.stringify(value))
      break
  }
}

export function get (item) {
  switch (item) {
    case 'name': // fallthrough
    case 'code':
      return get('files')[get('current-file-index')][item]

    case 'file':
      return {
        name: get('name'),
        code: get('code'),
        language: get('files')[get('current-file-index')].language,
        compiled: get('compiled'),
        lexemes: get('lexemes'),
        usage: get('usage'),
        pcode: get('pcode')
      }

    case 'machine-options':
      return {
        showCanvas: get('show-canvas'),
        showOutput: get('show-output'),
        showMemory: get('show-memory'),
        drawCountMax: get('draw-count-max'),
        codeCountMax: get('code-count-max'),
        smallSize: get('small-size'),
        stackSize: get('stack-size')
      }

    case 'help-options':
      return {
        language: get('language'),
        group: get('group'),
        simple: get('simple'),
        intermediate: get('intermediate'),
        advanced: get('advanced')
      }

    default:
      return JSON.parse(window.localStorage.getItem(item))
  }
}

// setup initial defaults if they haven't been initialised yet
if (get('language') === null) {
  set('language', 'Pascal')
}

if (get('files') === null) {
  set('files', [{
    name: '',
    code: '',
    language: get('language')
  }])
}

if (get('current-file-index') === null) {
  set('current-file-index', 0)
}

if (get('compiled') === null) {
  set('compiled', false)
}

if (get('usage') === null) {
  set('usage', [])
}

if (get('lexemes') === null) {
  set('lexemes', [])
}

if (get('pcode') === null) {
  set('pcode', [])
}

if (get('fullscreen') === null) {
  set('fullscreen', false)
}

if (get('assembler') === null) {
  set('assembler', true)
}

if (get('decimal') === null) {
  set('decimal', true)
}

if (get('show-canvas') === null) {
  set('show-canvas', true)
}

if (get('show-output') === null) {
  set('show-output', false)
}

if (get('show-memory') === null) {
  set('show-memory', true)
}

if (get('draw-count-max') === null) {
  set('draw-count-max', 4)
}

if (get('code-count-max') === null) {
  set('code-count-max', 100000)
}

if (get('small-size') === null) {
  set('small-size', 60)
}

if (get('stack-size') === null) {
  set('stack-size', 20000)
}

if (get('group') === null) {
  set('group', 0)
}

if (get('simple') === null) {
  set('simple', true)
}

if (get('intermediate') === null) {
  set('intermediate', false)
}

if (get('advanced') === null) {
  set('advanced', false)
}
