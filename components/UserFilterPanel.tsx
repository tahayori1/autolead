import React from 'react';
import type { Reference } from '../services/api';
import { LeadStatus, StaffUser } from '../types';

export type ItemsLimitType = 200 | 500 | 1000 | 2000 | 'all';

export interface UserFilters { 
    query: string; 
    carModel: string; 
    reference: string; 
    status: LeadStatus | 'all'; 
    myLeadsOnly?: boolean; 
    staffUserId?: string; 
    activityFilter?: 'all' | 'no_activity' | 'has_activity';
    meetingFilter?: 'all' | 'has_meeting' | 'no_meeting';
    province?: string;
    city?: string;
    crmPerson?: string;
    lastEditedBy?: string;
    itemsLimit: ItemsLimitType;
}

interface UserFilterPanelProps {
    filters: UserFilters;
    onFilterChange: (filters: UserFilters) => void;
    onClear: () => void;
    references: Reference[];
    staffUsers: StaffUser[];
    availableProvinces?: string[];
    availableCities?: string[];
    availableCrmPersons?: string[];
    availableLastEditedBys?: string[];
    isFetching?: boolean;
    totalLoadedCount?: number;

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

const ITEMS_OPTIONS: { label: string; value: ItemsLimitType }[] = [
    { label: '۲۰۰', value: 200 },
    { label: '۵۰۰', value: 500 },
    { label: '۱,۰۰۰', value: 1000 },
    { label: '۲,۰۰۰', value: 2000 },
    { label: 'همه (All)', value: 'all' },
];

const UserFilterPanel: React.FC<UserFilterPanelProps> = ({ 
    filters, 
    onFilterChange, 
    onClear, 
    references, 
    staffUsers,
    availableProvinces = [],
    availableCities = [],
    availableCrmPersons = [],
    availableLastEditedBys = [],
    isFetching = false,
    totalLoadedCount,
}) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    const handleItemsLimitChange = (val: ItemsLimitType) => {
        onFilterChange({ ...filters, itemsLimit: val });
    };

    const toggleActivityFilter = () => {
        const newval = filters.activityFilter === 'no_activity' ? 'all' : 'no_activity';
        onFilterChange({ ...filters, activityFilter: newval });
    };

    const toggleMeetingFilter = () => {
        const newval = filters.meetingFilter === 'has_meeting' ? 'all' : 'has_meeting';
        onFilterChange({ ...filters, meetingFilter: newval });
    };

    const isFiltered = filters.query || 
        filters.carModel !== 'all' || 
        filters.reference !== 'all' || 
        filters.status !== 'all' || 
        (filters.staffUserId && filters.staffUserId !== 'all') ||
        (filters.activityFilter && filters.activityFilter !== 'all') ||
        (filters.meetingFilter && filters.meetingFilter !== 'all') ||
        (filters.province && filters.province !== 'all' && filters.province.trim() !== '') ||
        (filters.city && filters.city !== 'all' && filters.city.trim() !== '') ||
        (filters.crmPerson && filters.crmPerson !== 'all' && filters.crmPerson.trim() !== '') ||
        (filters.lastEditedBy && filters.lastEditedBy !== 'all' && filters.lastEditedBy.trim() !== '');

