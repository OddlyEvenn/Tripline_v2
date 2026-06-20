import { useEffect, useState } from 'react'
import { adminApi } from '../../../api/axios'
import toast from 'react-hot-toast'
import { RefreshCw } from 'lucide-react'
import { SectionCard, FieldGroup, AdminInput, AdminSelect, SubmitBtn, EmptyState, RecordRow, Pagination } from '../components/Shared'
import { SectionLoader } from '../../../components/Loaders'

export default function StationsTab() {
    const [stations, setStations] = useState([])
    const [form, setForm] = useState({ name: '', city: '', state: '', country: 'India', type: 'AIRPORT', latitude: '', longitude: '' })
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

    const load = (p = 0) => {
        setFetching(true)
        return adminApi.getStations({ page: p, size: 20 })
            .then(r => {
                const data = r.data?.content !== undefined ? r.data.content : (Array.isArray(r.data) ? r.data : [])
                setStations(data)
                setTotalPages(r.data?.totalPages || 0)
                setPage(p)
            })
            .catch(() => {})
            .finally(() => setFetching(false))
    }
    useEffect(() => { load(0) }, [])

    const submit = async e => {
        e.preventDefault(); setLoading(true)
        try {
            await adminApi.createStation({ ...form, latitude: Number(form.latitude), longitude: Number(form.longitude), isActive: true })
            toast.success('Station added'); load(page)
            setForm({ name: '', city: '', state: '', country: 'India', type: 'AIRPORT', latitude: '', longitude: '' })
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
        finally { setLoading(false) }
    }

    const typeColors = { AIRPORT: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10', TRAIN_STATION: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10', BUS_TERMINAL: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' }

    return (
        <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
                <SectionCard title="Add Station" subtitle="Add an airport, train station or bus terminal">
                    <form onSubmit={submit} className="space-y-4">
                        <FieldGroup label="Station Name">
                            <AdminInput required value={form.name} onChange={set('name')} placeholder="SVPI International Airport" />
                        </FieldGroup>
                        <FieldGroup label="Type">
                            <AdminSelect value={form.type} onChange={set('type')} options={[{ value: 'AIRPORT', label: '✈️ Airport' }, { value: 'TRAIN_STATION', label: '🚉 Train Station' }, { value: 'BUS_TERMINAL', label: '🚌 Bus Terminal' }]} />
                        </FieldGroup>
                        <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="City"><AdminInput required value={form.city} onChange={set('city')} placeholder="Ahmedabad" /></FieldGroup>
                            <FieldGroup label="State"><AdminInput value={form.state} onChange={set('state')} placeholder="Gujarat" /></FieldGroup>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="Latitude"><AdminInput type="number" step="any" required value={form.latitude} onChange={set('latitude')} placeholder="23.0727" /></FieldGroup>
                            <FieldGroup label="Longitude"><AdminInput type="number" step="any" required value={form.longitude} onChange={set('longitude')} placeholder="72.6347" /></FieldGroup>
                        </div>
                        <SubmitBtn loading={loading} label="Add Station" />
                    </form>
                </SectionCard>
            </div>

            <div className="lg:col-span-3">
                <SectionCard
                    title={`Stations (${stations.length})`}
                    subtitle="All registered stations & terminals"
                    action={<button onClick={() => load(page)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>}
                >
                    <div className="max-h-[480px] overflow-y-auto -mr-2 pr-2 space-y-0">
                        {fetching ? (
                            <div className="py-12"><SectionLoader message="Loading stations..." /></div>
                        ) : stations.length === 0 ? <EmptyState message="No stations yet." /> :
                            stations.map(s => (
                                <RecordRow key={s.id} primary={`${s.city} – ${s.name}`}
                                    secondary={`${s.state}, ${s.country}`}
                                    extra={
                                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColors[s.type] || 'text-gray-500'}`}>
                                            {s.type.replace('_', ' ')}
                                        </span>
                                    }
                                    onDelete={() => adminApi.deleteStation(s.id).then(() => load(page)).catch(() => toast.error('Failed to delete'))}
                                />
                            ))
                        }
                    </div>
                    <Pagination page={page} totalPages={totalPages} onPageChange={load} />
                </SectionCard>
            </div>
        </div>
    )
}
