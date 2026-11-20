import { db } from './db';
import type {
    ExtractedIdentityDocumentData,
    IdentityDocumentCategory,
    UploadScopeType,
    UploadedIdentityDocument
} from '../types/uploads';
import { parseExtractedIdentityResponse } from './documentAutoFillService';

export const UPLOADS_API_ENDPOINT =
    'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/uploads/';

export interface DocumentCategoryMeta {
    id: IdentityDocumentCategory;
    label: string;
    shortDesc: string;
    supportsMultiPage: boolean;
    defaultSubLabels: string[];
    maxHint: string;
}

export const DOCUMENT_UPLOAD_CATEGORIES: DocumentCategoryMeta[] = [
    {
        id: 'SHENASNAMEH',
        label: 'شناسنامه',
        shortDesc: 'تمامی صفحات شناسنامه (صفحه اول، توضیحات، ازدواج و فرزندان)',
        supportsMultiPage: true,
        defaultSubLabels: [
            'صفحه اول (مشخصات اصلی)',
            'صفحه دوم (ازدواج و فرزندان)',
            'صفحه سوم (توضیحات)',
            'صفحه چهارم (توضیحات تکمیلی)',
            'سایر صفحات شناسنامه'
        ],
        maxHint: 'امکان انتخاب چند صفحه همزمان'
    },
    {
        id: 'NATIONAL_CARD',
        label: 'کارت ملی',
        shortDesc: 'تصویر روی کارت ملی و پشت کارت ملی',
        supportsMultiPage: false,
        defaultSubLabels: ['روی کارت ملی', 'پشت کارت ملی'],
        maxHint: 'پشت و رو (۲ تصویر)'
    },
    {
        id: 'PASSPORT',
        label: 'گذرنامه',
        shortDesc: 'صفحه مشخصات اصلی و صفحات ویزا / مهر ورود و خروج',
        supportsMultiPage: true,
        defaultSubLabels: [
            'صفحه مشخصات اصلی گذرنامه',
            'صفحات ویزا و مهرهای خروج/ورود',
            'سایر صفحات گذرنامه'
        ],
        maxHint: 'تک یا چند صفحه'
    },
    {
        id: 'DRIVING_LICENSE',
        label: 'گواهینامه رانندگی',
        shortDesc: 'تصویر روی و پشت گواهینامه معتبر رانندگی',
        supportsMultiPage: false,
        defaultSubLabels: ['روی گواهینامه رانندگی', 'پشت گواهینامه رانندگی'],
        maxHint: 'پشت و رو (۲ تصویر)'
    },
    {
        id: 'BANK_CARD',
        label: 'کارت بانکی (عابربانک)',
        shortDesc: 'تصویر کارت عابربانک (جهت تطبیق شماره کارت و شبا)',
        supportsMultiPage: false,
        defaultSubLabels: ['روی کارت عابربانک', 'پشت کارت عابربانک'],
        maxHint: 'روی کارت (و در صورت نیاز پشت کارت)'
    }
];

export const getCategoryMeta = (category: IdentityDocumentCategory): DocumentCategoryMeta => {
    return (
        DOCUMENT_UPLOAD_CATEGORIES.find((c) => c.id === category) ||
        DOCUMENT_UPLOAD_CATEGORIES[0]
    );
};

export const makeScopeKey = (scopeType: UploadScopeType, scopeId: string): string =>
    `${scopeType}:${String(scopeId || 'default').trim()}`;

export const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getAuthToken = (): string | null => {
    try {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    } catch {
        return null;
    }
};

const FALLBACK_LOCAL_KEY = 'hk_identity_uploads_fallback_v1';

