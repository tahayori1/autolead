import React, { useState, useEffect, useMemo } from 'react';
import { 
    Coffee, 
    Plus, 
    Search, 
    Filter, 
    Check, 
    X, 
    Clock, 
    Calendar, 
    AlertCircle, 
    CheckCircle, 
    XCircle, 
    Trash2, 
    User, 
    FileText,
    RefreshCw
} from 'lucide-react';
import type { LeaveRequest, LeaveType, LeaveStatus } from '../../types';
import { leaveRequestsService } from '../../services/api';

interface Props {
    selectedEmployeeName?: string;
    onEmployeeSelect?: (name: string) => void;
    onRequestCreated?: () => void;
    isAdmin?: boolean;
    // For standalone modal usage from timesheet row
    isModalOpen?: boolean;
    initialDate?: string;
    initialEmployeeName?: string;
    onCloseModal?: () => void;
}

export const AttendanceUnifiedLeaveSection: React.FC<Props> = ({
    selectedEmployeeName,
    onEmployeeSelect,
    onRequestCreated,
    isAdmin = true,
    isModalOpen = false,
    initialDate = '',
    initialEmployeeName = '',
    onCloseModal
}) => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | LeaveStatus>('ALL');
    const [typeFilter, setTypeFilter] = useState<'ALL' | LeaveType>('ALL');

    // Create Modal State (either internal or driven by props)
    const [showCreateModal, setShowCreateModal] = useState<boolean>(isModalOpen);

    // Form inputs
    const [formRequesterName, setFormRequesterName] = useState<string>(initialEmployeeName || selectedEmployeeName || '');
    const [formType, setFormType] = useState<LeaveType>('DAILY');
    const [formStartDate, setFormStartDate] = useState<string>(initialDate || '');
    const [formEndDate, setFormEndDate] = useState<string>(initialDate || '');
    const [formHours, setFormHours] = useState<number>(2);
    const [formStartTime, setFormStartTime] = useState<string>('09:00');
    const [formEndTime, setFormEndTime] = useState<string>('11:00');
    const [formHourlyCategory, setFormHourlyCategory] = useState<string>('استحقاقی');
    const [formReason, setFormReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Update modal open state if prop changes
    useEffect(() => {
        if (isModalOpen) {
            setShowCreateModal(true);
            if (initialEmployeeName) setFormRequesterName(initialEmployeeName);
            if (initialDate) {
                setFormStartDate(initialDate);
                setFormEndDate(initialDate);
            }
        }
    }, [isModalOpen, initialDate, initialEmployeeName]);

    // Fetch leave requests from API
    const loadRequests = async () => {
        setIsLoading(true);
        try {
            const data = await leaveRequestsService.getAll();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Error fetching leave requests:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    // Filter requests
    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            if (selectedEmployeeName && selectedEmployeeName !== 'ALL') {
                if (req.requesterName.trim() !== selectedEmployeeName.trim()) return false;
            }
            if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
            if (typeFilter !== 'ALL' && req.type !== typeFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = req.requesterName?.toLowerCase().includes(q);
                const matchReason = req.reason?.toLowerCase().includes(q);
                const matchDate = req.startDate?.includes(q) || req.endDate?.includes(q);
                if (!matchName && !matchReason && !matchDate) return false;
            }
            return true;
        });
    }, [requests, selectedEmployeeName, statusFilter, typeFilter, searchQuery]);

    // Handle status update
    const handleStatusChange = async (id: number, newStatus: LeaveStatus) => {
        try {
            const existing = requests.find(r => r.id === id);
            if (!existing) return;
            const updated = { ...existing, status: newStatus };
            await leaveRequestsService.update({ ...updated, id });
            setRequests(prev => prev.map(r => r.id === id ? updated : r));
            setFeedback({ message: `وضعیت مرخصی به «${newStatus === 'APPROVED' ? 'تایید شده' : 'رد شده'}» تغییر یافت.`, type: 'success' });
            onRequestCreated?.();
        } catch (err: any) {
            setFeedback({ message: 'خطا در بروزرسانی وضعیت مرخصی: ' + err.message, type: 'error' });
        }
    };

    // Handle delete
    const handleDelete = async (id: number) => {
        if (!confirm('آیا از حذف این درخواست مرخصی اطمینان دارید؟')) return;
        try {
            await leaveRequestsService.delete(id);
            setRequests(prev => prev.filter(r => r.id !== id));
            setFeedback({ message: 'درخواست مرخصی با موفقیت حذف گردید.', type: 'success' });
            onRequestCreated?.();
        } catch (err: any) {
            setFeedback({ message: 'خطا در حذف درخواست مرخصی: ' + err.message, type: 'error' });
        }
    };

    // Handle create submit
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formRequesterName.trim()) {
            alert('لطفاً نام کارمند را وارد کنید.');
            return;
        }
        if (!formStartDate.trim()) {
            alert('لطفاً تاریخ شروع را وارد کنید.');
            return;
        }

        setIsSubmitting(true);
        try {
            const newRequest: Omit<LeaveRequest, 'id'> = {
                requesterName: formRequesterName.trim(),
                type: formType,
                startDate: formStartDate.trim(),
                endDate: formType === 'DAILY' ? (formEndDate.trim() || formStartDate.trim()) : undefined,
                hours: formType === 'HOURLY' ? Number(formHours) : undefined,
                startTime: formType === 'HOURLY' ? formStartTime : undefined,
                endTime: formType === 'HOURLY' ? formEndTime : undefined,
                hourlyCategory: formType === 'HOURLY' ? formHourlyCategory : undefined,
                reason: formReason.trim() || 'درخواست مرخصی متصل به سیستم تردد',
                status: 'APPROVED', // When created via attendance manager, default to approved or pending
                createdAt: new Date().toISOString()
            };

            await leaveRequestsService.create(newRequest as any);
            await loadRequests();
            setShowCreateModal(false);
            onCloseModal?.();
            setFeedback({ message: 'درخواست مرخصی جدید با موفقیت ثبت شد و با تردد همگام گردید.', type: 'success' });
            setFormReason('');
            onRequestCreated?.();
        } catch (err: any) {
            setFeedback({ message: 'خطا در ثبت درخواست مرخصی: ' + err.message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Feedback Alert */}
            {feedback && (
                <div className={`p-3 rounded-2xl text-xs flex items-center justify-between font-bold ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' 
                        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                }`}>
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                        <span>{feedback.message}</span>
                    </div>
                    <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Filter & Action Toolbar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search */}
                    <div className="relative min-w-[200px]">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="جستجو در مرخصی‌ها..."
                            className="w-full pr-9 pl-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:border-purple-500"
                        />
                    </div>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                    >
                        <option value="ALL">همه وضعیت‌ها</option>
                        <option value="PENDING">در انتظار بررسی</option>
                        <option value="APPROVED">تایید شده</option>
                        <option value="REJECTED">رد شده</option>
                    </select>

                    {/* Type filter */}
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value as any)}
                        className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden"
                    >
                        <option value="ALL">همه انواع مرخصی</option>
                        <option value="DAILY">روزانه</option>
                        <option value="HOURLY">ساعتی</option>
                    </select>

                    <button
                        onClick={loadRequests}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        title="بروزرسانی داده‌ها"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <button
                    onClick={() => {
                        setFormRequesterName(selectedEmployeeName || '');
                        setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-colors shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>ثبت درخواست مرخصی جدید</span>
                </button>
            </div>

            {/* Requests Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-100/90 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 select-none font-bold">
                                <th className="p-3.5 pr-4 text-center">ردیف</th>
                                <th className="p-3.5">نام کارمند</th>
                                <th className="p-3.5">نوع مرخصی</th>
                                <th className="p-3.5">تاریخ / بازه زمانی</th>
                                <th className="p-3.5 text-center">مدت زمان</th>
                                <th className="p-3.5">علت و توضیحات</th>
                                <th className="p-3.5 text-center">وضعیت</th>
                                {isAdmin && <th className="p-3.5 pl-4 text-center">عملیات</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 8 : 7} className="p-10 text-center text-slate-400 font-bold">
                                        {isLoading ? 'در حال بارگذاری درخواست‌های مرخصی...' : 'هیچ درخواست مرخصی با این فیلترها یافت نشد.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req, idx) => {
                                    const isApproved = req.status === 'APPROVED';
                                    const isRejected = req.status === 'REJECTED';
                                    const isPending = req.status === 'PENDING';

                                    return (
                                        <tr key={req.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                                            <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                                                {idx + 1}
                                            </td>
                                            <td className="p-3 font-bold text-slate-800 dark:text-white">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{req.requesterName}</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                                    req.type === 'DAILY'
                                                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                                }`}>
                                                    {req.type === 'DAILY' ? 'مرخصی روزانه' : `مرخصی ساعتی (${req.hourlyCategory || 'استحقاقی'})`}
                                                </span>
                                            </td>
                                            <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                                                {req.type === 'DAILY' ? (
                                                    <span>{req.startDate} {req.endDate && req.endDate !== req.startDate ? `تا ${req.endDate}` : ''}</span>
                                                ) : (
                                                    <span>{req.startDate} ({req.startTime || '-'} الی {req.endTime || '-'})</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                                                {req.type === 'DAILY' ? '۱ روز' : `${req.hours || '-'} ساعت`}
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={req.reason}>
                                                {req.reason || '-'}
                                            </td>
                                            <td className="p-3 text-center">
                                                {isApproved && (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                        تایید شده
                                                    </span>
                                                )}
                                                {isRejected && (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                        رد شده
                                                    </span>
                                                )}
                                                {isPending && (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                        در انتظار بررسی
                                                    </span>
                                                )}
                                            </td>
                                            {isAdmin && (
                                                <td className="p-3 pl-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {!isApproved && (
                                                            <button
                                                                onClick={() => handleStatusChange(req.id, 'APPROVED')}
                                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                                                                title="تایید درخواست"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {!isRejected && (
                                                            <button
                                                                onClick={() => handleStatusChange(req.id, 'REJECTED')}
                                                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                                                                title="رد درخواست"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(req.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Leave Request Modal */}
            {showCreateModal && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in font-vazir"
                    onClick={() => {
                        setShowCreateModal(false);
                        onCloseModal?.();
                    }}
                    dir="rtl"
                >
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 space-y-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-xl">
                                    <Coffee className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-slate-800 dark:text-white text-base">
                                    ثبت درخواست مرخصی در سامانه تردد
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    onCloseModal?.();
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    نام و نام خانوادگی کارمند:
                                </label>
                                <input
                                    type="text"
                                    value={formRequesterName}
                                    onChange={e => setFormRequesterName(e.target.value)}
                                    placeholder="مثلاً: علیرضا محمدی"
                                    required
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-hidden focus:border-purple-500"
                                />
                            </div>

                            {/* Leave Type Toggle */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نوع مرخصی:</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormType('DAILY')}
                                        className={`p-2.5 rounded-xl font-bold border transition-colors ${
                                            formType === 'DAILY'
                                                ? 'bg-purple-600 text-white border-purple-600'
                                                : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        📅 مرخصی روزانه
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormType('HOURLY')}
                                        className={`p-2.5 rounded-xl font-bold border transition-colors ${
                                            formType === 'HOURLY'
                                                ? 'bg-purple-600 text-white border-purple-600'
                                                : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        ⏰ مرخصی ساعتی
                                    </button>
                                </div>
                            </div>

                            {/* Dates */}
                            {formType === 'DAILY' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">از تاریخ:</label>
                                        <input
                                            type="text"
                                            value={formStartDate}
                                            onChange={e => setFormStartDate(e.target.value)}
                                            placeholder="1404/09/01"
                                            required
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center focus:outline-hidden focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تا تاریخ:</label>
                                        <input
                                            type="text"
                                            value={formEndDate}
                                            onChange={e => setFormEndDate(e.target.value)}
                                            placeholder="1404/09/01"
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center focus:outline-hidden focus:border-purple-500"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ مرخصی ساعتی:</label>
                                        <input
                                            type="text"
                                            value={formStartDate}
                                            onChange={e => setFormStartDate(e.target.value)}
                                            placeholder="1404/09/01"
                                            required
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center focus:outline-hidden focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">از ساعت:</label>
                                            <input
                                                type="text"
                                                value={formStartTime}
                                                onChange={e => setFormStartTime(e.target.value)}
                                                placeholder="09:00"
                                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تا ساعت:</label>
                                            <input
                                                type="text"
                                                value={formEndTime}
                                                onChange={e => setFormEndTime(e.target.value)}
                                                placeholder="11:00"
                                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مدت (ساعت):</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={formHours}
                                                onChange={e => setFormHours(Number(e.target.value))}
                                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">دسته مرخصی ساعتی:</label>
                                        <select
                                            value={formHourlyCategory}
                                            onChange={e => setFormHourlyCategory(e.target.value)}
                                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                                        >
                                            <option value="استحقاقی">استحقاقی</option>
                                            <option value="درمانی / پزشکی">درمانی / پزشکی</option>
                                            <option value="شخصی / اضطراری">شخصی / اضطراری</option>
                                            <option value="ماموریت ساعتی">ماموریت ساعتی</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">علت و توضیحات:</label>
                                <textarea
                                    value={formReason}
                                    onChange={e => setFormReason(e.target.value)}
                                    placeholder="علت مرخصی را وارد کنید..."
                                    rows={2}
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:border-purple-500"
                                />
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        onCloseModal?.();
                                    }}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                                >
                                    {isSubmitting ? 'در حال ثبت...' : 'ثبت مرخصی و اتصال به تردد'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
