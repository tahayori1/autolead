import React, { useState, useEffect, useMemo } from 'react';
import type { CorrectiveAction, CorrectiveActionPriority, CorrectiveActionStatus, CorrectiveActionEffectiveness, StaffUser, MyProfile } from '../types';
import { correctiveActionsService, getStaffUsers, getMyProfile } from '../services/api';
import { ClipboardCheckIcon } from '../components/icons/ClipboardCheckIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import PersianDatePicker from '../components/PersianDatePicker';
import { 
    Clock, 
    Calendar, 
    CheckCircle2, 
    AlertTriangle, 
    FileText, 
    Layers, 
    User, 
    Building2, 
    ShieldAlert, 
    Filter, 
    Search, 
    Sparkles, 
    TrendingUp, 
    Check, 
    ChevronRight, 
    ChevronLeft, 
    Download, 
    Share2, 
    RotateCcw, 
    HelpCircle, 
    Activity, 
    CheckCheck, 
    Flag,
    Eye,
    Printer,
    Copy,
    ArrowRight,
    BarChart3,
    FileSpreadsheet,
    Users,
    CheckSquare,
    Square,
    UserCheck,
    ShieldCheck,
    UserCog,
    ArrowUpDown,
    SlidersHorizontal,
    CalendarClock,
    CalendarDays,
    Hourglass,
    ChevronDown,
    ChevronUp,
    X,
    BellRing
} from 'lucide-react';
import { CorrectiveActionsAnalyticsView } from '../components/corrective-actions/CorrectiveActionsAnalyticsView';

declare const moment: any;

export type CorrectiveActionSortOption = 
    | 'SMART_URGENCY'   // اقدامات با موعد نزدیک و انجام‌نشده در ابتدا (پیش‌فرض هوشمند)
    | 'DUE_DATE_ASC'     // مهلت اجرا (نزدیک‌ترین موعد به دورترین)
    | 'DUE_DATE_DESC'    // مهلت اجرا (دورترین موعد به نزدیک‌ترین)
    | 'REG_DATE_DESC'    // زمان ثبت (جدیدترین به قدیمی‌ترین)
    | 'REG_DATE_ASC'     // زمان ثبت (قدیمی‌ترین به جدیدترین)
    | 'EXEC_DATE_DESC'   // تاریخ اجرا (جدیدترین به قدیمی‌ترین)
    | 'EXEC_DATE_ASC'    // تاریخ اجرا (قدیمی‌ترین به جدیدترین)
    | 'PRIORITY_DESC'    // اولویت (بحرانی و بالا به پایین)
    | 'TITLE_ASC';       // عنوان (الفبایی)

export type DueDateFilterOption = 
    | 'ALL' 
    | 'OVERDUE' 
    | 'DUE_TODAY' 
    | 'DUE_3_DAYS' 
    | 'DUE_7_DAYS' 
    | 'DUE_30_DAYS' 
    | 'HAS_DUE_DATE' 
    | 'NO_DUE_DATE';

export type RegDateFilterOption = 
    | 'ALL' 
    | 'TODAY' 
    | 'LAST_7_DAYS' 
    | 'LAST_30_DAYS';

export type ExecDateFilterOption = 
    | 'ALL' 
    | 'EXECUTED' 
    | 'NOT_EXECUTED' 
    | 'ON_TIME' 
    | 'LATE';

const DEPARTMENTS = [
    'فروش و بازاریابی',
    'خدمات پس از فروش و تعمیرگاه',
    'پذیرش و ترخیص',
    'تحویل خودرو و PDI',
    'امور مشتریان و CRM',
    'مالی و حسابداری',
    'منابع انسانی و اداری',
    'انبار و سفارش قطعات',
    'مدیریت کیفیت و بازرسی',
    'فناوری اطلاعات و سامانه'
];

