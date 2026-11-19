import React, { useEffect, useRef, useState } from 'react';
import type { DocumentPaperSize } from '../../types/bankLetter';
import { toPersianDigits } from '../../services/bankLetterValidation';
import { FileText, Layers } from 'lucide-react';

interface PaperSizeSelectorProps {
    paperSize: DocumentPaperSize;
    onChange: (size: DocumentPaperSize) => void;
    pageCount?: number;
}

export const PaperSizeSelector: React.FC<PaperSizeSelectorProps> = ({
    paperSize,
    onChange,
    pageCount
}) => {
    return (
        <div className="no-print flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
                <button
                    type="button"
                    onClick={() => onChange('A4')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        paperSize === 'A4'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                    }`}
                    title="کاغذ استاندارد A4 (۲۱۰ × ۲۹۷ میلی‌متر)"
                >
                    کاغذ A4
                </button>
                <button
                    type="button"
                    onClick={() => onChange('A5')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        paperSize === 'A5'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                    }`}
                    title="کاغذ نیم‌برگ A5 (۱۴۸ × ۲۱۰ میلی‌متر)"
                >
                    کاغذ A5
                </button>
            </div>

            {typeof pageCount === 'number' && (
                <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                        pageCount > 1
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                >
                    <Layers className="w-3 h-3" />
                    <span>{toPersianDigits(pageCount)} صفحه ({paperSize})</span>
                </span>
            )}
        </div>
    );
};

interface PaginatedDocumentSheetProps {
    id: string;
    paperSize: DocumentPaperSize;
    watermark?: React.ReactNode;
    footer?: React.ReactNode;
    onPageCountChange?: (count: number) => void;
    children: React.ReactNode;
}

/**
 * Renders an official A4 or A5 printable document sheet with automatic multi-page
 * expansion and visual page-break indicators on screen.
 * Uses block flow (not flexbox) and visible overflow so browser Print/PDF cleanly
 * paginates across 2 or more pages whenever content exceeds 1 sheet.
 */
export const PaginatedDocumentSheet: React.FC<PaginatedDocumentSheetProps> = ({
    id,
    paperSize,
    watermark,
    footer,
    onPageCountChange,
    children
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = useState(1);

    const isA5 = paperSize === 'A5';
    // Printable page height in CSS px inside @page margins (at 96dpi)
    // A4 = 1123px - ~96px margins = ~1027px; A5 = 794px - ~76px margins = ~718px
    const pageContentHeightPx = isA5 ? 700 : 1010;
    const sheetWidthClass = isA5 ? 'max-w-[559px]' : 'max-w-[794px]';
    const paddingClass = isA5 ? 'p-5 sm:p-6 text-[11px] leading-[1.9]' : 'p-8 sm:p-11 text-[13px] leading-[2.25]';

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        const updatePagination = () => {
            const h = el.scrollHeight;
            const nextCount = Math.max(1, Math.ceil((h + 24) / pageContentHeightPx));
            setPageCount(nextCount);
            if (onPageCountChange) onPageCountChange(nextCount);
        };

        updatePagination();

        let observer: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(updatePagination);
            observer.observe(el);
        }

        return () => {
            if (observer) observer.disconnect();
        };
    }, [paperSize, pageContentHeightPx, children, onPageCountChange]);

    const breakIndices = pageCount > 1 ? Array.from({ length: pageCount - 1 }, (_, i) => i + 1) : [];

    return (
        <div className="space-y-2">
            {/* Screen-only pagination status strip */}
            <div className={`no-print ${sheetWidthClass} mx-auto flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 text-[11px] text-slate-600 dark:text-slate-300 font-bold`}>
                <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>
                        قطع کاغذ: <strong className="text-slate-900 dark:text-white">{paperSize}</strong> ({isA5 ? '۱۴۸ × ۲۱۰ میلی‌متر' : '۲۱۰ × ۲۹۷ میلی‌متر'})
                    </span>
                </span>
                <span>
                    {pageCount > 1
                        ? `سند در ${toPersianDigits(pageCount)} صفحه صفحه‌بندی شده است`
                        : '۱ صفحه کامل'}
                </span>
            </div>

            {/* Printable Sheet Container */}
            <div
                id={id}
                className={`bank-letter-print-container print-paper-root ${isA5 ? 'paper-a5' : 'paper-a4'} bg-white text-slate-900 rounded-3xl ${paddingClass} shadow-sm border border-slate-200 dark:border-slate-800 w-full ${sheetWidthClass} mx-auto relative`}
                style={{
                    direction: 'rtl',
                    minHeight: `${pageCount * pageContentHeightPx}px`
                }}
            >
                {/* Watermark (clipped only to background layer, never clips document flow) */}
                {watermark && (
                    <div className="watermark-container absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none select-none overflow-hidden rounded-3xl">
                        {watermark}
                    </div>
                )}

                {/* Visual Page Break Guides (Screen-only, automatically removed in Print/PDF) */}
                {breakIndices.map((idx) => (
                    <div
                        key={idx}
                        className="no-print page-break-guide pointer-events-none absolute inset-x-0 z-20 flex items-center justify-center"
                        style={{ top: `${idx * pageContentHeightPx}px` }}
                    >
                        <div className="w-full border-t-2 border-dashed border-amber-400/90 relative">
                            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-amber-50 text-amber-800 border border-amber-300 px-3 py-0.5 rounded-full text-[10px] font-black shadow-xs whitespace-nowrap">
                                پایان صفحه {toPersianDigits(idx)} — ادامه در صفحه {toPersianDigits(idx + 1)}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Actual Flowing Document Content */}
                <div ref={contentRef} className="relative z-10">
                    {children}

                    {/* Footer */}
                    {footer && (
                        <div className="mt-8 pt-3 border-t border-slate-300 text-center text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2 avoid-break">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
