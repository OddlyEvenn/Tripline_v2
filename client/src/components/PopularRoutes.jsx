import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, TrendingUp, ChevronRight, Plane, Train, Bus } from 'lucide-react'
import { searchApi } from '../api/axios'

const STATIC_ROUTES = [
    { origin: 'Ahmedabad', destination: 'Mumbai', modes: ['BUS', 'TRAIN'], bookings: 1240, price: '₹800' },
    { origin: 'Delhi', destination: 'Srinagar', modes: ['TRAIN', 'FLIGHT'], bookings: 980, price: '₹3,200' },
    { origin: 'Mumbai', destination: 'Delhi', modes: ['FLIGHT'], bookings: 1860, price: '₹4,500' },
    { origin: 'Ahmedabad', destination: 'Srinagar', modes: ['BUS', 'FLIGHT'], bookings: 720, price: '₹5,100' },
    { origin: 'Delhi', destination: 'Jaipur', modes: ['BUS', 'TRAIN'], bookings: 2100, price: '₹450' },
    { origin: 'Pune', destination: 'Delhi', modes: ['TRAIN', 'FLIGHT'], bookings: 850, price: '₹3,800' },
    { origin: 'Bangalore', destination: 'Mumbai', modes: ['FLIGHT'], bookings: 1500, price: '₹2,800' },
    { origin: 'Chennai', destination: 'Hyderabad', modes: ['TRAIN', 'BUS'], bookings: 1100, price: '₹600' },
]

const ModeIcon = ({ mode }) => {
    if (mode === 'FLIGHT') return <Plane className="w-3 h-3 text-sky-400" />
    if (mode === 'TRAIN') return <Train className="w-3 h-3 text-emerald-400" />
    return <Bus className="w-3 h-3 text-amber-400" />
}

const modeColor = {
    FLIGHT: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    TRAIN: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    BUS: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

export default function PopularRoutes() {
    const navigate = useNavigate()
    const [routes, setRoutes] = useState(STATIC_ROUTES)

    const handleClick = (route) => {
        navigate('/search', {
            state: {
                searchParams: {
                    originCity: route.origin,
                    destinationCity: route.destination,
                    travelDate: new Date().toISOString().split('T')[0],
                    optimizationMode: 'BALANCED',
                }
            }
        })
    }

    return (
        <section className="py-4 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-400" />
                            Popular Routes
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Most booked journeys on Tripline</p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {routes.map((r, i) => (
                        <button
                            key={i}
                            onClick={() => handleClick(r)}
                            className="glass-card bg-white/60 dark:bg-dark-800/60 p-5 text-left hover:border-primary-500/30 dark:hover:border-primary-500/30 hover:bg-white/80 dark:hover:bg-dark-700/80 transition-all duration-300 group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary-600/10"
                        >
                            {/* Route rank */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 bg-gray-200/50 dark:bg-dark-600 px-2.5 py-1 rounded-full border border-gray-300/50 dark:border-white/5">
                                    #{i + 1} Popular
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" />
                            </div>

                            {/* Route */}
                            <div className="flex items-center gap-1.5 text-base font-bold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors mb-2">
                                <span>{r.origin}</span>
                                <div className="flex items-center gap-0.5 text-gray-600">
                                    <div className="w-4 h-px bg-gray-700" />
                                    <MapPin className="w-3 h-3" />
                                    <div className="w-4 h-px bg-gray-700" />
                                </div>
                                <span>{r.destination}</span>
                            </div>

                            {/* Modes */}
                            <div className="flex items-center gap-1.5 mb-3">
                                {r.modes.map((m, j) => (
                                    <span key={j} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${modeColor[m]}`}>
                                        <ModeIcon mode={m} />
                                        {m.charAt(0) + m.slice(1).toLowerCase()}
                                    </span>
                                ))}
                            </div>

                            {/* Price + bookings */}
                            <div className="flex items-center justify-between">
                                <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">From {r.price}</span>
                                <span className="text-gray-500 dark:text-gray-500 text-[11px]">{r.bookings.toLocaleString()} trips</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    )
}
