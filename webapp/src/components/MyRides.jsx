import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import './MyRides.css'

export default function MyRides({ tgUser }) {
    const [myRides, setMyRides] = useState([])
    const [myBookings, setMyBookings] = useState([])
    const [incomingRequests, setIncomingRequests] = useState([])
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

        const rides = ridesRes.data || []
        setMyRides(rides)
        setMyBookings(bookingsRes.data || [])

        if (rides.length > 0) {
            const rideIds = rides.map(r => r.id)
            const { data: requests } = await supabase
                .from('bookings')
                .select('*, users(name, username), rides(from_city, to_city, departure_time, price, seats_left)')
                .in('ride_id', rideIds)
                .in('status', ['pending', 'confirmed', 'cancelled'])
                .order('created_at', { ascending: false })

            const requestsWithRide = (requests || []).map(req => ({
                ...req,
                ride: req.rides || rides.find(r => r.id === req.ride_id)
            }))
            setIncomingRequests(requestsWithRide)
        }

        setLoading(false)
    }

    async function cancelRide(id) {
        if (!confirm('Скасувати поїздку?')) return

        const { error } = await supabase
            .from('rides')
            .update({ status: 'cancelled' })
            .eq('id', id)

        if (error) {
            alert('Помилка: ' + error.message)
            return
        }
        fetchData()
    }

    async function handleRequest(bookingId, action, booking) {
        const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled'

        const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', bookingId)

        if (error) {
            alert('Помилка: ' + error.message)
            return
        }

        if (action === 'confirm' && booking.ride) {
            // Зменшуємо місця тільки при підтвердженні
            await supabase
                .from('rides')
                .update({ seats_left: booking.ride.seats_left - 1 })
                .eq('id', booking.ride_id)
        }

        fetchData()
    }

    if (loading) return <div className="loading">Завантаження...</div>

    return (
        <div className="my-rides">

            {incomingRequests.length > 0 && (
                <section className="requests-section">
                    <h3 className="section-title">
                        🔔 Запити на бронювання
                        {incomingRequests.filter(r => r.status === 'pending').length > 0 && (
                            <span className="badge">
                                {incomingRequests.filter(r => r.status === 'pending').length}
                            </span>
                        )}
                    </h3>
                    {incomingRequests.map(req => {
                        const passenger = req.users
                        const isPending = req.status === 'pending'
                        const isConfirmed = req.status === 'confirmed'

                        return (
                            <div
                                key={req.id}
                                className={`request-card ${isConfirmed ? 'confirmed' : ''} ${!isPending && !isConfirmed ? 'rejected' : ''}`}
                            >
                                <div className="request-route">
                                    {req.ride?.from_city} → {req.ride?.to_city}
                                    {!isPending && (
                                        <span className={`status-badge ${req.status}`}>
                                            {isConfirmed ? '✅ Прийнято' : '❌ Відхилено'}
                                        </span>
                                    )}
                                </div>
                                <div className="request-passenger">
                                    👤 {passenger?.name || 'Невідомий'}
                                    {passenger?.username && (
                                        <a href={`https://t.me/${passenger.username}`} className="tg-link-small">
                                            @{passenger.username}
                                        </a>
                                    )}
                                </div>

                                {req.ride && (() => {
                                    const date = new Date(req.ride.departure_time)
                                    return (
                                        <div className="my-meta" style={{ marginTop: 4 }}>
                                            {date.toLocaleDateString('uk-UA')} о {date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                            · {req.ride.price} ₴
                                        </div>
                                    )
                                })()}

                                {isPending && (
                                    <div className="request-actions">
                                        <button className="confirm-btn" onClick={() => handleRequest(req.id, 'confirm', req)}>
                                            ✅ Підтвердити
                                        </button>
                                        <button className="reject-btn" onClick={() => handleRequest(req.id, 'reject', req)}>
                                            ❌ Відхилити
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </section>
            )}

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
                                    Скасувати поїздку
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
                                    {booking.status === 'pending' ? '⏳ Очікує' :
                                        booking.status === 'confirmed' ? '✅ Підтверджено' : '❌ Скасовано'}
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