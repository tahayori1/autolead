import React, { useEffect, useMemo, useState } from 'react';
import type { DocumentPaperSize } from '../../types/bankLetter';
import type { LeasingCase, LeasingFormId } from '../../types/leasing';
import type { DocumentPrintDesignSettings } from '../../types/printDesign';
import { LEASING_FORMS_LIST, getPersonFullName } from '../../services/leasingService';
import { buildLeasingHtmlDocument } from '../../services/leasingHtmlPrintBuilder';
import { loadPrintDesign, savePrintDesign } from '../../services/printDesignService';
import { printHtmlString } from '../../services/documentPrintService';
import { toPersianDigits } from '../../services/bankLetterValidation';
import { PrintDesignPanel } from '../common/PrintDesignPanel';
import {
    X,
    Printer,
    Download,
    Eye,
    Sparkles,
    ZoomIn,
    ZoomOut,
    CheckSquare,
    Square,
    Layers,
    SlidersHorizontal
} from 'lucide-react';

interface LeasingPrintPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    leasingCase: LeasingCase;
    initialForms: LeasingFormId[];
    paperSize: DocumentPaperSize;
    onPaperSizeChange: (size: DocumentPaperSize) => void;
    design?: DocumentPrintDesignSettings;
    onDesignChange?: (next: DocumentPrintDesignSettings) => void;
}

