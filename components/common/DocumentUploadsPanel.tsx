import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
    ExtractedIdentityDocumentData,
    IdentityDocumentCategory,
    UploadScopeType,
    UploadedIdentityDocument
} from '../../types/uploads';
import {
    DOCUMENT_UPLOAD_CATEGORIES,
    UPLOADS_API_ENDPOINT,
    deleteUploadedDocument,
    formatFileSize,
    getCategoryMeta,
    listUploadedDocuments,
    retryAllPendingUploads,
    retryUploadDocument,
    updateUploadedDocumentMeta,
    uploadAndPersistDocument
} from '../../services/documentUploadService';
import { toPersianDigits } from '../../services/bankLetterValidation';
import {
    BookOpen,
    CheckCircle2,
    CloudOff,
    CloudUpload,
    CreditCard,
    Download,
    Eye,
    FileBadge2,
    FileText,
    Globe,
    HardDrive,
    IdCard,
    Loader2,
    Printer,
    RefreshCw,
    RotateCw,
    Trash2,
    Upload,
    X,
    ZoomIn,
    ZoomOut,
    ChevronRight,
    ChevronLeft,
    AlertTriangle,
    Sparkles
} from 'lucide-react';

interface DocumentUploadsPanelProps {
    scopeType: UploadScopeType;
    scopeId: string;
    nationalCode?: string;
    customerName?: string;
    phone?: string;
    compact?: boolean;
    autoFillRoleLabel?: string;
    onAutoFillFromDocument?: (
        extracted: ExtractedIdentityDocumentData,
        doc: UploadedIdentityDocument
    ) => string[] | void;
}

const getCategoryIcon = (category: IdentityDocumentCategory, className = 'w-4 h-4') => {
    switch (category) {
        case 'SHENASNAMEH':
            return <BookOpen className={className} />;
        case 'NATIONAL_CARD':
            return <IdCard className={className} />;
        case 'PASSPORT':
            return <Globe className={className} />;
        case 'DRIVING_LICENSE':
            return <FileBadge2 className={className} />;
        case 'BANK_CARD':
            return <CreditCard className={className} />;
    }
};

