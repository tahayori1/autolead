import React, { useEffect, useMemo, useState } from 'react';
import type { DocumentPaperSize } from '../../types/bankLetter';
import type { LeasingCase, LeasingFormId } from '../../types/leasing';
import { LEASING_FORMS_LIST, getPersonFullName } from '../../services/leasingService';
import { buildLeasingHtmlDocument } from '../../services/leasingHtmlPrintBuilder';
import { printHtmlString } from '../../services/documentPrintService';
import { toPersianDigits } from '../../services/bankLetterValidation';
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
    Layers
} from 'lucide-react';

interface LeasingPrintPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    leasingCase: LeasingCase;
    initialForms: LeasingFormId[];
    paperSize: DocumentPaperSize;
    onPaperSizeChange: (size: DocumentPaperSize) => void;
}

export const LeasingPrintPreviewModal: React.FC<LeasingPrintPreviewModalProps> = ({
    isOpen,
    onClose,
    leasingCase,
    initialForms,
    paperSize,
    onPaperSizeChange
}) => {
    const [selectedForms, setSelectedForms] = useState<LeasingFormId[]>(
        initialForms.length > 0 ? initialForms : ['PRE_REGISTRATION']
    );
    const [showWatermark, setShowWatermark] = useState(true);
    const [zoomPercent, setZoomPercent] = useState<number>(100);
    const [isPrinting, setIsPrinting] = useState(false);

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
            forStandaloneDownload: false
        });
        if (zoomPercent === 100) return base;
        return base.replace(
            '</style>',
            `@media screen { .form-sheet { zoom: ${zoomPercent / 100}; } }\n</style>`
        );
    }, [isOpen, leasingCase, orderedSelectedForms, paperSize, showWatermark, zoomPercent]);

    if (!isOpen) return null;

    const toggleForm = (id: LeasingFormId) => {
        setSelectedForms((prev) => {
            if (prev.includes(id)) {
                if (prev.length === 1) return prev; // Keep at least 1 selected
                return prev.filter((item) => item !== id);
            }
            return [...prev, id];
        });
    };

    const selectAllForms = () => {
        setSelectedForms(LEASING_FORMS_LIST.map((f) => f.id));
    };

    const buyerName = getPersonFullName(leasingCase.buyer) || 'مشتری';

    const handleDirectPrint = async () => {
        try {
            setIsPrinting(true);
            const forms = orderedSelectedForms.length > 0 ? orderedSelectedForms : (['PRE_REGISTRATION'] as LeasingFormId[]);
            const cleanHtml = buildLeasingHtmlDocument(leasingCase, forms, {
                paperSize,
                showWatermark,
                forStandaloneDownload: false
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
            forStandaloneDownload: true
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
        <div
            className="no-print fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex flex-col font-vazir"
            dir="rtl"
        >
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

                    {/* Paper Size Toggle */}
                    <div className="inline-flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 gap-1">
                        {(['A4', 'A5'] as DocumentPaperSize[]).map((sz) => (
                            <button
                                key={sz}
                                type="button"
                                onClick={() => onPaperSizeChange(sz)}
                                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                    paperSize === sz
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                کاغذ {sz}
                            </button>
                        ))}
                    </div>

                    {/* Zoom Controls */}
                    <div className="hidden sm:inline-flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1 gap-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setZoomPercent((z) => Math.max(70, z - 15))}
                            className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer"
                            title="کوچک‌نمایی"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-bold font-mono text-slate-200">{zoomPercent}%</span>
                        <button
                            type="button"
                            onClick={() => setZoomPercent((z) => Math.min(130, z + 15))}
                            className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer"
                            title="بزرگ‌نمایی"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowWatermark((w) => !w)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            showWatermark
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>واترمارک</span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleDownloadHtml}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        <span>دانلود HTML</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleDirectPrint}
                        disabled={isPrinting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
                    >
                        <Printer className="w-4 h-4" />
                        <span>
                            {isPrinting
                                ? 'در حال آماده‌سازی...'
                                : `چاپ ${toPersianDigits(orderedSelectedForms.length)} فرم (${paperSize}) / PDF`}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                        title="بستن (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Batch Multi-Form Selector Bar */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 text-slate-400 font-bold ml-2">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>انتخاب فرم‌ها برای چاپ یکجا:</span>
                </span>
                {LEASING_FORMS_LIST.map((f) => {
                    const active = selectedForms.includes(f.id);
                    return (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => toggleForm(f.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                                active
                                    ? 'bg-sky-600/25 text-sky-200 border-sky-500/50'
                                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                        >
                            {active ? <CheckSquare className="w-3.5 h-3.5 text-sky-400" /> : <Square className="w-3.5 h-3.5" />}
                            <span>{f.shortTitle}</span>
                        </button>
                    );
                })}
                <button
                    type="button"
                    onClick={selectAllForms}
                    className="mr-auto px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 font-bold cursor-pointer"
                >
                    انتخاب همه ۸ فرم
                </button>
            </div>

            {/* Iframe Preview */}
            <div className="flex-1 overflow-hidden bg-slate-800/90 p-2 sm:p-4">
                <iframe
                    title="پیش‌نمایش فرم‌های لیزینگ"
                    srcDoc={previewHtml}
                    className="w-full h-full rounded-2xl bg-slate-200 border border-slate-700 shadow-2xl"
                />
            </div>
        </div>
    );
};
