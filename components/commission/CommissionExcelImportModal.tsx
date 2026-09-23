import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { CommissionDeal, CommissionCategory, CommissionPaymentStatus, CommissionPeriod } from '../../types';
import { 
    X, 
    Upload, 
    FileSpreadsheet, 
    CheckCircle, 
    AlertTriangle, 
    ArrowRight, 
    ArrowLeft,
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
    Info,
    SlidersHorizontal,
    Eye,
    Check
} from 'lucide-react';

interface CommissionExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (importedDeals: CommissionDeal[], targetPeriodId: string, replaceExisting?: boolean) => void;
    periods: CommissionPeriod[];
    activePeriodId: string;
    onAddNewPeriod?: (title: string) => string; // returns new period id
}

interface SheetColumn {
    index: number;
    label: string; // e.g. "ستون A: نام پرسنل"
    headerText: string;
    sampleValues: string[];
}

interface FieldMappingConfig {
    salesPersonCol: number;
    customerNameCol: number;
    sellerNameCol: number;
    carModelCol: number;
    salePriceCol: number;
    purchasePriceCol: number;
    dailyPriceCol: number;
    saleDateCol: number;
    purchaseDateCol: number;
    commissionAmountCol: number;
    dailyProfitLossCol: number;
    grossProfitCol: number;
    paymentNotesCol: number;
    nextBasketAmountCol: number;
    headerRowIndex: number;
}

interface RawSheetData {
    sheetName: string;
    category: CommissionCategory;
    rawRows: any[][];
    columns: SheetColumn[];
    mapping: FieldMappingConfig;
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
    const [selectedTargetPeriodId, setSelectedTargetPeriodId] = useState<string>(activePeriodId || (periods[0]?.id ?? ''));
    const [isCreatingInlinePeriod, setIsCreatingInlinePeriod] = useState(periods.length === 0);
    const [inlinePeriodTitle, setInlinePeriodTitle] = useState('');

    useEffect(() => {
        if (activePeriodId) {
            setSelectedTargetPeriodId(activePeriodId);
        } else if (periods.length > 0 && !selectedTargetPeriodId) {
            setSelectedTargetPeriodId(periods[0].id);
        }
    }, [activePeriodId, periods, selectedTargetPeriodId]);

    // File & Parse States
    const [fileName, setFileName] = useState<string>('');
    const [fileSize, setFileSize] = useState<string>('');
    const [rawSheets, setRawSheets] = useState<RawSheetData[]>([]);
    const [detectedSheets, setDetectedSheets] = useState<DetectedSheet[]>([]);
    const [activePreviewSheetIndex, setActivePreviewSheetIndex] = useState<number>(0);
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    const [parseError, setParseError] = useState<string | null>(null);
    const [step, setStep] = useState<'upload' | 'mapping' | 'review'>('upload');
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

