import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Clock, 
    Calendar, 
    UserCheck, 
    UploadCloud, 
    Download, 
    Printer, 
    RefreshCw, 
    AlertCircle, 
    CheckCircle2, 
    Filter, 
    Search, 
    FileText, 
    ChevronDown, 
    ChevronLeft,
    ChevronRight,
    Info, 
    Trash2, 
    Eye, 
    Plus, 
    X, 
    Check, 
    SlidersHorizontal,
    FileSpreadsheet,
    Building2,
    CalendarDays,
    Coffee,
    Hourglass,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Files,
    FolderUp,
    Users,
    CheckSquare,
    Square,
    LayoutList,
    BarChart3,
    ArrowUpDown,
    UserPlus,
    Pencil,
    Edit3
} from 'lucide-react';
import type { EmployeeTimesheet, TimesheetDayRecord } from '../types';
import { 
    getStoredTimesheets, 
    saveStoredTimesheets, 
    fetchLiveTimesheetFromWebhook, 
    timesheetApiService,
    parseTimesheetCSV, 
    parseTimesheetExcelBuffer,
    parseMultiEmployeeCSV,
    parseBulkUploadedFiles,
    exportTimesheetToExcelCSV, 
    exportAllTimesheetsToExcel,
    exportAggregateSummaryToExcel,
    getSeedDealershipTimesheets,
    parseTimeToMinutes,
    formatMinutesToTime,
    TIMESHEET_API_URL,
    RAW_SAMPLE_TIMESHEET_CSV 
} from '../services/timesheetService';
import Toast from '../components/Toast';
import { AttendanceAggregateView } from '../components/AttendanceAggregateView';
import { AttendanceEmployeeHeader } from '../components/AttendanceEmployeeHeader';
import { AttendancePunchEditModal } from '../components/attendance/AttendancePunchEditModal';
import { AttendanceBulkEditModal } from '../components/attendance/AttendanceBulkEditModal';
import { AttendanceUnifiedLeaveSection } from '../components/attendance/AttendanceUnifiedLeaveSection';
import { AttendanceUnifiedOvertimeSection } from '../components/attendance/AttendanceUnifiedOvertimeSection';
import { AttendanceManualEntryModal } from '../components/attendance/AttendanceManualEntryModal';
import type { MyProfile } from '../types';

interface Props {
    isAdmin?: boolean;
    loggedInUser?: MyProfile | null;
}

