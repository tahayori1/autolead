import React, { useEffect, useMemo, useState } from 'react';
import type {
    DocumentCaseFormId,
    DocumentDossier,
    SavedBankAccount
} from '../../types/bankLetter';
import {
    formatCurrencyWithCommas,
    getAmountDisplaySummary,
    toEnglishDigits,
    toPersianDigits,
    validateIranianMobile,
    validateIranianNationalCode,
    validateIranianPostalCode,
    validateIranianSheba
} from '../../services/bankLetterValidation';
import { IranLicensePlateInput } from './IranLicensePlateInput';
import {
    User,
    Car,
    Wallet,
    Building2,
    ClipboardCheck,
    CheckCircle2,
    AlertCircle,
    Copy,
    ArrowLeftRight,
    Sparkles,
    Landmark,
    CloudUpload
} from 'lucide-react';
import { DocumentUploadsPanel } from '../common/DocumentUploadsPanel';
import { IdentityQuickAutoFillBar } from '../common/IdentityQuickAutoFillBar';
import { applyExtractedIdentityToDossier } from '../../services/documentAutoFillService';
import type { ExtractedIdentityDocumentData } from '../../types/uploads';

export type DossierEditorTab =
    | 'customer'
    | 'vehicle_meta'
    | 'finance_bank'
    | 'seller_releasor'
    | 'remittance_notes'
    | 'uploads';

interface DocumentDossierEditorProps {
    dossier: DocumentDossier;
    onChange: (updater: (prev: DocumentDossier) => DocumentDossier) => void;
    activeForm: DocumentCaseFormId;
    savedAccounts: SavedBankAccount[];
    onOpenAccountsModal: () => void;
}

const CAR_MODELS_QUICK = [
    'KMC eagle',
    'KMC J7',
    'KMC X5',
    'KMC A5',
    'KMC T8',
    'KMC T9',
    'KMC SR3',
    'BAC X3 pro',
    'JAC J4',
    'JAC S3'
];

const COLORS_QUICK = ['سفید', 'مشکی', 'خاکستری', 'سرمه‌ای', 'نوک مدادی', 'نقره‌ای'];

const PAYMENT_METHODS = [
    'بصورت حواله ساتنا',
    'بصورت حواله پایا',
    'بصورت چک رمزدار بانکی',
    'بصورت واریز نقدی'
];

const DESTINATION_BANKS_QUICK = [
    'بانک رفاه کارگران',
    'بانک ملی ایران',
    'بانک ملت',
    'بانک صادرات',
    'بانک تجارت',
    'بانک سپه',
    'بانک سینا',
    'بانک سامان'
];

const inputCls =
    'w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all';
const labelCls = 'block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1';

