import { useEffect, useState } from 'react'
import { adminApi } from '../../../api/axios'
import toast from 'react-hot-toast'
import { Plane, Train, Bus } from 'lucide-react'
import { SectionCard, FieldGroup, AdminInput, SubmitBtn, EmptyState, RecordRow, Pagination } from '../components/Shared'
import { SectionLoader } from '../../../components/Loaders'

export default function TripsTab() {
    const [trips, setTrips] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [stations, setStations] = useState([])
    const [selectedMode, setSelectedMode] = useState('FLIGHT')
    const [tripFilter, setTripFilter] = useState('ALL')
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [form, setForm] = useState({ vehicleId: '', originStationId: '', destinationStationId: '', departureTime: '', arrivalTime: '', distance: '', price: '', availableSeats: '' })
    
    // Pagination state
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

    const MODE_CONFIG = {
        FLIGHT: { label: 'Flight', icon: <Plane className="w-4 h-4" />, stationType: 'AIRPORT', badge: 'badge-flight', color: 'sky' },
        TRAIN:  { label: 'Train',  icon: <Train className="w-4 h-4" />, stationType: 'TRAIN_STATION', badge: 'badge-train', color: 'emerald' },
        BUS:    { label: 'Bus',    icon: <Bus className="w-4 h-4" />, stationType: 'BUS_TERMINAL', badge: 'badge-bus', color: 'amber' },
    }

    const load = (p = 0) => {
        setFetching(true)
        return Promise.all([
            adminApi.getTrips({ page: p, size: 20 }), 
            adminApi.getVehicles({ size: 1000 }), // large size for dropdown
            adminApi.getStations({ size: 1000 })  // large size for dropdown
        ])
            .then(([t, v, s]) => { 
                setTrips(t.data?.content !== undefined ? t.data.content : (Array.isArray(t.data) ? t.data : [])); 
                setVehicles(v.data?.content !== undefined ? v.data.content : (Array.isArray(v.data) ? v.data : [])); 
                setStations(s.data?.content !== undefined ? s.data.content : (Array.isArray(s.data) ? s.data : []));
                setTotalPages(t.data?.totalPages || 0)
                setPage(p)
            })
            .catch(() => {})
            .finally(() => setFetching(false))
    }
        
    useEffect(() => { load(0) }, [])

    const filteredVehicles = vehicles.filter(v => v.transportMode === selectedMode)
    const filteredStations = stations.filter(s => s.type === MODE_CONFIG[selectedMode].stationType)
    const selectedVehicle = vehicles.find(v => String(v.id) === String(form.vehicleId))
    const vehicleHasClasses = selectedVehicle?.seatClasses && Object.keys(selectedVehicle.seatClasses).length > 0

    const autoDerive = vehicleId => {
        const v = vehicles.find(v => String(v.id) === String(vehicleId))
        if (!v) return {}
        const prices = v.seatClasses ? Object.values(v.seatClasses).map(Number).filter(p => p > 0) : []
        return { price: prices.length ? String(Math.min(...prices)) : '', availableSeats: String(v.totalSeats || v.capacity || '') }
    }

    useEffect(() => {
        const fv = filteredVehicles[0]; const fs = filteredStations[0]
        const derived = fv ? autoDerive(fv.id) : {}
        setForm(f => ({ ...f, vehicleId: fv ? String(fv.id) : '', originStationId: fs ? String(fs.id) : '', destinationStationId: fs ? String(fs.id) : '', ...derived }))
    }, [selectedMode, vehicles, stations])

    const submit = async e => {
        e.preventDefault(); setLoading(true)
        try {
            await adminApi.createTrip({ ...form, price: Number(form.price), distance: Number(form.distance), availableSeats: Number(form.availableSeats), isActive: true })
            toast.success('Trip added!'); load(page)
            setForm(f => ({ ...f, departureTime: '', arrivalTime: '', distance: '' }))
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
        finally { setLoading(false) }
    }

    const displayedTrips = tripFilter === 'ALL' ? trips : trips.filter(t => t.transportMode === tripFilter)
    const modeTabColors = { FLIGHT: 'text-sky-600 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20', TRAIN: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20', BUS: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20' }

    return (
        <div className="space-y-5">
            {/* Mode selector */}
            <div className="flex gap-2">
                {Object.entries(MODE_CONFIG).map(([mode, cfg]) => (
                    <button key={mode} type="button" onClick={() => setSelectedMode(mode)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${selectedMode === mode ? modeTabColors[mode] + ' shadow-sm' : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-white/8 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                        {cfg.icon} {cfg.label}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                    <SectionCard title={`Add ${MODE_CONFIG[selectedMode].label} Trip`} subtitle="Schedule a new trip">
                        <form onSubmit={submit} className="space-y-4">
                            <FieldGroup label="Vehicle">
                                <select value={form.vehicleId} onChange={e => { const d = autoDerive(e.target.value); setForm(f => ({ ...f, vehicleId: e.target.value, ...d })) }} className="w-full bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer" required>
                                    {filteredVehicles.length === 0 && <option value="">— no {MODE_CONFIG[selectedMode].label.toLowerCase()} vehicles —</option>}
                                    {filteredVehicles.map(v => <option key={v.id} value={v.id}>{v.name} · {v.carrier?.name || '—'}</option>)}
                                </select>
                            </FieldGroup>

                            {vehicleHasClasses && selectedVehicle && (
                                <div className="rounded-xl bg-gray-50 dark:bg-dark-700 p-3 space-y-2">
                                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class Pricing (from vehicle)</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(selectedVehicle.seatClasses).map(([cls, price]) => (
                                            <span key={cls} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-dark-600 border border-gray-200 dark:border-white/8 text-gray-700 dark:text-gray-200">
                                                {cls} <span className="text-primary-500">₹{Number(price).toLocaleString('en-IN')}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <FieldGroup label="Origin">
                                    <select value={form.originStationId} onChange={set('originStationId')} className="w-full bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer" required>
                                        {filteredStations.length === 0 && <option value="">— none —</option>}
                                        {filteredStations.map(s => <option key={s.id} value={s.id}>{s.city} – {s.name}</option>)}
                                    </select>
                                </FieldGroup>
                                <FieldGroup label="Destination">
                                    <select value={form.destinationStationId} onChange={set('destinationStationId')} className="w-full bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer" required>
                                        {filteredStations.length === 0 && <option value="">— none —</option>}
                                        {filteredStations.map(s => <option key={s.id} value={s.id}>{s.city} – {s.name}</option>)}
                                    </select>
                                </FieldGroup>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FieldGroup label="Departure"><AdminInput type="datetime-local" required value={form.departureTime} onChange={set('departureTime')} /></FieldGroup>
                                <FieldGroup label="Arrival"><AdminInput type="datetime-local" required value={form.arrivalTime} onChange={set('arrivalTime')} /></FieldGroup>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FieldGroup label={vehicleHasClasses ? 'Distance (km)' : 'Base Price (₹)'}>
                                    <AdminInput type="number" min="0" required value={vehicleHasClasses ? form.distance : form.price} onChange={vehicleHasClasses ? set('distance') : set('price')} placeholder={vehicleHasClasses ? '540' : '1200'} />
                                </FieldGroup>
                                <FieldGroup label={vehicleHasClasses ? 'Available Seats' : 'Distance (km)'}>
                                    <AdminInput type="number" min="0" required value={vehicleHasClasses ? form.availableSeats : form.distance} onChange={vehicleHasClasses ? set('availableSeats') : set('distance')} placeholder={vehicleHasClasses ? '180' : '540'} />
                                </FieldGroup>
                            </div>
                            {vehicleHasClasses && <FieldGroup label="Available Seats"><AdminInput type="number" min="1" value={form.availableSeats} onChange={set('availableSeats')} placeholder={String(selectedVehicle?.totalSeats || '')} /></FieldGroup>}

                            <SubmitBtn loading={loading} label={`Add ${MODE_CONFIG[selectedMode].label} Trip`} />
                        </form>
                    </SectionCard>
                </div>

                <div className="lg:col-span-3">
                    <SectionCard
                        title={`Trips (${displayedTrips.length})`}
                        subtitle="Scheduled trips across all modes"
                        action={
                            <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 p-1 rounded-lg border border-gray-200 dark:border-white/8">
                                {['ALL', 'FLIGHT', 'TRAIN', 'BUS'].map(f => (
                                    <button key={f} type="button" onClick={() => setTripFilter(f)}
                                        className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${tripFilter === f ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>
                                        {f === 'ALL' ? 'All' : MODE_CONFIG[f].label}
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        <div className="max-h-[520px] overflow-y-auto -mr-2 pr-2">
                            {fetching ? (
                                <div className="py-12"><SectionLoader message="Loading trips..." /></div>
                            ) : displayedTrips.length === 0 ? <EmptyState message="No trips yet." /> :
                                displayedTrips.map(t => {
                                    const cfg = MODE_CONFIG[t.transportMode] || MODE_CONFIG.FLIGHT
                                    return (
                                        <RecordRow
                                            key={t.id}
                                            primary={`${t.originStation?.city} → ${t.destinationStation?.city}`}
                                            secondary={`₹${Number(t.price).toLocaleString('en-IN')}  ·  ${t.availableSeats} seats  ·  ${new Date(t.departureTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}`}
                                            extra={<span className={`inline-block mt-1 ${cfg.badge}`}>{cfg.label}</span>}
                                            onDelete={() => adminApi.deleteTrip(t.id).then(() => load(page)).catch(() => toast.error('Failed'))}
                                        />
                                    )
                                })
                            }
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPageChange={load} />
                    </SectionCard>
                </div>
            </div>
        </div>
    )
}
