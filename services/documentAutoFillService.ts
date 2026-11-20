import type { DocumentDossier } from '../types/bankLetter';
import type { LeasingPersonInfo } from '../types/leasing';
import type { ExtractedIdentityDocumentData } from '../types/uploads';
import { toEnglishDigits } from './bankLetterValidation';

const COMPOUND_FIRST_NAME_PREFIXES = new Set([
    'سید',
    'سیده',
    'سیدمحمد',
    'سیدعلی',
    'امیر',
    'محمد',
    'علی',
    'غلام',
    'عبد',
    'روح',
    'نور',
    'حاج',
    'زهرا',
    'فاطمه'
]);

const cleanText = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    return String(val).replace(/\u200c/g, ' ').replace(/\s+/g, ' ').trim();
};

const cleanNumericCode = (val: unknown): string => {
    return toEnglishDigits(cleanText(val)).replace(/\D/g, '');
};

const cleanDateSolar = (val: unknown): string => {
    if (!val) return '';
    if (typeof val === 'object') {
        const obj = val as Record<string, unknown>;
        return cleanDateSolar(obj.solar_hijri || obj.shamsi || obj.date || obj.value || '');
    }
    const normalized = toEnglishDigits(cleanText(val)).replace(/[-.]/g, '/');
    return normalized;
};

const normalizeGender = (val: unknown): 'MALE' | 'FEMALE' | undefined => {
    const s = cleanText(val).toUpperCase();
    if (!s) return undefined;
    if (s === 'FEMALE' || s === 'F' || s.includes('زن') || s.includes('مونث') || s.includes('خانم')) {
        return 'FEMALE';
    }
    if (s === 'MALE' || s === 'M' || s.includes('مرد') || s.includes('مذکر') || s.includes('آقا')) {
        return 'MALE';
    }
    return undefined;
};

/**
 * Unwraps nested/array webhook JSON payloads and normalizes identity fields
 * returned for SHENASNAMEH (شناسنامه) and NATIONAL_CARD (کارت ملی).
 */
export const parseExtractedIdentityResponse = (
    rawJson: unknown
): ExtractedIdentityDocumentData | null => {
    if (!rawJson) return null;

    let candidate: Record<string, unknown> | null = null;
    if (Array.isArray(rawJson)) {
        candidate = (rawJson.find((item) => item && typeof item === 'object') as Record<string, unknown>) || null;
    } else if (typeof rawJson === 'object') {
        candidate = rawJson as Record<string, unknown>;
    }
    if (!candidate) return null;

    // Unwrap common webhook envelopes: { data: ... }, { result: ... }, { output: ... }
    for (const key of ['data', 'result', 'output', 'ocr', 'extracted']) {
        const nested = candidate[key];
        if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
            const nestedObj = nested as Record<string, unknown>;
            if (
                'document_details' in nestedObj ||
                'document_type' in nestedObj ||
                'national_id' in nestedObj ||
                'full_name' in nestedObj
            ) {
                candidate = nestedObj;
                break;
            }
        }
    }

    const details =
        candidate.document_details && typeof candidate.document_details === 'object'
            ? (candidate.document_details as Record<string, unknown>)
            : candidate;

    const placeOfBirth =
        details.place_of_birth && typeof details.place_of_birth === 'object'
            ? (details.place_of_birth as Record<string, unknown>)
            : undefined;
    const placeOfIssue =
        details.place_of_issue && typeof details.place_of_issue === 'object'
            ? (details.place_of_issue as Record<string, unknown>)
            : undefined;
    const fatherDetails =
        details.father_details && typeof details.father_details === 'object'
            ? (details.father_details as Record<string, unknown>)
            : undefined;
    const motherDetails =
        details.mother_details && typeof details.mother_details === 'object'
            ? (details.mother_details as Record<string, unknown>)
            : undefined;

    const rawDocType = cleanText(candidate.document_type || details.document_type).toUpperCase();
    const nationalId = cleanNumericCode(
        details.national_id || details.national_code || details.nationalCode || details.nin
    );
    const shenasnameNumber = cleanNumericCode(
        details.shenasname_number || details.id_number || details.certificate_number || details.idNumber
    );
    const firstName = cleanText(details.first_name || details.firstName);
    const lastName = cleanText(details.last_name || details.lastName);
    const fullName =
        cleanText(details.full_name || details.fullName || details.name) ||
        [firstName, lastName].filter(Boolean).join(' ');
    const fatherName = cleanText(details.father_name || details.fatherName || fatherDetails?.name);
    const birthDateSolar = cleanDateSolar(details.birth_date || details.birthDate);
    const issueDateSolar = cleanDateSolar(details.issue_date || details.issueDate || details.id_issue_date);

    const birthCity = cleanText(placeOfBirth?.city || details.birth_city);
    const birthProvince = cleanText(placeOfBirth?.province || details.birth_province);
    const birthCounty = cleanText(placeOfBirth?.county || details.birth_county);

    const issueCity = cleanText(
        placeOfIssue?.city || details.issue_place || details.issuePlace || details.issuance_place
    );
    const issueProvince = cleanText(placeOfIssue?.province || details.issue_province);
    const issueCounty = cleanText(placeOfIssue?.county || details.issue_county);

    const postalCode = cleanNumericCode(details.postal_code || details.postalCode);
    const address = cleanText(details.address || details.full_address || details.residence_address);
    const gender = normalizeGender(details.gender || details.sex);

    const fatherNationalId = cleanNumericCode(fatherDetails?.national_id || fatherDetails?.national_code);
    const motherName = cleanText(motherDetails?.name);
    const motherNationalId = cleanNumericCode(motherDetails?.national_id || motherDetails?.national_code);

    const hasMeaningfulField = Boolean(
        nationalId ||
            shenasnameNumber ||
            fullName ||
            firstName ||
            lastName ||
            fatherName ||
            birthDateSolar ||
            birthCity ||
            issueCity ||
            postalCode ||
            address
    );

    if (!hasMeaningfulField) {
        return null;
    }

    return {
        documentType: rawDocType || (shenasnameNumber ? 'SHENASNAMEH' : 'NATIONAL_CARD'),
        nationalId: nationalId || undefined,
        shenasnameNumber: shenasnameNumber || undefined,
        fullName: fullName || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        fatherName: fatherName || undefined,
        birthDateSolar: birthDateSolar || undefined,
        issueDateSolar: issueDateSolar || undefined,
        birthCity: birthCity || undefined,
        birthProvince: birthProvince || undefined,
        birthCounty: birthCounty || undefined,
        issueCity: issueCity || undefined,
        issueProvince: issueProvince || undefined,
        issueCounty: issueCounty || undefined,
        postalCode: postalCode || undefined,
        address: address || undefined,
        gender,
        fatherNationalId: fatherNationalId || undefined,
        motherName: motherName || undefined,
        motherNationalId: motherNationalId || undefined,
        rawResponse: rawJson
    };
};

