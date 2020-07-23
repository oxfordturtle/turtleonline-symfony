/*
 * Javscript entry point.
 */
import './components/bindings'
import './components/download'
import './components/languages'
import './components/menus'
import './components/preview'
import './components/tabs'
import './components/reference/colours'
import './components/reference/commands'
import './components/reference/cursors'
import './components/reference/fonts'
import './components/reference/keycodes'
import './components/system/controls'
import './system'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then((registration) => {
      console.log('SW registered: ', registration)
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError)
    })
  })
}
