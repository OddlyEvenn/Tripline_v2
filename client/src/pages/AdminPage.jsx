import { useState } from 'react'
import {
    Plane, Route, Building2, MapPin,
    Settings, Users, LayoutDashboard
} from 'lucide-react'

import CarriersTab from './admin/tabs/CarriersTab'
import VehiclesTab from './admin/tabs/VehiclesTab'
import StationsTab from './admin/tabs/StationsTab'
import TripsTab from './admin/tabs/TripsTab'
import BookingsTab from './admin/tabs/BookingsTab'
import ConfigTab from './admin/tabs/ConfigTab'

const TABS = [
    { id: 'carriers',  label: 'Carriers',  icon: Building2, color: 'text-violet-500' },
    { id: 'vehicles',  label: 'Vehicles',  icon: Plane,     color: 'text-sky-500'    },
    { id: 'stations',  label: 'Stations',  icon: MapPin,    color: 'text-emerald-500'},
    { id: 'trips',     label: 'Trips',     icon: Route,     color: 'text-amber-500'  },
    { id: 'bookings',  label: 'Bookings',  icon: Users,     color: 'text-rose-500'   },
    { id: 'config',    label: 'Config',    icon: Settings,  color: 'text-gray-500'   },
]

export default function AdminPage() {
    const [tab, setTab] = useState('carriers')

    const tabContent = {
        carriers: <CarriersTab />,
        vehicles: <VehiclesTab />,
        stations: <StationsTab />,
        trips:    <TripsTab />,
        bookings: <BookingsTab />,
        config:   <ConfigTab />,
    }

    const currentTab = TABS.find(t => t.id === tab)

    return (
        <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">

                {/* ── PAGE HEADER ── */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="w-9 h-9 bg-violet-500/15 dark:bg-violet-500/20 border border-violet-500/25 rounded-xl flex items-center justify-center">
                        <LayoutDashboard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your Tripline platform</p>
                    </div>
                </div>

                {/* ── TAB BAR ── */}
                <div className="flex gap-1 flex-wrap mb-7 bg-white dark:bg-dark-800 p-1.5 rounded-2xl border border-gray-200 dark:border-white/8 shadow-sm dark:shadow-lg w-fit">
                    {TABS.map(t => {
                        const Icon = t.icon
                        const active = tab === t.id
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${active
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${active ? 'text-white' : t.color}`} />
                                <span className="hidden sm:inline">{t.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* ── BREADCRUMB ── */}
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-6">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>/</span>
                    {currentTab && <><currentTab.icon className={`w-3.5 h-3.5 ${currentTab.color}`} /><span className="text-gray-700 dark:text-gray-300">{currentTab.label}</span></>}
                </div>

                {/* ── TAB CONTENT ── */}
                <div className="animate-fade-in">
                    {tabContent[tab]}
                </div>
            </div>
        </div>
    )
}
