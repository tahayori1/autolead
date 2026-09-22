/**
 * Document Print & PDF Service
 * Provides isolated, clean printing for legal contracts and official bank letters.
 * Ensures ONLY the document content is printed, without any surrounding UI, sidebars, buttons or modals.
 */

export interface PrintOptions {
    title?: string;
    documentType?: 'PEACE_CONTRACT' | 'BANK_LETTER';
}

export function printDocumentElement(elementId: string, options: PrintOptions = {}): void {
    const sourceElement = document.getElementById(elementId);
    if (!sourceElement) {
        console.error(`Element with id "${elementId}" not found for printing.`);
        window.print();
        return;
    }

    // Create a temporary hidden iframe for 100% isolated printing
    const iframeId = 'isolated-print-frame';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
    if (iframe) {
        document.body.removeChild(iframe);
    }

    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
        console.error('Failed to get iframe document for printing');
        window.print();
        return;
    }

    const title = options.title || 'سند رسمی - شرکت حسینی خودرو شیراز';
    const contentHtml = sourceElement.innerHTML;

    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 12mm 14mm 12mm 14mm;
                }
                * {
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                html, body {
                    margin: 0;
                    padding: 0;
                    background: #ffffff !important;
                    color: #000000 !important;
                    font-family: Arial, "Vazirmatn", Tahoma, -apple-system, sans-serif !important;
                    direction: rtl;
                    text-align: right;
                    font-size: 11pt;
                    line-height: 1.8;
                }
                .no-print, button, nav, aside {
                    display: none !important;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #333333;
                    padding: 5px 8px;
                    font-size: 10pt;
                }
                p {
                    margin: 0 0 8px 0;
                    text-align: justify;
                }
                strong {
                    font-weight: bold;
                }
                .text-center {
                    text-align: center !important;
                }
                .text-left {
                    text-align: left !important;
                }
                .text-right {
                    text-align: right !important;
                }
                .text-justify {
                    text-align: justify !important;
                }
                .border-b-2 {
                    border-bottom: 2px solid #000 !important;
                }
                .border-t {
                    border-top: 1px solid #ccc !important;
                }
                .border {
                    border: 1px solid #333 !important;
                }
                .rounded-lg, .rounded-xl, .rounded-2xl, .rounded-3xl {
                    border-radius: 4px !important;
                }
                .shadow-sm, .shadow-md, .shadow-xl, .shadow-xs {
                    box-shadow: none !important;
                }
                .bg-slate-50, .bg-blue-50, .bg-emerald-50, .bg-amber-50 {
                    background-color: #f8fafc !important;
                }
                .page-break {
                    page-break-after: always;
                }
                .avoid-break {
                    page-break-inside: avoid;
                }
            </style>
        </head>
        <body>
            <div class="print-wrapper">
                ${contentHtml}
            </div>
        </body>
        </html>
    `);
    doc.close();

    // Allow resources & styles to settle before invoking native print
    setTimeout(() => {
        try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
        } catch (e) {
            console.error('Error triggering iframe print:', e);
            window.print();
        } finally {
            // Remove iframe after short delay
            setTimeout(() => {
                if (iframe && iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            }, 3000);
        }
    }, 250);
}
