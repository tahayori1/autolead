import React, { useState, useEffect, useMemo } from 'react';
import { CommissionDeal, CommissionCategory, CommissionPaymentStatus, User } from '../../types';
import { calculateCommissionForCategory, parseSalesPersons } from '../../services/commissionService';
import { 
    X, 
    Calculator, 
    Calendar, 
    User as UserIcon, 
    Car, 
    DollarSign, 
    FileText, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Building,
    Layers,
    Share2
} from 'lucide-react';

interface CommissionDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (deal: CommissionDeal) => void;
    initialDeal?: CommissionDeal | null;
    activePeriodId: string;
    activePeriodName: string;
    crmUsers?: User[];
}

export const CommissionDealModal: React.FC<CommissionDealModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialDeal,
    activePeriodId,
    activePeriodName,
    crmUsers = []
}) => {
    const isEdit = Boolean(initialDeal);

    // Form state
    const [category, setCategory] = useState<CommissionCategory>('ANBAR');
    const [saleDate, setSaleDate] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [salesPerson, setSalesPerson] = useState('');
    const [contractWriter, setContractWriter] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [sellerName, setSellerName] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [carModel, setCarModel] = useState('');

    const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
    const [dailyPrice, setDailyPrice] = useState<number | ''>('');
    const [salePrice, setSalePrice] = useState<number | ''>('');
    const [nextBasketAmount, setNextBasketAmount] = useState<number | ''>('');
    const [downPayment, setDownPayment] = useState<number | ''>('');
    const [contractNumber, setContractNumber] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');

    const [commissionRate, setCommissionRate] = useState<number>(0.05);
    const [customCommissionAmount, setCustomCommissionAmount] = useState<number | ''>('');
    const [isCustomCommission, setIsCustomCommission] = useState(false);

    const [paidCommissionShare, setPaidCommissionShare] = useState<number | ''>('');
    const [paymentStatus, setPaymentStatus] = useState<CommissionPaymentStatus>('PAID');
    const [paymentDate, setPaymentDate] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    // Pre-populate fields on open or change
    useEffect(() => {
        if (!isOpen) return;

        if (initialDeal) {
            setCategory(initialDeal.category || 'ANBAR');
            setSaleDate(initialDeal.saleDate || '');
            setPurchaseDate(initialDeal.purchaseDate || '');
            setSalesPerson(initialDeal.salesPerson || '');
            setContractWriter(initialDeal.contractWriter || '');
            setCustomerName(initialDeal.customerName || initialDeal.buyerName || '');
            setSellerName(initialDeal.sellerName || '');
            setBuyerName(initialDeal.buyerName || '');
            setCustomerPhone(initialDeal.customerPhone || '');
            setCarModel(initialDeal.carModel || '');

            setPurchasePrice(initialDeal.purchasePrice ?? '');
            setDailyPrice(initialDeal.dailyPrice ?? '');
            setSalePrice(initialDeal.salePrice ?? '');
            setNextBasketAmount(initialDeal.nextBasketAmount ?? '');
            setDownPayment(initialDeal.downPayment ?? '');
            setContractNumber(initialDeal.contractNumber || '');
            setDeliveryDate(initialDeal.deliveryDate || '');

            setCommissionRate(initialDeal.commissionRate || 0.05);
            setCustomCommissionAmount(initialDeal.commissionAmount ?? '');
            setPaidCommissionShare(initialDeal.paidCommissionShare ?? '');
            setPaymentStatus(initialDeal.paymentStatus || 'PAID');
            setPaymentDate(initialDeal.paymentDate || '');
            setPaymentNotes(initialDeal.paymentNotes || '');
            setIsCustomCommission(false);
        } else {
            // Default new deal in current active period
            setCategory('ANBAR');
            const defaultDate = `1405/${activePeriodId.slice(5)}/01`;
            setSaleDate(defaultDate);
            setPurchaseDate('');
            setSalesPerson('');
            setContractWriter('');
            setCustomerName('');
            setSellerName('');
            setBuyerName('');
            setCustomerPhone('');
            setCarModel('eagle');
            setPurchasePrice('');
            setDailyPrice('');
            setSalePrice('');
            setNextBasketAmount('');
            setDownPayment('');
            setContractNumber('');
            setDeliveryDate('');
            setCommissionRate(0.05);
            setCustomCommissionAmount('');
            setPaidCommissionShare('');
            setPaymentStatus('PAID');
            setPaymentDate('');
            setPaymentNotes('');
            setIsCustomCommission(false);
        }
    }, [isOpen, initialDeal, activePeriodId]);

    // Live Calculation based on selected category & business rules
    const calculatedResult = useMemo(() => {
        return calculateCommissionForCategory(category, {
            salePrice: Number(salePrice) || 0,
            purchasePrice: Number(purchasePrice) || 0,
            dailyPrice: Number(dailyPrice) || 0,
            nextBasketAmount: Number(nextBasketAmount) || 0,
            downPayment: Number(downPayment) || 0,
            commissionRate
        });
    }, [category, salePrice, purchasePrice, dailyPrice, nextBasketAmount, downPayment, commissionRate]);

    const finalCommissionAmount = isCustomCommission && customCommissionAmount !== '' 
        ? Number(customCommissionAmount) 
        : calculatedResult.commissionAmount;

    // Shared personnel parsing
    const sharedStaff = useMemo(() => {
        return parseSalesPersons(salesPerson);
    }, [salesPerson]);

    // Fast suggestion list for customer name
    const [nameQuery, setNameQuery] = useState('');
    const customerSuggestions = useMemo(() => {
        if (!nameQuery.trim() || !crmUsers.length) return [];
        const q = nameQuery.toLowerCase();
        return crmUsers
            .filter(u => u.name && u.name.toLowerCase().includes(q))
            .slice(0, 5);
    }, [nameQuery, crmUsers]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const name = category === 'AZAD' 
            ? (buyerName || customerName) 
            : customerName;

        if (!name.trim()) {
            alert('لطفاً نام مشتری یا خریدار را وارد کنید.');
            return;
        }

        if (!salesPerson.trim()) {
            alert('لطفاً نام پرسنل فروش را مشخص کنید.');
            return;
        }

        const effectiveShared = sharedStaff.length > 1 ? sharedStaff : undefined;
        const autoShare = effectiveShared ? Math.round(finalCommissionAmount / effectiveShared.length) : finalCommissionAmount;

        const newDeal: CommissionDeal = {
            id: initialDeal?.id || `deal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            periodId: activePeriodId,
            periodName: activePeriodName,
            category,
            saleDate: saleDate.trim(),
            purchaseDate: purchaseDate.trim() || undefined,
            salesPerson: salesPerson.trim(),
            contractWriter: contractWriter.trim() || undefined,
            customerName: name.trim(),
            sellerName: sellerName.trim() || undefined,
            buyerName: buyerName.trim() || undefined,
            customerPhone: customerPhone.trim() || undefined,
            carModel: carModel.trim(),
            
            purchasePrice: purchasePrice !== '' ? Number(purchasePrice) : undefined,
            dailyPrice: dailyPrice !== '' ? Number(dailyPrice) : undefined,
            salePrice: salePrice !== '' ? Number(salePrice) : undefined,
            nextBasketAmount: nextBasketAmount !== '' ? Number(nextBasketAmount) : undefined,
            downPayment: downPayment !== '' ? Number(downPayment) : undefined,
            contractNumber: contractNumber.trim() || undefined,
            deliveryDate: deliveryDate.trim() || undefined,

            dailyProfitLoss: calculatedResult.dailyProfitLoss,
            grossProfit: calculatedResult.grossProfit,
            commissionRate,
            commissionAmount: finalCommissionAmount,
            paidCommissionShare: paidCommissionShare !== '' ? Number(paidCommissionShare) : autoShare,
            sharedPersons: effectiveShared,

            paymentStatus,
            paymentDate: paymentDate.trim() || undefined,
            paymentNotes: paymentNotes.trim() || undefined,
            updatedAt: new Date().toISOString()
        };

        onSave(newDeal);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in" dir="rtl">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-l from-emerald-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-white">
                                {isEdit ? 'ویرایش ردیف معامله و پورسانت' : 'ثبت معامله جدید'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                دوره مالی: <span className="font-bold text-emerald-600 dark:text-emerald-400">{activePeriodName}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body / Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* 1. Category Selection Tabs */}
                    <div>
                        <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-emerald-600" />
                            دسته‌بندی و نوع معامله (شیت محاسباتی):
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {[
                                { id: 'ANBAR', label: 'فروش انبار', desc: '۰.۰۵٪ نرخ فروش' },
                                { id: 'AZAD', label: 'فروش آزاد', desc: '۱۰٪ سود کمیسیون' },
                                { id: 'HAVALEH', label: 'فروش حواله', desc: '۰.۰۵٪ نرخ فروش' },
                                { id: 'LEASING', label: 'لیزینگ و اقساط', desc: '۰.۱٪ پیش‌پرداخت' },
                                { id: 'REGISTRATION', label: 'ثبت‌نام کارخانه', desc: 'پیش‌پرداخت/قرارداد' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setCategory(tab.id as CommissionCategory)}
                                    className={`p-3 rounded-2xl border text-center transition-all ${
                                        category === tab.id
                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black shadow-sm ring-2 ring-emerald-500/20'
                                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className="text-xs">{tab.label}</div>
                                    <div className="text-[10px] opacity-70 mt-0.5">{tab.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Personnel and Dates */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    نام کارشناس فروش <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={salesPerson}
                                    onChange={e => setSalesPerson(e.target.value)}
                                    placeholder="مثلاً: درسا محمدی یا عرشیا عسکری / شبنم کشاورز"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                                    required
                                />
                                {sharedStaff.length > 1 && (
                                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1 font-bold">
                                        <Share2 className="w-3 h-3" />
                                        فروش مشترک: تقسیم ۵۰٪ بین {sharedStaff.join(' و ')}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    قولنامه‌نویس / همکار هماهنگ‌کننده
                                </label>
                                <input
                                    type="text"
                                    value={contractWriter}
                                    onChange={e => setContractWriter(e.target.value)}
                                    placeholder="مثلاً: طرلان منوچهری"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    تاریخ فروش <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={saleDate}
                                    onChange={e => setSaleDate(e.target.value)}
                                    placeholder="۱۴۰۵/۰۵/۱۰"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Customer & Vehicle Information */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                        {category === 'AZAD' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        نام فروشنده (مالک خودرو)
                                    </label>
                                    <input
                                        type="text"
                                        value={sellerName}
                                        onChange={e => setSellerName(e.target.value)}
                                        placeholder="مثلاً: علی هوشمند سروستانی"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        نام خریدار <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={buyerName}
                                        onChange={e => {
                                            setBuyerName(e.target.value);
                                            setCustomerName(e.target.value);
                                        }}
                                        placeholder="مثلاً: کیانا نگهداری"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        مدل خودرو <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={carModel}
                                        onChange={e => setCarModel(e.target.value)}
                                        placeholder="مثلاً: (1404) x3"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-700 dark:text-emerald-400"
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        نام مشتری / خریدار <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={e => {
                                            setCustomerName(e.target.value);
                                            setNameQuery(e.target.value);
                                        }}
                                        placeholder="مثلاً: هدیه توکلی ریشهری"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                                        required
                                    />
                                    {customerSuggestions.length > 0 && (
                                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden text-xs">
                                            {customerSuggestions.map(u => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setCustomerName(u.name || '');
                                                        setCustomerPhone(u.phone || '');
                                                        if (u.carModel) setCarModel(u.carModel);
                                                        setNameQuery('');
                                                    }}
                                                    className="w-full px-3 py-2 text-right hover:bg-emerald-50 dark:hover:bg-slate-700 flex justify-between items-center"
                                                >
                                                    <span className="font-bold">{u.name}</span>
                                                    <span className="font-mono text-[10px] text-slate-400">{u.phone}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        شماره تماس مشتری
                                    </label>
                                    <input
                                        type="text"
                                        value={customerPhone}
                                        onChange={e => setCustomerPhone(e.target.value)}
                                        placeholder="0917..."
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        مدل خودرو <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={carModel}
                                        onChange={e => setCarModel(e.target.value)}
                                        placeholder="مثلاً: (1405) eagle یا j4 یا t9"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-700 dark:text-emerald-400"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4. Financial Numbers & Formula Inputs */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
                            مبالغ مالی و ارقام معامله (ریال)
                        </h4>

                        {category === 'LEASING' || category === 'REGISTRATION' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        مبلغ پیش‌پرداخت (ریال) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={downPayment}
                                        onChange={e => setDownPayment(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="مثلاً: 15000000000"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                        required
                                    />
                                    {downPayment !== '' && (
                                        <span className="text-[10px] text-slate-400 block mt-1">
                                            {Number(downPayment).toLocaleString('fa-IR')} ریال
                                        </span>
                                    )}
                                </div>

                                {category === 'REGISTRATION' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            شماره قرارداد ثبت‌نام
                                        </label>
                                        <input
                                            type="text"
                                            value={contractNumber}
                                            onChange={e => setContractNumber(e.target.value)}
                                            placeholder="مثلاً: CTR-9842"
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        نرخ خرید (ریال)
                                    </label>
                                    <input
                                        type="number"
                                        value={purchasePrice}
                                        onChange={e => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="مثلاً: 21000000000"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                    {purchasePrice !== '' && (
                                        <span className="text-[10px] text-slate-400 block mt-1">
                                            {Number(purchasePrice).toLocaleString('fa-IR')} ریال
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        قیمت روز / مبنا (ریال)
                                    </label>
                                    <input
                                        type="number"
                                        value={dailyPrice}
                                        onChange={e => setDailyPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="مثلاً: 24500000000"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                    {dailyPrice !== '' && (
                                        <span className="text-[10px] text-slate-400 block mt-1">
                                            {Number(dailyPrice).toLocaleString('fa-IR')} ریال
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        نرخ فروش نهایی (ریال) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={salePrice}
                                        onChange={e => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="مثلاً: 24600000000"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        required
                                    />
                                    {salePrice !== '' && (
                                        <span className="text-[10px] text-slate-400 block mt-1">
                                            {Number(salePrice).toLocaleString('fa-IR')} ریال
                                        </span>
                                    )}
                                </div>

                                {category === 'HAVALEH' && (
                                    <div className="sm:col-span-3">
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            مبلغ سبد بعدی (ریال)
                                        </label>
                                        <input
                                            type="number"
                                            value={nextBasketAmount}
                                            onChange={e => setNextBasketAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="مثلاً: 26500000000"
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Calculated Results Summary Box */}
                        <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div>
                                <span className="text-slate-500 block text-[11px]">
                                    {category === 'AZAD' ? 'کمیسیون کل معامله:' : 'سود/زیان روز:'}
                                </span>
                                <span className={`font-mono font-bold ${
                                    (category === 'AZAD' ? calculatedResult.grossProfit : calculatedResult.dailyProfitLoss) >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'
                                }`}>
                                    {(category === 'AZAD' ? calculatedResult.grossProfit : calculatedResult.dailyProfitLoss).toLocaleString('fa-IR')} ریال
                                </span>
                            </div>

                            <div>
                                <span className="text-slate-500 block text-[11px]">پورسانت محاسبه‌شده سیستم:</span>
                                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                    {calculatedResult.commissionAmount.toLocaleString('fa-IR')} ریال
                                </span>
                            </div>

                            {sharedStaff.length > 1 && (
                                <div>
                                    <span className="text-indigo-600 block text-[11px]">سهم هر کارشناس (۵۰٪):</span>
                                    <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">
                                        {Math.round(calculatedResult.commissionAmount / sharedStaff.length).toLocaleString('fa-IR')} ریال
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5. Payment Details & Status */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    وضعیت واریز پورسانت
                                </label>
                                <select
                                    value={paymentStatus}
                                    onChange={e => setPaymentStatus(e.target.value as CommissionPaymentStatus)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                >
                                    <option value="PAID">واریز شد (تسویه کامل)</option>
                                    <option value="PARTIAL">علی‌الحساب (پرداخت جزیی)</option>
                                    <option value="PENDING">در انتظار واریز</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    مبلغ سهم پرداختی (ریال)
                                </label>
                                <input
                                    type="number"
                                    value={paidCommissionShare}
                                    onChange={e => setPaidCommissionShare(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder={String(finalCommissionAmount)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    یادداشت و جزئیات واریز
                                </label>
                                <input
                                    type="text"
                                    value={paymentNotes}
                                    onChange={e => setPaymentNotes(e.target.value)}
                                    placeholder="مثلاً: شماره پیگیری یا توضیحات چک"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            انصراف
                        </button>
                        <button
                            type="submit"
                            className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {isEdit ? 'بروزرسانی معامله' : 'ثبت نهایی معامله'}
                        </button>
                    </div>

                </form>

            </div>
        </div>
    );
};
