import React, { useMemo, useState } from 'react';
import type { MyProfile } from '../types';
import type { DocumentPaperSize } from '../types/bankLetter';
import type { LeasingCase, LeasingFormId } from '../types/leasing';
import {
    LEASING_FORMS_LIST,
    createDefaultLeasingCase,
    deleteLeasingCase,
    formatLeasingFormText,
    getPersonFullName,
    getSavedLeasingCases,
    saveOrUpdateLeasingCase
} from '../services/leasingService';
import { buildLeasingHtmlDocument } from '../services/leasingHtmlPrintBuilder';
import { printHtmlString } from '../services/documentPrintService';
import { toPersianDigits, formatCurrencyWithCommas } from '../services/bankLetterValidation';
import { LeasingCaseEditor } from '../components/leasing/LeasingCaseEditor';
import { LeasingPrintPreviewModal } from '../components/leasing/LeasingPrintPreviewModal';
import {
    FileSpreadsheet,
    Printer,
    Eye,
    Save,
    RotateCcw,
    Archive,
    Layers,
    Copy,
    Check,
    Trash2,
    FolderOpen,
    Search,
    Sparkles
} from 'lucide-react';

interface LeasingPageProps {
    isAdmin?: boolean;
    loggedInUser?: MyProfile | null;
}

