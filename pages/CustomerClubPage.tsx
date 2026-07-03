
import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, updateUser } from '../services/api';
import { User, CustomerSegment } from '../types';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import Pagination from '../components/Pagination';
import { BadgeIcon } from '../components/icons/BadgeIcon';
import { StarIcon } from '../components/icons/StarIcon';
import { TagIcon } from '../components/icons/TagIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import { UsersIcon } from '../components/icons/UsersIcon';

const ITEMS_PER_PAGE = 36;

// --- Mappings ---
const SEGMENT_STYLES: Record<CustomerSegment, { bg: string, text: string, border: string, icon: string }> = {
    [CustomerSegment.REGULAR]: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: '👤' },
    [CustomerSegment.INVESTOR]: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', icon: '💰' },
    [CustomerSegment.POLITICAL]: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', icon: '⚖️' },
    [CustomerSegment.FRIEND]: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300', icon: '❤️' },
    [CustomerSegment.VIP]: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', icon: '💎' },
    [CustomerSegment.OCCUPATIONAL]: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', icon: '🏢' },
};

const CustomerClubPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Edit Modal State
    const [editSegment, setEditSegment] = useState<CustomerSegment>(CustomerSegment.REGULAR);
    const [editScore, setEditScore] = useState<number>(0);
    const [editTags, setEditTags] = useState<string[]>([]);
    const [newTagInput, setNewTagInput] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            setToast({ message: 'خطا در دریافت لیست مشتریان', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedSegment, searchQuery]);

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setEditSegment(user.segment || CustomerSegment.REGULAR);
        setEditScore(user.behaviorScore || 0);
        setEditTags(user.tags || []);
        setIsEditModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingUser) return;

        try {
            const updatedUser: User = {
                ...editingUser,
                segment: editSegment,
                behaviorScore: editScore,
                tags: editTags
            };
            
            await updateUser(editingUser.id, updatedUser);
            
            setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
            setToast({ message: 'اطلاعات باشگاه مشتری به‌روزرسانی شد', type: 'success' });
            setIsEditModalOpen(false);
        } catch (error) {
            setToast({ message: 'خطا در ذخیره اطلاعات', type: 'error' });
        }
    };

    const handleAddTag = () => {
        if (newTagInput.trim() && !editTags.includes(newTagInput.trim())) {
            setEditTags([...editTags, newTagInput.trim()]);
            setNewTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setEditTags(editTags.filter(t => t !== tagToRemove));
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSegment = selectedSegment === 'ALL' || (user.segment || CustomerSegment.REGULAR) === selectedSegment;
            const matchesSearch = !searchQuery || 
                user.FullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                user.Number.includes(searchQuery);
            return matchesSegment && matchesSearch;
        });
    }, [users, selectedSegment, searchQuery]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    const stats = useMemo(() => {
        const counts: Record<string, number> = {};
        Object.values(CustomerSegment).forEach(seg => counts[seg] = 0);
        counts['REGULAR'] = 0; // Default bucket

        users.forEach(user => {
            const seg = user.segment || CustomerSegment.REGULAR;
            if (counts[seg] !== undefined) counts[seg]++;
        });
        return counts;
    }, [users]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl text-white shadow-lg shadow-orange-200 dark:shadow-none">
                        <BadgeIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">باشگاه مشتریان</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">دسته‌بندی، امتیازدهی و مدیریت ویژه مشتریان</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                    <button 
                        onClick={() => setSelectedSegment('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${selectedSegment === 'ALL' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        همه ({users.length})
                    </button>
                    {Object.values(CustomerSegment).map(seg => (
                        <button
                            key={seg}
                            onClick={() => setSelectedSegment(seg)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1 ${selectedSegment === seg ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <span>{SEGMENT_STYLES[seg].icon}</span>
                            {seg} 
                            <span className="text-xs opacity-70">({stats[seg]})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="جستجوی نام یا شماره تماس..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-400 outline-none transition-all text-slate-700 dark:text-slate-200"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center p-12"><Spinner /></div>
            ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {paginatedUsers.map(user => {
                            const segment = user.segment || CustomerSegment.REGULAR;
                            const style = SEGMENT_STYLES[segment];
                            
                            return (
                                <div key={user.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all relative group overflow-hidden ${selectedSegment === segment ? 'ring-2 ring-offset-2 ring-orange-400 dark:ring-offset-slate-900' : 'border-slate-200 dark:border-slate-700'}`}>
                                    {/* Segment Banner */}
                                    <div className={`absolute top-0 right-0 left-0 h-1.5 ${style.bg.replace('100', '500')}`}></div>
                                    
                                    <div className="flex justify-between items-start mt-2 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${style.bg}`}>
                                                {style.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{user.FullName}</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user.Number}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}>
                                            {segment}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Score */}
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">امتیاز رفتار:</span>
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <StarIcon key={star} className={`w-4 h-4 ${star <= (user.behaviorScore || 0) ? 'text-amber-400 fill-current' : 'text-slate-300 dark:text-slate-600'}`} filled={star <= (user.behaviorScore || 0)} />
                                                ))}
                                            </div>
                                            {user.behaviorScore ? <span className="text-xs font-bold text-amber-500">({user.behaviorScore}/5)</span> : <span className="text-xs text-slate-400">(ثبت نشده)</span>}
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1 min-h-[28px]">
                                            {user.tags && user.tags.length > 0 ? (
                                                user.tags.map((tag, i) => (
                                                    <span key={i} className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                                                        <TagIcon className="w-3 h-3 opacity-50" />
                                                        {tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">بدون برچسب</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                        <button 
                                            onClick={() => handleEditClick(user)}
                                            className="text-sm font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 hover:bg-sky-50 dark:hover:bg-sky-900/30 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            مدیریت پروفایل باشگاه
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {paginatedUsers.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                                <UsersIcon className="w-16 h-16 opacity-20 mb-4" />
                                <p>مشتری با این مشخصات یافت نشد.</p>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center mt-8">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={filteredUsers.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800 dark:text-white">{editingUser.FullName}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">مدیریت وضعیت باشگاه مشتریان</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                <CloseIcon className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* Segment Selector */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">دسته مشتری</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.values(CustomerSegment).map(seg => (
                                        <button
                                            key={seg}
                                            onClick={() => setEditSegment(seg)}
                                            className={`p-3 rounded-xl border text-right transition-all flex items-center gap-2 ${
                                                editSegment === seg 
                                                ? `ring-2 ring-offset-1 ${SEGMENT_STYLES[seg].border.replace('300', '500')} bg-white dark:bg-slate-700 ring-offset-white dark:ring-offset-slate-800` 
                                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <span className="text-xl">{SEGMENT_STYLES[seg].icon}</span>
                                            <span className={`text-sm font-medium ${editSegment === seg ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{seg}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Score Selector */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">امتیاز رفتار و اخلاق</label>
                                <div className="flex justify-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button 
                                            key={star} 
                                            onClick={() => setEditScore(star)}
                                            className="transform hover:scale-125 transition-transform p-1"
                                        >
                                            <StarIcon className={`w-8 h-8 ${star <= editScore ? 'text-amber-400 fill-current' : 'text-slate-300 dark:text-slate-600'}`} filled={star <= editScore} />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-center text-xs text-slate-400 mt-2">
                                    {editScore === 0 ? 'بدون امتیاز' : editScore === 5 ? 'عالی' : editScore >= 3 ? 'خوب' : 'نیاز به توجه'}
                                </p>
                            </div>

                            {/* Tags Input */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">برچسب‌ها (ویژگی‌ها)</label>
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        type="text" 
                                        value={newTagInput}
                                        onChange={e => setNewTagInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                        placeholder="تگ جدید (مثلا: خوش‌حساب)..."
                                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                                    />
                                    <button onClick={handleAddTag} className="bg-sky-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-sky-700">افزودن</button>
                                </div>
                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl min-h-[60px] border border-slate-200 dark:border-slate-700">
                                    {editTags.map((tag, i) => (
                                        <span key={i} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600 text-sm flex items-center gap-2">
                                            {tag}
                                            <button onClick={() => removeTag(tag)} className="text-red-400 hover:text-red-600"><CloseIcon className="w-4 h-4" /></button>
                                        </span>
                                    ))}
                                    {editTags.length === 0 && <span className="text-slate-400 text-sm self-center">هنوز برچسبی اضافه نشده است.</span>}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">انصراف</button>
                            <button onClick={handleSave} className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-orange-200 dark:shadow-none">ذخیره تغییرات</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CustomerClubPage;
