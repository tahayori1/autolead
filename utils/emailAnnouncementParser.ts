import DOMPurify from 'dompurify';
import { AnnouncementEmailMetadata } from '../types';

export interface ParsedEmailResult {
    subject: string;
    sender: string;
    senderEmail: string;
    date: string;
    receiver: string;
    bodyText: string;
    bodyHtml: string;
    metadata: AnnouncementEmailMetadata;
    hasDetectedHeaders: boolean;
}

/**
 * Strips Microsoft Outlook / Word XML garbage from copied emails,
 * while strictly preserving rich tables, styles, and markup.
 */
export const cleanOutlookHtml = (html: string): string => {
    if (!html) return '';

    let cleaned = html
        // Remove Word / Office conditional comments
        .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
        // Remove Word / Office XML blocks
        .replace(/<xml[\s\S]*?<\/xml>/gi, '')
        // Remove Office XML tags like <o:p> and </o:p>
        .replace(/<\/?o:[^>]*>/gi, '')
        .replace(/<\/?w:[^>]*>/gi, '')
        .replace(/<\/?m:[^>]*>/gi, '')
        // Remove mso-* style rules while keeping standard CSS
        .replace(/mso-[^;:"']+[;:]/gi, '')
        // Remove style blocks that might mess with parent page
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        // Remove external link tags or meta tags
        .replace(/<meta[^>]*>/gi, '')
        .replace(/<link[^>]*>/gi, '');

    // Sanitize with DOMPurify allowing essential safe styling and tables
    const sanitized = DOMPurify.sanitize(cleaned, {
        ALLOWED_TAGS: [
            'div', 'p', 'span', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr',
            'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
            'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img'
        ],
        ALLOWED_ATTR: [
            'style', 'class', 'id', 'dir', 'align', 'valign',
            'border', 'cellpadding', 'cellspacing', 'width', 'height',
            'href', 'target', 'src', 'alt', 'title', 'colspan', 'rowspan'
        ],
    });

    return sanitized;
};

/**
 * Intelligent parser that detects email headers (Subject, From, Date, To)
 * in Persian or English and separates headers from the actual message body.
 */
export const parseCopiedEmail = (rawText: string, rawHtml?: string): ParsedEmailResult => {
    let subject = '';
    let sender = '';
    let senderEmail = '';
    let date = '';
    let receiver = '';
    let hasDetectedHeaders = false;

    const lines = (rawText || '').split(/\r?\n/);
    const bodyLines: string[] = [];
    let inHeaders = true;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (inHeaders) {
            // Check for Subject / موضوع
            const subjectMatch = line.match(/^(?:موضوع|Subject|Re|Fwd)\s*[:：]\s*(.+)$/i);
            if (subjectMatch) {
                subject = subjectMatch[1].trim();
                hasDetectedHeaders = true;
                continue;
            }

            // Check for From / فرستنده / از
            const fromMatch = line.match(/^(?:از|فرستنده|From)\s*[:：]\s*(.+)$/i);
            if (fromMatch) {
                const fullFrom = fromMatch[1].trim();
                hasDetectedHeaders = true;
                // Try extract email <...>
                const emailMatch = fullFrom.match(/<([^>]+)>/);
                if (emailMatch) {
                    senderEmail = emailMatch[1].trim();
                    sender = fullFrom.replace(/<[^>]+>/, '').trim();
                } else {
                    sender = fullFrom;
                }
                continue;
            }

            // Check for Date / تاریخ / ارسال شده
            const dateMatch = line.match(/^(?:تاریخ|ارسال شده|زمان|Date|Sent)\s*[:：]\s*(.+)$/i);
            if (dateMatch) {
                date = dateMatch[1].trim();
                hasDetectedHeaders = true;
                continue;
            }

            // Check for To / گیرنده / به
            const toMatch = line.match(/^(?:به|گیرنده|To)\s*[:：]\s*(.+)$/i);
            if (toMatch) {
                receiver = toMatch[1].trim();
                hasDetectedHeaders = true;
                continue;
            }

            // Check for separator line (e.g., -----Original Message-----)
            if (line.match(/^[-=_]{3,}|(?:Original Message|پیام اصلی)/i)) {
                hasDetectedHeaders = true;
                continue;
            }

            // If we have encountered non-header line after some headers or empty line
            if (hasDetectedHeaders && line === '') {
                inHeaders = false;
                continue;
            }
        }

        bodyLines.push(lines[i]);
    }

    const bodyText = bodyLines.join('\n').trim() || rawText.trim();
    
    // Process HTML if available
    let bodyHtml = '';
    if (rawHtml) {
        bodyHtml = cleanOutlookHtml(rawHtml);
    } else {
        // Convert plain text newlines into formatted HTML paragraphs
        const paragraphs = bodyText.split(/\n\s*\n/).map(p => {
            const safeP = p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />');
            return `<p style="margin-bottom: 12px; line-height: 1.8;">${safeP}</p>`;
        }).join('');
        bodyHtml = `<div dir="rtl" style="font-family: inherit; line-height: 1.8;">${paragraphs}</div>`;
    }

    const metadata: AnnouncementEmailMetadata = {
        sender: sender || undefined,
        senderEmail: senderEmail || undefined,
        subject: subject || undefined,
        date: date || undefined,
        receiver: receiver || undefined,
        organization: 'ایمیل سازمانی'
    };

    return {
        subject: subject || (bodyText.length > 50 ? bodyText.slice(0, 50) + '...' : bodyText),
        sender,
        senderEmail,
        date,
        receiver,
        bodyText,
        bodyHtml,
        metadata,
        hasDetectedHeaders
    };
};
