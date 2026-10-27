// Update older installed service workers when a returning visitor opens the homepage.
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration('/').then(registration => registration?.update()).catch(() => {})

import './kids-chat.js'
