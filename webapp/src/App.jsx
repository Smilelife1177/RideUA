import { useState, useEffect } from 'react'
import RideList from './components/RideList'
import AddRide from './components/AddRide'
import MyRides from './components/MyRides'
import './App.css'

export default function App() {
  const [tab, setTab] = useState('rides')
  const [tgUser, setTgUser] = useState(null)

  useEffect(() => {
    // Отримуємо юзера з Telegram
    const tg = window.Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      setTgUser(tg.initDataUnsafe.user)
    } else {
      // Для тестування в браузері
      setTgUser({ id: 123456, first_name: 'Тест', username: 'test' })
    }
  }, [])

  return (
    <div className="app">
      <header className="header">
        <span className="logo">🚗 RideUA</span>
        <span className="user-name">{tgUser?.first_name}</span>
      </header>

      <main className="main">
        {tab === 'rides' && <RideList tgUser={tgUser} />}
        {tab === 'add' && <AddRide tgUser={tgUser} onDone={() => setTab('rides')} />}
        {tab === 'my' && <MyRides tgUser={tgUser} />}
      </main>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${tab === 'rides' ? 'active' : ''}`}
          onClick={() => setTab('rides')}
        >
          <span>🔍</span>
          <span>Поїздки</span>
        </button>
        <button
          className={`nav-item ${tab === 'add' ? 'active' : ''}`}
          onClick={() => setTab('add')}
        >
          <span>➕</span>
          <span>Додати</span>
        </button>
        <button
          className={`nav-item ${tab === 'my' ? 'active' : ''}`}
          onClick={() => setTab('my')}
        >
          <span>📋</span>
          <span>Мої</span>
        </button>
      </nav>
    </div>
  )
}