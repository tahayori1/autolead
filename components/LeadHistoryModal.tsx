import React, { useEffect, useState, useCallback } from 'react';
import { LeadStatus } from '../types';
import type { User, LeadMessage, Car, CarSaleCondition, CustomerJournal, MyProfile, CrmCallLog, CrmMeeting } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import Spinner from './Spinner';
import Toast from './Toast';
import { 
    getCustomerJournals, createCustomerJournal, getMyProfile,
    sendCrmHeartbeat, getCrmStatus, clearCrmLock,
    createCallLog, getCallLogs, createCrmMeeting, getCrmMeetings, updateCrmMeeting,
    updateUser
} from '../services/api';
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
    Send,
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    Clock,
    XCircle,
    CheckCircle,
    MapPin,
    Users
} from 'lucide-react';

interface LeadDetailHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: User | null;
    fullUserDetails: User | null;
    messages: LeadMessage[];
    isLoading: boolean;
    error: string | null;
    onSendMessage: (message: string, type: 'SMS' | 'WHATSAPP' | 'BALE', botId?: number) => Promise<void>;
    onRegisterOrder: (user: User) => void;
    onEdit: (user: User) => void;
    cars: Car[];
    conditions: CarSaleCondition[];
    loggedInUser: MyProfile | null;
    onStatusChange?: (userId: number, newStatus: LeadStatus) => Promise<void>;
    onUserUpdate?: (updatedUser: User) => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
    onNavigate?: (direction: 'prev' | 'next') => void;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
    <div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <p className="text-sm font-semibold text-slate-800 dark:text-white">{value || '-'}</p>
    </div>
);

