import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import type { User, CrmCallLog } from '../types';
import { LeadStatus } from '../types';
import { createUser, createCallLog, createCustomerJournal, getMyProfile } from '../services/api';
import { 
    X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, 
    Instagram, Phone, MessageSquare, ArrowLeft, ArrowRight, Play, Check, AlertTriangle, Loader2 
} from 'lucide-react';

interface ExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingUsers: User[];
    onImportSuccess: () => void;
}

type ImportType = 'INSTAGRAM' | 'VOIP' | 'SMS_PANEL';

const normalizePhoneNumber = (num: any): string => {
    if (!num) return '';
    let str = String(num).trim().replace(/[\s\-\+]/g, '');
    
    // Convert Persian/Arabic digits to English
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    for (let i = 0; i < 10; i++) {
        str = str.replace(new RegExp(persianDigits[i], 'g'), String(i))
                 .replace(new RegExp(arabicDigits[i], 'g'), String(i));
    }

    // Strip non-digit chars
    str = str.replace(/\D/g, '');

    if (str.startsWith('98')) {
        str = '0' + str.substring(2);
    } else if (str.startsWith('9') && str.length === 10) {
        str = '0' + str;
    }
    
    return str;
};

const convertPersianToEnglishDigits = (str: string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let result = str;
    for (let i = 0; i < 10; i++) {
        result = result.replace(new RegExp(persianDigits[i], 'g'), String(i))
                       .replace(new RegExp(arabicDigits[i], 'g'), String(i));
    }
    return result;
};

