import React, { useState, useEffect } from 'react';
import type { CarSaleCondition, Car, User, UsedCar } from '../types';
import { ConditionStatus, SaleType, PayType, DocumentStatus } from '../types';
import { getUsers, createUser, usedCarsService } from '../services/api';
import { CloseIcon } from './icons/CloseIcon';
import { Search, UserCheck, CheckCircle2, AlertCircle, FileText, UserPlus, Info } from 'lucide-react';

interface ConditionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (condition: Omit<CarSaleCondition, 'id'>) => void;
    condition: CarSaleCondition | null;
    cars: Car[];
}

const AVAILABLE_COLORS = ['سفید', 'مشکی', 'خاکستری', 'آبی', 'قرمز', 'قهوه ای', 'سایر'];

/**
 * Utility to convert numbers to Persian words
 */
const numberToPersianWords = (num: number): string => {
    if (num === 0) return 'صفر';
    if (!num) return '';

    const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    const steps = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

    const convertThreeDigits = (n: number): string => {
        let res = '';
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (h > 0) res += hundreds[h];
        
        if (t > 0 || u > 0) {
            if (res !== '') res += ' و ';
            if (t === 1) {
                res += teens[u];
            } else {
                if (t > 1) res += tens[t];
                if (u > 0) {
                    if (t > 1) res += ' و ';
                    res += units[u];
                }
            }
        }
        return res;
    };

    let result = '';
    let stepCount = 0;

    while (num > 0) {
        const threeDigits = num % 1000;
        if (threeDigits > 0) {
            const word = convertThreeDigits(threeDigits);
            const stepName = steps[stepCount];
            result = word + (stepName ? ' ' + stepName : '') + (result !== '' ? ' و ' + result : '');
        }
        num = Math.floor(num / 1000);
        stepCount++;
    }

    return result.trim();
};

