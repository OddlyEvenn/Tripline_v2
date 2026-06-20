import { useEffect, useState } from 'react'
import { adminApi } from '../../../api/axios'
import toast from 'react-hot-toast'
import { RefreshCw, Plus, Trash2 } from 'lucide-react'
import { SectionCard, FieldGroup, AdminInput, AdminSelect, SubmitBtn, EmptyState, RecordRow, Pagination } from '../components/Shared'
import { SectionLoader } from '../../../components/Loaders'

export default function VehiclesTab() {
    const [vehicles, setVehicles] = useState([])
    const [carriers, setCarriers] = useState([])
    const [form, setForm] = useState({ name: '', vehicleNumber: '', transportMode: 'FLIGHT', capacity: 180, carrierId: '' })
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [flightCategories, setFlightCategories] = useState([
        { name: 'Business', rowStart: '1', rowEnd: '5', price: '8000' },
        { name: 'Economy', rowStart: '6', rowEnd: '30', price: '2500' },
    ])
    const [flightCols, setFlightCols] = useState('A,B,C,D,E,F')
    const [trainCoaches, setTrainCoaches] = useState([
        { coachNo: 'A1', seatClass: '1AC', seats: '24', price: '3500' },
        { coachNo: 'B1', seatClass: '2AC', seats: '48', price: '2000' },
        { coachNo: 'S1', seatClass: 'Sleeper', seats: '72', price: '600' },
    ])
    const [busRows, setBusRows] = useState('12')
    const [busCols, setBusCols] = useState('A,B,C,D')
    const [busPrice, setBusPrice] = useState('')
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

    const load = (p = 0) => {
        setFetching(true)
        return Promise.all([adminApi.getVehicles({ page: p, size: 20 }), adminApi.getCarriers({ size: 1000 })])
            .then(([v, c]) => {
                const vArr = v.data?.content !== undefined ? v.data.content : (Array.isArray(v.data) ? v.data : [])
                const cArr = c.data?.content !== undefined ? c.data.content : (Array.isArray(c.data) ? c.data : [])
                setVehicles(vArr); setCarriers(cArr)
                setTotalPages(v.data?.totalPages || 0)
                setPage(p)
                if (cArr[0] && !form.carrierId) setForm(f => ({ ...f, carrierId: cArr[0].id }))
            })
            .catch(() => {})
            .finally(() => setFetching(false))
    }
    useEffect(() => { load(0) }, [])

    const addFlightCat = () => setFlightCategories(fc => [...fc, { name: '', rowStart: '', rowEnd: '', price: '' }])
    const removeFlightCat = i => setFlightCategories(fc => fc.filter((_, idx) => idx !== i))
    const setFlightCat = (i, k, v) => setFlightCategories(fc => fc.map((c, idx) => idx === i ? { ...c, [k]: v } : c))

    const addTrainCoach = () => setTrainCoaches(tc => [...tc, { coachNo: '', seatClass: '', seats: '72', price: '' }])
    const removeTrainCoach = i => setTrainCoaches(tc => tc.filter((_, idx) => idx !== i))
    const setTrainCoach = (i, k, v) => setTrainCoaches(tc => tc.map((c, idx) => idx === i ? { ...c, [k]: v } : c))

    const buildPayload = () => {
        const mode = form.transportMode
        if (mode === 'FLIGHT') {
            const cols = flightCols.split(',').map(s => s.trim()).filter(Boolean)
            const seat_classes = {}
            for (const cat of flightCategories) {
                if (cat.name && cat.rowStart && cat.rowEnd) {
                    seat_classes[cat.name] = { rows: `${cat.rowStart}-${cat.rowEnd}` }
                    if (cat.price) seat_classes[cat.name].price = Number(cat.price)
                }
            }
            const maxRow = Number(flightCategories[flightCategories.length - 1]?.rowEnd || 30)
            const seatClasses = {}
            for (const cat of flightCategories) { if (cat.name && cat.price) seatClasses[cat.name] = Number(cat.price) }
            return { seatLayout: { rows: maxRow, columns: cols, seat_classes }, seatClasses, totalSeats: maxRow * cols.length }
        }
        if (mode === 'TRAIN') {
            const coaches = trainCoaches.map(c => ({ coach_no: c.coachNo, class: c.seatClass, seats: Number(c.seats) || 72, price: Number(c.price) || undefined }))
            const seatClasses = {}
            for (const c of trainCoaches) { if (c.seatClass && c.price) seatClasses[c.seatClass] = Number(c.price) }
            return { seatLayout: { coaches }, seatClasses, totalSeats: trainCoaches.reduce((s, c) => s + (Number(c.seats) || 0), 0) }
        }
        if (mode === 'BUS') {
            const cols = busCols.split(',').map(s => s.trim()).filter(Boolean)
            return { seatLayout: { rows: Number(busRows) || 12, columns: cols }, seatClasses: busPrice ? { Standard: Number(busPrice) } : null, totalSeats: (Number(busRows) || 12) * cols.length }
        }
    }

    const submit = async e => {
        e.preventDefault(); setLoading(true)
        try {
            const { seatLayout, seatClasses, totalSeats } = buildPayload()
            await adminApi.createVehicle({ ...form, capacity: Number(form.capacity), carrierId: form.carrierId, isActive: true, seatLayout, seatClasses, totalSeats: totalSeats || Number(form.capacity) })
            toast.success('Vehicle added'); load(page)
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
        finally { setLoading(false) }
    }

    const modeOptions = [{ value: 'FLIGHT', label: '✈️ Flight' }, { value: 'TRAIN', label: '🚆 Train' }, { value: 'BUS', label: '🚌 Bus' }]

    return (
        <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
                <SectionCard title="Add Vehicle" subtitle="Register a new transport vehicle">
                    <form onSubmit={submit} className="space-y-4">
                        <FieldGroup label="Assigned Carrier">
                            <AdminSelect options={carriers.map(c => ({ value: c.id, label: c.name }))} value={form.carrierId} onChange={set('carrierId')} />
                        </FieldGroup>
                        <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="Vehicle Name">
                                <AdminInput required value={form.name} onChange={set('name')} placeholder="IndiGo 6E-401" />
                            </FieldGroup>
                            <FieldGroup label="Vehicle No.">
                                <AdminInput value={form.vehicleNumber} onChange={set('vehicleNumber')} placeholder="6E-401" />
                            </FieldGroup>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="Transport Mode">
                                <AdminSelect options={modeOptions} value={form.transportMode} onChange={set('transportMode')} />
                            </FieldGroup>
                            <FieldGroup label="Total Capacity">
                                <AdminInput type="number" min="1" value={form.capacity} onChange={set('capacity')} />
                            </FieldGroup>
                        </div>

                        {/* FLIGHT */}
                        {form.transportMode === 'FLIGHT' && (
                            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/6">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seat Configuration</p>
                                <FieldGroup label="Columns (comma-separated)">
                                    <AdminInput value={flightCols} onChange={e => setFlightCols(e.target.value)} placeholder="A,B,C,D,E,F" />
                                </FieldGroup>
                                <div className="space-y-2">
                                    {flightCategories.map((cat, i) => (
                                        <div key={i} className="flex gap-2 items-center bg-gray-50 dark:bg-dark-700 rounded-xl p-2.5">
                                            <AdminInput className="flex-1 text-xs !py-1.5" value={cat.name} onChange={e => setFlightCat(i, 'name', e.target.value)} placeholder="Class" />
                                            <AdminInput className="w-14 text-xs !py-1.5" type="number" value={cat.rowStart} onChange={e => setFlightCat(i, 'rowStart', e.target.value)} placeholder="R↑" />
                                            <AdminInput className="w-14 text-xs !py-1.5" type="number" value={cat.rowEnd} onChange={e => setFlightCat(i, 'rowEnd', e.target.value)} placeholder="R↓" />
                                            <AdminInput className="w-20 text-xs !py-1.5" type="number" value={cat.price} onChange={e => setFlightCat(i, 'price', e.target.value)} placeholder="₹" />
                                            <button type="button" onClick={() => removeFlightCat(i)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addFlightCat} className="w-full py-1.5 text-xs font-semibold text-primary-500 border border-dashed border-primary-300 dark:border-primary-500/30 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-500/5 transition-colors flex items-center justify-center gap-1.5">
                                        <Plus className="w-3.5 h-3.5" /> Add Class
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TRAIN */}
                        {form.transportMode === 'TRAIN' && (
                            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/6">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Coaches & Classes</p>
                                <div className="grid grid-cols-4 gap-1 px-0.5">
                                    {['Coach', 'Class', 'Seats', '₹'].map(h => <p key={h} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{h}</p>)}
                                </div>
                                {trainCoaches.map((coach, i) => (
                                    <div key={i} className="grid grid-cols-4 gap-2 items-center bg-gray-50 dark:bg-dark-700 rounded-xl p-2.5">
                                        <AdminInput className="text-xs !py-1.5" value={coach.coachNo} onChange={e => setTrainCoach(i, 'coachNo', e.target.value)} placeholder="B1" />
                                        <AdminInput className="text-xs !py-1.5" value={coach.seatClass} onChange={e => setTrainCoach(i, 'seatClass', e.target.value)} placeholder="2AC" />
                                        <AdminInput className="text-xs !py-1.5" type="number" value={coach.seats} onChange={e => setTrainCoach(i, 'seats', e.target.value)} placeholder="72" />
                                        <div className="flex gap-1 items-center">
                                            <AdminInput className="text-xs !py-1.5 flex-1" type="number" value={coach.price} onChange={e => setTrainCoach(i, 'price', e.target.value)} placeholder="600" />
                                            <button type="button" onClick={() => removeTrainCoach(i)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addTrainCoach} className="w-full py-1.5 text-xs font-semibold text-primary-500 border border-dashed border-primary-300 dark:border-primary-500/30 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-500/5 transition-colors flex items-center justify-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" /> Add Coach
                                </button>
                            </div>
                        )}

                        {/* BUS */}
                        {form.transportMode === 'BUS' && (
                            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/6">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bus Layout</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <FieldGroup label="Rows"><AdminInput type="number" value={busRows} onChange={e => setBusRows(e.target.value)} placeholder="12" /></FieldGroup>
                                    <FieldGroup label="Columns"><AdminInput value={busCols} onChange={e => setBusCols(e.target.value)} placeholder="A,B,C,D" /></FieldGroup>
                                    <FieldGroup label="Price (₹)"><AdminInput type="number" value={busPrice} onChange={e => setBusPrice(e.target.value)} placeholder="500" /></FieldGroup>
                                </div>
                            </div>
                        )}

                        <SubmitBtn loading={loading} label="Add Vehicle" />
                    </form>
                </SectionCard>
            </div>

            <div className="lg:col-span-3">
                <SectionCard
                    title={`Vehicles (${vehicles.length})`}
                    subtitle="All registered vehicles"
                    action={<button onClick={() => load(page)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>}
                >
                    {fetching ? (
                        <div className="py-12"><SectionLoader message="Loading vehicles..." /></div>
                    ) : vehicles.length === 0 ? <EmptyState message="No vehicles yet." /> :
                        vehicles.map(v => {
                            const classes = v.seatClasses ? Object.entries(v.seatClasses) : []
                            return (
                                <RecordRow
                                    key={v.id}
                                    primary={v.name}
                                    secondary={`${v.transportMode} · ${v.carrier?.name || '—'} · ${v.capacity} seats`}
                                    extra={classes.length > 0 && (
                                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                            {classes.map(([cls, price]) => (
                                                <span key={cls} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-500/25">
                                                    {cls} · ₹{Number(price).toLocaleString('en-IN')}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    onDelete={() => adminApi.deleteVehicle(v.id).then(() => load(page)).catch(() => toast.error('Failed to delete'))}
                                />
                            )
                        })
                    }
                    <Pagination page={page} totalPages={totalPages} onPageChange={load} />
                </SectionCard>
            </div>
        </div>
    )
}