export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
    jy = parseInt(jy.toString(), 10);
    jm = parseInt(jm.toString(), 10);
    jd = parseInt(jd.toString(), 10);
    var jy2 = (jy <= 979) ? jy + 621 : jy - 979;
    var days = (365 * jy2) + (Math.floor(jy2 / 33) * 8) + Math.floor(((jy2 % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    var gy = 1600 + (400 * Math.floor(days / 146097));
    days %= 146097;
    var leap = true;
    if (days >= 36525) {
        days--;
        gy += 100 * Math.floor(days / 36524);
        days %= 36524;
        if (days >= 365) {
            days++;
        } else {
            leap = false;
        }
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days >= 366) {
        leap = false;
        days--;
        gy += Math.floor(days / 365);
        days %= 365;
    }
    var gd = days + 1;
    var sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var gm;
    for (gm = 1; gm < 13; gm++) {
        var v = sal_a[gm];
        if (gd <= v) {
            break;
        }
        gd -= v;
    }
    return [gy, gm, gd];
}

export function parseAndConvertJalaliToGregorian(dateVal: any): string {
    if (dateVal === null || dateVal === undefined) return '';
    
    // If it's already a JS Date object
    if (dateVal instanceof Date) {
        if (!isNaN(dateVal.getTime())) {
            return dateVal.toISOString().replace('.000Z', '').replace('Z', '');
        }
    }
    
    let str = String(dateVal).trim();
    if (!str) return '';
    
    // Check if it's an Excel serial date number
    const numVal = Number(str);
    if (!isNaN(numVal) && numVal > 30000 && numVal < 100000) {
        const jsDate = new Date((numVal - 25569) * 86400 * 1000);
        if (!isNaN(jsDate.getTime())) {
            return jsDate.toISOString().replace('.000Z', '').replace('Z', '');
        }
    }

    str = convertPersianToEnglishDigits(str);

    // Regex to match Year, Month, Day separated by / or - or . or space
    const datePattern = /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/;
    const match = str.match(datePattern);
    
    if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);
        
        // Check if the year is in Jalali range
        if (year >= 1300 && year <= 1499) {
            const [gy, gm, gd] = jalaliToGregorian(year, month, day);
            
            // Try to extract time (HH:mm:ss or HH:mm)
            const timeMatch = str.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
            let timeStr = '12:00:00';
            if (timeMatch) {
                const hh = String(timeMatch[1]).padStart(2, '0');
                const mm = String(timeMatch[2]).padStart(2, '0');
                const ss = timeMatch[3] ? String(timeMatch[3]).padStart(2, '0') : '00';
                timeStr = `${hh}:${mm}:${ss}`;
            }
            
            return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}T${timeStr}`;
        }
    }
    
    // Fallback if not Jalali: check if standard Date can parse it
    try {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
            return d.toISOString().replace('.000Z', '').replace('Z', '');
        }
    } catch {}
    
    return str;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, existingUsers, onImportSuccess }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [importType, setImportType] = useState<ImportType>('INSTAGRAM');
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string>('');
    const [rawHeaders, setRawHeaders] = useState<string[]>([]);
    const [rawRows, setRawRows] = useState<any[][]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        getMyProfile().then(p => setCurrentUser(p)).catch(() => {});
    }, []);
    
    // Mapping configurations
    const [mappings, setMappings] = useState({
        phoneCol: '',
        nameCol: '',
        carModelCol: '',
        descCol: '',
        provinceCol: '',
        cityCol: '',
        registerTimeCol: ''
    });

    // Custom Batch Configurations
    const [batchRef, setBatchRef] = useState('');
    const [defaultCar, setDefaultCar] = useState('');
    const [defaultStatus, setDefaultStatus] = useState<LeadStatus>(LeadStatus.NEW);

    // Parsing state & feedback
    const [parsedRecords, setParsedRecords] = useState<Partial<User>[]>([]);
    const [parsedExistingRecords, setParsedExistingRecords] = useState<any[]>([]);
    const [parsedCallLogs, setParsedCallLogs] = useState<CrmCallLog[]>([]);
    const [validRecords, setValidRecords] = useState<Partial<User>[]>([]);
    const [duplicateCount, setDuplicateCount] = useState(0);
    const [invalidCount, setInvalidCount] = useState(0);

    // Import progress states
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, error: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state on type change
    useEffect(() => {
        if (importType === 'INSTAGRAM') {
            setBatchRef('اینستاگرام');
            setDefaultCar('');
        } else if (importType === 'VOIP') {
            setBatchRef('تماس VOIP');
            setDefaultCar('');
        } else {
            setBatchRef('پنل پیامکی');
            setDefaultCar('');
        }
    }, [importType]);

    if (!isOpen) return null;

    // Handle drag events
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Parse the file with SheetJS
    const processFile = (file: File) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Read sheet with header options
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                
                if (json.length === 0) {
                    alert('فایل اکسل انتخاب شده خالی است.');
                    return;
                }

                const headers = (json[0] || []).map(h => String(h || '').trim());
                const rows = json.slice(1).filter(row => row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''));

                setRawHeaders(headers);
                setRawRows(rows);

                // Smart auto mapping
                autoDetectColumns(headers, importType);
                setStep(2);
            } catch (err) {
                console.error(err);
                alert('خطا در خواندن فایل اکسل. لطفاً از صحت فرمت فایل اطمینان حاصل کنید.');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    // Match column names intelligently based on selected import type and specific fields
    const autoDetectColumns = (headers: string[], type: ImportType) => {
        const clean = (s: string) => s.toLowerCase().replace(/[\s_\-()（）]/g, '');
        
        let phone = '';
        let name = '';
        let car = '';
        let desc = '';
        let prov = '';
        let city = '';

        if (type === 'VOIP') {
            // VOIP Specific Auto Match: مبدا is caller/phone, مقصد can be mapped, or default
            headers.forEach(h => {
                const hClean = clean(h);
                if (hClean === 'مبدا' || hClean === 'source' || hClean === 'caller' || hClean === 'شمارهتلفنمبدا') {
                    phone = h;
                } else if (hClean === 'دلیلقطعارتباط' || hClean === 'قطع' || hClean.includes('reason') || hClean.includes('disconnect')) {
                    desc = h;
                }
            });
        } else if (type === 'INSTAGRAM') {
            // Instagram Specific Auto Match: شماره is phone, نام is name, ایدی اینستاگرام is instagram ID
            headers.forEach(h => {
                const hClean = clean(h);
                if (hClean === 'شماره' || hClean === 'number' || hClean === 'phone' || hClean === 'mobile') {
                    phone = h;
                } else if (hClean === 'نام' || hClean === 'name' || hClean === 'fullname') {
                    name = h;
                } else if (hClean === 'ایدیایینستاگرام' || hClean === 'ایدیایسنتاگرام' || hClean === 'ایدیانستاگرام' || hClean === 'آیدیاینستاگرام' || hClean === 'ایدی' || hClean === 'آیدی' || hClean === 'instagram' || hClean === 'igid') {
                    desc = h; // Mapping to description
                }
            });
        }

        let regTime = '';

        // Generic fallback auto detection if not set yet
        headers.forEach(h => {
            const hClean = clean(h);
            if (!phone && (hClean.includes('شماره') || hClean.includes('تلفن') || hClean.includes('موبایل') || hClean.includes('همراه') || hClean.includes('phone') || hClean.includes('mobile') || hClean.includes('number') || hClean.includes('tel'))) {
                phone = h;
            }
            if (!name && (hClean.includes('نام') || hClean.includes('مشتری') || hClean.includes('کاربر') || hClean.includes('name') || hClean.includes('username') || hClean.includes('پیج'))) {
                name = h;
            }
            if (!car && (hClean.includes('خودرو') || hClean.includes('ماشین') || hClean.includes('مدل') || hClean.includes('car') || hClean.includes('model') || hClean.includes('vehicle'))) {
                car = h;
            }
            if (!desc && (hClean.includes('توضیح') || hClean.includes('کامنت') || hClean.includes('پیام') || hClean.includes('desc') || hClean.includes('comment') || hClean.includes('message') || hClean.includes('متن'))) {
                desc = h;
            }
            if (!prov && (hClean.includes('استان') || hClean.includes('province') || hClean.includes('state'))) {
                prov = h;
            }
            if (!city && (hClean.includes('شهر') || hClean.includes('city'))) {
                city = h;
            }
            if (!regTime && (hClean.includes('تاریخ') || hClean.includes('ایجاد') || hClean.includes('ثبت') || hClean.includes('زمان') || hClean.includes('date') || hClean.includes('created') || hClean.includes('time') || hClean.includes('register'))) {
                regTime = h;
            }
        });

        setMappings({
            phoneCol: phone || headers[0] || '',
            nameCol: name || '',
            carModelCol: car || '',
            descCol: desc || '',
            provinceCol: prov || '',
            cityCol: city || '',
            registerTimeCol: regTime || ''
        });
    };

    // Parse records when mappings or settings change
    useEffect(() => {
        if (step !== 2 || rawRows.length === 0) return;

        const phoneIdx = rawHeaders.indexOf(mappings.phoneCol);
        const nameIdx = rawHeaders.indexOf(mappings.nameCol);
        const carIdx = rawHeaders.indexOf(mappings.carModelCol);
        const descIdx = rawHeaders.indexOf(mappings.descCol);
        const provIdx = rawHeaders.indexOf(mappings.provinceCol);
        const cityIdx = rawHeaders.indexOf(mappings.cityCol);
        const registerTimeIdx = rawHeaders.indexOf(mappings.registerTimeCol);

        // Specific match helper for exact headers
        const findColByCleanName = (names: string[]) => {
            const cleanNames = names.map(n => n.toLowerCase().replace(/[\s_\-()（）]/g, ''));
            return rawHeaders.findIndex(h => {
                const hClean = h.toLowerCase().replace(/[\s_\-()（）]/g, '');
                return cleanNames.includes(hClean);
            });
        };

        // VOIP specific columns
        const vNumIdx = findColByCleanName(['#']);
        const vSourceIdx = findColByCleanName(['مبدا', 'source', 'caller', 'شمارهتلفنمبدا']);
        const vDestIdx = findColByCleanName(['مقصد', 'destination', 'callee']);
        const vDateIdx = findColByCleanName(['تاریخ تماس', 'تاریخ', 'calldate', 'date']);
        const vWaitIdx = findColByCleanName(['زمان انتظار', 'wait', 'waittime']);
        const vDurationIdx = findColByCleanName(['طول تماس', 'duration']);
        const vDurationSecIdx = findColByCleanName(['طول تماس (ثانیه)', 'طول تماس ثانیه', 'durationsec', 'seconds']);
        const vTypeIdx = findColByCleanName(['نوع تماس', 'calltype', 'type']);
        const vQueueIdx = findColByCleanName(['صف', 'queue']);
        const vReasonIdx = findColByCleanName(['دلیل قطع ارتباط', 'دلیل قطع', 'reason', 'disconnectreason']);

        // Instagram specific columns
        const iNumIdx = findColByCleanName(['شماره', 'تلفن', 'موبایل', 'phone', 'mobile']);
        const iNameIdx = findColByCleanName(['نام', 'name']);
        const iIgIdIdx = findColByCleanName(['ایدی اینستاگرام', 'آیدی اینستاگرام', 'ایدی', 'آیدی', 'instagramid', 'instagram', 'username', 'پیج']);
        const iDateIdx = findColByCleanName(['تاریخ', 'date']);

        const parsed: Partial<User>[] = [];
        const parsedExisting: any[] = [];
        const parsedLogs: CrmCallLog[] = [];
        let duplicates = 0;
        let invalids = 0;

        const cleanExistingNumbers = new Set(existingUsers.map(u => u.Number.trim()));
        const seenNewNumbers = new Set<string>();

        rawRows.forEach(row => {
            // Priority to VOIP/Instagram specific phone columns if selected
            let rawPhone = '';
            let isOutbound = false;

            if (importType === 'VOIP') {
                if (vReasonIdx > -1) {
                    const reasonVal = String(row[vReasonIdx] || '').trim();
                    if (reasonVal !== 'موفق') {
                        return; // Skip if disconnection reason is not successful
                    }
                }
                const rawType = vTypeIdx > -1 ? String(row[vTypeIdx] || '').trim() : '';
                isOutbound = rawType.includes('خروجی') || rawType.toLowerCase().includes('out');
                
                if (isOutbound) {
                    rawPhone = vDestIdx > -1 ? String(row[vDestIdx] || '').trim() : (vSourceIdx > -1 ? String(row[vSourceIdx] || '').trim() : '');
                } else {
                    rawPhone = vSourceIdx > -1 ? String(row[vSourceIdx] || '').trim() : (vDestIdx > -1 ? String(row[vDestIdx] || '').trim() : '');
                }
            } else if (importType === 'INSTAGRAM' && iNumIdx > -1) {
                rawPhone = row[iNumIdx];
            } else {
                rawPhone = phoneIdx > -1 ? row[phoneIdx] : '';
            }

            const normalizedPhone = normalizePhoneNumber(rawPhone);

            if (!normalizedPhone || normalizedPhone.length < 10) {
                invalids++;
                return;
            }

            // Determine if user exists
            const matchedUser = existingUsers.find(u => u.Number.replace(/[\s\-\+]/g, '').endsWith(normalizedPhone.substring(1)));
            const userExists = !!matchedUser;

            // Map and prepare default records
            let rawName = nameIdx > -1 ? String(row[nameIdx] || '').trim() : '';
            if (!rawName) {
                if (importType === 'INSTAGRAM' && iNameIdx > -1) {
                    rawName = String(row[iNameIdx] || '').trim();
                }
            }

            const rawCar = carIdx > -1 ? String(row[carIdx] || '').trim() : '';
            const rawDesc = descIdx > -1 ? String(row[descIdx] || '').trim() : '';
            const rawProv = provIdx > -1 ? String(row[provIdx] || '').trim() : '';
            const rawCity = cityIdx > -1 ? String(row[cityIdx] || '').trim() : '';

            // Construct description with comprehensive source info
            let detailedDesc = '';
            let finalName = rawName;

            if (importType === 'VOIP') {
                const parts: string[] = ['📞 تماس VOIP'];
                if (vSourceIdx > -1 && row[vSourceIdx]) parts.push(`مبدا: ${row[vSourceIdx]}`);
                if (vDestIdx > -1 && row[vDestIdx]) parts.push(`مقصد: ${row[vDestIdx]}`);
                if (vDateIdx > -1 && row[vDateIdx]) parts.push(`تاریخ تماس: ${row[vDateIdx]}`);
                if (vWaitIdx > -1 && row[vWaitIdx]) parts.push(`زمان انتظار: ${row[vWaitIdx]}`);
                if (vDurationIdx > -1 && row[vDurationIdx]) parts.push(`طول تماس: ${row[vDurationIdx]}`);
                if (vDurationSecIdx > -1 && row[vDurationSecIdx]) parts.push(`طول تماس (ثانیه): ${row[vDurationSecIdx]}`);
                if (vTypeIdx > -1 && row[vTypeIdx]) parts.push(`نوع تماس: ${row[vTypeIdx]}`);
                if (vQueueIdx > -1 && row[vQueueIdx]) parts.push(`صف: ${row[vQueueIdx]}`);
                if (vReasonIdx > -1 && row[vReasonIdx]) parts.push(`دلیل قطع: ${row[vReasonIdx]}`);
                
                if (rawDesc && descIdx !== vReasonIdx && descIdx !== vSourceIdx && descIdx !== vDestIdx) {
                    parts.push(`توضیحات تکمیلی: ${rawDesc}`);
                }
                detailedDesc = parts.join(' | ');

                if (matchedUser) {
                    finalName = matchedUser.FullName;
                } else if (!finalName) {
                    finalName = 'مشتری مرکز تماس (VOIP)';
                }

                // Call duration calculation
                let durationSeconds = 0;
                if (vDurationSecIdx > -1 && row[vDurationSecIdx] !== undefined && row[vDurationSecIdx] !== '') {
                    durationSeconds = parseInt(row[vDurationSecIdx], 10) || 0;
                } else if (vDurationIdx > -1 && row[vDurationIdx]) {
                    const val = String(row[vDurationIdx]).trim();
                    if (val.includes(':')) {
                        const pts = val.split(':').map(Number);
                        if (pts.length === 2) durationSeconds = pts[0] * 60 + pts[1];
                        else if (pts.length === 3) durationSeconds = pts[0] * 3600 + pts[1] * 60 + pts[2];
                    } else {
                        durationSeconds = parseInt(val, 10) || 0;
                    }
                }

                // Call status calculation
                let callStatus: 'SUCCESSFUL' | 'MISSED' | 'NO_ANSWER' | 'BUSY' | 'REJECTED' = 'SUCCESSFUL';
                const reasonStr = vReasonIdx > -1 ? String(row[vReasonIdx] || '').trim() : '';
                if (durationSeconds === 0) {
                    if (reasonStr.includes('مشغول') || reasonStr.includes('busy')) {
                        callStatus = 'BUSY';
                    } else if (reasonStr.includes('رد') || reasonStr.includes('rejected') || reasonStr.includes('decline')) {
                        callStatus = 'REJECTED';
                    } else if (reasonStr.includes('پاسخ') || reasonStr.includes('no answer') || reasonStr.includes('timeout')) {
                        callStatus = 'NO_ANSWER';
                    } else {
                        callStatus = 'MISSED';
                    }
                }

                // Timestamp
                let callTimestamp = '';
                if (vDateIdx > -1 && row[vDateIdx]) {
                    callTimestamp = String(row[vDateIdx]).trim();
                } else {
                    const now = new Date();
                    callTimestamp = now.toLocaleDateString('fa-IR') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
                }

                // Notes
                const notesParts: string[] = [];
                if (vQueueIdx > -1 && row[vQueueIdx]) notesParts.push(`صف: ${row[vQueueIdx]}`);
                if (vWaitIdx > -1 && row[vWaitIdx]) notesParts.push(`انتظار: ${row[vWaitIdx]} ثانیه`);
                if (reasonStr) notesParts.push(`علت قطع: ${reasonStr}`);
                if (vDestIdx > -1 && row[vDestIdx] && isOutbound === false) notesParts.push(`داخلی مقصد: ${row[vDestIdx]}`);
                const callNotes = notesParts.join(' | ') || 'ثبت شده از طریق ایمپورت فایل VOIP';

                parsedLogs.push({
                    id: `voip-import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    userId: matchedUser?.id,
                    customerName: finalName,
                    customerNumber: normalizedPhone,
                    callType: isOutbound ? 'OUTBOUND' : 'INBOUND',
                    callStatus,
                    duration: durationSeconds,
                    agentName: 'مرکز تماس VOIP',
                    notes: callNotes,
                    timestamp: callTimestamp
                });

            } else if (importType === 'INSTAGRAM') {
                const parts: string[] = ['📸 اینستاگرام'];
                const igIdVal = iIgIdIdx > -1 ? String(row[iIgIdIdx] || '').trim() : '';
                if (igIdVal) parts.push(`آیدی: @${igIdVal.replace(/^@/, '')}`);
                if (iDateIdx > -1 && row[iDateIdx]) parts.push(`تاریخ تعامل: ${row[iDateIdx]}`);
                
                if (rawDesc && descIdx !== iIgIdIdx && descIdx !== iNumIdx) {
                    parts.push(`توضیحات: ${rawDesc}`);
                }
                detailedDesc = parts.join(' | ');

                if (matchedUser) {
                    finalName = matchedUser.FullName;
                } else if (!finalName) {
                    finalName = igIdVal ? `@${igIdVal.replace(/^@/, '')}` : 'کاربر اینستاگرام';
                }
            } else {
                detailedDesc = `💬 [درون‌ریزی پنل پیامکی] ${rawDesc ? `کمپین/متن پیام: ${rawDesc}` : ''}`;
                if (matchedUser) {
                    finalName = matchedUser.FullName;
                } else if (!finalName) {
                    finalName = 'مشتری پنل پیامکی';
                }
            }

            const isAlreadyScheduledForCreation = seenNewNumbers.has(normalizedPhone);

            // If user already exists in CRM, we don't recreate them as a new customer lead
            if ((userExists && matchedUser) || isAlreadyScheduledForCreation) {
                duplicates++;
                parsedExisting.push({
                    userId: matchedUser?.id || undefined,
                    FullName: finalName,
                    Number: normalizedPhone,
                    CarModel: rawCar || defaultCar || 'نامشخص',
                    Province: rawProv || '',
                    City: rawCity || '',
                    Decription: detailedDesc,
                    reference: batchRef || (importType === 'INSTAGRAM' ? 'اینستاگرام' : importType === 'VOIP' ? 'تماس VOIP' : 'پنل پیامکی')
                });
                return;
            }

            seenNewNumbers.add(normalizedPhone);

            let registerTimeStr = '';
            if (registerTimeIdx > -1 && row[registerTimeIdx] !== undefined && row[registerTimeIdx] !== null && row[registerTimeIdx] !== '') {
                registerTimeStr = parseAndConvertJalaliToGregorian(row[registerTimeIdx]);
            } else if (importType === 'VOIP' && vDateIdx > -1 && row[vDateIdx]) {
                registerTimeStr = parseAndConvertJalaliToGregorian(row[vDateIdx]);
            } else if (importType === 'INSTAGRAM' && iDateIdx > -1 && row[iDateIdx]) {
                registerTimeStr = parseAndConvertJalaliToGregorian(row[iDateIdx]);
            }

            if (!registerTimeStr) {
                registerTimeStr = new Date().toISOString();
            }

            let isoCreated = new Date().toISOString();
            try {
                const parsedDate = new Date(registerTimeStr);
                if (!isNaN(parsedDate.getTime())) {
                    isoCreated = parsedDate.toISOString();
                }
            } catch {}

            let lastActionValue = 'ثبت از فایل اکسل';
            if (importType === 'VOIP') {
                lastActionValue = vDateIdx > -1 && row[vDateIdx] ? String(row[vDateIdx]).trim() : registerTimeStr;
            }

            parsed.push({
                FullName: finalName,
                Number: normalizedPhone,
                CarModel: rawCar || defaultCar || 'نامشخص',
                Province: rawProv || '',
                City: rawCity || '',
                Decription: detailedDesc,
                reference: batchRef || (importType === 'INSTAGRAM' ? 'اینستاگرام' : importType === 'VOIP' ? 'تماس VOIP' : 'پنل پیامکی'),
                leadStatus: defaultStatus,
                RegisterTime: registerTimeStr,
                LastAction: lastActionValue,
                IP: '',
                createdAt: isoCreated,
                updatedAt: isoCreated,
                crmIsSend: 0
            });
        });

        setParsedRecords(parsed);
        setParsedExistingRecords(parsedExisting);
        setParsedCallLogs(parsedLogs);
        setDuplicateCount(duplicates);
        setInvalidCount(invalids);
    }, [mappings, batchRef, defaultCar, defaultStatus, step, rawRows, rawHeaders, importType, existingUsers]);

    // Handle Start Import
    const handleStartImport = async () => {
        const hasCallLogs = importType === 'VOIP' && parsedCallLogs.length > 0;
        const hasCustomers = parsedRecords.length > 0 || parsedExistingRecords.length > 0;

        if (!hasCustomers && !hasCallLogs) {
            alert('هیچ اطلاعات معتبری برای درون‌ریزی یافت نشد.');
            return;
        }

        setStep(3);
        setImporting(true);
        const totalOps = parsedRecords.length + parsedExistingRecords.length;
        setProgress({ current: 0, total: totalOps, success: 0, error: 0 });

        // 1. If we have VOIP call logs, import them to server via API
        if (importType === 'VOIP' && parsedCallLogs.length > 0) {
            for (const log of parsedCallLogs) {
                try {
                    await createCallLog(log);
                } catch (err) {
                    console.error('Failed to import call log via API', err);
                }
            }
        }

        // 2. Process customer records (new or existing)
        let success = 0;
        let errors = 0;
        let currentOp = 0;
        const phoneToNewUserIdMap = new Map<string, number>();

        if (hasCustomers) {
            // A. Create new customers and their logs
            for (let i = 0; i < parsedRecords.length; i++) {
                const record = parsedRecords[i];
                try {
                    const newUser = await createUser(record as Omit<User, 'id'>);
                    success++;

                    if (newUser && newUser.id) {
                        if (record.Number) {
                            phoneToNewUserIdMap.set(record.Number, newUser.id);
                        }
                        try {
                            const authorName = currentUser?.full_name || currentUser?.username || 'کاربر سیستم';
                            let journalContent = '';
                            if (importType === 'VOIP') {
                                journalContent = `📥 ثبت مشتری جدید از طریق درون‌ریزی گروهی اکسل (منبع: تماس VOIP)
🚗 خودروی درخواستی: ${record.CarModel || 'نامشخص'}
📍 استان/شهر: ${record.Province || '-'}${record.City ? ` / ${record.City}` : ''}

📊 جزئیات تماس VOIP:
${record.Decription ? record.Decription.split(' | ').join('\n') : 'فاقد جزئیات تماس'}`;
                            } else {
                                journalContent = `📥 ثبت مشتری جدید از طریق درون‌ریزی گروهی اکسل (منبع: ${record.reference || 'فایل اکسل'})
🚗 خودروی درخواستی: ${record.CarModel || 'نامشخص'}
📍 استان/شهر: ${record.Province || '-'}${record.City ? ` / ${record.City}` : ''}
📝 توضیحات تکمیلی: ${record.Decription || 'فاقد توضیحات'}`;
                            }

                            await createCustomerJournal({
                                userId: newUser.id,
                                content: journalContent,
                                author: authorName
                            });
                        } catch (journalErr) {
                            console.error('Failed to create customer journal log for imported user:', journalErr);
                        }
                    }
                } catch (err) {
                    console.error('Import Row error:', err);
                    errors++;
                }
                currentOp++;
                setProgress(p => ({
                    ...p,
                    current: currentOp,
                    success,
                    error: errors
                }));
            }

            // B. Register activities for existing/duplicate customers in Customer Timeline
            for (let i = 0; i < parsedExistingRecords.length; i++) {
                const existingRecord = parsedExistingRecords[i];
                try {
                    const authorName = currentUser?.full_name || currentUser?.username || 'کاربر سیستم';
                    
                    const targetUserId = existingRecord.userId || (existingRecord.Number ? phoneToNewUserIdMap.get(existingRecord.Number) : undefined);
                    if (!targetUserId) {
                        console.warn('Could not find user ID for existing record:', existingRecord.Number);
                        errors++;
                        currentOp++;
                        continue;
                    }

                    let journalContent = '';
                    if (importType === 'VOIP') {
                        journalContent = `🔄 ثبت فعالیت جدید برای مشتری قدیمی از طریق درون‌ریزی گروهی اکسل (منبع: تماس VOIP)
🚗 خودروی درخواستی: ${existingRecord.CarModel || 'نامشخص'}
📍 استان/شهر: ${existingRecord.Province || '-'}${existingRecord.City ? ` / ${existingRecord.City}` : ''}

📊 جزئیات تماس VOIP:
${existingRecord.Decription ? existingRecord.Decription.split(' | ').join('\n') : 'فاقد جزئیات تماس'}`;
                    } else {
                        journalContent = `🔄 ثبت فعالیت جدید برای مشتری قدیمی از طریق درون‌ریزی گروهی اکسل (منبع: ${existingRecord.reference || 'فایل اکسل'})
🚗 خودروی درخواستی: ${existingRecord.CarModel || 'نامشخص'}
📍 استان/شهر: ${existingRecord.Province || '-'}${existingRecord.City ? ` / ${existingRecord.City}` : ''}
📝 توضیحات تکمیلی: ${existingRecord.Decription || 'فاقد توضیحات'}`;
                    }

                    await createCustomerJournal({
                        userId: targetUserId,
                        content: journalContent,
                        author: authorName
                    });
                    success++; // Count as successful operation
                } catch (err) {
                    console.error('Failed to create customer journal for existing user:', err);
                    errors++;
                }
                currentOp++;
                setProgress(p => ({
                    ...p,
                    current: currentOp,
                    success,
                    error: errors
                }));
            }
        } else {
            // No customer data at all, just call logs
            setProgress({
                current: parsedCallLogs.length,
                total: parsedCallLogs.length,
                success: parsedCallLogs.length,
                error: 0
            });
        }

        setImporting(false);
        onImportSuccess();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">درون‌ریزی گروهی اطلاعات مشتریان (وارد کردن فایل اکسل)</h3>
                        <p className="text-xs text-slate-400 mt-1">امکان ایمپورت هوشمند لیست‌ها و گزارش تماس‌های دریافتی نمایندگی</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    
                    {/* Step Progress indicators */}
                    <div className="flex items-center justify-center max-w-md mx-auto mb-4">
                        <div className="flex items-center w-full">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'}`}>۱</div>
                            <div className={`flex-grow h-1 mx-2 ${step >= 2 ? 'bg-sky-600' : 'bg-slate-200'}`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'}`}>۲</div>
                            <div className={`flex-grow h-1 mx-2 ${step >= 3 ? 'bg-sky-600' : 'bg-slate-200'}`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 3 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'}`}>۳</div>
                        </div>
                    </div>

                    {/* STEP 1: SELECT TYPE AND UPLOAD */}
                    {step === 1 && (
                        <div className="space-y-6">
                            
                            {/* Type Selector */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2.5">منبع و نوع لیست اکسل را انتخاب کنید:</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setImportType('INSTAGRAM')}
                                        className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3.5 ${importType === 'INSTAGRAM' ? 'border-pink-500 bg-pink-50/20 dark:bg-pink-950/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                    >
                                        <div className={`p-2.5 rounded-lg ${importType === 'INSTAGRAM' ? 'bg-pink-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                            <Instagram className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">شماره‌های اینستاگرام</h4>
                                            <p className="text-[10px] text-slate-400 mt-1">لیست دایرکت‌ها، کامنت‌ها و تعاملات پیج</p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setImportType('VOIP')}
                                        className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3.5 ${importType === 'VOIP' ? 'border-sky-500 bg-sky-50/20 dark:bg-sky-950/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                    >
                                        <div className={`p-2.5 rounded-lg ${importType === 'VOIP' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">تاریخچه تماس‌های VOIP</h4>
                                            <p className="text-[10px] text-slate-400 mt-1">خروجی تماس‌های ورودی و خروجی مرکز تماس</p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setImportType('SMS_PANEL')}
                                        className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3.5 ${importType === 'SMS_PANEL' ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                    >
                                        <div className={`p-2.5 rounded-lg ${importType === 'SMS_PANEL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">شماره‌های پنل پیامکی</h4>
                                            <p className="text-[10px] text-slate-400 mt-1">لیست گیرندگان، خبرنامه‌ها و کمپین‌ها</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Upload Area */}
                            <div 
                                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragActive ? 'border-sky-500 bg-sky-50/10' : 'border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500'}`}
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    accept=".xlsx, .xls, .csv" 
                                    className="hidden" 
                                />
                                <div className="mx-auto w-14 h-14 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center mb-4">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">فایل اکسل یا CSV خود را بکشید و رها کنید</h4>
                                <p className="text-xs text-slate-400 mt-1.5">یا برای انتخاب فایل از روی کامپیوتر کلیک کنید</p>
                                <div className="mt-4 flex justify-center gap-3">
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">XLSX</span>
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">XLS</span>
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">CSV</span>
                                </div>
                            </div>

                            {/* Import Tips */}
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl space-y-2 text-xs text-amber-800 dark:text-amber-400">
                                <div className="flex items-center gap-2 font-black">
                                    <AlertCircle className="w-4.5 h-4.5" />
                                    <span>راهنمای ساختار فایل اکسل:</span>
                                </div>
                                <ul className="list-disc list-inside mr-2.5 space-y-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                                    <li>فایل باید حداقل شامل یک ستون برای **شماره تلفن همراه** باشد.</li>
                                    <li>ستون‌های نام مشتری، شهر، استان، مدل خودرو و توضیحات جهت درون‌ریزی دقیق‌تر پیشنهاد می‌شود.</li>
                                    <li>سیستم به طور خودکار ستون‌ها را حدس زده و شماره‌های تکراری ثبت‌شده در CRM را نادیده می‌گیرد.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: MAPPING & PREVIEW */}
                    {step === 2 && (
                        <div className="space-y-6">
                            
                            {/* File summary bar */}
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold">
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                                    <span>فایل با موفقیت خوانده شد: {fileName}</span>
                                </div>
                                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                                    {rawRows.length.toLocaleString('fa-IR')} ردیف اطلاعاتی
                                </span>
                            </div>

                            {/* Columns Mapping Form */}
                            <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
                                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">۱. تطبیق فیلدها و ستون‌های اکسل:</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    
                                    {/* Phone (Required) */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                            ستون شماره تلفن همراه <span className="text-red-500 font-bold">*</span>
                                        </label>
                                        <select 
                                            value={mappings.phoneCol}
                                            onChange={(e) => setMappings(prev => ({ ...prev, phoneCol: e.target.value }))}
                                            className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="">انتخاب ستون...</option>
                                            {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">ستون نام و نام خانوادگی</label>
                                        <select 
                                            value={mappings.nameCol}
                                            onChange={(e) => setMappings(prev => ({ ...prev, nameCol: e.target.value }))}
                                            className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="">بدون نام (پیش‌فرض استفاده شود)</option>
                                            {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    {/* Car Model */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">ستون مدل خودروی درخواستی</label>
                                        <select 
                                            value={mappings.carModelCol}
                                            onChange={(e) => setMappings(prev => ({ ...prev, carModelCol: e.target.value }))}
                                            className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="">بدون ستون (استفاده از خودروی پیش‌فرض)</option>
                                            {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    {/* Province */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">ستون استان</label>
                                        <select 
                                            value={mappings.provinceCol}
                                            onChange={(e) => setMappings(prev => ({ ...prev, provinceCol: e.target.value }))}
                                            className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="">بدون ستون</option>
                                            {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">ستون شهر</label>
                                        <select 
                                            value={mappings.cityCol}
                                            onChange={(e) => setMappings(prev => ({ ...prev, cityCol: e.target.value }))}
                                            className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="">بدون ستون</option>
                                            {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    {/* Register Time / Creation Date */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">ستون تاریخ ایجاد / ثبت</label>
                                        <select 
                                            value={mappings.registerTimeCol}
                                            onChange={(e) => setMappings(prev => ({ ...prev, registerTimeCol: e.target.value }))}
                                            className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="">بدون ستون (استفاده از زمان فعلی)</option>
                                            {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div className="sm:col-span-2 md:col-span-3">
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">ستون توضیحات تکمیلی</label>
                                        <select 
                                            value={mappings.descCol}
                                            onChange={(e) => setMappings(prev => ({ ...prev, descCol: e.target.value }))}
                                            className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="">بدون ستون</option>
                                            {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Batch default configurations */}
                            <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
                                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">۲. تنظیمات و برچسب‌های دسته (پیش‌فرض):</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    
                                    {/* Reference Tag */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">منبع ارجاع (برچسب رفرنس)</label>
                                        <input 
                                            type="text"
                                            value={batchRef}
                                            onChange={(e) => setBatchRef(e.target.value)}
                                            placeholder="مثال: اینستاگرام مهر ماه"
                                            className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>

                                    {/* Default Car Model */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">مدل خودروی پیش‌فرض (در صورت نبود ستون)</label>
                                        <input 
                                            type="text"
                                            value={defaultCar}
                                            onChange={(e) => setDefaultCar(e.target.value)}
                                            placeholder="مثال: فیدلیتی پرایم"
                                            className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>

                                    {/* Default status */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">وضعیت سرنخ‌های ورودی</label>
                                        <select 
                                            value={defaultStatus}
                                            onChange={(e) => setDefaultStatus(e.target.value as LeadStatus)}
                                            className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                                        >
                                            {Object.values(LeadStatus).map(st => <option key={st} value={st}>{st}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Batch Audit Statistics */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl border border-sky-100 dark:border-sky-900 bg-sky-50/45 dark:bg-sky-950/25 flex items-center gap-3">
                                    <CheckCircle2 className="w-8 h-8 text-sky-600" />
                                    <div>
                                        <h5 className="text-[10px] text-slate-400">
                                            {importType === 'VOIP' ? 'کل تماس‌های شناسایی شده' : 'شماره‌های معتبر جدید'}
                                        </h5>
                                        <p className="text-sm font-black text-slate-800 dark:text-white font-mono">
                                            {importType === 'VOIP' 
                                                ? `${parsedCallLogs.length.toLocaleString('fa-IR')} تماس`
                                                : `${parsedRecords.length.toLocaleString('fa-IR')} مورد`
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl border border-amber-100 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/15 flex items-center gap-3">
                                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                                    <div>
                                        <h5 className="text-[10px] text-slate-400">
                                            {importType === 'VOIP' ? 'مشتریان جدید برای ثبت در CRM' : 'تکراری (رد خواهند شد)'}
                                        </h5>
                                        <p className="text-sm font-black text-slate-800 dark:text-white font-mono">
                                            {importType === 'VOIP'
                                                ? `${parsedRecords.length.toLocaleString('fa-IR')} مشتری جدید`
                                                : `${duplicateCount.toLocaleString('fa-IR')} مورد`
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-3">
                                    <AlertCircle className="w-8 h-8 text-slate-400" />
                                    <div>
                                        <h5 className="text-[10px] text-slate-400">بدون تلفن یا نامعتبر</h5>
                                        <p className="text-sm font-black text-slate-800 dark:text-white font-mono">{invalidCount.toLocaleString('fa-IR')} مورد</p>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Table */}
                            {importType === 'VOIP' && parsedCallLogs.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">۳. پیش‌نمایش ۵ تماس اول:</h4>
                                    <div className="border border-slate-150 dark:border-slate-700 rounded-xl overflow-hidden max-w-full">
                                        <table className="w-full text-xs text-right border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold border-b border-slate-150 dark:border-slate-700">
                                                    <th className="p-2 text-[11px]">مخاطب</th>
                                                    <th className="p-2 text-[11px]">نوع</th>
                                                    <th className="p-2 text-[11px]">وضعیت</th>
                                                    <th className="p-2 text-[11px]">مدت</th>
                                                    <th className="p-2 text-[11px]">تاریخ</th>
                                                    <th className="p-2 text-[11px]">جزییات</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                                                {parsedCallLogs.slice(0, 5).map((rec, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                                                        <td className="p-2">
                                                            <div className="font-bold text-slate-800 dark:text-white">{rec.customerName}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono">{rec.customerNumber}</div>
                                                        </td>
                                                        <td className="p-2 text-slate-700 dark:text-slate-300">
                                                            {rec.callType === 'INBOUND' ? 'ورودی' : 'خروجی'}
                                                        </td>
                                                        <td className="p-2">
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                                rec.callStatus === 'SUCCESSFUL' 
                                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                                                            }`}>
                                                                {rec.callStatus === 'SUCCESSFUL' ? 'موفق' : 'ناموفق'}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 font-mono text-slate-700 dark:text-slate-300">
                                                            {rec.duration ? `${rec.duration} ثانیه` : '---'}
                                                        </td>
                                                        <td className="p-2 text-slate-500 font-mono">{rec.timestamp}</td>
                                                        <td className="p-2 text-slate-500 truncate max-w-[150px]">{rec.notes}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {importType !== 'VOIP' && parsedRecords.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">۳. پیش‌نمایش ۵ ردیف اول:</h4>
                                    <div className="border border-slate-150 dark:border-slate-700 rounded-xl overflow-hidden max-w-full">
                                        <table className="w-full text-xs text-right border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold border-b border-slate-150 dark:border-slate-700">
                                                    <th className="p-2 text-[11px]">شماره تلفن</th>
                                                    <th className="p-2 text-[11px]">نام کامل</th>
                                                    <th className="p-2 text-[11px]">خودرو</th>
                                                    <th className="p-2 text-[11px]">وضعیت</th>
                                                    <th className="p-2 text-[11px]">مرجع</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                                                {parsedRecords.slice(0, 5).map((rec, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                                                        <td className="p-2 font-mono text-slate-800 dark:text-white">{rec.Number}</td>
                                                        <td className="p-2 text-slate-700 dark:text-slate-300">{rec.FullName}</td>
                                                        <td className="p-2 text-slate-700 dark:text-slate-300">{rec.CarModel}</td>
                                                        <td className="p-2"><span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">{rec.leadStatus}</span></td>
                                                        <td className="p-2 text-slate-500">{rec.reference}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: RUNNING IMPORT */}
                    {step === 3 && (
                        <div className="py-8 text-center space-y-6 max-w-md mx-auto">
                            
                            {importing ? (
                                <>
                                    <Loader2 className="w-16 h-16 text-sky-600 animate-spin mx-auto" />
                                    <div className="space-y-2">
                                        <h4 className="text-base font-bold text-slate-800 dark:text-white">در حال درون‌ریزی گروهی شماره‌ها...</h4>
                                        <p className="text-xs text-slate-400">لطفاً تا پایان فرآیند پنجره را نبندید.</p>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="space-y-1">
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-sky-600 h-full transition-all duration-300"
                                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold text-slate-500 font-mono">
                                            <span>{progress.current.toLocaleString('fa-IR')} از {progress.total.toLocaleString('fa-IR')}</span>
                                            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-center gap-6 text-xs border-t border-slate-100 dark:border-slate-700 pt-4">
                                        <div className="text-emerald-600 font-bold">
                                            <p className="text-[10px] text-slate-400 font-normal">درون‌ریزی موفق</p>
                                            <p className="text-lg">{progress.success.toLocaleString('fa-IR')}</p>
                                        </div>
                                        <div className="text-red-600 font-bold">
                                            <p className="text-[10px] text-slate-400 font-normal">خطاها</p>
                                            <p className="text-lg">{progress.error.toLocaleString('fa-IR')}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-black text-slate-800 dark:text-white">عملیات درون‌ریزی با موفقیت به پایان رسید</h4>
                                        <p className="text-xs text-slate-400">کل اطلاعات در دیتابیس نمایندگی ثبت گردید.</p>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-150 dark:border-slate-700 divide-y divide-slate-150 dark:divide-slate-700 text-xs">
                                        <div className="flex justify-between py-2 font-bold">
                                            <span className="text-slate-500">موفقیت‌آمیز:</span>
                                            <span className="text-emerald-600 font-mono">{progress.success.toLocaleString('fa-IR')} کاربر جدید</span>
                                        </div>
                                        <div className="flex justify-between py-2 font-bold">
                                            <span className="text-slate-500">شماره‌های تکراری رد شده:</span>
                                            <span className="text-amber-600 font-mono">{duplicateCount.toLocaleString('fa-IR')} مورد</span>
                                        </div>
                                        <div className="flex justify-between py-2 font-bold">
                                            <span className="text-slate-500">خطاها:</span>
                                            <span className="text-red-500 font-mono">{progress.error.toLocaleString('fa-IR')} مورد</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-sky-100 dark:shadow-none"
                                    >
                                        متوجه شدم (بازگشت به پیشخوان)
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer buttons */}
                {step !== 3 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between bg-slate-50 dark:bg-slate-800 sticky bottom-0 z-10">
                        {step === 2 ? (
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-5 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center gap-1.5"
                            >
                                <ArrowRight className="w-4 h-4" />
                                برگشت به آپلود فایل
                            </button>
                        ) : (
                            <div />
                        )}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                انصراف
                            </button>

                            {step === 2 && (
                                <button
                                    type="button"
                                    onClick={handleStartImport}
                                    disabled={parsedRecords.length === 0}
                                    className="px-6 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-100 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Play className="w-4 h-4" />
                                    شروع درون‌ریزی گروهی ({parsedRecords.length.toLocaleString('fa-IR')} شماره)
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
