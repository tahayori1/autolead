import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { CommissionDeal, CommissionCategory, CommissionPaymentStatus, CommissionPeriod } from '../../types';
import { 
    X, 
    Upload, 
    FileSpreadsheet, 
    CheckCircle, 
    AlertTriangle, 
    ArrowRight, 
    Layers, 
    Table, 
    Building2, 
    Repeat, 
    FileText, 
    CreditCard, 
    ClipboardList,
    CheckSquare,
    Square,
    PlusCircle,
    RefreshCw,
    Database,
    Calendar,
    Plus,
    Info
} from 'lucide-react';

interface CommissionExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (importedDeals: CommissionDeal[], targetPeriodId: string, replaceExisting?: boolean) => void;
    periods: CommissionPeriod[];
    activePeriodId: string;
    onAddNewPeriod?: (title: string) => string; // returns new period id
}

interface DetectedSheet {
    sheetName: string;
    category: CommissionCategory;
    deals: CommissionDeal[];
    selected: boolean;
    totalSales: number;
    totalCommission: number;
    rawRowCount: number;
}

export const CommissionExcelImportModal: React.FC<CommissionExcelImportModalProps> = ({
    isOpen,
    onClose,
    onImport,
    periods,
    activePeriodId,
    onAddNewPeriod
}) => {
    // Target Period selection state
    const [selectedTargetPeriodId, setSelectedTargetPeriodId] = useState<string>(activePeriodId || (periods[0]?.id ?? '1405-05'));
    const [isCreatingInlinePeriod, setIsCreatingInlinePeriod] = useState(false);
    const [inlinePeriodTitle, setInlinePeriodTitle] = useState('');

    // File & Parse States
    const [fileName, setFileName] = useState<string>('');
    const [fileSize, setFileSize] = useState<string>('');
    const [detectedSheets, setDetectedSheets] = useState<DetectedSheet[]>([]);
    const [activePreviewSheetIndex, setActivePreviewSheetIndex] = useState<number>(0);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    const [parseError, setParseError] = useState<string | null>(null);
    const [step, setStep] = useState<'upload' | 'review'>('upload');
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Text paste fallback
    const [rawTextFallback, setRawTextFallback] = useState('');
    const [showTextFallback, setShowTextFallback] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const targetPeriod = periods.find(p => p.id === selectedTargetPeriodId) || {
        id: selectedTargetPeriodId,
        title: selectedTargetPeriodId
    };

    // Convert Persian & Arabic numbers to standard English digits
    const toAsciiDigits = (str: any): string => {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/[۰٠]/g, '0')
            .replace(/[۱١]/g, '1')
            .replace(/[۲٢]/g, '2')
            .replace(/[۳٣]/g, '3')
            .replace(/[۴٤]/g, '4')
            .replace(/[۵٥]/g, '5')
            .replace(/[۶٦]/g, '6')
            .replace(/[۷٧]/g, '7')
            .replace(/[۸٨]/g, '8')
            .replace(/[۹٩]/g, '9');
    };

    // Clean currency and price strings into numbers
    const cleanNumber = (val: any): number => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        
        const asciiStr = toAsciiDigits(val)
            .replace(/["']/g, '')
            .replace(/,/g, '')
            .replace(/،/g, '')
            .replace(/ریال/g, '')
            .replace(/تومان/g, '')
            .replace(/\s+/g, '')
            .trim();
        
        const num = parseFloat(asciiStr);
        return isNaN(num) ? 0 : num;
    };

    // Parse dates (supports Excel serial numbers, formatted strings, etc.)
    const parseExcelDate = (val: any, defaultMonthPrefix: string): string => {
        if (!val) return `${defaultMonthPrefix}/01`;
        
        if (typeof val === 'number' && val > 30000 && val < 60000) {
            // Excel serial date number
            const date = new Date((val - (25567 + 2)) * 86400 * 1000);
            if (!isNaN(date.getTime())) {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${y}/${m}/${d}`;
            }
        }

        const dateStr = toAsciiDigits(val).trim();
        if (dateStr.includes('/') || dateStr.includes('-')) {
            return dateStr.replace(/-/g, '/');
        }

        return dateStr || `${defaultMonthPrefix}/01`;
    };

    // Auto-detect category based on sheet name
    const guessCategoryFromSheetName = (name: string): CommissionCategory => {
        const lower = name.trim().toLowerCase();
        if (lower.includes('انبار') || lower.includes('anbar')) return 'ANBAR';
        if (lower.includes('آزاد') || lower.includes('azad')) return 'AZAD';
        if (lower.includes('حواله') || lower.includes('havaleh')) return 'HAVALEH';
        if (lower.includes('لیزینگ') || lower.includes('leasing') || lower.includes('اقساط')) return 'LEASING';
        if (lower.includes('ثبت') || lower.includes('کارخانه') || lower.includes('reg') || lower.includes('ثبت نام')) return 'REGISTRATION';
        return 'ANBAR';
    };

    // Process Workbook using SheetJS
    const processExcelWorkbook = (workbook: XLSX.WorkBook) => {
        const sheetsResult: DetectedSheet[] = [];
        const monthNum = selectedTargetPeriodId.includes('-') ? selectedTargetPeriodId.split('-')[1] : '05';
        const defaultDatePrefix = `1405/${monthNum}`;

        workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) return;

            // Convert worksheet to 2D array of rows
            const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: false });
            if (!rows || rows.length === 0) return;

            // 1. Detect Header Row across first 25 rows
            let headerRowIndex = -1;
            const headerMap: Record<string, number> = {};

            for (let r = 0; r < Math.min(rows.length, 25); r++) {
                const row = rows[r];
                if (!Array.isArray(row)) continue;

                const rowStr = row.map(c => toAsciiDigits(c || '').trim()).join(' ');
                
                // Match common Persian column header keywords
                if (
                    rowStr.includes('پرسنل') || 
                    rowStr.includes('خودرو') || 
                    rowStr.includes('مشتری') || 
                    rowStr.includes('خریدار') ||
                    rowStr.includes('پورسانت') ||
                    rowStr.includes('نرخ فروش') ||
                    rowStr.includes('قیمت فروش') ||
                    rowStr.includes('ردیف')
                ) {
                    headerRowIndex = r;
                    row.forEach((colName, colIdx) => {
                        const cName = String(colName || '').trim();
                        if (cName) {
                            headerMap[cName] = colIdx;
                        }
                    });
                    break;
                }
            }

            const category = guessCategoryFromSheetName(sheetName);
            const deals: CommissionDeal[] = [];
            const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

            for (let r = startRow; r < rows.length; r++) {
                const row = rows[r];
                if (!row || !Array.isArray(row)) continue;

                // Skip summary/footer rows
                const firstColStr = String(row[0] || '').trim();
                const allRowStr = row.map(c => String(c || '')).join(' ');
                if (
                    firstColStr.includes('جمع') || 
                    firstColStr.includes('کل') || 
                    allRowStr.includes('جمع کل') ||
                    allRowStr.includes('مجموع')
                ) {
                    continue;
                }

                // Value extractor with keywords and fallback index
                const getVal = (possibleHeaders: string[], fallbackIdx: number): any => {
                    for (const h of possibleHeaders) {
                        for (const key of Object.keys(headerMap)) {
                            if (key.includes(h)) {
                                const val = row[headerMap[key]];
                                if (val !== undefined && val !== '') return val;
                            }
                        }
                    }
                    return row[fallbackIdx] !== undefined ? row[fallbackIdx] : '';
                };

                const salesPersonRaw = String(getVal(['پرسنل', 'کارشناس', 'فروشنده', 'مشاور', 'مسئول'], 3) || '').trim();
                const customerName = String(getVal(['مشتری', 'خریدار', 'متقاضی', 'طرف حساب'], 4) || '').trim();
                const carModel = String(getVal(['خودرو', 'مدل', 'تیپ', 'اتومبیل'], 5) || '').trim();
                const sellerName = String(getVal(['فروشنده', 'مالک', 'صاحب'], 14) || '').trim();

                const purchasePrice = cleanNumber(getVal(['نرخ خرید', 'قیمت خرید', 'مبلغ خرید'], 6));
                const dailyPrice = cleanNumber(getVal(['قیمت روز', 'نرخ روز', 'ارزش روز'], 7));
                const salePrice = cleanNumber(getVal(['نرخ فروش', 'مبلغ فروش', 'قیمت فروش', 'پیش پرداخت', 'فروش'], 8));

                // If row has no personnel, customer, car model, or price, skip empty row
                if (!salesPersonRaw && !customerName && !carModel && salePrice === 0) {
                    continue;
                }

                // Parse shared sales personnel
                let salesPerson = salesPersonRaw || 'تیم فروش عمومی';
                let contractWriter = '';
                let sharedPersons: string[] = [];

                if (salesPersonRaw.includes('/')) {
                    const parts = salesPersonRaw.split('/').map(p => p.trim());
                    salesPerson = parts[0].replace('قولنامه', '').trim();
                    if (parts[1]) {
                        contractWriter = parts[1].replace('قولنامه', '').trim();
                        sharedPersons = [salesPerson, contractWriter].filter(Boolean);
                    }
                } else if (salesPersonRaw.includes(' و ')) {
                    const parts = salesPersonRaw.split(' و ').map(p => p.trim());
                    if (parts.length > 1) {
                        sharedPersons = parts;
                        salesPerson = parts.join(' و ');
                    }
                }

                const purchaseDate = parseExcelDate(getVal(['تاریخ خرید', 'خرید تاریخ'], 1), defaultDatePrefix);
                const saleDate = parseExcelDate(getVal(['تاریخ فروش', 'تاریخ معامله', 'تاریخ'], 2), defaultDatePrefix);

                // Daily Profit/Loss
                let dailyProfitLoss = cleanNumber(getVal(['سود یا زیان روز', 'سود روز', 'زیان روز', 'سود یا زیان'], 9));
                if (dailyProfitLoss === 0 && salePrice > 0 && dailyPrice > 0) {
                    dailyProfitLoss = salePrice - dailyPrice;
                }

                // Gross Profit
                const grossProfit = cleanNumber(getVal(['سود ناخالص', 'کمیسیون کل', 'کمیسیون آزاد', 'مارجین'], 10)) || 
                    (salePrice > 0 && purchasePrice > 0 ? (salePrice - purchasePrice) : 0);

                // Commission Rate
                let commissionRate = category === 'ANBAR' ? 0.05 : (category === 'AZAD' ? 10 : (category === 'LEASING' ? 0.1 : 0.05));
                const rateFromCell = getVal(['درصد پورسانت', 'درصد کمیسیون', 'درصد'], 10);
                if (rateFromCell) {
                    const parsedRate = cleanNumber(rateFromCell);
                    if (parsedRate > 0) {
                        commissionRate = parsedRate > 1 && category !== 'AZAD' ? parsedRate / 100 : parsedRate;
                    }
                }

                // Commission Amount
                let commissionAmount = cleanNumber(getVal(['پورسانت', 'کمیسیون', 'مبلغ پورسانت'], 11));
                if (commissionAmount === 0) {
                    if (category === 'AZAD') {
                        commissionAmount = Math.round(grossProfit * (commissionRate / 100));
                    } else {
                        commissionAmount = Math.round(salePrice * (commissionRate / 100));
                    }
                }

                // Paid Share & Payment Notes
                const paidVal = getVal(['سهم پورسانت', 'پرداختی', 'واریز', 'مبلغ پرداختی'], 12);
                const notesVal = String(getVal(['توضیحات واریز', 'وضعیت واریز', 'توضیحات', 'وضعیت'], 13) || '').trim();

                let paidCommissionShare: number | undefined = undefined;
                let paymentNotes = notesVal;

                if (paidVal !== undefined && paidVal !== '') {
                    const numShare = cleanNumber(paidVal);
                    if (numShare > 0) {
                        paidCommissionShare = numShare;
                    } else if (String(paidVal).trim().length > 2 && String(paidVal).trim() !== '-') {
                        paymentNotes = paymentNotes ? `${paymentNotes} | ${String(paidVal).trim()}` : String(paidVal).trim();
                    }
                }

                let paymentStatus: CommissionPaymentStatus = 'PENDING';
                if (paymentNotes.includes('واریز شد') || paymentNotes.includes('تسویه') || paymentNotes.includes('پرداخت شد')) {
                    paymentStatus = 'PAID';
                } else if (paidCommissionShare && paidCommissionShare < commissionAmount && paidCommissionShare > 0) {
                    paymentStatus = 'PARTIAL';
                }

                deals.push({
                    id: `xlsx-${sheetName}-${Date.now()}-${r}-${Math.random().toString(36).substr(2, 5)}`,
                    category,
                    rowNumber: deals.length + 1,
                    periodId: selectedTargetPeriodId,
                    periodName: targetPeriod.title,
                    purchaseDate: purchaseDate || undefined,
                    saleDate,
                    salesPerson,
                    contractWriter: contractWriter || undefined,
                    sharedPersons: sharedPersons.length > 0 ? sharedPersons : undefined,
                    customerName: customerName || 'مشتری بدون نام',
                    sellerName: sellerName || undefined,
                    carModel: carModel || 'خودرو متفرقه',
                    purchasePrice,
                    dailyPrice,
                    salePrice,
                    dailyProfitLoss,
                    grossProfit,
                    commissionRate,
                    commissionAmount,
                    paidCommissionShare: paidCommissionShare ?? (paymentStatus === 'PAID' ? commissionAmount : 0),
                    paymentStatus,
                    paymentNotes: paymentNotes || undefined,
                    createdAt: new Date().toISOString()
                });
            }

            if (deals.length > 0) {
                const totalSales = deals.reduce((sum, d) => sum + (d.salePrice || 0), 0);
                const totalCommission = deals.reduce((sum, d) => sum + (d.commissionAmount || 0), 0);

                sheetsResult.push({
                    sheetName,
                    category,
                    deals,
                    selected: true,
                    totalSales,
                    totalCommission,
                    rawRowCount: rows.length
                });
            }
        });

        if (sheetsResult.length === 0) {
            setParseError('هیچ ردیف معامله معتبری در فایل اکسل شناسایی نشد. لطفاً ساختار ستون‌های فایل را بررسی کنید.');
            setIsProcessing(false);
            return;
        }

        setDetectedSheets(sheetsResult);
        setActivePreviewSheetIndex(0);
        setStep('review');
        setIsProcessing(false);
    };

    // Handle File Drop or Upload
    const handleFileChange = (file: File) => {
        setParseError(null);
        setIsProcessing(true);
        setFileName(file.name);
        setFileSize((file.size / 1024).toFixed(1) + ' KB');

        const reader = new FileReader();

        if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const workbook = XLSX.read(text, { type: 'string' });
                    processExcelWorkbook(workbook);
                } catch (err: any) {
                    setParseError('خطا در خواندن فایل CSV: ' + (err.message || ''));
                    setIsProcessing(false);
                }
            };
            reader.readAsText(file, 'UTF-8');
        } else {
            // Binary xlsx / xls
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    processExcelWorkbook(workbook);
                } catch (err: any) {
                    setParseError('خطا در پردازش فایل اکسل (XLSX): ' + (err.message || 'قالب نامعتبر است.'));
                    setIsProcessing(false);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    // Inline Period Creation Handler
    const handleCreateInlinePeriod = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inlinePeriodTitle.trim()) return;

        if (onAddNewPeriod) {
            const newId = onAddNewPeriod(inlinePeriodTitle.trim());
            setSelectedTargetPeriodId(newId);
        }
        setIsCreatingInlinePeriod(false);
        setInlinePeriodTitle('');
    };

    // Toggle Sheet selection
    const handleToggleSheet = (index: number) => {
        setDetectedSheets(prev => prev.map((s, idx) => idx === index ? { ...s, selected: !s.selected } : s));
    };

    // Select/Deselect All Sheets
    const handleSelectAllSheets = (selected: boolean) => {
        setDetectedSheets(prev => prev.map(s => ({ ...s, selected })));
    };

    // Change category of a sheet
    const handleChangeSheetCategory = (index: number, newCat: CommissionCategory) => {
        setDetectedSheets(prev => prev.map((s, idx) => {
            if (idx === index) {
                const updatedDeals = s.deals.map(d => ({ ...d, category: newCat }));
                return { ...s, category: newCat, deals: updatedDeals };
            }
            return s;
        }));
    };

    // Toggle single deal
    const handleToggleDeal = (dealId: string) => {
        setDetectedSheets(prev => prev.map((s, idx) => {
            if (idx === activePreviewSheetIndex) {
                return {
                    ...s,
                    deals: s.deals.filter(d => d.id !== dealId)
                };
            }
            return s;
        }));
    };

    // Final Confirmation
    const handleConfirmFinalImport = () => {
        const selectedDeals: CommissionDeal[] = [];
        detectedSheets.forEach(sheet => {
            if (sheet.selected) {
                // Ensure all deals have the selected target periodId & periodName
                const updatedPeriodDeals = sheet.deals.map(d => ({
                    ...d,
                    periodId: selectedTargetPeriodId,
                    periodName: targetPeriod.title
                }));
                selectedDeals.push(...updatedPeriodDeals);
            }
        });

        if (selectedDeals.length === 0) {
            alert('لطفاً حداقل یک شیت یا معامله را برای درون‌ریزی انتخاب کنید.');
            return;
        }

        onImport(selectedDeals, selectedTargetPeriodId, importMode === 'replace');
        onClose();
    };

    const totalSelectedDeals = detectedSheets.filter(s => s.selected).reduce((sum, s) => sum + s.deals.length, 0);
    const totalSelectedSales = detectedSheets.filter(s => s.selected).reduce((sum, s) => sum + s.totalSales, 0);
    const totalSelectedCommission = detectedSheets.filter(s => s.selected).reduce((sum, s) => sum + s.totalCommission, 0);
    const activeSheet = detectedSheets[activePreviewSheetIndex] || detectedSheets[0];

    const getCategoryBadge = (cat: CommissionCategory) => {
        switch (cat) {
            case 'ANBAR': return { label: 'فروش انبار', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300', icon: <Building2 className="w-3 h-3" /> };
            case 'AZAD': return { label: 'فروش آزاد', bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300', icon: <Repeat className="w-3 h-3" /> };
            case 'HAVALEH': return { label: 'فروش حواله', bg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300', icon: <FileText className="w-3 h-3" /> };
            case 'LEASING': return { label: 'لیزینگ', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300', icon: <CreditCard className="w-3 h-3" /> };
            case 'REGISTRATION': return { label: 'ثبت‌نام', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300', icon: <ClipboardList className="w-3 h-3" /> };
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-fade-in" dir="rtl">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
                
                {/* Modal Top Header */}
                <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-l from-emerald-500/10 via-indigo-500/5 to-transparent">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-800 dark:text-white">
                                    درون‌ریزی فایل‌های اکسل پورسانت (XLSX / چند شیت)
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                    دقت بالا و چندجدولی
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                انتخاب دقیق دوره مالی مقصد، تفکیک خودکار شیت‌ها و ثبت معاملات
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Target Period Selector Bar (Prominent at top) */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                            تعیین دوره مالی مقصد برای این فایل:
                        </span>
                        
                        {/* Period Dropdown */}
                        <select
                            value={selectedTargetPeriodId}
                            onChange={(e) => setSelectedTargetPeriodId(e.target.value)}
                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm cursor-pointer"
                        >
                            {periods.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.title} ({p.id})
                                </option>
                            ))}
                        </select>

                        {/* Inline Period Creation Button */}
                        {!isCreatingInlinePeriod ? (
                            <button
                                type="button"
                                onClick={() => setIsCreatingInlinePeriod(true)}
                                className="px-2.5 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl border border-dashed border-emerald-400 flex items-center gap-1 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                دوره جدید...
                            </button>
                        ) : (
                            <form onSubmit={handleCreateInlinePeriod} className="flex items-center gap-1.5">
                                <input
                                    type="text"
                                    value={inlinePeriodTitle}
                                    onChange={e => setInlinePeriodTitle(e.target.value)}
                                    placeholder="مثلاً: شهریور ۱۴۰۵"
                                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-emerald-500 rounded-xl text-xs text-slate-800 dark:text-white font-bold outline-none w-32"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
                                >
                                    ثبت
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingInlinePeriod(false)}
                                    className="text-xs text-slate-400 hover:text-slate-600 p-1"
                                >
                                    ✕
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-bold">
                        معاملات در دوره <span className="text-emerald-600 dark:text-emerald-400 font-black">«{targetPeriod.title}»</span> ثبت خواهند شد.
                    </div>
                </div>

                {/* Main Modal Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    
                    {/* Step 1: Upload Dropzone */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            
                            {/* Drag & Drop Area */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                        handleFileChange(e.dataTransfer.files[0]);
                                    }
                                }}
                                onClick={() => {
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                        fileInputRef.current.click();
                                    }
                                }}
                                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
                                    isDragging 
                                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]' 
                                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                                }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                                    accept=".xlsx,.xls,.csv,.tsv"
                                    className="hidden"
                                />

                                <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                                    <Upload className="w-8 h-8 animate-pulse" />
                                </div>

                                <div>
                                    <h4 className="text-base font-black text-slate-800 dark:text-white">
                                        فایل اکسل پورسانت (.xlsx یا .xls) را اینجا رها کنید یا کلیک نمایید
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                                        تشخیص خودکار تمام شیت‌ها و جدول‌های ۵ گانه (فروش انبار، آزاد، حواله، لیزینگ و ثبت‌نام)، تفکیک قراردادهای شراکتی ۵۰٪ و مبالغ واریزی
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                    <Layers className="w-3.5 h-3.5" />
                                    پشتیبانی از فایل‌های اکسل چندجدولی و چند شیته
                                </div>
                            </div>

                            {/* Processing Indicator */}
                            {isProcessing && (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-3 text-indigo-700 dark:text-indigo-300 text-xs font-bold animate-pulse">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    در حال پردازش و استخراج جدول‌های شیت اکسل...
                                </div>
                            )}

                            {/* Parse Error Notification */}
                            {parseError && (
                                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                    <span>{parseError}</span>
                                </div>
                            )}

                            {/* Text Paste Fallback Toggle */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setShowTextFallback(!showTextFallback)}
                                    className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold flex items-center gap-1.5"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                    {showTextFallback ? 'بستن کادر جای‌گذاری متنی' : 'نیاز به کپی/پیست مستقیم متن اکسل یا CSV دارید؟ (اینجا کلیک کنید)'}
                                </button>

                                {showTextFallback && (
                                    <div className="mt-3 space-y-3">
                                        <textarea
                                            value={rawTextFallback}
                                            onChange={e => setRawTextFallback(e.target.value)}
                                            rows={6}
                                            placeholder="ردیف,تاریخ خرید,تاریخ فروش,نام پرسنل فروش,نام مشتری,مدل خودرو,نرخ خرید,قیمت روز,نرخ فروش,سودیا زیان روز,درصد پورسانت,پورسانت&#10;1,,1405/05/10,درسا محمدی,هدیه توکلی,(1405) eagle,21000000000,24500000000,24600000000,100000000,0.05,12300000"
                                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                                            dir="ltr"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!rawTextFallback.trim()) {
                                                    setParseError('لطفاً متنی در کادر جای‌گذاری کنید.');
                                                    return;
                                                }
                                                try {
                                                    const wb = XLSX.read(rawTextFallback, { type: 'string' });
                                                    processExcelWorkbook(wb);
                                                } catch (e: any) {
                                                    setParseError('خطا در پردازش متن: ' + e?.message);
                                                }
                                            }}
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                                        >
                                            پردازش متن جای‌گذاری‌شده
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {/* Step 2: Multi-Sheet Review & Confirmation */}
                    {step === 'review' && (
                        <div className="space-y-6">
                            
                            {/* File and Target Period Summary Banner */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 rounded-xl">
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <span>فایل: {fileName || 'کپی مستقیم'}</span>
                                            {fileSize && <span className="text-xs font-mono font-normal text-slate-400">({fileSize})</span>}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            دوره مقصد: <b className="text-emerald-600 dark:text-emerald-400">{targetPeriod.title}</b> | شناسایی <b className="text-slate-700 dark:text-slate-200">{detectedSheets.length} شیت</b>
                                        </p>
                                    </div>
                                </div>

                                {/* Summary Pills */}
                                <div className="flex flex-wrap items-center gap-3 text-xs">
                                    <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <span className="text-slate-400">کل معاملات انتخابی:</span>{' '}
                                        <b className="font-mono text-emerald-600 font-black">{totalSelectedDeals}</b>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <span className="text-slate-400">مجموع پورسانت:</span>{' '}
                                        <b className="font-mono text-indigo-600 font-black">{totalSelectedCommission.toLocaleString('fa-IR')} ریال</b>
                                    </div>
                                </div>
                            </div>

                            {/* Detected Sheets Selector Cards */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Layers className="w-4 h-4 text-emerald-600" />
                                        شیت‌ها و جدول‌های استخراج‌شده از اکسل:
                                    </h5>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleSelectAllSheets(true)}
                                            className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                                        >
                                            انتخاب همه شیت‌ها
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectAllSheets(false)}
                                            className="text-[11px] text-slate-500 font-bold hover:underline"
                                        >
                                            عدم انتخاب همه
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {detectedSheets.map((sheet, idx) => {
                                        const badge = getCategoryBadge(sheet.category);
                                        const isActive = activePreviewSheetIndex === idx;

                                        return (
                                            <div
                                                key={idx}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                                    isActive 
                                                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' 
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                }`}
                                                onClick={() => setActivePreviewSheetIndex(idx)}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleSheet(idx);
                                                            }}
                                                            className="text-emerald-600 hover:text-emerald-700"
                                                        >
                                                            {sheet.selected ? (
                                                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                                                            ) : (
                                                                <Square className="w-5 h-5 text-slate-300" />
                                                            )}
                                                        </button>
                                                        <span className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[140px]" title={sheet.sheetName}>
                                                            {sheet.sheetName}
                                                        </span>
                                                    </div>

                                                    {/* Category Selector Dropdown */}
                                                    <select
                                                        value={sheet.category}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleChangeSheetCategory(idx, e.target.value as CommissionCategory);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 cursor-pointer outline-none ${badge.bg}`}
                                                    >
                                                        <option value="ANBAR">🏢 فروش انبار</option>
                                                        <option value="AZAD">🔄 فروش آزاد</option>
                                                        <option value="HAVALEH">📄 فروش حواله</option>
                                                        <option value="LEASING">💳 لیزینگ</option>
                                                        <option value="REGISTRATION">📋 ثبت‌نام</option>
                                                    </select>
                                                </div>

                                                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60 font-mono">
                                                    <span>{sheet.deals.length} معامله</span>
                                                    <span className="font-bold text-emerald-600">{sheet.totalCommission.toLocaleString('fa-IR')} ریال</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Active Sheet Table Preview */}
                            {activeSheet && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-800 dark:text-white">
                                                پیش‌نمایش ردیف‌های شیت «{activeSheet.sheetName}»:
                                            </span>
                                            <span className="text-xs text-slate-500 font-mono">
                                                ({activeSheet.deals.length} معامله شناسایی‌شده)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto max-h-[35vh]">
                                        <table className="w-full text-xs text-right border-collapse">
                                            <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="p-2.5">#</th>
                                                    <th className="p-2.5">تاریخ فروش</th>
                                                    <th className="p-2.5">پرسنل فروش</th>
                                                    <th className="p-2.5">نام مشتری / خریدار</th>
                                                    <th className="p-2.5">مدل خودرو</th>
                                                    <th className="p-2.5">نرخ فروش (ریال)</th>
                                                    <th className="p-2.5">سود/زیان یا ناخالص</th>
                                                    <th className="p-2.5">پورسانت محاسبه‌شده</th>
                                                    <th className="p-2.5">وضعیت واریز</th>
                                                    <th className="p-2.5">حذف</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                                {activeSheet.deals.map((deal, dIdx) => (
                                                    <tr key={deal.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                        <td className="p-2.5 font-mono text-slate-400">{dIdx + 1}</td>
                                                        <td className="p-2.5 font-mono">{deal.saleDate}</td>
                                                        <td className="p-2.5 font-bold">
                                                            {deal.salesPerson}
                                                            {deal.contractWriter && (
                                                                <span className="text-[10px] text-indigo-500 block">
                                                                    قولنامه: {deal.contractWriter}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5">{deal.customerName}</td>
                                                        <td className="p-2.5 font-bold text-slate-800 dark:text-white">{deal.carModel}</td>
                                                        <td className="p-2.5 font-mono">{deal.salePrice.toLocaleString('fa-IR')}</td>
                                                        <td className={`p-2.5 font-mono font-bold ${deal.dailyProfitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {(deal.category === 'AZAD' ? deal.grossProfit : deal.dailyProfitLoss).toLocaleString('fa-IR')}
                                                        </td>
                                                        <td className="p-2.5 font-mono font-black text-emerald-600">
                                                            {deal.commissionAmount.toLocaleString('fa-IR')}
                                                        </td>
                                                        <td className="p-2.5">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                deal.paymentStatus === 'PAID'
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                                                                    : deal.paymentStatus === 'PARTIAL'
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                            }`}>
                                                                {deal.paymentStatus === 'PAID' ? 'واریز شد' : deal.paymentStatus === 'PARTIAL' ? 'علی‌الحساب' : 'در انتظار'}
                                                            </span>
                                                        </td>
                                                        <td className="p-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleDeal(deal.id)}
                                                                className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                                                                title="حذف این ردیف"
                                                            >
                                                                ✕
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Import Mode: Append vs Replace */}
                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <span className="text-xs font-black text-slate-800 dark:text-white">
                                        نحوه اعمال در دوره ({targetPeriod.title}):
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                                        importMode === 'append'
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="importMode"
                                            value="append"
                                            checked={importMode === 'append'}
                                            onChange={() => setImportMode('append')}
                                            className="hidden"
                                        />
                                        ➕ افزودن به معاملات موجود این دوره
                                    </label>

                                    <label className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                                        importMode === 'replace'
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="importMode"
                                            value="replace"
                                            checked={importMode === 'replace'}
                                            onChange={() => setImportMode('replace')}
                                            className="hidden"
                                        />
                                        🔄 پاکسازی و جایگزینی کامل دوره با این فایل
                                    </label>
                                </div>
                            </div>

                        </div>
                    )}

                </div>

                {/* Modal Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                    {step === 'review' ? (
                        <button
                            type="button"
                            onClick={() => {
                                setStep('upload');
                                setDetectedSheets([]);
                            }}
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            ← بازگشت و انتخاب فایل دیگر
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            انصراف
                        </button>
                    )}

                    {step === 'review' && (
                        <button
                            type="button"
                            onClick={handleConfirmFinalImport}
                            disabled={totalSelectedDeals === 0}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle className="w-4 h-4" />
                            درون‌ریزی نهایی {totalSelectedDeals} معامله در دوره «{targetPeriod.title}»
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};
