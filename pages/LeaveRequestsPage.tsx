
import React, { useState, useEffect, useMemo } from 'react';
import type { LeaveRequest, MyProfile, LeaveStatus } from '../types';
import { leaveRequestsService, getMyProfile } from '../services/api';
import { UserMinusIcon } from '../components/icons/UserMinusIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

const LeaveRequestsPage: React.FC = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<Partial<LeaveRequest>>({ type: 'DAILY', status: 'PENDING' });
    const [currentUserProfile, setCurrentUserProfile] = useState<Partial<MyProfile>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [viewMode, setViewMode] = useState<'MY_REQUESTS' | 'ALL_REQUESTS'>('MY_REQUESTS');

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

    const handleSave = async () => {
        if (!currentRequest.requesterName || !currentRequest.startDate || !currentRequest.reason) {
            setToast({ message: 'اطلاعات ناقص است', type: 'error' });
            return;
        }

        try {
            await leaveRequestsService.create({
                ...currentRequest,
                status: 'PENDING',
                createdAt: new Date().toLocaleDateString('fa-IR'),
            });
            setToast({ message: 'درخواست مرخصی ثبت شد', type: 'success' });
            setIsModalOpen(false);
            fetchAllData();
        } catch (error) {
            setToast({ message: 'خطا در ثبت درخواست', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('حذف شود؟')) {
            try {
                await leaveRequestsService.delete(id);
                setToast({ message: 'حذف شد', type: 'success' });
                fetchAllData();
            } catch (error) {
                setToast({ message: 'خطا در حذف درخواست', type: 'error' });
            }
        }
    };

    const updateStatus = async (request: LeaveRequest, status: 'APPROVED' | 'REJECTED') => {
        try {
            await leaveRequestsService.update({ ...request, status });
            fetchAllData();
        } catch (error) {
            setToast({ message: 'خطا در تغییر وضعیت', type: 'error' });
        }
    };

    const filteredRequests = useMemo(() => {
        if (viewMode === 'ALL_REQUESTS' && currentUserProfile.isAdmin === 1) {
            return requests;
        }
        return requests.filter(req => req.requesterName === currentUserProfile.full_name);
    }, [requests, viewMode, currentUserProfile]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-xl text-orange-600 dark:text-orange-300">
                        <UserMinusIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">درخواست‌های مرخصی</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">مدیریت مرخصی‌های روزانه و ساعتی</p>
                    </div>
                </div>
                <button onClick={() => { setCurrentRequest({ type: 'DAILY', status: 'PENDING', requesterName: currentUserProfile.full_name || '' }); setIsModalOpen(true); }} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2">
                    <PlusIcon /> <span className="hidden sm:inline">ثبت درخواست</span>
                </button>
            </div>
            
            <div className="mb-6 flex items-center border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setViewMode('MY_REQUESTS')}
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                        viewMode === 'MY_REQUESTS'
                            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
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
                                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
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
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                <tr>
                                    {viewMode === 'ALL_REQUESTS' && <th className="p-4">نام متقاضی</th>}
                                    <th className="p-4">نوع</th>
                                    <th className="p-4">زمان</th>
                                    <th className="p-4">علت</th>
                                    <th className="p-4">وضعیت</th>
                                    <th className="p-4">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredRequests.map(req => {
                                    const canManage = currentUserProfile.isAdmin === 1 && viewMode === 'ALL_REQUESTS';
                                    const isOwner = req.requesterName === currentUserProfile.full_name;
                                    const canDelete = currentUserProfile.isAdmin === 1 || (isOwner && req.status === 'PENDING');
                                    
                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-800 dark:text-slate-200">
                                            {viewMode === 'ALL_REQUESTS' && <td className="p-4 font-bold">{req.requesterName}</td>}
                                            <td className="p-4">{req.type === 'DAILY' ? 'روزانه' : 'ساعتی'}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono">{req.startDate}</span>
                                                    {req.type === 'DAILY' && req.endDate && <span className="text-xs text-slate-400 font-mono">تا {req.endDate}</span>}
                                                    {req.type === 'HOURLY' && <span className="text-xs text-slate-400 font-mono">{req.hours} ساعت</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 max-w-xs truncate">{req.reason}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    req.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                }`}>
                                                    {req.status === 'APPROVED' ? 'تایید شده' : req.status === 'REJECTED' ? 'رد شده' : 'در انتظار'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {canManage && req.status === 'PENDING' && (
                                                        <>
                                                            <button onClick={() => updateStatus(req, 'APPROVED')} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">تایید</button>
                                                            <button onClick={() => updateStatus(req, 'REJECTED')} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">رد</button>
                                                        </>
                                                    )}
                                                    {canDelete && (
                                                        <button onClick={() => handleDelete(req.id)} className="text-slate-400 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredRequests.length === 0 && (
                                    <tr><td colSpan={viewMode === 'ALL_REQUESTS' ? 6 : 5} className="p-8 text-center text-slate-400">هیچ درخواستی وجود ندارد.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b pb-3 dark:border-slate-700">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">درخواست مرخصی</h3>
                            <button onClick={() => setIsModalOpen(false)}><CloseIcon className="text-slate-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="نام متقاضی" 
                                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-500" 
                                value={currentRequest.requesterName || ''} 
                                onChange={e => setCurrentRequest({...currentRequest, requesterName: e.target.value})} 
                                disabled
                            />
                            
                            <div className="flex gap-4 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="type" checked={currentRequest.type === 'DAILY'} onChange={() => setCurrentRequest({...currentRequest, type: 'DAILY'})} />
                                    <span className="text-sm dark:text-white">روزانه</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="type" checked={currentRequest.type === 'HOURLY'} onChange={() => setCurrentRequest({...currentRequest, type: 'HOURLY'})} />
                                    <span className="text-sm dark:text-white">ساعتی</span>
                                </label>
                            </div>

                            <input type="text" placeholder="تاریخ شروع (1403/xx/xx)" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-left" dir="ltr" value={currentRequest.startDate || ''} onChange={e => setCurrentRequest({...currentRequest, startDate: e.target.value})} />
                            
                            {currentRequest.type === 'DAILY' ? (
                                <input type="text" placeholder="تاریخ پایان (1403/xx/xx)" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-left" dir="ltr" value={currentRequest.endDate || ''} onChange={e => setCurrentRequest({...currentRequest, endDate: e.target.value})} />
                            ) : (
                                <input type="number" placeholder="مدت (ساعت)" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRequest.hours || ''} onChange={e => setCurrentRequest({...currentRequest, hours: Number(e.target.value)})} />
                            )}

                            <textarea placeholder="علت مرخصی" rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRequest.reason || ''} onChange={e => setCurrentRequest({...currentRequest, reason: e.target.value})}></textarea>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700">انصراف</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">ثبت</button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default LeaveRequestsPage;
