import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import './Profile.css'

export default function Profile({ tgUser }) {
    const [profile, setProfile] = useState(null)
    const [reviews, setReviews] = useState([])
    const [stats, setStats] = useState({ asDriver: 0, asPassenger: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (tgUser) fetchProfile()
    }, [tgUser])

    async function fetchProfile() {
        setLoading(true)

        const [userRes, reviewsRes, ridesRes, bookingsRes] = await Promise.all([
            supabase.from('users').select('*').eq('id', tgUser.id).single(),
            supabase.from('reviews').select('*, users!reviews_author_id_fkey(name)').eq('target_id', tgUser.id).order('created_at', { ascending: false }),
            supabase.from('rides').select('id', { count: 'exact' }).eq('driver_id', tgUser.id).eq('status', 'active'),
            supabase.from('bookings').select('id', { count: 'exact' }).eq('passenger_id', tgUser.id).eq('status', 'confirmed')
        ])

        setProfile(userRes.data)
        setReviews(reviewsRes.data || [])
        setStats({
            asDriver: ridesRes.count || 0,
            asPassenger: bookingsRes.count || 0
        })
        setLoading(false)
    }

    if (loading) return <div className="loading">Завантаження...</div>

    const name = tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '')
    const rating = profile?.rating || 5.0
    const tripsCount = profile?.trips_count || 0

    function renderStars(rating) {
        return [1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{ color: i <= Math.round(rating) ? '#EF9F27' : '#ddd', fontSize: 18 }}>★</span>
        ))
    }

    return (
        <div className="profile">

            <div className="profile-card">
                <div className="profile-avatar">
                    {name[0]}
                </div>
                <div className="profile-name">{name}</div>
                {tgUser.username && (
                    <div className="profile-username">@{tgUser.username}</div>
                )}
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
                        {review.comment && (
                            <div className="review-comment">{review.comment}</div>
                        )}
                        <div className="review-date">
                            {new Date(review.created_at).toLocaleDateString('uk-UA')}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    )
}