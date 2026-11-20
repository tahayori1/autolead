import React, { useEffect, useMemo, useState } from 'react';
import type {
    BankLetter,
    CarPeaceContract,
    DocumentCaseFormId,
    DocumentDossier,
    DocumentPaperSize,
    FreeBillOfSale,
    PreContractForm,
    RemittanceApprovalForm,
    SavedBankAccount
} from '../types/bankLetter';
import {
    DOCUMENT_FORMS_LIST,
    createDefaultDocumentDossier,
    deleteDocumentDossier,
    dossierToOfficialPayload,
    exportDossierFormToWord,
    formatDossierFormText,
    getSavedDocumentDossiers,
    importLegacyBankLetterToDossier,
    importLegacyFreeBillToDossier,
    importLegacyPeaceContractToDossier,
    importLegacyPreContractToDossier,
    importLegacyRemittanceToDossier,
    saveOrUpdateDocumentDossier
} from '../services/documentDossierService';
import {
    addOrUpdateBankAccount,
    deleteBankAccount,
    deleteBankLetter,
    getSavedBankAccounts,
    getSavedBankLetters
} from '../services/bankLetterService';
import {
    deletePeaceContract,
    getSavedPeaceContracts
} from '../services/peaceContractService';
import {
    deleteFreeBill,
    deletePreContract,
    deleteRemittanceApproval,
    getSavedFreeBills,
    getSavedPreContracts,
    getSavedRemittanceApprovals
} from '../services/additionalFormsService';
import { buildOfficialDocumentHtml } from '../services/officialHtmlPrintBuilder';
import type { DocumentPrintDesignSettings } from '../types/printDesign';
import { loadPrintDesign, savePrintDesign } from '../services/printDesignService';
import { printHtmlString } from '../services/documentPrintService';
import { formatCurrencyWithCommas, toPersianDigits } from '../services/bankLetterValidation';
import { DocumentDossierEditor } from '../components/bankLetter/DocumentDossierEditor';
import { DocumentsBatchPreviewModal } from '../components/bankLetter/DocumentsBatchPreviewModal';
import { SavedAccountsModal } from '../components/bankLetter/SavedAccountsModal';
import { PrintDesignPanel } from '../components/common/PrintDesignPanel';
import Toast from '../components/Toast';
import {
    Archive,
    Building2,
    Check,
    Copy,
    Eye,
    FileDown,
    FileSignature,
    FolderOpen,
    History,
    Layers,
    Loader2,
    Printer,
    RotateCcw,
    Save,
    Search,
    SlidersHorizontal,
    Trash2
} from 'lucide-react';

interface BankLetterPageProps {
    isAdmin?: boolean;
    loggedInUser?: any;
}

