
import React, { useState, useEffect, useMemo } from 'react';
import { getPollAverages } from '../services/api';
import type { ProcessedPollData, PollCustomerResult } from '../types';
import Spinner from '../components/Spinner';
import { PollIcon } from '../components/icons/PollIcon';
import { ChatIcon } from '../components/icons/ChatIcon';

interface PollResult {
    question: string;
    score: number;
    key: string;
}

const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// --- Helpers ---

const calculateCustomerAverage = (fields: Record<string, any>): number => {
    const scores = Object.entries(fields)
        .filter(([key, value]) => key.startsWith('Field_') && typeof value === 'number')
        .map(([, value]) => value as number);
    
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
};

const parseInfo = (html: string) => {
    if (!html) return { car: '', color: '', chassis: '', deliveryDate: '' };
    const getText = (marker: string) => {
        const match = html.match(new RegExp(`${marker}:?\\s*([^<]*)`));
        return match ? match[1].trim() : '';
    };
    return {
        car: getText('نام خودرو'),
        color: getText('رنگ خودرو'),
        chassis: getText('شماره شاسی'),
        deliveryDate: getText('تاریخ تحویل')
    };
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(new Date(dateString));
    } catch (e) {
        return dateString;
    }
};

// --- Components ---

const ChartBar: React.FC<PollResult> = ({ question, score }) => {
    const percentage = Math.min(100, (score / 10) * 100);
    
    const getBarColor = () => {
        if (score >= 9) return 'bg-emerald-500';
        if (score >= 7.5) return 'bg-emerald-400';
        if (score >= 6) return 'bg-amber-400';
        return 'bg-rose-500';
    };

    return (
        <div className="mb-6 animate-fade-in">
            <div className="flex justify-between items-center mb-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 max-w-[85%] leading-relaxed">{question}</h4>
                <span className="text-sm font-black text-slate-800 dark:text-white font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">{score.toFixed(1)}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-600">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getBarColor()}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const StatusPieChart: React.FC<{ completed: number, inProgress: number, notAnswered: number }> = ({ completed, inProgress, notAnswered }) => {
    const total = completed + inProgress + notAnswered;
    if (total === 0) return null;

    const p1 = (completed / total) * 100;
    const p2 = (inProgress / total) * 100;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center h-full">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-6">وضعیت کلی نظرسنجی‌ها</h3>
            <div className="relative w-36 h-36 rounded-full" style={{
                background: `conic-gradient(
                    #10b981 0% ${p1}%, 
                    #f59e0b ${p1}% ${p1 + p2}%, 
                    #f43f5e ${p1 + p2}% 100%
                )`
            }}>
                <div className="absolute inset-4 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center flex-col shadow-inner">
                    <span className="text-3xl font-black text-slate-700 dark:text-slate-200 font-mono">{total}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">کل ردیف‌ها</span>
                </div>
            </div>
            <div className="mt-6 w-full space-y-3">
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-600 dark:text-slate-400 font-bold">پاسخ داده شده</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{completed}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                        <span className="text-slate-600 dark:text-slate-400 font-bold">در جریان</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{inProgress}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                        <span className="text-slate-600 dark:text-slate-400 font-bold">بدون پاسخ</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{notAnswered}</span>
                </div>
            </div>
        </div>
    );
};

