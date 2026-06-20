import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeContext'

export default function ThemeToggle({ className = '' }) {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`
                relative inline-flex items-center justify-center w-9 h-9 rounded-xl
                border transition-all duration-200 hover:scale-110 active:scale-95
                ${isDark
                    ? 'bg-dark-700 border-white/10 hover:bg-dark-600'
                    : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'}
                ${className}
            `}
        >
            {/* Sun — shown in dark mode to indicate "switch to light" */}
            <span className={`absolute transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}>
                <Sun className="w-4 h-4 text-yellow-400" />
            </span>
            {/* Moon — shown in light mode to indicate "switch to dark" */}
            <span className={`absolute transition-all duration-300 ${isDark ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
                <Moon className="w-4 h-4 text-primary-600" />
            </span>
        </button>
    )
}