const readFallbackStorage = (): UploadedIdentityDocument[] => {
    try {
        const raw = localStorage.getItem(FALLBACK_LOCAL_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeFallbackStorage = (docs: UploadedIdentityDocument[]) => {
    try {
        localStorage.setItem(FALLBACK_LOCAL_KEY, JSON.stringify(docs.slice(0, 30)));
    } catch {
        // Ignore quota errors on emergency fallback storage
    }
};

const saveRecordLocally = async (record: UploadedIdentityDocument): Promise<void> => {
    try {
        await db.identityUploads.put(record);
    } catch {
        const current = readFallbackStorage().filter((d) => d.id !== record.id);
        current.unshift(record);
        writeFallbackStorage(current);
    }
};

const updateRecordLocally = async (
    id: string,
    patch: Partial<UploadedIdentityDocument>
): Promise<UploadedIdentityDocument | null> => {
    try {
        const existing = await db.identityUploads.get(id);
        if (existing) {
            const updated: UploadedIdentityDocument = {
                ...existing,
                ...patch,
                updatedAt: new Date().toISOString()
            };
            await db.identityUploads.put(updated);
            return updated;
        }
    } catch {
        // Fall through to localStorage fallback
    }

    const fallback = readFallbackStorage();
    const idx = fallback.findIndex((d) => d.id === id);
    if (idx !== -1) {
        const updated: UploadedIdentityDocument = {
            ...fallback[idx],
            ...patch,
            updatedAt: new Date().toISOString()
        };
        fallback[idx] = updated;
        writeFallbackStorage(fallback);
        return updated;
    }
    return null;
};

export const listUploadedDocuments = async (
    scopeType: UploadScopeType,
    scopeId: string,
    nationalCode?: string
): Promise<UploadedIdentityDocument[]> => {
    const scopeKey = makeScopeKey(scopeType, scopeId);
    const cleanNc = (nationalCode || '').replace(/\D/g, '');
    const map = new Map<string, UploadedIdentityDocument>();

    try {
        const byScope = await db.identityUploads.where('scopeKey').equals(scopeKey).toArray();
        for (const item of byScope) {
            map.set(item.id, item);
        }
        if (cleanNc.length >= 8) {
            const byNc = await db.identityUploads.where('nationalCode').equals(cleanNc).toArray();
            for (const item of byNc) {
                if (!map.has(item.id)) map.set(item.id, item);
            }
        }
    } catch {
        const fallback = readFallbackStorage();
        for (const item of fallback) {
            if (
                item.scopeKey === scopeKey ||
                (cleanNc.length >= 8 && (item.nationalCode || '').replace(/\D/g, '') === cleanNc)
            ) {
                map.set(item.id, item);
            }
        }
    }

    return Array.from(map.values()).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
    );
};

export const dataUrlToBlob = (dataUrl: string, fallbackMime = 'application/octet-stream'): Blob => {
    const parts = dataUrl.split(',');
    if (parts.length < 2) {
        return new Blob([], { type: fallbackMime });
    }
    const header = parts[0];
    const mimeMatch = header.match(/data:([^;]+);base64/i);
    const mime = mimeMatch ? mimeMatch[1] : fallbackMime;
    const binary = atob(parts[1]);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
};

const readRawFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('خطا در خواندن محتوای فایل'));
            }
        };
        reader.onerror = () => reject(new Error('خطا در خواندن فایل انتخابی'));
        reader.readAsDataURL(file);
    });

export const readFileAsDataUrlWithOptionalOptimize = async (
    file: File
): Promise<{ dataUrl: string; mimeType: string; fileSize: number }> => {
    const maxAllowedBytes = 25 * 1024 * 1024;
    if (file.size > maxAllowedBytes) {
        throw new Error('حجم فایل نباید بیشتر از ۲۵ مگابایت باشد.');
    }

    const rawDataUrl = await readRawFileAsDataUrl(file);
    const inferredMime =
        file.type ||
        (file.name.toLowerCase().endsWith('.pdf')
            ? 'application/pdf'
            : 'image/jpeg');

    const isRasterImage =
        inferredMime.startsWith('image/') &&
        !inferredMime.includes('svg') &&
        !inferredMime.includes('gif');

    // Keep small images (< 1.2MB) and PDFs untouched for crisp text legibility
    if (!isRasterImage || file.size <= 1.2 * 1024 * 1024) {
        return {
            dataUrl: rawDataUrl,
            mimeType: inferredMime,
            fileSize: file.size
        };
    }

    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('خطا در پردازش تصویر'));
            image.src = rawDataUrl;
        });

        const maxDim = 1800;
        let targetW = img.width;
        let targetH = img.height;
        if (targetW > maxDim || targetH > maxDim) {
            if (targetW >= targetH) {
                targetH = Math.round((targetH * maxDim) / targetW);
                targetW = maxDim;
            } else {
                targetW = Math.round((targetW * maxDim) / targetH);
                targetH = maxDim;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return { dataUrl: rawDataUrl, mimeType: inferredMime, fileSize: file.size };
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const compressedUrl = canvas.toDataURL('image/jpeg', 0.86);
        const estimatedBytes = Math.round((compressedUrl.length * 3) / 4);
        if (estimatedBytes < file.size) {
            return {
                dataUrl: compressedUrl,
                mimeType: 'image/jpeg',
                fileSize: estimatedBytes
            };
        }
        return { dataUrl: rawDataUrl, mimeType: inferredMime, fileSize: file.size };
    } catch {
        // Always fallback safely to raw dataUrl
        return {
            dataUrl: rawDataUrl,
            mimeType: inferredMime,
            fileSize: file.size
        };
    }
};

