// SeatLegend.jsx — Color legend for seat map
export default function SeatLegend() {
    return (
        <div className="flex flex-wrap gap-4 items-center text-xs text-gray-400 mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
            <span className="font-semibold text-gray-300 mr-1">Legend:</span>
            <LegendItem color="bg-emerald-500/30 border-emerald-500" label="Selected (You)" />
            <LegendItem color="bg-gray-600/60 border-gray-500" label="Booked" />
            <LegendItem color="bg-blue-500/30 border-blue-400" label="Locked by others" />
            <LegendItem color="bg-white/10 border-white/20 hover:border-primary-500" label="Available" />
        </div>
    )
}

function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded border ${color} flex-shrink-0`} />
            <span>{label}</span>
        </div>
    )
}
