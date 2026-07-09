import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import type { User, CrmCallLog, StaffUser } from '../types';
import { createCallLog, getMyProfile } from '../services/api';
import { 
    X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, 
    ArrowLeft, ArrowRight, Play, Check, AlertTriangle, Loader2,
    Phone, PhoneIncoming, PhoneOutgoing, Clock, HelpCircle, UserCheck
} from 'lucide-react';

interface CrmCallLogsImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingUsers: User[];
    staffUsers: StaffUser[];
    loggedInUser: { username: string; FullName?: string } | null;
    onImportSuccess: () => void;
}

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

export const CrmCallLogsImportModal: React.FC<CrmCallLogsImportModalProps> = ({ 
    isOpen, 
    onClose, 
    existingUsers, 
    staffUsers,
    loggedInUser,
    onImportSuccess 
}) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string>('');
    const [rawHeaders, setRawHeaders] = useState<string[]>([]);
    const [rawRows, setRawRows] = useState<any[][]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Mappings
    const [selectedAgent, setSelectedAgent] = useState<string>('');

    // Parsed logs
    const [parsedLogs, setParsedLogs] = useState<Partial<CrmCallLog>[]>([]);
    const [validCount, setValidCount] = useState(0);
    const [invalidCount, setInvalidCount] = useState(0);

    // Progress
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, error: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getMyProfile().then(p => {
            setCurrentUser(p);
            setSelectedAgent(p?.full_name || p?.username || loggedInUser?.username || 'کاربر سیستم');
        }).catch(() => {
            setSelectedAgent(loggedInUser?.username || 'کاربر سیستم');
        });
    }, [loggedInUser]);

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

                // Perform parsing immediately
                parseCallLogsData(headers, rows);
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

    const parseCallLogsData = (headers: string[], rows: any[][]) => {
        const clean = (s: string) => String(s || '').trim().toLowerCase().replace(/[\s_\-()（）#]/g, '');

        let numIdx = -1;
        let sourceIdx = -1;
        let destIdx = -1;
        let dateIdx = -1;
        let waitIdx = -1;
        let durationIdx = -1;
        let durationSecIdx = -1;
        let typeIdx = -1;
        let queueIdx = -1;
        let reasonIdx = -1;

        headers.forEach((h, idx) => {
            const hClean = clean(h);
            if (hClean === '' || hClean === 'ردیف') {
                numIdx = idx;
            } else if (hClean === 'مبدا' || hClean === 'source' || hClean === 'caller' || hClean === 'شمارهتلفنمبدا' || hClean === 'شمارهتماسدهنده') {
                sourceIdx = idx;
            } else if (hClean === 'مقصد' || hClean === 'destination' || hClean === 'callee' || hClean === 'شمارهگیرنده') {
                destIdx = idx;
            } else if (hClean === 'تاریختماس' || hClean === 'تاریخ' || hClean === 'calldate' || hClean === 'date' || hClean === 'زمانتماس') {
                dateIdx = idx;
            } else if (hClean === 'زمانانتظار' || hClean === 'wait' || hClean === 'waittime') {
                waitIdx = idx;
            } else if (hClean === 'طولتماس' || hClean === 'duration' || hClean === 'مدت') {
                durationIdx = idx;
            } else if (hClean === 'طولتماسثانیه' || hClean === 'طولتماس(ثانیه)' || hClean === 'durationsec' || hClean === 'seconds') {
                durationSecIdx = idx;
            } else if (hClean === 'نوعتماس' || hClean === 'calltype' || hClean === 'type') {
                typeIdx = idx;
            } else if (hClean === 'صف' || hClean === 'queue') {
                queueIdx = idx;
            } else if (hClean === 'دلیلقطعارتباط' || hClean === 'دلیلقطع' || hClean === 'قطع' || hClean.includes('reason') || hClean.includes('disconnect')) {
                reasonIdx = idx;
            }
        });

        // Smart fallbacks in case header matching failed
        if (sourceIdx === -1 && headers.length > 1) {
            // First column that might be phone
            const possiblePhoneIdx = headers.findIndex(h => clean(h).includes('شماره') || clean(h).includes('تلفن') || clean(h).includes('موبایل'));
            if (possiblePhoneIdx !== -1) sourceIdx = possiblePhoneIdx;
        }

        const parseTimestamp = (val: any): string => {
            if (!val) {
                if (typeof (window as any).moment !== 'undefined') {
                    return (window as any).moment().locale('fa').format('jYYYY/jMM/jDD HH:mm');
                }
                return '1405/04/20 12:00';
            }
            
            if (val instanceof Date) {
                if (typeof (window as any).moment !== 'undefined') {
                    return (window as any).moment(val).locale('fa').format('jYYYY/jMM/jDD HH:mm');
                }
                return '1405/04/20 12:00';
            }

            let strVal = String(val).trim();
            strVal = convertPersianToEnglishDigits(strVal);

            // Check if it's already a Jalali timestamp
            const jalaliRegex = /^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/;
            const match = strVal.match(jalaliRegex);
            if (match) {
                const y = parseInt(match[1], 10);
                if (y >= 1300 && y <= 1500) {
                    const m = String(match[2]).padStart(2, '0');
                    const d = String(match[3]).padStart(2, '0');
                    const hh = match[4] ? String(match[4]).padStart(2, '0') : '12';
                    const mm = match[5] ? String(match[5]).padStart(2, '0') : '00';
                    return `${y}/${m}/${d} ${hh}:${mm}`;
                }
            }

            // If it's a number (Excel serial date)
            const numVal = Number(strVal);
            if (!isNaN(numVal) && numVal > 30000 && numVal < 100000) {
                const jsDate = new Date((numVal - 25569) * 86400 * 1000);
                if (typeof (window as any).moment !== 'undefined') {
                    return (window as any).moment(jsDate).locale('fa').format('jYYYY/jMM/jDD HH:mm');
                }
            }

            // Try standard Date parsing
            try {
                const d = new Date(strVal);
                if (!isNaN(d.getTime())) {
                    if (typeof (window as any).moment !== 'undefined') {
                        return (window as any).moment(d).locale('fa').format('jYYYY/jMM/jDD HH:mm');
                    }
                }
            } catch (e) {}

            return strVal;
        };

        const logsList: Partial<CrmCallLog>[] = [];
        let invalid = 0;

        rows.forEach(row => {
            // Determine call type
            let rawType = typeIdx > -1 ? String(row[typeIdx] || '').trim().toLowerCase() : '';
            const isOutbound = rawType.includes('خروجی') || rawType.includes('outbound') || rawType.includes('out') || rawType.includes('خروج');
            const callType: 'INBOUND' | 'OUTBOUND' = isOutbound ? 'OUTBOUND' : 'INBOUND';

            // Numbers
            const rawSource = sourceIdx > -1 ? String(row[sourceIdx] || '').trim() : '';
            const rawDest = destIdx > -1 ? String(row[destIdx] || '').trim() : '';

            let customerNumber = callType === 'INBOUND' ? rawSource : rawDest;
            let followUpPhone = callType === 'INBOUND' ? rawDest : rawSource;

            // In case one is missing
            if (!customerNumber && followUpPhone) {
                customerNumber = followUpPhone;
                followUpPhone = '';
            }

            const normalizedCustomerPhone = normalizePhoneNumber(customerNumber);
            if (!normalizedCustomerPhone || normalizedCustomerPhone.length < 5) {
                invalid++;
                return;
            }

            // Lookup existing customer
            const matchedUser = existingUsers.find(u => {
                const normalizedUserPhone = normalizePhoneNumber(u.Number);
                return normalizedUserPhone.length > 5 && normalizedCustomerPhone.length > 5 && 
                       (normalizedUserPhone.endsWith(normalizedCustomerPhone.substring(1)) || 
                        normalizedCustomerPhone.endsWith(normalizedUserPhone.substring(1)));
            });

            const customerName = matchedUser 
                ? matchedUser.FullName 
                : `مشتری ناشناس (${customerNumber})`;

            // Parse Duration
            let durationSeconds = 0;
            if (durationSecIdx > -1 && row[durationSecIdx] !== undefined && row[durationSecIdx] !== '') {
                durationSeconds = parseInt(String(row[durationSecIdx]).replace(/\D/g, ''), 10) || 0;
            } else if (durationIdx > -1 && row[durationIdx]) {
                const tStr = String(row[durationIdx]).trim();
                const parts = tStr.split(':');
                if (parts.length === 3) {
                    durationSeconds = (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseInt(parts[2], 10) || 0);
                } else if (parts.length === 2) {
                    durationSeconds = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
                } else {
                    durationSeconds = parseInt(tStr.replace(/\D/g, ''), 10) || 0;
                }
            }

            // Call Status
            let callStatus: CrmCallLog['callStatus'] = 'SUCCESSFUL';
            if (durationSeconds > 0) {
                callStatus = 'SUCCESSFUL';
            } else {
                const reasonVal = reasonIdx > -1 ? String(row[reasonIdx] || '').trim().toLowerCase() : '';
                if (reasonVal.includes('مشغول') || reasonVal.includes('busy')) {
                    callStatus = 'BUSY';
                } else if (reasonVal.includes('رد') || reasonVal.includes('rejected') || reasonVal.includes('cancel') || reasonVal.includes('cancel')) {
                    callStatus = 'REJECTED';
                } else if (reasonVal.includes('پاسخ') || reasonVal.includes('no answer') || reasonVal.includes('no-answer') || reasonVal.includes('timeout')) {
                    callStatus = 'NO_ANSWER';
                } else {
                    callStatus = 'MISSED';
                }
            }

            // Timestamp
            const timestamp = parseTimestamp(dateIdx > -1 ? row[dateIdx] : '');

            // Construct full description notes preserving all imported data
            let notes = `📥 وارد شده از فایل اکسل گزارش تماس`;
            if (queueIdx > -1 && row[queueIdx]) {
                notes += `\nصف: ${row[queueIdx]}`;
            }
            if (reasonIdx > -1 && row[reasonIdx]) {
                notes += `\nدلیل قطع تماس: ${row[reasonIdx]}`;
            }
            if (waitIdx > -1 && row[waitIdx]) {
                notes += `\nزمان انتظار: ${row[waitIdx]} ثانیه`;
            }

            logsList.push({
                userId: matchedUser?.id,
                customerName,
                customerNumber,
                callType,
                callStatus,
                duration: durationSeconds,
                followUpPhone: followUpPhone || undefined,
                notes,
                timestamp,
                agentName: selectedAgent // Will be set/overwritten during submit
            });
        });

        setParsedLogs(logsList);
        setValidCount(logsList.length);
        setInvalidCount(invalid);
    };

    // Triggered when agent selection changes to re-assign all parsed logs agentName
    useEffect(() => {
        if (parsedLogs.length > 0) {
            setParsedLogs(prev => prev.map(log => ({
                ...log,
                agentName: selectedAgent
            })));
        }
    }, [selectedAgent]);

    const handleImportSubmit = async () => {
        if (parsedLogs.length === 0) return;
        setImporting(true);
        setStep(3);

        const total = parsedLogs.length;
        let success = 0;
        let error = 0;

        setProgress({ current: 0, total, success: 0, error: 0 });

        for (let i = 0; i < total; i++) {
            try {
                const log = parsedLogs[i];
                // Ensure correct agent name is assigned
                log.agentName = selectedAgent;
                await createCallLog(log as any);
                success++;
            } catch (err) {
                console.error("Failed to import row:", parsedLogs[i], err);
                error++;
            }
            setProgress(p => ({ ...p, current: i + 1, success, error }));
        }

        setImporting(false);
        onImportSuccess();
    };

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds === 0) return '۰ ثانیه';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins} دقیقه و ${secs} ثانیه` : `${secs} ثانیه`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up text-right">
                
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <button 
                        onClick={onClose}
                        disabled={importing}
                        className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white">وارد کردن دسته‌ای گزارشات تماس</h3>
                            <p className="text-xxs text-slate-400 mt-0.5">واردسازی گروهی مکالمات مرکز تماس (VOIP) از فایل اکسل یا CSV</p>
                        </div>
                    </div>
                </div>

                {/* Steps Indicator */}
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2.5">
                    {[
                        { num: 1, label: 'بارگذاری فایل' },
                        { num: 2, label: 'پیش‌نمایش و تنظیمات' },
                        { num: 3, label: 'انجام واردسازی' }
                    ].map((s) => (
                        <React.Fragment key={s.num}>
                            <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                    step === s.num
                                        ? 'bg-sky-600 text-white ring-4 ring-sky-100 dark:ring-sky-950'
                                        : step > s.num
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                }`}>
                                    {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                                </span>
                                <span className={`text-xs font-bold ${step === s.num ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {s.num < 3 && <div className="w-8 h-[2px] bg-slate-200 dark:bg-slate-800"></div>}
                        </React.Fragment>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-grow p-6 overflow-y-auto">
                    
                    {/* STEP 1: Upload File */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-950/60 p-4 rounded-2xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
                                <div className="text-xs leading-5 text-sky-800 dark:text-sky-300">
                                    <p className="font-bold mb-1">راهنمای فرمت فایل وارداتی:</p>
                                    <p>فایل شما می‌تواند با فرمت اکسل (xlsx، xls) یا CSV باشد. ستون‌های استاندارد زیر شناسایی خواهند شد:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-1 mt-2 font-mono text-[10px] bg-white dark:bg-slate-900/50 p-2 rounded-xl border border-sky-100 dark:border-sky-950/40">
                                        <div>• # (ردیف)</div>
                                        <div>• مبدا (شماره تماس‌گیرنده)</div>
                                        <div>• مقصد (داخلی/خط مقصد)</div>
                                        <div>• تاریخ تماس (جلالی/میلادی)</div>
                                        <div>• زمان انتظار</div>
                                        <div>• طول تماس (ثانیه)</div>
                                        <div>• نوع تماس (ورودی/خروجی)</div>
                                        <div>• صف / دلیل قطع ارتباط</div>
                                    </div>
                                    <p className="mt-2 text-[11px] text-slate-400 font-sans">💡 سیستم به صورت خودکار شماره‌های تماس را با مشتریان ثبت شده مطابقت داده و به پرونده آنها پیوست می‌کند.</p>
                                </div>
                            </div>

                            <div
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                                    dragActive 
                                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 scale-[0.99]' 
                                        : 'border-slate-200 dark:border-slate-800 hover:border-sky-400 hover:bg-slate-50/30'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Upload className="w-12 h-12 text-slate-400 mb-4 animate-bounce" />
                                <h4 className="text-sm font-black text-slate-800 dark:text-white">انتخاب یا رها کردن فایل اکسل / CSV</h4>
                                <p className="text-xxs text-slate-400 mt-1.5">کلیک کنید یا فایل را به این ناحیه بکشید</p>
                                <span className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors">
                                    انتخاب فایل از سیستم
                                </span>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Preview & Settings */}
                    {step === 2 && (
                        <div className="space-y-6">
                            
                            {/* Import Config */}
                            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-3.5 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-sky-500" />
                                    تنظیمات واردسازی یادداشت‌های تماس
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="import-agent-picker" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">کارشناس پیگیری (ثبت‌کننده تماس)</label>
                                        <select
                                            id="import-agent-picker"
                                            value={selectedAgent}
                                            onChange={e => setSelectedAgent(e.target.value)}
                                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none dark:text-white"
                                        >
                                            <option value={loggedInUser?.username || 'مدیر سیستم'}>{loggedInUser?.username || 'مدیر سیستم'} (شما)</option>
                                            {staffUsers.map(s => (
                                                <option key={s.id} value={s.username}>{s.username}</option>
                                            ))}
                                            <option value="کارشناس فروش ۱">کارشناس فروش ۱</option>
                                            <option value="کارشناس فروش ۲">کارشناس فروش ۲</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="bg-sky-50/50 dark:bg-sky-950/10 border border-sky-100 dark:border-sky-950/40 p-3 rounded-xl flex items-center gap-2.5 w-full">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                                تعداد {validCount.toLocaleString('fa-IR')} ردیف تماس آماده واردسازی گروهی است.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview List */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">پیش‌نمایش لیست ردیف‌های استخراج شده ({parsedLogs.length.toLocaleString('fa-IR')} ردیف)</h4>
                                    <span className="text-xxs text-slate-400">۱۰ ردیف اول جهت بررسی نمایش داده می‌شود</span>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <table className="w-full text-right border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                                                <th className="p-3.5">مشتری</th>
                                                <th className="p-3.5">تلفن</th>
                                                <th className="p-3.5">نوع تماس</th>
                                                <th className="p-3.5">وضعیت</th>
                                                <th className="p-3.5">زمان</th>
                                                <th className="p-3.5">مدت مکالمه</th>
                                                <th className="p-3.5">کارشناس</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {parsedLogs.slice(0, 10).map((log, idx) => {
                                                const hasUser = !!log.userId;
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="p-3.5 font-bold text-slate-800 dark:text-white">
                                                            {hasUser ? (
                                                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    {log.customerName}
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                                                    <HelpCircle className="w-3.5 h-3.5" />
                                                                    {log.customerName}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 font-bold">{log.customerNumber}</td>
                                                        <td className="p-3.5">
                                                            {log.callType === 'INBOUND' ? (
                                                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                                                    <PhoneIncoming className="w-3 h-3" />
                                                                    ورودی
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">
                                                                    <PhoneOutgoing className="w-3 h-3" />
                                                                    خروجی
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3.5">
                                                            {log.callStatus === 'SUCCESSFUL' ? (
                                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">موفق</span>
                                                            ) : log.callStatus === 'MISSED' ? (
                                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">ناموفق / از دست رفته</span>
                                                            ) : log.callStatus === 'NO_ANSWER' ? (
                                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-medium">بدون پاسخ</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">{log.callStatus}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400 font-bold">{log.timestamp}</td>
                                                        <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">{formatDuration(log.duration || 0)}</td>
                                                        <td className="p-3.5 text-slate-500 dark:text-slate-400 font-medium">{log.agentName}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {parsedLogs.length > 10 && (
                                    <p className="text-center text-xxs text-slate-400 mt-2.5">باقی { (parsedLogs.length - 10).toLocaleString('fa-IR') } ردیف دیگر جهت سرعت بارگذاری در این لیست نشان داده نشده‌اند.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Progress & Import */}
                    {step === 3 && (
                        <div className="space-y-6 py-10 flex flex-col items-center justify-center">
                            {importing ? (
                                <>
                                    <div className="relative flex items-center justify-center mb-6">
                                        <Loader2 className="w-16 h-16 animate-spin text-sky-500" />
                                        <span className="absolute text-[11px] font-black text-sky-600 font-mono">
                                            {Math.round((progress.current / progress.total) * 100)}%
                                        </span>
                                    </div>
                                    <h4 className="text-base font-black text-slate-800 dark:text-white">در حال ثبت گزارش‌های تماس...</h4>
                                    <p className="text-xs text-slate-400 mt-1">لطفاً تا پایان فرآیند پنجره را نبندید.</p>
                                    
                                    {/* Progress Bar */}
                                    <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-6">
                                        <div 
                                            className="bg-sky-500 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        ></div>
                                    </div>
                                    
                                    <div className="flex gap-6 mt-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                                        <span>کل: {progress.total.toLocaleString('fa-IR')}</span>
                                        <span className="text-emerald-500">موفق: {progress.success.toLocaleString('fa-IR')}</span>
                                        <span className="text-rose-500">ناموفق: {progress.error.toLocaleString('fa-IR')}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mb-5 ring-8 ring-emerald-100 dark:ring-emerald-950">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h4 className="text-base font-black text-slate-800 dark:text-white">واردسازی با موفقیت پایان یافت!</h4>
                                    <p className="text-xs text-slate-400 mt-1">گزارش‌های تماس جدید وارد سرور شده و در تاریخچه مشتریان ذخیره گردید.</p>
                                    
                                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl w-full max-w-sm mt-6 grid grid-cols-2 gap-4 text-center">
                                        <div className="border-l border-slate-100 dark:border-slate-800">
                                            <p className="text-xxs text-slate-400">مجموع ثبت شده</p>
                                            <h3 className="text-xl font-black text-emerald-500 mt-1 font-mono">{(progress.success).toLocaleString('fa-IR')}</h3>
                                        </div>
                                        <div>
                                            <p className="text-xxs text-slate-400">ردیف‌های نامعتبر</p>
                                            <h3 className="text-xl font-black text-slate-400 mt-1 font-mono">{(invalidCount + progress.error).toLocaleString('fa-IR')}</h3>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                </div>

                {/* Modal Footer Controls */}
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
                    
                    {/* Back / Cancel buttons */}
                    {step === 1 ? (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-white font-bold text-xs rounded-xl transition-all"
                        >
                            انصراف
                        </button>
                    ) : step === 2 ? (
                        <button
                            onClick={() => setStep(1)}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-white hover:bg-slate-50 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                        >
                            <ArrowRight className="w-4 h-4" />
                            مرحله قبل / تغییر فایل
                        </button>
                    ) : (
                        <div></div> // Empty spacer for step 3
                    )}

                    {/* Next / Action buttons */}
                    {step === 1 ? (
                        <button
                            disabled={!fileName}
                            onClick={() => setStep(2)}
                            className={`px-5 py-2.5 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 ${
                                fileName 
                                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            مرحله بعد (پیش‌نمایش)
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    ) : step === 2 ? (
                        <button
                            onClick={handleImportSubmit}
                            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            شروع بارگذاری و واردسازی ({parsedLogs.length.toLocaleString('fa-IR')} تماس)
                        </button>
                    ) : (
                        !importing && (
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                            >
                                بستن پنجره
                            </button>
                        )
                    )}

                </div>

            </div>
        </div>
    );
};
