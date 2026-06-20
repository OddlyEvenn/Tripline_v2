import { Zap, Shield, Clock, Globe, Coins, HeartHandshake, Train, TicketCheck } from 'lucide-react'

const FEATURES = [
    {
        icon: Zap,
        color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        title: 'AI-Powered Routing',
        desc: 'Our graph-based engine computes the fastest, cheapest, and most balanced multi-modal routes in milliseconds.',
    },
    {
        icon: Globe,
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
        title: 'True Multi-Modal',
        desc: 'Combine flights, trains, and buses into a single journey. One ticket. Zero hassle.',
    },
    {
        icon: Shield,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        title: 'Secure Payments',
        desc: 'Bank-grade Stripe encrypted payments. Your money and data are fully protected.',
    },
    {
        icon: Clock,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        title: 'Real-time Availability',
        desc: 'Live seat maps updated in real-time. What you see is what you get.',
    },
    {
        icon: Coins,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        title: 'Best Price Guarantee',
        desc: 'Filter by cheapest, fastest, or balanced. We always show you the best options first.',
    },
    {
        icon: TicketCheck,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        title: 'Instant e-Tickets',
        desc: 'Get your PDF ticket emailed instantly on booking confirmation. Download anytime.',
    },
    {
        icon: Train,
        color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
        title: 'IRCTC-Style Seat Maps',
        desc: 'Visualize exact seat positions with berth types, classes, and real-time lock status.',
    },
    {
        icon: HeartHandshake,
        color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
        title: '24/7 Support',
        desc: 'Round-the-clock customer support for any booking issues, modifications, or cancellations.',
    },
]

export default function WhyTripline() {
    return (
        <section className="py-4 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <span className="inline-block text-xs font-bold tracking-widest text-primary-400 uppercase mb-3 bg-primary-500/10 border border-primary-500/20 px-4 py-1.5 rounded-full">
                        Why Tripline
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Built for the Modern Traveller</h2>
                    <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
                        India's first production-grade multi-modal travel platform, combining cutting-edge technology with a seamless booking experience.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {FEATURES.map((f, i) => {
                        const Icon = f.icon
                        return (
                            <div
                                key={i}
                                className="glass-card bg-white/60 dark:bg-dark-800/60 p-6 sm:p-7 group hover:border-primary-500/30 dark:hover:border-primary-500/30 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10"
                            >
                                <div className={`w-12 h-12 rounded-xl border ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`}>
                                    <Icon className={`w-6 h-6 ${f.color.split(' ')[0]}`} />
                                </div>
                                <h3 className="text-gray-900 dark:text-white font-semibold text-sm mb-2">{f.title}</h3>
                                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
