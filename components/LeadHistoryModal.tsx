import React, { useEffect, useState, useCallback } from 'react';
import { LeadStatus } from '../types';
import type { User, LeadMessage, Car, CarSaleCondition, CustomerJournal, MyProfile } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import Spinner from './Spinner';
import Toast from './Toast';
import { getCustomerJournals, createCustomerJournal, getMyProfile } from '../services/api';
import SendMessageModal from './SendMessageModal';
import { 
    MessageSquare, 
    FileText, 
    ClipboardList, 
    Info, 
    Star, 
    Sparkles, 
    Check, 
    UserCheck, 
    Compass, 
    HelpCircle, 
    Smile, 
    AlertCircle,
    Calendar,
    Send
} from 'lucide-react';

interface LeadDetailHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: User | null;
    fullUserDetails: User | null;
    messages: LeadMessage[];
    isLoading: boolean;
    error: string | null;
    onSendMessage: (message: string, type: 'SMS' | 'WHATSAPP') => Promise<void>;
    onRegisterOrder: (user: User) => void;
    cars: Car[];
    conditions: CarSaleCondition[];
    loggedInUser: MyProfile | null;
    onStatusChange?: (userId: number, newStatus: LeadStatus) => Promise<void>;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
    <div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <p className="text-sm font-semibold text-slate-800 dark:text-white">{value || '-'}</p>
    </div>
);

