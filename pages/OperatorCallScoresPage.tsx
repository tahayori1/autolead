import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    PhoneCall, Trophy, RefreshCw, Clock, Search, Download, Copy, Check,
    BarChart3, Users, Award, ShieldAlert, Sparkles, TrendingUp, PieChart as PieChartIcon,
    ArrowUpRight, Sliders, Play, Pause, ChevronDown, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { getCallScores, getStaffUsers } from '../services/api';
import type { CallScoreItem, StaffUser } from '../types';
import Spinner from '../components/Spinner';

// Declare moment from global scope for Persian dates
declare const moment: any;

const REFRESH_INTERVAL_OPTIONS = [
    { value: 60, label: '۱ دقیقه' },
    { value: 300, label: '۵ دقیقه' },
    { value: 600, label: '۱۰ دقیقه (پیش‌فرض)' },
    { value: 900, label: '۱۵ دقیقه' },
    { value: 0, label: 'غیرفعال (دستی)' },
];

type PeriodKey = '1_day' | 'yesterday' | '1_week' | '4_weeks' | '8_weeks' | '12_weeks' | '24_weeks';

const PERIOD_CONFIG: Record<PeriodKey, { field: keyof CallScoreItem; label: string; shortLabel: string; days: string }> = {
    '1_day': { field: 'successful_calls_1_day', label: 'پاسخ داده شده (امروز / ۲۴h)', shortLabel: 'امروز', days: '۱ روز' },
    'yesterday': { field: 'successful_calls_yesterday', label: 'پاسخ داده شده (دیروز)', shortLabel: 'دیروز', days: 'روز قبل' },
    '1_week': { field: 'successful_calls_1_week', label: 'پاسخ داده شده (۱ هفته اخیر)', shortLabel: '۱ هفته', days: '۷ روز' },
    '4_weeks': { field: 'successful_calls_4_weeks', label: 'پاسخ داده شده (۴ هفته اخیر)', shortLabel: '۴ هفته', days: '۲۸ روز' },
    '8_weeks': { field: 'successful_calls_8_weeks', label: 'پاسخ داده شده (۸ هفته اخیر)', shortLabel: '۸ هفته', days: '۵۶ روز' },
    '12_weeks': { field: 'successful_calls_12_weeks', label: 'پاسخ داده شده (۱۲ هفته اخیر)', shortLabel: '۱۲ هفته', days: '۹۰ روز' },
    '24_weeks': { field: 'successful_calls_24_weeks', label: 'پاسخ داده شده (۲۴ هفته اخیر)', shortLabel: '۲۴ هفته', days: '۱۸۰ روز' },
};


const CHART_COLORS = [
    '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
    '#3b82f6', '#14b8a6', '#f97316', '#6366f1', '#06b6d4',
    '#84cc16', '#a855f7', '#d946ef', '#ef4444', '#64748b'
];

