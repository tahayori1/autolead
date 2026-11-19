import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DocumentPaperSize } from '../../types/bankLetter';
import {
    buildOfficialDocumentHtml,
    type OfficialDocPayload
} from '../../services/officialHtmlPrintBuilder';
import { printHtmlString } from '../../services/documentPrintService';
import {
    X,
    Printer,
    Download,
    Eye,
    Sparkles,
    ZoomIn,
    ZoomOut
} from 'lucide-react';

interface HtmlPrintPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    payload: OfficialDocPayload | null;
    paperSize: DocumentPaperSize;
    onPaperSizeChange: (size: DocumentPaperSize) => void;
    documentTitle?: string;
}

export const HtmlPrintPreviewModal: React.FC<HtmlPrintPreviewModalProps> = ({
    isOpen,
    onClose,
    payload,
    paperSize,
    onPaperSizeChange,
    documentTitle = 'پیش‌نمایش رسمی چاپ (HTML + CSS)'
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [showWatermark, setShowWatermark] = useState(true);
    const [zoomPercent, setZoomPercent] = useState<number>(100);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    const previewHtml = useMemo(() => {
        if (!payload) return '';
        const baseHtml = buildOfficialDocumentHtml(payload, {
            paperSize,
            showWatermark,
            forStandaloneDownload: false
        });
        if (zoomPercent === 100) return baseHtml;
        // Inject screen-only zoom so @media print always prints at exact 100% scale
        return baseHtml.replace(
            '</style>',
            `@media screen { .sheet-wrapper { zoom: ${zoomPercent / 100}; } }\n</style>`
        );
    }, [payload, paperSize, showWatermark, zoomPercent]);

    if (!isOpen || !payload) return null;

    const handleDirectPrint = async () => {
        try {
            setIsPrinting(true);
            const cleanPrintHtml = buildOfficialDocumentHtml(payload, {
                paperSize,
                showWatermark,
                forStandaloneDownload: false
            });
            await printHtmlString(cleanPrintHtml);
        } finally {
            setIsPrinting(false);
        }
    };

    const handleDownloadHtml = () => {
        const standaloneHtml = buildOfficialDocumentHtml(payload, {
            paperSize,
            showWatermark,
            forStandaloneDownload: true
        });
        const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentTitle.replace(/\s+/g, '_')}_${paperSize}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    return (
        <div
            className="no-print fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex flex-col font-vazir"
            dir="rtl"
        >
            {/* Top Control Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-white shadow-lg">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                            <Eye className="w-4 h-4" />
                        </span>
                        <div>
                            <h3 className="text-sm font-black text-white leading-tight">
                                {documentTitle}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                نسخه چاپی راست‌به‌چپ (RTL) با فونت وزیرمتن و صفحه‌بندی استاندارد {paperSize}
                            </p>
                        </div>
                    </div>

                    {/* Paper Size Toggle */}
                    <div className="inline-flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 gap-1">
                        <button
                            type="button"
                            onClick={() => onPaperSizeChange('A4')}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                paperSize === 'A4'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            کاغذ A4
                        </button>
                        <button
                            type="button"
                            onClick={() => onPaperSizeChange('A5')}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                paperSize === 'A5'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            کاغذ A5
                        </button>
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

                    {/* Watermark Toggle */}
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
                        title="دانلود فایل HTML آماده چاپ"
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
                        <span>{isPrinting ? 'در حال آماده‌سازی...' : `چاپ همین پیش‌نمایش (${paperSize}) / PDF`}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                        title="بستن پیش‌نمایش (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Live HTML+CSS Iframe Preview */}
            <div className="flex-1 overflow-hidden bg-slate-800/90 p-2 sm:p-4">
                <iframe
                    ref={iframeRef}
                    title={documentTitle}
                    srcDoc={previewHtml}
                    className="w-full h-full rounded-2xl bg-slate-200 border border-slate-700 shadow-2xl"
                />
            </div>
        </div>
    );
};
