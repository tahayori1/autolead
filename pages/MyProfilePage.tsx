
import React, { useState, useEffect } from 'react';
import { updateUserCredentials, hashPassword, getMyProfile, updateMyProfile } from '../services/api';
import type { MyProfile } from '../types';
import Toast from '../components/Toast';
import { UserIcon } from '../components/icons/UserIcon';
import Spinner from '../components/Spinner';
import { SecurityIcon } from '../components/icons/SecurityIcon';

const ProfileField: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (val: string) => void; 
    type?: string; 
    placeholder?: string;
    dir?: 'rtl' | 'ltr';
}> = ({ label, value, onChange, type = 'text', placeholder, dir = 'rtl' }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            dir={dir}
        />
    </div>
);

const CredFormField: React.FC<{ label: string; name: string; type: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string; disabled?: boolean; placeholder?: string; }> = 
    ({ label, name, type, value, onChange, error, disabled = false, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:text-white ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} focus:ring-2 focus:ring-sky-500 outline-none transition-all`}
            dir="ltr"
        />
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
        fetchProfile();
    }, []);

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

            await updateUserCredentials(currentPasswordHash, newUsername, newPasswordHash);
            showToast('اطلاعات ورود به‌روزرسانی شد. ممکن است لازم باشد دوباره وارد شوید.', 'success');
            setCredForm({ ...credForm, currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطا در به‌روزرسانی اطلاعات';
            showToast(errorMessage.includes('401') ? 'رمز عبور فعلی اشتباه است.' : errorMessage, 'error');
        } finally {
            setCredSaving(false);
        }
    };
    
    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr.replace(' ', 'T')).toLocaleString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <div className="p-3 bg-sky-100 dark:bg-sky-900 rounded-xl text-sky-600 dark:text-sky-300">
                    <UserIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">پروفایل من</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">مدیریت اطلاعات فردی و حساب کاربری</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-fit">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-700">
                        <span className="w-2 h-6 bg-sky-500 rounded-full"></span>
                        مشخصات فردی و شغلی
                    </h3>
                    
                    {profileLoading ? <div className="flex justify-center p-8"><Spinner /></div> : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                                <ProfileField label="نام و نام خانوادگی" value={profileData.full_name || ''} onChange={v => handleProfileChange('full_name', v)} />
                                <ProfileField label="شماره تماس (موبایل)" value={profileData.mobile || ''} onChange={v => handleProfileChange('mobile', v)} dir="ltr" />
                                <ProfileField label="ایمیل" value={profileData.email || ''} onChange={v => handleProfileChange('email', v)} dir="ltr" type="email" />
                                <ProfileField label="تاریخ تولد" value={profileData.birth_date || ''} onChange={v => handleProfileChange('birth_date', v)} placeholder="مثال: 1370/01/01" dir="ltr" />
                                <ProfileField label="تیپ شخصیتی (MBTI)" value={profileData.mbti || ''} onChange={v => handleProfileChange('mbti', v)} placeholder="مثال: ISTJ" />
                                <div className="md:col-span-2">
                                    <ProfileField label="API Key واتساپ" value={profileData.whatsapp_apikey || ''} onChange={v => handleProfileChange('whatsapp_apikey', v)} dir="ltr" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">توضیحات</label>
                                    <textarea
                                        value={profileData.description || ''}
                                        onChange={(e) => handleProfileChange('description', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 mt-2 border-t dark:border-slate-700">
                                <button 
                                    onClick={handleSaveProfile}
                                    disabled={profileSaving}
                                    className="px-8 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center min-w-[120px] shadow-sm font-bold transition-all active:scale-95"
                                >
                                    {profileSaving ? <Spinner /> : 'ذخیره مشخصات'}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-fit">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-700">
                        <SecurityIcon className="w-6 h-6 text-rose-500" />
                        امنیت و ورود
                    </h3>
                    
                    <div className="mb-6 space-y-2 text-sm p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">نام کاربری:</span><span className="font-mono font-bold text-slate-700 dark:text-slate-300">{profileData.username}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">آخرین ورود:</span><span className="font-mono text-slate-700 dark:text-slate-300">{formatDate(profileData.last_login)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">تاریخ عضویت:</span><span className="font-mono text-slate-700 dark:text-slate-300">{formatDate(profileData.register_time)}</span></div>
                    </div>

                    <form onSubmit={handleChangeCredentialsSubmit} className="space-y-5">
                        <CredFormField 
                            label="رمز عبور فعلی (الزامی برای هر تغییر)" 
                            name="currentPassword" 
                            type="password" 
                            value={credForm.currentPassword} 
                            onChange={handleCredFormChange} 
                            error={credErrors.currentPassword} 
                            disabled={credSaving} 
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <CredFormField 
                                label="رمز عبور جدید" 
                                name="newPassword" 
                                type="password" 
                                value={credForm.newPassword} 
                                onChange={handleCredFormChange} 
                                error={credErrors.newPassword} 
                                disabled={credSaving} 
                                placeholder="اختیاری"
                            />
                            <CredFormField 
                                label="تکرار رمز عبور جدید" 
                                name="confirmNewPassword" 
                                type="password" 
                                value={credForm.confirmNewPassword} 
                                onChange={handleCredFormChange} 
                                error={credErrors.confirmNewPassword} 
                                disabled={credSaving} 
                            />
                        </div>
                        
                        {credErrors.general && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
                                {credErrors.general}
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t dark:border-slate-700">
                            <button 
                                type="submit" 
                                disabled={credSaving} 
                                className="px-8 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:bg-rose-400 flex items-center justify-center min-w-[140px] shadow-sm transition-all active:scale-95 font-bold"
                            >
                                 {credSaving ? <Spinner /> : 'تغییر رمز عبور'}
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
