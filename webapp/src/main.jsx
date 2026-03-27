import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Ініціалізуємо Telegram Mini App
window.Telegram.WebApp.ready()
window.Telegram.WebApp.expand() // розгортаємо на весь екран

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)