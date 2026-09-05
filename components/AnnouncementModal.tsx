import React, { useState, useEffect, useRef } from 'react';
import { 
    X, 
    Mail, 
    FileText, 
    Tag as TagIcon, 
    Users, 
    AlertTriangle, 
    Sparkles, 
    Clipboard, 
    Eye, 
    Check, 
    Plus,
    Calendar,
    Send,
    Shield,
    User,
    Edit3
} from 'lucide-react';
import { 
    Announcement, 
    AnnouncementCategory, 
    AnnouncementAudience, 
    AnnouncementEmailMetadata 
} from '../types';
import { parseCopiedEmail, cleanOutlookHtml } from '../utils/emailAnnouncementParser';

interface AnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (announcement: Partial<Announcement>) => Promise<void>;
    initialData?: Announcement | null;
    currentUserName: string;
}

const COMMON_TAGS = [
    'بخشنامه_فروش',
    'شرایط_اقساط',
    'فوری',
    'تحویل_خودرو',
    'مالی_حسابداری',
    'مرخصی_اداری',
    'جلسه_داخلی',
    'دستورالعمل',
    'کمیسیون',
    'قیمت_روز'
];

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string; desc: string }[] = [
    { value: 'ALL', label: 'عموم همکاران (همه)', desc: 'قابل مشاهده برای تمام پرسنل' },
    { value: 'ADMIN', label: 'مدیران ارشد و ادمین', desc: 'صرفاً سطوح بالای مدیریتی' },
    { value: 'MANAGERS', label: 'مدیران بخش‌ها', desc: 'مدیران فروش، فنی و اداری' },
    { value: 'SALES', label: 'تیم و کارشناسان فروش', desc: 'بخش بازرگانی و کارشناسان فروش' },
    { value: 'FINANCE', label: 'واحد مالی و حسابداری', desc: 'امور قراردادها و دریافت/پرداخت' },
    { value: 'HR', label: 'منابع انسانی و اداری', desc: 'پرسنلی، مرخصی و اداری' },
];