export const DocumentDossierEditor: React.FC<DocumentDossierEditorProps> = ({
    dossier,
    onChange,
    activeForm,
    savedAccounts,
    onOpenAccountsModal
}) => {
    const [activeTab, setActiveTab] = useState<DossierEditorTab>('customer');
    const [showAllFields, setShowAllFields] = useState<boolean>(false);
    const [uploadAutoFillTarget, setUploadAutoFillTarget] = useState<'customer' | 'seller'>('customer');

    const handleApplyExtracted = (
        extracted: ExtractedIdentityDocumentData,
        target: 'customer' | 'seller'
    ): string[] => {
        const result = applyExtractedIdentityToDossier(dossier, extracted, target);
        onChange((prev) => applyExtractedIdentityToDossier(prev, extracted, target).next);
        return result.filledFields;
    };

    const update = <K extends keyof DocumentDossier>(key: K, val: DocumentDossier[K]) => {
        onChange((prev) => ({ ...prev, [key]: val }));
    };

    const parseAmountInput = (raw: string): number => {
        const clean = toEnglishDigits(raw).replace(/\D/g, '');
        return parseInt(clean, 10) || 0;
    };

    const ncCheck = dossier.customerNationalCode
        ? validateIranianNationalCode(dossier.customerNationalCode)
        : null;
    const postalCheck = dossier.customerPostalCode
        ? validateIranianPostalCode(dossier.customerPostalCode)
        : null;
    const mobileCheck = dossier.customerPhone
        ? validateIranianMobile(dossier.customerPhone)
        : null;
    const custShebaCheck = dossier.customerShebaNumber
        ? validateIranianSheba(dossier.customerShebaNumber)
        : null;
    const benShebaCheck = dossier.beneficiaryShebaNumber
        ? validateIranianSheba(dossier.beneficiaryShebaNumber)
        : null;
    const sellerNcCheck = dossier.sellerNationalCode
        ? validateIranianNationalCode(dossier.sellerNationalCode)
        : null;

    const totalSummary = getAmountDisplaySummary(dossier.totalAmountRials);
    const paidSummary = getAmountDisplaySummary(dossier.paidAmountRials);
    const effectiveBankAmount =
        dossier.bankLetterAmountRials > 0
            ? dossier.bankLetterAmountRials
            : dossier.paidAmountRials > 0
            ? dossier.paidAmountRials
            : dossier.totalAmountRials;
    const bankAmountSummary = getAmountDisplaySummary(effectiveBankAmount);
    const remainingRials = Math.max(0, (dossier.totalAmountRials || 0) - (dossier.paidAmountRials || 0));

    const handleSelectSavedAccount = (acc: SavedBankAccount) => {
        onChange((prev) => ({
            ...prev,
            beneficiaryShebaNumber: acc.shebaNumber,
            beneficiaryBankName: acc.bankName,
            beneficiaryAccountHolderName: acc.accountHolderName,
            beneficiaryAccountHolderType: acc.accountType,
            letterType: acc.accountType === 'COMPANY' ? 'CORPORATE' : 'PERSONAL'
        }));
    };

    const handleFillAgencyAsSeller = () => {
        onChange((prev) => ({
            ...prev,
            sellerTitle: 'خانم',
            sellerName: 'شرکت تضامنی حسینی خودرو شیراز (به نمایندگی خانم حسینی)',
            sellerFatherName: '',
            sellerIdNumber: prev.releasorNationalId || '14012274787',
            sellerIssuePlace: 'شیراز',
            sellerNationalCode: prev.releasorNationalId || '14012274787',
            sellerAddress: prev.releasorAddress || 'شیراز، چهارراه بنفشه، روبروی کوچه ۱۸ استقلال',
            sellerPostalCode: prev.releasorPostalCode || '7173714734',
            sellerPhone: prev.releasorPhone || '07191690906'
        }));
    };

    const handleSwapSellerAndBuyer = () => {
        onChange((prev) => ({
            ...prev,
            sellerTitle: prev.customerTitle,
            sellerName: prev.customerName,
            sellerFatherName: prev.customerFatherName,
            sellerIdNumber: prev.customerIdNumber,
            sellerIssuePlace: prev.customerIssuePlace,
            sellerNationalCode: prev.customerNationalCode,
            sellerAddress: prev.customerAddress,
            sellerPostalCode: prev.customerPostalCode,
            sellerPhone: prev.customerPhone,
            customerTitle: prev.sellerTitle,
            customerName: prev.sellerName,
            customerFatherName: prev.sellerFatherName,
            customerIdNumber: prev.sellerIdNumber,
            customerIssuePlace: prev.sellerIssuePlace,
            customerNationalCode: prev.sellerNationalCode,
            customerAddress: prev.sellerAddress,
            customerPostalCode: prev.sellerPostalCode,
            customerPhone: prev.sellerPhone
        }));
    };

    const isForm = (...forms: DocumentCaseFormId[]) => showAllFields || forms.includes(activeForm);

    const activeFormShortTitle: Record<DocumentCaseFormId, string> = {
        PEACE_CONTRACT: 'قرارداد صلح خودرو',
        BANK_LETTER: 'نامه معرفی به بانک',
        PRE_CONTRACT: 'فرم پیش‌قرارداد',
        REMITTANCE_APPROVAL: 'تایید نهایی حواله',
        FREE_BILL_OF_SALE: 'قولنامه آزاد'
    };

    const allTabs: {
        id: DossierEditorTab;
        label: string;
        icon: React.ReactNode;
        badge?: string;
        recommendedFor: DocumentCaseFormId[];
    }[] = [
        {
            id: 'customer',
            label: showAllFields
                ? 'مشتری / خریدار / متصالح'
                : activeForm === 'PEACE_CONTRACT'
                ? 'مشخصات متصالح (خریدار)'
                : activeForm === 'BANK_LETTER'
                ? 'مشخصات متقاضی (معرفی‌شده)'
                : 'مشخصات خریدار',
            icon: <User className="w-4 h-4" />,
            badge: dossier.customerName ? 'تکمیل شده' : undefined,
            recommendedFor: ['PEACE_CONTRACT', 'BANK_LETTER', 'PRE_CONTRACT', 'REMITTANCE_APPROVAL', 'FREE_BILL_OF_SALE']
        },
        {
            id: 'vehicle_meta',
            label: showAllFields
                ? 'خودرو و شماره اسناد'
                : activeForm === 'BANK_LETTER'
                ? 'خودرو و شماره نامه'
                : activeForm === 'PRE_CONTRACT'
                ? 'خودرو و شماره پیش‌قرارداد'
                : activeForm === 'REMITTANCE_APPROVAL'
                ? 'خودرو، زمان تحویل و شماره حواله'
                : 'خودرو، پلاک و شماره سند',
            icon: <Car className="w-4 h-4" />,
            badge: dossier.chassisNumber && isForm('PEACE_CONTRACT', 'FREE_BILL_OF_SALE') ? 'با شاسی' : undefined,
            recommendedFor: ['PEACE_CONTRACT', 'BANK_LETTER', 'PRE_CONTRACT', 'REMITTANCE_APPROVAL', 'FREE_BILL_OF_SALE']
        },
        {
            id: 'finance_bank',
            label: showAllFields
                ? 'مبالغ و اطلاعات بانک'
                : activeForm === 'BANK_LETTER'
                ? 'مبلغ و حساب مقصد نامه بانک'
                : activeForm === 'PEACE_CONTRACT'
                ? 'ثمن معامله و شماره پیگیری'
                : activeForm === 'PRE_CONTRACT'
                ? 'ثمن، پیش‌پرداخت و موعد الباقی'
                : activeForm === 'REMITTANCE_APPROVAL'
                ? 'مبالغ تاییدیه حواله'
                : 'مبلغ و شرح پرداخت معامله',
            icon: <Wallet className="w-4 h-4" />,
            badge:
                (activeForm === 'BANK_LETTER' ? effectiveBankAmount > 0 : dossier.totalAmountRials > 0)
                    ? 'مبلغ ثبت شده'
                    : undefined,
            recommendedFor: ['BANK_LETTER', 'PEACE_CONTRACT', 'PRE_CONTRACT', 'REMITTANCE_APPROVAL', 'FREE_BILL_OF_SALE']
        },
        {
            id: 'seller_releasor',
            label: showAllFields
                ? 'فروشنده و مصالح (قولنامه/صلح)'
                : activeForm === 'PEACE_CONTRACT'
                ? 'مشخصات مصالح (واگذارکننده)'
                : 'مشخصات فروشنده (قولنامه)',
            icon: <Building2 className="w-4 h-4" />,
            recommendedFor: ['FREE_BILL_OF_SALE', 'PEACE_CONTRACT']
        },
        {
            id: 'remittance_notes',
            label: showAllFields
                ? 'تایید حواله و توضیحات'
                : activeForm === 'REMITTANCE_APPROVAL'
                ? 'تاییدیه‌های حسابداری، فروش و مدیریت'
                : activeForm === 'PEACE_CONTRACT'
                ? 'بندهای الحاقی قرارداد'
                : 'توضیحات تکمیلی نامه',
            icon: <ClipboardCheck className="w-4 h-4" />,
            recommendedFor: ['REMITTANCE_APPROVAL', 'PEACE_CONTRACT', 'BANK_LETTER']
        },
        {
            id: 'uploads',
            label: 'مدارک هویتی و بانکی',
            icon: <CloudUpload className="w-4 h-4" />,
            recommendedFor: ['PEACE_CONTRACT', 'BANK_LETTER', 'PRE_CONTRACT', 'REMITTANCE_APPROVAL', 'FREE_BILL_OF_SALE']
        }
    ];

    const visibleTabs = useMemo(
        () => (showAllFields ? allTabs : allTabs.filter((t) => t.recommendedFor.includes(activeForm))),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [activeForm, showAllFields, dossier.customerName, dossier.chassisNumber, dossier.totalAmountRials, effectiveBankAmount]
    );

    useEffect(() => {
        if (!visibleTabs.some((t) => t.id === activeTab)) {
            setActiveTab(visibleTabs[0]?.id || 'customer');
        }
    }, [visibleTabs, activeTab]);

    useEffect(() => {
        if (!showAllFields && activeForm !== 'FREE_BILL_OF_SALE' && uploadAutoFillTarget === 'seller') {
            setUploadAutoFillTarget('customer');
        }
    }, [activeForm, showAllFields, uploadAutoFillTarget]);

    return (
        <div className="no-print bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Top Banner */}
            <div className="bg-gradient-to-l from-amber-50 via-white to-sky-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>ورود یک‌باره اطلاعات پرونده — بدون نیاز به تکرار</span>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-[10.5px]">
                        سند فعال: {activeFormShortTitle[activeForm]}
                    </span>
                    {dossier.customerName && (
                        <span className="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 text-[11px]">
                            {dossier.customerTitle} {dossier.customerName}
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
                    <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setShowAllFields(false)}
                            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                                !showAllFields
                                    ? 'bg-sky-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            فیلدهای متناسب با همین سند
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAllFields(true)}
                            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                                showAllFields
                                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            نمایش همه فیلدها
                        </button>
                    </div>
                    <span>شماره پرونده: <strong className="font-mono text-slate-800 dark:text-slate-200">{dossier.dossierNumber}</strong></span>
                    <span>تاریخ مشترک: <strong className="font-mono text-slate-800 dark:text-slate-200">{toPersianDigits(dossier.dossierDate)}</strong></span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 bg-slate-50/90 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                {visibleTabs.map((t, idx) => {
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20'
                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-sky-200 dark:border-sky-800 hover:border-sky-400'
                            }`}
                        >
                            {t.icon}
                            <span>{toPersianDigits(idx + 1)}. {t.label}</span>
                            {t.badge && (
                                <span
                                    className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-bold ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    }`}
                                >
                                    {t.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-6">
                {/* TAB 1: CUSTOMER / BUYER / RELEASEE */}
                {activeTab === 'customer' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                                    {showAllFields
                                        ? 'مشخصات مشتری / خریدار / متصالح (مشترک در هر ۵ سند)'
                                        : `مشخصات طرف اول در «${activeFormShortTitle[activeForm]}» (همگام با سایر اسناد)`}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    {showAllFields
                                        ? 'با تکمیل این بخش، اطلاعات به‌صورت خودکار در قرارداد صلح، نامه بانک، پیش‌قرارداد، تایید حواله و قولنامه آزاد پر می‌شود.'
                                        : 'فقط فیلدهای مورد نیاز این سند نمایش داده شده است و داده‌های واردشده در سایر اسناد نیز ذخیره و مشترک می‌مانند.'}
                                </p>
                            </div>
                        </div>

                        <IdentityQuickAutoFillBar
                            scopeType="DOSSIER"
                            scopeId={dossier.id}
                            roleLabel="مشتری / خریدار / متصالح"
                            nationalCode={dossier.customerNationalCode}
                            customerName={dossier.customerName}
                            phone={dossier.customerPhone}
                            onAutoFill={(extracted) => handleApplyExtracted(extracted, 'customer')}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {isForm('PEACE_CONTRACT', 'BANK_LETTER', 'PRE_CONTRACT', 'FREE_BILL_OF_SALE') && (
                                <div>
                                    <label className={labelCls}>عنوان</label>
                                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                        {(['آقای', 'خانم', 'شرکت'] as const).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => update('customerTitle', t)}
                                                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    dossier.customerTitle === t
                                                        ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-white shadow-xs'
                                                        : 'text-slate-500'
                                                }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="sm:col-span-2">
                                <label className={labelCls}>نام و نام خانوادگی</label>
                                <input
                                    type="text"
                                    value={dossier.customerName}
                                    onChange={(e) => update('customerName', e.target.value)}
                                    placeholder="مثلاً: نوش آفرین گورنگی"
                                    className={inputCls}
                                />
                            </div>

                            {isForm('PEACE_CONTRACT', 'PRE_CONTRACT', 'FREE_BILL_OF_SALE') && (
                                <div>
                                    <label className={labelCls}>نام پدر</label>
                                    <input
                                        type="text"
                                        value={dossier.customerFatherName}
                                        onChange={(e) => update('customerFatherName', e.target.value)}
                                        placeholder="مثلاً: علی"
                                        className={inputCls}
                                    />
                                </div>
                            )}

                            <div>
                                <label className={labelCls}>کد ملی (۱۰ رقمی)</label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    maxLength={10}
                                    value={dossier.customerNationalCode}
                                    onChange={(e) =>
                                        update('customerNationalCode', toEnglishDigits(e.target.value).replace(/\D/g, ''))
                                    }
                                    placeholder="2291545914"
                                    className={inputCls}
                                />
                                {ncCheck && (
                                    <div
                                        className={`mt-1 text-[10px] flex items-center gap-1 ${
                                            ncCheck.isValid ? 'text-emerald-600' : 'text-rose-500'
                                        }`}
                                    >
                                        {ncCheck.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                        <span>{ncCheck.isValid ? `کد ملی معتبر (${ncCheck.cityHint || 'ایران'})` : ncCheck.errorMessage}</span>
                                    </div>
                                )}
                            </div>

                            {isForm('PEACE_CONTRACT', 'FREE_BILL_OF_SALE') && (
                                <>
                                    <div>
                                        <label className={labelCls}>شماره شناسنامه</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.customerIdNumber}
                                            onChange={(e) => update('customerIdNumber', toEnglishDigits(e.target.value))}
                                            placeholder="شماره شناسنامه"
                                            className={inputCls}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelCls}>صادره از</label>
                                        <input
                                            type="text"
                                            value={dossier.customerIssuePlace}
                                            onChange={(e) => update('customerIssuePlace', e.target.value)}
                                            placeholder="شیراز"
                                            className={inputCls}
                                        />
                                    </div>
                                </>
                            )}

                            {isForm('PEACE_CONTRACT', 'REMITTANCE_APPROVAL', 'FREE_BILL_OF_SALE') && (
                                <div>
                                    <label className={labelCls}>شماره تماس / همراه</label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        maxLength={11}
                                        value={dossier.customerPhone}
                                        onChange={(e) =>
                                            update('customerPhone', toEnglishDigits(e.target.value).replace(/\D/g, ''))
                                        }
                                        placeholder="09170000000"
                                        className={inputCls}
                                    />
                                    {mobileCheck && (
                                        <div
                                            className={`mt-1 text-[10px] flex items-center gap-1 ${
                                                mobileCheck.isValid ? 'text-emerald-600' : 'text-rose-500'
                                            }`}
                                        >
                                            {mobileCheck.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                            <span>{mobileCheck.isValid ? `معتبر (${mobileCheck.operatorName || 'همراه'})` : mobileCheck.errorMessage}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isForm('PEACE_CONTRACT', 'FREE_BILL_OF_SALE') && (
                                <>
                                    <div>
                                        <label className={labelCls}>کد پستی (۱۰ رقمی)</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            maxLength={10}
                                            value={dossier.customerPostalCode}
                                            onChange={(e) =>
                                                update('customerPostalCode', toEnglishDigits(e.target.value).replace(/\D/g, ''))
                                            }
                                            placeholder="7100000000"
                                            className={inputCls}
                                        />
                                        {postalCheck && (
                                            <div
                                                className={`mt-1 text-[10px] flex items-center gap-1 ${
                                                    postalCheck.isValid ? 'text-emerald-600' : 'text-rose-500'
                                                }`}
                                            >
                                                {postalCheck.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                <span>{postalCheck.isValid ? `کد پستی معتبر (${postalCheck.provinceHint || ''})` : postalCheck.errorMessage}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label className={labelCls}>نشانی کامل سکونت مشتری</label>
                                        <input
                                            type="text"
                                            value={dossier.customerAddress}
                                            onChange={(e) => update('customerAddress', e.target.value)}
                                            placeholder="استان فارس، شیراز، خیابان ..."
                                            className={inputCls}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Customer Bank Account (for Peace Contract Clause 5) */}
                        {isForm('PEACE_CONTRACT') && (
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                                <h5 className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <Landmark className="w-3.5 h-3.5 text-amber-600" />
                                    <span>اطلاعات حساب بانکی مشتری (مورد استفاده در بند ۵ قرارداد صلح)</span>
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className={labelCls}>شماره شبا مشتری (۲۴ رقم بدون IR)</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            maxLength={26}
                                            value={dossier.customerShebaNumber}
                                            onChange={(e) => {
                                                const raw = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '').slice(0, 24);
                                                const res = validateIranianSheba(raw);
                                                onChange((prev) => ({
                                                    ...prev,
                                                    customerShebaNumber: raw,
                                                    customerBankName: res.bankInfo?.name || prev.customerBankName
                                                }));
                                            }}
                                            placeholder="590130100000..."
                                            className={inputCls}
                                        />
                                        {custShebaCheck && (
                                            <div
                                                className={`mt-1 text-[10px] flex items-center gap-1 ${
                                                    custShebaCheck.isValid ? 'text-emerald-600' : 'text-rose-500'
                                                }`}
                                            >
                                                {custShebaCheck.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                <span>
                                                    {custShebaCheck.isValid
                                                        ? `شبا معتبر (${custShebaCheck.bankInfo?.name || ''})`
                                                        : custShebaCheck.errorMessage}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className={labelCls}>شماره حساب مشتری</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.customerAccountNumber}
                                            onChange={(e) => update('customerAccountNumber', toEnglishDigits(e.target.value))}
                                            placeholder="شماره حساب بانکی"
                                            className={inputCls}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelCls}>نام بانک مشتری</label>
                                        <input
                                            type="text"
                                            value={dossier.customerBankName}
                                            onChange={(e) => update('customerBankName', e.target.value)}
                                            placeholder="مثلاً: بانک ملت"
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: VEHICLE & DOCUMENT META */}
                {activeTab === 'vehicle_meta' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="sm:col-span-2">
                                <label className={labelCls}>مدل / تیپ خودرو (مشترک در اسناد)</label>
                                <input
                                    type="text"
                                    value={dossier.carModel}
                                    onChange={(e) => update('carModel', e.target.value)}
                                    placeholder="مثلاً: KMC eagle"
                                    className={inputCls}
                                />
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {CAR_MODELS_QUICK.map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => update('carModel', m)}
                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                                                dossier.carModel === m
                                                    ? 'bg-sky-600 text-white border-sky-600'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isForm('PEACE_CONTRACT', 'BANK_LETTER', 'PRE_CONTRACT') && (
                                <div>
                                    <label className={labelCls}>سال مدل</label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={dossier.modelYear}
                                        onChange={(e) => update('modelYear', toEnglishDigits(e.target.value))}
                                        placeholder="1405"
                                        className={inputCls}
                                    />
                                </div>
                            )}

                            <div>
                                <label className={labelCls}>رنگ خودرو</label>
                                <input
                                    type="text"
                                    value={dossier.color}
                                    onChange={(e) => update('color', e.target.value)}
                                    placeholder="سفید"
                                    className={inputCls}
                                />
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {COLORS_QUICK.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => update('color', c)}
                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                                dossier.color === c
                                                    ? 'bg-amber-600 text-white border-amber-600'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isForm('PEACE_CONTRACT', 'FREE_BILL_OF_SALE') && (
                                <div className="sm:col-span-2">
                                    <label className={labelCls}>شماره شاسی / شماره بدنه</label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={dossier.chassisNumber}
                                        onChange={(e) => update('chassisNumber', e.target.value.toUpperCase())}
                                        placeholder="NAA..."
                                        className={`${inputCls} font-mono uppercase`}
                                    />
                                </div>
                            )}

                            {isForm('REMITTANCE_APPROVAL') && (
                                <div>
                                    <label className={labelCls}>زمان تحویل (تایید نهایی حواله)</label>
                                    <input
                                        type="text"
                                        value={dossier.deliveryTime}
                                        onChange={(e) => update('deliveryTime', e.target.value)}
                                        placeholder="مثلاً: فوری / ۱۴۰۵/۰۷/۰۱"
                                        className={inputCls}
                                    />
                                </div>
                            )}

                            <div>
                                <label className={labelCls}>تاریخ مشترک اسناد</label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    value={dossier.dossierDate}
                                    onChange={(e) => update('dossierDate', e.target.value)}
                                    placeholder="1405/06/22"
                                    className={inputCls}
                                />
                            </div>

                            {isForm('PEACE_CONTRACT', 'FREE_BILL_OF_SALE') && (
                                <div>
                                    <label className={labelCls}>ساعت معامله</label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={dossier.transactionTime}
                                        onChange={(e) => update('transactionTime', e.target.value)}
                                        placeholder="11:30"
                                        className={inputCls}
                                    />
                                </div>
                            )}

                            {isForm('FREE_BILL_OF_SALE') && (
                                <div className="sm:col-span-3">
                                    <label className={labelCls}>مدارک تحویلی خودرو (قولنامه آزاد)</label>
                                    <input
                                        type="text"
                                        value={dossier.deliveredDocuments}
                                        onChange={(e) => update('deliveredDocuments', e.target.value)}
                                        placeholder="کارت خودرو، برگ سبز، بیمه‌نامه..."
                                        className={inputCls}
                                    />
                                </div>
                            )}
                        </div>

                        {isForm('PEACE_CONTRACT', 'FREE_BILL_OF_SALE') && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className={labelCls}>شماره پلاک انتظامی / شهربانی</label>
                                <IranLicensePlateInput
                                    value={dossier.plateNumber}
                                    onChange={(formatted) => update('plateNumber', formatted)}
                                />
                            </div>
                        )}

                        {/* Individual Document Numbers */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <h5 className="text-xs font-black text-slate-700 dark:text-slate-300">
                                {showAllFields ? 'شماره‌های ثبت سند (تولید خودکار و قابل ویرایش)' : 'شماره ثبت همین سند'}
                            </h5>
                            <div className={`grid gap-2.5 ${showAllFields ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                                {isForm('PEACE_CONTRACT') && (
                                    <div>
                                        <label className={labelCls}>شماره قرارداد صلح</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.peaceContractNumber}
                                            onChange={(e) => update('peaceContractNumber', e.target.value)}
                                            className={`${inputCls} font-mono text-xs`}
                                        />
                                    </div>
                                )}
                                {isForm('BANK_LETTER') && (
                                    <div>
                                        <label className={labelCls}>شماره نامه بانک</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.bankLetterNumber}
                                            onChange={(e) => update('bankLetterNumber', e.target.value)}
                                            className={`${inputCls} font-mono text-xs`}
                                        />
                                    </div>
                                )}
                                {isForm('PRE_CONTRACT') && (
                                    <div>
                                        <label className={labelCls}>شماره پیش‌قرارداد</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.preContractNumber}
                                            onChange={(e) => update('preContractNumber', e.target.value)}
                                            className={`${inputCls} font-mono text-xs`}
                                        />
                                    </div>
                                )}
                                {isForm('REMITTANCE_APPROVAL') && (
                                    <div>
                                        <label className={labelCls}>شماره تایید حواله</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.remittanceFormNumber}
                                            onChange={(e) => update('remittanceFormNumber', e.target.value)}
                                            className={`${inputCls} font-mono text-xs`}
                                        />
                                    </div>
                                )}
                                {isForm('FREE_BILL_OF_SALE') && (
                                    <div>
                                        <label className={labelCls}>شماره قولنامه آزاد</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.freeBillNumber}
                                            onChange={(e) => update('freeBillNumber', e.target.value)}
                                            className={`${inputCls} font-mono text-xs`}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: FINANCE & BANK LETTER DETAILS */}
                {activeTab === 'finance_bank' && (
                    <div className="space-y-5">
                        {/* Shared Financial Figures */}
                        {isForm('PEACE_CONTRACT', 'PRE_CONTRACT', 'REMITTANCE_APPROVAL', 'FREE_BILL_OF_SALE') && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div>
                                    <label className={labelCls}>ثمن معامله / مبلغ کل (ریال)</label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={dossier.totalAmountRials ? formatCurrencyWithCommas(dossier.totalAmountRials) : ''}
                                        onChange={(e) => update('totalAmountRials', parseAmountInput(e.target.value))}
                                        placeholder="مثلاً: 25,000,000,000"
                                        className={`${inputCls} font-mono font-bold`}
                                    />
                                    {dossier.totalAmountRials > 0 && (
                                        <div className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                            {totalSummary.rialsInWords} ({totalSummary.tomansInWords})
                                        </div>
                                    )}
                                </div>

                                {isForm('PEACE_CONTRACT', 'PRE_CONTRACT', 'REMITTANCE_APPROVAL') && (
                                    <div>
                                        <label className={labelCls}>
                                            {activeForm === 'PRE_CONTRACT'
                                                ? 'مبلغ پیش‌پرداخت (ریال)'
                                                : activeForm === 'PEACE_CONTRACT'
                                                ? 'مبلغ واریزی فعلی (ریال)'
                                                : 'مبلغ واریزی / پیش‌پرداخت (ریال)'}
                                        </label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.paidAmountRials ? formatCurrencyWithCommas(dossier.paidAmountRials) : ''}
                                            onChange={(e) => update('paidAmountRials', parseAmountInput(e.target.value))}
                                            placeholder="مبلغ واریز یا پیش‌پرداخت"
                                            className={`${inputCls} font-mono font-bold`}
                                        />
                                        {dossier.paidAmountRials > 0 && (
                                            <div className="mt-1 text-[10px] text-sky-700 dark:text-sky-400 font-bold">
                                                {paidSummary.rialsInWords} ({paidSummary.tomansInWords})
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isForm('PRE_CONTRACT', 'REMITTANCE_APPROVAL') && (
                                    <div>
                                        <label className={labelCls}>مانده حساب (محاسبه خودکار)</label>
                                        <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm font-black font-mono text-amber-700 dark:text-amber-300 flex items-center justify-between">
                                            <span>{toPersianDigits(formatCurrencyWithCommas(remainingRials))} ریال</span>
                                            {dossier.totalAmountRials > 0 && remainingRials === 0 && (
                                                <span className="text-[10px] font-vazir text-emerald-600">تسویه کامل</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {isForm('PEACE_CONTRACT') && (
                                    <div>
                                        <label className={labelCls}>شماره پیگیری واریز (قرارداد صلح)</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.trackingNumber}
                                            onChange={(e) => update('trackingNumber', toEnglishDigits(e.target.value))}
                                            placeholder="شماره پیگیری بانکی"
                                            className={`${inputCls} font-mono`}
                                        />
                                    </div>
                                )}

                                {isForm('PRE_CONTRACT') && (
                                    <div>
                                        <label className={labelCls}>موعد پرداخت الباقی (فرم پیش‌قرارداد)</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.remainingPaymentDate}
                                            onChange={(e) => update('remainingPaymentDate', e.target.value)}
                                            placeholder="1405/07/10"
                                            className={inputCls}
                                        />
                                    </div>
                                )}

                                {isForm('FREE_BILL_OF_SALE') && (
                                    <div>
                                        <label className={labelCls}>شرح نحوه پرداخت (قولنامه آزاد)</label>
                                        <input
                                            type="text"
                                            value={dossier.totalAmountDescription}
                                            onChange={(e) => update('totalAmountDescription', e.target.value)}
                                            placeholder="مثلاً: نقدی طی حواله ساتنا..."
                                            className={inputCls}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bank Letter Section */}
                        {isForm('BANK_LETTER') && (
                            <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h5 className="text-xs sm:text-sm font-black text-blue-900 dark:text-blue-200 flex items-center gap-2">
                                        <Landmark className="w-4 h-4" />
                                        <span>اطلاعات نامه معرفی به بانک (مخاطب نامه و حساب مقصد واریز)</span>
                                    </h5>

                                    <button
                                        type="button"
                                        onClick={onOpenAccountsModal}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-bold cursor-pointer hover:bg-blue-50"
                                    >
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span>مدیریت حساب‌های شرکتی ({toPersianDigits(savedAccounts.length)})</span>
                                    </button>
                                </div>

                                {/* Quick Saved Account Picker */}
                                {savedAccounts.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 ml-1">انتخاب سریع حساب مقصد:</span>
                                        {savedAccounts.map((acc) => {
                                            const isSelected = dossier.beneficiaryShebaNumber === acc.shebaNumber;
                                            return (
                                                <button
                                                    key={acc.id}
                                                    type="button"
                                                    onClick={() => handleSelectSavedAccount(acc)}
                                                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                                    }`}
                                                >
                                                    {acc.accountHolderName} — {acc.bankName}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className={labelCls}>بانک مقصد (مخاطب نامه)</label>
                                        <input
                                            type="text"
                                            value={dossier.destinationBankName}
                                            onChange={(e) => update('destinationBankName', e.target.value)}
                                            placeholder="بانک ملی"
                                            className={inputCls}
                                        />
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {DESTINATION_BANKS_QUICK.slice(0, 4).map((b) => (
                                                <button
                                                    key={b}
                                                    type="button"
                                                    onClick={() => update('destinationBankName', b)}
                                                    className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[9.5px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                                >
                                                    {b.replace('بانک ', '')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelCls}>نام شعبه بانک</label>
                                        <input
                                            type="text"
                                            value={dossier.destinationBranchName}
                                            onChange={(e) => update('destinationBranchName', e.target.value)}
                                            placeholder="شعبه مرکزی شیراز"
                                            className={inputCls}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelCls}>روش پرداخت</label>
                                        <select
                                            value={dossier.paymentMethod}
                                            onChange={(e) => update('paymentMethod', e.target.value)}
                                            className={inputCls}
                                        >
                                            {PAYMENT_METHODS.map((pm) => (
                                                <option key={pm} value={pm}>
                                                    {pm}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className={labelCls}>مبلغ نامه بانک (ریال — خالی = خودکار)</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.bankLetterAmountRials ? formatCurrencyWithCommas(dossier.bankLetterAmountRials) : ''}
                                            onChange={(e) => update('bankLetterAmountRials', parseAmountInput(e.target.value))}
                                            placeholder={
                                                effectiveBankAmount > 0
                                                    ? `خودکار: ${formatCurrencyWithCommas(effectiveBankAmount)}`
                                                    : 'مبلغ حواله بانکی (ریال)'
                                            }
                                            className={`${inputCls} font-mono font-bold`}
                                        />
                                        {effectiveBankAmount > 0 && (
                                            <div className="mt-1 text-[10px] text-blue-700 dark:text-blue-300 font-bold">
                                                مبلغ درج‌شده در نامه: {bankAmountSummary.rialsInWords}
                                            </div>
                                        )}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className={labelCls}>شماره شبا حساب مقصد (۲۴ رقم)</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            maxLength={26}
                                            value={dossier.beneficiaryShebaNumber}
                                            onChange={(e) => {
                                                const raw = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 24);
                                                const res = validateIranianSheba(raw);
                                                onChange((prev) => ({
                                                    ...prev,
                                                    beneficiaryShebaNumber: raw,
                                                    beneficiaryBankName: res.bankInfo?.name || prev.beneficiaryBankName
                                                }));
                                            }}
                                            className={`${inputCls} font-mono`}
                                        />
                                        {benShebaCheck && (
                                            <div
                                                className={`mt-1 text-[10px] flex items-center gap-1 ${
                                                    benShebaCheck.isValid ? 'text-emerald-600' : 'text-rose-500'
                                                }`}
                                            >
                                                {benShebaCheck.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                <span>
                                                    {benShebaCheck.isValid
                                                        ? `شبا معتبر (${benShebaCheck.bankInfo?.name || ''})`
                                                        : benShebaCheck.errorMessage}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className={labelCls}>نام بانک مقصد واریز</label>
                                        <input
                                            type="text"
                                            value={dossier.beneficiaryBankName}
                                            onChange={(e) => update('beneficiaryBankName', e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelCls}>بنام (صاحب حساب مقصد)</label>
                                        <input
                                            type="text"
                                            value={dossier.beneficiaryAccountHolderName}
                                            onChange={(e) => update('beneficiaryAccountHolderName', e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: RELEASOR & FREE BILL SELLER */}
                {activeTab === 'seller_releasor' && (
                    <div className="space-y-5">
                        {/* Peace Contract Releasor */}
                        {isForm('PEACE_CONTRACT') && (
                            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/15 space-y-3">
                                <h5 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
                                    مشخصات مصالح در قرارداد صلح (پیش‌فرض نمایندگی ۲۶۰۶ حسینی خودرو شیراز)
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className={labelCls}>نام مصالح / نماینده قانونی</label>
                                        <input
                                            type="text"
                                            value={dossier.releasorName}
                                            onChange={(e) => update('releasorName', e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>شناسه ملی</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.releasorNationalId}
                                            onChange={(e) => update('releasorNationalId', toEnglishDigits(e.target.value))}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>تلفن شرکت</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.releasorPhone}
                                            onChange={(e) => update('releasorPhone', toEnglishDigits(e.target.value))}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label className={labelCls}>آدرس مصالح</label>
                                        <input
                                            type="text"
                                            value={dossier.releasorAddress}
                                            onChange={(e) => update('releasorAddress', e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>کد پستی مصالح</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.releasorPostalCode}
                                            onChange={(e) => update('releasorPostalCode', toEnglishDigits(e.target.value))}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Free Bill of Sale Seller */}
                        {isForm('FREE_BILL_OF_SALE') && (
                            <div className="p-4 rounded-2xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/25 dark:bg-teal-950/15 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h5 className="text-xs sm:text-sm font-black text-teal-900 dark:text-teal-200">
                                        مشخصات فروشنده در قولنامه آزاد
                                    </h5>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleFillAgencyAsSeller}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-[11px] font-bold cursor-pointer hover:bg-teal-50"
                                        >
                                            <Copy className="w-3 h-3" />
                                            <span>تنظیم فروشنده به نام حسینی خودرو</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSwapSellerAndBuyer}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-bold cursor-pointer"
                                        >
                                            <ArrowLeftRight className="w-3 h-3" />
                                            <span>جابجایی فروشنده و خریدار</span>
                                        </button>
                                    </div>
                                </div>

                                <IdentityQuickAutoFillBar
                                    scopeType="DOSSIER"
                                    scopeId={dossier.id}
                                    roleLabel="فروشنده (قولنامه آزاد)"
                                    nationalCode={dossier.sellerNationalCode}
                                    customerName={dossier.sellerName}
                                    phone={dossier.sellerPhone}
                                    onAutoFill={(extracted) => handleApplyExtracted(extracted, 'seller')}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className={labelCls}>عنوان فروشنده</label>
                                        <select
                                            value={dossier.sellerTitle}
                                            onChange={(e) => update('sellerTitle', e.target.value)}
                                            className={inputCls}
                                        >
                                            <option value="آقای">آقای</option>
                                            <option value="خانم">خانم</option>
                                            <option value="شرکت">شرکت</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelCls}>نام و نام خانوادگی فروشنده</label>
                                        <input
                                            type="text"
                                            value={dossier.sellerName}
                                            onChange={(e) => update('sellerName', e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>نام پدر فروشنده</label>
                                        <input
                                            type="text"
                                            value={dossier.sellerFatherName}
                                            onChange={(e) => update('sellerFatherName', e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>کد / شناسه ملی فروشنده</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.sellerNationalCode}
                                            onChange={(e) => update('sellerNationalCode', toEnglishDigits(e.target.value))}
                                            className={inputCls}
                                        />
                                        {sellerNcCheck && dossier.sellerNationalCode.length === 10 && (
                                            <div
                                                className={`mt-1 text-[10px] flex items-center gap-1 ${
                                                    sellerNcCheck.isValid ? 'text-emerald-600' : 'text-rose-500'
                                                }`}
                                            >
                                                {sellerNcCheck.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                <span>{sellerNcCheck.isValid ? 'کد ملی معتبر' : sellerNcCheck.errorMessage}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className={labelCls}>شماره شناسنامه / ثبت</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.sellerIdNumber}
                                            onChange={(e) => update('sellerIdNumber', toEnglishDigits(e.target.value))}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>صادره از</label>
                                        <input
                                            type="text"
                                            value={dossier.sellerIssuePlace}
                                            onChange={(e) => update('sellerIssuePlace', e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>شماره تماس فروشنده</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.sellerPhone}
                                            onChange={(e) => update('sellerPhone', toEnglishDigits(e.target.value))}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>کد پستی فروشنده</label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={dossier.sellerPostalCode}
                                            onChange={(e) => update('sellerPostalCode', toEnglishDigits(e.target.value))}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label className={labelCls}>نشانی کامل فروشنده</label>
                                        <input
                                            type="text"
                                            value={dossier.sellerAddress}
                                            onChange={(e) => update('sellerAddress', e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 5: REMITTANCE APPROVAL CHECKS & NOTES */}
                {activeTab === 'remittance_notes' && (
                    <div className="space-y-4">
                        {isForm('REMITTANCE_APPROVAL') && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Accounting */}
                                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
                                    <h5 className="text-xs font-black text-blue-800 dark:text-blue-300">۳. کنترل حسابداری</h5>
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={dossier.accCheckNoDebt}
                                            onChange={(e) => update('accCheckNoDebt', e.target.checked)}
                                        />
                                        <span>هیچ‌گونه بدهی و چک معوق باقی نمانده است</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={dossier.accCheckMatched}
                                            onChange={(e) => update('accCheckMatched', e.target.checked)}
                                        />
                                        <span>مبالغ واریزی با فاکتور و سیستم مالی تطبیق داده شد</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={dossier.accCheckClear}
                                            onChange={(e) => update('accCheckClear', e.target.checked)}
                                        />
                                        <span>حواله خودرو از نظر مالی بلامانع است</span>
                                    </label>
                                    <div className="pt-1 space-y-2">
                                        <div>
                                            <label className={labelCls}>نام مسئول حسابداری</label>
                                            <input
                                                type="text"
                                                value={dossier.accountingManagerName}
                                                onChange={(e) => update('accountingManagerName', e.target.value)}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>تاریخ تایید حسابداری</label>
                                            <input
                                                type="text"
                                                dir="ltr"
                                                value={dossier.accountingDate}
                                                onChange={(e) => update('accountingDate', e.target.value)}
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sales */}
                                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
                                    <h5 className="text-xs font-black text-indigo-800 dark:text-indigo-300">۴. کنترل وضعیت فروش</h5>
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={dossier.salesCheckCorrect}
                                            onChange={(e) => update('salesCheckCorrect', e.target.checked)}
                                        />
                                        <span>اطلاعات مشتری در قولنامه صحیح و بدون خط‌خوردگی است</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={dossier.salesCheckInvoice}
                                            onChange={(e) => update('salesCheckInvoice', e.target.checked)}
                                        />
                                        <span>مبلغ فاکتور، تخفیف‌ها و مانده حساب کنترل شد</span>
                                    </label>
                                    <div className="pt-1 space-y-2">
                                        <div>
                                            <label className={labelCls}>نام مسئول فروش</label>
                                            <input
                                                type="text"
                                                value={dossier.salesManagerName}
                                                onChange={(e) => update('salesManagerName', e.target.value)}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>تاریخ تایید فروش</label>
                                            <input
                                                type="text"
                                                dir="ltr"
                                                value={dossier.salesDate}
                                                onChange={(e) => update('salesDate', e.target.value)}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>توضیحات بخش فروش</label>
                                            <input
                                                type="text"
                                                value={dossier.salesNotes}
                                                onChange={(e) => update('salesNotes', e.target.value)}
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Management */}
                                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/15 space-y-2.5">
                                    <h5 className="text-xs font-black text-emerald-800 dark:text-emerald-300">۵. تایید نهایی مدیریت</h5>
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={dossier.mgmtCheckSignatures}
                                            onChange={(e) => update('mgmtCheckSignatures', e.target.checked)}
                                        />
                                        <span>تمامی امضاها کنترل گردید</span>
                                    </label>
                                    <div className="pt-1">
                                        <label className={labelCls}>مسئولیت فروش با:</label>
                                        <input
                                            type="text"
                                            value={dossier.salesResponsibilityWith}
                                            onChange={(e) => update('salesResponsibilityWith', e.target.value)}
                                            placeholder="نام مسئول فروش نهایی"
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {isForm('PEACE_CONTRACT', 'BANK_LETTER') && (
                            <div>
                                <label className={labelCls}>
                                    {activeForm === 'BANK_LETTER'
                                        ? 'توضیحات تکمیلی نامه معرفی به بانک'
                                        : 'بندهای الحاقی و توضیحات تکمیلی قرارداد صلح'}
                                </label>
                                <textarea
                                    rows={3}
                                    value={dossier.notes}
                                    onChange={(e) => update('notes', e.target.value)}
                                    placeholder="در صورت وجود شروط یا توضیحات اضافه برای چاپ در قرارداد یا نامه بانک وارد نمایید..."
                                    className={inputCls}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 6: IDENTITY & BANK CARD UPLOADS */}
                {activeTab === 'uploads' && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                تکمیل خودکار مشخصات هنگام آپلود کارت ملی یا شناسنامه اعمال شود روی:
                            </span>
                            <div className="inline-flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setUploadAutoFillTarget('customer')}
                                    className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                                        uploadAutoFillTarget === 'customer'
                                            ? 'bg-sky-600 text-white'
                                            : 'text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    مشتری / خریدار / متصالح
                                </button>
                                {isForm('FREE_BILL_OF_SALE') && (
                                    <button
                                        type="button"
                                        onClick={() => setUploadAutoFillTarget('seller')}
                                        className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                                            uploadAutoFillTarget === 'seller'
                                                ? 'bg-teal-600 text-white'
                                                : 'text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        فروشنده (قولنامه آزاد)
                                    </button>
                                )}
                            </div>
                        </div>

                        <DocumentUploadsPanel
                            scopeType="DOSSIER"
                            scopeId={dossier.id}
                            nationalCode={dossier.customerNationalCode}
                            customerName={dossier.customerName}
                            phone={dossier.customerPhone}
                            autoFillRoleLabel={
                                uploadAutoFillTarget === 'seller' ? 'فروشنده (قولنامه آزاد)' : 'مشتری / خریدار / متصالح'
                            }
                            onAutoFillFromDocument={(extracted) =>
                                handleApplyExtracted(extracted, uploadAutoFillTarget)
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