    return (
        <div className="w-full space-y-3.5">
            {/* Top Row: Search Bar & Items Limit & Quick Action Badges */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <label htmlFor="user-search" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        جستجو در CRM (نام، شماره، خودرو، استان، شهر، توضیحات...)
                    </label>
                    <div className="relative">
                        <input
                            id="user-search"
                            name="query"
                            type="text"
                            placeholder="جستجو مستقیم در سرور و سامانه..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white dark:bg-slate-700"
                            value={filters.query}
                            onChange={handleChange}
                        />
                        {isFetching ? (
                            <div className="absolute left-3 top-2.5 text-sky-500 animate-spin">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                            </div>
                        ) : filters.query ? (
                            <button
                                type="button"
                                onClick={() => onFilterChange({ ...filters, query: '' })}
                                className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                                title="پاک کردن جستجو"
                            >
                                ✕
                            </button>
                        ) : null}
                    </div>
                </div>

                {/* Items Limit Selector (200, 500, 1000, 2000, all) */}
                <div className="flex flex-col">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        تعداد بارگذاری (سرعت بهینه)
                    </label>
                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                        {ITEMS_OPTIONS.map(opt => (
                            <button
                                key={String(opt.value)}
                                type="button"
                                onClick={() => handleItemsLimitChange(opt.value)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    filters.itemsLimit === opt.value
                                        ? 'bg-sky-600 text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                                title={`بارگذاری ${opt.label} ردیف سرنخ`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Toggle Badges */}
                <div className="flex items-center gap-2 self-start lg:self-end pt-1 lg:pt-5 flex-wrap">
                    <button
                        type="button"
                        onClick={toggleActivityFilter}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            filters.activityFilter === 'no_activity'
                                ? 'bg-amber-500 border-amber-600 text-white shadow-sm ring-2 ring-amber-300 dark:ring-amber-800'
                                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                        }`}
                        title="نمایش سرنخ‌های بدون ثبت گزارش تماس یا فعالیت"
                    >
                        <span>⚠️ بدون گزارش تماس/فعالیت</span>
                    </button>

                    <button
                        type="button"
                        onClick={toggleMeetingFilter}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            filters.meetingFilter === 'has_meeting'
                                ? 'bg-purple-600 border-purple-700 text-white shadow-sm ring-2 ring-purple-300 dark:ring-purple-800'
                                : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                        }`}
                        title="نمایش سرنخ‌های دارای جلسه یا ملاقات حضوری"
                    >
                        <span>🤝 دارای ملاقات حضوری</span>
                    </button>
                </div>
            </div>

            {/* Filter Dropdowns Grid - Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 items-end">
                {/* 1. Car Model */}
                <div>
                    <label htmlFor="car-model-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">خودروی درخواستی</label>
                    <select
                        id="car-model-filter"
                        name="carModel"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                        value={filters.carModel}
                        onChange={handleChange}
                    >
                        <option value="all">همه مدل‌ها</option>
                        {CAR_MODELS.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>

                {/* 2. Lead Status */}
                <div>
                    <label htmlFor="status-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">وضعیت سرنخ (leadStatus)</label>
                    <select
                        id="status-filter"
                        name="status"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                        value={filters.status}
                        onChange={handleChange}
                    >
                        <option value="all">همه وضعیت‌ها</option>
                        {Object.values(LeadStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {/* 3. Reference */}
                <div>
                    <label htmlFor="reference-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">مرجع سرنخ (reference)</label>
                    <select
                        id="reference-filter"
                        name="reference"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                        value={filters.reference}
                        onChange={handleChange}
                    >
                        <option value="all">همه مراجع</option>
                        {references.map(ref => (
                            <option key={ref.reference} value={ref.reference}>{ref.reference}</option>
                        ))}
                    </select>
                </div>

                {/* 4. CRM Person */}
                <div>
                    <label htmlFor="crm-person-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">مسئول CRM (crmPerson)</label>
                    <select
                        id="crm-person-filter"
                        name="crmPerson"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                        value={filters.crmPerson || 'all'}
                        onChange={handleChange}
                    >
                        <option value="all">همه مسئولان CRM</option>
                        {availableCrmPersons.map(person => (
                            <option key={person} value={person}>{person}</option>
                        ))}
                    </select>
                </div>

                {/* 5. Last Edited By */}
                <div>
                    <label htmlFor="last-edited-by-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">آخرین ویرایش‌کننده (lastEditedBy)</label>
                    <select
                        id="last-edited-by-filter"
                        name="lastEditedBy"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                        value={filters.lastEditedBy || 'all'}
                        onChange={handleChange}
                    >
                        <option value="all">همه ویرایش‌کنندگان</option>
                        {availableLastEditedBys.map(editor => (
                            <option key={editor} value={editor}>{editor}</option>
                        ))}
                    </select>
                </div>

                {/* 6. Staff User */}
                <div>
                    <label htmlFor="staff-user-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">کارشناس ثبت‌نام / سیستم</label>
                    <select
                        id="staff-user-filter"
                        name="staffUserId"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition font-medium"
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

            {/* Filter Dropdowns Grid - Row 2 (Province, City, Activity, Meeting, Clear) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 items-end pt-0.5">
                {/* 7. Province */}
                <div>
                    <label htmlFor="province-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">استان (Province)</label>
                    <input
                        id="province-filter"
                        name="province"
                        type="text"
                        list="provinces-datalist"
                        placeholder="فارس، تهران، خوزستان..."
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                        value={filters.province || ''}
                        onChange={handleChange}
                    />
                    <datalist id="provinces-datalist">
                        {availableProvinces.map(p => (
                            <option key={p} value={p} />
                        ))}
                    </datalist>
                </div>

                {/* 8. City */}
                <div>
                    <label htmlFor="city-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">شهر (City)</label>
                    <input
                        id="city-filter"
                        name="city"
                        type="text"
                        list="cities-datalist"
                        placeholder="شیراز، کرج، تهران..."
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                        value={filters.city || ''}
                        onChange={handleChange}
                    />
                    <datalist id="cities-datalist">
                        {availableCities.map(c => (
                            <option key={c} value={c} />
                        ))}
                    </datalist>
                </div>

                {/* 9. Activity Dropdown */}
                <div>
                    <label htmlFor="activity-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">گزارش تماس / فعالیت</label>
                    <select
                        id="activity-filter"
                        name="activityFilter"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition font-medium text-slate-700 dark:text-slate-200"
                        value={filters.activityFilter || 'all'}
                        onChange={handleChange}
                    >
                        <option value="all">همه مشتریان</option>
                        <option value="no_activity">⚠️ بدون گزارش تماس/فعالیت</option>
                        <option value="has_activity">📝 دارای گزارش تماس/فعالیت</option>
                    </select>
                </div>

                {/* 10. Meeting Dropdown */}
                <div>
                    <label htmlFor="meeting-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ملاقات حضوری</label>
                    <select
                        id="meeting-filter"
                        name="meetingFilter"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition font-medium text-slate-700 dark:text-slate-200"
                        value={filters.meetingFilter || 'all'}
                        onChange={handleChange}
                    >
                        <option value="all">همه مشتریان</option>
                        <option value="has_meeting">🤝 دارای ملاقات حضوری</option>
                        <option value="no_meeting">🚫 بدون ملاقات حضوری</option>
                    </select>
                </div>

                {/* Stats and Clear Button Column */}
                <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-1">
                    {totalLoadedCount !== undefined && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            بارگذاری شده: <strong className="text-slate-700 dark:text-slate-200 font-bold">{totalLoadedCount.toLocaleString('fa-IR')}</strong>
                        </span>
                    )}

                    {isFiltered && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="px-3.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors border border-rose-200 dark:border-rose-800 cursor-pointer flex items-center gap-1"
                            title="پاک کردن تمامی فیلترها"
                        >
                            <span>✕</span>
                            <span>پاک کردن فیلترها</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserFilterPanel;
