import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/axios'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await authApi.forgotPassword(email)
            setSent(true)
            toast.success('Reset link sent to your email!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reset email')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen pt-16 flex items-center justify-center px-4">
            <div className="w-full max-w-md animate-slide-up">
                <div className="text-center mb-8">
                    <div className="inline-flex w-14 h-14 bg-purple-600 rounded-2xl items-center justify-center mb-4">
                        <Mail className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Forgot password?</h1>
                    <p className="text-gray-500 mt-2">We'll send a reset link to your email</p>
                </div>

                {sent ? (
                    <div className="glass-card p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-white font-semibold text-lg mb-2">Check your inbox</h2>
                        <p className="text-gray-400 text-sm mb-6">We've sent a password reset link to <strong className="text-white">{email}</strong></p>
                        <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                className="input-field" placeholder="you@example.com" />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full">
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                        <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mt-2">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                        </Link>
                    </form>
                )}
            </div>
        </div>
    )
}
