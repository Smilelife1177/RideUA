import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import RideList from './components/RideList'
import AddRide from './components/AddRide'
import MyRides from './components/MyRides'
import './App.css'

export default function App() {
  const [tab, setTab] = useState('rides')
  const [tgUser, setTgUser] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      setTgUser(tg.initDataUnsafe.user)
    } else {
      setTgUser({ id: 123456, first_name: 'Олег', username: 'oleg' })
    }
  }, [])

  useEffect(() => {
    if (!tgUser) return
    checkPending()
    const interval = setInterval(checkPending, 30000)
    return () => clearInterval(interval)
  }, [tgUser])

  async function checkPending() {
    const { data: myRides } = await supabase
      .from('rides')
      .select('id')
      .eq('driver_id', tgUser.id)
      .eq('status', 'active')

    if (!myRides?.length) { setPendingCount(0); return }

    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('ride_id', myRides.map(r => r.id))
      .eq('status', 'pending')

    setPendingCount(count || 0)
  }

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
        <button className={`nav-item ${tab === 'rides' ? 'active' : ''}`} onClick={() => setTab('rides')}>
          <span>🔍</span>
          <span>Поїздки</span>
        </button>
        <button className={`nav-item ${tab === 'add' ? 'active' : ''}`} onClick={() => setTab('add')}>
          <span>➕</span>
          <span>Додати</span>
        </button>
        <button
          className={`nav-item ${tab === 'my' ? 'active' : ''}`}
          onClick={() => { setTab('my'); setPendingCount(0) }}
        >
          <span style={{ position: 'relative', display: 'inline-block' }}>
            📋
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -8,
                background: '#e74c3c', color: 'white',
                fontSize: 9, fontWeight: 700,
                padding: '1px 4px', borderRadius: 10,
                lineHeight: 1.4
              }}>{pendingCount}</span>
            )}
          </span>
          <span>Мої</span>
        </button>
      </nav>
    </div>
  )
}