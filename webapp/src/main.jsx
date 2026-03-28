import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const tg = window.Telegram?.WebApp

if (tg) {
  tg.ready()
  tg.expand()
  // Примусово білий фон незалежно від теми Telegram
  tg.setBackgroundColor('#ffffff')
  tg.setHeaderColor('#ffffff')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)