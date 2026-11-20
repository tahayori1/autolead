export type IdentityDocumentCategory =
    | 'SHENASNAMEH'
    | 'NATIONAL_CARD'
    | 'PASSPORT'
    | 'DRIVING_LICENSE'
    | 'BANK_CARD';

export type UploadSyncStatus = 'UPLOADING' | 'UPLOADED' | 'LOCAL_PENDING' | 'FAILED';

export type UploadScopeType = 'DOSSIER' | 'LEASING' | 'LEAD';

export interface ExtractedIdentityDocumentData {
    documentType: 'SHENASNAMEH' | 'NATIONAL_CARD' | string;
    nationalId?: string;
    shenasnameNumber?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    fatherName?: string;
    birthDateSolar?: string;
    issueDateSolar?: string;
    birthCity?: string;
    birthProvince?: string;
    birthCounty?: string;
    issueCity?: string;
    issueProvince?: string;
    issueCounty?: string;
    postalCode?: string;
    address?: string;
    gender?: 'MALE' | 'FEMALE';
    fatherNationalId?: string;
    motherName?: string;
    motherNationalId?: string;
    rawResponse?: unknown;
}

export interface UploadedIdentityDocument {
    id: string;
    scopeKey: string; // `${scopeType}:${scopeId}`
    scopeType: UploadScopeType;
    scopeId: string;
    nationalCode?: string;
    customerName?: string;
    phone?: string;

    category: IdentityDocumentCategory;
    subLabel: string; // e.g., 'روی کارت ملی' | 'پشت کارت ملی' | 'صفحه اول (مشخصات اصلی)'
    pageNumber?: number;
    notes?: string;

    fileName: string;
    mimeType: string;
    fileSize: number;
    dataUrl: string; // Full local copy stored safely in IndexedDB
    remoteUrl?: string;
    remoteId?: string;
    extractedData?: ExtractedIdentityDocumentData;

    syncStatus: UploadSyncStatus;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
}
