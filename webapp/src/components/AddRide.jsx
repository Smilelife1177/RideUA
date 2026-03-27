import { useState } from 'react'
import { supabase } from '../supabase'
import './AddRide.css'

export default function AddRide({ tgUser, onDone }) {
    const [form, setForm] = useState({
        from_city: '',
        to_city: '',
        date: '',
        time: '',
        seats: '',
        price: '',
        comment: ''
    })
    const [loading, setLoading] = useState(false)

    function update(field, value) {
        setForm(f => ({ ...f, [field]: value }))
    }

    async function handleSubmit() {
        if (!form.from_city || !form.to_city || !form.date || !form.time || !form.seats || !form.price) {
            alert('Заповни всі обов\'язкові поля')
            return
        }

        setLoading(true)

        // Зберігаємо водія
        await supabase.from('users').upsert({
            id: tgUser.id,
            name: tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''),
            username: tgUser.username || null
        }, { onConflict: 'id' })

        // Створюємо поїздку
        const departure_time = new Date(`${form.date}T${form.time}`).toISOString()
        const { error } = await supabase.from('rides').insert({
            driver_id: tgUser.id,
            from_city: form.from_city,
            to_city: form.to_city,
            departure_time,
            seats_total: parseInt(form.seats),
            seats_left: parseInt(form.seats),
            price: parseInt(form.price),
            comment: form.comment || null
        })

        setLoading(false)

        if (error) {
            alert('Помилка: ' + error.message)
        } else {
            alert('🎉 Поїздку опубліковано!')
            onDone()
        }
    }

    return (
        <div className="add-ride">
            <h2 className="form-title">Нова поїздка</h2>

            <div className="form-group">
                <label>Звідки *</label>
                <input placeholder="Біла Церква" value={form.from_city}
                    onChange={e => update('from_city', e.target.value)} />
            </div>

            <div className="form-group">
                <label>Куди *</label>
                <input placeholder="Київ" value={form.to_city}
                    onChange={e => update('to_city', e.target.value)} />
            </div>

            <div className="form-row-2">
                <div className="form-group">
                    <label>Дата *</label>
                    <input type="date" value={form.date}
                        onChange={e => update('date', e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Час *</label>
                    <input type="time" value={form.time}
                        onChange={e => update('time', e.target.value)} />
                </div>
            </div>

            <div className="form-row-2">
                <div className="form-group">
                    <label>Місць *</label>
                    <input type="number" placeholder="3" min="1" max="8"
                        value={form.seats} onChange={e => update('seats', e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Ціна (₴) *</label>
                    <input type="number" placeholder="100"
                        value={form.price} onChange={e => update('price', e.target.value)} />
                </div>
            </div>

            <div className="form-group">
                <label>Коментар</label>
                <textarea placeholder="Зупинки, побажання..." rows={3}
                    value={form.comment} onChange={e => update('comment', e.target.value)} />
            </div>

            <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Публікуємо...' : '🚗 Опублікувати поїздку'}
            </button>
        </div>
    )
}