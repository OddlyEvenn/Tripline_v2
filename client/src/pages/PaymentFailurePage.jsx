import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { XCircle, ArrowLeft, RefreshCw, LayoutDashboard, ShieldAlert, CreditCard, Banknote, HelpCircle } from 'lucide-react'

export default function PaymentFailurePage() {
    const navigate = useNavigate()

    const failureReasons = [
        {
            icon: <Banknote className="w-5 h-5 text-rose-400" />,
            title: "Insufficient Funds",
            desc: "Your account balance might not be enough for this transaction. Please check your credit/debit limit.",
            logic: "The bank returns an 'insufficient_funds' code if the limit is exceeded."
        },
        {
            icon: <CreditCard className="w-5 h-5 text-rose-400" />,
            title: "Card Declined",
            desc: "The transaction was declined by your bank due to security reasons or mismatch in details.",
            logic: "Occurs when CVV, expiry date, or billing address doesn't match bank records."
        },
        {
            icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
            title: "Authentication Failed",
            desc: "3D Secure authentication (OTP) was not completed or failed during the validation process.",
            logic: "Triggered if the OTP entered is incorrect or the session times out."
        },
        {
            icon: <HelpCircle className="w-5 h-5 text-rose-400" />,
            title: "Gateway Timeout",
            desc: "A temporary connection issue occurred between Tripline and your bank's servers.",
            logic: "Network latency or bank server downtime preventing the charge from being authorized."
        }
    ]

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-rose-900/20 via-transparent to-transparent">
            <div className="max-w-xl mx-auto pt-20 px-4">
                <div className="animate-fade-in">
                    {/* Failure Banner */}
                    <div className="text-center mb-12 animate-slide-up">
                        <div className="relative inline-flex">
                            <div className="absolute inset-0 bg-rose-500/30 rounded-full blur-3xl animate-pulse-slow" />
                            <div className="relative w-24 h-24 bg-rose-500/10 border-2 border-rose-500/30 rounded-full flex items-center justify-center mb-6">
                                <XCircle className="w-12 h-12 text-rose-400" />
                            </div>
                        </div>
                        <h1 className="text-5xl font-black text-white mt-4 mb-3 tracking-tight">Payment Failed</h1>
                        <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
                            Something went wrong with your transaction. Don't worry, no funds have been deducted.
                        </p>
                    </div>

                    <div className="grid gap-8">
                        {/* Summary Card */}
                        <div className="glass-card p-8 border-rose-500/20">
                            <div className="flex flex-col items-center justify-between gap-4 mb-8 pb-8 border-b border-white/5">
                                <h3 className="text-white font-bold text-xl uppercase tracking-wider">Why did it fail?</h3>
                                <p className="text-gray-500 text-sm italic text-center">Below are common reasons and the technical logic for the rejection.</p>
                            </div>

                            <div className="space-y-6">
                                {failureReasons.map((reason, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-rose-500/30 transition-all duration-300 group">
                                        <div className="shrink-0 mt-1">
                                            {reason.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-white font-bold mb-1 group-hover:text-rose-400 transition-colors uppercase text-sm tracking-tight">{reason.title}</h4>
                                            <p className="text-gray-400 text-xs mb-2 leading-relaxed">{reason.desc}</p>
                                            <div className="text-[10px] text-rose-500/60 font-mono bg-rose-500/5 p-2 rounded border border-rose-500/10">
                                                LOGIC: {reason.logic}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center py-4">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="btn-error px-10 h-14 flex items-center justify-center gap-2 text-lg group"
                            >
                                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> Try Payment Again
                            </button>
                            <Link to="/dashboard" className="btn-outline px-10 h-14 flex items-center justify-center gap-2 text-lg">
                                <LayoutDashboard className="w-5 h-5" /> Visit Dashboard
                            </Link>
                        </div>

                        <div className="text-center">
                            <Link to="/help" className="text-gray-500 text-sm hover:text-white transition-colors flex items-center justify-center gap-2">
                                <HelpCircle className="w-4 h-4" /> Need help with your booking?
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
