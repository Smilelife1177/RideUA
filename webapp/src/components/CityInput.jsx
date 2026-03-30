import { useState, useRef, useEffect } from 'react'
import './CityInput.css'

const CITIES = [
    { name: 'Київ', region: 'м. Київ' },
    { name: 'Харків', region: 'Харківська область' },
    { name: 'Одеса', region: 'Одеська область' },
    { name: 'Дніпро', region: 'Дніпропетровська область' },
    { name: 'Запоріжжя', region: 'Запорізька область' },
    { name: 'Львів', region: 'Львівська область' },
    { name: 'Кривий Ріг', region: 'Дніпропетровська область' },
    { name: 'Миколаїв', region: 'Миколаївська область' },
    { name: 'Маріуполь', region: 'Донецька область' },
    { name: 'Луганськ', region: 'Луганська область' },
    { name: 'Вінниця', region: 'Вінницька область' },
    { name: 'Херсон', region: 'Херсонська область' },
    { name: 'Полтава', region: 'Полтавська область' },
    { name: 'Чернігів', region: 'Чернігівська область' },
    { name: 'Черкаси', region: 'Черкаська область' },
    { name: 'Суми', region: 'Сумська область' },
    { name: 'Житомир', region: 'Житомирська область' },
    { name: 'Рівне', region: 'Рівненська область' },
    { name: 'Івано-Франківськ', region: 'Івано-Франківська область' },
    { name: 'Тернопіль', region: 'Тернопільська область' },
    { name: 'Луцьк', region: 'Волинська область' },
    { name: 'Ужгород', region: 'Закарпатська область' },
    { name: 'Хмельницький', region: 'Хмельницька область' },
    { name: 'Чернівці', region: 'Чернівецька область' },
    { name: 'Кропивницький', region: 'Кіровоградська область' },
    { name: 'Біла Церква', region: 'Київська область' },
    { name: 'Бориспіль', region: 'Київська область' },
    { name: 'Бровари', region: 'Київська область' },
    { name: 'Васильків', region: 'Київська область' },
    { name: 'Обухів', region: 'Київська область' },
    { name: 'Фастів', region: 'Київська область' },
    { name: 'Переяслав', region: 'Київська область' },
    { name: 'Умань', region: 'Черкаська область' },
    { name: 'Кам\'янець-Подільський', region: 'Хмельницька область' },
    { name: 'Мукачево', region: 'Закарпатська область' },
    { name: 'Дрогобич', region: 'Львівська область' },
    { name: 'Стрий', region: 'Львівська область' },
    { name: 'Нікополь', region: 'Дніпропетровська область' },
    { name: 'Кременчук', region: 'Полтавська область' },
    { name: 'Конотоп', region: 'Сумська область' },
    { name: 'Шостка', region: 'Сумська область' },
    { name: 'Ніжин', region: 'Чернігівська область' },
    { name: 'Бердичів', region: 'Житомирська область' },
    { name: 'Коростень', region: 'Житомирська область' },
    { name: 'Дубно', region: 'Рівненська область' },
    { name: 'Ковель', region: 'Волинська область' },
    { name: 'Нововолинськ', region: 'Волинська область' },
    { name: 'Мелітополь', region: 'Запорізька область' },
    { name: 'Бердянськ', region: 'Запорізька область' },
    { name: 'Ізмаїл', region: 'Одеська область' },
    { name: 'Южне', region: 'Одеська область' },
]

export default function CityInput({ placeholder, value, onChange }) {
    const [query, setQuery] = useState(value || '')
    const [suggestions, setSuggestions] = useState([])
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    function handleInput(e) {
        const val = e.target.value
        setQuery(val)
        onChange('')  // скидаємо вибране місто

        if (val.length < 1) {
            setSuggestions([])
            setOpen(false)
            return
        }

        const filtered = CITIES.filter(c =>
            c.name.toLowerCase().startsWith(val.toLowerCase()) ||
            c.name.toLowerCase().includes(val.toLowerCase())
        ).slice(0, 5)

        setSuggestions(filtered)
        setOpen(filtered.length > 0)
    }

    function selectCity(city) {
        setQuery(city.name)
        onChange(city.name)
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
                            <span className="city-option-region">{city.region}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}