
import React, { useState, useEffect } from 'react';
import { getNotificationLogs, getMessageTemplates, saveMessageTemplate, deleteMessageTemplate, sendNotification } from '../services/api';
import type { NotificationLog, MessageTemplate, NotificationType } from '../types';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { ChatAltIcon } from '../components/icons/ChatAltIcon';
import { TemplateIcon } from '../components/icons/TemplateIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { SendIcon } from '../components/icons/SendIcon';
import { CloseIcon } from '../components/icons/CloseIcon';

const NotificationCenterPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'LOGS' | 'TEMPLATES'>('LOGS');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Data
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);

    // Modals
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

    // Send Form State
    const [sendForm, setSendForm] = useState({
        type: 'WHATSAPP' as NotificationType,
        recipientName: '',
        recipientNumber: '',
        message: ''
    });

    // Template Form State
    const [templateForm, setTemplateForm] = useState({
        title: '',
        content: '',
        category: 'عمومی'
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'LOGS') {
                const data = await getNotificationLogs();
                setLogs(data);
            } else {
                const data = await getMessageTemplates();
                setTemplates(data);
            }
        } catch (err) {
            setToast({ message: 'خطا در بارگذاری اطلاعات', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!sendForm.recipientNumber || !sendForm.message) {
            setToast({ message: 'شماره و متن پیام الزامی است', type: 'error' });
            return;
        }
        
        try {
            await sendNotification(sendForm.type, sendForm.recipientNumber, sendForm.recipientName || 'ناشناس', sendForm.message);
            setToast({ message: 'پیام در صف ارسال قرار گرفت', type: 'success' });
            setIsSendModalOpen(false);
            setSendForm({ type: 'WHATSAPP', recipientName: '', recipientNumber: '', message: '' });
            if (activeTab === 'LOGS') fetchData();
        } catch (err) {
            setToast({ message: 'خطا در ارسال پیام', type: 'error' });
        }
    };

    const handleSaveTemplate = async () => {
        if (!templateForm.title || !templateForm.content) {
            setToast({ message: 'عنوان و متن الزامی است', type: 'error' });
            return;
        }

        try {
            await saveMessageTemplate(templateForm);
            setToast({ message: 'پیام آماده ذخیره شد', type: 'success' });
            setIsTemplateModalOpen(false);
            setTemplateForm({ title: '', content: '', category: 'عمومی' });
            fetchData();
        } catch (err) {
            setToast({ message: 'خطا در ذخیره قالب', type: 'error' });
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (window.confirm('آیا از حذف این پیام آماده اطمینان دارید؟')) {
            try {
                await deleteMessageTemplate(id);
                setToast({ message: 'قالب حذف شد', type: 'success' });
                fetchData();
            } catch (err) {
                setToast({ message: 'خطا در حذف', type: 'error' });
            }
        }
    };

    const applyTemplate = (content: string) => {
        setSendForm(prev => ({ ...prev, message: content }));
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl text-indigo-600 dark:text-indigo-300">
                        <ChatAltIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">مرکز اطلاع‌رسانی</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">مدیریت پیامک‌ها و پیام‌های واتساپ</p>
                    </div>
                </div>
                
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('LOGS')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'LOGS' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <ChatAltIcon className="w-4 h-4" />
                        تاریخچه پیام‌ها
                    </button>
                    <button 
                        onClick={() => setActiveTab('TEMPLATES')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'TEMPLATES' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <TemplateIcon className="w-4 h-4" />
                        پیام‌های آماده
                    </button>
                </div>
            </div>

            <div className="mb-6 flex justify-end">
                {activeTab === 'LOGS' ? (
                    <button onClick={() => setIsSendModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-bold shadow-md shadow-indigo-200 dark:shadow-none">
                        <SendIcon className="w-4 h-4" /> ارسال پیام جدید
                    </button>
                ) : (
                    <button onClick={() => setIsTemplateModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-bold shadow-md shadow-emerald-200 dark:shadow-none">
                        <PlusIcon className="w-4 h-4" /> تعریف پیام جدید
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Spinner /></div>
            ) : activeTab === 'LOGS' ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    {logs.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">هیچ پیامی یافت نشد.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th className="p-4">گیرنده</th>
                                        <th className="p-4">نوع</th>
                                        <th className="p-4">متن پیام</th>
                                        <th className="p-4">وضعیت</th>
                                        <th className="p-4">زمان ارسال</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800 dark:text-white">{log.recipientName}</div>
                                                <div className="text-xs text-slate-500 font-mono">{log.recipientNumber}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${log.type === 'WHATSAPP' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {log.type === 'WHATSAPP' ? 'واتساپ' : 'پیامک'}
                                                </span>
                                            </td>
                                            <td className="p-4 max-w-xs truncate text-slate-600 dark:text-slate-300" title={log.message}>
                                                {log.message}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    log.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' : 
                                                    log.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {log.status === 'SENT' ? 'ارسال شده' : log.status === 'FAILED' ? 'خطا' : 'در صف'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                                                {log.sentAt}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tmpl => (
                        <div key={tmpl.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-slate-800 dark:text-white">{tmpl.title}</h3>
                                <button onClick={() => handleDeleteTemplate(tmpl.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 mb-3 h-24 overflow-y-auto whitespace-pre-wrap">
                                {tmpl.content}
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800">
                                    {tmpl.category}
                                </span>
                                <span className="text-slate-400">{tmpl.createdAt}</span>
                            </div>
                        </div>
                    ))}
                    {templates.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                            هنوز پیام آماده‌ای تعریف نشده است.
                        </div>
                    )}
                </div>
            )}

            {/* Send Message Modal */}
            {isSendModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsSendModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <SendIcon className="w-5 h-5 text-indigo-600" />
                                ارسال پیام جدید
                            </h3>
                            <button onClick={() => setIsSendModalOpen(false)}><CloseIcon className="text-slate-500" /></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <button 
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${sendForm.type === 'WHATSAPP' ? 'bg-white dark:bg-slate-600 shadow text-green-600 dark:text-green-400' : 'text-slate-500'}`}
                                    onClick={() => setSendForm({...sendForm, type: 'WHATSAPP'})}
                                >
                                    واتساپ
                                </button>
                                <button 
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${sendForm.type === 'SMS' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                                    onClick={() => setSendForm({...sendForm, type: 'SMS'})}
                                >
                                    پیامک
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    type="text" 
                                    placeholder="نام گیرنده (اختیاری)" 
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={sendForm.recipientName}
                                    onChange={e => setSendForm({...sendForm, recipientName: e.target.value})}
                                />
                                <input 
                                    type="tel" 
                                    placeholder="شماره موبایل" 
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono"
                                    dir="ltr"
                                    value={sendForm.recipientNumber}
                                    onChange={e => setSendForm({...sendForm, recipientNumber: e.target.value})}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">متن پیام</label>
                                    <select 
                                        className="text-xs border rounded px-2 py-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const tmpl = templates.find(t => t.id === e.target.value);
                                                if (tmpl) applyTemplate(tmpl.content);
                                            }
                                        }}
                                    >
                                        <option value="">انتخاب از آماده‌ها...</option>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                    </select>
                                </div>
                                <textarea 
                                    rows={5} 
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="متن پیام خود را بنویسید..."
                                    value={sendForm.message}
                                    onChange={e => setSendForm({...sendForm, message: e.target.value})}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-slate-700">
                            <button onClick={() => setIsSendModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700">انصراف</button>
                            <button onClick={handleSend} className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">ارسال</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {isTemplateModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsTemplateModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <TemplateIcon className="w-5 h-5 text-emerald-600" />
                                تعریف پیام آماده
                            </h3>
                            <button onClick={() => setIsTemplateModalOpen(false)}><CloseIcon className="text-slate-500" /></button>
                        </div>
                        
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="عنوان قالب (مثلاً: تبریک تولد)" 
                                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={templateForm.title}
                                onChange={e => setTemplateForm({...templateForm, title: e.target.value})}
                            />
                            <input 
                                type="text" 
                                placeholder="دسته‌بندی (مثلاً: پیگیری)" 
                                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={templateForm.category}
                                onChange={e => setTemplateForm({...templateForm, category: e.target.value})}
                            />
                            <textarea 
                                rows={5} 
                                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder="متن پیام را اینجا وارد کنید..."
                                value={templateForm.content}
                                onChange={e => setTemplateForm({...templateForm, content: e.target.value})}
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-slate-700">
                            <button onClick={() => setIsTemplateModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700">انصراف</button>
                            <button onClick={handleSaveTemplate} className="px-8 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none">ذخیره</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default NotificationCenterPage;
