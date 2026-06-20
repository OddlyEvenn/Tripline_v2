import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import FooterLarge from '../components/FooterLarge'

import { docsData } from '../data/docsData'

const getDocContent = (pathname) => {
    return docsData[pathname] || {
        title: 'Documentation',
        lastUpdated: 'March 11, 2026',
        content: `
            <p>This page is currently being updated with the latest information. Please check back shortly.</p>
            <h2>General Information</h2>
            <p>Tripline is working hard to provide comprehensive documentation for all our services. If you need immediate assistance regarding <strong>${pathname}</strong>, please contact our support team.</p>
        `
    }
}

export default function DocPage() {
    const location = useLocation()
    const { title, content } = getDocContent(location.pathname)

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [location.pathname])

    const sidebarLinks = [
        { label: 'Company', items: [
            { label: 'About Us', path: '/about' },
            { label: 'Our Team', path: '/team' },
            { label: 'Careers', path: '/careers' },
            { label: 'Blog', path: '/blog' },
        ]},
        { label: 'Support', items: [
            { label: 'Help Center', path: '/help' },
            { label: 'Contact Us', path: '/contact' },
            { label: 'Live Chat', path: '/chat' },
        ]},
        { label: 'Legal', items: [
            { label: 'Terms of Service', path: '/terms' },
            { label: 'Privacy Policy', path: '/privacy' },
            { label: 'Cancellation Policy', path: '/cancellation' },
            { label: 'Refund Policy', path: '/refund' },
        ]}
    ]

    return (
        <div className="min-h-screen pt-24 bg-gray-50 dark:bg-[#06060a] transition-colors duration-300">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
                    <Link to="/" className="hover:text-primary-500 transition-colors">Home</Link>
                    <span className="text-gray-300 dark:text-gray-700">/</span>
                    <span className="text-gray-300 dark:text-gray-700">Docs</span>
                    <span className="text-gray-300 dark:text-gray-700">/</span>
                    <span className="text-primary-500 truncate">{title}</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar - Desktop */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-32 space-y-8">
                            {sidebarLinks.map((group, i) => (
                                <div key={i} className="space-y-3">
                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">{group.label}</h3>
                                    <ul className="space-y-1">
                                        {group.items.map((link, j) => (
                                            <li key={j}>
                                                <Link 
                                                    to={link.path} 
                                                    className={`block py-1.5 text-sm font-medium transition-all ${
                                                        location.pathname === link.path 
                                                        ? 'text-primary-600 dark:text-primary-400 border-l-2 border-primary-500 pl-3' 
                                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:pl-2'
                                                    }`}
                                                >
                                                    {link.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <article className="flex-1 min-w-0">
                        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-8 sm:p-12 lg:p-16 shadow-xl dark:shadow-2xl shadow-black/5 dark:shadow-black/40">
                            <header className="mb-10 pb-10 border-b border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-1 h-1 bg-primary-500 rounded-full" />
                                    <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Documentation</span>
                                </div>
                                <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4 leading-tight">
                                    {title}
                                </h1>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Updated: {docsData[location.pathname]?.lastUpdated || 'March 2026'}
                                    </div>
                                    <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />
                                    <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        Reading time: 4 min
                                    </div>
                                </div>
                            </header>
                            
                            {/* Rendered content */}
                            <div 
                                className="prose prose-lg prose-gray dark:prose-invert max-w-none 
                                           prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-p:leading-relaxed prose-p:mb-6
                                           prose-h2:text-gray-900 dark:prose-h2:text-white prose-h2:text-2xl prose-h2:font-black prose-h2:tracking-tight prose-h2:mt-12 prose-h2:mb-6
                                           prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold
                                           prose-ul:text-gray-600 dark:prose-ul:text-gray-400 prose-li:mb-2
                                           prose-a:text-primary-500 prose-a:no-underline hover:prose-a:underline"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />

                            <footer className="mt-16 pt-10 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Was this page helpful?</p>
                                <div className="flex items-center gap-4">
                                    <button className="px-5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Yes, thanks!</button>
                                    <button className="px-5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Still confused</button>
                                </div>
                            </footer>
                        </div>

                        {/* Pagination style navigation */}
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link to="/" className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/10 hover:border-primary-500 dark:hover:border-primary-500 transition-all group">
                                <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Previous</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-500 flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                    Back to Home
                                </div>
                            </Link>
                            <Link to="/help" className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/10 hover:border-primary-500 dark:hover:border-primary-500 transition-all group text-right">
                                <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Next</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-500 flex items-center justify-end gap-2">
                                    Help Center
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </div>
                    </article>
                </div>
            </main>
            <FooterLarge />
        </div>
    )
}