    // Parse dates
    const parseExcelDate = (val: any, defaultMonthPrefix: string): string => {
        if (!val) return `${defaultMonthPrefix}/01`;
        
        if (typeof val === 'number' && val > 30000 && val < 60000) {
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

    // Helper to get Excel column letter (0 -> A, 1 -> B, ...)
    const getColLetter = (index: number) => {
        let letter = '';
        let temp = index;
        while (temp >= 0) {
            letter = String.fromCharCode((temp % 26) + 65) + letter;
            temp = Math.floor(temp / 26) - 1;
        }
        return letter;
    };

    // Auto-detect best column for keywords
    const detectBestColumn = (columns: SheetColumn[], keywords: string[], defaultFallbackIdx: number = -1): number => {
        for (const kw of keywords) {
            const exact = columns.find(c => c.headerText.toLowerCase().includes(kw.toLowerCase()));
            if (exact) return exact.index;
        }
        return defaultFallbackIdx >= 0 && defaultFallbackIdx < columns.length ? defaultFallbackIdx : -1;
    };

    // Build default mapping for a sheet
    const createInitialMapping = (columns: SheetColumn[], headerRowIndex: number): FieldMappingConfig => {
        return {
            headerRowIndex,
            salesPersonCol: detectBestColumn(columns, ['پرسنل', 'مشاور', 'کارشناس', 'فروشنده', 'مسئول'], 3),
            customerNameCol: detectBestColumn(columns, ['مشتری', 'خریدار', 'متقاضی', 'طرف حساب'], 4),
            sellerNameCol: detectBestColumn(columns, ['فروشنده', 'مالک', 'صاحب'], 14),
            carModelCol: detectBestColumn(columns, ['خودرو', 'مدل', 'تیپ', 'اتومبیل'], 5),
            salePriceCol: detectBestColumn(columns, ['نرخ فروش', 'مبلغ فروش', 'قیمت فروش', 'پیش پرداخت', 'فروش'], 8),
            purchasePriceCol: detectBestColumn(columns, ['نرخ خرید', 'قیمت خرید', 'مبلغ خرید'], 6),
            dailyPriceCol: detectBestColumn(columns, ['قیمت روز', 'نرخ روز', 'ارزش روز'], 7),
            saleDateCol: detectBestColumn(columns, ['تاریخ فروش', 'تاریخ معامله', 'تاریخ'], 2),
            purchaseDateCol: detectBestColumn(columns, ['تاریخ خرید', 'خرید تاریخ'], 1),
            commissionAmountCol: detectBestColumn(columns, ['پورسانت', 'مبلغ پورسانت', 'کمیسیون مشاور'], 11),
            dailyProfitLossCol: detectBestColumn(columns, ['سود یا زیان روز', 'سود روز', 'زیان روز', 'سود یا زیان'], 9),
            grossProfitCol: detectBestColumn(columns, ['سود ناخالص', 'کمیسیون کل', 'کمیسیون آزاد', 'مارجین'], 10),
            paymentNotesCol: detectBestColumn(columns, ['توضیحات واریز', 'وضعیت واریز', 'توضیحات', 'وضعیت'], 13),
            nextBasketAmountCol: detectBestColumn(columns, ['سبد بعدی', 'مبلغ سبد', 'سبد'], -1)
        };
    };

    // Parse deals from raw rows given mapping
    const parseDealsFromRawData = (
        rawRows: any[][], 
        mapping: FieldMappingConfig, 
        category: CommissionCategory, 
        sheetName: string
    ): CommissionDeal[] => {
        const monthNum = selectedTargetPeriodId.includes('-') ? selectedTargetPeriodId.split('-')[1] : '05';
        const defaultDatePrefix = `1405/${monthNum}`;
        const deals: CommissionDeal[] = [];
        const startRow = Math.max(0, mapping.headerRowIndex + 1);

        for (let r = startRow; r < rawRows.length; r++) {
            const row = rawRows[r];
            if (!row || !Array.isArray(row)) continue;

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

            const getCell = (colIdx: number) => {
                if (colIdx < 0 || colIdx === undefined || colIdx === null) return '';
                return row[colIdx] !== undefined && row[colIdx] !== null ? row[colIdx] : '';
            };

            const salesPersonRaw = String(getCell(mapping.salesPersonCol) || '').trim();
            const customerName = String(getCell(mapping.customerNameCol) || '').trim();
            const sellerName = String(getCell(mapping.sellerNameCol) || '').trim();
            const carModel = String(getCell(mapping.carModelCol) || '').trim();

            const salePrice = cleanNumber(getCell(mapping.salePriceCol));
            const purchasePrice = cleanNumber(getCell(mapping.purchasePriceCol));
            const dailyPrice = cleanNumber(getCell(mapping.dailyPriceCol));
            const nextBasketAmount = cleanNumber(getCell(mapping.nextBasketAmountCol));

            if (!salesPersonRaw && !customerName && !carModel && salePrice === 0) {
                continue;
            }

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

            const purchaseDate = parseExcelDate(getCell(mapping.purchaseDateCol), defaultDatePrefix);
            const saleDate = parseExcelDate(getCell(mapping.saleDateCol), defaultDatePrefix);

            let dailyProfitLoss = cleanNumber(getCell(mapping.dailyProfitLossCol));
            if (dailyProfitLoss === 0 && salePrice > 0 && dailyPrice > 0) {
                dailyProfitLoss = salePrice - dailyPrice;
            }

            const grossProfit = cleanNumber(getCell(mapping.grossProfitCol)) || 
                (salePrice > 0 && purchasePrice > 0 ? (salePrice - purchasePrice) : 0);

            let commissionRate = category === 'ANBAR' ? 0.05 : (category === 'AZAD' ? 10 : (category === 'LEASING' ? 0.1 : 0.05));
            if (dailyProfitLoss < 0) {
                commissionRate = 0.25;
            }

            let commissionAmount = cleanNumber(getCell(mapping.commissionAmountCol));
            if (commissionAmount === 0) {
                if (dailyProfitLoss < 0) {
                    commissionAmount = Math.round(salePrice * 0.0025);
                } else if (category === 'AZAD') {
                    commissionAmount = Math.round(grossProfit * (commissionRate / 100));
                } else {
                    commissionAmount = Math.round(salePrice * (commissionRate / 100));
                }
            }

            const notesVal = String(getCell(mapping.paymentNotesCol) || '').trim();
            let paymentStatus: CommissionPaymentStatus = 'PENDING';
            if (notesVal.includes('واریز شد') || notesVal.includes('تسویه') || notesVal.includes('پرداخت شد')) {
                paymentStatus = 'PAID';
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
                purchasePrice: purchasePrice || undefined,
                dailyPrice: dailyPrice || undefined,
                salePrice: salePrice || 0,
                downPayment: category === 'LEASING' || category === 'REGISTRATION' ? salePrice : undefined,
                nextBasketAmount: nextBasketAmount || undefined,
                dailyProfitLoss: dailyProfitLoss || undefined,
                grossProfit: grossProfit || undefined,
                commissionRate,
                commissionAmount,
                paymentStatus,
                paymentNotes: notesVal || undefined
            });
        }

        return deals;
    };

    // Recompute detected sheets from rawSheets
    const refreshDetectedSheets = (sheets: RawSheetData[]) => {
        const computed: DetectedSheet[] = sheets.map(s => {
            const deals = parseDealsFromRawData(s.rawRows, s.mapping, s.category, s.sheetName);
            const totalSales = deals.reduce((sum, d) => sum + (d.salePrice || 0), 0);
            const totalCommission = deals.reduce((sum, d) => sum + (d.commissionAmount || 0), 0);

            return {
                sheetName: s.sheetName,
                category: s.category,
                deals,
                selected: deals.length > 0,
                totalSales,
                totalCommission,
                rawRowCount: s.rawRows.length
            };
        });

        setDetectedSheets(computed);
    };

    // Process Workbook using SheetJS
    const processExcelWorkbook = (workbook: XLSX.WorkBook) => {
        const rawSheetsList: RawSheetData[] = [];

        workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) return;

            const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: false });
            if (!rows || rows.length === 0) return;

            // Detect header row index
            let headerRowIndex = 0;
            for (let r = 0; r < Math.min(rows.length, 25); r++) {
                const row = rows[r];
                if (!Array.isArray(row)) continue;
                const rowStr = row.map(c => toAsciiDigits(c || '').trim()).join(' ');
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
                    break;
                }
            }

            const headerRow = rows[headerRowIndex] || [];
            const maxCols = Math.max(...rows.slice(0, 10).map(r => (Array.isArray(r) ? r.length : 0)), 1);

            const columns: SheetColumn[] = [];
            for (let c = 0; c < maxCols; c++) {
                const hText = String(headerRow[c] || '').trim();
                const letter = getColLetter(c);
                const sampleVals: string[] = [];
                for (let r = headerRowIndex + 1; r < Math.min(rows.length, headerRowIndex + 4); r++) {
                    const v = rows[r]?.[c];
                    if (v !== undefined && v !== '') {
                        sampleVals.push(String(v).trim());
                    }
                }

                columns.push({
                    index: c,
                    headerText: hText || `(ستون ${letter})`,
                    label: `ستون ${letter}: ${hText ? hText : 'بدون عنوان'}`,
                    sampleValues: sampleVals
                });
            }

            const category = guessCategoryFromSheetName(sheetName);
            const mapping = createInitialMapping(columns, headerRowIndex);

            rawSheetsList.push({
                sheetName,
                category,
                rawRows: rows,
                columns,
                mapping
            });
        });

        if (rawSheetsList.length === 0) {
            setParseError('هیچ داده‌ای در فایل اکسل یافت نشد.');
            setIsProcessing(false);
            return;
        }

        setRawSheets(rawSheetsList);
        refreshDetectedSheets(rawSheetsList);
        setActivePreviewSheetIndex(0);
        setStep('mapping'); // Go to Mapping step!
        setIsProcessing(false);
    };

    // Handle File upload
    const handleFileUpload = (file: File) => {
        if (!file) return;

        setFileName(file.name);
        setFileSize((file.size / 1024).toFixed(1) + ' KB');
        setParseError(null);
        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                processExcelWorkbook(workbook);
            } catch (err: any) {
                console.error('Excel parse error:', err);
                setParseError('خطا در خواندن فایل اکسل: ' + (err.message || 'فرمت نامعتبر'));
                setIsProcessing(false);
            }
        };
        reader.onerror = () => {
            setParseError('خطا در بارگذاری فایل');
            setIsProcessing(false);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    // Update mapping field for active sheet
    const handleUpdateActiveSheetMapping = (field: keyof FieldMappingConfig, colIndex: number) => {
        const updated = [...rawSheets];
        const currentSheet = updated[activePreviewSheetIndex];
        if (!currentSheet) return;

        currentSheet.mapping = {
            ...currentSheet.mapping,
            [field]: colIndex
        };

        setRawSheets(updated);
        refreshDetectedSheets(updated);
    };

    // Reset mapping for current sheet to auto-detection
    const handleResetAutoMapping = () => {
        const updated = [...rawSheets];
        const currentSheet = updated[activePreviewSheetIndex];
        if (!currentSheet) return;

        currentSheet.mapping = createInitialMapping(currentSheet.columns, currentSheet.mapping.headerRowIndex);
        setRawSheets(updated);
        refreshDetectedSheets(updated);
    };

    // Execute Import
    const handleConfirmImport = () => {
        let finalPeriodId = selectedTargetPeriodId;
        if (isCreatingInlinePeriod && inlinePeriodTitle.trim() && onAddNewPeriod) {
            finalPeriodId = onAddNewPeriod(inlinePeriodTitle.trim());
        }

        const selectedDeals = detectedSheets
            .filter(s => s.selected)
            .flatMap(s => s.deals)
            .map(d => ({
                ...d,
                periodId: finalPeriodId,
                periodName: periods.find(p => p.id === finalPeriodId)?.title || targetPeriod.title
            }));

        if (selectedDeals.length === 0) {
            setParseError('هیچ معامله‌ای برای ورود انتخاب نشده است.');
            return;
        }

        onImport(selectedDeals, finalPeriodId, importMode === 'replace');
        onClose();
    };

    const activeRawSheet = rawSheets[activePreviewSheetIndex];
    const activeDetectedSheet = detectedSheets[activePreviewSheetIndex];

    const systemFields = [
        { key: 'salesPersonCol' as const, label: 'نام پرسنل فروش / مشاور', required: true, desc: 'مشاور، کارشناس، تیم فروش' },
        { key: 'customerNameCol' as const, label: 'نام مشتری / خریدار', required: true, desc: 'خریدار یا متقاضی خودرو' },
        { key: 'carModelCol' as const, label: 'مدل خودرو', required: true, desc: 'خودرو، تیپ، سیستم' },
        { key: 'salePriceCol' as const, label: 'نرخ فروش / پیش‌پرداخت', required: true, desc: 'قیمت فروش یا پیش‌پرداخت لیزینگ' },
        { key: 'purchasePriceCol' as const, label: 'نرخ خرید خودرو', required: false, desc: 'مبلغ خرید اولیه' },
        { key: 'dailyPriceCol' as const, label: 'قیمت روز خودرو', required: false, desc: 'قیمت بازار روز' },
        { key: 'saleDateCol' as const, label: 'تاریخ فروش', required: false, desc: 'تاریخ عقد قرارداد' },
        { key: 'purchaseDateCol' as const, label: 'تاریخ خرید', required: false, desc: 'تاریخ خرید خودرو' },
        { key: 'commissionAmountCol' as const, label: 'پورسانت (در صورت وجود)', required: false, desc: 'در صورت خالی بودن خودکار محاسبه می‌شود' },
        { key: 'sellerNameCol' as const, label: 'نام فروشنده / مالک', required: false, desc: 'مالک قبلی خودرو' },
        { key: 'dailyProfitLossCol' as const, label: 'سود و زیان روز', required: false, desc: 'اختلاف قیمت فروش و روز' },
        { key: 'grossProfitCol' as const, label: 'کمیسیون کل / سود ناخالص', required: false, desc: 'سود ناخالص فروش آزاد' },
        { key: 'paymentNotesCol' as const, label: 'توضیحات و وضعیت واریز', required: false, desc: 'واریز شد، علی‌الحساب و...' },
        { key: 'nextBasketAmountCol' as const, label: 'مبلغ سبد بعدی (حواله)', required: false, desc: 'ویژه شیت حواله' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                ورود هوشمند اطلاعات از فایل اکسل
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                                    XLSX / XLS / CSV
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                امکان نگاشت و تطبیق ستون‌ها بدون به‌هم‌ریختگی با تغییرات فرمت فایل
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Steps Indicator */}
                <div className="flex items-center justify-between px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2 font-bold">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${
                            step === 'upload' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                            ۱
                        </div>
                        <span className={step === 'upload' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}>
                            انتخاب فایل
                        </span>

                        <span className="text-slate-300 mx-1">›</span>

                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${
                            step === 'mapping' ? 'bg-emerald-600 text-white' : rawSheets.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                            ۲
                        </div>
                        <span className={step === 'mapping' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}>
                            نگاشت و تطبیق ستون‌ها
                        </span>

                        <span className="text-slate-300 mx-1">›</span>

                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${
                            step === 'review' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                            ۳
                        </div>
                        <span className={step === 'review' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}>
                            بررسی و ورود نهایی
                        </span>
                    </div>

                    {step === 'mapping' && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleResetAutoMapping}
                                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-50 text-[11px] flex items-center gap-1"
                            >
                                <RefreshCw className="w-3 h-3" />
                                بازنشانی تطبیق خودکار
                            </button>
                        </div>
                    )}
                </div>

                {/* Modal Body */}
                <div className="p-5 overflow-y-auto flex-1 space-y-5">
                    
                    {parseError && (
                        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>{parseError}</span>
                        </div>
                    )}

                    {/* STEP 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-4">
                            {/* Drag and Drop Zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                                    isDragging
                                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[0.99]'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-800/30'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleFileUpload(e.target.files[0]);
                                        }
                                    }}
                                />

                                <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Upload className="w-8 h-8" />
                                </div>

                                <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">
                                    فایل اکسل معاملات را اینجا رها کنید یا کلیک کنید
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                                    پشتیبانی کامل از فایل‌های چند شیتی (انبار، آزاد، حواله، لیزینگ، ثبت نام) با قابلیت تنظیم و تطبیق ستون‌ها در مرحله بعد
                                </p>

                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                                    انتخاب فایل از سیستم
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Field Mapping */}
                    {step === 'mapping' && activeRawSheet && (
                        <div className="space-y-5">
                            
                            {/* Sheet Selector Tabs */}
                            {rawSheets.length > 1 && (
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
                                    <span className="text-xs font-bold text-slate-500 shrink-0 ml-1">شیت‌ها:</span>
                                    {rawSheets.map((sh, idx) => (
                                        <button
                                            key={sh.sheetName}
                                            type="button"
                                            onClick={() => setActivePreviewSheetIndex(idx)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                                activePreviewSheetIndex === idx
                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                            }`}
                                        >
                                            {sh.sheetName} ({sh.rawRows.length} ردیف)
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Mapping Configuration Card */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700/60 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                                        <h3 className="text-xs font-black text-slate-900 dark:text-white">
                                            تطبیق فیلدهای سیستم با ستون‌های شیت «{activeRawSheet.sheetName}»
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-500 font-bold">ردیف سربرگ:</span>
                                        <select
                                            value={activeRawSheet.mapping.headerRowIndex}
                                            onChange={e => handleUpdateActiveSheetMapping('headerRowIndex', parseInt(e.target.value) || 0)}
                                            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono outline-none"
                                        >
                                            {Array.from({ length: Math.min(10, activeRawSheet.rawRows.length) }).map((_, rIdx) => (
                                                <option key={rIdx} value={rIdx}>ردیف {rIdx + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                    فیلدهای زیر به صورت خودکار تشخیص داده شده‌اند. در صورت تغییر ستون‌ها در فایل اکسل، می‌توانید ستون متناظر را انتخاب کنید تا محاسبات دقیق انجام شود:
                                </p>

                                {/* Fields Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {systemFields.map(field => {
                                        const mappedVal = activeRawSheet.mapping[field.key];
                                        const isAssigned = mappedVal !== -1 && mappedVal !== undefined;

                                        return (
                                            <div 
                                                key={field.key} 
                                                className={`p-3 rounded-2xl border transition-all ${
                                                    isAssigned 
                                                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
                                                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                        <span>{field.label}</span>
                                                        {field.required && (
                                                            <span className="text-rose-500 text-[10px] font-mono">*ضروری</span>
                                                        )}
                                                    </label>
                                                    <span className="text-[10px] text-slate-400">
                                                        {field.desc}
                                                    </span>
                                                </div>

                                                <select
                                                    value={mappedVal}
                                                    onChange={e => handleUpdateActiveSheetMapping(field.key, parseInt(e.target.value))}
                                                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                                                >
                                                    <option value="-1">-- عدم تخصیص (خالی) --</option>
                                                    {activeRawSheet.columns.map(col => (
                                                        <option key={col.index} value={col.index}>
                                                            {col.label} {col.sampleValues[0] ? `(نمونه: ${col.sampleValues[0].substring(0, 15)})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Live Preview Table of Mapped Data */}
                            {activeDetectedSheet && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                            <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                            پیش‌نمایش معاملات استخراج‌شده ({activeDetectedSheet.deals.length.toLocaleString('fa-IR')} معامله)
                                        </h4>
                                        <span className="text-[11px] text-emerald-600 font-bold font-mono">
                                            جمع پورسانت: {Math.round(activeDetectedSheet.totalCommission / 10).toLocaleString('fa-IR')} تومان
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                        <table className="w-full text-[11px] text-right bg-white dark:bg-slate-900">
                                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                                                <tr>
                                                    <th className="py-2 px-2.5">ردیف</th>
                                                    <th className="py-2 px-2.5">تاریخ</th>
                                                    <th className="py-2 px-2.5">پرسنل</th>
                                                    <th className="py-2 px-2.5">خریدار</th>
                                                    <th className="py-2 px-2.5">خودرو</th>
                                                    <th className="py-2 px-2.5">نرخ فروش (تومان)</th>
                                                    <th className="py-2 px-2.5">پورسانت (تومان)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {activeDetectedSheet.deals.slice(0, 4).map((d, idx) => (
                                                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                        <td className="py-2 px-2.5 font-mono text-slate-400">{idx + 1}</td>
                                                        <td className="py-2 px-2.5 font-mono">{d.saleDate || '-'}</td>
                                                        <td className="py-2 px-2.5 font-bold text-slate-900 dark:text-white">{d.salesPerson}</td>
                                                        <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300">{d.customerName}</td>
                                                        <td className="py-2 px-2.5 text-emerald-600 font-bold">{d.carModel}</td>
                                                        <td className="py-2 px-2.5 font-mono font-bold">{Math.round((d.salePrice || 0) / 10).toLocaleString('fa-IR')}</td>
                                                        <td className="py-2 px-2.5 font-mono font-black text-emerald-600">{Math.round((d.commissionAmount || 0) / 10).toLocaleString('fa-IR')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* STEP 3: Review and Finalize */}
                    {step === 'review' && (
                        <div className="space-y-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <span className="text-[11px] text-slate-500 block">تعداد کل معاملات</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                                        {detectedSheets.filter(s => s.selected).flatMap(s => s.deals).length.toLocaleString('fa-IR')}
                                    </span>
                                </div>
                                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <span className="text-[11px] text-slate-500 block">مجموع فروش</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                                        {Math.round(detectedSheets.filter(s => s.selected).reduce((sum, s) => sum + s.totalSales, 0) / 10).toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
                                    </span>
                                </div>
                                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-bold">مجموع پورسانت</span>
                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                        {Math.round(detectedSheets.filter(s => s.selected).reduce((sum, s) => sum + s.totalCommission, 0) / 10).toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
                                    </span>
                                </div>
                            </div>

                            {/* Target Period Setting */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-emerald-600" />
                                        دوره کمیسیون مقصد برای ثبت اطلاعات
                                    </label>
                                    {onAddNewPeriod && (
                                        <button
                                            type="button"
                                            onClick={() => setIsCreatingInlinePeriod(!isCreatingInlinePeriod)}
                                            className="text-xs text-indigo-600 font-bold hover:underline"
                                        >
                                            {isCreatingInlinePeriod ? 'انتخاب از دوره‌های موجود' : '+ ایجاد دوره جدید'}
                                        </button>
                                    )}
                                </div>

                                {isCreatingInlinePeriod ? (
                                    <input
                                        type="text"
                                        value={inlinePeriodTitle}
                                        onChange={e => setInlinePeriodTitle(e.target.value)}
                                        placeholder="عنوان دوره جدید، مثلا: کمیسیون و پاداش شهریور ۱۴۰۵"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                    />
                                ) : (
                                    <select
                                        value={selectedTargetPeriodId}
                                        onChange={e => setSelectedTargetPeriodId(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                    >
                                        {periods.map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Import Mode (Append vs Replace) */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-black text-slate-800 dark:text-white block">
                                        شیوه ورود به دوره
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        الحاق به ردیف‌های موجود یا جایگزینی کامل معاملات این دوره
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setImportMode('append')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                            importMode === 'append' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        الحاق (افزودن)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImportMode('replace')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                            importMode === 'replace' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        جایگزینی کامل
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div>
                        {step === 'mapping' && (
                            <button
                                type="button"
                                onClick={() => setStep('upload')}
                                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5"
                            >
                                <ArrowRight className="w-4 h-4" />
                                مرحله قبل (تغییر فایل)
                            </button>
                        )}
                        {step === 'review' && (
                            <button
                                type="button"
                                onClick={() => setStep('mapping')}
                                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5"
                            >
                                <ArrowRight className="w-4 h-4" />
                                مرحله قبل (ویرایش نگاشت ستون‌ها)
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
                        >
                            انصراف
                        </button>

                        {step === 'mapping' && (
                            <button
                                type="button"
                                onClick={() => setStep('review')}
                                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                            >
                                مرحله بعد: بررسی و تایید
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        )}

                        {step === 'review' && (
                            <button
                                type="button"
                                onClick={handleConfirmImport}
                                className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                            >
                                <Check className="w-4 h-4" />
                                تایید و ورود نهایی به سیستم
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
export default CommissionExcelImportModal;
