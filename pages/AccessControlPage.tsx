import React, { useState, useEffect } from 'react';
import { 
    getStaffUsers, 
    saveStaffUser, 
    deleteStaffUser, 
    hashPassword, 
    getUserProfileById, 
    formatJalaliDateTime, 
    getRelativeTimeAgo, 
    getUserPresenceStatus,
    recordUserActivity
} from '../services/api';
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
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { BoltIcon } from '../components/icons/BoltIcon';
import { UserIcon } from '../components/icons/UserIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';

type ModalUser = Omit<Partial<StaffUser & MyProfile>, 'id'> & { id?: number | string };

const MODULE_LABELS: Record<string, string> = {
    'users': 'مشتریان',
    'cars': 'کاتالوگ خودرو',
    'conditions': 'شرایط فروش',
    'prices': 'قیمت بازار',
    'vehicle-exit': 'خروج خودرو',
    'announcements': 'بخشنامه‌ها',
    'inventory': 'موجودی',
    'reports': 'گزارشات',
    'commission': 'کمیسیون',
    'corrective-actions': 'اقدامات اصلاحی',
    'meeting-minutes': 'صورتجلسات',
    'leave-requests': 'مرخصی‌ها',
    'anonymous-feedback': 'صدای همکار',
    'zero-car-delivery': 'تحویل خودرو',
    'settings': 'تنظیمات',
    'access-control': 'دسترسی‌ها',
    'poll': 'نظرسنجی'
};

