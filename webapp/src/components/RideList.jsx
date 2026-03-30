import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import RideCard from './RideCard'
import './RideList.css'
import CityInput from './CityInput'

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
                users (name, username, rating, trips_count, car_brand, car_model, car_year, car_plate)
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
                <CityInput
                    placeholder="Звідки"
                    value={filter.from}
                    onChange={val => setFilter(f => ({ ...f, from: val }))}
                />
                <span className="search-arrow">→</span>
                <CityInput
                    placeholder="Куди"
                    value={filter.to}
                    onChange={val => setFilter(f => ({ ...f, to: val }))}
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