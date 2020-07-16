/**
 * The main entry point for the application.
 */
import './site/guide'
import './site/menu'
import './site/preview'
import './pwa'
import './actions'
import './components'
import state from './state/index'

// expose the system state in the console (for development / advanced users)
(window as any).state = state

// signal the state that the page is ready
state.ready()
