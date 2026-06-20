import { useState, useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { bookingApi, paymentApi, seatApi } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import JourneyTimeline from '../components/JourneyTimeline'
import SeatMapFlight from '../components/SeatMapFlight'
import SeatMapBus from '../components/SeatMapBus'
import SeatMapTrain from '../components/SeatMapTrain'
import SeatLegend from '../components/SeatLegend'
import SeatTimer from '../components/SeatTimer'
import CoachSelector from '../components/CoachSelector'
import PassengerSeatMapper from '../components/PassengerSeatMapper'
import toast from 'react-hot-toast'
import { User, Plus, Trash2, CreditCard, MapPin, ChevronRight, ChevronLeft } from 'lucide-react'

const emptyPassenger = () => ({ name: '', age: '', gender: 'MALE' })

// Steps: 0 = Passengers, 1 = Seats, 2 = Review & Pay
const STEPS = ['Passengers', 'Select Seats', 'Review & Pay']

export default function BookingPage() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const { user, token } = useAuth()
    const route = state?.route

    const [step, setStep] = useState(0)
    const [passengers, setPassengers] = useState([{ ...emptyPassenger(), name: user?.name || '' }])
    const [loading, setLoading] = useState(false)

    // Seat selection state (per leg)
    const [currentLegIdx, setCurrentLegIdx] = useState(0)
    const [seatMaps, setSeatMaps] = useState({}) // tripId -> { seats, coaches, mode, ... }
    const [selectedCoach, setSelectedCoach] = useState({}) // tripId -> coachNo
    const [coachSeats, setCoachSeats] = useState({}) // "tripId:coachNo" -> seats[]
    // seatAssignments: { legIdx: { passengerIdx: seatObject } }
    const [seatAssignments, setSeatAssignments] = useState({})
    const [pendingPassengerIdx, setPendingPassengerIdx] = useState(0)
    const [lockedSeats, setLockedSeats] = useState({}) // seatNo -> true (locked by us)
    const [lockTimerStarted, setLockTimerStarted] = useState(false)
    const [seatMapLoading, setSeatMapLoading] = useState(false)

    useEffect(() => {
        if (!route) {
            navigate('/search')
        }
    }, [route, navigate])

    const legs = route?.legs || []
    const tripIds = legs.map(l => l.tripId)

    // ----------------------------------------------------------------
    // Passenger form helpers
    // ----------------------------------------------------------------
    const addPassenger = () => {
        if (passengers.length >= (legs[0]?.availableSeats || 9)) {
            toast.error('Max passengers reached for this route'); return
        }
        setPassengers(p => [...p, emptyPassenger()])
    }
    const removePassenger = (i) => {
        if (passengers.length <= 1) return
        setPassengers(p => p.filter((_, idx) => idx !== i))
        // Also remove their seat assignments
        setSeatAssignments(prev => {
            const newA = { ...prev }
            for (const li in newA) {
                const legAssignments = { ...newA[li] }
                delete legAssignments[i]
                newA[li] = legAssignments
            }
            return newA
        })
    }
    const setField = (i, key, val) =>
        setPassengers(p => p.map((p2, idx) => idx === i ? { ...p2, [key]: val } : p2))

    const validatePassengers = () => {
        for (const p of passengers) {
            if (!p.name.trim()) { toast.error('Please enter all passenger names'); return false }
        }
        return true
    }

    // ----------------------------------------------------------------
    // Seat map loading
    // ----------------------------------------------------------------
    const loadSeatMap = async (tripId) => {
        if (seatMaps[tripId]) return // already loaded
        setSeatMapLoading(true)
        try {
            const res = await seatApi.getSeatMap(tripId)
            setSeatMaps(prev => ({ ...prev, [tripId]: res.data }))
        } catch (err) {
            toast.error('Failed to load seat map: ' + (err.response?.data?.message || err.message))
            setSeatMaps(prev => ({ ...prev, [tripId]: { _loaded: true } }))
        } finally {
            setSeatMapLoading(false)
        }
    }

    const loadCoachSeats = async (tripId, coachNo) => {
        const key = `${tripId}:${coachNo}`
        if (coachSeats[key]) return
        try {
            const res = await seatApi.getCoachSeats(tripId, coachNo)
            setCoachSeats(prev => ({ ...prev, [key]: res.data }))
        } catch {
            toast.error('Failed to load coach seats')
        }
    }

    const handleCoachSelect = (tripId, coachNo) => {
        setSelectedCoach(prev => ({ ...prev, [tripId]: coachNo }))
        loadCoachSeats(tripId, coachNo)
    }

    // ----------------------------------------------------------------
    // Seat selection
    // ----------------------------------------------------------------
    const getCurrentLegTripId = () => legs[currentLegIdx]?.tripId
    // transportMode from the leg (API returns 'transportMode' not 'mode')
    const getCurrentTransportMode = () =>
        legs[currentLegIdx]?.transportMode || seatMaps[legs[currentLegIdx]?.tripId]?.transportMode

    const isAlreadySelected = (seatNo) => {
        const legAssignments = seatAssignments[currentLegIdx] || {}
        return Object.values(legAssignments).some(s => s.seatNo === seatNo)
    }

    const getSelectedSeatNos = () => {
        const legAssignments = seatAssignments[currentLegIdx] || {}
        return new Set(Object.values(legAssignments).map(s => s.seatNo))
    }

    const handleSeatClick = useCallback(async (seat) => {
        const tripId = getCurrentLegTripId()
        const mode = getCurrentTransportMode()

        // For trains: seatNo in API must be "coachNo:seatNo" composite
        const lockKey = (mode === 'TRAIN' && seat.coachNo)
            ? `${seat.coachNo}:${seat.seatNo}`
            : seat.seatNo

        // Check if this passenger already has a seat
        const legAssignments = seatAssignments[currentLegIdx] || {}
        if (legAssignments[pendingPassengerIdx]) {
            // Unlock old seat first (using the stored lockKey)
            const oldSeat = legAssignments[pendingPassengerIdx]
            const oldLockKey = oldSeat._lockKey || oldSeat.seatNo
            await handleUnlockSeat(tripId, oldLockKey, mode)
        }

        // Lock the new seat via API
        const locked = await handleLockSeat(tripId, lockKey, mode)
        if (!locked) return

        setSeatAssignments(prev => ({
            ...prev,
            [currentLegIdx]: {
                ...(prev[currentLegIdx] || {}),
                [pendingPassengerIdx]: { ...seat, _lockKey: lockKey }
            }
        }))

        if (!lockTimerStarted) setLockTimerStarted(true)

        // Move to next unassigned passenger
        const nextUnassigned = passengers.findIndex((_, i) =>
            i !== pendingPassengerIdx && !((seatAssignments[currentLegIdx] || {})[i])
        )
        if (nextUnassigned !== -1) setPendingPassengerIdx(nextUnassigned)
    }, [currentLegIdx, pendingPassengerIdx, passengers, seatAssignments, lockTimerStarted])

    const handleRemoveSeat = async (passengerIdx) => {
        const tripId = getCurrentLegTripId()
        const mode = getCurrentTransportMode()
        const seat = (seatAssignments[currentLegIdx] || {})[passengerIdx]
        if (seat) {
            const lockKey = seat._lockKey || seat.seatNo
            await handleUnlockSeat(tripId, lockKey, mode)
            setSeatAssignments(prev => {
                const legAssignments = { ...(prev[currentLegIdx] || {}) }
                delete legAssignments[passengerIdx]
                return { ...prev, [currentLegIdx]: legAssignments }
            })
        }
        setPendingPassengerIdx(passengerIdx)
    }

    const handleLockSeat = async (tripId, seatNo, mode) => {
        try {
            const res = await seatApi.lockSeat(tripId, seatNo)
            if (res.data.locked) {
                setLockedSeats(prev => ({ ...prev, [seatNo]: true }))
                return true
            } else {
                toast.error(res.data.message || 'Seat already taken')
                return false
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not lock seat')
            return false
        }
    }

    const handleUnlockSeat = async (tripId, seatNo, mode) => {
        try {
            await seatApi.unlockSeat(tripId, seatNo)
            setLockedSeats(prev => { const n = { ...prev }; delete n[seatNo]; return n })
        } catch { /* silent */ }
    }

    const allSeatsAssigned = () => {
        for (let li = 0; li < legs.length; li++) {
            const assignments = seatAssignments[li] || {}
            if (Object.keys(assignments).length < passengers.length) return false
        }
        return true
    }

    // ----------------------------------------------------------------
    // Final booking
    // ----------------------------------------------------------------
    const handleBook = async () => {
        setLoading(true)
        try {
            const passengersPayload = passengers.map((p, i) => {
                // Gather seat data for first leg (multi-leg uses same passenger across legs)
                const firstLegSeat = (seatAssignments[0] || {})[i]
                return {
                    name: p.name,
                    email: user?.email,
                    phone: p.phone || null,
                    seatNumber: firstLegSeat?.seatNo || null,
                    coachNumber: firstLegSeat?.coachNo || null,
                    seatClass: firstLegSeat?.seatClass || null,
                    berthType: firstLegSeat?.berthType || null,
                }
            })

            // For multi-leg, build per-leg passengers
            const legsPassengers = tripIds.map((tripId, li) =>
                passengers.map((p, i) => {
                    const seat = (seatAssignments[li] || {})[i]
                    return {
                        name: p.name,
                        email: user?.email,
                        phone: p.phone || null,
                        seatNumber: seat?.seatNo || null,
                        coachNumber: seat?.coachNo || null,
                        seatClass: seat?.seatClass || null,
                        berthType: seat?.berthType || null,
                    }
                })
            )

            // Flatten passengers matching number of tripIds (one passenger per leg-passenger pair)
            const flatPassengers = []
            for (let li = 0; li < tripIds.length; li++) {
                for (let pi = 0; pi < passengers.length; pi++) {
                    const seat = (seatAssignments[li] || {})[pi]
                    flatPassengers.push({
                        name: passengers[pi].name,
                        email: user?.email,
                        seatNumber: seat?.seatNo || null,
                        coachNumber: seat?.coachNo || null,
                        seatClass: seat?.seatClass || null,
                        berthType: seat?.berthType || null,
                    })
                }
            }

            const bookingRes = await bookingApi.create({
                tripIds,
                passengers: passengersPayload
            })
            const bookingId = bookingRes.data.bookingId
            const sessionRes = await paymentApi.createSession({ bookingId })
            window.location.href = sessionRes.data.sessionUrl
        } catch (err) {
            toast.error(err.response?.data?.message || 'Booking failed. Please try again.')
            setLoading(false)
        }
    }

    const handleTimerExpire = async () => {
        toast.error('Your seat locks have expired. Please reselect seats.')
        setSeatAssignments({})
        setLockedSeats({})
        setLockTimerStarted(false)
        setStep(1)
        // Reload seat maps
        setSeatMaps({})
        setCoachSeats({})
    }

    // ----------------------------------------------------------------
    // Step navigation
    // ----------------------------------------------------------------
    const goToStep = async (nextStep) => {
        if (nextStep === 1) {
            if (!validatePassengers()) return
            // Load first leg seat map
            const firstTripId = legs[0]?.tripId
            if (firstTripId) await loadSeatMap(firstTripId)
        }
        setStep(nextStep)
    }

    // ----------------------------------------------------------------
    // Render
    // ----------------------------------------------------------------
    const currentTripId = getCurrentLegTripId()
    const currentSeatMap = seatMaps[currentTripId] || {}
    const transportMode = getCurrentTransportMode()
    const currentCoach = selectedCoach[currentTripId]
    const currentCoachSeats = coachSeats[`${currentTripId}:${currentCoach}`] || []
    const selectedSeatNos = getSelectedSeatNos()

    // Calculate total — use seat prices if available
    const totalPrice = (() => {
        let total = 0
        for (let pi = 0; pi < passengers.length; pi++) {
            const firstLegSeat = (seatAssignments[0] || {})[pi]
            if (firstLegSeat?.price) {
                total += Number(firstLegSeat.price) * legs.length
            } else {
                total += Number(route?.totalPrice || 0)
            }
        }
        return total
    })()

    if (!route) return null

    return (
        <div className="min-h-screen pt-20 pb-16 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Step indicator */}
                <div className="mb-8 animate-slide-up">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Complete Booking</h1>
                    <div className="flex items-center gap-2">
                        {STEPS.map((s, i) => (
                            <div key={i} className="flex items-center">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all
                  ${step === i ? 'bg-primary-600 text-white' : step > i ? 'bg-emerald-600/30 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs
                    ${step === i ? 'bg-white text-primary-600' : step > i ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                                        {step > i ? '✓' : i + 1}
                                    </span>
                                    {s}
                                </div>
                                {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Main content */}
                    <div className="lg:col-span-2">

                        {/* STEP 0: Passengers */}
                        {step === 0 && (
                            <div className="space-y-6 animate-fade-in">
                                {passengers.map((p, i) => (
                                    <div key={i} className="glass-card p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-primary-600/20 border border-primary-500/30 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-primary-400" />
                                                </div>
                                                <h3 className="text-gray-900 dark:text-white font-semibold">Passenger {i + 1}</h3>
                                            </div>
                                            {i > 0 && (
                                                <button type="button" onClick={() => removePassenger(i)}
                                                    className="text-red-400 hover:text-red-300 p-1 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid sm:grid-cols-3 gap-4">
                                            <div className="sm:col-span-1">
                                                <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-semibold">Full Name</label>
                                                <input type="text" required value={p.name}
                                                    onChange={e => setField(i, 'name', e.target.value)}
                                                    className="input-field" placeholder="Full name" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-semibold">Age</label>
                                                <input type="number" min="1" max="120" value={p.age || ''}
                                                    onChange={e => setField(i, 'age', e.target.value)}
                                                    className="input-field" placeholder="Age" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-semibold">Gender</label>
                                                <select value={p.gender} onChange={e => setField(i, 'gender', e.target.value)} className="input-field">
                                                    <option value="MALE">Male</option>
                                                    <option value="FEMALE">Female</option>
                                                    <option value="OTHER">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button type="button" onClick={addPassenger}
                                    className="flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
                                    <Plus className="w-4 h-4" /> Add Passenger
                                </button>

                                <button onClick={() => goToStep(1)}
                                    className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4">
                                    Continue to Seat Selection <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* STEP 1: Seat Selection */}
                        {step === 1 && (
                            <div className="animate-fade-in space-y-6">
                                {/* Lock timer */}
                                {lockTimerStarted && (
                                    <SeatTimer initialSeconds={300} onExpire={handleTimerExpire} />
                                )}

                                {/* Leg selector (for multi-leg) */}
                                {legs.length > 1 && (
                                    <div className="flex gap-2 flex-wrap">
                                        {legs.map((leg, li) => (
                                            <button key={li} type="button"
                                                onClick={async () => {
                                                    setCurrentLegIdx(li)
                                                    setPendingPassengerIdx(0)
                                                    if (leg.tripId) await loadSeatMap(leg.tripId)
                                                }}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all
                          ${currentLegIdx === li ? 'bg-primary-600 border-primary-500 text-white' : 'bg-white/5 border-white/15 text-gray-300 hover:border-white/30'}`}>
                                                Leg {li + 1}: {leg.origin} → {leg.destination}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Passenger ↔ Seat mapper */}
                                <div className="glass-card p-5">
                                    <h3 className="text-gray-900 dark:text-white font-semibold mb-3 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary-400" />
                                        Passenger → Seat Assignment
                                    </h3>
                                    <PassengerSeatMapper
                                        passengers={passengers}
                                        seatAssignments={seatAssignments[currentLegIdx] || {}}
                                        onRemoveSeat={handleRemoveSeat}
                                        pendingSeatIndex={pendingPassengerIdx}
                                        onSetPending={setPendingPassengerIdx}
                                    />
                                </div>

                                {/* Seat map */}
                                <div className="glass-card p-5 overflow-auto">
                                    <h3 className="text-gray-900 dark:text-white font-semibold mb-4">
                                        Seat Map — {legs[currentLegIdx]?.origin} → {legs[currentLegIdx]?.destination}
                                        {transportMode && <span className="ml-2 text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded">{transportMode}</span>}
                                    </h3>

                                    {/* Train coach selector */}
                                    {transportMode === 'TRAIN' && currentSeatMap.coaches && (
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 mb-2">Select Coach:</p>
                                            <CoachSelector
                                                coaches={currentSeatMap.coaches}
                                                selectedCoach={currentCoach}
                                                onSelect={(coachNo) => handleCoachSelect(currentTripId, coachNo)}
                                            />
                                        </div>
                                    )}

                                    {/* Class availability pills — shown above the map */}
                                    {currentSeatMap.availability && Object.keys(currentSeatMap.availability).length > 0 && (
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            <span className="text-xs text-gray-600 dark:text-gray-400 self-center font-semibold uppercase tracking-wider">Availability:</span>
                                            {Object.entries(currentSeatMap.availability).map(([cls, count]) => {
                                                const price = currentSeatMap.classPrices?.[cls]
                                                const isLow = count <= 5
                                                const isMed = count > 5 && count <= 20
                                                return (
                                                    <div key={cls} className={`flex flex-col items-center px-3 py-1.5 rounded-lg border text-center
                                                        ${isLow ? 'bg-red-500/10 border-red-500/30' : isMed ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{cls}</span>
                                                        <span className={`text-sm font-bold ${isLow ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-emerald-400'}`}>{count} left</span>
                                                        {price && <span className="text-[10px] text-gray-500">₹{Number(price).toLocaleString('en-IN')}</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {transportMode === 'FLIGHT' && currentSeatMap.seats && (
                                        <SeatMapFlight
                                            seats={currentSeatMap.seats}
                                            selectedSeats={selectedSeatNos}
                                            onSeatClick={handleSeatClick}
                                        />
                                    )}
                                    {transportMode === 'BUS' && currentSeatMap.seats && (
                                        <SeatMapBus
                                            seats={currentSeatMap.seats}
                                            selectedSeats={selectedSeatNos}
                                            onSeatClick={handleSeatClick}
                                        />
                                    )}
                                    {transportMode === 'TRAIN' && (
                                        <SeatMapTrain
                                            seats={currentCoachSeats}
                                            selectedSeats={selectedSeatNos}
                                            onSeatClick={handleSeatClick}
                                        />
                                    )}

                                    {/* Loading state */}
                                    {seatMapLoading && (
                                        <div className="text-center py-12 text-gray-500">
                                            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                            Loading seat map...
                                        </div>
                                    )}

                                    {/* No seats configured — show graceful fallback */}
                                    {!seatMapLoading && !currentSeatMap.seats && !currentSeatMap.coaches && currentSeatMap.tripId && (
                                        <div className="text-center py-10 text-gray-500">
                                            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <MapPin className="w-6 h-6 text-gray-500" />
                                            </div>
                                            <p className="text-gray-400 font-medium">No seat map configured</p>
                                            <p className="text-gray-600 text-sm mt-1">This vehicle does not have a seat layout. You can proceed to general seating.</p>
                                        </div>
                                    )}

                                    <SeatLegend />
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep(0)} className="btn-secondary flex items-center gap-2">
                                        <ChevronLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={!allSeatsAssigned()}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Review & Pay <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Review & Pay */}
                        {step === 2 && (
                            <div className="animate-fade-in space-y-6">
                                <div className="glass-card p-6">
                                    <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Booking Summary</h3>

                                    {passengers.map((p, i) => {
                                        const allLegSeats = legs.map((leg, li) => (seatAssignments[li] || {})[i])
                                        return (
                                            <div key={i} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b border-gray-100 dark:border-white/5 last:border-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-6 h-6 bg-primary-600/30 rounded-full flex items-center justify-center text-xs font-bold text-primary-400">{i + 1}</div>
                                                    <span className="text-gray-900 dark:text-white font-semibold">{p.name}</span>
                                                </div>
                                                <div className="ml-8 space-y-1">
                                                    {legs.map((leg, li) => {
                                                        const seat = allLegSeats[li]
                                                        return (
                                                            <div key={li} className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-600 dark:text-gray-400">{leg.origin} → {leg.destination}</span>
                                                                {seat ? (
                                                                    <span className="text-emerald-400 font-semibold">
                                                                        {seat.coachNo ? `${seat.coachNo}-` : ''}{seat.seatNo}
                                                                        {seat.seatClass ? ` (${seat.seatClass})` : ''}
                                                                        {seat.berthType ? ` · ${seat.berthType}` : ''}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-600 italic text-xs">General</span>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                                        <ChevronLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button
                                        onClick={handleBook}
                                        disabled={loading}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2 text-base py-4"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <CreditCard className="w-5 h-5" />
                                        )}
                                        {loading ? 'Processing...' : `Pay ₹${totalPrice.toLocaleString('en-IN')} via Stripe`}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right: Journey Summary */}
                    <div className="space-y-4">
                        <div className="glass-card p-5">
                            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Journey Summary</h3>
                            <JourneyTimeline legs={route.legs} compact={false} />
                            <div className="border-t border-gray-100 dark:border-white/5 mt-4 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Passengers</span>
                                    <span className="text-gray-900 dark:text-white">{passengers.length}</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                                    <span>Total</span>
                                    <span className="text-xl text-primary-600 dark:text-primary-400">₹{totalPrice.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Seat assignments summary */}
                        {step >= 1 && Object.keys(seatAssignments).length > 0 && (
                            <div className="glass-card p-4">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Seat Assignments</h4>
                                {legs.map((leg, li) => {
                                    const assignments = seatAssignments[li] || {}
                                    return Object.keys(assignments).length > 0 ? (
                                        <div key={li} className="mb-2">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{leg.origin} → {leg.destination}</div>
                                            {Object.entries(assignments).map(([pi, seat]) => (
                                                <div key={pi} className="flex justify-between text-xs py-0.5">
                                                    <span className="text-gray-600 dark:text-gray-400">{passengers[pi]?.name}</span>
                                                    <span className="text-emerald-400 font-semibold">
                                                        {seat.coachNo ? `${seat.coachNo}-` : ''}{seat.seatNo}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null
                                })}
                            </div>
                        )}

                        <div className="glass p-4 text-xs text-gray-600 dark:text-gray-500 leading-relaxed">
                            <CreditCard className="w-4 h-4 text-gray-400 mb-2" />
                            Payment is securely processed by Stripe. Your card details are never stored on our servers.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
