import React, { useState, useEffect, useMemo } from 'react';
import type { LeaveRequest, MyProfile, LeaveStatus, LeaveType } from '../types';
import { leaveRequestsService, getMyProfile } from '../services/api';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import PersianDatePicker from '../components/PersianDatePicker';
import { 
    Clock, 
    Calendar, 
    UserMinus, 
    Plus, 
    Trash2, 
    X, 
    Check, 
    AlertCircle, 
    Filter,
    FileText,
    CheckCircle2,
    XCircle,
    Building
} from 'lucide-react';

declare const moment: any;

const toGregorian = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
        const normalized = dateStr.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                                  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
        if (!normalized.includes('/') && normalized.includes('-')) {
            const m = moment(normalized);
            if (m.isValid()) {
                return m.format('YYYY-MM-DD');
            }
        }
        const m = moment(normalized, 'jYYYY/jMM/jDD');
        if (m.isValid()) {
            return m.format('YYYY-MM-DD');
        }
    } catch (e) {
        console.error("Error converting Jalali to Gregorian:", e);
    }
    return dateStr || '';
};

const toJalali = (gregorianStr?: string): string => {
    if (!gregorianStr) return '';
    try {
        const m = moment(gregorianStr);
        if (m.isValid()) {
            return m.locale('fa').format('jYYYY/jMM/jDD');
        }
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

const LeaveRequestsPage: React.FC = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<Partial<LeaveRequest>>({ 
        type: 'HOURLY', 
        status: 'PENDING',
        hours: 2,
        startTime: '09:00',
        endTime: '11:00',
        hourlyCategory: 'استحقاقی ساعتی'
    });
    const [currentUserProfile, setCurrentUserProfile] = useState<Partial<MyProfile>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [viewMode, setViewMode] = useState<'MY_REQUESTS' | 'ALL_REQUESTS'>('MY_REQUESTS');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'DAILY' | 'HOURLY'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | LeaveStatus>('ALL');

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [data, profile] = await Promise.all([
                leaveRequestsService.getAll(),
                getMyProfile()
            ]);
            setRequests(data);
            setCurrentUserProfile(profile);
        } catch (error) {
            setToast({ message: 'خطا در دریافت اطلاعات', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        const handleRefresh = () => {
            fetchAllData();
        };
        window.addEventListener('app-refresh', handleRefresh);
        return () => window.removeEventListener('app-refresh', handleRefresh);
    }, []);

    // Calculate hours automatically when start or end time changes
    const calculateHoursFromTimes = (start?: string, end?: string): number => {
        if (!start || !end) return 2;
        try {
            const [startH, startM] = start.split(':').map(Number);
            const [endH, endM] = end.split(':').map(Number);
            if (!isNaN(startH) && !isNaN(endH)) {
                const diffMinutes = (endH * 60 + (endM || 0)) - (startH * 60 + (startM || 0));
                if (diffMinutes > 0) {
                    const hours = Math.round((diffMinutes / 60) * 10) / 10;
                    return hours;
                }
            }
        } catch {
            // fallback
        }
        return 2;
    };

    const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
        const updated = { ...currentRequest, [field]: value };
        if (field === 'startTime') {
            const calculated = calculateHoursFromTimes(value, currentRequest.endTime);
            updated.hours = calculated > 0 ? calculated : updated.hours;
        } else {
            const calculated = calculateHoursFromTimes(currentRequest.startTime, value);
            updated.hours = calculated > 0 ? calculated : updated.hours;
        }
        setCurrentRequest(updated);
    };

    const handleOpenNewModal = (type: LeaveType = 'HOURLY') => {
        const todayJalali = moment().locale('fa').format('jYYYY/jMM/jDD');
        setCurrentRequest({
            type,
            status: 'PENDING',
            requesterName: currentUserProfile.full_name || currentUserProfile.username || '',
            startDate: todayJalali,
            endDate: type === 'DAILY' ? todayJalali : undefined,
            startTime: '09:00',
            endTime: '11:00',
            hours: 2,
            hourlyCategory: 'استحقاقی ساعتی',
            reason: ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!currentRequest.requesterName || !currentRequest.startDate || !currentRequest.reason?.trim()) {
            setToast({ message: 'لطفاً تمامی فیلدهای الزامی شامل تاریخ و علت مرخصی را وارد کنید', type: 'error' });
            return;
        }

        if (currentRequest.type === 'HOURLY') {
            if (!currentRequest.hours || currentRequest.hours <= 0) {
                setToast({ message: 'مدت زمان مرخصی ساعتی باید بزرگتر از صفر باشد', type: 'error' });
                return;
            }
        }

        try {
            const apiPayload: any = {
                ...currentRequest,
                startDate: toGregorian(currentRequest.startDate),
                endDate: currentRequest.type === 'DAILY' ? toGregorian(currentRequest.endDate) : undefined,
                hours: currentRequest.type === 'HOURLY' ? Number(currentRequest.hours) : undefined,
                startTime: currentRequest.type === 'HOURLY' ? currentRequest.startTime : undefined,
                endTime: currentRequest.type === 'HOURLY' ? currentRequest.endTime : undefined,
                hourlyCategory: currentRequest.type === 'HOURLY' ? currentRequest.hourlyCategory : undefined,
                status: 'PENDING',
                createdAt: new Date().toLocaleDateString('fa-IR'),
            };

            await leaveRequestsService.create(apiPayload);
            setToast({ 
                message: currentRequest.type === 'HOURLY' ? 'درخواست مرخصی ساعتی با موفقیت ثبت شد' : 'درخواست مرخصی روزانه ثبت شد', 
                type: 'success' 
            });
            setIsModalOpen(false);
            fetchAllData();
        } catch (error) {
            setToast({ message: 'خطا در ثبت درخواست مرخصی', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('آیا از حذف این درخواست اطمینان دارید؟')) {
            try {
                await leaveRequestsService.delete(id);
                setToast({ message: 'درخواست با موفقیت حذف شد', type: 'success' });
                fetchAllData();
            } catch (error) {
                setToast({ message: 'خطا در حذف درخواست', type: 'error' });
            }
        }
    };

    const updateStatus = async (request: LeaveRequest, status: 'APPROVED' | 'REJECTED') => {
        try {
            await leaveRequestsService.update({ ...request, status });
            setToast({ 
                message: status === 'APPROVED' ? 'درخواست مرخصی تایید شد' : 'درخواست مرخصی رد شد', 
                type: 'success' 
            });
            fetchAllData();
        } catch (error) {
            setToast({ message: 'خطا در تغییر وضعیت درخواست', type: 'error' });
        }
    };

    const filteredRequests = useMemo(() => {
        let list = requests;
        if (viewMode === 'MY_REQUESTS' || currentUserProfile.isAdmin !== 1) {
            list = list.filter(req => req.requesterName === currentUserProfile.full_name || req.requesterName === currentUserProfile.username);
        }
        if (typeFilter !== 'ALL') {
            list = list.filter(req => req.type === typeFilter);
        }
        if (statusFilter !== 'ALL') {
            list = list.filter(req => req.status === statusFilter);
        }
        return list;
    }, [requests, viewMode, currentUserProfile, typeFilter, statusFilter]);

    // Statistics counts
    const hourlyCount = requests.filter(r => r.type === 'HOURLY').length;
    const dailyCount = requests.filter(r => r.type === 'DAILY').length;
    const pendingCount = requests.filter(r => r.status === 'PENDING').length;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Header Banner */}
            <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl text-white shadow-md shadow-orange-500/20">
                        <UserMinus className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">سامانه درخواست مرخصی پرسنل</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            ثبت، پیگیری و مدیریت انواع مرخصی‌های ساعتی و روزانه اداری
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button 
                        onClick={() => handleOpenNewModal('HOURLY')} 
                        className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                    >
                        <Clock className="w-4 h-4" />
                        <span>ثبت مرخصی ساعتی</span>
                    </button>
                    <button 
                        onClick={() => handleOpenNewModal('DAILY')} 
                        className="flex-1 sm:flex-initial bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-600/20 active:scale-95"
                    >
                        <Calendar className="w-4 h-4" />
                        <span>ثبت مرخصی روزانه</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">کل درخواست‌ها</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{requests.length.toLocaleString('fa-IR')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-bold">مرخصی‌های ساعتی</p>
                        <p className="text-xl font-black text-indigo-800 dark:text-indigo-200 mt-1">{hourlyCount.toLocaleString('fa-IR')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-bold">مرخصی‌های روزانه</p>
                        <p className="text-xl font-black text-amber-800 dark:text-amber-200 mt-1">{dailyCount.toLocaleString('fa-IR')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-yellow-50/70 dark:bg-yellow-950/30 p-4 rounded-2xl border border-yellow-200/60 dark:border-yellow-900/40 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-yellow-700 dark:text-yellow-300 font-bold">در انتظار بررسی</p>
                        <p className="text-xl font-black text-yellow-800 dark:text-yellow-200 mt-1">{pendingCount.toLocaleString('fa-IR')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                </div>
            </div>
            
            {/* View Mode Tabs & Filters */}
            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('MY_REQUESTS')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'MY_REQUESTS'
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                    >
                        درخواست‌های من
                    </button>
                    {currentUserProfile.isAdmin === 1 && (
                        <button
                            onClick={() => setViewMode('ALL_REQUESTS')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                viewMode === 'ALL_REQUESTS'
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                        >
                            همه درخواست‌ها ({requests.length})
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Type Filter */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                        <button
                            type="button"
                            onClick={() => setTypeFilter('ALL')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all ${typeFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
                        >
                            همه
                        </button>
                        <button
                            type="button"
                            onClick={() => setTypeFilter('HOURLY')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${typeFilter === 'HOURLY' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500'}`}
                        >
                            <Clock className="w-3 h-3" />
                            <span>ساعتی</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTypeFilter('DAILY')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${typeFilter === 'DAILY' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500'}`}
                        >
                            <Calendar className="w-3 h-3" />
                            <span>روزانه</span>
                        </button>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                    >
                        <option value="ALL">تمامی وضعیت‌ها</option>
                        <option value="PENDING">در انتظار بررسی</option>
                        <option value="APPROVED">تایید شده</option>
                        <option value="REJECTED">رد شده</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Spinner /></div>
            ) : (
                <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50/80 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                                <tr>
                                    {viewMode === 'ALL_REQUESTS' && <th className="p-4 font-bold">نام متقاضی</th>}
                                    <th className="p-4 font-bold">نوع مرخصی</th>
                                    <th className="p-4 font-bold">جزئیات زمان و تاریخ</th>
                                    <th className="p-4 font-bold">دسته‌بندی</th>
                                    <th className="p-4 font-bold">علت مرخصی</th>
                                    <th className="p-4 font-bold">وضعیت</th>
                                    <th className="p-4 font-bold text-center">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredRequests.map(req => {
                                    const canManage = currentUserProfile.isAdmin === 1 && viewMode === 'ALL_REQUESTS';
                                    const isOwner = req.requesterName === currentUserProfile.full_name || req.requesterName === currentUserProfile.username;
                                    const canDelete = currentUserProfile.isAdmin === 1 || (isOwner && req.status === 'PENDING');
                                    
                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors text-slate-800 dark:text-slate-200">
                                            {viewMode === 'ALL_REQUESTS' && (
                                                <td className="p-4 font-bold text-slate-900 dark:text-white">
                                                    {req.requesterName}
                                                </td>
                                            )}
                                            <td className="p-4">
                                                {req.type === 'HOURLY' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-900/60">
                                                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                        <span>مرخصی ساعتی</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/60 dark:border-amber-900/60">
                                                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                                                        <span>مرخصی روزانه</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-slate-800 dark:text-white">
                                                        {toJalali(req.startDate)}
                                                    </span>
                                                    {req.type === 'HOURLY' ? (
                                                        <div className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                                                            <span>از {req.startTime || '۰۹:۰۰'} تا {req.endTime || '۱۱:۰۰'}</span>
                                                            <span className="font-bold bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 rounded text-[10px]">
                                                                ({req.hours || 2} ساعت)
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        req.endDate && (
                                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                                                تا {toJalali(req.endDate)}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                                                {req.type === 'HOURLY' ? (
                                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                                                        {req.hourlyCategory || 'استحقاقی ساعتی'}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px]">استحقاقی روزانه</span>
                                                )}
                                            </td>
                                            <td className="p-4 max-w-xs truncate text-slate-700 dark:text-slate-300" title={req.reason}>
                                                {req.reason}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                                                    req.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                                                    req.status === 'REJECTED' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800' :
                                                    'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                }`}>
                                                    {req.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                                                    {req.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                                                    {req.status === 'PENDING' && <AlertCircle className="w-3 h-3" />}
                                                    <span>{req.status === 'APPROVED' ? 'تایید شده' : req.status === 'REJECTED' ? 'رد شده' : 'در انتظار'}</span>
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {canManage && req.status === 'PENDING' && (
                                                        <>
                                                            <button 
                                                                onClick={() => updateStatus(req, 'APPROVED')} 
                                                                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold transition-all shadow-xs flex items-center gap-1"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                                <span>تایید</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => updateStatus(req, 'REJECTED')} 
                                                                className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg font-bold transition-all shadow-xs flex items-center gap-1"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                                <span>رد</span>
                                                            </button>
                                                        </>
                                                    )}
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => handleDelete(req.id)} 
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                                            title="حذف درخواست"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredRequests.length === 0 && (
                                    <tr>
                                        <td colSpan={viewMode === 'ALL_REQUESTS' ? 7 : 6} className="p-12 text-center text-slate-400 dark:text-slate-500">
                                            <p className="font-bold">درخواستی با مشخصات انتخاب شده یافت نشد.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal for Creating Leave Request */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-850 rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl ${currentRequest.type === 'HOURLY' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'}`}>
                                    {currentRequest.type === 'HOURLY' ? <Clock className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="font-black text-base text-slate-800 dark:text-white">
                                        {currentRequest.type === 'HOURLY' ? 'ثبت درخواست مرخصی ساعتی' : 'ثبت درخواست مرخصی روزانه'}
                                    </h3>
                                    <p className="text-[11px] text-slate-400">تکمیل مشخصات و زمان‌بندی مرخصی</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Type Toggle Tabs */}
                            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setCurrentRequest({ ...currentRequest, type: 'HOURLY', hours: 2, startTime: '09:00', endTime: '11:00' })}
                                    className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        currentRequest.type === 'HOURLY'
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Clock className="w-4 h-4" />
                                    <span>مرخصی ساعتی</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentRequest({ ...currentRequest, type: 'DAILY' })}
                                    className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        currentRequest.type === 'DAILY'
                                            ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>مرخصی روزانه</span>
                                </button>
                            </div>

                            {/* Requester Name (Readonly) */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">نام متقاضی</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-700/50 dark:border-slate-700 dark:text-white bg-slate-50 text-slate-600 text-xs font-bold" 
                                    value={currentRequest.requesterName || ''} 
                                    readOnly
                                />
                            </div>

                            {/* Date Picker */}
                            <div className="relative">
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    {currentRequest.type === 'HOURLY' ? 'تاریخ مرخصی ساعتی (الزامی)' : 'تاریخ شروع (الزامی)'}
                                </label>
                                <PersianDatePicker
                                    value={currentRequest.startDate || ''}
                                    onChange={val => setCurrentRequest({ ...currentRequest, startDate: val })}
                                    placeholder="انتخاب تاریخ مرخصی"
                                />
                            </div>

                            {/* HOURLY SPECIFIC CONTROLS */}
                            {currentRequest.type === 'HOURLY' ? (
                                <div className="space-y-3 p-4 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">از ساعت</label>
                                            <input 
                                                type="time" 
                                                value={currentRequest.startTime || '09:00'} 
                                                onChange={e => handleTimeChange('startTime', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">تا ساعت</label>
                                            <input 
                                                type="time" 
                                                value={currentRequest.endTime || '11:00'} 
                                                onChange={e => handleTimeChange('endTime', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold text-center"
                                            />
                                        </div>
                                    </div>

                                    {/* Duration / Hours with quick buttons */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                                مدت کل مرخصی ساعتی:
                                            </label>
                                            <span className="font-black text-indigo-700 dark:text-indigo-300 text-xs">
                                                {currentRequest.hours || 0} ساعت
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {[1, 2, 3, 4, 5].map(hr => (
                                                <button
                                                    key={hr}
                                                    type="button"
                                                    onClick={() => setCurrentRequest({ ...currentRequest, hours: hr })}
                                                    className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${
                                                        currentRequest.hours === hr
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50'
                                                    }`}
                                                >
                                                    {hr} ساعت
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Hourly Category */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">دسته‌بندی مرخصی ساعتی</label>
                                        <select
                                            value={currentRequest.hourlyCategory || HOURLY_CATEGORIES[0]}
                                            onChange={e => setCurrentRequest({ ...currentRequest, hourlyCategory: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold outline-none"
                                        >
                                            {HOURLY_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                /* DAILY SPECIFIC END DATE */
                                <div className="relative">
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">تاریخ پایان مرخصی (الزامی)</label>
                                    <PersianDatePicker
                                        value={currentRequest.endDate || ''}
                                        onChange={val => setCurrentRequest({ ...currentRequest, endDate: val })}
                                        placeholder="تاریخ پایان مرخصی"
                                    />
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">علت و توضیحات مرخصی (الزامی)</label>
                                <textarea 
                                    placeholder="علت مرخصی را به طور خلاصه شرح دهید..." 
                                    rows={3} 
                                    className="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs outline-none focus:ring-2 focus:ring-orange-500 transition-all" 
                                    value={currentRequest.reason || ''} 
                                    onChange={e => setCurrentRequest({...currentRequest, reason: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)} 
                                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl dark:text-slate-300 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                            >
                                انصراف
                            </button>
                            <button 
                                type="button" 
                                onClick={handleSave} 
                                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 active:scale-95"
                            >
                                ثبت نهایی درخواست
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default LeaveRequestsPage;
