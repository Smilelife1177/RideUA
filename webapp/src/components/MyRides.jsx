import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import './MyRides.css'

export default function MyRides({ tgUser }) {
    const [myRides, setMyRides] = useState([])
    const [myBookings, setMyBookings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (tgUser) fetchData()
    }, [tgUser])

    async function fetchData() {
        setLoading(true)

        const [ridesRes, bookingsRes] = await Promise.all([
            supabase.from('rides')
                .select('*')
                .eq('driver_id', tgUser.id)
                .order('departure_time', { ascending: false }),

            supabase.from('bookings')
                .select('*, rides(from_city, to_city, departure_time, price)')
                .eq('passenger_id', tgUser.id)
                .order('created_at', { ascending: false })
        ])

        setMyRides(ridesRes.data || [])
        setMyBookings(bookingsRes.data || [])
        setLoading(false)
    }

    async function cancelRide(id) {
        if (!confirm('Скасувати поїздку?')) return

        const { error } = await supabase
            .from('rides')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .eq('driver_id', tgUser.id)  // захист — тільки свої

        if (error) {
            alert('Помилка: ' + error.message)
        } else {
            fetchData()  // оновлюємо список
        }
    }

    if (loading) return <div className="loading">Завантаження...</div>

    return (
        <div className="my-rides">
            <section>
                <h3 className="section-title">Мої поїздки як водій ({myRides.length})</h3>
                {myRides.length === 0 && (
                    <div className="empty-section">Ти ще не додавав поїздок</div>
                )}
                {myRides.map(ride => {
                    const date = new Date(ride.departure_time)
                    return (
                        <div key={ride.id} className={`my-card ${ride.status !== 'active' ? 'inactive' : ''}`}>
                            <div className="my-route">
                                {ride.from_city} → {ride.to_city}
                                <span className={`status-badge ${ride.status}`}>
                                    {ride.status === 'active' ? 'Активна' : 'Скасована'}
                                </span>
                            </div>
                            <div className="my-meta">
                                {date.toLocaleDateString('uk-UA')} о {date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                · {ride.seats_left}/{ride.seats_total} місць · {ride.price} ₴
                            </div>
                            {ride.status === 'active' && (
                                <button className="cancel-btn" onClick={() => cancelRide(ride.id)}>
                                    Скасувати
                                </button>
                            )}
                        </div>
                    )
                })}
            </section>

            <section style={{ marginTop: '20px' }}>
                <h3 className="section-title">Мої бронювання ({myBookings.length})</h3>
                {myBookings.length === 0 && (
                    <div className="empty-section">Ти ще не бронював поїздок</div>
                )}
                {myBookings.map(booking => {
                    const ride = booking.rides
                    if (!ride) return null
                    const date = new Date(ride.departure_time)
                    return (
                        <div key={booking.id} className="my-card">
                            <div className="my-route">
                                {ride.from_city} → {ride.to_city}
                                <span className={`status-badge ${booking.status}`}>
                                    {booking.status === 'pending' ? 'Очікує' : booking.status === 'confirmed' ? 'Підтверджено' : 'Скасовано'}
                                </span>
                            </div>
                            <div className="my-meta">
                                {date.toLocaleDateString('uk-UA')} о {date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                · {ride.price} ₴
                            </div>
                        </div>
                    )
                })}
            </section>
        </div>
    )
}