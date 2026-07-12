import React, { useState, useEffect, useMemo } from 'react';
import type { OvertimeRequest, MyProfile, OvertimeStatus } from '../types';
import { overtimeService, getMyProfile } from '../services/api';
import { Clock } from 'lucide-react';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import PersianDatePicker from '../components/PersianDatePicker';

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

const OvertimePage: React.FC = () => {
    const [requests, setRequests] = useState<OvertimeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<Partial<OvertimeRequest>>({ hours: 1, status: 'PENDING' });
    const [currentUserProfile, setCurrentUserProfile] = useState<Partial<MyProfile>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [viewMode, setViewMode] = useState<'MY_REQUESTS' | 'ALL_REQUESTS'>('MY_REQUESTS');

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [data, profile] = await Promise.all([
                overtimeService.getAll(),
                getMyProfile()
            ]);
            setRequests(data || []);
            setCurrentUserProfile(profile || {});
        } catch (error) {
            setToast({ message: 'خطا در دریافت اطلاعات اضافه کاری', type: 'error' });
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

    const handleSave = async () => {
        if (!currentRequest.requesterName || !currentRequest.date || !currentRequest.reason || !currentRequest.hours) {
            setToast({ message: 'اطلاعات ناقص است', type: 'error' });
            return;
        }

        try {
            const apiPayload = {
                ...currentRequest,
                date: toGregorian(currentRequest.date),
                status: 'PENDING',
                createdAt: new Date().toLocaleDateString('fa-IR'),
            };
            await overtimeService.create(apiPayload as any);
            setToast({ message: 'درخواست اضافه کاری با موفقیت ثبت شد', type: 'success' });
            setIsModalOpen(false);
            fetchAllData();
        } catch (error) {
            setToast({ message: 'خطا در ثبت درخواست اضافه کاری', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('آیا مایل به حذف این درخواست اضافه کاری هستید؟')) {
            try {
                await overtimeService.delete(id);
                setToast({ message: 'درخواست اضافه کاری حذف شد', type: 'success' });
                fetchAllData();
            } catch (error) {
                setToast({ message: 'خطا در حذف درخواست', type: 'error' });
            }
        }
    };

    const updateStatus = async (request: OvertimeRequest, status: OvertimeStatus) => {
        try {
            await overtimeService.update({ ...request, status });
            setToast({ message: 'وضعیت درخواست تغییر یافت', type: 'success' });
            fetchAllData();
        } catch (error) {
            setToast({ message: 'خطا در تغییر وضعیت درخواست', type: 'error' });
        }
    };

    const filteredRequests = useMemo(() => {
        if (viewMode === 'ALL_REQUESTS' && currentUserProfile.isAdmin === 1) {
            return requests;
        }
        return requests.filter(req => req.requesterName === currentUserProfile.full_name);
    }, [requests, viewMode, currentUserProfile]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="overtime-page-container">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">درخواست و وضعیت اضافه کاری ها</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">مدیریت هماهنگی و درخواست‌های کارکرد اضافه کاری پرسنل</p>
                    </div>
                </div>
                <button 
                    onClick={() => { 
                        setCurrentRequest({ 
                            hours: 1, 
                            status: 'PENDING', 
                            requesterName: currentUserProfile.full_name || '',
                            date: new Date().toLocaleDateString('fa-IR')
                        }); 
                        setIsModalOpen(true); 
                    }} 
                    className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 flex items-center gap-2 font-bold transition-all shadow-md shadow-amber-500/20"
                    id="new-overtime-request-btn"
                >
                    <PlusIcon /> <span>ثبت درخواست جدید</span>
                </button>
            </div>
            
            <div className="mb-6 flex items-center border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setViewMode('MY_REQUESTS')}
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                        viewMode === 'MY_REQUESTS'
                            ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    درخواست‌های من
                </button>
                {currentUserProfile.isAdmin === 1 && (
                    <button
                        onClick={() => setViewMode('ALL_REQUESTS')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                            viewMode === 'ALL_REQUESTS'
                                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        همه درخواست‌ها
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Spinner /></div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                                <tr>
                                    {viewMode === 'ALL_REQUESTS' && <th className="p-4">نام همکار</th>}
                                    <th className="p-4">تاریخ کارکرد</th>
                                    <th className="p-4">مدت زمان (ساعت)</th>
                                    <th className="p-4">شرح کارکرد / علت</th>
                                    <th className="p-4">وضعیت</th>
                                    <th className="p-4">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs sm:text-sm">
                                {filteredRequests.map(req => {
                                    const canManage = currentUserProfile.isAdmin === 1 && viewMode === 'ALL_REQUESTS';
                                    const isOwner = req.requesterName === currentUserProfile.full_name;
                                    const canDelete = currentUserProfile.isAdmin === 1 || (isOwner && req.status === 'PENDING');
                                    
                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-800 dark:text-slate-200">
                                            {viewMode === 'ALL_REQUESTS' && <td className="p-4 font-bold text-slate-900 dark:text-white">{req.requesterName}</td>}
                                            <td className="p-4 font-mono font-bold">{toJalali(req.date)}</td>
                                            <td className="p-4 font-bold text-amber-600 dark:text-amber-400">{req.hours} ساعت</td>
                                            <td className="p-4 max-w-sm truncate text-slate-600 dark:text-slate-300" title={req.reason}>{req.reason}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                                    req.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                }`}>
                                                    {req.status === 'APPROVED' ? 'تایید شده' : req.status === 'REJECTED' ? 'رد شده' : 'در انتظار تایید'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {canManage && req.status === 'PENDING' && (
                                                        <>
                                                            <button 
                                                                onClick={() => updateStatus(req, 'APPROVED')} 
                                                                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 font-bold transition-all shadow-sm"
                                                            >
                                                                تایید
                                                            </button>
                                                            <button 
                                                                onClick={() => updateStatus(req, 'REJECTED')} 
                                                                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 font-bold transition-all shadow-sm"
                                                            >
                                                                رد
                                                            </button>
                                                        </>
                                                    )}
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => handleDelete(req.id)} 
                                                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                            title="حذف درخواست"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredRequests.length === 0 && (
                                    <tr>
                                        <td colSpan={viewMode === 'ALL_REQUESTS' ? 6 : 5} className="p-8 text-center text-slate-400 font-bold">
                                            هیچ درخواست اضافه کاری یافت نشد.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b pb-3 dark:border-slate-700">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                <span>ثبت درخواست اضافه کاری</span>
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}><CloseIcon className="text-slate-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-bold">نام متقاضی</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-500 font-bold" 
                                    value={currentRequest.requesterName || ''} 
                                    disabled
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-bold">تاریخ اضافه کاری</label>
                                <div className="relative">
                                    <PersianDatePicker 
                                        value={currentRequest.date || ''} 
                                        onChange={val => setCurrentRequest({...currentRequest, date: val})} 
                                        placeholder="تاریخ اضافه کاری"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-bold">میزان کارکرد (به ساعت)</label>
                                <input 
                                    type="number" 
                                    step="0.5" 
                                    min="0.5"
                                    placeholder="مثال: 2.5" 
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-bold" 
                                    value={currentRequest.hours || ''} 
                                    onChange={e => setCurrentRequest({...currentRequest, hours: Number(e.target.value)})} 
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-bold">توضیحات / شرح کارکرد</label>
                                <textarea 
                                    placeholder="شرح فعالیت‌های انجام شده در ساعات اضافه بر سازمان..." 
                                    rows={3} 
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-xs" 
                                    value={currentRequest.reason || ''} 
                                    onChange={e => setCurrentRequest({...currentRequest, reason: e.target.value})}
                                ></textarea>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700 font-bold">انصراف</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-md shadow-amber-500/20">ثبت درخواست</button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default OvertimePage;
