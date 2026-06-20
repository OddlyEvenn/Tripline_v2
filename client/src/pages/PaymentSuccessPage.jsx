import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { bookingApi, ticketApi } from '../api/axios'
import { CheckCircle, CheckCircle2, Ticket, ArrowRight, Home, LayoutDashboard, Download } from 'lucide-react'
import { PageLoader } from '../components/Loaders'

export default function PaymentSuccessPage() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const [booking, setBooking] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        // The booking is confirmed via webhook. We poll once to get it.
        const fetchBooking = async () => {
            try {
                const res = await bookingApi.getUserBookings()
                const latest = res.data?.[0]
                if (latest && latest.status === 'PAID') {
                    setBooking(latest)
                    setLoading(false)
                } else {
                    // Retry in 2 seconds if not yet PAID
                    setTimeout(fetchBooking, 2000)
                }
            } catch {
                setLoading(false)
                setError(true)
            }
        }
        fetchBooking()
    }, [])

    const handleDownload = async (ticketId) => {
        try {
            const response = await ticketApi.download(ticketId)
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const a = document.createElement('a')
            a.href = url
            a.download = `ticket_${ticketId}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            // toast.error('Failed to download ticket. Please try again.') // Removed toast
            console.error('Failed to download ticket:', err)
        }
    }

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent">
            <div className="max-w-xl mx-auto pt-20 px-4">
                {loading ? (
                    <PageLoader />
                ) : error ? (
                    <div className="glass-card p-12 text-center border-red-500/20">
                        <p className="text-gray-400 mb-6">We're taking a bit longer than expected to confirm your payment.</p>
                        <button onClick={() => navigate('/dashboard')} className="btn-primary py-3 px-8">Go to Dashboard</button>
                    </div>
                ) : booking ? (
                    <div className="animate-fade-in">
                        {/* Success Banner */}
                        <div className="text-center mb-12 animate-slide-up">
                            <div className="relative inline-flex">
                                <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-3xl animate-pulse-slow" />
                                <div className="relative w-24 h-24 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                                </div>
                            </div>
                            <h1 className="text-5xl font-black text-white mt-4 mb-3 tracking-tight">Booking Confirmed!</h1>
                            <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
                                Your electronic tickets have been generated and sent to your email. You can also download them below.
                            </p>
                        </div>

                        <div className="grid gap-8">
                            {/* Summary Card */}
                            <div className="glass-card p-8 border-emerald-500/20">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 pb-8 border-b border-white/5">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Booking Reference</p>
                                        <p className="text-3xl font-black text-white italic">#TRIP-{booking.bookingId}</p>
                                    </div>
                                    <div className="sm:text-right">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Total Paid</p>
                                        <p className="text-3xl font-black text-emerald-400">₹{Number(booking.totalPrice).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    {booking.tickets?.map((ticket, idx) => (
                                        <div key={ticket.ticketId} className="relative group">
                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all duration-300">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">Leg {idx + 1}</span>
                                                        <span className="text-white/40 text-xs">ID: TL-{ticket.ticketId}</span>
                                                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase">{ticket.transportMode}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <span className="text-xl font-bold text-white">{ticket.originCity}</span>
                                                        <ArrowRight className="w-4 h-4 text-emerald-500" />
                                                        <span className="text-xl font-bold text-white">{ticket.destinationCity}</span>
                                                    </div>
                                                    <div className="space-y-1 text-sm text-gray-400">
                                                        <div>
                                                            Passenger: <span className="text-white font-semibold">{ticket.passengerName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span>Seat:</span>
                                                            <span className="text-emerald-400 font-bold text-base">
                                                                {ticket.coachNumber ? `${ticket.coachNumber} - ` : ''}{ticket.seatNumber || 'General'}
                                                            </span>
                                                            {ticket.seatClass && (
                                                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-semibold border border-purple-500/30">
                                                                    {ticket.seatClass}
                                                                </span>
                                                            )}
                                                            {ticket.berthType && (
                                                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs font-semibold border border-amber-500/30">
                                                                    {ticket.berthType === 'L' ? 'Lower' : ticket.berthType === 'M' ? 'Middle' : ticket.berthType === 'U' ? 'Upper' : ticket.berthType === 'SL' ? 'Side Lower' : ticket.berthType === 'SU' ? 'Side Upper' : ticket.berthType} Berth
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center gap-3 md:pl-6 md:border-l border-white/10 shrink-0">
                                                    {ticket.qrCode && (
                                                        <div className="p-2 bg-white rounded-lg shadow-2xl">
                                                            <img src={`data:image/png;base64,${ticket.qrCode}`} alt="Ticket QR" className="w-16 h-16" />
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => handleDownload(ticket.ticketId)}
                                                        className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20"
                                                    >
                                                        <Download className="w-3.5 h-3.5" /> Download PDF
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center py-4">
                                <Link to="/dashboard" className="btn-primary px-10 h-14 flex items-center justify-center gap-2 text-lg">
                                    <LayoutDashboard className="w-5 h-5" /> Travel Dashboard
                                </Link>
                                <Link to="/" className="btn-outline px-10 h-14 flex items-center justify-center gap-2 text-lg">
                                    Plan Another Trip
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card p-12 text-center border-red-500/20">
                        <p className="text-gray-400 mb-6">We're taking a bit longer than expected to confirm your payment.</p>
                        <Link to="/dashboard" className="btn-primary py-3 px-8">Go to Dashboard</Link>
                    </div>
                )}
            </div>
        </div>
    )
}