const LeasingPage: React.FC<LeasingPageProps> = () => {
    const [leasingCase, setLeasingCase] = useState<LeasingCase>(() => createDefaultLeasingCase());
    const [activeForm, setActiveForm] = useState<LeasingFormId>('PRE_REGISTRATION');
    const [paperSize, setPaperSize] = useState<DocumentPaperSize>('A4');
    const [viewMode, setViewMode] = useState<'workspace' | 'archive'>('workspace');
    const [savedCases, setSavedCases] = useState<LeasingCase[]>(() => getSavedLeasingCases());
    const [archiveSearch, setArchiveSearch] = useState('');

    // Modal state for full HTML+CSS print preview (single or batch)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewInitialForms, setPreviewInitialForms] = useState<LeasingFormId[]>(['PRE_REGISTRATION']);

    const [copiedText, setCopiedText] = useState(false);
    const [saveToast, setSaveToast] = useState<string | null>(null);
    const [isDirectPrinting, setIsDirectPrinting] = useState(false);

    const activeFormMeta = useMemo(
        () => LEASING_FORMS_LIST.find((f) => f.id === activeForm) || LEASING_FORMS_LIST[0],
        [activeForm]
    );

    const livePreviewHtml = useMemo(() => {
        const html = buildLeasingHtmlDocument(leasingCase, [activeForm], {
            paperSize,
            showWatermark: true,
            forStandaloneDownload: false
        });
        return html.replace(
            '</style>',
            `@media screen { body { padding: 14px 8px; } .form-sheet { zoom: 0.86; margin-bottom: 12px; } }\n</style>`
        );
    }, [leasingCase, activeForm, paperSize]);

    const showToast = (msg: string) => {
        setSaveToast(msg);
        setTimeout(() => setSaveToast(null), 2600);
    };

    const handleSaveDossier = () => {
        const updated = saveOrUpdateLeasingCase(leasingCase);
        setSavedCases(updated);
        showToast('پرونده با موفقیت در بایگانی لیزینگ ذخیره شد.');
    };

    const handleNewDossier = () => {
        setLeasingCase(createDefaultLeasingCase());
        showToast('پرونده جدید آماده ثبت اطلاعات شد.');
    };

    const handleCopyFormText = async () => {
        try {
            const txt = formatLeasingFormText(leasingCase, activeForm);
            await navigator.clipboard.writeText(txt);
            setCopiedText(true);
            setTimeout(() => setCopiedText(false), 2000);
        } catch {
            // Ignore clipboard errors gracefully
        }
    };

    const handleDirectPrintSingle = async () => {
        try {
            setIsDirectPrinting(true);
            const html = buildLeasingHtmlDocument(leasingCase, [activeForm], {
                paperSize,
                showWatermark: true,
                forStandaloneDownload: false
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
        setPreviewInitialForms(LEASING_FORMS_LIST.map((f) => f.id));
        setIsPreviewOpen(true);
    };

    const handleLoadArchiveCase = (item: LeasingCase) => {
        setLeasingCase(item);
        setViewMode('workspace');
        showToast(`پرونده ${getPersonFullName(item.buyer) || item.contractNumber} بارگذاری شد.`);
    };

    const handleDeleteArchiveCase = (id: string) => {
        const next = deleteLeasingCase(id);
        setSavedCases(next);
    };

    const filteredArchive = useMemo(() => {
        const q = archiveSearch.trim().toLowerCase();
        if (!q) return savedCases;
        return savedCases.filter((item) => {
            const name = getPersonFullName(item.buyer).toLowerCase();
            return (
                name.includes(q) ||
                item.buyer.nationalCode.includes(q) ||
                item.contractNumber.toLowerCase().includes(q) ||
                item.carModel.toLowerCase().includes(q) ||
                item.chassisNumber.toLowerCase().includes(q)
            );
        });
    }, [savedCases, archiveSearch]);

    const buyerName = getPersonFullName(leasingCase.buyer);

    return (
        <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 font-vazir" dir="rtl">
            {/* Top Header */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-slate-900 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                        <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>بخش لیزینگ (شرکت واسپاری کرمان موتور)</span>
                            <span className="px-2 py-0.5 text-[10px] rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                ۸ فرم یکپارچه
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            ورود یک‌باره اطلاعات پرونده — تکمیل خودکار پیش‌ثبت‌نام، قرارداد اقساطی، اقرارنامه، صلح‌نامه، متمم و فرم‌های احراز هویت
                        </p>
                    </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* View Switcher */}
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
                            تدوین و صدور فرم‌ها
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
                            <span>بایگانی ({toPersianDigits(savedCases.length)})</span>
                        </button>
                    </div>

                    {/* Paper Size Toggle */}
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
                        <span>چاپ دسته‌ای همه فرم‌ها</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleNewDossier}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                        title="شروع پرونده جدید"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>جدید</span>
                    </button>
                </div>
            </div>

            {saveToast && (
                <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{saveToast}</span>
                </div>
            )}

            {viewMode === 'archive' ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-sm font-black text-slate-800 dark:text-white">
                            بایگانی پرونده‌های لیزینگ ({toPersianDigits(savedCases.length)} پرونده)
                        </h2>
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={archiveSearch}
                                onChange={(e) => setArchiveSearch(e.target.value)}
                                placeholder="جستجو نام خریدار، کد ملی، قرارداد یا شاسی..."
                                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                        </div>
                    </div>

                    {filteredArchive.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs">
                            پرونده‌ای در بایگانی یافت نشد. پس از تکمیل فرم، دکمه «ذخیره پرونده» را بزنید.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredArchive.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between gap-3"
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                {getPersonFullName(item.buyer) || 'بدون نام'}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800">
                                                {item.carModel}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-300">
                                            کد ملی: <span className="font-mono">{toPersianDigits(item.buyer.nationalCode || '-')}</span>
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-300">
                                            قرارداد: <span className="font-mono">{item.contractNumber || '-'}</span> | تاریخ: {toPersianDigits(item.contractDate)}
                                        </div>
                                        {item.cashPriceRials > 0 && (
                                            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                                                ثمن معامله: {toPersianDigits(formatCurrencyWithCommas(item.cashPriceRials))} ریال
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <button
                                            type="button"
                                            onClick={() => handleLoadArchiveCase(item)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                                        >
                                            <FolderOpen className="w-3.5 h-3.5" />
                                            <span>باز کردن پرونده</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteArchiveCase(item.id)}
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
            ) : (
                <>
                    {/* 8-Form Switcher Bar */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                            {LEASING_FORMS_LIST.map((f) => {
                                const active = activeForm === f.id;
                                return (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setActiveForm(f.id)}
                                        className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                                            active
                                                ? 'bg-gradient-to-br from-sky-600 to-indigo-700 text-white border-sky-600 shadow-md shadow-sky-500/20'
                                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                                        }`}
                                    >
                                        <div className="text-xs font-black leading-snug">{f.shortTitle}</div>
                                        <div
                                            className={`text-[10px] font-bold ${
                                                active ? 'text-sky-100' : 'text-slate-400'
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
                    <LeasingCaseEditor
                        leasingCase={leasingCase}
                        onChange={setLeasingCase}
                        activeForm={activeForm}
                    />

                    {/* Live RTL HTML + CSS WYSIWYG Preview Box */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="bg-slate-900 text-white px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-xs sm:text-sm font-black flex items-center gap-2">
                                    <span>پیش‌نمایش زنده فرم انتخابی: {activeFormMeta.title}</span>
                                    {buyerName && (
                                        <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 text-[11px]">
                                            {buyerName}
                                        </span>
                                    )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                    {activeFormMeta.description}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
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

            {/* Full HTML + CSS Print Preview Modal (Single or Multi-Form Batch) */}
            <LeasingPrintPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                leasingCase={leasingCase}
                initialForms={previewInitialForms}
                paperSize={paperSize}
                onPaperSizeChange={setPaperSize}
            />
        </div>
    );
};

export default LeasingPage;
