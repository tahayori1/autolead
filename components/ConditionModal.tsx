import React, { useState, useEffect } from 'react';
import type { CarSaleCondition, Car, User, UsedCar } from '../types';
import { ConditionStatus, SaleType, PayType, DocumentStatus } from '../types';
import { getUsers, createUser, createCustomerJournal, createCallLog, usedCarsService, createCar, formatConditionDateTime } from '../services/api';
import { CloseIcon } from './icons/CloseIcon';
import CarModal from './CarModal';
import { 
    Search, 
    UserCheck, 
    User as UserIcon,
    CheckCircle2, 
    AlertCircle, 
    FileText, 
    UserPlus, 
    Info, 
    Car as CarIcon, 
    Plus, 
    Clock, 
    Check, 
    Building2, 
    Palette, 
    Calendar, 
    CreditCard, 
    ShieldCheck, 
    DollarSign, 
    Layers, 
    Sparkles,
    ChevronDown,
    Building
} from 'lucide-react';
import Spinner from './Spinner';

interface ConditionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (condition: Omit<CarSaleCondition, 'id'>) => void;
    condition: CarSaleCondition | null;
    cars: Car[];
    onCarCreated?: (car: Car) => void;
}

const AVAILABLE_COLORS = ['سفید', 'مشکی', 'خاکستری', 'نوک مدادی', 'آبی', 'قرمز', 'نقره ای', 'قهوه ای', 'تیتانیوم', 'سایر'];

const PRESET_DELIVERY_TIMES = [
    'فوری',
    'آنی',
    '۱۴ روز کاری',
    '۲۰ روز کاری',
    '۳۰ روز کاری',
    '۶۰ روز کاری',
    '۹۰ روز کاری'
];

const PREDEFINED_OWNERS = [
    'حسینی خودرو',
    'کرمان موتور',
    'واسپاری',
    'سیگما'
];

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

