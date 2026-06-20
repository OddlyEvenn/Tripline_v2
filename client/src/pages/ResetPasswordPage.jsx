import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi } from '../api/axios'
import toast from 'react-hot-toast'
import { KeyRound, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const token = params.get('token') || ''
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password !== confirm) { toast.error('Passwords do not match'); return }
        if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
        setLoading(true)
        try {
            await authApi.resetPassword({ token, newPassword: password })
            toast.success('Password reset successfully!')
            navigate('/login')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid or expired reset link')
        } finally {
            setLoading(false)
        }
    }

    if (!token) return (
        <div className="min-h-screen pt-16 flex items-center justify-center">
            <div className="text-center">
                <p className="text-red-400 mb-4">Invalid reset link.</p>
                <Link to="/forgot-password" className="btn-primary">Request new link</Link>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen pt-16 flex items-center justify-center px-4">
            <div className="w-full max-w-md animate-slide-up">
                <div className="text-center mb-8">
                    <div className="inline-flex w-14 h-14 bg-purple-600 rounded-2xl items-center justify-center mb-4">
                        <KeyRound className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Set new password</h1>
                    <p className="text-gray-500 mt-2">Choose a strong password for your account</p>
                </div>

                <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                        <div className="relative">
                            <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                                className="input-field pr-12" placeholder="Min 6 characters" />
                            <button type="button" onClick={() => setShowPwd(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                            className="input-field" placeholder="Re-enter password" />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}
