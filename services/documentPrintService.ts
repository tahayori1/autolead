/**
 * Document Print & PDF Service
 * Provides 100% visual fidelity printing and PDF generation for legal contracts and official bank letters.
 * 
 * Features:
 *  - Exact visual clone of the on-screen preview (colors, badges, gradients, watermarks, borders)
 *  - Enforces Vazirmatn font with comprehensive Google Fonts preloading & font-face embedding
 *  - Awaits document.fonts.ready to prevent font fallback rasterization in PDFs
 *  - Injects all parent application Tailwind and theme stylesheets into the print iframe
 *  - Standard A4 portrait sizing with precise print-color-adjust for vector PDF export
 *  - Strips all surrounding application shell UI, buttons, sidebars, and modals
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

    // Copy all <link rel="stylesheet"> elements (Tailwind, fontsource, etc.)
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
        try {
            const href = link.getAttribute('href');
            if (href) {
                // Ensure absolute URL resolution for iframe
                const absoluteHref = new URL(href, window.location.href).href;
                styleChunks.push(`<link rel="stylesheet" href="${absoluteHref}">`);
            }
        } catch {
            styleChunks.push(link.outerHTML);
        }
    });

    // Copy all <style> tags (inline Tailwind styles, Vite CSS modules, custom rules)
    document.querySelectorAll('style').forEach((style) => {
        if (style.textContent && style.textContent.trim().length > 0) {
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
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
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
    const contentHtml = sourceElement.innerHTML;

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
                    font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    font-feature-settings: "jnum", "tnum";
                    text-rendering: optimizeLegibility;
                    width: 100% !important;
                    min-height: auto !important;
                }

                /* Enforce Vazirmatn on all text elements */
                body, h1, h2, h3, h4, h5, h6, p, span, div, strong, b, td, th {
                    font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
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
                    color: #64748B !important;
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
                .contract-clause {
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
            <div class="print-paper-root relative">
                ${contentHtml}
            </div>
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

    // Safety settle delay to allow images, SVGs, and stylesheets to render
    await new Promise((resolve) => setTimeout(resolve, 350));

    try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
    } catch (e) {
        console.error('Error triggering iframe print:', e);
        window.print();
    } finally {
        // Keep iframe temporarily for print dialog spooling, then cleanup
        setTimeout(() => {
            if (iframe && iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        }, 5000);
    }
}
