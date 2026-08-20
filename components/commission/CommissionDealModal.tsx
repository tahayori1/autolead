import React, { useState, useEffect, useMemo } from 'react';
import { CommissionDeal, CommissionCategory, CommissionPaymentStatus, User, CommissionSettings } from '../../types';
import { calculateCommissionForCategory, parseSalesPersons, getCommissionSettings } from '../../services/commissionService';
import { 
    X, 
    Calculator, 
    Calendar, 
    User as UserIcon, 
    Users,
    PenTool,
    Car, 
    DollarSign, 
    FileText, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Building,
    Layers,
    Share2,
    Sliders,
    Edit3,
    Sparkles,
    RotateCcw
} from 'lucide-react';

interface CommissionDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (deal: CommissionDeal) => void;
    initialDeal?: CommissionDeal | null;
    activePeriodId: string;
    activePeriodName: string;
    crmUsers?: User[];
    commissionSettings?: CommissionSettings;
}

export const CommissionDealModal: React.FC<CommissionDealModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialDeal,
    activePeriodId,
    activePeriodName,
    crmUsers = [],
    commissionSettings
}) => {
    const isEdit = Boolean(initialDeal);
    const settings = commissionSettings || getCommissionSettings();

    // Form state
    const [category, setCategory] = useState<CommissionCategory>('ANBAR');
    const [saleDate, setSaleDate] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    
    // Collaborator / Sales staff states (1, 2, or 3 partners)
    const [partnerCount, setPartnerCount] = useState<1 | 2 | 3>(1);
    const [salesPerson1, setSalesPerson1] = useState('');
    const [salesPerson2, setSalesPerson2] = useState('');
    const [salesPerson3, setSalesPerson3] = useState('');
    const [contractWriter, setContractWriter] = useState(''); // Separate writer field

    // Multi-person custom commission shares
    const [isCustomPartnerSplit, setIsCustomPartnerSplit] = useState(false);
    const [partner1Commission, setPartner1Commission] = useState<number | ''>('');
    const [partner2Commission, setPartner2Commission] = useState<number | ''>('');
    const [partner3Commission, setPartner3Commission] = useState<number | ''>('');

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
    
    // Manual Commission Override State (Overall Deal)
    const [isManualCommission, setIsManualCommission] = useState(false);
    const [manualCommissionAmount, setManualCommissionAmount] = useState<number | ''>('');
    const [manualCommissionReason, setManualCommissionReason] = useState('');

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
            
            // Check if deal had 1, 2, or 3 partners or a split name
            const parsedPartners = initialDeal.sharedPersons || parseSalesPersons(initialDeal.salesPerson);
            const p1 = parsedPartners[0] || initialDeal.salesPerson || '';
            const p2 = parsedPartners[1] || initialDeal.secondSalesPerson || '';
            const p3 = parsedPartners[2] || initialDeal.thirdSalesPerson || '';

            if (initialDeal.thirdSalesPerson || parsedPartners.length >= 3) {
                setPartnerCount(3);
                setSalesPerson1(p1);
                setSalesPerson2(p2);
                setSalesPerson3(p3);
            } else if (initialDeal.secondSalesPerson || parsedPartners.length === 2) {
                setPartnerCount(2);
                setSalesPerson1(p1);
                setSalesPerson2(p2);
                setSalesPerson3('');
            } else {
                setPartnerCount(1);
                setSalesPerson1(p1);
                setSalesPerson2('');
                setSalesPerson3('');
            }

            // Custom multi-partner manual commissions
            if (initialDeal.customPersonCommissions && Object.keys(initialDeal.customPersonCommissions).length > 0) {
                setIsCustomPartnerSplit(true);
                if (p1 && initialDeal.customPersonCommissions[p1] !== undefined) {
                    setPartner1Commission(initialDeal.customPersonCommissions[p1]);
                } else {
                    setPartner1Commission('');
                }
                if (p2 && initialDeal.customPersonCommissions[p2] !== undefined) {
                    setPartner2Commission(initialDeal.customPersonCommissions[p2]);
                } else {
                    setPartner2Commission('');
                }
                if (p3 && initialDeal.customPersonCommissions[p3] !== undefined) {
                    setPartner3Commission(initialDeal.customPersonCommissions[p3]);
                } else {
                    setPartner3Commission('');
                }
            } else {
                setIsCustomPartnerSplit(false);
                setPartner1Commission('');
                setPartner2Commission('');
                setPartner3Commission('');
            }

            setContractWriter(initialDeal.contractWriter || '');
            
            // Fix: ensure buyerName and customerName are both populated from either field
            const loadedBuyer = initialDeal.buyerName || initialDeal.customerName || '';
            const loadedCustomer = initialDeal.customerName || initialDeal.buyerName || '';
            setCustomerName(loadedCustomer);
            setSellerName(initialDeal.sellerName || '');
            setBuyerName(loadedBuyer);
            
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

            // Manual commission override state
            if (initialDeal.isManualCommission) {
                setIsManualCommission(true);
                setManualCommissionAmount(initialDeal.commissionAmount ?? '');
                setManualCommissionReason(initialDeal.manualCommissionReason || '');
            } else {
                setIsManualCommission(false);
                setManualCommissionAmount('');
                setManualCommissionReason('');
            }

            setPaidCommissionShare(initialDeal.paidCommissionShare ?? '');
            setPaymentStatus(initialDeal.paymentStatus || 'PAID');
            setPaymentDate(initialDeal.paymentDate || '');
            setPaymentNotes(initialDeal.paymentNotes || '');
        } else {
            // Default new deal in current active period
            setCategory('ANBAR');
            const defaultDate = `1405/${activePeriodId.slice(5)}/01`;
            setSaleDate(defaultDate);
            setPurchaseDate('');
            setPartnerCount(1);
            setSalesPerson1('');
            setSalesPerson2('');
            setSalesPerson3('');
            setIsCustomPartnerSplit(false);
            setPartner1Commission('');
            setPartner2Commission('');
            setPartner3Commission('');
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
            
            setIsManualCommission(false);
            setManualCommissionAmount('');
            setManualCommissionReason('');

            setPaidCommissionShare('');
            setPaymentStatus('PAID');
            setPaymentDate('');
            setPaymentNotes('');
        }
    }, [isOpen, initialDeal, activePeriodId]);

    // Live Calculation based on selected category & configured rates
    const calculatedResult = useMemo(() => {
        return calculateCommissionForCategory(category, {
            salePrice: Number(salePrice) || 0,
            purchasePrice: Number(purchasePrice) || 0,
            dailyPrice: Number(dailyPrice) || 0,
            nextBasketAmount: Number(nextBasketAmount) || 0,
            downPayment: Number(downPayment) || 0,
            commissionRate
        }, settings);
    }, [category, salePrice, purchasePrice, dailyPrice, nextBasketAmount, downPayment, commissionRate, settings]);

    // Sum of custom partner commissions if in custom multi-person mode
    const customPartnersTotal = useMemo(() => {
        if (!isCustomPartnerSplit || partnerCount < 2) return 0;
        const p1 = Number(partner1Commission) || 0;
        const p2 = Number(partner2Commission) || 0;
        const p3 = partnerCount === 3 ? (Number(partner3Commission) || 0) : 0;
        return p1 + p2 + p3;
    }, [isCustomPartnerSplit, partnerCount, partner1Commission, partner2Commission, partner3Commission]);

    // Effective final commission amount
    const effectiveCommissionAmount = useMemo(() => {
        if (isCustomPartnerSplit && partnerCount >= 2 && customPartnersTotal > 0) {
            return customPartnersTotal;
        }
        if (isManualCommission && manualCommissionAmount !== '') {
            return Number(manualCommissionAmount);
        }
        return calculatedResult.commissionAmount;
    }, [isCustomPartnerSplit, partnerCount, customPartnersTotal, isManualCommission, manualCommissionAmount, calculatedResult.commissionAmount]);

    // Derived Sales Staff names & list
    const combinedSalesPerson = useMemo(() => {
        if (partnerCount === 3 && salesPerson2.trim() && salesPerson3.trim()) {
            return `${salesPerson1.trim()} / ${salesPerson2.trim()} / ${salesPerson3.trim()}`;
        }
        if (partnerCount >= 2 && salesPerson2.trim()) {
            return `${salesPerson1.trim()} / ${salesPerson2.trim()}`;
        }
        return salesPerson1.trim();
    }, [partnerCount, salesPerson1, salesPerson2, salesPerson3]);

    const activeSharedPersons = useMemo(() => {
        if (partnerCount === 3 && salesPerson1.trim() && salesPerson2.trim() && salesPerson3.trim()) {
            return [salesPerson1.trim(), salesPerson2.trim(), salesPerson3.trim()];
        }
        if (partnerCount === 2 && salesPerson1.trim() && salesPerson2.trim()) {
            return [salesPerson1.trim(), salesPerson2.trim()];
        }
        return undefined;
    }, [partnerCount, salesPerson1, salesPerson2, salesPerson3]);

    // Fast suggestion list for customer name
    const [nameQuery, setNameQuery] = useState('');
    const customerSuggestions = useMemo(() => {
        if (!nameQuery.trim() || !crmUsers.length) return [];
        const q = nameQuery.toLowerCase();
        return crmUsers
            .filter(u => u.name && u.name.toLowerCase().includes(q))
            .slice(0, 5);
    }, [nameQuery, crmUsers]);

    // Staff names for quick pick
    const staffOptions = useMemo(() => {
        const unique = new Set<string>();
        crmUsers.forEach(u => {
            if (u.name) unique.add(u.name);
        });
        // Default well-known personnel
        ['درسا محمدی', 'ندا قاسمی', 'عرشیا عسکری', 'شبنم کشاورز', 'طرلان منوچهری', 'امیرحسین رضایی', 'نازنین شیرازی', 'کوروش بهرامی'].forEach(n => unique.add(n));
        return Array.from(unique);
    }, [crmUsers]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const name = category === 'AZAD' 
            ? (buyerName.trim() || customerName.trim()) 
            : (customerName.trim() || buyerName.trim());

        if (!name.trim()) {
            alert('لطفاً نام مشتری یا خریدار را وارد کنید.');
            return;
        }

        if (!salesPerson1.trim()) {
            alert('لطفاً نام کارشناس فروش (یا همکار اول) را مشخص کنید.');
            return;
        }

        if (partnerCount === 2 && !salesPerson2.trim()) {
            alert('لطفاً نام همکار دوم را مشخص کنید یا تعداد همکاران را روی ۱ نفر تنظیم کنید.');
            return;
        }

        if (partnerCount === 3 && (!salesPerson2.trim() || !salesPerson3.trim())) {
            alert('لطفاً نام هر سه همکار فروش را مشخص کنید یا تعداد همکاران را کاهش دهید.');
            return;
        }

        const countOfPartners = activeSharedPersons ? activeSharedPersons.length : 1;
        const autoShare = Math.round(effectiveCommissionAmount / countOfPartners);

        // Build customPersonCommissions if multi-partner custom split is active
        let customCommissionsMap: Record<string, number> | undefined = undefined;
        if (isCustomPartnerSplit && partnerCount >= 2) {
            customCommissionsMap = {};
            if (salesPerson1.trim()) {
                customCommissionsMap[salesPerson1.trim()] = partner1Commission !== '' ? Number(partner1Commission) : autoShare;
            }
            if (salesPerson2.trim()) {
                customCommissionsMap[salesPerson2.trim()] = partner2Commission !== '' ? Number(partner2Commission) : autoShare;
            }
            if (partnerCount === 3 && salesPerson3.trim()) {
                customCommissionsMap[salesPerson3.trim()] = partner3Commission !== '' ? Number(partner3Commission) : autoShare;
            }
        }

        const newDeal: CommissionDeal = {
            id: initialDeal?.id || `deal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            periodId: activePeriodId,
            periodName: activePeriodName,
            category,
            saleDate: saleDate.trim(),
            purchaseDate: purchaseDate.trim() || undefined,
            salesPerson: combinedSalesPerson,
            secondSalesPerson: partnerCount >= 2 ? salesPerson2.trim() : undefined,
            thirdSalesPerson: partnerCount === 3 ? salesPerson3.trim() : undefined,
            contractWriter: contractWriter.trim() || undefined,
            customerName: name.trim(),
            sellerName: sellerName.trim() || undefined,
            buyerName: category === 'AZAD' ? name.trim() : (buyerName.trim() || name.trim()),
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
            commissionRate: calculatedResult.effectiveRate,
            commissionAmount: effectiveCommissionAmount,
            paidCommissionShare: paidCommissionShare !== '' ? Number(paidCommissionShare) : autoShare,
            sharedPersons: activeSharedPersons,
            customPersonCommissions: customCommissionsMap,
            
            isManualCommission: isManualCommission || isCustomPartnerSplit,
            manualCommissionReason: isCustomPartnerSplit 
                ? (manualCommissionReason.trim() || 'پورسانت دستی چند نفره') 
                : (isManualCommission ? manualCommissionReason.trim() : undefined),

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
                                { id: 'ANBAR', label: 'فروش انبار', desc: `${settings.anbarRate}٪ نرخ فروش` },
                                { id: 'AZAD', label: 'فروش آزاد', desc: `${settings.azadRate}٪ سود کمیسیون` },
                                { id: 'HAVALEH', label: 'فروش حواله', desc: `${settings.havalehRate}٪ نرخ فروش` },
                                { id: 'LEASING', label: 'لیزینگ و اقساط', desc: `${settings.leasingRate}٪ پیش‌پرداخت` },
                                { id: 'REGISTRATION', label: 'ثبت‌نام کارخانه', desc: `${settings.registrationRate}٪ پیش‌پرداخت` },
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

                    {/* 2. Personnel, Partners & Contract Writer */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-emerald-600" />
                                کارشناسان فروش معامله و قولنامه‌نویس
                            </h4>

                            {/* Partner Count Toggle (1, 2, or 3 partners) */}
                            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl gap-1 text-xs">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 px-2">تعداد همکار فروش:</span>
                                <button
                                    type="button"
                                    onClick={() => setPartnerCount(1)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        partnerCount === 1 
                                            ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    ۱ نفر (تک‌نفره)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPartnerCount(2)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        partnerCount === 2 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    ۲ همکار (۵۰٪)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPartnerCount(3)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        partnerCount === 3 
                                            ? 'bg-purple-600 text-white shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    ۳ همکار (۳۳.۳٪)
                                </button>
                            </div>
                        </div>

                        {/* Partner inputs */}
                        {partnerCount === 1 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        نام کارشناس فروش <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            list="staff-options-1"
                                            value={salesPerson1}
                                            onChange={e => setSalesPerson1(e.target.value)}
                                            placeholder="مثلاً: درسا محمدی"
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                                            required
                                        />
                                        <datalist id="staff-options-1">
                                            {staffOptions.map(name => (
                                                <option key={`p1-${name}`} value={name} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        تاریخ فروش معامله <span className="text-rose-500">*</span>
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
                        )}

                        {partnerCount === 2 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                                        همکار اول فروش (سهم ۵۰٪) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            list="staff-options-1"
                                            value={salesPerson1}
                                            onChange={e => setSalesPerson1(e.target.value)}
                                            placeholder="مثلاً: درسا محمدی"
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                            required
                                        />
                                        <datalist id="staff-options-1">
                                            {staffOptions.map(name => (
                                                <option key={`p1-${name}`} value={name} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                                        همکار دوم فروش (سهم ۵۰٪) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            list="staff-options-2"
                                            value={salesPerson2}
                                            onChange={e => setSalesPerson2(e.target.value)}
                                            placeholder="مثلاً: ندا قاسمی"
                                            className="w-full px-3 py-2 bg-indigo-50/50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900 dark:text-indigo-200"
                                            required
                                        />
                                        <datalist id="staff-options-2">
                                            {staffOptions.filter(n => n !== salesPerson1).map(name => (
                                                <option key={`p2-${name}`} value={name} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                            </div>
                        )}

                        {partnerCount === 3 && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">
                                        همکار اول (۳۳.۳٪) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            list="staff-options-1"
                                            value={salesPerson1}
                                            onChange={e => setSalesPerson1(e.target.value)}
                                            placeholder="مثلاً: درسا محمدی"
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                                            required
                                        />
                                        <datalist id="staff-options-1">
                                            {staffOptions.map(name => (
                                                <option key={`p1-${name}`} value={name} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">
                                        همکار دوم (۳۳.۳٪) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            list="staff-options-2"
                                            value={salesPerson2}
                                            onChange={e => setSalesPerson2(e.target.value)}
                                            placeholder="مثلاً: ندا قاسمی"
                                            className="w-full px-3 py-2 bg-purple-50/50 dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none font-bold text-purple-900 dark:text-purple-200"
                                            required
                                        />
                                        <datalist id="staff-options-2">
                                            {staffOptions.filter(n => n !== salesPerson1).map(name => (
                                                <option key={`p2-${name}`} value={name} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">
                                        همکار سوم (۳۳.۳٪) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            list="staff-options-3"
                                            value={salesPerson3}
                                            onChange={e => setSalesPerson3(e.target.value)}
                                            placeholder="مثلاً: عرشیا عسکری"
                                            className="w-full px-3 py-2 bg-purple-50/50 dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none font-bold text-purple-900 dark:text-purple-200"
                                            required
                                        />
                                        <datalist id="staff-options-3">
                                            {staffOptions.filter(n => n !== salesPerson1 && n !== salesPerson2).map(name => (
                                                <option key={`p3-${name}`} value={name} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contract writer & Sale date row for 2/3 partners */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        <PenTool className="w-3.5 h-3.5 text-amber-600" />
                                        نویسنده قولنامه (فیلد مجزا)
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-normal">قولنامه‌نویس مستقل</span>
                                </label>
                                <input
                                    type="text"
                                    list="writer-options"
                                    value={contractWriter}
                                    onChange={e => setContractWriter(e.target.value)}
                                    placeholder="مثلاً: طرلان منوچهری"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                                <datalist id="writer-options">
                                    {staffOptions.map(name => (
                                        <option key={`writer-${name}`} value={name} />
                                    ))}
                                </datalist>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    فیلد مجزا برای ثبت نام نویسنده قرارداد؛ تاثیری در تسهیم پورسانت فروش ندارد.
                                </span>
                            </div>

                            {partnerCount >= 2 && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        تاریخ فروش معامله <span className="text-rose-500">*</span>
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
                            )}
                        </div>

                        {/* Multi-Partner Commission Split Mode Selection & Manual Inputs */}
                        {partnerCount >= 2 && (
                            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-indigo-200 dark:border-indigo-800/60 space-y-3 animate-fade-in">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900 dark:text-indigo-200">
                                        <Share2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                        <span>نحوه تسهیم پورسانت بین {partnerCount} همکار:</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg text-xs">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCustomPartnerSplit(false);
                                                setPartner1Commission('');
                                                setPartner2Commission('');
                                                setPartner3Commission('');
                                            }}
                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                                                !isCustomPartnerSplit 
                                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                                            }`}
                                        >
                                            🔄 تسهیم مساوی خودکار ({partnerCount === 2 ? '۵۰٪ - ۵۰٪' : '۳۳.۳٪ مساوی'})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCustomPartnerSplit(true);
                                                const total = effectiveCommissionAmount || calculatedResult.commissionAmount || 0;
                                                if (partnerCount === 2) {
                                                    setPartner1Commission(Math.round(total * 0.5));
                                                    setPartner2Commission(Math.round(total * 0.5));
                                                } else {
                                                    const s = Math.round(total / 3);
                                                    setPartner1Commission(s);
                                                    setPartner2Commission(s);
                                                    setPartner3Commission(s);
                                                }
                                            }}
                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                                                isCustomPartnerSplit 
                                                    ? 'bg-amber-500 text-white shadow-sm' 
                                                    : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
                                            }`}
                                        >
                                            ✏️ تعیین دستی پورسانت هر همکار
                                        </button>
                                    </div>
                                </div>

                                {!isCustomPartnerSplit ? (
                                    <div className="p-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-lg text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                                        <span>
                                            تسهیم مساوی خودکار: هر همکار 
                                            <span className="font-bold text-indigo-700 dark:text-indigo-300 mr-1">
                                                (۱/{partnerCount})
                                            </span>
                                        </span>
                                        <span className="font-mono font-black text-indigo-800 dark:text-indigo-200">
                                            سهم هر نفر: {Math.round(effectiveCommissionAmount / partnerCount).toLocaleString('fa-IR')} ریال
                                        </span>
                                    </div>
                                ) : (
                                    <div className="space-y-3 p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/50">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-amber-900 dark:text-amber-200">
                                                مبالغ پورسانت دستی اختصاص‌یافته به هر همکار:
                                            </span>
                                            {/* Quick Presets */}
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-slate-500">الگوهای سریع:</span>
                                                {partnerCount === 2 ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const base = calculatedResult.commissionAmount || 0;
                                                                setPartner1Commission(Math.round(base * 0.5));
                                                                setPartner2Commission(Math.round(base * 0.5));
                                                            }}
                                                            className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold rounded hover:bg-indigo-50"
                                                        >
                                                            ۵۰/۵۰
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const base = calculatedResult.commissionAmount || 0;
                                                                setPartner1Commission(Math.round(base * 0.6));
                                                                setPartner2Commission(Math.round(base * 0.4));
                                                            }}
                                                            className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold rounded hover:bg-indigo-50"
                                                        >
                                                            ۶۰/۴۰
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const base = calculatedResult.commissionAmount || 0;
                                                                setPartner1Commission(Math.round(base * 0.7));
                                                                setPartner2Commission(Math.round(base * 0.3));
                                                            }}
                                                            className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold rounded hover:bg-indigo-50"
                                                        >
                                                            ۷۰/۳۰
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const base = calculatedResult.commissionAmount || 0;
                                                                const s = Math.round(base / 3);
                                                                setPartner1Commission(s);
                                                                setPartner2Commission(s);
                                                                setPartner3Commission(s);
                                                            }}
                                                            className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold rounded hover:bg-purple-50"
                                                        >
                                                            مساوی (۳۳٪)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const base = calculatedResult.commissionAmount || 0;
                                                                setPartner1Commission(Math.round(base * 0.5));
                                                                setPartner2Commission(Math.round(base * 0.25));
                                                                setPartner3Commission(Math.round(base * 0.25));
                                                            }}
                                                            className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold rounded hover:bg-purple-50"
                                                        >
                                                            ۵۰/۲۵/۲۵
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`grid grid-cols-1 ${partnerCount === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    سهم {salesPerson1 || 'همکار اول'} (ریال) <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={partner1Commission}
                                                    onChange={e => setPartner1Commission(e.target.value === '' ? '' : Number(e.target.value))}
                                                    placeholder="مبلغ سهم به ریال"
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono font-black text-amber-900 dark:text-amber-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                                    required
                                                />
                                                {partner1Commission !== '' && (
                                                    <span className="text-[10px] text-amber-700 dark:text-amber-300 block mt-0.5">
                                                        {Number(partner1Commission).toLocaleString('fa-IR')} ریال
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    سهم {salesPerson2 || 'همکار دوم'} (ریال) <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={partner2Commission}
                                                    onChange={e => setPartner2Commission(e.target.value === '' ? '' : Number(e.target.value))}
                                                    placeholder="مبلغ سهم به ریال"
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono font-black text-amber-900 dark:text-amber-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                                    required
                                                />
                                                {partner2Commission !== '' && (
                                                    <span className="text-[10px] text-amber-700 dark:text-amber-300 block mt-0.5">
                                                        {Number(partner2Commission).toLocaleString('fa-IR')} ریال
                                                    </span>
                                                )}
                                            </div>

                                            {partnerCount === 3 && (
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                        سهم {salesPerson3 || 'همکار سوم'} (ریال) <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={partner3Commission}
                                                        onChange={e => setPartner3Commission(e.target.value === '' ? '' : Number(e.target.value))}
                                                        placeholder="مبلغ سهم به ریال"
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono font-black text-amber-900 dark:text-amber-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                                        required
                                                    />
                                                    {partner3Commission !== '' && (
                                                        <span className="text-[10px] text-amber-700 dark:text-amber-300 block mt-0.5">
                                                            {Number(partner3Commission).toLocaleString('fa-IR')} ریال
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs">
                                            <span className="font-bold text-amber-900 dark:text-amber-200">
                                                مجموع پورسانت دستی معامله:
                                            </span>
                                            <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm">
                                                {customPartnersTotal.toLocaleString('fa-IR')} ریال
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. Customer & Vehicle Information */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-emerald-600" />
                            مشخصات مشتری، طرفین و خودرو
                        </h4>

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
                                        placeholder="مثلاً: دکتر نوید حقیقت"
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
                                        placeholder="مثلاً: لاماری ایما یا تیگو ۸ پرو"
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
                                            setBuyerName(e.target.value);
                                            setNameQuery(e.target.value);
                                        }}
                                        placeholder="مثلاً: علیرضا قربانی"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                                        required
                                    />
                                    {/* Auto-suggest */}
                                    {customerSuggestions.length > 0 && (
                                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden text-xs">
                                            {customerSuggestions.map(u => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setCustomerName(u.name || '');
                                                        setBuyerName(u.name || '');
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

                        {/* Calculated Summary Box with Manual Override Option */}
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 space-y-3">
                            
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div>
                                    <span className="text-slate-500 block text-[11px]">
                                        {category === 'AZAD' ? 'کمیسیون کل معامله:' : 'سود/زیان روز:'}
                                    </span>
                                    <span className={`font-mono font-bold ${
                                        (category === 'AZAD' ? calculatedResult.grossProfit : calculatedResult.dailyProfitLoss) >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'
                                    }`}>
                                        {(category === 'AZAD' ? calculatedResult.grossProfit : calculatedResult.dailyProfitLoss).toLocaleString('fa-IR')} ریال
                                    </span>
                                    {calculatedResult.isLossPenalty && (
                                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block mt-0.5">
                                            ⚠️ زیان روز (فرمول {settings.lossPenaltyRate}٪ نرخ فروش)
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span className="text-slate-500 block text-[11px]">پورسانت محاسبه‌شده فرمول:</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                            {calculatedResult.commissionAmount.toLocaleString('fa-IR')} ریال
                                        </span>
                                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold">
                                            ضریب {calculatedResult.effectiveRate}٪
                                        </span>
                                    </div>
                                </div>

                                {/* Manual Override Toggle */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!isManualCommission) {
                                                setIsManualCommission(true);
                                                setManualCommissionAmount(calculatedResult.commissionAmount);
                                            } else {
                                                setIsManualCommission(false);
                                                setManualCommissionAmount('');
                                                setManualCommissionReason('');
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                            isManualCommission
                                                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                                                : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        {isManualCommission ? 'تغییر دستی فعال است' : 'تغییر دستی پورسانت'}
                                    </button>
                                </div>
                            </div>

                            {/* Manual Override Fields (Conditional) */}
                            {isManualCommission && (
                                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2 animate-fade-in">
                                    <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                                        <span className="flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                            تعیین دستی مبلغ نهایی پورسانت برای این معامله:
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsManualCommission(false);
                                                setManualCommissionAmount('');
                                                setManualCommissionReason('');
                                            }}
                                            className="text-[11px] text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            بازگشت به محاسبه سیستمی ({calculatedResult.commissionAmount.toLocaleString('fa-IR')})
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                مبلغ پورسانت اختصاصی دستی (ریال) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={manualCommissionAmount}
                                                onChange={e => setManualCommissionAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                                placeholder="مبلغ مورد نظر به ریال"
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono font-black text-amber-800 dark:text-amber-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                                required
                                            />
                                            {manualCommissionAmount !== '' && (
                                                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block mt-1">
                                                    {Number(manualCommissionAmount).toLocaleString('fa-IR')} ریال
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                علت تغییر دستی پورسانت (اختیاری)
                                            </label>
                                            <input
                                                type="text"
                                                value={manualCommissionReason}
                                                onChange={e => setManualCommissionReason(e.target.value)}
                                                placeholder="مثلاً: توافق مدیرعامل / پورسانت توافقی مشتری"
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Effective Split Summary */}
                            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                    پورسانت نهایی ثبت شونده:
                                </span>
                                <div className="flex items-center gap-2">
                                    {isManualCommission && (
                                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-full text-[10px] font-black">
                                            ویرایش دستی
                                        </span>
                                    )}
                                    <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-base">
                                        {effectiveCommissionAmount.toLocaleString('fa-IR')} ریال
                                    </span>
                                </div>
                            </div>

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
                                    placeholder={String(effectiveCommissionAmount)}
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
