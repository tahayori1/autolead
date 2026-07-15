
import React from 'react';
import type { Reference } from '../services/api';
import { LeadStatus, StaffUser } from '../types';

interface UserFilterPanelProps {
    filters: { query: string; carModel: string; reference: string; status: LeadStatus | 'all'; myLeadsOnly?: boolean; staffUserId?: string };
    onFilterChange: (filters: any) => void;
    onClear: () => void;
    references: Reference[];
    staffUsers: StaffUser[];

    // Auto Refresh properties
    refreshMode: 'off' | '5s' | '30s' | '1m' | 'custom';
    onRefreshModeChange: (mode: 'off' | '5s' | '30s' | '1m' | 'custom') => void;
    customRefreshSeconds: number;
    onCustomRefreshSecondsChange: (seconds: number) => void;
    nextRefreshCountdown: number | null;
    onManualRefresh: () => void;
    isRefreshing: boolean;
}

const CAR_MODELS = [
    'JAC J4', 'JAC S3', 'JAC S5', 'BAC X3PRO', 'KMC T8', 'KMC T9', 'KMC A5',
    'KMC J7', 'KMC X5', 'KMC SR3', 'KMC EAGLE', 'KMC SHADOW', 'KMC SR6'
];

const UserFilterPanel: React.FC<UserFilterPanelProps> = ({ 
    filters, onFilterChange, onClear, references, staffUsers,
    refreshMode, onRefreshModeChange, customRefreshSeconds, onCustomRefreshSecondsChange,
    nextRefreshCountdown, onManualRefresh, isRefreshing
}) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="lg:col-span-5">
                <label htmlFor="user-search" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">جستجو</label>
                <input
                    id="user-search"
                    name="query"
                    type="text"
                    placeholder="جستجو بر اساس نام، شماره، خودرو، استان، شهر..."
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white dark:bg-slate-700"
                    value={filters.query}
                    onChange={handleChange}
                />
            </div>
             <div>
                <label htmlFor="car-model-filter" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">خودروی درخواستی</label>
                <select
                    id="car-model-filter"
                    name="carModel"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                    value={filters.carModel}
                    onChange={handleChange}
                >
                    <option value="all">همه مدل‌ها</option>
                    {CAR_MODELS.map(model => (
                        <option key={model} value={model}>{model}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">وضعیت سرنخ</label>
                <select
                    id="status-filter"
                    name="status"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                    value={filters.status}
                    onChange={handleChange}
                >
                    <option value="all">همه وضعیت‌ها</option>
                    {Object.values(LeadStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="reference-filter" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">مرجع</label>
                <select
                    id="reference-filter"
                    name="reference"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                    value={filters.reference}
                    onChange={handleChange}
                >
                    <option value="all">همه مراجع</option>
                    {references.map(ref => (
                        <option key={ref.reference} value={ref.reference}>{ref.reference}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="staff-user-filter" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">کاربر سیستم (کارشناس)</label>
                <select
                    id="staff-user-filter"
                    name="staffUserId"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition font-medium"
                    value={filters.staffUserId || 'all'}
                    onChange={handleChange}
                >
                    <option value="all">همه کاربران</option>
                    {staffUsers.map(user => (
                        <option key={user.id} value={user.id}>{user.fullName || user.username}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-2">
                 <button
                    onClick={onClear}
                    className="w-full px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                    title="پاک کردن فیلترها"
                >
                    پاک کردن فیلترها
                </button>
            </div>

            {/* Filter Extra Actions Row */}
            <div className="lg:col-span-5 flex flex-wrap items-center justify-between gap-4 mt-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-700/60 shadow-inner w-full">
                {/* My Leads Filter Switch */}
                <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                        type="checkbox" 
                        name="myLeadsOnly" 
                        className="sr-only peer"
                        checked={!!filters.myLeadsOnly}
                        onChange={(e) => onFilterChange({ ...filters, myLeadsOnly: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-350 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                    <span className="mr-3 text-xs font-bold text-slate-800 dark:text-slate-200">⭐ سرنخ‌های من</span>
                </label>

                {/* Auto Refresh Area */}
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">🔄 به‌روزرسانی خودکار:</span>
                    <select
                        className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-sky-500"
                        value={refreshMode}
                        onChange={(e) => onRefreshModeChange(e.target.value as any)}
                    >
                        <option value="off">خاموش</option>
                        <option value="5s">۵ ثانیه</option>
                        <option value="30s">۳۰ ثانیه</option>
                        <option value="1m">۱ دقیقه</option>
                        <option value="custom">سفارشی</option>
                    </select>

                    {refreshMode === 'custom' && (
                        <div className="flex items-center gap-1">
                            <input 
                                type="number" 
                                min="2" 
                                className="w-14 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-center font-bold"
                                value={customRefreshSeconds}
                                onChange={(e) => onCustomRefreshSecondsChange(Number(e.target.value))}
                                title="ثانیه"
                            />
                            <span className="text-[10px] text-slate-500">ثانیه</span>
                        </div>
                    )}

                    {nextRefreshCountdown !== null && (
                        <span className="text-xs font-mono bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 text-sky-600 dark:text-sky-300 px-2 py-1 rounded-md">
                            {nextRefreshCountdown}s
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={onManualRefresh}
                        disabled={isRefreshing}
                        className={`px-3 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5`}
                    >
                        {isRefreshing ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
                            </svg>
                        )}
                        <span>بروزرسانی دستی</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserFilterPanel;
