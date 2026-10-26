import React, { useState, useEffect, useMemo } from 'react';
import { 
    LayoutGrid, TrendingUp, 
    Users, Megaphone, Calendar, ArrowLeft, Landmark, FileText,
    Car, Clock, ShieldCheck, Sparkles, Layers, CheckCircle2
} from 'lucide-react';
import type { ActiveView } from '../App';
import { getAnnouncements } from '../services/api';
import type { Announcement } from '../types';
import AnnouncementViewModal from '../components/AnnouncementViewModal';

interface HomePageProps {
    onNavigate: (view: ActiveView) => void;
    loggedInUser?: any;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate, loggedInUser }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        getAnnouncements()
            .then(data => setAnnouncements(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error fetching announcements:", err))
            .finally(() => setLoading(false));
    }, []);

    const persianDate = useMemo(() => {
        try {
            return new Intl.DateTimeFormat('fa-IR', {
                dateStyle: 'full'
            }).format(new Date());
        } catch {
            return new Date().toLocaleDateString('fa-IR');
        }
    }, []);

    const getCategoryDetails = (cat: string, urgent: boolean) => {
        if (urgent) {
            return { label: 'فوری و مهم', badgeStyle: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800/60' };
        }
        switch (cat) {
            case 'CIRCULAR': return { label: 'بخشنامه رسمی', badgeStyle: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60' };
            case 'ALERT': return { label: 'دستورالعمل', badgeStyle: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' };
            case 'SYSTEM': return { label: 'سیستمی', badgeStyle: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800/60' };
            default: return { label: 'خبر داخلی', badgeStyle: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' };
        }
    };

    const getCleanSummary = (ann: Announcement): string => {
        const raw = ann.content || ann.htmlContent || '';
        if (!raw || !raw.trim()) return 'بدون شرح متن';
        return raw.replace(/<[^>]*>?/gm, '').trim();
    };

    const userName = loggedInUser?.full_name || loggedInUser?.username || 'همکار گرامی';

    const quickLinks = [
        { id: 'users' as ActiveView, label: 'مدیریت مشتریان (CRM)', desc: 'پیگیری و ثبت سرنخ‌ها', icon: Users, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/40' },
        { id: 'car-prices' as ActiveView, label: 'قیمت روز خودرو', desc: 'استعلام لحظه‌ای و آمار', icon: TrendingUp, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40' },
        { id: 'conditions' as ActiveView, label: 'بخشنامه‌های فروش', desc: 'شرایط اقساطی و نقدی', icon: FileText, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/40' },
        { id: 'bank-letter' as ActiveView, label: 'قرارداد صلح و بانک', desc: 'صدور نامه‌ها و قرارداد', icon: Landmark, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40' },
        { id: 'inventory' as ActiveView, label: 'موجودی خودروها', desc: 'وضعیت فیزیکی انبار', icon: Car, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40' },
        { id: 'announcements' as ActiveView, label: 'تابلو اعلانات', desc: 'اخبار و ابلاغیه‌ها', icon: Megaphone, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-800/40' },
    ];

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-fade-in max-w-7xl">
            {/* Hero Welcome Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                                <span>سامانه یکپارچه آتولید</span>
                            </span>
                            <span className="text-xs text-slate-300/80 hidden sm:inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                {persianDate}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            خوش آمدید، {userName}
                        </h1>
                        <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
                            پیشخوان جامع مدیریت فروش، پیگیری سرنخ‌های مشتریان، استعلام لحظه‌ای قیمت خودروها و بخشنامه‌های رسمی.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-xs">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="font-bold">ارتباط با سرور فعال</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-xs">
                            <Layers className="w-4 h-4 text-sky-400" />
                            <span className="font-bold">همگام‌سازی لحظه‌ای</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Navigation Section (دسترسی سریع) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                            <LayoutGrid className="w-4.5 h-4.5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white">
                                دسترسی سریع به بخش‌های اصلی
                            </h2>
                            <p className="text-xs text-slate-400">میانبرهای پرکاربرد برای تسریع امور روزانه</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
                    {quickLinks.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className="bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 transition-all hover:shadow-lg group text-right flex flex-col justify-between gap-3 active:scale-95 relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className={`p-3 rounded-xl ${item.bg} ${item.color} border transition-transform group-hover:scale-110 shadow-sm`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <ArrowLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:-translate-x-1 transition-all" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 block line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {item.label}
                                </span>
                                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block line-clamp-1">
                                    {item.desc}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Internal Announcements List Feed (آخرین اخبار و اطلاعیه‌های داخلی) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
                            <Megaphone className="w-4.5 h-4.5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white">
                                آخرین اخبار و اطلاعیه‌های داخلی
                            </h2>
                            <p className="text-xs text-slate-400">فهرست اطلاعیه‌ها، بخشنامه‌های فروش و ابلاغیه‌های سازمانی</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate('announcements')}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                    >
                        <span>مشاهده همه آرشیو</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-7">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
                            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                            <span>در حال بارگذاری اطلاعیه‌های سازمانی...</span>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                            <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
                            <p>هیچ اطلاعیه‌ای در سیستم ثبت نشده است.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {announcements.slice(0, 6).map((ann) => {
                                const cat = getCategoryDetails(ann.category, Boolean(ann.isUrgent));
                                const cleanSummary = getCleanSummary(ann);

                                return (
                                    <div
                                        key={ann.id}
                                        onClick={() => setViewingAnnouncement(ann)}
                                        className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100/90 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs hover:shadow-md"
                                    >
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cat.badgeStyle}`}>
                                                    {cat.label}
                                                </span>
                                                {Boolean(ann.isUrgent) && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400">
                                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                        فوری
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    {ann.createdAt}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {ann.title || 'بدون عنوان'}
                                            </h3>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                                {cleanSummary}
                                            </p>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 self-end sm:self-center">
                                            <span>مشاهده جزئیات</span>
                                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Announcement View Modal */}
            <AnnouncementViewModal
                isOpen={Boolean(viewingAnnouncement)}
                onClose={() => setViewingAnnouncement(null)}
                announcement={viewingAnnouncement}
            />
        </div>
    );
};

export default HomePage;
