
import React, { useState, useEffect, useMemo } from 'react';
import type { UsedCar, User } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { getUsers } from '../services/api';

interface UsedCarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (car: Omit<UsedCar, 'id' | 'createdAt'>) => void;
    car: UsedCar | null;
}

const UsedCarModal: React.FC<UsedCarModalProps> = ({ isOpen, onClose, onSave, car }) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'TECHNICAL' | 'IMAGES'>('GENERAL');
    
    // CRM Integration States
    const [crmUsers, setCrmUsers] = useState<User[]>([]);
    const [crmSearchQuery, setCrmSearchQuery] = useState('');
    const [crmResults, setCrmResults] = useState<User[]>([]);
    
    // Initial State
    const [formData, setFormData] = useState<Partial<UsedCar>>({
        sellerName: '',
        sellerPhone1: '',
        sellerPhone2: '',
        carName: '',
        modelYear: 1400,
        mileage: 0,
        color: '',
        bodyStatus: '',
        engineStatus: '',
        expertReportImage: '',
        imageFront: '',
        imageBack: '',
        imageRight: '',
        imageLeft: '',
        imageInterior: '',
        imageDashboard: '',
        imageEngine: '',
        imageTrunk: '',
        insuranceThirdParty: '',
        insuranceBody: '',
        warrantyStatus: '',
        location: 'OWNER',
        price: 0,
        salesRep: '',
        status: 'EXPERT_REVIEW',
    });

    useEffect(() => {
        if (car) {
            setFormData(car);
        } else {
            setFormData({
                sellerName: '',
                sellerPhone1: '',
                carName: '',
                modelYear: 1400,
                mileage: 0,
                location: 'OWNER',
                status: 'EXPERT_REVIEW',
            });
        }
    }, [car, isOpen]);

    useEffect(() => {
        if (isOpen) {
            getUsers()
                .then(usersData => {
                    setCrmUsers(usersData);
                })
                .catch(err => {
                    console.error("Error fetching CRM users:", err);
                });
        }
    }, [isOpen]);

    const handleCrmSearch = (query: string) => {
        setCrmSearchQuery(query);
        if (!query.trim()) {
            setCrmResults([]);
            return;
        }
        const filtered = crmUsers.filter(u => 
            (u.FullName && u.FullName.toLowerCase().includes(query.toLowerCase())) ||
            (u.Number && u.Number.includes(query))
        );
        setCrmResults(filtered);
    };

    const handleSelectCrmUser = (u: User) => {
        setFormData(prev => ({
            ...prev,
            sellerName: u.FullName || prev.sellerName,
            sellerPhone1: u.Number || prev.sellerPhone1,
        }));
        setCrmSearchQuery('');
        setCrmResults([]);
    };

    // Find if the currently typed info matches any CRM customer
    const autoMatchCrmUser = useMemo(() => {
        if (formData.sellerPhone1 && formData.sellerPhone1.length >= 4) {
            const foundByPhone = crmUsers.find(u => u.Number && u.Number.includes(formData.sellerPhone1!));
            if (foundByPhone && formData.sellerName !== foundByPhone.FullName) {
                return foundByPhone;
            }
        }
        if (formData.sellerName && formData.sellerName.length >= 3) {
            const foundByName = crmUsers.find(u => u.FullName && u.FullName.toLowerCase().includes(formData.sellerName!.toLowerCase()));
            if (foundByName && formData.sellerPhone1 !== foundByName.Number) {
                return foundByName;
            }
        }
        return null;
    }, [formData.sellerPhone1, formData.sellerName, crmUsers]);

    const handleChange = (field: keyof UsedCar, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.carName || !formData.sellerName || !formData.sellerPhone1) {
            alert('نام خودرو، نام فروشنده و شماره تماس الزامی است.');
            return;
        }
        onSave(formData as Omit<UsedCar, 'id' | 'createdAt'>);
    };

    if (!isOpen) return null;

    const InputField = ({ label, field, type = 'text', placeholder, required = false, dir }: { label: string, field: keyof UsedCar, type?: string, placeholder?: string, required?: boolean, dir?: string }) => (
        <div className="mb-3">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
            <input
                type={type}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                value={formData[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                placeholder={placeholder}
                dir={dir || (type === 'tel' || type === 'number' ? 'ltr' : 'rtl')}
            />
        </div>
    );

    const SelectField = ({ label, field, options }: { label: string, field: keyof UsedCar, options: { value: string, label: string }[] }) => (
        <div className="mb-3">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
            <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                value={formData[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{car ? 'ویرایش خودرو کارکرده' : 'ثبت خودرو کارکرده جدید'}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">اطلاعات کامل خودرو و فروشنده را وارد کنید</p>
                    </div>
                    <button onClick={onClose}><CloseIcon className="text-slate-500" /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b dark:border-slate-700 bg-white dark:bg-slate-800 px-4">
                    <button onClick={() => setActiveTab('GENERAL')} className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'GENERAL' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>اطلاعات پایه</button>
                    <button onClick={() => setActiveTab('TECHNICAL')} className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'TECHNICAL' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>وضعیت فنی</button>
                    <button onClick={() => setActiveTab('IMAGES')} className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'IMAGES' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>تصاویر</button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'GENERAL' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="col-span-full mb-2 pb-2 border-b dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <span>مشخصات فروشنده</span>
                                <span className="text-xs text-indigo-500 font-normal">یکپارچه با CRM</span>
                            </div>
                            
                            {/* CRM Search Field */}
                            <div className="col-span-full mb-4 bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">جستجو و تکمیل خودکار با مشتریان موجود در CRM</span>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="نام مشتری یا شماره تلفن را جستجو کنید..."
                                        className="w-full px-4 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 border-indigo-200 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={crmSearchQuery}
                                        onChange={e => handleCrmSearch(e.target.value)}
                                    />
                                    {crmResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl max-h-48 overflow-y-auto z-50 text-xs font-bold divide-y divide-slate-100 dark:divide-slate-700 animate-fade-in">
                                            {crmResults.map(u => (
                                                <button 
                                                    key={u.id}
                                                    type="button" 
                                                    onClick={() => handleSelectCrmUser(u)}
                                                    className="w-full text-right px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex justify-between items-center transition-colors text-slate-700 dark:text-slate-300 user-select-item"
                                                    id={`crm-user-match-${u.id}`}
                                                >
                                                    <span>{u.FullName}</span>
                                                    <span className="font-mono text-slate-400 font-normal">{u.Number}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Smart Suggestion banner */}
                            {autoMatchCrmUser && (
                                <div className="col-span-full bg-amber-50 dark:bg-amber-950/20 p-3 mb-2 rounded-xl border border-amber-100 dark:border-amber-900/30 text-xs flex justify-between items-center text-slate-700 dark:text-slate-300 animate-pulse" id="crm-auto-match-alert">
                                    <div className="flex items-center gap-2 font-bold font-sans">
                                        <span className="text-amber-500">💡</span>
                                        <span>مشتری منطبق در CRM یافت شد: <span className="text-indigo-600 dark:text-indigo-400">{autoMatchCrmUser.FullName} ({autoMatchCrmUser.Number})</span></span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleSelectCrmUser(autoMatchCrmUser)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-black transition-colors"
                                        id="crm-autofill-btn"
                                    >
                                        تکمیل هوشمند اطلاعات
                                    </button>
                                </div>
                            )}

                            <InputField label="نام و نام خانوادگی" field="sellerName" required />
                            <InputField label="شماره تماس ۱" field="sellerPhone1" type="tel" required />
                            <InputField label="شماره تماس ۲" field="sellerPhone2" type="tel" />
                            
                            <div className="col-span-full mb-2 pb-2 border-b dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 mt-2">مشخصات خودرو</div>
                            <InputField label="نام خودرو" field="carName" required />
                            <InputField label="مدل (سال ساخت)" field="modelYear" type="number" />
                            <InputField label="رنگ" field="color" />
                            <InputField label="کارکرد (کیلومتر)" field="mileage" type="number" />
                            <InputField label="قیمت پیشنهادی (تومان)" field="price" type="number" />
                            <SelectField label="محل نگهداری" field="location" options={[
                                { value: 'OWNER', label: 'نزد مالک' },
                                { value: 'SHOWROOM', label: 'در نمایشگاه' },
                                { value: 'WAREHOUSE', label: 'در انبار' },
                                { value: 'OTHER', label: 'سایر' }
                            ]} />
                            
                            <div className="col-span-full mb-2 pb-2 border-b dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 mt-2">وضعیت فروش</div>
                            <InputField label="مسئول فروش" field="salesRep" />
                            <SelectField label="وضعیت پیگیری" field="status" options={[
                                { value: 'EXPERT_REVIEW', label: 'درحال کارشناسی' },
                                { value: 'ADVERTISING', label: 'مرحله تبلیغات' },
                                { value: 'SELLING', label: 'انجام مراحل فروش' }
                            ]} />
                        </div>
                    )}

                    {activeTab === 'TECHNICAL' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">وضعیت سلامت بدنه</label>
                                    <textarea 
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                        rows={3}
                                        value={formData.bodyStatus || ''}
                                        onChange={(e) => handleChange('bodyStatus', e.target.value)}
                                        placeholder="توضیحات رنگ‌شدگی، خط و خش و..."
                                    ></textarea>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">وضعیت سلامت موتور و فنی</label>
                                    <textarea 
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                        rows={3}
                                        value={formData.engineStatus || ''}
                                        onChange={(e) => handleChange('engineStatus', e.target.value)}
                                        placeholder="توضیحات فنی..."
                                    ></textarea>
                                </div>
                                <InputField label="وضعیت بیمه شخص ثالث" field="insuranceThirdParty" placeholder="مثلا: ۶ ماه" />
                                <InputField label="وضعیت بیمه بدنه" field="insuranceBody" placeholder="مثلا: ندارد" />
                                <InputField label="وضعیت گارانتی" field="warrantyStatus" placeholder="فعال / منقضی" />
                                <div className="md:col-span-2">
                                    <InputField label="لینک تصویر برگه کارشناسی" field="expertReportImage" placeholder="https://..." dir="ltr" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'IMAGES' && (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">لینک تصاویر را در کادرهای زیر وارد کنید.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="تصویر جلو" field="imageFront" dir="ltr" />
                                <InputField label="تصویر عقب" field="imageBack" dir="ltr" />
                                <InputField label="تصویر راست" field="imageRight" dir="ltr" />
                                <InputField label="تصویر چپ" field="imageLeft" dir="ltr" />
                                <InputField label="تصویر داخل کابین" field="imageInterior" dir="ltr" />
                                <InputField label="تصویر داشبورد" field="imageDashboard" dir="ltr" />
                                <InputField label="تصویر موتور (انجین)" field="imageEngine" dir="ltr" />
                                <InputField label="تصویر صندوق عقب" field="imageTrunk" dir="ltr" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">انصراف</button>
                    <button onClick={handleSubmit} className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95">
                        {car ? 'ذخیره تغییرات' : 'ثبت خودرو'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UsedCarModal;
