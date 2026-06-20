import { ArrowRight } from 'lucide-react'

/**
 * PassengerSeatMapper — Shows a table of passengers → selected seats.
 * Props:
 *   passengers       : [{name, age, gender}]
 *   seatAssignments  : { passengerIndex: seatObject }
 *   onRemoveSeat     : (passengerIndex) => void
 *   pendingSeatIndex : which passenger is currently being assigned (highlighted)
 *   onSetPending     : (index) => void
 */
export default function PassengerSeatMapper({
    passengers = [],
    seatAssignments = {},
    onRemoveSeat,
    pendingSeatIndex,
    onSetPending,
}) {
    return (
        <div className="space-y-2">
            {passengers.map((p, i) => {
                const seat = seatAssignments[i]
                const isActive = pendingSeatIndex === i

                return (
                    <div
                        key={i}
                        onClick={() => onSetPending?.(i)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
              ${isActive
                                ? 'bg-primary-600/20 border-primary-500/60 shadow-glow'
                                : 'bg-white/5 border-white/10 hover:border-white/25'}`}
                    >
                        {/* Passenger index badge */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
              ${isActive ? 'bg-primary-600 text-white' : 'bg-white/10 text-gray-400'}`}>
                            {i + 1}
                        </div>

                        {/* Passenger name */}
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{p.name || `Passenger ${i + 1}`}</div>
                            {isActive && !seat && (
                                <div className="text-xs text-primary-400 animate-pulse mt-0.5">← Select a seat from the seat map</div>
                            )}
                        </div>

                        <ArrowRight className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-400' : 'text-gray-600'}`} />

                        {/* Seat assignment */}
                        {seat ? (
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <div className="text-sm font-bold text-emerald-400">
                                        {seat.coachNo ? `${seat.coachNo}-` : ''}{seat.seatNo}
                                    </div>
                                    {seat.seatClass && (
                                        <div className="text-xs text-gray-500">{seat.seatClass}</div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onRemoveSeat?.(i) }}
                                    className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center text-xs hover:bg-red-500/40 transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div className="text-xs text-gray-600 italic">No seat</div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
