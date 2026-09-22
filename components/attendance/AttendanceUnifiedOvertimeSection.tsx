import React, { useState, useEffect, useMemo } from 'react';
import { 
    TrendingUp, 
    Plus, 
    Search, 
    Filter, 
    Check, 
    X, 
    Clock, 
    Calendar, 
    AlertCircle, 
    CheckCircle, 
    Trash2, 
    User, 
    FileText,
    RefreshCw
} from 'lucide-react';
import type { OvertimeRequest, OvertimeStatus } from '../../types';
import { overtimeService } from '../../services/api';

interface Props {
    selectedEmployeeName?: string;
    onEmployeeSelect?: (name: string) => void;
    onRequestCreated?: () => void;
    isAdmin?: boolean;
    // For standalone modal usage from timesheet row
    isModalOpen?: boolean;
    initialDate?: string;
    initialEmployeeName?: string;
    initialHours?: number;
    onCloseModal?: () => void;
}

export const AttendanceUnifiedOvertimeSection: React.FC<Props> = ({
    selectedEmployeeName,
    onEmployeeSelect,
    onRequestCreated,
    isAdmin = true,
    isModalOpen = false,
    initialDate = '',
    initialEmployeeName = '',
    initialHours,
    onCloseModal
}) => {
    const [requests, setRequests] = useState<OvertimeRequest[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | OvertimeStatus>('ALL');

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState<boolean>(isModalOpen);

    // Form inputs
    const [formRequesterName, setFormRequesterName] = useState<string>(initialEmployeeName || selectedEmployeeName || '');
    const [formDate, setFormDate] = useState<string>(initialDate || '');
    const [formHours, setFormHours] = useState<number>(initialHours || 2);
    const [formReason, setFormReason] = useState<string>('');
    const [formNotes, setFormNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Update modal open state if prop changes
    useEffect(() => {
        if (isModalOpen) {
            setShowCreateModal(true);
            if (initialEmployeeName) setFormRequesterName(initialEmployeeName);
            if (initialDate) setFormDate(initialDate);
            if (initialHours) setFormHours(initialHours);
        }
    }, [isModalOpen, initialDate, initialEmployeeName, initialHours]);

    // Load overtime requests from API
    const loadRequests = async () => {
        setIsLoading(true);
        try {
            const data = await overtimeService.getAll();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Error fetching overtime requests:', err);
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
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = req.requesterName?.toLowerCase().includes(q);
                const matchReason = req.reason?.toLowerCase().includes(q);
                const matchDate = req.date?.includes(q);
                if (!matchName && !matchReason && !matchDate) return false;
            }
            return true;
        });
    }, [requests, selectedEmployeeName, statusFilter, searchQuery]);

    // Status change
    const handleStatusChange = async (id: number, newStatus: OvertimeStatus) => {
        try {
            const existing = requests.find(r => r.id === id);
            if (!existing) return;
            const updated = { ...existing, status: newStatus };
            await overtimeService.update({ ...updated, id });
            setRequests(prev => prev.map(r => r.id === id ? updated : r));
            setFeedback({ message: `وضعیت اضافه کاری به «${newStatus === 'APPROVED' ? 'تایید شده' : 'رد شده'}» تغییر یافت.`, type: 'success' });
            onRequestCreated?.();
        } catch (err: any) {
            setFeedback({ message: 'خطا در بروزرسانی وضعیت اضافه کاری: ' + err.message, type: 'error' });
        }
    };

    // Delete
    const handleDelete = async (id: number) => {
        if (!confirm('آیا از حذف این درخواست اضافه کاری اطمینان دارید؟')) return;
        try {
            await overtimeService.delete(id);
            setRequests(prev => prev.filter(r => r.id !== id));
            setFeedback({ message: 'درخواست اضافه کاری با موفقیت حذف شد.', type: 'success' });
            onRequestCreated?.();
        } catch (err: any) {
            setFeedback({ message: 'خطا در حذف درخواست: ' + err.message, type: 'error' });
        }
    };

    // Create submit
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formRequesterName.trim()) {
            alert('لطفاً نام کارمند را وارد کنید.');
            return;
        }
        if (!formDate.trim()) {
            alert('لطفاً تاریخ را وارد کنید.');
            return;
        }

        setIsSubmitting(true);
        try {
            const newReq: Omit<OvertimeRequest, 'id'> = {
                requesterName: formRequesterName.trim(),
                date: formDate.trim(),
                hours: Number(formHours) || 1,
                reason: formReason.trim() || 'درخواست اضافه کاری متصل به سامانه تردد و کارکرد',
                notes: formNotes.trim() || undefined,
                status: 'APPROVED', // When created via attendance manager, default to approved
                createdAt: new Date().toISOString()
            };

            await overtimeService.create(newReq as any);
            await loadRequests();
            setShowCreateModal(false);
            onCloseModal?.();
            setFeedback({ message: 'درخواست اضافه کاری با موفقیت ثبت شد و در سیستم تردد اعمال گردید.', type: 'success' });
            setFormReason('');
            setFormNotes('');
            onRequestCreated?.();
        } catch (err: any) {
            setFeedback({ message: 'خطا در ثبت درخواست اضافه کاری: ' + err.message, type: 'error' });
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
                            placeholder="جستجو در اضافه کاری‌ها..."
                            className="w-full pr-9 pl-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
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
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-colors shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>ثبت درخواست اضافه کاری جدید</span>
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
                                <th className="p-3.5">تاریخ اضافه کار</th>
                                <th className="p-3.5 text-center font-mono">ساعت تایید شده</th>
                                <th className="p-3.5">علت و کار انجام شده</th>
                                <th className="p-3.5">توضیحات</th>
                                <th className="p-3.5 text-center">وضعیت</th>
                                {isAdmin && <th className="p-3.5 pl-4 text-center">عملیات</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 8 : 7} className="p-10 text-center text-slate-400 font-bold">
                                        {isLoading ? 'در حال بارگذاری درخواست‌های اضافه کاری...' : 'هیچ درخواست اضافه کاری با این فیلترها ثبت نشده است.'}
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
                                            <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                                                {req.date}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                                                    +{req.hours} ساعت
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={req.reason}>
                                                {req.reason || '-'}
                                            </td>
                                            <td className="p-3 text-slate-400 text-[11px]">
                                                {req.notes || '-'}
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

            {/* Create Overtime Modal */}
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
                                <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-slate-800 dark:text-white text-base">
                                    ثبت درخواست اضافه کاری در سیستم تردد
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
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-hidden focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        تاریخ اضافه کار:
                                    </label>
                                    <input
                                        type="text"
                                        value={formDate}
                                        onChange={e => setFormDate(e.target.value)}
                                        placeholder="1404/09/01"
                                        required
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center focus:outline-hidden focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        میزان اضافه کاری (ساعت):
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0.5"
                                        value={formHours}
                                        onChange={e => setFormHours(Number(e.target.value))}
                                        required
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center focus:outline-hidden focus:border-emerald-500 font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    علت و شرح وظایف انجام شده در اضافه کار:
                                </label>
                                <textarea
                                    value={formReason}
                                    onChange={e => setFormReason(e.target.value)}
                                    placeholder="مثلاً: هماهنگی تحویل خودرو و تکمیل پرونده‌های مالی خارج از شیفت..."
                                    rows={2}
                                    required
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    توضیحات و یادداشت تکمیلی (اختیاری):
                                </label>
                                <input
                                    type="text"
                                    value={formNotes}
                                    onChange={e => setFormNotes(e.target.value)}
                                    placeholder="یادداشت سرپرست یا شماره فاکتور/مشتری..."
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:border-emerald-500"
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
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                                >
                                    {isSubmitting ? 'در حال ثبت...' : 'تایید و ثبت اضافه کار در کارتابل'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
