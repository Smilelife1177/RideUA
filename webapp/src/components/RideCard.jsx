import { useState } from 'react'
import { supabase } from '../supabase'
import './RideCard.css'

export default function RideCard({ ride, tgUser, onBook }) {
    const [expanded, setExpanded] = useState(false)
    const [booking, setBooking] = useState(false)

    const driver = ride.users
    const date = new Date(ride.departure_time)
    const dateStr = date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
    const timeStr = date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })

    const isOwnRide = tgUser?.id === ride.driver_id

    async function handleBook() {
        if (!tgUser || isOwnRide) return
        setBooking(true)

        // Зберігаємо юзера якщо новий
        await supabase.from('users').upsert({
            id: tgUser.id,
            name: tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''),
            username: tgUser.username || null
        }, { onConflict: 'id' })

        // Створюємо бронювання
        const { error } = await supabase.from('bookings').insert({
            ride_id: ride.id,
            passenger_id: tgUser.id
        })

        if (!error) {
            // Зменшуємо кількість місць
            await supabase.from('rides')
                .update({ seats_left: ride.seats_left - 1 })
                .eq('id', ride.id)

            alert('✅ Запит відправлено! Водій підтвердить поїздку.')
            onBook()
        }
        setBooking(false)
    }

    return (
        <div className="ride-card" onClick={() => setExpanded(!expanded)}>
            <div className="ride-top">
                <div className="ride-route">
                    <span className="city">{ride.from_city}</span>
                    <span className="route-arrow">→</span>
                    <span className="city">{ride.to_city}</span>
                </div>
                <div className="time-badge">{timeStr}</div>
            </div>

            <div className="ride-meta">
                <div className="driver-row">
                    <div className="avatar" style={{ background: stringToColor(driver?.name || '') }}>
                        {(driver?.name || '?')[0]}
                    </div>
                    <div className="driver-info">
                        <span className="driver-name">{driver?.name || 'Невідомо'}</span>
                        <span className="driver-sub">⭐ {driver?.rating?.toFixed(1)} · {driver?.trips_count} поїздок</span>
                    </div>
                </div>
                <div className="right-meta">
                    <span className="seats">💺 {ride.seats_left}</span>
                    <span className="price">{ride.price} ₴</span>
                </div>
            </div>

            <div className="ride-date">{dateStr}</div>

            {expanded && (
                <div className="ride-details" onClick={e => e.stopPropagation()}>
                    {ride.comment && (
                        <div className="comment">💬 {ride.comment}</div>
                    )}
                    {isOwnRide ? (
                        <div className="own-badge">Це твоя поїздка</div>
                    ) : ride.seats_left === 0 ? (
                        <div className="full-badge">Місць немає</div>
                    ) : (
                        <button className="book-btn" onClick={handleBook} disabled={booking}>
                            {booking ? 'Відправляємо...' : '✅ Забронювати місце'}
                        </button>
                    )}
                    {driver?.username && (

                        className = "tg-link"
              href={`https://t.me/${driver.username}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
            >
                    📩 Написати водію
                </a>
            )}
        </div>
    )
}
    </div >
  )
}

function stringToColor(str) {
    const colors = ['#185FA5', '#1D9E75', '#993C1D', '#533AB7', '#3B6D11', '#993556', '#BA7517']
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
}