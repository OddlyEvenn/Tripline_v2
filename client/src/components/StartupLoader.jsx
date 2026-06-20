import { useState, useEffect } from 'react'
import { Plane } from 'lucide-react'

export default function StartupLoader({ onComplete }) {
    const [phase, setPhase] = useState('entering')

    useEffect(() => {
        // Timeline for the animation
        const t1 = setTimeout(() => setPhase('loading'), 800)
        const t2 = setTimeout(() => setPhase('exiting'), 2200)
        const t3 = setTimeout(() => onComplete(), 2800)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
        }
    }, [onComplete])

    return (
        <div 
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#06060a] transition-opacity duration-700 ease-in-out
                ${phase === 'exiting' ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}
        >
            {/* Background ambient glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-primary-600/20 rounded-full blur-[100px] transition-all duration-1000
                ${phase === 'loading' ? 'scale-150 opacity-40' : 'scale-75 opacity-0'}
            `} />

            <div className="relative flex flex-col items-center z-10">
                {/* Animated Logo Container */}
                <div className={`relative flex items-center justify-center w-24 h-24 mb-6 transition-transform duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${phase === 'entering' ? 'scale-0 translate-y-10' : 'scale-100 translate-y-0'}
                `}>
                    {/* Pulsing ring */}
                    <div className={`absolute inset-0 border-2 border-primary-500 rounded-2xl transition-all duration-1000
                        ${phase === 'loading' ? 'scale-150 opacity-0' : 'scale-100 opacity-50'}
                    `} />
                    
                    {/* Main Logo Block */}
                    <div className="absolute inset-0 bg-primary-600 rounded-2xl shadow-2xl shadow-primary-600/50 flex items-center justify-center overflow-hidden">
                        {/* Shimmer sweep */}
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        <Plane className="w-10 h-10 text-white animate-pulse-slow" />
                    </div>
                </div>

                {/* Brand Text */}
                <div className="overflow-hidden h-12">
                    <h1 className={`text-3xl font-black text-white tracking-tight transition-transform duration-700 delay-300 flex items-center gap-1
                         ${phase === 'entering' ? 'translate-y-full' : 'translate-y-0'}
                    `}>
                        Trip<span className="text-primary-500">line</span>
                        <div className="flex gap-1 ml-2 mt-2">
                            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                        </div>
                    </h1>
                </div>
            </div>
        </div>
    )
}
