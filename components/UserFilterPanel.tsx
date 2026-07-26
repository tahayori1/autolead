
import React from 'react';
import type { Reference } from '../services/api';
import { LeadStatus, StaffUser } from '../types';

interface UserFilterPanelProps {
    filters: { 
        query: string; 
        carModel: string; 
        reference: string; 
        status: LeadStatus | 'all'; 
        myLeadsOnly?: boolean; 
        staffUserId?: string;
        activityFilter?: 'all' | 'no_activity' | 'has_activity';
        meetingFilter?: 'all' | 'has_meeting' | 'no_meeting';
    };
    onFilterChange: (filters: any) => void;
    onClear: () => void;
    references: Reference[];
    staffUsers: StaffUser[];

    // Optional legacy props to maintain backwards compatibility
    refreshMode?: 'off' | '5s' | '30s' | '1m' | 'custom';
    onRefreshModeChange?: (mode: 'off' | '5s' | '30s' | '1m' | 'custom') => void;
    customRefreshSeconds?: number;
    onCustomRefreshSecondsChange?: (seconds: number) => void;
    nextRefreshCountdown?: number | null;
    onManualRefresh?: () => void;
    isRefreshing?: boolean;
}

const CAR_MODELS = [
    'JAC J4', 'JAC S3', 'JAC S5', 'BAC X3PRO', 'KMC T8', 'KMC T9', 'KMC A5',
    'KMC J7', 'KMC X5', 'KMC SR3', 'KMC EAGLE', 'KMC SHADOW', 'KMC SR6'
];

const UserFilterPanel: React.FC<UserFilterPanelProps> = ({ 
    filters, onFilterChange, onClear, references, staffUsers
}) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    const toggleActivityFilter = () => {
        const newval = filters.activityFilter === 'no_activity' ? 'all' : 'no_activity';
        onFilterChange({ ...filters, activityFilter: newval });
    };

    const toggleMeetingFilter = () => {
        const newval = filters.meetingFilter === 'has_meeting' ? 'all' : 'has_meeting';
        onFilterChange({ ...filters, meetingFilter: newval });
    };

    return (
        <div className="w-full space-y-4">
            {/* Top Search Bar & Quick Action Badges */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="flex-1">
                    <label htmlFor="user-search" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">جستجو</label>
                    <input
                        id="user-search"
                        name="query"
                        type="text"
                        placeholder="جستجو بر اساس نام، شماره، خودرو، استان، شهر..."
                        className="w-full px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white dark:bg-slate-700"
                        value={filters.query}
                        onChange={handleChange}
                    />
                </div>

                {/* Quick Toggle Badges */}
                <div className="flex items-center gap-2 self-end md:self-auto pt-1 md:pt-5 flex-wrap">
                    <button
                        type="button"
                        onClick={toggleActivityFilter}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            filters.activityFilter === 'no_activity'
                                ? 'bg-amber-500 border-amber-600 text-white shadow-sm ring-2 ring-amber-300 dark:ring-amber-800'
                                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                        }`}
                        title="نمایش مشتریان بدون هیچ‌گونه گزارش تماس یا فعالیت"
                    >
                        <span>⚠️ بدون گزارش تماس / فعالیت</span>
                    </button>

                    <button
                        type="button"
                        onClick={toggleMeetingFilter}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            filters.meetingFilter === 'has_meeting'
                                ? 'bg-purple-600 border-purple-700 text-white shadow-sm ring-2 ring-purple-300 dark:ring-purple-800'
                                : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                        }`}
                        title="نمایش مشتریان دارای ملاقات حضوری"
                    >
                        <span>🤝 دارای ملاقات حضوری</span>
                    </button>
                </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                <div>
                    <label htmlFor="car-model-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">خودروی درخواستی</label>
                    <select
                        id="car-model-filter"
                        name="carModel"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
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
                    <label htmlFor="status-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">وضعیت سرنخ</label>
                    <select
                        id="status-filter"
                        name="status"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
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
                    <label htmlFor="activity-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">گزارش تماس / فعالیت</label>
                    <select
                        id="activity-filter"
                        name="activityFilter"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition font-medium text-slate-700 dark:text-slate-200"
                        value={filters.activityFilter || 'all'}
                        onChange={handleChange}
                    >
                        <option value="all">همه مشتریان</option>
                        <option value="no_activity">⚠️ بدون گزارش تماس/فعالیت</option>
                        <option value="has_activity">📝 دارای گزارش تماس/فعالیت</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="meeting-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ملاقات حضوری</label>
                    <select
                        id="meeting-filter"
                        name="meetingFilter"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition font-medium text-slate-700 dark:text-slate-200"
                        value={filters.meetingFilter || 'all'}
                        onChange={handleChange}
                    >
                        <option value="all">همه مشتریان</option>
                        <option value="has_meeting">🤝 دارای ملاقات حضوری</option>
                        <option value="no_meeting">🚫 بدون ملاقات حضوری</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="reference-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">مرجع</label>
                    <select
                        id="reference-filter"
                        name="reference"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
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
                    <label htmlFor="staff-user-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">کارشناس</label>
                    <select
                        id="staff-user-filter"
                        name="staffUserId"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition font-medium"
                        value={filters.staffUserId || 'all'}
                        onChange={handleChange}
                    >
                        <option value="all">همه کارشناسان</option>
                        {staffUsers.map(user => (
                            <option key={user.id} value={user.id}>{user.fullName || user.username}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Clear Filters Row */}
            <div className="flex justify-end pt-1">
                <button
                    onClick={onClear}
                    className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/80 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600 cursor-pointer"
                    title="پاک کردن تمامی فیلترها"
                >
                    پاک کردن فیلترها
                </button>
            </div>
        </div>
    );
};

export default UserFilterPanel;
