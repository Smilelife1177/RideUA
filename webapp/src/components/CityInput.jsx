import { useState, useRef, useEffect, useCallback } from 'react'
import './CityInput.css'

export default function CityInput({ placeholder, value, onChange }) {
    const [query, setQuery] = useState(value || '')
    const [suggestions, setSuggestions] = useState([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const ref = useRef(null)
    const timerRef = useRef(null)

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => {
            document.removeEventListener('mousedown', handleClick)
            clearTimeout(timerRef.current)  // cleanup таймера при unmount
        }
    }, [])

    const search = useCallback(async (val) => {
        if (val.length < 2) {
            setSuggestions([])
            setOpen(false)
            return
        }

        setLoading(true)
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(val)}&` +
                `countrycodes=ua&` +
                `addressdetails=1&` +
                `limit=6&` +
                `format=json&` +
                `accept-language=uk`,
                { headers: { 'Accept-Language': 'uk' } }
            )
            const data = await res.json()

            // Фільтруємо тільки населені пункти і форматуємо
            const results = data
                .filter(item => ['city', 'town', 'village', 'hamlet', 'suburb'].includes(item.type) ||
                    ['city', 'town', 'village', 'hamlet'].includes(item.addresstype))
                .map(item => {
                    const a = item.address
                    const name = a.city || a.town || a.village || a.hamlet || a.suburb || item.display_name.split(',')[0]
                    const region = a.state || ''
                    const district = a.county || ''
                    const sub = district && district !== region ? district : region
                    return { name, sub, display: item.display_name }
                })
                // Прибираємо дублікати по name+sub
                .filter((item, idx, arr) =>
                    arr.findIndex(x => x.name === item.name && x.sub === item.sub) === idx
                )

            setSuggestions(results)
            setOpen(results.length > 0)
        } catch (e) {
            setSuggestions([])
        }
        setLoading(false)
    }, [])

    function handleInput(e) {
        const val = e.target.value
        setQuery(val)
        onChange('')

        // Debounce — чекаємо 400мс після останнього символу
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => search(val), 400)
    }

    function selectCity(city) {
        const fullName = city.sub ? `${city.name}, ${city.sub}` : city.name
        setQuery(fullName)
        onChange(fullName)
        setSuggestions([])
        setOpen(false)
    }

    return (
        <div className="city-input-wrap" ref={ref}>
            <input
                className="search-input"
                placeholder={placeholder}
                value={query}
                onChange={handleInput}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                autoComplete="off"
            />
            {loading && <div className="city-loading">🔍</div>}
            {open && (
                <div className="city-dropdown">
                    {suggestions.map((city, i) => (
                        <div
                            key={i}
                            className="city-option"
                            onMouseDown={() => selectCity(city)}
                            onClick={() => selectCity(city)}
                        >
                            <span className="city-option-name">{city.name}</span>
                            <span className="city-option-region">{city.sub}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}