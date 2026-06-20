import { useEffect, useState } from 'react'
import { bookingApi } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import JourneyTimeline from '../components/JourneyTimeline'
import toast from 'react-hot-toast'
import {
    Ticket, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp,
    Download, BarChart2, MapPin, Calendar, TrendingUp, Plane, Train, Bus,
    User, Settings, LogOut
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SectionLoader } from '../components/Loaders'

const STATUS_STYLES = {
    PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
    PAYMENT_INITIATED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    REFUNDED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

const STATUS_ICON = {
    PAID: <CheckCircle className="w-3.5 h-3.5" />,
    PENDING: <Clock className="w-3.5 h-3.5" />,
    CANCELLED: <XCircle className="w-3.5 h-3.5" />,
    PAYMENT_INITIATED: <AlertCircle className="w-3.5 h-3.5" />,
}

function BookingCard({ booking }) {
    const [expanded, setExpanded] = useState(false)

    const legs = booking.tickets?.map(t => ({
        tripId: t.ticketId,
        originCity: t.originCity,
        originStation: t.originCity,
        destinationCity: t.destinationCity,
        destinationStation: t.destinationCity,
        departureTime: t.departureTime,
        arrivalTime: t.arrivalTime,
        transportMode: t.transportMode,
        carrierName: t.carrierName,
        price: t.legPrice,
        layoverMinutesNextLeg: 0,
    })) || []

    const origin = legs[0]?.originCity || '—'
    const dest = legs[legs.length - 1]?.destinationCity || '—'
    const deptDate = legs[0]?.departureTime
        ? new Date(legs[0].departureTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : null

    const modeIcons = {
        FLIGHT: <Plane className="w-3 h-3 text-sky-500 dark:text-sky-400" />,
        TRAIN: <Train className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />,
        BUS: <Bus className="w-3 h-3 text-amber-500 dark:text-amber-400" />,
    }

    const firstCarrier = legs[0]?.carrierName
    const originStation = legs[0]?.originStation && legs[0]?.originStation !== origin ? `${origin} (${legs[0].originStation})` : origin
    const destStation = legs[legs.length - 1]?.destinationStation && legs[legs.length - 1]?.destinationStation !== dest ? `${dest} (${legs[legs.length - 1].destinationStation})` : dest

    return (
        <div className={`glass-card overflow-hidden transition-all duration-300 ${expanded ? 'ring-1 ring-primary-500/20' : ''}`}>
            <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Route: Station → Station */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-gray-900 dark:text-white font-bold text-sm">
                            {originStation} → {destStation}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING}`}>
                            {STATUS_ICON[booking.status]}
                            {booking.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span className="text-gray-500 dark:text-gray-600">#{booking.bookingId}</span>
                        {deptDate && (
                            <span className="flex items-center gap-1 text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {deptDate}
                            </span>
                        )}
                        {firstCarrier && (
                            <span className="text-gray-500">{firstCarrier}</span>
                        )}
                        {/* Mode icons */}
                        <div className="flex items-center gap-1">
                            {[...new Set(legs.map(l => l.transportMode))].map((m, i) => (
                                <span key={i}>{modeIcons[m]}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-gray-900 dark:text-white font-bold text-lg">₹{Number(booking.totalPrice).toLocaleString('en-IN')}</p>
                    </div>
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-600/60 border border-gray-200 dark:border-white/8 hover:border-gray-300 dark:hover:border-white/15 hover:bg-gray-200 dark:hover:bg-dark-600 transition-all"
                    >
                        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-300" />}
                    </button>
                </div>
            </div>

            {expanded && legs.length > 0 && (
                <div className="border-t border-white/5 px-5 pt-4 pb-5 animate-fade-in">
                    <JourneyTimeline legs={legs} />
                    {booking.status === 'PAID' && (
                        <div className="mt-4 flex justify-end">
                            <a
                                href={`/api/tickets/download/${booking.bookingId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300 bg-primary-500/10 border border-primary-500/20 px-3 py-2 rounded-lg transition-all hover:bg-primary-500/15"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download e-Ticket
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

const TABS = [
    { id: 'upcoming', label: 'Upcoming', statuses: ['PAID', 'PENDING', 'PAYMENT_INITIATED'] },
    { id: 'past', label: 'Past', statuses: ['CANCELLED', 'REFUNDED', 'COMPLETED'] },
]

export default function DashboardPage() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('upcoming')

    useEffect(() => {
        bookingApi.getUserBookings()
            .then(res => setBookings(res.data))
            .catch(() => toast.error('Failed to load bookings'))
            .finally(() => setLoading(false))
    }, [])

    const activeBookings = bookings.filter(b => ['PAID', 'PENDING', 'PAYMENT_INITIATED'].includes(b.status))
    const pastBookings = bookings.filter(b => ['CANCELLED', 'REFUNDED', 'COMPLETED'].includes(b.status))

    const displayedBookings = tab === 'upcoming' ? activeBookings : pastBookings
    const totalSpent = bookings.filter(b => b.status === 'PAID').reduce((s, b) => s + Number(b.totalPrice), 0)

    return (
        <div className="min-h-screen pt-20 pb-12 px-4">
            <div className="max-w-5xl mx-auto">

                {/* ── PROFILE HEADER ── */}
                <div className="glass-card p-6 mb-6 animate-slide-up">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-primary-600/30 flex-shrink-0">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                Hey, {user?.name?.split(' ')[0]}! 👋
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">{user?.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-600 mt-0.5">Member since {new Date().getFullYear()}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <button
                                onClick={() => navigate('/')}
                                className="btn-primary text-sm py-2 px-4"
                            >
                                Book New Trip
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── MAIN CONTENT (STATS + BOOKINGS) ── */}
                {loading ? (
                    <SectionLoader message="Fetching your journey details..." />
                ) : (
                    <>
                        {/* ── STATS ROW ── */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: 'Total Trips', value: bookings.length, icon: Ticket, color: 'text-primary-400 bg-primary-500/10' },
                                { label: 'Active', value: activeBookings.length, icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10' },
                                { label: 'Past Trips', value: pastBookings.length, icon: Clock, color: 'text-gray-500 dark:text-gray-400 bg-gray-500/10' },
                                { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-amber-400 bg-amber-500/10' },
                            ].map(s => {
                                const Icon = s.icon
                                return (
                                    <div key={s.label} className="glass p-4">
                                        <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                                            <Icon className={`w-4.5 h-4.5 ${s.color.split(' ')[0]}`} />
                                        </div>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                                    </div>
                                )
                            })}
                        </div>

                        {/* ── TABS + BOOKINGS ── */}
                        <div>
                            <div className="flex items-center gap-1 mb-5 bg-gray-100 dark:bg-dark-700/40 border border-gray-200 dark:border-white/5 p-1 rounded-xl w-fit">
                                {TABS.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTab(t.id)}
                                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === t.id
                                            ? 'bg-primary-600 text-white shadow-md'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {t.label}
                                        {t.id === 'upcoming' && activeBookings.length > 0 && (
                                            <span className="ml-2 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{activeBookings.length}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {displayedBookings.length === 0 ? (
                                <div className="glass-card p-14 text-center">
                                    <Ticket className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-gray-900 dark:text-gray-300 font-semibold mb-2">
                                        {tab === 'upcoming' ? 'No upcoming trips' : 'No past trips'}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-6">
                                        {tab === 'upcoming' ? 'Plan your next multi-modal journey!' : 'Your completed trips will appear here.'}
                                    </p>
                                    {tab === 'upcoming' && (
                                        <button onClick={() => navigate('/')} className="btn-primary">
                                            Search Routes
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {displayedBookings.map(b => <BookingCard key={b.bookingId} booking={b} />)}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
