import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, LayoutDashboard, Shield, Menu, X, Plane, ChevronDown } from 'lucide-react'
import { useTheme } from '../theme/ThemeContext'
import ThemeToggle from '../theme/ThemeToggle'
import toast from 'react-hot-toast'

export default function Navbar() {
    const { user, isAuthenticated, isAdmin, logout } = useAuth()
    const { isDark } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        toast.success('Logged out successfully')
        navigate('/')
        setMenuOpen(false)
        setUserMenuOpen(false)
    }

    const isActive = (path) => location.pathname === path

    const navLinkClass = (path) =>
        `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(path)
            ? 'text-primary-600 dark:text-white bg-primary-50 dark:bg-dark-600'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700'
        }`

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-dark-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center group-hover:bg-primary-500 transition-colors group-hover:scale-110 duration-200">
                            <Plane className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                            Trip<span className="text-primary-600 dark:text-primary-400">line</span>
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className={`hidden md:flex items-center ${!isAuthenticated ? 'absolute left-1/2 -translate-x-1/2' : ''} gap-1`}>
                        <Link to="/" className={navLinkClass('/')}>Home</Link>
                        <Link to="/search" className={navLinkClass('/search')}>Search</Link>
                        {isAuthenticated && <Link to="/dashboard" className={navLinkClass('/dashboard')}>My Trips</Link>}
                        {isAdmin && (
                            <Link
                                to="/admin"
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all duration-200 flex items-center gap-1 ${isActive('/admin') ? 'bg-purple-50 dark:bg-purple-500/10' : ''}`}
                            >
                                <Shield className="w-3.5 h-3.5" />
                                Admin
                            </Link>
                        )}
                    </div>

                    {/* Right: ThemeToggle + User */}
                    <div className="hidden md:flex items-center gap-2">
                        <ThemeToggle />

                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(v => !v)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-dark-700/60 border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 hover:bg-gray-200 dark:hover:bg-dark-600/80 transition-all"
                                >
                                    <div className="w-6 h-6 bg-primary-100 dark:bg-primary-600/20 border border-primary-300 dark:border-primary-500/30 rounded-full flex items-center justify-center">
                                        <span className="text-primary-600 dark:text-primary-400 font-bold text-xs">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{user?.name?.split(' ')[0]}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-dark-700 border border-gray-200 dark:border-white/10 rounded-xl p-1.5 shadow-xl animate-slide-down z-50">
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg transition-colors"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            My Trips
                                        </Link>
                                        {isAdmin && (
                                            <Link
                                                to="/admin"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
                                            >
                                                <Shield className="w-4 h-4" />
                                                Admin Panel
                                            </Link>
                                        )}
                                        <div className="border-t border-gray-100 dark:border-white/5 my-1" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Sign In</Link>
                                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            className="p-2 rounded-lg bg-gray-100 dark:bg-dark-700/60 border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden bg-white/98 dark:bg-dark-800/98 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 px-4 py-4 space-y-1.5 animate-slide-down">
                    <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-all">Home</Link>
                    <Link to="/search" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-all">Search Routes</Link>
                    {isAuthenticated && <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-all">My Trips</Link>}
                    {isAdmin && (
                        <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                            <Shield className="w-3.5 h-3.5 inline mr-1.5" />Admin Panel
                        </Link>
                    )}
                    <div className="border-t border-gray-100 dark:border-white/5 pt-3 mt-2">
                        {isAuthenticated ? (
                            <button onClick={handleLogout} className="block w-full text-left px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all">
                                <LogOut className="w-4 h-4 inline mr-2" />Sign Out
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-ghost text-sm text-center border border-gray-200 dark:border-white/5 rounded-xl py-2">Sign In</Link>
                                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm text-center">Get Started</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}
