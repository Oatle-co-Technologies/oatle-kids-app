import { subscriptionStatus } from './subscriptionLaunch.js'
// Make installation available from the homepage as well as the learning app.
// Leave optional learning assets to the app's offline-cache request.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { updateViaCache: 'none' })
      .then(registration => registration.update())
      .catch(error => console.warn('Oatle Kids service worker setup failed:', error))
  })
}

import './kids-chat.js'

// Keep the launch copy useful after launch day, using South African midnight.
document.querySelectorAll('[data-subscription-status]').forEach(element => {
  element.textContent = subscriptionStatus()
})
