import { useMemo } from 'react'

/**
 * SeatMapFlight — Renders an aircraft cabin layout.
 * Props:
 *   seats          : array of { id, seatNo, rowNo, columnNo, seatClass, status, price }
 *   selectedSeats  : Set of seatNo strings
 *   onSeatClick    : (seat) => void
 *   lockedByOthers : Set of seatNo strings (from Redis, locked by other users)
 */
export default function SeatMapFlight({ seats = [], selectedSeats = new Set(), onSeatClick, lockedByOthers = new Set() }) {
    // Group seats by row
    const rows = useMemo(() => {
        const map = {}
        for (const seat of seats) {
            if (!map[seat.rowNo]) map[seat.rowNo] = {}
            map[seat.rowNo][seat.columnNo] = seat
        }
        return map
    }, [seats])

    const rowNums = Object.keys(rows).map(Number).sort((a, b) => a - b)
    // Find the aisle split — seats in left group (e.g., A,B,C) vs right (D,E,F)
    const allCols = seats.length > 0
        ? [...new Set(seats.map(s => s.columnNo))].sort()
        : ['A', 'B', 'C', 'D', 'E', 'F']
    const midpoint = Math.ceil(allCols.length / 2)
    const leftCols = allCols.slice(0, midpoint)
    const rightCols = allCols.slice(midpoint)

    const getSeatStyle = (seat) => {
        if (!seat) return 'invisible'
        const seatNo = seat.seatNo
        if (selectedSeats.has(seatNo)) return 'bg-emerald-500/40 border-emerald-400 text-emerald-200 cursor-pointer hover:scale-105'
        if (lockedByOthers.has(seatNo) || seat.status === 'LOCKED') return 'bg-blue-500/25 border-blue-400/60 text-blue-300 cursor-not-allowed'
        if (seat.status === 'BOOKED') return 'bg-gray-700/60 border-gray-600 text-gray-500 cursor-not-allowed'
        return 'bg-white/10 border-white/20 text-gray-300 cursor-pointer hover:border-primary-500 hover:bg-primary-500/20 hover:scale-105 transition-all'
    }

    const getClassBadge = (seatClass) => {
        if (!seatClass) return null
        const colors = {
            'First': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            'Business': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
            'Economy': 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        }
        return colors[seatClass] || colors['Economy']
    }

    let lastClass = null

    return (
        <div className="overflow-x-auto">
            {/* Column headers */}
            <div className="flex items-center mb-2 gap-1" style={{ paddingLeft: '3rem' }}>
                {leftCols.map(c => (
                    <div key={c} className="w-9 text-center text-xs text-gray-500 font-semibold">{c}</div>
                ))}
                <div className="w-6" /> {/* Aisle */}
                {rightCols.map(c => (
                    <div key={c} className="w-9 text-center text-xs text-gray-500 font-semibold">{c}</div>
                ))}
            </div>

            {rowNums.map(rowNum => {
                const rowSeats = rows[rowNum]
                const firstSeat = Object.values(rowSeats)[0]
                const currentClass = firstSeat?.seatClass
                const showClassDivider = currentClass !== lastClass
                lastClass = currentClass

                return (
                    <div key={rowNum}>
                        {showClassDivider && currentClass && (
                            <div className={`my-2 px-3 py-1 text-xs font-bold rounded border w-fit ${getClassBadge(currentClass)}`}>
                                {currentClass} Class
                            </div>
                        )}
                        <div className="flex items-center gap-1 mb-1">
                            {/* Row number */}
                            <div className="w-8 text-right text-xs text-gray-600 font-mono pr-1">{rowNum}</div>

                            {/* Left block */}
                            {leftCols.map(col => {
                                const seat = rowSeats[col]
                                return (
                                    <button
                                        key={col}
                                        type="button"
                                        disabled={!seat || seat.status === 'BOOKED' || (seat.status === 'LOCKED' && !selectedSeats.has(seat.seatNo))}
                                        onClick={() => seat && onSeatClick?.(seat)}
                                        title={seat ? `${seat.seatNo} — ${seat.seatClass} — ₹${seat.price} — ${seat.status}` : ''}
                                        className={`w-9 h-9 rounded-t-xl rounded-b text-xs font-bold border transition-all ${getSeatStyle(seat)}`}
                                    >
                                        {seat ? seat.columnNo : ''}
                                    </button>
                                )
                            })}

                            {/* Aisle */}
                            <div className="w-6" />

                            {/* Right block */}
                            {rightCols.map(col => {
                                const seat = rowSeats[col]
                                return (
                                    <button
                                        key={col}
                                        type="button"
                                        disabled={!seat || seat.status === 'BOOKED' || (seat.status === 'LOCKED' && !selectedSeats.has(seat.seatNo))}
                                        onClick={() => seat && onSeatClick?.(seat)}
                                        title={seat ? `${seat.seatNo} — ${seat.seatClass} — ₹${seat.price} — ${seat.status}` : ''}
                                        className={`w-9 h-9 rounded-t-xl rounded-b text-xs font-bold border transition-all ${getSeatStyle(seat)}`}
                                    >
                                        {seat ? seat.columnNo : ''}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
