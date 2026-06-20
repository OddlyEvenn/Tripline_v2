import { useMemo } from 'react'

/**
 * SeatMapBus — Renders a bus layout (typically 2+2).
 */
export default function SeatMapBus({ seats = [], selectedSeats = new Set(), onSeatClick, lockedByOthers = new Set() }) {
    const rows = useMemo(() => {
        const map = {}
        for (const seat of seats) {
            if (!map[seat.rowNo]) map[seat.rowNo] = {}
            map[seat.rowNo][seat.columnNo] = seat
        }
        return map
    }, [seats])

    const rowNums = Object.keys(rows).map(Number).sort((a, b) => a - b)
    const allCols = seats.length > 0
        ? [...new Set(seats.map(s => s.columnNo))].sort()
        : ['A', 'B', 'C', 'D']
    const midIdx = Math.floor(allCols.length / 2)
    const leftCols = allCols.slice(0, midIdx)
    const rightCols = allCols.slice(midIdx)

    const getSeatStyle = (seat) => {
        const seatNo = seat.seatNo
        if (selectedSeats.has(seatNo)) return 'bg-emerald-500/40 border-emerald-400 text-emerald-200 cursor-pointer hover:scale-105'
        if (lockedByOthers.has(seatNo) || seat.status === 'LOCKED') return 'bg-blue-500/25 border-blue-400/60 text-blue-300 cursor-not-allowed'
        if (seat.status === 'BOOKED') return 'bg-gray-700/60 border-gray-600 text-gray-500 cursor-not-allowed'
        const isWindow = seat.seatType === 'Window'
        return `bg-white/10 ${isWindow ? 'border-amber-500/30' : 'border-white/20'} text-gray-300 cursor-pointer hover:border-primary-500 hover:bg-primary-500/20 hover:scale-105 transition-all`
    }

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Driver */}
            <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-gray-700/40 rounded-lg border border-gray-600/40 text-gray-400 text-sm w-full max-w-xs justify-center">
                🚌 Driver's Cabin
            </div>

            {/* Column headers */}
            <div className="flex items-center gap-1 mb-1">
                {leftCols.map(c => (
                    <div key={c} className="w-10 text-center text-xs text-gray-500 font-semibold">{c}</div>
                ))}
                <div className="w-5" />
                {rightCols.map(c => (
                    <div key={c} className="w-10 text-center text-xs text-gray-500 font-semibold">{c}</div>
                ))}
                <div className="w-8 text-center text-xs text-gray-600">#</div>
            </div>

            {rowNums.map(rowNum => {
                const rowSeats = rows[rowNum]
                return (
                    <div key={rowNum} className="flex items-center gap-1">
                        {leftCols.map(col => {
                            const seat = rowSeats[col]
                            return seat ? (
                                <button
                                    key={col}
                                    type="button"
                                    disabled={seat.status === 'BOOKED' || (seat.status === 'LOCKED' && !selectedSeats.has(seat.seatNo))}
                                    onClick={() => onSeatClick?.(seat)}
                                    title={`${seat.seatNo} — ${seat.seatType} — ₹${seat.price} — ${seat.status}`}
                                    className={`w-10 h-10 rounded text-xs font-bold border transition-all ${getSeatStyle(seat)}`}
                                >
                                    {seat.columnNo}
                                </button>
                            ) : <div key={col} className="w-10 h-10" />
                        })}

                        {/* Aisle */}
                        <div className="w-5" />

                        {rightCols.map(col => {
                            const seat = rowSeats[col]
                            return seat ? (
                                <button
                                    key={col}
                                    type="button"
                                    disabled={seat.status === 'BOOKED' || (seat.status === 'LOCKED' && !selectedSeats.has(seat.seatNo))}
                                    onClick={() => onSeatClick?.(seat)}
                                    title={`${seat.seatNo} — ${seat.seatType} — ₹${seat.price} — ${seat.status}`}
                                    className={`w-10 h-10 rounded text-xs font-bold border transition-all ${getSeatStyle(seat)}`}
                                >
                                    {seat.columnNo}
                                </button>
                            ) : <div key={col} className="w-10 h-10" />
                        })}

                        {/* Row number */}
                        <div className="w-8 text-center text-xs text-gray-600 font-mono">{rowNum}</div>
                    </div>
                )
            })}
        </div>
    )
}
