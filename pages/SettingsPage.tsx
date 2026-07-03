
import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/api';
import type { AppSettings } from '../services/api';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { NotificationIcon } from '../components/icons/NotificationIcon';

const FormField: React.FC<{
    label: string,
    name: keyof AppSettings,
    value: string | number,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
    type?: string,
    rows?: number,
    placeholder?: string,
    disabled?: boolean
}> = ({ label, name, value, onChange, type = 'text', rows, placeholder, disabled = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        {type === 'textarea' ? (
            <textarea
                id={name} name={name} value={value} onChange={onChange} rows={rows || 3} placeholder={placeholder} disabled={disabled}
                className="w-full px-3 py-2 border rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-50 dark:disabled:bg-slate-800"
            />
        ) : (
            <input
                id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
                className="w-full px-3 py-2 border rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-50 dark:disabled:bg-slate-800"
            />
        )}
    </div>
);

const SettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<Partial<AppSettings>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [notificationPermission, setNotificationPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const [isSubscribing, setIsSubscribing] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const fetchedSettings = await getSettings();
                setSettings(fetchedSettings);
            } catch (err) {
                showToast('خطا در دریافت تنظیمات', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: (type === 'number' && name === 'establishment_year') ? parseInt(value, 10) || '' : value,
        }));
    };

    const handleSettingsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateSettings(settings);
            showToast('تنظیمات با موفقیت ذخیره شد', 'success');
        } catch (err) {
            showToast('خطا در ذخیره تنظیمات', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNotificationPermission = async () => {
        if (Notification.permission === 'default') {
            setIsSubscribing(true);
            try {
                const permission = await Notification.requestPermission();
                setNotificationPermission(permission);
                if (permission === 'granted') {
                    showToast('اعلان‌ها با موفقیت فعال شدند.', 'success');
                    const registration = await navigator.serviceWorker.ready;
                    registration.showNotification('اعلان‌ها فعال شدند', {
                        body: 'شما از این پس اعلان‌های سرنخ‌های داغ را دریافت خواهید کرد.',
                        icon: '/vite.svg'
                    });
                } else {
                    showToast('شما اجازه ارسال اعلان‌ها را ندادید.', 'error');
                }
            } catch (error) {
                showToast('خطا در فعال‌سازی اعلان‌ها', 'error');
            } finally {
                setIsSubscribing(false);
            }
        }
    };

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <form onSubmit={handleSettingsSubmit}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">تنظیمات سیستم</h2>
                        <button
                            type="submit"
                            disabled={isSaving || loading}
                            className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center w-full sm:w-40 transition-colors"
                        >
                            {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'ذخیره تنظیمات'}
                        </button>
                    </div>

                    {loading ? (
                         <div className="flex justify-center p-8"><Spinner /></div>
                    ) : (
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 border-b pb-3 flex items-center gap-2 dark:border-slate-700">
                                    <NotificationIcon className="w-5 h-5" />
                                    تنظیمات اعلان‌ها
                                </h3>
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        برای دریافت اعلان‌ها در مورد سرنخ‌های داغ جدید، لطفاً اجازه دسترسی را بدهید.
                                    </p>
                                    {notificationPermission === 'granted' && (
                                        <div className="p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-md text-center font-semibold">
                                            اعلان‌ها فعال هستند.
                                        </div>
                                    )}
                                    {notificationPermission === 'denied' && (
                                        <div className="p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-md text-center">
                                            <p className="font-semibold">اعلان‌ها مسدود شده‌اند.</p>
                                            <p className="text-xs mt-1">برای فعال‌سازی، لطفاً از تنظیمات مرورگر خود اقدام کنید.</p>
                                        </div>
                                    )}
                                    {notificationPermission === 'default' && (
                                        <div className="pt-2 flex justify-end">
                                            <button 
                                                onClick={handleNotificationPermission} 
                                                disabled={isSubscribing}
                                                type="button"
                                                className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center w-40"
                                            >
                                                {isSubscribing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'فعال‌سازی اعلان‌ها'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 border-b pb-3 dark:border-slate-700">اطلاعات نمایندگی</h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <FormField label="نام نمایندگی" name="dealership_name" value={settings.dealership_name || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                        <FormField label="نام شرکت" name="company_name" value={settings.company_name || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                        <FormField label="URL لوگو" name="logo_url" value={settings.logo_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="سال تاسیس" name="establishment_year" value={settings.establishment_year || ''} onChange={handleSettingsChange} type="number" disabled={isSaving} />
                                        <FormField label="حوزه فعالیت" name="activity_area" value={settings.activity_area || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                    </div>
                                    <FormField label="آدرس نمایندگی" name="address" value={settings.address || ''} onChange={handleSettingsChange} type="textarea" disabled={isSaving} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="نقشه گوگل" name="google_maps_url" value={settings.google_maps_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="نقشه نشان" name="neshan_maps_url" value={settings.neshan_maps_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="تلفن های تماس" name="contact_phones" value={settings.contact_phones || ''} onChange={handleSettingsChange} placeholder="شماره‌ها را با ویرگول جدا کنید" disabled={isSaving} />
                                        <FormField label="شماره موبایل‌ها" name="mobile_numbers" value={settings.mobile_numbers || ''} onChange={handleSettingsChange} placeholder="شماره‌ها را با ویرگول جدا کنید" disabled={isSaving} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <FormField label="اینستاگرام" name="instagram_url" value={settings.instagram_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="یوتیوب" name="youtube_url" value={settings.youtube_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="کانال تلگرام" name="telegram_channel_url" value={settings.telegram_channel_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="کانال واتساپ" name="whatsapp_channel_url" value={settings.whatsapp_channel_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="تردز (Threads)" name="threads_url" value={settings.threads_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                    </div>
                                    <FormField label="مزیت‌های رقابتی" name="competitive_advantages" value={settings.competitive_advantages || ''} onChange={handleSettingsChange} type="textarea" disabled={isSaving} />
                                    <FormField label="توضیحات" name="description" value={settings.description || ''} onChange={handleSettingsChange} type="textarea" disabled={isSaving} />
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 border-b pb-3 dark:border-slate-700">تنظیمات API</h3>
                                <div className="space-y-4">
                                    <FormField label="کلید API واتساپ" name="whatsappApiKey" type="text" value={settings.whatsappApiKey || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                    <FormField label="کلید API پیامک (SMS)" name="smsApiKey" type="text" value={settings.smsApiKey || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                    <FormField label="کلید API دیدار" name="didarApiKey" type="text" value={settings.didarApiKey || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                </div>
                            </div>

                        </div>
                    )}
                </form>
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default SettingsPage;
