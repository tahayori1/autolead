
import React, { useState, useEffect, useMemo } from 'react';
import type { CarOrder, Car, CarSaleCondition, CarPriceStats, User } from '../types';
import { OrderStatus, SaleType } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { getCars, getConditions, getCarPriceStats, getUsers } from '../services/api';
import Spinner from './Spinner';

interface CarOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: Omit<CarOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'status'>, status: OrderStatus) => void;
    username: string;
    initialBuyerData?: {
        name?: string;
        phone?: string;
        city?: string;
        nationalId?: string;
        address?: string;
        postalCode?: string;
    };
    editOrder?: CarOrder | null;
}

const PREDEFINED_USER_NOTES = [
    'فعلا بیعانه میدهد بقیه را تا تاریخ ... میدهد',
    'بخشی الان بقیه چک میدهد',
    'درخواست ارسال به شهر دیگر دارد',
    'برای تامین نقدینگی به چند روز زمان نیاز دارد',
    'با شرایطی که گفتید موافقت کرده است',
    'با توجه به نتیجه کارشناسی خودرو درخواست تخفیف دارد'
];

const CarOrderModal: React.FC<CarOrderModalProps> = ({ isOpen, onClose, onSave, username, initialBuyerData, editOrder }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cars, setCars] = useState<Car[]>([]);
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [priceStats, setPriceStats] = useState<CarPriceStats[]>([]);
    const [selectedConditionObj, setSelectedConditionObj] = useState<CarSaleCondition | null>(null);
    const [crmUsers, setCrmUsers] = useState<User[]>([]);
    const [crmSearchQuery, setCrmSearchQuery] = useState('');
    const [crmResults, setCrmResults] = useState<User[]>([]);

    const [formData, setFormData] = useState({
        buyerName: '',
        buyerNationalId: '',
        buyerPhone: '',
        buyerCity: '',
        buyerAddress: '',
        buyerPostalCode: '',
        carName: '',
        conditionId: 0,
        conditionSummary: '',
        selectedColor: '',
        proposedPrice: 0,
        userNotes: ''
    });

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setStep(1);
            
            // 1. If we are editing an existing order (draft), load its full data
            if (editOrder) {
                setFormData({
                    buyerName: editOrder.buyerName,
                    buyerNationalId: editOrder.buyerNationalId,
                    buyerPhone: editOrder.buyerPhone,
                    buyerCity: editOrder.buyerCity,
                    buyerAddress: editOrder.buyerAddress,
                    buyerPostalCode: editOrder.buyerPostalCode,
                    carName: editOrder.carName,
                    conditionId: editOrder.conditionId,
                    conditionSummary: editOrder.conditionSummary,
                    selectedColor: editOrder.selectedColor,
                    proposedPrice: editOrder.proposedPrice,
                    userNotes: editOrder.userNotes || ''
                });
            }
            // 2. Otherwise, if initial buyer data is provided (from Customers page)
            else if (initialBuyerData) {
                setFormData(prev => ({
                    ...prev,
                    buyerName: initialBuyerData.name || prev.buyerName,
                    buyerPhone: initialBuyerData.phone || prev.buyerPhone,
                    buyerCity: initialBuyerData.city || prev.buyerCity,
                    buyerNationalId: initialBuyerData.nationalId || prev.buyerNationalId,
                    buyerAddress: initialBuyerData.address || prev.buyerAddress,
                    buyerPostalCode: initialBuyerData.postalCode || prev.buyerPostalCode,
                }));
            } else {
                // Reset
                setFormData({
                    buyerName: '',
                    buyerNationalId: '',
                    buyerPhone: '',
                    buyerCity: '',
                    buyerAddress: '',
                    buyerPostalCode: '',
                    carName: '',
                    conditionId: 0,
                    conditionSummary: '',
                    selectedColor: '',
                    proposedPrice: 0,
                    userNotes: ''
                });
            }

            Promise.all([getCars(), getConditions(), getCarPriceStats(), getUsers()])
                .then(([carsData, conditionsData, statsData, usersData]) => {
                    setCars(carsData);
                    setConditions(conditionsData);
                    setPriceStats(statsData);
                    setCrmUsers(usersData);
                    
                    // If editing, find and set the condition object
                    if (editOrder) {
                        const cond = conditionsData.find(c => c.id === editOrder.conditionId);
                        if (cond) setSelectedConditionObj(cond);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, initialBuyerData, editOrder]);

    const handleNext = () => {
        // Validation for each step (New Order)
        // Step 1: Car & Condition
        if (step === 1 && (!formData.carName || !formData.conditionId)) return;
        
        // Step 2: Price
        if (step === 2 && (!formData.proposedPrice || formData.proposedPrice <= 0)) return;

        // Step 3: Config (Color)
        if (step === 3 && !formData.selectedColor) return;
        
        // Step 4: Buyer (Final step, validated at submit)
        
        setStep(prev => prev + 1);
    };
    
    const handleBack = () => setStep(prev => prev - 1);

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
            buyerName: u.FullName || prev.buyerName,
            buyerPhone: u.Number || prev.buyerPhone,
            buyerCity: u.City || prev.buyerCity,
            buyerAddress: [u.Province, u.Decription].filter(Boolean).join(' - ') || prev.buyerAddress,
        }));
        setCrmSearchQuery('');
        setCrmResults([]);
    };

    // Find if the currently typed info matches any CRM customer
    const autoMatchCrmUser = useMemo(() => {
        if (formData.buyerPhone && formData.buyerPhone.length >= 4) {
            const foundByPhone = crmUsers.find(u => u.Number && u.Number.includes(formData.buyerPhone));
            if (foundByPhone && (formData.buyerName !== foundByPhone.FullName || formData.buyerCity !== foundByPhone.City)) {
                return foundByPhone;
            }
        }
        if (formData.buyerName && formData.buyerName.length >= 3) {
            const foundByName = crmUsers.find(u => u.FullName && u.FullName.toLowerCase().includes(formData.buyerName.toLowerCase()));
            if (foundByName && (formData.buyerPhone !== foundByName.Number || formData.buyerCity !== foundByName.City)) {
                return foundByName;
            }
        }
        return null;
    }, [formData.buyerPhone, formData.buyerName, crmUsers]);

    const handleSelectCondition = (c: CarSaleCondition) => {
        if (c.stock_quantity <= 0) return;
        
        setSelectedConditionObj(c);
        setFormData({
            ...formData, 
            conditionId: c.id, 
            conditionSummary: `بخشنامه ${c.id}: ${c.sale_type} - ${c.pay_type} | مدل ${c.model} | تحویل ${c.delivery_time} | ${c.pay_type === 'نقدی' ? 'قیمت' : 'پیش‌پرداخت'} ${c.initial_deposit.toLocaleString('fa-IR')}`,
            selectedColor: c.colors.length > 0 ? c.colors[0] : '',
            proposedPrice: c.initial_deposit // Automatically pre-fill proposedPrice with initial_deposit
        });
    };

    const handleFinalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.buyerName || !formData.buyerPhone) return;
        onSave(formData, OrderStatus.PENDING_ADMIN);
    };

    const handleSaveAsDraft = (e: React.MouseEvent) => {
        e.preventDefault();
        onSave(formData, OrderStatus.DRAFT);
    };

    // --- Price Analysis Logic ---
    const priceAnalysis = useMemo(() => {
        if (!selectedConditionObj || !formData.carName) return null;

        const stat = priceStats.find(s => s.model_name === formData.carName);
        const maxMarketPrice = stat ? stat.maximum : 0;
        
        const isHavaleh = selectedConditionObj.sale_type === SaleType.TRANSFER; // 'حواله'
        const isZeroMarket = selectedConditionObj.sale_type === SaleType.NEW_MARKET; // 'صفر بازار'

        let info = null;
        let isUnderSellingGeneric = false;

        if (isHavaleh && maxMarketPrice > 0) {
            // Havaleh Logic
            // 1 Month: 95% - 97%
            const h1Min = maxMarketPrice * 0.95;
            const h1Max = maxMarketPrice * 0.97;
            const h1Avg = (h1Min + h1Max) / 2;

            // 2 Month: 90% - 94%
            const h2Min = maxMarketPrice * 0.90;
            const h2Max = maxMarketPrice * 0.94;
            const h2Avg = (h2Min + h2Max) / 2;

            // Check specific warnings
            // If proposed price is > 2% lower than 1-month average
            const warnH1 = formData.proposedPrice > 0 && formData.proposedPrice < (h1Avg * 0.98);
            
            // If proposed price is > 2% lower than 2-month average
            const warnH2 = formData.proposedPrice > 0 && formData.proposedPrice < (h2Avg * 0.98);

            info = {
                type: 'HAVALEH',
                h1Range: `${Math.round(h1Min).toLocaleString('fa-IR')} تا ${Math.round(h1Max).toLocaleString('fa-IR')}`,
                h2Range: `${Math.round(h2Min).toLocaleString('fa-IR')} تا ${Math.round(h2Max).toLocaleString('fa-IR')}`,
                warnH1,
                warnH2
            };
        } else if (isZeroMarket && maxMarketPrice > 0) {
            // Zero Market Logic
            const warningThreshold = maxMarketPrice * 0.98; // 2% below max market price
            isUnderSellingGeneric = formData.proposedPrice > 0 && formData.proposedPrice < warningThreshold;

            info = {
                type: 'ZERO_MARKET',
                maxLabel: 'بالاترین قیمت روز خودرو (بازار)',
                maxValue: maxMarketPrice.toLocaleString('fa-IR'),
                isUnderSelling: isUnderSellingGeneric
            };
        }

        return { info };
    }, [selectedConditionObj, formData.carName, formData.proposedPrice, priceStats]);


    if (!isOpen) return null;

    const filteredConditions = conditions.filter(c => c.car_model === formData.carName);

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                            {editOrder ? 'ویرایش سفارش فروش' : 'ثبت سفارش فروش جدید'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">گام {step} از ۴</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><CloseIcon className="text-slate-500" /></button>
                </div>

                <div className="p-6 overflow-y-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-20 gap-4">
                            <Spinner />
                            <p className="text-sm text-slate-400">در حال فراخوانی داده‌ها...</p>
                        </div>
                    ) : (
                        <form className="space-y-6">
                            
                            {/* Rejection Alert */}
                            {editOrder && editOrder.status === OrderStatus.REJECTED && editOrder.adminNotes && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-sm text-red-800 dark:text-red-200 mb-4 animate-pulse">
                                    <div className="flex items-center gap-2 mb-1 font-bold">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        علت رد شدن درخواست:
                                    </div>
                                    <p className="mr-7">{editOrder.adminNotes}</p>
                                </div>
                            )}

                            {/* Stepper Visual */}
                            <div className="flex items-center justify-center mb-8 gap-2">
                                {[1, 2, 3, 4].map(i => (
                                    <React.Fragment key={i}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === i ? 'bg-sky-600 text-white shadow-lg shadow-sky-200' : step > i ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            {step > i ? '✓' : i}
                                        </div>
                                        {i < 4 && <div className={`w-8 h-0.5 ${step > i ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* STEP 1: Select Car & Condition */}
                            {step === 1 && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 border-r-4 border-sky-500 pr-3">۱. انتخاب خودرو و شرایط فروش</h4>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">خودرو</label>
                                        <select required className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all font-bold" value={formData.carName} onChange={e => setFormData({...formData, carName: e.target.value, conditionId: 0})}>
                                            <option value="">یک خودرو انتخاب کنید...</option>
                                            {cars.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    {formData.carName && (
                                        <div className="mt-4">
                                            <label className="block text-xs font-bold text-slate-500 mb-2">انتخاب بخشنامه (شرایط فروش فعال)</label>
                                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                                {filteredConditions.length === 0 ? (
                                                    <div className="p-8 text-center bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800 text-rose-600 text-sm">
                                                        متاسفانه هیچ بخشنامه فعالی برای {formData.carName} ثبت نشده است.
                                                    </div>
                                                ) : (
                                                    filteredConditions.map(c => {
                                                        const isOutOfStock = c.stock_quantity <= 0;
                                                        return (
                                                            <label key={c.id} className={`block p-4 border rounded-xl transition-all ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/20 grayscale' : 'cursor-pointer'} ${formData.conditionId === c.id ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 ring-2 ring-sky-200 dark:ring-sky-800' : !isOutOfStock ? 'hover:bg-slate-50 dark:hover:bg-slate-700' : ''}`}>
                                                                <input 
                                                                    type="radio" 
                                                                    name="condition" 
                                                                    className="hidden" 
                                                                    disabled={isOutOfStock}
                                                                    onChange={() => handleSelectCondition(c)} 
                                                                />
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-sm font-black text-slate-800 dark:text-white">
                                                                        {c.sale_type} - {c.pay_type}
                                                                        {isOutOfStock && <span className="mr-2 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full">ناموجود</span>}
                                                                    </span>
                                                                    <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-400">{c.initial_deposit.toLocaleString('fa-IR')} تومان</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                                                    <span>مدل: {c.model} | تحویل: {c.delivery_time}</span>
                                                                    <span className={`${c.stock_quantity <= 3 && !isOutOfStock ? 'text-amber-600' : ''}`}>
                                                                        موجودی انبار: {c.stock_quantity.toLocaleString('fa-IR')} عدد
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 2: Financial Proposal */}
                            {step === 2 && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 border-r-4 border-sky-500 pr-3">۲. پیشنهاد مالی</h4>
                                    
                                    {/* Price Analysis Box */}
                                    {priceAnalysis && priceAnalysis.info && (
                                        <div className="p-4 rounded-xl border text-xs space-y-3 bg-slate-50 border-slate-200 dark:bg-slate-900/30 dark:border-slate-700">
                                            <h5 className="font-bold text-slate-700 dark:text-slate-300 border-b pb-2 mb-2 border-slate-200 dark:border-slate-600">اطلاعات بازار و قیمت‌گذاری</h5>
                                            
                                            {priceAnalysis.info.type === 'HAVALEH' && (
                                                <>
                                                    <div className={`flex flex-col sm:flex-row justify-between items-center p-2 rounded ${priceAnalysis.info.warnH1 ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800' : ''}`}>
                                                        <span className="text-slate-500 dark:text-slate-400">قیمت حواله ۱ ماهه:</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{priceAnalysis.info.h1Range}</span>
                                                            {priceAnalysis.info.warnH1 && (
                                                                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold whitespace-nowrap">
                                                                    هشدار زیرفروشی
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`flex flex-col sm:flex-row justify-between items-center p-2 rounded ${priceAnalysis.info.warnH2 ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800' : ''}`}>
                                                        <span className="text-slate-500 dark:text-slate-400">قیمت حواله ۲ ماهه:</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{priceAnalysis.info.h2Range}</span>
                                                            {priceAnalysis.info.warnH2 && (
                                                                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold whitespace-nowrap">
                                                                    هشدار زیرفروشی
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {priceAnalysis.info.type === 'ZERO_MARKET' && (
                                                <>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-500 dark:text-slate-400">{priceAnalysis.info.maxLabel}:</span>
                                                        <span className="font-mono font-black text-sky-600 dark:text-sky-400">{priceAnalysis.info.maxValue} تومان</span>
                                                    </div>
                                                    {priceAnalysis.info.isUnderSelling && (
                                                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/50 rounded text-red-700 dark:text-red-200 font-bold flex items-center justify-center gap-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            هشدار زیرفروشی (قیمت پیشنهادی بسیار پایین است)
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">قیمت پیشنهادی نهایی (تومان)</label>
                                        <input 
                                            required 
                                            type="number" 
                                            className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 transition-all font-mono text-lg font-bold ${
                                                priceAnalysis?.info?.warnH1 || priceAnalysis?.info?.warnH2 || priceAnalysis?.info?.isUnderSelling
                                                ? 'border-red-500 text-red-600 focus:ring-red-500' 
                                                : 'border-slate-300 focus:ring-sky-500'
                                            }`} 
                                            value={formData.proposedPrice || ''} 
                                            onChange={e => setFormData({...formData, proposedPrice: Number(e.target.value)})} 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Configuration & Notes */}
                            {step === 3 && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 border-r-4 border-sky-500 pr-3">۳. پیکربندی و توضیحات</h4>
                                    
                                    {/* Snapshot review */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                                        <div className="flex justify-between"><span className="text-slate-400">خودرو:</span><span className="font-bold">{formData.carName}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">بخشنامه:</span><span className="font-bold text-sky-600">{formData.conditionSummary.split('|')[0]}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">قیمت پیشنهادی:</span><span className="font-bold font-mono text-emerald-600">{(formData.proposedPrice || 0).toLocaleString('fa-IR')}</span></div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">انتخاب رنگ خودرو</label>
                                        <select required className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all font-bold" value={formData.selectedColor} onChange={e => setFormData({...formData, selectedColor: e.target.value})}>
                                            {selectedConditionObj?.colors.map(color => (
                                                <option key={color} value={color}>{color}</option>
                                            ))}
                                            {(!selectedConditionObj || selectedConditionObj.colors.length === 0) && <option value="">بدون رنگ</option>}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">توضیحات اختصاصی سفارش</label>
                                        <textarea rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={formData.userNotes} onChange={e => setFormData({...formData, userNotes: e.target.value})} placeholder="مثلاً: هدیه روی ماشین، نصب آپشن‌های خاص و..."></textarea>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {PREDEFINED_USER_NOTES.map(note => (
                                                <button
                                                    key={note}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({...prev, userNotes: prev.userNotes ? prev.userNotes + '\n' + note : note}))}
                                                    className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
                                                >
                                                    {note}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Buyer Details (Final) */}
                            {step === 4 && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 border-r-4 border-sky-500 pr-3">۴. مشخصات و نشانی خریدار</h4>
                                    
                                    {/* CRM Search & Auto-complete Section */}
                                    <div className="bg-sky-50 dark:bg-sky-950/20 p-4 rounded-xl border border-sky-100 dark:border-sky-900/40 relative">
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-600 dark:text-sky-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">جستجو و تکمیل خودکار با مشتریان موجود در CRM</span>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="نام مشتری یا شماره تلفن را جستجو کنید..."
                                                className="w-full px-4 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 border-sky-200 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                                                value={crmSearchQuery}
                                                onChange={e => handleCrmSearch(e.target.value)}
                                            />
                                            {crmResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl max-h-48 overflow-y-auto z-50 text-xs font-bold divide-y divide-slate-100 dark:divide-slate-700">
                                                    {crmResults.map(u => (
                                                        <button 
                                                            key={u.id}
                                                            type="button" 
                                                            onClick={() => handleSelectCrmUser(u)}
                                                            className="w-full text-right px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/30 flex justify-between items-center transition-colors text-slate-700 dark:text-slate-300 user-select-item"
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

                                    {/* Smart Suggestion banner if matching CRM contact has been found based on names/numbers entered */}
                                    {autoMatchCrmUser && (
                                        <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 text-xs flex justify-between items-center text-slate-700 dark:text-slate-300 animate-pulse" id="crm-auto-match-alert">
                                            <div className="flex items-center gap-2 font-bold">
                                                <span className="text-amber-500">💡</span>
                                                <span>مشتری منطبق در CRM یافت شد: <span className="text-sky-600 dark:text-sky-400">{autoMatchCrmUser.FullName} ({autoMatchCrmUser.Number})</span></span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => handleSelectCrmUser(autoMatchCrmUser)}
                                                className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg font-black transition-colors"
                                                id="crm-autofill-btn"
                                            >
                                                تکمیل هوشمند اطلاعات
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">نام کامل خریدار</label>
                                            <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={formData.buyerName} onChange={e => setFormData({...formData, buyerName: e.target.value})} placeholder="نام و نام خانوادگی مطابق شناسنامه" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">کد ملی</label>
                                            <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono" value={formData.buyerNationalId} onChange={e => setFormData({...formData, buyerNationalId: e.target.value})} dir="ltr" placeholder="1234567890" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">شماره تماس</label>
                                            <input required type="tel" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono" value={formData.buyerPhone} onChange={e => setFormData({...formData, buyerPhone: e.target.value})} dir="ltr" placeholder="09170000000" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">شهر محل سکونت</label>
                                            <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={formData.buyerCity} onChange={e => setFormData({...formData, buyerCity: e.target.value})} placeholder="مثال: شیراز" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">کد پستی</label>
                                            <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono" value={formData.buyerPostalCode} onChange={e => setFormData({...formData, buyerPostalCode: e.target.value})} dir="ltr" placeholder="7100000000" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">آدرس کامل پستی</label>
                                            <textarea required rows={2} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={formData.buyerAddress} onChange={e => setFormData({...formData, buyerAddress: e.target.value})} placeholder="خیابان، کوچه، پلاک، واحد..."></textarea>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                <div className="p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap justify-between items-center gap-3 rounded-b-2xl">
                    <button onClick={step === 1 ? onClose : handleBack} className="px-6 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                        {step === 1 ? 'انصراف' : 'قبلی'}
                    </button>
                    <div className="flex gap-2">
                        {step < 4 ? (
                            <button 
                                disabled={loading || (step === 1 && (!formData.carName || !formData.conditionId)) || (step === 2 && (!formData.proposedPrice || formData.proposedPrice <= 0)) || (step === 3 && !formData.selectedColor)} 
                                onClick={handleNext} 
                                className="px-8 py-2 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 disabled:opacity-30 shadow-md transition-all"
                            >
                                گام بعد
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={handleSaveAsDraft}
                                    className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-all"
                                >
                                    ذخیره پیش‌نویس
                                </button>
                                <button 
                                    onClick={handleFinalSubmit} 
                                    className="px-8 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all"
                                >
                                    {editOrder && editOrder.status === OrderStatus.DRAFT ? 'ارسال نهایی برای ادمین' : 'ثبت نهایی'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarOrderModal;