const AccessControlPage: React.FC = () => {
    const [users, setUsers] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'STAFF'>('ALL');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<ModalUser>({});
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [modalTab, setModalTab] = useState<'profile' | 'access' | 'security' | 'activity'>('profile');
    
    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{id: number, username: string} | null>(null);

    useEffect(() => {
        recordUserActivity('مشاهده مدیریت دسترسی کاربران');
        fetchUsers();
    }, []);

    useEffect(() => {
        const handleRefresh = () => {
            fetchUsers();
        };
        window.addEventListener('app-refresh', handleRefresh);
        return () => window.removeEventListener('app-refresh', handleRefresh);
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
        const nowIso = new Date().toISOString();
        setCurrentUser({ 
            id: `new-${Date.now()}`,
            username: '',
            fullName: '',
            full_name: '',
            role: 'STAFF', 
            permissions: [],
            register_time: nowIso,
            registerTime: nowIso,
            last_login: undefined,
            lastLogin: undefined,
            last_activity: undefined,
            lastActivity: undefined,
            isActive: true 
        });
        setNewPassword('');
        setConfirmNewPassword('');
        setModalTab('profile');
        setIsModalOpen(true);
    };

    const handleEditUser = async (user: StaffUser) => {
        if (typeof user.id !== 'number') {
            showToast('شناسه کاربر برای ویرایش نامعتبر است.', 'error');
            return;
        }
        setIsModalOpen(true);
        setModalLoading(true);
        setNewPassword('');
        setConfirmNewPassword('');
        setModalTab('profile');

        const initialUserData: ModalUser = {
            ...user,
            fullName: user.fullName || user.username || '',
            full_name: user.fullName || user.username || '',
            role: user.role || 'STAFF',
            permissions: user.permissions || [],
            register_time: user.registerTime || user.register_time,
            last_login: user.lastLogin || user.last_login,
            last_activity: user.lastActivity || user.last_activity,
            last_activity_action: user.lastActivityAction,
            password: ''
        };
        setCurrentUser(initialUserData);

        try {
            const fullProfile = await getUserProfileById(user.id);
            if (fullProfile) {
                setCurrentUser(prev => ({
                    ...prev,
                    ...fullProfile,
                    fullName: fullProfile.full_name || prev.fullName || prev.full_name || user.fullName || user.username || '',
                    full_name: fullProfile.full_name || prev.full_name || prev.fullName || user.fullName || user.username || '',
                    role: (fullProfile.isAdmin === 1 || user.role === 'ADMIN') ? 'ADMIN' : 'STAFF',
                    permissions: user.permissions || prev.permissions || [],
                    register_time: fullProfile.register_time || prev.register_time || user.registerTime,
                    last_login: fullProfile.last_login || prev.last_login || user.lastLogin,
                    last_activity: fullProfile.last_activity || prev.last_activity || user.lastActivity,
                    last_activity_action: fullProfile.last_activity_action || prev.last_activity_action || user.lastActivityAction,
                    password: '' 
                }));
            }
        } catch (e) {
            console.warn('Error fetching full profile, using basic info:', e);
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
                recordUserActivity(`حذف کاربر ${userToDelete.username}`);
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
        const username = currentUser.username?.trim();
        const fullName = (currentUser.fullName || currentUser.full_name)?.trim();

        if (!username) {
            showToast('نام کاربری الزامی است', 'error');
            setModalTab('security');
            return;
        }

        if (!fullName) {
            showToast('نام کامل الزامی است', 'error');
            setModalTab('profile');
            return;
        }

        const isNewUser = typeof currentUser.id === 'string' && currentUser.id.startsWith('new-');
        
        if (isNewUser && !newPassword) {
            showToast('رمز عبور برای کاربر جدید الزامی است', 'error');
            setModalTab('security');
            return;
        }
        if (newPassword && newPassword !== confirmNewPassword) {
            showToast('رمزهای عبور جدید مطابقت ندارند.', 'error');
            setModalTab('security');
            return;
        }
        
        setIsSaving(true);
        try {
            const userToSave: ModalUser = {
                ...currentUser,
                username,
                fullName,
                full_name: fullName,
            };

            if (newPassword) {
                userToSave.password = await hashPassword(newPassword);
            }
            
            await saveStaffUser(userToSave);
            recordUserActivity(`ذخیره اطلاعات کاربر ${username}`);
            
            showToast('اطلاعات کاربر با موفقیت ذخیره شد', 'success');
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'خطا در ذخیره اطلاعات';
            showToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (user.mobile && user.mobile.includes(searchQuery)) ||
            (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const onlineCount = users.filter(u => {
        const presence = getUserPresenceStatus(u.lastActivity || u.last_activity);
        return presence.status === 'online';
    }).length;

    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const staffCount = users.filter(u => u.role === 'STAFF').length;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Header & Stats Banner */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
                            <SecurityIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">مدیریت دسترسی کاربران</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                نظارت بر کاربران، زمان ثبت‌نام، آخرین ورود، فعالیت‌های اخیر و سطح دسترسی
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddUser}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>افزودن کاربر جدید</span>
                    </button>
                </div>

                {/* Quick Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">کل کاربران</p>
                            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{users.length.toLocaleString('fa-IR')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            <UserIcon className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/40 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">هم‌اکنون آنلاین</p>
                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{onlineCount.toLocaleString('fa-IR')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                    </div>

                    <div className="bg-rose-50/70 dark:bg-rose-950/20 p-3.5 rounded-xl border border-rose-200/70 dark:border-rose-800/40 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">مدیران کل</p>
                            <p className="text-xl font-black text-rose-700 dark:text-rose-400 mt-1">{adminCount.toLocaleString('fa-IR')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-300">
                            <ShieldCheckIcon className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-blue-50/70 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-200/70 dark:border-blue-800/40 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">کارمندان و کارشناسان</p>
                            <p className="text-xl font-black text-blue-700 dark:text-blue-400 mt-1">{staffCount.toLocaleString('fa-IR')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300">
                            <UserIcon className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="w-full sm:w-80">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="جستجو در نام، نام کاربری، موبایل..."
                            className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setRoleFilter('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${roleFilter === 'ALL' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
                        >
                            همه ({users.length.toLocaleString('fa-IR')})
                        </button>
                        <button
                            onClick={() => setRoleFilter('ADMIN')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${roleFilter === 'ADMIN' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}
                        >
                            مدیران ({adminCount.toLocaleString('fa-IR')})
                        </button>
                        <button
                            onClick={() => setRoleFilter('STAFF')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${roleFilter === 'STAFF' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'}`}
                        >
                            کارمندان ({staffCount.toLocaleString('fa-IR')})
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Users List Grid */}
            {loading ? (
                <div className="flex justify-center p-16"><Spinner /></div>
            ) : error ? (
                <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 font-bold">
                    {error}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredUsers.map(user => {
                        const presence = getUserPresenceStatus(user.lastActivity || user.last_activity);
                        const registerStr = user.registerTime || user.register_time || user.createdAt;
                        const loginStr = user.lastLogin || user.last_login;
                        const activityStr = user.lastActivity || user.last_activity;

                        return (
                            <div 
                                key={user.id} 
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                            >
                                <div className="p-5 space-y-4">
                                    {/* Top User Card Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white ${user.role === 'ADMIN' ? 'bg-gradient-to-br from-rose-500 to-rose-700' : 'bg-gradient-to-br from-blue-500 to-indigo-700'} shadow-sm`}>
                                                {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 dark:text-white text-base leading-tight">
                                                    {user.fullName || user.username}
                                                </h3>
                                                <p className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">
                                                    @{user.username}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${user.role === 'ADMIN' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'}`}>
                                                {user.role === 'ADMIN' ? 'مدیر کل' : 'کارمند'}
                                            </span>
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${presence.colorClass}`}>
                                                <span className={`w-2 h-2 rounded-full ${presence.dotClass}`}></span>
                                                {presence.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Timestamps Section: Register, Last Login, Last Activity */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 space-y-2 border border-slate-100 dark:border-slate-700/60 text-xs">
                                        {/* Register Time */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                                                تاریخ ثبت‌نام:
                                            </span>
                                            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                                                {formatJalaliDateTime(registerStr)}
                                            </span>
                                        </div>

                                        {/* Last Login */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <SecurityIcon className="w-3.5 h-3.5 text-slate-400" />
                                                آخرین ورود:
                                            </span>
                                            <div className="flex items-center gap-1.5 font-mono">
                                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                                    {formatJalaliDateTime(loginStr)}
                                                </span>
                                                {loginStr && (
                                                    <span className="text-[10px] bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-sans">
                                                        {getRelativeTimeAgo(loginStr)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Last Activity */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <BoltIcon className="w-3.5 h-3.5 text-amber-500" />
                                                آخرین فعالیت:
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                                                    {getRelativeTimeAgo(activityStr)}
                                                </span>
                                                {user.lastActivityAction && (
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[110px]" title={user.lastActivityAction}>
                                                        ({user.lastActivityAction})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Features & Permissions Section */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {user.role === 'ADMIN' ? 'سطح دسترسی:' : `بخش‌های مجاز (${user.permissions.length.toLocaleString('fa-IR')} مورد):`}
                                            </p>
                                        </div>
                                        {user.role === 'ADMIN' ? (
                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                                                <ShieldCheckIcon className="w-4 h-4 text-rose-500 shrink-0" />
                                                <span>دسترسی کامل مدیریت به تمام ماژول‌ها و داده‌ها</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1">
                                                {user.permissions.length === 0 ? (
                                                    <span className="text-xs text-slate-400 italic">فاقد دسترسی فعال</span>
                                                ) : (
                                                    user.permissions.map(p => (
                                                        <span 
                                                            key={p.module} 
                                                            className="bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg text-[11px] font-medium border border-slate-200/60 dark:border-slate-600"
                                                        >
                                                            {MODULE_LABELS[p.module] || p.module}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Actions Bar */}
                                <div className="flex justify-between items-center px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700/60">
                                    <span className="text-[11px] text-slate-400 font-mono">
                                        ID: {user.id}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleEditUser(user)} 
                                            className="px-3 py-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors flex items-center gap-1 border border-sky-200 dark:border-sky-800/60"
                                            title="ویرایش کاربر"
                                        >
                                            <EditIcon className="w-3.5 h-3.5" />
                                            <span>ویرایش</span>
                                        </button>
                                        {user.role !== 'ADMIN' && (
                                            <button 
                                                onClick={() => handleDeleteClick(user)} 
                                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200 dark:border-red-800/60" 
                                                title="حذف کاربر"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredUsers.length === 0 && (
                        <div className="col-span-full text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
                            <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-600 dark:text-slate-400 font-bold">کاربری با این مشخصات یافت نشد.</p>
                            <p className="text-xs text-slate-400 mt-1">عبارت جستجو را تغییر دهید یا کاربر جدید ثبت کنید.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add / Edit User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white">
                                    {typeof currentUser.id === 'number' ? `ویرایش کاربر: ${currentUser.fullName || currentUser.full_name}` : 'افزودن کاربر جدید'}
                                </h3>
                                {typeof currentUser.id === 'number' && (
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">@{currentUser.username}</p>
                                )}
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </header>
                        
                        {modalLoading ? (
                            <div className="flex justify-center items-center flex-1 p-16"><Spinner/></div>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="flex flex-col flex-1 overflow-hidden">
                                {/* Navigation Tabs */}
                                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <button 
                                        type="button" 
                                        onClick={() => setModalTab('profile')} 
                                        className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${modalTab === 'profile' ? 'border-emerald-500 text-emerald-600 bg-white dark:bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        مشخصات فردی
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setModalTab('access')} 
                                        className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${modalTab === 'access' ? 'border-emerald-500 text-emerald-600 bg-white dark:bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        دسترسی‌ها و نقش
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setModalTab('security')} 
                                        className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${modalTab === 'security' ? 'border-emerald-500 text-emerald-600 bg-white dark:bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        امنیت و حساب
                                    </button>
                                    {typeof currentUser.id === 'number' && (
                                        <button 
                                            type="button" 
                                            onClick={() => setModalTab('activity')} 
                                            className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${modalTab === 'activity' ? 'border-emerald-500 text-emerald-600 bg-white dark:bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                        >
                                            تاریخچه و نشست‌ها
                                        </button>
                                    )}
                                </div>

                                {/* Modal Content Area */}
                                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                    {modalTab === 'profile' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <ProfileField label="نام و نام خانوادگی (الزامی)" value={currentUser.full_name || currentUser.fullName || ''} onChange={v => setCurrentUser(p => ({...p, fullName: v, full_name: v}))} placeholder="مثال: علی رضایی" />
                                            <ProfileField label="شماره موبایل" value={currentUser.mobile || ''} onChange={v => setCurrentUser(p => ({...p, mobile: v}))} dir="ltr" placeholder="0912..." />
                                            <ProfileField label="پست الکترونیکی (ایمیل)" value={currentUser.email || ''} onChange={v => setCurrentUser(p => ({...p, email: v}))} type="email" dir="ltr" placeholder="user@domain.com" />
                                            <ProfileField label="تاریخ تولد" value={currentUser.birth_date || ''} onChange={v => setCurrentUser(p => ({...p, birth_date: v}))} placeholder="1370/01/01" dir="ltr" />
                                            <ProfileField label="تیپ شخصیتی (MBTI)" value={currentUser.mbti || ''} onChange={v => setCurrentUser(p => ({...p, mbti: v}))} placeholder="مثال: ENTJ" />
                                            <ProfileField label="API Key واتساپ" value={currentUser.whatsapp_apikey || ''} onChange={v => setCurrentUser(p => ({...p, whatsapp_apikey: v}))} dir="ltr" placeholder="کلید پیام‌رسان" />
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">توضیحات و یادداشت اداری</label>
                                                <textarea 
                                                    value={currentUser.description || ''} 
                                                    onChange={e => setCurrentUser(p => ({...p, description: e.target.value}))} 
                                                    rows={3} 
                                                    className="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
                                                    placeholder="توضیحات سازمانی، سمت، یا دسترسی‌های خاص..."
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {modalTab === 'access' && (
                                        <div className="space-y-6">
                                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">تعیین سطح نقش کاربری</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">مدیران کل به تمام زیرسیستم‌ها دسترسی دارند.</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <label className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all border ${currentUser.role === 'STAFF' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                                                        <input type="radio" name="roleSelect" checked={currentUser.role === 'STAFF'} onChange={() => setCurrentUser({...currentUser, role: 'STAFF'})} className="hidden" />
                                                        کارمند / کارشناس
                                                    </label>
                                                    <label className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all border ${currentUser.role === 'ADMIN' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                                                        <input type="radio" name="roleSelect" checked={currentUser.role === 'ADMIN'} onChange={() => setCurrentUser({...currentUser, role: 'ADMIN'})} className="hidden" />
                                                        مدیر کل (Super Admin)
                                                    </label>
                                                </div>
                                            </div>

                                            {currentUser.role !== 'ADMIN' ? (
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">ماتریس دسترسی ماژول‌ها و عملیات</h4>
                                                    <PermissionMatrix 
                                                        permissions={currentUser.permissions || []} 
                                                        onChange={(updated) => setCurrentUser({...currentUser, permissions: updated})} 
                                                    />
                                                </div>
                                            ) : (
                                                <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-center space-y-2">
                                                    <ShieldCheckIcon className="w-8 h-8 text-rose-500 mx-auto" />
                                                    <p className="text-sm font-bold text-rose-800 dark:text-rose-300">نقش مدیر کل فعال است</p>
                                                    <p className="text-xs text-rose-600 dark:text-rose-400">این کاربر بدون محدودیت به تمامی بخش‌ها، تنظیمات، گزارشات و مدیریت دسترسی دارد.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {modalTab === 'security' && (
                                        <div className="space-y-5 max-w-lg">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">نام کاربری (شناسه ورود)</label>
                                                <input 
                                                    type="text" 
                                                    value={currentUser.username || ''} 
                                                    onChange={e => setCurrentUser({...currentUser, username: e.target.value})} 
                                                    disabled={typeof currentUser.id === 'number'} 
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white disabled:opacity-60 text-sm font-mono" 
                                                    dir="ltr" 
                                                    placeholder="username"
                                                />
                                                {typeof currentUser.id === 'number' && (
                                                    <p className="text-[11px] text-slate-400 mt-1">نام کاربری پس از ثبت قابل تغییر مستقیم نیست.</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                    {typeof currentUser.id === 'number' ? 'رمز عبور جدید (در صورت نیاز به تغییر وارد کنید)' : 'رمز عبور اولیه (الزامی)'}
                                                </label>
                                                <input 
                                                    type="password" 
                                                    value={newPassword} 
                                                    onChange={e => setNewPassword(e.target.value)} 
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm" 
                                                    dir="ltr" 
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">تکرار رمز عبور جدید</label>
                                                <input 
                                                    type="password" 
                                                    value={confirmNewPassword} 
                                                    onChange={e => setConfirmNewPassword(e.target.value)} 
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm" 
                                                    dir="ltr" 
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {modalTab === 'activity' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                        <CalendarIcon className="w-4 h-4 text-emerald-500" />
                                                        زمان ثبت‌نام:
                                                    </span>
                                                    <p className="font-mono text-sm font-bold text-slate-800 dark:text-white mt-1">
                                                        {formatJalaliDateTime(currentUser.register_time || currentUser.registerTime)}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        {getRelativeTimeAgo(currentUser.register_time || currentUser.registerTime)}
                                                    </p>
                                                </div>

                                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                        <SecurityIcon className="w-4 h-4 text-blue-500" />
                                                        آخرین ورود:
                                                    </span>
                                                    <p className="font-mono text-sm font-bold text-slate-800 dark:text-white mt-1">
                                                        {formatJalaliDateTime(currentUser.last_login || currentUser.lastLogin)}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        {getRelativeTimeAgo(currentUser.last_login || currentUser.lastLogin)}
                                                    </p>
                                                </div>

                                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                        <BoltIcon className="w-4 h-4 text-amber-500" />
                                                        آخرین فعالیت:
                                                    </span>
                                                    <p className="font-mono text-sm font-bold text-slate-800 dark:text-white mt-1">
                                                        {getRelativeTimeAgo(currentUser.last_activity || currentUser.lastActivity)}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 truncate">
                                                        {currentUser.last_activity_action || 'حضور در سامانه'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <footer className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/80 dark:bg-slate-900/50">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)} 
                                        className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm transition-colors"
                                    >
                                        انصراف
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSaving} 
                                        className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all active:scale-95 text-sm flex items-center justify-center min-w-[120px]"
                                    >
                                        {isSaving ? <Spinner /> : 'ذخیره تغییرات'}
                                    </button>
                                </footer>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
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

const ProfileField: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (v: string) => void; 
    type?: string; 
    placeholder?: string; 
    dir?: 'rtl' | 'ltr'; 
}> = ({ label, value, onChange, type = 'text', placeholder, dir = 'rtl' }) => (
    <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
            dir={dir}
        />
    </div>
);

export default AccessControlPage;
