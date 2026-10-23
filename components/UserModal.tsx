
import React, { useState, useEffect } from 'react';
import { User, LeadStatus, MyProfile } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { sendCrmHeartbeat } from '../services/api';
import { UserCheck, PlusCircle, AlertCircle, Headphones, PhoneCall, Clock } from 'lucide-react';

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

const PRESET_CRM_PERSONS = ['مبین غلامی', 'درسا محمدی', 'زهرا رستمی', 'علی حسینی'];

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
    crmPerson: null,
    lastEditedBy: null,
    successful_calls: 0,
    total_calls: 0,
    last_successful_call: null,
};

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, loggedInUser }) => {
    const [formState, setFormState] = useState(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // crmPerson states (dropdown + custom input)
    const [selectedCrmPerson, setSelectedCrmPerson] = useState<string>('');
    const [customCrmPerson, setCustomCrmPerson] = useState<string>('');

    const currentUserName = loggedInUser?.full_name || (loggedInUser as any)?.FullName || loggedInUser?.username || 'کاربر سیستم';

    // Build unique team members list including current logged-in user
    const availableCrmPersons = React.useMemo(() => {
        const set = new Set(PRESET_CRM_PERSONS);
        if (currentUserName && currentUserName !== 'کاربر سیستم') {
            set.add(currentUserName);
        }
        return Array.from(set);
    }, [currentUserName]);

    // Send heartbeat when editing a lead
    useEffect(() => {
        if (!isOpen || !user || !loggedInUser) return;

        const username = loggedInUser.username || 'ناشناس';
        const fullName = loggedInUser.full_name || (loggedInUser as any)?.FullName || 'کاربر سیستم';
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

            const person = user.crmPerson || '';
            if (person) {
                if (availableCrmPersons.includes(person)) {
                    setSelectedCrmPerson(person);
                    setCustomCrmPerson('');
                } else {
                    setSelectedCrmPerson('CUSTOM');
                    setCustomCrmPerson(person);
                }
            } else {
                setSelectedCrmPerson('');
                setCustomCrmPerson('');
            }
        } else {
            setFormState(initialFormState);
            setSelectedCrmPerson(currentUserName || '');
            setCustomCrmPerson('');
        }
        setErrors({});
    }, [user, isOpen, availableCrmPersons, currentUserName]);

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

    const handleAppendMySignature = () => {
        const faDate = new Date().toLocaleDateString('fa-IR');
        const faTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        const signature = `\n[📝 یادداشت ${currentUserName} - ${faDate} ${faTime}]: `;
        setFormState(prev => ({
            ...prev,
            Decription: prev.Decription ? `${prev.Decription.trim()}\n${signature}` : `[📝 یادداشت ${currentUserName} - ${faDate} ${faTime}]: `
        }));
    };

    const formatCallDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr.replace(' ', 'T')).toLocaleString('fa-IR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch {
            return dateStr;
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formState.FullName?.trim()) newErrors.FullName = 'نام کامل الزامی است.';
        if (!formState.Number?.trim()) newErrors.Number = 'شماره تماس الزامی است.';
        if (!/^\d{10,11}$/.test(formState.Number || '')) newErrors.Number = 'شماره تماس معتبر نیست.';
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
            const isNumberNewOrChanged = !user || user.Number !== formState.Number;
            const finalCrmPerson = selectedCrmPerson === 'CUSTOM' ? customCrmPerson.trim() : selectedCrmPerson;

            const updatedUserData: Omit<User, 'id'> = {
                ...formState,
                crmPerson: finalCrmPerson || null,
                lastEditedBy: currentUserName,
                registeredBy: user?.registeredBy || currentUserName,
                phoneRegisteredBy: isNumberNewOrChanged ? currentUserName : (user?.phoneRegisteredBy || currentUserName),
                successful_calls: user?.successful_calls ?? formState.successful_calls ?? 0,
                total_calls: user?.total_calls ?? formState.total_calls ?? 0,
                last_successful_call: user?.last_successful_call ?? formState.last_successful_call ?? null,
            };
            onSave(updatedUserData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user ? 'ویرایش سرنخ' : 'افزودن سرنخ جدید'}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ثبت گزارش تماس و فعالیت‌های CRM به نام کاربر فعال</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400">
                        <CloseIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* User Identity Notification Banner */}
                    <div className="p-3 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-sky-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                {currentUserName.charAt(0)}
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 font-extrabold text-slate-800 dark:text-white">
                                    <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                    <span>کاربر ثبت‌کننده:</span>
                                    <span className="text-sky-700 dark:text-sky-300 font-black">{currentUserName}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                                    ثبت شماره تماس، تغییرات فرم و توضیحات جدید به نام شما در گزارش تماس و فعالیت‌های CRM ثبت و مستندسازی می‌شود.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="FullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نام کامل</label>
                            <input type="text" id="FullName" value={formState.FullName} onChange={(e) => handleChange('FullName', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white ${errors.FullName ? 'border-red-500' : 'border-slate-300'}`} />
                            {errors.FullName && <p className="text-red-500 text-xs mt-1">{errors.FullName}</p>}
                        </div>
                        <div>
                            <label htmlFor="Number" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                شماره تماس
                                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold mr-1"> (ثبت‌کننده شماره: {currentUserName})</span>
                            </label>
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

                        {/* crmPerson field: Who answered the call */}
                        <div className="space-y-1.5">
                            <label htmlFor="crmPerson" className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Headphones className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                <span>پاسخگوی تماس (crmPerson)</span>
                            </label>
                            <select 
                                id="crmPerson"
                                value={selectedCrmPerson}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedCrmPerson(val);
                                    if (val !== 'CUSTOM') {
                                        setCustomCrmPerson('');
                                    }
                                }}
                                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-300 text-xs sm:text-sm"
                            >
                                <option value="">-- بدون پاسخگو / نامشخص --</option>
                                {availableCrmPersons.map((p) => (
                                    <option key={p} value={p}>{p} {p === currentUserName ? '(شما)' : ''}</option>
                                ))}
                                <option value="CUSTOM">✏️ سایر (تایپ دستی نام پاسخگو)...</option>
                            </select>
                            {selectedCrmPerson === 'CUSTOM' && (
                                <input 
                                    type="text"
                                    value={customCrmPerson}
                                    onChange={(e) => setCustomCrmPerson(e.target.value)}
                                    placeholder="نام و نام خانوادگی پاسخگوی تماس را وارد کنید..."
                                    className="w-full px-3 py-2 mt-1.5 border border-sky-300 dark:border-sky-600 rounded-md dark:bg-slate-750 dark:text-white text-xs sm:text-sm bg-sky-50/30"
                                />
                            )}
                        </div>

                        {/* Telephony Statistics Card (Read-only Synchronized Stats) */}
                        <div className="md:col-span-2 p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>آمار تماس‌های تلفنی و سانترال (همگام‌سازی خودکار):</span>
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 rounded-full font-bold">
                                    داده‌های همگام سانترال
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 flex flex-col gap-0.5 shadow-2xs">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">تماس‌های موفق:</span>
                                    <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                                        {((formState.successful_calls !== null && formState.successful_calls !== undefined) ? formState.successful_calls : (user?.successful_calls ?? 0)).toLocaleString('fa-IR')} تماس موفق
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 flex flex-col gap-0.5 shadow-2xs">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">کل تماس‌ها:</span>
                                    <span className="font-black font-mono text-slate-700 dark:text-slate-200 text-sm">
                                        {((formState.total_calls !== null && formState.total_calls !== undefined) ? formState.total_calls : (user?.total_calls ?? 0)).toLocaleString('fa-IR')} تماس
                                    </span>
                                </div>
                                <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-white dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 flex flex-col gap-0.5 shadow-2xs">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">آخرین تماس موفق:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate" title={formState.last_successful_call || user?.last_successful_call || ''}>
                                        {(formState.last_successful_call || user?.last_successful_call)
                                            ? formatCallDate(formState.last_successful_call || user?.last_successful_call)
                                            : 'هنوز تماسی ثبت نشده'}
                                    </span>
                                </div>
                            </div>
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
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="Decription" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    توضیحات و یادداشت‌ها
                                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mr-1"> (نویسنده: {currentUserName})</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAppendMySignature}
                                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50"
                                >
                                    <PlusCircle className="w-3 h-3" />
                                    <span>درج نام و تاریخ یادداشت من</span>
                                </button>
                            </div>
                            <textarea 
                                id="Decription" 
                                rows={3} 
                                value={formState.Decription} 
                                onChange={(e) => handleChange('Decription', e.target.value)}
                                placeholder="توضیحات یا یادداشت جدید خود را اینجا بنویسید..."
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white" 
                            />
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
