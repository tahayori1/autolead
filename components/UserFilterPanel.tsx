import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Reference } from '../services/api';
import { LeadStatus, StaffUser } from '../types';
import { 
    Search, 
    Filter, 
    RotateCcw, 
    X, 
    ChevronDown, 
    ChevronUp, 
    Car, 
    UserCheck, 
    MapPin, 
    SlidersHorizontal, 
    Layers, 
    Sparkles, 
    AlertTriangle, 
    CalendarCheck, 
    Building2,
    Loader2,
    Check
} from 'lucide-react';

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
    // Keep local draft filters so typing in query, city, province, etc. does NOT trigger server requests repeatedly
    const [draftFilters, setDraftFilters] = useState<UserFilters>(filters);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(true);

    // Synchronize draft filters when external filters change (e.g. on clear or initial load)
    useEffect(() => {
        setDraftFilters(filters);
    }, [filters]);

    // Handle draft field change without calling server
    const handleDraftChange = (field: keyof UserFilters, value: any) => {
        setDraftFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        handleDraftChange(name as keyof UserFilters, value);
    };

    // Apply filters explicitly
    const handleApply = useCallback(() => {
        onFilterChange(draftFilters);
    }, [draftFilters, onFilterChange]);

    // Handle Enter key inside any input
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    };

    // Quick change for items limit (immediately updates draft & applies)
    const handleItemsLimitChange = (val: ItemsLimitType) => {
        const updated = { ...draftFilters, itemsLimit: val };
        setDraftFilters(updated);
        onFilterChange(updated);
    };

    // Toggle activity filter
    const toggleActivityFilter = (type: 'no_activity' | 'has_activity') => {
        const newval = draftFilters.activityFilter === type ? 'all' : type;
        const updated = { ...draftFilters, activityFilter: newval };
        setDraftFilters(updated);
        onFilterChange(updated);
    };

    // Toggle meeting filter
    const toggleMeetingFilter = (type: 'has_meeting' | 'no_meeting') => {
        const newval = draftFilters.meetingFilter === type ? 'all' : type;
        const updated = { ...draftFilters, meetingFilter: newval };
        setDraftFilters(updated);
        onFilterChange(updated);
    };

    // Check if there are pending unapplied changes between draft and current active filters
    const hasPendingChanges = useMemo(() => {
        return (
            (draftFilters.query || '') !== (filters.query || '') ||
            draftFilters.carModel !== filters.carModel ||
            draftFilters.reference !== filters.reference ||
            draftFilters.status !== filters.status ||
            (draftFilters.province || '') !== (filters.province || '') ||
            (draftFilters.city || '') !== (filters.city || '') ||
            draftFilters.crmPerson !== filters.crmPerson ||
            draftFilters.lastEditedBy !== filters.lastEditedBy ||
            draftFilters.staffUserId !== filters.staffUserId ||
            draftFilters.activityFilter !== filters.activityFilter ||
            draftFilters.meetingFilter !== filters.meetingFilter ||
            draftFilters.itemsLimit !== filters.itemsLimit
        );
    }, [draftFilters, filters]);

    // Check if currently active filters have any active constraints applied
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.query?.trim()) count++;
        if (filters.carModel && filters.carModel !== 'all') count++;
        if (filters.reference && filters.reference !== 'all') count++;
        if (filters.status && filters.status !== 'all') count++;
        if (filters.province && filters.province !== 'all' && filters.province.trim() !== '') count++;
        if (filters.city && filters.city !== 'all' && filters.city.trim() !== '') count++;
        if (filters.crmPerson && filters.crmPerson !== 'all' && filters.crmPerson.trim() !== '') count++;
        if (filters.lastEditedBy && filters.lastEditedBy !== 'all' && filters.lastEditedBy.trim() !== '') count++;
        if (filters.staffUserId && filters.staffUserId !== 'all') count++;
        if (filters.activityFilter && filters.activityFilter !== 'all') count++;
        if (filters.meetingFilter && filters.meetingFilter !== 'all') count++;
        return count;
    }, [filters]);

    const isFiltered = activeFilterCount > 0;

    // Reset everything
    const handleResetAll = () => {
        const defaultState: UserFilters = {
            query: '',
            carModel: 'all',
            reference: 'all',
            status: 'all',
            myLeadsOnly: false,
            staffUserId: 'all',
            activityFilter: 'all',
            meetingFilter: 'all',
            province: '',
            city: '',
            crmPerson: 'all',
            lastEditedBy: 'all',
            itemsLimit: filters.itemsLimit || 500
        };
        setDraftFilters(defaultState);
        onClear();
    };

    // Remove single filter chip
    const handleRemoveSingleFilter = (key: keyof UserFilters, defaultValue: any) => {
        const updated = { ...filters, [key]: defaultValue };
        setDraftFilters(updated);
        onFilterChange(updated);
    };

    return (
        <div className="w-full bg-gradient-to-b from-white to-slate-50/70 dark:from-slate-800/95 dark:to-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-3.5 sm:p-4.5 space-y-3.5 transition-all">
            
            {/* Header: Title, Active Badges, Expand/Collapse & Reset Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70 dark:border-slate-700/70">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
                        <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-black text-slate-800 dark:text-white">
                                جستجو و فیلتر پیشرفته سرنخ‌ها
                            </h2>
                            {isFiltered && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                    {activeFilterCount.toLocaleString('fa-IR')} فیلتر فعال
                                </span>
                            )}
                            {hasPendingChanges && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    تغییرات آماده جستجو
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            برای جستجو در سرور، پس از درج عبارات روی دکمه جستجو کلیک کرده یا کلید Enter را بفشارید
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {totalLoadedCount !== undefined && (
                        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span>بارگذاری شده:</span>
                            <span className="font-mono text-slate-900 dark:text-white">{totalLoadedCount.toLocaleString('fa-IR')}</span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsAdvancedOpen(prev => !prev)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                        title={isAdvancedOpen ? 'بستن گزینه‌های فیلتر' : 'نمایش گزینه‌های فیلتر'}
                    >
                        <span>{isAdvancedOpen ? 'فیلترهای پیشرفته' : 'نمایش فیلترها'}</span>
                        {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isFiltered && (
                        <button
                            type="button"
                            onClick={handleResetAll}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="پاکسازی تمام فیلترها و بازنشانی به حالت پیش‌فرض"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>پاکسازی فیلترها</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Primary Search Bar & Action Row */}
            <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
                
                {/* Search Input Box */}
                <div className="flex-1 relative">
                    <div className="relative flex items-center">
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            id="user-search"
                            name="query"
                            type="text"
                            placeholder="جستجو در CRM (نام، شماره تماس، خودرو، استان، شهر، توضیحات...)"
                            className="w-full pr-10 pl-20 py-2.5 text-sm font-medium border border-slate-300/90 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition bg-white dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 shadow-xs"
                            value={draftFilters.query || ''}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                        />

                        {/* Action buttons inside the search input (Clear & Enter hint) */}
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            {draftFilters.query ? (
                                <button
                                    type="button"
                                    onClick={() => handleDraftChange('query', '')}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                                    title="پاک کردن متن جستجو"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            ) : null}
                            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-600 rounded border border-slate-200 dark:border-slate-500">
                                Enter ↵
                            </span>
                        </div>
                    </div>
                </div>

                {/* Explicit Search & Filter Button (Requested specifically by user) */}
                <button
                    type="button"
                    onClick={handleApply}
                    disabled={isFetching}
                    className={`h-[42px] px-5 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md select-none shrink-0 ${
                        hasPendingChanges
                            ? 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white ring-2 ring-sky-400 shadow-sky-500/25 active:scale-[0.98]'
                            : 'bg-slate-800 hover:bg-slate-900 dark:bg-sky-600 dark:hover:bg-sky-500 text-white active:scale-[0.98]'
                    } ${isFetching ? 'opacity-75 cursor-not-allowed' : ''}`}
                    title="اعمال فیلترها و استعلام از سرور"
                >
                    {isFetching ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>در حال استعلام...</span>
                        </>
                    ) : (
                        <>
                            <Search className="w-4 h-4" />
                            <span>جستجو و اعمال فیلتر</span>
                            {hasPendingChanges && (
                                <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
                            )}
                        </>
                    )}
                </button>

                {/* Items Limit Selector (200, 500, 1000, 2000, all) */}
                <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>بارگذاری:</span>
                    </span>
                    <div className="inline-flex rounded-lg bg-white dark:bg-slate-700 p-0.5 shadow-xs border border-slate-200/60 dark:border-slate-600/60">
                        {ITEMS_OPTIONS.map(opt => (
                            <button
                                key={String(opt.value)}
                                type="button"
                                onClick={() => handleItemsLimitChange(opt.value)}
                                className={`px-2.5 py-1 text-xs font-black rounded-md transition-all cursor-pointer ${
                                    draftFilters.itemsLimit === opt.value
                                        ? 'bg-sky-600 text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                                title={`بارگذاری تا ${opt.label} ردیف`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Toggle Pills: Activity & Meetings */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    فیلترهای سریع:
                </span>

                <button
                    type="button"
                    onClick={() => toggleActivityFilter('no_activity')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        draftFilters.activityFilter === 'no_activity'
                            ? 'bg-amber-500 border-amber-600 text-white shadow-xs ring-2 ring-amber-300 dark:ring-amber-800'
                            : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100/80 dark:hover:bg-amber-900/30'
                    }`}
                    title="نمایش سرنخ‌های بدون ثبت هرگونه گزارش تماس یا فعالیت"
                >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>⚠️ بدون گزارش تماس/فعالیت</span>
                    {draftFilters.activityFilter === 'no_activity' && (
                        <Check className="w-3 h-3" />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => toggleActivityFilter('has_activity')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        draftFilters.activityFilter === 'has_activity'
                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs ring-2 ring-emerald-300 dark:ring-emerald-800'
                            : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30'
                    }`}
                    title="نمایش سرنخ‌های دارای گزارش فعالیت"
                >
                    <span>📝 دارای گزارش تماس/فعالیت</span>
                    {draftFilters.activityFilter === 'has_activity' && (
                        <Check className="w-3 h-3" />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => toggleMeetingFilter('has_meeting')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        draftFilters.meetingFilter === 'has_meeting'
                            ? 'bg-purple-600 border-purple-700 text-white shadow-xs ring-2 ring-purple-300 dark:ring-purple-800'
                            : 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-800/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100/80 dark:hover:bg-purple-900/30'
                    }`}
                    title="نمایش سرنخ‌های دارای جلسه یا ملاقات حضوری"
                >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>🤝 دارای ملاقات حضوری</span>
                    {draftFilters.meetingFilter === 'has_meeting' && (
                        <Check className="w-3 h-3" />
                    )}
                </button>
            </div>

            {/* Advanced Filters Grid (Collapsible) */}
            {isAdvancedOpen && (
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 space-y-3 animate-fadeIn">
                    
                    {/* Filter Fields - Responsive Bento Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        
                        {/* 1. Car Model */}
                        <div>
                            <label htmlFor="car-model-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                                <Car className="w-3 h-3 text-sky-500" />
                                <span>خودروی درخواستی</span>
                            </label>
                            <select
                                id="car-model-filter"
                                name="carModel"
                                className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300/80 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-slate-800 dark:text-slate-100 shadow-2xs"
                                value={draftFilters.carModel}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all">همه مدل‌ها</option>
                                {CAR_MODELS.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Lead Status */}
                        <div>
                            <label htmlFor="status-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span>وضعیت سرنخ (leadStatus)</span>
                            </label>
                            <select
                                id="status-filter"
                                name="status"
                                className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300/80 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-slate-800 dark:text-slate-100 shadow-2xs"
                                value={draftFilters.status}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all">همه وضعیت‌ها</option>
                                {Object.values(LeadStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Reference */}
                        <div>
                            <label htmlFor="reference-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                                <span>🌐</span>
                                <span>مرجع سرنخ (reference)</span>
                            </label>
                            <select
                                id="reference-filter"
                                name="reference"
                                className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300/80 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-slate-800 dark:text-slate-100 shadow-2xs"
                                value={draftFilters.reference}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all">همه مراجع</option>
                                {references.map(ref => (
                                    <option key={ref.reference} value={ref.reference}>{ref.reference}</option>
                                ))}
                            </select>
                        </div>

                        {/* 4. CRM Person */}
                        <div>
                            <label htmlFor="crm-person-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-purple-500" />
                                <span>مسئول CRM (crmPerson)</span>
                            </label>
                            <select
                                id="crm-person-filter"
                                name="crmPerson"
                                className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300/80 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-slate-800 dark:text-slate-100 shadow-2xs"
                                value={draftFilters.crmPerson || 'all'}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all">همه مسئولان CRM</option>
                                {availableCrmPersons.map(person => (
                                    <option key={person} value={person}>{person}</option>
                                ))}
                            </select>
                        </div>

                        {/* 5. Last Edited By */}
                        <div>
                            <label htmlFor="last-edited-by-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                                <span>✍️</span>
                                <span>آخرین ویرایش‌کننده</span>
                            </label>
                            <select
                                id="last-edited-by-filter"
                                name="lastEditedBy"
                                className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300/80 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-slate-800 dark:text-slate-100 shadow-2xs"
                                value={draftFilters.lastEditedBy || 'all'}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all">همه ویرایش‌کنندگان</option>
                                {availableLastEditedBys.map(editor => (
                                    <option key={editor} value={editor}>{editor}</option>
                                ))}
                            </select>
                        </div>

                        {/* 6. Staff User */}
                        <div>
                            <label htmlFor="staff-user-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                                <span>💼</span>
                                <span>کارشناس ثبت‌نام / سیستم</span>
                            </label>
                            <select
                                id="staff-user-filter"
                                name="staffUserId"
                                className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300/80 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-slate-800 dark:text-slate-100 shadow-2xs"
                                value={draftFilters.staffUserId || 'all'}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all">همه کارشناسان</option>
                                {staffUsers.map(user => (
                                    <option key={user.id} value={user.id}>{user.fullName || user.username}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Filter Fields - Row 2 (Location & Contact Status) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2.5 pt-0.5">
                        
                        {/* 7. Province */}
                        <div>
                            <label htmlFor="province-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500" />
                                <span>استان (Province)</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="province-filter"
                                    name="province"
                                    type="text"
                                    list="provinces-datalist"
                                    placeholder="فارس، تهران، خوزستان..."
                                    className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300/80 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-slate-800 dark:text-slate-100 shadow-2xs"
                                    value={draftFilters.province || ''}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                />
                                {draftFilters.province && (
                                    <button
                                        type="button"
                                        onClick={() => handleDraftChange('province', '')}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <datalist id="provinces-datalist">
                                {availableProvinces.map(p => (
                                    <option key={p} value={p} />
                                ))}
                            </datalist>
                        </div>

                        {/* 8. City */}
                        <div>
                            <label htmlFor="city-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-blue-500" />
                                <span>شهر (City)</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="city-filter"
                                    name="city"
                                    type="text"
                                    list="cities-datalist"
                                    placeholder="شیراز، کرج، تهران..."
                                    className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300/80 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-slate-800 dark:text-slate-100 shadow-2xs"
                                    value={draftFilters.city || ''}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                />
                                {draftFilters.city && (
                                    <button
                                        type="button"
                                        onClick={() => handleDraftChange('city', '')}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <datalist id="cities-datalist">
                                {availableCities.map(c => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                        </div>

                        {/* 9. Activity Dropdown */}
                        <div>
                            <label htmlFor="activity-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                گزارش تماس / فعالیت
                            </label>
                            <select
                                id="activity-filter"
                                name="activityFilter"
                                className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300/80 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-slate-800 dark:text-slate-100 shadow-2xs"
                                value={draftFilters.activityFilter || 'all'}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all">همه مشتریان</option>
                                <option value="no_activity">⚠️ بدون گزارش تماس/فعالیت</option>
                                <option value="has_activity">📝 دارای گزارش تماس/فعالیت</option>
                            </select>
                        </div>

                        {/* 10. Meeting Dropdown */}
                        <div>
                            <label htmlFor="meeting-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                ملاقات حضوری
                            </label>
                            <select
                                id="meeting-filter"
                                name="meetingFilter"
                                className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300/80 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-slate-800 dark:text-slate-100 shadow-2xs"
                                value={draftFilters.meetingFilter || 'all'}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all">همه مشتریان</option>
                                <option value="has_meeting">🤝 دارای ملاقات حضوری</option>
                                <option value="no_meeting">🚫 بدون ملاقات حضوری</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Filters Chips Bar (Instant feedback on what is actively filtered) */}
            {isFiltered && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 ml-1">
                        فیلترهای اعمال‌شده:
                    </span>

                    {filters.query && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-bold">
                            <span>جستجو: {filters.query}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveSingleFilter('query', '')}
                                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.carModel && filters.carModel !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-[11px] font-bold">
                            <span>خودرو: {filters.carModel}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveSingleFilter('carModel', 'all')}
                                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.status && filters.status !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                            <span>وضعیت: {filters.status}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveSingleFilter('status', 'all')}
                                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.province && filters.province !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold">
                            <span>استان: {filters.province}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveSingleFilter('province', '')}
                                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.city && filters.city !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold">
                            <span>شهر: {filters.city}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveSingleFilter('city', '')}
                                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.reference && filters.reference !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold">
                            <span>مرجع: {filters.reference}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveSingleFilter('reference', 'all')}
                                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.crmPerson && filters.crmPerson !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-bold">
                            <span>مسئول CRM: {filters.crmPerson}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveSingleFilter('crmPerson', 'all')}
                                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.lastEditedBy && filters.lastEditedBy !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold">
                            <span>ویرایش‌کننده: {filters.lastEditedBy}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveSingleFilter('lastEditedBy', 'all')}
                                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.activityFilter && filters.activityFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold">
                            <span>{filters.activityFilter === 'no_activity' ? 'بدون گزارش تماس' : 'دارای گزارش تماس'}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveSingleFilter('activityFilter', 'all')}
                                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.meetingFilter && filters.meetingFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-bold">
                            <span>{filters.meetingFilter === 'has_meeting' ? 'دارای ملاقات حضوری' : 'بدون ملاقات حضوری'}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveSingleFilter('meetingFilter', 'all')}
                                className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={handleResetAll}
                        className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold px-1 py-0.5 cursor-pointer"
                    >
                        حذف همه
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserFilterPanel;
