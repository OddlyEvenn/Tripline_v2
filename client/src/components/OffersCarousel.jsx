import { useState, useRef } from 'react'
import { Tag, ChevronLeft, ChevronRight, Plane, Train, Bus, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const OFFERS = [
    {
        id: 1,
        badge: 'LIMITED',
        title: 'Flash Sale: Flights up to 30% Off',
        desc: 'Book any flight before midnight tonight. Use code FLASH30',
        code: 'FLASH30',
        gradient: 'from-sky-600 to-blue-800',
        icon: Plane,
        expiry: 'Ends Tonight',
    },
    {
        id: 2,
        badge: 'NEW USER',
        title: '₹500 off your first booking',
        desc: 'Welcome aboard! Get ₹500 off on any trip above ₹1,500.',
        code: 'FIRST500',
        gradient: 'from-emerald-600 to-teal-800',
        icon: Zap,
        expiry: 'For new users only',
    },
    {
        id: 3,
        badge: 'WEEKEND',
        title: 'Train travel at flat ₹199',
        desc: 'All sleeper class train bookings this weekend for just ₹199.',
        code: 'WEEKEND199',
        gradient: 'from-amber-500 to-orange-700',
        icon: Train,
        expiry: 'Sat & Sun only',
    },
    {
        id: 4,
        badge: 'COMBO',
        title: 'Multi-modal combo: Save 15%',
        desc: 'Book a Flight + Bus combo journey and save 15% on total fare.',
        code: 'COMBO15',
        gradient: 'from-purple-600 to-violet-800',
        icon: Bus,
        expiry: 'Valid this month',
    },
]

export default function OffersCarousel() {
    const [copied, setCopied] = useState(null)
    const scrollRef = useRef(null)
    const navigate = useNavigate()

    const handleOfferClick = (offer) => {
        const today = new Date().toISOString().split('T')[0];
        
        let params = {
            travelDate: today,
            passengers: 1,
            optimizationMode: 'BALANCED',
            seatClass: 'Economy'
        };

        if (offer.id === 1) { // Flight Sale
            params = { ...params, originCity: 'Delhi', destinationCity: 'Mumbai', transportMode: 'FLIGHT' };
        } else if (offer.id === 2) { // New User
            params = { ...params, originCity: 'Bangalore', destinationCity: 'Chennai', transportMode: 'BUS', seatClass: 'AC Sleeper' };
        } else if (offer.id === 3) { // Train Weekend
            params = { ...params, originCity: 'Mumbai', destinationCity: 'Pune', transportMode: 'TRAIN', seatClass: 'Sleeper (SL)' };
        } else if (offer.id === 4) { // Combo
            params = { ...params, originCity: 'Delhi', destinationCity: 'Goa' }; // COMBINED
        }

        navigate('/search', { state: { searchParams: params } });
    }

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' })
        }
    }

    const copyCode = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(code)
            setTimeout(() => setCopied(null), 2000)
        })
    }

    return (
        <section className="py-4 px-4 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3">
                            <Zap className="w-3 h-3" /> Exclusive
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            Offers For You
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-md">Deals and discounts curated for the Tripline community. Plan your next journey for less.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => scroll(-1)} className="w-11 h-11 bg-white dark:bg-dark-700 border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-600 hover:border-primary-500/30 transition-all hover:scale-105 active:scale-95 shadow-sm">
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button onClick={() => scroll(1)} className="w-11 h-11 bg-white dark:bg-dark-700 border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-600 hover:border-primary-500/30 transition-all hover:scale-105 active:scale-95 shadow-sm">
                            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </div>

                <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
                    {OFFERS.map(offer => {
                        const Icon = offer.icon
                        return (
                            <div
                                key={offer.id}
                                onClick={() => handleOfferClick(offer)}
                                className={`flex-shrink-0 w-72 sm:w-80 snap-start rounded-2xl bg-gradient-to-br ${offer.gradient} p-5 sm:p-6 relative overflow-hidden group cursor-pointer hover:scale-[1.03] hover:-translate-y-1 shadow-lg hover:shadow-2xl hover:shadow-${offer.gradient.split('-')[2]}-500/30 transition-all duration-300`}
                            >
                                {/* Background accent */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-[10px] font-black tracking-[0.15em] bg-black/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full border border-white/10">
                                            {offer.badge}
                                        </span>
                                        <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-white font-black text-xl leading-tight mb-2 tracking-tight">{offer.title}</h3>
                                        <p className="text-white/80 text-xs leading-relaxed mb-6 font-medium">{offer.desc}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); copyCode(offer.code); }}
                                            className="group/btn relative flex items-center gap-2 bg-white text-gray-900 font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-black/10 hover:-translate-y-0.5"
                                        >
                                            <Tag className="w-3.5 h-3.5 text-primary-600" />
                                            {copied === offer.code ? '✓ Copied' : offer.code}
                                        </button>
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{offer.expiry}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
