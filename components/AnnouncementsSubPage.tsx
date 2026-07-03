import React, { useState, useEffect } from 'react';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../services/api';
import { Announcement } from '../types';
import Spinner from './Spinner';
import Toast from './Toast';
import { Bell, AlertTriangle, Info, Plus, Trash2 } from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

const AnnouncementsSubPage: React.FC<{ loggedInUser: any }> = ({ loggedInUser }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'NEWS' | 'ALERT' | 'SYSTEM'>('NEWS');
    const [isUrgent, setIsUrgent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null);

    const isAdmin = loggedInUser?.role === 'ADMIN' || loggedInUser?.role === 'MANAGER';

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await getAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error("Failed to load announcements");
            setToast({ message: 'خطا در دریافت اطلاعات', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setIsSubmitting(true);
        try {
            await createAnnouncement({
                title,
                content,
                category,
                isUrgent,
                author: loggedInUser?.full_name || loggedInUser?.username || 'مدیریت',
            });
            setToast({ message: 'اطلاعیه با موفقیت ثبت شد', type: 'success' });
            setIsFormOpen(false);
            setTitle('');
            setContent('');
            setIsUrgent(false);
            setCategory('NEWS');
            fetchAnnouncements();
        } catch (error) {
            setToast({ message: 'خطا در ثبت اطلاعیه', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const confirmDelete = async () => {
        if (!announcementToDelete) return;
        try {
            await deleteAnnouncement(announcementToDelete);
            setToast({ message: 'اطلاعیه حذف شد', type: 'success' });
            fetchAnnouncements();
        } catch (error) {
            setToast({ message: 'خطا در حذف اطلاعیه', type: 'error' });
        } finally {
            setDeleteModalOpen(false);
            setAnnouncementToDelete(null);
        }
    };

    const getCategoryIcon = (cat: string, urgent: boolean) => {
        if (urgent) return <AlertTriangle className="w-5 h-5 text-red-500" />;
        switch (cat) {
            case 'ALERT': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'SYSTEM': return <Info className="w-5 h-5 text-sky-500" />;
            default: return <Bell className="w-5 h-5 text-indigo-500" />;
        }
    };

    const getCategoryStyles = (cat: string) => {
        switch (cat) {
            case 'ALERT': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'SYSTEM': return 'bg-sky-50 text-sky-700 border-sky-200';
            default: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        }
    };

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'ALERT': return 'هشدار مهم';
            case 'SYSTEM': return 'سیستمی';
            default: return 'خبر داخلی';
        }
    };

    if (loading) return <div className="py-20 flex justify-center"><Spinner /></div>;

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {isAdmin && (
                <div className="flex justify-end">
                    <button 
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors"
                    >
                        {isFormOpen ? 'انصراف' : <> <Plus className="w-4 h-4" /> ثبت اطلاعیه جدید </>}
                    </button>
                </div>
            )}

            {isFormOpen && isAdmin && (
                <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4 animate-fade-in shadow-inner">
                    <h3 className="font-bold text-slate-800 mb-4">ایجاد اطلاعیه جدید</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">عنوان پیام</label>
                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg text-sm"
                                required 
                            />
                        </div>
                        <div className="flex items-end gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">دسته‌بندی</label>
                                <select 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg text-sm"
                                >
                                    <option value="NEWS">خبر داخلی</option>
                                    <option value="ALERT">هشدار و دستورالعمل</option>
                                    <option value="SYSTEM">اطلاعیه سیستمی</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 mb-2 cursor-pointer bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-200">
                                <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="rounded text-red-600" />
                                <span className="text-sm font-bold">فوری!</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">متن کامل اطلاعیه</label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg text-sm min-h-[120px] resize-y"
                            required
                        ></textarea>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold opacity-90 hover:opacity-100 disabled:opacity-50">
                            {isSubmitting ? 'در حال ثبت...' : 'انتشار در تابلو اعلانات'}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {announcements.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400">
                        <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>هیچ اطلاعیه‌ای یافت نشد.</p>
                    </div>
                ) : (
                    announcements.map((ann) => (
                        <div key={ann.id} className={`bg-white rounded-2xl shadow-sm border ${ann.isUrgent ? 'border-red-500 shadow-red-100' : 'border-slate-200'} p-5 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow`}>
                            {ann.isUrgent && <div className="absolute top-0 right-0 left-0 h-1 bg-red-500"></div>}
                            
                            <div className="flex justify-between items-start mb-3">
                                <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${ann.isUrgent ? 'bg-red-50 text-red-700 border-red-200' : getCategoryStyles(ann.category)}`}>
                                    {getCategoryIcon(ann.category, ann.isUrgent)}
                                    {ann.isUrgent ? 'فوری و مهم' : getCategoryLabel(ann.category)}
                                </div>
                                
                                {isAdmin && (
                                    <button onClick={() => { setAnnouncementToDelete(ann.id); setDeleteModalOpen(true); }} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            <h4 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2">{ann.title}</h4>
                            <p className="text-slate-600 text-sm mb-6 flex-grow whitespace-pre-wrap">{ann.content}</p>
                            
                            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                                <span>ثبت توسط: <b>{ann.author}</b></span>
                                <span>{ann.createdAt.split(' ')[0]}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {deleteModalOpen && (
                <DeleteConfirmModal 
                    title="حذف اطلاعیه"
                    message="آیا از حذف این اطلاعیه اطمینان دارید؟"
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                />
            )}
        </div>
    );
};

export default AnnouncementsSubPage;
