import React from 'react'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { ButtonSpinner } from '../../../components/Loaders'

export function SectionCard({ title, subtitle, children, action }) {
    return (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-white/8 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden">
            {(title || action) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
                        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
                    </div>
                    {action}
                </div>
            )}
            <div className="p-6">{children}</div>
        </div>
    )
}

export function FieldGroup({ label, helper, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{label}</label>
            {children}
            {helper && <p className="text-xs text-gray-400 dark:text-gray-500">{helper}</p>}
        </div>
    )
}

export function AdminInput({ className = '', ...props }) {
    return (
        <input
            {...props}
            className={`w-full bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 ${className}`}
        />
    )
}

export function AdminSelect({ options = [], className = '', ...props }) {
    return (
        <select
            {...props}
            className={`w-full bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 cursor-pointer appearance-none ${className}`}
        >
            {options.map(o => (
                <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
            ))}
        </select>
    )
}

export function SubmitBtn({ loading, label, icon: Icon = Plus }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/25 active:scale-95 text-sm"
        >
            {loading
                ? <ButtonSpinner />
                : <Icon className="w-4 h-4" />
            }
            {label}
        </button>
    )
}

export function Pagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null
    return (
        <div className="flex items-center justify-center gap-2 mt-6 pb-2">
            <button
                disabled={page === 0}
                onClick={() => onPageChange(page - 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
            >
                Previous
            </button>
            <span className="text-xs font-bold text-gray-500">
                Page {page + 1} of {totalPages}
            </span>
            <button
                disabled={page === totalPages - 1}
                onClick={() => onPageChange(page + 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
            >
                Next
            </button>
        </div>
    )
}

export function EmptyState({ message }) {
    return (
        <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{message}</p>
        </div>
    )
}

export function RecordRow({ primary, secondary, extra, onDelete }) {
    return (
        <div className="flex items-center justify-between py-3 px-1 border-b border-gray-100 dark:border-white/5 last:border-0 group">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{primary}</p>
                {secondary && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{secondary}</p>}
                {extra}
            </div>
            {onDelete && (
                <button
                    type="button"
                    onClick={onDelete}
                    className="ml-3 p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )
}
