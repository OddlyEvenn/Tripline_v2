import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Calendar, Zap, TrendingDown, Clock, ArrowRight } from 'lucide-react'
import { stationApi } from '../api/axios'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

function CityInput({ label, value, onChange, placeholder, icon, availableCities = [] }) {
    const [show, setShow] = useState(false)
    const ref = useRef(null)

    const suggestions = availableCities.filter(c => c.toLowerCase().includes((value || '').toLowerCase()))

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false) }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    return (
        <div className="relative flex-1" ref={ref}>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">{label}</label>
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={value}
                    onChange={e => { onChange(e.target.value); setShow(true); }}
                    placeholder={placeholder}
                    className="input-field pl-9 w-full cursor-pointer text-gray-900 dark:text-white"
                    onFocus={() => setShow(true)}
                    autoComplete="off"
                />
            </div>
            {show && suggestions.length > 0 && (
                <ul className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-dark-700 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
                    {suggestions.map(city => (
                        <li
                            key={city}
                            className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-600 cursor-pointer transition-colors text-sm text-gray-800 dark:text-white"
                            onMouseDown={(e) => { e.preventDefault(); onChange(city); setShow(false); }}
                        >
                            <MapPin className="w-3.5 h-3.5 text-primary-400" />
                            {city}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

const MODES = [
    { value: 'BALANCED', label: 'Balanced', icon: <Zap className="w-3.5 h-3.5" /> },
    { value: 'CHEAPEST', label: 'Cheapest', icon: <TrendingDown className="w-3.5 h-3.5" /> },
    { value: 'FASTEST', label: 'Fastest', icon: <Clock className="w-3.5 h-3.5" /> },
]

export default function SearchBar({ initialValues, onSearch, loading = false }) {
    const navigate = useNavigate()
    const [origin, setOrigin] = useState(initialValues?.originCity || '')
    const [destination, setDestination] = useState(initialValues?.destinationCity || '')
    const [date, setDate] = useState(initialValues?.travelDate ? new Date(initialValues.travelDate) : new Date())
    const [mode, setMode] = useState(initialValues?.optimizationMode || 'BALANCED')
    const [availableCities, setAvailableCities] = useState([])

    useEffect(() => {
        stationApi.getCities().then(res => setAvailableCities(res.data)).catch(console.error)
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!date) return

        const pad = (n) => n.toString().padStart(2, '0')
        const localDateString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

        const params = {
            originCity: origin,
            destinationCity: destination,
            travelDate: localDateString,
            optimizationMode: mode
        }

        if (onSearch) {
            onSearch(params)
        } else {
            navigate('/search', { state: { searchParams: params } })
        }
    }

    const swapCities = () => {
        const tmp = origin
        setOrigin(destination)
        setDestination(tmp)
    }

    return (
        <form onSubmit={handleSubmit} className="glass-card p-6">
            {/* Mode Selector */}
            <div className="flex gap-2 mb-5">
                {MODES.map(m => (
                    <button
                        key={m.value}
                        type="button"
                        onClick={() => setMode(m.value)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${mode === m.value
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                            : 'bg-white dark:bg-dark-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/5'
                            }`}
                    >
                        {m.icon}{m.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-3 items-end">
                {/* Origin */}
                <CityInput label="From" value={origin} onChange={setOrigin} placeholder="Origin city" availableCities={availableCities} />

                {/* Swap Button */}
                <button
                    type="button"
                    onClick={swapCities}
                    className="hidden lg:flex items-center justify-center w-10 h-10 mb-0.5 rounded-full border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-white hover:border-primary-500 transition-all flex-shrink-0 bg-white dark:bg-transparent"
                >
                    <ArrowRight className="w-4 h-4" />
                </button>

                {/* Destination */}
                <CityInput label="To" value={destination} onChange={setDestination} placeholder="Destination city" availableCities={availableCities} />

                {/* Date */}
                <div className="flex-1 min-w-[160px]">
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10 pointer-events-none" />
                        <DatePicker
                            selected={date}
                            onChange={setDate}
                            minDate={new Date()}
                            dateFormat="dd MMM yyyy"
                            className="input-field pl-9 w-full"
                            wrapperClassName="w-full"
                        />
                    </div>
                </div>

                {/* Search Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary h-[46px] px-8 flex items-center gap-2 flex-shrink-0"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>
        </form>
    )
}
