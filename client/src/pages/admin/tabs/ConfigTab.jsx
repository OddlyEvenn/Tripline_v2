import { useEffect, useState } from 'react'
import { adminApi } from '../../../api/axios'
import toast from 'react-hot-toast'
import { RefreshCw, CheckCircle2 } from 'lucide-react'
import { SectionCard, FieldGroup, AdminInput, SubmitBtn, EmptyState } from '../components/Shared'

export default function ConfigTab() {
    const [configs, setConfigs] = useState([])
    const [form, setForm] = useState({ configKey: '', configValue: '', description: '' })
    const [loading, setLoading] = useState(false)
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
    const load = () => adminApi.getConfigs().then(r => setConfigs(r.data)).catch(() => {})
    useEffect(() => { load() }, [])

    const submit = async e => {
        e.preventDefault(); setLoading(true)
        try { await adminApi.upsertConfig(form); toast.success('Config saved'); load(); setForm({ configKey: '', configValue: '', description: '' }) }
        catch (err) { toast.error(err.response?.data?.message || 'Failed') }
        finally { setLoading(false) }
    }

    return (
        <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
                <SectionCard title="Set Configuration" subtitle="Add or update a platform config value">
                    <form onSubmit={submit} className="space-y-4">
                        <FieldGroup label="Config Key" helper="Use snake_case (e.g. minimum_layover_minutes)">
                            <AdminInput required value={form.configKey} onChange={set('configKey')} placeholder="minimum_layover_minutes" />
                        </FieldGroup>
                        <FieldGroup label="Value">
                            <AdminInput required value={form.configValue} onChange={set('configValue')} placeholder="120" />
                        </FieldGroup>
                        <FieldGroup label="Description">
                            <AdminInput value={form.description} onChange={set('description')} placeholder="Minimum layover time in minutes" />
                        </FieldGroup>
                        <SubmitBtn loading={loading} label="Save Config" icon={CheckCircle2} />
                    </form>
                </SectionCard>
            </div>
            <div className="lg:col-span-3">
                <SectionCard
                    title={`Active Config (${configs.length})`}
                    subtitle="Current platform configuration"
                    action={<button onClick={load} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>}
                >
                    {configs.length === 0 ? <EmptyState message="No config set yet." /> :
                        configs.map(c => (
                            <div key={c.configKey} className="flex items-start justify-between py-3.5 border-b border-gray-100 dark:border-white/5 last:border-0 gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400 truncate">{c.configKey}</p>
                                    {c.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.description}</p>}
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white flex-shrink-0">{c.configValue}</span>
                            </div>
                        ))
                    }
                </SectionCard>
            </div>
        </div>
    )
}
