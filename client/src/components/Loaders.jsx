import { Plane, Train, Bus, MapPin, Map } from 'lucide-react'

// ============================================================================
// PAGE LOADER - Full screen loader for initial app loading or redirects
// ============================================================================
export function PageLoader() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-900">
            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-gray-200 dark:border-dark-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                    <Plane className="w-8 h-8 text-primary-500" />
                </div>
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Tripline</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 animate-pulse">Preparing your journey...</p>
        </div>
    )
}

// ============================================================================
// SECTION LOADER - For tabs, tables, widgets inside a page
// ============================================================================
export function SectionLoader({ message = 'Loading...', icon = Plane }) {
    const Icon = icon
    return (
        <div className="w-full py-16 flex flex-col items-center justify-center">
            <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 bg-primary-100 dark:bg-primary-500/10 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white dark:bg-dark-700 w-12 h-12 rounded-full border border-gray-100 dark:border-white/10 flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5 text-primary-500 animate-bounce" />
                </div>
            </div>
            <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">{message}</p>
        </div>
    )
}

// ============================================================================
// BUTTON SPINNER - Polished SVG spinner for buttons
// ============================================================================
export function ButtonSpinner({ className = 'w-4 h-4 text-white' }) {
    return (
        <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    )
}

// ============================================================================
// ROUTE SKELETON - Skeleton loading specifically for search results
// ============================================================================
export function RouteSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-dark-800 rounded-2xl p-5 border border-gray-200 dark:border-white/5 flex flex-col md:flex-row gap-6 md:items-center overflow-hidden">
                    
                    {/* Carrier Info Skeleton */}
                    <div className="w-full md:w-48 flex items-center gap-4 shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-white/10 shrink-0 shimmer"></div>
                        <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-white/10 rounded-full w-24 shimmer"></div>
                            <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full w-16 shimmer"></div>
                        </div>
                    </div>

                    {/* Timeline Skeleton */}
                    <div className="flex-1 flex items-center justify-between min-w-0 px-2 md:px-6 py-4 md:py-0 border-y md:border-y-0 md:border-x border-gray-100 dark:border-white/5 relative">
                        {/* Origin */}
                        <div className="text-center w-24 shrink-0">
                            <div className="h-5 bg-gray-200 dark:bg-white/10 rounded-full w-16 mx-auto mb-2 shimmer"></div>
                            <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full w-12 mx-auto shimmer"></div>
                        </div>

                        {/* Line */}
                        <div className="flex-1 px-4 flex flex-col items-center justify-center">
                            <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full w-12 mb-2 shimmer"></div>
                            <div className="w-full flex items-center relative">
                                <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-white/10 shrink-0 shimmer"></div>
                                <div className="h-px bg-gray-200 dark:bg-white/10 flex-1 mx-1 border-t-2 border-dashed border-gray-200 dark:border-white/10 shimmer"></div>
                                <div className="absolute left-1/2 -ml-3 w-6 h-6 bg-white dark:bg-dark-800 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center z-10">
                                    <div className="w-3 h-3 bg-gray-200 dark:bg-white/10 rounded-full shimmer"></div>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-white/10 shrink-0 shimmer"></div>
                            </div>
                        </div>

                        {/* Destination */}
                        <div className="text-center w-24 shrink-0">
                            <div className="h-5 bg-gray-200 dark:bg-white/10 rounded-full w-16 mx-auto mb-2 shimmer"></div>
                            <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full w-12 mx-auto shimmer"></div>
                        </div>
                    </div>

                    {/* Price and Action Skeleton */}
                    <div className="w-full md:w-48 flex md:flex-col items-center justify-between md:justify-center gap-4 shrink-0 pl-2 md:pl-6">
                        <div className="space-y-2">
                            <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-full w-24 shimmer"></div>
                            <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full w-20 shimmer"></div>
                        </div>
                        <div className="h-10 bg-gray-200 dark:bg-white/10 rounded-xl w-32 md:w-full shimmer"></div>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ============================================================================
// STAT SKELETON - For dashboard statistics
// ============================================================================
export function StatSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass p-4 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-white/10 mb-3 shimmer" />
                    <div className="h-7 w-20 bg-gray-200 dark:bg-white/10 rounded-lg mb-2 shimmer" />
                    <div className="h-3 w-16 bg-gray-100 dark:bg-white/10 rounded-md shimmer" />
                </div>
            ))}
        </div>
    )
}

// ============================================================================
// BOOKING CARD SKELETON - For dashboard booking lists
// ============================================================================
export function BookingCardSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2].map(i => (
                <div key={i} className="glass-card p-5 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                            <div className="h-4 w-48 bg-gray-200 dark:bg-white/10 rounded-lg mb-2 shimmer" />
                            <div className="flex gap-2">
                                <div className="h-3 w-12 bg-gray-100 dark:bg-white/10 rounded-md shimmer" />
                                <div className="h-3 w-16 bg-gray-100 dark:bg-white/10 rounded-md shimmer" />
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="h-3 w-10 bg-gray-100 dark:bg-white/10 rounded-md mb-1 ml-auto shimmer" />
                            <div className="h-5 w-20 bg-gray-200 dark:bg-white/10 rounded-lg shimmer" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
