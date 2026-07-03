import React, { useState, useEffect } from 'react';
import type { DealershipInfo } from '../types';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const initialFormState: DealershipInfo = {
    dealership_name: '',
    company_name: '',
    logo_url: '',
    establishment_year: '',
    activity_area: '',
    address: '',
    google_maps_url: '',
    neshan_maps_url: '',
    contact_phones: '',
    mobile_numbers: '',
    instagram_url: '',
    youtube_url: '',
    telegram_channel_url: '',
    whatsapp_channel_url: '',
    threads_url: '',
    competitive_advantages: '',
    description: '',
};

const FormField: React.FC<{ label: string, name: keyof DealershipInfo, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, type?: string, rows?: number, placeholder?: string }> = 
({ label, name, value, onChange, type = 'text', rows, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        {type === 'textarea' ? (
            <textarea
                id={name} name={name} value={value} onChange={onChange} rows={rows || 3} placeholder={placeholder}
                className="w-full px-3 py-2 border rounded-md border-slate-300 focus:ring-sky-500 focus:border-sky-500"
            />
        ) : (
            <input
                id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
                className="w-full px-3 py-2 border rounded-md border-slate-300 focus:ring-sky-500 focus:border-sky-500"
            />
        )}
    </div>
);

const DealershipPage: React.FC = () => {
    const [formState, setFormState] = useState<DealershipInfo>(initialFormState);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        // Simulate loading saved data
        setLoading(true);
        setTimeout(() => {
            const savedData = localStorage.getItem('dealershipInfo');
            if (savedData) {
                setFormState(JSON.parse(savedData));
            }
            setLoading(false);
        }, 500);
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: (type === 'number') ? parseInt(value, 10) || '' : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate saving data
        setTimeout(() => {
            localStorage.setItem('dealershipInfo', JSON.stringify(formState));
            setIsSaving(false);
            showToast('اطلاعات نمایندگی با موفقیت ذخیره شد.', 'success');
        }, 1000);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Spinner />
            </div>
        );
    }

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit}>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center border-b pb-4 mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">اطلاعات نمایندگی</h2>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center w-28"
                            >
                                {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'ذخیره'}
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <FormField label="نام نمایندگی" name="dealership_name" value={formState.dealership_name} onChange={handleChange} />
                                <FormField label="نام شرکت" name="company_name" value={formState.company_name} onChange={handleChange} />
                                <FormField label="URL لوگو" name="logo_url" value={formState.logo_url} onChange={handleChange} type="url" />
                                <FormField label="سال تاسیس" name="establishment_year" value={formState.establishment_year} onChange={handleChange} type="number" />
                                <FormField label="حوزه فعالیت" name="activity_area" value={formState.activity_area} onChange={handleChange} />
                            </div>
                             <FormField label="آدرس نمایندگی" name="address" value={formState.address} onChange={handleChange} type="textarea" />

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="نقشه گوگل" name="google_maps_url" value={formState.google_maps_url} onChange={handleChange} type="url" />
                                <FormField label="نقشه نشان" name="neshan_maps_url" value={formState.neshan_maps_url} onChange={handleChange} type="url" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <FormField label="تلفن های تماس" name="contact_phones" value={formState.contact_phones} onChange={handleChange} placeholder="شماره‌ها را با ویرگول جدا کنید" />
                               <FormField label="شماره موبایل‌ها" name="mobile_numbers" value={formState.mobile_numbers} onChange={handleChange} placeholder="شماره‌ها را با ویرگول جدا کنید" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <FormField label="اینستاگرام" name="instagram_url" value={formState.instagram_url} onChange={handleChange} type="url" />
                                <FormField label="یوتیوب" name="youtube_url" value={formState.youtube_url} onChange={handleChange} type="url" />
                                <FormField label="کانال تلگرام" name="telegram_channel_url" value={formState.telegram_channel_url} onChange={handleChange} type="url" />
                                <FormField label="کانال واتساپ" name="whatsapp_channel_url" value={formState.whatsapp_channel_url} onChange={handleChange} type="url" />
                                <FormField label="تردز (Threads)" name="threads_url" value={formState.threads_url} onChange={handleChange} type="url" />
                            </div>
                            <FormField label="مزیت‌های رقابتی" name="competitive_advantages" value={formState.competitive_advantages} onChange={handleChange} type="textarea" />
                            <FormField label="توضیحات" name="description" value={formState.description} onChange={handleChange} type="textarea" />
                        </div>
                    </div>
                </form>
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default DealershipPage;