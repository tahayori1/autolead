import React, { useState, useEffect, useMemo } from 'react';
import type { LeaveRequest, OvertimeRequest, SalaryAdvanceRequest, MyProfile, StaffUser } from '../types';
import { leaveRequestsService, overtimeService, salaryAdvanceService, getMyProfile, getStaffUsers } from '../services/api';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import PersianDatePicker from '../components/PersianDatePicker';
import { 
    FileText, 
    Clock, 
    Calendar, 
    Wallet, 
    Plus, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Check, 
    X, 
    Trash2, 
    UserMinus,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    User
} from 'lucide-react';

declare const moment: any;

const toGregorian = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
        const normalized = dateStr.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                                  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦۷۸۹'.indexOf(d).toString());
        if (!normalized.includes('/') && normalized.includes('-')) {
            const m = moment(normalized);
            if (m.isValid()) return m.format('YYYY-MM-DD');
        }
        const m = moment(normalized, 'jYYYY/jMM/jDD');
        if (m.isValid()) return m.format('YYYY-MM-DD');
    } catch (e) {
        console.error("Error converting Jalali to Gregorian:", e);
    }
    return dateStr || '';
};

const toJalali = (gregorianStr?: string): string => {
    if (!gregorianStr) return '';
    try {
        const m = moment(gregorianStr);
        if (m.isValid()) return m.locale('fa').format('jYYYY/jMM/jDD');
    } catch (e) {
        console.error("Error converting Gregorian to Jalali:", e);
    }
    return gregorianStr || '';
};

const HOURLY_CATEGORIES = [
    'استحقاقی ساعتی',
    'امور اداری و شخصی',
    'پزشکی و درمانی',
    'ماموریت ساعتی سازمانی',
    'موارد اضطراری'
];

const LEAVE_REASONS = [
    'امور اداری و شخصی ضروری',
    'مراجعه به پزشک و پیگیری درمان',
    'کارهای بانکی و امور مالی',
    'استراحت و مسائل خانوادگی',
    'شرکت در مراسم رسمی / خانوادگی'
];

const OVERTIME_REASONS = [
    'انبارگردانی و ثبت موجودی پایان دوره',
    'رسیدگی به سفارشات فوری مشتریان',
    'هماهنگی ارسال خودروها و تحویل',
    'حضور در جلسه فوق‌العاده مدیریت',
    'پیشبرد پروژه‌های جاری شرکت تا دیروقت'
];

const SALARY_REASONS = [
    'هزینه‌های درمانی و بیمارستانی',
    'پرداخت قسط وام و تعهدات مالی',
    'پیش‌پرداخت اجاره‌بها',
    'خرید لوازم و تجهیزات ضروری زندگی',
    'هزینه‌های پیش‌بینی‌نشده خانوادگی'
];

