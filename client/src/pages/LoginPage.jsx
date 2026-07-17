import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/axios'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Plane, ArrowRight, Lock, Mail } from 'lucide-react'
import { ButtonSpinner } from '../components/Loaders'

/* ───────── password strength calculator ───────── */
function getPasswordStrength(password) {
    if (!password) return { level: '', color: '', width: '0%' }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    
    if (strength <= 2) return { level: 'Weak', color: 'bg-red-500', width: '33%' }
    if (strength <= 3) return { level: 'Medium', color: 'bg-yellow-500', width: '66%' }
    return { level: 'Strong', color: 'bg-green-500', width: '100%' }
}

/* ───────── shared input wrapper ───────── */
function FloatInput({ id, label, type = 'text', value, onChange, required, right, left, autoComplete }) {
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
                className={`
                    peer w-full
                    bg-gray-50 dark:bg-dark-700/60
                    border border-gray-200 dark:border-white/8
                    text-gray-900 dark:text-white
                    placeholder-transparent
                    pt-6 pb-2
                    rounded-xl
                    focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30
                    transition-all duration-200 text-sm
                    ${left ? 'pl-10' : 'px-4'} pr-11
                `}
            />
            {left && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-primary-500 transition-colors">
                    {left}
                </div>
            )}
            <label
                htmlFor={id}
                className="
                    absolute top-2
                    text-[11px] font-semibold uppercase tracking-wider
                    text-gray-400 dark:text-gray-500
                    peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-gray-400
                    peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-primary-500
                    transition-all duration-200 pointer-events-none
                "
                style={{ left: left ? '2.5rem' : '1rem' }}
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

/* ───────── MAIN LOGIN PAGE ───────── */
export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [showPwd, setShowPwd] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const passwordStrength = getPasswordStrength(form.password)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await login(form)
            toast.success('Welcome back! 🎉')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid email or password')
        } finally {
            setLoading(false)
        }
    }



    return (
        <div className="min-h-screen pt-16 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary-500/8 dark:bg-primary-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/6 dark:bg-purple-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl items-center justify-center mb-4 shadow-xl shadow-primary-600/30">
                        <Plane className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Welcome back</h1>
                    <p className="text-gray-500 mt-2 text-sm">Sign in to continue your journey</p>
                </div>

                {/* Card */}
                <div className="bg-white/90 dark:bg-dark-800/70 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-xl dark:shadow-2xl shadow-black/10 dark:shadow-black/50">

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <FloatInput
                                id="login-email"
                                label="Email Address"
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                                autoComplete="username"
                                left={<Mail className="w-4 h-4" />}
                            />

                            <div>
                                <FloatInput
                                    id="login-password"
                                    label="Password"
                                    type={showPwd ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    autoComplete="current-password"
                                    left={<Lock className="w-4 h-4" />}
                                    right={
                                        <button type="button" onClick={() => setShowPwd(v => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
                                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                />
                                {form.password && (
                                    <div className="mt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Password Strength:</span>
                                            <span className={`text-xs font-semibold ${passwordStrength.level === 'Weak' ? 'text-red-500' : passwordStrength.level === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                                                {passwordStrength.level}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-200 dark:bg-dark-600/60 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                style={{ width: passwordStrength.width }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 accent-primary-500 rounded cursor-pointer"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors font-semibold">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full group py-3.5 mt-6 disabled:opacity-50 disabled:bg-primary-500 disabled:border-transparent text-base flex items-center justify-center gap-2"
                        >
                            {loading
                                ? <ButtonSpinner className="w-5 h-5 text-white" />
                                : <>Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                            }
                        </button>
                    </form>


                </div>

                <p className="text-center text-gray-500 dark:text-gray-500 text-sm mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 font-semibold transition-colors">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    )
}
