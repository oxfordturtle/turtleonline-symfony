/*
 * Messages sent out by the state module (following changes of state), and signature for
 * the reply functions.
 */
export type Message = 'error'
              | 'show-component'
              | 'fullscreen-changed'
              | 'menu-changed'
              | 'language-changed'
              | 'files-changed'
              | 'current-file-index-changed'
              | 'file-changed'
              | 'name-changed'
              | 'code-changed'
              | 'lexemes-changed'
              | 'routines-changed'
              | 'usage-changed'
              | 'pcode-changed'
              | 'show-canvas-changed'
              | 'show-output-changed'
              | 'show-memory-changed'
              | 'draw-count-max-changed'
              | 'code-count-max-changed'
              | 'small-size-changed'
              | 'stack-size-changed'
              | 'dump-memory'

// signature for reply functions
export type Reply = (data: any) => void
