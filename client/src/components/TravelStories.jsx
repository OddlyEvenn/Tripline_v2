import { BookOpen, Clock, User } from 'lucide-react'

const STORIES = [
    {
        tag: 'Travel Tips',
        title: 'How to Plan the Perfect Ahmedabad to Kashmir Road-Trip',
        desc: 'A bus from Ahmedabad, an overnight train to Delhi, and a morning flight to Srinagar — we break down the ultimate multi-modal journey.',
        author: 'Rohan Mehta',
        readTime: '6 min read',
        gradient: 'from-sky-900/60 to-blue-950/80',
        emoji: '🏔️',
    },
    {
        tag: 'Cost Savings',
        title: '5 Tricks to Save ₹2,000+ on Your Next Train-Flight Combo Booking',
        desc: 'Combining transport modes strategically can slash your travel costs significantly. Here\'s how to do it right.',
        author: 'Priya Sharma',
        readTime: '4 min read',
        gradient: 'from-emerald-900/60 to-teal-950/80',
        emoji: '💰',
    },
    {
        tag: 'Destination',
        title: 'Top 10 Multi-Modal Routes in India You Must Try in 2026',
        desc: 'From the Konkan coast to the Himalayas — discover India\'s most breathtaking journeys that mix travel modes.',
        author: 'Aditi Nair',
        readTime: '8 min read',
        gradient: 'from-purple-900/60 to-violet-950/80',
        emoji: '🗺️',
    },
]

export default function TravelStories() {
    return (
        <section className="py-4 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                    <span className="inline-block text-xs font-bold tracking-widest text-primary-400 uppercase mb-3 bg-primary-500/10 border border-primary-500/20 px-4 py-1.5 rounded-full shadow-sm">
                        Travel Stories
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">News & Travel Inspiration</h2>
                    <p className="text-gray-500 text-sm">Guides, tips, and stories from fellow travellers</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-5">
                    {STORIES.map((s, i) => (
                        <article
                            key={i}
                            className={`rounded-2xl bg-gradient-to-b ${s.gradient} border border-white/5 overflow-hidden group hover:border-white/20 hover:-translate-y-1.5 shadow-lg hover:shadow-2xl hover:shadow-${s.gradient.split('-')[2]}-900/40 transition-all duration-300 cursor-pointer`}
                        >
                            <div className="h-36 flex items-center justify-center text-6xl border-b border-white/5 bg-black/20 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                                {s.emoji}
                            </div>
                            <div className="p-5">
                                <span className="inline-block text-[10px] font-black uppercase tracking-wider text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2.5 py-1 rounded-full mb-3">
                                    {s.tag}
                                </span>
                                <h3 className="text-white font-semibold text-sm leading-snug mb-2 group-hover:text-primary-300 transition-colors">
                                    {s.title}
                                </h3>
                                <p className="text-white/70 text-xs leading-relaxed mb-4 line-clamp-2">{s.desc}</p>
                                <div className="flex items-center justify-between text-xs text-white/50">
                                    <span className="flex items-center gap-1.5">
                                        <User className="w-3 h-3" />
                                        {s.author}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        {s.readTime}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
