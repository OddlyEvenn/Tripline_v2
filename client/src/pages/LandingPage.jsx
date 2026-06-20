import { useNavigate } from 'react-router-dom'
import { Zap, ArrowRight, Star } from 'lucide-react'
import HeroSearchCard from '../components/HeroSearchCard'
import OffersCarousel from '../components/OffersCarousel'
import PopularRoutes from '../components/PopularRoutes'
import WhyTripline from '../components/WhyTripline'
import CarrierCarousel from '../components/CarrierCarousel'
import TravelStories from '../components/TravelStories'
import FooterLarge from '../components/FooterLarge'

const STATS = [
    { value: '500+', label: 'Routes', emoji: '🗺️' },
    { value: '50+', label: 'Cities', emoji: '🏙️' },
    { value: '3', label: 'Modes', emoji: '🚀' },
    { value: '₹200Cr+', label: 'Saved', emoji: '💸' },
]

const TRUST_BADGES = [
    { label: '4.8★ App Rating', sub: '50K+ Reviews' },
    { label: 'Stripe Secured', sub: '100% Safe Payments' },
    { label: '#1 Multi-Modal', sub: 'India\'s First Platform' },
]

export default function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="pt-16 overflow-x-hidden">

            {/* ═══════════════════════════════════════
                HERO SECTION (ASYMMETRICAL REDESIGN)
            ═══════════════════════════════════════ */}
            <section className="relative min-h-[92vh] flex items-center pt-20 pb-16 px-4 overflow-hidden">
                {/* Background ambient light orbs */}
                <div className="absolute top-0 right-0 w-[45rem] h-[45rem] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none translate-x-1/4 -translate-y-1/4 animate-pulse-slow" />
                <div className="absolute bottom-10 left-0 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2" />
                
                <div className="relative z-10 max-w-7xl mx-auto w-full">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                        
                        {/* LEFT: Cinematic Typography & Trust */}
                        <div className="lg:col-span-7 flex flex-col justify-center animate-slide-up text-left">
                            
                            <div className="inline-flex items-center gap-2 bg-primary-600/10 border border-primary-500/20 text-primary-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 w-fit shadow-sm">
                                <Zap className="w-4 h-4" />
                                India's First Multi-Modal Platform
                                <span className="ml-1 bg-primary-500/20 text-primary-300 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">New</span>
                            </div>

                            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5rem] font-black text-gray-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
                                Travel Smarter.<br/>
                                <span className="bg-gradient-to-r from-primary-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent pb-2 block">
                                    Go Everywhere.
                                </span>
                            </h1>

                            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl leading-relaxed font-light">
                                Combine flights, trains, and buses into one seamless journey. We calculate the fastest, cheapest, and most balanced routes instantly.
                            </p>

                            {/* Trust badges row */}
                            <div className="flex flex-wrap items-center gap-4 mb-12">
                                {TRUST_BADGES.map((t, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-white/60 dark:bg-dark-700/60 backdrop-blur-md border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-2xl text-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
                                        <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                        </div>
                                        <div>
                                            <div className="text-gray-900 dark:text-white font-bold tracking-tight">{t.label}</div>
                                            <div className="text-gray-500 dark:text-gray-400 text-[10px] font-medium leading-none mt-0.5">{t.sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-4 gap-4 max-w-xl">
                                {STATS.map(s => (
                                    <div key={s.label} className="group p-4 bg-white/40 dark:bg-dark-800/40 backdrop-blur-sm rounded-2xl border border-white/40 dark:border-white/5 hover:bg-white/60 dark:hover:bg-dark-700/50 transition-colors shadow-sm cursor-default">
                                        <div className="text-2xl mb-2 group-hover:-translate-y-1.5 transition-transform duration-300 shadow-sm inline-block rounded-xl bg-white/50 dark:bg-white/5 px-2 py-1 border border-white/20">{s.emoji}</div>
                                        <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{s.value}</div>
                                        <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Floating Search Card */}
                        <div className="lg:col-span-5 relative mt-10 lg:mt-0 fade-in delay-200">
                            {/* Decorative background plate behind card */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-sky-400/20 rounded-[2.5rem] rotate-3 scale-105 blur-lg opacity-60" />
                            <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/20 to-indigo-400/20 rounded-[2.5rem] -rotate-3 scale-105 blur-lg opacity-60" />
                            
                            <div className="relative z-20 transition-transform duration-500 hover:-translate-y-2">
                                <HeroSearchCard />
                            </div>
                        </div>
                        
                    </div>
                </div>

                {/* Subtle Scroll Hint */}
                <div className="absolute bottom-6 left-8 hidden lg:flex items-center gap-3 animate-bounce-subtle opacity-60">
                    <div className="w-px h-12 bg-gradient-to-b from-primary-500 to-transparent" />
                    <span className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase writing-vertical-rl rotate-180">Explore More</span>
                </div>
            </section>

            {/* ═══════════════════════════════════════ */}
            {/*  OFFERS CAROUSEL                        */}
            {/* ═══════════════════════════════════════ */}
            <div className="py-20 md:py-28 relative">
                <OffersCarousel />
            </div>

            {/* ═══════════════════════════════════════ */}
            {/*  WHY TRIPLINE                           */}
            {/* ═══════════════════════════════════════ */}
            <div className="py-16 bg-white/40 dark:bg-dark-900/40 border-y border-gray-200/50 dark:border-white/5">
                <WhyTripline />
            </div>

            {/* ═══════════════════════════════════════ */}
            {/*  POPULAR ROUTES                         */}
            {/* ═══════════════════════════════════════ */}
            <div className="py-20 md:py-28">
                <PopularRoutes />
            </div>

            {/* ═══════════════════════════════════════ */}
            {/*  CARRIERS                               */}
            {/* ═══════════════════════════════════════ */}
            <div className="pt-10 pb-20 md:pb-28">
                <CarrierCarousel />
            </div>

            {/* ═══════════════════════════════════════ */}
            {/*  TRAVEL STORIES                         */}
            {/* ═══════════════════════════════════════ */}
            <div className="py-20 md:py-28 bg-white/40 dark:bg-dark-900/40 border-y border-gray-200/50 dark:border-white/5">
                <TravelStories />
            </div>

            {/* ═══════════════════════════════════════ */}
            {/*  CTA BANNER                             */}
            {/* ═══════════════════════════════════════ */}
            <section className="py-24 px-4 relative">
                <div className="max-w-4xl mx-auto">
                    <div className="glass-card p-12 md:p-16 text-center relative overflow-hidden shadow-2xl hover:shadow-primary-500/10 transition-shadow duration-500 group">
                        {/* Gradient accent */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-transparent to-purple-600/10 pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-700" />

                        <div className="relative z-10 animate-slide-up">
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Ready to travel <span className="text-primary-500">smarter?</span></h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto text-base leading-relaxed">
                                Join thousands of travellers who plan multi-modal journeys with Tripline. Sign up free and get ₹500 off your first booking.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={() => navigate('/register')} className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-2 group/btn hover:-translate-y-0.5 shadow-xl shadow-primary-500/20">
                                    Get Started Free
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                                <button onClick={() => navigate('/search')} className="btn-outline flex items-center justify-center gap-2 hover:-translate-y-0.5 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm">
                                    Explore Routes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════ */}
            {/*  FOOTER                                 */}
            {/* ═══════════════════════════════════════ */}
            <FooterLarge />
        </div>
    )
}
