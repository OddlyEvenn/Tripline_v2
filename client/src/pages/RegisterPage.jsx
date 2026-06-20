import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { UserPlus, Eye, EyeOff, Plane, ArrowRight, CheckCircle } from 'lucide-react'

/* ───────── shared floating-label input ───────── */
function FloatInput({ id, label, type = 'text', value, onChange, required, right, autoComplete, inputMode }) {
    return (
        <div className="relative">
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder=" "
                required={required}
                autoComplete={autoComplete}
                inputMode={inputMode}
                className="
                    peer w-full
                    bg-gray-50 dark:bg-dark-700/60
                    border border-gray-200 dark:border-white/8
                    text-gray-900 dark:text-white
                    placeholder-transparent
                    px-4 pt-6 pb-2
                    rounded-xl
                    focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30
                    transition-all duration-200 text-sm
                    pr-11
                "
            />
            <label
                htmlFor={id}
                className="
                    absolute left-4 top-2
                    text-[11px] font-semibold uppercase tracking-wider
                    text-gray-400 dark:text-gray-500
                    peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal
                    peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-primary-500
                    transition-all duration-200 pointer-events-none
                "
            >
                {label}
            </label>
            {right && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {right}
                </div>
            )}
        </div>
    )
}

/* ───────── password strength ───────── */
const PWD_CHECKS = [
    { label: '8+ chars', test: v => v.length >= 8 },
    { label: 'Uppercase', test: v => /[A-Z]/.test(v) },
    { label: 'Number', test: v => /\d/.test(v) },
]

export default function RegisterPage() {
    const { register } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'USER' })
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
        setLoading(true)
        try {
            await register(form)
            toast.success('Account created! Please verify your email 📧')
            navigate('/verify-email', { state: { email: form.email } })
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignup = () => {
        window.location.href = '/api/oauth2/authorization/google'
    }


    return (
        <div className="min-h-screen pt-16 flex items-center justify-center px-4 py-10 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/4 -right-20 w-80 h-80 bg-purple-500/6 dark:bg-purple-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-primary-500/6 dark:bg-primary-600/8 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl items-center justify-center mb-4 shadow-xl shadow-primary-600/30">
                        <Plane className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Create account</h1>
                    <p className="text-gray-500 mt-2 text-sm">Start your multi-modal journey. Free forever.</p>
                </div>

                {/* Google quick-signup */}
                <button
                    type="button"
                    onClick={handleGoogleSignup}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-dark-700 border border-gray-200 dark:border-white/10 rounded-2xl py-3 mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-600 hover:border-gray-300 dark:hover:border-white/15 transition-all shadow-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
                    <span className="text-xs text-gray-400">or register with email</span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
                </div>

                {/* Card */}
                <div className="bg-white/90 dark:bg-dark-800/70 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-xl dark:shadow-2xl shadow-black/10 dark:shadow-black/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="space-y-4">
                            <FloatInput id="reg-name" label="Full Name" value={form.name} onChange={set('name')} required autoComplete="name" />
                            <FloatInput id="reg-email" label="Email Address" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
                            <FloatInput id="reg-phone" label="Phone Number (optional)" type="tel" value={form.phone} onChange={set('phone')} inputMode="numeric" autoComplete="tel" />

                            {/* Role selector */}
                            <div className="relative">
                                <label className="absolute left-4 top-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 z-10 pointer-events-none">
                                    Account Type
                                </label>
                                <select
                                    value={form.role}
                                    onChange={set('role')}
                                    required
                                    className="input-field pt-6 pb-2 text-sm appearance-none border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-dark-700/60"
                                >
                                    <option value="USER" className="bg-white dark:bg-dark-700">Traveler</option>
                                    <option value="ADMIN" className="bg-white dark:bg-dark-700">Administrator</option>
                                </select>
                            </div>

                            {/* Password */}
                            <FloatInput
                                id="reg-password"
                                label="Password"
                                type={showPwd ? 'text' : 'password'}
                                value={form.password}
                                onChange={set('password')}
                                required
                                autoComplete="new-password"
                                right={
                                    <button type="button" onClick={() => setShowPwd(v => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
                                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />

                            {/* Password strength */}
                            {form.password.length > 0 && (
                                <div className="flex gap-3 flex-wrap px-1">
                                    {PWD_CHECKS.map(c => (
                                        <span key={c.label} className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${c.test(form.password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                            <CheckCircle className="w-3 h-3" />
                                            {c.label}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base group mt-2 shadow-xl shadow-primary-500/20"
                        >
                            {loading
                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <><UserPlus className="w-4 h-4" /> Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                            }
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 font-semibold transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
