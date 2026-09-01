import React, { useState, useMemo } from 'react';
import type { CorrectiveAction, CorrectiveActionPriority, CorrectiveActionEffectiveness } from '../../types';
import * as XLSX from 'xlsx';
import PersianDatePicker from '../PersianDatePicker';
import { 
    ResponsiveContainer,
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    PieChart, 
    Pie, 
    Cell, 
    AreaChart, 
    Area, 
    LineChart, 
    Line 
} from 'recharts';
import { 
    TrendingUp, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    ShieldAlert, 
    Building2, 
    User, 
    Layers, 
    Download, 
    Printer, 
    Copy, 
    Filter, 
    RotateCcw, 
    Sparkles, 
    Check, 
    Activity, 
    Calendar, 
    Award, 
    Search,
    FileSpreadsheet,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    HelpCircle
} from 'lucide-react';
import { CorrectiveActionsPrintReport } from './CorrectiveActionsPrintReport';

declare const moment: any;

interface CorrectiveActionsAnalyticsViewProps {
    actions: CorrectiveAction[];
    onOpenCreateModal?: () => void;
    onViewDetail?: (action: CorrectiveAction) => void;
    onSetToast?: (toast: { message: string; type: 'success' | 'error' }) => void;
}

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

const PRIORITIES_CONFIG = [
    { key: 'LOW', label: 'عادی / کم', color: '#94a3b8' },
    { key: 'MEDIUM', label: 'متوسط', color: '#0ea5e9' },
    { key: 'HIGH', label: 'بالا', color: '#f59e0b' },
    { key: 'CRITICAL', label: 'بحرانی / فوری', color: '#f43f5e' }
];

const EFFECTIVENESS_CONFIG = [
    { key: 'EFFECTIVE', label: 'کاملاً اثربخش', color: '#10b981' },
    { key: 'PARTIALLY_EFFECTIVE', label: 'تا حدودی اثربخش', color: '#f59e0b' },
    { key: 'INEFFECTIVE', label: 'فاقد اثربخشی', color: '#f43f5e' },
    { key: 'PENDING_REVIEW', label: 'در انتظار ارزیابی', color: '#94a3b8' }
];

const ROOT_CAUSE_CATEGORIES = [
    { key: 'PROCESS', label: 'فرآیندی و روش اجرایی', keywords: ['فرآیند', 'دستورالعمل', 'روش', 'رویه', 'مراحل', 'ناهماهنگی'] },
    { key: 'TRAINING', label: 'آموزش و خطای انسانی', keywords: ['آموزش', 'مهارت', 'اپراتور', 'پرسنل', 'خطای انسانی', 'اشتباه', 'دقت'] },
    { key: 'EQUIPMENT', label: 'تجهیزات، ابزار و سخت‌افزار', keywords: ['تجهیزات', 'دستگاه', 'ابزار', 'خرابی', 'کالیبراسیون', 'سیستم'] },
    { key: 'PARTS', label: 'تامین‌کننده و قطعات', keywords: ['قطعه', 'تامین', 'انبار', 'کسری', 'کیفیت قطعه', 'پیمانکار'] },
    { key: 'SOFTWARE', label: 'سیستمی و فناوری اطلاعات', keywords: ['نرم‌افزار', 'سامانه', 'سرور', 'شبکه', 'ثبت سیستم', 'اتوماسیون'] },
    { key: 'OTHER', label: 'سایر و نامشخص', keywords: [] }
];

const toJalali = (dateStr?: string): string => {
    if (!dateStr || !dateStr.trim()) return '-';
    try {
        const clean = dateStr.replace('T', ' ').split(' ')[0].trim();
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
    } catch (e) {}
    return dateStr || '-';
};

const toGregorian = (jalaliStr?: string): string => {
    if (!jalaliStr || !jalaliStr.trim()) return '';
    try {
        const clean = jalaliStr.replace('T', ' ').split(' ')[0].trim();
        if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(clean)) {
            const firstNum = parseInt(clean.split(/[-/]/)[0], 10);
            if (firstNum > 1900) return clean;
        }
        if (typeof moment !== 'undefined') {
            const m = moment(clean, ['jYYYY/jMM/jDD', 'jYYYY/jM/jD', 'jYYYY-jMM-jDD', 'jYYYY-jM-jD']);
            if (m && m.isValid()) {
                return m.format('YYYY-MM-DD');
            }
        }
    } catch (e) {}
    return jalaliStr || '';
};

