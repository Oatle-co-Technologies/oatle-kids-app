import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './pwa.js'
import ComingSoon from "./ComingSoon.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ComingSoon />
  </StrictMode>,
)