import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/axios'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Plane, ArrowRight, Phone, KeyRound, ChevronRight, Lock } from 'lucide-react'
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
function FloatInput({ id, label, type = 'text', value, onChange, required, right, autoComplete }) {
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
                    peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-gray-400
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

    const handleGoogleLogin = () => {
        window.location.href = '/api/oauth2/authorization/google'
    }

    const handleGithubLogin = () => {
        window.location.href = '/api/oauth2/authorization/github'
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

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
                        <span className="text-gray-400 text-xs">or continue with</span>
                        <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Google */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="flex items-center justify-center gap-2 bg-white dark:bg-dark-700/60 border border-gray-200 dark:border-white/8 rounded-xl py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600/60 hover:border-gray-300 dark:hover:border-white/15 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm font-medium"
                        >
                            {/* Google 'G' logo SVG */}
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>

                        {/* GitHub */}
                        <button
                            type="button"
                            onClick={handleGithubLogin}
                            className="flex items-center justify-center gap-2 bg-white dark:bg-dark-700/60 border border-gray-200 dark:border-white/8 rounded-xl py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600/60 hover:border-gray-300 dark:hover:border-white/15 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm font-medium"
                        >
                            {/* GitHub logo SVG */}
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </button>
                    </div>

                    {/* Trust Message */}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5" />
                            <span><strong>Secure authentication</strong> - We never share your data.</span>
                        </p>
                    </div>
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
