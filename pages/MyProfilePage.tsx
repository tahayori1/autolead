import React, { useState, useEffect } from 'react';
import { 
    updateUserCredentials, 
    hashPassword, 
    getMyProfile, 
    updateMyProfile, 
    formatJalaliDateTime, 
    getRelativeTimeAgo, 
    getUserPresenceStatus,
    recordUserActivity
} from '../services/api';
import type { MyProfile } from '../types';
import Toast from '../components/Toast';
import { UserIcon } from '../components/icons/UserIcon';
import Spinner from '../components/Spinner';
import { SecurityIcon } from '../components/icons/SecurityIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { BoltIcon } from '../components/icons/BoltIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';

const ProfileField: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (val: string) => void; 
    type?: string; 
    placeholder?: string;
    dir?: 'rtl' | 'ltr';
}> = ({ label, value, onChange, type = 'text', placeholder, dir = 'rtl' }) => (
    <div className="mb-4">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none text-sm transition-all"
            dir={dir}
        />
    </div>
);

const CredFormField: React.FC<{ 
    label: string; 
    name: string; 
    type: string; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    error?: string; 
    disabled?: boolean; 
    placeholder?: string; 
}> = ({ label, name, type, value, onChange, error, disabled = false, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-700 dark:text-white ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} focus:ring-2 focus:ring-sky-500 outline-none text-sm transition-all`}
            dir="ltr"
        />
        {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
);

const MyProfilePage: React.FC = () => {
    // 1. Profile Data State
    const [profileData, setProfileData] = useState<Partial<MyProfile>>({});
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);

    // 2. Credentials Data State
    const [credForm, setCredForm] = useState({
        username: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [credSaving, setCredSaving] = useState(false);
    const [credErrors, setCredErrors] = useState<Record<string, string>>({});
    
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        recordUserActivity('مشاهده پروفایل من');
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setProfileLoading(true);
        try {
            const data = await getMyProfile();
            if (data && 'id' in data) {
                setProfileData(data as MyProfile);
                setCredForm(prev => ({ ...prev, username: (data as MyProfile).username || '' }));
            }
        } catch (err) {
            showToast('خطا در بارگذاری پروفایل', 'error');
        } finally {
            setProfileLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleProfileChange = (field: keyof MyProfile, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveProfile = async () => {
        setProfileSaving(true);
        try {
            const payload: Partial<MyProfile> = {
                full_name: profileData.full_name,
                mobile: profileData.mobile,
                email: profileData.email,
                birth_date: profileData.birth_date,
                mbti: profileData.mbti,
                description: profileData.description,
                whatsapp_apikey: profileData.whatsapp_apikey,
            };
            await updateMyProfile(payload);
            recordUserActivity('ویرایش مشخصات پروفایل');
            showToast('اطلاعات پروفایل با موفقیت ذخیره شد.', 'success');
        } catch (err) {
            showToast('خطا در ذخیره پروفایل', 'error');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleCredFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredForm(prev => ({ ...prev, [name]: value }));
        if (credErrors[name]) {
            setCredErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateCredentials = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!credForm.currentPassword) {
            newErrors.currentPassword = 'رمز عبور فعلی الزامی است.';
        }
        if (credForm.newPassword && credForm.newPassword !== credForm.confirmNewPassword) {
            newErrors.confirmNewPassword = 'رمزهای عبور جدید مطابقت ندارند.';
        }
        if ((credForm.newPassword || credForm.username !== profileData.username) && !credForm.currentPassword) {
            newErrors.currentPassword = 'برای ایجاد تغییر، رمز عبور فعلی الزامی است.';
        }
        if (!credForm.newPassword && credForm.username === profileData.username) {
            newErrors.general = 'حداقل نام کاربری جدید یا رمز عبور جدید باید وارد شود.';
        }
        setCredErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangeCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateCredentials()) return;
        
        setCredSaving(true);
        try {
            const currentPasswordHash = await hashPassword(credForm.currentPassword);
            const newPasswordHash = credForm.newPassword ? await hashPassword(credForm.newPassword) : undefined;
            const newUsername = credForm.username !== profileData.username ? credForm.username : '';

            await updateUserCredentials(currentPasswordHash, newUsername, newPasswordHash, profileData?.username || '');
            recordUserActivity('تغییر اطلاعات ورود و رمز عبور');
            showToast('اطلاعات ورود به‌روزرسانی شد. ممکن است لازم باشد دوباره وارد شوید.', 'success');
            setCredForm({ ...credForm, currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطا در به‌روزرسانی اطلاعات';
            showToast(errorMessage.includes('401') ? 'رمز عبور فعلی اشتباه است.' : errorMessage, 'error');
        } finally {
            setCredSaving(false);
        }
    };

    const presence = getUserPresenceStatus(profileData.last_activity);
    const isAdmin = profileData.isAdmin === 1;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Page Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-sky-100 dark:bg-sky-900/50 rounded-2xl text-sky-600 dark:text-sky-300 flex items-center justify-center font-black text-xl shadow-xs">
                        {profileData.full_name ? profileData.full_name.charAt(0) : (profileData.username ? profileData.username.charAt(0).toUpperCase() : <UserIcon className="w-7 h-7" />)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                                {profileData.full_name || profileData.username || 'پروفایل کاربر'}
                            </h2>
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${isAdmin ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'}`}>
                                {isAdmin ? 'مدیر کل' : 'کارمند'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">
                            @{profileData.username || 'user'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${presence.colorClass}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${presence.dotClass}`}></span>
                        {presence.label}
                    </span>
                </div>
            </div>

            {/* Account Activity Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Register Date */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4 text-emerald-500" />
                            تاریخ عضویت و ثبت‌نام
                        </span>
                        <p className="text-base font-black text-slate-800 dark:text-white font-mono mt-2">
                            {formatJalaliDateTime(profileData.register_time)}
                        </p>
                        <p className="text-xs text-slate-400">
                            {getRelativeTimeAgo(profileData.register_time)}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                </div>

                {/* 2. Last Login */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <SecurityIcon className="w-4 h-4 text-sky-500" />
                            آخرین ورود به حساب
                        </span>
                        <p className="text-base font-black text-slate-800 dark:text-white font-mono mt-2">
                            {formatJalaliDateTime(profileData.last_login)}
                        </p>
                        <p className="text-xs text-slate-400">
                            {getRelativeTimeAgo(profileData.last_login)}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center text-sky-600">
                        <SecurityIcon className="w-5 h-5" />
                    </div>
                </div>

                {/* 3. Last Activity */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <BoltIcon className="w-4 h-4 text-amber-500" />
                            آخرین فعالیت و حضور
                        </span>
                        <p className="text-base font-black text-slate-800 dark:text-white font-mono mt-2">
                            {getRelativeTimeAgo(profileData.last_activity)}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]" title={profileData.last_activity_action || 'فعالیت در سامانه'}>
                            {profileData.last_activity_action || 'حضور در سامانه'}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
                        <BoltIcon className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Forms Grid: Personal Information + Security */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Personal & Professional Info */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit space-y-6">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-700">
                        <span className="w-2 h-6 bg-sky-500 rounded-full"></span>
                        مشخصات فردی و شغلی
                    </h3>
                    
                    {profileLoading ? (
                        <div className="flex justify-center p-12"><Spinner /></div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                                <ProfileField label="نام و نام خانوادگی" value={profileData.full_name || ''} onChange={v => handleProfileChange('full_name', v)} placeholder="نام کامل" />
                                <ProfileField label="شماره تماس (موبایل)" value={profileData.mobile || ''} onChange={v => handleProfileChange('mobile', v)} dir="ltr" placeholder="0912..." />
                                <ProfileField label="پست الکترونیکی (ایمیل)" value={profileData.email || ''} onChange={v => handleProfileChange('email', v)} dir="ltr" type="email" placeholder="user@domain.com" />
                                <ProfileField label="تاریخ تولد" value={profileData.birth_date || ''} onChange={v => handleProfileChange('birth_date', v)} placeholder="مثال: 1370/01/01" dir="ltr" />
                                <ProfileField label="تیپ شخصیتی (MBTI)" value={profileData.mbti || ''} onChange={v => handleProfileChange('mbti', v)} placeholder="مثال: ISTJ" />
                                <div className="md:col-span-2">
                                    <ProfileField label="API Key واتساپ" value={profileData.whatsapp_apikey || ''} onChange={v => handleProfileChange('whatsapp_apikey', v)} dir="ltr" placeholder="کلید پیام‌رسان" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">توضیحات و بیوگرافی</label>
                                    <textarea
                                        value={profileData.description || ''}
                                        onChange={(e) => handleProfileChange('description', e.target.value)}
                                        rows={3}
                                        placeholder="توضیحات تکمیلی یا یادداشت شخصی..."
                                        className="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none text-sm transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button 
                                    onClick={handleSaveProfile}
                                    disabled={profileSaving}
                                    className="px-8 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center min-w-[140px] shadow-md shadow-sky-600/20 font-bold transition-all active:scale-95 text-sm"
                                >
                                    {profileSaving ? <Spinner /> : 'ذخیره مشخصات'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Security & Credentials */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit space-y-6">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-700">
                        <SecurityIcon className="w-6 h-6 text-rose-500" />
                        امنیت و رمز عبور
                    </h3>

                    <form onSubmit={handleChangeCredentialsSubmit} className="space-y-4">
                        <CredFormField 
                            label="رمز عبور فعلی (الزامی برای هر تغییر)" 
                            name="currentPassword" 
                            type="password" 
                            value={credForm.currentPassword} 
                            onChange={handleCredFormChange} 
                            error={credErrors.currentPassword} 
                            disabled={credSaving} 
                            placeholder="رمز فعلی خود را وارد کنید"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CredFormField 
                                label="رمز عبور جدید" 
                                name="newPassword" 
                                type="password" 
                                value={credForm.newPassword} 
                                onChange={handleCredFormChange} 
                                error={credErrors.newPassword} 
                                disabled={credSaving} 
                                placeholder="رمز جدید (اختیاری)"
                            />
                            <CredFormField 
                                label="تکرار رمز عبور جدید" 
                                name="confirmNewPassword" 
                                type="password" 
                                value={credForm.confirmNewPassword} 
                                onChange={handleCredFormChange} 
                                error={credErrors.confirmNewPassword} 
                                disabled={credSaving} 
                                placeholder="تکرار رمز جدید"
                            />
                        </div>
                        
                        {credErrors.general && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-bold text-center border border-red-200 dark:border-red-800">
                                {credErrors.general}
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                            <button 
                                type="submit" 
                                disabled={credSaving} 
                                className="px-8 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:bg-rose-400 flex items-center justify-center min-w-[150px] shadow-md shadow-rose-600/20 transition-all active:scale-95 font-bold text-sm"
                            >
                                {credSaving ? <Spinner /> : 'به‌روزرسانی رمز عبور'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default MyProfilePage;