const ConditionModal: React.FC<ConditionModalProps> = ({ isOpen, onClose, onSave, condition, cars: initialCars, onCarCreated }) => {
    const [carsList, setCarsList] = useState<Car[]>(initialCars);
    
    // Add car modal state (exact same modal as CarsPage)
    const [isCarModalOpen, setIsCarModalOpen] = useState(false);

    // Form core state
    const initialFormState: Omit<CarSaleCondition, 'id'> = {
        car_model: initialCars.length > 0 ? initialCars[0].name : '',
        model: 1404,
        status: ConditionStatus.AVAILABLE,
        sale_type: SaleType.FACTORY_REGISTRATION,
        pay_type: PayType.CASH,
        document_status: DocumentStatus.FREE,
        colors: ['سفید', 'مشکی'],
        delivery_time: 'فوری',
        initial_deposit: 600000000,
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

    // Storage Location
    const [storageLocation, setStorageLocation] = useState<'انبار' | 'نمایشگاه' | 'شرکت' | 'کارخانه'>('کارخانه');

    // Installment specific wizard state
    const [installmentPeriod, setInstallmentPeriod] = useState<'یکساله' | 'دوساله' | 'دلخواه'>('یکساله');
    const [customInstallmentPeriod, setCustomInstallmentPeriod] = useState('');
    const [installmentAmount, setInstallmentAmount] = useState<number>(0);
    const [chequeCount, setChequeCount] = useState<string>('4 فقره');
    const [chequeAmount, setChequeAmount] = useState<number>(0);
    const [chequeInterval, setChequeInterval] = useState<string>('هر ۳ ماه یکبار');
    const [installmentNotes, setInstallmentNotes] = useState<string>('');

    // Pre-sale specific wizard state
    const [preSaleFirstPayment, setPreSaleFirstPayment] = useState<number>(600000000);
    const [preSaleNextPayments, setPreSaleNextPayments] = useState<string>('');
    const [invitationDate, setInvitationDate] = useState<string>('');
    const [preSaleNotes, setPreSaleNotes] = useState<string>('');

    // Owner selector mode: 'PREDEFINED' | 'CRM'
    const [ownerType, setOwnerType] = useState<'PREDEFINED' | 'CRM'>('PREDEFINED');
    const [selectedPredefinedOwner, setSelectedPredefinedOwner] = useState<string>('');

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

    // Sync incoming cars
    useEffect(() => {
        setCarsList(initialCars);
    }, [initialCars]);

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

    // Handle Storage location rules based on Sale Type
    useEffect(() => {
        if (formState.sale_type === SaleType.FACTORY_REGISTRATION || formState.sale_type === SaleType.TRANSFER) {
            setStorageLocation('کارخانه');
        } else {
            // NEW_MARKET, USED, LEASING
            if (storageLocation === 'کارخانه') {
                setStorageLocation('نمایشگاه');
            }
        }
    }, [formState.sale_type]);

    // Sync initial condition when modal opens or condition changes
    useEffect(() => {
        if (condition) {
            setFormState({
                ...initialFormState,
                ...condition
            });

            // Parse owner
            if (condition.owner_name) {
                if (PREDEFINED_OWNERS.includes(condition.owner_name)) {
                    setOwnerType('PREDEFINED');
                    setSelectedPredefinedOwner(condition.owner_name);
                    setOwnerSearch('');
                } else {
                    setOwnerType('CRM');
                    setSelectedPredefinedOwner('');
                    setOwnerSearch(condition.owner_name);
                }
            } else {
                setSelectedPredefinedOwner('');
                setOwnerSearch('');
            }

            if (condition.expert_report_id) {
                setAppraisalSearch(condition.expert_report_title || 'گزارش متصل شده');
            } else {
                setAppraisalSearch('');
            }

            if (condition.pay_type === PayType.PRE_SALE) {
                setPreSaleFirstPayment(condition.initial_deposit);
            }
        } else {
            setFormState({
                ...initialFormState,
                car_model: carsList.length > 0 ? carsList[0].name : ''
            });
            setSelectedPredefinedOwner('');
            setOwnerSearch('');
            setAppraisalSearch('');
        }
        setErrors({});
        setShowNewOwnerForm(false);
        setIsCarModalOpen(false);
    }, [condition, isOpen, carsList]);

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

    // Handle Save New Car from CarModal (same workflow as CarsPage)
    const handleSaveNewCar = async (carData: Omit<Car, 'id'>) => {
        try {
            const created = await createCar(carData);
            const updatedCars = [created, ...carsList];
            setCarsList(updatedCars);
            handleChange('car_model', created.name);
            if (onCarCreated) onCarCreated(created);
            setIsCarModalOpen(false);
        } catch (error) {
            console.error("Error creating car:", error);
            alert('خطا در افزودن خودرو جدید به پایگاه داده');
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formState.car_model.trim()) newErrors.car_model = 'انتخاب یا ورود مدل خودرو الزامی است.';
        if (!formState.delivery_time.trim()) newErrors.delivery_time = 'زمان تحویل الزامی است.';
        if (formState.initial_deposit <= 0) {
            newErrors.initial_deposit = formState.pay_type === PayType.CASH 
                ? 'قیمت خودرو باید بزرگتر از صفر باشد.' 
                : 'مبلغ پیش‌پرداخت / پرداخت مرحله اول باید بزرگتر از صفر باشد.';
        }
        if (formState.colors.length === 0) newErrors.colors = 'حداقل یک رنگ باید انتخاب شود.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        // Auto-compile structured details into descriptions
        let compiledDescriptions = formState.descriptions || '';
        const detailSections: string[] = [];

        // 1. Storage Location
        detailSections.push(`محل نگهداری خودرو: ${storageLocation}`);

        // 2. Installment Details
        if (formState.pay_type === PayType.INSTALLMENT) {
            const periodStr = installmentPeriod === 'دلخواه' ? (customInstallmentPeriod || 'دلخواه') : installmentPeriod;
            const instLines = [
                `⚡ شرایط اقساط: دوره ${periodStr}`,
                chequeCount ? `تعداد چک‌ها: ${chequeCount}` : '',
                chequeInterval ? `فواصل چک‌ها / اقساط: ${chequeInterval}` : '',
                chequeAmount > 0 ? `مبلغ هر چک: ${chequeAmount.toLocaleString('fa-IR')} تومان` : '',
                installmentAmount > 0 ? `مبلغ کل اقساط: ${installmentAmount.toLocaleString('fa-IR')} تومان` : '',
                installmentNotes ? `توضیحات اقساط: ${installmentNotes}` : ''
            ].filter(Boolean);
            if (instLines.length > 0) {
                detailSections.push(instLines.join(' | '));
            }
        }

        // 3. Pre-Sale Details
        if (formState.pay_type === PayType.PRE_SALE) {
            const preLines = [
                `📋 شرایط پیش‌فروش: مبلغ مرحله اول: ${formState.initial_deposit.toLocaleString('fa-IR')} تومان`,
                preSaleNextPayments ? `سایر مراحل و نحوه پرداخت: ${preSaleNextPayments}` : '',
                invitationDate ? `زمان ارسال دعوت‌نامه: ${invitationDate}` : '',
                preSaleNotes ? `توضیحات پیش‌فروش: ${preSaleNotes}` : ''
            ].filter(Boolean);
            if (preLines.length > 0) {
                detailSections.push(preLines.join(' | '));
            }
        }

        // Merge descriptions without duplicate location stamps
        if (detailSections.length > 0) {
            const newDetailsText = detailSections.join('\n');
            if (compiledDescriptions.trim()) {
                // If compiledDescriptions doesn't already have these notes, append them
                if (!compiledDescriptions.includes('محل نگهداری خودرو:')) {
                    compiledDescriptions = `${compiledDescriptions.trim()}\n---\n${newDetailsText}`;
                }
            } else {
                compiledDescriptions = newDetailsText;
            }
        }

        onSave({
            ...formState,
            descriptions: compiledDescriptions
        });
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
                Decription: 'ثبت خودکار مالک از بخش بخشنامه‌ها فروش',
                IP: '',
                RegisterTime: new Date().toLocaleDateString('fa-IR'),
                reference: 'ثبت شرایط فروش',
                LastAction: 'ثبت مالک',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Register activity logs for new lead creation
            try {
                if (created && created.id) {
                    await createCustomerJournal({
                        userId: Number(created.id),
                        content: `✨ ایجاد سرنخ جدید در سیستم (از بخش بخشنامه‌ها فروش)
👤 نام: ${created.FullName}
📞 شماره: ${created.Number}
🚘 خودرو: ${created.CarModel}`,
                        author: 'کاربر سیستم'
                    });
                    await createCallLog({
                        userId: Number(created.id),
                        customerName: created.FullName,
                        customerNumber: created.Number,
                        callType: 'INBOUND',
                        callStatus: 'SUCCESSFUL',
                        duration: 0,
                        agentName: 'کاربر سیستم',
                        notes: `📌 فعالیت جدید: ثبت سرنخ جدید از بخش بخشنامه‌ها فروش`,
                        timestamp: new Date().toLocaleString('fa-IR')
                    });
                }
            } catch (aErr) {
                console.warn("Failed to register CRM journal/log for ConditionModal creation:", aErr);
            }

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
            setOwnerType('CRM');
            setOwnerSearch(matchedCRMUser.FullName);
        } else {
            setOwnerType('CRM');
            setOwnerSearch(car.sellerName);
        }
    };

    // Filter CRM users for owner search suggestion
    const filteredCRMUsers = ownerSearch.trim() === '' ? [] : crmUsers.filter(u =>
        (u?.FullName && u.FullName.toLowerCase().includes((ownerSearch || '').toLowerCase())) ||
        (u?.Number && u.Number.includes(ownerSearch))
    ).slice(0, 5);

    // Filter appraised used cars
    const filteredUsedCars = appraisalSearch.trim() === '' ? [] : usedCars.filter(c =>
        (c?.carName && c.carName.toLowerCase().includes((appraisalSearch || '').toLowerCase())) ||
        (c?.sellerName && c.sellerName.toLowerCase().includes((appraisalSearch || '').toLowerCase()))
    ).slice(0, 5);

    const isAppraisalSectionVisible = formState.sale_type === SaleType.USED;
    const isFactoryOrTransfer = formState.sale_type === SaleType.FACTORY_REGISTRATION || formState.sale_type === SaleType.TRANSFER;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                                {condition && condition.id !== 0 ? 'ویرایش بخشنامه فروش' : 'افزودن بخشنامه / شرط فروش جدید'}
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                طراحی مرحله‌ای، تنظیم شرایط مالی، اقساط، پیش‌فروش و تعیین مالک و محل نگهداری
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Main Form Content with Structured Sections */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    
                    {/* Audit Information Bar (Creator & Last Editor) */}
                    {condition && condition.id !== 0 && (
                        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-800/80 dark:to-indigo-950/30 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                            {/* Creator info */}
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <UserIcon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">کاربر ثبت‌کننده اولیه:</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            {condition.created_by_name || condition.created_by || condition.createdBy || 'کاربر سیستم'}
                                        </span>
                                    </div>
                                    {(condition.created_at || condition.createdAt) && (
                                        <span className="text-[10px] text-slate-400 font-mono dir-ltr text-right">
                                            تاریخ ثبت: {formatConditionDateTime(condition.created_at || condition.createdAt)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Editor info */}
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <UserCheck className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">آخرین کاربر ویرایش‌کننده:</span>
                                        <span className="font-bold text-indigo-600 dark:text-indigo-300">
                                            {condition.updated_by_name || condition.updated_by || condition.updatedBy || 'بدون ویرایش ثانویه'}
                                        </span>
                                    </div>
                                    {(condition.updated_at || condition.updatedAt || condition.last_update) && (
                                        <span className="text-[10px] text-slate-400 font-mono dir-ltr text-right">
                                            آخرین ویرایش: {formatConditionDateTime(condition.updated_at || condition.updatedAt || condition.last_update)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ---------------- SECTION 1: Car Selection & Specs ---------------- */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-indigo-700 dark:text-indigo-400">
                                <CarIcon className="w-4 h-4" />
                                <span>۱. انتخاب خودرو و مشخصات اولیه</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCarModalOpen(true)}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 bg-white dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-600 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>افزودن خودرو جدید</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {/* Car Model Select */}
                            <div className="sm:col-span-2 lg:col-span-2">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    مدل خودرو <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    value={formState.car_model} 
                                    onChange={(e) => handleChange('car_model', e.target.value)}
                                    className={`w-full px-3.5 py-2.5 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 dark:text-white ${errors.car_model ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'}`}
                                >
                                    <option value="">-- انتخاب خودرو از لیست --</option>
                                    {carsList.map(car => (
                                        <option key={car.id} value={car.name}>
                                            {car.name} {car.brand ? `(${car.brand})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.car_model && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.car_model}</p>}
                            </div>

                            {/* Sale Year Model */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>سال مدل</span>
                                </label>
                                <input 
                                    type="number" 
                                    value={formState.model || ''} 
                                    onChange={(e) => handleChange('model', parseInt(e.target.value, 10) || 0)}
                                    placeholder="1404"
                                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-center"
                                />
                            </div>

                            {/* Color Selection */}
                            <div className="sm:col-span-2 lg:col-span-3">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                    <Palette className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>انتخاب رنگ‌های مجاز</span>
                                    <span className="text-[10px] font-normal text-slate-400">(چند انتخابی)</span>
                                </label>
                                <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    {AVAILABLE_COLORS.map(color => {
                                        const isSelected = formState.colors.includes(color);
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => toggleColor(color)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                                    isSelected 
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3" />}
                                                <span>{color}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.colors && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.colors}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ---------------- SECTION 2: Delivery Timeframe ---------------- */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black text-indigo-700 dark:text-indigo-400">
                            <Clock className="w-4 h-4" />
                            <span>۲. زمان تحویل خودرو</span>
                        </div>

                        {/* Preset Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {PRESET_DELIVERY_TIMES.map((preset) => {
                                const isSelected = formState.delivery_time === preset;
                                return (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => handleChange('delivery_time', preset)}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all ${
                                            isSelected
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-105'
                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                        }`}
                                    >
                                        {preset}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom Input */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                زمان تحویل دلخواه / ویرایش متن:
                            </label>
                            <input 
                                type="text" 
                                value={formState.delivery_time} 
                                onChange={(e) => handleChange('delivery_time', e.target.value)}
                                placeholder="مثلاً: فوری / ۴۵ روز کاری / تحویل اسفند ۱۴۰۴"
                                className={`w-full px-3.5 py-2.5 text-xs font-bold border rounded-xl bg-white dark:bg-slate-800 dark:text-white ${errors.delivery_time ? 'border-red-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'}`}
                            />
                            {errors.delivery_time && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.delivery_time}</p>}
                        </div>
                    </div>

                    {/* ---------------- SECTION 3: Sale Type & Storage Location ---------------- */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-black text-indigo-700 dark:text-indigo-400">
                            <Building2 className="w-4 h-4" />
                            <span>۳. نوع فروش و محل نگهداری خودرو</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Sale Type */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    نوع فروش
                                </label>
                                <select 
                                    value={formState.sale_type} 
                                    onChange={(e) => handleChange('sale_type', e.target.value as SaleType)}
                                    className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                                >
                                    {Object.values(SaleType).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Storage Location Dynamic Rule */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                                    <span>محل نگهداری خودرو</span>
                                    {isFactoryOrTransfer && (
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                                            (به دلیل نوع فروش حواله/کارخانه قفل شد)
                                        </span>
                                    )}
                                </label>
                                
                                {isFactoryOrTransfer ? (
                                    <div className="w-full px-3.5 py-2.5 text-xs font-black border border-amber-200 dark:border-amber-900/60 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                        <Building className="w-4 h-4 text-amber-600" />
                                        <span>کارخانه (تولیدکننده)</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['انبار', 'نمایشگاه', 'شرکت'] as const).map((loc) => {
                                            const isSelected = storageLocation === loc;
                                            return (
                                                <button
                                                    key={loc}
                                                    type="button"
                                                    onClick={() => setStorageLocation(loc)}
                                                    className={`py-2 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1 ${
                                                        isSelected
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                    <span>{loc}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Integration for Used Car Appraisals if USED */}
                        {isAppraisalSectionVisible && (
                            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-3 mt-3">
                                <div className="flex items-center gap-2 text-xs font-black text-indigo-700 dark:text-indigo-400">
                                    <FileText className="w-4 h-4" />
                                    <span>اتصال به پرونده کارشناسی خودروهای کارکرده</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={appraisalSearch}
                                        onChange={(e) => {
                                            setAppraisalSearch(e.target.value);
                                            setShowAppraisalSuggestions(true);
                                        }}
                                        onFocus={() => setShowAppraisalSuggestions(true)}
                                        placeholder="نام خودرو یا مالک در بخش کارشناسی را جستجو کنید..."
                                        className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                    />
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

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
                    </div>

                    {/* ---------------- SECTION 4: Payment Terms & Dynamic Calculation ---------------- */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-black text-indigo-700 dark:text-indigo-400">
                            <CreditCard className="w-4 h-4" />
                            <span>۴. نحوه پرداخت و شرایط مالی</span>
                        </div>

                        {/* Pay Type Selector Tabs */}
                        <div className="grid grid-cols-3 gap-2">
                            {Object.values(PayType).map(p => {
                                const isSelected = formState.pay_type === p;
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => handleChange('pay_type', p)}
                                        className={`py-2.5 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-2 ${
                                            isSelected
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 scale-[1.02]'
                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                        }`}
                                    >
                                        <span>{p}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Main Deposit / Price Input */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <label className="block text-xs font-black text-slate-800 dark:text-white">
                                {formState.pay_type === PayType.CASH 
                                    ? 'قیمت کل نقدی خودرو (تومان)' 
                                    : formState.pay_type === PayType.INSTALLMENT 
                                        ? 'مبلغ پیش‌پرداخت اولیه (تومان)' 
                                        : 'مبلغ پرداختی مرحله اول پیش‌فروش (تومان)'}
                                <span className="text-red-500 mr-1">*</span>
                            </label>
                            
                            <input 
                                type="number" 
                                value={formState.initial_deposit || ''} 
                                onChange={(e) => handleChange('initial_deposit', parseInt(e.target.value, 10) || 0)}
                                placeholder="مثلاً: 1200000000"
                                className={`w-full px-4 py-3 text-lg sm:text-xl font-mono font-black border rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-white ${errors.initial_deposit ? 'border-red-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'}`}
                            />

                            {/* Words Translation */}
                            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between text-xs">
                                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">معادل به حروف:</span>
                                <span className="font-black text-slate-800 dark:text-slate-200">
                                    {formState.initial_deposit > 0 ? `${numberToPersianWords(formState.initial_deposit)} تومان` : '---'}
                                </span>
                            </div>
                        </div>

                        {/* INSTALLMENT DYNAMIC QUESTIONS */}
                        {formState.pay_type === PayType.INSTALLMENT && (
                            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 sm:p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-4 animate-fade-in">
                                <div className="flex items-center gap-2 text-xs font-black text-indigo-800 dark:text-indigo-300">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                    <span>تنظیم جزئیات اقساط و چک‌ها</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Period */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">دوره بازپرداخت</label>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {(['یکساله', 'دوساله', 'دلخواه'] as const).map(per => (
                                                <button
                                                    key={per}
                                                    type="button"
                                                    onClick={() => setInstallmentPeriod(per)}
                                                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                                        installmentPeriod === per 
                                                            ? 'bg-indigo-600 text-white border-indigo-600' 
                                                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                                                    }`}
                                                >
                                                    {per}
                                                </button>
                                            ))}
                                        </div>
                                        {installmentPeriod === 'دلخواه' && (
                                            <input
                                                type="text"
                                                value={customInstallmentPeriod}
                                                onChange={(e) => setCustomInstallmentPeriod(e.target.value)}
                                                placeholder="مثلاً: ۱۸ ماهه / ۶ ماهه"
                                                className="w-full mt-2 px-3 py-1.5 text-xs border rounded-lg dark:bg-slate-700 dark:text-white"
                                            />
                                        )}
                                    </div>

                                    {/* Cheque Count */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">تعداد چک‌ها</label>
                                        <input
                                            type="text"
                                            value={chequeCount}
                                            onChange={(e) => setChequeCount(e.target.value)}
                                            placeholder="مثلاً: ۴ فقره چک صیادی"
                                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white font-bold"
                                        />
                                    </div>

                                    {/* Cheque Interval */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">فواصل چک‌ها / اقساط</label>
                                        <input
                                            type="text"
                                            value={chequeInterval}
                                            onChange={(e) => setChequeInterval(e.target.value)}
                                            placeholder="مثلاً: هر ۳ ماه یکبار"
                                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white font-bold"
                                        />
                                    </div>

                                    {/* Cheque Amount */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">مبلغ هر چک (تومان)</label>
                                        <input
                                            type="number"
                                            value={chequeAmount || ''}
                                            onChange={(e) => setChequeAmount(parseInt(e.target.value, 10) || 0)}
                                            placeholder="مثلاً: 50000000"
                                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white font-mono font-bold"
                                        />
                                    </div>

                                    {/* Total Installment Amount */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">مبلغ کل اقساط / مانده بدهی (تومان)</label>
                                        <input
                                            type="number"
                                            value={installmentAmount || ''}
                                            onChange={(e) => setInstallmentAmount(parseInt(e.target.value, 10) || 0)}
                                            placeholder="مثلاً: 200000000"
                                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white font-mono font-bold"
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div className="sm:col-span-3">
                                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">سایر شرایط دلخواه اقساط (اختیاری)</label>
                                        <input
                                            type="text"
                                            value={installmentNotes}
                                            onChange={(e) => setInstallmentNotes(e.target.value)}
                                            placeholder="مثلاً: بدون ضامن، با کارمزد ۳٪ ماهیانه، سند در رهن تا پاس شدن چک‌ها"
                                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PRE-SALE DYNAMIC QUESTIONS */}
                        {formState.pay_type === PayType.PRE_SALE && (
                            <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 sm:p-5 rounded-xl border border-amber-100 dark:border-amber-900/40 space-y-4 animate-fade-in">
                                <div className="flex items-center gap-2 text-xs font-black text-amber-800 dark:text-amber-300">
                                    <Sparkles className="w-4 h-4 text-amber-600" />
                                    <span>تنظیم جزئیات مراحل پیش‌فروش و دعوت‌نامه</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">زمان تخمینی ارسال دعوت‌نامه</label>
                                        <input
                                            type="text"
                                            value={invitationDate}
                                            onChange={(e) => setInvitationDate(e.target.value)}
                                            placeholder="مثلاً: دی ماه ۱۴۰۴ / ۳۰ روز قبل از تحویل"
                                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">نحوه پرداخت سایر مراحل (مرحله دوم/سوم)</label>
                                        <input
                                            type="text"
                                            value={preSaleNextPayments}
                                            onChange={(e) => setPreSaleNextPayments(e.target.value)}
                                            placeholder="مثلاً: مرحله دوم در زمان صدور دعوتنامه بر اساس قیمت روز"
                                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white font-bold"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">توضیحات و شرایط دلخواه پیش‌فروش (اختیاری)</label>
                                        <input
                                            type="text"
                                            value={preSaleNotes}
                                            onChange={(e) => setPreSaleNotes(e.target.value)}
                                            placeholder="مثلاً: سود مشارکت ۱۸٪ سالیانه، انصراف ۱۲٪، سود تاخیر ۲.۵٪ ماهیانه"
                                            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ---------------- SECTION 5: Owner (Optional: Predefined / CRM) ---------------- */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-indigo-700 dark:text-indigo-400">
                                <UserCheck className="w-4 h-4" />
                                <span>۵. مالک خودرو (اختیاری)</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">فیلد کاملاً اختیاری است</span>
                        </div>

                        {/* Owner Type Selector: Predefined vs CRM */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setOwnerType('PREDEFINED');
                                }}
                                className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${
                                    ownerType === 'PREDEFINED'
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                اشخاص و شرکت‌های پیش‌فرض
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setOwnerType('CRM');
                                }}
                                className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${
                                    ownerType === 'CRM'
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                انتخاب از مشتریان CRM
                            </button>
                        </div>

                        {/* PREDEFINED OWNERS BUTTONS */}
                        {ownerType === 'PREDEFINED' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {PREDEFINED_OWNERS.map(owner => {
                                        const isSelected = formState.owner_name === owner;
                                        return (
                                            <button
                                                key={owner}
                                                type="button"
                                                onClick={() => {
                                                    if (isSelected) {
                                                        // Deselect
                                                        setFormState(prev => ({ ...prev, owner_name: null, owner_id: null, owner_phone: null }));
                                                        setSelectedPredefinedOwner('');
                                                    } else {
                                                        setFormState(prev => ({ ...prev, owner_name: owner, owner_id: null, owner_phone: null }));
                                                        setSelectedPredefinedOwner(owner);
                                                    }
                                                }}
                                                className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 ${
                                                    isSelected
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                                <span>{owner}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* CRM OWNER SEARCH OR CREATE */}
                        {ownerType === 'CRM' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">جستجو در بین مخاطبان CRM</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewOwnerForm(!showNewOwnerForm)}
                                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
                                    >
                                        <UserPlus className="w-3 h-3" />
                                        <span>{showNewOwnerForm ? 'انصراف' : 'ثبت مخاطب جدید در CRM'}</span>
                                    </button>
                                </div>

                                {showNewOwnerForm ? (
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in shadow-sm">
                                        <h5 className="text-xs font-black text-slate-800 dark:text-white">ثبت مشتری جدید در سیستم CRM</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">نام و نام خانوادگی کامل</label>
                                                <input
                                                    type="text"
                                                    value={newUserName}
                                                    onChange={(e) => setNewUserName(e.target.value)}
                                                    placeholder="مثال: رضا حسینی"
                                                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">شماره تلفن همراه</label>
                                                <input
                                                    type="text"
                                                    value={newUserPhone}
                                                    onChange={(e) => setNewUserPhone(e.target.value)}
                                                    placeholder="مثال: 09123456789"
                                                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 text-left font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowNewOwnerForm(false)}
                                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold"
                                            >
                                                انصراف
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCreateCRMUser}
                                                disabled={isCreatingCRMUser}
                                                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5"
                                            >
                                                {isCreatingCRMUser ? 'در حال ثبت...' : 'ثبت و انتخاب در بخشنامه'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={ownerSearch}
                                            onChange={(e) => {
                                                setOwnerSearch(e.target.value);
                                                setShowOwnerSuggestions(true);
                                            }}
                                            onFocus={() => setShowOwnerSuggestions(true)}
                                            placeholder="نام یا شماره تماس مشتری را جستجو کنید..."
                                            className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white"
                                        />
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                                        {showOwnerSuggestions && filteredCRMUsers.length > 0 && (
                                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
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
                            </div>
                        )}

                        {/* Selected Owner Badge */}
                        {formState.owner_name && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>مالک تعیین شده: <span className="underline">{formState.owner_name}</span> {formState.owner_phone ? `(${formState.owner_phone})` : ''}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormState(prev => ({ ...prev, owner_name: null, owner_id: null, owner_phone: null }));
                                        setSelectedPredefinedOwner('');
                                        setOwnerSearch('');
                                    }}
                                    className="text-xs text-slate-400 hover:text-red-500 font-bold"
                                >
                                    حذف مالک
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ---------------- SECTION 6: Stock & Visibility & Notes ---------------- */}
                    <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-black text-indigo-700 dark:text-indigo-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span>۶. موجودی انبار، وضعیت سند و توضیحات تکمیلی</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            {/* Stock Quantity */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    تعداد موجودی انبار
                                </label>
                                <input 
                                    type="number" 
                                    value={formState.stock_quantity ?? ''} 
                                    onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value, 10) || 0)}
                                    placeholder="0"
                                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    وضعیت
                                </label>
                                <select 
                                    value={formState.status} 
                                    onChange={(e) => handleChange('status', e.target.value as ConditionStatus)}
                                    className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                                >
                                    {Object.values(ConditionStatus).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Document Status */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    وضعیت سند
                                </label>
                                <select 
                                    value={formState.document_status} 
                                    onChange={(e) => handleChange('document_status', e.target.value as DocumentStatus)}
                                    className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                                >
                                    {Object.values(DocumentStatus).map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Is Public Switch */}
                            <div className="sm:col-span-3 flex items-center gap-2 pt-1">
                                <input 
                                    type="checkbox" 
                                    id="is_public" 
                                    checked={formState.is_public} 
                                    onChange={(e) => handleChange('is_public', e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                />
                                <label htmlFor="is_public" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    نمایش عمومی در وب‌سایت و کاتالوگ فروش
                                </label>
                            </div>
                        </div>

                        {/* General Descriptions */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                توضیحات و شرایط تکمیلی بخشنامه فروش
                            </label>
                            <textarea 
                                rows={3} 
                                value={formState.descriptions || ''} 
                                onChange={(e) => handleChange('descriptions', e.target.value)}
                                placeholder="توضیحات و شرایط تکمیلی را وارد کنید (اطلاعات اقساط، پیش‌فروش و محل نگهداری نیز به صورت خودکار ثبت خواهند شد)..."
                                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white leading-relaxed" 
                            />
                        </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm py-4">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-xs"
                        >
                            انصراف
                        </button>
                        <button 
                            type="submit" 
                            className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-black text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-1.5"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>ذخیره بخشنامه فروش</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Standard Car Management Modal for creating a new car */}
            <CarModal
                isOpen={isCarModalOpen}
                onClose={() => setIsCarModalOpen(false)}
                onSave={handleSaveNewCar}
                car={null}
            />
        </div>
    );
};

export default ConditionModal;
