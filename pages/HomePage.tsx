import React, { useState, useEffect } from 'react';
import { 
    LayoutGrid, TrendingUp, Percent, 
    Users, Megaphone, Calendar, ArrowLeft, Landmark, FileText
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

    const getCategoryDetails = (cat: string, urgent: boolean) => {
        if (urgent) {
            return { label: 'فوری و مهم', badgeStyle: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200' };
        }
        switch (cat) {
            case 'CIRCULAR': return { label: 'بخشنامه رسمی', badgeStyle: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200' };
            case 'ALERT': return { label: 'دستورالعمل', badgeStyle: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200' };
            case 'SYSTEM': return { label: 'سیستمی', badgeStyle: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200' };
            default: return { label: 'خبر داخلی', badgeStyle: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200' };
        }
    };

    const getCleanSummary = (ann: Announcement): string => {
        const raw = ann.content || ann.htmlContent || '';
        if (!raw || !raw.trim()) return 'بدون شرح متن';
        return raw.replace(/<[^>]*>?/gm, '').trim();
    };

    return (
        <div className="animate-fade-in pb-12 space-y-8">
            {/* Quick Navigation Section (دسترسی سریع) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <LayoutGrid className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white">
                            دسترسی سریع به بخش‌های اصلی
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                    {[
                        { id: 'bank-letter' as ActiveView, label: 'قرارداد صلح و نامه بانک', icon: Landmark, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                        { id: 'conditions' as ActiveView, label: 'بخشنامه‌های فروش', icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
                        { id: 'announcements' as ActiveView, label: 'اطلاعیه‌های داخلی', icon: Megaphone, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                        { id: 'users' as ActiveView, label: 'مدیریت مشتریان', icon: Users, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/30' },
                        { id: 'car-prices' as ActiveView, label: 'قیمت روز خودرو', icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' },
                    ].map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all hover:shadow-md group text-center flex flex-col items-center justify-center gap-2.5 active:scale-95"
                        >
                            <div className={`p-3 rounded-xl ${item.bg} ${item.color} transition-transform group-hover:scale-110`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Internal Announcements List Feed (آخرین اخبار و اطلاعیه‌های داخلی) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Megaphone className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white">
                                آخرین اخبار و اطلاعیه‌های داخلی
                            </h2>
                            <p className="text-xs text-slate-400">فهرست اطلاعیه‌ها و بخشنامه‌های سازمانی ابلاغ‌شده</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate('announcements')}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                        <span>مشاهده همه آرشیو</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 md:p-6">
                    {loading ? (
                        <div className="py-16 text-center text-slate-400 text-xs">در حال بارگذاری اطلاعیه‌ها...</div>
                    ) : announcements.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 text-xs">هیچ اطلاعیه‌ای یافت نشد.</div>
                    ) : (
                        <div className="space-y-3">
                            {announcements.slice(0, 6).map((ann) => {
                                const cat = getCategoryDetails(ann.category, Boolean(ann.isUrgent));
                                const cleanSummary = getCleanSummary(ann);

                                return (
                                    <div
                                        key={ann.id}
                                        onClick={() => setViewingAnnouncement(ann)}
                                        className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 hover:bg-slate-100/90 dark:hover:bg-slate-800/80 border border-slate-150 dark:border-slate-800 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                                    >
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cat.badgeStyle}`}>
                                                    {cat.label}
                                                </span>
                                                {Boolean(ann.isUrgent) && (
                                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="فوری"></span>
                                                )}
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    {ann.createdAt}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {ann.title || 'بدون عنوان'}
                                            </h3>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                                                {cleanSummary}
                                            </p>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                            <span className="hidden sm:inline">مشاهده متن</span>
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
