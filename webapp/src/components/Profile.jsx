import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import './Profile.css'

export default function Profile({ tgUser }) {
    const [profile, setProfile] = useState(null)
    const [reviews, setReviews] = useState([])
    const [stats, setStats] = useState({ asDriver: 0, asPassenger: 0 })
    const [loading, setLoading] = useState(true)
    const [editingCar, setEditingCar] = useState(false)
    const [carForm, setCarForm] = useState({ brand: '', model: '', plate: '', year: '' })
    const [savingCar, setSavingCar] = useState(false)

    useEffect(() => {
        if (tgUser) fetchProfile()
    }, [tgUser])

    async function fetchProfile() {
        setLoading(true)
        const [userRes, reviewsRes, ridesRes, bookingsRes] = await Promise.all([
            supabase.from('users').select('*').eq('id', tgUser.id).single(),
            supabase.from('reviews').select('*, users!reviews_author_id_fkey(name)').eq('target_id', tgUser.id).order('created_at', { ascending: false }),
            supabase.from('rides').select('id', { count: 'exact' }).eq('driver_id', tgUser.id),
            supabase.from('bookings').select('id', { count: 'exact' }).eq('passenger_id', tgUser.id).eq('status', 'confirmed')
        ])

        const userData = userRes.data
        setProfile(userData)
        setReviews(reviewsRes.data || [])
        setStats({ asDriver: ridesRes.count || 0, asPassenger: bookingsRes.count || 0 })

        if (userData) {
            setCarForm({
                brand: userData.car_brand || '',
                model: userData.car_model || '',
                plate: userData.car_plate || '',
                year: userData.car_year || ''
            })
        }
        setLoading(false)
    }

    async function saveCar() {
        setSavingCar(true)
        const { error } = await supabase.from('users').update({
            car_brand: carForm.brand || null,
            car_model: carForm.model || null,
            car_plate: carForm.plate ? carForm.plate.toUpperCase() : null,
            car_year: carForm.year ? parseInt(carForm.year) : null
        }).eq('id', tgUser.id)

        if (error) {
            alert('Помилка: ' + error.message)
        } else {
            setEditingCar(false)
            fetchProfile()
        }
        setSavingCar(false)
    }

    if (loading) return <div className="loading">Завантаження...</div>

    const name = tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '')
    const rating = profile?.rating || 5.0
    const tripsCount = profile?.trips_count || 0
    const hasCar = profile?.car_brand && profile?.car_model

    function renderStars(rating) {
        return [1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{ color: i <= Math.round(rating) ? '#EF9F27' : '#ddd', fontSize: 18 }}>★</span>
        ))
    }

    return (
        <div className="profile">

            <div className="profile-card">
                <div className="profile-avatar">{name[0]}</div>
                <div className="profile-name">{name}</div>
                {tgUser.username && <div className="profile-username">@{tgUser.username}</div>}
                <div className="profile-stars">{renderStars(rating)}</div>
                <div className="profile-rating-text">{rating.toFixed(1)} · {tripsCount} поїздок</div>
            </div>

            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-value">{stats.asDriver}</div>
                    <div className="stat-label">Як водій</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.asPassenger}</div>
                    <div className="stat-label">Як пасажир</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{reviews.length}</div>
                    <div className="stat-label">Відгуків</div>
                </div>
            </div>

            {/* Машина */}
            <div className="car-section">
                <div className="car-header">
                    <h3 className="section-title" style={{ margin: 0 }}>🚗 Моя машина</h3>
                    <button className="edit-car-btn" onClick={() => setEditingCar(!editingCar)}>
                        {editingCar ? 'Скасувати' : hasCar ? 'Змінити' : 'Додати'}
                    </button>
                </div>

                {!editingCar && hasCar && (
                    <div className="car-info">
                        <div className="car-main">
                            {profile.car_brand} {profile.car_model}
                            {profile.car_year && <span className="car-year">{profile.car_year}</span>}
                        </div>
                        {profile.car_plate && (
                            <div className="car-plate">{profile.car_plate}</div>
                        )}
                    </div>
                )}

                {!editingCar && !hasCar && (
                    <div className="empty-section">Додай інформацію про машину — пасажири будуть знати що шукати</div>
                )}

                {editingCar && (
                    <div className="car-form">
                        <div className="car-form-row">
                            <div className="form-group">
                                <label>Марка</label>
                                <input
                                    placeholder="Toyota"
                                    value={carForm.brand}
                                    onChange={e => setCarForm(f => ({ ...f, brand: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Модель</label>
                                <input
                                    placeholder="Camry"
                                    value={carForm.model}
                                    onChange={e => setCarForm(f => ({ ...f, model: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="car-form-row">
                            <div className="form-group">
                                <label>Номерний знак</label>
                                <input
                                    placeholder="АА 1234 ВВ"
                                    value={carForm.plate}
                                    onChange={e => setCarForm(f => ({ ...f, plate: e.target.value }))}
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Рік</label>
                                <input
                                    type="number"
                                    placeholder="2020"
                                    min="1990"
                                    max="2025"
                                    value={carForm.year}
                                    onChange={e => setCarForm(f => ({ ...f, year: e.target.value }))}
                                />
                            </div>
                        </div>
                        <button className="save-car-btn" onClick={saveCar} disabled={savingCar}>
                            {savingCar ? 'Зберігаємо...' : '💾 Зберегти'}
                        </button>
                    </div>
                )}
            </div>

            {/* Відгуки */}
            <div className="reviews-section">
                <h3 className="section-title">Відгуки</h3>
                {reviews.length === 0 && (
                    <div className="empty-section">Відгуків поки що немає</div>
                )}
                {reviews.map(review => (
                    <div key={review.id} className="review-card">
                        <div className="review-header">
                            <span className="review-author">{review.users?.name || 'Анонім'}</span>
                            <span className="review-stars">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <span key={i} style={{ color: i <= review.rating ? '#EF9F27' : '#ddd' }}>★</span>
                                ))}
                            </span>
                        </div>
                        {review.comment && <div className="review-comment">{review.comment}</div>}
                        <div className="review-date">
                            {new Date(review.created_at).toLocaleDateString('uk-UA')}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    )
}