const LeadDetailHistoryModal: React.FC<LeadDetailHistoryModalProps> = ({ 
    isOpen, onClose, lead, fullUserDetails, messages, isLoading, error, 
    onSendMessage, onRegisterOrder, onEdit, cars, conditions, loggedInUser,
    onStatusChange, onUserUpdate, hasPrevious = false, hasNext = false, onNavigate
}) => {
    const [activeTab, setActiveTab] = useState<'COMBINED_HISTORY' | 'BEHAVIOR_RATING' | 'SURVEYS'>('COMBINED_HISTORY');
    const [surveySubTab, setSurveySubTab] = useState<'REGISTRATION' | 'DELIVERY'>('REGISTRATION');
    
    // Send Message Modal visibility
    const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);
    
    // Journals / Logs
    const [journals, setJournals] = useState<CustomerJournal[]>([]);
    const [newJournalContent, setNewJournalContent] = useState('');
    const [isJournalLoading, setIsJournalLoading] = useState(false);
    const [isJournalSending, setIsJournalSending] = useState(false);
    const [callLogs, setCallLogs] = useState<CrmCallLog[]>([]);
    const [isCallLogsLoading, setIsCallLogsLoading] = useState(false);
    const [crmMeetings, setCrmMeetings] = useState<CrmMeeting[]>([]);
    const [isCrmMeetingsLoading, setIsCrmMeetingsLoading] = useState(false);
    const [editingMeetingId, setEditingMeetingId] = useState<number | string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [crmStatus, setCrmStatus] = useState<any>({ activeViews: [], locks: [] });

    // CRM Ratings & Tagging States
    const [crmTags, setCrmTags] = useState<string[]>([]);
    const [crmBehaviorScore, setCrmBehaviorScore] = useState<number>(0);
    const [crmDealDifficulty, setCrmDealDifficulty] = useState<string>('متوسط');
    const [crmOpinion, setCrmOpinion] = useState<string>('');
    const [newCrmTagInput, setNewCrmTagInput] = useState<string>('');
    const [isSavingCrmRatings, setIsSavingCrmRatings] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    // Polling and heartbeat for viewing status
    useEffect(() => {
        if (!isOpen || !lead || !loggedInUser) return;

        const username = loggedInUser.username || 'ناشناس';
        const fullName = loggedInUser.FullName || loggedInUser.full_name || 'کاربر سیستم';
        const leadId = Number(lead.id);

        const sendHeartbeatAndFetch = async () => {
            try {
                // Send heartbeat (isEditing is false in details modal, true in edit modal)
                await sendCrmHeartbeat(leadId, username, fullName, false);
                const status = await getCrmStatus();
                setCrmStatus(status);
            } catch (err) {
                console.warn("CRM Live Status Heartbeat failed:", err);
            }
        };

        sendHeartbeatAndFetch();
        const timer = setInterval(sendHeartbeatAndFetch, 3000);

        return () => {
            clearInterval(timer);
        };
    }, [isOpen, lead, loggedInUser]);

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

    // Manual Call Log Form State
    const [logFormTab, setLogFormTab] = useState<'NOTE' | 'CALL' | 'MEETING'>('NOTE');
    const [callType, setCallType] = useState<'INBOUND' | 'OUTBOUND'>('OUTBOUND');
    const [callStatus, setCallStatus] = useState<'SUCCESSFUL' | 'MISSED' | 'NO_ANSWER' | 'BUSY' | 'REJECTED'>('SUCCESSFUL');
    const [durationMin, setDurationMin] = useState<number>(0);
    const [durationSec, setDurationSec] = useState<number>(0);
    const [callNotes, setCallNotes] = useState('');
    const [manualFollowUpPhone, setManualFollowUpPhone] = useState('');

    // Meeting Scheduler Form State
    const [meetingStage, setMeetingStage] = useState<'دعوت' | 'تعیین وقت' | 'برگزار شد' | 'برگزار نشد'>('دعوت');
    const [meetingDate, setMeetingDate] = useState<string>('');
    const [meetingTime, setMeetingTime] = useState<string>('');
    const [meetingLocation, setMeetingLocation] = useState<string>('نمایشگاه مرکزی');
    const [meetingResult, setMeetingResult] = useState<string>('');

    const getTodayJalaliDate = () => {
        try {
            const now = new Date();
            const formatted = new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(now);
            let cleaned = formatted.trim();
            const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
            for (let i = 0; i < 10; i++) {
                cleaned = cleaned.replace(persianDigits[i], String(i));
            }
            return cleaned;
        } catch (e) {
            return "1405/04/20";
        }
    };

    const targetUser = fullUserDetails || lead;

    useEffect(() => {
        if (isOpen && targetUser) {
            setActiveTab('COMBINED_HISTORY');
            setSurveySubTab('REGISTRATION');
            getMyProfile().then(p => setCurrentUser(p)).catch(() => {});
            fetchJournals();
            // Prefill meeting date & time
            setMeetingDate(getTodayJalaliDate());
            setMeetingTime('10:00');

            // Initialize CRM Ratings and Tags
            setCrmTags(targetUser.tags || []);
            setCrmBehaviorScore(targetUser.behaviorScore || 0);
            setCrmDealDifficulty(targetUser.dealDifficulty || 'متوسط');
            setCrmOpinion(targetUser.behaviorRatingOpinion || '');
            setNewCrmTagInput('');
        } else if (!isOpen) {
            setNewJournalContent('');
            setValidationError(null);
            resetRegSurvey();
            resetDelSurvey();
            // Reset manual call log form
            setLogFormTab('NOTE');
            setCallType('OUTBOUND');
            setCallStatus('SUCCESSFUL');
            setDurationMin(0);
            setDurationSec(0);
            setCallNotes('');
            setManualFollowUpPhone('');
            // Reset meeting form
            setMeetingStage('دعوت');
            setMeetingDate('');
            setMeetingTime('');
            setMeetingLocation('نمایشگاه مرکزی');
            setMeetingResult('');

            // Reset CRM Ratings and Tags
            setCrmTags([]);
            setCrmBehaviorScore(0);
            setCrmDealDifficulty('متوسط');
            setCrmOpinion('');
            setNewCrmTagInput('');
        }
    }, [isOpen, lead, fullUserDetails]);

    const handleAddCrmTag = () => {
        const cleanTag = newCrmTagInput.trim();
        if (!cleanTag) return;
        if (crmTags.includes(cleanTag)) {
            setNewCrmTagInput('');
            return;
        }
        setCrmTags([...crmTags, cleanTag]);
        setNewCrmTagInput('');
    };

    const handleRemoveCrmTag = (tagToRemove: string) => {
        setCrmTags(crmTags.filter(t => t !== tagToRemove));
    };

    const handleToggleCrmTag = (tag: string) => {
        if (crmTags.includes(tag)) {
            setCrmTags(crmTags.filter(t => t !== tag));
        } else {
            setCrmTags([...crmTags, tag]);
        }
    };

    const handleSaveCrmTags = async () => {
        const userId = targetUser?.id;
        if (!userId) return;

        setIsSavingCrmRatings(true);
        try {
            const updatedUser: User = {
                ...targetUser,
                tags: crmTags,
                LastAction: new Date().toISOString()
            };

            const result = await updateUser(Number(userId), updatedUser);

            // Create customer journal log entry for history timeline
            const authorName = currentUser?.full_name || currentUser?.username || 'کاربر سیستم';
            const journalContent = `🏷️ به‌روزرسانی برچسب‌های مشتری:
- برچسب‌ها: ${crmTags.length > 0 ? crmTags.join('، ') : 'بدون برچسب'}`;

            await createCustomerJournal({
                userId,
                content: journalContent,
                author: authorName
            });

            if (onUserUpdate) {
                onUserUpdate(result);
            }

            // Fetch journals to immediately show on history timeline
            fetchJournals();

            setToastType('success');
            setToastMessage('برچسب‌های مشتری با موفقیت ذخیره شد.');
        } catch (err) {
            console.error("Failed to save CRM tags:", err);
            setToastType('error');
            setToastMessage('خطا در ذخیره‌سازی برچسب‌ها.');
        } finally {
            setIsSavingCrmRatings(false);
        }
    };

    const handleSaveBehaviorRating = async () => {
        const userId = targetUser?.id;
        if (!userId) return;

        setIsSavingCrmRatings(true);
        try {
            const updatedUser: User = {
                ...targetUser,
                behaviorScore: crmBehaviorScore,
                dealDifficulty: crmDealDifficulty,
                behaviorRatingOpinion: crmOpinion,
                LastAction: new Date().toISOString()
            };

            const result = await updateUser(Number(userId), updatedUser);

            // Create customer journal log entry for history timeline
            const authorName = currentUser?.full_name || currentUser?.username || 'کاربر سیستم';
            const stars = '★'.repeat(crmBehaviorScore) + '☆'.repeat(5 - crmBehaviorScore);
            const journalContent = `⭐ ثبت/به‌روزرسانی امتیاز اخلاق و رفتار مشتری:
- امتیاز اخلاق و رفتار: ${crmBehaviorScore} از ۵ (${stars})
- وضعیت معامله: معامله با این مشتری ${crmDealDifficulty} است.
${crmOpinion ? `- نظر کارشناس بابت رفتار مشتری: ${crmOpinion}` : ''}`;

            await createCustomerJournal({
                userId,
                content: journalContent,
                author: authorName
            });

            if (onUserUpdate) {
                onUserUpdate(result);
            }

            // Fetch journals to immediately show on history timeline
            fetchJournals();

            setToastType('success');
            setToastMessage('اطلاعات امتیازدهی اخلاق مشتری با موفقیت ذخیره شد.');
        } catch (err) {
            console.error("Failed to save behavior rating:", err);
            setToastType('error');
            setToastMessage('خطا در ذخیره‌سازی امتیاز اخلاق.');
        } finally {
            setIsSavingCrmRatings(false);
        }
    };

    const fetchJournals = useCallback(async () => {
        const userId = fullUserDetails?.id || lead?.id;
        const userNumber = fullUserDetails?.Number || lead?.Number;
        const leadName = fullUserDetails?.FullName || lead?.FullName || '';
        if (!userId) return;
        setIsJournalLoading(true);
        setIsCallLogsLoading(true);
        setIsCrmMeetingsLoading(true);
        try {
            const [journalData, callLogData, meetingData] = await Promise.all([
                getCustomerJournals(userId),
                getCallLogs(),
                getCrmMeetings().catch(err => {
                    console.error("Failed to fetch CRM meetings:", err);
                    return [] as CrmMeeting[];
                })
            ]);
            setJournals(journalData);
            
            const filteredMeetings = meetingData.filter(m => {
                if (userId && Number(m.userId) === Number(userId)) return true;
                
                const normalizedMeetingNum = String(m.customerNumber || '').trim().replace(/[\s\-\+]/g, '');
                const normalizedUserNum = userNumber ? String(userNumber).trim().replace(/[\s\-\+]/g, '') : '';
                
                if (normalizedMeetingNum && normalizedUserNum) {
                    const last10Meeting = normalizedMeetingNum.substring(Math.max(0, normalizedMeetingNum.length - 10));
                    const last10User = normalizedUserNum.substring(Math.max(0, normalizedUserNum.length - 10));
                    if (last10Meeting === last10User) return true;
                }

                if (leadName && m.customerName) {
                    if (m.customerName.trim() === leadName.trim()) return true;
                }
                return false;
            });
            setCrmMeetings(filteredMeetings);
            
            const filteredLogs = callLogData.filter(log => {
                if (userId && Number(log.userId) === Number(userId)) return true;
                
                const normalizedLogNum = String(log.customerNumber || '').trim().replace(/[\s\-\+]/g, '');
                const normalizedUserNum = userNumber ? String(userNumber).trim().replace(/[\s\-\+]/g, '') : '';
                
                if (normalizedLogNum && normalizedUserNum) {
                    const last10Log = normalizedLogNum.substring(Math.max(0, normalizedLogNum.length - 10));
                    const last10User = normalizedUserNum.substring(Math.max(0, normalizedUserNum.length - 10));
                    return last10Log === last10User;
                }
                return false;
            });
            setCallLogs(filteredLogs);
        } catch (e) {
            console.error("Failed to fetch journals, call logs or meetings", e);
        } finally {
            setIsJournalLoading(false);
            setIsCallLogsLoading(false);
            setIsCrmMeetingsLoading(false);
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

    const handleSaveManualCallLog = async () => {
        if (!callNotes.trim() || isJournalSending) return;
        const userId = fullUserDetails?.id || lead?.id;
        if (!userId) return;

        setIsJournalSending(true);
        setValidationError(null);

        const durationTotal = callStatus === 'SUCCESSFUL' ? (durationMin * 60 + durationSec) : 0;
        
        let pTime = '1405/03/28 12:00';
        try {
            const now = new Date();
            const formatted = new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(now);
            
            // Convert Persian digits to English digits
            let cleaned = formatted.replace(/،/g, '').replace(/\s+/g, ' ');
            const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
            for (let i = 0; i < 10; i++) {
                cleaned = cleaned.replace(persianDigits[i], String(i));
            }
            pTime = cleaned;
        } catch (e) {
            console.error(e);
        }

        try {
            // 1. Create Call Log via API
            await createCallLog({
                userId,
                customerName: targetUser?.FullName || 'ناشناس',
                customerNumber: targetUser?.Number || '',
                callType,
                callStatus,
                duration: durationTotal,
                agentName: currentUser?.full_name || currentUser?.username || 'کاربر سیستم',
                followUpPhone: manualFollowUpPhone || undefined,
                notes: callNotes.trim(),
                timestamp: pTime
            });

            // 2. Add Journal Entry for the customer history timeline
            const callTypeLabel = callType === 'INBOUND' ? 'ورودی' : 'خروجی';
            let callStatusLabel = 'موفق';
            if (callStatus === 'MISSED') callStatusLabel = 'از دست رفته';
            else if (callStatus === 'NO_ANSWER') callStatusLabel = 'بدون پاسخ';
            else if (callStatus === 'BUSY') callStatusLabel = 'مشغول';
            else if (callStatus === 'REJECTED') callStatusLabel = 'رد تماس';

            const durationStr = durationTotal > 0 ? ` (مدت زمان مکالمه: ${durationMin} دقیقه و ${durationSec} ثانیه)` : '';
            const followUpPhoneStr = manualFollowUpPhone ? ` (خط پیگیری: ${manualFollowUpPhone})` : '';
            const journalContent = `📞 لاگ تماس تلفنی ${callTypeLabel}${followUpPhoneStr} [وضعیت: ${callStatusLabel}]${durationStr}:\n${callNotes.trim()}`;

            await createCustomerJournal({
                userId,
                content: journalContent,
                author: currentUser?.full_name || currentUser?.username || 'کاربر سیستم'
            });

            // 3. Reset form and refresh list
            setCallNotes('');
            setDurationMin(0);
            setDurationSec(0);
            setManualFollowUpPhone('');
            setLogFormTab('NOTE'); // Go back to note tab

            window.dispatchEvent(new Event('crm_call_logs_updated'));
            fetchJournals();
        } catch (e) {
            console.error("Failed to save manual call log", e);
            setValidationError('خطا در ثبت لاگ تماس تلفنی جدید.');
        } finally {
            setIsJournalSending(false);
        }
    };

    const handleSaveMeeting = async () => {
        if (!meetingDate.trim() || !meetingTime.trim() || !meetingLocation.trim() || isJournalSending) {
            setValidationError('لطفا تمامی فیلدهای الزامی ملاقات حضوری (تاریخ، ساعت و محل جلسه) را وارد کنید.');
            return;
        }

        const userId = fullUserDetails?.id || lead?.id;
        if (!userId) return;

        setIsJournalSending(true);
        setValidationError(null);

        const isEditing = editingMeetingId !== null && editingMeetingId !== undefined;
        const journalContent = isEditing 
            ? `📝 ویرایش و به‌روزرسانی ملاقات حضوری:
مرحله: ${meetingStage}
زمان جلسه: ${meetingDate.trim()} ساعت ${meetingTime.trim()}
محل جلسه: ${meetingLocation.trim()}
نتیجه و توضیحات جدید: ${meetingResult.trim() || 'بدون توضیحات اضافی'}`
            : `🤝 ملاقات حضوری:
مرحله: ${meetingStage}
زمان جلسه: ${meetingDate.trim()} ساعت ${meetingTime.trim()}
محل جلسه: ${meetingLocation.trim()}
نتیجه و توضیحات: ${meetingResult.trim() || 'بدون توضیحات اضافی'}`;

        try {
            if (isEditing) {
                // Update real CRM meeting
                await updateCrmMeeting({
                    id: editingMeetingId!,
                    userId,
                    customerName: fullUserDetails?.FullName || lead?.FullName || 'مشتری',
                    customerNumber: fullUserDetails?.Number || lead?.Number || '',
                    stage: meetingStage,
                    meetingDate: meetingDate.trim(),
                    meetingTime: meetingTime.trim(),
                    meetingLocation: meetingLocation.trim(),
                    meetingResult: meetingResult.trim(),
                    agentName: currentUser?.full_name || currentUser?.username || 'کاربر سیستم'
                });
            } else {
                // Create real CRM meeting
                await createCrmMeeting({
                    userId,
                    customerName: fullUserDetails?.FullName || lead?.FullName || 'مشتری',
                    customerNumber: fullUserDetails?.Number || lead?.Number || '',
                    stage: meetingStage,
                    meetingDate: meetingDate.trim(),
                    meetingTime: meetingTime.trim(),
                    meetingLocation: meetingLocation.trim(),
                    meetingResult: meetingResult.trim(),
                    agentName: currentUser?.full_name || currentUser?.username || 'کاربر سیستم'
                });
            }

            // 2. Create customer journal timeline entry
            await createCustomerJournal({
                userId,
                content: journalContent,
                author: currentUser?.full_name || currentUser?.username || 'کاربر سیستم'
            });

            // Automatically set lead status to MEETING (جلسه حضوری)
            if (lead && lead.leadStatus !== 'جلسه حضوری' && onStatusChange) {
                await onStatusChange(userId, 'جلسه حضوری');
            }

            // Reset form
            setEditingMeetingId(null);
            setMeetingStage('دعوت');
            setMeetingDate(getTodayJalaliDate());
            setMeetingTime('10:00');
            setMeetingLocation('نمایشگاه مرکزی');
            setMeetingResult('');
            setLogFormTab('NOTE');

            fetchJournals();
        } catch (e) {
            console.error("Failed to save meeting log", e);
            setValidationError('خطا در ثبت ملاقات حضوری جدید.');
        } finally {
            setIsJournalSending(false);
        }
    };

    const handlePrefillMeeting = (meeting: { id?: number | string; stage: string; dateTime: string; location: string; result: string }) => {
        setLogFormTab('MEETING');
        setEditingMeetingId(meeting.id || null);
        if (meeting.stage === 'دعوت' || meeting.stage === 'تعیین وقت' || meeting.stage === 'برگزار شد' || meeting.stage === 'برگزار نشد') {
            setMeetingStage(meeting.stage);
        } else {
            setMeetingStage('دعوت');
        }
        
        const parts = meeting.dateTime.split(' ساعت ');
        if (parts.length === 2) {
            setMeetingDate(parts[0]);
            setMeetingTime(parts[1]);
        } else {
            setMeetingDate(meeting.dateTime);
            setMeetingTime('10:00');
        }
        
        setMeetingLocation(meeting.location);
        setMeetingResult(meeting.result);
        
        const container = document.getElementById('log-activity-form');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth' });
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

    const parseMeetingContent = (content: string) => {
        const lines = content.split('\n');
        let stage = 'دعوت';
        let dateTime = '';
        let location = '';
        let result = '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('مرحله:')) {
                stage = trimmed.substring(trimmed.indexOf(':') + 1).trim();
            } else if (trimmed.startsWith('زمان جلسه:')) {
                dateTime = trimmed.substring(trimmed.indexOf(':') + 1).trim();
            } else if (trimmed.startsWith('محل جلسه:')) {
                location = trimmed.substring(trimmed.indexOf(':') + 1).trim();
            } else if (trimmed.startsWith('نتیجه و توضیحات:') || trimmed.startsWith('نتیجه و توضیحات جدید:')) {
                result = trimmed.substring(trimmed.indexOf(':') + 1).trim();
            }
        }
        return { stage, dateTime, location, result };
    };

    // Compile combined list of both messages, journals, and call logs sorted by date
    const getCombinedTimeline = () => {
        const list: Array<{
            id: string;
            type: 'MESSAGE' | 'JOURNAL' | 'CALL_LOG' | 'MEETING';
            content: string;
            createdAt: string;
            parsedDate: Date;
            author?: string;
            receive?: number;
            media?: string;
            callLog?: CrmCallLog;
            meeting?: {
                id?: number | string;
                stage: string;
                dateTime: string;
                location: string;
                result: string;
                author: string;
                originalJournalId: number;
            };
        }> = [];

        const parseDateSafely = (dateStr: string) => {
            if (!dateStr) return new Date();
            let clean = dateStr.trim().replace('T', ' ');
            
            // If it's a Jalali date (starts with '140')
            if (clean.startsWith('140')) {
                try {
                    const parts = clean.split(' ');
                    const dateParts = parts[0].split(/[\/\-]/);
                    const timeParts = parts[1] ? parts[1].split(':') : ['0', '0', '0'];
                    
                    const jYear = parseInt(dateParts[0], 10);
                    const jMonth = parseInt(dateParts[1], 10);
                    const jDay = parseInt(dateParts[2], 10);
                    
                    const hour = timeParts[0] ? parseInt(timeParts[0], 10) : 0;
                    const minute = timeParts[1] ? parseInt(timeParts[1], 10) : 0;
                    const second = timeParts[2] ? parseInt(timeParts[2], 10) : 0;

                    // Jalali to Gregorian conversion (roughly +621 or +622 depending on month)
                    // This is highly accurate for chronological sorting!
                    let gYear = jYear + 621;
                    // Approximate the month offset
                    let gMonth = jMonth + 2; 
                    if (gMonth > 11) {
                        gMonth -= 12;
                        gYear += 1;
                    }
                    const d = new Date(gYear, gMonth, jDay, hour, minute, second);
                    if (!isNaN(d.getTime())) return d;
                } catch (e) {
                    console.error("Failed to parse Jalali date in timeline", e);
                }
            }
            
            try {
                const d = new Date(clean.replace(' ', 'T'));
                if (!isNaN(d.getTime())) return d;
            } catch {}
            
            return new Date();
        };

        // Add Messages
        messages.forEach(msg => {
            list.push({
                id: `msg-${msg.id}`,
                type: 'MESSAGE',
                content: msg.Message,
                createdAt: msg.createdAt,
                parsedDate: parseDateSafely(msg.createdAt),
                receive: msg.receive,
                media: msg.media
            });
        });

        // Keep track of times/dates of meetings we loaded from structured database
        const addedMeetingTimes = new Set<string>();

        // 1. Add structured CRM Meetings from DB
        crmMeetings.forEach(m => {
            const dateTimeStr = `${m.meetingDate} ساعت ${m.meetingTime}`;
            addedMeetingTimes.add(dateTimeStr);
            list.push({
                id: `crm-meeting-${m.id}`,
                type: 'MEETING',
                content: m.meetingResult || '',
                createdAt: m.createdAt || new Date().toLocaleString('fa-IR'),
                parsedDate: parseDateSafely(m.createdAt || ''),
                author: m.agentName,
                meeting: {
                    id: m.id,
                    stage: m.stage,
                    dateTime: dateTimeStr,
                    location: m.meetingLocation,
                    result: m.meetingResult || '',
                    author: m.agentName || 'کاربر سیستم',
                    originalJournalId: m.id ? Number(m.id) : 0
                }
            });
        });

        // 2. Add Journals (filter out manual call logs and deduplicate meetings)
        journals.forEach(j => {
            if (j.content.startsWith('📞 لاگ تماس تلفنی')) {
                return; // skip duplicate manual journal
            }
            const isMeetingJournal = j.content.includes('ملاقات حضوری') && (j.content.includes('زمان جلسه:') || j.content.includes('مرحله:'));
            if (isMeetingJournal) {
                const { stage, dateTime, location, result } = parseMeetingContent(j.content);
                // Deduplicate if we already added a CRM meeting at this exact time
                if (addedMeetingTimes.has(dateTime)) {
                    return;
                }
                list.push({
                    id: `meeting-journal-${j.id}`,
                    type: 'MEETING',
                    content: j.content,
                    createdAt: j.createdAt,
                    parsedDate: parseDateSafely(j.createdAt),
                    author: j.author,
                    meeting: {
                        stage,
                        dateTime,
                        location,
                        result,
                        author: j.author || 'کاربر سیستم',
                        originalJournalId: j.id
                    }
                });
                return;
            }
            list.push({
                id: `journal-${j.id}`,
                type: 'JOURNAL',
                content: j.content,
                createdAt: j.createdAt,
                parsedDate: parseDateSafely(j.createdAt),
                author: j.author
            });
        });

        // Add Call Logs
        callLogs.forEach(log => {
            list.push({
                id: `calllog-${log.id}`,
                type: 'CALL_LOG',
                content: log.notes,
                createdAt: log.timestamp,
                parsedDate: parseDateSafely(log.timestamp),
                author: log.agentName,
                callLog: log
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
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                {/* Next & Previous Navigation */}
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-shrink-0">
                                    <button 
                                        disabled={!hasPrevious}
                                        type="button"
                                        onClick={() => onNavigate && onNavigate('prev')}
                                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${hasPrevious ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 bg-transparent' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                                        title="مشتری قبلی"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="text-[10px] font-black hidden sm:inline">قبلی</span>
                                    </button>

                                    <button 
                                        disabled={!hasNext}
                                        type="button"
                                        onClick={() => onNavigate && onNavigate('next')}
                                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${hasNext ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 bg-transparent' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                                        title="مشتری بعدی"
                                    >
                                        <span className="text-[10px] font-black hidden sm:inline">بعدی</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white truncate">
                                       جزئیات و تاریخچه مشتری
                                    </h2>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate" dir="ltr">
                                        {leadNumber} {leadName && `(${leadName})`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                                {/* Edit Customer Button */}
                                <button 
                                    onClick={() => (fullUserDetails || lead) && onEdit(fullUserDetails || lead)}
                                    type="button"
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors flex items-center gap-1"
                                    title="ویرایش اطلاعات مشتری"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span>ویرایش</span>
                                </button>

                                {/* Send Message to Customer Button */}
                                <button 
                                    onClick={() => setIsSendMessageOpen(true)}
                                    type="button"
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors flex items-center gap-1"
                                    title="ارسال پیام به مشتری"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="hidden sm:inline">ارسال پیام</span>
                                </button>

                                <button 
                                    onClick={() => fullUserDetails && onRegisterOrder(fullUserDetails)} 
                                    type="button"
                                    className="p-1.5 rounded-lg transition-colors bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900" 
                                    title="ثبت سفارش فروش"
                                >
                                    <ClipboardList className="w-4 h-4" />
                                </button>
                                <button onClick={onClose} type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
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
                                onClick={() => setActiveTab('BEHAVIOR_RATING')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === 'BEHAVIOR_RATING' 
                                        ? 'bg-white dark:bg-slate-700 text-slate-850 dark:text-white shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <Star className="w-4 h-4 text-amber-500" />
                                <span>امتیازدهی اخلاق</span>
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
                        {/* Live Notices */}
                        {(() => {
                            if (!lead || !currentUser) return null;
                            const otherViewers = (crmStatus?.activeViews || []).filter(
                                (v: any) => v.leadId === Number(lead.id) && v.username !== currentUser.username
                            );
                            const otherEditors = otherViewers.filter((v: any) => v.isEditing);
                            const otherReaders = otherViewers.filter((v: any) => !v.isEditing);
                            const leadLock = (crmStatus?.locks || []).find(
                                (l: any) => l.leadId === Number(lead.id)
                            );

                            return (
                                <>
                                    {otherEditors.length > 0 && (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center gap-2 text-xs font-bold shadow-sm">
                                            <AlertCircle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                                            <span>این سرنخ در حال حاضر توسط <strong>{otherEditors.map((e: any) => e.fullName).join(', ')}</strong> در حال ویرایش است.</span>
                                        </div>
                                    )}
                                    {otherReaders.length > 0 && (
                                        <div className="p-3 bg-sky-50/80 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 border border-sky-150 dark:border-sky-900/40 rounded-xl flex items-center gap-2 text-xs font-bold shadow-sm">
                                            <Info className="w-4.5 h-4.5 text-sky-600 dark:text-sky-400" />
                                            <span>این سرنخ توسط فرد دیگری (<strong>{otherReaders.map((r: any) => r.fullName).join(', ')}</strong>) در حال مشاهده است.</span>
                                        </div>
                                    )}
                                    {leadLock && (
                                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-between gap-2 text-xs font-bold shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                <span>این سرنخ قفل است؛ فعالیت ثبت شده توسط: <strong>{leadLock.fullName}</strong></span>
                                            </div>
                                            {(currentUser.isAdmin === 1 || loggedInUser?.isAdmin === 1) && (
                                                <button 
                                                    type="button" 
                                                    onClick={async () => {
                                                        await clearCrmLock(Number(lead.id));
                                                        const status = await getCrmStatus();
                                                        setCrmStatus(status);
                                                    }}
                                                    className="px-2 py-1 bg-rose-600 text-white hover:bg-rose-750 rounded-md transition text-[10px] shadow-sm font-black flex-shrink-0 mr-2"
                                                >
                                                    حذف قفل (مدیریت)
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            );
                        })()}

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

                                {/* Customer Tagging (CRM Club Merged) */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                        <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">برچسب‌گذاری مشتری (باشگاه مشتریان):</p>
                                    </div>

                                    {/* Ready-made tags selection list */}
                                    <div className="space-y-2">
                                        <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">برچسب‌های توصیفی آماده (انتخاب سریع):</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['سختگیر', 'خوش اخلاق', 'محتاط و بادقت', 'سرمایه‌گذار', 'نفوذ سیاسی/حاکمیتی', 'سابقه دوستی', 'سفارشی', 'تخفیف مشاغل'].map((tag) => {
                                                const isSelected = crmTags.includes(tag);
                                                return (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => handleToggleCrmTag(tag)}
                                                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                                                            isSelected 
                                                                ? 'bg-indigo-500 text-white border-indigo-500 font-bold shadow-xs' 
                                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                                                        }`}
                                                    >
                                                        {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Typed/Custom tags */}
                                    <div className="space-y-2">
                                        <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">برچسب‌های اختصاصی و دلخواه مشتری:</span>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newCrmTagInput}
                                                onChange={(e) => setNewCrmTagInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddCrmTag();
                                                    }
                                                }}
                                                placeholder="تایپ برچسب جدید و فشردن اینتر..."
                                                className="flex-grow px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-850 dark:text-white text-xs outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddCrmTag}
                                                className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition"
                                            >
                                                افزودن برچسب
                                            </button>
                                        </div>

                                        {/* Display Active Tags */}
                                        {crmTags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850">
                                                {crmTags.map((tag) => (
                                                    <span 
                                                        key={tag} 
                                                        className="inline-flex items-center gap-1 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                                                    >
                                                        {tag}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveCrmTag(tag)}
                                                            className="text-slate-400 hover:text-rose-500 font-bold ml-0.5 transition focus:outline-none"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={handleSaveCrmTags}
                                            disabled={isSavingCrmRatings}
                                            className="bg-indigo-650 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                        >
                                            {isSavingCrmRatings ? 'در حال ذخیره‌سازی...' : '✓ ثبت و ذخیره برچسب‌های مشتری'}
                                        </button>
                                    </div>
                                </div>

                                {/* Add Custom Log / Report */}
                                <div id="log-activity-form" className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
                                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">ثبت گزارش تماس یا فعالیت جدید (CRM):</p>
                                        
                                        {/* Sub-tab selection */}
                                        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-750">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLogFormTab('NOTE');
                                                    setValidationError(null);
                                                }}
                                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${logFormTab === 'NOTE' ? 'bg-white dark:bg-slate-700 text-slate-850 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                <FileText className="w-3 h-3 text-sky-500" />
                                                یادداشت متنی
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLogFormTab('CALL');
                                                    setValidationError(null);
                                                }}
                                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${logFormTab === 'CALL' ? 'bg-white dark:bg-slate-700 text-slate-850 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                <Phone className="w-3 h-3 text-emerald-500" />
                                                ثبت تماس تلفنی
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLogFormTab('MEETING');
                                                    setValidationError(null);
                                                }}
                                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${logFormTab === 'MEETING' ? 'bg-white dark:bg-slate-700 text-slate-850 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                <Calendar className="w-3 h-3 text-purple-500" />
                                                ملاقات حضوری
                                            </button>
                                        </div>
                                    </div>

                                    {validationError && (
                                        <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg border border-rose-100 dark:border-rose-900/40">{validationError}</p>
                                    )}

                                    {logFormTab === 'NOTE' ? (
                                        <div>
                                            <textarea
                                                value={newJournalContent}
                                                onChange={(e) => setNewJournalContent(e.target.value)}
                                                placeholder="شرح فعالیت، یادداشت یا کار متفرقه مشتری را اینجا بنویسید..."
                                                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 dark:text-white text-xs outline-none resize-none min-h-[70px]"
                                                rows={3}
                                            />
                                            <div className="flex justify-end mt-2">
                                                <button 
                                                    onClick={handleAddJournal} 
                                                    disabled={!newJournalContent.trim() || isJournalSending}
                                                    className="bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-sky-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-1"
                                                >
                                                    {isJournalSending ? 'در حال ثبت...' : 'ثبت یادداشت'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : logFormTab === 'CALL' ? (
                                        <div className="space-y-3 pt-1">
                                            {/* Call Type and Status Grid */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">نوع تماس</label>
                                                    <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCallType('INBOUND')}
                                                            className={`py-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${callType === 'INBOUND' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-450 hover:text-slate-600 dark:text-slate-400'}`}
                                                        >
                                                            <PhoneIncoming className="w-3 h-3" />
                                                            ورودی
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCallType('OUTBOUND')}
                                                            className={`py-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${callType === 'OUTBOUND' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-450 hover:text-slate-600 dark:text-slate-400'}`}
                                                        >
                                                            <PhoneOutgoing className="w-3 h-3" />
                                                            خروجی
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">وضعیت نهایی مکالمه</label>
                                                    <select
                                                        value={callStatus}
                                                        onChange={e => setCallStatus(e.target.value as any)}
                                                        className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-lg focus:border-sky-500 focus:outline-none dark:text-white font-bold"
                                                    >
                                                        <option value="SUCCESSFUL" className="text-emerald-600 font-bold">موفق (صحبت شد)</option>
                                                        <option value="NO_ANSWER" className="text-amber-600 font-bold">بدون پاسخ</option>
                                                        <option value="BUSY" className="text-stone-600 font-bold">خط مشغول بود</option>
                                                        <option value="REJECTED" className="text-red-700 font-bold">رد تماس توسط مخاطب</option>
                                                        <option value="MISSED" className="text-rose-600 font-bold">از دست رفته</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Duration (Only if successful) */}
                                            {callStatus === 'SUCCESSFUL' && (
                                                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800/80">
                                                    <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-emerald-500" />
                                                        مدت زمان مکالمه تلفنی
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="59"
                                                                value={durationMin}
                                                                onChange={e => setDurationMin(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                                                className="w-12 px-1.5 py-1 text-center font-mono text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md dark:text-white"
                                                            />
                                                            <span className="text-[10px] text-slate-400">دقیقه</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="59"
                                                                value={durationSec}
                                                                onChange={e => setDurationSec(Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                                                                className="w-12 px-1.5 py-1 text-center font-mono text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md dark:text-white"
                                                            />
                                                            <span className="text-[10px] text-slate-400">ثانیه</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Follow-up Telephone */}
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                                    {callType === 'INBOUND' ? 'تلفن پیگیری (کدام خط شرکت زنگ خورد؟)' : 'تلفن پیگیری (از کدام خط تماس گرفته شد؟)'}
                                                </label>
                                                <select
                                                    value={manualFollowUpPhone}
                                                    onChange={e => setManualFollowUpPhone(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-sky-500 focus:outline-none dark:text-white font-bold"
                                                >
                                                    <option value="">-- نامشخص / انتخاب نشده --</option>
                                                    <option value="خط اصلی تهران (۰۲۱-۹۱۰۰۰۰۰۰)">خط اصلی تهران (۰۲۱-۹۱۰۰۰۰۰۰)</option>
                                                    <option value="خط مستقیم فروش (داخلی ۱۰۱)">خط مستقیم فروش (داخلی ۱۰۱)</option>
                                                    <option value="خط پشتیبانی (داخلی ۱۰۲)">خط پشتیبانی (داخلی ۱۰۲)</option>
                                                    <option value="خط تبلیغات دیوار">خط تبلیغات دیوار</option>
                                                    <option value="خط آگهی‌های باما">خط آگهی‌های باما</option>
                                                    <option value="همراه کارشناس پیگیری">همراه کارشناس پیگیری</option>
                                                </select>
                                            </div>

                                            {/* Notes / Description */}
                                            <div>
                                                <textarea
                                                    value={callNotes}
                                                    onChange={(e) => setCallNotes(e.target.value)}
                                                    placeholder="شرح گفتگو، توافقات یا صحبت‌های رد و بدل شده تلفنی با مشتری..."
                                                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 dark:text-white text-xs outline-none resize-none min-h-[70px]"
                                                    rows={3}
                                                />
                                            </div>

                                            {/* Submit Button */}
                                            <div className="flex justify-end mt-2">
                                                <button 
                                                    onClick={handleSaveManualCallLog} 
                                                    disabled={!callNotes.trim() || isJournalSending}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-1"
                                                >
                                                    {isJournalSending ? 'در حال ثبت...' : 'ثبت تماس و گزارش'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 pt-1">
                                            {/* Meeting Stage, Date & Time Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">مرحله جلسه حضوری</label>
                                                    <div className="grid grid-cols-4 gap-1 bg-slate-50 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-150 dark:border-slate-800/60">
                                                        {(['دعوت', 'تعیین وقت', 'برگزار شد', 'برگزار نشد'] as const).map(stage => {
                                                            const isSelected = meetingStage === stage;
                                                            let stageColor = 'bg-sky-500';
                                                            if (stage === 'تعیین وقت') stageColor = 'bg-purple-500';
                                                            if (stage === 'برگزار شد') stageColor = 'bg-emerald-500';
                                                            if (stage === 'برگزار نشد') stageColor = 'bg-rose-500';

                                                            return (
                                                                <button
                                                                    key={stage}
                                                                    type="button"
                                                                    onClick={() => setMeetingStage(stage)}
                                                                    className={`py-1.5 rounded-md text-[9px] font-bold transition-all text-center ${isSelected ? `${stageColor} text-white shadow-xs` : 'text-slate-500 hover:text-slate-750 dark:text-slate-400'}`}
                                                                >
                                                                    {stage}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">تاریخ (جلالی)</label>
                                                        <input
                                                            type="text"
                                                            value={meetingDate}
                                                            onChange={e => setMeetingDate(e.target.value)}
                                                            placeholder="۱۴۰۵/۰۴/۲۰"
                                                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-lg focus:border-sky-500 focus:outline-none dark:text-white font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">ساعت</label>
                                                        <input
                                                            type="text"
                                                            value={meetingTime}
                                                            onChange={e => setMeetingTime(e.target.value)}
                                                            placeholder="۱۶:۳۰"
                                                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-lg focus:border-sky-500 focus:outline-none dark:text-white font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Meeting Location */}
                                            <div className="space-y-1">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">محل جلسه حضوری</label>
                                                <input
                                                    type="text"
                                                    value={meetingLocation}
                                                    onChange={e => setMeetingLocation(e.target.value)}
                                                    placeholder="مانند: نمایشگاه مرکزی، دفتر فروش تهران، محل مشتری و..."
                                                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-sky-500 focus:outline-none dark:text-white font-bold"
                                                />
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {['نمایشگاه مرکزی', 'دفتر مرکزی تهران', 'کارگاه کارشناسی', 'محل مشتری'].map(loc => (
                                                        <button
                                                            key={loc}
                                                            type="button"
                                                            onClick={() => setMeetingLocation(loc)}
                                                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition ${meetingLocation === loc ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-400 font-bold' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                                                        >
                                                            {loc}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Meeting Outcome / Result */}
                                            <div>
                                                <textarea
                                                    value={meetingResult}
                                                    onChange={(e) => setMeetingResult(e.target.value)}
                                                    placeholder="نتیجه جلسه، توافقات، مدل خودروهای مورد پسند یا توضیحات تکمیلی..."
                                                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 dark:text-white text-xs outline-none resize-none min-h-[70px]"
                                                    rows={3}
                                                />
                                            </div>

                                            {/* Submit Button */}
                                            <div className="flex justify-end mt-2">
                                                <button 
                                                    onClick={handleSaveMeeting} 
                                                    disabled={!meetingDate.trim() || !meetingTime.trim() || !meetingLocation.trim() || isJournalSending}
                                                    className="bg-purple-600 hover:bg-purple-750 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-1"
                                                >
                                                    {isJournalSending ? 'در حال ثبت...' : 'ثبت جلسه و گزارش'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
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
                                            } else if (item.type === 'JOURNAL') {
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
                                            } else if (item.type === 'MEETING') {
                                                const m = item.meeting!;
                                                
                                                // Color theme based on stage
                                                let stageBadgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
                                                let borderCol = 'border-r-sky-500';
                                                
                                                if (m.stage === 'تعیین وقت') {
                                                    stageBadgeColor = 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400';
                                                    borderCol = 'border-r-purple-500';
                                                } else if (m.stage === 'برگزار شد') {
                                                    stageBadgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
                                                    borderCol = 'border-r-emerald-500';
                                                } else if (m.stage === 'برگزار نشد') {
                                                    stageBadgeColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400';
                                                    borderCol = 'border-r-rose-500';
                                                }

                                                return (
                                                    <div key={item.id} className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border-r-4 border-l border-y ${borderCol} border-l-slate-200 dark:border-l-slate-850 border-y-slate-200 dark:border-y-slate-850 shadow-sm flex flex-col gap-2`}>
                                                        <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-50 dark:border-slate-800/40 pb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="p-1 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/30">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                </span>
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                                                    ملاقات حضوری با مشتری
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${stageBadgeColor}`}>
                                                                    {m.stage}
                                                                </span>
                                                            </div>
                                                            <span className="font-mono text-slate-400">{formatDate(item.createdAt)}</span>
                                                        </div>

                                                        {/* Meeting details section */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850">
                                                            <div className="flex items-center gap-1.5 font-bold">
                                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                                <span>زمان جلسه:</span>
                                                                <span className="text-slate-850 dark:text-slate-1050 font-mono">{m.dateTime}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 font-bold">
                                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                                <span>محل جلسه:</span>
                                                                <span className="text-slate-850 dark:text-slate-1050">{m.location}</span>
                                                            </div>
                                                        </div>

                                                        {/* Notes and Results */}
                                                        {m.result && (
                                                            <p className="text-xs text-slate-800 dark:text-slate-250 leading-relaxed font-medium whitespace-pre-wrap mt-1">
                                                                {m.result}
                                                            </p>
                                                        )}

                                                        <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold flex items-center justify-between mt-1 border-t border-slate-50 dark:border-slate-800/30 pt-1.5">
                                                            <div className="flex items-center gap-1">
                                                                <span>ثبت کننده:</span>
                                                                <span className="text-slate-600 dark:text-slate-400">{m.author}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePrefillMeeting(m)}
                                                                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-[10px] font-black hover:underline"
                                                            >
                                                                تغییر مرحله یا ویرایش جلسه 
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // CALL_LOG Log
                                                const log = item.callLog;
                                                const isIncoming = log?.callType === 'INBOUND';
                                                
                                                // Status styling
                                                let statusBadgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                                                let statusLabel = 'موفق';
                                                if (log?.callStatus === 'MISSED') {
                                                    statusBadgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400';
                                                    statusLabel = 'از دست رفته';
                                                } else if (log?.callStatus === 'NO_ANSWER') {
                                                    statusBadgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
                                                    statusLabel = 'بدون پاسخ';
                                                } else if (log?.callStatus === 'BUSY') {
                                                    statusBadgeColor = 'bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300';
                                                    statusLabel = 'مشغول';
                                                } else if (log?.callStatus === 'REJECTED') {
                                                    statusBadgeColor = 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';
                                                    statusLabel = 'رد تماس';
                                                } else if (log?.callStatus === 'SUCCESSFUL') {
                                                    statusBadgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
                                                    statusLabel = 'موفق';
                                                }

                                                const formattedDuration = log && log.duration > 0
                                                    ? `${Math.floor(log.duration / 60)} دقیقه و ${log.duration % 60} ثانیه`
                                                    : '';

                                                return (
                                                    <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-r-4 border-l border-y border-r-emerald-500 border-l-slate-200 dark:border-l-slate-850 border-y-slate-200 dark:border-y-slate-850 shadow-sm flex flex-col gap-2">
                                                        <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-50 dark:border-slate-800/40 pb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`p-1 rounded-lg ${isIncoming ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-sky-50 text-sky-600 dark:bg-sky-950/30'}`}>
                                                                    {isIncoming ? <PhoneIncoming className="w-3.5 h-3.5" /> : <PhoneOutgoing className="w-3.5 h-3.5" />}
                                                                </span>
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                                                    {isIncoming ? 'تماس ورودی / دایورت' : 'تماس خروجی'}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusBadgeColor}`}>
                                                                    {statusLabel}
                                                                </span>
                                                                {log?.followUpPhone && (
                                                                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 px-2 py-0.5 rounded-full">
                                                                        تلفن پیگیری: {log.followUpPhone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="font-mono text-slate-400">{formatDate(item.createdAt)}</span>
                                                        </div>
                                                        
                                                        {formattedDuration && (
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                                                                <Clock className="w-3 h-3 text-slate-400" />
                                                                <span>مدت مکالمه: {formattedDuration}</span>
                                                            </div>
                                                        )}

                                                        <p className="text-xs text-slate-800 dark:text-slate-250 leading-relaxed font-medium whitespace-pre-wrap">
                                                            {log?.notes || 'فاقد توضیحات تماس'}
                                                        </p>

                                                        <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1 mt-1 border-t border-slate-50 dark:border-slate-800/30 pt-1.5">
                                                            <span>ثبت کننده:</span>
                                                            <span className="text-slate-600 dark:text-slate-400">{log?.agentName}</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: Behavior & Ethics Rating */}
                        {activeTab === 'BEHAVIOR_RATING' && (
                            <div className="space-y-4">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-5">
                                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <Star className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                                        <p className="text-xs font-extrabold text-slate-800 dark:text-white">پنل تخصصی امتیازدهی اخلاق و میزان سختی معامله مشتری</p>
                                    </div>

                                    {/* Star Rating Section */}
                                    <div className="space-y-2.5">
                                        <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300">امتیاز اخلاق و رفتار مشتری (از نگاه کارشناسان فروش):</label>
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setCrmBehaviorScore(star)}
                                                    className="text-3xl transition-all focus:outline-none hover:scale-125 active:scale-95"
                                                >
                                                    <Star 
                                                        className={`w-8 h-8 ${
                                                            star <= crmBehaviorScore 
                                                                ? 'text-amber-500 fill-amber-500' 
                                                                : 'text-slate-300 dark:text-slate-700'
                                                        }`} 
                                                    />
                                                </button>
                                            ))}
                                            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mr-3 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-700 dark:text-amber-400">
                                                {crmBehaviorScore === 0 && "بدون امتیاز"}
                                                {crmBehaviorScore === 1 && "بسیار ضعیف / سرد"}
                                                {crmBehaviorScore === 2 && "ضعیف"}
                                                {crmBehaviorScore === 3 && "معمولی"}
                                                {crmBehaviorScore === 4 && "خوب و باحوصله"}
                                                {crmBehaviorScore === 5 && "بسیار خوش‌اخلاق و عالی"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Difficulty Level */}
                                    <div className="space-y-2.5">
                                        <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300">میزان سختی معامله با این مشتری:</label>
                                        <div className="flex flex-wrap gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-150 dark:border-slate-850">
                                            {['خیلی آسان', 'آسان', 'متوسط', 'سخت', 'خیلی سخت'].map((level) => {
                                                const isSelected = crmDealDifficulty === level;
                                                let colorClass = "bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800";
                                                if (isSelected) {
                                                    if (level === 'خیلی آسان' || level === 'آسان') {
                                                        colorClass = "bg-emerald-500 text-white border-emerald-500 font-extrabold shadow-sm scale-102";
                                                    } else if (level === 'متوسط') {
                                                        colorClass = "bg-sky-500 text-white border-sky-500 font-extrabold shadow-sm scale-102";
                                                    } else {
                                                        colorClass = "bg-rose-500 text-white border-rose-500 font-extrabold shadow-sm scale-102";
                                                    }
                                                }
                                                return (
                                                    <button
                                                        key={level}
                                                        type="button"
                                                        onClick={() => setCrmDealDifficulty(level)}
                                                        className={`text-xs px-4 py-2 rounded-xl border transition-all ${colorClass}`}
                                                    >
                                                        {level}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Sales expert opinion input */}
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300">ثبت نظر، یادداشت یا انتقاد کارشناس بابت اخلاق و رفتار مشتری:</label>
                                        <textarea
                                            value={crmOpinion}
                                            onChange={(e) => setCrmOpinion(e.target.value)}
                                            placeholder="نظرات، جزئیات رفتار یا اطلاعات تکمیلی در مورد اخلاق و نحوه معامله با این مشتری را یادداشت کنید..."
                                            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-850 dark:text-white text-xs outline-none resize-none min-h-[120px]"
                                            rows={4}
                                        />
                                    </div>

                                    <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={handleSaveBehaviorRating}
                                            disabled={isSavingCrmRatings}
                                            className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-xs font-black transition disabled:opacity-50 flex items-center gap-1.5 shadow-md hover:shadow-lg"
                                        >
                                            {isSavingCrmRatings ? 'در حال ذخیره‌سازی...' : '✓ ثبت و ذخیره امتیاز و نظر اخلاقی'}
                                        </button>
                                    </div>
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

            {toastMessage && (
                <Toast 
                    message={toastMessage} 
                    type={toastType} 
                    onClose={() => setToastMessage(null)} 
                />
            )}
        </>
    );
};

export default LeadDetailHistoryModal;