const PRIORITIES: { key: CorrectiveActionPriority; label: string; color: string; badge: string }[] = [
    { key: 'LOW', label: 'عادی / کم', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300', badge: 'border-slate-300 dark:border-slate-700' },
    { key: 'MEDIUM', label: 'متوسط', color: 'text-sky-700 bg-sky-100 dark:bg-sky-950 dark:text-sky-300', badge: 'border-sky-300 dark:border-sky-800' },
    { key: 'HIGH', label: 'بالا', color: 'text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300', badge: 'border-amber-300 dark:border-amber-800' },
    { key: 'CRITICAL', label: 'بحرانی / فوری', color: 'text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300', badge: 'border-rose-300 dark:border-rose-800' },
];

const EFFECTIVENESS_OPTIONS: { key: CorrectiveActionEffectiveness; label: string; color: string }[] = [
    { key: 'PENDING_REVIEW', label: 'در انتظار بررسی و ارزیابی', color: 'text-slate-600 bg-slate-100' },
    { key: 'EFFECTIVE', label: 'کاملاً اثربخش و تاییدشده', color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300' },
    { key: 'PARTIALLY_EFFECTIVE', label: 'تا حدودی اثربخش (نیازمند تکمیل)', color: 'text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300' },
    { key: 'INEFFECTIVE', label: 'فاقد اثربخشی (نیازمند اقدام مجدد)', color: 'text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300' },
];

const toGregorian = (dateStr?: string): string => {
    if (!dateStr || !dateStr.trim()) return '';
    try {
        const normalized = dateStr.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                                  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
                                  .trim();
        const dateOnly = normalized.replace('T', ' ').split(' ')[0].trim();
        if (!dateOnly) return '';

        // If it's already a standard Gregorian YYYY-MM-DD format (year > 1900)
        if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(dateOnly)) {
            const firstNum = parseInt(dateOnly.split(/[-/]/)[0], 10);
            if (firstNum > 1900) {
                if (typeof moment !== 'undefined') {
                    const gm = moment(dateOnly, ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY-M-D', 'YYYY/M/D']);
                    if (gm && gm.isValid()) return gm.format('YYYY-MM-DD');
                }
                const parts = dateOnly.split(/[-/]/);
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
        }

        if (typeof moment !== 'undefined') {
            const m = moment(dateOnly, ['jYYYY/jMM/jDD', 'jYYYY/jM/jD', 'jYYYY-jMM-jDD', 'jYYYY-jM-jD', 'jYYYY/jM/jDD', 'jYYYY/jMM/jD']);
            if (m && m.isValid()) {
                return m.format('YYYY-MM-DD');
            }
        }
    } catch (e) {
        console.error("Error converting Jalali to Gregorian:", e);
    }
    return dateStr.replace('T', ' ').split(' ')[0] || '';
};

const toJalali = (gregorianStr?: string): string => {
    if (!gregorianStr || !gregorianStr.trim()) return '';
    try {
        const normalized = gregorianStr.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                                       .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
                                       .trim();
        const clean = normalized.replace('T', ' ').split(' ')[0].trim();
        if (!clean) return '';

        // Check if it's already a Jalali date (e.g. year starting with 13xx or 14xx)
        if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(clean)) {
            const firstNum = parseInt(clean.split(/[-/]/)[0], 10);
            if (firstNum >= 1300 && firstNum <= 1500) {
                const parts = clean.split(/[-/]/);
                return `${parts[0]}/${parts[1].padStart(2, '0')}/${parts[2].padStart(2, '0')}`;
            }
        }

        if (typeof moment !== 'undefined') {
            const m = moment(clean, ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY-M-D', 'YYYY/M/D']);
            if (m && m.isValid()) {
                return m.locale('fa').format('jYYYY/jMM/jDD');
            }
        }
    } catch (e) {
        console.error("Error converting Gregorian to Jalali:", e);
    }
    return gregorianStr || '';
};

const getCurrentJalaliDate = (): string => {
    try {
        if (typeof moment !== 'undefined') {
            return moment().locale('fa').format('jYYYY/jMM/jDD');
        }
    } catch (e) {
        // fallback
    }
    return new Date().toLocaleDateString('fa-IR');
};

const getCurrentTimeStr = (): string => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Parse any createdAt / datetime string into Jalali date and time
const parseCreatedAt = (rawCreatedAt?: string): { jalaliDate: string; time: string; fullDisplay: string } => {
    if (!rawCreatedAt || !rawCreatedAt.trim()) {
        const today = getCurrentJalaliDate();
        const nowTime = getCurrentTimeStr();
        return { jalaliDate: today, time: nowTime, fullDisplay: `${today} - ${nowTime}` };
    }

    try {
        // If it's something like "2026-08-24 12:43:00" or "2026-08-24T12:43:00" or "1405/06/02 - 12:43"
        const clean = rawCreatedAt.replace('T', ' ').trim();
        if (clean.includes(' - ')) {
            const [d, t] = clean.split(' - ');
            const jalali = toJalali(d);
            const time = t ? t.trim().substring(0, 5) : getCurrentTimeStr();
            return { jalaliDate: jalali, time, fullDisplay: `${jalali} (ساعت ${time})` };
        }

        const parts = clean.split(' ');
        const datePart = parts[0] || '';
        const timePart = parts[1] ? parts[1].trim().substring(0, 5) : getCurrentTimeStr();
        const jalaliDate = toJalali(datePart);
        const time = timePart || getCurrentTimeStr();

        return {
            jalaliDate,
            time,
            fullDisplay: `${jalaliDate} (ساعت ${time})`
        };
    } catch (e) {
        return { jalaliDate: getCurrentJalaliDate(), time: getCurrentTimeStr(), fullDisplay: rawCreatedAt };
    }
};

// Format strictly to MySQL DATETIME "YYYY-MM-DD HH:mm:ss", e.g. "2026-08-24 12:43:00"
const formatToMySqlDateTime = (dateStr?: string, timeStr?: string): string => {
    try {
        const now = new Date();
        const defaultTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        let gregorianDate = '';
        if (!dateStr || !dateStr.trim()) {
            gregorianDate = now.toISOString().split('T')[0];
        } else {
            const cleanedDate = dateStr.replace('T', ' ').split(' ')[0].trim();
            gregorianDate = toGregorian(cleanedDate);
        }

        if (!gregorianDate || gregorianDate.length < 10) {
            gregorianDate = now.toISOString().split('T')[0];
        }

        let formattedTime = defaultTime;
        if (timeStr && timeStr.trim()) {
            const cleanTime = timeStr.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                                     .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
                                     .trim();
            const timeParts = cleanTime.split(':');
            const h = (timeParts[0] || '00').padStart(2, '0');
            const m = (timeParts[1] || '00').padStart(2, '0');
            const s = (timeParts[2] || '00').padStart(2, '0');
            formattedTime = `${h}:${m}:${s}`;
        }

        return `${gregorianDate} ${formattedTime}`;
    } catch (e) {
        const now = new Date();
        const ymd = now.toISOString().split('T')[0];
        const hms = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        return `${ymd} ${hms}`;
    }
};

const CorrectiveActionsPage: React.FC = () => {
    const [actions, setActions] = useState<CorrectiveAction[]>([]);
    const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedActionForDetail, setSelectedActionForDetail] = useState<CorrectiveAction | null>(null);
    const [modalStep, setModalStep] = useState<1 | 2 | 3 | 4>(1);
    const [currentAction, setCurrentAction] = useState<Partial<CorrectiveAction>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Filters and search
    const [activeViewTab, setActiveViewTab] = useState<'LIST' | 'REPORTS'>('LIST');
    const [scopeFilter, setScopeFilter] = useState<'MY_ACTIONS' | 'ALL_ACTIONS'>('ALL_ACTIONS');
    const [myRoleFilter, setMyRoleFilter] = useState<'ALL' | 'RESPONSIBLE' | 'VERIFIER' | 'REGISTERED_BY'>('ALL');
    const [filterTab, setFilterTab] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CRITICAL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
    const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('ALL');

    // Enhanced Sorting & Advanced Timing / User Filters
    const [sortBy, setSortBy] = useState<CorrectiveActionSortOption>('SMART_URGENCY');
    const [selectedDueDateFilter, setSelectedDueDateFilter] = useState<DueDateFilterOption>('ALL');
    const [selectedRegDateFilter, setSelectedRegDateFilter] = useState<RegDateFilterOption>('ALL');
    const [selectedExecDateFilter, setSelectedExecDateFilter] = useState<ExecDateFilterOption>('ALL');
    const [selectedResponsibleFilter, setSelectedResponsibleFilter] = useState<string>('ALL');
    const [selectedRegistrarFilter, setSelectedRegistrarFilter] = useState<string>('ALL');
    const [selectedVerifierFilter, setSelectedVerifierFilter] = useState<string>('ALL');
    const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

    // Bulk edit and multi-selection state
    const [selectedActionIds, setSelectedActionIds] = useState<number[]>([]);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [bulkRegisteredBy, setBulkRegisteredBy] = useState<string>('__NO_CHANGE__');
    const [bulkResponsiblePerson, setBulkResponsiblePerson] = useState<string>('__NO_CHANGE__');
    const [bulkVerifierPerson, setBulkVerifierPerson] = useState<string>('__NO_CHANGE__');
    const [bulkLoading, setBulkLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [actionsData, usersData, profileData] = await Promise.all([
                correctiveActionsService.getAll().catch(() => []),
                getStaffUsers().catch(() => []),
                getMyProfile().catch(() => null)
            ]);
            setActions(Array.isArray(actionsData) ? actionsData : []);
            setStaffUsers(Array.isArray(usersData) ? usersData : []);
            setCurrentUserProfile(profileData);
        } catch (error) {
            setToast({ message: 'خطا در دریافت اطلاعات اقدامات اصلاحی', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const handleRefresh = () => {
            fetchData();
        };
        window.addEventListener('app-refresh', handleRefresh);
        return () => window.removeEventListener('app-refresh', handleRefresh);
    }, []);

    const openCreateModal = () => {
        const todayJalali = getCurrentJalaliDate();
        const currentTime = getCurrentTimeStr();
        const defaultRegisteredBy = currentUserProfile?.full_name || currentUserProfile?.fullName || currentUserProfile?.username || (staffUsers.length > 0 ? (staffUsers[0].fullName || staffUsers[0].username) : '');
        
        setCurrentAction({
            title: '',
            description: '',
            department: 'خدمات پس از فروش و تعمیرگاه',
            priority: 'MEDIUM',
            responsiblePerson: staffUsers.length > 0 ? (staffUsers[0].fullName || staffUsers[0].username) : '',
            verifierPerson: '',
            registeredBy: defaultRegisteredBy,
            rootCause: '',
            actionPlan: '',
            resourcesRequired: '',
            createdAt: formatToMySqlDateTime(todayJalali, currentTime),
            registrationDate: todayJalali,
            registrationTime: currentTime,
            dueDate: '',
            executionDate: '',
            isCompleted: false,
            status: 'IN_PROGRESS',
            effectiveness: 'PENDING_REVIEW',
            executionNotes: ''
        });
        setModalStep(1);
        setIsModalOpen(true);
    };

    const openEditModal = (action: CorrectiveAction) => {
        const parsedCreated = parseCreatedAt(action.createdAt);
        const jalaliRegDate = action.registrationDate ? toJalali(action.registrationDate) : parsedCreated.jalaliDate;
        const jalaliDueDate = action.dueDate ? toJalali(action.dueDate) : '';
        const jalaliExecDate = action.executionDate ? toJalali(action.executionDate) : '';

        setCurrentAction({
            ...action,
            dueDate: jalaliDueDate,
            executionDate: jalaliExecDate,
            registrationDate: jalaliRegDate,
            registrationTime: action.registrationTime || parsedCreated.time,
            priority: action.priority || 'MEDIUM',
            department: action.department || 'خدمات پس از فروش و تعمیرگاه',
            status: action.status || (action.isCompleted ? 'COMPLETED' : 'IN_PROGRESS'),
            effectiveness: action.effectiveness || 'PENDING_REVIEW'
        });
        setModalStep(1);
        setIsModalOpen(true);
    };

    const openDetailModal = (action: CorrectiveAction) => {
        setSelectedActionForDetail(action);
        setIsDetailModalOpen(true);
    };

    const handleSave = async () => {
        if (!currentAction.title || !currentAction.title.trim()) {
            setToast({ message: 'عنوان عدم انطباق / مشکل الزامی است', type: 'error' });
            setModalStep(1);
            return;
        }
        if (!currentAction.registeredBy || !currentAction.registeredBy.trim()) {
            setToast({ message: 'انتخاب ثبت‌کننده اقدام از لیست کاربران الزامی است', type: 'error' });
            setModalStep(1);
            return;
        }
        if (!currentAction.responsiblePerson || !currentAction.responsiblePerson.trim()) {
            setToast({ message: 'انتخاب مسئول اجرا از لیست کاربران الزامی است', type: 'error' });
            setModalStep(2);
            return;
        }

        try {
            const isDone = Boolean(currentAction.isCompleted);
            const todayJalali = getCurrentJalaliDate();
            
            // 1. Registration date & time
            const regDateJalali = currentAction.registrationDate || todayJalali;
            const regTime = currentAction.registrationTime || getCurrentTimeStr();
            
            // 2. CONVERT ALL DATES TO GREGORIAN BEFORE SENDING TO API (use null instead of empty string for MySQL DATE columns)
            const gregorianRegDate = regDateJalali ? (toGregorian(regDateJalali) || null) : null;
            const gregorianDueDate = (currentAction.dueDate && currentAction.dueDate.trim()) 
                ? (toGregorian(currentAction.dueDate) || null) 
                : null;
            const gregorianExecDate = (currentAction.executionDate && currentAction.executionDate.trim())
                ? (toGregorian(currentAction.executionDate) || null) 
                : (isDone ? (toGregorian(todayJalali) || null) : null);

            // 3. MySQL DATETIME (YYYY-MM-DD HH:mm:ss) in Gregorian
            const validCreatedAt = formatToMySqlDateTime(gregorianRegDate || todayJalali, regTime);
            const validExecutedAt = (isDone && gregorianExecDate) 
                ? formatToMySqlDateTime(gregorianExecDate, getCurrentTimeStr()) 
                : null;

            const apiPayload: Partial<CorrectiveAction> = {
                ...currentAction,
                createdAt: validCreatedAt || null, // Gregorian DATETIME "YYYY-MM-DD HH:mm:ss"
                registrationDate: gregorianRegDate || null, // Gregorian Date "YYYY-MM-DD"
                registrationTime: regTime || null,
                dueDate: gregorianDueDate || null, // Gregorian Date "YYYY-MM-DD" or null
                executionDate: gregorianExecDate || null, // Gregorian Date "YYYY-MM-DD" or null
                executedAt: validExecutedAt || null, // Gregorian DATETIME or null
                isCompleted: isDone,
                status: isDone ? 'COMPLETED' : (currentAction.status || 'IN_PROGRESS'),
                priority: currentAction.priority || 'MEDIUM',
                department: currentAction.department || 'عمومی',
            };

            if (currentAction.id) {
                await correctiveActionsService.update(apiPayload as CorrectiveAction);
                setToast({ message: 'اقدام اصلاحی با موفقیت ویرایش شد', type: 'success' });
            } else {
                await correctiveActionsService.create(apiPayload);
                setToast({ message: 'اقدام اصلاحی جدید با موفقیت ثبت شد', type: 'success' });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            setToast({ message: 'خطا در ذخیره اطلاعات اقدام اصلاحی', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('آیا از حذف این اقدام اصلاحی اطمینان دارید؟')) {
            try {
                await correctiveActionsService.delete(id);
                setToast({ message: 'اقدام اصلاحی حذف شد', type: 'success' });
                if (selectedActionForDetail?.id === id) {
                    setIsDetailModalOpen(false);
                }
                fetchData();
            } catch (error) {
                setToast({ message: 'خطا در حذف اقدام اصلاحی', type: 'error' });
            }
        }
    };

    // Quick toggle completion status with execution date stamping
    const handleQuickComplete = async (action: CorrectiveAction) => {
        try {
            const nextCompleted = !action.isCompleted;
            const todayJalali = getCurrentJalaliDate();
            const todayGregorian = toGregorian(todayJalali);

            // Convert all dates to Gregorian before sending
            const parsedCreated = parseCreatedAt(action.createdAt);
            const regDateSource = action.registrationDate || parsedCreated.jalaliDate;
            const gregorianRegDate = toGregorian(regDateSource);
            const regTime = action.registrationTime || parsedCreated.time;
            const validCreatedAt = formatToMySqlDateTime(gregorianRegDate, regTime);

            const gregorianDueDate = (action.dueDate && action.dueDate.trim()) 
                ? (toGregorian(action.dueDate) || null) 
                : null;
            const gregorianExecDate = nextCompleted 
                ? ((action.executionDate && action.executionDate.trim()) ? (toGregorian(action.executionDate) || todayGregorian) : todayGregorian) 
                : null;
            const validExecutedAt = (nextCompleted && gregorianExecDate) 
                ? formatToMySqlDateTime(gregorianExecDate, getCurrentTimeStr()) 
                : null;

            const updated: CorrectiveAction = {
                ...action,
                createdAt: validCreatedAt || null,
                registrationDate: gregorianRegDate || null,
                registrationTime: regTime || null,
                dueDate: gregorianDueDate || null,
                executionDate: gregorianExecDate || null,
                executedAt: validExecutedAt || null,
                isCompleted: nextCompleted,
                status: nextCompleted ? 'COMPLETED' : 'IN_PROGRESS',
            };

            await correctiveActionsService.update(updated);
            setToast({ 
                message: nextCompleted ? 'اقدام اصلاحی به عنوان انجام شده علامت‌گذاری شد' : 'وضعیت به در حال انجام تغییر کرد', 
                type: 'success' 
            });
            fetchData();
        } catch (error) {
            setToast({ message: 'خطا در تغییر وضعیت اقدام اصلاحی', type: 'error' });
        }
    };

    // Helper: Convert string date to Date object at midnight
    const getGregorianDateObj = (dateStr?: string | null): Date | null => {
        if (!dateStr || !dateStr.trim()) return null;
        try {
            const gregStr = dateStr.includes('/') ? toGregorian(dateStr) : dateStr;
            const clean = (gregStr || '').replace('T', ' ').split(' ')[0].trim();
            if (!clean) return null;
            const d = new Date(clean);
            if (isNaN(d.getTime())) return null;
            d.setHours(0, 0, 0, 0);
            return d;
        } catch {
            return null;
        }
    };

    // Helper: Calculate days diff between target date and today
    const getDaysDiffFromToday = (targetDateStr?: string | null): number | null => {
        const targetDate = getGregorianDateObj(targetDateStr);
        if (!targetDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = targetDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Helper: Extract registration date as Date object
    const getActionRegDateObj = (action: CorrectiveAction): Date | null => {
        if (action.registrationDate) {
            const d = getGregorianDateObj(action.registrationDate);
            if (d) return d;
        }
        const parsed = parseCreatedAt(action.createdAt);
        if (parsed.jalaliDate) {
            return getGregorianDateObj(parsed.jalaliDate);
        }
        return null;
    };

    // Helper: Check if action is overdue
    const isActionOverdue = (action: CorrectiveAction): boolean => {
        if (action.isCompleted) return false;
        if (!action.dueDate) return false;
        try {
            const dueGregorian = action.dueDate.includes('/') ? toGregorian(action.dueDate) : action.dueDate;
            const dueDate = new Date(dueGregorian);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return dueDate < now;
        } catch (e) {
            return false;
        }
    };

    // Helper: Calculate remaining days
    const getDeadlineInfo = (dueDateStr?: string, isDone?: boolean, executionDateStr?: string) => {
        if (!dueDateStr) return { text: 'بدون مهلت مشخص', color: 'text-slate-400', isOverdue: false };
        try {
            const dueG = dueDateStr.includes('/') ? toGregorian(dueDateStr) : dueDateStr;
            const dueDate = new Date(dueG);
            dueDate.setHours(0, 0, 0, 0);

            if (isDone) {
                if (executionDateStr) {
                    const execG = executionDateStr.includes('/') ? toGregorian(executionDateStr) : executionDateStr;
                    const execDate = new Date(execG);
                    execDate.setHours(0, 0, 0, 0);
                    const diffDays = Math.round((execDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 0) {
                        return { text: 'اجرا در موعد مقرر', color: 'text-emerald-600 dark:text-emerald-400', isOverdue: false };
                    } else {
                        return { text: `اجرا با ${diffDays} روز تاخیر`, color: 'text-amber-600 dark:text-amber-400', isOverdue: true };
                    }
                }
                return { text: 'تکمیل و اجرا شده', color: 'text-emerald-600 dark:text-emerald-400', isOverdue: false };
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                return { text: `${Math.abs(diffDays)} روز تاخیر از مهلت`, color: 'text-rose-600 dark:text-rose-400 font-bold', isOverdue: true };
            } else if (diffDays === 0) {
                return { text: 'امروز آخرین مهلت اجرا است', color: 'text-amber-600 dark:text-amber-400 font-bold', isOverdue: false };
            } else if (diffDays <= 3) {
                return { text: `${diffDays} روز تا پایان مهلت`, color: 'text-amber-600 dark:text-amber-400 font-bold', isOverdue: false };
            } else {
                return { text: `${diffDays} روز باقیمانده`, color: 'text-slate-500 dark:text-slate-400', isOverdue: false };
            }
        } catch (e) {
            return { text: toJalali(dueDateStr), color: 'text-slate-500', isOverdue: false };
        }
    };

    // Admin & Role detection
    const isUserAdmin = useMemo(() => {
        if (!currentUserProfile) return false;
        return (
            currentUserProfile.isAdmin === 1 ||
            currentUserProfile.permission_level === 1 ||
            currentUserProfile.role === 'ADMIN' ||
            currentUserProfile.username === 'admin'
        );
    }, [currentUserProfile]);

    // Effective scope: non-admins are ALWAYS restricted to 'MY_ACTIONS'
    const effectiveScope = isUserAdmin ? scopeFilter : 'MY_ACTIONS';

    const normalizeStr = (s?: string | null) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

    const getUserIdentifiers = (profile: any): string[] => {
        if (!profile) return [];
        const list: string[] = [];
        if (profile.full_name) list.push(normalizeStr(profile.full_name));
        if (profile.fullName) list.push(normalizeStr(profile.fullName));
        if (profile.username) list.push(normalizeStr(profile.username));
        if (profile.name) list.push(normalizeStr(profile.name));
        return Array.from(new Set(list.filter(Boolean)));
    };

    const checkNameMatch = (nameInAction?: string | null, userIdentifiers: string[] = []): boolean => {
        if (!nameInAction || userIdentifiers.length === 0) return false;
        const normalized = normalizeStr(nameInAction);
        if (!normalized) return false;
        return userIdentifiers.some(u => 
            normalized === u || 
            normalized.includes(u) || 
            u.includes(normalized)
        );
    };

    const getUserRelationToAction = (action: CorrectiveAction, profile: any) => {
        const userIds = getUserIdentifiers(profile);
        const isResponsible = checkNameMatch(action.responsiblePerson, userIds);
        const isVerifier = checkNameMatch(action.verifierPerson, userIds);
        const isRegistrar = checkNameMatch(action.registeredBy, userIds);
        const isRelated = isResponsible || isVerifier || isRegistrar;

        return { isRelated, isResponsible, isVerifier, isRegistrar };
    };

    const myActionsList = useMemo(() => {
        return actions.filter(action => getUserRelationToAction(action, currentUserProfile).isRelated);
    }, [actions, currentUserProfile]);

    const myResponsibleCount = useMemo(() => {
        return actions.filter(action => getUserRelationToAction(action, currentUserProfile).isResponsible).length;
    }, [actions, currentUserProfile]);

    const myVerifierCount = useMemo(() => {
        return actions.filter(action => getUserRelationToAction(action, currentUserProfile).isVerifier).length;
    }, [actions, currentUserProfile]);

    const myRegistrarCount = useMemo(() => {
        return actions.filter(action => getUserRelationToAction(action, currentUserProfile).isRegistrar).length;
    }, [actions, currentUserProfile]);

    // Unique lists for User Filters
    const uniqueResponsiblePersons = useMemo(() => {
        const list: string[] = [];
        actions.forEach(a => {
            if (a.responsiblePerson && a.responsiblePerson.trim()) list.push(a.responsiblePerson.trim());
        });
        staffUsers.forEach(u => {
            if (u.fullName && u.fullName.trim()) list.push(u.fullName.trim());
            else if (u.username && u.username.trim()) list.push(u.username.trim());
        });
        return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'fa'));
    }, [actions, staffUsers]);

    const uniqueRegistrars = useMemo(() => {
        const list: string[] = [];
        actions.forEach(a => {
            if (a.registeredBy && a.registeredBy.trim()) list.push(a.registeredBy.trim());
        });
        staffUsers.forEach(u => {
            if (u.fullName && u.fullName.trim()) list.push(u.fullName.trim());
            else if (u.username && u.username.trim()) list.push(u.username.trim());
        });
        return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'fa'));
    }, [actions, staffUsers]);

    const uniqueVerifiers = useMemo(() => {
        const list: string[] = [];
        actions.forEach(a => {
            if (a.verifierPerson && a.verifierPerson.trim()) list.push(a.verifierPerson.trim());
        });
        staffUsers.forEach(u => {
            if (u.fullName && u.fullName.trim()) list.push(u.fullName.trim());
            else if (u.username && u.username.trim()) list.push(u.username.trim());
        });
        return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'fa'));
    }, [actions, staffUsers]);

    const scopedActions = useMemo(() => {
        if (effectiveScope === 'MY_ACTIONS') {
            return actions.filter(action => {
                const rel = getUserRelationToAction(action, currentUserProfile);
                if (!rel.isRelated) return false;
                if (myRoleFilter === 'RESPONSIBLE' && !rel.isResponsible) return false;
                if (myRoleFilter === 'VERIFIER' && !rel.isVerifier) return false;
                if (myRoleFilter === 'REGISTERED_BY' && !rel.isRegistrar) return false;
                return true;
            });
        }
        return actions;
    }, [actions, effectiveScope, currentUserProfile, myRoleFilter]);

    const canDeleteAction = (action: CorrectiveAction) => {
        if (isUserAdmin) return true;
        const rel = getUserRelationToAction(action, currentUserProfile);
        return rel.isRegistrar;
    };

    // Filtered and Sorted actions
    const filteredActions = useMemo(() => {
        const filtered = scopedActions.filter(action => {
            // Quick Status Tab filter
            if (filterTab === 'IN_PROGRESS' && action.isCompleted) return false;
            if (filterTab === 'COMPLETED' && !action.isCompleted) return false;
            if (filterTab === 'OVERDUE' && !isActionOverdue(action)) return false;
            if (filterTab === 'CRITICAL' && action.priority !== 'CRITICAL' && action.priority !== 'HIGH') return false;

            // Department filter
            if (selectedDeptFilter !== 'ALL' && action.department !== selectedDeptFilter) return false;

            // Priority filter
            if (selectedPriorityFilter !== 'ALL' && action.priority !== selectedPriorityFilter) return false;

            // Due Date Filter (مهلت اجرا)
            if (selectedDueDateFilter === 'OVERDUE') {
                if (action.isCompleted) return false;
                const diff = getDaysDiffFromToday(action.dueDate);
                if (diff === null || diff >= 0) return false;
            } else if (selectedDueDateFilter === 'DUE_TODAY') {
                if (action.isCompleted) return false;
                const diff = getDaysDiffFromToday(action.dueDate);
                if (diff !== 0) return false;
            } else if (selectedDueDateFilter === 'DUE_3_DAYS') {
                if (action.isCompleted) return false;
                const diff = getDaysDiffFromToday(action.dueDate);
                if (diff === null || diff < 0 || diff > 3) return false;
            } else if (selectedDueDateFilter === 'DUE_7_DAYS') {
                if (action.isCompleted) return false;
                const diff = getDaysDiffFromToday(action.dueDate);
                if (diff === null || diff < 0 || diff > 7) return false;
            } else if (selectedDueDateFilter === 'DUE_30_DAYS') {
                if (action.isCompleted) return false;
                const diff = getDaysDiffFromToday(action.dueDate);
                if (diff === null || diff < 0 || diff > 30) return false;
            } else if (selectedDueDateFilter === 'HAS_DUE_DATE') {
                if (!action.dueDate || !action.dueDate.trim()) return false;
            } else if (selectedDueDateFilter === 'NO_DUE_DATE') {
                if (action.dueDate && action.dueDate.trim()) return false;
            }

            // Registration Date Filter (زمان ثبت)
            if (selectedRegDateFilter === 'TODAY') {
                const regDate = getActionRegDateObj(action);
                if (!regDate) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (regDate.getTime() !== today.getTime()) return false;
            } else if (selectedRegDateFilter === 'LAST_7_DAYS') {
                const regDate = getActionRegDateObj(action);
                if (!regDate) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((today.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays < 0 || diffDays > 7) return false;
            } else if (selectedRegDateFilter === 'LAST_30_DAYS') {
                const regDate = getActionRegDateObj(action);
                if (!regDate) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((today.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays < 0 || diffDays > 30) return false;
            }

            // Execution Date & Status Filter (تاریخ اجرا و وضعیت انجام)
            if (selectedExecDateFilter === 'EXECUTED') {
                if (!action.isCompleted && (!action.executionDate || !action.executionDate.trim())) return false;
            } else if (selectedExecDateFilter === 'NOT_EXECUTED') {
                if (action.isCompleted || (action.executionDate && action.executionDate.trim())) return false;
            } else if (selectedExecDateFilter === 'ON_TIME') {
                if (!action.isCompleted && !action.executionDate) return false;
                const info = getDeadlineInfo(action.dueDate, true, action.executionDate);
                if (info.isOverdue) return false;
            } else if (selectedExecDateFilter === 'LATE') {
                if (!action.isCompleted && !action.executionDate) return false;
                const info = getDeadlineInfo(action.dueDate, true, action.executionDate);
                if (!info.isOverdue) return false;
            }

            // User Filters (مسئول اجرا، ثبت‌کننده، مسئول تایید و پایش)
            if (selectedResponsibleFilter !== 'ALL') {
                if (normalizeStr(action.responsiblePerson) !== normalizeStr(selectedResponsibleFilter)) return false;
            }
            if (selectedRegistrarFilter !== 'ALL') {
                if (normalizeStr(action.registeredBy) !== normalizeStr(selectedRegistrarFilter)) return false;
            }
            if (selectedVerifierFilter !== 'ALL') {
                if (normalizeStr(action.verifierPerson) !== normalizeStr(selectedVerifierFilter)) return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = (action.title || '').toLowerCase().includes(q);
                const matchDesc = (action.description || '').toLowerCase().includes(q);
                const matchResp = (action.responsiblePerson || '').toLowerCase().includes(q);
                const matchDept = (action.department || '').toLowerCase().includes(q);
                const matchRoot = (action.rootCause || '').toLowerCase().includes(q);
                const matchReg = (action.registeredBy || '').toLowerCase().includes(q);
                const matchVerif = (action.verifierPerson || '').toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchResp && !matchDept && !matchRoot && !matchReg && !matchVerif) {
                    return false;
                }
            }

            return true;
        });

        // Sorting
        return filtered.sort((a, b) => {
            if (sortBy === 'SMART_URGENCY') {
                // 1. Uncompleted items always come before completed items
                if (a.isCompleted !== b.isCompleted) {
                    return a.isCompleted ? 1 : -1;
                }

                // Both uncompleted: rank by deadline urgency & proximity
                if (!a.isCompleted && !b.isCompleted) {
                    const diffA = getDaysDiffFromToday(a.dueDate);
                    const diffB = getDaysDiffFromToday(b.dueDate);

                    // If both have due dates
                    if (diffA !== null && diffB !== null) {
                        // Nearest deadline (or overdue) comes first
                        if (diffA !== diffB) return diffA - diffB;
                    } else if (diffA !== null && diffB === null) {
                        return -1; // Item with due date comes first
                    } else if (diffA === null && diffB !== null) {
                        return 1; // Item without due date comes later
                    }

                    // If same due date or no due dates, sort by priority
                    const priorityWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                    const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
                    if (pDiff !== 0) return pDiff;

                    // Then by registration date (newest first)
                    const regA = getActionRegDateObj(a)?.getTime() || 0;
                    const regB = getActionRegDateObj(b)?.getTime() || 0;
                    return regB - regA;
                }

                // Both completed: newest execution/registration first
                const execA = getGregorianDateObj(a.executionDate)?.getTime() || getActionRegDateObj(a)?.getTime() || 0;
                const execB = getGregorianDateObj(b.executionDate)?.getTime() || getActionRegDateObj(b)?.getTime() || 0;
                return execB - execA;
            }

            if (sortBy === 'DUE_DATE_ASC') {
                const dueA = getGregorianDateObj(a.dueDate)?.getTime() ?? 9999999999999;
                const dueB = getGregorianDateObj(b.dueDate)?.getTime() ?? 9999999999999;
                return dueA - dueB;
            }
            if (sortBy === 'DUE_DATE_DESC') {
                const dueA = getGregorianDateObj(a.dueDate)?.getTime() ?? 0;
                const dueB = getGregorianDateObj(b.dueDate)?.getTime() ?? 0;
                return dueB - dueA;
            }
            if (sortBy === 'REG_DATE_DESC') {
                const timeA = getActionRegDateObj(a)?.getTime() || 0;
                const timeB = getActionRegDateObj(b)?.getTime() || 0;
                return timeB - timeA;
            }
            if (sortBy === 'REG_DATE_ASC') {
                const timeA = getActionRegDateObj(a)?.getTime() || 0;
                const timeB = getActionRegDateObj(b)?.getTime() || 0;
                return timeA - timeB;
            }
            if (sortBy === 'EXEC_DATE_DESC') {
                const execA = getGregorianDateObj(a.executionDate)?.getTime() ?? 0;
                const execB = getGregorianDateObj(b.executionDate)?.getTime() ?? 0;
                return execB - execA;
            }
            if (sortBy === 'EXEC_DATE_ASC') {
                const execA = getGregorianDateObj(a.executionDate)?.getTime() ?? 9999999999999;
                const execB = getGregorianDateObj(b.executionDate)?.getTime() ?? 9999999999999;
                return execA - execB;
            }
            if (sortBy === 'PRIORITY_DESC') {
                const priorityWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
            }
            if (sortBy === 'TITLE_ASC') {
                return (a.title || '').localeCompare(b.title || '', 'fa');
            }

            return 0;
        });
    }, [
        scopedActions, 
        filterTab, 
        selectedDeptFilter, 
        selectedPriorityFilter, 
        selectedDueDateFilter, 
        selectedRegDateFilter, 
        selectedExecDateFilter, 
        selectedResponsibleFilter, 
        selectedRegistrarFilter, 
        selectedVerifierFilter, 
        searchQuery, 
        sortBy
    ]);

    // Urgent and approaching deadline count (uncompleted with deadline <= 3 days)
    const urgentApproachingActions = useMemo(() => {
        return scopedActions.filter(a => {
            if (a.isCompleted) return false;
            const diff = getDaysDiffFromToday(a.dueDate);
            return diff !== null && diff <= 3;
        });
    }, [scopedActions]);

    // Active filter counts for badge
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedDeptFilter !== 'ALL') count++;
        if (selectedPriorityFilter !== 'ALL') count++;
        if (selectedDueDateFilter !== 'ALL') count++;
        if (selectedRegDateFilter !== 'ALL') count++;
        if (selectedExecDateFilter !== 'ALL') count++;
        if (selectedResponsibleFilter !== 'ALL') count++;
        if (selectedRegistrarFilter !== 'ALL') count++;
        if (selectedVerifierFilter !== 'ALL') count++;
        if (searchQuery.trim()) count++;
        return count;
    }, [
        selectedDeptFilter, 
        selectedPriorityFilter, 
        selectedDueDateFilter, 
        selectedRegDateFilter, 
        selectedExecDateFilter, 
        selectedResponsibleFilter, 
        selectedRegistrarFilter, 
        selectedVerifierFilter, 
        searchQuery
    ]);

    const handleResetAllFilters = () => {
        setSelectedDeptFilter('ALL');
        setSelectedPriorityFilter('ALL');
        setSelectedDueDateFilter('ALL');
        setSelectedRegDateFilter('ALL');
        setSelectedExecDateFilter('ALL');
        setSelectedResponsibleFilter('ALL');
        setSelectedRegistrarFilter('ALL');
        setSelectedVerifierFilter('ALL');
        setSearchQuery('');
        setFilterTab('ALL');
        setSortBy('SMART_URGENCY');
    };

    // Statistics metrics
    const stats = useMemo(() => {
        const total = scopedActions.length;
        const inProgress = scopedActions.filter(a => !a.isCompleted).length;
        const completed = scopedActions.filter(a => a.isCompleted).length;
        const overdue = scopedActions.filter(isActionOverdue).length;
        const critical = scopedActions.filter(a => (a.priority === 'CRITICAL' || a.priority === 'HIGH') && !a.isCompleted).length;
        const onTimeRate = completed > 0 ? Math.round((completed / (completed + overdue)) * 100) : 100;

        return { total, inProgress, completed, overdue, critical, onTimeRate };
    }, [scopedActions]);

    const handleCopyActionText = (action: CorrectiveAction) => {
        const parsedCreated = parseCreatedAt(action.createdAt);
        const regDateStr = action.registrationDate ? toJalali(action.registrationDate) : (parsedCreated.jalaliDate || '-');
        const regTimeStr = action.registrationTime || parsedCreated.time;
        const text = `📋 شناسنامه اقدام اصلاحی (CAPA)
━━━━━━━━━━━━━━━━━━━━
📌 عنوان: ${action.title}
🏢 واحد مرتبط: ${action.department || 'نامشخص'} | اولویت: ${PRIORITIES.find(p => p.key === action.priority)?.label || 'عادی'}
👤 مسئول اجرا: ${action.responsiblePerson} | ثبت‌کننده: ${action.registeredBy || '-'}
━━━━━━━━━━━━━━━━━━━━
🕒 زمان ثبت اقدام اصلاحی: ${regDateStr} ${regTimeStr ? `(ساعت ${regTimeStr})` : ''}
⏳ مهلت اجرا: ${toJalali(action.dueDate) || 'نامشخص'}
✅ تاریخ اجرا: ${action.executionDate ? toJalali(action.executionDate) : (action.isCompleted ? 'انجام شده' : 'هنوز اجرا نشده')}
━━━━━━━━━━━━━━━━━━━━
🔍 شرح عدم انطباق: ${action.description || '-'}
💡 علت ریشه‌ای: ${action.rootCause || '-'}
🛠 برنامه و اقدام اصلاحی: ${action.actionPlan || '-'}
📊 وضعیت: ${action.isCompleted ? 'انجام شده و تکمیل' : 'در جریان پیگیری'}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setToast({ message: 'گزارش کامل اقدام اصلاحی با موفقیت کپی شد', type: 'success' });
        }
    };

    // Selection helpers
    const isActionSelected = (id: number) => selectedActionIds.includes(id);

    const toggleSelectAction = (id: number) => {
        setSelectedActionIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const isAllFilteredSelected = filteredActions.length > 0 && filteredActions.every(a => selectedActionIds.includes(a.id));
    const isSomeFilteredSelected = filteredActions.some(a => selectedActionIds.includes(a.id)) && !isAllFilteredSelected;

    const toggleSelectAllFiltered = () => {
        if (isAllFilteredSelected) {
            const filteredIds = new Set(filteredActions.map(a => a.id));
            setSelectedActionIds(prev => prev.filter(id => !filteredIds.has(id)));
        } else {
            const newSelected = new Set([...selectedActionIds, ...filteredActions.map(a => a.id)]);
            setSelectedActionIds(Array.from(newSelected));
        }
    };

    const clearSelection = () => {
        setSelectedActionIds([]);
    };

    const openBulkEditModal = () => {
        if (selectedActionIds.length === 0) {
            setToast({ message: 'لطفاً حداقل یک اقدام اصلاحی را برای ویرایش دسته‌جمعی انتخاب کنید', type: 'error' });
            return;
        }
        setBulkRegisteredBy('__NO_CHANGE__');
        setBulkResponsiblePerson('__NO_CHANGE__');
        setBulkVerifierPerson('__NO_CHANGE__');
        setIsBulkEditModalOpen(true);
    };

    const handleBulkSave = async () => {
        if (
            bulkRegisteredBy === '__NO_CHANGE__' &&
            bulkResponsiblePerson === '__NO_CHANGE__' &&
            bulkVerifierPerson === '__NO_CHANGE__'
        ) {
            setToast({ message: 'حداقل یکی از فیلدها (ثبت‌کننده، مسئول اجرا یا مسئول تایید) را جهت تغییر مشخص نمایید', type: 'error' });
            return;
        }

        setBulkLoading(true);
        try {
            const selectedActionsList = actions.filter(a => selectedActionIds.includes(a.id));
            let successCount = 0;

            for (const action of selectedActionsList) {
                const parsedCreated = parseCreatedAt(action.createdAt);
                const regDateSource = action.registrationDate || parsedCreated.jalaliDate;
                const gregorianRegDate = regDateSource ? (toGregorian(regDateSource) || null) : null;
                const regTime = action.registrationTime || parsedCreated.time;
                const validCreatedAt = formatToMySqlDateTime(gregorianRegDate || undefined, regTime);

                const gregorianDueDate = (action.dueDate && action.dueDate.trim())
                    ? (toGregorian(action.dueDate) || null)
                    : null;
                const gregorianExecDate = (action.executionDate && action.executionDate.trim())
                    ? (toGregorian(action.executionDate) || null)
                    : (action.isCompleted ? (toGregorian(getCurrentJalaliDate()) || null) : null);
                const validExecutedAt = (action.isCompleted && gregorianExecDate)
                    ? formatToMySqlDateTime(gregorianExecDate, getCurrentTimeStr())
                    : null;

                const nextRegisteredBy = bulkRegisteredBy !== '__NO_CHANGE__' ? bulkRegisteredBy : (action.registeredBy || '');
                const nextResponsiblePerson = bulkResponsiblePerson !== '__NO_CHANGE__' ? bulkResponsiblePerson : (action.responsiblePerson || '');
                let nextVerifierPerson = action.verifierPerson;
                if (bulkVerifierPerson === '__CLEAR__') {
                    nextVerifierPerson = '';
                } else if (bulkVerifierPerson !== '__NO_CHANGE__') {
                    nextVerifierPerson = bulkVerifierPerson;
                }

                const updatedAction: CorrectiveAction = {
                    ...action,
                    createdAt: validCreatedAt || null,
                    registrationDate: gregorianRegDate || null,
                    registrationTime: regTime || null,
                    dueDate: gregorianDueDate || null,
                    executionDate: gregorianExecDate || null,
                    executedAt: validExecutedAt || null,
                    registeredBy: nextRegisteredBy,
                    responsiblePerson: nextResponsiblePerson,
                    verifierPerson: nextVerifierPerson,
                };

                await correctiveActionsService.update(updatedAction);
                successCount++;
            }

            setToast({
                message: `اطلاعات ${successCount.toLocaleString('fa-IR')} اقدام اصلاحی با موفقیت بروزرسانی شد`,
                type: 'success'
            });
            setIsBulkEditModalOpen(false);
            setSelectedActionIds([]);
            fetchData();
        } catch (error) {
            setToast({ message: 'خطا در اعمال تغییرات دسته‌جمعی', type: 'error' });
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/80 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 shadow-xs">
                        <ClipboardCheckIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">سامانه مدیریت اقدامات اصلاحی (CAPA)</h2>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                نسخه جامع با سیستم گزارش‌گیری
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            شناسایی عدم انطباق‌ها، ریشه‌یابی، تعریف برنامه اصلاحی، پایش زمان‌بندی و مرکز گزارش‌گیری تحلیلی
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                        onClick={openCreateModal} 
                        className="flex-1 md:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                    >
                        <PlusIcon /> <span>تعریف اقدام اصلاحی جدید</span>
                    </button>
                </div>
            </div>

            {/* View Mode Navigation Switcher Tabs */}
            <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1.5 border border-slate-200 dark:border-slate-700">
                <button
                    type="button"
                    onClick={() => setActiveViewTab('LIST')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                        activeViewTab === 'LIST'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-800'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <ClipboardCheckIcon className="w-4 h-4" />
                    <span>لیست و مدیریت اقدامات اصلاحی</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                        {stats.total}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveViewTab('REPORTS')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                        activeViewTab === 'REPORTS'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-800'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    <span>داشبورد و مرکز گزارش‌گیری جامع (CAPA Reports & Analytics)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                        اکسل و پرینت
                    </span>
                </button>
            </div>

            {/* Scope Selection / Role Context Bar */}
            {isUserAdmin ? (
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                setScopeFilter('ALL_ACTIONS');
                                setMyRoleFilter('ALL');
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-2 ${
                                scopeFilter === 'ALL_ACTIONS'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Building2 className="w-4 h-4" />
                            <span>همه اقدامات اصلاحی (کل سازمان)</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                scopeFilter === 'ALL_ACTIONS' ? 'bg-indigo-700/90 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                                {actions.length.toLocaleString('fa-IR')}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setScopeFilter('MY_ACTIONS')}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-2 ${
                                scopeFilter === 'MY_ACTIONS'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <UserCheck className="w-4 h-4" />
                            <span>اقدامات اصلاحی من</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                scopeFilter === 'MY_ACTIONS' ? 'bg-indigo-700/90 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                                {myActionsList.length.toLocaleString('fa-IR')}
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 px-2 text-xs text-slate-500 dark:text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-bold text-[11px]">
                            دسترسی مدیر ارشد: مشاهده کل اقدامات سازمانی یا تفکیک وظایف شخصی
                        </span>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/50 to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-sm text-slate-800 dark:text-white">بخش اقدامات اصلاحی من</h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                                    {myActionsList.length.toLocaleString('fa-IR')} وظیفه مرتبط
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                نمایش وظایف و اقدامات اصلاحی مرتبط با حساب کاربری شما ({currentUserProfile?.full_name || currentUserProfile?.fullName || currentUserProfile?.username || 'کاربر جاری'}) به عنوان مسئول اجرا، مسئول تایید یا ثبت‌کننده.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Filter Chips when in MY_ACTIONS */}
            {effectiveScope === 'MY_ACTIONS' && (
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5" /> فیلتر نقش من:
                    </span>
                    <button
                        type="button"
                        onClick={() => setMyRoleFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            myRoleFilter === 'ALL'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                        }`}
                    >
                        <span>همه نقش‌های من</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            myRoleFilter === 'ALL' ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                            {myActionsList.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMyRoleFilter('RESPONSIBLE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            myRoleFilter === 'RESPONSIBLE'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                        }`}
                    >
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>مسئول اجرا / پیگیری</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            myRoleFilter === 'RESPONSIBLE' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}>
                            {myResponsibleCount}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMyRoleFilter('VERIFIER')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            myRoleFilter === 'VERIFIER'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                        }`}
                    >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>مسئول تایید و پایش</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            myRoleFilter === 'VERIFIER' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        }`}>
                            {myVerifierCount}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMyRoleFilter('REGISTERED_BY')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            myRoleFilter === 'REGISTERED_BY'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span>ثبت‌شده توسط من</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            myRoleFilter === 'REGISTERED_BY' ? 'bg-sky-700 text-white' : 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                        }`}>
                            {myRegistrarCount}
                        </span>
                    </button>
                </div>
            )}

            {/* TAB CONTENT */}
            {activeViewTab === 'REPORTS' ? (
                <CorrectiveActionsAnalyticsView
                    actions={scopedActions}
                    onOpenCreateModal={openCreateModal}
                    onViewDetail={openDetailModal}
                    onSetToast={setToast}
                />
            ) : (
                <>
                    {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">کل اقدامات</span>
                        <span className="text-2xl font-black font-mono text-slate-800 dark:text-white mt-1 block">
                            {stats.total.toLocaleString('fa-IR')}
                        </span>
                    </div>
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-sky-200 dark:border-sky-900/60 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 block">در جریان پیگیری</span>
                        <span className="text-2xl font-black font-mono text-sky-700 dark:text-sky-300 mt-1 block">
                            {stats.inProgress.toLocaleString('fa-IR')}
                        </span>
                    </div>
                    <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 rounded-xl text-sky-600 dark:text-sky-400">
                        <Activity className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">تکمیل و اجرا شده</span>
                        <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1 block">
                            {stats.completed.toLocaleString('fa-IR')}
                        </span>
                    </div>
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block">مهلت گذشته (تاخیر)</span>
                        <span className="text-2xl font-black font-mono text-rose-700 dark:text-rose-300 mt-1 block">
                            {stats.overdue.toLocaleString('fa-IR')}
                        </span>
                    </div>
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">اولویت بحرانی / بالا</span>
                        <span className="text-2xl font-black font-mono text-amber-700 dark:text-amber-300 mt-1 block">
                            {stats.critical.toLocaleString('fa-IR')}
                        </span>
                    </div>
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filters Bar, Sorting & Quick Tabs */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3">
                    {/* Status Tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1 overflow-x-auto shrink-0">
                        <button
                            type="button"
                            onClick={() => setFilterTab('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                filterTab === 'ALL'
                                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            همه ({stats.total})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab('IN_PROGRESS')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                filterTab === 'IN_PROGRESS'
                                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            در جریان ({stats.inProgress})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab('COMPLETED')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                filterTab === 'COMPLETED'
                                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            اجرا شده ({stats.completed})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab('OVERDUE')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                filterTab === 'OVERDUE'
                                    ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            دارای تاخیر ({stats.overdue})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab('CRITICAL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                filterTab === 'CRITICAL'
                                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            فوری و بحرانی
                        </button>
                    </div>

                    {/* Sorting & Search Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 xl:justify-end">
                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">مرتب‌سازی:</span>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as CorrectiveActionSortOption)}
                                className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer pr-1"
                            >
                                <option value="SMART_URGENCY" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold">
                                    ⚡ هوشمند (موعد نزدیک و انجام‌نشده در ابتدا)
                                </option>
                                <option value="DUE_DATE_ASC" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                                    ⏳ مهلت اجرا (نزدیک‌ترین به دورترین)
                                </option>
                                <option value="DUE_DATE_DESC" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                                    ⏳ مهلت اجرا (دورترین به نزدیک‌ترین)
                                </option>
                                <option value="REG_DATE_DESC" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                                    📅 زمان ثبت (جدیدترین به قدیمی‌ترین)
                                </option>
                                <option value="REG_DATE_ASC" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                                    📅 زمان ثبت (قدیمی‌ترین به جدیدترین)
                                </option>
                                <option value="EXEC_DATE_DESC" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                                    ✅ تاریخ اجرا (جدیدترین به قدیمی‌ترین)
                                </option>
                                <option value="EXEC_DATE_ASC" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                                    ✅ تاریخ اجرا (قدیمی‌ترین به جدیدترین)
                                </option>
                                <option value="PRIORITY_DESC" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                                    🔥 اولویت (بحرانی و بالا به پایین)
                                </option>
                                <option value="TITLE_ASC" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                                    🔤 عنوان اقدام (الفبایی)
                                </option>
                            </select>
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="جستجو در عنوان، شرح، مسئول، دپارتمان یا ریشه مشکل..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Secondary Filters Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-500 font-bold flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5" /> فیلتر سریع:
                        </span>

                        <select
                            value={selectedDeptFilter}
                            onChange={e => setSelectedDeptFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium"
                        >
                            <option value="ALL">همه دپارتمان‌ها و واحدها</option>
                            {DEPARTMENTS.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>

                        <select
                            value={selectedPriorityFilter}
                            onChange={e => setSelectedPriorityFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium"
                        >
                            <option value="ALL">همه اولویت‌ها</option>
                            {PRIORITIES.map(p => (
                                <option key={p.key} value={p.key}>{p.label}</option>
                            ))}
                        </select>

                        {/* Toggle Advanced Filters Button */}
                        <button
                            type="button"
                            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border ${
                                isAdvancedFiltersOpen || activeFiltersCount > 0
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/80 dark:border-indigo-800 dark:text-indigo-300'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>فیلترهای زمانبندی و کاربران</span>
                            {activeFiltersCount > 0 && (
                                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                                    {activeFiltersCount}
                                </span>
                            )}
                            {isAdvancedFiltersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {(activeFiltersCount > 0 || filterTab !== 'ALL' || sortBy !== 'SMART_URGENCY') && (
                            <button
                                type="button"
                                onClick={handleResetAllFilters}
                                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-bold flex items-center gap-1 text-xs"
                            >
                                <RotateCcw className="w-3 h-3" /> بازنشانی همه
                            </button>
                        )}
                    </div>

                    {/* Bulk Selection Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleSelectAllFiltered}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border ${
                                isAllFilteredSelected
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={isAllFilteredSelected}
                                ref={el => {
                                    if (el) el.indeterminate = isSomeFilteredSelected;
                                }}
                                onChange={toggleSelectAllFiltered}
                                className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer pointer-events-none"
                            />
                            <span>{isAllFilteredSelected ? 'لغو انتخاب همه' : 'انتخاب همه موارد'}</span>
                        </button>

                        {selectedActionIds.length > 0 && (
                            <>
                                <button
                                    type="button"
                                    onClick={openBulkEditModal}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    <span>ویرایش گروهی ({selectedActionIds.length.toLocaleString('fa-IR')})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="px-2 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold transition"
                                >
                                    لغو
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Advanced Timing & User Filters Drawer / Panel */}
                {isAdvancedFiltersOpen && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60 p-4 rounded-xl space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span>فیلترهای تخصصی زمانبندی و تفکیک کاربران</span>
                            </h4>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                نتایج منطبق: <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-black">{filteredActions.length.toLocaleString('fa-IR')}</strong> اقدام
                            </span>
                        </div>

                        {/* SECTION 1: TIMING & DEADLINE FILTERS */}
                        <div>
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                <CalendarClock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>۱. فیلتر بر اساس زمانبندی‌ها و موعدها:</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Due Date Filter */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                                        ⏳ مهلت اجرا (Due Date)
                                    </label>
                                    <select
                                        value={selectedDueDateFilter}
                                        onChange={e => setSelectedDueDateFilter(e.target.value as DueDateFilterOption)}
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        <option value="ALL">همه مهلت‌ها</option>
                                        <option value="OVERDUE">🚨 دارای تاخیر و معوق (انجام‌نشده)</option>
                                        <option value="DUE_TODAY">⏰ امروز (آخرین مهلت)</option>
                                        <option value="DUE_3_DAYS">⚡ موعد نزدیک (تا ۳ روز آینده)</option>
                                        <option value="DUE_7_DAYS">📅 موعد در این هفته (تا ۷ روز)</option>
                                        <option value="DUE_30_DAYS">📆 موعد در این ماه (تا ۳۰ روز)</option>
                                        <option value="HAS_DUE_DATE">📌 دارای مهلت مشخص</option>
                                        <option value="NO_DUE_DATE">⚪ فاقد مهلت مشخص</option>
                                    </select>
                                </div>

                                {/* Registration Date Filter */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                                        📅 زمان ثبت اقدام اصلاحی
                                    </label>
                                    <select
                                        value={selectedRegDateFilter}
                                        onChange={e => setSelectedRegDateFilter(e.target.value as RegDateFilterOption)}
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        <option value="ALL">همه زمان‌های ثبت</option>
                                        <option value="TODAY">ثبت شده در امروز</option>
                                        <option value="LAST_7_DAYS">ثبت شده در ۷ روز اخیر</option>
                                        <option value="LAST_30_DAYS">ثبت شده در ۳۰ روز اخیر</option>
                                    </select>
                                </div>

                                {/* Execution Date & Status Filter */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                                        ✅ تاریخ و وضعیت اجرا
                                    </label>
                                    <select
                                        value={selectedExecDateFilter}
                                        onChange={e => setSelectedExecDateFilter(e.target.value as ExecDateFilterOption)}
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        <option value="ALL">همه وضعیت‌های اجرا</option>
                                        <option value="EXECUTED">✅ اجرا شده (دارای تاریخ اجرا)</option>
                                        <option value="NOT_EXECUTED">⏳ در انتظار اجرا (فاقد تاریخ اجرا)</option>
                                        <option value="ON_TIME">🟢 اجرا شده در موعد مقرر</option>
                                        <option value="LATE">🔴 اجرا شده با تاخیر</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: USER & STAKEHOLDER FILTERS */}
                        <div>
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>۲. فیلتر بر اساس کاربران و نقش‌ها:</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Responsible Person Filter */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                                        <User className="w-3 h-3 text-indigo-500" /> مسئول اجرا / پیگیری
                                    </label>
                                    <select
                                        value={selectedResponsibleFilter}
                                        onChange={e => setSelectedResponsibleFilter(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        <option value="ALL">همه مسئولین اجرا</option>
                                        {uniqueResponsiblePersons.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Registrar Filter */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                                        <FileText className="w-3 h-3 text-sky-500" /> ثبت‌کننده اقدام
                                    </label>
                                    <select
                                        value={selectedRegistrarFilter}
                                        onChange={e => setSelectedRegistrarFilter(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        <option value="ALL">همه ثبت‌کنندگان</option>
                                        {uniqueRegistrars.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Verifier Filter */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                                        <CheckCheck className="w-3 h-3 text-emerald-500" /> مسئول تایید و پایش
                                    </label>
                                    <select
                                        value={selectedVerifierFilter}
                                        onChange={e => setSelectedVerifierFilter(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        <option value="ALL">همه مسئولین تایید و پایش</option>
                                        {uniqueVerifiers.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Reset All in Advanced Panel */}
                        <div className="flex justify-end pt-1">
                            <button
                                type="button"
                                onClick={handleResetAllFilters}
                                className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> پاک کردن فیلترها و مرتب‌سازی پیش‌فرض
                            </button>
                        </div>
                    </div>
                )}

                {/* Active Filter Badges */}
                {activeFiltersCount > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                        <span className="text-[10px] font-bold text-slate-400">فیلترهای فعال:</span>

                        {selectedDeptFilter !== 'ALL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                                واحد: {selectedDeptFilter}
                                <button type="button" onClick={() => setSelectedDeptFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                            </span>
                        )}

                        {selectedPriorityFilter !== 'ALL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                                اولویت: {PRIORITIES.find(p => p.key === selectedPriorityFilter)?.label || selectedPriorityFilter}
                                <button type="button" onClick={() => setSelectedPriorityFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                            </span>
                        )}

                        {selectedDueDateFilter !== 'ALL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800">
                                ⏳ مهلت: {
                                    selectedDueDateFilter === 'OVERDUE' ? 'دارای تاخیر' :
                                    selectedDueDateFilter === 'DUE_TODAY' ? 'امروز' :
                                    selectedDueDateFilter === 'DUE_3_DAYS' ? 'تا ۳ روز آینده' :
                                    selectedDueDateFilter === 'DUE_7_DAYS' ? 'تا ۷ روز آینده' :
                                    selectedDueDateFilter === 'DUE_30_DAYS' ? 'تا ۳۰ روز آینده' :
                                    selectedDueDateFilter === 'HAS_DUE_DATE' ? 'دارای مهلت' : 'فاقد مهلت'
                                }
                                <button type="button" onClick={() => setSelectedDueDateFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                            </span>
                        )}

                        {selectedRegDateFilter !== 'ALL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800">
                                📅 ثبت: {
                                    selectedRegDateFilter === 'TODAY' ? 'امروز' :
                                    selectedRegDateFilter === 'LAST_7_DAYS' ? '۷ روز اخیر' : '۳۰ روز اخیر'
                                }
                                <button type="button" onClick={() => setSelectedRegDateFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                            </span>
                        )}

                        {selectedExecDateFilter !== 'ALL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800">
                                ✅ وضعیت اجرا: {
                                    selectedExecDateFilter === 'EXECUTED' ? 'اجرا شده' :
                                    selectedExecDateFilter === 'NOT_EXECUTED' ? 'در انتظار اجرا' :
                                    selectedExecDateFilter === 'ON_TIME' ? 'در موعد مقرر' : 'با تاخیر'
                                }
                                <button type="button" onClick={() => setSelectedExecDateFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                            </span>
                        )}

                        {selectedResponsibleFilter !== 'ALL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800">
                                👤 مسئول: {selectedResponsibleFilter}
                                <button type="button" onClick={() => setSelectedResponsibleFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                            </span>
                        )}

                        {selectedRegistrarFilter !== 'ALL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800">
                                📝 ثبت‌کننده: {selectedRegistrarFilter}
                                <button type="button" onClick={() => setSelectedRegistrarFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                            </span>
                        )}

                        {selectedVerifierFilter !== 'ALL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800">
                                🔍 مسئول تایید: {selectedVerifierFilter}
                                <button type="button" onClick={() => setSelectedVerifierFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                            </span>
                        )}

                        {searchQuery.trim() && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                                جستجو: "{searchQuery}"
                                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Approaching Deadline Quick Alert Banner */}
            {urgentApproachingActions.length > 0 && selectedDueDateFilter === 'ALL' && (
                <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                            <BellRing className="w-4 h-4 animate-bounce" />
                        </div>
                        <div>
                            <span className="font-black text-xs text-amber-900 dark:text-amber-200 block">
                                {urgentApproachingActions.length.toLocaleString('fa-IR')} اقدام اصلاحی موعد نزدیک یا معوق دارند و هنوز انجام نشده‌اند!
                            </span>
                            <span className="text-[11px] text-amber-700 dark:text-amber-400">
                                این اقدامات به دلیل نزدیک بودن مهلت اجرا، به صورت هوشمند در ابتدای لیست نمایش داده می‌شوند.
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelectedDueDateFilter('DUE_3_DAYS')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs whitespace-nowrap"
                    >
                        مشاهده اقدامات موعد نزدیک
                    </button>
                </div>
            )}

            {/* Bulk Selection Sticky Notification / Bar */}
            {selectedActionIds.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-4 rounded-2xl shadow-xl border border-indigo-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-700 flex items-center justify-center font-black font-mono text-sm text-indigo-100 border border-indigo-500 shadow-inner">
                            {selectedActionIds.length.toLocaleString('fa-IR')}
                        </div>
                        <div>
                            <span className="font-black text-xs block">
                                {selectedActionIds.length.toLocaleString('fa-IR')} اقدام اصلاحی انتخاب شده است
                            </span>
                            <span className="text-[11px] text-indigo-200">
                                امکان تغییر همزمان ثبت‌کننده، مسئول اجرا یا مسئول تایید برای موارد انتخابی
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={openBulkEditModal}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
                        >
                            <Users className="w-4 h-4 text-indigo-600" />
                            <span>ویرایش گروهی مسئولین و ثبت‌کننده</span>
                        </button>
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="px-3 py-2 bg-indigo-950/60 hover:bg-indigo-950 text-indigo-200 hover:text-white text-xs font-bold rounded-xl transition border border-indigo-600/40"
                        >
                            لغو انتخاب
                        </button>
                    </div>
                </div>
            )}

            {/* Action Cards List */}
            {loading ? (
                <div className="flex justify-center p-16"><Spinner /></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredActions.map(action => {
                        const isOverdue = isActionOverdue(action);
                        const deadline = getDeadlineInfo(action.dueDate, action.isCompleted, action.executionDate);
                        const priorityInfo = PRIORITIES.find(p => p.key === action.priority) || PRIORITIES[0];
                        const parsedCreated = parseCreatedAt(action.createdAt);
                        const regDateDisplay = action.registrationDate ? toJalali(action.registrationDate) : (parsedCreated.jalaliDate || 'نامشخص');
                        const regTimeDisplay = action.registrationTime || parsedCreated.time || '';
                        const dueDateDisplay = toJalali(action.dueDate) || 'تعیین نشده';
                        const execDateDisplay = action.executionDate ? toJalali(action.executionDate) : '';
                        const rel = getUserRelationToAction(action, currentUserProfile);

                        return (
                            <div 
                                key={action.id} 
                                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden ${
                                    isActionSelected(action.id)
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/15 dark:bg-indigo-950/20'
                                        : action.isCompleted 
                                            ? 'border-emerald-200/80 dark:border-emerald-900/40 bg-gradient-to-b from-emerald-50/20 to-transparent' 
                                            : isOverdue 
                                                ? 'border-rose-300 dark:border-rose-800/80 bg-gradient-to-b from-rose-50/30 to-transparent' 
                                                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'
                                }`}
                            >
                                <div className="p-5 space-y-4">
                                    {/* Card Top: Selection Checkbox, Department, Priority & Status Tag */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <label 
                                                className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 transition"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isActionSelected(action.id)}
                                                    onChange={() => toggleSelectAction(action.id)}
                                                    className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer transition"
                                                />
                                                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                                                    #{action.id}
                                                </span>
                                            </label>

                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                {action.department || 'عمومی'}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityInfo.color} ${priorityInfo.badge}`}>
                                                {priorityInfo.label}
                                            </span>
                                            {!action.isCompleted && (() => {
                                                const diff = getDaysDiffFromToday(action.dueDate);
                                                if (diff === null || diff < 0 || diff > 3) return null;
                                                return (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse flex items-center gap-1">
                                                        <Hourglass className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                                        {diff === 0 ? '⏰ سررسید امروز' : `⚡ ${diff} روز تا موعد`}
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleQuickComplete(action)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                                action.isCompleted
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                                    : isOverdue
                                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                                        : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                                            }`}
                                        >
                                            {action.isCompleted ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                            <span>{action.isCompleted ? 'اجرا شده' : isOverdue ? 'دارای تاخیر' : 'در جریان'}</span>
                                        </button>
                                    </div>

                                    {/* Role Badges for Current User */}
                                    {rel.isRelated && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {rel.isResponsible && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                                                    <UserCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                                    <span>وظیفه من (مسئول اجرا)</span>
                                                </span>
                                            )}
                                            {rel.isVerifier && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                                    <CheckCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                    <span>تایید و پایش من</span>
                                                </span>
                                            )}
                                            {rel.isRegistrar && !rel.isResponsible && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1">
                                                    <FileText className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                                                    <span>ثبت‌شده توسط من</span>
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Title & Description */}
                                    <div className="space-y-1.5">
                                        <h3 className={`font-black text-sm leading-snug ${action.isCompleted ? 'text-slate-700 dark:text-slate-300 line-through opacity-80' : 'text-slate-800 dark:text-white'}`}>
                                            {action.title}
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                            {action.description || 'بدون شرح تفصیلی'}
                                        </p>
                                    </div>

                                    {/* Root Cause snippet if exists */}
                                    {action.rootCause && (
                                        <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                                            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                                            <span className="line-clamp-1"><strong>ریشه مشکل:</strong> {action.rootCause}</span>
                                        </div>
                                    )}

                                    {/* Action Plan snippet if exists */}
                                    {action.actionPlan && (
                                        <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] text-indigo-800 dark:text-indigo-300 flex items-start gap-1.5">
                                            <ClipboardCheckIcon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-600" />
                                            <span className="line-clamp-1"><strong>برنامه اصلاحی:</strong> {action.actionPlan}</span>
                                        </div>
                                    )}

                                    {/* Responsible, Verifier & Registrar */}
                                    <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                <span>مسئول اجرا: <strong className="text-slate-700 dark:text-slate-200">{action.responsiblePerson}</strong></span>
                                            </span>
                                            {action.registeredBy && (
                                                <span className="text-[10px] text-slate-400">
                                                    ثبت: {action.registeredBy}
                                                </span>
                                            )}
                                        </div>
                                        {action.verifierPerson && (
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
                                                <span>مسئول تایید و پایش: <strong className="text-slate-700 dark:text-slate-200">{action.verifierPerson}</strong></span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 3-PART TIMELINE BOX (Three Crucial Dates) */}
                                    <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/40 pb-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> زمان‌بندی و موعدهای سه‌گانه
                                            </span>
                                            <span className={`font-mono text-[10px] ${deadline.color}`}>
                                                {deadline.text}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-1.5 text-center">
                                            {/* 1. Registration Date/Time */}
                                            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-2xs">
                                                <span className="text-[9px] font-bold text-slate-400 block flex items-center justify-center gap-0.5">
                                                    <Clock className="w-2.5 h-2.5 text-sky-500" /> زمان ثبت
                                                </span>
                                                <span className="text-[11px] font-black font-mono text-slate-700 dark:text-slate-200 block mt-0.5">
                                                    {regDateDisplay}
                                                </span>
                                                {regTimeDisplay && (
                                                    <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                                                        {regTimeDisplay}
                                                    </span>
                                                )}
                                            </div>

                                            {/* 2. Due Date */}
                                            <div className={`p-2 rounded-lg border shadow-2xs ${
                                                isOverdue 
                                                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' 
                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                            }`}>
                                                <span className="text-[9px] font-bold text-slate-400 block flex items-center justify-center gap-0.5">
                                                    <AlertTriangle className={`w-2.5 h-2.5 ${isOverdue ? 'text-rose-500' : 'text-amber-500'}`} /> مهلت اجرا
                                                </span>
                                                <span className={`text-[11px] font-black font-mono block mt-0.5 ${isOverdue ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {dueDateDisplay}
                                                </span>
                                                <span className="text-[9px] text-slate-400 block mt-0.5">
                                                    سررسید مجاز
                                                </span>
                                            </div>

                                            {/* 3. Execution Date */}
                                            <div className={`p-2 rounded-lg border shadow-2xs ${
                                                action.isCompleted 
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' 
                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                            }`}>
                                                <span className="text-[9px] font-bold text-slate-400 block flex items-center justify-center gap-0.5">
                                                    <CheckCircle2 className={`w-2.5 h-2.5 ${action.isCompleted ? 'text-emerald-500' : 'text-slate-400'}`} /> تاریخ اجرا
                                                </span>
                                                <span className={`text-[11px] font-black font-mono block mt-0.5 ${action.isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}`}>
                                                    {execDateDisplay || (action.isCompleted ? 'انجام شده' : 'هنوز اجرا نشده')}
                                                </span>
                                                <span className="text-[9px] text-slate-400 block mt-0.5">
                                                    {action.isCompleted ? 'اقدام واقعی' : 'در انتظار اجرا'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions Footer */}
                                <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedActionForDetail(action);
                                                setIsDetailModalOpen(true);
                                            }}
                                            className="px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition shadow-2xs"
                                            title="مشاهده شناسنامه چندبخشی"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                            <span>شناسنامه</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyActionText(action)}
                                            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition"
                                            title="کپی گزارش متنی اقدام"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => openEditModal(action)} 
                                            className="p-1.5 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-lg transition"
                                            title="ویرایش اقدام"
                                        >
                                            <EditIcon />
                                        </button>
                                        {canDeleteAction(action) && (
                                            <button 
                                                onClick={() => handleDelete(action.id)} 
                                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                                                title="حذف اقدام"
                                            >
                                                <TrashIcon />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredActions.length === 0 && (
                        <div className="col-span-full py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                                <ClipboardCheckIcon className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {effectiveScope === 'MY_ACTIONS' && myActionsList.length === 0
                                    ? 'هیچ اقدام اصلاحی مرتبط با شما یافت نشد'
                                    : 'موردی با شرایط انتخابی یافت نشد'}
                            </h4>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                {effectiveScope === 'MY_ACTIONS' && myActionsList.length === 0
                                    ? 'شما در حال حاضر به عنوان مسئول اجرا، مسئول تایید یا ثبت‌کننده در اقدامی ثبت نشده‌اید.'
                                    : 'فیلترهای جستجو را بررسی کنید یا اقدام اصلاحی جدیدی تعریف نمایید.'}
                            </p>
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                            >
                                <PlusIcon /> ثبت اقدام جدید
                            </button>
                        </div>
                    )}
                </div>
            )}
            </>
            )}

            {/* MULTI-SECTION CREATE / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                    <ClipboardCheckIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-slate-800 dark:text-white">
                                        {currentAction.id ? 'ویرایش اقدام اصلاحی' : 'تعریف اقدام اصلاحی چند بخشی (CAPA)'}
                                    </h3>
                                    <span className="text-[11px] text-slate-400">
                                        تکمیل بخش‌های ۴‌گانه شناسایی، برنامه اجرایی، زمان‌بندی و پایش
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 4-Step Navigation Tabs */}
                        <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900">
                            <button
                                type="button"
                                onClick={() => setModalStep(1)}
                                className={`py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition ${
                                    modalStep === 1 
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">۱</span>
                                <span className="truncate">۱. شرح عدم انطباق</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalStep(2)}
                                className={`py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition ${
                                    modalStep === 2 
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">۲</span>
                                <span className="truncate">۲. برنامه اصلاحی</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalStep(3)}
                                className={`py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition ${
                                    modalStep === 3 
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">۳</span>
                                <span className="truncate">۳. زمان‌بندی و موعدها</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalStep(4)}
                                className={`py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition ${
                                    modalStep === 4 
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">۴</span>
                                <span className="truncate">۴. پایش و اثربخشی</span>
                            </button>
                        </div>

                        {/* Modal Body with 4 Steps */}
                        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                            {/* STEP 1: NON-CONFORMITY & ROOT CAUSE */}
                            {modalStep === 1 && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-900 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2">
                                        <Flag className="w-4 h-4 mt-0.5 text-sky-600 shrink-0" />
                                        <span><strong>بخش اول:</strong> عنوان عدم انطباق، دپارتمان مربوطه، اولویت و ریشه‌یابی بروز خطا را مشخص نمایید.</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            عنوان عدم انطباق / مشکل <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="مثال: تاخیر در آماده‌سازی مدارک تحویل خودرو..."
                                            value={currentAction.title || ''}
                                            onChange={e => setCurrentAction({ ...currentAction, title: e.target.value })}
                                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                واحد / بخش سازمانی
                                            </label>
                                            <select
                                                value={currentAction.department || 'خدمات پس از فروش و تعمیرگاه'}
                                                onChange={e => setCurrentAction({ ...currentAction, department: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                                            >
                                                {DEPARTMENTS.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                سطح اولویت / فوریت
                                            </label>
                                            <select
                                                value={currentAction.priority || 'MEDIUM'}
                                                onChange={e => setCurrentAction({ ...currentAction, priority: e.target.value as CorrectiveActionPriority })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                                            >
                                                {PRIORITIES.map(p => (
                                                    <option key={p.key} value={p.key}>{p.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                <User className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>ثبت‌کننده اقدام</span>
                                                <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={currentAction.registeredBy || ''}
                                                onChange={e => setCurrentAction({ ...currentAction, registeredBy: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="" disabled>-- انتخاب ثبت‌کننده اقدام --</option>
                                                {currentAction.registeredBy && !staffUsers.some(u => (u.fullName || u.username) === currentAction.registeredBy) && (
                                                    <option value={currentAction.registeredBy}>{currentAction.registeredBy}</option>
                                                )}
                                                {staffUsers.map(user => {
                                                    const displayName = user.fullName || user.username;
                                                    const subtitle = user.roleTitle || (user.role === 'ADMIN' ? 'مدیر ارشد' : '');
                                                    return (
                                                        <option key={user.id} value={displayName}>
                                                            {displayName} {subtitle ? `(${subtitle})` : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            شرح تفصیلی عدم انطباق و رویداد
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="شرح کامل شرایط نامنطبق، شواهد عینی و مشاهدات..."
                                            value={currentAction.description || ''}
                                            onChange={e => setCurrentAction({ ...currentAction, description: e.target.value })}
                                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                                            علت ریشه‌ای وقوع مشکل (Root Cause Analysis)
                                        </label>
                                        <textarea
                                            rows={2}
                                            placeholder="تحلیل علت یا ریشه اصلی وقوع عدم انطباق (فرایندی، سیستمی، آموزش، تجهیزات)..."
                                            value={currentAction.rootCause || ''}
                                            onChange={e => setCurrentAction({ ...currentAction, rootCause: e.target.value })}
                                            className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: ACTION PLAN & OWNERSHIP */}
                            {modalStep === 2 && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
                                        <ClipboardCheckIcon className="w-4 h-4 mt-0.5 text-indigo-600 shrink-0" />
                                        <span><strong>بخش دوم:</strong> برنامه عملیاتی اصلاحی، مسئولین پیگیری و منابع مورد نیاز را تدوین نمایید.</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            شرح برنامه اقدام اصلاحی
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="گام‌ها و اقدامات اجرایی جهت رفع کامل مشکل و جلوگیری از تکرار مجدد..."
                                            value={currentAction.actionPlan || ''}
                                            onChange={e => setCurrentAction({ ...currentAction, actionPlan: e.target.value })}
                                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                <User className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>مسئول اجرا / پیگیری</span>
                                                <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={currentAction.responsiblePerson || ''}
                                                onChange={e => setCurrentAction({ ...currentAction, responsiblePerson: e.target.value })}
                                                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="" disabled>-- انتخاب مسئول اجرا / پیگیری --</option>
                                                {currentAction.responsiblePerson && !staffUsers.some(u => (u.fullName || u.username) === currentAction.responsiblePerson) && (
                                                    <option value={currentAction.responsiblePerson}>{currentAction.responsiblePerson}</option>
                                                )}
                                                {staffUsers.map(user => {
                                                    const displayName = user.fullName || user.username;
                                                    const subtitle = user.roleTitle || (user.role === 'ADMIN' ? 'مدیر ارشد' : '');
                                                    return (
                                                        <option key={user.id} value={displayName}>
                                                            {displayName} {subtitle ? `(${subtitle})` : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                <User className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>مسئول تایید و پایش اثربخشی</span>
                                            </label>
                                            <select
                                                value={currentAction.verifierPerson || ''}
                                                onChange={e => setCurrentAction({ ...currentAction, verifierPerson: e.target.value })}
                                                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">-- بدون انتخاب / تعیین نشده --</option>
                                                {currentAction.verifierPerson && !staffUsers.some(u => (u.fullName || u.username) === currentAction.verifierPerson) && (
                                                    <option value={currentAction.verifierPerson}>{currentAction.verifierPerson}</option>
                                                )}
                                                {staffUsers.map(user => {
                                                    const displayName = user.fullName || user.username;
                                                    const subtitle = user.roleTitle || (user.role === 'ADMIN' ? 'مدیر ارشد' : '');
                                                    return (
                                                        <option key={user.id} value={displayName}>
                                                            {displayName} {subtitle ? `(${subtitle})` : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            منابع، ابزارها و الزامات مورد نیاز
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="مثال: آموزش پرسنل، هماهنگی با انبار، به‌روزرسانی فرم‌ها..."
                                            value={currentAction.resourcesRequired || ''}
                                            onChange={e => setCurrentAction({ ...currentAction, resourcesRequired: e.target.value })}
                                            className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: TIMELINE & DEADLINES (CRUCIAL 3 DATES) */}
                            {modalStep === 3 && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                                        <Clock className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                                        <span><strong>بخش سوم (زمان‌بندی):</strong> تعیین دقیق زمان ثبت اقدام اصلاحی، مهلت اجرا (Due Date) و تاریخ اجرای واقعی.</span>
                                    </div>

                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        {/* 1. Registration Date & Time */}
                                        <div className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                                                <Clock className="w-4 h-4 text-sky-500" />
                                                <span>۱. زمان ثبت اقدام اصلاحی</span>
                                                <span className="text-[10px] text-slate-400 font-normal">(تاریخ و ساعت ثبت اولیه در سامانه)</span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                        تاریخ ثبت شمسی
                                                    </label>
                                                    <PersianDatePicker
                                                        value={currentAction.registrationDate || parseCreatedAt(currentAction.createdAt).jalaliDate || ''}
                                                        onChange={val => setCurrentAction({ ...currentAction, registrationDate: val })}
                                                        placeholder="تاریخ ثبت"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                        ساعت ثبت
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="مثال: ۱۲:۴۳"
                                                        value={currentAction.registrationTime || parseCreatedAt(currentAction.createdAt).time || ''}
                                                        onChange={e => setCurrentAction({ ...currentAction, registrationTime: e.target.value })}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Due Date (مهلت اجرا) */}
                                        <div className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                <span>۲. مهلت اجرا (Due Date)</span>
                                                <span className="text-[10px] text-slate-400 font-normal">(حداکثر زمان مجاز برای تکمیل اقدام)</span>
                                            </div>

                                            <div>
                                                <PersianDatePicker
                                                    value={currentAction.dueDate || ''}
                                                    onChange={val => setCurrentAction({ ...currentAction, dueDate: val })}
                                                    placeholder="انتخاب مهلت اجرای اقدام اصلاحی"
                                                />
                                            </div>
                                        </div>

                                        {/* 3. Execution Date (تاریخ اجرا) */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    <span>۳. تاریخ اجرا (Execution Date)</span>
                                                    <span className="text-[10px] text-slate-400 font-normal">(تاریخ واقعی انجام اقدام اصلاحی)</span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const today = getCurrentJalaliDate();
                                                        setCurrentAction({
                                                            ...currentAction,
                                                            executionDate: today,
                                                            isCompleted: true,
                                                            status: 'COMPLETED'
                                                        });
                                                    }}
                                                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                                >
                                                    درج تاریخ امروز
                                                </button>
                                            </div>

                                            <div>
                                                <PersianDatePicker
                                                    value={currentAction.executionDate || ''}
                                                    onChange={val => setCurrentAction({ 
                                                        ...currentAction, 
                                                        executionDate: val,
                                                        isCompleted: Boolean(val)
                                                    })}
                                                    placeholder="انتخاب تاریخ اجرای اقدام اصلاحی (در صورت انجام)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: STATUS & EFFECTIVENESS */}
                            {modalStep === 4 && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 text-xs text-purple-800 dark:text-purple-300 flex items-start gap-2">
                                        <Activity className="w-4 h-4 mt-0.5 text-purple-600 shrink-0" />
                                        <span><strong>بخش چهارم:</strong> وضعیت نهایی اقدام، گزارش نحوه اجرا و ارزیابی اثربخشی پس از اجرا را ثبت کنید.</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                وضعیت کلی اقدام
                                            </label>
                                            <select
                                                value={currentAction.status || (currentAction.isCompleted ? 'COMPLETED' : 'IN_PROGRESS')}
                                                onChange={e => {
                                                    const newStatus = e.target.value as CorrectiveActionStatus;
                                                    setCurrentAction({
                                                        ...currentAction,
                                                        status: newStatus,
                                                        isCompleted: newStatus === 'COMPLETED'
                                                    });
                                                }}
                                                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                                            >
                                                <option value="IN_PROGRESS">در جریان پیگیری</option>
                                                <option value="COMPLETED">تکمیل و اجرا شده</option>
                                                <option value="PENDING">در انتظار بررسی اولیه</option>
                                                <option value="CANCELLED">لغو شده</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                ارزیابی اثربخشی اقدام
                                            </label>
                                            <select
                                                value={currentAction.effectiveness || 'PENDING_REVIEW'}
                                                onChange={e => setCurrentAction({ ...currentAction, effectiveness: e.target.value as CorrectiveActionEffectiveness })}
                                                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                                            >
                                                {EFFECTIVENESS_OPTIONS.map(opt => (
                                                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            گزارش و توضیحات اجرای اقدام
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="توضیحات مربوط به نتایج حاصل از اجرای اقدام، مدارک پیوست و وضعیت بهبود حاصله..."
                                            value={currentAction.executionNotes || ''}
                                            onChange={e => setCurrentAction({ ...currentAction, executionNotes: e.target.value })}
                                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            علامت‌گذاری نهایی به عنوان «انجام شده»:
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={Boolean(currentAction.isCompleted)}
                                            onChange={e => {
                                                const checked = e.target.checked;
                                                const today = getCurrentJalaliDate();
                                                setCurrentAction({
                                                    ...currentAction,
                                                    isCompleted: checked,
                                                    status: checked ? 'COMPLETED' : 'IN_PROGRESS',
                                                    executionDate: checked ? (currentAction.executionDate || today) : currentAction.executionDate
                                                });
                                            }}
                                            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Controls */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850">
                            <div>
                                {modalStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setModalStep((modalStep - 1) as any)}
                                        className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1 transition"
                                    >
                                        <ChevronRight className="w-4 h-4" /> بخش قبلی
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                                >
                                    انصراف
                                </button>

                                {modalStep < 4 ? (
                                    <button
                                        type="button"
                                        onClick={() => setModalStep((modalStep + 1) as any)}
                                        className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-xs"
                                    >
                                        <span>بخش بعدی</span> <ChevronLeft className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                    >
                                        ذخیره اقدام اصلاحی
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL VIEW MODAL (SHENASNAMEH) */}
            {isDetailModalOpen && selectedActionForDetail && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto" onClick={() => setIsDetailModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-slate-800 dark:text-white">شناسنامه کامل اقدام اصلاحی (CAPA)</h3>
                                    <span className="text-[11px] text-slate-400">کد اقدام: #{selectedActionForDetail.id}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => handleCopyActionText(selectedActionForDetail)}
                                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                                    title="کپی گزارش"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg">
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                            {/* Header Info */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-black text-sm text-slate-800 dark:text-white">{selectedActionForDetail.title}</h4>
                                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                        selectedActionForDetail.isCompleted 
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                    }`}>
                                        {selectedActionForDetail.isCompleted ? 'اجرا و تکمیل شده' : 'در جریان پیگیری'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-slate-500 text-[11px] pt-1">
                                    <span>🏢 واحد: <strong>{selectedActionForDetail.department || 'عمومی'}</strong></span>
                                    <span>•</span>
                                    <span>🚨 اولویت: <strong>{PRIORITIES.find(p => p.key === selectedActionForDetail.priority)?.label || 'عادی'}</strong></span>
                                    <span>•</span>
                                    <span>👤 مسئول اجرا: <strong>{selectedActionForDetail.responsiblePerson}</strong></span>
                                </div>
                            </div>

                            {/* 3-Part Date Timeline Banner */}
                            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-xl shadow-xs space-y-3">
                                <span className="text-[11px] font-bold text-indigo-300 block flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" /> وضعیت موعدها و زمان‌بندی اقدام اصلاحی:
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div className="bg-indigo-950/70 p-2.5 rounded-lg border border-indigo-800/60 text-center">
                                        <span className="text-[10px] text-indigo-300 block flex items-center justify-center gap-1">
                                            <Clock className="w-3 h-3 text-sky-400" /> زمان ثبت اقدام اصلاحی
                                        </span>
                                        <span className="text-xs font-black font-mono mt-1 block text-white">
                                            {selectedActionForDetail.registrationDate ? toJalali(selectedActionForDetail.registrationDate) : (parseCreatedAt(selectedActionForDetail.createdAt).jalaliDate || '-')}
                                        </span>
                                        <span className="text-[10px] font-mono text-indigo-300 block mt-0.5">
                                            ساعت {selectedActionForDetail.registrationTime || parseCreatedAt(selectedActionForDetail.createdAt).time}
                                        </span>
                                    </div>

                                    <div className="bg-indigo-950/70 p-2.5 rounded-lg border border-indigo-800/60 text-center">
                                        <span className="text-[10px] text-indigo-300 block flex items-center justify-center gap-1">
                                            <AlertTriangle className="w-3 h-3 text-amber-400" /> مهلت اجرا (Due Date)
                                        </span>
                                        <span className="text-xs font-black font-mono mt-1 block text-amber-300">
                                            {toJalali(selectedActionForDetail.dueDate) || 'نامشخص'}
                                        </span>
                                        <span className="text-[10px] text-indigo-300 block mt-0.5">
                                            {getDeadlineInfo(selectedActionForDetail.dueDate, selectedActionForDetail.isCompleted, selectedActionForDetail.executionDate).text}
                                        </span>
                                    </div>

                                    <div className="bg-indigo-950/70 p-2.5 rounded-lg border border-indigo-800/60 text-center">
                                        <span className="text-[10px] text-indigo-300 block flex items-center justify-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> تاریخ اجرا (Execution)
                                        </span>
                                        <span className="text-xs font-black font-mono mt-1 block text-emerald-400">
                                            {selectedActionForDetail.executionDate ? toJalali(selectedActionForDetail.executionDate) : (selectedActionForDetail.isCompleted ? 'اجرا شده' : 'هنوز اجرا نشده')}
                                        </span>
                                        <span className="text-[10px] text-indigo-300 block mt-0.5">
                                            {selectedActionForDetail.isCompleted ? 'انجام قطعی' : 'در انتظار اقدام'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 1: Non-Conformity Description & Root Cause */}
                            <div className="space-y-2">
                                <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-xs">
                                    <Flag className="w-3.5 h-3.5 text-indigo-500" /> شرح عدم انطباق و مشاهدات:
                                </h5>
                                <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {selectedActionForDetail.description || 'توضیحی ثبت نشده است.'}
                                </p>
                            </div>

                            {selectedActionForDetail.rootCause && (
                                <div className="space-y-2">
                                    <h5 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 text-xs">
                                        <ShieldAlert className="w-3.5 h-3.5" /> علت ریشه‌ای بروز خطا (Root Cause):
                                    </h5>
                                    <p className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl text-amber-900 dark:text-amber-200 border border-amber-200/50 leading-relaxed">
                                        {selectedActionForDetail.rootCause}
                                    </p>
                                </div>
                            )}

                            {/* Section 2: Action Plan & Resources */}
                            {selectedActionForDetail.actionPlan && (
                                <div className="space-y-2">
                                    <h5 className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1 text-xs">
                                        <ClipboardCheckIcon className="w-3.5 h-3.5" /> برنامه و دستورالعمل اجرایی:
                                    </h5>
                                    <p className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl text-indigo-900 dark:text-indigo-200 border border-indigo-200/50 leading-relaxed">
                                        {selectedActionForDetail.actionPlan}
                                    </p>
                                </div>
                            )}

                            {/* Section 4: Execution Notes & Effectiveness */}
                            {selectedActionForDetail.executionNotes && (
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-xs">
                                        <Activity className="w-3.5 h-3.5 text-emerald-500" /> گزارش اجرای اقدام و نتایج:
                                    </h5>
                                    <p className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl text-emerald-900 dark:text-emerald-200 border border-emerald-200/50 leading-relaxed">
                                        {selectedActionForDetail.executionNotes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    openEditModal(selectedActionForDetail);
                                }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                            >
                                ویرایش این اقدام
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                            >
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BULK EDIT MODAL */}
            {isBulkEditModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto" 
                    onClick={() => !bulkLoading && setIsBulkEditModalOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-slate-800 dark:text-white">
                                        ویرایش دسته‌جمعی اقدامات اصلاحی
                                    </h3>
                                    <span className="text-[11px] text-slate-400">
                                        تغییر همزمان ثبت‌کننده، مسئول اجرا و مسئول تایید ({selectedActionIds.length.toLocaleString('fa-IR')} اقدام انتخاب‌شده)
                                    </span>
                                </div>
                            </div>
                            {!bulkLoading && (
                                <button 
                                    onClick={() => setIsBulkEditModalOpen(false)} 
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
                                >
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                                <p className="leading-relaxed">
                                    فیلدهایی که مایل به تغییر دسته‌جمعی آن‌ها هستید را تعیین کنید. هر فیلدی که روی <strong>«بدون تغییر»</strong> باقی بماند، در اقدامات انتخابی بدون تغییر حفظ خواهد شد.
                                </p>
                            </div>

                            {/* Selected Actions Preview */}
                            <div className="space-y-1.5">
                                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                    اقدامات اصلاحی انتخاب‌شده ({selectedActionIds.length.toLocaleString('fa-IR')} مورد):
                                </span>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                                    {actions.filter(a => selectedActionIds.includes(a.id)).map(act => (
                                        <span key={act.id} className="px-2 py-1 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-[11px] font-medium flex items-center gap-1 shadow-2xs">
                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">#{act.id}</span>
                                            <span className="truncate max-w-[160px]">{act.title}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Field 1: registeredBy (ثبت‌کننده اقدام) */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>۱. تغییر ثبت‌کننده اقدام (ثبت‌کننده):</span>
                                </label>
                                <select
                                    value={bulkRegisteredBy}
                                    onChange={e => setBulkRegisteredBy(e.target.value)}
                                    className={`w-full px-3 py-2 text-xs rounded-xl border transition ${
                                        bulkRegisteredBy !== '__NO_CHANGE__' 
                                            ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-bold' 
                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <option value="__NO_CHANGE__">-- بدون تغییر (حفظ ثبت‌کننده فعلی هر اقدام) --</option>
                                    {staffUsers.map(user => {
                                        const displayName = user.fullName || user.username;
                                        const subtitle = user.roleTitle || (user.role === 'ADMIN' ? 'مدیر ارشد' : '');
                                        return (
                                            <option key={user.id} value={displayName}>
                                                تغییر به: {displayName} {subtitle ? `(${subtitle})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Field 2: responsiblePerson (مسئول اجرا / پیگیری) */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-sky-500" />
                                    <span>۲. تغییر مسئول اجرا / پیگیری:</span>
                                </label>
                                <select
                                    value={bulkResponsiblePerson}
                                    onChange={e => setBulkResponsiblePerson(e.target.value)}
                                    className={`w-full px-3 py-2 text-xs rounded-xl border transition ${
                                        bulkResponsiblePerson !== '__NO_CHANGE__' 
                                            ? 'border-sky-500 bg-sky-50/20 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 font-bold' 
                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <option value="__NO_CHANGE__">-- بدون تغییر (حفظ مسئول اجرای فعلی هر اقدام) --</option>
                                    {staffUsers.map(user => {
                                        const displayName = user.fullName || user.username;
                                        const subtitle = user.roleTitle || (user.role === 'ADMIN' ? 'مدیر ارشد' : '');
                                        return (
                                            <option key={user.id} value={displayName}>
                                                تغییر به: {displayName} {subtitle ? `(${subtitle})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Field 3: verifierPerson (مسئول تایید و پایش اثربخشی) */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>۳. تغییر مسئول تایید و پایش اثربخشی:</span>
                                </label>
                                <select
                                    value={bulkVerifierPerson}
                                    onChange={e => setBulkVerifierPerson(e.target.value)}
                                    className={`w-full px-3 py-2 text-xs rounded-xl border transition ${
                                        bulkVerifierPerson !== '__NO_CHANGE__' 
                                            ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold' 
                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <option value="__NO_CHANGE__">-- بدون تغییر (حفظ مسئول تایید فعلی هر اقدام) --</option>
                                    <option value="__CLEAR__">-- حذف و خالی کردن مسئول تایید --</option>
                                    {staffUsers.map(user => {
                                        const displayName = user.fullName || user.username;
                                        const subtitle = user.roleTitle || (user.role === 'ADMIN' ? 'مدیر ارشد' : '');
                                        return (
                                            <option key={user.id} value={displayName}>
                                                تغییر به: {displayName} {subtitle ? `(${subtitle})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850">
                            <button
                                type="button"
                                disabled={bulkLoading}
                                onClick={() => setIsBulkEditModalOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition disabled:opacity-50"
                            >
                                انصراف
                            </button>

                            <button
                                type="button"
                                disabled={bulkLoading || (bulkRegisteredBy === '__NO_CHANGE__' && bulkResponsiblePerson === '__NO_CHANGE__' && bulkVerifierPerson === '__NO_CHANGE__')}
                                onClick={handleBulkSave}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {bulkLoading ? (
                                    <>
                                        <Spinner />
                                        <span>در حال اعمال تغییرات...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCheck className="w-4 h-4" />
                                        <span>اعمال تغییرات روی {selectedActionIds.length.toLocaleString('fa-IR')} اقدام</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CorrectiveActionsPage;