const BankLetterPage: React.FC<BankLetterPageProps> = () => {
    const [savedAccounts, setSavedAccounts] = useState<SavedBankAccount[]>(() => getSavedBankAccounts());
    const defaultAccount = useMemo(
        () => savedAccounts.find((a) => a.isDefault) || savedAccounts[0],
        [savedAccounts]
    );

    const [dossier, setDossier] = useState<DocumentDossier>(() =>
        createDefaultDocumentDossier(getSavedBankAccounts().find((a) => a.isDefault) || getSavedBankAccounts()[0])
    );
    const [activeForm, setActiveForm] = useState<DocumentCaseFormId>('PEACE_CONTRACT');
    const [paperSize, setPaperSize] = useState<DocumentPaperSize>('A4');
    const [viewMode, setViewMode] = useState<'workspace' | 'archive'>('workspace');

    const [savedDossiers, setSavedDossiers] = useState<DocumentDossier[]>(() => getSavedDocumentDossiers());
    const [archiveSearch, setArchiveSearch] = useState('');

    // Legacy single-doc archives (for seamless import if already saved before upgrade)
    const [legacyContracts, setLegacyContracts] = useState<CarPeaceContract[]>([]);
    const [legacyLetters, setLegacyLetters] = useState<BankLetter[]>([]);
    const [legacyPreContracts, setLegacyPreContracts] = useState<PreContractForm[]>([]);
    const [legacyRemittances, setLegacyRemittances] = useState<RemittanceApprovalForm[]>([]);
    const [legacyFreeBills, setLegacyFreeBills] = useState<FreeBillOfSale[]>([]);
    const [showLegacySection, setShowLegacySection] = useState(false);

    // Modals & UI feedback
    const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewInitialForms, setPreviewInitialForms] = useState<DocumentCaseFormId[]>(['PEACE_CONTRACT']);
    const [printDesign, setPrintDesign] = useState<DocumentPrintDesignSettings>(() =>
        loadPrintDesign('official', 'A4')
    );
    const [showDesignPanel, setShowDesignPanel] = useState(false);
    const [copiedText, setCopiedText] = useState(false);
    const [isDirectPrinting, setIsDirectPrinting] = useState(false);
    const [isExportingWord, setIsExportingWord] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const handlePrintDesignChange = (next: DocumentPrintDesignSettings) => {
        setPrintDesign(next);
        savePrintDesign('official', next);
    };

    useEffect(() => {
        setLegacyContracts(getSavedPeaceContracts());
        setLegacyLetters(getSavedBankLetters());
        setLegacyPreContracts(getSavedPreContracts());
        setLegacyRemittances(getSavedRemittanceApprovals());
        setLegacyFreeBills(getSavedFreeBills());
    }, []);

    const totalLegacyCount =
        legacyContracts.length +
        legacyLetters.length +
        legacyPreContracts.length +
        legacyRemittances.length +
        legacyFreeBills.length;

    const activeFormMeta = useMemo(
        () => DOCUMENT_FORMS_LIST.find((f) => f.id === activeForm) || DOCUMENT_FORMS_LIST[0],
        [activeForm]
    );

    const livePreviewHtml = useMemo(() => {
        const payload = dossierToOfficialPayload(dossier, activeForm);
        const html = buildOfficialDocumentHtml(payload, {
            paperSize,
            showWatermark: true,
            forStandaloneDownload: false,
            design: printDesign
        });
        return html.replace(
            '</head>',
            `<style>@media screen { body { padding: 14px 8px; } #paginated-pages-root, #doc-sources-vault { zoom: 0.88; } .sheet-page, .doc-source-unit { margin-bottom: 12px; } }</style>\n</head>`
        );
    }, [dossier, activeForm, paperSize, printDesign]);

    const handleSaveDossier = () => {
        if (!dossier.customerName.trim()) {
            setToast({ message: 'لطفاً نام و نام خانوادگی مشتری / خریدار را وارد نمایید.', type: 'error' });
            return;
        }
        const nextList = saveOrUpdateDocumentDossier({ ...dossier, status: 'COMPLETED' });
        setSavedDossiers(nextList);
        setToast({
            message: `پرونده اسناد برای «${dossier.customerName}» با موفقیت در بایگانی ذخیره شد.`,
            type: 'success'
        });
    };

    const handleNewDossier = () => {
        setDossier(createDefaultDocumentDossier(defaultAccount));
        setToast({ message: 'پرونده جدید آماده ورود یک‌باره اطلاعات شد.', type: 'info' });
    };

    const handleCopyFormText = async () => {
        try {
            const txt = formatDossierFormText(dossier, activeForm);
            await navigator.clipboard.writeText(txt);
            setCopiedText(true);
            setTimeout(() => setCopiedText(false), 2200);
            setToast({ message: `متن ${activeFormMeta.title} کپی شد.`, type: 'success' });
        } catch {
            setToast({ message: 'خطا در کپی متن به حافظه', type: 'error' });
        }
    };

    const handleExportWord = async () => {
        try {
            setIsExportingWord(true);
            await exportDossierFormToWord(dossier, activeForm, paperSize);
            setToast({ message: `فایل Word (${paperSize}) ${activeFormMeta.title} دانلود شد.`, type: 'success' });
        } catch (err) {
            console.error('Word export error:', err);
            setToast({ message: 'خطا در ایجاد فایل Word', type: 'error' });
        } finally {
            setIsExportingWord(false);
        }
    };

    const handleDirectPrintSingle = async () => {
        try {
            setIsDirectPrinting(true);
            const payload = dossierToOfficialPayload(dossier, activeForm);
            const html = buildOfficialDocumentHtml(payload, {
                paperSize,
                showWatermark: true,
                forStandaloneDownload: false,
                design: printDesign
            });
            await printHtmlString(html);
        } finally {
            setIsDirectPrinting(false);
        }
    };

    const openSinglePreview = () => {
        setPreviewInitialForms([activeForm]);
        setIsPreviewOpen(true);
    };

    const openBatchPreview = () => {
        setPreviewInitialForms(DOCUMENT_FORMS_LIST.map((f) => f.id));
        setIsPreviewOpen(true);
    };

    const handleLoadArchiveDossier = (item: DocumentDossier) => {
        setDossier(item);
        setViewMode('workspace');
        setToast({
            message: `پرونده ${item.customerName || item.dossierNumber} بارگذاری شد.`,
            type: 'info'
        });
    };

    const handleDeleteArchiveDossier = (id: string) => {
        if (window.confirm('آیا از حذف این پرونده از بایگانی اطمینان دارید؟')) {
            setSavedDossiers(deleteDocumentDossier(id));
            setToast({ message: 'پرونده از بایگانی حذف شد.', type: 'info' });
        }
    };

    const handleSaveAccount = (acc: Omit<SavedBankAccount, 'id'> & { id?: string }) => {
        const updated = addOrUpdateBankAccount(acc);
        setSavedAccounts(updated);
        setToast({ message: 'حساب بانکی با موفقیت ذخیره شد.', type: 'success' });
    };

    const handleDeleteAccount = (id: string) => {
        setSavedAccounts(deleteBankAccount(id));
        setToast({ message: 'حساب بانکی حذف شد.', type: 'info' });
    };

    const filteredDossiers = useMemo(() => {
        const q = archiveSearch.trim().toLowerCase();
        if (!q) return savedDossiers;
        return savedDossiers.filter(
            (d) =>
                d.customerName.toLowerCase().includes(q) ||
                d.customerNationalCode.includes(q) ||
                d.dossierNumber.toLowerCase().includes(q) ||
                d.carModel.toLowerCase().includes(q) ||
                d.chassisNumber.toLowerCase().includes(q)
        );
    }, [savedDossiers, archiveSearch]);

    return (
        <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 font-vazir pb-24" dir="rtl">
            {/* Top Header */}
            <div className="no-print bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-blue-700 text-white flex items-center justify-center shadow-md">
                        <FileSignature className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                            <span>اسناد و قراردادها</span>
                            <span className="px-2.5 py-0.5 text-[10.5px] rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                ۵ سند یکپارچه — ورود یک‌باره بدون تکرار
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            قرارداد صلح، نامه بانک، فرم پیش قرارداد، تایید نهایی حواله و قولنامه آزاد — همراه با تکرار خودکار سربرگ و پاورقی در تمام صفحات چاپ A4 / A5
                        </p>
                    </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setViewMode('workspace')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                viewMode === 'workspace'
                                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-white shadow-xs'
                                    : 'text-slate-500'
                            }`}
                        >
                            تدوین و صدور اسناد
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('archive')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                viewMode === 'archive'
                                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-white shadow-xs'
                                    : 'text-slate-500'
                            }`}
                        >
                            <Archive className="w-3.5 h-3.5" />
                            <span>بایگانی ({toPersianDigits(savedDossiers.length)})</span>
                        </button>
                    </div>

                    <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        {(['A4', 'A5'] as DocumentPaperSize[]).map((sz) => (
                            <button
                                key={sz}
                                type="button"
                                onClick={() => setPaperSize(sz)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                    paperSize === sz
                                        ? 'bg-sky-600 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {sz}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsAccountsModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold cursor-pointer"
                    >
                        <Building2 className="w-4 h-4" />
                        <span>حساب‌های شرکتی ({toPersianDigits(savedAccounts.length)})</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveDossier}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        <span>ذخیره پرونده</span>
                    </button>

                    <button
                        type="button"
                        onClick={openBatchPreview}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-xs cursor-pointer"
                    >
                        <Layers className="w-4 h-4" />
                        <span>چاپ دسته‌ای چند فرم</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleNewDossier}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>جدید</span>
                    </button>
                </div>
            </div>

            {viewMode === 'archive' ? (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-sm font-black text-slate-800 dark:text-white">
                                بایگانی پرونده‌های اسناد و قراردادها ({toPersianDigits(savedDossiers.length)} پرونده)
                            </h2>
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={archiveSearch}
                                    onChange={(e) => setArchiveSearch(e.target.value)}
                                    placeholder="جستجو نام مشتری، کد ملی، خودرو یا شاسی..."
                                    className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                />
                            </div>
                        </div>

                        {filteredDossiers.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-xs">
                                هنوز پرونده‌ای در بایگانی ثبت نشده است. پس از تکمیل اطلاعات، دکمه «ذخیره پرونده» را بزنید.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredDossiers.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between gap-3"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                                    {item.customerTitle} {item.customerName || 'بدون نام'}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800">
                                                    {item.carModel}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-600 dark:text-slate-300">
                                                کد ملی: <span className="font-mono">{toPersianDigits(item.customerNationalCode || '-')}</span>
                                            </div>
                                            <div className="text-xs text-slate-600 dark:text-slate-300">
                                                شماره پرونده: <span className="font-mono">{item.dossierNumber}</span> | تاریخ: {toPersianDigits(item.dossierDate)}
                                            </div>
                                            {item.totalAmountRials > 0 && (
                                                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                                                    ثمن معامله: {toPersianDigits(formatCurrencyWithCommas(item.totalAmountRials))} ریال
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <button
                                                type="button"
                                                onClick={() => handleLoadArchiveDossier(item)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                                            >
                                                <FolderOpen className="w-3.5 h-3.5" />
                                                <span>باز کردن پرونده</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteArchiveDossier(item.id)}
                                                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer"
                                                title="حذف پرونده"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Legacy Individual Archives Import Drawer */}
                    {totalLegacyCount > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200">
                                    <History className="w-4 h-4 text-amber-600" />
                                    <span>سوابق قبلی اسناد تکی ({toPersianDigits(totalLegacyCount)} سند قابل انتقال به پرونده یکپارچه)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowLegacySection((v) => !v)}
                                    className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                    {showLegacySection ? 'بستن لیست' : 'مشاهده و انتقال به پرونده یکپارچه'}
                                </button>
                            </div>

                            {showLegacySection && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                    {legacyContracts.map((c) => (
                                        <div key={c.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                                            <div>
                                                <div className="font-black text-amber-700">قرارداد صلح: {c.releaseeName || 'بدون نام'}</div>
                                                <div className="text-[11px] text-slate-500">{c.contractNumber} | {c.carModel}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDossier(importLegacyPeaceContractToDossier(c, defaultAccount));
                                                        setActiveForm('PEACE_CONTRACT');
                                                        setViewMode('workspace');
                                                        setToast({ message: 'به پرونده یکپارچه منتقل شد.', type: 'success' });
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-bold cursor-pointer"
                                                >
                                                    انتقال
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLegacyContracts(deletePeaceContract(c.id))}
                                                    className="p-1 text-rose-500 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {legacyLetters.map((l) => (
                                        <div key={l.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                                            <div>
                                                <div className="font-black text-blue-700">نامه بانک: {l.customerName || 'بدون نام'}</div>
                                                <div className="text-[11px] text-slate-500">{l.letterNumber} | {l.carModel}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDossier(importLegacyBankLetterToDossier(l, defaultAccount));
                                                        setActiveForm('BANK_LETTER');
                                                        setViewMode('workspace');
                                                        setToast({ message: 'به پرونده یکپارچه منتقل شد.', type: 'success' });
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-bold cursor-pointer"
                                                >
                                                    انتقال
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLegacyLetters(deleteBankLetter(l.id))}
                                                    className="p-1 text-rose-500 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {legacyPreContracts.map((p) => (
                                        <div key={p.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                                            <div>
                                                <div className="font-black text-violet-700">پیش قرارداد: {p.buyerName || 'بدون نام'}</div>
                                                <div className="text-[11px] text-slate-500">{p.contractNumber} | {p.carModel}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDossier(importLegacyPreContractToDossier(p, defaultAccount));
                                                        setActiveForm('PRE_CONTRACT');
                                                        setViewMode('workspace');
                                                        setToast({ message: 'به پرونده یکپارچه منتقل شد.', type: 'success' });
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-bold cursor-pointer"
                                                >
                                                    انتقال
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLegacyPreContracts(deletePreContract(p.id))}
                                                    className="p-1 text-rose-500 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {legacyRemittances.map((r) => (
                                        <div key={r.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                                            <div>
                                                <div className="font-black text-emerald-700">تایید حواله: {r.customerName || 'بدون نام'}</div>
                                                <div className="text-[11px] text-slate-500">{r.formNumber} | {r.carModel}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDossier(importLegacyRemittanceToDossier(r, defaultAccount));
                                                        setActiveForm('REMITTANCE_APPROVAL');
                                                        setViewMode('workspace');
                                                        setToast({ message: 'به پرونده یکپارچه منتقل شد.', type: 'success' });
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-bold cursor-pointer"
                                                >
                                                    انتقال
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLegacyRemittances(deleteRemittanceApproval(r.id))}
                                                    className="p-1 text-rose-500 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {legacyFreeBills.map((f) => (
                                        <div key={f.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                                            <div>
                                                <div className="font-black text-teal-700">قولنامه آزاد: {f.buyerName || f.sellerName || 'بدون نام'}</div>
                                                <div className="text-[11px] text-slate-500">{f.contractNumber} | {f.carModel}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDossier(importLegacyFreeBillToDossier(f, defaultAccount));
                                                        setActiveForm('FREE_BILL_OF_SALE');
                                                        setViewMode('workspace');
                                                        setToast({ message: 'به پرونده یکپارچه منتقل شد.', type: 'success' });
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-bold cursor-pointer"
                                                >
                                                    انتقال
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLegacyFreeBills(deleteFreeBill(f.id))}
                                                    className="p-1 text-rose-500 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* 5-Document Quick Switcher Bar */}
                    <div className="no-print bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {DOCUMENT_FORMS_LIST.map((f) => {
                                const active = activeForm === f.id;
                                return (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setActiveForm(f.id)}
                                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                                            active
                                                ? `bg-gradient-to-br ${f.accentClass} text-white border-transparent shadow-md`
                                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                                        }`}
                                    >
                                        <div className="text-xs font-black leading-snug">{f.shortTitle}</div>
                                        <div
                                            className={`text-[10px] font-bold ${
                                                active ? 'text-white/85' : 'text-slate-400'
                                            }`}
                                        >
                                            {f.badge}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Unified Single-Entry Editor */}
                    <DocumentDossierEditor
                        dossier={dossier}
                        onChange={setDossier}
                        activeForm={activeForm}
                        savedAccounts={savedAccounts}
                        onOpenAccountsModal={() => setIsAccountsModalOpen(true)}
                    />

                    {/* Live RTL HTML + CSS WYSIWYG Preview Box */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="bg-slate-900 text-white px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-xs sm:text-sm font-black flex flex-wrap items-center gap-2">
                                    <span>پیش‌نمایش زنده سند: {activeFormMeta.title}</span>
                                    {dossier.customerName && (
                                        <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 text-[11px]">
                                            {dossier.customerTitle} {dossier.customerName}
                                        </span>
                                    )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                    {activeFormMeta.description} • تکرار خودکار سربرگ و پاورقی در تمام صفحات هنگام چاپ
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDesignPanel((s) => !s)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                        showDesignPanel
                                            ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                                            : 'bg-slate-800 hover:bg-slate-700 text-sky-200 border-slate-700'
                                    }`}
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    <span>فونت، هدر و فوتر</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCopyFormText}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer"
                                >
                                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedText ? 'کپی شد' : 'کپی متن'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleExportWord}
                                    disabled={isExportingWord}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 text-xs font-bold cursor-pointer disabled:opacity-60"
                                >
                                    {isExportingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                                    <span>Word ({paperSize})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={openSinglePreview}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black cursor-pointer"
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>پیش‌نمایش کامل / انتخاب فرم‌ها</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDirectPrintSingle}
                                    disabled={isDirectPrinting}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer disabled:opacity-60"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>{isDirectPrinting ? 'در حال چاپ...' : `چاپ همین فرم (${paperSize})`}</span>
                                </button>
                            </div>
                        </div>

                        {showDesignPanel && (
                            <PrintDesignPanel
                                variant="official"
                                paperSize={paperSize}
                                value={printDesign}
                                onChange={handlePrintDesignChange}
                                onClose={() => setShowDesignPanel(false)}
                            />
                        )}

                        <div className="bg-slate-200 dark:bg-slate-950 p-2 sm:p-4">
                            <iframe
                                title={`پیش‌نمایش ${activeFormMeta.title}`}
                                srcDoc={livePreviewHtml}
                                className="w-full h-[680px] sm:h-[820px] rounded-2xl bg-slate-200 border border-slate-300 dark:border-slate-800 shadow-inner"
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Modals */}
            <DocumentsBatchPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                dossier={dossier}
                initialForms={previewInitialForms}
                paperSize={paperSize}
                onPaperSizeChange={setPaperSize}
                design={printDesign}
                onDesignChange={handlePrintDesignChange}
            />

            <SavedAccountsModal
                isOpen={isAccountsModalOpen}
                onClose={() => setIsAccountsModalOpen(false)}
                accounts={savedAccounts}
                onSaveAccount={handleSaveAccount}
                onDeleteAccount={handleDeleteAccount}
            />

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default BankLetterPage;
