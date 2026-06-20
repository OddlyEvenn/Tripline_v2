import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { searchApi } from '../api/axios'
import SearchBar from '../components/SearchBar'
import JourneyCard from '../components/JourneyCard'
import toast from 'react-hot-toast'
import { RouteSkeleton } from '../components/Loaders'
import {
    SlidersHorizontal, AlertCircle, Zap, Coins, Scale, X,
    Plane, Train, Bus, ChevronDown, ChevronUp, BarChart2
} from 'lucide-react'

const OPT_BUTTONS = [
    { id: 'BALANCED', label: 'Balanced', icon: Scale, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
    { id: 'CHEAPEST', label: 'Cheapest', icon: Coins, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    { id: 'FASTEST', label: 'Fastest', icon: Zap, color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
]

function FilterPanel({ filters, onChange, routes }) {
    const [open, setOpen] = useState(false)

    const priceRange = routes.length
        ? { min: Math.min(...routes.map(r => Number(r.totalPrice))), max: Math.max(...routes.map(r => Number(r.totalPrice))) }
        : { min: 0, max: 10000 }

    return (
        <div className="mb-5">
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-dark-700/60 border border-gray-200 dark:border-white/8 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/15 transition-all"
            >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {open ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>

            {open && (
                <div className="mt-3 glass-card p-5 animate-slide-down">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">

                        {/* Transport mode */}
                        <div>
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Mode</h4>
                            <div className="flex flex-col gap-1.5">
                                {['All', 'FLIGHT', 'TRAIN', 'BUS'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => onChange({ ...filters, mode: m === 'All' ? '' : m })}
                                        className={`text-left text-sm px-3 py-1.5 rounded-lg transition-all ${(filters.mode === m || (!filters.mode && m === 'All'))
                                                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                                                : 'text-gray-400 hover:text-white hover:bg-dark-600'
                                            }`}
                                    >
                                        {m === 'FLIGHT' ? '✈️' : m === 'TRAIN' ? '🚂' : m === 'BUS' ? '🚌' : '🌐'} {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Max price */}
                        <div>
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Max Price</h4>
                            <input
                                type="range"
                                min={priceRange.min}
                                max={priceRange.max}
                                value={filters.maxPrice || priceRange.max}
                                onChange={e => onChange({ ...filters, maxPrice: Number(e.target.value) })}
                                className="w-full accent-primary-500"
                            />
                            <p className="text-sm text-primary-400 font-semibold mt-1">₹{(filters.maxPrice || priceRange.max).toLocaleString('en-IN')}</p>
                        </div>

                        {/* Max transfers */}
                        <div>
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Max Stops</h4>
                            {[0, 1, 2].map(n => (
                                <button
                                    key={n}
                                    onClick={() => onChange({ ...filters, maxTransfers: filters.maxTransfers === n ? null : n })}
                                    className={`mr-2 mb-2 px-3 py-1 rounded-full text-xs border transition-all ${filters.maxTransfers === n
                                            ? 'bg-primary-600/20 text-primary-400 border-primary-500/30'
                                            : 'border-white/8 text-gray-400 hover:border-white/15 hover:text-white'
                                        }`}
                                >
                                    {n === 0 ? 'Non-stop' : `${n} stop${n > 1 ? 's' : ''}`}
                                </button>
                            ))}
                        </div>

                        {/* Max duration */}
                        <div>
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Max Duration</h4>
                            <input
                                type="range"
                                min={60}
                                max={2400}
                                step={60}
                                value={filters.maxDuration || 2400}
                                onChange={e => onChange({ ...filters, maxDuration: Number(e.target.value) })}
                                className="w-full accent-primary-500"
                            />
                            <p className="text-sm text-primary-400 font-semibold mt-1">
                                {Math.floor((filters.maxDuration || 2400) / 60)}h {(filters.maxDuration || 2400) % 60}m
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <button
                            onClick={() => onChange({ mode: '', maxPrice: null, maxTransfers: null, maxDuration: null })}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            Reset Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function SearchResultsPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [routes, setRoutes] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchParams, setSearchParams] = useState(location.state?.searchParams || null)
    const [selectedRoute, setSelectedRoute] = useState(null)
    const [optMode, setOptMode] = useState(searchParams?.optimizationMode || 'BALANCED')
    const [filters, setFilters] = useState({ mode: searchParams?.transportMode || '', maxPrice: null, maxTransfers: null, maxDuration: null })

    // Re-search instantly when optMode changes
    useEffect(() => {
        if (searchParams) {
            const newParams = { ...searchParams, optimizationMode: optMode }
            doSearch(newParams)
        }
    }, [optMode])

    const doSearch = async (params) => {
        setLoading(true)
        setRoutes([])
        setSelectedRoute(null)
        setSearchParams(params)
        try {
            const res = await searchApi.findRoutes(params)
            setRoutes(res.data)
            if (res.data.length === 0) toast('No routes found. Try a different date or city.', { icon: '🔍' })
        } catch (err) {
            toast.error(err.response?.data?.message || 'Search failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Apply client-side filters
    const filteredRoutes = useMemo(() => {
        return routes.filter(r => {
            if (filters.mode && !r.legs?.some(l => l.transportMode === filters.mode)) return false
            if (filters.maxPrice && Number(r.totalPrice) > filters.maxPrice) return false
            if (filters.maxTransfers !== null && r.transfers > filters.maxTransfers) return false
            if (filters.maxDuration && r.totalDurationMinutes > filters.maxDuration) return false
            return true
        })
    }, [routes, filters])

    const handleBook = () => {
        if (!selectedRoute) { toast.error('Please select a route first'); return }
        navigate('/booking', { state: { route: selectedRoute, searchParams } })
    }

    return (
        <div className="min-h-screen pt-20 pb-20 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Search Bar */}
                <div className="mb-6 animate-slide-up">
                    <SearchBar initialValues={searchParams} onSearch={doSearch} loading={loading} />
                </div>

                {/* Optimization Mode - Instant Switch */}
                {!loading && routes.length > 0 && (
                    <div className="flex items-center gap-3 mb-5 animate-fade-in flex-wrap">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Sort by:</span>
                        {OPT_BUTTONS.map(btn => {
                            const Icon = btn.icon
                            return (
                                <button
                                    key={btn.id}
                                    onClick={() => setOptMode(btn.id)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${optMode === btn.id
                                            ? `${btn.color} scale-105`
                                            : 'border-gray-200 dark:border-white/8 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-white/15'
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {btn.label}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Filter Panel */}
                {!loading && routes.length > 0 && (
                    <FilterPanel filters={filters} onChange={setFilters} routes={routes} />
                )}

                {/* Results Header */}
                {!loading && filteredRoutes.length > 0 && (
                    <div className="flex items-center justify-between mb-4 animate-fade-in">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            <span className="text-gray-900 dark:text-white font-semibold">{filteredRoutes.length}</span> routes found
                            {searchParams?.originCity && searchParams?.destinationCity && ` for ${searchParams.originCity} → ${searchParams.destinationCity}`}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>{optMode} mode</span>
                        </div>
                    </div>
                )}

                {/* LOADER */}
                {loading && (
                    <div className="py-12">
                        <RouteSkeleton />
                    </div>
                )}

                {/* Route Results */}
                {!loading && filteredRoutes.length > 0 && (
                    <div className="space-y-4 animate-fade-in">
                        {filteredRoutes.map((route, idx) => (
                            <JourneyCard
                                key={idx}
                                route={route}
                                selected={selectedRoute === route}
                                onSelect={setSelectedRoute}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && routes.length > 0 && filteredRoutes.length === 0 && (
                    <div className="text-center py-16 animate-fade-in">
                        <SlidersHorizontal className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <h3 className="text-gray-800 dark:text-gray-300 font-semibold mb-1">No routes match your filters</h3>
                        <p className="text-gray-500 text-sm mb-4">Try relaxing your filter criteria</p>
                        <button onClick={() => setFilters({ mode: '', maxPrice: null, maxTransfers: null, maxDuration: null })} className="btn-outline text-sm">
                            Clear All Filters
                        </button>
                    </div>
                )}

                {!loading && routes.length === 0 && searchParams && (
                    <div className="text-center py-20 animate-fade-in">
                        <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-300 mb-2">No routes found</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                            No trips between <strong className="text-gray-800 dark:text-gray-300">{searchParams.originCity}</strong> and{' '}
                            <strong className="text-gray-800 dark:text-gray-300">{searchParams.destinationCity}</strong> on this date.
                            <br />Try a different date or nearby city.
                        </p>
                    </div>
                )}

                {!loading && !searchParams && (
                    <div className="text-center py-20 text-gray-600 text-sm">
                        Use the search bar above to find routes.
                    </div>
                )}

                {/* Sticky Book Button */}
                {selectedRoute && (
                    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-4 animate-slide-up">
                        <div className="glass-card px-6 py-4 flex items-center gap-6 shadow-2xl shadow-black/60">
                            <div>
                                <p className="text-xs text-gray-500">Selected route total</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{Number(selectedRoute.totalPrice).toLocaleString('en-IN')}</p>
                            </div>
                            <button onClick={handleBook} className="btn-primary text-base px-8 flex items-center gap-2 group">
                                Continue to Booking
                                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
