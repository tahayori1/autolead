
import React, { useState, useEffect } from 'react';
import { getStaffUsers, saveStaffUser, deleteStaffUser, hashPassword, getUserProfileById, updateUserProfileAsAdmin } from '../services/api';
import type { StaffUser, Permission, MyProfile } from '../types';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import PermissionMatrix from '../components/PermissionMatrix';
import { PlusIcon } from '../components/icons/PlusIcon';
import { SecurityIcon } from '../components/icons/SecurityIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { CloseIcon } from '../components/icons/CloseIcon';

// FIX: Redefined ModalUser to correctly handle both numeric IDs for existing users and string IDs for new users.
type ModalUser = Omit<Partial<StaffUser & MyProfile>, 'id'> & { id?: number | string };

const AccessControlPage: React.FC = () => {
    const [users, setUsers] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<ModalUser>({});
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [modalTab, setModalTab] = useState<'profile' | 'access' | 'security'>('profile');
    
    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{id: number, username: string} | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getStaffUsers();
            setUsers(data);
        } catch (err) {
            setError('خطا در بارگذاری کاربران');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleAddUser = () => {
        setCurrentUser({ 
            id: `new-${Date.now()}`,
            role: 'STAFF', 
            permissions: [],
            isActive: true 
        });
        setNewPassword('');
        setConfirmNewPassword('');
        setModalTab('profile');
        setIsModalOpen(true);
    };

    const handleEditUser = async (user: StaffUser) => {
        // FIX: Added a type guard to ensure that editing is only attempted on users with a valid numeric ID, preventing runtime errors.
        if (typeof user.id !== 'number') {
            showToast('شناسه کاربر برای ویرایش نامعتبر است.', 'error');
            return;
        }
        setIsModalOpen(true);
        setModalLoading(true);
        setNewPassword('');
        setConfirmNewPassword('');
        setModalTab('profile');
        try {
            const fullProfile = await getUserProfileById(user.id);
            setCurrentUser({
                ...user,
                ...(fullProfile || {}),
                password: '' 
            });
        } catch (e) {
            showToast('خطا در دریافت اطلاعات کامل کاربر', 'error');
            setIsModalOpen(false);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteClick = (user: StaffUser) => {
        if (typeof user.id === 'number') {
            setUserToDelete({ id: user.id, username: user.username });
            setIsDeleteModalOpen(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (userToDelete) {
            try {
                await deleteStaffUser(userToDelete.id, userToDelete.username);
                showToast('کاربر با موفقیت حذف شد', 'success');
                fetchUsers();
            } catch (err) {
                showToast('خطا در حذف کاربر', 'error');
            } finally {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
            }
        }
    };

    const handleSaveUser = async () => {
        if (!currentUser.username?.trim() || !(currentUser.fullName || currentUser.full_name)?.trim()) {
            showToast('نام کاربری و نام کامل الزامی است', 'error');
            return;
        }

        const isNewUser = typeof currentUser.id === 'string' && currentUser.id.startsWith('new-');
        
        if (isNewUser && !newPassword) {
            showToast('رمز عبور برای کاربر جدید الزامی است', 'error');
            return;
        }
        if (newPassword && newPassword !== confirmNewPassword) {
            showToast('رمزهای عبور جدید مطابقت ندارند.', 'error');
            return;
        }
        
        setIsSaving(true);
        try {
            // Build a single payload with all user data
            const userToSave: ModalUser = {
                ...currentUser,
                fullName: currentUser.fullName || currentUser.full_name,
            };

            if (newPassword) {
                userToSave.password = await hashPassword(newPassword);
            }
            
            // A single call to save everything
            await saveStaffUser(userToSave);
            
            showToast('اطلاعات کاربر ذخیره شد', 'success');
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'خطا در ذخیره اطلاعات';
            showToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 dark:bg-emerald-900 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <SecurityIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">مدیریت دسترسی کاربران</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">تعریف کاربران سیستم و تعیین سطح دسترسی</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddUser}
                        className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <PlusIcon />
                        افزودن کاربر جدید
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Spinner /></div>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(user => (
                        <div key={user.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 relative group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{user.fullName}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">@{user.username}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.role === 'ADMIN' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                    {user.role === 'ADMIN' ? 'مدیر کل' : 'کارمند'}
                                </span>
                            </div>
                            
                            <div className="mb-4 min-h-[50px]">
                                {user.role === 'ADMIN' ? (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <SecurityIcon className="w-4 h-4" />
                                        دسترسی کامل به تمام بخش‌ها
                                    </p>
                                ) : (
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        <p className="mb-1 font-semibold">دسترسی‌های مجاز:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {user.permissions.length === 0 ? (
                                                <span className="text-slate-400">بدون دسترسی</span>
                                            ) : (
                                                user.permissions.map(p => (
                                                    <span key={p.module} className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                                        {p.module === 'users' ? 'مشتریان' : 
                                                         p.module === 'cars' ? 'خودروها' : 
                                                         p.module === 'conditions' ? 'شرایط' : 
                                                         p.module === 'prices' ? 'قیمت‌ها' : 
                                                         p.module === 'vehicle-exit' ? 'خروج' : 'تنظیمات'}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button onClick={() => handleEditUser(user)} className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors" title="ویرایش">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                {user.role !== 'ADMIN' && (
                                    <button onClick={() => handleDeleteClick(user)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="حذف">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {users.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-600">
                            کاربری یافت نشد.
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <header className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {typeof currentUser.id === 'number' ? `ویرایش کاربر: ${currentUser.fullName || currentUser.full_name}` : 'افزودن کاربر جدید'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <CloseIcon />
                            </button>
                        </header>
                        
                        {modalLoading ? <div className="flex justify-center items-center flex-1 p-8"><Spinner/></div> : (
                        <>
                        <div className="flex border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <button onClick={() => setModalTab('profile')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${modalTab === 'profile' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500'}`}>اطلاعات فردی</button>
                            <button onClick={() => setModalTab('access')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${modalTab === 'access' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500'}`}>دسترسی‌ها</button>
                            <button onClick={() => setModalTab('security')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${modalTab === 'security' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500'}`}>امنیت</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {modalTab === 'profile' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                                    <ProfileField label="نام کامل" value={currentUser.full_name || ''} onChange={v => setCurrentUser(p => ({...p, fullName: v, full_name: v}))} />
                                    <ProfileField label="موبایل" value={currentUser.mobile || ''} onChange={v => setCurrentUser(p => ({...p, mobile: v}))} dir="ltr" />
                                    <ProfileField label="ایمیل" value={currentUser.email || ''} onChange={v => setCurrentUser(p => ({...p, email: v}))} type="email" dir="ltr" />
                                    <ProfileField label="تاریخ تولد" value={currentUser.birth_date || ''} onChange={v => setCurrentUser(p => ({...p, birth_date: v}))} placeholder="1370/01/01" dir="ltr" />
                                    <ProfileField label="تیپ MBTI" value={currentUser.mbti || ''} onChange={v => setCurrentUser(p => ({...p, mbti: v}))} placeholder="ISTJ" />
                                    <div className="md:col-span-2">
                                        <ProfileField label="API Key واتساپ" value={currentUser.whatsapp_apikey || ''} onChange={v => setCurrentUser(p => ({...p, whatsapp_apikey: v}))} dir="ltr" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">توضیحات</label>
                                        <textarea value={currentUser.description || ''} onChange={e => setCurrentUser(p => ({...p, description: e.target.value}))} rows={3} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"/>
                                    </div>
                                </div>
                            )}
                            {modalTab === 'access' && (
                                <div className="space-y-6">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-300 dark:border-slate-600 rounded-lg w-full max-w-xs hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <input type="checkbox" className="hidden" checked={currentUser.role === 'ADMIN'} onChange={e => setCurrentUser({...currentUser, role: e.target.checked ? 'ADMIN' : 'STAFF'})} />
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${currentUser.role === 'ADMIN' ? 'border-rose-500 bg-rose-500' : 'border-slate-400'}`}>
                                            {currentUser.role === 'ADMIN' && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className="text-sm font-bold text-slate-800 dark:text-white">مدیر کل (دسترسی کامل)</span>
                                    </label>
                                    {currentUser.role !== 'ADMIN' && (
                                        <PermissionMatrix permissions={currentUser.permissions || []} onChange={(updated) => setCurrentUser({...currentUser, permissions: updated})} />
                                    )}
                                </div>
                            )}
                            {modalTab === 'security' && (
                                <div className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نام کاربری</label>
                                        <input type="text" value={currentUser.username || ''} onChange={e => setCurrentUser({...currentUser, username: e.target.value})} disabled={typeof currentUser.id === 'number'} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white disabled:opacity-60" dir="ltr" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{typeof currentUser.id === 'number' ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور'}</label>
                                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" dir="ltr" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تکرار رمز عبور جدید</label>
                                        <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" dir="ltr" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <footer className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">انصراف</button>
                            <button onClick={handleSaveUser} disabled={isSaving} className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 w-36 flex justify-center items-center">
                                {isSaving ? <Spinner /> : 'ذخیره'}
                            </button>
                        </footer>
                        </>
                        )}
                    </div>
                </div>
            )}

            <DeleteConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="حذف کاربر"
                message={`آیا از حذف کاربر "${userToDelete?.username}" اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

const ProfileField: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; dir?: 'rtl' | 'ltr'; }> = 
({ label, value, onChange, type = 'text', placeholder, dir = 'rtl' }) => (
    <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            dir={dir}
        />
    </div>
);


export default AccessControlPage;
