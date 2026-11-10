import { restoreScopedDeviceState } from './lib/restoreScopedDeviceState.js';
import ParentAccount from './components/ParentAccount.jsx';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './pwa.js'
import App from './App.jsx'
import './BackButtonSafeArea.css'

restoreScopedDeviceState(localStorage);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ParentAccount AppComponent={App} />
  </StrictMode>,
)
