import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Clock, Zap, Timer, Check, ChevronDown, Sparkles, Activity } from 'lucide-react';

export interface AutoRefreshWidgetProps {
    refreshInterval: number; // in seconds: 0, 60, 900, 1800
    onSetInterval: (seconds: number) => void;
    onManualRefresh: () => void;
    isRefreshing: boolean;
    countdown: number | null;
    variant?: 'sidebar' | 'compact-header' | 'modal';
}

export const REFRESH_OPTIONS = [
    { value: 0, label: 'دستی', subtitle: 'بدون تایمر', shortLabel: 'دستی', icon: Activity, color: 'slate' },
    { value: 60, label: '۱ دقیقه', subtitle: 'لحظه‌ای و سریع', shortLabel: '۱ د', icon: Zap, color: 'amber' },
    { value: 900, label: 'ربع ساعت', subtitle: 'هر ۱۵ دقیقه', shortLabel: '۱۵ د', icon: Clock, color: 'sky' },
    { value: 1800, label: 'نیم ساعت', subtitle: 'هر ۳۰ دقیقه', shortLabel: '۳۰ د', icon: Timer, color: 'indigo' },
];

export const formatRemainingTime = (seconds: number | null): string => {
    if (seconds === null || seconds <= 0) return '۰۰:۰۰';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(m)}:${pad(s)}`;
};

export const AutoRefreshWidget: React.FC<AutoRefreshWidgetProps> = ({
    refreshInterval,
    onSetInterval,
    onManualRefresh,
    isRefreshing,
    countdown,
    variant = 'sidebar'
}) => {
    const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
        const now = new Date();
        return now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    });
    const [showJustRefreshed, setShowJustRefreshed] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Update last sync time whenever manual or auto refresh happens
    useEffect(() => {
        if (isRefreshing) {
            setShowJustRefreshed(true);
            const timer = setTimeout(() => setShowJustRefreshed(false), 2500);
            return () => clearTimeout(timer);
        } else {
            const now = new Date();
            setLastSyncTime(now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
    }, [isRefreshing]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Progress percentage
    const progressPercent = refreshInterval > 0 && countdown !== null
        ? Math.max(0, Math.min(100, ((refreshInterval - countdown) / refreshInterval) * 100))
        : 0;

    const currentOption = REFRESH_OPTIONS.find(o => o.value === refreshInterval) || REFRESH_OPTIONS[0];

    // ==========================================
    // 1. COMPACT HEADER PILL VARIANT
    // ==========================================
    if (variant === 'compact-header') {
        return (
            <div className="relative" ref={menuRef}>
                <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs backdrop-blur-md">
                    {/* Trigger Manual Refresh Button */}
                    <button
                        type="button"
                        onClick={onManualRefresh}
                        disabled={isRefreshing}
                        title="بروزرسانی دستی داده‌ها"
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            showJustRefreshed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-650 shadow-xs'
                        } active:scale-95`}
                    >
                        {showJustRefreshed ? (
                            <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                        ) : (
                            <RefreshCw className={`w-3.5 h-3.5 text-sky-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                        )}
                        <span className="hidden sm:inline">
                            {showJustRefreshed ? 'بروز شد!' : 'بروزرسانی'}
                        </span>
                    </button>

                    {/* Auto-Refresh Timer & Interval Dropdown Toggle */}
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            refreshInterval > 0
                                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                        }`}
                    >
                        {refreshInterval > 0 && (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                            </span>
                        )}
                        <span className="font-mono text-[11px]">
                            {refreshInterval > 0 && countdown !== null
                                ? formatRemainingTime(countdown)
                                : 'دستی'}
                        </span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">زمان‌بندی بروزرسانی</span>
                            <span className="text-[10px] text-slate-400 font-mono">آخرین: {lastSyncTime}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {REFRESH_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = refreshInterval === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onSetInterval(opt.value);
                                            setIsMenuOpen(false);
                                        }}
                                        className={`flex flex-col items-start p-2 rounded-xl text-right transition-all border ${
                                            isSelected
                                                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                                                : 'bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 w-full">
                                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-sky-500'}`} />
                                            <span className="text-xs font-bold">{opt.label}</span>
                                        </div>
                                        <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                                            {opt.subtitle}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // 2. MAIN CREATIVE SIDEBAR / FULL WIDGET
    // ==========================================
    const strokeDashoffset = 100 - progressPercent;

    return (
        <div className="bg-gradient-to-b from-white to-slate-50/80 dark:from-slate-800/90 dark:to-slate-850 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-3 relative overflow-hidden group">
            {/* Ambient Background Glow when active */}
            {refreshInterval > 0 && (
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none transition-all"></div>
            )}

            {/* Top Bar: Title & Countdown Status Badge */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
                        <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight">بروزرسانی داده‌ها</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">همگام‌سازی لحظه‌ای</p>
                    </div>
                </div>

                {/* Progress / Status Tag */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-750 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    {refreshInterval > 0 ? (
                        <>
                            {/* Circular SVG Mini Progress */}
                            <div className="relative w-4 h-4 flex items-center justify-center">
                                <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-slate-200 dark:text-slate-700"
                                        strokeWidth="4"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-sky-500 transition-all duration-1000 ease-linear"
                                        strokeDasharray="100, 100"
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        strokeWidth="4"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400">
                                {formatRemainingTime(countdown)}
                            </span>
                        </>
                    ) : (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            حالت دستی
                        </span>
                    )}
                </div>
            </div>

            {/* Intervals Segmented Control Grid */}
            <div className="space-y-1">
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-900/70 rounded-xl border border-slate-200/50 dark:border-slate-800">
                    {REFRESH_OPTIONS.map((opt) => {
                        const isSelected = refreshInterval === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => onSetInterval(opt.value)}
                                title={opt.subtitle}
                                className={`relative py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                                    isSelected
                                        ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs font-black'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium hover:bg-white/50 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                <span className="text-[11px] whitespace-nowrap leading-none">
                                    {opt.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Manual Refresh Action Button */}
            <button
                type="button"
                onClick={onManualRefresh}
                disabled={isRefreshing}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-[0.98] ${
                    showJustRefreshed
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                        : isRefreshing
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-650'
                }`}
            >
                <div className="flex items-center gap-2">
                    {showJustRefreshed ? (
                        <Check className="w-4 h-4 text-emerald-200 animate-bounce" />
                    ) : (
                        <RefreshCw className={`w-4 h-4 text-sky-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                    )}
                    <span>
                        {showJustRefreshed
                            ? 'اطلاعات به‌روز شد!'
                            : isRefreshing
                            ? 'در حال دریافت اطلاعات...'
                            : 'بروزرسانی دستی سامانه'}
                    </span>
                </div>

                <span className="text-[10px] font-mono opacity-70">
                    {lastSyncTime}
                </span>
            </button>
        </div>
    );
};

export default AutoRefreshWidget;
