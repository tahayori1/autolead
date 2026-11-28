import React, { useState, useEffect, useMemo } from 'react';
import { CommissionDeal, CommissionCategory, CommissionPaymentStatus, User, CommissionSettings } from '../../types';
import {
    calculateDealFinancials,
    parseSalesPersons,
    getCommissionSettings,
    normalizePersonnelName,
    validateSalePurchaseDates,
    formatDecimalPercentLabel,
    detectHardDeal,
    detectUnrealisticPurchasePrice
} from '../../services/commissionService';
import {
    X,
    Calculator,
    Users,
    PenTool,
    Car,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Layers,
    Share2,
    Edit3,
    RotateCcw,
    Hash,
    ShieldAlert
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
    const [transactionId, setTransactionId] = useState('');
    const [saleDate, setSaleDate] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');

    // Collaborator / Sales staff states (1, 2, or 3 partners)
    const [partnerCount, setPartnerCount] = useState<1 | 2 | 3>(1);
    const [salesPerson1, setSalesPerson1] = useState('');
    const [salesPerson2, setSalesPerson2] = useState('');
    const [salesPerson3, setSalesPerson3] = useState('');
    const [contractWriter, setContractWriter] = useState('');

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

    // Flags & Policy Toggles
    const [isHardDeal, setIsHardDeal] = useState(false);
    const [isUnrealisticPurchasePrice, setIsUnrealisticPurchasePrice] = useState(false);
    const [managerApprovedUnrealistic, setManagerApprovedUnrealistic] = useState(false);

    // Manual Commission Override State
    const [isManualCommission, setIsManualCommission] = useState(false);
    const [manualCommissionAmount, setManualCommissionAmount] = useState<number | ''>('');
    const [manualCommissionReason, setManualCommissionReason] = useState('');

    const [paidCommissionShare, setPaidCommissionShare] = useState<number | ''>('');
    const [paymentStatus, setPaymentStatus] = useState<CommissionPaymentStatus>('PAID');
    const [paymentDate, setPaymentDate] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        if (initialDeal) {
            setCategory(initialDeal.category || 'ANBAR');
            setTransactionId(initialDeal.transactionId || '');
            setSaleDate(initialDeal.saleDate || '');
            setPurchaseDate(initialDeal.purchaseDate || '');

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

            if (initialDeal.customPersonCommissions && Object.keys(initialDeal.customPersonCommissions).length > 0) {
                setIsCustomPartnerSplit(true);
                setPartner1Commission(p1 && initialDeal.customPersonCommissions[p1] !== undefined ? initialDeal.customPersonCommissions[p1] : '');
                setPartner2Commission(p2 && initialDeal.customPersonCommissions[p2] !== undefined ? initialDeal.customPersonCommissions[p2] : '');
                setPartner3Commission(p3 && initialDeal.customPersonCommissions[p3] !== undefined ? initialDeal.customPersonCommissions[p3] : '');
            } else {
                setIsCustomPartnerSplit(false);
                setPartner1Commission('');
                setPartner2Commission('');
                setPartner3Commission('');
            }

            setContractWriter(initialDeal.contractWriter || '');
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

            setIsHardDeal(detectHardDeal(initialDeal));
            setIsUnrealisticPurchasePrice(detectUnrealisticPurchasePrice(initialDeal));
            setManagerApprovedUnrealistic(Boolean(initialDeal.managerApprovedUnrealistic));

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
            setCategory('ANBAR');
            const autoTx = `TX-${Date.now().toString().slice(-5)}`;
            setTransactionId(autoTx);
            const periodSlice = activePeriodId.length >= 7 ? activePeriodId.slice(5, 7) : '05';
            const yearSlice = activePeriodId.length >= 4 ? activePeriodId.slice(0, 4) : '1405';
            setSaleDate(`${yearSlice}/${periodSlice}/01`);
            setPurchaseDate(`${yearSlice}/${periodSlice}/01`);
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
            setIsHardDeal(false);
            setIsUnrealisticPurchasePrice(false);
            setManagerApprovedUnrealistic(false);
            setIsManualCommission(false);
            setManualCommissionAmount('');
            setManualCommissionReason('');
            setPaidCommissionShare('');
            setPaymentStatus('PAID');
            setPaymentDate('');
            setPaymentNotes('');
        }
    }, [isOpen, initialDeal, activePeriodId]);

    // Auto-detect keyword flags in notes
    useEffect(() => {
        if (category === 'AZAD' && /معاملات\s*سخت|معامله\s*سخت/i.test(paymentNotes)) {
            setIsHardDeal(true);
        }
        if (/عدد\s*نرخ\s*خرید\s*غیر\s*واقعی|نرخ\s*خرید\s*غیر\s*واقعی/i.test(paymentNotes)) {
            setIsUnrealisticPurchasePrice(true);
        }
    }, [paymentNotes, category]);

    const dateValidation = useMemo(() => {
        return validateSalePurchaseDates(purchaseDate, saleDate);
    }, [purchaseDate, saleDate]);

    const calculatedResult = useMemo(() => {
        return calculateDealFinancials(
            category,
            {
                salePrice: Number(salePrice) || 0,
                purchasePrice: Number(purchasePrice) || 0,
                dailyPrice: Number(dailyPrice) || 0,
                nextBasketAmount: Number(nextBasketAmount) || 0,
                downPayment: Number(downPayment) || 0,
                participantCount: partnerCount,
                isHardDeal,
                isUnrealisticPurchasePrice,
                managerApprovedUnrealistic,
                paymentNotes,
                manualCommissionReason,
                carModel
            },
            settings
        );
    }, [
        category,
        salePrice,
        purchasePrice,
        dailyPrice,
        nextBasketAmount,
        downPayment,
        partnerCount,
        isHardDeal,
        isUnrealisticPurchasePrice,
        managerApprovedUnrealistic,
        paymentNotes,
        manualCommissionReason,
        carModel,
        settings
    ]);

    const customPartnersTotal = useMemo(() => {
        if (!isCustomPartnerSplit || partnerCount < 2) return 0;
        const p1 = Number(partner1Commission) || 0;
        const p2 = Number(partner2Commission) || 0;
        const p3 = partnerCount === 3 ? (Number(partner3Commission) || 0) : 0;
        return p1 + p2 + p3;
    }, [isCustomPartnerSplit, partnerCount, partner1Commission, partner2Commission, partner3Commission]);

    const effectiveCommissionAmount = useMemo(() => {
        if (isCustomPartnerSplit && partnerCount >= 2 && customPartnersTotal > 0) {
            return customPartnersTotal;
        }
        if (isManualCommission && manualCommissionAmount !== '') {
            return Number(manualCommissionAmount);
        }
        return calculatedResult.commissionAmount;
    }, [isCustomPartnerSplit, partnerCount, customPartnersTotal, isManualCommission, manualCommissionAmount, calculatedResult.commissionAmount]);

    const effectivePerPerson = useMemo(() => {
        return Math.round(effectiveCommissionAmount / partnerCount);
    }, [effectiveCommissionAmount, partnerCount]);

    const effectiveTenPercent = useMemo(() => {
        return Math.round(effectivePerPerson * 0.10);
    }, [effectivePerPerson]);

    const combinedSalesPerson = useMemo(() => {
        const n1 = normalizePersonnelName(salesPerson1);
        const n2 = normalizePersonnelName(salesPerson2);
        const n3 = normalizePersonnelName(salesPerson3);
        if (partnerCount === 3 && n2 && n3) return `${n1} / ${n2} / ${n3}`;
        if (partnerCount >= 2 && n2) return `${n1} / ${n2}`;
        return n1;
    }, [partnerCount, salesPerson1, salesPerson2, salesPerson3]);

    const activeSharedPersons = useMemo(() => {
        const n1 = normalizePersonnelName(salesPerson1);
        const n2 = normalizePersonnelName(salesPerson2);
        const n3 = normalizePersonnelName(salesPerson3);
        if (partnerCount === 3 && n1 && n2 && n3) return [n1, n2, n3];
        if (partnerCount === 2 && n1 && n2) return [n1, n2];
        return undefined;
    }, [partnerCount, salesPerson1, salesPerson2, salesPerson3]);

    const [nameQuery, setNameQuery] = useState('');
    const customerSuggestions = useMemo(() => {
        if (!nameQuery.trim() || !crmUsers.length) return [];
        const q = nameQuery.toLowerCase();
        return crmUsers
            .filter(u => u.FullName && u.FullName.toLowerCase().includes(q))
            .slice(0, 5);
    }, [nameQuery, crmUsers]);

    const staffOptions = useMemo(() => {
        const unique = new Set<string>();
        crmUsers.forEach(u => {
            if (u.crmPerson) unique.add(normalizePersonnelName(u.crmPerson));
        });
        [
            'درسا محمدی',
            'ندا قاسمی',
            'عرشیا عسکری',
            'شبنم کشاورز',
            'طرلان منوچهری',
            'محمد مبین غلامی',
            'امین رضا موسوی اصل',
            'مرضیه ایران نژاد',
            'هیلدا منوچهری',
            'مریم یوسفی',
            'زهرا زارع',
            'محسن موسوی'
        ].forEach(n => unique.add(n));
        return Array.from(unique);
    }, [crmUsers]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!dateValidation.isValid) {
            return;
        }

        const name = category === 'AZAD'
            ? (buyerName.trim() || customerName.trim())
            : (customerName.trim() || buyerName.trim());

        if (!name.trim()) return;
        if (!normalizePersonnelName(salesPerson1)) return;
        if (partnerCount >= 2 && !normalizePersonnelName(salesPerson2)) return;
        if (partnerCount === 3 && !normalizePersonnelName(salesPerson3)) return;

        const ensuredTxId = transactionId.trim() || (partnerCount >= 2 ? `TX-${Date.now().toString().slice(-6)}` : undefined);

        const countOfPartners = activeSharedPersons ? activeSharedPersons.length : 1;
        const autoShare = Math.round(effectiveCommissionAmount / countOfPartners);

        let customCommissionsMap: Record<string, number> | undefined = undefined;
        if (isCustomPartnerSplit && partnerCount >= 2) {
            customCommissionsMap = {};
            const n1 = normalizePersonnelName(salesPerson1);
            const n2 = normalizePersonnelName(salesPerson2);
            const n3 = normalizePersonnelName(salesPerson3);
            if (n1) customCommissionsMap[n1] = partner1Commission !== '' ? Number(partner1Commission) : autoShare;
            if (n2) customCommissionsMap[n2] = partner2Commission !== '' ? Number(partner2Commission) : autoShare;
            if (partnerCount === 3 && n3) customCommissionsMap[n3] = partner3Commission !== '' ? Number(partner3Commission) : autoShare;
        }

        const newDeal: CommissionDeal = {
            id: initialDeal?.id || `deal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            transactionId: ensuredTxId,
            periodId: activePeriodId,
            periodName: activePeriodName,
            category,
            saleDate: saleDate.trim(),
            purchaseDate: purchaseDate.trim() || undefined,
            salesPerson: combinedSalesPerson,
            secondSalesPerson: partnerCount >= 2 ? normalizePersonnelName(salesPerson2) : undefined,
            thirdSalesPerson: partnerCount === 3 ? normalizePersonnelName(salesPerson3) : undefined,
            contractWriter: contractWriter.trim() ? normalizePersonnelName(contractWriter) : undefined,
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
            oldCommissionAmount: calculatedResult.oldCommissionAmount,
            incentiveBonusAmount: calculatedResult.incentiveBonusAmount,
            commissionRate: calculatedResult.effectiveRate,
            commissionAmount: effectiveCommissionAmount,
            perPersonCommission: effectivePerPerson,
            tenPercentCommission: effectiveTenPercent,
            paidCommissionShare: paidCommissionShare !== '' ? Number(paidCommissionShare) : effectivePerPerson,
            sharedPersons: activeSharedPersons,
            customPersonCommissions: customCommissionsMap,

            isHardDeal: category === 'AZAD' ? isHardDeal : false,
            isUnrealisticPurchasePrice,
            managerApprovedUnrealistic: isUnrealisticPurchasePrice ? managerApprovedUnrealistic : false,
            isDraftLeasing: calculatedResult.isDraftLeasing,

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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
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
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    
                    {/* 1. Category Selection Tabs */}
                    <div>
                        <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-emerald-600" />
                            دسته‌بندی و شیت محاسباتی:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {[
                                { id: 'ANBAR', label: 'فروش انبار', desc: `${formatDecimalPercentLabel(settings.anbarRate)} + تشویقی` },
                                { id: 'AZAD', label: 'فروش آزاد', desc: `${formatDecimalPercentLabel(settings.azadRate)} / ${formatDecimalPercentLabel(settings.azadHardRate)} سخت` },
                                { id: 'HAVALEH', label: 'فروش حواله', desc: `${formatDecimalPercentLabel(settings.havalehRate)} مابه‌التفاوت` },
                                { id: 'REGISTRATION', label: 'ثبت‌نام', desc: `${formatDecimalPercentLabel(settings.registrationRate)} پیش‌پرداخت` },
                                { id: 'LEASING', label: 'لیزینگ', desc: settings.leasingRateConfirmed ? formatDecimalPercentLabel(settings.leasingRate) : 'پیش‌نویس' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setCategory(tab.id as CommissionCategory)}
                                    className={`p-2.5 rounded-xl border text-center transition-all ${
                                        category === tab.id
                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black'
                                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className="text-xs">{tab.label}</div>
                                    <div className="text-[10px] opacity-75 mt-0.5 font-mono">{tab.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Transaction ID, Dates & Date Order Validation */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                    <Hash className="w-3.5 h-3.5 text-indigo-600" />
                                    شناسه معامله (Transaction ID)
                                    {partnerCount >= 2 && <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    type="text"
                                    value={transactionId}
                                    onChange={e => setTransactionId(e.target.value)}
                                    placeholder="مثلاً: TX-1405-101"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                                    required={partnerCount >= 2}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    تاریخ خرید
                                </label>
                                <input
                                    type="text"
                                    value={purchaseDate}
                                    onChange={e => setPurchaseDate(e.target.value)}
                                    placeholder="1405/05/01"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center outline-none focus:ring-2 focus:ring-emerald-500"
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
                                    placeholder="1405/05/10"
                                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl text-xs font-mono text-center outline-none focus:ring-2 ${
                                        !dateValidation.isValid
                                            ? 'border-rose-500 focus:ring-rose-500 text-rose-600 font-black'
                                            : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500 font-bold'
                                    }`}
                                    required
                                />
                            </div>
                        </div>
                        {!dateValidation.isValid && (
                            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {dateValidation.message}
                            </div>
                        )}
                    </div>

                    {/* 3. Personnel, Partners & Contract Writer */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-emerald-600" />
                                پرسنل مشارکت‌کننده در معامله
                            </h4>

                            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl gap-1 text-xs">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 px-2">مشارکت:</span>
                                {([1, 2, 3] as const).map(cnt => (
                                    <button
                                        key={cnt}
                                        type="button"
                                        onClick={() => setPartnerCount(cnt)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                            partnerCount === cnt
                                                ? 'bg-emerald-600 text-white'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50'
                                        }`}
                                    >
                                        {cnt === 1 ? '۱ نفر' : cnt === 2 ? '۲ نفر (۵۰٪)' : '۳ نفر (۳۳.۳٪)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`grid grid-cols-1 ${partnerCount === 3 ? 'sm:grid-cols-3' : partnerCount === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2'} gap-3`}>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    {partnerCount === 1 ? 'نام پرسنل فروش' : 'همکار اول'} <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    list="staff-options-modal"
                                    value={salesPerson1}
                                    onChange={e => setSalesPerson1(e.target.value)}
                                    placeholder="مثلاً: درسا محمدی"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            {partnerCount >= 2 && (
                                <div>
                                    <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                                        همکار دوم <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        list="staff-options-modal"
                                        value={salesPerson2}
                                        onChange={e => setSalesPerson2(e.target.value)}
                                        placeholder="مثلاً: ندا قاسمی"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                            )}

                            {partnerCount === 3 && (
                                <div>
                                    <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">
                                        همکار سوم <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        list="staff-options-modal"
                                        value={salesPerson3}
                                        onChange={e => setSalesPerson3(e.target.value)}
                                        placeholder="مثلاً: عرشیا عسکری"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                    <PenTool className="w-3.5 h-3.5 text-amber-600" />
                                    نویسنده قولنامه (اختیاری)
                                </label>
                                <input
                                    type="text"
                                    list="staff-options-modal"
                                    value={contractWriter}
                                    onChange={e => setContractWriter(e.target.value)}
                                    placeholder="مثلاً: طرلان منوچهری"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>

                        <datalist id="staff-options-modal">
                            {staffOptions.map(name => (
                                <option key={name} value={name} />
                            ))}
                        </datalist>

                        {partnerCount >= 2 && (
                            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-indigo-200 dark:border-indigo-800/60 space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900 dark:text-indigo-200">
                                        <Share2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                        <span>تقسیم پورسانت بین {partnerCount} نفر مشارکت‌کننده:</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setIsCustomPartnerSplit(false)}
                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                                !isCustomPartnerSplit ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            تقسیم مساوی خودکار (÷ {partnerCount})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCustomPartnerSplit(true);
                                                const s = Math.round(effectiveCommissionAmount / partnerCount);
                                                setPartner1Commission(s);
                                                setPartner2Commission(s);
                                                if (partnerCount === 3) setPartner3Commission(s);
                                            }}
                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                                isCustomPartnerSplit ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            سهم دستی هر همکار
                                        </button>
                                    </div>
                                </div>

                                {!isCustomPartnerSplit ? (
                                    <div className="text-xs text-indigo-800 dark:text-indigo-200 flex items-center justify-between bg-indigo-50/70 dark:bg-indigo-950/30 px-3 py-2 rounded-lg">
                                        <span>پورسانت نهایی هر نفر:</span>
                                        <span className="font-mono tabular-nums font-black">{effectivePerPerson.toLocaleString('fa-IR')} ریال</span>
                                    </div>
                                ) : (
                                    <div className={`grid grid-cols-1 ${partnerCount === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2`}>
                                        <input
                                            type="number"
                                            value={partner1Commission}
                                            onChange={e => setPartner1Commission(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder={`سهم ${salesPerson1 || 'اول'} (ریال)`}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono"
                                            required
                                        />
                                        <input
                                            type="number"
                                            value={partner2Commission}
                                            onChange={e => setPartner2Commission(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder={`سهم ${salesPerson2 || 'دوم'} (ریال)`}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono"
                                            required
                                        />
                                        {partnerCount === 3 && (
                                            <input
                                                type="number"
                                                value={partner3Commission}
                                                onChange={e => setPartner3Commission(e.target.value === '' ? '' : Number(e.target.value))}
                                                placeholder={`سهم ${salesPerson3 || 'سوم'} (ریال)`}
                                                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono"
                                                required
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 4. Customer & Vehicle Information */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-emerald-600" />
                            مشخصات مشتری، طرفین و خودرو
                        </h4>

                        {category === 'AZAD' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">فروشنده (مالک)</label>
                                    <input
                                        type="text"
                                        value={sellerName}
                                        onChange={e => setSellerName(e.target.value)}
                                        placeholder="نام فروشنده"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">خریدار <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        value={buyerName}
                                        onChange={e => {
                                            setBuyerName(e.target.value);
                                            setCustomerName(e.target.value);
                                        }}
                                        placeholder="نام خریدار"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مدل خودرو <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        value={carModel}
                                        onChange={e => setCarModel(e.target.value)}
                                        placeholder="مثلاً: x5(1404)"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نام مشتری / خریدار <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={e => {
                                            setCustomerName(e.target.value);
                                            setBuyerName(e.target.value);
                                            setNameQuery(e.target.value);
                                        }}
                                        placeholder="مثلاً: هدیه توکلی"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                        required
                                    />
                                    {customerSuggestions.length > 0 && (
                                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden text-xs">
                                            {customerSuggestions.map(u => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setCustomerName(u.FullName || '');
                                                        setBuyerName(u.FullName || '');
                                                        setCustomerPhone(u.Number || '');
                                                        if (u.CarModel) setCarModel(u.CarModel);
                                                        setNameQuery('');
                                                    }}
                                                    className="w-full px-3 py-2 text-right hover:bg-emerald-50 dark:hover:bg-slate-700 flex justify-between items-center"
                                                >
                                                    <span className="font-bold">{u.FullName}</span>
                                                    <span className="font-mono text-[10px] text-slate-400">{u.Number}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">شماره تماس مشتری</label>
                                    <input
                                        type="text"
                                        value={customerPhone}
                                        onChange={e => setCustomerPhone(e.target.value)}
                                        placeholder="0917..."
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-left outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مدل خودرو <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        value={carModel}
                                        onChange={e => setCarModel(e.target.value)}
                                        placeholder="مثلاً: (1405) eagle"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 5. Financial Numbers & Policy Flags */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">مبالغ مالی و سیاست‌های معامله (ریال)</h4>
                            <div className="flex flex-wrap items-center gap-3">
                                {category === 'AZAD' && (
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isHardDeal}
                                            onChange={e => setIsHardDeal(e.target.checked)}
                                            className="rounded border-amber-400 text-amber-600"
                                        />
                                        معاملات سخت ({formatDecimalPercentLabel(settings.azadHardRate)})
                                    </label>
                                )}
                                <label className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isUnrealisticPurchasePrice}
                                        onChange={e => setIsUnrealisticPurchasePrice(e.target.checked)}
                                        className="rounded border-rose-400 text-rose-600"
                                    />
                                    Flag: عدد نرخ خرید غیرواقعی
                                </label>
                            </div>
                        </div>

                        {isUnrealisticPurchasePrice && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold">
                                    <ShieldAlert className="w-4 h-4 shrink-0" />
                                    این ردیف دارای پرچم «عدد نرخ خرید غیر واقعی است» بوده و تا تأیید مدیر در جمع نهایی لحاظ نمی‌شود.
                                </div>
                                <label className="flex items-center gap-1.5 font-black text-emerald-700 dark:text-emerald-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={managerApprovedUnrealistic}
                                        onChange={e => setManagerApprovedUnrealistic(e.target.checked)}
                                        className="rounded border-emerald-500 text-emerald-600"
                                    />
                                    تأیید مدیر (لحاظ در جمع نهایی)
                                </label>
                            </div>
                        )}

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
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tabular-nums font-bold outline-none"
                                        required
                                    />
                                </div>
                                {category === 'REGISTRATION' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">شماره قرارداد ثبت‌نام</label>
                                        <input
                                            type="text"
                                            value={contractNumber}
                                            onChange={e => setContractNumber(e.target.value)}
                                            placeholder="مثلاً: CTR-9842"
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نرخ خرید (ریال)</label>
                                    <input
                                        type="number"
                                        value={purchasePrice}
                                        onChange={e => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="مثلاً: 31700000000"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tabular-nums outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">قیمت روز / مبنا (ریال)</label>
                                    <input
                                        type="number"
                                        value={dailyPrice}
                                        onChange={e => setDailyPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="مثلاً: 34000000000"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tabular-nums outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        نرخ فروش (ریال) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={salePrice}
                                        onChange={e => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="مثلاً: 34500000000"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tabular-nums font-black outline-none"
                                        required
                                    />
                                </div>
                                {category === 'HAVALEH' && (
                                    <div className="sm:col-span-3">
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            مبلغ سبد بعدی (ریال) — صرفاً اطلاعاتی (بدون تأثیر در فرمول پورسانت)
                                        </label>
                                        <input
                                            type="number"
                                            value={nextBasketAmount}
                                            onChange={e => setNextBasketAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="مثلاً: 36500000000"
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tabular-nums outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Breakdown Card */}
                        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 space-y-3">
                            {calculatedResult.isDraftLeasing ? (
                                <div className="text-xs text-purple-800 dark:text-purple-200 font-bold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    نرخ لیزینگ هنوز تعیین/تأیید نشده است؛ این معامله به‌صورت «پیش‌نویس» ذخیره شده و در جمع قطعی منظور نمی‌شود.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <span className="text-[10px] text-slate-500 block">
                                            {category === 'AZAD' ? 'سود معامله:' : category === 'ANBAR' ? 'سود/زیان روز:' : category === 'HAVALEH' ? 'سود و زیان:' : 'نرخ اعمال‌شده:'}
                                        </span>
                                        <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-white">
                                            {category === 'REGISTRATION' || category === 'LEASING'
                                                ? formatDecimalPercentLabel(calculatedResult.effectiveRate)
                                                : `${calculatedResult.grossProfit.toLocaleString('fa-IR')} ریال`}
                                        </span>
                                    </div>
                                    {category === 'ANBAR' ? (
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">پورسانت قدیم + تشویقی:</span>
                                            <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-white">
                                                {calculatedResult.oldCommissionAmount.toLocaleString('fa-IR')} + {calculatedResult.incentiveBonusAmount.toLocaleString('fa-IR')}
                                            </span>
                                        </div>
                                    ) : (
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">نرخ فرمول:</span>
                                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                                                {formatDecimalPercentLabel(calculatedResult.effectiveRate)}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-[10px] text-slate-500 block">پورسانت کل معامله:</span>
                                        <span className="font-mono tabular-nums font-black text-emerald-700 dark:text-emerald-300">
                                            {effectiveCommissionAmount.toLocaleString('fa-IR')} ریال
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 block">سهم هر نفر (۱۰٪: {effectiveTenPercent.toLocaleString('fa-IR')}):</span>
                                        <span className="font-mono tabular-nums font-black text-indigo-700 dark:text-indigo-300">
                                            {effectivePerPerson.toLocaleString('fa-IR')} ریال
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/40">
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
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                                        isManualCommission
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    {isManualCommission ? 'تغییر دستی فعال است' : 'تغییر دستی پورسانت'}
                                </button>
                                <span className="text-xs font-mono tabular-nums font-black text-emerald-700 dark:text-emerald-300">
                                    نهایی: {effectiveCommissionAmount.toLocaleString('fa-IR')} ریال
                                </span>
                            </div>

                            {isManualCommission && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                                        <span className="flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                            مبلغ دستی پورسانت کل معامله
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
                                            بازگشت به فرمول
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            value={manualCommissionAmount}
                                            onChange={e => setManualCommissionAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="مبلغ به ریال"
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 rounded-lg text-xs font-mono font-bold"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={manualCommissionReason}
                                            onChange={e => setManualCommissionReason(e.target.value)}
                                            placeholder="علت تغییر دستی"
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 rounded-lg text-xs"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 6. Payment Details */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">وضعیت واریز</label>
                                <select
                                    value={paymentStatus}
                                    onChange={e => setPaymentStatus(e.target.value as CommissionPaymentStatus)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                >
                                    <option value="PAID">واریز شد (تسویه کامل)</option>
                                    <option value="PARTIAL">علی‌الحساب</option>
                                    <option value="PENDING">در انتظار واریز</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">سهم پرداختی (ریال)</label>
                                <input
                                    type="number"
                                    value={paidCommissionShare}
                                    onChange={e => setPaidCommissionShare(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder={String(effectivePerPerson)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tabular-nums outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">توضیحات</label>
                                <input
                                    type="text"
                                    value={paymentNotes}
                                    onChange={e => setPaymentNotes(e.target.value)}
                                    placeholder="یادداشت یا شماره پیگیری"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
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
                            disabled={!dateValidation.isValid}
                            className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
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