export const RequestsHubPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'leave' | 'overtime' | 'salary_advance'>('leave');
    const [currentUser, setCurrentUser] = useState<Partial<MyProfile>>({});
    const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Data lists
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
    const [salaryAdvanceRequests, setSalaryAdvanceRequests] = useState<SalaryAdvanceRequest[]>([]);

    // Step-by-step Wizard Modal State
    const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
    const [wizardStep, setWizardStep] = useState<number>(1);
    
    // Unified Form State
    const [requestType, setRequestType] = useState<'HOURLY_LEAVE' | 'DAILY_LEAVE' | 'OVERTIME' | 'SALARY_ADVANCE'>('HOURLY_LEAVE');
    const [formData, setFormData] = useState({
        requesterName: '',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '11:00',
        hours: 2,
        hourlyCategory: 'استحقاقی ساعتی',
        date: '',
        amount: '',
        targetDate: '',
        reason: ''
    });

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [profile, staffList, leaves, overtimes, salaries] = await Promise.all([
                getMyProfile(),
                getStaffUsers().catch(() => []),
                leaveRequestsService.getAll(),
                overtimeService.getAll(),
                salaryAdvanceService.getAll()
            ]);
            setCurrentUser(profile || {});
            setStaffUsers(Array.isArray(staffList) ? staffList : []);
            setLeaveRequests(Array.isArray(leaves) ? leaves : []);
            setOvertimeRequests(Array.isArray(overtimes) ? overtimes : []);
            setSalaryAdvanceRequests(Array.isArray(salaries) ? salaries : []);
        } catch (err) {
            setToast({ message: 'خطا در بارگذاری اطلاعات درخواست‌ها از سرور', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const isAdmin = currentUser.isAdmin === 1;
    const currentName = currentUser.full_name || currentUser.username || 'کاربر سیستم';

    const filteredLeaves = useMemo(() => {
        if (isAdmin) return leaveRequests;
        return leaveRequests.filter(r => r.requesterName === currentName || r.requesterName === currentUser.username);
    }, [leaveRequests, isAdmin, currentName, currentUser]);

    const filteredOvertimes = useMemo(() => {
        if (isAdmin) return overtimeRequests;
        return overtimeRequests.filter(r => r.requesterName === currentName || r.requesterName === currentUser.username);
    }, [overtimeRequests, isAdmin, currentName, currentUser]);

    const filteredSalaries = useMemo(() => {
        if (isAdmin) return salaryAdvanceRequests;
        return salaryAdvanceRequests.filter(r => r.requesterName === currentName || r.requesterName === currentUser.username);
    }, [salaryAdvanceRequests, isAdmin, currentName, currentUser]);

    const handleOpenWizard = (defaultType?: 'HOURLY_LEAVE' | 'DAILY_LEAVE' | 'OVERTIME' | 'SALARY_ADVANCE') => {
        const today = moment().locale('fa').format('jYYYY/jMM/jDD');
        const target = moment().add(5, 'days').locale('fa').format('jYYYY/jMM/jDD');
        
        setRequestType(defaultType || 'HOURLY_LEAVE');
        setWizardStep(1);
        setFormData({
            requesterName: currentName,
            startDate: today,
            endDate: today,
            startTime: '09:00',
            endTime: '11:00',
            hours: 2,
            hourlyCategory: 'استحقاقی ساعتی',
            date: today,
            amount: '',
            targetDate: target,
            reason: LEAVE_REASONS[0]
        });
        setIsWizardOpen(true);
    };

    const handleTypeSelection = (type: 'HOURLY_LEAVE' | 'DAILY_LEAVE' | 'OVERTIME' | 'SALARY_ADVANCE') => {
        setRequestType(type);
        let defaultReason = LEAVE_REASONS[0];
        if (type === 'OVERTIME') defaultReason = OVERTIME_REASONS[0];
        if (type === 'SALARY_ADVANCE') defaultReason = SALARY_REASONS[0];
        setFormData(prev => ({ ...prev, reason: defaultReason }));
        setWizardStep(2);
    };

    const handleNextStep = () => {
        if (wizardStep === 2) {
            if (!formData.requesterName.trim()) {
                setToast({ message: 'لطفاً نام کارمند / متقاضی را مشخص کنید', type: 'error' });
                return;
            }
            if (requestType === 'SALARY_ADVANCE') {
                const rawAmount = Number(formData.amount.replace(/\D/g, ''));
                if (!rawAmount || !formData.targetDate || !formData.reason.trim()) {
                    setToast({ message: 'لطفاً مبلغ مساعده، تاریخ تسویه و علت را کامل وارد کنید', type: 'error' });
                    return;
                }
            } else if (requestType === 'OVERTIME') {
                if (!formData.date || !formData.hours || !formData.reason.trim()) {
                    setToast({ message: 'لطفاً تاریخ، ساعت کارکرد و علت اضافه کاری را وارد کنید', type: 'error' });
                    return;
                }
            } else {
                if (!formData.startDate || !formData.reason.trim()) {
                    setToast({ message: 'لطفاً تاریخ و علت مرخصی را وارد کنید', type: 'error' });
                    return;
                }
            }
        }
        setWizardStep(prev => Math.min(3, prev + 1));
    };

    const handlePrevStep = () => {
        setWizardStep(prev => Math.max(1, prev - 1));
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const targetRequester = formData.requesterName || currentName;
            if (requestType === 'HOURLY_LEAVE' || requestType === 'DAILY_LEAVE') {
                const isHourly = requestType === 'HOURLY_LEAVE';
                await leaveRequestsService.create({
                    type: isHourly ? 'HOURLY' : 'DAILY',
                    requesterName: targetRequester,
                    startDate: toGregorian(formData.startDate),
                    endDate: !isHourly ? toGregorian(formData.endDate || formData.startDate) : undefined,
                    startTime: isHourly ? formData.startTime : undefined,
                    endTime: isHourly ? formData.endTime : undefined,
                    hours: isHourly ? Number(formData.hours) : undefined,
                    hourlyCategory: isHourly ? formData.hourlyCategory : undefined,
                    reason: formData.reason,
                    status: 'PENDING',
                    createdAt: moment().format('YYYY-MM-DD')
                });
                setToast({ message: 'درخواست مرخصی با موفقیت ثبت شد', type: 'success' });
            } else if (requestType === 'OVERTIME') {
                await overtimeService.create({
                    requesterName: targetRequester,
                    date: toGregorian(formData.date),
                    hours: Number(formData.hours),
                    reason: formData.reason,
                    status: 'PENDING',
                    createdAt: moment().format('YYYY-MM-DD')
                });
                setToast({ message: 'درخواست اضافه کاری با موفقیت ثبت شد', type: 'success' });
            } else if (requestType === 'SALARY_ADVANCE') {
                const rawAmount = Number(formData.amount.replace(/\D/g, ''));
                await salaryAdvanceService.create({
                    requesterName: targetRequester,
                    amount: rawAmount,
                    targetDate: toGregorian(formData.targetDate),
                    reason: formData.reason,
                    status: 'PENDING',
                    createdAt: moment().format('YYYY-MM-DD')
                });
                setToast({ message: 'درخواست مساعده با موفقیت ثبت شد', type: 'success' });
            }

            setIsWizardOpen(false);
            fetchAllData();
        } catch (err: any) {
            setToast({ message: err.message || 'خطا در ثبت درخواست در سرور', type: 'error' });
        }
    };

    // Status Actions
    const updateLeaveStatus = async (item: LeaveRequest, status: 'APPROVED' | 'REJECTED') => {
        try {
            await leaveRequestsService.update({ ...item, status });
            setToast({ message: 'وضعیت درخواست مرخصی به‌روزرسانی شد', type: 'success' });
            fetchAllData();
        } catch (err) {
            setToast({ message: 'خطا در تغییر وضعیت', type: 'error' });
        }
    };

    const updateOvertimeStatus = async (item: OvertimeRequest, status: 'APPROVED' | 'REJECTED') => {
        try {
            await overtimeService.update({ ...item, status });
            setToast({ message: 'وضعیت درخواست اضافه کاری به‌روزرسانی شد', type: 'success' });
            fetchAllData();
        } catch (err) {
            setToast({ message: 'خطا در تغییر وضعیت', type: 'error' });
        }
    };

    const updateSalaryStatus = async (item: SalaryAdvanceRequest, status: 'APPROVED' | 'REJECTED') => {
        try {
            await salaryAdvanceService.update({ ...item, status });
            setToast({ message: 'وضعیت درخواست مساعده به‌روزرسانی شد', type: 'success' });
            fetchAllData();
        } catch (err) {
            setToast({ message: 'خطا در تغییر وضعیت', type: 'error' });
        }
    };

    const handleDeleteLeave = async (id: number) => {
        if (!window.confirm('آیا از حذف این درخواست اطمینان دارید؟')) return;
        try {
            await leaveRequestsService.delete(id);
            setToast({ message: 'درخواست حذف شد', type: 'success' });
            fetchAllData();
        } catch (err) {
            setToast({ message: 'خطا در حذف', type: 'error' });
        }
    };

    const handleDeleteOvertime = async (id: number) => {
        if (!window.confirm('آیا از حذف این درخواست اطمینان دارید؟')) return;
        try {
            await overtimeService.delete(id);
            setToast({ message: 'درخواست حذف شد', type: 'success' });
            fetchAllData();
        } catch (err) {
            setToast({ message: 'خطا در حذف', type: 'error' });
        }
    };

    const handleDeleteSalary = async (id: number) => {
        if (!window.confirm('آیا از حذف این درخواست اطمینان دارید؟')) return;
        try {
            await salaryAdvanceService.delete(id);
            setToast({ message: 'درخواست حذف شد', type: 'success' });
            fetchAllData();
        } catch (err) {
            setToast({ message: 'خطا در حذف', type: 'error' });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-vazir text-right" dir="rtl">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
                        <FileText className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">سامانه جامع درخواست‌ها</h1>
                        <p className="text-xs text-amber-200 mt-1">
                            {isAdmin ? 'مدیریت و بررسی کلیه درخواست‌های پرسنل (مدیر سیستم)' : 'ثبت و پیگیری درخواست‌های مرخصی، اضافه کاری و مساعده'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-200 flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>کاربر جاری: {currentName}</span>
                    </div>
                    <button
                        onClick={() => handleOpenWizard('HOURLY_LEAVE')}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>ثبت درخواست جدید</span>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6">
                <button
                    onClick={() => setActiveTab('leave')}
                    className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                        activeTab === 'leave'
                            ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <UserMinus className="w-4 h-4" />
                    <span>درخواست‌های مرخصی ({filteredLeaves.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('overtime')}
                    className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                        activeTab === 'overtime'
                            ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    <span>درخواست‌های اضافه کاری ({filteredOvertimes.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('salary_advance')}
                    className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                        activeTab === 'salary_advance'
                            ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <Wallet className="w-4 h-4" />
                    <span>درخواست‌های مساعده ({filteredSalaries.length})</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-16"><Spinner /></div>
            ) : (
                <div className="space-y-4">
                    {activeTab === 'leave' && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-white flex justify-between items-center">
                                <span>لیست درخواست‌های مرخصی {isAdmin ? '(مدیر سیستم - همه پرسنل)' : '(شخصی)'}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-700 font-bold">
                                        <tr>
                                            <th className="p-4">متقاضی (کارمند)</th>
                                            <th className="p-4">نوع</th>
                                            <th className="p-4">تاریخ / ساعت</th>
                                            <th className="p-4">علت</th>
                                            <th className="p-4">وضعیت</th>
                                            <th className="p-4 text-center">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {filteredLeaves.map(req => {
                                            const isOwner = req.requesterName === currentName || req.requesterName === currentUser.username;
                                            const canManage = isAdmin;
                                            const canDelete = isAdmin || (isOwner && req.status === 'PENDING');

                                            return (
                                                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{req.requesterName || 'کاربر سیستم'}</td>
                                                    <td className="p-4 font-bold">
                                                        {req.type === 'HOURLY' ? <span className="text-indigo-600">مرخصی ساعتی</span> : <span className="text-amber-600">مرخصی روزانه</span>}
                                                    </td>
                                                    <td className="p-4 font-mono">
                                                        {toJalali(req.startDate)} {req.type === 'HOURLY' && `(${req.startTime} تا ${req.endTime} - ${req.hours} ساعت)`}
                                                    </td>
                                                    <td className="p-4 text-slate-600 dark:text-slate-300">{req.reason}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                                                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                                            req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                                                            'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {req.status === 'APPROVED' ? 'تایید شده' : req.status === 'REJECTED' ? 'رد شده' : 'در انتظار'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {canManage && req.status === 'PENDING' && (
                                                                <>
                                                                    <button onClick={() => updateLeaveStatus(req, 'APPROVED')} className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold">تایید</button>
                                                                    <button onClick={() => updateLeaveStatus(req, 'REJECTED')} className="px-2.5 py-1 bg-rose-600 text-white rounded font-bold">رد</button>
                                                                </>
                                                            )}
                                                            {canDelete && (
                                                                <button onClick={() => handleDeleteLeave(req.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredLeaves.length === 0 && (
                                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">هیچ درخواست مرخصی ثبت نشده است.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'overtime' && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-white flex justify-between items-center">
                                <span>لیست درخواست‌های اضافه کاری {isAdmin ? '(مدیر سیستم - همه پرسنل)' : '(شخصی)'}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-700 font-bold">
                                        <tr>
                                            <th className="p-4">متقاضی (کارمند)</th>
                                            <th className="p-4">تاریخ کارکرد</th>
                                            <th className="p-4">مدت زمان</th>
                                            <th className="p-4">شرح کارکرد</th>
                                            <th className="p-4">وضعیت</th>
                                            <th className="p-4 text-center">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {filteredOvertimes.map(req => {
                                            const isOwner = req.requesterName === currentName || req.requesterName === currentUser.username;
                                            const canManage = isAdmin;
                                            const canDelete = isAdmin || (isOwner && req.status === 'PENDING');

                                            return (
                                                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{req.requesterName || 'کاربر سیستم'}</td>
                                                    <td className="p-4 font-mono">{toJalali(req.date)}</td>
                                                    <td className="p-4 font-bold text-amber-600">{req.hours} ساعت</td>
                                                    <td className="p-4 text-slate-600 dark:text-slate-300">{req.reason}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                                                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                                            req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                                                            'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {req.status === 'APPROVED' ? 'تایید شده' : req.status === 'REJECTED' ? 'رد شده' : 'در انتظار'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {canManage && req.status === 'PENDING' && (
                                                                <>
                                                                    <button onClick={() => updateOvertimeStatus(req, 'APPROVED')} className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold">تایید</button>
                                                                    <button onClick={() => updateOvertimeStatus(req, 'REJECTED')} className="px-2.5 py-1 bg-rose-600 text-white rounded font-bold">رد</button>
                                                                </>
                                                            )}
                                                            {canDelete && (
                                                                <button onClick={() => handleDeleteOvertime(req.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredOvertimes.length === 0 && (
                                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">هیچ درخواست اضافه کاری ثبت نشده است.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'salary_advance' && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-white flex justify-between items-center">
                                <span>لیست درخواست‌های مساعده {isAdmin ? '(مدیر سیستم - همه پرسنل)' : '(شخصی)'}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-700 font-bold">
                                        <tr>
                                            <th className="p-4">متقاضی (کارمند)</th>
                                            <th className="p-4">مبلغ (تومان)</th>
                                            <th className="p-4">تاریخ تسویه / هدف</th>
                                            <th className="p-4">علت درخواست</th>
                                            <th className="p-4">وضعیت</th>
                                            <th className="p-4 text-center">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {filteredSalaries.map(req => {
                                            const isOwner = req.requesterName === currentName || req.requesterName === currentUser.username;
                                            const canManage = isAdmin;
                                            const canDelete = isAdmin || (isOwner && req.status === 'PENDING');

                                            return (
                                                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{req.requesterName || 'کاربر سیستم'}</td>
                                                    <td className="p-4 font-mono font-bold text-emerald-600">{Number(req.amount).toLocaleString('fa-IR')} ت</td>
                                                    <td className="p-4 font-mono">{toJalali(req.targetDate)}</td>
                                                    <td className="p-4 text-slate-600 dark:text-slate-300">{req.reason}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                                                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                                            req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                                                            'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {req.status === 'APPROVED' ? 'تایید شده' : req.status === 'REJECTED' ? 'رد شده' : 'در انتظار'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {canManage && req.status === 'PENDING' && (
                                                                <>
                                                                    <button onClick={() => updateSalaryStatus(req, 'APPROVED')} className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold">تایید</button>
                                                                    <button onClick={() => updateSalaryStatus(req, 'REJECTED')} className="px-2.5 py-1 bg-rose-600 text-white rounded font-bold">رد</button>
                                                                </>
                                                            )}
                                                            {canDelete && (
                                                                <button onClick={() => handleDeleteSalary(req.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredSalaries.length === 0 && (
                                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">هیچ درخواست مساعده‌ای ثبت نشده است.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step-by-Step Wizard Modal */}
            {isWizardOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsWizardOpen(false)}>
                    <div className="bg-white dark:bg-slate-850 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        
                        {/* Header & Steps Indicator */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    <span>ثبت درخواست گام‌به‌گام</span>
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">گام {wizardStep} از ۳ — تکمیل اطلاعات درخواست</p>
                            </div>
                            <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
                            
                            {/* Step 1: Select Request Type */}
                            {wizardStep === 1 && (
                                <div className="space-y-4">
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">لطفاً نوع درخواست خود را انتخاب کنید:</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleTypeSelection('HOURLY_LEAVE')}
                                            className={`p-4 rounded-2xl border text-right transition-all flex flex-col gap-2 ${requestType === 'HOURLY_LEAVE' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                        >
                                            <Clock className="w-5 h-5 text-indigo-600" />
                                            <span className="font-black text-sm">مرخصی ساعتی</span>
                                            <span className="text-[11px] text-slate-400 font-normal">درخواست ساعتی در طول روز کاری</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleTypeSelection('DAILY_LEAVE')}
                                            className={`p-4 rounded-2xl border text-right transition-all flex flex-col gap-2 ${requestType === 'DAILY_LEAVE' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                        >
                                            <Calendar className="w-5 h-5 text-amber-600" />
                                            <span className="font-black text-sm">مرخصی روزانه</span>
                                            <span className="text-[11px] text-slate-400 font-normal">مرخصی تمام‌وقت یک یا چند روزه</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleTypeSelection('OVERTIME')}
                                            className={`p-4 rounded-2xl border text-right transition-all flex flex-col gap-2 ${requestType === 'OVERTIME' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                        >
                                            <Clock className="w-5 h-5 text-emerald-600" />
                                            <span className="font-black text-sm">اضافه کاری</span>
                                            <span className="text-[11px] text-slate-400 font-normal">ثبت ساعات کارکرد مازاد بر شیفت</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleTypeSelection('SALARY_ADVANCE')}
                                            className={`p-4 rounded-2xl border text-right transition-all flex flex-col gap-2 ${requestType === 'SALARY_ADVANCE' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                        >
                                            <Wallet className="w-5 h-5 text-sky-600" />
                                            <span className="font-black text-sm">مساعده حقوق</span>
                                            <span className="text-[11px] text-slate-400 font-normal">درخواست پیش‌پرداخت حقوق یا مساعده</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Requester Name & Details & Quick Preset Chips */}
                            {wizardStep === 2 && (
                                <div className="space-y-4">
                                    <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-bold flex items-center justify-between">
                                        <span>نوع انتخاب‌شده: {
                                            requestType === 'HOURLY_LEAVE' ? 'مرخصی ساعتی' :
                                            requestType === 'DAILY_LEAVE' ? 'مرخصی روزانه' :
                                            requestType === 'OVERTIME' ? 'اضافه کاری' : 'مساعده حقوق'
                                        }</span>
                                        <button type="button" onClick={() => setWizardStep(1)} className="text-[11px] underline text-amber-700 dark:text-amber-300">تغییر نوع</button>
                                    </div>

                                    {/* Requester Name Selection */}
                                    <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام کارمند / متقاضی *</label>
                                        {isAdmin && staffUsers.length > 0 ? (
                                            <select
                                                value={formData.requesterName}
                                                onChange={e => setFormData({...formData, requesterName: e.target.value})}
                                                className="w-full px-3 py-2.5 border rounded-xl dark:bg-slate-700 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500"
                                            >
                                                <option value={currentName}>{currentName} (کاربر جاری - ادمین)</option>
                                                {staffUsers.map(st => {
                                                    const sName = st.full_name || st.fullName || st.username;
                                                    if (sName === currentName) return null;
                                                    return <option key={st.id || sName} value={sName}>{sName} ({st.roleTitle || 'پرسنل'})</option>;
                                                })}
                                            </select>
                                        ) : (
                                            <input 
                                                type="text" 
                                                value={formData.requesterName || currentName} 
                                                onChange={e => setFormData({...formData, requesterName: e.target.value})}
                                                className="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-700 dark:text-white font-bold text-xs" 
                                            />
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-1">کاربری که لاگین کرده ({currentName}) به عنوان ثبت‌کننده در سیستم ثبت خواهد شد.</p>
                                    </div>

                                    {/* Date fields depending on request type */}
                                    {(requestType === 'HOURLY_LEAVE' || requestType === 'DAILY_LEAVE') && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ شروع مرخصی</label>
                                                <PersianDatePicker value={formData.startDate} onChange={val => setFormData({...formData, startDate: val})} placeholder="انتخاب تاریخ" />
                                            </div>

                                            {requestType === 'HOURLY_LEAVE' ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">از ساعت</label>
                                                        <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white font-bold" />
                                                    </div>
                                                    <div>
                                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تا ساعت</label>
                                                        <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white font-bold" />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">دسته‌بندی مرخصی ساعتی</label>
                                                        <select value={formData.hourlyCategory} onChange={e => setFormData({...formData, hourlyCategory: e.target.value})} className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white font-bold">
                                                            {HOURLY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ پایان مرخصی</label>
                                                    <PersianDatePicker value={formData.endDate} onChange={val => setFormData({...formData, endDate: val})} placeholder="تاریخ پایان" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {requestType === 'OVERTIME' && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ کارکرد اضافه کاری</label>
                                                <PersianDatePicker value={formData.date} onChange={val => setFormData({...formData, date: val})} placeholder="انتخاب تاریخ" />
                                            </div>
                                            <div>
                                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مدت زمان (ساعت)</label>
                                                <input type="number" step="0.5" min="0.5" value={formData.hours} onChange={e => setFormData({...formData, hours: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white font-mono font-bold" />
                                            </div>
                                        </div>
                                    )}

                                    {requestType === 'SALARY_ADVANCE' && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مبلغ مساعده (تومان)</label>
                                                <input 
                                                    type="text" 
                                                    value={formData.amount} 
                                                    onChange={e => {
                                                        const clean = e.target.value.replace(/\D/g, '');
                                                        const formatted = clean ? Number(clean).toLocaleString('fa-IR') : '';
                                                        setFormData({...formData, amount: formatted});
                                                    }} 
                                                    placeholder="مثلاً ۵,۰۰۰,۰۰۰" 
                                                    className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white font-mono font-bold" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ تسویه / هدف</label>
                                                <PersianDatePicker value={formData.targetDate} onChange={val => setFormData({...formData, targetDate: val})} placeholder="تاریخ تسویه" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Reason with Quick Preset Chips */}
                                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                        <label className="block font-bold text-slate-700 dark:text-slate-300">
                                            {requestType === 'SALARY_ADVANCE' ? 'علت درخواست مساعده' : requestType === 'OVERTIME' ? 'شرح کارکرد / علت' : 'علت مرخصی'} (انتخاب سریع یا تایپ دستی):
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(requestType === 'SALARY_ADVANCE' ? SALARY_REASONS : requestType === 'OVERTIME' ? OVERTIME_REASONS : LEAVE_REASONS).map(preset => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, reason: preset})}
                                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                                                        formData.reason === preset 
                                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {preset}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea 
                                            rows={2} 
                                            value={formData.reason} 
                                            onChange={e => setFormData({...formData, reason: e.target.value})} 
                                            placeholder="یا توضیحات دلخواه خود را بنویسید..." 
                                            className="w-full px-3 py-2 border rounded-xl dark:bg-slate-700 dark:text-white mt-2" 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Review & Submit */}
                            {wizardStep === 3 && (
                                <div className="space-y-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                                        <h4 className="font-black text-sm text-indigo-900 dark:text-indigo-200">بازبینی نهایی اطلاعات درخواست:</h4>
                                        <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                                            <div><span className="font-bold text-slate-400">متقاضی (کارمند):</span> <span className="font-black text-indigo-700 dark:text-indigo-300">{formData.requesterName || currentName}</span></div>
                                            <div><span className="font-bold text-slate-400">ثبت‌کننده (لاگین):</span> {currentName}</div>
                                            <div><span className="font-bold text-slate-400">نوع درخواست:</span> {
                                                requestType === 'HOURLY_LEAVE' ? 'مرخصی ساعتی' :
                                                requestType === 'DAILY_LEAVE' ? 'مرخصی روزانه' :
                                                requestType === 'OVERTIME' ? 'اضافه کاری' : 'مساعده حقوق'
                                            }</div>
                                            {requestType === 'HOURLY_LEAVE' && (
                                                <>
                                                    <div><span className="font-bold text-slate-400">تاریخ:</span> {formData.startDate}</div>
                                                    <div><span className="font-bold text-slate-400">ساعت:</span> از {formData.startTime} تا {formData.endTime}</div>
                                                </>
                                            )}
                                            {requestType === 'DAILY_LEAVE' && (
                                                <>
                                                    <div><span className="font-bold text-slate-400">از تاریخ:</span> {formData.startDate}</div>
                                                    <div><span className="font-bold text-slate-400">تا تاریخ:</span> {formData.endDate}</div>
                                                </>
                                            )}
                                            {requestType === 'OVERTIME' && (
                                                <>
                                                    <div><span className="font-bold text-slate-400">تاریخ کارکرد:</span> {formData.date}</div>
                                                    <div><span className="font-bold text-slate-400">مدت زمان:</span> {formData.hours} ساعت</div>
                                                </>
                                            )}
                                            {requestType === 'SALARY_ADVANCE' && (
                                                <>
                                                    <div><span className="font-bold text-slate-400">مبلغ:</span> {formData.amount} تومان</div>
                                                    <div><span className="font-bold text-slate-400">تاریخ تسویه:</span> {formData.targetDate}</div>
                                                </>
                                            )}
                                            <div className="col-span-2 pt-2 border-t border-indigo-200 dark:border-indigo-800">
                                                <span className="font-bold text-slate-400">علت / شرح:</span> <span className="font-bold">{formData.reason}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 text-center">پس از تایید، درخواست شما با نام کارمند انتخاب‌شده ثبت شده و جهت بررسی ارسال می‌گردد.</p>
                                </div>
                            )}

                        </div>

                        {/* Footer Buttons */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                            {wizardStep > 1 ? (
                                <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                    <span>مرحله قبل</span>
                                </button>
                            ) : <div />}

                            {wizardStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>مرحله بعد</span>
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleFinalSubmit}
                                    className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>ثبت نهایی و ارسال به سرور</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default RequestsHubPage;