export const LeasingPrintPreviewModal: React.FC<LeasingPrintPreviewModalProps> = ({
    isOpen,
    onClose,
    leasingCase,
    initialForms,
    paperSize,
    onPaperSizeChange,
    design,
    onDesignChange
}) => {
    const [selectedForms, setSelectedForms] = useState<LeasingFormId[]>(
        initialForms.length > 0 ? initialForms : ['PRE_REGISTRATION']
    );
    const [showWatermark, setShowWatermark] = useState(true);
    const [zoomPercent, setZoomPercent] = useState<number>(100);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showDesignPanel, setShowDesignPanel] = useState(false);
    const [localDesign, setLocalDesign] = useState<DocumentPrintDesignSettings>(() =>
        loadPrintDesign('leasing', paperSize)
    );

    const activeDesign = design || localDesign;
    const handleDesignChange = (next: DocumentPrintDesignSettings) => {
        savePrintDesign('leasing', next);
        if (onDesignChange) {
            onDesignChange(next);
        } else {
            setLocalDesign(next);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setSelectedForms(initialForms.length > 0 ? initialForms : ['PRE_REGISTRATION']);
        }
    }, [isOpen, initialForms]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    const orderedSelectedForms = useMemo(() => {
        const order = LEASING_FORMS_LIST.map((f) => f.id);
        return order.filter((id) => selectedForms.includes(id));
    }, [selectedForms]);

    const previewHtml = useMemo(() => {
        if (!isOpen) return '';
        const forms = orderedSelectedForms.length > 0 ? orderedSelectedForms : (['PRE_REGISTRATION'] as LeasingFormId[]);
        const base = buildLeasingHtmlDocument(leasingCase, forms, {
            paperSize,
            showWatermark,
            forStandaloneDownload: false,
            design: activeDesign
        });
        if (zoomPercent === 100) return base;
        return base.replace(
            '</head>',
            `<style>@media screen { #paginated-pages-root, #doc-sources-vault { zoom: ${zoomPercent / 100}; } }</style>\n</head>`
        );
    }, [isOpen, leasingCase, orderedSelectedForms, paperSize, showWatermark, zoomPercent, activeDesign]);

    if (!isOpen) return null;

    const toggleForm = (id: LeasingFormId) => {
        setSelectedForms((prev) => {
            if (prev.includes(id)) {
                if (prev.length === 1) return prev;
                return prev.filter((item) => item !== id);
            }
            return [...prev, id];
        });
    };

    const buyerName = getPersonFullName(leasingCase.buyer) || 'مشتری';

    const handleDirectPrint = async () => {
        try {
            setIsPrinting(true);
            const forms = orderedSelectedForms.length > 0 ? orderedSelectedForms : (['PRE_REGISTRATION'] as LeasingFormId[]);
            const cleanHtml = buildLeasingHtmlDocument(leasingCase, forms, {
                paperSize,
                showWatermark,
                forStandaloneDownload: false,
                design: activeDesign
            });
            await printHtmlString(cleanHtml);
        } finally {
            setIsPrinting(false);
        }
    };

    const handleDownloadHtml = () => {
        const forms = orderedSelectedForms.length > 0 ? orderedSelectedForms : (['PRE_REGISTRATION'] as LeasingFormId[]);
        const standaloneHtml = buildLeasingHtmlDocument(leasingCase, forms, {
            paperSize,
            showWatermark,
            forStandaloneDownload: true,
            design: activeDesign
        });
        const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Leasing_${buyerName.replace(/\s+/g, '_')}_${forms.length}forms_${paperSize}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    return (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex flex-col font-vazir" dir="rtl">
            {/* Top Controls */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-white shadow-lg">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                            <Eye className="w-4 h-4" />
                        </span>
                        <div>
                            <h3 className="text-sm font-black text-white leading-tight">
                                پیش‌نمایش و چاپ فرم‌های لیزینگ ({toPersianDigits(orderedSelectedForms.length)} فرم انتخابی)
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                پرونده: {buyerName} | قرارداد: {leasingCase.contractNumber || 'ثبت نشده'} | قطع {paperSize} راست‌به‌چپ (RTL)
                            </p>
                        </div>
                    </div>

                    <div className="inline-flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 gap-1">
                        {(['A4', 'A5'] as DocumentPaperSize[]).map((sz) => (
                            <button
                                key={sz}
                                type="button"
                                onClick={() => onPaperSizeChange(sz)}
                                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                    paperSize === sz ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                کاغذ {sz}
                            </button>
                        ))}
                    </div>

                    <div className="hidden sm:inline-flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1 gap-1 text-xs">
                        <button type="button" onClick={() => setZoomPercent((z) => Math.max(70, z - 15))} className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer"><ZoomOut className="w-3.5 h-3.5" /></button>
                        <span className="px-2 font-bold font-mono text-slate-200">{zoomPercent}%</span>
                        <button type="button" onClick={() => setZoomPercent((z) => Math.min(130, z + 15))} className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer"><ZoomIn className="w-3.5 h-3.5" /></button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowWatermark((w) => !w)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            showWatermark ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>واترمارک</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowDesignPanel((s) => !s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            showDesignPanel
                                ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                        }`}
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>فونت، هدر و فوتر</span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={handleDownloadHtml} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
                        <Download className="w-4 h-4" />
                        <span>دانلود HTML</span>
                    </button>

                    <button type="button" onClick={handleDirectPrint} disabled={isPrinting} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60">
                        <Printer className="w-4 h-4" />
                        <span>{isPrinting ? 'در حال آماده‌سازی...' : `چاپ ${toPersianDigits(orderedSelectedForms.length)} فرم (${paperSize}) / PDF`}</span>
                    </button>

                    <button type="button" onClick={onClose} className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer" title="بستن (Esc)">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {showDesignPanel && (
                <div className="max-h-[42vh] overflow-y-auto">
                    <PrintDesignPanel
                        variant="leasing"
                        paperSize={paperSize}
                        value={activeDesign}
                        onChange={handleDesignChange}
                        onClose={() => setShowDesignPanel(false)}
                        darkMode
                    />
                </div>
            )}

            {/* Batch Multi-Form Selector Bar with Quick Presets */}
            <div className="bg-slate-900/95 border-b border-slate-800 px-4 sm:px-6 py-2 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-slate-300 font-bold">
                        <Layers className="w-3.5 h-3.5 text-sky-400" />
                        <span>انتخاب فرم‌ها برای چاپ دسته‌ای (مطابق kmc-leasing.ir):</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSelectedForms(['PRE_REGISTRATION', 'INSTALLMENT_CONTRACT', 'ARTICLE_36_FORM', 'POA_PLATE_MORTGAGE', 'CUSTOMER_FINAL_INFO', 'GUARANTOR_FINAL_INFO'])}
                            className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/35 text-sky-200 border border-sky-500/30 font-bold cursor-pointer"
                        >
                            پکیج تشکیل پرونده (۶ فرم)
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedForms(['LEASING_PEACE_CONTRACT', 'PEACE_ADDENDUM', 'NATURAL_AFFIDAVIT'])}
                            className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/35 text-amber-200 border border-amber-500/30 font-bold cursor-pointer"
                        >
                            پکیج صلح و اقرارنامه (۳ فرم)
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedForms(['PLATE_CHANGE_COMMITMENT', 'PLATE_CHANGE_ADDENDUM', 'PLATE_CHECK_RETURN_REQUEST', 'PLATE_LETTER_RECEIPT', 'MORTGAGE_RELEASE_REQUEST'])}
                            className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/35 text-purple-200 border border-purple-500/30 font-bold cursor-pointer"
                        >
                            پکیج پلاک و فک رهن (۵ فرم)
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedForms(LEASING_FORMS_LIST.map((f) => f.id))}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 font-black cursor-pointer"
                        >
                            انتخاب همه ۱۶ فرم
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
                    {LEASING_FORMS_LIST.map((f) => {
                        const active = selectedForms.includes(f.id);
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => toggleForm(f.id)}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                                    active ? 'bg-sky-600/25 text-sky-200 border-sky-500/50' : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                                }`}
                            >
                                {active ? <CheckSquare className="w-3.5 h-3.5 text-sky-400" /> : <Square className="w-3.5 h-3.5" />}
                                <span>{f.shortTitle}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Iframe Preview */}
            <div className="flex-1 overflow-hidden bg-slate-800/90 p-2 sm:p-4">
                <iframe title="پیش‌نمایش فرم‌های لیزینگ" srcDoc={previewHtml} className="w-full h-full rounded-2xl bg-slate-200 border border-slate-700 shadow-2xl" />
            </div>
        </div>
    );
};
