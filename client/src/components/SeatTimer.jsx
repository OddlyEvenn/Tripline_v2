import { useEffect, useState } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

/**
 * SeatTimer — Shows a live countdown of the remaining seat lock time.
 * Calls onExpire when the timer hits zero.
 */
export default function SeatTimer({ initialSeconds = 300, onExpire }) {
    const [seconds, setSeconds] = useState(initialSeconds)

    useEffect(() => {
        if (seconds <= 0) {
            onExpire?.()
            return
        }
        const id = setInterval(() => setSeconds(s => s - 1), 1000)
        return () => clearInterval(id)
    }, [seconds, onExpire])

    const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
    const secs = String(seconds % 60).padStart(2, '0')
    const isWarning = seconds <= 60

    return (
        <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border animate-pulse
        ${isWarning
                    ? 'bg-red-900/30 border-red-500/40 text-red-400'
                    : 'bg-amber-900/20 border-amber-500/30 text-amber-300'}`}
        >
            {isWarning ? (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            ) : (
                <Clock className="w-4 h-4 flex-shrink-0" />
            )}
            <span>
                Seat{seconds > 1 ? 's' : ''} reserved for{' '}
                <span className="font-mono text-base">{mins}:{secs}</span>
            </span>
        </div>
    )
}
