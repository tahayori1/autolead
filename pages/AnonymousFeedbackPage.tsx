
import React, { useState, useEffect } from 'react';
import type { AnonymousFeedback, MyProfile } from '../types';
import { anonymousSuggestionsService, getMyProfile } from '../services/api';
import { SpeakerphoneIcon } from '../components/icons/SpeakerphoneIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

const AnonymousFeedbackPage: React.FC = () => {
    // viewMode state
    const [viewMode, setViewMode] = useState<'SUBMIT' | 'LIST'>('SUBMIT'); 
    
    // Data states
    const [feedbacks, setFeedbacks] = useState<AnonymousFeedback[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Admin check
    const [isAdmin, setIsAdmin] = useState(false);
    
    // Form states
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const profile = await getMyProfile();
                // FIX: Check for a non-optional property like 'id' to safely narrow the type from `MyProfile | {}` to `MyProfile`.
                // This resolves issues with using the 'in' operator on a union type including `{}`.
                // The comparison `profile.isAdmin === 1` is correct as `isAdmin` is `0 | 1`.
                if (profile && 'id' in profile && profile.isAdmin === 1) {
                    setIsAdmin(true);
                }
            } catch (e) {
                // Silently ignore failures, defaults to false (secure)
            }
        };
        checkAdmin();
    }, []);

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const data = await anonymousSuggestionsService.getAll();
            setFeedbacks(data);
        } catch (error) {
            setToast({ message: 'خطا در بارگذاری پیام‌ها', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'LIST') {
            fetchFeedbacks();
        }
    }, [viewMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;

        setLoading(true);
        try {
            await anonymousSuggestionsService.create({
                subject,
                message,
                createdAt: new Date().toLocaleDateString('fa-IR'),
                isRead: false
            });
            setSubject('');
            setMessage('');
            setToast({ message: 'پیام شما به صورت کاملا ناشناس ثبت شد', type: 'success' });
        } catch (error) {
            setToast({ message: 'خطا در ارسال پیام', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('حذف شود؟')) {
            try {
                await anonymousSuggestionsService.delete(id);
                setFeedbacks(prev => prev.filter(f => f.id !== id));
            } catch (error) {
                setToast({ message: 'خطا در حذف پیام', type: 'error' });
            }
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl text-purple-600 dark:text-purple-300">
                            <SpeakerphoneIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">صدای کارمندان</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">ارسال انتقاد و پیشنهاد (کاملا ناشناس)</p>
                        </div>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                        <button onClick={() => setViewMode('SUBMIT')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === 'SUBMIT' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>ثبت پیام</button>
                        {isAdmin && (
                            <button onClick={() => setViewMode('LIST')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${viewMode === 'LIST' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>صندوق ورودی (مدیر)</button>
                        )}
                    </div>
                </div>
            </div>

            {viewMode === 'SUBMIT' ? (
                <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                    <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl text-purple-800 dark:text-purple-200 text-sm leading-relaxed">
                        <strong className="block mb-1 text-base">همکار گرامی،</strong>
                        پیام شما بدون ثبت هیچگونه نام، شماره یا نشانی IP ذخیره می‌شود و مستقیماً به دست مدیریت می‌رسد. با خیال راحت نظرات خود را بیان کنید.
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">موضوع</label>
                            <input 
                                type="text" 
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="مثلا: مشکل تجهیزات، پیشنهاد بهبود فرآیند..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">متن پیام</label>
                            <textarea 
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={6}
                                placeholder="توضیحات خود را اینجا بنویسید..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                disabled={loading}
                            ></textarea>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-transform active:scale-95 shadow-lg shadow-purple-200 dark:shadow-none flex items-center justify-center">
                            {loading ? <Spinner /> : 'ارسال پیام ناشناس'}
                        </button>
                    </form>
                </div>
            ) : (
                <div>
                    {loading ? (
                        <div className="flex justify-center p-8"><Spinner /></div>
                    ) : (
                        <div className="grid gap-4">
                            {feedbacks.length === 0 ? (
                                <p className="text-center text-slate-400 py-10">صندوق پیام خالی است.</p>
                            ) : (
                                feedbacks.map(feedback => (
                                    <div key={feedback.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border-r-4 border-purple-500 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{feedback.subject}</h3>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-400 font-mono">{feedback.createdAt}</span>
                                                <button onClick={() => handleDelete(feedback.id)} className="text-slate-400 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{feedback.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AnonymousFeedbackPage;
