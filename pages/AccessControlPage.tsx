import React, { useState, useEffect, useMemo } from 'react';
import { 
    getStaffUsers, 
    saveStaffUser, 
    deleteStaffUser, 
    hashPassword, 
    getUserProfileById, 
    formatJalaliDateTime, 
    getRelativeTimeAgo, 
    getUserPresenceStatus,
    recordUserActivity,
    getCustomRolesFromApi,
    saveCustomRoleToApi,
    deleteCustomRoleFromApi
} from '../services/api';
import type { StaffUser, Permission, MyProfile, UserRoleDefinition } from '../types';
import { 
    SYSTEM_ROLE_LEVELS, 
    DEFAULT_SYSTEM_ROLES, 
    mergeRoles, 
    resolveUserRole 
} from '../utils/roleDefinitions';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import PermissionMatrix from '../components/PermissionMatrix';
import { 
    Users, 
    Shield, 
    ShieldCheck, 
    Plus, 
    Trash2, 
    Edit, 
    X, 
    Check, 
    Calendar, 
    Activity, 
    User, 
    Lock, 
    Layers, 
    Sliders,
    Search,
    AlertCircle,
    KeyRound,
    Sparkles,
    CheckCircle2
} from 'lucide-react';

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

const getRoleColorBadge = (color?: string) => {
    switch (color) {
        case 'rose':
            return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
        case 'indigo':
            return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
        case 'sky':
            return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800';
        case 'emerald':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        case 'amber':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        case 'purple':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
        default:
            return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
};

const AccessControlPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>('USERS');
    const [users, setUsers] = useState<StaffUser[]>([]);
    const [roles, setRoles] = useState<UserRoleDefinition[]>(DEFAULT_SYSTEM_ROLES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState<'ALL' | '10' | '8' | '6' | '4' | '2'>('ALL');

    // User Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<ModalUser>({});
    const [selectedRoleId, setSelectedRoleId] = useState<string>('staff-office');
    const [customLevel, setCustomLevel] = useState<number>(2);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [modalTab, setModalTab] = useState<'profile' | 'access' | 'security' | 'activity'>('profile');
    
    // User Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{id: number, username: string} | null>(null);

    // Custom Role Creation / Edit Modal State
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isSavingRole, setIsSavingRole] = useState(false);
    const [editingRole, setEditingRole] = useState<Partial<UserRoleDefinition>>({
        name: '',
        code: '',
        description: '',
        level: 4,
        color: 'indigo',
        permissions: []
    });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersData, customRolesData] = await Promise.all([
                getStaffUsers(),
                getCustomRolesFromApi()
            ]);
            setUsers(usersData);
            const merged = mergeRoles(customRolesData);
            setRoles(merged);
        } catch (err) {
            setError('خطا در بارگذاری اطلاعات دسترسی و کاربران از سرور');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        recordUserActivity('مشاهده مدیریت دسترسی و نقش‌های کاربران');
        fetchData();
    }, []);

    useEffect(() => {
        const handleRefresh = () => {
            fetchData();
        };
        window.addEventListener('app-refresh', handleRefresh);
        window.addEventListener('user-activity-updated', handleRefresh);
        return () => {
            window.removeEventListener('app-refresh', handleRefresh);
            window.removeEventListener('user-activity-updated', handleRefresh);
        };
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleAddUser = () => {
        const nowIso = new Date().toISOString();
        const defaultRole = roles.find(r => r.id === 'staff-office') || roles[0];
        
        setCurrentUser({ 
            id: `new-${Date.now()}`,
            username: '',
            fullName: '',
            full_name: '',
            role: 'STAFF', 
            roleTitle: defaultRole?.name || 'کارمند اداری',
            roleId: defaultRole?.id || 'staff-office',
            userLevel: defaultRole?.level || 2,
            permissions: defaultRole?.permissions || [],
            register_time: nowIso,
            registerTime: nowIso,
            last_login: undefined,
            lastLogin: undefined,
            last_activity: undefined,
            lastActivity: undefined,
            isActive: true 
        });
        setSelectedRoleId(defaultRole?.id || 'staff-office');
        setCustomLevel(defaultRole?.level || 2);
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

        const resolved = resolveUserRole(user.username, user.role, user.permission_level, {
            roleId: user.roleId,
            roleTitle: user.roleTitle,
            level: user.userLevel
        }, roles);
        setSelectedRoleId(resolved.roleId);
        setCustomLevel(resolved.userLevel);

        const initialUserData: ModalUser = {
            ...user,
            fullName: user.fullName || user.username || '',
            full_name: user.fullName || user.username || '',
            role: user.role || 'STAFF',
            roleTitle: resolved.roleTitle,
            roleId: resolved.roleId,
            userLevel: resolved.userLevel,
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
                    roleTitle: resolved.roleTitle,
                    roleId: resolved.roleId,
                    userLevel: resolved.userLevel,
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

    const handleSelectRoleForUser = (role: UserRoleDefinition) => {
        setSelectedRoleId(role.id);
        setCustomLevel(role.level);
        setCurrentUser(prev => ({
            ...prev,
            role: role.level >= 10 ? 'ADMIN' : 'STAFF',
            roleId: role.id,
            roleTitle: role.name,
            userLevel: role.level,
            permissions: role.permissions && role.permissions.length > 0 ? role.permissions : prev.permissions
        }));
    };

    const handleResetToRolePermissions = () => {
        const targetRole = roles.find(r => r.id === selectedRoleId);
        if (targetRole && targetRole.permissions) {
            setCurrentUser(prev => ({
                ...prev,
                permissions: JSON.parse(JSON.stringify(targetRole.permissions))
            }));
            showToast(`دسترسی‌های پیش‌فرض نقش "${targetRole.name}" اعمال شد`, 'success');
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
                fetchData();
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
            showToast('نام و نام خانوادگی الزامی است', 'error');
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
            const targetRole = roles.find(r => r.id === selectedRoleId);
            const userToSave: ModalUser = {
                ...currentUser,
                username,
                fullName,
                full_name: fullName,
                role: customLevel >= 10 ? 'ADMIN' : 'STAFF',
                roleTitle: targetRole?.name || currentUser.roleTitle || 'کاربر سیستم',
                roleId: selectedRoleId,
                userLevel: customLevel,
                permission_level: customLevel >= 10 ? 0 : 1
            };

            if (newPassword) {
                userToSave.password = await hashPassword(newPassword);
            }
            
            await saveStaffUser(userToSave);

            recordUserActivity(`ذخیره اطلاعات و سطح دسترسی کاربر ${username}`);
            
            showToast('اطلاعات و سطح کاربری با موفقیت ذخیره شد', 'success');
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'خطا در ذخیره اطلاعات';
            showToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Role Manager Actions
    const handleOpenCreateRole = () => {
        setEditingRole({
            id: `custom-role-${Date.now()}`,
            name: '',
            code: '',
            description: '',
            level: 4,
            color: 'indigo',
            isSystem: false,
            isRoleDefinition: true,
            permissions: []
        });
        setIsRoleModalOpen(true);
    };

    const handleEditRole = (role: UserRoleDefinition) => {
        setEditingRole({
            ...role,
            permissions: JSON.parse(JSON.stringify(role.permissions || []))
        });
        setIsRoleModalOpen(true);
    };

    const handleDeleteRole = async (role: UserRoleDefinition) => {
        if (window.confirm(`آیا از حذف نقش سفارشی "${role.name}" اطمینان دارید؟`)) {
            try {
                await deleteCustomRoleFromApi(role.id, role.apiId);
                showToast('نقش کاربری با موفقیت از سرور حذف شد', 'success');
                fetchData();
            } catch (err) {
                showToast('خطا در حذف نقش از سرور', 'error');
            }
        }
    };

    const handleSaveRole = async () => {
        if (!editingRole.name?.trim()) {
            showToast('نام نقش کاربری الزامی است', 'error');
            return;
        }
        setIsSavingRole(true);
        try {
            const roleData: UserRoleDefinition = {
                id: editingRole.id || `custom-role-${Date.now()}`,
                apiId: editingRole.apiId,
                name: editingRole.name.trim(),
                code: editingRole.code?.trim().toUpperCase() || 'CUSTOM_ROLE',
                description: editingRole.description || '',
                level: Number(editingRole.level) || 4,
                color: editingRole.color || 'indigo',
                isSystem: false,
                isRoleDefinition: true,
                permissions: editingRole.permissions || []
            };
            await saveCustomRoleToApi(roleData);
            setIsRoleModalOpen(false);
            showToast('نقش کاربری با موفقیت در سرور ذخیره شد', 'success');
            fetchData();
        } catch (err) {
            showToast('خطا در ذخیره نقش در سرور', 'error');
        } finally {
            setIsSavingRole(false);
        }
    };

    // Filter users by search and level
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = 
                (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.mobile && user.mobile.includes(searchQuery)) ||
                (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
            
            if (!matchesSearch) return false;

            if (levelFilter === 'ALL') return true;

            const resolved = resolveUserRole(user.username, user.role, user.permission_level, {
                roleId: user.roleId,
                roleTitle: user.roleTitle,
                level: user.userLevel
            }, roles);
            if (levelFilter === '10') return resolved.userLevel >= 10;
            if (levelFilter === '8') return resolved.userLevel === 8;
            if (levelFilter === '6') return resolved.userLevel === 6;
            if (levelFilter === '4') return resolved.userLevel === 4;
            if (levelFilter === '2') return resolved.userLevel <= 2;

            return true;
        });
    }, [users, searchQuery, levelFilter, roles]);

    const onlineCount = users.filter(u => {
        const presence = getUserPresenceStatus(u.lastActivity || u.last_activity);
        return presence.status === 'online';
    }).length;

    const adminCount = users.filter(u => {
        const resolved = resolveUserRole(u.username, u.role, u.permission_level, {
            roleId: u.roleId,
            roleTitle: u.roleTitle,
            level: u.userLevel
        }, roles);
        return resolved.userLevel >= 10;
    }).length;
    const staffCount = users.length - adminCount;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Header & Mode Switcher */}
            <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 p-3.5 rounded-2xl text-white shadow-md shadow-emerald-600/20">
                            <Shield className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">مدیریت دسترسی و سطوح کاربری</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                پیکربندی سلسله‌مراتب سازمانی، تعریف نقش‌ها، تعیین سطوح دسترسی (۱ تا ۱۰) و نظارت بر پرسنل
                            </p>
                        </div>
                    </div>

                    {/* View Switcher Tabs */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('USERS')}
                            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                activeTab === 'USERS'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>کاربران و پرسنل ({users.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('ROLES')}
                            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                activeTab === 'ROLES'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Layers className="w-4 h-4" />
                            <span>تعریف نقش‌ها و سطوح ({roles.length})</span>
                        </button>
                    </div>
                </div>

                {/* TAB 1: USERS METRICS */}
                {activeTab === 'USERS' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">کل کاربران</p>
                                    <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{users.length.toLocaleString('fa-IR')}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                    <User className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/40 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">هم‌اکنون آنلاین</p>
                                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{onlineCount.toLocaleString('fa-IR')}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                                </div>
                            </div>

                            <div className="bg-rose-50/70 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200/70 dark:border-rose-800/40 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] text-rose-700 dark:text-rose-300 font-bold">مدیران ارشد (سطح ۱۰)</p>
                                    <p className="text-xl font-black text-rose-700 dark:text-rose-400 mt-1">{adminCount.toLocaleString('fa-IR')}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-300">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="bg-blue-50/70 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200/70 dark:border-blue-800/40 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] text-blue-700 dark:text-blue-300 font-bold">پرسنل و کارشناسان</p>
                                    <p className="text-xl font-black text-blue-700 dark:text-blue-400 mt-1">{staffCount.toLocaleString('fa-IR')}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Search & Level Filter Bar */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="جستجو در نام، نام کاربری یا موبایل..."
                                    className="w-full pr-10 pl-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                                <button
                                    onClick={() => setLevelFilter('ALL')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${levelFilter === 'ALL' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                                >
                                    همه سطوح
                                </button>
                                <button
                                    onClick={() => setLevelFilter('10')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${levelFilter === '10' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}
                                >
                                    سطح ۱۰ (مدیران ارشد)
                                </button>
                                <button
                                    onClick={() => setLevelFilter('8')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${levelFilter === '8' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'}`}
                                >
                                    سطح ۸ (مدیران بخش)
                                </button>
                                <button
                                    onClick={() => setLevelFilter('6')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${levelFilter === '6' ? 'bg-sky-600 text-white shadow-xs' : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'}`}
                                >
                                    سطح ۶ (سرپرستان)
                                </button>
                                <button
                                    onClick={() => setLevelFilter('4')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${levelFilter === '4' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}
                                >
                                    سطح ۴ (کارشناسان)
                                </button>
                                <button
                                    onClick={() => setLevelFilter('2')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${levelFilter === '2' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}
                                >
                                    سطح ۱-۲ (کارمندان)
                                </button>

                                <button
                                    onClick={handleAddUser}
                                    className="mr-auto sm:mr-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>افزودن کاربر</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: ROLES MANAGEMENT HEADER BANNER */}
                {activeTab === 'ROLES' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white text-base">
                                    تعاریف سطوح و نقش‌های سیستمی و سفارشی
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    در این بخش می‌توانید نقش‌های سازمانی جدید تعریف کرده و سطح دسترسی (۱ تا ۱۰) و ماتریس دسترسی پیش‌فرض آنها را مشخص نمایید.
                                </p>
                            </div>

                            <button
                                onClick={handleOpenCreateRole}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>تعریف نقش کاربری جدید</span>
                            </button>
                        </div>

                        {/* Levels Hierarchy Summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                            {SYSTEM_ROLE_LEVELS.map(lvl => (
                                <div key={lvl.level} className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${getRoleColorBadge(lvl.color)}`}>
                                            سطح {lvl.level}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-xs truncate" title={lvl.title}>
                                        {lvl.title.split('-')[1]?.trim() || lvl.title}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                                        {lvl.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* TAB 1 CONTENT: USERS LIST */}
            {activeTab === 'USERS' && (
                loading ? (
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
                            const resolved = resolveUserRole(user.username, user.role, user.permission_level, {
                                roleId: user.roleId,
                                roleTitle: user.roleTitle,
                                level: user.userLevel
                            }, roles);

                            return (
                                <div 
                                    key={user.id} 
                                    className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                                >
                                    <div className="p-5 space-y-4">
                                        {/* Top User Card Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white ${resolved.userLevel >= 10 ? 'bg-gradient-to-br from-rose-500 to-rose-700' : 'bg-gradient-to-br from-indigo-500 to-blue-600'} shadow-sm`}>
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
                                                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border ${getRoleColorBadge(resolved.color)}`}>
                                                    {resolved.roleTitle} (سطح {resolved.userLevel})
                                                </span>
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${presence.colorClass}`}>
                                                    <span className={`w-2 h-2 rounded-full ${presence.dotClass}`}></span>
                                                    {presence.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Timestamps Section */}
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 space-y-2 border border-slate-100 dark:border-slate-800 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400 flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    ثبت‌نام:
                                                </span>
                                                <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                                                    {formatJalaliDateTime(registerStr)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400 flex items-center gap-1.5">
                                                    <Shield className="w-3.5 h-3.5" />
                                                    آخرین ورود:
                                                </span>
                                                <div className="flex items-center gap-1 font-mono">
                                                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                                                        {formatJalaliDateTime(loginStr)}
                                                    </span>
                                                    {loginStr && (
                                                        <span className="text-[10px] bg-slate-200/70 dark:bg-slate-700 px-1 py-0.2 rounded text-slate-600 dark:text-slate-300 font-sans">
                                                            {getRelativeTimeAgo(loginStr)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400 flex items-center gap-1.5">
                                                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                                                    فعالیت:
                                                </span>
                                                <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                                                    {getRelativeTimeAgo(activityStr)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Features & Permissions Section */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {resolved.userLevel >= 10 ? 'سطح اختیارات:' : `ماژول‌های مجاز (${(user.permissions || []).length.toLocaleString('fa-IR')} بخش):`}
                                                </p>
                                            </div>
                                            {resolved.userLevel >= 10 ? (
                                                <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                                                    <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                                                    <span>دسترسی تام و نامحدود مدیریت به تمام داده‌ها</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1">
                                                    {(!user.permissions || user.permissions.length === 0) ? (
                                                        <span className="text-xs text-slate-400 italic">فاقد دسترسی فعال</span>
                                                    ) : (
                                                        user.permissions.map(p => (
                                                            <span 
                                                                key={p.module} 
                                                                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg text-[11px] font-medium border border-slate-200/60 dark:border-slate-700"
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
                                    <div className="flex justify-between items-center px-5 py-3 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-[11px] text-slate-400 font-mono">
                                            ID: {user.id}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button 
                                                onClick={() => handleEditUser(user)} 
                                                className="px-3 py-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl transition-colors flex items-center gap-1 border border-sky-200 dark:border-sky-800/60"
                                                title="ویرایش کاربر و سطح دسترسی"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                                <span>ویرایش و دسترسی</span>
                                            </button>
                                            {user.role !== 'ADMIN' && (
                                                <button 
                                                    onClick={() => handleDeleteClick(user)} 
                                                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-200 dark:border-rose-800/60" 
                                                    title="حذف کاربر"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredUsers.length === 0 && (
                            <div className="col-span-full text-center py-16 bg-white dark:bg-slate-850 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
                                <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-600 dark:text-slate-400 font-bold">کاربری با این مشخصات یافت نشد.</p>
                            </div>
                        )}
                    </div>
                )
            )}

            {/* TAB 2 CONTENT: ROLES & PERMISSION DEFINITIONS LIST */}
            {activeTab === 'ROLES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map(role => (
                        <div 
                            key={role.id}
                            className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-slate-900 dark:text-white text-base">
                                                {role.name}
                                            </h4>
                                            {role.isSystem ? (
                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                                                    سیستمی
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                                                    سفارشی
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">
                                            {role.code}
                                        </p>
                                    </div>

                                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${getRoleColorBadge(role.color)}`}>
                                        سطح {role.level}
                                    </span>
                                </div>

                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {role.description || 'بدون توضیحات ثبت شده'}
                                </p>

                                {/* Permissions count preview */}
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                                    <div className="flex items-center justify-between text-slate-500 mb-1">
                                        <span>تعداد ماژول‌های مجاز پیش‌فرض:</span>
                                        <b className="text-slate-800 dark:text-white">
                                            {role.level >= 10 ? 'دسترسی کامل (۱۰۰٪)' : `${(role.permissions || []).length} ماژول`}
                                        </b>
                                    </div>
                                    {role.permissions && role.permissions.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {role.permissions.slice(0, 5).map(p => (
                                                <span key={p.module} className="text-[10px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                    {MODULE_LABELS[p.module] || p.module}
                                                </span>
                                            ))}
                                            {role.permissions.length > 5 && (
                                                <span className="text-[10px] text-slate-400">
                                                    +{role.permissions.length - 5} مورد دیگر
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions for custom roles */}
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                <span className="text-slate-400 text-[11px]">
                                    {role.isSystem ? 'نقش استاندارد سیستم' : 'نقش اختصاصی سازمان'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleEditRole(role)}
                                        className="px-2.5 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg font-bold flex items-center gap-1"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        <span>ویرایش</span>
                                    </button>
                                    {!role.isSystem && (
                                        <button
                                            onClick={() => handleDeleteRole(role)}
                                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                                            title="حذف نقش"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* USER EDIT / ADD MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-850 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <header className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-base text-slate-800 dark:text-white">
                                        {typeof currentUser.id === 'number' ? `ویرایش کاربر: ${currentUser.fullName || currentUser.username}` : 'افزودن کاربر جدید'}
                                    </h3>
                                    <p className="text-[11px] text-slate-400">تنظیم مشخصات هویتی، سطح دسترسی و تعیین نقش سازمانی</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        {modalLoading ? (
                            <div className="p-16 flex justify-center"><Spinner /></div>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="flex flex-col flex-1 overflow-hidden">
                                {/* Modal Navigation Tabs */}
                                <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 px-5">
                                    <button 
                                        type="button" 
                                        onClick={() => setModalTab('profile')} 
                                        className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${modalTab === 'profile' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500'}`}
                                    >
                                        مشخصات پرسنلی
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setModalTab('access')} 
                                        className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${modalTab === 'access' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500'}`}
                                    >
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>تعریف سطح و نقش کاربری</span>
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setModalTab('security')} 
                                        className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${modalTab === 'security' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500'}`}
                                    >
                                        امنیت و رمز عبور
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                    {/* TAB: PROFILE */}
                                    {modalTab === 'profile' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <ProfileField label="نام و نام خانوادگی (الزامی)" value={currentUser.full_name || currentUser.fullName || ''} onChange={v => setCurrentUser(p => ({...p, fullName: v, full_name: v}))} placeholder="مثال: محمد امینی" />
                                            <ProfileField label="شماره موبایل" value={currentUser.mobile || ''} onChange={v => setCurrentUser(p => ({...p, mobile: v}))} dir="ltr" placeholder="0912..." />
                                            <ProfileField label="پست الکترونیکی (ایمیل)" value={currentUser.email || ''} onChange={v => setCurrentUser(p => ({...p, email: v}))} type="email" dir="ltr" placeholder="user@hoseinikhodro.com" />
                                            <ProfileField label="تاریخ تولد" value={currentUser.birth_date || ''} onChange={v => setCurrentUser(p => ({...p, birth_date: v}))} placeholder="1370/01/01" dir="ltr" />
                                            <ProfileField label="تیپ شخصیتی (MBTI)" value={currentUser.mbti || ''} onChange={v => setCurrentUser(p => ({...p, mbti: v}))} placeholder="مثال: ESTJ" />
                                            <ProfileField label="شناسه / کلید پیام‌رسان" value={currentUser.whatsapp_apikey || ''} onChange={v => setCurrentUser(p => ({...p, whatsapp_apikey: v}))} dir="ltr" placeholder="ApiKey" />
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">توضیحات و سمت سازمانی</label>
                                                <textarea 
                                                    value={currentUser.description || ''} 
                                                    onChange={e => setCurrentUser(p => ({...p, description: e.target.value}))} 
                                                    rows={3} 
                                                    className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-800 dark:border-slate-700 dark:text-white border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    placeholder="شرح سمت، واحد، مسئولیت‌ها یا دسترسی‌های خاص..."
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB: ACCESS & ROLE & LEVEL DEFINITIONS */}
                                    {modalTab === 'access' && (
                                        <div className="space-y-6">
                                            {/* Role Selector Cards */}
                                            <div>
                                                <label className="block text-xs font-black text-slate-800 dark:text-white mb-2">
                                                    ۱. انتخاب نقش سازمانی کاربر:
                                                </label>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                                    {roles.map(r => {
                                                        const isSelected = selectedRoleId === r.id;
                                                        return (
                                                            <div
                                                                key={r.id}
                                                                onClick={() => handleSelectRoleForUser(r)}
                                                                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                                                                    isSelected
                                                                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                                                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-indigo-300'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${getRoleColorBadge(r.color)}`}>
                                                                        سطح {r.level}
                                                                    </span>
                                                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                                                                </div>
                                                                <p className="font-bold text-xs text-slate-800 dark:text-white truncate">
                                                                    {r.name}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Level Slider / Direct Fine-tuning */}
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-xs text-slate-800 dark:text-white">
                                                            ۲. تنظیم دقیق سطح دسترسی کاربر (Level 1 to 10):
                                                        </h4>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            سطح دسترسی رتبه و عمق نفوذ کاربر در سلسله‌مراتب و تاییدات را تعیین می‌کند.
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl font-black text-xs">
                                                        سطح {customLevel}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-400">سطح ۱ (حداقل)</span>
                                                    <input 
                                                        type="range" 
                                                        min={1} 
                                                        max={10} 
                                                        value={customLevel} 
                                                        onChange={(e) => setCustomLevel(Number(e.target.value))}
                                                        className="flex-1 accent-indigo-600 cursor-pointer"
                                                    />
                                                    <span className="text-[10px] text-rose-500 font-bold">سطح ۱۰ (Super Admin)</span>
                                                </div>

                                                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                                    <span className="text-xs text-slate-500">
                                                        بازنشانی دسترسی‌های ماتریس طبق نقش انتخابی:
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleResetToRolePermissions}
                                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                                    >
                                                        اعمال دسترسی‌های پیش‌فرض
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Detailed Permission Matrix */}
                                            {customLevel < 10 ? (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-black text-slate-800 dark:text-white">
                                                        ۳. شخصی‌سازی ماتریس دسترسی ماژول‌ها برای این کاربر:
                                                    </h4>
                                                    <PermissionMatrix 
                                                        permissions={currentUser.permissions || []} 
                                                        onChange={(updated) => setCurrentUser({...currentUser, permissions: updated})} 
                                                    />
                                                </div>
                                            ) : (
                                                <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-center space-y-2">
                                                    <ShieldCheck className="w-8 h-8 text-rose-500 mx-auto" />
                                                    <p className="text-sm font-black text-rose-800 dark:text-rose-300">سطح ۱۰ - مدیر ارشد سیستم فعال است</p>
                                                    <p className="text-xs text-rose-600 dark:text-rose-400">کاربر با سطح ۱۰ به صورت نامحدود و بدون نیاز به ماتریس جزئی به تمام داده‌ها و ماژول‌ها دسترسی دارد.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB: SECURITY */}
                                    {modalTab === 'security' && (
                                        <div className="space-y-4 max-w-md">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">نام کاربری (شناسه ورود)</label>
                                                <input 
                                                    type="text" 
                                                    value={currentUser.username || ''} 
                                                    onChange={e => setCurrentUser({...currentUser, username: e.target.value})} 
                                                    disabled={typeof currentUser.id === 'number'} 
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white disabled:opacity-60 text-xs font-mono" 
                                                    dir="ltr" 
                                                    placeholder="username"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                    {typeof currentUser.id === 'number' ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور اولیه (الزامی)'}
                                                </label>
                                                <input 
                                                    type="password" 
                                                    value={newPassword} 
                                                    onChange={e => setNewPassword(e.target.value)} 
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white text-xs" 
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
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white text-xs" 
                                                    dir="ltr" 
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <footer className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 bg-slate-50/80 dark:bg-slate-900/50">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)} 
                                        className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
                                    >
                                        انصراف
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSaving} 
                                        className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-xs flex items-center justify-center min-w-[130px]"
                                    >
                                        {isSaving ? <Spinner /> : 'ذخیره تغییرات'}
                                    </button>
                                </footer>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* CREATE / EDIT CUSTOM ROLE MODAL */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4" onClick={() => setIsRoleModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-850 rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        
                        <header className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-base text-slate-800 dark:text-white">
                                        تعریف نقش و سطح کاربری
                                    </h3>
                                    <p className="text-[11px] text-slate-400">ثبت عنوان نقش، سطح دسترسی (۱ تا ۱۰) و ماتریس دسترسی پیش‌فرض</p>
                                </div>
                            </div>
                            <button onClick={() => setIsRoleModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">نام نقش (فارسی - الزامی)</label>
                                    <input
                                        type="text"
                                        value={editingRole.name || ''}
                                        onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                                        placeholder="مثال: سرپرست امور قراردادها"
                                        className="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">شناسه یا کد نقش (انگلیسی)</label>
                                    <input
                                        type="text"
                                        value={editingRole.code || ''}
                                        onChange={e => setEditingRole({ ...editingRole, code: e.target.value })}
                                        placeholder="CONTRACT_SUPERVISOR"
                                        dir="ltr"
                                        className="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-mono"
                                    />
                                </div>
                            </div>

                            {/* Level and Color Picker */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        سطح دسترسی نقش: ({editingRole.level || 4})
                                    </label>
                                    <select
                                        value={editingRole.level || 4}
                                        onChange={e => setEditingRole({ ...editingRole, level: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold"
                                    >
                                        <option value={10}>سطح ۱۰ - مدیر ارشد سیستم (Super Admin)</option>
                                        <option value={8}>سطح ۸ - مدیر ارشد بخش / بازرگانی</option>
                                        <option value={6}>سطح ۶ - سرپرست واحد / قراردادها</option>
                                        <option value={4}>سطح ۴ - کارشناس تخصصی</option>
                                        <option value={2}>سطح ۲ - کارمند اجرایی / اداری</option>
                                        <option value={1}>سطح ۱ - مشاهده‌گر فقط‌خواندنی</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">رنگ تم نشان نقش</label>
                                    <select
                                        value={editingRole.color || 'indigo'}
                                        onChange={e => setEditingRole({ ...editingRole, color: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold"
                                    >
                                        <option value="indigo">نیلی (Indigo)</option>
                                        <option value="sky">آبی روشن (Sky)</option>
                                        <option value="emerald">زمردی (Emerald)</option>
                                        <option value="amber">کهربایی (Amber)</option>
                                        <option value="rose">سرخ (Rose)</option>
                                        <option value="purple">بنفش (Purple)</option>
                                        <option value="slate">خاکستری (Slate)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">شرح وظایف و اختیارات نقش</label>
                                <textarea
                                    value={editingRole.description || ''}
                                    onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                                    rows={2}
                                    placeholder="شرح اختیارات و حیطه وظایف این نقش را وارد کنید..."
                                    className="w-full px-3.5 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs"
                                />
                            </div>

                            {/* Permission Matrix for this Role */}
                            <div>
                                <label className="block text-xs font-black text-slate-800 dark:text-white mb-2">
                                    ماتریس دسترسی پیش‌فرض برای این نقش:
                                </label>
                                <PermissionMatrix 
                                    permissions={editingRole.permissions || []} 
                                    onChange={(updated) => setEditingRole({ ...editingRole, permissions: updated })} 
                                />
                            </div>
                        </div>

                        <footer className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 bg-slate-50/80 dark:bg-slate-900/50">
                            <button
                                type="button"
                                onClick={() => setIsRoleModalOpen(false)}
                                className="px-5 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveRole}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
                            >
                                ذخیره نقش کاربری
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* User Delete Confirm Modal */}
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
            className="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white border-slate-200 outline-none text-xs transition-all"
            dir={dir}
        />
    </div>
);

export default AccessControlPage;
