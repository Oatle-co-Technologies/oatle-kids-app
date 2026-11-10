import { supabase } from './lib/supabase';
import { prepareAccountStorage } from './lib/accountStorage';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './pwa.js'
import App from './App.jsx'
import './BackButtonSafeArea.css'

const { data: { session } } = await supabase.auth.getSession();
prepareAccountStorage(localStorage, session?.user?.id || null);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