export interface RemoteUploadResult {
    ok: boolean;
    remoteUrl?: string;
    remoteId?: string;
    extractedData?: ExtractedIdentityDocumentData;
    errorMessage?: string;
}

export const uploadDocumentToRemoteApi = async (
    doc: UploadedIdentityDocument
): Promise<RemoteUploadResult> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
        const blob = dataUrlToBlob(doc.dataUrl, doc.mimeType || 'image/jpeg');
        const formData = new FormData();
        formData.append('file', blob, doc.fileName);
        formData.append('id', doc.id);
        formData.append('category', doc.category);
        formData.append('categoryLabel', getCategoryMeta(doc.category).label);
        formData.append('subLabel', doc.subLabel || '');
        if (doc.pageNumber !== undefined) {
            formData.append('pageNumber', String(doc.pageNumber));
        }
        formData.append('scopeType', doc.scopeType);
        formData.append('scopeId', doc.scopeId);
        if (doc.nationalCode) formData.append('nationalCode', doc.nationalCode);
        if (doc.customerName) formData.append('customerName', doc.customerName);
        if (doc.phone) formData.append('phone', doc.phone);
        if (doc.notes) formData.append('notes', doc.notes);
        formData.append('fileName', doc.fileName);
        formData.append('mimeType', doc.mimeType);

        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(UPLOADS_API_ENDPOINT, {
            method: 'POST',
            headers,
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            let errText = '';
            try {
                errText = (await res.text()).slice(0, 200);
            } catch {
                // ignore body read errors
            }
            return {
                ok: false,
                errorMessage: `خطای سرور (${res.status})${errText ? `: ${errText}` : ''}`
            };
        }

        let remoteUrl: string | undefined;
        let remoteId: string | undefined;
        let extractedData: ExtractedIdentityDocumentData | undefined;

        try {
            const rawText = await res.text();
            if (rawText && rawText.trim()) {
                const json = JSON.parse(rawText);
                const firstObj = Array.isArray(json) ? json[0] : json;
                remoteUrl =
                    firstObj?.url ||
                    firstObj?.fileUrl ||
                    firstObj?.file_url ||
                    firstObj?.path ||
                    firstObj?.data?.url ||
                    firstObj?.data?.fileUrl;
                remoteId =
                    firstObj?.id ||
                    firstObj?.fileId ||
                    firstObj?.file_id ||
                    firstObj?.data?.id;
                if (remoteId !== undefined) remoteId = String(remoteId);

                const parsedIdentity = parseExtractedIdentityResponse(json);
                if (parsedIdentity) {
                    extractedData = parsedIdentity;
                }
            }
        } catch {
            // Non-fatal if response is plain text or empty on 2xx
        }

        return { ok: true, remoteUrl, remoteId, extractedData };
    } catch (err: unknown) {
        clearTimeout(timeoutId);
        const isAbort = err instanceof Error && err.name === 'AbortError';
        const msg = isAbort
            ? 'زمان ارسال به سرور به پایان رسید (Timeout) — فایل به‌صورت محلی ذخیره شد.'
            : err instanceof Error
            ? `خطا در ارتباط با سرور (${err.message}) — فایل به‌صورت محلی ذخیره شد.`
            : 'خطا در ارسال به سرور — فایل به‌صورت محلی ذخیره شد.';
        return { ok: false, errorMessage: msg };
    }
};

export interface UploadDocumentParams {
    file: File;
    scopeType: UploadScopeType;
    scopeId: string;
    category: IdentityDocumentCategory;
    subLabel: string;
    pageNumber?: number;
    nationalCode?: string;
    customerName?: string;
    phone?: string;
    notes?: string;
}

