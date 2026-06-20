import { useState } from 'react'
import { Clock, ArrowRight, ChevronDown, ChevronUp, Plane, Train, Bus } from 'lucide-react'
import JourneyTimeline from './JourneyTimeline'

function formatDuration(minutes) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatTime(dt) {
    if (!dt) return '--'
    return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const MiniModeIcon = ({ mode }) => {
    if (mode === 'FLIGHT') return <Plane className="w-3.5 h-3.5 text-sky-400" />
    if (mode === 'TRAIN') return <Train className="w-3.5 h-3.5 text-emerald-400" />
    return <Bus className="w-3.5 h-3.5 text-amber-400" />
}

/** IRCTC-style class availability badge */
function SeatClassBadge({ className, count, price }) {
    const isLow = count <= 5
    const isMed = count > 5 && count <= 20
    return (
        <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg border text-center min-w-[80px] transition-colors
            ${isLow ? 'bg-red-500/10 border-red-500/30' : isMed ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-[72px]">{className}</span>
            <span className={`text-sm font-bold ${isLow ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-emerald-400'}`}>
                {count} left
            </span>
            {price && (
                <span className="text-[10px] text-gray-500 mt-0.5">₹{Number(price).toLocaleString('en-IN')}</span>
            )}
        </div>
    )
}

export default function JourneyCard({ route, onSelect, selected = false }) {
    const [expanded, setExpanded] = useState(false)
    const { legs = [], totalPrice, totalDurationMinutes, transfers, departureTime, arrivalTime, totalLayoverMinutes } = route

    const uniqueModes = [...new Set(legs.map(l => l.transportMode))]

    // Aggregate availability across all legs (show first leg's availability for single-leg, summary for multi-leg)
    const primaryLeg = legs[0]
    const availability = primaryLeg?.availability || {}
    const classPrices = primaryLeg?.classPrices || {}
    const hasClassData = Object.keys(availability).length > 0
    const fallbackSeats = primaryLeg?.availableSeats

    return (
        <div className={`glass-card overflow-hidden transition-all duration-300 hover:border-primary-500/30 cursor-pointer
      ${selected ? 'border-primary-500/60 shadow-primary-600/20 shadow-lg' : ''}`}
            onClick={() => setExpanded(e => !e)}
        >
            {/* Summary Row */}
            <div className="p-5">
                <div className="flex items-center justify-between gap-4">
                    {/* Left: Time + Route */}
                    <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <span className="text-xl font-bold font-mono">{formatTime(departureTime)}</span>
                            <div className="flex items-center gap-1">
                                {uniqueModes.map((m, i) => (
                                    <span key={i} className="flex items-center gap-0.5">
                                        {i > 0 && <ArrowRight className="w-3 h-3 text-gray-600" />}
                                        <MiniModeIcon mode={m} />
                                    </span>
                                ))}
                            </div>
                            <span className="text-xl font-bold font-mono">{formatTime(arrivalTime)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <span>{legs[0]?.originCity}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span>{legs[legs.length - 1]?.destinationCity}</span>
                            {transfers > 0 && (
                                <span className="bg-dark-600 text-gray-400 px-2 py-0.5 rounded-full">
                                    {transfers} stop{transfers > 1 ? 's' : ''}
                                </span>
                            )}
                            {transfers === 0 && (
                                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-xs border border-emerald-500/20">
                                    Direct
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Center: Duration */}
                    <div className="hidden sm:flex flex-col items-center text-center">
                        <span className="text-gray-400 text-sm"><Clock className="w-3.5 h-3.5 inline mr-1" />{formatDuration(totalDurationMinutes)}</span>
                        {totalLayoverMinutes > 0 && (
                            <span className="text-gray-600 text-xs mt-0.5">{formatDuration(totalLayoverMinutes)} layover</span>
                        )}
                    </div>

                    {/* Right: Price + CTA */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            ₹<span>{Number(totalPrice).toLocaleString('en-IN')}</span>
                        </div>
                        <button
                            className={`btn-primary text-sm py-2 px-4 ${selected ? 'bg-primary-500' : ''}`}
                            onClick={(e) => { e.stopPropagation(); onSelect && onSelect(route) }}
                        >
                            {selected ? 'Selected ✓' : 'Book Now'}
                        </button>
                    </div>
                </div>

                {/* IRCTC-style Class Availability Badges */}
                {hasClassData && (
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Availability:</span>
                        {Object.entries(availability).map(([cls, count]) => (
                            <SeatClassBadge
                                key={cls}
                                className={cls}
                                count={count}
                                price={classPrices[cls]}
                            />
                        ))}
                    </div>
                )}
                {!hasClassData && fallbackSeats !== undefined && fallbackSeats !== null && (
                    <div className="mt-3 flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
                            ${fallbackSeats <= 5 ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                : fallbackSeats <= 20 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                            {fallbackSeats} seats available
                        </span>
                    </div>
                )}

                {/* Expand Toggle */}
                <button
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mt-3 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
                >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? 'Hide details' : 'Show journey details'}
                </button>
            </div>

            {/* Expanded Timeline */}
            {expanded && (
                <div className="border-t border-white/5 px-5 pt-4 pb-5 animate-fade-in">
                    <JourneyTimeline legs={legs} />
                </div>
            )}
        </div>
    )
}