export const DocumentUploadsPanel: React.FC<DocumentUploadsPanelProps> = ({
    scopeType,
    scopeId,
    nationalCode,
    customerName,
    phone,
    compact = false,
    autoFillRoleLabel = 'فرم',
    onAutoFillFromDocument
}) => {
    const [docs, setDocs] = useState<UploadedIdentityDocument[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);

    // Upload Form State
    const [selectedCategory, setSelectedCategory] = useState<IdentityDocumentCategory>('SHENASNAMEH');
    const [selectedSubLabel, setSelectedSubLabel] = useState<string>(
        getCategoryMeta('SHENASNAMEH').defaultSubLabels[0]
    );
    const [customSubLabel, setCustomSubLabel] = useState<string>('');
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [notes, setNotes] = useState<string>('');
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgressText, setUploadProgressText] = useState<string>('');
    const [feedbackMsg, setFeedbackMsg] = useState<{
        type: 'success' | 'warning' | 'error';
        text: string;
    } | null>(null);

    // Filter & Sync State
    const [filterCategory, setFilterCategory] = useState<'ALL' | IdentityDocumentCategory>('ALL');
    const [retryingIds, setRetryingIds] = useState<Record<string, boolean>>({});
    const [isRetryingAll, setIsRetryingAll] = useState(false);

    // Lightbox Preview State
    const [previewDocId, setPreviewDocId] = useState<string | null>(null);
    const [previewZoom, setPreviewZoom] = useState<number>(1);
    const [previewRotation, setPreviewRotation] = useState<number>(0);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const loadDocs = useCallback(async () => {
        setIsLoadingList(true);
        try {
            const list = await listUploadedDocuments(scopeType, scopeId, nationalCode);
            setDocs(list);
        } finally {
            setIsLoadingList(false);
        }
    }, [scopeType, scopeId, nationalCode]);

    useEffect(() => {
        loadDocs();
    }, [loadDocs]);

    const currentCatMeta = useMemo(
        () => getCategoryMeta(selectedCategory),
        [selectedCategory]
    );

    const handleSelectCategory = (cat: IdentityDocumentCategory) => {
        setSelectedCategory(cat);
        const meta = getCategoryMeta(cat);
        const existingInCat = docs.filter((d) => d.category === cat);

        if (!meta.supportsMultiPage) {
            // Pick whichever side isn't uploaded yet (front first, then back)
            const hasFirst = existingInCat.some((d) => d.subLabel === meta.defaultSubLabels[0]);
            if (hasFirst && meta.defaultSubLabels[1]) {
                setSelectedSubLabel(meta.defaultSubLabels[1]);
                setPageNumber(2);
            } else {
                setSelectedSubLabel(meta.defaultSubLabels[0]);
                setPageNumber(1);
            }
        } else {
            const nextIdx = Math.min(existingInCat.length, meta.defaultSubLabels.length - 1);
            setSelectedSubLabel(meta.defaultSubLabels[nextIdx] || meta.defaultSubLabels[0]);
            setPageNumber(existingInCat.length + 1);
        }
        setCustomSubLabel('');
    };

    const effectiveSubLabel = useMemo(() => {
        if (customSubLabel.trim()) return customSubLabel.trim();
        if (currentCatMeta.supportsMultiPage && selectedSubLabel === 'سایر صفحات شناسنامه') {
            return `صفحه ${toPersianDigits(pageNumber)} شناسنامه`;
        }
        return selectedSubLabel || currentCatMeta.defaultSubLabels[0];
    }, [customSubLabel, currentCatMeta, selectedSubLabel, pageNumber]);

    const processFilesUpload = async (fileList: FileList | File[]) => {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        setIsUploading(true);
        setFeedbackMsg(null);

        let uploadedRemoteCount = 0;
        let savedLocalFallbackCount = 0;
        let failedReadCount = 0;
        let lastErrorMsg = '';
        let autoFilledFieldsSummary: string[] = [];
        let lastExtracted: ExtractedIdentityDocumentData | undefined;

        const basePage = pageNumber || 1;
        const meta = getCategoryMeta(selectedCategory);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setUploadProgressText(
                `در حال پردازش و ارسال فایل ${toPersianDigits(i + 1)} از ${toPersianDigits(files.length)}: ${file.name}`
            );

            // Auto-label multi-file batches sensibly (e.g., all pages of Shenasnameh or front+back National Card)
            let itemSubLabel = effectiveSubLabel;
            let itemPageNumber = basePage + i;

            if (files.length > 1) {
                if (selectedCategory === 'SHENASNAMEH') {
                    const startIdx = Math.max(0, basePage - 1);
                    const idx = startIdx + i;
                    itemSubLabel =
                        meta.defaultSubLabels[idx] ||
                        `صفحه ${toPersianDigits(idx + 1)} شناسنامه`;
                    itemPageNumber = idx + 1;
                } else if (!meta.supportsMultiPage && files.length === 2) {
                    itemSubLabel = meta.defaultSubLabels[i] || itemSubLabel;
                    itemPageNumber = i + 1;
                } else {
                    itemSubLabel = `${effectiveSubLabel} (${toPersianDigits(i + 1)})`;
                }
            }

            try {
                const result = await uploadAndPersistDocument({
                    file,
                    scopeType,
                    scopeId,
                    category: selectedCategory,
                    subLabel: itemSubLabel,
                    pageNumber: itemPageNumber,
                    nationalCode,
                    customerName,
                    phone,
                    notes
                });

                if (result.syncStatus === 'UPLOADED') {
                    uploadedRemoteCount += 1;
                    if (result.extractedData) {
                        lastExtracted = result.extractedData;
                        if (onAutoFillFromDocument) {
                            const filled = onAutoFillFromDocument(result.extractedData, result);
                            if (Array.isArray(filled)) {
                                autoFilledFieldsSummary = Array.from(
                                    new Set([...autoFilledFieldsSummary, ...filled])
                                );
                            }
                        }
                    }
                } else {
                    savedLocalFallbackCount += 1;
                    if (result.lastError) lastErrorMsg = result.lastError;
                }
            } catch (err: unknown) {
                failedReadCount += 1;
                lastErrorMsg =
                    err instanceof Error ? err.message : 'خطا در خواندن فایل انتخاب‌شده';
            }
        }

        await loadDocs();
        setIsUploading(false);
        setUploadProgressText('');
        setNotes('');
        setCustomSubLabel('');

        // Advance next page / side helper automatically
        if (meta.supportsMultiPage) {
            const nextPage = basePage + files.length;
            setPageNumber(nextPage);
            const nextLabel = meta.defaultSubLabels[nextPage - 1];
            if (nextLabel) setSelectedSubLabel(nextLabel);
        } else if (files.length === 1 && selectedSubLabel === meta.defaultSubLabels[0] && meta.defaultSubLabels[1]) {
            setSelectedSubLabel(meta.defaultSubLabels[1]);
            setPageNumber(2);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        if (failedReadCount > 0 && uploadedRemoteCount === 0 && savedLocalFallbackCount === 0) {
            setFeedbackMsg({ type: 'error', text: lastErrorMsg || 'خطا در خواندن فایل‌ها' });
        } else if (savedLocalFallbackCount > 0) {
            setFeedbackMsg({
                type: 'warning',
                text: `${toPersianDigits(savedLocalFallbackCount)} فایل به دلیل خطای ارتباط با سرور در حافظه محلی امن ذخیره شد و قابل پیش‌نمایش و ارسال مجدد است.${
                    uploadedRemoteCount > 0
                        ? ` (${toPersianDigits(uploadedRemoteCount)} فایل با موفقیت روی سرور آپلود شد)`
                        : ''
                }`
            });
        } else if (uploadedRemoteCount > 0) {
            const autoFillNote = lastExtracted
                ? autoFilledFieldsSummary.length > 0
                    ? ` — اطلاعات استخراج‌شده (${autoFilledFieldsSummary.join('، ')}) به‌صورت خودکار در ${autoFillRoleLabel} تکمیل شد.`
                    : ` — اطلاعات هویتی از مدرک استخراج و ذخیره شد.`
                : '';
            setFeedbackMsg({
                type: 'success',
                text: `${toPersianDigits(uploadedRemoteCount)} مدرک با موفقیت در سرور آپلود و ذخیره شد${autoFillNote}`
            });
        }
    };

    const handleRetrySingle = async (id: string) => {
        setRetryingIds((p) => ({ ...p, [id]: true }));
        try {
            const res = await retryUploadDocument(id);
            await loadDocs();
            if (res?.syncStatus === 'UPLOADED') {
                let extraNote = '';
                if (res.extractedData && onAutoFillFromDocument) {
                    const filled = onAutoFillFromDocument(res.extractedData, res);
                    if (Array.isArray(filled) && filled.length > 0) {
                        extraNote = ` و فیلدهای (${filled.join('، ')}) در ${autoFillRoleLabel} تکمیل شد.`;
                    }
                }
                setFeedbackMsg({ type: 'success', text: `فایل با موفقیت به سرور ارسال شد${extraNote}` });
            } else {
                setFeedbackMsg({
                    type: 'warning',
                    text: res?.lastError || 'ارسال مجدد ناموفق بود؛ فایل همچنان در حافظه محلی محفوظ است.'
                });
            }
        } finally {
            setRetryingIds((p) => ({ ...p, [id]: false }));
        }
    };

    const handleRetryAll = async () => {
        setIsRetryingAll(true);
        try {
            const { succeeded, failed } = await retryAllPendingUploads(docs);
            await loadDocs();
            if (failed === 0 && succeeded > 0) {
                setFeedbackMsg({
                    type: 'success',
                    text: `تمام ${toPersianDigits(succeeded)} فایل محلی با موفقیت به سرور ارسال شدند.`
                });
            } else if (succeeded > 0 || failed > 0) {
                setFeedbackMsg({
                    type: 'warning',
                    text: `${toPersianDigits(succeeded)} فایل ارسال شد و ${toPersianDigits(failed)} فایل همچنان در صف ارسال محلی باقی ماند.`
                });
            }
        } finally {
            setIsRetryingAll(false);
        }
    };

    const handleDelete = async (id: string) => {
        await deleteUploadedDocument(id);
        if (previewDocId === id) setPreviewDocId(null);
        await loadDocs();
    };

    const handleChangeDocSubLabel = async (doc: UploadedIdentityDocument, nextLabel: string) => {
        await updateUploadedDocumentMeta(doc.id, { subLabel: nextLabel });
        await loadDocs();
    };

    const countByCategory = useMemo(() => {
        const counts: Record<IdentityDocumentCategory, number> = {
            SHENASNAMEH: 0,
            NATIONAL_CARD: 0,
            PASSPORT: 0,
            DRIVING_LICENSE: 0,
            BANK_CARD: 0
        };
        for (const d of docs) {
            counts[d.category] = (counts[d.category] || 0) + 1;
        }
        return counts;
    }, [docs]);

    const pendingCount = useMemo(
        () => docs.filter((d) => d.syncStatus !== 'UPLOADED').length,
        [docs]
    );

    const filteredDocs = useMemo(() => {
        if (filterCategory === 'ALL') return docs;
        return docs.filter((d) => d.category === filterCategory);
    }, [docs, filterCategory]);

    const previewIndex = useMemo(
        () => filteredDocs.findIndex((d) => d.id === previewDocId),
        [filteredDocs, previewDocId]
    );

    const previewDoc = previewIndex >= 0 ? filteredDocs[previewIndex] : null;

    const openPreview = (id: string) => {
        setPreviewDocId(id);
        setPreviewZoom(1);
        setPreviewRotation(0);
    };

    const handleDownloadDoc = (doc: UploadedIdentityDocument) => {
        const a = document.createElement('a');
        a.href = doc.dataUrl;
        a.download = doc.fileName || `${doc.category}_${doc.subLabel}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handlePrintDoc = (doc: UploadedIdentityDocument) => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '-9999px';
        iframe.style.width = '0';
        iframe.style.height = '0';
        document.body.appendChild(iframe);
        const docWin = iframe.contentWindow;
        if (!docWin) {
            document.body.removeChild(iframe);
            return;
        }
        const meta = getCategoryMeta(doc.category);
        docWin.document.open();
        docWin.document.write(`
            <!doctype html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="utf-8" />
                <title>${meta.label} - ${doc.subLabel}</title>
                <style>
                    body { font-family: Tahoma, Arial, sans-serif; margin: 20px; text-align: center; color: #0f172a; }
                    .hdr { border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 16px; }
                    .hdr h2 { margin: 0 0 4px 0; font-size: 16px; }
                    .hdr p { margin: 0; font-size: 12px; color: #475569; }
                    img { max-width: 100%; max-height: 85vh; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="hdr">
                    <h2>${meta.label} — ${doc.subLabel}</h2>
                    <p>${customerName ? `متقاضی: ${customerName}` : ''} ${nationalCode ? `| کد ملی: ${nationalCode}` : ''}</p>
                </div>
                ${
                    doc.mimeType.includes('pdf')
                        ? '<p>این مدرک در قالب PDF است. لطفاً فایل PDF را دانلود و چاپ نمایید.</p>'
                        : `<img src="${doc.dataUrl}" alt="${doc.subLabel}" />`
                }
            </body>
            </html>
        `);
        docWin.document.close();
        setTimeout(() => {
            try {
                docWin.focus();
                docWin.print();
            } finally {
                setTimeout(() => {
                    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
                }, 1500);
            }
        }, 250);
    };

    const nationalCardStatus = useMemo(() => {
        const list = docs.filter((d) => d.category === 'NATIONAL_CARD');
        return {
            hasFront: list.some((d) => d.subLabel.includes('روی')),
            hasBack: list.some((d) => d.subLabel.includes('پشت'))
        };
    }, [docs]);

    return (
        <div className="space-y-4" dir="rtl">
            {/* Header & Sync Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <CloudUpload className="w-4 h-4 text-sky-600" />
                        <span>آپلود و پیش‌نمایش مدارک هویتی و بانکی مشتری</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        تمامی فایل‌ها ابتدا در حافظه محلی امن ذخیره و به وب‌سرویس ارسال می‌شوند؛ در صورت قطعی یا خطای API هیچ فایلی از بین نمی‌رود.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                        <span>کل مدارک: {toPersianDigits(docs.length)}</span>
                    </span>
                    {pendingCount > 0 && (
                        <button
                            type="button"
                            onClick={handleRetryAll}
                            disabled={isRetryingAll}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black shadow-xs cursor-pointer disabled:opacity-60"
                        >
                            {isRetryingAll ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            <span>ارسال مجدد {toPersianDigits(pendingCount)} فایل محلی به سرور</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Step 1: Select What Is Being Uploaded */}
            <div className="bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 sm:p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                        ۱. نوع مدرکی که در حال آپلود آن هستید را انتخاب کنید:
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline" dir="ltr">
                        {UPLOADS_API_ENDPOINT.slice(0, 48)}...
                    </span>
                </div>

                <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
                    {DOCUMENT_UPLOAD_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        const count = countByCategory[cat.id] || 0;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleSelectCategory(cat.id)}
                                className={`text-right p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                    isSelected
                                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-500/20'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'}`}>
                                        {getCategoryIcon(cat.id, 'w-4 h-4')}
                                    </span>
                                    {count > 0 && (
                                        <span
                                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono ${
                                                isSelected
                                                    ? 'bg-white text-sky-700'
                                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                            }`}
                                        >
                                            {toPersianDigits(count)}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs font-black">{cat.label}</div>
                                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                                        {cat.maxHint}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Step 2: Page / Side Selector + Notes */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                    <div className="md:col-span-5">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            ۲. مشخصات صفحه / سمت ({currentCatMeta.label})
                        </label>
                        <select
                            value={selectedSubLabel}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedSubLabel(val);
                                const idx = currentCatMeta.defaultSubLabels.indexOf(val);
                                if (idx >= 0) setPageNumber(idx + 1);
                            }}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold"
                        >
                            {currentCatMeta.defaultSubLabels.map((lbl) => (
                                <option key={lbl} value={lbl}>
                                    {lbl}
                                </option>
                            ))}
                        </select>
                        {selectedCategory === 'NATIONAL_CARD' && (
                            <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                                <span className={`px-2 py-0.5 rounded-md font-bold ${nationalCardStatus.hasFront ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/80 text-slate-500'}`}>
                                    {nationalCardStatus.hasFront ? '✓ روی کارت ثبت شد' : '○ روی کارت خالی'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md font-bold ${nationalCardStatus.hasBack ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/80 text-slate-500'}`}>
                                    {nationalCardStatus.hasBack ? '✓ پشت کارت ثبت شد' : '○ پشت کارت خالی'}
                                </span>
                            </div>
                        )}
                    </div>

                    {currentCatMeta.supportsMultiPage ? (
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                شماره صفحه
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={30}
                                value={pageNumber}
                                onChange={(e) => setPageNumber(Math.max(1, Number(e.target.value) || 1))}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-center font-bold"
                            />
                        </div>
                    ) : (
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                عنوان دلخواه
                            </label>
                            <input
                                type="text"
                                value={customSubLabel}
                                onChange={(e) => setCustomSubLabel(e.target.value)}
                                placeholder="اختیاری"
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            />
                        </div>
                    )}

                    <div className="md:col-span-5">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            توضیحات یا عنوان تکمیلی (اختیاری)
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={
                                selectedCategory === 'BANK_CARD'
                                    ? 'مثلاً: بانک ملت به نام خریدار'
                                    : selectedCategory === 'SHENASNAMEH'
                                    ? 'مثلاً: توضیحات صفحه اول و دوم'
                                    : 'توضیح کوتاه روی تصویر مدرک'
                            }
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        />
                    </div>
                </div>

                {/* Dropzone / Upload Trigger */}
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            processFilesUpload(e.dataTransfer.files);
                        }
                    }}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`rounded-2xl border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
                        isDragging
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-400 hover:bg-sky-50/40 dark:hover:bg-slate-800/60'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                processFilesUpload(e.target.files);
                            }
                        }}
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                            <Loader2 className="w-7 h-7 text-sky-600 animate-spin" />
                            <p className="text-xs font-black text-sky-700 dark:text-sky-300">
                                {uploadProgressText || 'در حال آپلود و ذخیره‌سازی...'}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                                <Upload className="w-5 h-5" />
                            </div>
                            <div className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                                انتخاب یا رها کردن فایل برای «{currentCatMeta.label} — {effectiveSubLabel}»
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                پشتیبانی از تصاویر (JPG, PNG, WebP) و فایل PDF — {currentCatMeta.supportsMultiPage ? 'امکان انتخاب همزمان چند صفحه وجود دارد' : 'امکان انتخاب همزمان پشت و رو وجود دارد'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Upload Feedback Banner */}
                {feedbackMsg && (
                    <div
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
                            feedbackMsg.type === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                                : feedbackMsg.type === 'warning'
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {feedbackMsg.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                            )}
                            <span>{feedbackMsg.text}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFeedbackMsg(null)}
                            className="p-1 hover:bg-black/5 rounded cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Pills & Gallery */}
            <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setFilterCategory('ALL')}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                                filterCategory === 'ALL'
                                    ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            همه مدارک ({toPersianDigits(docs.length)})
                        </button>
                        {DOCUMENT_UPLOAD_CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setFilterCategory(cat.id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                    filterCategory === cat.id
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                {getCategoryIcon(cat.id, 'w-3.5 h-3.5')}
                                <span>{cat.label}</span>
                                <span className="font-mono opacity-80">
                                    ({toPersianDigits(countByCategory[cat.id] || 0)})
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {isLoadingList ? (
                    <div className="p-8 text-center text-xs font-bold text-slate-500">
                        در حال بارگذاری مدارک ذخیره‌شده...
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-1.5">
                        <p className="text-xs font-black text-slate-600 dark:text-slate-300">
                            هنوز مدرکی در این بخش بارگذاری نشده است
                        </p>
                        <p className="text-[11px] text-slate-400">
                            نوع مدرک را از بالا انتخاب کنید و تصویر یا PDF صفحات شناسنامه، کارت ملی، گذرنامه، گواهینامه یا کارت بانکی را بارگذاری نمایید.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredDocs.map((doc) => {
                            const meta = getCategoryMeta(doc.category);
                            const isPdf = doc.mimeType?.includes('pdf');
                            const isRetrying = Boolean(retryingIds[doc.id]);

                            return (
                                <div
                                    key={doc.id}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs flex flex-col"
                                >
                                    {/* Thumbnail / Preview Area */}
                                    <div
                                        onClick={() => openPreview(doc.id)}
                                        className="relative h-40 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer group"
                                    >
                                        {isPdf ? (
                                            <div className="flex flex-col items-center gap-1.5 text-rose-600 dark:text-rose-400">
                                                <FileText className="w-10 h-10" />
                                                <span className="text-[11px] font-black">فایل PDF</span>
                                            </div>
                                        ) : (
                                            <img
                                                src={doc.dataUrl}
                                                alt={doc.subLabel}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            />
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/35 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <span className="px-3 py-1.5 rounded-xl bg-white/95 text-slate-900 text-[11px] font-black inline-flex items-center gap-1 shadow-md">
                                                <Eye className="w-3.5 h-3.5 text-sky-600" />
                                                <span>مشاهده بزرگ‌نمایی</span>
                                            </span>
                                        </div>

                                        {/* Category & Sync Badges */}
                                        <div className="absolute top-2 right-2 flex items-center gap-1">
                                            <span className="px-2 py-0.5 rounded-lg bg-slate-900/80 text-white text-[10px] font-black inline-flex items-center gap-1">
                                                {getCategoryIcon(doc.category, 'w-3 h-3')}
                                                <span>{meta.label}</span>
                                            </span>
                                        </div>

                                        <div className="absolute top-2 left-2">
                                            {doc.syncStatus === 'UPLOADED' ? (
                                                <span
                                                    title="آپلود شده روی سرور + نسخه محلی"
                                                    className="px-2 py-0.5 rounded-lg bg-emerald-600/90 text-white text-[10px] font-bold inline-flex items-center gap-1"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>ارسال شده</span>
                                                </span>
                                            ) : doc.syncStatus === 'UPLOADING' ? (
                                                <span className="px-2 py-0.5 rounded-lg bg-sky-600/90 text-white text-[10px] font-bold inline-flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    <span>در حال ارسال</span>
                                                </span>
                                            ) : (
                                                <span
                                                    title={doc.lastError || 'ذخیره شده در حافظه محلی'}
                                                    className="px-2 py-0.5 rounded-lg bg-amber-500/95 text-white text-[10px] font-bold inline-flex items-center gap-1"
                                                >
                                                    <CloudOff className="w-3 h-3" />
                                                    <span>ذخیره محلی</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Metadata & Controls */}
                                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <select
                                                    value={
                                                        meta.defaultSubLabels.includes(doc.subLabel)
                                                            ? doc.subLabel
                                                            : '__CUSTOM__'
                                                    }
                                                    onChange={(e) => {
                                                        if (e.target.value !== '__CUSTOM__') {
                                                            handleChangeDocSubLabel(doc, e.target.value);
                                                        }
                                                    }}
                                                    className="flex-1 px-2 py-1 text-[11px] font-black rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                                                >
                                                    {meta.defaultSubLabels.map((lbl) => (
                                                        <option key={lbl} value={lbl}>
                                                            {lbl}
                                                        </option>
                                                    ))}
                                                    {!meta.defaultSubLabels.includes(doc.subLabel) && (
                                                        <option value="__CUSTOM__">{doc.subLabel}</option>
                                                    )}
                                                </select>
                                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                                    {formatFileSize(doc.fileSize)}
                                                </span>
                                            </div>

                                            <div className="text-[10px] text-slate-400 truncate" dir="ltr">
                                                {doc.fileName}
                                            </div>

                                            {doc.notes && (
                                                <div className="text-[10.5px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded-lg">
                                                    {doc.notes}
                                                </div>
                                            )}

                                            {doc.extractedData && (
                                                <div className="p-2 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                                                    <div className="text-[10px] font-black text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 shrink-0" />
                                                        <span>اطلاعات استخراج‌شده از مدرک:</span>
                                                    </div>
                                                    <div className="text-[10px] text-emerald-900 dark:text-emerald-300 leading-relaxed flex flex-wrap gap-x-2.5 gap-y-0.5">
                                                        {doc.extractedData.fullName && (
                                                            <span>نام: <strong>{doc.extractedData.fullName}</strong></span>
                                                        )}
                                                        {doc.extractedData.nationalId && (
                                                            <span>کد ملی: <strong className="font-mono">{toPersianDigits(doc.extractedData.nationalId)}</strong></span>
                                                        )}
                                                        {doc.extractedData.shenasnameNumber && (
                                                            <span>ش.ش: <strong className="font-mono">{toPersianDigits(doc.extractedData.shenasnameNumber)}</strong></span>
                                                        )}
                                                        {doc.extractedData.fatherName && (
                                                            <span>پدر: <strong>{doc.extractedData.fatherName}</strong></span>
                                                        )}
                                                        {doc.extractedData.birthDateSolar && (
                                                            <span>تولد: <strong className="font-mono">{toPersianDigits(doc.extractedData.birthDateSolar)}</strong></span>
                                                        )}
                                                    </div>
                                                    {onAutoFillFromDocument && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!doc.extractedData) return;
                                                                const filled = onAutoFillFromDocument(doc.extractedData, doc);
                                                                setFeedbackMsg({
                                                                    type: 'success',
                                                                    text:
                                                                        Array.isArray(filled) && filled.length > 0
                                                                            ? `اطلاعات مدرک (${filled.join('، ')}) مجدداً روی ${autoFillRoleLabel} اعمال شد.`
                                                                            : `اطلاعات مدرک روی ${autoFillRoleLabel} اعمال شد.`
                                                                });
                                                            }}
                                                            className="w-full py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black cursor-pointer flex items-center justify-center gap-1"
                                                        >
                                                            <Sparkles className="w-3 h-3" />
                                                            <span>تکمیل خودکار {autoFillRoleLabel} از این مدرک</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {doc.syncStatus !== 'UPLOADED' && doc.lastError && (
                                                <div className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg line-clamp-2">
                                                    {doc.lastError}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openPreview(doc.id)}
                                                    className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-[10.5px] font-bold hover:bg-sky-100 cursor-pointer inline-flex items-center gap-1"
                                                    title="پیش‌نمایش"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    <span>مشاهده</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadDoc(doc)}
                                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                                                    title="دانلود فایل"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </button>
                                                {!isPdf && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePrintDoc(doc)}
                                                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                                                        title="چاپ تصویر"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {doc.syncStatus !== 'UPLOADED' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRetrySingle(doc.id)}
                                                        disabled={isRetrying}
                                                        className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1 disabled:opacity-60"
                                                        title="ارسال مجدد به سرور"
                                                    >
                                                        {isRetrying ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="w-3 h-3" />
                                                        )}
                                                        <span>ارسال</span>
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                                    title="حذف مدرک"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lightbox Preview Modal */}
            {previewDoc && (
                <div
                    className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-xs flex flex-col p-3 sm:p-6"
                    dir="rtl"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white px-4 py-3 rounded-2xl border border-slate-700 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                            {getCategoryIcon(previewDoc.category, 'w-5 h-5 text-sky-400 shrink-0')}
                            <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-black truncate">
                                    {getCategoryMeta(previewDoc.category).label} — {previewDoc.subLabel}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                    {previewDoc.fileName} ({formatFileSize(previewDoc.fileSize)})
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {!previewDoc.mimeType?.includes('pdf') && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
                                        title="کوچک‌نمایی"
                                    >
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-mono px-1.5">
                                        {toPersianDigits(Math.round(previewZoom * 100))}٪
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
                                        title="بزرگ‌نمایی"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewRotation((r) => (r + 90) % 360)}
                                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
                                        title="چرخش ۹۰ درجه"
                                    >
                                        <RotateCw className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePrintDoc(previewDoc)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold cursor-pointer"
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span>چاپ</span>
                                    </button>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={() => handleDownloadDoc(previewDoc)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                <span>دانلود</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewDocId(null)}
                                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 cursor-pointer"
                                title="بستن"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="relative flex-1 bg-slate-900/70 rounded-2xl border border-slate-800 overflow-auto flex items-center justify-center p-4">
                        {filteredDocs.length > 1 && previewIndex > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewDocId(filteredDocs[previewIndex - 1].id);
                                    setPreviewZoom(1);
                                    setPreviewRotation(0);
                                }}
                                className="fixed right-6 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white shadow-lg cursor-pointer"
                                title="مدرک قبلی"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        )}

                        {previewDoc.mimeType?.includes('pdf') ? (
                            <iframe
                                src={previewDoc.dataUrl}
                                title={previewDoc.subLabel}
                                className="w-full h-full min-h-[70vh] rounded-xl bg-white"
                            />
                        ) : (
                            <img
                                src={previewDoc.dataUrl}
                                alt={previewDoc.subLabel}
                                style={{
                                    transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`,
                                    transition: 'transform 0.2s ease'
                                }}
                                className="max-w-full max-h-[78vh] object-contain rounded-lg shadow-2xl"
                            />
                        )}

                        {filteredDocs.length > 1 && previewIndex < filteredDocs.length - 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewDocId(filteredDocs[previewIndex + 1].id);
                                    setPreviewZoom(1);
                                    setPreviewRotation(0);
                                }}
                                className="fixed left-6 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white shadow-lg cursor-pointer"
                                title="مدرک بعدی"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