const ConditionModal: React.FC<ConditionModalProps> = ({ isOpen, onClose, onSave, condition, cars }) => {
    
    // Fallback to first car if available, or empty string
    const defaultCarModel = cars.length > 0 ? cars[0].name : '';

    const initialFormState: Omit<CarSaleCondition, 'id'> = {
        car_model: defaultCarModel,
        model: 1404, // Default to 1404 as requested
        status: ConditionStatus.AVAILABLE,
        sale_type: SaleType.FACTORY_REGISTRATION,
        pay_type: PayType.CASH,
        document_status: DocumentStatus.FREE,
        colors: ['سفید', 'مشکی'], // Default colors as requested
        delivery_time: '',
        initial_deposit: 600000000, // Default to 600 million as requested
        descriptions: '',
        is_public: true,
        stock_quantity: 0,
        owner_id: null,
        owner_name: null,
        owner_phone: null,
        expert_report_id: null,
        expert_report_title: null,
    };

    const [formState, setFormState] = useState(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // CRM and Used Cars lists
    const [crmUsers, setCrmUsers] = useState<User[]>([]);
    const [usedCars, setUsedCars] = useState<UsedCar[]>([]);

    // Search and Auto-suggestion states
    const [ownerSearch, setOwnerSearch] = useState('');
    const [showOwnerSuggestions, setShowOwnerSuggestions] = useState(false);
    
    const [appraisalSearch, setAppraisalSearch] = useState('');
    const [showAppraisalSuggestions, setShowAppraisalSuggestions] = useState(false);

    // New CRM customer registration state
    const [showNewOwnerForm, setShowNewOwnerForm] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserPhone, setNewUserPhone] = useState('');
    const [isCreatingCRMUser, setIsCreatingCRMUser] = useState(false);

    // Fetch lists when the modal opens
    useEffect(() => {
        if (isOpen) {
            const loadExternalData = async () => {
                try {
                    const [usersList, usedCarsList] = await Promise.all([
                        getUsers(),
                        usedCarsService.getAll()
                    ]);
                    setCrmUsers(usersList);
                    setUsedCars(usedCarsList);
                } catch (error) {
                    console.error("خطا در بارگذاری اطلاعات CRM یا کارشناسی‌ها:", error);
                }
            };
            loadExternalData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (condition) {
            setFormState({
                ...initialFormState,
                ...condition
            });
            if (condition.owner_name) {
                setOwnerSearch(condition.owner_name);
            } else {
                setOwnerSearch('');
            }

            if (condition.expert_report_id) {
                setAppraisalSearch(condition.expert_report_title || 'گزارش متصل شده');
            } else {
                setAppraisalSearch('');
            }
        } else {
            setFormState({
                ...initialFormState,
                car_model: cars.length > 0 ? cars[0].name : ''
            });
            setOwnerSearch('');
            setAppraisalSearch('');
        }
        setErrors({});
        setShowNewOwnerForm(false);
    }, [condition, isOpen, cars]);

    const handleChange = <T extends keyof typeof initialFormState,>(field: T, value: (typeof initialFormState)[T]) => {
        setFormState(prevState => ({ ...prevState, [field]: value }));
        if (errors[field]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const toggleColor = (color: string) => {
        const currentColors = [...formState.colors];
        const index = currentColors.indexOf(color);
        if (index > -1) {
            currentColors.splice(index, 1);
        } else {
            currentColors.push(color);
        }
        handleChange('colors', currentColors);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formState.car_model.trim()) newErrors.car_model = 'مدل خودرو الزامی است.';
        if (!formState.delivery_time.trim()) newErrors.delivery_time = 'زمان تحویل الزامی است.';
        if (formState.initial_deposit <= 0) {
            newErrors.initial_deposit = formState.pay_type === 'نقدی' 
                ? 'قیمت خودرو باید بزرگتر از صفر باشد.' 
                : 'مبلغ پیش‌پرداخت باید بزرگتر از صفر باشد.';
        }
        if (formState.colors.length === 0) newErrors.colors = 'حداقل یک رنگ باید انتخاب شود.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formState);
        }
    };

    // Handler to create a new CRM User and select them as owner
    const handleCreateCRMUser = async () => {
        if (!newUserName.trim() || !newUserPhone.trim()) {
            alert('لطفاً نام کامل و شماره همراه را وارد کنید.');
            return;
        }
        setIsCreatingCRMUser(true);
        try {
            const created = await createUser({
                FullName: newUserName.trim(),
                Number: newUserPhone.trim(),
                CarModel: formState.car_model || 'ثبت دستی از بخش شرایط فروش',
                Province: '',
                City: '',
                Decription: 'ثبت خودکار مالک از بخش بخشنامه‌های فروش',
                IP: '',
                RegisterTime: new Date().toLocaleDateString('fa-IR'),
                reference: 'ثبت شرایط فروش',
                LastAction: 'ثبت مالک',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Update local CRM list & Select the registered user
            setCrmUsers(prev => [created, ...prev]);
            
            setFormState(prev => ({
                ...prev,
                owner_id: created.id,
                owner_name: created.FullName,
                owner_phone: created.Number
            }));

            setOwnerSearch(created.FullName);
            setShowOwnerSuggestions(false);
            setShowNewOwnerForm(false);
            setNewUserName('');
            setNewUserPhone('');
        } catch (error) {
            console.error(error);
            alert('خطا در ثبت مشتری جدید در CRM');
        } finally {
            setIsCreatingCRMUser(false);
        }
    };

    // Handler for selecting an appraised used car
    const handleSelectUsedCar = (car: UsedCar) => {
        const titleStr = `${car.carName} (مدل ${car.modelYear}) - مالک: ${car.sellerName}`;
        setAppraisalSearch(car.carName);
        setShowAppraisalSuggestions(false);

        // Try to automatically find this seller in CRM list by phone
        const matchedCRMUser = crmUsers.find(u => u.Number === car.sellerPhone1);

        setFormState(prev => ({
            ...prev,
            car_model: car.carName,
            model: car.modelYear,
            initial_deposit: car.price || prev.initial_deposit,
            expert_report_id: car.id,
            expert_report_title: titleStr,
            owner_id: matchedCRMUser ? matchedCRMUser.id : null,
            owner_name: matchedCRMUser ? matchedCRMUser.FullName : car.sellerName,
            owner_phone: matchedCRMUser ? matchedCRMUser.Number : car.sellerPhone1,
            descriptions: `یکپارچه با سیستم کارشناسی خودرو کارکرده (کد کارشناسی: ${car.id}) | بدنه: ${car.bodyStatus} | موتور: ${car.engineStatus} | محل خودرو: ${car.location}. ${prev.descriptions || ''}`
        }));

        if (matchedCRMUser) {
            setOwnerSearch(matchedCRMUser.FullName);
        } else {
            setOwnerSearch(car.sellerName);
        }
    };

    // Filter CRM users for owner search suggestion
    const filteredCRMUsers = ownerSearch.trim() === '' ? [] : crmUsers.filter(u =>
        (u.FullName && u.FullName.toLowerCase().includes(ownerSearch.toLowerCase())) ||
        (u.Number && u.Number.includes(ownerSearch))
    ).slice(0, 5);

    // Filter appraised used cars
    const filteredUsedCars = appraisalSearch.trim() === '' ? [] : usedCars.filter(c =>
        (c.carName && c.carName.toLowerCase().includes(appraisalSearch.toLowerCase())) ||
        (c.sellerName && c.sellerName.toLowerCase().includes(appraisalSearch.toLowerCase()))
    ).slice(0, 5);

    const isOwnerRequired = formState.sale_type === SaleType.NEW_MARKET || formState.sale_type === SaleType.USED;
    const isAppraisalRequired = formState.sale_type === SaleType.USED;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        {condition && condition.id !== 0 ? 'ویرایش شرط فروش' : 'افزودن شرط فروش جدید'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Sale Type */}
                        <div>
                            <label htmlFor="sale_type" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">نوع فروش</label>
                            <select 
                                id="sale_type" 
                                value={formState.sale_type} 
                                onChange={(e) => handleChange('sale_type', e.target.value as SaleType)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white font-bold text-indigo-600 dark:text-indigo-400"
                            >
                                {Object.values(SaleType).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">وضعیت</label>
                            <select id="status" value={formState.status} onChange={(e) => handleChange('status', e.target.value as ConditionStatus)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white">
                                {Object.values(ConditionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* INTEGRATION: USED CAR APPRAISAL AUTOMATION SECTION */}
                        {isAppraisalRequired && (
                            <div className="md:col-span-2 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400">
                                    <FileText className="w-4 h-4" />
                                    <span>یکپارچه‌سازی با بخش کارشناسی خودروهای کارکرده اتوماسیون</span>
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">انتخاب خودرو از کارشناسی‌های انجام شده</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={appraisalSearch}
                                            onChange={(e) => {
                                                setAppraisalSearch(e.target.value);
                                                setShowAppraisalSuggestions(true);
                                            }}
                                            onFocus={() => setShowAppraisalSuggestions(true)}
                                            placeholder="نام خودرو یا نام فروشنده را جستجو کنید..."
                                            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        />
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                    </div>

                                    {/* Appraised Cars Suggestions dropdown */}
                                    {showAppraisalSuggestions && filteredUsedCars.length > 0 && (
                                        <div className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl divide-y divide-slate-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
                                            {filteredUsedCars.map(car => (
                                                <button
                                                    key={car.id}
                                                    type="button"
                                                    onClick={() => handleSelectUsedCar(car)}
                                                    className="w-full text-right px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs flex justify-between items-center transition-colors"
                                                >
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-white">{car.carName}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">مدل: {car.modelYear} | مالک: {car.sellerName} | قیمت: {car.price ? `${car.price.toLocaleString('fa-IR')} تومان` : 'نامشخص'}</p>
                                                    </div>
                                                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                                                        کارشناسی شده
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {formState.expert_report_id && (
                                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <span className="font-bold">متصل به کارشناسی: {formState.expert_report_title}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormState(prev => ({ ...prev, expert_report_id: null, expert_report_title: null }));
                                                setAppraisalSearch('');
                                            }}
                                            className="text-slate-400 hover:text-red-500 text-[10px] font-black"
                                        >
                                            قطع اتصال
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CRM OWNER INTEGRATION PANEL */}
                        {isOwnerRequired && (
                            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300">
                                        <UserCheck className="w-4 h-4 text-sky-600" />
                                        <span>مشخصات و اطلاعات مالک خودرو (CRM)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewOwnerForm(!showNewOwnerForm)}
                                        className="text-[11px] text-sky-600 dark:text-sky-400 font-black flex items-center gap-1 hover:underline"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        {showNewOwnerForm ? 'انصراف' : 'ثبت مالک جدید در CRM'}
                                    </button>
                                </div>

                                {/* Inline Register CRM Customer Form */}
                                {showNewOwnerForm && (
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in shadow-sm">
                                        <h5 className="text-xs font-black text-slate-800 dark:text-white">ثبت مشتری جدید در سیستم CRM نمایندگی</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">نام و نام خانوادگی کامل</label>
                                                <input
                                                    type="text"
                                                    value={newUserName}
                                                    onChange={(e) => setNewUserName(e.target.value)}
                                                    placeholder="مثال: رضا حسینی"
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">شماره تلفن همراه</label>
                                                <input
                                                    type="text"
                                                    value={newUserPhone}
                                                    onChange={(e) => setNewUserPhone(e.target.value)}
                                                    placeholder="مثال: 09123456789"
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 text-left font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowNewOwnerForm(false)}
                                                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold"
                                            >
                                                انصراف
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCreateCRMUser}
                                                disabled={isCreatingCRMUser}
                                                className="px-4 py-1 bg-sky-600 text-white rounded text-[10px] font-bold flex items-center gap-1.5"
                                            >
                                                {isCreatingCRMUser ? 'در حال ثبت...' : 'ثبت و انتخاب در بخشنامه'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Search existing CRM Users input */}
                                {!showNewOwnerForm && (
                                    <div className="relative">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">جستجوی نام یا تلفن مالک در لیست CRM</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={ownerSearch}
                                                onChange={(e) => {
                                                    setOwnerSearch(e.target.value);
                                                    setShowOwnerSuggestions(true);
                                                }}
                                                onFocus={() => setShowOwnerSuggestions(true)}
                                                placeholder="نام مالک یا شماره همراه او را تایپ کنید..."
                                                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                            />
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        </div>

                                        {/* Suggestions dropdown */}
                                        {showOwnerSuggestions && filteredCRMUsers.length > 0 && (
                                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl divide-y divide-slate-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
                                                {filteredCRMUsers.map(user => (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormState(prev => ({
                                                                ...prev,
                                                                owner_id: user.id,
                                                                owner_name: user.FullName,
                                                                owner_phone: user.Number
                                                            }));
                                                            setOwnerSearch(user.FullName);
                                                            setShowOwnerSuggestions(false);
                                                        }}
                                                        className="w-full text-right px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs flex justify-between items-center transition-colors"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-white">{user.FullName}</p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">تلفن همراه: {user.Number} {user.CarModel ? `| خودرو: ${user.CarModel}` : ''}</p>
                                                        </div>
                                                        <span className="text-[9px] bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-400 font-bold px-1.5 py-0.5 rounded">
                                                            مشتری CRM
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Selected Owner Status Card */}
                                {formState.owner_name ? (
                                    <div className="bg-sky-50 dark:bg-sky-950/20 p-2.5 rounded-lg border border-sky-100 dark:border-sky-900/40 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-sky-800 dark:text-sky-400">
                                            <CheckCircle2 className="w-4 h-4 text-sky-500" />
                                            <div>
                                                <span className="font-bold">مالک انتخاب شده: {formState.owner_name}</span>
                                                <span className="text-slate-400 dark:text-slate-500 mr-2">({formState.owner_phone})</span>
                                            </div>
                                        </div>
                                        {formState.owner_id && (
                                            <span className="text-[9px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold px-1.5 py-0.5 rounded-full">
                                                متصل به شناسه CRM: {formState.owner_id}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/40 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <Info className="w-4 h-4 text-slate-400" />
                                        <span>هیچ مالکی برای این خودرو مشخص نشده است (انتخاب مالک اختیاری است).</span>
                                    </div>
                                )}
                                {errors.owner_name && <p className="text-red-500 text-xs font-bold">{errors.owner_name}</p>}
                            </div>
                        )}

                        {/* Car Model Select */}
                        <div>
                            <label htmlFor="car_model" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">مدل خودرو</label>
                            <select id="car_model" value={formState.car_model} onChange={(e) => handleChange('car_model', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white ${errors.car_model ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                <option value="">انتخاب کنید...</option>
                                {cars.map(car => <option key={car.id} value={car.name}>{car.name}</option>)}
                            </select>
                            {errors.car_model && <p className="text-red-500 text-xs mt-1">{errors.car_model}</p>}
                        </div>

                        {/* Year */}
                        <div>
                            <label htmlFor="model" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">سال مدل (عددی)</label>
                            <input 
                                type="number" 
                                id="model" 
                                value={formState.model} 
                                onChange={(e) => handleChange('model', parseInt(e.target.value, 10) || 0)}
                                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white font-mono ${errors.model ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                            />
                            {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                        </div>

                        {/* Stock count */}
                        <div>
                            <label htmlFor="stock_quantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تعداد موجود در انبار</label>
                            <input type="number" id="stock_quantity" value={formState.stock_quantity ?? ''} onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value, 10) || 0)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white" />
                        </div>

                        {/* Payment method */}
                        <div>
                            <label htmlFor="pay_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نحوه پرداخت</label>
                             <select id="pay_type" value={formState.pay_type} onChange={(e) => handleChange('pay_type', e.target.value as PayType)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white">
                                {Object.values(PayType).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        {/* Document status */}
                        <div>
                            <label htmlFor="document_status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">وضعیت سند</label>
                             <select id="document_status" value={formState.document_status} onChange={(e) => handleChange('document_status', e.target.value as DocumentStatus)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white">
                                {Object.values(DocumentStatus).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        {/* Delivery timeframe */}
                        <div>
                            <label htmlFor="delivery_time" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">زمان تحویل</label>
                            <input type="text" id="delivery_time" value={formState.delivery_time} onChange={(e) => handleChange('delivery_time', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:text-white ${errors.delivery_time ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`} />
                            {errors.delivery_time && <p className="text-red-500 text-xs mt-1">{errors.delivery_time}</p>}
                        </div>

                        {/* Initial Deposit / Price */}
                        <div className="md:col-span-2">
                            <label htmlFor="initial_deposit" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {formState.pay_type === 'نقدی' ? 'قیمت خودرو (تومان)' : 'مبلغ پیش‌پرداخت (تومان)'}
                            </label>
                            <input 
                                type="number" 
                                id="initial_deposit" 
                                value={formState.initial_deposit || ''} 
                                onChange={(e) => handleChange('initial_deposit', parseInt(e.target.value, 10) || 0)}
                                className={`w-full px-4 py-2.5 border rounded-lg dark:bg-slate-700 dark:text-white font-mono text-xl font-black ${errors.initial_deposit ? 'border-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500'}`} 
                            />
                            
                            {/* Real-time Number to Words Display */}
                            <div className={`mt-2 p-4 rounded-xl border transition-all duration-300 ${formState.initial_deposit > 0 ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800 scale-100 opacity-100' : 'bg-slate-50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800 scale-95 opacity-50'}`}>
                                <p className="text-[10px] font-black text-sky-600 dark:text-sky-400 mb-1 uppercase tracking-wider">معادل به حروف:</p>
                                <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-relaxed">
                                    {formState.initial_deposit > 0 ? `${numberToPersianWords(formState.initial_deposit)} تومان` : '---'}
                                </p>
                            </div>
                            
                            {errors.initial_deposit && <p className="text-red-500 text-xs mt-1 font-bold">{errors.initial_deposit}</p>}
                        </div>

                        {/* Public display checkmark */}
                        <div className="flex items-center gap-2 pt-2 col-span-1">
                            <input 
                                type="checkbox" 
                                id="is_public" 
                                checked={formState.is_public} 
                                onChange={(e) => handleChange('is_public', e.target.checked)}
                                className="w-5 h-5 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                            />
                            <label htmlFor="is_public" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">نمایش عمومی در سایت</label>
                        </div>

                        {/* Colors selection */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">انتخاب رنگ‌های مجاز</label>
                            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                {AVAILABLE_COLORS.map(color => {
                                    const isSelected = formState.colors.includes(color);
                                    return (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => toggleColor(color)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                                isSelected 
                                                ? 'bg-sky-600 border-sky-600 text-white shadow-md' 
                                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-sky-400'
                                            }`}
                                        >
                                            {color}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.colors && <p className="text-red-500 text-xs mt-1">{errors.colors}</p>}
                        </div>
                    </div>

                    {/* Descriptions */}
                    <div className="md:col-span-2">
                        <label htmlFor="descriptions" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">توضیحات بخشنامه فروش</label>
                        <textarea id="descriptions" rows={3} value={formState.descriptions || ''} onChange={(e) => handleChange('descriptions', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white" />
                    </div>

                    {/* Actions footer */}
                    <div className="pt-4 border-t dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800 py-4 px-6">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-bold">انصراف</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold shadow-lg shadow-indigo-200 dark:shadow-none">ذخیره بخشنامه</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConditionModal;
