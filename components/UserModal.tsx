
import React, { useState, useEffect } from 'react';
import { User, LeadStatus, MyProfile } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { sendCrmHeartbeat } from '../services/api';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'id'>) => void;
    user: User | null;
    loggedInUser: MyProfile | null;
}

const CAR_MODELS = [
    'JAC J4', 'JAC S3', 'JAC S5', 'BAC X3PRO', 'KMC T8', 'KMC T9', 'KMC A5',
    'KMC J7', 'KMC X5', 'KMC SR3', 'KMC EAGLE', 'KMC SHADOW', 'KMC SR6'
];

const initialFormState: Omit<User, 'id'> = {
    FullName: '',
    Number: '',
    CarModel: CAR_MODELS[0],
    Province: '',
    City: '',
    Decription: '',
    reference: '',
    leadStatus: LeadStatus.NEW,
    IP: null,
    RegisterTime: new Date().toISOString(),
    LastAction: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, loggedInUser }) => {
    const [formState, setFormState] = useState(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Send heartbeat when editing a lead
    useEffect(() => {
        if (!isOpen || !user || !loggedInUser) return;

        const username = loggedInUser.username || 'ناشناس';
        const fullName = loggedInUser.FullName || loggedInUser.full_name || 'کاربر سیستم';
        const leadId = Number(user.id);

        const sendHeartbeat = async () => {
            try {
                await sendCrmHeartbeat(leadId, username, fullName, true);
            } catch (err) {
                console.warn("CRM Edit Heartbeat failed:", err);
            }
        };

        sendHeartbeat();
        const timer = setInterval(sendHeartbeat, 3000);

        return () => {
            clearInterval(timer);
        };
    }, [isOpen, user, loggedInUser]);

    useEffect(() => {
        if (user) {
            // Load status from session storage shim if present, otherwise use user prop or default
            const localStatuses = JSON.parse(sessionStorage.getItem('crmStatuses') || '{}');
            const status = localStatuses[user.id] || user.leadStatus || LeadStatus.NEW;
            setFormState({ ...user, leadStatus: status });
        } else {
            setFormState(initialFormState);
        }
        setErrors({});
    }, [user, isOpen]);

    const handleChange = <T extends keyof Omit<User, 'id'>> (field: T, value: Omit<User, 'id'>[T]) => {
        setFormState(prevState => ({ ...prevState, [field]: value }));
        if (errors[field]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formState.FullName.trim()) newErrors.FullName = 'نام کامل الزامی است.';
        if (!formState.Number.trim()) newErrors.Number = 'شماره تماس الزامی است.';
        if (!/^\d{10,11}$/.test(formState.Number)) newErrors.Number = 'شماره تماس معتبر نیست.';
        if (formState.leadStatus === LeadStatus.LOST) {
            if (!formState.failReason || !formState.failReason.trim()) {
                newErrors.failReason = 'لطفاً علت شکست معامله را انتخاب کنید.';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formState);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user ? 'ویرایش سرنخ' : 'افزودن سرنخ جدید'}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="FullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نام کامل</label>
                            <input type="text" id="FullName" value={formState.FullName} onChange={(e) => handleChange('FullName', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white ${errors.FullName ? 'border-red-500' : 'border-slate-300'}`} />
                            {errors.FullName && <p className="text-red-500 text-xs mt-1">{errors.FullName}</p>}
                        </div>
                        <div>
                            <label htmlFor="Number" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">شماره تماس</label>
                            <input type="tel" id="Number" value={formState.Number} onChange={(e) => handleChange('Number', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono ${errors.Number ? 'border-red-500' : 'border-slate-300'}`} dir="ltr" />
                            {errors.Number && <p className="text-red-500 text-xs mt-1">{errors.Number}</p>}
                        </div>
                        <div>
                            <label htmlFor="CarModel" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">خودروی درخواستی</label>
                            <select id="CarModel" value={formState.CarModel} onChange={(e) => handleChange('CarModel', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300">
                                {CAR_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="leadStatus" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">وضعیت سرنخ</label>
                            <select 
                                id="leadStatus" 
                                value={formState.leadStatus || LeadStatus.NEW} 
                                onChange={(e) => handleChange('leadStatus', e.target.value as LeadStatus)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300"
                            >
                                {Object.values(LeadStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {formState.leadStatus === LeadStatus.LOST && (
                            <div className="md:col-span-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl space-y-3">
                                <label className="block text-xs font-bold text-red-700 dark:text-red-400">⚠️ علت شکست معامله (معامله ناموفق)</label>
                                <div>
                                    <select
                                        value={formState.failReason || ''}
                                        onChange={(e) => handleChange('failReason', e.target.value)}
                                        className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white border-slate-300"
                                    >
                                        <option value="">-- انتخاب علت شکست معامله --</option>
                                        <option value="قیمت بالا / عدم توافق مالی روی جزئیات معامله">قیمت بالا / عدم توافق مالی روی جزئیات معامله</option>
                                        <option value="انصراف مشتری از خرید خودرو / تغییر تصمیم">انصراف مشتری از خرید خودرو / تغییر تصمیم</option>
                                        <option value="خرید از رقیب یا همکار دیگر">خرید از رقیب یا همکار دیگر</option>
                                        <option value="عدم تایید خودرو در کارشناسی فنی و بدنه">عدم تایید خودرو در کارشناسی فنی و بدنه</option>
                                        <option value="عدم تامین نقدینگی / عدم موافقت با شرایط پرداخت">عدم تامین نقدینگی / عدم موافقت با شرایط پرداخت</option>
                                        <option value="عدم پاسخگویی مشتری به تماس‌ها و پیگیری‌های مکرر">عدم پاسخگویی مشتری به تماس‌ها و پیگیری‌های مکرر</option>
                                        <option value="یافتن مورد مناسب‌تر در بازار آزاد">یافتن مورد مناسب‌تر در بازار آزاد</option>
                                        <option value="سایر دلایل">سایر دلایل</option>
                                    </select>
                                    {errors.failReason && <p className="text-red-500 text-xs mt-1 font-bold">{errors.failReason}</p>}
                                </div>
                                <div>
                                    <textarea
                                        value={formState.failExplanation || ''}
                                        onChange={(e) => handleChange('failExplanation', e.target.value)}
                                        placeholder="توضیحات تکمیلی علت شکست معامله..."
                                        rows={2}
                                        className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white border-slate-300"
                                    />
                                </div>
                            </div>
                        )}
                         <div>
                            <label htmlFor="reference" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">مرجع</label>
                            <input type="text" id="reference" value={formState.reference} onChange={(e) => handleChange('reference', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300" />
                        </div>
                        <div>
                            <label htmlFor="Province" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">استان</label>
                            <input type="text" id="Province" value={formState.Province || ''} onChange={(e) => handleChange('Province', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300" />
                        </div>
                        <div>
                            <label htmlFor="City" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">شهر</label>
                            <input type="text" id="City" value={formState.City} onChange={(e) => handleChange('City', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="Decription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">توضیحات</label>
                            <textarea id="Decription" rows={3} value={formState.Decription} onChange={(e) => handleChange('Decription', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white" />
                        </div>
                    </div>
                    <div className="pt-4 border-t dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800 py-4 px-6">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">انصراف</button>
                        <button type="submit" className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">ذخیره</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