const LeadDetailHistoryModal: React.FC<LeadDetailHistoryModalProps> = ({ 
    isOpen, onClose, lead, fullUserDetails, messages, isLoading, error, 
    onSendMessage, onRegisterOrder, cars, conditions, loggedInUser,
    onStatusChange
}) => {
    const [activeTab, setActiveTab] = useState<'COMBINED_HISTORY' | 'SURVEYS'>('COMBINED_HISTORY');
    const [surveySubTab, setSurveySubTab] = useState<'REGISTRATION' | 'DELIVERY'>('REGISTRATION');
    
    // Send Message Modal visibility
    const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);
    
    // Journals / Logs
    const [journals, setJournals] = useState<CustomerJournal[]>([]);
    const [newJournalContent, setNewJournalContent] = useState('');
    const [isJournalLoading, setIsJournalLoading] = useState(false);
    const [isJournalSending, setIsJournalSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Registration Survey State
    const [regQ1Type, setRegQ1Type] = useState<'internet' | 'presence' | ''>('');
    const [regQ1Detail, setRegQ1Detail] = useState('');
    const [regQ2Channel, setRegQ2Channel] = useState('');
    const [regQ3Consultation, setRegQ3Consultation] = useState<'yes' | 'no' | ''>('');
    const [regQ4Staff, setRegQ4Staff] = useState('');
    const [regQ5Satisfaction, setRegQ5Satisfaction] = useState<'yes' | 'no' | ''>('');
    const [regComment, setRegComment] = useState('');

    // Delivery Survey State (1-10)
    const [delQ1, setDelQ1] = useState<number>(0);
    const [delQ2, setDelQ2] = useState<number>(0);
    const [delQ3, setDelQ3] = useState<number>(0);
    const [delQ4, setDelQ4] = useState<number>(0);
    const [delQ5, setDelQ5] = useState<number>(0);
    const [delQ6, setDelQ6] = useState<number>(0);
    const [delComment, setDelComment] = useState('');

    const targetUser = fullUserDetails || lead;

    useEffect(() => {
        if (isOpen && targetUser) {
            setActiveTab('COMBINED_HISTORY');
            setSurveySubTab('REGISTRATION');
            getMyProfile().then(p => setCurrentUser(p)).catch(() => {});
            fetchJournals();
        } else if (!isOpen) {
            setNewJournalContent('');
            setValidationError(null);
            resetRegSurvey();
            resetDelSurvey();
        }
    }, [isOpen, lead, fullUserDetails]);

    const fetchJournals = useCallback(async () => {
        const userId = fullUserDetails?.id || lead?.id;
        if (!userId) return;
        setIsJournalLoading(true);
        try {
            const data = await getCustomerJournals(userId);
            setJournals(data);
        } catch (e) {
            console.error("Failed to fetch journals", e);
        } finally {
            setIsJournalLoading(false);
        }
    }, [fullUserDetails, lead]);

    useEffect(() => {
        if (isOpen && activeTab === 'COMBINED_HISTORY') {
            fetchJournals();
        }
    }, [activeTab, isOpen, fetchJournals]);

    const resetRegSurvey = () => {
        setRegQ1Type('');
        setRegQ1Detail('');
        setRegQ2Channel('');
        setRegQ3Consultation('');
        setRegQ4Staff('');
        setRegQ5Satisfaction('');
        setRegComment('');
    };

    const resetDelSurvey = () => {
        setDelQ1(0);
        setDelQ2(0);
        setDelQ3(0);
        setDelQ4(0);
        setDelQ5(0);
        setDelQ6(0);
        setDelComment('');
    };

    const handleAddJournal = async () => {
        if (!newJournalContent.trim() || isJournalSending) return;
        const userId = fullUserDetails?.id || lead?.id;
        if (!userId) return;

        setIsJournalSending(true);
        try {
            await createCustomerJournal({
                userId,
                content: newJournalContent,
                author: currentUser?.full_name || currentUser?.username || 'کاربر سیستم'
            });
            setNewJournalContent('');
            fetchJournals();
        } catch (e) {
            console.error("Failed to add journal", e);
            setValidationError('خطا در ثبت گزارش جدید.');
        } finally {
            setIsJournalSending(false);
        }
    };

    const handleQuickStatusChange = async (newStatus: LeadStatus) => {
        const userId = fullUserDetails?.id || lead?.id;
        if (!userId || isJournalSending) return;

        setIsJournalSending(true);
        try {
            const authorName = currentUser?.full_name || currentUser?.username || 'کاربر سیستم';
            await createCustomerJournal({
                userId,
                content: `تغییر وضعیت سرنخ به "${newStatus}"`,
                author: authorName
            });

            if (onStatusChange) {
                await onStatusChange(userId, newStatus);
            }
            fetchJournals();
        } catch (e) {
            console.error("Failed to update status and register journal", e);
        } finally {
            setIsJournalSending(false);
        }
    };

    // Surveys Submission to CRM Journals
    const handleSaveRegSurvey = async () => {
        if (!regQ1Type || !regQ2Channel || !regQ3Consultation || !regQ4Staff || !regQ5Satisfaction) {
            setValidationError('لطفا به تمامی سوالات الزامی نظرسنجی پاسخ دهید.');
            return;
        }

        const userId = fullUserDetails?.id || lead?.id;
        if (!userId) return;

        const content = `📝 گزارش نظرسنجی ثبت‌نام / خرید:
۱. نوع ثبت‌نام: ${regQ1Type === 'internet' ? 'اینترنتی' : 'حضوری'} (${regQ1Detail || 'بدون جزئیات'})
۲. نحوه آشنایی با ما: ${regQ2Channel}
۳. دریافت مشاوره قبل از ثبت‌نام: ${regQ3Consultation === 'yes' ? 'بله' : 'خیر'}
۴. تکمیل مدارک توسط کارشناس: ${regQ4Staff}
۵. رضایت از برخورد پرسنل و مراحل ثبت‌نام: ${regQ5Satisfaction === 'yes' ? 'بله' : 'خیر'}
${regComment ? `توضیحات تکمیلی: ${regComment}` : ''}`;

        setIsJournalSending(true);
        try {
            await createCustomerJournal({
                userId,
                content,
                author: currentUser?.full_name || currentUser?.username || 'کاربر سیستم'
            });
            resetRegSurvey();
            fetchJournals();
            setValidationError(null);
            alert('گزارش نظرسنجی ثبت‌نام با موفقیت ثبت و به تاریخچه اضافه شد.');
        } catch (e) {
            console.error("Failed to save survey", e);
            setValidationError('خطا در ذخیره‌سازی نظرسنجی.');
        } finally {
            setIsJournalSending(false);
        }
    };

    const handleSaveDeliverySurvey = async () => {
        if (!delQ1 || !delQ2 || !delQ3 || !delQ4 || !delQ5 || !delQ6) {
            setValidationError('لطفا به تمامی سوالات از ۱ تا ۱۰ امتیاز دهید.');
            return;
        }

        const userId = fullUserDetails?.id || lead?.id;
        if (!userId) return;

        const content = `🚗 نظرسنجی تحویل خودرو:
۱. رضایت از سرعت خدمات نمایندگی: [${delQ1} از ۱۰]
۲. رضایت از فرایند تحویل خودرو (مدارک، زمان، توضیحات هنگام تحویل): [${delQ2} از ۱۰]
۳. رضایت از برخورد و پاسخگویی پرسنل نمایندگی: [${delQ3} از ۱۰]
۴. رضایت از سلامت و کیفیت خودرو تحویل‌شده: [${delQ4} از ۱۰]
۵. رضایت از اطلاع‌رسانی نمایندگی (تماس‌ها، پیامک‌ها و توضیحات): [${delQ5} از ۱۰]
۶. رضایت از امکانات رفاهی نمایندگی (اتاق انتظار، نوشیدنی، پارکینگ): [${delQ6} از ۱۰]
${delComment ? `توضیحات تکمیلی: ${delComment}` : ''}`;

        setIsJournalSending(true);
        try {
            await createCustomerJournal({
                userId,
                content,
                author: currentUser?.full_name || currentUser?.username || 'کاربر سیستم'
            });
            resetDelSurvey();
            fetchJournals();
            setValidationError(null);
            alert('نظرسنجی تحویل خودرو با موفقیت ثبت و به تاریخچه اضافه شد.');
        } catch (e) {
            console.error("Failed to save survey", e);
            setValidationError('خطا در ذخیره‌سازی نظرسنجی.');
        } finally {
            setIsJournalSending(false);
        }
    };

    // Formatting date
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const parsableDateString = dateString.replace(' ', 'T');
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(parsableDateString));
        } catch (e) {
            return dateString;
        }
    };

    // Compile combined list of both messages and journal reports sorted by date
    const getCombinedTimeline = () => {
        const list: Array<{
            id: string;
            type: 'MESSAGE' | 'JOURNAL';
            content: string;
            createdAt: string;
            parsedDate: Date;
            author?: string;
            receive?: number;
            media?: string;
        }> = [];

        // Add Messages
        messages.forEach(msg => {
            let parsedDate = new Date();
            try {
                parsedDate = new Date(msg.createdAt.replace(' ', 'T'));
            } catch {}
            list.push({
                id: `msg-${msg.id}`,
                type: 'MESSAGE',
                content: msg.Message,
                createdAt: msg.createdAt,
                parsedDate,
                receive: msg.receive,
                media: msg.media
            });
        });

        // Add Journals
        journals.forEach(j => {
            let parsedDate = new Date();
            try {
                parsedDate = new Date(j.createdAt.replace(' ', 'T'));
            } catch {}
            list.push({
                id: `journal-${j.id}`,
                type: 'JOURNAL',
                content: j.content,
                createdAt: j.createdAt,
                parsedDate,
                author: j.author
            });
        });

        // Sort descending: newest first
        return list.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
    };

    if (!isOpen || !lead) return null;

    const leadName = lead.FullName || fullUserDetails?.FullName;
    const leadNumber = lead.Number;
    const timelineItems = getCombinedTimeline();

    // Scan for submitted surveys in journals list
    const historicalRegSurveys = journals.filter(j => j.content.includes('📝 گزارش نظرسنجی ثبت‌نام / خرید'));
    const historicalDelSurveys = journals.filter(j => j.content.includes('🚗 نظرسنجی تحویل خودرو'));

    const RatingSelector: React.FC<{
        value: number;
        onChange: (val: number) => void;
    }> = ({ value, onChange }) => {
        return (
            <div className="flex flex-wrap gap-1.5 mt-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                    <button
                        key={score}
                        type="button"
                        onClick={() => onChange(score)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center border ${
                            value === score
                                ? 'bg-sky-600 border-sky-600 text-white shadow-md scale-105'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        {score}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                    <header className="p-4 border-b border-slate-150 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-950 z-10">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">
                                   جزئیات و تاریخچه مشتری
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400" dir="ltr">
                                        {leadNumber} {leadName && `(${leadName})`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Send Message to Customer Button */}
                                <button 
                                    onClick={() => setIsSendMessageOpen(true)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors flex items-center gap-1.5"
                                    title="ارسال پیام به مشتری"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>ارسال پیام به مشتری</span>
                                </button>

                                <button 
                                    onClick={() => fullUserDetails && onRegisterOrder(fullUserDetails)} 
                                    className="p-2 rounded-lg transition-colors bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900" 
                                    title="ثبت سفارش فروش"
                                >
                                    <ClipboardList className="w-5 h-5" />
                                </button>
                                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>
                        
                        {/* Tab Switcher */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('COMBINED_HISTORY')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === 'COMBINED_HISTORY' 
                                        ? 'bg-white dark:bg-slate-700 text-slate-850 dark:text-white shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span>تاریخچه و گزارشات CRM</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('SURVEYS')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === 'SURVEYS' 
                                        ? 'bg-white dark:bg-slate-700 text-slate-850 dark:text-white shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <Smile className="w-4 h-4" />
                                <span>نظرسنجی مشتری</span>
                            </button>
                        </div>
                    </header>

                    <main className="flex-grow overflow-y-auto bg-slate-50 dark:bg-slate-950/40 p-4 space-y-4">
                        {/* Customer Header Info */}
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm">
                            {fullUserDetails ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                    <DetailItem label="خودروی درخواستی" value={fullUserDetails.CarModel} />
                                    <DetailItem label="استان" value={fullUserDetails.Province} />
                                    <DetailItem label="شهر" value={fullUserDetails.City} />
                                    <DetailItem label="مرجع" value={fullUserDetails.reference} />
                                    <DetailItem label="زمان ثبت" value={formatDate(fullUserDetails.RegisterTime)} />
                                    <DetailItem label="آخرین فعالیت" value={formatDate(fullUserDetails.LastAction)} />
                                    {fullUserDetails.Decription && (
                                        <div className="col-span-full border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
                                            <DetailItem label="توضیحات" value={<span className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">{fullUserDetails.Decription}</span>} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-xs">جزئیات کامل کاربر یافت نشد.</p>
                            )}
                        </div>

                        {/* TAB 1: Unified History and Reports */}
                        {activeTab === 'COMBINED_HISTORY' && (
                            <div className="space-y-4">
                                {/* Quick Status Assignment */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">تعیین سریع وضعیت سرنخ (ثبت گزارش خودکار):</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {[
                                            { status: LeadStatus.NEW, label: 'جدید', activeClass: 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-800 dark:text-slate-200 ring-2 ring-slate-400', normalClass: 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 text-slate-700 dark:text-slate-400 hover:bg-slate-100' },
                                            { status: LeadStatus.CONTACTED, label: 'تماس گرفته شده', activeClass: 'bg-sky-100 dark:bg-sky-950 border-sky-300 text-sky-850 dark:text-sky-300 ring-2 ring-sky-400', normalClass: 'bg-sky-50/30 dark:bg-sky-950/10 border-sky-150 text-sky-700 dark:text-sky-400 hover:bg-sky-50' },
                                            { status: LeadStatus.MEETING, label: 'جلسه حضوری', activeClass: 'bg-purple-100 dark:bg-purple-950 border-purple-300 text-purple-850 dark:text-purple-300 ring-2 ring-purple-400', normalClass: 'bg-purple-50/30 dark:bg-purple-950/10 border-purple-150 text-purple-700 dark:text-purple-400 hover:bg-purple-50' },
                                            { status: LeadStatus.NEGOTIATION, label: 'در حال مذاکره', activeClass: 'bg-amber-100 dark:bg-amber-950 border-amber-300 text-amber-850 dark:text-amber-300 ring-2 ring-amber-400', normalClass: 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-150 text-amber-700 dark:text-amber-400 hover:bg-amber-50' },
                                            { status: LeadStatus.WON, label: 'موفق (خرید)', activeClass: 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 text-emerald-850 dark:text-emerald-300 ring-2 ring-emerald-400', normalClass: 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-150 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50' },
                                            { status: LeadStatus.LOST, label: 'ناموفق', activeClass: 'bg-rose-100 dark:bg-rose-950 border-rose-300 text-rose-850 dark:text-rose-300 ring-2 ring-rose-400', normalClass: 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-150 text-rose-700 dark:text-rose-400 hover:bg-rose-50' },
                                            { status: LeadStatus.NO_ANSWER, label: 'پاسخ نداد', activeClass: 'bg-orange-100 dark:bg-orange-950 border-orange-300 text-orange-850 dark:text-orange-300 ring-2 ring-orange-400', normalClass: 'bg-orange-50/30 dark:bg-orange-950/10 border-orange-150 text-orange-700 dark:text-orange-400 hover:bg-orange-50' },
                                        ].map((item) => {
                                            const currentStatus = targetUser?.leadStatus || LeadStatus.NEW;
                                            const isActive = currentStatus === item.status;
                                            return (
                                                <button
                                                    key={item.status}
                                                    type="button"
                                                    disabled={isJournalSending}
                                                    onClick={() => handleQuickStatusChange(item.status)}
                                                    className={`border py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all text-center flex justify-center items-center ${isActive ? item.activeClass : item.normalClass} disabled:opacity-50`}
                                                >
                                                    {item.label}
                                                    {isActive && <span className="mr-1 text-[8px] bg-slate-850 dark:bg-white text-white dark:text-slate-850 px-1 rounded-full">فعال</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Add Custom Log / Report */}
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">ثبت گزارش تماس یا فعالیت جدید (CRM):</p>
                                    <textarea
                                        value={newJournalContent}
                                        onChange={(e) => setNewJournalContent(e.target.value)}
                                        placeholder="شرح تماس، توافقات یا مکالمه تلفنی با مشتری را اینجا بنویسید..."
                                        className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 dark:text-white text-xs outline-none resize-none mb-3 min-h-[70px]"
                                        rows={3}
                                    />
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={handleAddJournal} 
                                            disabled={!newJournalContent.trim() || isJournalSending}
                                            className="bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-sky-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            {isJournalSending ? 'در حال ثبت...' : 'ثبت گزارش'}
                                        </button>
                                    </div>
                                </div>

                                {/* Combined Activity Timeline */}
                                <div className="space-y-3.5">
                                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">جدول زمانی ارتباطات و فعالیت‌های مشتری:</h3>
                                    
                                    {isLoading || isJournalLoading ? (
                                        <div className="flex justify-center py-10"><Spinner /></div>
                                    ) : timelineItems.length === 0 ? (
                                        <div className="text-center text-slate-400 py-10 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                                            هیچ پیام یا گزارش CRM برای این مشتری یافت نشد.
                                        </div>
                                    ) : (
                                        timelineItems.map((item) => {
                                            if (item.type === 'MESSAGE') {
                                                const isWhatsApp = item.media === 'WHATSAPP';
                                                return (
                                                    <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-r-4 border-l border-y border-r-sky-500 border-l-slate-200 dark:border-l-slate-850 border-y-slate-200 dark:border-y-slate-850 shadow-sm flex flex-col gap-1.5">
                                                        <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-50 dark:border-slate-800/40 pb-1.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isWhatsApp ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' : 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400'}`}>
                                                                    {isWhatsApp ? 'واتساپ' : 'پیامک'}
                                                                </span>
                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                                    {item.receive === 1 ? 'پیام دریافتی از مشتری' : 'پیام ارسالی به مشتری'}
                                                                </span>
                                                            </div>
                                                            <span className="font-mono text-slate-400">{formatDate(item.createdAt)}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-800 dark:text-slate-250 whitespace-pre-wrap leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: item.content }} />
                                                    </div>
                                                );
                                            } else {
                                                // Journal Log
                                                const isSurvey = item.content.includes('نظرسنجی');
                                                const borderCol = isSurvey ? 'border-r-emerald-500' : 'border-r-amber-400';
                                                return (
                                                    <div key={item.id} className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border-r-4 border-l border-y ${borderCol} border-l-slate-200 dark:border-l-slate-850 border-y-slate-200 dark:border-y-slate-850 shadow-sm flex flex-col gap-1.5`}>
                                                        <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-50 dark:border-slate-800/40 pb-1.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isSurvey ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'}`}>
                                                                    {isSurvey ? 'نظرسنجی' : 'گزارش تماس CRM'}
                                                                </span>
                                                                <span className="font-bold text-slate-600 dark:text-slate-300">{item.author}</span>
                                                            </div>
                                                            <span className="font-mono text-slate-400">{item.createdAt}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-800 dark:text-slate-250 whitespace-pre-wrap leading-relaxed">{item.content}</p>
                                                    </div>
                                                );
                                            }
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: Customer Surveys */}
                        {activeTab === 'SURVEYS' && (
                            <div className="space-y-4">
                                {/* Survey Type Selector */}
                                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setSurveySubTab('REGISTRATION')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                            surveySubTab === 'REGISTRATION' 
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' 
                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        گزارش نظرسنجی ثبت‌نام / خرید
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSurveySubTab('DELIVERY')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                            surveySubTab === 'DELIVERY' 
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' 
                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        فرم نظرسنجی تحویل خودرو
                                    </button>
                                </div>

                                {/* Survey A: Registration / Purchase Form */}
                                {surveySubTab === 'REGISTRATION' && (
                                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                            <HelpCircle className="w-5 h-5 text-sky-500" />
                                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">نظرسنجی ثبت‌نام و خرید خودرو</h4>
                                        </div>

                                        <div className="space-y-4 text-xs">
                                            {/* Q1 */}
                                            <div className="space-y-2">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    ۱. ثبت نام شما به صورت اینترنتی بوده یا حضوری؟
                                                </span>
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="radio" 
                                                            name="regQ1" 
                                                            checked={regQ1Type === 'internet'} 
                                                            onChange={() => setRegQ1Type('internet')}
                                                            className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                                                        />
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">اینترنتی (خودتان در منزل / کافی نت)</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="radio" 
                                                            name="regQ1" 
                                                            checked={regQ1Type === 'presence'} 
                                                            onChange={() => setRegQ1Type('presence')}
                                                            className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                                                        />
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">حضوری</span>
                                                    </label>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={regQ1Detail}
                                                    onChange={(e) => setRegQ1Detail(e.target.value)}
                                                    placeholder="مثلا: از طریق کافی‌نت ثبت‌نام شد / خودم در منزل فیلم آموزشی دیده بودم..."
                                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-1 focus:ring-sky-500 outline-none text-xs"
                                                />
                                            </div>

                                            {/* Q2 */}
                                            <div className="space-y-1.5">
                                                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    ۲. قبل از ثبت نام از چه طریقی با ما آشنا شدید؟
                                                </label>
                                                <input
                                                    type="text"
                                                    value={regQ2Channel}
                                                    onChange={(e) => setRegQ2Channel(e.target.value)}
                                                    placeholder="مثال: معرفی دوستان، اینستاگرام نمایندگی، تبلیغات محیطی..."
                                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-1 focus:ring-sky-500 outline-none text-xs"
                                                />
                                            </div>

                                            {/* Q3 */}
                                            <div className="space-y-2">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    ۳. قبل از ثبت نام از کارشناس های ما مشاوره گرفتید؟
                                                </span>
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="radio" 
                                                            name="regQ3" 
                                                            checked={regQ3Consultation === 'yes'} 
                                                            onChange={() => setRegQ3Consultation('yes')}
                                                            className="w-4 h-4 text-sky-600"
                                                        />
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">بله مشاوره گرفتم</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="radio" 
                                                            name="regQ3" 
                                                            checked={regQ3Consultation === 'no'} 
                                                            onChange={() => setRegQ3Consultation('no')}
                                                            className="w-4 h-4 text-sky-600"
                                                        />
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">خیر مستقیم ثبت نام کردم</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Q4 */}
                                            <div className="space-y-1.5">
                                                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    ۴. تکمیل مدارک شما توسط کدام کارشناس انجام شد؟
                                                </label>
                                                <input
                                                    type="text"
                                                    value={regQ4Staff}
                                                    onChange={(e) => setRegQ4Staff(e.target.value)}
                                                    placeholder="نام کارشناس پذیرش یا ثبت‌نام..."
                                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-1 focus:ring-sky-500 outline-none text-xs"
                                                />
                                            </div>

                                            {/* Q5 */}
                                            <div className="space-y-2">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    ۵. آیا از برخورد پرسنل و مراحل ثبت نام راضی بودید؟
                                                </span>
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="radio" 
                                                            name="regQ5" 
                                                            checked={regQ5Satisfaction === 'yes'} 
                                                            onChange={() => setRegQ5Satisfaction('yes')}
                                                            className="w-4 h-4 text-sky-600"
                                                        />
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">بله راضی بودم</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="radio" 
                                                            name="regQ5" 
                                                            checked={regQ5Satisfaction === 'no'} 
                                                            onChange={() => setRegQ5Satisfaction('no')}
                                                            className="w-4 h-4 text-sky-600"
                                                        />
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">خیر ناراضی بودم</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Extra comment */}
                                            <div className="space-y-1.5">
                                                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    توضیحات یا نظر تکمیلی مشتری:
                                                </label>
                                                <textarea
                                                    value={regComment}
                                                    onChange={(e) => setRegComment(e.target.value)}
                                                    placeholder="در صورت وجود نکته یا توضیحات تکمیلی مشتری اینجا بنویسید..."
                                                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-1 focus:ring-sky-500 outline-none text-xs resize-none"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-3">
                                            <button
                                                type="button"
                                                onClick={handleSaveRegSurvey}
                                                disabled={isJournalSending}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all shadow disabled:opacity-50"
                                            >
                                                {isJournalSending ? 'در حال ذخیره‌سازی...' : 'ثبت و ذخیره نظرسنجی خرید'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Survey B: Vehicle Delivery Form */}
                                {surveySubTab === 'DELIVERY' && (
                                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                            <Compass className="w-5 h-5 text-emerald-500" />
                                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">فرم نظرسنجی تحویل خودرو (رضایت‌سنجی خدمات)</h4>
                                        </div>

                                        <div className="space-y-4 text-xs">
                                            <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-3 rounded-xl border border-emerald-150 flex items-start gap-2">
                                                <Info className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                <span>لطفا برای هر یک از شاخص‌های زیر به مشتری گزینه ۱ تا ۱۰ را پیشنهاد داده و نمره انتخابی او را مشخص کنید.</span>
                                            </div>

                                            {/* Q1 */}
                                            <div className="space-y-1.5">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    ۱. چقدر از سرعت خدمات نمایندگی راضی بودید؟ (از ۱ تا ۱۰)
                                                </span>
                                                <RatingSelector value={delQ1} onChange={setDelQ1} />
                                            </div>

                                            {/* Q2 */}
                                            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    ۲. چقدر از فرایند تحویل خودرو (مدارک، زمان، توضیحات هنگام تحویل) راضی بودید؟ (از ۱ تا ۱۰)
                                                </span>
                                                <RatingSelector value={delQ2} onChange={setDelQ2} />
                                            </div>

                                            {/* Q3 */}
                                            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    ۳. چقدر از برخورد و پاسخگویی پرسنل نمایندگی راضی بودید؟ (از ۱ تا ۱۰)
                                                </span>
                                                <RatingSelector value={delQ3} onChange={setDelQ3} />
                                            </div>

                                            {/* Q4 */}
                                            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    ۴. چقدر از سلامت و کیفیت خودرو تحویل‌شده راضی بودید؟ (از ۱ تا ۱۰)
                                                </span>
                                                <RatingSelector value={delQ4} onChange={setDelQ4} />
                                            </div>

                                            {/* Q5 */}
                                            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    ۵. چقدر از اطلاع‌رسانی نمایندگی (مثل تماس‌ها، پیامک‌ها و توضیحات) راضی بودید؟ (از ۱ تا ۱۰)
                                                </span>
                                                <RatingSelector value={delQ5} onChange={setDelQ5} />
                                            </div>

                                            {/* Q6 */}
                                            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    ۶. چقدر از امکانات رفاهی نمایندگی (اتاق انتظار، نوشیدنی، پارکینگ) راضی بودید؟ (از ۱ تا ۱۰)
                                                </span>
                                                <RatingSelector value={delQ6} onChange={setDelQ6} />
                                            </div>

                                            {/* Extra comment */}
                                            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                                                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                                                    توضیحات یا نظر تکمیلی تحویل خودرو:
                                                </label>
                                                <textarea
                                                    value={delComment}
                                                    onChange={(e) => setDelComment(e.target.value)}
                                                    placeholder="در صورت وجود انتقاد، پیشنهاد یا تشکر خاص مشتری بنویسید..."
                                                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-1 focus:ring-sky-500 outline-none text-xs resize-none"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-3">
                                            <button
                                                type="button"
                                                onClick={handleSaveDeliverySurvey}
                                                disabled={isJournalSending}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all shadow disabled:opacity-50"
                                            >
                                                {isJournalSending ? 'در حال ذخیره‌سازی...' : 'ثبت و ذخیره نظرسنجی تحویل'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Survey History Logs */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">سوابق نظرسنجی‌های ثبت‌شده برای این مشتری:</h4>
                                    
                                    {historicalRegSurveys.length === 0 && historicalDelSurveys.length === 0 ? (
                                        <div className="text-center text-slate-400 py-6 text-xs bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl">
                                            هیچ سابقه نظرسنجی هنوز برای این مشتری ثبت نشده است. با تکمیل فرم بالا اولین نظرسنجی را ثبت کنید.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {[...historicalRegSurveys, ...historicalDelSurveys].map((s) => (
                                                <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                                                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-50 dark:border-slate-800/50 pb-2">
                                                        <span className="font-bold text-slate-600 dark:text-slate-300">{s.author}</span>
                                                        <span className="font-mono">{s.createdAt}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{s.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* The separate SendMessageModal form as requested */}
            {isSendMessageOpen && (
                <SendMessageModal
                    isOpen={isSendMessageOpen}
                    onClose={() => setIsSendMessageOpen(false)}
                    lead={targetUser}
                    cars={cars}
                    conditions={conditions}
                    onSendMessage={onSendMessage}
                />
            )}

            {validationError && (
                <Toast 
                    message={validationError} 
                    type="error" 
                    onClose={() => setValidationError(null)} 
                />
            )}
        </>
    );
};

export default LeadDetailHistoryModal;
