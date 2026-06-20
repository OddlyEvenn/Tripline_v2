import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Plane, Train, Bus, Layers, MapPin, Calendar, Users,
    ChevronDown, Search, ArrowLeftRight, X
} from 'lucide-react'
import { stationApi } from '../api/axios'

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const MODES = [
    { id: 'COMBINED', label: 'Combined', icon: Layers, color: 'text-purple-400', activeBg: 'bg-purple-500/10 border-purple-500/30 dark:bg-purple-500/10 dark:border-purple-500/30' },
    { id: 'FLIGHT', label: 'Flights', icon: Plane, color: 'text-sky-400', activeBg: 'bg-sky-500/10 border-sky-500/30 dark:bg-sky-500/10 dark:border-sky-500/30' },
    { id: 'TRAIN', label: 'Trains', icon: Train, color: 'text-emerald-400', activeBg: 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/10 dark:border-emerald-500/30' },
    { id: 'BUS', label: 'Buses', icon: Bus, color: 'text-amber-400', activeBg: 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/10 dark:border-amber-500/30' },
]

const FLIGHT_CLASSES = ['Economy', 'Premium Economy', 'Business', 'First Class']
const TRAIN_CLASSES = ['Sleeper (SL)', 'AC 3-Tier (3A)', 'AC 2-Tier (2A)', 'AC 1st Class (1A)', '2nd Sitting (2S)']
const BUS_CLASSES = ['Seater', 'Sleeper', 'AC Seater', 'AC Sleeper', 'AC Volvo']
const COMBINED_MODES = [
    { id: 'BALANCED', label: '⚖️ Balanced' },
    { id: 'CHEAPEST', label: '💰 Cheapest' },
    { id: 'FASTEST', label: '⚡ Fastest' },
]
const PASSENGERS = [1, 2, 3, 4, 5, 6]

/* ═══════════════════════════════════════════════════════
   CITY AUTOCOMPLETE INPUT
═══════════════════════════════════════════════════════ */
function CityInput({ id, label, icon: Icon, iconColor, value, onChange, placeholder }) {
    const [query, setQuery] = useState(value || '')
    const [suggestions, setSuggestions] = useState([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const containerRef = useRef(null)
    const debounceRef = useRef(null)

    // Sync external value resets (e.g. swap button)
    useEffect(() => { setQuery(value || '') }, [value])

    // Close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const fetchCities = useCallback((q) => {
        if (q.length < 1) { setSuggestions([]); setOpen(false); return }
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await stationApi.search(q)
                // The API may return stations; extract unique cities
                const cities = [...new Set(
                    (res.data || []).map(s => s.city || s.name || s).filter(Boolean)
                )]
                setSuggestions(cities)
                setOpen(cities.length > 0)
            } catch {
                setSuggestions([])
            } finally {
                setLoading(false)
            }
        }, 220)
    }, [])

    const handleChange = (e) => {
        const v = e.target.value
        setQuery(v)
        onChange(v)
        fetchCities(v)
    }

    const handleSelect = (city) => {
        setQuery(city)
        onChange(city)
        setOpen(false)
        setSuggestions([])
    }

    const handleClear = () => {
        setQuery('')
        onChange('')
        setSuggestions([])
        setOpen(false)
    }

    return (
        <div className="relative" ref={containerRef}>
            {/* Icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>

            <label
                htmlFor={id}
                className="absolute left-9 right-8 top-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide z-10 pointer-events-none truncate"
            >
                {label}
            </label>

            {/* Input */}
            <input
                id={id}
                type="text"
                value={query}
                onChange={handleChange}
                onFocus={() => query.length > 0 && suggestions.length > 0 && setOpen(true)}
                placeholder={placeholder}
                autoComplete="off"
                className="input-field pl-9 pt-5 pb-1.5 h-14 text-sm pr-8 truncate"
            />

            {/* Clear button */}
            {query && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}

            {/* Dropdown suggestions */}
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-dark-700 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-slide-down">
                    {loading ? (
                        <div className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">Searching...</div>
                    ) : suggestions.map((city, i) => (
                        <button
                            key={i}
                            type="button"
                            onMouseDown={() => handleSelect(city)}
                            className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-dark-600 hover:text-primary-700 dark:hover:text-primary-400 transition-colors flex items-center gap-3 border-b last:border-0 border-gray-100 dark:border-white/5"
                        >
                            <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            {city}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════
   FIELD SELECT (Passengers, Class, Sort)
═══════════════════════════════════════════════════════ */
function FieldSelect({ label, icon: Icon, iconColor, value, onChange, options, fullLabel = false }) {
    return (
        <div className="relative">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
            )}
            <label className={`absolute ${Icon ? 'left-9' : 'left-3'} right-6 top-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide z-10 pointer-events-none truncate`}>
                {label}
            </label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`input-field ${Icon ? 'pl-9' : 'pl-3'} pt-5 pb-1.5 h-14 text-sm appearance-none pr-8 cursor-pointer truncate`}
            >
                {options.map(o => (
                    <option key={typeof o === 'object' ? o.id : o} value={typeof o === 'object' ? o.id : o}>
                        {typeof o === 'object' ? o.label : o}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        </div>
    )
}

/* ═══════════════════════════════════════════════════════
   MAIN HERO SEARCH CARD
═══════════════════════════════════════════════════════ */
export default function HeroSearchCard() {
    const navigate = useNavigate()
    const pad = (n) => n.toString().padStart(2, '0')
    const d = new Date()
    const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    const [mode, setMode] = useState('COMBINED')
    const [origin, setOrigin] = useState('')
    const [destination, setDestination] = useState('')
    const [travelDate, setTravelDate] = useState(today)
    const [passengers, setPassengers] = useState('1')
    const [seatClass, setSeatClass] = useState('Economy')
    const [optimizationMode, setOptimizationMode] = useState('BALANCED')
    const [swapAnim, setSwapAnim] = useState(false)

    // Reset class to mode-appropriate default when mode changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (mode === 'FLIGHT') setSeatClass('Economy')
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (mode === 'TRAIN') setSeatClass('Sleeper (SL)')
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (mode === 'BUS') setSeatClass('Seater')
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (mode === 'COMBINED') setSeatClass('Economy')
    }, [mode])

    const classOptions = () => {
        if (mode === 'TRAIN') return TRAIN_CLASSES
        if (mode === 'BUS') return BUS_CLASSES
        return FLIGHT_CLASSES
    }

    const handleSwap = () => {
        setOrigin(destination)
        setDestination(origin)
        setSwapAnim(v => !v)
    }

    const handleSearch = (e) => {
        e.preventDefault()
        navigate('/search', {
            state: {
                searchParams: {
                    originCity: origin.trim(),
                    destinationCity: destination.trim(),
                    travelDate,
                    optimizationMode,
                    passengers: Number(passengers),
                    seatClass,
                    transportMode: mode !== 'COMBINED' ? mode : undefined,
                }
            }
        })
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* ── MODE TABS ── */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                {MODES.map(m => {
                    const Icon = m.icon
                    const active = mode === m.id
                    return (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => setMode(m.id)}
                            className={`
                                flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                                border transition-all duration-200
                                ${active
                                    ? `${m.activeBg} ${m.color} scale-105 shadow-lg`
                                    : 'bg-gray-100 dark:bg-dark-700/60 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/10'
                                }
                            `}
                        >
                            <Icon className={`w-4 h-4 ${active ? m.color : ''}`} />
                            {m.label}
                        </button>
                    )
                })}
            </div>

            {/* ── SEARCH CARD ── */}
            <form onSubmit={handleSearch} className="bg-white/90 dark:bg-dark-800/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl p-6 sm:p-8 space-y-5">

                {/* From / To with city dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                    <CityInput
                        id="search-from"
                        label="From"
                        icon={MapPin}
                        iconColor="text-primary-500 dark:text-primary-400"
                        value={origin}
                        onChange={setOrigin}
                        placeholder="Origin City"
                    />

                    {/* Swap */}
                    <button
                        type="button"
                        onClick={handleSwap}
                        className={`
                            absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20
                            hidden sm:flex w-8 h-8 rounded-full items-center justify-center
                            bg-white dark:bg-dark-600 border-2 border-gray-200 dark:border-white/10
                            hover:bg-primary-600 hover:border-primary-500 hover:text-white hover:shadow-lg hover:shadow-primary-500/20
                            transition-all duration-300 hover:scale-110 active:scale-95 text-gray-500 dark:text-gray-300
                            ${swapAnim ? 'rotate-180' : ''}
                        `}
                    >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>

                    <CityInput
                        id="search-to"
                        label="To"
                        icon={MapPin}
                        iconColor="text-emerald-500 dark:text-emerald-400"
                        value={destination}
                        onChange={setDestination}
                        placeholder="Destination City"
                    />
                </div>

                {/* ── SECOND ROW: context-sensitive fields ── */}
                <div className={`grid gap-3 ${mode === 'COMBINED' ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3'}`}>

                    {/* Date — always present */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                            <Calendar className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                        </div>
                        <label className="absolute left-9 right-4 top-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide z-10 pointer-events-none truncate">
                            Date
                        </label>
                        <input
                            type="date"
                            value={travelDate}
                            min={today}
                            onChange={e => setTravelDate(e.target.value)}
                            required
                            className="input-field pl-9 pt-5 pb-1.5 h-14 text-sm w-full"
                        />
                    </div>

                    {/* Passengers — always present */}
                    <FieldSelect
                        label="Passengers"
                        icon={Users}
                        iconColor="text-amber-500 dark:text-amber-400"
                        value={passengers}
                        onChange={setPassengers}
                        options={PASSENGERS.map(p => ({ id: String(p), label: `${p} ${p === 1 ? 'Adult' : 'Adults'}` }))}
                    />

                    {/* Class — flight/train/bus specific */}
                    {mode !== 'COMBINED' && (
                        <FieldSelect
                            label={mode === 'FLIGHT' ? 'Cabin Class' : mode === 'TRAIN' ? 'Coach Type' : 'Seat Type'}
                            value={seatClass}
                            onChange={setSeatClass}
                            options={classOptions()}
                        />
                    )}

                    {/* Sort Mode — only for Combined */}
                    {mode === 'COMBINED' && (
                        <>
                            <FieldSelect
                                label="Cabin"
                                value={seatClass}
                                onChange={setSeatClass}
                                options={FLIGHT_CLASSES}
                            />
                            <FieldSelect
                                label="Sort by"
                                value={optimizationMode}
                                onChange={setOptimizationMode}
                                options={COMBINED_MODES}
                            />
                        </>
                    )}
                </div>

                {/* ── SEARCH BUTTON ── */}
                <button
                    type="submit"
                    className="btn-primary w-full flex items-center justify-center gap-2 text-lg font-bold py-4 rounded-xl group hover:-translate-y-0.5 shadow-xl shadow-primary-500/25 mt-2"
                >
                    <Search className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
                    {mode === 'COMBINED' ? 'Search All Routes' : `Search ${MODES.find(m => m.id === mode)?.label}`}
                </button>
            </form>
        </div>
    )
}
