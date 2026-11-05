import { subscriptionStatus } from './subscriptionLaunch.js'
// Update older installed service workers when a returning visitor opens the homepage.
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration('/').then(registration => registration?.update()).catch(() => {})

import './kids-chat.js'

// Keep the launch copy useful after launch day, using South African midnight.
document.querySelectorAll('[data-subscription-status]').forEach(element => {
  element.textContent = subscriptionStatus()
})
