import React from 'react';
import { 
    X, 
    Printer, 
    Mail, 
    Calendar, 
    User, 
    Tag as TagIcon, 
    Users, 
    AlertTriangle, 
    CheckCircle2, 
    Share2, 
    Copy,
    Building2
} from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    announcement: Announcement | null;
    onEdit?: (announcement: Announcement) => void;
    canEdit?: boolean;
}

const getCategoryBadge = (category: string, isUrgent: boolean) => {
    if (isUrgent) {
        return {
            label: 'فوری و ویژه',
            bg: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800',
        };
    }
    switch (category) {
        case 'CIRCULAR':
            return { label: 'بخشنامه رسمی', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
        case 'ALERT':
            return { label: 'هشدار و دستورالعمل', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
        case 'SYSTEM':
            return { label: 'اطلاعیه سیستمی', bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
        case 'EVENT':
            return { label: 'فراخوان و رویداد', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
        default:
            return { label: 'خبر داخلی', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    }
};

const getAudienceLabel = (aud?: string) => {
    switch (aud) {
        case 'ADMIN': return 'فقط مدیران ارشد و ادمین';
        case 'MANAGERS': return 'مدیران بخش‌ها و شعب';
        case 'SALES': return 'تیم و کارشناسان فروش';
        case 'FINANCE': return 'واحد مالی و حسابداری';
        case 'HR': return 'منابع انسانی و امور اداری';
        default: return 'عموم همکاران (کلیه پرسنل)';
    }
};

export const AnnouncementViewModal: React.FC<AnnouncementViewModalProps> = ({
    isOpen,
    onClose,
    announcement,
    onEdit,
    canEdit
}) => {
    const [copied, setCopied] = React.useState(false);

    if (!isOpen || !announcement) return null;

    const catBadge = getCategoryBadge(announcement.category, announcement.isUrgent);

    const handleCopyContent = () => {
        const text = `${announcement.title}\n\n${announcement.content}\n\nثبت شده در: ${announcement.createdAt}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-h-none print:w-full">
                
                {/* Header Actions */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/50 print:hidden">
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${catBadge.bg}`}>
                            {catBadge.label}
                        </span>

                        <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{getAudienceLabel(announcement.targetAudience)}</span>
                        </span>

                        {Boolean(announcement.isFromEmail) && (
                            <span className="text-xs bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-sky-500" />
                                <span>ایمیل سازمانی</span>
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleCopyContent}
                            title="کپی متن بخشنامه"
                            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold flex items-center gap-1"
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            <span className="hidden sm:inline">{copied ? 'کپی شد' : 'کپی'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handlePrint}
                            title="چاپ یا ذخیره PDF"
                            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold flex items-center gap-1"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">چاپ</span>
                        </button>

                        {canEdit && onEdit && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onEdit(announcement);
                                }}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-colors"
                            >
                                ویرایش
                            </button>
                        )}

                        <button 
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable / Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                    
                    {/* Official Email Banner if copied from email */}
                    {Boolean(announcement.isFromEmail) && (
                        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-black">
                                    <Mail className="w-4 h-4" />
                                    <span>پیام ابلاغی از ایمیل رسمی سازمانی</span>
                                </div>
                                <span className="font-mono text-slate-400">
                                    {announcement.emailMetadata?.date || announcement.createdAt}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                                <div>
                                    <span className="text-slate-400 ml-1">فرستنده:</span>
                                    <strong className="text-slate-800 dark:text-white">
                                        {announcement.emailMetadata?.sender || announcement.author}
                                    </strong>
                                    {announcement.emailMetadata?.senderEmail && (
                                        <span className="text-slate-400 font-mono text-[11px] mr-1.5">
                                            &lt;{announcement.emailMetadata.senderEmail}&gt;
                                        </span>
                                    )}
                                </div>

                                {announcement.emailMetadata?.receiver && (
                                    <div>
                                        <span className="text-slate-400 ml-1">گیرندگان:</span>
                                        <span>{announcement.emailMetadata.receiver}</span>
                                    </div>
                                )}

                                {announcement.emailMetadata?.subject && (
                                    <div className="sm:col-span-2">
                                        <span className="text-slate-400 ml-1">موضوع ایمیل:</span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {announcement.emailMetadata.subject}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Announcement Title */}
                    <div className="space-y-2">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                            {announcement.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                            <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>ثبت شده توسط: <strong className="text-slate-700 dark:text-slate-300">{announcement.author}</strong></span>
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-mono text-slate-600 dark:text-slate-300" dir="ltr">{announcement.createdAt}</span>
                            </span>
                            {announcement.updatedAt && (
                                <span className="text-amber-600 dark:text-amber-400 font-mono" dir="ltr">
                                    (ویرایش: {announcement.updatedAt})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    {announcement.tags && announcement.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-1">
                                <TagIcon className="w-3 h-3 text-indigo-400" />
                                <span>تگ‌ها:</span>
                            </span>
                            {announcement.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-0.5 rounded-lg font-bold border border-indigo-200/50 dark:border-indigo-800"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Full Content Rendering (HTML or Text) */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        {announcement.htmlContent ? (
                            <div 
                                className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed overflow-x-auto"
                                style={{
                                    fontSize: '14px',
                                }}
                                dangerouslySetInnerHTML={{ __html: announcement.htmlContent }}
                            />
                        ) : (
                            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-normal">
                                {announcement.content}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-850/50 print:hidden">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>سیستم جامع اتولید - مجموعه حسینی خودرو</span>
                    </span>
                    <button
                        onClick={onClose}
                        className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2 rounded-xl text-xs font-bold transition-colors"
                    >
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementViewModal;
