
import React, { useState, useEffect } from 'react';
import type { MeetingMinute } from '../types';
import { meetingMinutesService } from '../services/api';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

const MeetingMinutesPage: React.FC = () => {
    const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMinute, setCurrentMinute] = useState<Partial<MeetingMinute>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchMinutes = async () => {
        setLoading(true);
        try {
            const data = await meetingMinutesService.getAll();
            setMinutes(data);
        } catch (error) {
            setToast({ message: 'خطا در دریافت اطلاعات', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMinutes();
    }, []);

    const handleSave = async () => {
        if (!currentMinute.title || !currentMinute.date) {
            setToast({ message: 'عنوان و تاریخ الزامی است', type: 'error' });
            return;
        }

        try {
            if (currentMinute.id) {
                await meetingMinutesService.update(currentMinute as MeetingMinute);
                setToast({ message: 'صورت‌جلسه ویرایش شد', type: 'success' });
            } else {
                await meetingMinutesService.create(currentMinute);
                setToast({ message: 'صورت‌جلسه جدید ثبت شد', type: 'success' });
            }
            setIsModalOpen(false);
            fetchMinutes();
        } catch (error) {
            setToast({ message: 'خطا در ذخیره اطلاعات', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('حذف شود؟')) {
            try {
                await meetingMinutesService.delete(id);
                setToast({ message: 'حذف شد', type: 'success' });
                fetchMinutes();
            } catch (error) {
                setToast({ message: 'خطا در حذف', type: 'error' });
            }
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-xl text-emerald-600 dark:text-emerald-300">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">صورت‌جلسات</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">آرشیو تصمیمات و جلسات اداری</p>
                    </div>
                </div>
                <button onClick={() => { setCurrentMinute({}); setIsModalOpen(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                    <PlusIcon /> <span className="hidden sm:inline">ثبت جلسه</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Spinner /></div>
            ) : (
                <div className="space-y-4">
                    {minutes.map(minute => (
                        <div key={minute.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{minute.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-mono">{minute.date}</span>
                                        <span>| حاضرین: {minute.attendees}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setCurrentMinute(minute); setIsModalOpen(true); }} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg"><EditIcon /></button>
                                    <button onClick={() => handleDelete(minute.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon /></button>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                <h4 className="text-xs font-bold text-slate-500 mb-2">مصوبات و تصمیمات:</h4>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{minute.decisions}</p>
                            </div>
                        </div>
                    ))}
                    {minutes.length === 0 && <div className="text-center text-slate-400 py-8">هیچ صورت‌جلسه‌ای ثبت نشده است.</div>}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b pb-3 dark:border-slate-700">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">ثبت صورت‌جلسه</h3>
                            <button onClick={() => setIsModalOpen(false)}><CloseIcon className="text-slate-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input type="text" placeholder="موضوع جلسه" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentMinute.title || ''} onChange={e => setCurrentMinute({...currentMinute, title: e.target.value})} />
                                <input type="text" placeholder="تاریخ (1403/xx/xx)" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-left" dir="ltr" value={currentMinute.date || ''} onChange={e => setCurrentMinute({...currentMinute, date: e.target.value})} />
                            </div>
                            <input type="text" placeholder="لیست حاضرین" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentMinute.attendees || ''} onChange={e => setCurrentMinute({...currentMinute, attendees: e.target.value})} />
                            <textarea placeholder="شرح مذاکرات و مصوبات" rows={6} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentMinute.decisions || ''} onChange={e => setCurrentMinute({...currentMinute, decisions: e.target.value})}></textarea>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700">انصراف</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">ذخیره</button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default MeetingMinutesPage;