export const AttendancePage: React.FC<Props> = ({ isAdmin = true, loggedInUser = null }) => {
    const effectiveIsAdmin = Boolean(
        isAdmin || 
        loggedInUser?.isAdmin === 1 || 
        (loggedInUser?.permission_level !== undefined && loggedInUser.permission_level === 0)
    );

    const currentUserName = loggedInUser?.full_name?.trim() || loggedInUser?.username?.trim() || '';

    const [timesheets, setTimesheets] = useState<EmployeeTimesheet[]>([]);
    const [selectedSheetId, setSelectedSheetId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'WORK' | 'HOLIDAY' | 'LEAVE' | 'DELAY' | 'OVERTIME'>('ALL');
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [webhookStatus, setWebhookStatus] = useState<{ checked: boolean; active: boolean; message?: string } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Manual Entry Modal
    const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState<boolean>(false);

    // Single Import Modal
    const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
    const [importText, setImportText] = useState<string>('');
    const [importPreview, setImportPreview] = useState<EmployeeTimesheet | null>(null);
    const [importError, setImportError] = useState<string | null>(null);

    // Bulk XLS / Excel Upload Modal States
    const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
    const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);
    const [bulkParsedItems, setBulkParsedItems] = useState<{
        id: string;
        selected: boolean;
        sheet: EmployeeTimesheet;
        sourceFileName: string;
    }[]>([]);
    const [bulkErrors, setBulkErrors] = useState<{ fileName: string; error: string }[]>([]);
    const [bulkIsDragging, setBulkIsDragging] = useState<boolean>(false);
    const [employeeSearch, setEmployeeSearch] = useState<string>('');
    const bulkFileInputRef = useRef<HTMLInputElement>(null);

    const [selectedDayRecord, setSelectedDayRecord] = useState<TimesheetDayRecord | null>(null);
    const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState<boolean>(false);

    // Single punch edit state
    const [editingDayRecord, setEditingDayRecord] = useState<TimesheetDayRecord | null>(null);
    const [isPunchEditModalOpen, setIsPunchEditModalOpen] = useState<boolean>(false);

    // Bulk punch edit selection state
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [isBulkPunchModalOpen, setIsBulkPunchModalOpen] = useState<boolean>(false);

    // Merged quick modals for leave and overtime from attendance rows
    const [leaveModalState, setLeaveModalState] = useState<{ isOpen: boolean; date?: string; employeeName?: string }>({ isOpen: false });
    const [overtimeModalState, setOvertimeModalState] = useState<{ isOpen: boolean; date?: string; employeeName?: string; hours?: number }>({ isOpen: false });

    // View Mode: Master summary, Detailed single employee, Merged Leave Requests, Merged Overtime Requests
    const [viewMode, setViewMode] = useState<'AGGREGATE' | 'INDIVIDUAL' | 'LEAVE_REQUESTS' | 'OVERTIME_REQUESTS'>(() => {
        return effectiveIsAdmin ? 'AGGREGATE' : 'INDIVIDUAL';
    });

    useEffect(() => {
        if (!effectiveIsAdmin && viewMode === 'AGGREGATE') {
            setViewMode('INDIVIDUAL');
        }
    }, [effectiveIsAdmin, viewMode]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load directly from Webhook Server API (Zero offline fake/seed dependency)
    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            setIsSyncing(true);
            try {
                const sheets = await timesheetApiService.getAll();
                if (isMounted) {
                    setTimesheets(sheets);
                    if (sheets.length > 0) {
                        if (!effectiveIsAdmin && currentUserName) {
                            const mySheet = sheets.find(s => 
                                s.employeeName.toLowerCase().includes(currentUserName.toLowerCase()) ||
                                currentUserName.toLowerCase().includes(s.employeeName.toLowerCase()) ||
                                (loggedInUser?.id && s.employeeCode === String(loggedInUser.id))
                            );
                            if (mySheet) {
                                setSelectedSheetId(mySheet.id);
                            } else {
                                setSelectedSheetId(sheets[0].id);
                            }
                        } else {
                            setSelectedSheetId(sheets[0].id);
                        }
                    }
                    setWebhookStatus({ checked: true, active: true, message: 'وب‌هوک سرور متصل و فعال است.' });
                }
            } catch (err: any) {
                console.warn('Initial timesheet load error:', err.message);
                if (isMounted) {
                    setWebhookStatus({ checked: true, active: false, message: err.message });
                }
            } finally {
                if (isMounted) {
                    setIsSyncing(false);
                }
            }
        };

        loadInitialData();
        return () => { isMounted = false; };
    }, [effectiveIsAdmin, currentUserName, loggedInUser]);

    // Role-filtered timesheets
    const visibleTimesheets = useMemo(() => {
        if (effectiveIsAdmin) return timesheets;
        if (!currentUserName && !loggedInUser?.id) return timesheets;
        const filtered = timesheets.filter(s => {
            const nameMatch = currentUserName && (
                s.employeeName.toLowerCase().includes(currentUserName.toLowerCase()) ||
                currentUserName.toLowerCase().includes(s.employeeName.toLowerCase())
            );
            const codeMatch = loggedInUser?.id && s.employeeCode === String(loggedInUser.id);
            return Boolean(nameMatch || codeMatch);
        });
        return filtered.length > 0 ? filtered : timesheets;
    }, [timesheets, effectiveIsAdmin, currentUserName, loggedInUser]);

    // Current active timesheet
    const currentSheet = useMemo(() => {
        const list = effectiveIsAdmin ? timesheets : visibleTimesheets;
        return list.find(s => s.id === selectedSheetId) || list[0] || null;
    }, [timesheets, visibleTimesheets, selectedSheetId, effectiveIsAdmin]);

    const handleSaveManualEntry = async (updatedOrNewSheet: EmployeeTimesheet) => {
        try {
            const existing = timesheets.find(s => s.id === updatedOrNewSheet.id);
            if (existing) {
                await timesheetApiService.updateSheet(updatedOrNewSheet);
                setTimesheets(prev => prev.map(s => s.id === updatedOrNewSheet.id ? updatedOrNewSheet : s));
            } else {
                const newTimesheets = [updatedOrNewSheet, ...timesheets];
                await timesheetApiService.uploadOrSaveSheets(newTimesheets);
                setTimesheets(newTimesheets);
                setSelectedSheetId(updatedOrNewSheet.id);
            }
            setToast({
                message: `سوابق تردد ${updatedOrNewSheet.employeeName} با موفقیت در وب‌هوک سرور ثبت و ذخیره شد.`,
                type: 'success'
            });
        } catch (err: any) {
            setToast({
                message: 'خطا در ذخیره‌سازی داده‌ها در سرور: ' + (err?.message || 'نامشخص'),
                type: 'error'
            });
        }
    };

    // Test or sync with webhook (pure server synchronization)
    const handleSyncWebhook = async () => {
        setIsSyncing(true);
        try {
            const sheets = await timesheetApiService.getAll();
            setTimesheets(sheets);
            if (sheets.length > 0 && !sheets.some(s => s.id === selectedSheetId)) {
                setSelectedSheetId(sheets[0].id);
            }
            setWebhookStatus({ checked: true, active: true, message: 'وب‌هوک سرور همگام است.' });
            setToast({
                message: `همگام‌سازی با وب‌هوک سرور با موفقیت انجام شد (${sheets.length} کارنامه دریافت گردید).`,
                type: 'success'
            });
        } catch (e: any) {
            setToast({ message: e?.message || 'خطا در اتصال به وب‌هوک سرور', type: 'error' });
            setWebhookStatus({ checked: true, active: false, message: e?.message });
        } finally {
            setIsSyncing(false);
        }
    };

    // Punch Edit Handlers
    const handleOpenPunchEdit = (record: TimesheetDayRecord) => {
        setEditingDayRecord(record);
        setIsPunchEditModalOpen(true);
    };

    const handleSavePunchEdit = async (updatedRecord: TimesheetDayRecord) => {
        if (!currentSheet) return;
        try {
            const updatedSheet = await timesheetApiService.patchRecord(currentSheet.id, updatedRecord.date, updatedRecord);
            setTimesheets(prev => prev.map(s => s.id === updatedSheet.id ? updatedSheet : s));
            setToast({
                message: `تردد روز ${updatedRecord.date} با موفقیت در وب‌هوک سرور ذخیره گردید (PATCH).`,
                type: 'success'
            });
        } catch (err: any) {
            setToast({
                message: 'خطا در ثبت تغییرات در سرور: ' + err.message,
                type: 'error'
            });
        }
    };

    const handleToggleSelectDate = (date: string) => {
        setSelectedDates(prev => 
            prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
        );
    };

    const handleSaveBulkPunchEdit = async (updates: Partial<TimesheetDayRecord>) => {
        if (!currentSheet || selectedDates.length === 0) return;
        try {
            const updatedSheet = await timesheetApiService.bulkPatchRecords(currentSheet.id, selectedDates, updates);
            setTimesheets(prev => prev.map(s => s.id === updatedSheet.id ? updatedSheet : s));
            setSelectedDates([]);
            setToast({
                message: `تغییرات گروهی ${selectedDates.length} روز با موفقیت به وب‌هوک سرور ارسال و اعمال گردید (PATCH).`,
                type: 'success'
            });
        } catch (err: any) {
            setToast({
                message: 'خطا در اعمال تغییرات گروهی در سرور: ' + err.message,
                type: 'error'
            });
        }
    };

    // Filtered records
    const filteredRecords = useMemo(() => {
        if (!currentSheet) return [];
        return currentSheet.records.filter(record => {
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                const matchDate = record.date.toLowerCase().includes(q);
                const matchDay = record.dayOfWeek.toLowerCase().includes(q);
                const matchStatus = record.status.toLowerCase().includes(q);
                if (!matchDate && !matchDay && !matchStatus) return false;
            }

            // Status filter
            if (statusFilter === 'WORK') {
                return record.status.includes('کاری');
            }
            if (statusFilter === 'HOLIDAY') {
                return record.status.includes('تعطیل');
            }
            if (statusFilter === 'LEAVE') {
                return record.status.includes('مرخصی');
            }
            if (statusFilter === 'DELAY') {
                return (
                    (record.morningDelay && record.morningDelay !== '0' && record.morningDelay !== '0:00') ||
                    (record.unauthorizedDelay && record.unauthorizedDelay !== '0' && record.unauthorizedDelay !== '0:00') ||
                    (record.deficit && record.deficit !== '0' && record.deficit !== '0:00')
                );
            }
            if (statusFilter === 'OVERTIME') {
                return record.overtime && record.overtime !== '0' && record.overtime !== '0:00';
            }

            return true;
        });
    }, [currentSheet, searchQuery, statusFilter]);

    // Handle CSV or Excel file selection for single import modal
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (ext === 'xls' || ext === 'xlsx') {
            try {
                const buffer = await file.arrayBuffer();
                const extracted = parseTimesheetExcelBuffer(buffer, file.name);
                if (extracted.length > 0) {
                    setImportPreview(extracted[0]);
                    setImportError(null);
                    setImportText(`فایل اکسل: ${file.name}\nکارمند: ${extracted[0].employeeName} (کد: ${extracted[0].employeeCode})\nتعداد روزها: ${extracted[0].records.length}`);
                } else {
                    setImportError('هیچ ردیف تردد یا الگوی استاندارد دستگاه حضور و غیاب در این فایل اکسل یافت نشد.');
                    setImportPreview(null);
                }
            } catch (err: any) {
                setImportError('خطا در خواندن فایل اکسل: ' + err.message);
                setImportPreview(null);
            }
        } else {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const content = evt.target?.result as string;
                setImportText(content);
                try {
                    const parsed = parseTimesheetCSV(content);
                    setImportPreview(parsed);
                    setImportError(null);
                } catch (err: any) {
                    setImportError('قالب فایل نامعتبر است. فایل خروجی استاندارد دستگاه حضور و غیاب را انتخاب کنید.');
                    setImportPreview(null);
                }
            };
            reader.readAsText(file, 'utf-8');
        }
    };

    // Bulk XLS / Excel files processor
    const handleBulkFilesProcess = async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        if (fileArray.length === 0) return;

        setIsBulkProcessing(true);
        setBulkErrors([]);
        try {
            const result = await parseBulkUploadedFiles(fileArray);
            
            const newItems = result.sheets.map((sheet, idx) => ({
                id: `bulk_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
                selected: true,
                sheet,
                sourceFileName: sheet.employeeName || `فایل شماره ${idx + 1}`
            }));

            setBulkParsedItems(prev => [...prev, ...newItems]);
            setBulkErrors(result.errors);

            if (result.sheets.length > 0) {
                setToast({
                    message: `تعداد ${result.sheets.length} کارنامه کارمند از ${result.successFiles} فایل استخراج گردید.`,
                    type: 'success'
                });
            } else if (result.errors.length > 0) {
                setToast({
                    message: 'هیچ ردیف تردد معتبری در فایل‌های انتخابی یافت نشد.',
                    type: 'error'
                });
            }
        } catch (err: any) {
            setToast({ message: 'خطا در پردازش فایل‌های گروهی: ' + err.message, type: 'error' });
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleToggleSelectBulkItem = (id: string) => {
        setBulkParsedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
    };

    const handleToggleSelectAllBulk = () => {
        const allSelected = bulkParsedItems.every(item => item.selected);
        setBulkParsedItems(prev => prev.map(item => ({ ...item, selected: !allSelected })));
    };

    const handleRemoveBulkItem = (id: string) => {
        setBulkParsedItems(prev => prev.filter(item => item.id !== id));
    };

    const handleConfirmBulkImport = async () => {
        const selectedItems = bulkParsedItems.filter(item => item.selected);
        if (selectedItems.length === 0) {
            setToast({ message: 'لطفاً حداقل یک کارمند را برای ثبت انتخاب کنید.', type: 'info' });
            return;
        }

        const sheetsToSave = selectedItems.map(item => item.sheet);
        setIsBulkProcessing(true);
        try {
            const savedSheets = await timesheetApiService.uploadOrSaveSheets(sheetsToSave);
            setTimesheets(savedSheets);
            if (savedSheets.length > 0) {
                setSelectedSheetId(savedSheets[0].id);
            }
            setIsBulkModalOpen(false);
            setBulkParsedItems([]);
            setBulkErrors([]);
            setToast({
                message: `تعداد ${selectedItems.length} کارنامه کارمندان با متد POST/PUT به وب‌هوک سرور ارسال و ذخیره گردید.`,
                type: 'success'
            });
        } catch (err: any) {
            setToast({
                message: 'خطا در ارسال کارنامه‌ها به سرور: ' + err.message,
                type: 'error'
            });
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // Delete an employee timesheet from system (DELETE on webhook server)
    const handleDeleteSheet = async (sheetId: string) => {
        const toDelete = timesheets.find(s => s.id === sheetId);
        if (!window.confirm(`آیا از حذف کارنامه ${toDelete?.employeeName || 'کارمند'} از سرور وب‌هوک اطمینان دارید؟`)) {
            return;
        }

        try {
            const updated = await timesheetApiService.deleteSheet(sheetId);
            setTimesheets(updated);
            if (selectedSheetId === sheetId) {
                setSelectedSheetId(updated[0]?.id || '');
            }
            setToast({ 
                message: `کارنامه ${toDelete?.employeeName || 'کارمند'} با متد DELETE از سرور حذف گردید.`, 
                type: 'info' 
            });
        } catch (err: any) {
            setToast({ message: 'خطا در حذف کارنامه از سرور: ' + err.message, type: 'error' });
        }
    };

    // Comprehensive Export of all employees to Excel
    const handleExportAllToExcel = () => {
        if (!timesheets || timesheets.length === 0) return;
        exportAllTimesheetsToExcel(timesheets);
        setToast({ message: `فایل اکسل جامع ${timesheets.length} کارمند با موفقیت تولید و دانلود شد.`, type: 'success' });
    };

    // Filtered timesheets for employee tabs
    const filteredTimesheets = useMemo(() => {
        if (!employeeSearch.trim()) return timesheets;
        const q = employeeSearch.trim().toLowerCase();
        return timesheets.filter(s => 
            s.employeeName.toLowerCase().includes(q) || 
            s.employeeCode.toLowerCase().includes(q)
        );
    }, [timesheets, employeeSearch]);

    // Handle import paste change
    const handleImportTextChange = (text: string) => {
        setImportText(text);
        if (!text.trim()) {
            setImportPreview(null);
            setImportError(null);
            return;
        }
        try {
            const parsed = parseTimesheetCSV(text);
            if (parsed.records.length === 0) {
                setImportError('سطرهای تردد در متن یافت نشد. لطفاً سرفصل‌های جدول را بررسی کنید.');
                setImportPreview(null);
            } else {
                setImportPreview(parsed);
                setImportError(null);
            }
        } catch (err: any) {
            setImportError('خطا در پردازش متن CSV: ' + err.message);
            setImportPreview(null);
        }
    };

    // Confirm and save imported sheet to webhook server
    const handleConfirmImport = async () => {
        if (!importPreview) return;
        try {
            const savedSheets = await timesheetApiService.uploadOrSaveSheets([importPreview]);
            setTimesheets(savedSheets);
            setSelectedSheetId(importPreview.id);
            setIsImportModalOpen(false);
            setImportText('');
            setImportPreview(null);
            setToast({ message: `کارنامه تردد ${importPreview.employeeName} با موفقیت به سرور وب‌هوک ارسال شد (POST).`, type: 'success' });
        } catch (err: any) {
            setToast({ message: 'خطا در ذخیره کارنامه در سرور: ' + err.message, type: 'error' });
        }
    };

    // Load full team seed
    const handleResetToSample = () => {
        const teamSeeds = getSeedDealershipTimesheets();
        setTimesheets(teamSeeds);
        saveStoredTimesheets(teamSeeds);
        setSelectedSheetId(teamSeeds[0].id);
        setToast({ message: 'تیم ۵ نفره پرسنل حسینی خودرو شیراز بارگذاری گردید.', type: 'info' });
    };

    // Print
    const handlePrint = () => {
        window.print();
    };

    // Export
    const handleExport = () => {
        if (!currentSheet) return;
        exportTimesheetToExcelCSV(currentSheet);
        setToast({ message: 'فایل اکسل (CSV) با موفقیت ذخیره شد.', type: 'success' });
    };

    // Aggregate metrics calculations across all employees
    const aggregateMetrics = useMemo(() => {
        let totalWorkMin = 0;
        let totalOvertimeMin = 0;
        let totalDeficitMin = 0;
        let totalDutyMin = 0;
        let totalPunches = 0;
        let totalLeaveDays = 0;

        timesheets.forEach(sheet => {
            totalWorkMin += parseTimeToMinutes(sheet.summary.totalFinalWorkTime);
            totalOvertimeMin += parseTimeToMinutes(sheet.summary.totalOvertime);
            totalDeficitMin += parseTimeToMinutes(sheet.summary.totalDeficit);
            totalDutyMin += parseTimeToMinutes(sheet.summary.totalDuty);
            totalPunches += sheet.summary.totalPunches;
            totalLeaveDays += sheet.summary.leaveDaysCount;
        });

        const netBalanceMin = totalOvertimeMin - totalDeficitMin;
        const isNetPositive = netBalanceMin >= 0;
        const avgOvertime = timesheets.length > 0 
            ? formatMinutesToTime(Math.round(totalOvertimeMin / timesheets.length))
            : '00:00';

        return {
            totalEmployees: timesheets.length,
            totalWorkTime: formatMinutesToTime(totalWorkMin),
            totalOvertime: formatMinutesToTime(totalOvertimeMin),
            totalDeficit: formatMinutesToTime(totalDeficitMin),
            totalDuty: formatMinutesToTime(totalDutyMin),
            netBalance: formatMinutesToTime(Math.abs(netBalanceMin)),
            isNetPositive,
            avgOvertimePerEmployee: avgOvertime,
            totalPunches,
            totalLeaveDays
        };
    }, [timesheets]);

    // Export Master Aggregate Report to Excel
    const handleExportAggregate = () => {
        if (!timesheets || timesheets.length === 0) return;
        exportAggregateSummaryToExcel(timesheets);
        setToast({ 
            message: `فایل اکسل تجمیعی کارکرد و اضافه کار ${timesheets.length} کارمند با موفقیت دانلود شد.`, 
            type: 'success' 
        });
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in font-vazir" dir="rtl">
            {/* Top Bar Header */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-md shadow-emerald-500/20 shrink-0">
                        <Clock className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                سامانه حضور و غیاب و کارکرد پرسنل
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80">
                                حسینی خودرو شیراز
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                            <span>گزارش رسمی دستگاه تردد انگشتی و کارکرد ماهیانه</span>
                            {currentSheet && (
                                <>
                                    <span>•</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                        دوره: {currentSheet.startDate} تا {currentSheet.endDate}
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Manual Entry Button (Available to all, pre-filled for user or selector for admin) */}
                    <button
                        onClick={() => setIsManualEntryModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-95 text-white rounded-xl font-black text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                        title="ثبت یا ویرایش دستی سوابق ورود و خروج یک روز"
                    >
                        <Plus className="w-4 h-4" />
                        <span>ثبت دستی تردد</span>
                    </button>

                    {/* Admin Only Actions */}
                    {effectiveIsAdmin && (
                        <>
                            {/* Primary Bulk XLS Upload Button */}
                            <button
                                onClick={() => setIsBulkModalOpen(true)}
                                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                                title="آپلود دسته‌ای و همزمان چندین فایل اکسل (.xls / .xlsx)"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                                <span>آپلود گروهی فایل‌های XLS</span>
                                <span className="bg-white/25 text-white text-[10px] px-2 py-0.5 rounded-md font-bold">
                                    دسته‌ای
                                </span>
                            </button>

                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                                title="بارگذاری انفرادی فایل اکسل، CSV یا پیست متن تردد"
                            >
                                <UploadCloud className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                <span>ورود انفرادی فایل</span>
                            </button>

                            {/* Master Aggregate Excel export for all staff */}
                            <button
                                onClick={handleExportAggregate}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                title="دانلود فایل اکسل لیست تجمیعی کارکرد، اضافه کار و کسری کار تمام پرسنل"
                            >
                                <Download className="w-4 h-4 text-emerald-100" />
                                <span>اکسل تجمیعی کارکرد</span>
                            </button>

                            {/* Multi-sheet Excel export for all staff */}
                            <button
                                onClick={handleExportAllToExcel}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                                title="دانلود فایل اکسل چند شیته شامل کارنامه تردد تمام پرسنل"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>اکسل کل پرسنل ({timesheets.length})</span>
                            </button>
                        </>
                    )}

                    <button
                        onClick={handleSyncWebhook}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                        title="ارتباط با Endpoint سرور"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                        <span>همگام‌سازی وب‌هوک</span>
                    </button>

                    <button
                        onClick={handleExport}
                        disabled={!currentSheet}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors disabled:opacity-40 cursor-pointer"
                        title="خروجی فایل اکسل (CSV) کارمند فعال"
                    >
                        <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>اکسل فردی</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        title="چاپ کارنامه تردد"
                    >
                        <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        <span>چاپ</span>
                    </button>
                </div>
            </div>

            {/* Webhook Status Notice Banner (Informative when 404 or checked) */}
            {webhookStatus && !webhookStatus.active && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 animate-fade-in">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <strong className="font-bold">وضعیت اتصال به وب‌هوک سرور:</strong>
                        <p className="mt-0.5 text-amber-800 dark:text-amber-300 leading-relaxed">
                            آدرس <span className="font-mono dir-ltr inline-block font-bold">{TIMESHEET_API_URL}</span> هنوز در نرم‌افزار n8n روی وضعیت <strong>Active</strong> قرار نگرفته است (خطای 404). به محض فعال‌سازی، سیستم مستقیماً سوابق را همگام می‌کند. در حال حاضر اطلاعات ثبت‌شده و فایل‌های اکسل بارگذاری‌شده نمایش داده می‌شوند.
                        </p>
                    </div>
                </div>
            )}

            {/* View Mode Navigation Tabs: Aggregate Master Summary, Individual Timesheet, Leaves, Overtime */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl">
                    {effectiveIsAdmin && (
                        <button
                            onClick={() => setViewMode('AGGREGATE')}
                            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                viewMode === 'AGGREGATE'
                                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <LayoutList className="w-4 h-4" />
                            <span>لیست تجمیعی کارکرد پرسنل</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                viewMode === 'AGGREGATE' 
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' 
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                                {timesheets.length.toLocaleString('fa-IR')} نفر
                            </span>
                        </button>
                    )}

                    <button
                        onClick={() => setViewMode('INDIVIDUAL')}
                        className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            viewMode === 'INDIVIDUAL'
                                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <UserCheck className="w-4 h-4" />
                        <span>{effectiveIsAdmin ? 'کارنامه تفصیلی انفرادی' : 'کارنامه تردد و کارکرد من'}</span>
                        {currentSheet && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                                {currentSheet.employeeName}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setViewMode('LEAVE_REQUESTS')}
                        className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            viewMode === 'LEAVE_REQUESTS'
                                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Coffee className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>{effectiveIsAdmin ? 'درخواست‌های مرخصی پرسنل' : 'درخواست‌های مرخصی من'}</span>
                    </button>

                    <button
                        onClick={() => setViewMode('OVERTIME_REQUESTS')}
                        className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            viewMode === 'OVERTIME_REQUESTS'
                                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>{effectiveIsAdmin ? 'درخواست‌های اضافه کاری پرسنل' : 'درخواست‌های اضافه کاری من'}</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 px-2 text-xs text-slate-500">
                    <span className="hidden md:inline text-[11px] text-slate-400">
                        حسینی خودرو شیراز • سامانه جامع تردد، مرخصی و اضافه کار
                    </span>
                </div>
            </div>

            {/* View Mode Content */}
            {viewMode === 'AGGREGATE' && effectiveIsAdmin && (
                <AttendanceAggregateView
                    timesheets={timesheets}
                    selectedSheetId={selectedSheetId}
                    aggregateMetrics={aggregateMetrics}
                    onSelectEmployee={(sheetId) => {
                        setSelectedSheetId(sheetId);
                        setViewMode('INDIVIDUAL');
                    }}
                    onExportAggregateToExcel={handleExportAggregate}
                    onExportAllToExcel={handleExportAllToExcel}
                    onExportSingleToExcel={(sheet) => exportTimesheetToExcelCSV(sheet)}
                    onResetToSample={handleResetToSample}
                    onOpenUploadModal={() => setIsBulkModalOpen(true)}
                    onDeleteSheet={handleDeleteSheet}
                />
            )}

            {viewMode === 'INDIVIDUAL' && (
                <div className="space-y-6">
                    {/* Employee Selector Header */}
                    <AttendanceEmployeeHeader
                        timesheets={effectiveIsAdmin ? timesheets : visibleTimesheets}
                        currentSheet={currentSheet}
                        selectedSheetId={selectedSheetId}
                        onSelectSheetId={setSelectedSheetId}
                        onSwitchToAggregate={() => setViewMode('AGGREGATE')}
                        onDeleteSheet={handleDeleteSheet}
                        isAdmin={effectiveIsAdmin}
                    />

            {/* KPI Summary Cards */}
            {currentSheet && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Card 1: Total Working Hours */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">کارکرد نهایی</span>
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-xl font-black text-slate-800 dark:text-white font-mono dir-ltr inline-block">
                                {currentSheet.summary.totalFinalWorkTime}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                موظفی: {currentSheet.summary.totalDuty}
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Overtime */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">مجموع اضافه کار</span>
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono dir-ltr inline-block">
                                +{currentSheet.summary.totalOvertime}
                            </span>
                            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                                ساعت مازاد بر موظفی
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Deficit & Delay */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">مجموع کسر کار</span>
                            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
                                <Hourglass className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono dir-ltr inline-block">
                                -{currentSheet.summary.totalDeficit}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                تاخیر غیرمجاز: {currentSheet.summary.totalUnauthorizedDelay}
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Working Days */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">روزهای کاری</span>
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
                                <Building2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-xl font-black text-slate-800 dark:text-white">
                                {currentSheet.summary.workDaysCount.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-xs font-normal text-slate-400 mr-1">روز</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                تردد کل: {currentSheet.summary.totalPunches.toLocaleString('fa-IR')} بار
                            </p>
                        </div>
                    </div>

                    {/* Card 5: Leave Days */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">مرخصی استحقاقی</span>
                            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
                                <Coffee className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-xl font-black text-purple-700 dark:text-purple-300">
                                {currentSheet.summary.leaveDaysCount.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-xs font-normal text-slate-400 mr-1">روز</span>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                موظفی: {currentSheet.summary.totalLeaveDuty}
                            </p>
                        </div>
                    </div>

                    {/* Card 6: Holidays */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">روزهای تعطیل</span>
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
                                <Calendar className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-xl font-black text-slate-700 dark:text-slate-300">
                                {currentSheet.summary.holidayDaysCount.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-xs font-normal text-slate-400 mr-1">روز</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                تعطیل رسمی و جمعه‌ها
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="جستجو در تاریخ یا روز هفته..."
                        className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
                    />
                </div>

                {/* Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            statusFilter === 'ALL'
                            ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                            : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                    >
                        همه روزها ({currentSheet?.records.length || 0})
                    </button>
                    <button
                        onClick={() => setStatusFilter('WORK')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            statusFilter === 'WORK'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                        }`}
                    >
                        روزهای کاری
                    </button>
                    <button
                        onClick={() => setStatusFilter('OVERTIME')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            statusFilter === 'OVERTIME'
                            ? 'bg-teal-600 text-white'
                            : 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 hover:bg-teal-100'
                        }`}
                    >
                        دارای اضافه کار
                    </button>
                    <button
                        onClick={() => setStatusFilter('DELAY')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            statusFilter === 'DELAY'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100'
                        }`}
                    >
                        تاخیر یا کسر کار
                    </button>
                    <button
                        onClick={() => setStatusFilter('LEAVE')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            statusFilter === 'LEAVE'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100'
                        }`}
                    >
                        مرخصی
                    </button>
                    <button
                        onClick={() => setStatusFilter('HOLIDAY')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            statusFilter === 'HOLIDAY'
                            ? 'bg-slate-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                    >
                        تعطیلات
                    </button>
                </div>
            </div>

            {/* Main Tabular Timesheet */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-100/90 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 select-none font-bold">
                                <th className="p-3.5 pr-4 text-center">ردیف</th>
                                <th className="p-3.5">روز هفته</th>
                                <th className="p-3.5">تاریخ</th>
                                <th className="p-3.5 text-center font-mono">ورود صبح</th>
                                <th className="p-3.5 text-center font-mono">خروج صبح</th>
                                <th className="p-3.5 text-center font-mono">ورود عصر</th>
                                <th className="p-3.5 text-center font-mono">خروج عصر</th>
                                <th className="p-3.5 text-center font-mono">موظفی</th>
                                <th className="p-3.5 text-center font-mono">حضور</th>
                                <th className="p-3.5 text-center font-mono">کارکرد</th>
                                <th className="p-3.5 text-center font-mono">تاخیر صبح</th>
                                <th className="p-3.5 text-center font-mono">تاخیر غیرمجاز</th>
                                <th className="p-3.5 text-center font-mono text-emerald-700 dark:text-emerald-300">اضافه کار</th>
                                <th className="p-3.5 text-center font-mono text-rose-700 dark:text-rose-300">کسر کار</th>
                                <th className="p-3.5 text-center">تردد</th>
                                <th className="p-3.5 text-center">وضعیت</th>
                                <th className="p-3.5 pl-4 text-center">جزییات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={17} className="p-12 text-center text-slate-400 font-bold">
                                        هیچ رکوردی با فیلترهای انتخابی یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((r, idx) => {
                                    const isHoliday = r.status.includes('تعطیل');
                                    const isLeave = r.status.includes('مرخصی');
                                    const hasDelay = (r.morningDelay && r.morningDelay !== '0' && r.morningDelay !== '0:00') || (r.unauthorizedDelay && r.unauthorizedDelay !== '0' && r.unauthorizedDelay !== '0:00');
                                    const hasOvertime = r.overtime && r.overtime !== '0' && r.overtime !== '0:00';
                                    const hasDeficit = r.deficit && r.deficit !== '0' && r.deficit !== '0:00';

                                    let rowBg = 'hover:bg-slate-50/80 dark:hover:bg-slate-700/40';
                                    if (isHoliday) rowBg = 'bg-slate-50/60 dark:bg-slate-900/30 text-slate-400';
                                    if (isLeave) rowBg = 'bg-purple-50/40 dark:bg-purple-950/20';

                                    return (
                                        <tr key={r.id || idx} className={`transition-colors ${rowBg}`}>
                                            <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                                                {idx + 1}
                                            </td>
                                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                                {r.dayOfWeek}
                                            </td>
                                            <td className="p-3 font-mono text-slate-600 dark:text-slate-300 text-[11px] whitespace-nowrap">
                                                {r.date}
                                            </td>
                                            <td className="p-3 text-center font-mono text-slate-700 dark:text-slate-300">
                                                {r.morningEntry === '0' || r.morningEntry === '0:00' ? '-' : r.morningEntry}
                                            </td>
                                            <td className="p-3 text-center font-mono text-slate-700 dark:text-slate-300">
                                                {r.morningExit === '0' || r.morningExit === '0:00' ? '-' : r.morningExit}
                                            </td>
                                            <td className="p-3 text-center font-mono text-slate-700 dark:text-slate-300">
                                                {r.afternoonEntry === '0' || r.afternoonEntry === '0:00' ? '-' : r.afternoonEntry}
                                            </td>
                                            <td className="p-3 text-center font-mono text-slate-700 dark:text-slate-300">
                                                {r.afternoonExit === '0' || r.afternoonExit === '0:00' ? '-' : r.afternoonExit}
                                            </td>
                                            <td className="p-3 text-center font-mono text-slate-500">
                                                {r.dutyHours}
                                            </td>
                                            <td className="p-3 text-center font-mono text-slate-800 dark:text-slate-200 font-bold">
                                                {r.presence === '0' ? '-' : r.presence}
                                            </td>
                                            <td className="p-3 text-center font-mono text-slate-800 dark:text-slate-200 font-bold">
                                                {r.workTime === '0' ? '-' : r.workTime}
                                            </td>
                                            <td className="p-3 text-center font-mono">
                                                {r.morningDelay && r.morningDelay !== '0' && r.morningDelay !== '0:00' ? (
                                                    <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md">
                                                        {r.morningDelay}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center font-mono">
                                                {r.unauthorizedDelay && r.unauthorizedDelay !== '0' && r.unauthorizedDelay !== '0:00' ? (
                                                    <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md">
                                                        {r.unauthorizedDelay}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center font-mono">
                                                {hasOvertime ? (
                                                    <span className="text-emerald-700 dark:text-emerald-300 font-black bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-lg">
                                                        +{r.overtime}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center font-mono">
                                                {hasDeficit ? (
                                                    <span className="text-rose-700 dark:text-rose-300 font-black bg-rose-100/80 dark:bg-rose-950/80 px-2 py-0.5 rounded-lg">
                                                        -{r.deficit}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center font-mono">
                                                {r.punchesCount > 0 ? (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                                                        {r.punchesCount}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">۰</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                {isHoliday ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                        تعطیل
                                                    </span>
                                                ) : isLeave ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                        {r.status}
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                                                        کاری
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center pl-4">
                                                <button
                                                    onClick={() => {
                                                        setSelectedDayRecord(r);
                                                        setIsDayDetailModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="مشاهده جزییات تردد روز"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>

                        {/* Summary Totals Footer Row */}
                        {currentSheet && (
                            <tfoot>
                                <tr className="bg-slate-200/80 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white">
                                    <td colSpan={3} className="p-4 pr-6 text-sm font-black">
                                        مجموع عملکرد ماهانه ({currentSheet.employeeName})
                                    </td>
                                    <td colSpan={4} className="p-4 text-center text-slate-500 font-normal text-[11px]">
                                        {currentSheet.summary.workDaysCount} روز کاری • {currentSheet.summary.leaveDaysCount} روز مرخصی
                                    </td>
                                    <td className="p-4 text-center font-mono">{currentSheet.summary.totalDuty}</td>
                                    <td className="p-4 text-center font-mono">{currentSheet.summary.totalPresence}</td>
                                    <td className="p-4 text-center font-mono">{currentSheet.summary.totalFinalWorkTime}</td>
                                    <td className="p-4 text-center font-mono text-amber-700 dark:text-amber-300">{currentSheet.summary.totalMorningDelay}</td>
                                    <td className="p-4 text-center font-mono text-rose-700 dark:text-rose-300">{currentSheet.summary.totalUnauthorizedDelay}</td>
                                    <td className="p-4 text-center font-mono text-emerald-700 dark:text-emerald-400 text-sm">+{currentSheet.summary.totalOvertime}</td>
                                    <td className="p-4 text-center font-mono text-rose-700 dark:text-rose-400 text-sm">-{currentSheet.summary.totalDeficit}</td>
                                    <td className="p-4 text-center font-mono">{currentSheet.summary.totalPunches}</td>
                                    <td colSpan={2} className="p-4 text-center text-slate-400 text-[10px]">
                                        تایید شده
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
                </div>
            )}

            {/* Merged View: Leave Requests */}
            {viewMode === 'LEAVE_REQUESTS' && (
                <div className="animate-fade-in">
                    <AttendanceUnifiedLeaveSection
                        isAdmin={effectiveIsAdmin}
                        selectedEmployeeName={effectiveIsAdmin ? undefined : currentUserName}
                        onEmployeeSelect={(name) => {
                            const match = timesheets.find(t => t.employeeName.trim() === name.trim());
                            if (match) {
                                setSelectedSheetId(match.id);
                                setViewMode('INDIVIDUAL');
                            }
                        }}
                    />
                </div>
            )}

            {/* Merged View: Overtime Requests */}
            {viewMode === 'OVERTIME_REQUESTS' && (
                <div className="animate-fade-in">
                    <AttendanceUnifiedOvertimeSection
                        isAdmin={effectiveIsAdmin}
                        selectedEmployeeName={effectiveIsAdmin ? undefined : currentUserName}
                        onEmployeeSelect={(name) => {
                            const match = timesheets.find(t => t.employeeName.trim() === name.trim());
                            if (match) {
                                setSelectedSheetId(match.id);
                                setViewMode('INDIVIDUAL');
                            }
                        }}
                    />
                </div>
            )}

            {/* Daily Punch Log Detail Modal */}
            {isDayDetailModalOpen && selectedDayRecord && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in"
                    onClick={() => setIsDayDetailModalOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 space-y-5"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 dark:text-white text-base">
                                        جزییات تردد روز {selectedDayRecord.dayOfWeek}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono">{selectedDayRecord.date}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDayDetailModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Shift 1 & Shift 2 Boxes */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                                    <strong className="text-slate-700 dark:text-slate-300 font-bold block">
                                        ☀️ شیفت صبح
                                    </strong>
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                        <span>ورود صبح:</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedDayRecord.morningEntry}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                        <span>خروج صبح:</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedDayRecord.morningExit}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-amber-600">
                                        <span>تاخیر صبح:</span>
                                        <span className="font-mono font-bold">{selectedDayRecord.morningDelay}</span>
                                    </div>
                                </div>

                                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                                    <strong className="text-slate-700 dark:text-slate-300 font-bold block">
                                        🌙 شیفت عصر
                                    </strong>
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                        <span>ورود عصر:</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedDayRecord.afternoonEntry}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                        <span>خروج عصر:</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedDayRecord.afternoonExit}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-500">
                                        <span>تعداد تردد:</span>
                                        <span className="font-mono font-bold">{selectedDayRecord.punchesCount} بار</span>
                                    </div>
                                </div>
                            </div>

                            {/* Calculation Breakdown */}
                            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 dark:text-slate-400">ساعت موظفی روز:</span>
                                    <span className="font-mono font-bold">{selectedDayRecord.dutyHours}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 dark:text-slate-400">ساعت کارکرد نهایی:</span>
                                    <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{selectedDayRecord.finalWorkTime}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-300">
                                    <span>اضافه کار تایید شده:</span>
                                    <span className="font-mono font-black">+{selectedDayRecord.overtime}</span>
                                </div>
                                <div className="flex justify-between items-center text-rose-700 dark:text-rose-300">
                                    <span>کسر کار ثبت شده:</span>
                                    <span className="font-mono font-black">-{selectedDayRecord.deficit}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1 border-t border-emerald-200/60 dark:border-emerald-800">
                                    <span>وضعیت ثبت شده:</span>
                                    <span className="font-bold">{selectedDayRecord.status}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setIsDayDetailModalOpen(false)}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xs"
                            >
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk XLS / Excel Files Import Modal */}
            {isBulkModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in"
                    onClick={() => {
                        if (!isBulkProcessing) setIsBulkModalOpen(false);
                    }}
                >
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full p-6 border border-slate-200 dark:border-slate-700 space-y-5 max-h-[90vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b dark:border-slate-700 pb-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-2xl">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-slate-800 dark:text-white text-lg">
                                            آپلود گروهی فایل‌های اکسل حضور و غیاب (.xls / .xlsx)
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                            دسته‌ای
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        انتخاب یا رها کردن همزمان چندین فایل اکسل دستگاه حضور و غیاب جهت استخراج خودکار کارنامه پرسنل
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsBulkModalOpen(false)}
                                disabled={isBulkProcessing}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Scrollable Body */}
                        <div className="flex-1 overflow-y-auto space-y-5 pr-1 -mr-1">
                            {/* Drag & Drop or Browse Multi-File Box */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setBulkIsDragging(true);
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    setBulkIsDragging(false);
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setBulkIsDragging(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                        handleBulkFilesProcess(e.dataTransfer.files);
                                    }
                                }}
                                onClick={() => bulkFileInputRef.current?.click()}
                                className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
                                    bulkIsDragging
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 scale-[1.01]'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 bg-slate-50/70 dark:bg-slate-900/40'
                                }`}
                            >
                                <input
                                    ref={bulkFileInputRef}
                                    type="file"
                                    multiple
                                    accept=".xls,.xlsx,.csv,.txt"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            handleBulkFilesProcess(e.target.files);
                                            e.target.value = '';
                                        }
                                    }}
                                    className="hidden"
                                />
                                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <FolderUp className="w-7 h-7" />
                                </div>
                                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                                    فایل‌های اکسل (.xls / .xlsx) یا CSV را اینجا رها کنید، یا برای انتخاب کلیک نمایید
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                                    می‌توانید به صورت همزمان چندین فایل خروجی دستگاه تردد (حتی فایل‌های تجمیعی چند نفره) را انتخاب کنید.
                                </p>
                                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                    <Files className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>پشتیبانی از فرمت‌های .xls, .xlsx و .csv</span>
                                </div>
                            </div>

                            {/* Processing Progress State */}
                            {isBulkProcessing && (
                                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-center space-y-3 animate-pulse">
                                    <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
                                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                        در حال آنالیز ساختار فایل‌ها و استخراج ردیف‌های تردد پرسنل...
                                    </p>
                                </div>
                            )}

                            {/* Parsing Errors Banner (if any individual file failed) */}
                            {bulkErrors.length > 0 && (
                                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl text-xs space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        <span>گزارش خطای خواندن برخی فایل‌ها ({bulkErrors.length} مورد):</span>
                                    </div>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {bulkErrors.map((err, i) => (
                                            <div key={i} className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-[11px] bg-white/60 dark:bg-slate-900/40 px-2.5 py-1 rounded-lg">
                                                <span className="font-mono font-bold">{err.fileName}</span>
                                                <span>{err.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Extracted Records Preview Table */}
                            {bulkParsedItems.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 dark:bg-slate-900/60 rounded-2xl">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleToggleSelectAllBulk}
                                                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600"
                                            >
                                                {bulkParsedItems.every(i => i.selected) ? (
                                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-400" />
                                                )}
                                                <span>انتخاب همه ({bulkParsedItems.length} کارنامه)</span>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-slate-500">
                                                انتخاب شده: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{bulkParsedItems.filter(i => i.selected).length}</strong> از {bulkParsedItems.length}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setBulkParsedItems([]);
                                                    setBulkErrors([]);
                                                }}
                                                className="text-[11px] text-rose-500 hover:text-rose-700 font-bold"
                                            >
                                                پاکسازی لیست
                                            </button>
                                        </div>
                                    </div>

                                    {/* Table of Parsed Sheets */}
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs">
                                        <div className="max-h-64 overflow-y-auto">
                                            <table className="w-full text-right text-xs">
                                                <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0 z-10 border-b dark:border-slate-700 text-[11px]">
                                                    <tr>
                                                        <th className="p-3 w-10 text-center">تایید</th>
                                                        <th className="p-3">نام و کد پرسنلی</th>
                                                        <th className="p-3">دوره کارکرد</th>
                                                        <th className="p-3 text-center">روزها</th>
                                                        <th className="p-3 text-center">کارکرد</th>
                                                        <th className="p-3 text-center">اضافه کار</th>
                                                        <th className="p-3 text-center">کسر کار</th>
                                                        <th className="p-3 text-center w-12">حذف</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-vazir">
                                                    {bulkParsedItems.map((item) => {
                                                        const { sheet } = item;
                                                        const alreadyExists = timesheets.some(s => s.employeeCode === sheet.employeeCode && s.startDate === sheet.startDate);
                                                        return (
                                                            <tr 
                                                                key={item.id}
                                                                className={`hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors ${
                                                                    item.selected ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : 'opacity-60'
                                                                }`}
                                                            >
                                                                <td className="p-3 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={item.selected}
                                                                        onChange={() => handleToggleSelectBulkItem(item.id)}
                                                                        className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                                    />
                                                                </td>
                                                                <td className="p-3 font-bold text-slate-800 dark:text-white">
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{sheet.employeeName}</span>
                                                                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-md font-mono text-slate-600 dark:text-slate-300">
                                                                            {sheet.employeeCode}
                                                                        </span>
                                                                        {alreadyExists && (
                                                                            <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1 py-0.2 rounded-md">
                                                                                به‌روزرسانی
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                                                    {sheet.startDate} تا {sheet.endDate}
                                                                </td>
                                                                <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                                                                    {sheet.records.length} روز
                                                                </td>
                                                                <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                                                                    {sheet.summary.totalPresentTime || '—'}
                                                                </td>
                                                                <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                                    {sheet.summary.totalOvertime ? `+${sheet.summary.totalOvertime}` : '۰'}
                                                                </td>
                                                                <td className="p-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400">
                                                                    {sheet.summary.totalDeficit ? `-${sheet.summary.totalDeficit}` : '۰'}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <button
                                                                        onClick={() => handleRemoveBulkItem(item.id)}
                                                                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                                                        title="حذف از این لیست"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between border-t dark:border-slate-700 pt-4 shrink-0">
                            <div className="text-xs text-slate-500">
                                {bulkParsedItems.length > 0 ? (
                                    <span>
                                        آماده ثبت: <strong className="text-slate-800 dark:text-white font-bold">{bulkParsedItems.filter(i => i.selected).length}</strong> کارمند
                                    </span>
                                ) : (
                                    <span>لطفاً فایل‌های اکسل دستگاه تردد را انتخاب نمایید.</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsBulkModalOpen(false)}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={handleConfirmBulkImport}
                                    disabled={bulkParsedItems.filter(i => i.selected).length === 0}
                                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/20 disabled:opacity-40 transition-all cursor-pointer"
                                >
                                    ثبت و درون‌ریزی گروهی ({bulkParsedItems.filter(i => i.selected).length.toLocaleString('fa-IR')} کارمند)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {isImportModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in"
                    onClick={() => setIsImportModalOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-700 space-y-5"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2.5 bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 rounded-xl">
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 dark:text-white text-base">
                                        بارگذاری و پردازش فایل اکسل یا خروجی دستگاه حضور و غیاب
                                    </h3>
                                    <p className="text-xs text-slate-500">پشتیبانی از فرمت‌های XLS, XLSX و CSV خروجی دستگاه تردد انگشتی</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* File selector or Drag & Drop */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-cyan-500 dark:hover:border-cyan-400 rounded-2xl text-center cursor-pointer transition-colors bg-slate-50/60 dark:bg-slate-900/30"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xls,.xlsx,.csv,.txt"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <FileSpreadsheet className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                کلیک کنید یا فایل اکسل (.xls / .xlsx) یا CSV دستگاه را اینجا رها کنید
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">فرمت خروجی استاندارد کارکرد و تردد پرسنل (حسینی خودرو شیراز)</p>
                        </div>

                        {/* Direct Paste Area */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                یا متن داده‌های CSV را مستقیماً پیست نمایید:
                            </label>
                            <textarea
                                value={importText}
                                onChange={(e) => handleImportTextChange(e.target.value)}
                                placeholder="روز هفته,تاريخ,ورود صبح,خروج صبح,ورود عصر..."
                                rows={6}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-cyan-500"
                            />
                        </div>

                        {/* Import Error */}
                        {importError && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{importError}</span>
                            </div>
                        )}

                        {/* Preview */}
                        {importPreview && (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs space-y-1.5">
                                <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-200">
                                    <span>اطلاعات استخراج شده از فایل:</span>
                                    <span className="bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 rounded-full text-[10px]">
                                        آماده ثبت
                                    </span>
                                </div>
                                <p className="text-emerald-800 dark:text-emerald-300">
                                    نام کارمند: <strong>{importPreview.employeeName}</strong> (کد: {importPreview.employeeCode})
                                    <span className="mx-2">•</span>
                                    دوره: <strong>{importPreview.startDate} تا {importPreview.endDate}</strong>
                                    <span className="mx-2">•</span>
                                    تعداد روزها: <strong>{importPreview.records.length} روز</strong>
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <button
                                onClick={() => {
                                    setImportText(RAW_SAMPLE_TIMESHEET_CSV);
                                    handleImportTextChange(RAW_SAMPLE_TIMESHEET_CSV);
                                }}
                                className="text-xs font-bold text-cyan-600 hover:text-cyan-700 cursor-pointer"
                            >
                                درج قالب نمونه استاندارد CSV
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={handleConfirmImport}
                                    disabled={!importPreview}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs disabled:opacity-40 cursor-pointer"
                                >
                                    تایید و بارگذاری در سیستم
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Manual Entry / Edit Modal */}
            <AttendanceManualEntryModal
                isOpen={isManualEntryModalOpen}
                onClose={() => setIsManualEntryModalOpen(false)}
                timesheets={timesheets}
                existingSheets={timesheets}
                selectedSheetId={selectedSheetId}
                currentEmployeeName={currentSheet?.employeeName || currentUserName}
                currentEmployeeCode={currentSheet?.employeeCode || (loggedInUser?.id ? String(loggedInUser.id) : '')}
                isAdmin={effectiveIsAdmin}
                onSave={handleSaveManualEntry}
            />

            {/* Toast feedback */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AttendancePage;
