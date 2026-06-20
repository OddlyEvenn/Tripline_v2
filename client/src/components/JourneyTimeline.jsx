import { Plane, Train, Bus, Clock, ArrowRight, Building2 } from 'lucide-react'

const ModeIcon = ({ mode, size = 4 }) => {
    const cls = `w-${size} h-${size}`
    if (mode === 'FLIGHT') return <Plane className={`${cls} mode-icon-flight`} />
    if (mode === 'TRAIN') return <Train className={`${cls} mode-icon-train`} />
    return <Bus className={`${cls} mode-icon-bus`} />
}

const ModeBadge = ({ mode }) => {
    if (mode === 'FLIGHT') return <span className="badge-flight"><Plane className="w-3 h-3" />{mode}</span>
    if (mode === 'TRAIN') return <span className="badge-train"><Train className="w-3 h-3" />{mode}</span>
    return <span className="badge-bus"><Bus className="w-3 h-3" />{mode}</span>
}

function formatTime(dt) {
    if (!dt) return '--:--'
    return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDuration(minutes) {
    if (!minutes) return '0m'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function JourneyTimeline({ legs = [], compact = false }) {
    if (!legs.length) return null

    return (
        <div className="space-y-0">
            {legs.map((leg, idx) => (
                <div key={leg.tripId || idx}>
                    {/* Leg Row */}
                    <div className={`flex items-start gap-3 ${compact ? 'py-3' : 'py-4'}`}>
                        {/* Timeline Spine */}
                        <div className="flex flex-col items-center min-w-[32px]">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${leg.transportMode === 'FLIGHT' ? 'bg-sky-500/15 border border-sky-500/30' :
                                    leg.transportMode === 'TRAIN' ? 'bg-emerald-500/15 border border-emerald-500/30' :
                                        'bg-amber-500/15 border border-amber-500/30'
                                }`}>
                                <ModeIcon mode={leg.transportMode} size={3} />
                            </div>
                            {idx < legs.length - 1 && (
                                <div className="w-px bg-white/10 flex-1 mt-1" style={{ minHeight: '32px' }} />
                            )}
                        </div>

                        {/* Leg Details */}
                        <div className="flex-1 pb-1">
                            {/* Origin + Departure */}
                            <div className="flex items-baseline justify-between">
                                <div>
                                    <span className="text-gray-900 dark:text-white font-semibold">{leg.originCity}</span>
                                    {!compact && (
                                        <span className="text-gray-500 text-xs ml-2">{leg.originStation}</span>
                                    )}
                                </div>
                                <span className="text-gray-900 dark:text-white font-mono font-semibold text-sm">{formatTime(leg.departureTime)}</span>
                            </div>

                            {/* Carrier + Mode */}
                            {!compact && (
                                <div className="flex items-center gap-2 mt-1.5 mb-2">
                                    <ModeBadge mode={leg.transportMode} />
                                    <span className="text-gray-400 text-xs">{leg.carrierName}</span>
                                    <span className="text-gray-600 text-xs">·</span>
                                    <span className="text-gray-400 text-xs flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDuration(Math.round((new Date(leg.arrivalTime) - new Date(leg.departureTime)) / 60000))}
                                    </span>
                                    {leg.price && (
                                        <>
                                            <span className="text-gray-600 text-xs">·</span>
                                            <span className="text-primary-400 text-xs font-semibold">₹{Number(leg.price).toLocaleString('en-IN')}</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Destination + Arrival */}
                            <div className="flex items-baseline justify-between">
                                <div>
                                    <span className="text-gray-900 dark:text-white font-semibold">{leg.destinationCity}</span>
                                    {!compact && (
                                        <span className="text-gray-500 text-xs ml-2">{leg.destinationStation}</span>
                                    )}
                                </div>
                                <span className="text-gray-900 dark:text-white font-mono font-semibold text-sm">{formatTime(leg.arrivalTime)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Layover indicator between legs */}
                    {idx < legs.length - 1 && leg.layoverMinutesNextLeg > 0 && (
                        <div className="ml-10 flex items-center gap-2 py-2">
                            <div className="badge-layover">
                                <Clock className="w-3 h-3" />
                                {formatDuration(leg.layoverMinutesNextLeg)} layover in {leg.destinationCity}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
