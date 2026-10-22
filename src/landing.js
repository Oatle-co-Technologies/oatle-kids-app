// Installed apps and authentication callbacks continue directly into the learning app.
const params = new URLSearchParams(window.location.search)
const authCallback = params.has('code') || /access_token=|error_description=/.test(window.location.hash)
const installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || window.Capacitor?.isNativePlatform?.()
if (authCallback || installed) window.location.replace(`/app.html${window.location.search}${window.location.hash}`)
// Update older installed service workers when a returning visitor opens the homepage.
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration('/').then(registration => registration?.update()).catch(() => {})

import './kids-chat.js'
