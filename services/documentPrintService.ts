/**
 * Document Print & PDF Service
 * Provides 100% visual fidelity printing and PDF generation for legal contracts and official bank letters.
 *
 * Features:
 *  - Supports both A4 (210x297mm) and A5 (148x210mm) paper sizes
 *  - Seamless multi-page pagination when document text exceeds 1 page (disables flex trapping & overflow clipping)
 *  - Automatic page numbering ("صفحه X از Y") via CSS @page margin boxes
 *  - Enforces Vazirmatn font with Google Fonts & host stylesheet inlining
 */

import type { DocumentPaperSize } from '../types/bankLetter';
import { buildOfficialDocumentHtml, type OfficialDocPayload } from './officialHtmlPrintBuilder';
import { loadPrintDesign } from './printDesignService';

export interface PrintOptions {
    title?: string;
    documentType?: 'PEACE_CONTRACT' | 'BANK_LETTER' | 'PRE_CONTRACT' | 'REMITTANCE_APPROVAL' | 'FREE_BILL_OF_SALE';
    paperSize?: DocumentPaperSize;
    showWatermark?: boolean;
}

/**
 * Prints a complete standalone HTML+CSS string inside an isolated hidden iframe,
 * ensuring Vazirmatn fonts, RTL layout, and @page A4/A5 pagination render accurately.
 */
export async function printHtmlString(html: string): Promise<void> {
    const iframeId = 'isolated-official-print-frame';
    const existingIframe = document.getElementById(iframeId);
    if (existingIframe && existingIframe.parentNode) {
        existingIframe.parentNode.removeChild(existingIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '794px';
    iframe.style.height = '1123px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc) {
        window.print();
        return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    try {
        if (iframeDoc.fonts) await iframeDoc.fonts.ready;
    } catch {}
    try {
        if (document.fonts) await document.fonts.ready;
    } catch {}
    try {
        const win = iframe.contentWindow as (Window & { __paginateAllDocuments?: () => void }) | null;
        if (win && typeof win.__paginateAllDocuments === 'function') {
            win.__paginateAllDocuments();
        }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 350));

    try {
        const win = iframe.contentWindow;
        if (win) {
            win.focus();
            win.print();
        } else {
            window.print();
        }
    } catch (e) {
        console.error('Error triggering HTML iframe print:', e);
        window.print();
    } finally {
        setTimeout(() => {
            if (iframe && iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        }, 12000);
    }
}

/**
 * Generates and directly prints the dedicated RTL HTML+CSS version of any official document.
 */
export async function printOfficialDocument(
    payload: OfficialDocPayload,
    options: PrintOptions = {}
): Promise<void> {
    const paperSize = options.paperSize || 'A4';
    const design = loadPrintDesign('official', paperSize);
    const html = buildOfficialDocumentHtml(payload, {
        paperSize,
        showWatermark: options.showWatermark ?? true,
        design
    });
    await printHtmlString(html);
}

/**
 * Collects all stylesheets and inline styles from the host document
 */
function collectParentStyles(): string {
    const styleChunks: string[] = [];

    styleChunks.push(`
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    `);

    let inlinedRules = '';
    try {
        for (let i = 0; i < document.styleSheets.length; i++) {
            const sheet = document.styleSheets[i];
            try {
                if (sheet.cssRules) {
                    for (let j = 0; j < sheet.cssRules.length; j++) {
                        inlinedRules += sheet.cssRules[j].cssText + '\n';
                    }
                }
            } catch {
                // Cross-origin stylesheets ignored
            }
        }
    } catch (e) {
        console.warn('Stylesheet read note:', e);
    }

    if (inlinedRules.length > 0) {
        styleChunks.push(`<style id="inlined-app-styles">${inlinedRules}</style>`);
    }

    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
        try {
            const href = link.getAttribute('href');
            if (href) {
                const absoluteHref = new URL(href, window.location.href).href;
                styleChunks.push(`<link rel="stylesheet" href="${absoluteHref}">`);
            }
        } catch {
            styleChunks.push(link.outerHTML);
        }
    });

    document.querySelectorAll('style').forEach((style) => {
        if (style.id !== 'inlined-app-styles' && style.textContent && style.textContent.trim().length > 0) {
            styleChunks.push(`<style>${style.textContent}</style>`);
        }
    });

    return styleChunks.join('\n');
}

