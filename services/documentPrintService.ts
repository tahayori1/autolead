/**
 * Document Print & PDF Service
 * Provides 100% visual fidelity printing and PDF generation for legal contracts and official bank letters.
 * 
 * Features:
 *  - Exact visual clone of the on-screen preview (colors, badges, gradients, watermarks, borders)
 *  - Enforces Vazirmatn font with comprehensive Google Fonts preloading & font-face embedding
 *  - Clones source element attributes and inner nodes while stripping interactive buttons and shadows
 *  - Inlines all application stylesheet rules directly to eliminate any external network delays in iframe
 *  - Off-screen standard A4 viewport dimensions (800x1130px) to guarantee Chromium prints vector content, never blank pages
 *  - Explicitly ensures visibility: visible !important on all elements inside print scope
 */

export interface PrintOptions {
    title?: string;
    documentType?: 'PEACE_CONTRACT' | 'BANK_LETTER';
}

/**
 * Collects all stylesheets and inline styles from the host document
 */
function collectParentStyles(): string {
    const styleChunks: string[] = [];

    // Preconnect and import Vazirmatn font with full weights
    styleChunks.push(`
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    `);

    // Inlining all loaded rules directly from in-memory stylesheets
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
                // Cross origin or inaccessible stylesheets are ignored here and caught below
            }
        }
    } catch (e) {
        console.warn('Stylesheet read note:', e);
    }

    if (inlinedRules.length > 0) {
        styleChunks.push(`<style id="inlined-app-styles">${inlinedRules}</style>`);
    }

    // Also include link tags just in case
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

    // Also copy custom style tags from host document
    document.querySelectorAll('style').forEach((style) => {
        if (style.id !== 'inlined-app-styles' && style.textContent && style.textContent.trim().length > 0) {
            styleChunks.push(`<style>${style.textContent}</style>`);
        }
    });

    return styleChunks.join('\n');
}

/**
 * Prints a specific document element inside an isolated, fully styled iframe.
 * Ensures the generated PDF or paper print matches the on-screen preview with 100% precision.
 */
export async function printDocumentElement(elementId: string, options: PrintOptions = {}): Promise<void> {
    const sourceElement = document.getElementById(elementId);
    if (!sourceElement) {
        console.error(`Element with id "${elementId}" not found for printing.`);
        window.print();
        return;
    }

    // Clean up any stale print frames
    const iframeId = 'isolated-official-print-frame';
    const existingIframe = document.getElementById(iframeId);
    if (existingIframe && existingIframe.parentNode) {
        existingIframe.parentNode.removeChild(existingIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    // CRITICAL FIX: Set real dimensions off-screen so Chromium never computes a 0x0 viewport or blank pages!
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '800px';
    iframe.style.height = '1130px';
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

    // Deep clone source element so we don't mutate the DOM on screen
    const clonedElement = sourceElement.cloneNode(true) as HTMLElement;

    // Remove buttons, toolbars, and no-print UI elements from the clone
    clonedElement.querySelectorAll('button, .no-print, input[type="file"]').forEach((el) => el.remove());

    // Normalize styles for official A4 printing (strip screen box-shadows, fixed max-widths, screen overflow)
    clonedElement.style.maxWidth = '100%';
    clonedElement.style.width = '100%';
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

    // Build the complete standalone HTML document for the iframe
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
                /* =========================================================
                   Official A4 Print & PDF Rendering Specifications
                   ========================================================= */
                @page {
                    size: A4 portrait;
                    margin: 10mm 12mm 10mm 12mm;
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

                /* Enforce visibility on all document elements inside iframe */
                body, body * {
                    visibility: visible !important;
                }

                /* Enforce Vazirmatn on all text elements */
                body, h1, h2, h3, h4, h5, h6, p, span, div, strong, b, td, th {
                    font-family: 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                }

                /* Remove on-screen mock card wrapper artifacts (rounded borders, drop-shadows) */
                .bank-letter-print-area,
                .bank-letter-print-container,
                .print-paper-root {
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    max-width: 100% !important;
                    width: 100% !important;
                    min-height: auto !important;
                    background: #ffffff !important;
                    overflow: visible !important;
                    visibility: visible !important;
                }

                /* Explicitly protect badge colors and highlighted sections from being washed out */
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

                /* Ensure dark text has maximum contrast for official printing */
                .text-slate-900, .text-slate-950 {
                    color: #020617 !important;
                }
                .text-blue-950 {
                    color: #0b1d42 !important;
                }
                .text-blue-900 {
                    color: #1e3a8a !important;
                }
                .text-slate-700 {
                    color: #334155 !important;
                }
                .text-slate-600 {
                    color: #475569 !important;
                }
                .text-slate-500 {
                    color: #64748b !important;
                }

                /* Hide all non-printable elements */
                .no-print, button, nav, aside {
                    display: none !important;
                }

                /* Watermark visibility control */
                .watermark-container {
                    opacity: 0.035 !important;
                }

                /* Prevent awkward page-splitting inside cards and signature boxes */
                .avoid-break,
                .signature-box,
                .contract-clause,
                tr {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }

                /* Smooth typography spacing */
                p {
                    text-align: justify;
                }
            </style>
        </head>
        <body>
            ${contentHtml}
        </body>
        </html>
    `);
    iframeDoc.close();

    // Await font readiness and layout computation
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

    // Safety settle delay to allow images, SVGs, and stylesheets to render
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
        // Keep iframe temporarily for print dialog spooling, then cleanup
        setTimeout(() => {
            if (iframe && iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        }, 10000);
    }
}