const CATEGORY_OPTIONS: { value: AnnouncementCategory; label: string; color: string }[] = [
    { value: 'CIRCULAR', label: 'بخشنامه رسمی', color: 'indigo' },
    { value: 'NEWS', label: 'خبر و اطلاع‌رسانی', color: 'emerald' },
    { value: 'ALERT', label: 'هشدار و دستورالعمل', color: 'amber' },
    { value: 'SYSTEM', label: 'اطلاعیه سیستمی', color: 'sky' },
    { value: 'EVENT', label: 'فراخوان و رویداد', color: 'purple' },
];

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    currentUserName
}) => {
    const isEdit = !!initialData;

    // Form fields
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [category, setCategory] = useState<AnnouncementCategory>('CIRCULAR');
    const [isUrgent, setIsUrgent] = useState(false);
    const [targetAudience, setTargetAudience] = useState<AnnouncementAudience>('ALL');
    const [tags, setTags] = useState<string[]>([]);
    const [newTagInput, setNewTagInput] = useState('');
    const [isFromEmail, setIsFromEmail] = useState(false);
    const [emailMetadata, setEmailMetadata] = useState<AnnouncementEmailMetadata>({});

    // UI state
    const [activeTab, setActiveTab] = useState<'standard' | 'email-paste'>('standard');
    const [previewMode, setPreviewMode] = useState(false);
    const [emailPasteRaw, setEmailPasteRaw] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pasteNotice, setPasteNotice] = useState<string | null>(null);

    const emailPasteRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setContent(initialData.content || '');
            setHtmlContent(initialData.htmlContent || '');
            setCategory(initialData.category || 'CIRCULAR');
            setIsUrgent(!!initialData.isUrgent);
            setTargetAudience(initialData.targetAudience || 'ALL');
            setTags(initialData.tags || []);
            setIsFromEmail(!!initialData.isFromEmail);
            setEmailMetadata(initialData.emailMetadata || {});
            setActiveTab(initialData.isFromEmail ? 'email-paste' : 'standard');
            setPreviewMode(!!initialData.htmlContent);
        } else {
            // Reset to defaults
            setTitle('');
            setContent('');
            setHtmlContent('');
            setCategory('CIRCULAR');
            setIsUrgent(false);
            setTargetAudience('ALL');
            setTags(['بخشنامه_فروش']);
            setIsFromEmail(false);
            setEmailMetadata({});
            setActiveTab('standard');
            setPreviewMode(false);
            setEmailPasteRaw('');
            setPasteNotice(null);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    // Smart Email paste handler
    const processEmailContent = (rawText: string, rawHtml?: string) => {
        if (!rawText && !rawHtml) return;

        const parsed = parseCopiedEmail(rawText, rawHtml);

        if (parsed.subject && !title) {
            setTitle(parsed.subject);
        }
        setContent(parsed.bodyText);
        setHtmlContent(parsed.bodyHtml);
        setIsFromEmail(true);
        setEmailMetadata(parsed.metadata);
        setCategory('CIRCULAR'); // Defaults to circular when coming from email
        
        // Auto tag if terms detected
        const autoTags = [...tags];
        if (rawText.includes('اقساط') && !autoTags.includes('شرایط_اقساط')) autoTags.push('شرایط_اقساط');
        if (rawText.includes('فروش') && !autoTags.includes('بخشنامه_فروش')) autoTags.push('بخشنامه_فروش');
        if (rawText.includes('فوری') && !autoTags.includes('فوری')) {
            autoTags.push('فوری');
            setIsUrgent(true);
        }
        setTags(autoTags);

        setPasteNotice(
            parsed.hasDetectedHeaders 
                ? 'ایمیل با موفقیت تفکیک شد: سربرگ‌ها، فرستنده و متن بخشنامه استخراج شدند.' 
                : 'متن و ساختار ایمیل با موفقیت پردازش شد.'
        );
        setPreviewMode(true);
    };

    const handlePasteInEmailBox = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const text = e.clipboardData.getData('text/plain');
        const html = e.clipboardData.getData('text/html');
        processEmailContent(text, html);
    };

    const handleReadClipboard = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.read) {
                const items = await navigator.clipboard.read();
                let text = '';
                let html = '';
                for (const item of items) {
                    if (item.types.includes('text/html')) {
                        const blob = await item.getType('text/html');
                        html = await blob.text();
                    }
                    if (item.types.includes('text/plain')) {
                        const blob = await item.getType('text/plain');
                        text = await blob.text();
                    }
                }
                if (text || html) {
                    processEmailContent(text, html);
                    setEmailPasteRaw(text);
                    return;
                }
            }
            // Fallback
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                if (text) {
                    processEmailContent(text);
                    setEmailPasteRaw(text);
                    return;
                }
            }
            alert('لطفاً ایمیل را کپی کرده و در کادر مشخص شده با Ctrl+V جای‌گذاری نمایید.');
        } catch (err) {
            console.warn('Clipboard read error:', err);
            emailPasteRef.current?.focus();
            alert('دسترسی مستقیم به کلیپ‌بورد در این مرورگر مسدود است. لطفاً متن ایمیل را داخل کادر Paste کنید.');
        }
    };

    const handleAddTag = (tagToAdd?: string) => {
        const t = (tagToAdd || newTagInput).trim().replace(/^[#\s]+/, '');
        if (t && !tags.includes(t)) {
            setTags([...tags, t]);
        }
        if (!tagToAdd) setNewTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('لطفاً عنوان اطلاعیه را وارد نمایید.');
            return;
        }
        if (!content.trim() && !htmlContent.trim()) {
            alert('لطفاً متن اطلاعیه را وارد نمایید.');
            return;
        }

        setIsSubmitting(true);
        try {
            const creator = initialData?.createdBy || initialData?.author || currentUserName || 'مدیریت بازرگانی';
            const payload: Partial<Announcement> = {
                ...(initialData || {}),
                title: title.trim(),
                content: content.trim() || 'بخشنامه سازمانی',
                htmlContent: htmlContent ? cleanOutlookHtml(htmlContent) : undefined,
                category,
                isUrgent,
                targetAudience,
                tags,
                isFromEmail,
                emailMetadata: isFromEmail ? emailMetadata : undefined,
                author: creator,
                createdBy: creator,
                ...(isEdit ? { updatedBy: currentUserName || 'مدیریت بازرگانی' } : {}),
            };

            await onSave(payload);
            onClose();
        } catch (err) {
            console.error('Error saving announcement:', err);
            alert('خطا در ذخیره‌سازی اطلاعیه.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-850 dark:to-slate-900">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl ${isFromEmail ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                            {isFromEmail ? <Mail className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-black text-lg text-slate-800 dark:text-white">
                                {isEdit ? 'ویرایش اطلاعیه سازمانی' : 'ثبت اطلاعیه / بخشنامه جدید'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                ابلاغ بخشنامه‌های داخلی، دستورالعمل‌ها و نامه‌های سازمانی
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mode Selector Tabs (Manual vs Paste from Email) */}
                <div className="px-6 pt-3 pb-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('standard')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                activeTab === 'standard'
                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span>فرم استاندارد</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('email-paste')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                activeTab === 'email-paste'
                                    ? 'bg-sky-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-sky-50 dark:bg-sky-950/30'
                            }`}
                        >
                            <Mail className="w-4 h-4" />
                            <span>چسباندن از ایمیل سازمانی (Paste)</span>
                            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">هوشمند</span>
                        </button>
                    </div>

                    {/* Preview Toggle */}
                    <button
                        type="button"
                        onClick={() => setPreviewMode(!previewMode)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border transition-all ${
                            previewMode 
                                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' 
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{previewMode ? 'بازگشت به ویرایش' : 'پیش‌نمایش قالب ایمیل'}</span>
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* User Tracking & Audit Info */}
                    <div className="bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                <User className="w-4 h-4" />
                            </span>
                            <span className="font-bold text-slate-500 dark:text-slate-400">کاربر ایجادکننده:</span>
                            <span className="font-black text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                {initialData?.createdBy || initialData?.author || currentUserName || 'مدیریت بازرگانی'}
                            </span>
                        </div>
                        {isEdit && (
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                    <Edit3 className="w-4 h-4" />
                                </span>
                                <span className="font-bold text-slate-500 dark:text-slate-400">کاربر ویرایش‌کننده:</span>
                                <span className="font-black text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800/60">
                                    {currentUserName || 'شما'}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {/* Notice if pasted from email */}
                    {pasteNotice && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3.5 flex items-start justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span>{pasteNotice}</span>
                            </div>
                            <button type="button" onClick={() => setPasteNotice(null)} className="text-emerald-600 hover:text-emerald-900">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* EMAIL PASTE ZONE (when activeTab is email-paste) */}
                    {activeTab === 'email-paste' && !previewMode && (
                        <div className="bg-sky-50/70 dark:bg-sky-950/20 border-2 border-dashed border-sky-300 dark:border-sky-800 rounded-3xl p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h4 className="font-bold text-sm text-sky-900 dark:text-sky-300 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-sky-600" />
                                        <span>ناحیه چسباندن (Paste) ایمیل سازمانی</span>
                                    </h4>
                                    <p className="text-xs text-sky-700 dark:text-sky-400 mt-1">
                                        ایمیل دریافت شده در Outlook، جیمیل یا وب‌میل را با کلیدهای Ctrl+A و سپس Ctrl+C کپی کرده و اینجا Paste کنید.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleReadClipboard}
                                    className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all flex-shrink-0"
                                >
                                    <Clipboard className="w-4 h-4" />
                                    <span>درج از کلیپ‌بورد</span>
                                </button>
                            </div>

                            <textarea
                                ref={emailPasteRef}
                                value={emailPasteRaw}
                                onChange={(e) => {
                                    setEmailPasteRaw(e.target.value);
                                    if (e.target.value.trim().length > 20) {
                                        processEmailContent(e.target.value);
                                    }
                                }}
                                onPaste={handlePasteInEmailBox}
                                placeholder="اینجا کلیک کنید و کلیدهای Ctrl + V را فشار دهید تا ایمیل با حفظ جداول، استایل و سربرگ‌ها قرار گیرد..."
                                rows={4}
                                className="w-full bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
                            ></textarea>

                            {/* Email Metadata Preview Bar if present */}
                            {isFromEmail && (
                                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-sky-100 dark:border-sky-900 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div>
                                        <span className="text-slate-400 block text-[10px]">فرستنده استخراج شده:</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                            {emailMetadata.sender || 'نامشخص'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px]">موضوع ایمیل:</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                                            {emailMetadata.subject || title || 'بدون موضوع'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px]">تاریخ ایمیل:</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                            {emailMetadata.date || new Date().toLocaleDateString('fa-IR')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* LIVE HTML / EMAIL PREVIEW MODE */}
                    {previewMode ? (
                        <div className="space-y-4">
                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                                <span>پیش‌نمایش قالب بخشنامه (همان‌گونه که همکاران مشاهده خواهند کرد):</span>
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode(false)}
                                    className="font-bold underline"
                                >
                                    ویرایش محتوا
                                </button>
                            </div>

                            {/* Email Card Mockup */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-3xl p-6 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                                {isFromEmail && (
                                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                                    ایمیل سازمانی
                                                </span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                                    فرستنده: {emailMetadata.sender || 'مدیریت'}
                                                </span>
                                            </div>
                                            <span className="text-slate-400 font-mono text-[11px]">
                                                {emailMetadata.date || new Date().toLocaleDateString('fa-IR')}
                                            </span>
                                        </div>
                                        {emailMetadata.receiver && (
                                            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                                                گیرنده: {emailMetadata.receiver}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                    {title || 'عنوان اطلاعیه'}
                                </h2>

                                {/* Render HTML content or text */}
                                {htmlContent ? (
                                    <div 
                                        className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 overflow-x-auto"
                                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                                    />
                                ) : (
                                    <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {content}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* EDIT FIELDS */
                        <div className="space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5">
                                    عنوان بخشنامه یا اطلاعیه <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="مثال: بخشنامه شماره ۱۴۰۳/۰۶ - شرایط فروش اقساطی خودرو"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Category, Urgency, Audience Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Category */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                        دسته‌بندی موضوعی
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {CATEGORY_OPTIONS.map((cat) => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Target Audience */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>مخاطب اطلاعیه</span>
                                    </label>
                                    <select
                                        value={targetAudience}
                                        onChange={(e) => setTargetAudience(e.target.value as AnnouncementAudience)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {AUDIENCE_OPTIONS.map((aud) => (
                                            <option key={aud.value} value={aud.value}>
                                                {aud.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Urgency Toggle */}
                                <div className="flex items-end">
                                    <label className={`w-full flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${
                                        isUrgent 
                                            ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300' 
                                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className={`w-4 h-4 ${isUrgent ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
                                            <span className="text-xs font-black">وضعیت فوری و آنی</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={isUrgent}
                                            onChange={(e) => setIsUrgent(e.target.checked)}
                                            className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Tags Manager */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <TagIcon className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>تگ‌ها و کلیدواژه‌های جستجو</span>
                                    </span>
                                    <span className="text-[11px] text-slate-400">امکان فیلتر سریع برای همکاران</span>
                                </label>

                                {/* Tag chips */}
                                <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                                    {tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-xl font-bold border border-indigo-200/60 dark:border-indigo-800"
                                        >
                                            <span>#{tag}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="hover:text-rose-500 p-0.5 rounded-md"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}

                                    <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                                        <input
                                            type="text"
                                            value={newTagInput}
                                            onChange={(e) => setNewTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTag();
                                                }
                                            }}
                                            placeholder="افزودن تگ جدید..."
                                            className="bg-transparent border-none text-xs text-slate-800 dark:text-white focus:outline-none w-full px-2"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAddTag()}
                                            className="text-indigo-600 hover:text-indigo-800 p-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Suggested quick tags */}
                                <div className="flex flex-wrap gap-1 items-center pt-1">
                                    <span className="text-[10px] text-slate-400 ml-1">پیشنهادی:</span>
                                    {COMMON_TAGS.filter(t => !tags.includes(t)).slice(0, 6).map((ct) => (
                                        <button
                                            key={ct}
                                            type="button"
                                            onClick={() => handleAddTag(ct)}
                                            className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg transition-colors"
                                        >
                                            +{ct}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Body */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        متن کامل اطلاعیه / بخشنامه <span className="text-rose-500">*</span>
                                    </label>
                                    {htmlContent && (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                            شامل قالب غنی و جدول
                                        </span>
                                    )}
                                </div>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="متن کامل بخشنامه یا دستورالعمل را اینجا بنویسید..."
                                    rows={htmlContent ? 4 : 8}
                                    required={!htmlContent}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
                                ></textarea>
                            </div>

                            {/* Email Details Section (Collapsible / If flagged as email) */}
                            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-750 space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isFromEmail}
                                        onChange={(e) => setIsFromEmail(e.target.checked)}
                                        className="rounded text-sky-600 focus:ring-sky-500"
                                    />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        این اطلاعیه از ایمیل سازمانی استخراج شده است (نمایش لوگو و اطلاعات فرستنده ایمیل)
                                    </span>
                                </label>

                                {isFromEmail && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                                فرستنده ایمیل
                                            </label>
                                            <input
                                                type="text"
                                                value={emailMetadata.sender || ''}
                                                onChange={(e) => setEmailMetadata({ ...emailMetadata, sender: e.target.value })}
                                                placeholder="مثال: معاونت بازرگانی - مهندس حسینی"
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                                آدرس ایمیل یا دپارتمان
                                            </label>
                                            <input
                                                type="text"
                                                value={emailMetadata.senderEmail || ''}
                                                onChange={(e) => setEmailMetadata({ ...emailMetadata, senderEmail: e.target.value })}
                                                placeholder="sales@hoseinikhodro.com"
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer / Buttons */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            انصراف
                        </button>

                        <div className="flex items-center gap-2">
                            {htmlContent && (
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode(!previewMode)}
                                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors"
                                >
                                    {previewMode ? 'ویرایش متن' : 'مشاهده قالب'}
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                            >
                                <Send className="w-4 h-4" />
                                <span>{isSubmitting ? 'در حال ثبت...' : isEdit ? 'بروزرسانی بخشنامه' : 'انتشار در تابلو اعلانات'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AnnouncementModal;
