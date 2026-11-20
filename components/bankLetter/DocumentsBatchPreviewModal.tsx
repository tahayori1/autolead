import React, { useEffect, useMemo, useState } from 'react';
import type {
    DocumentCaseFormId,
    DocumentDossier,
    DocumentPaperSize
} from '../../types/bankLetter';
import {
    DOCUMENT_FORMS_LIST,
    dossierToOfficialPayload
} from '../../services/documentDossierService';
import { buildBatchOfficialDocumentsHtml } from '../../services/officialHtmlPrintBuilder';
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

interface DocumentsBatchPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    dossier: DocumentDossier;
    initialForms: DocumentCaseFormId[];
    paperSize: DocumentPaperSize;
    onPaperSizeChange: (size: DocumentPaperSize) => void;
}

export const DocumentsBatchPreviewModal: React.FC<DocumentsBatchPreviewModalProps> = ({
    isOpen,
    onClose,
    dossier,
    initialForms,
    paperSize,
    onPaperSizeChange
}) => {
    const [selectedForms, setSelectedForms] = useState<DocumentCaseFormId[]>(
        initialForms.length > 0 ? initialForms : ['PEACE_CONTRACT']
    );
    const [showWatermark, setShowWatermark] = useState(true);
    const [zoomPercent, setZoomPercent] = useState<number>(100);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedForms(initialForms.length > 0 ? initialForms : ['PEACE_CONTRACT']);
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
        const order = DOCUMENT_FORMS_LIST.map((f) => f.id);
        return order.filter((id) => selectedForms.includes(id));
    }, [selectedForms]);

    const previewHtml = useMemo(() => {
        if (!isOpen) return '';
        const forms =
            orderedSelectedForms.length > 0
                ? orderedSelectedForms
                : (['PEACE_CONTRACT'] as DocumentCaseFormId[]);
        const payloads = forms.map((id) => dossierToOfficialPayload(dossier, id));
        const base = buildBatchOfficialDocumentsHtml(payloads, {
            paperSize,
            showWatermark,
            forStandaloneDownload: false
        });
        if (zoomPercent === 100) return base;
        return base.replace(
            '</head>',
            `<style>@media screen { #paginated-pages-root, #doc-sources-vault { zoom: ${zoomPercent / 100}; } }</style>\n</head>`
        );
    }, [isOpen, dossier, orderedSelectedForms, paperSize, showWatermark, zoomPercent]);

    if (!isOpen) return null;

    const toggleForm = (id: DocumentCaseFormId) => {
        setSelectedForms((prev) => {
            if (prev.includes(id)) {
                if (prev.length === 1) return prev;
                return prev.filter((item) => item !== id);
            }
            return [...prev, id];
        });
    };

    const customerName = dossier.customerName || 'مشتری';

    const handleDirectPrint = async () => {
        try {
            setIsPrinting(true);
            const forms =
                orderedSelectedForms.length > 0
                    ? orderedSelectedForms
                    : (['PEACE_CONTRACT'] as DocumentCaseFormId[]);
            const payloads = forms.map((id) => dossierToOfficialPayload(dossier, id));
            const cleanHtml = buildBatchOfficialDocumentsHtml(payloads, {
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
        const forms =
            orderedSelectedForms.length > 0
                ? orderedSelectedForms
                : (['PEACE_CONTRACT'] as DocumentCaseFormId[]);
        const payloads = forms.map((id) => dossierToOfficialPayload(dossier, id));
        const standaloneHtml = buildBatchOfficialDocumentsHtml(payloads, {
            paperSize,
            showWatermark,
            forStandaloneDownload: true
        });
        const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Asnad_${customerName.replace(/\s+/g, '_')}_${forms.length}docs_${paperSize}.html`;
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
                        <span className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                            <Eye className="w-4 h-4" />
                        </span>
                        <div>
                            <h3 className="text-sm font-black text-white leading-tight">
                                پیش‌نمایش و چاپ اسناد و قراردادها ({toPersianDigits(orderedSelectedForms.length)} سند انتخابی)
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                پرونده: {customerName} | قطع {paperSize} راست‌به‌چپ (RTL) با تکرار سربرگ و پاورقی در تمام صفحات
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
                                    paperSize === sz
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                کاغذ {sz}
                            </button>
                        ))}
                    </div>

                    <div className="hidden sm:inline-flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1 gap-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setZoomPercent((z) => Math.max(70, z - 15))}
                            className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-bold font-mono text-slate-200">{zoomPercent}%</span>
                        <button
                            type="button"
                            onClick={() => setZoomPercent((z) => Math.min(130, z + 15))}
                            className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer"
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
                                : `چاپ ${toPersianDigits(orderedSelectedForms.length)} سند (${paperSize}) / PDF`}
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
            <div className="bg-slate-900/95 border-b border-slate-800 px-4 sm:px-6 py-2 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-slate-300 font-bold">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>انتخاب اسناد برای چاپ هم‌زمان یا تکی:</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() =>
                                setSelectedForms([
                                    'PRE_CONTRACT',
                                    'BANK_LETTER',
                                    'PEACE_CONTRACT',
                                    'REMITTANCE_APPROVAL'
                                ])
                            }
                            className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/35 text-sky-200 border border-sky-500/30 font-bold cursor-pointer"
                        >
                            پکیج فروش نمایندگی (۴ سند)
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setSelectedForms(['PEACE_CONTRACT', 'REMITTANCE_APPROVAL'])
                            }
                            className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/35 text-amber-200 border border-amber-500/30 font-bold cursor-pointer"
                        >
                            پکیج تحویل (صلح + تایید حواله)
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setSelectedForms(DOCUMENT_FORMS_LIST.map((f) => f.id))
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 font-black cursor-pointer"
                        >
                            انتخاب همه ۵ سند
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {DOCUMENT_FORMS_LIST.map((f) => {
                        const active = selectedForms.includes(f.id);
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => toggleForm(f.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                                    active
                                        ? 'bg-sky-600/25 text-sky-200 border-sky-500/50'
                                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                                }`}
                            >
                                {active ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                                ) : (
                                    <Square className="w-3.5 h-3.5" />
                                )}
                                <span>{f.shortTitle}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Iframe Preview */}
            <div className="flex-1 overflow-hidden bg-slate-800/90 p-2 sm:p-4">
                <iframe
                    title="پیش‌نمایش اسناد و قراردادها"
                    srcDoc={previewHtml}
                    className="w-full h-full rounded-2xl bg-slate-200 border border-slate-700 shadow-2xl"
                />
            </div>
        </div>
    );
};
