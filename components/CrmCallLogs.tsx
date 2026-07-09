import React, { useState, useEffect, useMemo } from 'react';
import { 
    Phone, 
    PhoneIncoming, 
    PhoneOutgoing, 
    PhoneMissed, 
    Search, 
    Plus, 
    Trash2, 
    User as UserIcon, 
    Clock, 
    Calendar, 
    Filter, 
    MessageSquare, 
    CheckCircle, 
    XCircle,
    FileText,
    TrendingUp,
    Hash,
    Edit2,
    Loader2,
    FileSpreadsheet
} from 'lucide-react';
import type { User, StaffUser, CrmCallLog } from '../types';
import { getCallLogs, createCallLog, updateCallLog } from '../services/api';
import { CrmCallLogsImportModal } from './CrmCallLogsImportModal';

declare const moment: any;

interface CrmCallLogsProps {
    users: User[];
    staffUsers: StaffUser[];
    loggedInUser: { username: string; FullName?: string } | null;
}

const CrmCallLogs: React.FC<CrmCallLogsProps> = ({ users, staffUsers, loggedInUser }) => {
    // State of call logs
    const [callLogs, setCallLogs] = useState<CrmCallLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingLog, setEditingLog] = useState<CrmCallLog | null>(null);

    const refreshLogs = async () => {
        setIsLoading(true);
        try {
            const logs = await getCallLogs();
            setCallLogs(logs || []);
        } catch (err) {
            console.error("Failed to load call logs:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshLogs();
    }, []);

    useEffect(() => {
        const handleUpdate = () => {
            refreshLogs();
        };
        window.addEventListener('crm_call_logs_updated', handleUpdate);
        return () => {
            window.removeEventListener('crm_call_logs_updated', handleUpdate);
        };
    }, []);

    // Filtering and Searching
    const [searchQuery, setSearchQuery] = useState('');
    const [subTab, setSubTab] = useState<'ALL' | 'INBOUND' | 'OUTBOUND' | 'SUCCESSFUL' | 'MISSED'>('ALL');

    // Logging/Add Modal state
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    // Log Call Form state
    const [selectedUserOption, setSelectedUserOption] = useState<'EXISTING' | 'NEW'>('EXISTING');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [manualName, setManualName] = useState('');
    const [manualPhone, setManualPhone] = useState('');
    const [callType, setCallType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
    const [callStatus, setCallStatus] = useState<CrmCallLog['callStatus']>('SUCCESSFUL');
    const [durationMin, setDurationMin] = useState<number>(0);
    const [durationSec, setDurationSec] = useState<number>(0);
    const [agentName, setAgentName] = useState(loggedInUser?.username || 'مدیر سیستم');
    const [followUpPhone, setFollowUpPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [timestamp, setTimestamp] = useState('');

    // Pre-populate time / edit log in log call form
    useEffect(() => {
        if (isLogModalOpen) {
            if (editingLog) {
                // Pre-populate with existing log details
                if (editingLog.userId) {
                    setSelectedUserOption('EXISTING');
                    setSelectedUserId(editingLog.userId.toString());
                } else {
                    setSelectedUserOption('NEW');
                    setManualName(editingLog.customerName);
                    setManualPhone(editingLog.customerNumber);
                }
                setCallType(editingLog.callType);
                setCallStatus(editingLog.callStatus);
                setDurationMin(Math.floor(editingLog.duration / 60));
                setDurationSec(editingLog.duration % 60);
                setAgentName(editingLog.agentName);
                setFollowUpPhone(editingLog.followUpPhone || '');
                setNotes(editingLog.notes);
                setTimestamp(editingLog.timestamp);
            } else {
                // Default time to now in Persian format
                let pTime = '1405/03/28 12:00';
                try {
                    if (typeof moment !== 'undefined') {
                        pTime = moment().locale('fa').format('jYYYY/jMM/jDD HH:mm');
                    } else {
                        const d = new Date();
                        pTime = `1405/03/28 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    }
                } catch (e) {}
                setTimestamp(pTime);
                
                // Reset fields
                setSelectedUserId('');
                setManualName('');
                setManualPhone('');
                setNotes('');
                setDurationMin(0);
                setDurationSec(0);
                setCallType('INBOUND');
                setCallStatus('SUCCESSFUL');
                setAgentName(loggedInUser?.username || 'مدیر سیستم');
                setFollowUpPhone('');
            }
        } else {
            setEditingLog(null);
        }
    }, [isLogModalOpen, editingLog, loggedInUser]);

    // Handle form submission
    const handleLogCallSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let customerName = '';
        let customerNumber = '';
        let refUserId: number | undefined;

        if (selectedUserOption === 'EXISTING') {
            const user = users.find(u => u.id.toString() === selectedUserId);
            if (!user) {
                alert('لطفاً یک مشتری را انتخاب کنید یا گزینه مشتری جدید را انتخاب کنید.');
                return;
            }
            customerName = user.FullName;
            customerNumber = user.Number;
            refUserId = user.id;
        } else {
            if (!manualName.trim() || !manualPhone.trim()) {
                alert('لطفاً نام و شماره تلفن مشتری جدید را وارد کنید.');
                return;
            }
            customerName = manualName.trim();
            customerNumber = manualPhone.trim();
        }

        const durationTotal = callStatus === 'SUCCESSFUL' ? (durationMin * 60 + durationSec) : 0;

        try {
            if (editingLog) {
                // Update via API (PUT)
                const updatedLog: CrmCallLog = {
                    ...editingLog,
                    userId: refUserId,
                    customerName,
                    customerNumber,
                    callType,
                    callStatus,
                    duration: durationTotal,
                    agentName,
                    followUpPhone: followUpPhone || undefined,
                    notes,
                    timestamp
                };
                await updateCallLog(updatedLog);
            } else {
                // Create via API (POST)
                const newLog = {
                    userId: refUserId,
                    customerName,
                    customerNumber,
                    callType,
                    callStatus,
                    duration: durationTotal,
                    agentName,
                    followUpPhone: followUpPhone || undefined,
                    notes,
                    timestamp
                };
                await createCallLog(newLog);
            }
            setIsLogModalOpen(false);
            setEditingLog(null);
            refreshLogs();
        } catch (err) {
            console.error("Failed to save call log:", err);
            alert("خطایی در ذخیره اطلاعات تماس رخ داد.");
        }
    };

    // Edit call log
    const handleEditCallLog = (log: CrmCallLog) => {
        setEditingLog(log);
        setIsLogModalOpen(true);
    };

    // Delete call log (local fallback only, as API is get/post/put)
    const handleDeleteCallLog = (id: string) => {
        if (confirm('آیا از حذف این گزارش تماس مطمئن هستید؟')) {
            setCallLogs(prev => prev.filter(log => log.id !== id));
        }
    };

    // Calculate metrics
    const metrics = useMemo(() => {
        const total = callLogs.length;
        const inbound = callLogs.filter(log => log.callType === 'INBOUND').length;
        const outbound = callLogs.filter(log => log.callType === 'OUTBOUND').length;
        const successful = callLogs.filter(log => log.callStatus === 'SUCCESSFUL').length;
        const missed = callLogs.filter(log => ['MISSED', 'NO_ANSWER', 'BUSY', 'REJECTED'].includes(log.callStatus)).length;
        
        const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

        return { total, inbound, outbound, successful, missed, successRate };
    }, [callLogs]);

    // Filter and search call logs
    const filteredLogs = useMemo(() => {
        return callLogs.filter(log => {
            // Sub tab filter
            if (subTab === 'INBOUND' && log.callType !== 'INBOUND') return false;
            if (subTab === 'OUTBOUND' && log.callType !== 'OUTBOUND') return false;
            if (subTab === 'SUCCESSFUL' && log.callStatus !== 'SUCCESSFUL') return false;
            if (subTab === 'MISSED' && log.callStatus === 'SUCCESSFUL') return false;

            // Search query filter
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                return (
                    log.customerName.toLowerCase().includes(q) ||
                    log.customerNumber.includes(q) ||
                    log.agentName.toLowerCase().includes(q) ||
                    log.notes.toLowerCase().includes(q)
                );
            }

            return true;
        });
    }, [callLogs, subTab, searchQuery]);

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds === 0) return '---';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins} دقیقه و ${secs} ثانیه` : `${secs} ثانیه`;
    };

    const getStatusBadge = (status: CrmCallLog['callStatus']) => {
        switch (status) {
            case 'SUCCESSFUL':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        موفق
                    </span>
                );
            case 'MISSED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                        <PhoneMissed className="w-3.5 h-3.5" />
                        از دست رفته
                    </span>
                );
            case 'NO_ANSWER':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                        <XCircle className="w-3.5 h-3.5" />
                        عدم پاسخ
                    </span>
                );
            case 'BUSY':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <XCircle className="w-3.5 h-3.5" />
                        مشغول
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                        <XCircle className="w-3.5 h-3.5" />
                        رد تماس
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div id="crm-calls-section" className="space-y-6 animate-fade-in">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">کل تماس‌ها</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white font-mono">{metrics.total.toLocaleString('fa-IR')}</h3>
                    </div>
                    <div className="bg-sky-50 dark:bg-sky-950/40 p-3 rounded-xl text-sky-600 dark:text-sky-400">
                        <Phone className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">تماس‌های ورودی</p>
                        <h3 className="text-2xl font-black text-emerald-600 font-mono">{metrics.inbound.toLocaleString('fa-IR')}</h3>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl text-emerald-600 dark:text-emerald-400">
                        <PhoneIncoming className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">تماس‌های خروجی</p>
                        <h3 className="text-2xl font-black text-indigo-600 font-mono">{metrics.outbound.toLocaleString('fa-IR')}</h3>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <PhoneOutgoing className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">مکالمات موفق</p>
                        <h3 className="text-2xl font-black text-teal-600 font-mono">{metrics.successful.toLocaleString('fa-IR')}</h3>
                    </div>
                    <div className="bg-teal-50 dark:bg-teal-950/40 p-3 rounded-xl text-teal-600 dark:text-teal-400">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm col-span-2 md:col-span-1 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">از دست رفته / ناموفق</p>
                        <h3 className="text-2xl font-black text-rose-600 font-mono">{metrics.missed.toLocaleString('fa-IR')}</h3>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl text-rose-600 dark:text-rose-400">
                        <PhoneMissed className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Success rate bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">نرخ موفقیت تماس‌ها</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500">نسبت مکالمات موفق به کل تماس‌های ثبت شده در سیستم</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-96">
                    <div className="flex-grow bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.successRate}%` }}></div>
                    </div>
                    <span className="text-sm font-black text-emerald-600 font-mono w-12 text-left">{metrics.successRate.toLocaleString('fa-IR')}%</span>
                </div>
            </div>

            {/* Section Main Controls */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* SubTabs */}
                    <div className="flex flex-wrap bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                        {[
                            { id: 'ALL', label: 'همه تاریخچه', icon: <Phone className="w-4 h-4" /> },
                            { id: 'INBOUND', label: 'تماس‌های ورودی', icon: <PhoneIncoming className="w-4 h-4 text-emerald-500" /> },
                            { id: 'OUTBOUND', label: 'تماس‌های خروجی', icon: <PhoneOutgoing className="w-4 h-4 text-indigo-500" /> },
                            { id: 'SUCCESSFUL', label: 'مکالمات موفق', icon: <CheckCircle className="w-4 h-4 text-teal-500" /> },
                            { id: 'MISSED', label: 'از دست رفته / ناموفق', icon: <PhoneMissed className="w-4 h-4 text-rose-500" /> }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSubTab(t.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                    subTab === t.id 
                                        ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-white' 
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                                }`}
                            >
                                {t.icon}
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2.5 self-start md:self-auto">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            وارد کردن از اکسل/CSV
                        </button>
                        <button
                            onClick={() => setIsLogModalOpen(true)}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            ثبت تماس جدید
                        </button>
                    </div>
                </div>

                {/* Search Bar / Filters */}
                <div className="relative">
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="جستجوی تماس بر اساس نام مشتری، شماره تماس، نام کارشناس و یا توضیحات..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                </div>

                {/* Call logs list / table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 dark:bg-slate-900/10">
                            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
                            <p className="text-sm font-bold">در حال دریافت اطلاعات از سرور...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 dark:bg-slate-900/10">
                            <Phone className="w-12 h-12 stroke-1 mb-3 text-slate-300" />
                            <p className="text-sm font-bold">هیچ گزارش تماسی یافت نشد.</p>
                            <p className="text-xs text-slate-400 mt-1">تغییر فیلترها و یا ثبت تماس جدید را امتحان کنید.</p>
                        </div>
                    ) : (
                        <table className="w-full text-right border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-4">طرف مکالمه (مشتری)</th>
                                    <th className="p-4">نوع تماس</th>
                                    <th className="p-4">وضعیت</th>
                                    <th className="p-4">مدت مکالمه</th>
                                    <th className="p-4">پاسخگو / کارشناس</th>
                                    <th className="p-4">شرح مذاکره / یادداشت‌های تماس</th>
                                    <th className="p-4">زمان ثبت</th>
                                    <th className="p-4 text-center">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                                                    {log.customerName.charAt(0)}
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-800 dark:text-white">{log.customerName}</h5>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{log.customerNumber}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {log.callType === 'INBOUND' ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                                    <PhoneIncoming className="w-3.5 h-3.5" />
                                                    <span>ورودی</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                                                    <PhoneOutgoing className="w-3.5 h-3.5" />
                                                    <span>خروجی</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(log.callStatus)}
                                        </td>
                                        <td className="p-4 font-mono text-slate-700 dark:text-slate-300">
                                            {formatDuration(log.duration)}
                                        </td>
                                        <td className="p-4 font-medium text-slate-600 dark:text-slate-400">
                                            <div className="font-bold text-slate-700 dark:text-slate-300">{log.agentName}</div>
                                            {log.followUpPhone && (
                                                <div className="text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-1.5 flex items-center gap-1" title="تلفن پیگیری">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                                                    <span>{log.followUpPhone}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 max-w-xs md:max-w-md">
                                            <p className="text-slate-600 dark:text-slate-300 line-clamp-2" title={log.notes}>
                                                {log.notes || <span className="text-slate-300 dark:text-slate-600">بدون توضیح</span>}
                                            </p>
                                        </td>
                                        <td className="p-4 font-mono text-slate-500 dark:text-slate-400">
                                            {log.timestamp}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleEditCallLog(log)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                                                    title="ویرایش لاگ تماس"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCallLog(log.id)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                                                    title="حذف لاگ تماس"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Log Call Modal */}
            {isLogModalOpen && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-8">
                        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-4 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <PhoneCallIcon className="w-5 h-5 text-sky-100" />
                                <h3 className="text-sm font-black">ثبت و گزارش تماس‌های مشتری</h3>
                            </div>
                            <button 
                                onClick={() => setIsLogModalOpen(false)}
                                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleLogCallSubmit} className="p-6 space-y-4">
                            {/* Option 1: Existing CRM Customer or New Number */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">انتخاب نوع مشتری</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUserOption('EXISTING')}
                                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${selectedUserOption === 'EXISTING' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        مشتری موجود در CRM
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUserOption('NEW')}
                                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${selectedUserOption === 'NEW' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        مشتری جدید / شماره دستی
                                    </button>
                                </div>
                            </div>

                            {/* Option A: Search / Select existing CRM Customer */}
                            {selectedUserOption === 'EXISTING' ? (
                                <div>
                                    <label htmlFor="customer-select" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">مکالمه با کدام مشتری؟</label>
                                    <select
                                        id="customer-select"
                                        value={selectedUserId}
                                        onChange={e => setSelectedUserId(e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none dark:text-white"
                                        required
                                    >
                                        <option value="">-- انتخاب مشتری --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.FullName} ({u.Number}) {u.CarModel ? `| خودرو: ${u.CarModel}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                /* Option B: Custom text inputs for client details */
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="manual-name" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">نام و نام خانوادگی</label>
                                        <input
                                            type="text"
                                            id="manual-name"
                                            value={manualName}
                                            onChange={e => setManualName(e.target.value)}
                                            placeholder="مثال: محمد امینی"
                                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="manual-phone" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">شماره تلفن تماس</label>
                                        <input
                                            type="tel"
                                            id="manual-phone"
                                            value={manualPhone}
                                            onChange={e => setManualPhone(e.target.value)}
                                            placeholder="مثال: 09121234567"
                                            className="w-full px-3 py-2 text-xs text-left font-mono bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Call Type and Status Column Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">نوع تماس</label>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setCallType('INBOUND')}
                                            className={`py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${callType === 'INBOUND' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <PhoneIncoming className="w-3.5 h-3.5" />
                                            ورودی
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCallType('OUTBOUND')}
                                            className={`py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${callType === 'OUTBOUND' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <PhoneOutgoing className="w-3.5 h-3.5" />
                                            خروجی
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="call-status-select" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">وضعیت نهایی مکالمه</label>
                                    <select
                                        id="call-status-select"
                                        value={callStatus}
                                        onChange={e => setCallStatus(e.target.value as any)}
                                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none dark:text-white font-bold"
                                        required
                                    >
                                        <option value="SUCCESSFUL" className="text-emerald-600 font-bold">موفق (مکالمه انجام شد)</option>
                                        <option value="MISSED" className="text-rose-600 font-bold">از دست رفته (بدون پاسخ از طرف ما)</option>
                                        <option value="NO_ANSWER" className="text-amber-600 font-bold">بدون پاسخ (آزاد خورد و جواب نداد)</option>
                                        <option value="BUSY" className="text-stone-600 font-bold">خط مشغول بود</option>
                                        <option value="REJECTED" className="text-red-700 font-bold">رد تماس توسط مخاطب</option>
                                    </select>
                                </div>
                            </div>

                            {/* Call Duration (Shown only if call is SUCCESSFUL) */}
                            {callStatus === 'SUCCESSFUL' && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">مدت زمان مکالمه</span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={durationMin}
                                                onChange={e => setDurationMin(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                                className="w-16 px-2 py-1 text-center font-mono text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                                            />
                                            <span className="text-xs text-slate-400 dark:text-slate-500">دقیقه</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={durationSec}
                                                onChange={e => setDurationSec(Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                                                className="w-16 px-2 py-1 text-center font-mono text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                                            />
                                            <span className="text-xs text-slate-400 dark:text-slate-500">ثانیه</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Agent handler & destination phone */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="agent-picker" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">کارشناس پیگیری</label>
                                    <select
                                        id="agent-picker"
                                        value={agentName}
                                        onChange={e => setAgentName(e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none dark:text-white"
                                    >
                                        <option value={loggedInUser?.username || 'مدیر سیستم'}>{loggedInUser?.username || 'مدیر سیستم'} (شما)</option>
                                        {staffUsers.map(s => (
                                            <option key={s.id} value={s.username}>{s.username}</option>
                                        ))}
                                        <option value="کارشناس فروش ۱">کارشناس فروش ۱</option>
                                        <option value="کارشناس فروش ۲">کارشناس فروش ۲</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="follow-up-phone-select" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تلفن پیگیری</label>
                                    <select
                                        id="follow-up-phone-select"
                                        value={followUpPhone}
                                        onChange={e => setFollowUpPhone(e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none dark:text-white font-bold"
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
                            </div>

                            {/* Call date and time */}
                            <div>
                                <label htmlFor="time-picker" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تاریخ و ساعت تماس</label>
                                <input
                                    type="text"
                                    id="time-picker"
                                    value={timestamp}
                                    onChange={e => setTimestamp(e.target.value)}
                                    placeholder="مثال: 1405/03/28 12:45"
                                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none dark:text-white"
                                    required
                                />
                            </div>

                            {/* Interaction Notes */}
                            <div>
                                <label htmlFor="notes-textarea" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">شرح مذاکرات و یادداشت‌های تماس</label>
                                <textarea
                                    id="notes-textarea"
                                    rows={3}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="شرح کامل صحبتهای مشتری، خواسته‌ها و موارد هماهنگ شده را یادداشت کنید..."
                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none dark:text-white"
                                    required
                                />
                            </div>

                            {/* Actions buttons */}
                            <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                                >
                                    ذخیره یادداشت تماس
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsLogModalOpen(false)}
                                    className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-xs rounded-xl transition-all"
                                >
                                    انصراف
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple embedded icons inside components to avoid additional import dependency mismatch
const PhoneCallIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

export default CrmCallLogs;