/**
 * Splits a Persian full name into firstName + lastName sensibly.
 * Handles common multi-word first names like "سید عنایت", "محمد رضا", etc.
 */
export const splitPersianFullName = (
    fullName: string
): { firstName: string; lastName: string } => {
    const parts = cleanText(fullName).split(' ').filter(Boolean);
    if (parts.length === 0) return { firstName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };

    // When >= 3 words, keep compound first-name prefixes (e.g. "سید علی حسینی" -> "سید علی" / "حسینی")
    if (COMPOUND_FIRST_NAME_PREFIXES.has(parts[0])) {
        return {
            firstName: `${parts[0]} ${parts[1]}`,
            lastName: parts.slice(2).join(' ')
        };
    }

    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' ')
    };
};

/**
 * Applies extracted National Card / Shenasnameh fields to the Unified Document Dossier.
 */
export const applyExtractedIdentityToDossier = (
    prev: DocumentDossier,
    data: ExtractedIdentityDocumentData,
    targetRole: 'customer' | 'seller' = 'customer'
): { next: DocumentDossier; filledFields: string[] } => {
    const next = { ...prev };
    const filledFields: string[] = [];

    const fullName = data.fullName || [data.firstName, data.lastName].filter(Boolean).join(' ');
    const issuePlace =
        data.issueCity || data.birthCity || data.issueCounty || data.birthCounty || data.birthProvince || '';

    if (targetRole === 'seller') {
        if (data.gender) {
            next.sellerTitle = data.gender === 'FEMALE' ? 'خانم' : 'آقای';
        }
        if (fullName) {
            next.sellerName = fullName;
            filledFields.push('نام و نام خانوادگی فروشنده');
        }
        if (data.fatherName) {
            next.sellerFatherName = data.fatherName;
            filledFields.push('نام پدر فروشنده');
        }
        if (data.nationalId) {
            next.sellerNationalCode = data.nationalId;
            filledFields.push('کد ملی فروشنده');
        }
        if (data.shenasnameNumber) {
            next.sellerIdNumber = data.shenasnameNumber;
            filledFields.push('شماره شناسنامه فروشنده');
        }
        if (issuePlace) {
            next.sellerIssuePlace = issuePlace;
            filledFields.push('محل صدور فروشنده');
        }
        if (data.postalCode) {
            next.sellerPostalCode = data.postalCode;
            filledFields.push('کد پستی فروشنده');
        }
        if (data.address) {
            next.sellerAddress = data.address;
            filledFields.push('نشانی فروشنده');
        }
        return { next, filledFields };
    }

    if (data.gender && next.customerTitle !== 'شرکت') {
        next.customerTitle = data.gender === 'FEMALE' ? 'خانم' : 'آقای';
    }
    if (fullName) {
        next.customerName = fullName;
        filledFields.push('نام و نام خانوادگی');
    }
    if (data.fatherName) {
        next.customerFatherName = data.fatherName;
        filledFields.push('نام پدر');
    }
    if (data.nationalId) {
        next.customerNationalCode = data.nationalId;
        filledFields.push('کد ملی');
    }
    if (data.shenasnameNumber) {
        next.customerIdNumber = data.shenasnameNumber;
        filledFields.push('شماره شناسنامه');
    }
    if (issuePlace) {
        next.customerIssuePlace = issuePlace;
        filledFields.push('صادره از');
    }
    if (data.postalCode) {
        next.customerPostalCode = data.postalCode;
        filledFields.push('کد پستی');
    }
    if (data.address) {
        next.customerAddress = data.address;
        filledFields.push('نشانی');
    }

    return { next, filledFields };
};

