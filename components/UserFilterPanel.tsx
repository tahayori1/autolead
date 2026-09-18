import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Reference } from '../services/api';
import { LeadStatus, StaffUser } from '../types';
import { 
    Search, 
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
    Check,
    User as UserIcon,
    FileText
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
    { label: 'همه', value: 'all' },
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
    // Local draft filters: changes will not send requests until "جستجو و اعمال فیلتر" or Enter is pressed
    const [draftFilters, setDraftFilters] = useState<UserFilters>(filters);
    // Advanced filters are closed by default as requested: "در حالت پیشفرض فیلترهای پیشرفته بسته باشد"
    const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);

    // Sync draft filters if parent filters change externally (e.g. on clear or initial load)
    useEffect(() => {
        setDraftFilters(filters);
    }, [filters]);

    // Handle draft field updates
    const handleDraftChange = (field: keyof UserFilters, value: any) => {
        setDraftFilters(prev => ({ ...prev, [field]: value }));
    };

    // Apply filters to trigger parent query
    const handleApply = useCallback(() => {
        onFilterChange(draftFilters);
    }, [draftFilters, onFilterChange]);

    // Enter key submits the search
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    };

    // Fast toggle for items limit
    const handleItemsLimitChange = (val: ItemsLimitType) => {
        const updated = { ...draftFilters, itemsLimit: val };
        setDraftFilters(updated);
        onFilterChange(updated);
    };

    // Activity pill filter toggle
    const toggleActivityFilter = (type: 'no_activity' | 'has_activity') => {
        const newval = draftFilters.activityFilter === type ? 'all' : type;
        const updated = { ...draftFilters, activityFilter: newval };
        setDraftFilters(updated);
        onFilterChange(updated);
    };

    // Meeting pill filter toggle
    const toggleMeetingFilter = (type: 'has_meeting' | 'no_meeting') => {
        const newval = draftFilters.meetingFilter === type ? 'all' : type;
        const updated = { ...draftFilters, meetingFilter: newval };
        setDraftFilters(updated);
        onFilterChange(updated);
    };

    // Check if there are unapplied changes in draft
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

    // Count currently applied filters
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

    // Count how many advanced filters specifically are active (to show on toggle button)
    const activeAdvancedFilterCount = useMemo(() => {
        let count = 0;
        if (filters.carModel && filters.carModel !== 'all') count++;
        if (filters.reference && filters.reference !== 'all') count++;
        if (filters.status && filters.status !== 'all') count++;
        if (filters.province && filters.province !== 'all' && filters.province.trim() !== '') count++;
        if (filters.city && filters.city !== 'all' && filters.city.trim() !== '') count++;
        if (filters.crmPerson && filters.crmPerson !== 'all' && filters.crmPerson.trim() !== '') count++;
        if (filters.lastEditedBy && filters.lastEditedBy !== 'all' && filters.lastEditedBy.trim() !== '') count++;
        if (filters.staffUserId && filters.staffUserId !== 'all') count++;
        return count;
    }, [filters]);

    const isFiltered = activeFilterCount > 0;

    // Reset all filters
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

    // Remove single filter tag
    const handleRemoveSingleFilter = (key: keyof UserFilters, defaultValue: any) => {
        const updated = { ...filters, [key]: defaultValue };
        setDraftFilters(updated);
        onFilterChange(updated);
    };

    return (
        <div className="w-full bg-gradient-to-b from-white to-slate-50/70 dark:from-slate-800/95 dark:to-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-3.5 sm:p-4.5 space-y-3 transition-all">
            
            {/* Header: Title, Active Badges, Expand/Collapse & Reset Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70 dark:border-slate-700/70">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
                        <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-black text-slate-800 dark:text-white">
                                جستجو و فیلتر سرنخ‌ها
                            </h2>
                            {isFiltered && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                    {activeFilterCount.toLocaleString('fa-IR')} فیلتر فعال
                                </span>
                            )}
                            {hasPendingChanges && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    آماده اعمال
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            برای جستجو در سرور، پس از درج مقادیر روی دکمه جستجو کلیک کرده یا کلید اینتر را بفشارید
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

                    {isFiltered && (
                        <button
                            type="button"
                            onClick={handleResetAll}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="پاکسازی تمام فیلترها و بازنشانی"
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
                            placeholder="جستجو بر اساس نام، شماره تماس، خودرو، استان، شهر، توضیحات..."
                            className="w-full pr-10 pl-20 py-2.5 text-sm font-medium border border-slate-300/90 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition bg-white dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 shadow-xs"
                            value={draftFilters.query || ''}
                            onChange={(e) => handleDraftChange('query', e.target.value)}
                            onKeyDown={handleKeyDown}
                        />

                        {/* Clear & Enter hint */}
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            {draftFilters.query ? (
                                <button
                                    type="button"
                                    onClick={() => handleDraftChange('query', '')}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                                    title="پاک کردن متن"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            ) : null}
                            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-sans text-slate-400 bg-slate-100 dark:bg-slate-600 rounded border border-slate-200 dark:border-slate-500">
                                اینتر ↵
                            </span>
                        </div>
                    </div>
                </div>

                {/* Explicit Search & Filter Button */}
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

                {/* Items Limit Selector */}
                <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>تعداد بارگذاری:</span>
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

            {/* Quick Filter Pills Row (Always visible) */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    فیلترهای سریع:
                </span>

                {/* 1. بدون گزارش فعالیت */}
                <button
                    type="button"
                    onClick={() => toggleActivityFilter('no_activity')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        draftFilters.activityFilter === 'no_activity'
                            ? 'bg-amber-500 border-amber-600 text-white shadow-xs ring-2 ring-amber-300 dark:ring-amber-800'
                            : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100/80 dark:hover:bg-amber-900/30'
                    }`}
                    title="نمایش سرنخ‌های بدون ثبت گزارش تماس یا فعالیت"
                >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>⚠️ بدون گزارش تماس/فعالیت</span>
                    {draftFilters.activityFilter === 'no_activity' && (
                        <Check className="w-3 h-3" />
                    )}
                </button>

                {/* 2. دارای گزارش تماس */}
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
                    <FileText className="w-3.5 h-3.5" />
                    <span>دارای گزارش تماس/فعالیت</span>
                    {draftFilters.activityFilter === 'has_activity' && (
                        <Check className="w-3 h-3" />
                    )}
                </button>

                {/* 3. دارای ملاقات حضوری */}
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

                {/* 4. بدون ملاقات حضوری */}
                <button
                    type="button"
                    onClick={() => toggleMeetingFilter('no_meeting')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        draftFilters.meetingFilter === 'no_meeting'
                            ? 'bg-rose-600 border-rose-700 text-white shadow-xs ring-2 ring-rose-300 dark:ring-rose-800'
                            : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-900/30'
                    }`}
                    title="نمایش سرنخ‌های بدون ملاقات حضوری"
                >
                    <span>🚫 بدون ملاقات حضوری</span>
                    {draftFilters.meetingFilter === 'no_meeting' && (
                        <Check className="w-3 h-3" />
                    )}
                </button>

                {/* Advanced Filters Toggle Button (Styled as a sleek quick-filter pill) */}
                <button
                    type="button"
                    onClick={() => setIsAdvancedOpen(prev => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs mr-auto ${
                        isAdvancedOpen
                            ? 'bg-sky-600 border-sky-700 text-white'
                            : activeAdvancedFilterCount > 0
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-700 dark:text-sky-300 ring-1 ring-sky-400'
                            : 'bg-slate-100/90 dark:bg-slate-700/80 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                    title={isAdvancedOpen ? 'بستن سایر فیلترها' : 'نمایش سایر فیلترها'}
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>فیلترهای بیشتر</span>
                    {activeAdvancedFilterCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/90 text-sky-800 dark:bg-slate-800 dark:text-sky-300">
                            {activeAdvancedFilterCount.toLocaleString('fa-IR')}
                        </span>
                    )}
                    {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* Advanced Filters Row: All styled identically to Quick Filter Pills! (Closed by default) */}
            {isAdvancedOpen && (
                <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 space-y-2.5 animate-fadeIn">
                    <div className="flex flex-wrap items-center gap-2">
                        
                        {/* 1. Car Model Pill Filter */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs ${
                            draftFilters.carModel && draftFilters.carModel !== 'all'
                                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-800 dark:text-sky-200 ring-1 ring-sky-300 dark:ring-sky-700'
                                : 'bg-white dark:bg-slate-750 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                        }`}>
                            <Car className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">خودرو:</span>
                            <select
                                id="car-model-filter"
                                name="carModel"
                                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer pr-1"
                                value={draftFilters.carModel}
                                onChange={(e) => handleDraftChange('carModel', e.target.value)}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all" className="dark:bg-slate-800">همه مدل‌ها</option>
                                {CAR_MODELS.map(model => (
                                    <option key={model} value={model} className="dark:bg-slate-800">{model}</option>
                                ))}
                            </select>
                            {draftFilters.carModel && draftFilters.carModel !== 'all' && (
                                <button
                                    type="button"
                                    onClick={() => handleDraftChange('carModel', 'all')}
                                    className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* 2. Lead Status Pill Filter */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs ${
                            draftFilters.status && draftFilters.status !== 'all'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-300 dark:ring-emerald-700'
                                : 'bg-white dark:bg-slate-750 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                        }`}>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">وضعیت سرنخ:</span>
                            <select
                                id="status-filter"
                                name="status"
                                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer pr-1"
                                value={draftFilters.status}
                                onChange={(e) => handleDraftChange('status', e.target.value)}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all" className="dark:bg-slate-800">همه وضعیت‌ها</option>
                                {Object.values(LeadStatus).map(status => (
                                    <option key={status} value={status} className="dark:bg-slate-800">{status}</option>
                                ))}
                            </select>
                            {draftFilters.status && draftFilters.status !== 'all' && (
                                <button
                                    type="button"
                                    onClick={() => handleDraftChange('status', 'all')}
                                    className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* 3. Reference Pill Filter */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs ${
                            draftFilters.reference && draftFilters.reference !== 'all'
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 text-indigo-800 dark:text-indigo-200 ring-1 ring-indigo-300 dark:ring-indigo-700'
                                : 'bg-white dark:bg-slate-750 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                        }`}>
                            <span>🌐</span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">مرجع سرنخ:</span>
                            <select
                                id="reference-filter"
                                name="reference"
                                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer pr-1 max-w-[130px] truncate"
                                value={draftFilters.reference}
                                onChange={(e) => handleDraftChange('reference', e.target.value)}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all" className="dark:bg-slate-800">همه مراجع</option>
                                {references.map(ref => (
                                    <option key={ref.reference} value={ref.reference} className="dark:bg-slate-800">{ref.reference}</option>
                                ))}
                            </select>
                            {draftFilters.reference && draftFilters.reference !== 'all' && (
                                <button
                                    type="button"
                                    onClick={() => handleDraftChange('reference', 'all')}
                                    className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* 4. CRM Person Pill Filter */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs ${
                            draftFilters.crmPerson && draftFilters.crmPerson !== 'all'
                                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-800 dark:text-purple-200 ring-1 ring-purple-300 dark:ring-purple-700'
                                : 'bg-white dark:bg-slate-750 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                        }`}>
                            <UserCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">مسئول CRM:</span>
                            <select
                                id="crm-person-filter"
                                name="crmPerson"
                                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer pr-1 max-w-[120px] truncate"
                                value={draftFilters.crmPerson || 'all'}
                                onChange={(e) => handleDraftChange('crmPerson', e.target.value)}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all" className="dark:bg-slate-800">همه مسئولان</option>
                                {availableCrmPersons.map(person => (
                                    <option key={person} value={person} className="dark:bg-slate-800">{person}</option>
                                ))}
                            </select>
                            {draftFilters.crmPerson && draftFilters.crmPerson !== 'all' && (
                                <button
                                    type="button"
                                    onClick={() => handleDraftChange('crmPerson', 'all')}
                                    className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* 5. Last Edited By Pill Filter */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs ${
                            draftFilters.lastEditedBy && draftFilters.lastEditedBy !== 'all'
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-200 ring-1 ring-amber-300 dark:ring-amber-700'
                                : 'bg-white dark:bg-slate-750 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                        }`}>
                            <span>✍️</span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">آخرین ویرایش‌کننده:</span>
                            <select
                                id="last-edited-by-filter"
                                name="lastEditedBy"
                                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer pr-1 max-w-[120px] truncate"
                                value={draftFilters.lastEditedBy || 'all'}
                                onChange={(e) => handleDraftChange('lastEditedBy', e.target.value)}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all" className="dark:bg-slate-800">همه ویرایش‌کنندگان</option>
                                {availableLastEditedBys.map(editor => (
                                    <option key={editor} value={editor} className="dark:bg-slate-800">{editor}</option>
                                ))}
                            </select>
                            {draftFilters.lastEditedBy && draftFilters.lastEditedBy !== 'all' && (
                                <button
                                    type="button"
                                    onClick={() => handleDraftChange('lastEditedBy', 'all')}
                                    className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* 6. Staff User Pill Filter */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs ${
                            draftFilters.staffUserId && draftFilters.staffUserId !== 'all'
                                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-400 text-cyan-800 dark:text-cyan-200 ring-1 ring-cyan-300 dark:ring-cyan-700'
                                : 'bg-white dark:bg-slate-750 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                        }`}>
                            <UserIcon className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">کارشناس ثبت‌نام:</span>
                            <select
                                id="staff-user-filter"
                                name="staffUserId"
                                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer pr-1 max-w-[120px] truncate"
                                value={draftFilters.staffUserId || 'all'}
                                onChange={(e) => handleDraftChange('staffUserId', e.target.value)}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="all" className="dark:bg-slate-800">همه کارشناسان</option>
                                {staffUsers.map(user => (
                                    <option key={user.id} value={user.id} className="dark:bg-slate-800">{user.fullName || user.username}</option>
                                ))}
                            </select>
                            {draftFilters.staffUserId && draftFilters.staffUserId !== 'all' && (
                                <button
                                    type="button"
                                    onClick={() => handleDraftChange('staffUserId', 'all')}
                                    className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* 7. Province Pill Filter */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs ${
                            draftFilters.province && draftFilters.province.trim() !== ''
                                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-800 dark:text-rose-200 ring-1 ring-rose-300 dark:ring-rose-700'
                                : 'bg-white dark:bg-slate-750 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                        }`}>
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">استان:</span>
                            <input
                                id="province-filter"
                                name="province"
                                type="text"
                                list="provinces-datalist"
                                placeholder="فارس، تهران..."
                                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none w-24 pr-1 placeholder:text-slate-400"
                                value={draftFilters.province || ''}
                                onChange={(e) => handleDraftChange('province', e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            {draftFilters.province && (
                                <button
                                    type="button"
                                    onClick={() => handleDraftChange('province', '')}
                                    className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                            <datalist id="provinces-datalist">
                                {availableProvinces.map(p => (
                                    <option key={p} value={p} />
                                ))}
                            </datalist>
                        </div>

                        {/* 8. City Pill Filter */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs ${
                            draftFilters.city && draftFilters.city.trim() !== ''
                                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-800 dark:text-blue-200 ring-1 ring-blue-300 dark:ring-blue-700'
                                : 'bg-white dark:bg-slate-750 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                        }`}>
                            <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">شهر:</span>
                            <input
                                id="city-filter"
                                name="city"
                                type="text"
                                list="cities-datalist"
                                placeholder="شیراز، کرج..."
                                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none w-24 pr-1 placeholder:text-slate-400"
                                value={draftFilters.city || ''}
                                onChange={(e) => handleDraftChange('city', e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            {draftFilters.city && (
                                <button
                                    type="button"
                                    onClick={() => handleDraftChange('city', '')}
                                    className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                            <datalist id="cities-datalist">
                                {availableCities.map(c => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Filters Chips Bar */}
            {isFiltered && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 ml-1">
                        فیلترهای فعال:
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