const ScoreDistributionChart: React.FC<{ customers: PollCustomerResult[] }> = ({ customers }) => {
    const buckets = [0, 0, 0, 0]; 
    
    customers.forEach(c => {
        const avg = calculateCustomerAverage(c.Fields);
        if (avg < 5) buckets[0]++;
        else if (avg < 7) buckets[1]++;
        else if (avg < 9) buckets[2]++;
        else buckets[3]++;
    });

    const max = Math.max(...buckets, 1); 
    const labels = ['ناراضی (۰-۵)', 'متوسط (۵-۷)', 'خوب (۷-۹)', 'عالی (۹-۱۰)'];
    const colors = ['bg-rose-500', 'bg-orange-400', 'bg-sky-500', 'bg-emerald-500'];

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-full flex flex-col">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-6">توزیع نمرات رضایت</h3>
            <div className="flex items-end justify-between flex-grow gap-2 sm:gap-4 min-h-[160px] pb-2">
                {buckets.map((count, idx) => {
                    const height = Math.max((count / max) * 100, 4); 
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                            <div 
                                className={`w-full rounded-t-xl transition-all duration-700 ease-out relative ${colors[idx]} shadow-sm group-hover:brightness-110`} 
                                style={{ height: `${height}%` }}
                            >
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-black text-slate-700 dark:text-slate-300 font-mono">{count}</div>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 text-center whitespace-nowrap">{labels[idx]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CustomerFeedbackCard: React.FC<{ 
    result: PollCustomerResult, 
    questionMap: Record<string, string> 
}> = ({ result, questionMap }) => {
    
    const info = parseInfo(result.Description || '');
    const commentKey = "Field_8785_1_17"; 
    const comment = result.Fields[commentKey];
    const averageScore = calculateCustomerAverage(result.Fields);
    const deliveryDate = result.DeliveryDate || info.deliveryDate;
    const deliveryLabel = (result.DeliveryMonth && result.DeliveryYear) 
        ? `${PERSIAN_MONTHS[result.DeliveryMonth - 1]} ${result.DeliveryYear}`
        : '';

    const scores = Object.entries(result.Fields)
        .filter(([key]) => key !== commentKey && key.startsWith('Field_'))
        .map(([key, value]) => ({
            key,
            score: Number(value)
        }));

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border transition-all relative overflow-hidden ${result.ignore ? 'opacity-50 grayscale' : 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'} border-slate-100 dark:border-slate-700`}>
            {/* Overall Score Badge */}
            <div className={`absolute top-0 left-0 px-3 py-1.5 rounded-br-2xl text-[10px] font-black font-mono shadow-sm ${
                averageScore >= 9 ? 'bg-emerald-600 text-white' :
                averageScore >= 7.5 ? 'bg-emerald-500 text-white' :
                averageScore >= 6 ? 'bg-amber-500 text-white' :
                'bg-rose-600 text-white'
            }`}>
                میانگین: {averageScore.toFixed(1)}
            </div>

            <div className="flex justify-between items-start mb-4 mt-6">
                <div>
                    <h4 className="font-black text-slate-800 dark:text-white text-base">{result.Contact.DisplayName || 'بدون نام'}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-mono mt-0.5" dir="ltr">{result.Contact.MobilePhone || 'بدون شماره'}</p>
                    {deliveryLabel && (
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-orange-100 dark:border-orange-800/50">
                            نوبت: {deliveryLabel}
                        </div>
                    )}
                </div>
                <div className="text-left">
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg text-[10px] font-black border border-slate-200 dark:border-slate-600">
                        {info.car || 'نامشخص'}
                    </span>
                    <div className="text-[9px] text-slate-400 mt-1 font-mono">{info.chassis}</div>
                    {deliveryDate && <div className="text-[9px] text-slate-500 mt-0.5 font-mono">تحویل: {deliveryDate}</div>}
                </div>
            </div>

            {comment && comment !== '-' && (
                <div className="bg-sky-50 dark:bg-sky-900/20 p-3 rounded-xl mb-4 flex gap-3 items-start border border-sky-100 dark:border-sky-800/50 shadow-inner">
                    <ChatIcon className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 dark:text-slate-200 italic leading-relaxed">"{comment}"</p>
                </div>
            )}

            <div className="grid grid-cols-3 gap-2">
                {scores.map(s => {
                    const fullTitle = questionMap[s.key] || '';
                    const shortLabel = fullTitle.includes('برخورد') ? 'برخورد' :
                                     fullTitle.includes('اطلاع') ? 'اطلاع‌رسانی' :
                                     fullTitle.includes('فرایند تحویل') ? 'فرایند تحویل' :
                                     fullTitle.includes('سرعت') ? 'سرعت' :
                                     fullTitle.includes('امکانات') ? 'امکانات' :
                                     fullTitle.includes('سلامت') ? 'سلامت خودرو' : 'سایر';

                    let colorClass = 'bg-slate-50 text-slate-600 border-slate-100';
                    if (s.score >= 9) colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
                    else if (s.score <= 6) colorClass = 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800';

                    return (
                        <div key={s.key} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${colorClass}`}>
                            <span className="text-base font-black font-mono">{s.score}</span>
                            <span className="text-[8px] font-bold opacity-80 whitespace-nowrap uppercase tracking-tighter">{shortLabel}</span>
                        </div>
                    );
                })}
            </div>
            {result.ignore && (
                <div className="absolute bottom-1 right-1 text-[8px] font-black text-rose-500/30 uppercase tracking-widest pointer-events-none select-none">
                    ردیف غیرواقعی (Ignored)
                </div>
            )}
        </div>
    );
};

const PendingCustomerCard: React.FC<{ 
    result: PollCustomerResult, 
    type: 'IN_PROGRESS' | 'NOT_ANSWERED' 
}> = ({ result, type }) => {
    
    const info = parseInfo(result.Description || '');
    const isProgress = type === 'IN_PROGRESS';
    const deliveryDate = result.DeliveryDate || info.deliveryDate;
    const deliveryLabel = (result.DeliveryMonth && result.DeliveryYear) 
        ? `${PERSIAN_MONTHS[result.DeliveryMonth - 1]} ${result.DeliveryYear}`
        : '';

    return (
        <div className={`rounded-2xl p-5 shadow-sm border transition-all relative overflow-hidden group ${
            isProgress 
                ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800 hover:shadow-md' 
                : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:shadow-md'
        }`}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-black text-slate-800 dark:text-white text-base">{result.Contact.DisplayName || 'بدون نام'}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-mono mt-0.5" dir="ltr">{result.Contact.MobilePhone || 'بدون شماره'}</p>
                    {deliveryLabel && <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 block mt-1.5">نوبت تحویل: {deliveryLabel}</span>}
                </div>
                <div className="text-left">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black border shadow-sm ${isProgress ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {isProgress ? 'در حال انجام' : 'بدون پاسخ'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-slate-600 dark:text-slate-400 border-t border-dashed border-slate-200 dark:border-slate-700 pt-3 flex-wrap">
                <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{info.car || 'خودرو نامشخص'}</span>
                <span className="font-mono text-slate-400">{info.chassis}</span>
                {deliveryDate && (
                    <span className="font-mono text-slate-500">تحویل: {deliveryDate}</span>
                )}
            </div>
            
            <div className="mt-3 text-[9px] text-slate-400 dark:text-slate-500 italic">
               آخرین بروزرسانی: <span className="font-mono">{formatDate(result.PipelineChangeTime)}</span>
            </div>
        </div>
    );
};

const PollPage: React.FC = () => {
    const [data, setData] = useState<ProcessedPollData>({ averages: {}, customers: [], inProgress: [], notAnswered: [], questions: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'SUMMARY' | 'FEEDBACK' | 'IN_PROGRESS' | 'NOT_ANSWERED'>('SUMMARY');
    
    // Filters
    const [selectedYear, setSelectedYear] = useState<string>('ALL');
    const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
    const [showDissatisfiedOnly, setShowDissatisfiedOnly] = useState(false);
    const [hideIgnored, setHideIgnored] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await getPollAverages();
                setData(result);
            } catch (err) {
                setError('خطا در بارگذاری نتایج نظرسنجی');
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const filterResults = (list: PollCustomerResult[]) => {
        return list.filter(item => {
            const yearMatch = selectedYear === 'ALL' || item.DeliveryYear === selectedYear;
            const monthMatch = selectedMonth === 'ALL' || String(item.DeliveryMonth) === selectedMonth;
            const ignoreMatch = !hideIgnored || !item.ignore;
            return yearMatch && monthMatch && ignoreMatch;
        });
    };

    const filteredCustomers = useMemo(() => {
        let list = filterResults(data.customers || []);
        if (showDissatisfiedOnly) {
            list = list.filter(c => calculateCustomerAverage(c.Fields) < 7);
        }
        return list;
    }, [data.customers, selectedYear, selectedMonth, showDissatisfiedOnly, hideIgnored]);

    const filteredInProgress = useMemo(() => filterResults(data.inProgress || []), [data.inProgress, selectedYear, selectedMonth]);
    const filteredNotAnswered = useMemo(() => filterResults(data.notAnswered || []), [data.notAnswered, selectedYear, selectedMonth]);

    // Recalculate summary averages based on selected subset
    const dynamicAverages = useMemo((): PollResult[] => {
        if (filteredCustomers.length === 0) return [];

        const questionSums: Record<string, { total: number, count: number }> = {};
        filteredCustomers.forEach(c => {
            Object.entries(c.Fields).forEach(([key, val]) => {
                if (key.startsWith('Field_') && typeof val === 'number') {
                    if (!questionSums[key]) questionSums[key] = { total: 0, count: 0 };
                    questionSums[key].total += val;
                    questionSums[key].count++;
                }
            });
        });

        return Object.entries(questionSums).map(([key, stats]) => ({
            key,
            question: data.questions[key] || 'سوال نامشخص',
            score: stats.total / stats.count
        })).sort((a, b) => b.score - a.score);

    }, [data.questions, filteredCustomers]);

    const overallAverage = useMemo(() => {
        if (dynamicAverages.length === 0) return 0;
        const totalScore = dynamicAverages.reduce((sum, item) => sum + item.score, 0);
        return totalScore / dynamicAverages.length;
    }, [dynamicAverages]);

    const availableYears = useMemo(() => {
        const years = new Set<string>();
        [...data.customers, ...data.inProgress, ...data.notAnswered].forEach(i => {
            if (i.DeliveryYear) years.add(i.DeliveryYear);
        });
        return Array.from(years).sort();
    }, [data]);

    const TabButton = ({ id, label, count, colorClass }: { id: typeof activeTab, label: string, count?: number, colorClass?: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`relative px-4 py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === id 
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-md' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
        >
            {label}
            {count !== undefined && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black shadow-sm ${colorClass || 'bg-slate-200 text-slate-600'}`}>
                    {count.toLocaleString('fa-IR')}
                </span>
            )}
        </button>
    );

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 w-full xl:w-auto">
                        <div className="p-4 bg-amber-100 dark:bg-amber-900 rounded-2xl text-amber-600 dark:text-amber-300 shadow-sm shadow-amber-100">
                            <PollIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">گزارش نظرسنجی خروجی</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">تحلیل تجربه مشتری بر اساس بازه‌های تحویل خودرو</p>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-400 whitespace-nowrap">فیلتر زمانی:</span>
                            <select 
                                value={selectedYear}
                                onChange={e => setSelectedYear(e.target.value)}
                                className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-amber-400"
                            >
                                <option value="ALL">همه سال‌ها</option>
                                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>

                            <select 
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-amber-400"
                            >
                                <option value="ALL">همه ماه‌ها</option>
                                {PERSIAN_MONTHS.map((m, i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
                            </select>
                        </div>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                        <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-700 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:border-amber-400 transition-colors">
                             <input type="checkbox" checked={hideIgnored} onChange={e => setHideIgnored(e.target.checked)} className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500" />
                             <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 whitespace-nowrap">حذف غیرواقعی</span>
                        </label>
                    </div>
                    
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto shadow-inner">
                        <TabButton id="SUMMARY" label="تحلیل آماری" />
                        <TabButton id="FEEDBACK" label="پاسخ‌ها" count={filteredCustomers.length} colorClass="bg-emerald-100 text-emerald-700" />
                        <TabButton id="IN_PROGRESS" label="در جریان" count={filteredInProgress.length} colorClass="bg-amber-100 text-amber-700" />
                        <TabButton id="NOT_ANSWERED" label="بدون پاسخ" count={filteredNotAnswered.length} colorClass="bg-rose-100 text-rose-700" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col justify-center items-center h-64 gap-4">
                    <Spinner />
                    <p className="text-sm font-bold text-slate-400">در حال پردازش داده‌ها...</p>
                </div>
            ) : error ? (
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center">
                    <p className="text-rose-600 font-bold">{error}</p>
                </div>
            ) : (
                <>
                    {activeTab === 'SUMMARY' && (dynamicAverages.length > 0 ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatusPieChart completed={filteredCustomers.length} inProgress={filteredInProgress.length} notAnswered={filteredNotAnswered.length} />
                                
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center h-full">
                                    <h3 className="text-base font-black text-slate-800 dark:text-white mb-4">شاخص رضایت کل (CSI)</h3>
                                    <div className="relative w-40 h-40">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                            <path className="text-slate-100 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                                            <path className={`${overallAverage >= 9 ? 'text-emerald-500' : overallAverage >= 7.5 ? 'text-emerald-400' : 'text-amber-500'}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${(overallAverage / 10) * 100}, 100`} strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-4xl font-black text-slate-800 dark:text-white font-mono tracking-tighter">
                                                {overallAverage.toFixed(1)}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">از ۱۰</span>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-[10px] font-bold text-slate-400 text-center">
                                        میانگین وزنی نمرات در بازه: <br/>
                                        <span className="text-slate-600 dark:text-slate-300">
                                            {selectedMonth !== 'ALL' ? PERSIAN_MONTHS[Number(selectedMonth)-1] : 'کل دوره'} {selectedYear !== 'ALL' ? selectedYear : ''}
                                        </span>
                                    </p>
                                </div>

                                <ScoreDistributionChart customers={filteredCustomers} />
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-8 border-b pb-4 dark:border-slate-700">
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white">تحلیل دقیق سوالات</h3>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">نمایش به ترتیب بیشترین رضایت</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    {dynamicAverages.map(result => (
                                        <ChartBar key={result.key} {...result} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-2 border-dashed border-slate-100 dark:border-slate-700">
                            <PollIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
                            <p className="text-slate-400 font-bold">در بازه زمانی و فیلترهای انتخابی، داده‌ای یافت نشد.</p>
                            <button onClick={() => { setSelectedYear('ALL'); setSelectedMonth('ALL'); setHideIgnored(true); setShowDissatisfiedOnly(false); }} className="mt-4 text-amber-600 font-black text-sm hover:underline">پاک کردن تمام فیلترها</button>
                        </div>
                    ))}

                    {activeTab === 'FEEDBACK' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="text-sm font-black text-slate-600 dark:text-slate-400">
                                    نمایش {filteredCustomers.length.toLocaleString('fa-IR')} ردیف پاسخ
                                </div>
                                <button
                                    onClick={() => setShowDissatisfiedOnly(!showDissatisfiedOnly)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all shadow-sm ${
                                        showDissatisfiedOnly 
                                        ? 'bg-rose-600 border-rose-600 text-white' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${showDissatisfiedOnly ? 'bg-white animate-pulse' : 'bg-rose-500'}`}></span>
                                    نمایش فقط ناراضی‌ها (زیر ۷)
                                </button>
                            </div>
                            {filteredCustomers.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 font-bold bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed">موردی برای نمایش یافت نشد.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredCustomers.map((customer, idx) => (
                                        <CustomerFeedbackCard key={idx} result={customer} questionMap={data.questions} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'IN_PROGRESS' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="text-sm font-black text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                مجموعاً {filteredInProgress.length.toLocaleString('fa-IR')} ردیف در حال تکمیل نظرسنجی هستند.
                            </div>
                            {filteredInProgress.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 font-bold bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed">موردی یافت نشد.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredInProgress.map((customer, idx) => (
                                        <PendingCustomerCard key={idx} result={customer} type="IN_PROGRESS" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'NOT_ANSWERED' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="text-sm font-black text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                مجموعاً {filteredNotAnswered.length.toLocaleString('fa-IR')} ردیف هنوز پاسخ نداده‌اند.
                            </div>
                            {filteredNotAnswered.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 font-bold bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed">موردی یافت نشد.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredNotAnswered.map((customer, idx) => (
                                        <PendingCustomerCard key={idx} result={customer} type="NOT_ANSWERED" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PollPage;
