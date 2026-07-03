
import React, { useState, useEffect } from 'react';
import type { CorrectiveAction } from '../types';
import { correctiveActionsService } from '../services/api';
import { ClipboardCheckIcon } from '../components/icons/ClipboardCheckIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

const CorrectiveActionsPage: React.FC = () => {
    const [actions, setActions] = useState<CorrectiveAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAction, setCurrentAction] = useState<Partial<CorrectiveAction>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchActions = async () => {
        setLoading(true);
        try {
            const data = await correctiveActionsService.getAll();
            setActions(data);
        } catch (error) {
            setToast({ message: 'خطا در دریافت اطلاعات', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActions();
    }, []);

    const handleSave = async () => {
        if (!currentAction.title || !currentAction.responsiblePerson) {
            setToast({ message: 'عنوان و مسئول اجرا الزامی است', type: 'error' });
            return;
        }

        try {
            if (currentAction.id) {
                await correctiveActionsService.update(currentAction as CorrectiveAction);
                setToast({ message: 'اقدام اصلاحی ویرایش شد', type: 'success' });
            } else {
                await correctiveActionsService.create({
                    ...currentAction,
                    isCompleted: false,
                    createdAt: new Date().toLocaleDateString('fa-IR'),
                });
                setToast({ message: 'اقدام اصلاحی جدید ثبت شد', type: 'success' });
            }
            setIsModalOpen(false);
            fetchActions();
        } catch (error) {
            setToast({ message: 'خطا در ذخیره اطلاعات', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('آیا از حذف این مورد اطمینان دارید؟')) {
            try {
                await correctiveActionsService.delete(id);
                setToast({ message: 'حذف شد', type: 'success' });
                fetchActions();
            } catch (error) {
                setToast({ message: 'خطا در حذف', type: 'error' });
            }
        }
    };

    const toggleStatus = async (action: CorrectiveAction) => {
        try {
            await correctiveActionsService.update({ ...action, isCompleted: !action.isCompleted });
            fetchActions();
        } catch (error) {
            setToast({ message: 'خطا در تغییر وضعیت', type: 'error' });
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl text-indigo-600 dark:text-indigo-300">
                        <ClipboardCheckIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">اقدامات اصلاحی</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">پیگیری عدم انطباق‌ها و بهبود مستمر</p>
                    </div>
                </div>
                <button onClick={() => { setCurrentAction({}); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                    <PlusIcon /> <span className="hidden sm:inline">اقدام جدید</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Spinner /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {actions.map(action => (
                        <div key={action.id} className={`bg-white dark:bg-slate-800 rounded-xl border p-5 shadow-sm transition-all ${action.isCompleted ? 'border-green-200 dark:border-green-900 opacity-80' : 'border-slate-200 dark:border-slate-700'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <h3 className={`font-bold text-lg ${action.isCompleted ? 'text-green-700 dark:text-green-400 line-through' : 'text-slate-800 dark:text-white'}`}>{action.title}</h3>
                                <button onClick={() => toggleStatus(action)} className={`px-2 py-1 rounded text-xs font-bold ${action.isCompleted ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {action.isCompleted ? 'انجام شده' : 'در جریان'}
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 h-16 overflow-y-auto">{action.description}</p>
                            
                            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                                <div className="flex justify-between"><span>مسئول:</span> <span className="font-bold">{action.responsiblePerson}</span></div>
                                <div className="flex justify-between"><span>مهلت:</span> <span className="font-mono">{action.dueDate}</span></div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <button onClick={() => { setCurrentAction(action); setIsModalOpen(true); }} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg"><EditIcon /></button>
                                <button onClick={() => handleDelete(action.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon /></button>
                            </div>
                        </div>
                    ))}
                    {actions.length === 0 && <div className="col-span-full text-center text-slate-400">موردی یافت نشد.</div>}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b pb-3 dark:border-slate-700">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{currentAction.id ? 'ویرایش اقدام' : 'تعریف اقدام اصلاحی جدید'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><CloseIcon className="text-slate-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <input type="text" placeholder="عنوان عدم انطباق / مشکل" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentAction.title || ''} onChange={e => setCurrentAction({...currentAction, title: e.target.value})} />
                            <textarea placeholder="شرح کامل موضوع" rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentAction.description || ''} onChange={e => setCurrentAction({...currentAction, description: e.target.value})}></textarea>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="مسئول اجرا" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentAction.responsiblePerson || ''} onChange={e => setCurrentAction({...currentAction, responsiblePerson: e.target.value})} />
                                <input type="text" placeholder="مهلت اقدام (1403/xx/xx)" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-left" dir="ltr" value={currentAction.dueDate || ''} onChange={e => setCurrentAction({...currentAction, dueDate: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700">انصراف</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">ذخیره</button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CorrectiveActionsPage;
