import { useEffect, useState } from 'react'
import { adminApi } from '../../../api/axios'
import toast from 'react-hot-toast'
import { RefreshCw } from 'lucide-react'
import { SectionCard, FieldGroup, AdminInput, SubmitBtn, EmptyState, RecordRow, Pagination } from '../components/Shared'
import { SectionLoader } from '../../../components/Loaders'

export default function CarriersTab() {
    const [carriers, setCarriers] = useState([])
    const [form, setForm] = useState({ name: '', contactEmail: '', contactPhone: '', logoUrl: '' })
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    const load = (p = 0) => {
        setFetching(true)
        return adminApi.getCarriers({ page: p, size: 20 })
            .then(r => {
                const data = r.data?.content !== undefined ? r.data.content : (Array.isArray(r.data) ? r.data : [])
                setCarriers(data)
                setTotalPages(r.data?.totalPages || 0)
                setPage(p)
            })
            .catch(() => {})
            .finally(() => setFetching(false))
    }
    useEffect(() => { load(0) }, [])

    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

    const submit = async e => {
        e.preventDefault(); setLoading(true)
        try {
            await adminApi.createCarrier({ ...form, isActive: true })
            toast.success('Carrier added successfully')
            load(page)
            setForm({ name: '', contactEmail: '', contactPhone: '', logoUrl: '' })
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
        finally { setLoading(false) }
    }

    return (
        <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
                <SectionCard title="Add New Carrier" subtitle="Create a transport carrier record">
                    <form onSubmit={submit} className="space-y-4">
                        <FieldGroup label="Carrier Name">
                            <AdminInput required value={form.name} onChange={set('name')} placeholder="e.g. IndiGo Airlines" />
                        </FieldGroup>
                        <FieldGroup label="Contact Email">
                            <AdminInput type="email" value={form.contactEmail} onChange={set('contactEmail')} placeholder="support@carrier.com" />
                        </FieldGroup>
                        <FieldGroup label="Contact Phone">
                            <AdminInput value={form.contactPhone} onChange={set('contactPhone')} placeholder="+91 99999 99999" />
                        </FieldGroup>
                        <FieldGroup label="Logo URL" helper="Optional — paste a link to the carrier logo">
                            <AdminInput value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://..." />
                        </FieldGroup>
                        <SubmitBtn loading={loading} label="Add Carrier" />
                    </form>
                </SectionCard>
            </div>

            <div className="lg:col-span-3">
                <SectionCard
                    title={`Carriers (${carriers.length})`}
                    subtitle="All registered transport carriers"
                    action={<button onClick={() => load(page)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>}
                >
                    {fetching ? (
                        <div className="py-12"><SectionLoader message="Loading carriers..." /></div>
                    ) : carriers.length === 0
                        ? <EmptyState message="No carriers yet. Add one to get started." />
                        : carriers.map(c => (
                            <RecordRow
                                key={c.id}
                                primary={c.name}
                                secondary={c.contactEmail || c.contactPhone || 'No contact info'}
                                onDelete={() => adminApi.deleteCarrier(c.id).then(() => load(page)).catch(() => toast.error('Failed to delete'))}
                            />
                        ))
                    }
                    <Pagination page={page} totalPages={totalPages} onPageChange={load} />
                </SectionCard>
            </div>
        </div>
    )
}
