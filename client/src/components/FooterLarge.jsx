import { Link } from 'react-router-dom'
import { Plane, Train, Bus, Mail, Phone, Twitter, Facebook, Instagram, Linkedin, Youtube, ChevronRight } from 'lucide-react'

const FOOTER_LINKS = {
    'About Tripline': [
        { label: 'About Us', href: '/about' },
        { label: 'Our Team', href: '/team' },
        { label: 'Careers', href: '/careers' },
        { label: 'Blog', href: '/blog' },
        { label: 'Press', href: '/press' },
    ],
    'Popular Routes': [
        { label: 'Delhi → Jaipur', href: '/search' },
        { label: 'Mumbai → Delhi', href: '/search' },
        { label: 'Ahmedabad → Mumbai', href: '/search' },
        { label: 'Bangalore → Chennai', href: '/search' },
        { label: 'Delhi → Srinagar', href: '/search' },
    ],
    'Popular Airlines': [
        { label: 'IndiGo Flights', href: '/search' },
        { label: 'Air India Flights', href: '/search' },
        { label: 'SpiceJet Flights', href: '/search' },
        { label: 'Vistara Flights', href: '/search' },
        { label: 'GoAir Flights', href: '/search' },
    ],
    'Top Train Routes': [
        { label: 'Delhi → Mumbai Train', href: '/search' },
        { label: 'Mumbai → Goa Train', href: '/search' },
        { label: 'Chennai → Bangalore', href: '/search' },
        { label: 'Kolkata → Delhi', href: '/search' },
        { label: 'Ahmedabad → Jaipur', href: '/search' },
    ],
    'Customer Support': [
        { label: 'Help Center', href: '/help' },
        { label: 'Cancellation Policy', href: '/cancellation' },
        { label: 'Refund Policy', href: '/refund' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Live Chat', href: '/chat' },
    ],
    'Legal': [
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'Disclaimer', href: '/disclaimer' },
        { label: 'Accessibility', href: '/accessibility' },
    ],
}

const SOCIALS = [
    { Icon: Twitter, label: 'Twitter', color: 'hover:text-sky-400' },
    { Icon: Facebook, label: 'Facebook', color: 'hover:text-blue-400' },
    { Icon: Instagram, label: 'Instagram', color: 'hover:text-pink-400' },
    { Icon: Linkedin, label: 'LinkedIn', color: 'hover:text-blue-300' },
    { Icon: Youtube, label: 'YouTube', color: 'hover:text-red-400' },
]

export default function FooterLarge() {
    return (
        <footer className="bg-white dark:bg-[#06060a] border-t border-gray-200 dark:border-white/5 pt-20 pb-10 px-4 mt-auto">
            <div className="max-w-7xl mx-auto">
                {/* Top: Brand + App badges */}
                <div className="grid sm:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="sm:col-span-1">
                        <Link to="/" className="flex items-center gap-2.5 group mb-6">
                            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-500 group-hover:scale-105 transition-all shadow-lg hover:shadow-primary-500/25">
                                <Plane className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                                Trip<span className="text-primary-500">line</span>
                            </span>
                        </Link>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                            India's first multi-modal travel platform. Flights, trains and buses combined into a seamless journey.
                        </p>

                        {/* Socials */}
                        <div className="flex items-center gap-3 mb-5">
                            {SOCIALS.map(({ Icon, label, color }) => (
                                <a key={label} href="#" target="_blank" rel="noopener noreferrer" aria-label={label} className={`w-8 h-8 bg-dark-600 border border-white/5 rounded-lg flex items-center justify-center text-gray-500 ${color} hover:border-white/10 hover:scale-110 transition-all duration-200`}>
                                    <Icon className="w-3.5 h-3.5" />
                                </a>
                            ))}
                        </div>

                        {/* App Store Badges */}
                        <div className="flex gap-2 flex-wrap">
                            <a href="#" className="flex items-center gap-2 bg-gray-100 dark:bg-dark-600 border border-transparent dark:border-white/5 text-gray-900 dark:text-white text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-500 transition-colors shadow-sm">
                                <span className="text-lg">🍎</span>
                                <span>
                                    <div className="text-[9px] text-gray-500 dark:text-gray-400">Download on the</div>
                                    <div className="font-bold text-xs tracking-tight">App Store</div>
                                </span>
                            </a>
                            <a href="#" className="flex items-center gap-2 bg-gray-100 dark:bg-dark-600 border border-transparent dark:border-white/5 text-gray-900 dark:text-white text-xs font-medium px-4 py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-500 transition-colors shadow-sm">
                                <span className="text-lg">▶</span>
                                <span>
                                    <div className="text-[9px] text-gray-500 dark:text-gray-400">Get it on</div>
                                    <div className="font-bold text-xs tracking-tight">Google Play</div>
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* Link columns — 3 per row */}
                    <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {Object.entries(FOOTER_LINKS).map(([section, links]) => (
                            <div key={section}>
                                <h4 className="text-gray-900 dark:text-white font-bold text-sm mb-4">{section}</h4>
                                <ul className="space-y-3">
                                    {links.map(link => (
                                        <li key={link.label}>
                                            <Link to={link.href} className="text-gray-600 dark:text-gray-400 text-sm hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5 group">
                                                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-4.5 transition-all group-hover:translate-x-1" />
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-white/5 pt-8 mt-12">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-5 text-gray-500 dark:text-gray-400 text-sm font-medium">
                            <span className="flex items-center gap-1.5">
                                <Plane className="w-4 h-4 text-sky-500" />
                                Flights
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Train className="w-4 h-4 text-emerald-500" />
                                Trains
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Bus className="w-4 h-4 text-amber-500" />
                                Buses
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-500 text-sm">
                            © {new Date().getFullYear()} Tripline Technologies Pvt. Ltd. · All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm font-medium">
                            <a href="mailto:support@tripline.in" className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <Mail className="w-4 h-4" />
                                support@tripline.in
                            </a>
                            <a href="tel:18001238747" className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <Phone className="w-4 h-4" />
                                1800-123-TRIP
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
