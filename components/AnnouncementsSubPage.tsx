import React, { useState, useEffect, useMemo } from 'react';
import { 
    getAnnouncements, 
    createAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement 
} from '../services/api';
import { Announcement, AnnouncementCategory, AnnouncementAudience } from '../types';
import Spinner from './Spinner';
import Toast from './Toast';
import { 
    Bell, 
    AlertTriangle, 
    Info, 
    Plus, 
    Trash2, 
    Edit, 
    Eye, 
    Mail, 
    Tag as TagIcon, 
    Users, 
    Search, 
    Filter, 
    Calendar, 
    Clock, 
    ClipboardCheck, 
    FileText, 
    Sparkles, 
    ChevronRight,
    ExternalLink,
    LayoutGrid,
    Table
} from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';
import AnnouncementModal from './AnnouncementModal';
import AnnouncementViewModal from './AnnouncementViewModal';

interface AnnouncementsSubPageProps {
    loggedInUser: any;
}

export const AnnouncementsSubPage: React.FC<AnnouncementsSubPageProps> = ({ loggedInUser }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedAudience, setSelectedAudience] = useState<string>('ALL');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [onlyUrgent, setOnlyUrgent] = useState(false);
    const [onlyEmails, setOnlyEmails] = useState(false);

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);

    // Delete state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null);

    // Access permissions
    const isAdminOrManager = 
        loggedInUser?.isAdmin === 1 || 
        loggedInUser?.role === 'ADMIN' || 
        loggedInUser?.role === 'MANAGER' || 
        loggedInUser?.permission_level >= 7 ||
        loggedInUser?.username === 'admin';

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await getAnnouncements();
            setAnnouncements(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error("Failed to load announcements:", error);
            setToast({ message: error?.message || 'خطا در دریافت اطلاعات اطلاعیه‌ها از وب‌سرویس', type: 'error' });
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    useEffect(() => {
        const handleRefresh = () => {
            fetchAnnouncements();
        };
        window.addEventListener('app-refresh', handleRefresh);
        return () => window.removeEventListener('app-refresh', handleRefresh);
    }, []);

    // Save (Create or Update)
    const handleSaveAnnouncement = async (payload: Partial<Announcement>) => {
        try {
            if (editingAnnouncement) {
                await updateAnnouncement({
                    ...editingAnnouncement,
                    ...payload,
                    id: editingAnnouncement.id,
                } as Announcement);
                setToast({ message: 'بخشنامه با موفقیت بروزرسانی شد', type: 'success' });
            } else {
                await createAnnouncement(payload);
                setToast({ message: 'بخشنامه جدید با موفقیت ثبت و ابلاغ شد', type: 'success' });
            }
            await fetchAnnouncements();
        } catch (error: any) {
            console.error('Error saving announcement:', error);
            setToast({ message: error?.message || 'خطا در ذخیره‌سازی بخشنامه در وب‌سرویس', type: 'error' });
            throw error;
        }
    };

    // Confirm Delete
    const confirmDelete = async () => {
        if (!announcementToDelete) return;
        try {
            await deleteAnnouncement(announcementToDelete);
            setToast({ message: 'اطلاعیه با موفقیت حذف گردید', type: 'success' });
            await fetchAnnouncements();
        } catch (error: any) {
            console.error('Error deleting announcement:', error);
            setToast({ message: error?.message || 'خطا در حذف اطلاعیه از وب‌سرویس', type: 'error' });
        } finally {
            setDeleteModalOpen(false);
            setAnnouncementToDelete(null);
        }
    };

    // Extract all distinct tags across announcements
    const allTags = useMemo(() => {
        const set = new Set<string>();
        announcements.forEach((a) => {
            if (a.tags && Array.isArray(a.tags)) {
                a.tags.forEach((t) => set.add(t));
            }
        });
        return Array.from(set);
    }, [announcements]);

    // Filtered list
    const filteredAnnouncements = useMemo(() => {
        return announcements.filter((ann) => {
            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = ann.title?.toLowerCase().includes(q);
                const matchContent = ann.content?.toLowerCase().includes(q);
                const matchAuthor = ann.author?.toLowerCase().includes(q);
                const matchSender = ann.emailMetadata?.sender?.toLowerCase().includes(q);
                const matchTag = ann.tags?.some((t) => t.toLowerCase().includes(q));
                if (!matchTitle && !matchContent && !matchAuthor && !matchSender && !matchTag) {
                    return false;
                }
            }

            // Category filter
            if (selectedCategory !== 'ALL' && ann.category !== selectedCategory) {
                return false;
            }

            // Audience filter
            if (selectedAudience !== 'ALL') {
                if (ann.targetAudience !== 'ALL' && ann.targetAudience !== selectedAudience) {
                    return false;
                }
            }

            // Tag filter
            if (selectedTag && (!ann.tags || !ann.tags.includes(selectedTag))) {
                return false;
            }

            // Urgent filter
            if (onlyUrgent && !Boolean(ann.isUrgent)) {
                return false;
            }

            // Email filter
            if (onlyEmails && !Boolean(ann.isFromEmail)) {
                return false;
            }

            return true;
        });
    }, [announcements, searchQuery, selectedCategory, selectedAudience, selectedTag, onlyUrgent, onlyEmails]);

    // Clean summary helper to extract readable text and strip raw HTML tags
    const getCleanSummary = (ann: Announcement): string => {
        const raw = ann.content || ann.htmlContent || '';
        if (!raw || !raw.trim()) return 'بدون خلاصه متن';
        if (/<[a-z][\s\S]*>/i.test(raw)) {
            try {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = raw;
                const text = tempDiv.textContent || tempDiv.innerText || '';
                return text.trim() || raw.replace(/<[^>]*>?/gm, '').trim();
            } catch {
                return raw.replace(/<[^>]*>?/gm, '').trim();
            }
        }
        return raw;
    };

    const getCategoryDetails = (cat: string, urgent: boolean) => {
        if (urgent) {
            return {
                icon: <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />,
                label: 'فوری و مهم',
                badgeStyle: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800',
            };
        }
        switch (cat) {
            case 'CIRCULAR':
                return {
                    icon: <FileText className="w-4 h-4 text-indigo-500" />,
                    label: 'بخشنامه رسمی',
                    badgeStyle: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
                };
            case 'ALERT':
                return {
                    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
                    label: 'دستورالعمل',
                    badgeStyle: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                };
            case 'SYSTEM':
                return {
                    icon: <Info className="w-4 h-4 text-sky-500" />,
                    label: 'سیستمی',
                    badgeStyle: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800',
                };
            case 'EVENT':
                return {
                    icon: <Calendar className="w-4 h-4 text-purple-500" />,
                    label: 'رویداد',
                    badgeStyle: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                };
            default:
                return {
                    icon: <Bell className="w-4 h-4 text-emerald-500" />,
                    label: 'خبر داخلی',
                    badgeStyle: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                };
        }
    };

    const getAudienceBadge = (aud?: string) => {
        switch (aud) {
            case 'ADMIN': return { label: 'مدیران ارشد', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' };
            case 'MANAGERS': return { label: 'مدیران بخش‌ها', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' };
            case 'SALES': return { label: 'تیم فروش', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' };
            case 'FINANCE': return { label: 'مالی و حسابداری', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' };
            case 'HR': return { label: 'منابع انسانی', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' };
            default: return { label: 'عموم همکاران', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' };
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Spinner />
                <p className="text-xs text-slate-500">در حال دریافت بخشنامه‌ها و اطلاعیه‌ها...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Top Toolbar / Quick Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="جستجو در عناوین، متن بخشنامه، تگ‌ها یا فرستنده..."
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')} 
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                            پاک‌کردن
                        </button>
                    )}
                </div>

                {/* Action Buttons & View Switcher */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* View Switcher */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setDisplayMode('grid')}
                            className={`p-1.5 rounded-xl transition-all flex items-center gap-1 text-xs font-bold ${
                                displayMode === 'grid'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                            title="نمایش کارتی"
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden sm:inline text-[11px]">کارتی</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setDisplayMode('table')}
                            className={`p-1.5 rounded-xl transition-all flex items-center gap-1 text-xs font-bold ${
                                displayMode === 'table'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                            title="نمایش جدولی"
                        >
                            <Table className="w-4 h-4" />
                            <span className="hidden sm:inline text-[11px]">جدولی</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setEditingAnnouncement(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>ثبت بخشنامه جدید</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setEditingAnnouncement(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-3.5 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all flex-shrink-0"
                        title="چسباندن مستقیم ایمیل دریافت شده در Outlook یا جیمیل"
                    >
                        <Mail className="w-4 h-4 text-sky-500" />
                        <span className="hidden md:inline">چسباندن از ایمیل (Paste)</span>
                        <span className="md:hidden">ایمیل</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar (Categories, Audience, Tags, Urgency) */}
            <div className="bg-slate-50/70 dark:bg-slate-850/50 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                
                {/* Categories & Audience Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Category tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {[
                            { id: 'ALL', label: 'همه اطلاعیه‌ها' },
                            { id: 'CIRCULAR', label: 'بخشنامه‌های رسمی' },
                            { id: 'NEWS', label: 'اخبار داخلی' },
                            { id: 'ALERT', label: 'هشدارها و دستورالعمل' },
                            { id: 'SYSTEM', label: 'سیستمی' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedCategory(tab.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    selectedCategory === tab.id
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Quick Toggles */}
                    <div className="flex items-center gap-2">
                        {/* Only Urgent Toggle */}
                        <button
                            type="button"
                            onClick={() => setOnlyUrgent(!onlyUrgent)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                                onlyUrgent
                                    ? 'bg-red-500 text-white border-red-500 shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700 hover:text-red-600'
                            }`}
                        >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>فقط فوری‌ها</span>
                        </button>

                        {/* Only Emails Toggle */}
                        <button
                            type="button"
                            onClick={() => setOnlyEmails(!onlyEmails)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                                onlyEmails
                                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700 hover:text-sky-600'
                            }`}
                        >
                            <Mail className="w-3.5 h-3.5" />
                            <span>ایمیل‌های سازمانی</span>
                        </button>
                    </div>
                </div>

                {/* Audience Selector & Tags Cloud */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Audience Filter */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-bold flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span>مخاطب:</span>
                        </span>
                        <select
                            value={selectedAudience}
                            onChange={(e) => setSelectedAudience(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none"
                        >
                            <option value="ALL">همه مخاطبان</option>
                            <option value="ADMIN">مدیران ارشد</option>
                            <option value="MANAGERS">مدیران بخش‌ها</option>
                            <option value="SALES">تیم فروش</option>
                            <option value="FINANCE">مالی و حسابداری</option>
                            <option value="HR">منابع انسانی</option>
                        </select>
                    </div>

                    {/* Tags Chip Bar */}
                    {allTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-1">
                                <TagIcon className="w-3 h-3 text-indigo-400" />
                                <span>تگ‌ها:</span>
                            </span>
                            {selectedTag && (
                                <button
                                    onClick={() => setSelectedTag(null)}
                                    className="text-[11px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-lg font-bold"
                                >
                                    حذف فیلتر تگ (✕)
                                </button>
                            )}
                            {allTags.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                    className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                                        selectedTag === tag
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
                                    }`}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Announcements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {filteredAnnouncements.length === 0 ? (
                    <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-3">
                        <Bell className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                        <p className="font-bold text-sm text-slate-600 dark:text-slate-400">
                            هیچ اطلاعیه یا بخشنامه‌ای با این مشخصات یافت نشد.
                        </p>
                        <p className="text-xs text-slate-400">
                            می‌توانید فیلترها را ریست کنید یا با زدن دکمه «ثبت بخشنامه جدید» اقدام نمایید.
                        </p>
                        {(searchQuery || selectedCategory !== 'ALL' || selectedAudience !== 'ALL' || selectedTag || onlyUrgent || onlyEmails) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('ALL');
                                    setSelectedAudience('ALL');
                                    setSelectedTag(null);
                                    setOnlyUrgent(false);
                                    setOnlyEmails(false);
                                }}
                                className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 underline"
                            >
                                بازنشانی تمام فیلترها
                            </button>
                        )}
                    </div>
                ) : displayMode === 'table' ? (
                    <div className="col-span-full bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/90 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                                        <th className="p-3.5 w-12 text-center">#</th>
                                        <th className="p-3.5 min-w-[200px]">عنوان بخشنامه</th>
                                        <th className="p-3.5 min-w-[320px]">خلاصه و شرح متن</th>
                                        <th className="p-3.5 min-w-[130px]">دسته‌بندی</th>
                                        <th className="p-3.5 min-w-[110px]">مخاطبان</th>
                                        <th className="p-3.5 min-w-[140px]">ایجادکننده / ویرایشگر</th>
                                        <th className="p-3.5 min-w-[150px]">تاریخ ابلاغ</th>
                                        <th className="p-3.5 min-w-[120px] text-center">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                                    {filteredAnnouncements.map((ann, idx) => {
                                        const cat = getCategoryDetails(ann.category, Boolean(ann.isUrgent));
                                        const aud = getAudienceBadge(ann.targetAudience);
                                        const cleanTitle = (ann.title && ann.title.trim()) ? ann.title : 'بدون عنوان';
                                        const cleanSummary = getCleanSummary(ann);

                                        return (
                                            <tr 
                                                key={ann.id} 
                                                className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors ${
                                                    Boolean(ann.isUrgent) ? 'bg-red-50/25 dark:bg-red-950/15' : ''
                                                }`}
                                            >
                                                <td className="p-3.5 text-center font-mono text-slate-400 font-bold">
                                                    {ann.id || idx + 1}
                                                </td>
                                                <td className="p-3.5 font-black text-slate-900 dark:text-white">
                                                    <div 
                                                        onClick={() => setViewingAnnouncement(ann)}
                                                        className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-words flex items-start gap-1.5"
                                                    >
                                                        {Boolean(ann.isUrgent) && (
                                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0 mt-1.5" title="فوری"></span>
                                                        )}
                                                        <span>{cleanTitle}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3.5 text-slate-700 dark:text-slate-300">
                                                    <div 
                                                        onClick={() => setViewingAnnouncement(ann)}
                                                        className="line-clamp-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-words leading-relaxed"
                                                    >
                                                        {cleanSummary}
                                                    </div>
                                                </td>
                                                <td className="p-3.5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${cat.badgeStyle}`}>
                                                        {cat.icon}
                                                        <span>{cat.label}</span>
                                                    </span>
                                                </td>
                                                <td className="p-3.5">
                                                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${aud.color}`}>
                                                        {aud.label}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-slate-700 dark:text-slate-300">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                                            {ann.createdBy || ann.author || 'مدیریت بازرگانی'}
                                                        </span>
                                                        {ann.updatedBy && (
                                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                                                ویرایش: {ann.updatedBy}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400" dir="ltr">
                                                    {ann.createdAt}
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => setViewingAnnouncement(ann)}
                                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                                                            title="مشاهده کامل"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingAnnouncement(ann);
                                                                setIsFormOpen(true);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                            title="ویرایش"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setAnnouncementToDelete(ann.id);
                                                                setDeleteModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    filteredAnnouncements.map((ann) => {
                        const cat = getCategoryDetails(ann.category, Boolean(ann.isUrgent));
                        const aud = getAudienceBadge(ann.targetAudience);
                        const cleanTitle = (ann.title && ann.title.trim()) ? ann.title : 'بدون عنوان';
                        const cleanSummary = getCleanSummary(ann);

                        return (
                            <div 
                                key={ann.id} 
                                className={`bg-white dark:bg-slate-900 rounded-3xl shadow-xs border ${
                                    Boolean(ann.isUrgent) 
                                        ? 'border-red-400 dark:border-red-800/80 shadow-red-50 dark:shadow-none' 
                                        : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                                } p-5 flex flex-col relative overflow-hidden group hover:shadow-md transition-all`}
                            >
                                {/* Top colored accent line for urgency */}
                                {Boolean(ann.isUrgent) && (
                                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500"></div>
                                )}

                                {/* Card Header (Category, Audience, Email badge) */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <div className={`px-2.5 py-1 rounded-xl text-[11px] font-black border flex items-center gap-1 ${cat.badgeStyle}`}>
                                            {cat.icon}
                                            <span>{cat.label}</span>
                                        </div>

                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${aud.color}`}>
                                            {aud.label}
                                        </span>

                                        {Boolean(ann.isFromEmail) && (
                                            <span className="bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1" title="کپی شده از ایمیل سازمانی">
                                                <Mail className="w-3 h-3" />
                                                <span>ایمیل</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions menu (Edit, Delete) */}
                                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingAnnouncement(ann);
                                                setIsFormOpen(true);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            title="ویرایش بخشنامه"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => {
                                                setAnnouncementToDelete(ann.id);
                                                setDeleteModalOpen(true);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            title="حذف اطلاعیه"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Title with explicit label */}
                                <div className="mb-2.5">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                                        عنوان بخشنامه:
                                    </span>
                                    <h3 
                                        onClick={() => setViewingAnnouncement(ann)}
                                        className="font-black text-slate-900 dark:text-white text-base hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors leading-snug break-words"
                                    >
                                        {cleanTitle}
                                    </h3>
                                </div>

                                {/* Email Metadata info row if from email */}
                                {Boolean(ann.isFromEmail) && ann.emailMetadata?.sender && (
                                    <div className="mb-3 bg-sky-50/50 dark:bg-sky-950/20 p-2 rounded-xl border border-sky-100 dark:border-sky-900/60 text-[11px] text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                                        <span className="truncate">فرستنده ایمیل: <b>{ann.emailMetadata.sender}</b></span>
                                    </div>
                                )}

                                {/* Content / Summary Box */}
                                <div className="bg-slate-50/90 dark:bg-slate-800/50 rounded-2xl p-3.5 mb-3.5 border border-slate-100 dark:border-slate-800/70 flex-1 flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-1.5">
                                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>خلاصه و شرح متن:</span>
                                    </span>
                                    <p 
                                        onClick={() => setViewingAnnouncement(ann)}
                                        className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed line-clamp-3 break-words cursor-pointer flex-grow"
                                    >
                                        {cleanSummary}
                                    </p>
                                </div>

                                {/* Tags preview */}
                                {ann.tags && ann.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {ann.tags.slice(0, 3).map((t) => (
                                            <span 
                                                key={t} 
                                                onClick={() => setSelectedTag(t)}
                                                className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors"
                                            >
                                                #{t}
                                            </span>
                                        ))}
                                        {ann.tags.length > 3 && (
                                            <span className="text-[10px] text-slate-400">
                                                +{ann.tags.length - 3} تگ دیگر
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Card Footer */}
                                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                                    <div className="flex flex-col gap-0.5 max-w-[65%]">
                                        <div className="flex items-center gap-1 truncate">
                                            <span>ایجادکننده:</span>
                                            <b className="text-slate-700 dark:text-slate-300 truncate">{ann.createdBy || ann.author || 'مدیریت بازرگانی'}</b>
                                        </div>
                                        {ann.updatedBy && (
                                            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 truncate">
                                                <span>ویرایش:</span>
                                                <b className="truncate">{ann.updatedBy}</b>
                                            </div>
                                        )}
                                        {ann.createdAt && (
                                            <span className="font-mono text-[10px] text-slate-400 opacity-80" dir="ltr">
                                                {ann.createdAt}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <button
                                        onClick={() => setViewingAnnouncement(ann)}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold flex items-center gap-1 hover:underline shrink-0"
                                    >
                                        <span>مشاهده کامل</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create & Edit Modal (with smart email paste) */}
            {isFormOpen && (
                <AnnouncementModal
                    isOpen={isFormOpen}
                    onClose={() => {
                        setIsFormOpen(false);
                        setEditingAnnouncement(null);
                    }}
                    onSave={handleSaveAnnouncement}
                    initialData={editingAnnouncement}
                    currentUserName={loggedInUser?.full_name || loggedInUser?.username || 'مدیریت'}
                />
            )}

            {/* View Full Announcement Modal (with full HTML email render & print) */}
            {viewingAnnouncement && (
                <AnnouncementViewModal
                    isOpen={!!viewingAnnouncement}
                    onClose={() => setViewingAnnouncement(null)}
                    announcement={viewingAnnouncement}
                    onEdit={(ann) => {
                        setEditingAnnouncement(ann);
                        setIsFormOpen(true);
                    }}
                    canEdit={isAdminOrManager}
                />
            )}

            {/* Delete Confirm Modal */}
            {deleteModalOpen && (
                <DeleteConfirmModal 
                    title="حذف اطلاعیه سازمانی"
                    message="آیا از حذف این اطلاعیه از تابلوی اعلانات اطمینان دارید؟ این عملیات غیرقابل بازگشت است."
                    isOpen={deleteModalOpen}
                    onClose={() => {
                        setDeleteModalOpen(false);
                        setAnnouncementToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                />
            )}
        </div>
    );
};

export default AnnouncementsSubPage;
