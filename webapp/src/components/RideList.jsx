import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import RideCard from './RideCard'
import './RideList.css'

export default function RideList({ tgUser }) {
    const [rides, setRides] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState({ from: '', to: '' })

    useEffect(() => {
        fetchRides()
    }, [])

    async function fetchRides() {
        setLoading(true)
        const { data, error } = await supabase
            .from('rides')
            .select(`
        *,
        users (name, username, rating, trips_count)
        `)
            .eq('status', 'active')          // тільки активні
            .gt('seats_left', 0)             // є вільні місця
            .gte('departure_time', new Date().toISOString())  // тільки майбутні
            .order('departure_time', { ascending: true })

        if (!error) setRides(data || [])
        setLoading(false)
    }

    const filtered = rides.filter(r => {
        const fromOk = filter.from === '' ||
            r.from_city.toLowerCase().includes(filter.from.toLowerCase())
        const toOk = filter.to === '' ||
            r.to_city.toLowerCase().includes(filter.to.toLowerCase())
        return fromOk && toOk
    })

    return (
        <div className="ride-list">
            <div className="search-row">
                <input
                    className="search-input"
                    placeholder="Звідки"
                    value={filter.from}
                    onChange={e => setFilter(f => ({ ...f, from: e.target.value }))}
                />
                <span className="search-arrow">→</span>
                <input
                    className="search-input"
                    placeholder="Куди"
                    value={filter.to}
                    onChange={e => setFilter(f => ({ ...f, to: e.target.value }))}
                />
            </div>

            {loading && <div className="loading">Завантаження...</div>}

            {!loading && filtered.length === 0 && (
                <div className="empty">
                    <p>😕 Поїздок не знайдено</p>
                    <p>Спробуй змінити пошук або додай свою!</p>
                </div>
            )}

            {filtered.map(ride => (
                <RideCard key={ride.id} ride={ride} tgUser={tgUser} onBook={fetchRides} />
            ))}
        </div>
    )
}