export const uploadAndPersistDocument = async (
    params: UploadDocumentParams
): Promise<UploadedIdentityDocument> => {
    const { dataUrl, mimeType, fileSize } = await readFileAsDataUrlWithOptionalOptimize(
        params.file
    );

    const now = new Date().toISOString();
    const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const cleanNc = (params.nationalCode || '').replace(/\D/g, '') || undefined;

    const initialRecord: UploadedIdentityDocument = {
        id,
        scopeKey: makeScopeKey(params.scopeType, params.scopeId),
        scopeType: params.scopeType,
        scopeId: String(params.scopeId || 'default'),
        nationalCode: cleanNc,
        customerName: params.customerName?.trim() || undefined,
        phone: params.phone?.trim() || undefined,
        category: params.category,
        subLabel: params.subLabel,
        pageNumber: params.pageNumber,
        notes: params.notes?.trim() || undefined,
        fileName: params.file.name,
        mimeType,
        fileSize,
        dataUrl,
        syncStatus: 'UPLOADING',
        createdAt: now,
        updatedAt: now
    };

    // Persist locally FIRST so the file is never lost even if upload fails or tab closes
    await saveRecordLocally(initialRecord);

    const apiRes = await uploadDocumentToRemoteApi(initialRecord);
    if (apiRes.ok) {
        const updated = await updateRecordLocally(id, {
            syncStatus: 'UPLOADED',
            remoteUrl: apiRes.remoteUrl,
            remoteId: apiRes.remoteId,
            extractedData: apiRes.extractedData,
            nationalCode: apiRes.extractedData?.nationalId || initialRecord.nationalCode,
            customerName:
                apiRes.extractedData?.fullName ||
                [apiRes.extractedData?.firstName, apiRes.extractedData?.lastName].filter(Boolean).join(' ') ||
                initialRecord.customerName,
            lastError: undefined
        });
        return (
            updated || {
                ...initialRecord,
                syncStatus: 'UPLOADED',
                remoteUrl: apiRes.remoteUrl,
                remoteId: apiRes.remoteId,
                extractedData: apiRes.extractedData
            }
        );
    }

    const updated = await updateRecordLocally(id, {
        syncStatus: 'LOCAL_PENDING',
        lastError: apiRes.errorMessage
    });
    return updated || { ...initialRecord, syncStatus: 'LOCAL_PENDING', lastError: apiRes.errorMessage };
};

export const retryUploadDocument = async (
    id: string
): Promise<UploadedIdentityDocument | null> => {
    let doc: UploadedIdentityDocument | undefined;
    try {
        doc = await db.identityUploads.get(id);
    } catch {
        doc = readFallbackStorage().find((d) => d.id === id);
    }
    if (!doc) return null;

    await updateRecordLocally(id, { syncStatus: 'UPLOADING', lastError: undefined });
    const apiRes = await uploadDocumentToRemoteApi(doc);
    if (apiRes.ok) {
        return updateRecordLocally(id, {
            syncStatus: 'UPLOADED',
            remoteUrl: apiRes.remoteUrl,
            remoteId: apiRes.remoteId,
            extractedData: apiRes.extractedData || doc.extractedData,
            nationalCode: apiRes.extractedData?.nationalId || doc.nationalCode,
            customerName:
                apiRes.extractedData?.fullName ||
                [apiRes.extractedData?.firstName, apiRes.extractedData?.lastName].filter(Boolean).join(' ') ||
                doc.customerName,
            lastError: undefined
        });
    }
    return updateRecordLocally(id, {
        syncStatus: 'LOCAL_PENDING',
        lastError: apiRes.errorMessage
    });
};

export const retryAllPendingUploads = async (
    docs: UploadedIdentityDocument[]
): Promise<{ succeeded: number; failed: number }> => {
    const pending = docs.filter((d) => d.syncStatus !== 'UPLOADED');
    let succeeded = 0;
    let failed = 0;
    for (const doc of pending) {
        const res = await retryUploadDocument(doc.id);
        if (res?.syncStatus === 'UPLOADED') {
            succeeded += 1;
        } else {
            failed += 1;
        }
    }
    return { succeeded, failed };
};

export const updateUploadedDocumentMeta = async (
    id: string,
    patch: Partial<Pick<UploadedIdentityDocument, 'category' | 'subLabel' | 'pageNumber' | 'notes'>>
): Promise<UploadedIdentityDocument | null> => {
    return updateRecordLocally(id, patch);
};

export const deleteUploadedDocument = async (id: string): Promise<void> => {
    try {
        await db.identityUploads.delete(id);
    } catch {
        // ignore
    }
    const fallback = readFallbackStorage().filter((d) => d.id !== id);
    writeFallbackStorage(fallback);
};