export const formatAgentPhoneNumber = (phone: string): string => {
    if (!phone || phone === 'ALL_AGENTS') return 'مجموع کل اپراتورها';
    const clean = phone.replace(/\D/g, '');
    if (clean.startsWith('98') && clean.length === 12) {
        const local = '0' + clean.slice(2);
        return local.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    if (clean.length === 11 && clean.startsWith('09')) {
        return clean.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    return phone;
};

export const resolveAgentDisplayName = (agentName: string, staffUsers: StaffUser[]): { title: string; subtitle?: string; isStaff: boolean } => {
    if (agentName === 'ALL_AGENTS') {
        return { title: 'مجموع کل اپراتورها', isStaff: false };
    }
    
    const formattedPhone = formatAgentPhoneNumber(agentName);
    const cleanRaw = agentName.replace(/\D/g, '');
    
    const matchedStaff = staffUsers.find(s => {
        const sMobile = (s.mobile || '').replace(/\D/g, '');
        const sPhone = (s.phone || '').replace(/\D/g, '');
        const sUsername = (s.username || '').trim();
        const sFull = (s.fullName || s.full_name || '').trim();
        return (sMobile && cleanRaw.endsWith(sMobile.slice(-10))) || 
               (sPhone && cleanRaw.endsWith(sPhone.slice(-10))) ||
               (sUsername && (agentName === sUsername || cleanRaw === sUsername)) ||
               (sFull && agentName === sFull);
    });

    if (matchedStaff) {
        const realFullName = (matchedStaff.fullName || matchedStaff.full_name || '').trim();
        return {
            title: realFullName || matchedStaff.username,
            subtitle: formattedPhone,
            isStaff: true
        };
    }

    return {
        title: formattedPhone,
        subtitle: agentName !== formattedPhone ? agentName : undefined,
        isStaff: false
    };
};


export const OperatorCallScoresPage: React.FC = () => {
    const [data, setData] = useState<CallScoreItem[]>([]);
    const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Auto-refresh timer state (Default: 600 seconds = 10 minutes)
    const [refreshInterval, setRefreshInterval] = useState<number>(600);
    const [secondsLeft, setSecondsLeft] = useState<number>(600);
    const [isAutoRefreshPaused, setIsAutoRefreshPaused] = useState<boolean>(false);
    const [showIntervalMenu, setShowIntervalMenu] = useState<boolean>(false);

    // Filtering & View state
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('1_day');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<keyof CallScoreItem>('successful_calls_1_day');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Fetch call scores function
    const fetchData = useCallback(async (isManual = false) => {
        if (isManual) {
            setIsRefreshing(true);
        } else if (!data.length) {
            setLoading(true);
        }

        setError(null);
        try {
            const [scoresRes, staffRes] = await Promise.allSettled([
                getCallScores(),
                getStaffUsers()
            ]);

            if (scoresRes.status === 'fulfilled' && Array.isArray(scoresRes.value) && scoresRes.value.length > 0) {
                setData(scoresRes.value);
            } else if (scoresRes.status === 'rejected') {
                console.error('Call scores API error:', scoresRes.reason);
                if (!data.length) {
                    setError('خطا در دریافت اطلاعات از سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
                }
            }

            if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value)) {
                setStaffUsers(staffRes.value);
            }

            const now = new Date();
            setLastUpdated(now);
            setSecondsLeft(refreshInterval);

            if (isManual) {
                showToast('آمار پاسخگویی اپراتورها با موفقیت بروزرسانی شد.');
            }
        } catch (err: any) {
            console.error('Error in call score dashboard:', err);
            setError(err.message || 'خطا در ارتباط با سرور');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [refreshInterval, data.length]);

    // Initial load
    useEffect(() => {
        fetchData(false);
    }, []);

    // Auto Refresh Countdown Hook (Runs every 1 second)
    useEffect(() => {
        if (refreshInterval <= 0 || isAutoRefreshPaused) return;

        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    fetchData(true);
                    return refreshInterval;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [refreshInterval, isAutoRefreshPaused, fetchData]);

    // Handle interval selection change
    const handleIntervalChange = (val: number) => {
        setRefreshInterval(val);
        setSecondsLeft(val);
        setShowIntervalMenu(false);
        if (val > 0) {
            setIsAutoRefreshPaused(false);
            showToast(`بروزرسانی خودکار روی ${REFRESH_INTERVAL_OPTIONS.find(o => o.value === val)?.label} تنظیم شد.`);
        } else {
            showToast('بروزرسانی خودکار غیرفعال شد.');
        }
    };

    // Separate Total record and Agent records
    const totalRecord = useMemo(() => {
        return data.find(item => item.report_type === 'total') || {
            report_type: 'total' as const,
            agent_name: 'ALL_AGENTS',
            successful_calls_1_day: 0,
            successful_calls_yesterday: 0,
            successful_calls_1_week: 0,
            successful_calls_4_weeks: 0,
            successful_calls_8_weeks: 0,
            successful_calls_12_weeks: 0,
            successful_calls_24_weeks: 0,
        };
    }, [data]);


    const agentList = useMemo(() => {
        return data.filter(item => item.report_type === 'agent');
    }, [data]);

    // Sort and search agent list
    const filteredAndSortedAgents = useMemo(() => {
        let list = [...agentList];

        if (searchTerm.trim()) {
            const query = searchTerm.trim().toLowerCase();
            list = list.filter(a => {
                const display = resolveAgentDisplayName(a.agent_name, staffUsers);
                return (
                    a.agent_name.toLowerCase().includes(query) ||
                    display.title.toLowerCase().includes(query) ||
                    (display.subtitle && display.subtitle.toLowerCase().includes(query))
                );
            });
        }

        list.sort((a, b) => {
            const valA = Number(a[sortField]) || 0;
            const valB = Number(b[sortField]) || 0;
            return sortOrder === 'desc' ? valB - valA : valA - valB;
        });

        return list;
    }, [agentList, searchTerm, sortField, sortOrder, staffUsers]);

    // Current period field and total
    const currentPeriodField = PERIOD_CONFIG[selectedPeriod].field;
    const currentPeriodTotal = Number(totalRecord[currentPeriodField]) || 1;

    // Top 3 Podium Operators for selected period
    const topPerformers = useMemo(() => {
        const sorted = [...agentList].sort((a, b) => (Number(b[currentPeriodField]) || 0) - (Number(a[currentPeriodField]) || 0));
        return {
            gold: sorted[0] || null,
            silver: sorted[1] || null,
            bronze: sorted[2] || null,
        };
    }, [agentList, currentPeriodField]);

    // Average calls per operator
    const avgCallsPerAgent = useMemo(() => {
        if (!agentList.length) return 0;
        const total = Number(totalRecord[currentPeriodField]) || agentList.reduce((acc, a) => acc + (Number(a[currentPeriodField]) || 0), 0);
        return Math.round(total / agentList.length);
    }, [agentList, totalRecord, currentPeriodField]);

    // Prepare Bar Chart Data for selected period (Top 10)
    const barChartData = useMemo(() => {
        const sorted = [...agentList].sort((a, b) => (Number(b[currentPeriodField]) || 0) - (Number(a[currentPeriodField]) || 0)).slice(0, 10);
        return sorted.map((agent) => {
            const display = resolveAgentDisplayName(agent.agent_name, staffUsers);
            return {
                name: display.title,
                count: Number(agent[currentPeriodField]) || 0,
                phone: display.subtitle || agent.agent_name,
            };
        });
    }, [agentList, currentPeriodField, staffUsers]);

    // Prepare Pie Chart Data (Share of answered calls)
    const pieChartData = useMemo(() => {
        const sorted = [...agentList].sort((a, b) => (Number(b[currentPeriodField]) || 0) - (Number(a[currentPeriodField]) || 0));
        const top5 = sorted.slice(0, 6);
        const others = sorted.slice(6);
        const othersTotal = others.reduce((acc, cur) => acc + (Number(cur[currentPeriodField]) || 0), 0);

        const result = top5.map(agent => {
            const display = resolveAgentDisplayName(agent.agent_name, staffUsers);
            return {
                name: display.title,
                value: Number(agent[currentPeriodField]) || 0
            };
        });

        if (othersTotal > 0) {
            result.push({ name: 'سایر اپراتورها', value: othersTotal });
        }

        return result;
    }, [agentList, currentPeriodField, staffUsers]);

    // Multi-period comparison chart data for top 5 operators
    const multiPeriodChartData = useMemo(() => {
        const sorted = [...agentList].sort((a, b) => (Number(b.successful_calls_24_weeks) || 0) - (Number(a.successful_calls_24_weeks) || 0)).slice(0, 5);
        return sorted.map(agent => {
            const display = resolveAgentDisplayName(agent.agent_name, staffUsers);
            return {
                name: display.title,
                '۲۴ ساعت': Number(agent.successful_calls_1_day) || 0,
                '۱ هفته': Number(agent.successful_calls_1_week) || 0,
                '۴ هفته': Number(agent.successful_calls_4_weeks) || 0,
                '۲۴ هفته': Number(agent.successful_calls_24_weeks) || 0,
            };
        });
    }, [agentList, staffUsers]);

    // Copy formatted report to clipboard
    const handleCopyReport = () => {
        const periodText = PERIOD_CONFIG[selectedPeriod].label;
        let report = `📊 گزارش آمار پاسخگویی اپراتورها (${periodText})\n`;
        report += `⏰ تاریخ گزارش: ${moment().locale('fa').format('YYYY/MM/DD - HH:mm')}\n`;
        report += `👥 مجموع پاسخ داده شده کل: ${(Number(totalRecord[currentPeriodField]) || 0).toLocaleString('fa-IR')} تماس\n`;
        report += `----------------------------------------\n`;
        
        filteredAndSortedAgents.slice(0, 15).forEach((agent, idx) => {
            const display = resolveAgentDisplayName(agent.agent_name, staffUsers);
            const count = Number(agent[currentPeriodField]) || 0;
            const share = currentPeriodTotal > 0 ? ((count / currentPeriodTotal) * 100).toFixed(1) : '0';
            report += `${idx + 1}. ${display.title}: ${count.toLocaleString('fa-IR')} تماس (${share.toLocaleString('fa-IR')}٪)\n`;
        });

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(report);
            showToast('گزارش خلاصه در حافظه کپی شد.');
        }
    };

    // Export CSV
    const handleExportCSV = () => {
        let csv = 'رتبه,نام اپراتور,شماره تماس,امروز (۲۴h),دیروز,۱ هفته اخیر,۴ هفته اخیر,۸ هفته اخیر,۱۲ هفته اخیر,۲۴ هفته اخیر,سهم از کل %\n';
        
        filteredAndSortedAgents.forEach((agent, idx) => {
            const display = resolveAgentDisplayName(agent.agent_name, staffUsers);
            const count = Number(agent[currentPeriodField]) || 0;
            const share = currentPeriodTotal > 0 ? ((count / currentPeriodTotal) * 100).toFixed(1) : '0';
            csv += `${idx + 1},"${display.title}","${agent.agent_name}",${agent.successful_calls_1_day || 0},${agent.successful_calls_yesterday || 0},${agent.successful_calls_1_week || 0},${agent.successful_calls_4_weeks || 0},${agent.successful_calls_8_weeks || 0},${agent.successful_calls_12_weeks || 0},${agent.successful_calls_24_weeks || 0},${share}\n`;
        });


        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Operator_Call_Scores_${moment().format('YYYYMMDD')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('فایل اکسل/CSV با موفقیت دانلود شد.');
    };

    // Format seconds to mm:ss
    const formatTimeLeft = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
                <Spinner size="lg" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 animate-pulse">
                    در حال دریافت آمار پاسخگویی زنده اپراتورها...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 animate-fadeIn dir-rtl">
            
            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 text-xs font-bold"
                    >
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dashboard Header Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-sky-500 to-indigo-600"></div>
                
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-2 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                            <PhoneCall className="w-6 h-6" />
                        </span>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                            داشبورد آمار پاسخگویی تلفنی اپراتورها
                        </h1>
                        <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <span>پایش زنده API</span>
                        </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-11">
                        رتبه‌بندی و سنجش حجم تماس‌های پاسخ داده شده توسط کارشناسان در بازه‌های زمانی مختلف با بروزرسانی خودکار ۱۰ دقیقه‌ای
                    </p>
                </div>

                {/* Auto Refresh & Action Controls */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                    
                    {/* Auto-Refresh Timer Box */}
                    {refreshInterval > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
                            <Clock className="w-4 h-4 text-sky-500 animate-spin" style={{ animationDuration: '6s' }} />
                            <span>بروزرسانی بعدی:</span>
                            <span className="font-mono text-sky-600 dark:text-sky-400 font-black text-sm">
                                {formatTimeLeft(secondsLeft)}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsAutoRefreshPaused(prev => !prev)}
                                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer mr-1"
                                title={isAutoRefreshPaused ? 'شروع مجدد بروزرسانی خودکار' : 'توقف موقت بروزرسانی خودکار'}
                            >
                                {isAutoRefreshPaused ? <Play className="w-3.5 h-3.5 text-emerald-500" /> : <Pause className="w-3.5 h-3.5 text-amber-500" />}
                            </button>
                        </div>
                    )}

                    {/* Refresh Interval Selector Menu */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowIntervalMenu(prev => !prev)}
                            className="bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                        >
                            <Sliders className="w-3.5 h-3.5 text-slate-500" />
                            <span>زمان‌بندی: {REFRESH_INTERVAL_OPTIONS.find(o => o.value === refreshInterval)?.label}</span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                        </button>

                        {showIntervalMenu && (
                            <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-30">
                                <p className="px-3 py-1 text-[10px] font-black text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700 mb-1">
                                    تواتر بروزرسانی خودکار
                                </p>
                                {REFRESH_INTERVAL_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleIntervalChange(opt.value)}
                                        className={`w-full text-right px-3 py-2 text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                            refreshInterval === opt.value
                                                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                                        }`}
                                    >
                                        <span>{opt.label}</span>
                                        {refreshInterval === opt.value && <Check className="w-3.5 h-3.5 text-sky-500" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Instant Manual Refresh Button */}
                    <button
                        type="button"
                        onClick={() => fetchData(true)}
                        disabled={isRefreshing}
                        className="bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-md shadow-sky-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                        title="دریافت آخرین اطلاعات آمار تماس‌ها"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>{isRefreshing ? 'در حال بروزرسانی...' : 'بروزرسانی فوری'}</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        className="underline hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {/* Time Period Tabs Selector */}
            <div className="bg-slate-100/90 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5 px-3 py-1">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>بازه زمانی تحلیل:</span>
                    </span>
                    {(Object.keys(PERIOD_CONFIG) as PeriodKey[]).map((pKey) => {
                        const cfg = PERIOD_CONFIG[pKey];
                        const isActive = selectedPeriod === pKey;
                        return (
                            <button
                                key={pKey}
                                type="button"
                                onClick={() => {
                                    setSelectedPeriod(pKey);
                                    setSortField(cfg.field);
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isActive
                                        ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20 ring-2 ring-sky-300 dark:ring-sky-700'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                <span>{cfg.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Last updated timestamp indicator */}
                {lastUpdated && (
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-3 py-1 flex items-center gap-1">
                        <span>آخرین دریافت:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 dir-ltr">
                            {lastUpdated.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                )}
            </div>

            {/* Top Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Total Answered Calls for selected period */}
                <div className="bg-gradient-to-br from-sky-600 to-indigo-700 text-white p-5 rounded-3xl shadow-lg shadow-sky-500/10 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-xl"></div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold opacity-90">مجموع پاسخ داده شده</span>
                        <span className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
                            <PhoneCall className="w-5 h-5 text-white" />
                        </span>
                    </div>
                    <div>
                        <div className="text-3xl font-black font-mono tracking-tight mb-1">
                            {(Number(totalRecord[currentPeriodField]) || 0).toLocaleString('fa-IR')}
                        </div>
                        <p className="text-[11px] opacity-80">
                            تماس‌های پاسخ داده شده در {PERIOD_CONFIG[selectedPeriod].shortLabel} اخیر
                        </p>
                    </div>
                </div>

                {/* 2. Active Operators Count */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تعداد اپراتورهای فعال</span>
                        <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            <Users className="w-5 h-5" />
                        </span>
                    </div>
                    <div>
                        <div className="text-3xl font-black font-mono text-slate-800 dark:text-white mb-1">
                            {agentList.length.toLocaleString('fa-IR')}
                        </div>
                        <p className="text-[11px] text-slate-400">
                            اپراتورهای دارای ثبت آماری در سیستم
                        </p>
                    </div>
                </div>

                {/* 3. Average Calls per Operator */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">میانگین پاسخگویی اپراتور</span>
                        <span className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="w-5 h-5" />
                        </span>
                    </div>
                    <div>
                        <div className="text-3xl font-black font-mono text-slate-800 dark:text-white mb-1">
                            {avgCallsPerAgent.toLocaleString('fa-IR')}
                        </div>
                        <p className="text-[11px] text-slate-400">
                            میانگین تماس پاسخ داده شده به ازای هر اپراتور
                        </p>
                    </div>
                </div>

                {/* 4. Champion Top Operator */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 rounded-3xl shadow-lg shadow-amber-500/10 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold opacity-90">رتبه اول پاسخگویی (قهرمان)</span>
                        <span className="p-2 rounded-2xl bg-white/20">
                            <Trophy className="w-5 h-5 text-amber-100" />
                        </span>
                    </div>
                    {topPerformers.gold ? (
                        <div>
                            <div className="text-base font-black truncate mb-1">
                                {resolveAgentDisplayName(topPerformers.gold.agent_name, staffUsers).title}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-100">
                                <span>{(Number(topPerformers.gold[currentPeriodField]) || 0).toLocaleString('fa-IR')} تماس</span>
                                <span>•</span>
                                <span>
                                    {currentPeriodTotal > 0 ? (((Number(topPerformers.gold[currentPeriodField]) || 0) / currentPeriodTotal) * 100).toFixed(1) : 0}٪ کل
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs opacity-80">اطلاعاتی ثبت نشده</p>
                    )}
                </div>
            </div>

            {/* Top 3 Operator Leaderboard Podium Visual */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <h2 className="text-base font-black text-slate-800 dark:text-white">
                            سکوی برترین اپراتورها در {PERIOD_CONFIG[selectedPeriod].shortLabel} اخیر
                        </h2>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                        سهم از کل: {currentPeriodTotal.toLocaleString('fa-IR')} تماس
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    
                    {/* Rank 2 - Silver 🥈 */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center relative overflow-hidden order-2 md:order-1">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-sm mb-2 border-2 border-slate-300">
                            🥈 ۲
                        </div>
                        {topPerformers.silver ? (
                            <>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1">
                                    {resolveAgentDisplayName(topPerformers.silver.agent_name, staffUsers).title}
                                </h3>
                                <p className="text-[11px] font-mono text-slate-400 mb-3 dir-ltr">
                                    {resolveAgentDisplayName(topPerformers.silver.agent_name, staffUsers).subtitle || topPerformers.silver.agent_name}
                                </p>
                                <div className="text-xl font-black font-mono text-slate-700 dark:text-slate-300">
                                    {(Number(topPerformers.silver[currentPeriodField]) || 0).toLocaleString('fa-IR')} <span className="text-xs font-normal">تماس</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-slate-400 h-full rounded-full"
                                        style={{ width: `${currentPeriodTotal > 0 ? ((Number(topPerformers.silver[currentPeriodField]) / currentPeriodTotal) * 100) : 0}%` }}
                                    ></div>
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-slate-400 py-4">موجود نیست</p>
                        )}
                    </div>

                    {/* Rank 1 - Gold 🥇 */}
                    <div className="bg-gradient-to-b from-amber-500/10 to-amber-500/5 dark:from-amber-500/20 dark:to-transparent rounded-2xl p-5 border-2 border-amber-400/80 flex flex-col items-center text-center relative overflow-hidden order-1 md:order-2 shadow-sm">
                        <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            پیشتاز اول 🏆
                        </span>
                        <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-lg mb-2 shadow-md shadow-amber-500/30">
                            🥇 ۱
                        </div>
                        {topPerformers.gold ? (
                            <>
                                <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
                                    {resolveAgentDisplayName(topPerformers.gold.agent_name, staffUsers).title}
                                </h3>
                                <p className="text-[11px] font-mono text-amber-700 dark:text-amber-300 mb-3 dir-ltr">
                                    {resolveAgentDisplayName(topPerformers.gold.agent_name, staffUsers).subtitle || topPerformers.gold.agent_name}
                                </p>
                                <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                                    {(Number(topPerformers.gold[currentPeriodField]) || 0).toLocaleString('fa-IR')} <span className="text-xs font-normal">تماس</span>
                                </div>
                                <div className="w-full bg-amber-200 dark:bg-amber-950 h-2.5 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-amber-500 h-full rounded-full"
                                        style={{ width: `${currentPeriodTotal > 0 ? ((Number(topPerformers.gold[currentPeriodField]) / currentPeriodTotal) * 100) : 0}%` }}
                                    ></div>
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-slate-400 py-4">موجود نیست</p>
                        )}
                    </div>

                    {/* Rank 3 - Bronze 🥉 */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center relative overflow-hidden order-3">
                        <div className="w-10 h-10 rounded-full bg-orange-200 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 flex items-center justify-center font-black text-sm mb-2 border-2 border-orange-300">
                            🥉 ۳
                        </div>
                        {topPerformers.bronze ? (
                            <>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1">
                                    {resolveAgentDisplayName(topPerformers.bronze.agent_name, staffUsers).title}
                                </h3>
                                <p className="text-[11px] font-mono text-slate-400 mb-3 dir-ltr">
                                    {resolveAgentDisplayName(topPerformers.bronze.agent_name, staffUsers).subtitle || topPerformers.bronze.agent_name}
                                </p>
                                <div className="text-xl font-black font-mono text-slate-700 dark:text-slate-300">
                                    {(Number(topPerformers.bronze[currentPeriodField]) || 0).toLocaleString('fa-IR')} <span className="text-xs font-normal">تماس</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-orange-500 h-full rounded-full"
                                        style={{ width: `${currentPeriodTotal > 0 ? ((Number(topPerformers.bronze[currentPeriodField]) / currentPeriodTotal) * 100) : 0}%` }}
                                    ></div>
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-slate-400 py-4">موجود نیست</p>
                        )}
                    </div>

                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Bar Chart - Top 10 Operators Call Volume */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-sky-500" />
                                <span>رتبه‌بندی حجم پاسخگویی ۱۰ اپراتور برتر ({PERIOD_CONFIG[selectedPeriod].shortLabel})</span>
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">مقایسه تعداد تماس‌های پاسخ داده شده</p>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                                    interval={0}
                                    angle={-25}
                                    textAnchor="end"
                                />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip 
                                    formatter={(val: any) => [`${Number(val).toLocaleString('fa-IR')} تماس پاسخ داده شده`, 'حجم پاسخگویی']}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Pie Chart - Share of Answered Calls */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
                    <div className="mb-2">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <PieChartIcon className="w-4 h-4 text-emerald-500" />
                            <span>سهم سهمی از کل پاسخگویی</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">توزیع درصد پاسخگویی بین اپراتورها</p>
                    </div>

                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(val: any) => [`${Number(val).toLocaleString('fa-IR')} تماس`, 'تعداد']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] font-bold">
                        {pieChartData.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 truncate text-slate-600 dark:text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                                <span className="truncate">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Interactive Search & Sortable Table Container */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-700 space-y-4">
                
                {/* Table Header Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                    <div>
                        <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-indigo-500" />
                            <span>جدول کامل عملکرد و آمار پاسخگویی اپراتورها</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            تعداد کل اپراتورها: {agentList.length.toLocaleString('fa-IR')} نفر
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        
                        {/* Search Input */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="جستجوی نام یا شماره..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pr-9 pl-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>

                        {/* Copy Summary Button */}
                        <button
                            type="button"
                            onClick={handleCopyReport}
                            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            title="کپی متن خلاصه گزارش"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">کپی متن</span>
                        </button>

                        {/* Export CSV Button */}
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="خروجی فایل Excel/CSV"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>خروجی اکسل</span>
                        </button>

                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-3.5 text-center w-12">رتبه</th>
                                <th className="p-3.5">اپراتور / شماره تماس</th>
                                <th 
                                    className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                    onClick={() => { setSortField('successful_calls_1_day'); setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc'); }}
                                >
                                    پاسخ داده شده (امروز) {sortField === 'successful_calls_1_day' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th 
                                    className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                    onClick={() => { setSortField('successful_calls_yesterday' as any); setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc'); }}
                                >
                                    پاسخ داده شده (دیروز) {sortField === 'successful_calls_yesterday' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th 
                                    className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                    onClick={() => { setSortField('successful_calls_1_week'); setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc'); }}
                                >
                                    پاسخ داده شده (۱ هفته) {sortField === 'successful_calls_1_week' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th 
                                    className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                    onClick={() => { setSortField('successful_calls_4_weeks'); setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc'); }}
                                >
                                    پاسخ داده شده (۴ هفته) {sortField === 'successful_calls_4_weeks' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th 
                                    className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 hidden lg:table-cell"
                                    onClick={() => { setSortField('successful_calls_8_weeks'); setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc'); }}
                                >
                                    پاسخ داده شده (۸ هفته) {sortField === 'successful_calls_8_weeks' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th 
                                    className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 hidden lg:table-cell"
                                    onClick={() => { setSortField('successful_calls_12_weeks'); setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc'); }}
                                >
                                    پاسخ داده شده (۱۲ هفته) {sortField === 'successful_calls_12_weeks' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th 
                                    className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 hidden xl:table-cell"
                                    onClick={() => { setSortField('successful_calls_24_weeks'); setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc'); }}
                                >
                                    پاسخ داده شده (۲۴ هفته) {sortField === 'successful_calls_24_weeks' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th className="p-3.5 text-center">سهم از کل</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-bold text-slate-700 dark:text-slate-200">
                            
                            {/* Total Row Summary */}
                            <tr className="bg-sky-50/80 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-black border-b-2 border-sky-200 dark:border-sky-800">
                                <td className="p-3.5 text-center">★</td>
                                <td className="p-3.5 flex items-center gap-2">
                                    <span className="p-1.5 rounded-lg bg-sky-600 text-white">
                                        <Users className="w-3.5 h-3.5" />
                                    </span>
                                    <span>مجموع کل پاسخگویی تیم (ALL AGENTS)</span>
                                </td>
                                <td className="p-3.5 font-mono text-sm">{(totalRecord.successful_calls_1_day || 0).toLocaleString('fa-IR')}</td>
                                <td className="p-3.5 font-mono text-sm bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200">
                                    {(totalRecord.successful_calls_yesterday || 0).toLocaleString('fa-IR')}
                                </td>
                                <td className="p-3.5 font-mono text-sm">{(totalRecord.successful_calls_1_week || 0).toLocaleString('fa-IR')}</td>
                                <td className="p-3.5 font-mono text-sm">{(totalRecord.successful_calls_4_weeks || 0).toLocaleString('fa-IR')}</td>
                                <td className="p-3.5 font-mono text-sm hidden lg:table-cell">{(totalRecord.successful_calls_8_weeks || 0).toLocaleString('fa-IR')}</td>
                                <td className="p-3.5 font-mono text-sm hidden lg:table-cell">{(totalRecord.successful_calls_12_weeks || 0).toLocaleString('fa-IR')}</td>
                                <td className="p-3.5 font-mono text-sm hidden xl:table-cell">{(totalRecord.successful_calls_24_weeks || 0).toLocaleString('fa-IR')}</td>
                                <td className="p-3.5 text-center font-mono">۱۰۰٪</td>
                            </tr>

                            {filteredAndSortedAgents.length > 0 ? (
                                filteredAndSortedAgents.map((agent, index) => {
                                    const display = resolveAgentDisplayName(agent.agent_name, staffUsers);
                                    const currentCount = Number(agent[currentPeriodField]) || 0;
                                    const sharePct = currentPeriodTotal > 0 ? ((currentCount / currentPeriodTotal) * 100) : 0;
                                    
                                    return (
                                        <tr 
                                            key={agent.agent_name}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                                        >
                                            <td className="p-3.5 text-center">
                                                {index === 0 ? (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-black">
                                                        ۱
                                                    </span>
                                                ) : index === 1 ? (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 text-[11px] font-black">
                                                        ۲
                                                    </span>
                                                ) : index === 2 ? (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-400 text-white text-[11px] font-black">
                                                        ۳
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-mono text-xs">{(index + 1).toLocaleString('fa-IR')}</span>
                                                )}
                                            </td>

                                            <td className="p-3.5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                                        {display.title}
                                                        {display.isStaff && (
                                                            <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-bold">
                                                                کارمند CRM
                                                            </span>
                                                        )}
                                                    </span>
                                                    {display.subtitle && (
                                                        <span className="text-[10px] text-slate-400 font-mono dir-ltr text-right">
                                                            {display.subtitle}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className={`p-3.5 font-mono ${selectedPeriod === '1_day' ? 'font-black text-sky-600 dark:text-sky-400 bg-sky-50/40 dark:bg-sky-950/20' : ''}`}>
                                                {(agent.successful_calls_1_day || 0).toLocaleString('fa-IR')}
                                            </td>

                                            <td className={`p-3.5 font-mono ${selectedPeriod === 'yesterday' ? 'font-black text-amber-600 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20' : ''}`}>
                                                {(agent.successful_calls_yesterday || 0).toLocaleString('fa-IR')}
                                            </td>

                                            <td className={`p-3.5 font-mono ${selectedPeriod === '1_week' ? 'font-black text-sky-600 dark:text-sky-400 bg-sky-50/40 dark:bg-sky-950/20' : ''}`}>
                                                {(agent.successful_calls_1_week || 0).toLocaleString('fa-IR')}
                                            </td>

                                            <td className={`p-3.5 font-mono ${selectedPeriod === '4_weeks' ? 'font-black text-sky-600 dark:text-sky-400 bg-sky-50/40 dark:bg-sky-950/20' : ''}`}>
                                                {(agent.successful_calls_4_weeks || 0).toLocaleString('fa-IR')}
                                            </td>

                                            <td className={`p-3.5 font-mono hidden lg:table-cell ${selectedPeriod === '8_weeks' ? 'font-black text-sky-600 dark:text-sky-400 bg-sky-50/40 dark:bg-sky-950/20' : ''}`}>
                                                {(agent.successful_calls_8_weeks || 0).toLocaleString('fa-IR')}
                                            </td>

                                            <td className={`p-3.5 font-mono hidden lg:table-cell ${selectedPeriod === '12_weeks' ? 'font-black text-sky-600 dark:text-sky-400 bg-sky-50/40 dark:bg-sky-950/20' : ''}`}>
                                                {(agent.successful_calls_12_weeks || 0).toLocaleString('fa-IR')}
                                            </td>

                                            <td className={`p-3.5 font-mono hidden xl:table-cell ${selectedPeriod === '24_weeks' ? 'font-black text-sky-600 dark:text-sky-400 bg-sky-50/40 dark:bg-sky-950/20' : ''}`}>
                                                {(agent.successful_calls_24_weeks || 0).toLocaleString('fa-IR')}
                                            </td>


                                            <td className="p-3.5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden hidden sm:block">
                                                        <div 
                                                            className="bg-sky-500 h-full rounded-full"
                                                            style={{ width: `${Math.min(100, sharePct)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                                                        {sharePct.toFixed(1).toLocaleString('fa-IR')}٪
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-slate-400 text-xs font-bold">
                                        هیچ داده‌ای متناسب با جستجوی شما یافت نشد.
                                    </td>
                                </tr>
                            )}

                        </tbody>
                    </table>
                </div>

            </div>

        </div>
    );
};

export default OperatorCallScoresPage;