/**
 * Prints a specific document element inside an isolated, fully styled iframe.
 * Supports A4 and A5 paper sizes and clean multi-page pagination.
 */
export async function printDocumentElement(elementId: string, options: PrintOptions = {}): Promise<void> {
    const paperSize: DocumentPaperSize = options.paperSize || 'A4';
    const sourceElement = document.getElementById(elementId);
    if (!sourceElement) {
        console.error(`Element with id "${elementId}" not found for printing.`);
        window.print();
        return;
    }

    const iframeId = 'isolated-official-print-frame';
    const existingIframe = document.getElementById(iframeId);
    if (existingIframe && existingIframe.parentNode) {
        existingIframe.parentNode.removeChild(existingIframe);
    }

    const isA5 = paperSize === 'A5';
    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = isA5 ? '559px' : '794px';
    iframe.style.height = isA5 ? '794px' : '1123px';
    iframe.style.border = 'none';
    iframe.style.opacity = '1';
    iframe.style.visibility = 'visible';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc) {
        console.error('Failed to get iframe document for printing');
        window.print();
        return;
    }

    const title = options.title || 'سند رسمی - شرکت حسینی خودرو شیراز';
    const parentStyles = collectParentStyles();

    // Deep clone source element so screen DOM stays untouched
    const clonedElement = sourceElement.cloneNode(true) as HTMLElement;

    // Strip interactive controls, screen-only chrome, and on-screen page break guides
    clonedElement
        .querySelectorAll('button, .no-print, .page-break-guide, input[type="file"]')
        .forEach((el) => el.remove());

    // Normalize root container for clean multi-page flow (CRITICAL: block display, visible overflow, auto height)
    clonedElement.style.display = 'block';
    clonedElement.style.maxWidth = '100%';
    clonedElement.style.width = '100%';
    clonedElement.style.height = 'auto';
    clonedElement.style.minHeight = 'auto';
    clonedElement.style.margin = '0';
    clonedElement.style.padding = '0';
    clonedElement.style.border = 'none';
    clonedElement.style.boxShadow = 'none';
    clonedElement.style.borderRadius = '0';
    clonedElement.style.visibility = 'visible';
    clonedElement.style.backgroundColor = '#ffffff';
    clonedElement.style.color = '#0f172a';
    clonedElement.style.overflow = 'visible';

    const contentHtml = clonedElement.outerHTML;
    const pageMargin = isA5 ? '8mm 9mm 11mm 9mm' : '11mm 13mm 14mm 13mm';

    iframeDoc.open();
    iframeDoc.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>

            ${parentStyles}

            <style>
                @page {
                    size: ${paperSize} portrait;
                    margin: ${pageMargin};
                    @bottom-left {
                        content: "صفحه " counter(page) " از " counter(pages);
                        font-family: 'Vazirmatn', system-ui, sans-serif;
                        font-size: ${isA5 ? '7.5pt' : '8.5pt'};
                        color: #64748b;
                    }
                    @bottom-right {
                        content: "شرکت حسینی خودرو شیراز — ۰۷۱۹۱۶۹۰۹۰۶";
                        font-family: 'Vazirmatn', system-ui, sans-serif;
                        font-size: ${isA5 ? '7.5pt' : '8.5pt'};
                        color: #64748b;
                    }
                }

                *, *::before, *::after {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    box-sizing: border-box !important;
                }

                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    background-color: #ffffff !important;
                    color: #0f172a !important;
                    direction: rtl !important;
                    font-family: 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    font-feature-settings: "jnum", "tnum";
                    text-rendering: optimizeLegibility;
                    width: 100% !important;
                    height: auto !important;
                    min-height: auto !important;
                    visibility: visible !important;
                    overflow: visible !important;
                }

                body, body * {
                    visibility: visible !important;
                }

                body, h1, h2, h3, h4, h5, h6, p, span, div, strong, b, td, th {
                    font-family: 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                }

                /* CRITICAL for multi-page Chromium printing: block layout, zero overflow clipping, auto min-height */
                .bank-letter-print-area,
                .bank-letter-print-container,
                .print-paper-root {
                    display: block !important;
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    max-width: 100% !important;
                    width: 100% !important;
                    height: auto !important;
                    min-height: auto !important;
                    background: #ffffff !important;
                    overflow: visible !important;
                    visibility: visible !important;
                }

                /* Compact proportional scaling for A5 paper */
                ${isA5 ? `
                .print-paper-root {
                    font-size: 10.5px !important;
                    line-height: 1.85 !important;
                }
                .print-paper-root h1 {
                    font-size: 14px !important;
                }
                .print-paper-root h2 {
                    font-size: 15px !important;
                }
                .print-paper-root h3 {
                    font-size: 13px !important;
                }
                .print-paper-root .doc-body-text {
                    font-size: 10.5px !important;
                    line-height: 1.9 !important;
                }
                .print-paper-root .p-4,
                .print-paper-root .p-3\\.5 {
                    padding: 8px !important;
                }
                .print-paper-root .mt-16,
                .print-paper-root .mt-12,
                .print-paper-root .mt-8 {
                    margin-top: 16px !important;
                }
                ` : ''}

                /* Preserve semantic colors */
                .bg-blue-50\\/70, .bg-blue-50 {
                    background-color: #eff6ff !important;
                    border-color: #dbeafe !important;
                    color: #1e3a8a !important;
                }
                .bg-emerald-50 {
                    background-color: #ecfdf5 !important;
                    border-color: #a7f3d0 !important;
                    color: #065f46 !important;
                }
                .bg-amber-50 {
                    background-color: #fffbeb !important;
                    border-color: #fde68a !important;
                    color: #0f172a !important;
                }
                .bg-slate-50 {
                    background-color: #f8fafc !important;
                    border-color: #e2e8f0 !important;
                }
                .bg-slate-100 {
                    background-color: #f1f5f9 !important;
                }

                .text-slate-900, .text-slate-950 { color: #020617 !important; }
                .text-blue-950 { color: #0b1d42 !important; }
                .text-blue-900 { color: #1e3a8a !important; }
                .text-slate-700 { color: #334155 !important; }
                .text-slate-600 { color: #475569 !important; }
                .text-slate-500 { color: #64748b !important; }

                .no-print, .page-break-guide, button, nav, aside {
                    display: none !important;
                }

                .watermark-container {
                    opacity: 0.03 !important;
                }

                /* Allow long paragraphs to split smoothly across pages */
                p {
                    text-align: justify;
                    orphans: 3;
                    widows: 3;
                }

                /* Keep signatures, section cards, and table rows intact */
                .avoid-break,
                .signature-box,
                .contract-clause,
                tr {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
            </style>
        </head>
        <body>
            ${contentHtml}
        </body>
        </html>
    `);
    iframeDoc.close();

    try {
        if (iframeDoc.fonts) {
            await iframeDoc.fonts.ready;
        }
    } catch (fontErr) {
        console.warn('Font loading wait warning:', fontErr);
    }

    try {
        if (document.fonts) {
            await document.fonts.ready;
        }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
        const win = iframe.contentWindow;
        if (win) {
            win.focus();
            win.print();
        } else {
            window.print();
        }
    } catch (e) {
        console.error('Error triggering iframe print:', e);
        window.print();
    } finally {
        setTimeout(() => {
            if (iframe && iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        }, 10000);
    }
}
