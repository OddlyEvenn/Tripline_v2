import { useEffect, useState } from 'react'
import { adminApi } from '../../../api/axios'
import toast from 'react-hot-toast'
import { Search, MapPin, Plane, Train, Bus, User, CalendarDays } from 'lucide-react'
import { SectionCard, Pagination, EmptyState } from '../components/Shared'
import { SectionLoader } from '../../../components/Loaders'

export default function BookingsTab() {
    const [bookings, setBookings] = useState([])
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')

    const load = (p = 0) => {
        adminApi.getAllBookings({ page: p, size: 20 })
            .then(r => {
                const data = r.data?.content !== undefined ? r.data.content : (Array.isArray(r.data) ? r.data : [])
                setBookings(data)
                setTotalPages(r.data?.totalPages || 0)
                setPage(p)
            })
            .catch(() => toast.error('Failed to load'))
    }

    useEffect(() => { load(0) }, [])

    const statusColor = s => ({ CONFIRMED: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10', PAID: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10', CANCELLED: 'text-red-500 bg-red-50 dark:bg-red-500/10', PENDING: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10' }[s] || 'text-gray-500 bg-gray-100 dark:bg-dark-600')

    return (
        <SectionCard title={`All Bookings (${bookings.length})`} subtitle="Platform-wide booking records">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-white/6">
                            {['ID', 'Customer', 'Status', 'Total Fare', 'Booked On'].map(h => (
                                <th key={h} className="pb-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pr-6">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length === 0 && !searchTerm ? (
                            <tr><td colSpan={5}><SectionLoader message="Loading bookings..." /></td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan={5} className="py-12"><EmptyState message="No bookings found." /></td></tr>
                        ) : bookings.map(b => (
                            <tr key={b.id} className="border-b border-gray-50 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
                                <td className="py-3.5 pr-6 font-mono text-xs text-gray-500 dark:text-gray-400">#{b.id}</td>
                                <td className="py-3.5 pr-6">
                                    <p className="font-semibold text-gray-900 dark:text-white">{b.user?.name}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{b.user?.email}</p>
                                </td>
                                <td className="py-3.5 pr-6">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(b.status)}`}>{b.status}</span>
                                </td>
                                <td className="py-3.5 pr-6 font-bold text-primary-600 dark:text-primary-400">₹{Number(b.totalPrice).toLocaleString('en-IN')}</td>
                                <td className="py-3.5 text-xs text-gray-500 dark:text-gray-400">{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={load} />
        </SectionCard>
    )
}
