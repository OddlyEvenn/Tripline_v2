/**
 * SeatMapTrain — Renders a train coach berth layout.
 * groups seats into compartments of 8 and shows berth type labels.
 */
export default function SeatMapTrain({ seats = [], selectedSeats = new Set(), onSeatClick, lockedByOthers = new Set() }) {
    if (seats.length === 0) {
        return <div className="text-gray-500 text-sm py-8 text-center">Select a coach to view seats</div>
    }

    const berthLabel = { L: 'Lower', M: 'Middle', U: 'Upper', SL: 'Side Lower', SU: 'Side Upper' }
    const berthOrder = ['L', 'M', 'U', 'SL', 'SU']

    // Split seats into 8-seat compartments (6 main + 2 side)
    const mainSeats = seats.filter(s => !['SL', 'SU'].includes(s.berthType))
    const sideSeats = seats.filter(s => ['SL', 'SU'].includes(s.berthType))

    // Group main seats into compartments of 6
    const COMP_SIZE = 6
    const compartments = []
    for (let i = 0; i < mainSeats.length; i += COMP_SIZE) {
        compartments.push(mainSeats.slice(i, i + COMP_SIZE))
    }
    // Group side seats into 2 per "side unit"
    const SIDE_SIZE = 2
    const sideUnits = []
    for (let i = 0; i < sideSeats.length; i += SIDE_SIZE) {
        sideUnits.push(sideSeats.slice(i, i + SIDE_SIZE))
    }

    const getSeatStyle = (seat) => {
        const seatNo = seat.seatNo
        if (selectedSeats.has(seatNo)) return 'bg-emerald-500/40 border-emerald-400 text-emerald-200 cursor-pointer'
        if (lockedByOthers.has(seatNo) || seat.status === 'LOCKED') return 'bg-blue-500/25 border-blue-400/60 text-blue-300 cursor-not-allowed'
        if (seat.status === 'BOOKED') return 'bg-gray-700/60 border-gray-600 text-gray-500 cursor-not-allowed'
        return 'bg-white/8 border-white/20 text-gray-300 cursor-pointer hover:border-primary-500 hover:bg-primary-500/20 transition-all'
    }

    const berthColor = {
        L: 'text-green-400', M: 'text-yellow-400', U: 'text-blue-400',
        SL: 'text-orange-400', SU: 'text-pink-400'
    }

    const renderSeat = (seat) => (
        <button
            key={seat.seatNo}
            type="button"
            disabled={seat.status === 'BOOKED' || (seat.status === 'LOCKED' && !selectedSeats.has(seat.seatNo))}
            onClick={() => onSeatClick?.(seat)}
            title={`Seat ${seat.seatNo} | ${berthLabel[seat.berthType] || seat.berthType} | ${seat.seatClass} | ₹${seat.price}`}
            className={`flex flex-col items-center justify-center rounded border px-2 py-1.5 text-xs font-bold transition-all ${getSeatStyle(seat)}`}
        >
            <span className="font-mono text-sm">{seat.seatNo}</span>
            <span className={`text-[10px] font-normal ${berthColor[seat.berthType] || 'text-gray-400'}`}>
                {berthLabel[seat.berthType] || seat.berthType}
            </span>
        </button>
    )

    return (
        <div className="space-y-6">
            {/* Side berths legend */}
            <div className="flex gap-2 flex-wrap">
                {berthOrder.map(b => (
                    <span key={b} className={`text-[11px] px-2 py-0.5 rounded border border-white/10 bg-white/5 ${berthColor[b]}`}>
                        {b} = {berthLabel[b]}
                    </span>
                ))}
            </div>

            {compartments.map((comp, ci) => {
                const lowerRow = comp.filter(s => s.berthType === 'L' || s.berthType === 'M')
                const upperRow = comp.filter(s => s.berthType === 'U')
                const sideUnit = sideUnits[ci]

                return (
                    <div key={ci} className="border border-white/10 rounded-xl p-4 bg-white/3">
                        <div className="text-xs text-gray-500 mb-2 font-semibold">
                            Compartment {ci + 1} — Seats {comp[0]?.seatNo}–{comp[comp.length - 1]?.seatNo}
                        </div>
                        <div className="flex gap-4">
                            {/* Main berths */}
                            <div className="flex-1 space-y-2">
                                <div className="text-[10px] text-gray-600 uppercase tracking-wider">Lower / Middle</div>
                                <div className="flex gap-2 flex-wrap">
                                    {comp.filter(s => ['L', 'M'].includes(s.berthType)).map(renderSeat)}
                                </div>
                                <div className="text-[10px] text-gray-600 uppercase tracking-wider mt-2">Upper</div>
                                <div className="flex gap-2 flex-wrap">
                                    {comp.filter(s => s.berthType === 'U').map(renderSeat)}
                                </div>
                            </div>

                            {/* Side berths */}
                            {sideUnit && sideUnit.length > 0 && (
                                <div className="border-l border-white/10 pl-4 min-w-16">
                                    <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Side</div>
                                    <div className="flex flex-col gap-2">
                                        {sideUnit.map(renderSeat)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