/**
 * Applies extracted National Card / Shenasnameh fields to a Leasing Person (Buyer or Guarantor).
 */
export const applyExtractedIdentityToLeasingPerson = (
    prev: LeasingPersonInfo,
    data: ExtractedIdentityDocumentData
): { next: LeasingPersonInfo; filledFields: string[] } => {
    const next: LeasingPersonInfo = {
        ...prev,
        address: { ...prev.address }
    };
    const filledFields: string[] = [];

    if (data.gender) {
        next.title = data.gender === 'FEMALE' ? 'خانم' : 'آقای';
    }

    let firstName = data.firstName || '';
    let lastName = data.lastName || '';
    if ((!firstName || !lastName) && data.fullName) {
        const split = splitPersianFullName(data.fullName);
        if (!firstName) firstName = split.firstName;
        if (!lastName) lastName = split.lastName;
    }

    if (firstName) {
        next.firstName = firstName;
        filledFields.push('نام');
    }
    if (lastName) {
        next.lastName = lastName;
        filledFields.push('نام خانوادگی');
    }
    if (data.fatherName) {
        next.fatherName = data.fatherName;
        filledFields.push('نام پدر');
    }
    if (data.nationalId) {
        next.nationalCode = data.nationalId;
        filledFields.push('کد ملی');
    }
    if (data.shenasnameNumber) {
        next.idNumber = data.shenasnameNumber;
        filledFields.push('شماره شناسنامه');
    }
    if (data.birthDateSolar) {
        next.birthDate = data.birthDateSolar;
        filledFields.push('تاریخ تولد');
    }
    if (data.issueDateSolar) {
        next.idIssueDate = data.issueDateSolar;
        filledFields.push('تاریخ صدور شناسنامه');
    }

    const effectiveIssuePlace = data.issueCity || data.birthCity || data.issueCounty || data.birthCounty || '';
    if (effectiveIssuePlace) {
        next.issuePlace = effectiveIssuePlace;
        filledFields.push('صادره از');
    }

    const birthProv = data.birthProvince || data.birthCity || '';
    const birthCounty = data.birthCounty || data.birthCity || '';
    if (birthProv) {
        next.birthProvince = birthProv;
        filledFields.push('استان محل تولد');
    }
    if (birthCounty) {
        next.birthCounty = birthCounty;
        filledFields.push('شهرستان محل تولد');
    }

    const issueProv = data.issueProvince || data.birthProvince || data.issueCity || data.birthCity || '';
    const issueCounty = data.issueCounty || data.birthCounty || data.issueCity || data.birthCity || '';
    if (issueProv) {
        next.issueProvince = issueProv;
    }
    if (issueCounty) {
        next.issueCounty = issueCounty;
    }

    if (data.postalCode) {
        next.address.postalCode = data.postalCode;
        filledFields.push('کد پستی');
    }
    if (data.address) {
        next.address.fullAddressText = data.address;
        filledFields.push('نشانی');
    }

    return { next, filledFields };
};