export const CorrectiveActionsAnalyticsView: React.FC<CorrectiveActionsAnalyticsViewProps> = ({
    actions,
    onOpenCreateModal,
    onViewDetail,
    onSetToast
}) => {
    // Filter states
    const [periodType, setPeriodType] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30' | 'THIS_SEASON' | 'THIS_YEAR' | 'CUSTOM'>('ALL');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('ALL');
    const [selectedPriority, setSelectedPriority] = useState('ALL');
    const [selectedEffectiveness, setSelectedEffectiveness] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // Filtered actions based on multi-dimensional criteria
    const filteredActions = useMemo(() => {
        return actions.filter(action => {
            // Department filter
            if (selectedDepartment !== 'ALL' && action.department !== selectedDepartment) return false;

            // Priority filter
            if (selectedPriority !== 'ALL' && action.priority !== selectedPriority) return false;

            // Effectiveness filter
            if (selectedEffectiveness !== 'ALL' && action.effectiveness !== selectedEffectiveness) return false;

            // Status filter
            if (selectedStatus === 'COMPLETED' && !action.isCompleted) return false;
            if (selectedStatus === 'IN_PROGRESS' && action.isCompleted) return false;
            if (selectedStatus === 'OVERDUE') {
                if (action.isCompleted || !action.dueDate) return false;
                try {
                    const dueG = action.dueDate.includes('/') ? toGregorian(action.dueDate) : action.dueDate;
                    const dueDate = new Date(dueG);
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    if (dueDate >= now) return false;
                } catch (e) {
                    return false;
                }
            }

            // Period filter
            if (periodType !== 'ALL') {
                const regDateStr = action.registrationDate || action.createdAt;
                if (!regDateStr) return true;
                try {
                    const cleanDate = regDateStr.includes('/') ? toGregorian(regDateStr) : regDateStr.replace('T', ' ').split(' ')[0];
                    const itemDate = new Date(cleanDate);
                    const now = new Date();

                    if (periodType === 'LAST_30') {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(now.getDate() - 30);
                        if (itemDate < thirtyDaysAgo) return false;
                    } else if (periodType === 'THIS_MONTH') {
                        if (typeof moment !== 'undefined') {
                            const m = moment(cleanDate);
                            const currentJMonth = moment().locale('fa').jMonth();
                            const currentJYear = moment().locale('fa').jYear();
                            if (m.locale('fa').jMonth() !== currentJMonth || m.locale('fa').jYear() !== currentJYear) {
                                return false;
                            }
                        }
                    } else if (periodType === 'THIS_YEAR') {
                        if (typeof moment !== 'undefined') {
                            const m = moment(cleanDate);
                            const currentJYear = moment().locale('fa').jYear();
                            if (m.locale('fa').jYear() !== currentJYear) return false;
                        }
                    } else if (periodType === 'CUSTOM') {
                        if (customStartDate) {
                            const startG = new Date(toGregorian(customStartDate));
                            if (itemDate < startG) return false;
                        }
                        if (customEndDate) {
                            const endG = new Date(toGregorian(customEndDate));
                            endG.setHours(23, 59, 59, 999);
                            if (itemDate > endG) return false;
                        }
                    }
                } catch (e) {}
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = (action.title || '').toLowerCase().includes(q);
                const matchDesc = (action.description || '').toLowerCase().includes(q);
                const matchResp = (action.responsiblePerson || '').toLowerCase().includes(q);
                const matchDept = (action.department || '').toLowerCase().includes(q);
                const matchRoot = (action.rootCause || '').toLowerCase().includes(q);
                const matchPlan = (action.actionPlan || '').toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchResp && !matchDept && !matchRoot && !matchPlan) {
                    return false;
                }
            }

            return true;
        });
    }, [actions, selectedDepartment, selectedPriority, selectedEffectiveness, selectedStatus, periodType, customStartDate, customEndDate, searchQuery]);

    // KPI Metrics calculation
    const kpis = useMemo(() => {
        const total = filteredActions.length;
        const completed = filteredActions.filter(a => a.isCompleted).length;
        const inProgress = filteredActions.filter(a => !a.isCompleted).length;
        
        let overdueCount = 0;
        let onTimeCompletedCount = 0;
        let totalResolutionDays = 0;
        let resolvedWithDatesCount = 0;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        filteredActions.forEach(a => {
            // Overdue check
            if (!a.isCompleted && a.dueDate) {
                try {
                    const dueG = a.dueDate.includes('/') ? toGregorian(a.dueDate) : a.dueDate;
                    const dueDate = new Date(dueG);
                    if (dueDate < now) {
                        overdueCount++;
                    }
                } catch (e) {}
            }

            // On-time check
            if (a.isCompleted) {
                if (a.dueDate && a.executionDate) {
                    try {
                        const dueG = new Date(a.dueDate.includes('/') ? toGregorian(a.dueDate) : a.dueDate);
                        const execG = new Date(a.executionDate.includes('/') ? toGregorian(a.executionDate) : a.executionDate);
                        if (execG <= dueG) {
                            onTimeCompletedCount++;
                        }
                    } catch (e) {
                        onTimeCompletedCount++;
                    }
                } else {
                    onTimeCompletedCount++;
                }

                // Resolution time calculation (days between reg and exec)
                const regStr = a.registrationDate || a.createdAt;
                if (regStr && a.executionDate) {
                    try {
                        const regG = new Date(regStr.includes('/') ? toGregorian(regStr) : regStr.replace('T', ' ').split(' ')[0]);
                        const execG = new Date(a.executionDate.includes('/') ? toGregorian(a.executionDate) : a.executionDate);
                        const diffTime = execG.getTime() - regG.getTime();
                        const diffDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
                        totalResolutionDays += diffDays;
                        resolvedWithDatesCount++;
                    } catch (e) {}
                }
            }
        });

        const criticalCount = filteredActions.filter(a => (a.priority === 'CRITICAL' || a.priority === 'HIGH') && !a.isCompleted).length;
        const effectiveCount = filteredActions.filter(a => a.effectiveness === 'EFFECTIVE').length;
        const evaluatedCount = filteredActions.filter(a => a.effectiveness && a.effectiveness !== 'PENDING_REVIEW').length;

        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const onTimeRate = completed > 0 ? Math.round((onTimeCompletedCount / completed) * 100) : (total > 0 ? 100 : 0);
        const effectivenessRate = evaluatedCount > 0 ? Math.round((effectiveCount / evaluatedCount) * 100) : (completed > 0 ? 100 : 0);
        const avgResolutionDays = resolvedWithDatesCount > 0 ? (totalResolutionDays / resolvedWithDatesCount).toFixed(1) : '۰';

        return {
            total,
            completed,
            inProgress,
            overdueCount,
            criticalCount,
            effectiveCount,
            completionRate,
            onTimeRate,
            effectivenessRate,
            avgResolutionDays
        };
    }, [filteredActions]);

    // Chart Data 1: Department Performance Breakdown
    const departmentChartData = useMemo(() => {
        const deptMap: Record<string, { total: number; completed: number; inProgress: number; overdue: number; effective: number }> = {};
        
        DEPARTMENTS.forEach(dept => {
            deptMap[dept] = { total: 0, completed: 0, inProgress: 0, overdue: 0, effective: 0 };
        });

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        filteredActions.forEach(action => {
            const dept = action.department || 'عمومی';
            if (!deptMap[dept]) {
                deptMap[dept] = { total: 0, completed: 0, inProgress: 0, overdue: 0, effective: 0 };
            }
            deptMap[dept].total += 1;
            if (action.isCompleted) {
                deptMap[dept].completed += 1;
                if (action.effectiveness === 'EFFECTIVE') {
                    deptMap[dept].effective += 1;
                }
            } else {
                deptMap[dept].inProgress += 1;
                if (action.dueDate) {
                    try {
                        const dueG = new Date(action.dueDate.includes('/') ? toGregorian(action.dueDate) : action.dueDate);
                        if (dueG < now) {
                            deptMap[dept].overdue += 1;
                        }
                    } catch (e) {}
                }
            }
        });

        return Object.entries(deptMap)
            .map(([department, data]) => ({
                department: department.length > 18 ? department.substring(0, 18) + '...' : department,
                fullName: department,
                total: data.total,
                completed: data.completed,
                inProgress: data.inProgress,
                overdue: data.overdue,
                effective: data.effective,
                rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
            }))
            .filter(d => d.total > 0)
            .sort((a, b) => b.total - a.total);
    }, [filteredActions]);

    // Chart Data 2: Priority Distribution
    const priorityPieData = useMemo(() => {
        const counts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
        filteredActions.forEach(a => {
            const p = a.priority || 'MEDIUM';
            counts[p] = (counts[p] || 0) + 1;
        });

        return PRIORITIES_CONFIG.map(cfg => ({
            name: cfg.label,
            value: counts[cfg.key] || 0,
            color: cfg.color,
            key: cfg.key
        })).filter(item => item.value > 0);
    }, [filteredActions]);

    // Chart Data 3: Effectiveness Distribution
    const effectivenessPieData = useMemo(() => {
        const counts: Record<string, number> = {
            EFFECTIVE: 0,
            PARTIALLY_EFFECTIVE: 0,
            INEFFECTIVE: 0,
            PENDING_REVIEW: 0
        };

        filteredActions.forEach(a => {
            const eff = a.effectiveness || 'PENDING_REVIEW';
            counts[eff] = (counts[eff] || 0) + 1;
        });

        return EFFECTIVENESS_CONFIG.map(cfg => ({
            name: cfg.label,
            value: counts[cfg.key] || 0,
            color: cfg.color,
            key: cfg.key
        })).filter(item => item.value > 0);
    }, [filteredActions]);

    // Chart Data 4: Root Cause Categories Breakdown
    const rootCauseData = useMemo(() => {
        const counts: Record<string, number> = {
            PROCESS: 0,
            TRAINING: 0,
            EQUIPMENT: 0,
            PARTS: 0,
            SOFTWARE: 0,
            OTHER: 0
        };

        filteredActions.forEach(a => {
            const text = `${a.title || ''} ${a.description || ''} ${a.rootCause || ''}`.toLowerCase();
            let matched = false;

            for (const cat of ROOT_CAUSE_CATEGORIES) {
                if (cat.key === 'OTHER') continue;
                if (cat.keywords.some(kw => text.includes(kw.toLowerCase()))) {
                    counts[cat.key] += 1;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                counts['OTHER'] += 1;
            }
        });

        return ROOT_CAUSE_CATEGORIES.map(cat => ({
            category: cat.label,
            count: counts[cat.key] || 0,
            key: cat.key
        })).filter(c => c.count > 0);
    }, [filteredActions]);

    // Assignee / Responsible Person Scorecard
    const assigneeScorecard = useMemo(() => {
        const map: Record<string, { assigned: number; completed: number; inProgress: number; overdue: number }> = {};
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        filteredActions.forEach(a => {
            const name = a.responsiblePerson?.trim() || 'نامشخص';
            if (!map[name]) {
                map[name] = { assigned: 0, completed: 0, inProgress: 0, overdue: 0 };
            }
            map[name].assigned += 1;
            if (a.isCompleted) {
                map[name].completed += 1;
            } else {
                map[name].inProgress += 1;
                if (a.dueDate) {
                    try {
                        const dueG = new Date(a.dueDate.includes('/') ? toGregorian(a.dueDate) : a.dueDate);
                        if (dueG < now) {
                            map[name].overdue += 1;
                        }
                    } catch (e) {}
                }
            }
        });

        return Object.entries(map)
            .map(([person, data]) => ({
                person,
                assigned: data.assigned,
                completed: data.completed,
                inProgress: data.inProgress,
                overdue: data.overdue,
                rate: data.assigned > 0 ? Math.round((data.completed / data.assigned) * 100) : 0
            }))
            .sort((a, b) => b.assigned - a.assigned)
            .slice(0, 8);
    }, [filteredActions]);

    // Period Title Display
    const periodDisplayTitle = useMemo(() => {
        switch (periodType) {
            case 'THIS_MONTH': return 'ماه جاری';
            case 'LAST_30': return '۳۰ روز اخیر';
            case 'THIS_SEASON': return 'فصل جاری';
            case 'THIS_YEAR': return 'سال جاری (۱۴۰۵)';
            case 'CUSTOM': return `از ${customStartDate || 'ابتدا'} تا ${customEndDate || 'امروز'}`;
            default: return 'همه دوره‌ها (کل داده‌ها)';
        }
    }, [periodType, customStartDate, customEndDate]);

    // Export to Excel handler
    const handleExportExcel = () => {
        try {
            if (filteredActions.length === 0) {
                if (onSetToast) onSetToast({ message: 'داده‌ای برای خروجی اکسل در بازه انتخابی وجود ندارد', type: 'error' });
                return;
            }

            const exportData = filteredActions.map((action, idx) => ({
                'ردیف': idx + 1,
                'کد اقدام': action.id,
                'عنوان عدم انطباق': action.title || '',
                'واحد / دپارتمان': action.department || 'عمومی',
                'سطح اولویت': PRIORITIES_CONFIG.find(p => p.key === action.priority)?.label || 'متوسط',
                'مسئول اجرا': action.responsiblePerson || '',
                'مسئول تایید': action.verifierPerson || '',
                'ثبت‌کننده': action.registeredBy || '',
                'تاریخ ثبت': action.registrationDate ? toJalali(action.registrationDate) : toJalali(action.createdAt),
                'ساعت ثبت': action.registrationTime || '',
                'مهلت اجرا (Due Date)': toJalali(action.dueDate),
                'تاریخ اجرا واقعی': action.executionDate ? toJalali(action.executionDate) : (action.isCompleted ? 'انجام شده' : ''),
                'وضعیت کلی': action.isCompleted ? 'تکمیل و اجرا شده' : 'در جریان پیگیری',
                'ارزیابی اثربخشی': EFFECTIVENESS_CONFIG.find(e => e.key === action.effectiveness)?.label || 'در انتظار',
                'شرح عدم انطباق': action.description || '',
                'ریشه وقوع مشکل (Root Cause)': action.rootCause || '',
                'برنامه اقدام اصلاحی': action.actionPlan || '',
                'توضیحات و گزارش اجرا': action.executionNotes || '',
                'منابع مورد نیاز': action.resourcesRequired || ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            worksheet['!dir'] = 'rtl';
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'گزارش اقدامات اصلاحی');

            const fileName = `گزارش_اقدامات_اصلاحی_CAPA_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            if (onSetToast) onSetToast({ message: 'فایل اکسل گزارش با موفقیت دانلود شد', type: 'success' });
        } catch (error) {
            console.error('Error generating Excel:', error);
            if (onSetToast) onSetToast({ message: 'خطا در صدور فایل اکسل گزارش', type: 'error' });
        }
    };

    // Copy executive summary text
    const handleCopyExecutiveSummary = () => {
        const text = `📊 خلاصه گزارش مدیریتی اقدامات اصلاحی و بهبود کیفیت (CAPA)
━━━━━━━━━━━━━━━━━━━━
📅 بازه گزارش: ${periodDisplayTitle}
🏢 محدوده: ${selectedDepartment === 'ALL' ? 'تمامی دپارتمان‌ها' : selectedDepartment}
━━━━━━━━━━━━━━━━━━━━
📌 کل اقدامات اصلاحی تعریف‌شده: ${kpis.total} مورد
✅ تکمیل و اجرا شده: ${kpis.completed} مورد (${kpis.completionRate}٪)
⏳ در جریان پیگیری: ${kpis.inProgress} مورد
⚠️ دارای تاخیر از سررسید: ${kpis.overdueCount} مورد
🚨 موارد بحرانی و فوری باز: ${kpis.criticalCount} مورد
━━━━━━━━━━━━━━━━━━━━
🎯 نرخ اثربخشی کیفی: ${kpis.effectivenessRate}٪
⏱ میانگین زمان بستن اقدامات: ${kpis.avgResolutionDays} روز
🌟 نرخ انجام در موعد مقرر: ${kpis.onTimeRate}٪
━━━━━━━━━━━━━━━━━━━━
🏢 وضعیت دپارتمان‌های پرتکرار:
${departmentChartData.slice(0, 4).map(d => `• ${d.fullName}: ${d.completed} از ${d.total} انجام شده (${d.rate}٪)`).join('\n')}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            if (onSetToast) onSetToast({ message: 'خلاصه گزارش مدیریتی در حافظه کپی شد', type: 'success' });
        }
    };

    return (
        <div className="space-y-6">
            
            {/* Filter & Control Bar */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span>داشبورد تحلیلی و مرکز گزارش‌گیری هوشمند CAPA</span>
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                تحلیل بلادرنگ
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            پایش شاخص‌های عملکردی، نرخ اثربخشی، ماتریس دپارتمان‌ها و صدور اسناد رسمی ممیزی
                        </p>
                    </div>

                    {/* Action Buttons: Excel, Print, Copy */}
                    <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                            title="دانلود فایل اکسل داده‌های فیلتر شده"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>خروجی اکسل (XLSX)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsPrintModalOpen(true)}
                            className="flex-1 sm:flex-initial px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                            title="چاپ یا ذخیره PDF گزارش رسمی"
                        >
                            <Printer className="w-4 h-4" />
                            <span>چاپ گزارش رسمی (PDF)</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleCopyExecutiveSummary}
                            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                            title="کپی خلاصه متنی مدیریتی"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">کپی خلاصه</span>
                        </button>
                    </div>
                </div>

                {/* Filter Dimensions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    {/* Period Preset */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" /> بازه زمانی گزارش
                        </label>
                        <select
                            value={periodType}
                            onChange={e => setPeriodType(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                        >
                            <option value="ALL">کل دوره‌ها (همه داده‌ها)</option>
                            <option value="LAST_30">۳۰ روز اخیر</option>
                            <option value="THIS_MONTH">ماه جاری شمسی</option>
                            <option value="THIS_YEAR">سال جاری (۱۴۰۵)</option>
                            <option value="CUSTOM">بازه زمانی دلخواه...</option>
                        </select>
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" /> واحد سازمانی
                        </label>
                        <select
                            value={selectedDepartment}
                            onChange={e => setSelectedDepartment(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                        >
                            <option value="ALL">همه دپارتمان‌ها و واحدها</option>
                            {DEPARTMENTS.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-slate-400" /> سطح اولویت
                        </label>
                        <select
                            value={selectedPriority}
                            onChange={e => setSelectedPriority(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                        >
                            <option value="ALL">همه اولویت‌ها</option>
                            {PRIORITIES_CONFIG.map(p => (
                                <option key={p.key} value={p.key}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Activity className="w-3 h-3 text-slate-400" /> وضعیت اجرا
                        </label>
                        <select
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                        >
                            <option value="ALL">همه وضعیت‌ها</option>
                            <option value="COMPLETED">تکمیل و اجرا شده</option>
                            <option value="IN_PROGRESS">در جریان پیگیری</option>
                            <option value="OVERDUE">دارای تاخیر از مهلت</option>
                        </select>
                    </div>

                    {/* Effectiveness */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Award className="w-3 h-3 text-slate-400" /> ارزیابی اثربخشی
                        </label>
                        <select
                            value={selectedEffectiveness}
                            onChange={e => setSelectedEffectiveness(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                        >
                            <option value="ALL">همه سطوح اثربخشی</option>
                            {EFFECTIVENESS_CONFIG.map(e => (
                                <option key={e.key} value={e.key}>{e.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Custom Date Pickers Row if CUSTOM is selected */}
                {periodType === 'CUSTOM' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">از تاریخ (شمسی)</label>
                            <PersianDatePicker
                                value={customStartDate}
                                onChange={setCustomStartDate}
                                placeholder="تاریخ شروع گزارش"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">تا تاریخ (شمسی)</label>
                            <PersianDatePicker
                                value={customEndDate}
                                onChange={setCustomEndDate}
                                placeholder="تاریخ پایان گزارش"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Executive KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* 1. Total */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[11px] font-bold">کل اقدامات بازه</span>
                        <Layers className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                        {kpis.total.toLocaleString('fa-IR')}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">مجموع عدم انطباق‌ها</span>
                </div>

                {/* 2. Completion Rate */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                        <span className="text-[11px] font-bold">نرخ تحقق (تکمیل)</span>
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                        {kpis.completionRate}%
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">{kpis.completed} مورد اجرا شده</span>
                </div>

                {/* 3. On-Time Rate */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-sky-200 dark:border-sky-900/50 shadow-xs">
                    <div className="flex items-center justify-between text-sky-600 dark:text-sky-400 mb-2">
                        <span className="text-[11px] font-bold">انجام در موعد مقرر</span>
                        <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black font-mono text-sky-700 dark:text-sky-300">
                        {kpis.onTimeRate}%
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">رعایت سررسید Due Date</span>
                </div>

                {/* 4. Quality Effectiveness Rate */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50 shadow-xs">
                    <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
                        <span className="text-[11px] font-bold">نرخ اثربخشی کیفی</span>
                        <Award className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black font-mono text-purple-700 dark:text-purple-300">
                        {kpis.effectivenessRate}%
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">تایید عدم تکرار مشکل</span>
                </div>

                {/* 5. Average Resolution Days */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs">
                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                        <span className="text-[11px] font-bold">میانگین زمان حل</span>
                        <Activity className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-300">
                        {kpis.avgResolutionDays} <span className="text-xs font-normal">روز</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">سرعت عمل در پیگیری</span>
                </div>

                {/* 6. Overdue / Critical Risk */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs">
                    <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
                        <span className="text-[11px] font-bold">موارد دارای تاخیر</span>
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black font-mono text-rose-700 dark:text-rose-300">
                        {kpis.overdueCount.toLocaleString('fa-IR')}
                    </div>
                    <span className="text-[10px] text-rose-500 font-bold mt-1 block">{kpis.criticalCount} مورد بحرانی باز</span>
                </div>
            </div>

            {/* Visual Analytics Charts (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Chart 1: Department Performance Bar Chart */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-indigo-500" />
                                <span>توزیع و وضعیت اقدامات به تفکیک دپارتمان‌ها</span>
                            </h4>
                            <span className="text-[10px] text-slate-400">مقایسه اقدامات کل، تکمیل‌شده و در جریان</span>
                        </div>
                    </div>

                    <div className="h-64 w-full" dir="ltr">
                        {departmentChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                    <XAxis dataKey="department" angle={-25} textAnchor="end" tick={{ fontSize: 9, fill: '#64748b' }} interval={0} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip 
                                        formatter={(val: any, name: any) => {
                                            const labels: Record<string, string> = {
                                                completed: 'اجرا شده',
                                                inProgress: 'در جریان',
                                                overdue: 'دارای تاخیر',
                                                total: 'کل اقدامات'
                                            };
                                            return [val, labels[name] || name];
                                        }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px', direction: 'rtl' }}
                                    />
                                    <Legend 
                                        formatter={(value) => {
                                            const labels: Record<string, string> = {
                                                completed: 'تکمیل شده',
                                                inProgress: 'در جریان',
                                                overdue: 'دارای تاخیر'
                                            };
                                            return <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{labels[value] || value}</span>;
                                        }}
                                    />
                                    <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="completed" />
                                    <Bar dataKey="inProgress" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="inProgress" />
                                    <Bar dataKey="overdue" fill="#f43f5e" radius={[4, 4, 0, 0]} name="overdue" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                داده‌ای برای رسم نمودار در بازه انتخابی وجود ندارد.
                            </div>
                        )}
                    </div>
                </div>

                {/* Chart 2: Priority & Effectiveness Donut Charts */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4 text-amber-500" />
                                <span>ماتریس ریسک، اولویت و ارزیابی اثربخشی</span>
                            </h4>
                            <span className="text-[10px] text-slate-400">سهم درصدی سطوح بحرانی و نتایج ارزیابی کیفی</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-64">
                        {/* Priority Pie */}
                        <div className="flex flex-col items-center justify-center" dir="ltr">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">سطح اولویت / فوریت</span>
                            {priorityPieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={170}>
                                    <PieChart>
                                        <Pie
                                            data={priorityPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={42}
                                            outerRadius={65}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {priorityPieData.map((entry, index) => (
                                                <Cell key={`cell-p-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '10px', direction: 'rtl' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-36 flex items-center justify-center text-xs text-slate-400">بدون داده</div>
                            )}
                            <div className="flex flex-wrap justify-center gap-2 text-[9px] font-bold mt-1">
                                {priorityPieData.map(p => (
                                    <span key={p.key} className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                                        <span>{p.name}: {p.value}</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Effectiveness Pie */}
                        <div className="flex flex-col items-center justify-center" dir="ltr">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">ارزیابی اثربخشی</span>
                            {effectivenessPieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={170}>
                                    <PieChart>
                                        <Pie
                                            data={effectivenessPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={42}
                                            outerRadius={65}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {effectivenessPieData.map((entry, index) => (
                                                <Cell key={`cell-e-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '10px', direction: 'rtl' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-36 flex items-center justify-center text-xs text-slate-400">بدون داده</div>
                            )}
                            <div className="flex flex-wrap justify-center gap-2 text-[9px] font-bold mt-1">
                                {effectivenessPieData.map(e => (
                                    <span key={e.key} className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }}></span>
                                        <span>{e.name}: {e.value}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart 3: Root Cause Pareto Breakdown */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-purple-500" />
                            <span>تحلیل ریشه‌ای و علل وقوع عدم انطباق‌ها (Root Cause Analysis)</span>
                        </h4>
                        <span className="text-[10px] text-slate-400">شناسایی گلوگاه‌ها جهت اقدامات پیشگیرانه</span>
                    </div>

                    <div className="space-y-2.5">
                        {rootCauseData.map(rc => {
                            const percent = kpis.total > 0 ? Math.round((rc.count / kpis.total) * 100) : 0;
                            return (
                                <div key={rc.key} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <span>{rc.category}</span>
                                        <span className="font-mono text-indigo-600 dark:text-indigo-400">{rc.count} مورد ({percent}٪)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500" 
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                        {rootCauseData.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-6">موردی برای تحلیل ریشه یافت نشد.</p>
                        )}
                    </div>
                </div>

                {/* Chart 4: Assignee Performance Scorecard */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                            <User className="w-4 h-4 text-emerald-500" />
                            <span>کارنامه عملکرد مسئولین پیگیری و اجرا</span>
                        </h4>
                        <span className="text-[10px] text-slate-400">تعداد ارجاعات، نرخ تکمیل و سرعت رسیدگی</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 text-[10px]">
                                    <th className="pb-2">نام مسئول</th>
                                    <th className="pb-2 text-center">ارجاعات</th>
                                    <th className="pb-2 text-center">انجام شده</th>
                                    <th className="pb-2 text-center">در جریان</th>
                                    <th className="pb-2 text-center">دارای تاخیر</th>
                                    <th className="pb-2 text-center">نرخ تحقق</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {assigneeScorecard.map((item, idx) => (
                                    <tr key={item.person} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="py-2.5 font-bold text-slate-800 dark:text-white">{item.person}</td>
                                        <td className="py-2.5 text-center font-mono">{item.assigned}</td>
                                        <td className="py-2.5 text-center font-mono text-emerald-600 font-bold">{item.completed}</td>
                                        <td className="py-2.5 text-center font-mono text-sky-600">{item.inProgress}</td>
                                        <td className="py-2.5 text-center font-mono text-rose-600 font-bold">{item.overdue}</td>
                                        <td className="py-2.5 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                item.rate >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                                item.rate >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                                'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                            }`}>
                                                {item.rate}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {assigneeScorecard.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-6 text-center text-slate-400">اطلاعاتی موجود نیست.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Department Master Scorecard Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3 p-5">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-indigo-600" />
                            <span>جدول جامع ماتریس کیفیت و انطباق دپارتمان‌های سازمانی (CAPA Scorecard)</span>
                        </h4>
                        <span className="text-[10px] text-slate-400">تفکیک شاخص‌ها، اثربخشی و وضعیت کیفی هر دپارتمان</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold border-b border-slate-200 dark:border-slate-700">
                                <th className="p-3">واحد / دپارتمان</th>
                                <th className="p-3 text-center">کل عدم انطباق‌ها</th>
                                <th className="p-3 text-center">تکمیل شده</th>
                                <th className="p-3 text-center">در جریان</th>
                                <th className="p-3 text-center">دارای تاخیر</th>
                                <th className="p-3 text-center">نرخ تحقق</th>
                                <th className="p-3 text-center">اثربخشی قطعی</th>
                                <th className="p-3 text-center">وضعیت شاخص</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {departmentChartData.map(dept => {
                                const isHighRisk = dept.overdue > 0 || (dept.rate < 60 && dept.total >= 3);
                                return (
                                    <tr key={dept.fullName} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                                        <td className="p-3 font-bold text-slate-800 dark:text-white">{dept.fullName}</td>
                                        <td className="p-3 text-center font-mono font-bold">{dept.total}</td>
                                        <td className="p-3 text-center font-mono text-emerald-600 font-bold">{dept.completed}</td>
                                        <td className="p-3 text-center font-mono text-sky-600">{dept.inProgress}</td>
                                        <td className="p-3 text-center font-mono text-rose-600 font-bold">{dept.overdue}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="font-mono font-bold">{dept.rate}%</span>
                                                <div className="w-12 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                                    <div 
                                                        className={`h-full rounded-full ${
                                                            dept.rate >= 80 ? 'bg-emerald-500' : dept.rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`}
                                                        style={{ width: `${dept.rate}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center font-mono text-purple-600 font-bold">{dept.effective}</td>
                                        <td className="p-3 text-center">
                                            {dept.rate >= 80 && dept.overdue === 0 ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                    عالی و منطبق
                                                </span>
                                            ) : isHighRisk ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                    نیازمند توجه فوری
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                    در حال بهبود
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {departmentChartData.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">هیچ داده‌ای برای دپارتمان‌ها در فیلتر انتخابی موجود نیست.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Printable Official Document Modal */}
            <CorrectiveActionsPrintReport
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                actions={filteredActions}
                reportPeriodTitle={periodDisplayTitle}
                filterDeptTitle={selectedDepartment === 'ALL' ? 'تمامی دپارتمان‌ها و واحدها' : selectedDepartment}
            />

        </div>
    );
};
