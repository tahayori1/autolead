import React, { useState, useEffect, useMemo } from 'react';
import { 
    CommissionDeal, 
    CommissionPeriod, 
    CommissionCategory,
    CommissionPaymentStatus, 
    CarYardItem,
    CommissionUserRole,
    CommissionSettings,
    User 
} from '../types';
import { 
    getCommissionPeriods, 
    saveCommissionPeriods, 
    getCommissionDeals, 
    saveCommissionDeals,
    getCarYardItems,
    saveCarYardItems,
    deleteCommissionPeriod,
    clearPeriodDeals,
    clearAllCommissionData,
    resetCommissionDataToDefaults,
    loadSampleCommissionData,
    parseSalesPersons,
    getCommissionSettings,
    saveCommissionSettings
} from '../services/commissionService';
import { 
    exportFullCommissionWorkbook, 
    exportSingleCategoryXLSX 
} from '../services/commissionExcelExport';
import { getUsers } from '../services/api';
import { CommissionDealModal } from '../components/commission/CommissionDealModal';
import { CommissionExcelImportModal } from '../components/commission/CommissionExcelImportModal';
import { CommissionSettingsModal } from '../components/commission/CommissionSettingsModal';
import { CommissionPersonnelReport } from '../components/commission/CommissionPersonnelReport';
import { CommissionMultiFactorCalculator } from '../components/commission/CommissionMultiFactorCalculator';
import { CommissionCarYardLedger } from '../components/commission/CommissionCarYardLedger';
import { CommissionSalesAnalytics } from '../components/commission/CommissionSalesAnalytics';

// Role-based views & Reports Modal
import { CommissionCeoView } from '../components/commission/roles/CommissionCeoView';
import { CommissionSalesManagerView } from '../components/commission/roles/CommissionSalesManagerView';
import { CommissionFinanceView } from '../components/commission/roles/CommissionFinanceView';
import { CommissionStaffView } from '../components/commission/roles/CommissionStaffView';
import { CommissionRoleReportsModal, ReportRoleType } from '../components/commission/roles/CommissionRoleReportsModal';

import { 
    Calculator, 
    Table, 
    Users, 
    FileSpreadsheet, 
    Download, 
    Upload, 
    Plus, 
    Search, 
    Filter, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    Printer, 
    RotateCcw, 
    Trash2, 
    Edit, 
    Calendar,
    Layers,
    Building2,
    Repeat,
    FileText,
    CreditCard,
    ClipboardList,
    TrendingUp,
    TrendingDown,
    Share2,
    Car,
    Warehouse,
    ShieldCheck,
    Trophy,
    Crown,
    Star,
    Award,
    Landmark,
    Briefcase,
    UserCheck,
    FileCheck2,
    SlidersHorizontal,
    AlertOctagon,
    Sparkles,
    X
} from 'lucide-react';

type MainPerspective = 'CEO' | 'SALES_MANAGER' | 'FINANCE_MANAGER' | 'STAFF' | 'OPERATIONS';
type ActiveSheetTab = 'analytics' | 'summary' | 'ANBAR' | 'AZAD' | 'HAVALEH' | 'LEASING' | 'REGISTRATION' | 'yard' | 'all' | 'calculator';

const CommissionPage: React.FC = () => {
    // --- States ---
    const [currentPerspective, setCurrentPerspective] = useState<MainPerspective>('CEO');
    const [activeTab, setActiveTab] = useState<ActiveSheetTab>('analytics');
    const [periods, setPeriods] = useState<CommissionPeriod[]>([]);
    const [activePeriodId, setActivePeriodId] = useState<string>('1405-05');
    const [deals, setDeals] = useState<CommissionDeal[]>([]);
    const [yardItems, setYardItems] = useState<CarYardItem[]>([]);
    const [crmUsers, setCrmUsers] = useState<User[]>([]);

    // Currency mode: Rials (Excel raw) or Tomans
    const [currencyUnit, setCurrencyUnit] = useState<'RIAL' | 'TOMAN'>('RIAL');

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPersonnel, setSelectedPersonnel] = useState<string>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
    const [selectedCarModel, setSelectedCarModel] = useState<string>('ALL');

    // Modals
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState<CommissionDeal | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // Commission Rates Settings
    const [commissionSettings, setCommissionSettings] = useState<CommissionSettings>(() => getCommissionSettings());

    // Role Reports Modal
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [activeReportRole, setActiveReportRole] = useState<ReportRoleType>('CEO');
    const [reportTargetStaff, setReportTargetStaff] = useState<string>('درسا محمدی');

    // New Period Modal
    const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false);
    const [newPeriodTitle, setNewPeriodTitle] = useState('');

    // Period Manager & Cleanup Modal
    const [isPeriodManagerOpen, setIsPeriodManagerOpen] = useState(false);

    // Load initial data
    useEffect(() => {
        const loadedPeriods = getCommissionPeriods();
        const loadedDeals = getCommissionDeals();
        const loadedYard = getCarYardItems();

        setPeriods(loadedPeriods);
        setDeals(loadedDeals);
        setYardItems(loadedYard);

        if (loadedPeriods.length > 0 && !loadedPeriods.some(p => p.id === activePeriodId)) {
            setActivePeriodId(loadedPeriods[0].id);
        }

        // Fetch CRM users for autocomplete
        getUsers().then(users => {
            if (Array.isArray(users)) setCrmUsers(users);
        }).catch(() => {
            // Safe fallback
        });
    }, []);

    // Save deals whenever updated
    const handleUpdateDeals = (newDeals: CommissionDeal[]) => {
        setDeals(newDeals);
        saveCommissionDeals(newDeals);
    };

    // Save yard items
    const handleUpdateYardItems = (newYard: CarYardItem[]) => {
        setYardItems(newYard);
        saveCarYardItems(newYard);
    };

    // Save commission settings
    const handleSaveSettings = (newSettings: CommissionSettings) => {
        setCommissionSettings(newSettings);
        saveCommissionSettings(newSettings);
    };

    // Current active period object
    const activePeriod = useMemo(() => {
        return periods.find(p => p.id === activePeriodId) || (periods.length > 0 ? periods[0] : { id: '', title: 'بدون دوره مالی' });
    }, [periods, activePeriodId]);

    // Save adjustments to current period
    const handleSaveAdjustments = (adjustments: Record<string, { bonus: number; deductions: number; notes?: string }>) => {
        const updated = periods.map(p => {
            if (p.id === activePeriodId) {
                return { ...p, adjustments };
            }
            return p;
        });
        setPeriods(updated);
        saveCommissionPeriods(updated);
    };

    // Handle Role Approvals Workflow
    const handleApproveRole = (role: 'CEO' | 'SALES_MANAGER' | 'FINANCE_MANAGER') => {
        const updated = periods.map(p => {
            if (p.id === activePeriodId) {
                const currentApp = { ...(p.approvals || {}) };
                const now = new Date().toISOString();
                if (role === 'CEO') {
                    currentApp.ceoApproved = !currentApp.ceoApproved;
                    currentApp.ceoApprovedAt = currentApp.ceoApproved ? now : undefined;
                    currentApp.ceoApprovedBy = currentApp.ceoApproved ? 'مدیرعامل محترم' : undefined;
                } else if (role === 'SALES_MANAGER') {
                    currentApp.salesApproved = !currentApp.salesApproved;
                    currentApp.salesApprovedAt = currentApp.salesApproved ? now : undefined;
                    currentApp.salesApprovedBy = currentApp.salesApproved ? 'مدیر فروش' : undefined;
                } else if (role === 'FINANCE_MANAGER') {
                    currentApp.financeApproved = !currentApp.financeApproved;
                    currentApp.financeApprovedAt = currentApp.financeApproved ? now : undefined;
                    currentApp.financeApprovedBy = currentApp.financeApproved ? 'مدیر مالی' : undefined;
                    if (currentApp.financeApproved && !currentApp.voucherNumber) {
                        currentApp.voucherNumber = `VCH-${p.id.replace('-', '')}-01`;
                    }
                }
                return { ...p, approvals: currentApp };
            }
            return p;
        });
        setPeriods(updated);
        saveCommissionPeriods(updated);
    };

    // Deals for active period
    const periodDeals = useMemo(() => {
        return deals.filter(d => d.periodId === activePeriodId);
    }, [deals, activePeriodId]);

    // Open report modal helper
    const handleOpenPrintReport = (type: ReportRoleType, staffName?: string) => {
        setActiveReportRole(type);
        if (staffName) setReportTargetStaff(staffName);
        setIsReportModalOpen(true);
    };


    // Top performers summary for top banner highlights
    const topPerformersHighlight = useMemo(() => {
        const counts: Record<string, number> = {};
        const volumes: Record<string, number> = {};
        const profits: Record<string, number> = {};

        periodDeals.forEach(deal => {
            const persons = deal.sharedPersons && deal.sharedPersons.length > 0 
                ? deal.sharedPersons 
                : parseSalesPersons(deal.salesPerson);
            const share = 1 / (persons.length || 1);
            const volume = (deal.salePrice || deal.downPayment || 0) * share;
            const profit = (deal.grossProfit !== undefined ? deal.grossProfit : (deal.dailyProfitLoss || 0)) * share;

            persons.forEach(p => {
                counts[p] = (counts[p] || 0) + share;
                volumes[p] = (volumes[p] || 0) + volume;
                profits[p] = (profits[p] || 0) + profit;
            });
        });

        const topCountPerson = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
        const topVolumePerson = Object.entries(volumes).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
        const topProfitPerson = Object.entries(profits).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

        return {
            topCount: { name: topCountPerson[0], value: topCountPerson[1] },
            topVolume: { name: topVolumePerson[0], value: topVolumePerson[1] },
            topProfit: { name: topProfitPerson[0], value: topProfitPerson[1] }
        };
    }, [periodDeals]);

    // Distinct list of personnel in active period
    const personnelList = useMemo(() => {
        const set = new Set<string>();
        periodDeals.forEach(d => {
            if (d.salesPerson) {
                d.salesPerson.split(/[/،+&]/).forEach(p => set.add(p.trim()));
            }
            if (d.contractWriter) set.add(d.contractWriter.trim());
        });
        return Array.from(set).sort();
    }, [periodDeals]);

    // Distinct list of car models in active period
    const carModelList = useMemo(() => {
        const set = new Set<string>();
        periodDeals.forEach(d => {
            if (d.carModel) set.add(d.carModel);
        });
        return Array.from(set).sort();
    }, [periodDeals]);

    // Filtered deals according to current tab & filters
    const filteredDeals = useMemo(() => {
        return periodDeals.filter(deal => {
            // Category filter if in specific sheet tab
            if (activeTab === 'ANBAR' && deal.category !== 'ANBAR') return false;
            if (activeTab === 'AZAD' && deal.category !== 'AZAD') return false;
            if (activeTab === 'HAVALEH' && deal.category !== 'HAVALEH') return false;
            if (activeTab === 'LEASING' && deal.category !== 'LEASING') return false;
            if (activeTab === 'REGISTRATION' && deal.category !== 'REGISTRATION') return false;

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = (deal.customerName || '').toLowerCase().includes(q) || (deal.buyerName || '').toLowerCase().includes(q) || (deal.sellerName || '').toLowerCase().includes(q);
                const matchPerson = (deal.salesPerson || '').toLowerCase().includes(q) || (deal.contractWriter || '').toLowerCase().includes(q);
                const matchCar = (deal.carModel || '').toLowerCase().includes(q);
                const matchNotes = (deal.paymentNotes || '').toLowerCase().includes(q);
                if (!matchName && !matchPerson && !matchCar && !matchNotes) return false;
            }

            // Filter Personnel
            if (selectedPersonnel !== 'ALL') {
                const isMatch = (deal.salesPerson || '').includes(selectedPersonnel) || (deal.contractWriter || '').includes(selectedPersonnel);
                if (!isMatch) return false;
            }

            // Filter Status
            if (selectedStatus !== 'ALL') {
                if (deal.paymentStatus !== selectedStatus) return false;
            }

            // Filter Car Model
            if (selectedCarModel !== 'ALL') {
                if (deal.carModel !== selectedCarModel) return false;
            }

            return true;
        });
    }, [periodDeals, activeTab, searchQuery, selectedPersonnel, selectedStatus, selectedCarModel]);

    // Financial Metrics for Active Period & Tab
    const metrics = useMemo(() => {
        const divisor = currencyUnit === 'TOMAN' ? 10 : 1;

        let totalPurchase = 0;
        let totalDailyPrice = 0;
        let totalSales = 0;
        let totalDailyProfitLoss = 0;
        let totalGrossProfit = 0;
        let totalCommission = 0;
        let totalPaidCommission = 0;

        filteredDeals.forEach(d => {
            totalPurchase += d.purchasePrice || 0;
            totalDailyPrice += d.dailyPrice || 0;
            totalSales += d.salePrice || (d.downPayment || 0);
            totalDailyProfitLoss += d.dailyProfitLoss || 0;
            totalGrossProfit += d.grossProfit || 0;
            totalCommission += d.commissionAmount || 0;

            if (d.paymentStatus === 'PAID') {
                totalPaidCommission += d.paidCommissionShare ?? d.commissionAmount;
            } else if (d.paymentStatus === 'PARTIAL') {
                totalPaidCommission += d.paidCommissionShare ?? 0;
            }
        });

        const pendingCommission = Math.max(0, totalCommission - totalPaidCommission);
        const payoutPercentage = totalCommission > 0 ? Math.round((totalPaidCommission / totalCommission) * 100) : 0;

        return {
            totalDealsCount: filteredDeals.length,
            totalPurchase: Math.round(totalPurchase / divisor),
            totalDailyPrice: Math.round(totalDailyPrice / divisor),
            totalSales: Math.round(totalSales / divisor),
            totalDailyProfitLoss: Math.round(totalDailyProfitLoss / divisor),
            totalGrossProfit: Math.round(totalGrossProfit / divisor),
            totalCommission: Math.round(totalCommission / divisor),
            totalPaidCommission: Math.round(totalPaidCommission / divisor),
            pendingCommission: Math.round(pendingCommission / divisor),
            payoutPercentage,
            divisor,
            unitLabel: currencyUnit === 'TOMAN' ? 'تومان' : 'ریال'
        };
    }, [filteredDeals, currencyUnit]);

    // Handle Save Single Deal
    const handleSaveDeal = (deal: CommissionDeal) => {
        let updated: CommissionDeal[];
        const exists = deals.some(d => d.id === deal.id);
        if (exists) {
            updated = deals.map(d => d.id === deal.id ? deal : d);
        } else {
            updated = [deal, ...deals];
        }
        handleUpdateDeals(updated);
        setEditingDeal(null);
    };

    // Handle Delete Single Deal
    const handleDeleteDeal = (id: string) => {
        if (!confirm('آیا از حذف این ردیف کمیسیون و معامله اطمینان دارید؟')) return;
        const updated = deals.filter(d => d.id !== id);
        handleUpdateDeals(updated);
    };

    // Handle Quick Payment Status Toggle
    const handleTogglePaymentStatus = (id: string) => {
        const deal = deals.find(d => d.id === id);
        if (!deal) return;

        let nextStatus: CommissionPaymentStatus = 'PAID';
        if (deal.paymentStatus === 'PAID') nextStatus = 'PENDING';
        else if (deal.paymentStatus === 'PENDING') nextStatus = 'PARTIAL';
        else if (deal.paymentStatus === 'PARTIAL') nextStatus = 'PAID';

        const updated = deals.map(d => {
            if (d.id === id) {
                return {
                    ...d,
                    paymentStatus: nextStatus,
                    paymentDate: nextStatus === 'PAID' ? (d.paymentDate || d.saleDate) : d.paymentDate,
                    paidCommissionShare: nextStatus === 'PAID' ? d.commissionAmount : (nextStatus === 'PENDING' ? 0 : d.paidCommissionShare)
                };
            }
            return d;
        });

        handleUpdateDeals(updated);
    };

    // Handle Excel Import (Supports multi-sheet XLSX, precise target period, append or replace)
    const handleImportDeals = (importedDeals: CommissionDeal[], targetPeriodId: string, replaceExisting?: boolean) => {
        let updated: CommissionDeal[];
        if (replaceExisting) {
            const otherPeriodDeals = deals.filter(d => d.periodId !== targetPeriodId);
            updated = [...importedDeals, ...otherPeriodDeals];
        } else {
            updated = [...importedDeals, ...deals];
        }
        handleUpdateDeals(updated);
        setActivePeriodId(targetPeriodId);
    };

    // Helper for inline period creation inside modals
    const handleAddNewPeriodInline = (title: string): string => {
        const newId = `1405-${periods.length + 1 < 10 ? '0' : ''}${periods.length + 1}`;
        const newPeriod: CommissionPeriod = {
            id: newId,
            title: title.trim()
        };
        const updated = [newPeriod, ...periods];
        setPeriods(updated);
        saveCommissionPeriods(updated);
        setActivePeriodId(newId);
        return newId;
    };

    // Delete single period
    const handleDeletePeriod = (periodIdToDelete: string, deleteDeals: boolean = true) => {
        const res = deleteCommissionPeriod(periodIdToDelete, deleteDeals);
        setPeriods(res.periods);
        if (deleteDeals) {
            setDeals(res.deals);
        }
        if (activePeriodId === periodIdToDelete) {
            setActivePeriodId(res.periods.length > 0 ? res.periods[0].id : '');
        }
    };

    // Clear all deals of a period
    const handleClearPeriodDeals = (periodIdToClear: string) => {
        const updated = clearPeriodDeals(periodIdToClear);
        setDeals(updated);
    };

    // Purge/Clear everything
    const handlePurgeAll = () => {
        if (!confirm('آیا از پاکسازی کامل تمام دوره‌ها و معاملات اطمینان دارید؟ تمام داده‌ها حذف خواهند شد.')) return;
        const res = clearAllCommissionData();
        setPeriods(res.periods);
        setDeals(res.deals);
        setYardItems(res.yard);
        setActivePeriodId('');
        setIsPeriodManagerOpen(false);
    };

    // Handle Comprehensive Multi-Sheet XLSX Export
    const handleExportFullXLSX = () => {
        if (deals.length === 0) {
            alert('هیچ معامله‌ای در سیستم برای خروجی اکسل وجود ندارد.');
            return;
        }

        exportFullCommissionWorkbook({
            deals,
            periods,
            activePeriodId: activePeriodId || undefined,
            yardItems
        });
    };

    // Handle Current Sheet XLSX Export
    const handleExportCurrentSheetXLSX = () => {
        if (filteredDeals.length === 0) {
            alert('هیچ معامله‌ای در این بخش برای خروجی اکسل وجود ندارد.');
            return;
        }

        exportSingleCategoryXLSX(
            filteredDeals,
            activeTab,
            activePeriod.title || 'دوره_مالی'
        );
    };

    // Handle Export to CSV (Excel format)
    const handleExportCSV = () => {
        if (filteredDeals.length === 0) {
            alert('هیچ معامله‌ای برای خروجی وجود ندارد.');
            return;
        }

        const headers = [
            'ردیف',
            'دسته‌بندی',
            'تاریخ فروش',
            'نام پرسنل فروش',
            'نام خریدار / مشتری',
            'نام فروشنده',
            'مدل خودرو',
            'نرخ خرید (ریال)',
            'قیمت روز (ریال)',
            'نرخ فروش / پیش پرداخت (ریال)',
            'سود یا زیان روز (ریال)',
            'کمیسیون کل / سود ناخالص',
            'پورسانت کل (ریال)',
            'وضعیت واریز',
            'توضیحات واریز'
        ];

        const rows = filteredDeals.map((d, index) => [
            index + 1,
            `"${d.category === 'ANBAR' ? 'فروش انبار' : d.category === 'AZAD' ? 'فروش آزاد' : d.category === 'HAVALEH' ? 'فروش حواله' : d.category === 'LEASING' ? 'لیزینگ' : 'ثبت نام'}"`,
            `"${d.saleDate || ''}"`,
            `"${d.salesPerson || ''}"`,
            `"${d.customerName || d.buyerName || ''}"`,
            `"${d.sellerName || ''}"`,
            `"${d.carModel || ''}"`,
            d.purchasePrice || 0,
            d.dailyPrice || 0,
            d.salePrice || d.downPayment || 0,
            d.dailyProfitLoss || 0,
            d.grossProfit || 0,
            d.commissionAmount || 0,
            `"${d.paymentStatus === 'PAID' ? 'واریز شد' : d.paymentStatus === 'PARTIAL' ? 'علی‌الحساب' : 'در انتظار'}"`,
            `"${(d.paymentNotes || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = '\uFEFF' + [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `commission_${activeTab}_${(activePeriod.title || 'export').replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Reset to empty default
    const handleResetDefaults = () => {
        if (!confirm('آیا از پاکسازی تمام دوره‌ها و اطلاعات اطمینان دارید؟ تمام داده‌ها حذف شده و سیستم به حالت خالی برمی‌گردد.')) return;
        const res = resetCommissionDataToDefaults();
        setPeriods(res.periods);
        setDeals(res.deals);
        setYardItems(res.yard);
        setActivePeriodId('');
    };

    // Load sample demo data on demand
    const handleLoadSampleData = () => {
        if (!confirm('آیا مایلید فایل‌های نمونه اکسل تیر و مرداد ماه به عنوان داده‌های آزمایشی بارگذاری شوند؟')) return;
        const res = loadSampleCommissionData();
        setPeriods(res.periods);
        setDeals(res.deals);
        setYardItems(res.yard);
        setActivePeriodId('1405-05');
    };

    // Add New Period
    const handleCreatePeriod = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPeriodTitle.trim()) return;

        const newId = `1405-${periods.length + 1 < 10 ? '0' : ''}${periods.length + 1}`;
        const newPeriod: CommissionPeriod = {
            id: newId,
            title: newPeriodTitle.trim()
        };

        const updated = [newPeriod, ...periods];
        setPeriods(updated);
        saveCommissionPeriods(updated);
        setActivePeriodId(newId);
        setNewPeriodTitle('');
        setIsNewPeriodModalOpen(false);
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-24" dir="rtl">
            
            {/* Header with Title, Top Performer Quick Badges & Currency Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                                سیستم استاندارد کمیسیون و ارزیابی تیم فروش
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                شناسایی فروشندگان برتر و سودآور
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            ثبت سریع معاملات، محاسبه آنی سودآوری و پورسانت، رتبه‌بندی مشاوران و صدور فیش‌های مالی
                        </p>
                    </div>
                </div>

                {/* Right controls: Top Highlights, Currency Switch, Quick Add Deal, XLSX Upload */}
                <div className="flex flex-wrap items-center gap-2.5">
                    
                    {/* Upload XLSX Button */}
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-black rounded-2xl shadow-sm transition-all flex items-center gap-2"
                        title="آپلود و خواندن فایل اکسل (xlsx.) با پشتیبانی از چندین شیت و جدول"
                    >
                        <Upload className="w-4 h-4 text-emerald-600" />
                        ورود اکسل (XLSX)
                    </button>

                    {/* Full XLSX Export Button in Top Header */}
                    <button
                        onClick={handleExportFullXLSX}
                        className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 text-xs font-black rounded-2xl shadow-sm transition-all flex items-center gap-2"
                        title="دانلود خروجی کامل کلیه شیت‌ها، معاملات و کارنامه پرسنل در یک فایل اکسل جامع (.xlsx)"
                    >
                        <Download className="w-4 h-4 text-emerald-600" />
                        خروجی کامل اکسل (XLSX)
                    </button>

                    {/* Commission Rates Settings Button */}
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-xs font-black rounded-2xl shadow-sm transition-all flex items-center gap-2"
                        title="تنظیمات درصدهای پورسانت برای شیت‌ها و دسته‌بندی‌های مختلف معامله"
                    >
                        <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                        تنظیمات درصدها
                    </button>

                    {/* Quick Add Deal Button */}
                    <button
                        onClick={() => {
                            setEditingDeal(null);
                            setIsDealModalOpen(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        ثبت معامله جدید کارمند
                    </button>

                    {/* Currency Unit Switch */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setCurrencyUnit('RIAL')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                currencyUnit === 'RIAL'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            ریال (اکسل)
                        </button>
                        <button
                            onClick={() => setCurrencyUnit('TOMAN')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                currencyUnit === 'TOMAN'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            تومان
                        </button>
                    </div>

                    <button
                        onClick={handleResetDefaults}
                        title="بازنشانی داده‌ها به فایل اکسل پیش‌فرض تیر و مرداد"
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Period Tabs & Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                {/* Period Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5" />
                        دوره مالی:
                    </span>
                    {periods.length === 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap">
                                <AlertCircle className="w-3.5 h-3.5" />
                                هیچ دوره‌ای تعریف نشده است
                            </span>
                            <button
                                onClick={() => setIsNewPeriodModalOpen(true)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all flex items-center gap-1 whitespace-nowrap"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                ایجاد اولین دوره
                            </button>
                        </div>
                    ) : (
                        periods.map(period => (
                            <button
                                key={period.id}
                                onClick={() => setActivePeriodId(period.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                    activePeriodId === period.id
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                {period.title}
                            </button>
                        ))
                    )}
                    
                    {periods.length > 0 && (
                        <>
                            <button
                                onClick={() => setIsNewPeriodModalOpen(true)}
                                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors flex items-center gap-1 whitespace-nowrap"
                                title="ایجاد دوره مالی جدید"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                دوره جدید
                            </button>
                            <button
                                onClick={() => setIsPeriodManagerOpen(true)}
                                className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                                title="مدیریت، پاکسازی و حذف دوره‌ها"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                مدیریت و پاکسازی دوره‌ها
                            </button>
                        </>
                    )}
                </div>

                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-3 flex items-center gap-3">
                    <span>کل معاملات: <b className="font-mono text-emerald-600">{periodDeals.length}</b></span>
                    {topPerformersHighlight.topProfit.name !== '-' && (
                        <span className="text-amber-600 dark:text-amber-400">
                            👑 سودآورترین: <b>{topPerformersHighlight.topProfit.name}</b>
                        </span>
                    )}
                </div>
            </div>

            {/* Organizational Role & Perspective Switcher Bar */}
            <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    <span className="text-xs font-black text-slate-400 px-3 flex items-center gap-1.5 whitespace-nowrap">
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                        سمت سازمانی / فیلتر دسترسی:
                    </span>

                    {[
                        { id: 'CEO', label: '👔 دیدگاه مدیر عامل', desc: 'سودآوری کل و مارجین شرکت' },
                        { id: 'SALES_MANAGER', label: '📊 دیدگاه مدیر فروش', desc: 'تارگت، لیدربورد و پاداش' },
                        { id: 'FINANCE_MANAGER', label: '💳 دیدگاه مدیر مالی', desc: 'تسویه، سند حسابداری و پایا' },
                        { id: 'STAFF', label: '👤 کارنامه پرسنل فروش', desc: 'فیش انفرادی و ریز قراردادها' },
                        { id: 'OPERATIONS', label: '📑 شیت‌ها و ثبت معاملات', desc: 'جداول ۵ گانه اکسل' },
                    ].map(role => (
                        <button
                            key={role.id}
                            onClick={() => setCurrentPerspective(role.id as MainPerspective)}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 ${
                                currentPerspective === role.id
                                    ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-lg shadow-indigo-950/30 ring-2 ring-indigo-500/50'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                            }`}
                        >
                            {role.label}
                        </button>
                    ))}
                </div>

                {/* Quick Print Official Reports Button */}
                <div className="flex items-center gap-2 px-2">
                    <button
                        onClick={() => handleOpenPrintReport(currentPerspective === 'OPERATIONS' ? 'CEO' : (currentPerspective === 'FINANCE_MANAGER' ? 'FINANCE' : currentPerspective as ReportRoleType))}
                        className="px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white text-xs font-bold rounded-2xl shadow-md flex items-center gap-2 transition-all"
                    >
                        <Printer className="w-4 h-4 text-emerald-400" />
                        سیستم صدور گزارش رسمی سازمانی
                    </button>
                </div>
            </div>

            {/* Approval Workflow Stepper Bar */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                        فرآیند تأییدات سلسله‌مراتبی دوره ({activePeriod.title}):
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* 1. Sales Manager */}
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${activePeriod.approvals?.salesApproved ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-slate-300'}`} />
                        <span className={`font-bold ${activePeriod.approvals?.salesApproved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                            ۱. تأیید مدیر فروش {activePeriod.approvals?.salesApproved ? '✓' : '(در انتظار)'}
                        </span>
                    </div>

                    {/* 2. Finance Manager */}
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${activePeriod.approvals?.financeApproved ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-slate-300'}`} />
                        <span className={`font-bold ${activePeriod.approvals?.financeApproved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                            ۲. تأیید مدیر مالی {activePeriod.approvals?.financeApproved ? '✓' : '(در انتظار)'}
                        </span>
                    </div>

                    {/* 3. CEO */}
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${activePeriod.approvals?.ceoApproved ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-slate-300'}`} />
                        <span className={`font-bold ${activePeriod.approvals?.ceoApproved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                            ۳. ابلاغ مدیرعامل {activePeriod.approvals?.ceoApproved ? '✓' : '(در انتظار)'}
                        </span>
                    </div>
                </div>
            </div>

            {/* View Switching based on currentPerspective */}
            {periods.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 sm:p-14 border border-slate-200 dark:border-slate-700 shadow-sm text-center max-w-3xl mx-auto my-8 animate-fade-in">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-3xl mx-auto flex items-center justify-center mb-5 shadow-inner border border-emerald-100 dark:border-emerald-800">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2.5">
                        سامانه پورسانت و کمیسیون آماده فعالیت است
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
                        به صورت پیش‌فرض هیچ دوره مالی در سامانه وجود ندارد. برای شروع می‌توانید اولین دوره مالی خود را بسازید یا مستقیماً فایل اکسل پورسانت را بارگذاری نمایید.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3.5">
                        <button
                            onClick={() => setIsNewPeriodModalOpen(true)}
                            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            ➕ ایجاد اولین دوره مالی
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            <Upload className="w-4 h-4" />
                            📥 درون‌ریزی فایل اکسل (.xlsx)
                        </button>
                        <button
                            onClick={handleLoadSampleData}
                            className="px-4 py-3 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-600 flex items-center gap-2 transition-all"
                            title="بارگذاری ۵ شیت نمونه تیر و مرداد ماه جهت مشاهده ساختار"
                        >
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            بارگذاری داده‌های آزمایشی
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* 1. CEO Strategic View */}
                    {currentPerspective === 'CEO' && (
                        <CommissionCeoView
                            deals={periodDeals}
                            activePeriod={activePeriod}
                            currencyUnit={currencyUnit}
                            onApproveCeo={() => handleApproveRole('CEO')}
                            onOpenPrintReport={(t) => handleOpenPrintReport(t)}
                        />
                    )}

            {/* 2. Sales Manager Operational View */}
            {currentPerspective === 'SALES_MANAGER' && (
                <CommissionSalesManagerView
                    deals={periodDeals}
                    activePeriod={activePeriod}
                    currencyUnit={currencyUnit}
                    onApproveSales={() => handleApproveRole('SALES_MANAGER')}
                    onOpenNewDeal={() => {
                        setEditingDeal(null);
                        setIsDealModalOpen(true);
                    }}
                    onOpenPrintReport={(t) => handleOpenPrintReport(t)}
                    onSaveAdjustments={handleSaveAdjustments}
                />
            )}

            {/* 3. Finance Manager View */}
            {currentPerspective === 'FINANCE_MANAGER' && (
                <CommissionFinanceView
                    deals={periodDeals}
                    activePeriod={activePeriod}
                    currencyUnit={currencyUnit}
                    onApproveFinance={() => handleApproveRole('FINANCE_MANAGER')}
                    onOpenPrintReport={(t) => handleOpenPrintReport(t)}
                />
            )}

            {/* 4. Staff Personal Portal View */}
            {currentPerspective === 'STAFF' && (
                <CommissionStaffView
                    deals={periodDeals}
                    activePeriod={activePeriod}
                    currencyUnit={currencyUnit}
                    onOpenPrintReport={(t, staff) => handleOpenPrintReport(t, staff)}
                />
            )}

            {/* 5. Operations & Excel Sheets Ledger View */}
            {currentPerspective === 'OPERATIONS' && (
                <div>
                    {/* Standard Navigation Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 border-b border-slate-200 dark:border-slate-700">
                        {[
                            { id: 'analytics', label: '🏆 رتبه‌بندی و فروشندگان برتر (لیدربورد)', icon: <Trophy className="w-4 h-4 text-amber-500" /> },
                            { id: 'summary', label: 'شیت تجمیعی نهایی و فیش پرسنل', icon: <Users className="w-4 h-4" /> },
                            { id: 'ANBAR', label: 'فروش انبار (۰.۰۵٪)', icon: <Building2 className="w-4 h-4" /> },
                            { id: 'AZAD', label: 'فروش آزاد (۱۰٪ کمیسیون)', icon: <Repeat className="w-4 h-4" /> },
                            { id: 'HAVALEH', label: 'فروش حواله (۰.۰۵٪)', icon: <FileText className="w-4 h-4" /> },
                            { id: 'LEASING', label: 'فروش لیزینگ (۰.۱٪)', icon: <CreditCard className="w-4 h-4" /> },
                            { id: 'REGISTRATION', label: 'ثبت‌نام کارخانه', icon: <ClipboardList className="w-4 h-4" /> },
                            { id: 'yard', label: 'کاردکس خودروهای ورودی/ترخیص', icon: <Car className="w-4 h-4" /> },
                            { id: 'all', label: 'کل معاملات یکجا', icon: <Table className="w-4 h-4" /> },
                            { id: 'calculator', label: 'ماشین‌حساب ضرایب KPI', icon: <Calculator className="w-4 h-4" /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as ActiveSheetTab)}
                                className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* 1. If tab is Analytics & Leaderboard -> render CommissionSalesAnalytics */}
                    {activeTab === 'analytics' && (
                        <CommissionSalesAnalytics
                            deals={periodDeals}
                            currencyUnit={currencyUnit}
                            activePeriodName={activePeriod.title}
                        />
                    )}

                    {/* 2. If tab is Summary -> render CommissionPersonnelReport (Final Summary Sheet) */}
                    {activeTab === 'summary' && (
                        <CommissionPersonnelReport
                            deals={periodDeals}
                            currencyUnit={currencyUnit}
                            activePeriodName={activePeriod.title}
                            activePeriodId={activePeriodId}
                            periodAdjustments={activePeriod.adjustments}
                            onSaveAdjustments={handleSaveAdjustments}
                        />
                    )}

                    {/* 3. If tab is Car Yard / Inventory Ledger */}
                    {activeTab === 'yard' && (
                        <CommissionCarYardLedger
                            items={yardItems}
                            onUpdateItems={handleUpdateYardItems}
                            activePeriodId={activePeriodId}
                            activePeriodName={activePeriod.title}
                        />
                    )}

                    {/* 4. If tab is Multi-Factor Calculator */}
                    {activeTab === 'calculator' && (
                        <CommissionMultiFactorCalculator />
                    )}
                </div>
            )}

            {/* 5. If tab is a specific ledger (ANBAR, AZAD, HAVALEH, LEASING, REGISTRATION, ALL) */}
            {activeTab !== 'analytics' && activeTab !== 'summary' && activeTab !== 'yard' && activeTab !== 'calculator' && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* KPI Stat Cards for current sheet */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="text-[11px] text-slate-400 font-bold block mb-1">
                                {activeTab === 'LEASING' ? 'مجموع پیش‌پرداخت' : 'مجموع فروش'}
                            </span>
                            <div className="font-mono font-black text-slate-800 dark:text-white text-base truncate">
                                {metrics.totalSales.toLocaleString('fa-IR')}
                            </div>
                            <span className="text-[10px] text-slate-400">{metrics.unitLabel} • {metrics.totalDealsCount} معامله</span>
                        </div>

                        {activeTab === 'AZAD' ? (
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="text-[11px] text-indigo-500 font-bold block mb-1">مجموع کمیسیون کل معاملات</span>
                                <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-base truncate">
                                    {metrics.totalGrossProfit.toLocaleString('fa-IR')}
                                </div>
                                <span className="text-[10px] text-slate-400">{metrics.unitLabel} (فروش - خرید)</span>
                            </div>
                        ) : (
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="text-[11px] text-slate-400 font-bold block mb-1">سود/زیان نسبت به روز</span>
                                <div className={`font-mono font-black text-base truncate ${metrics.totalDailyProfitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {metrics.totalDailyProfitLoss > 0 ? '+' : ''}{metrics.totalDailyProfitLoss.toLocaleString('fa-IR')}
                                </div>
                                <span className="text-[10px] text-slate-400">{metrics.unitLabel}</span>
                            </div>
                        )}

                        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block mb-1">
                                پورسانت کل تعلق‌گرفته
                            </span>
                            <div className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-base truncate">
                                {metrics.totalCommission.toLocaleString('fa-IR')}
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                {activeTab === 'AZAD' ? '۱۰٪ سود کمیسیون' : activeTab === 'LEASING' ? '۰.۱٪ پیش‌پرداخت' : '۰.۰۵٪ فروش'}
                            </span>
                        </div>

                        <div className="p-4 bg-teal-50/60 dark:bg-teal-950/30 rounded-2xl border border-teal-200 dark:border-teal-800/50 shadow-sm">
                            <span className="text-[11px] text-teal-800 dark:text-teal-300 font-bold block mb-1">واریز شده به مشاوران</span>
                            <div className="font-mono font-black text-teal-700 dark:text-teal-300 text-base truncate">
                                {metrics.totalPaidCommission.toLocaleString('fa-IR')}
                            </div>
                            <span className="text-[10px] text-teal-600 dark:text-teal-400">{metrics.payoutPercentage}٪ کل پورسانت</span>
                        </div>
                    </div>

                    {/* Actions & Filters Bar */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
                        
                        {/* Search & Select Filters */}
                        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                            <div className="relative flex-1 min-w-[200px]">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="جستجو در نام، پرسنل، مدل یا توضیحات..."
                                    className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                                />
                                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                            </div>

                            <select
                                value={selectedPersonnel}
                                onChange={e => setSelectedPersonnel(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                            >
                                <option value="ALL">همه پرسنل فروش ({personnelList.length})</option>
                                {personnelList.map(person => (
                                    <option key={person} value={person}>{person}</option>
                                ))}
                            </select>

                            <select
                                value={selectedStatus}
                                onChange={e => setSelectedStatus(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                            >
                                <option value="ALL">همه وضعیت‌های واریز</option>
                                <option value="PAID">واریز شد</option>
                                <option value="PARTIAL">علی‌الحساب</option>
                                <option value="PENDING">در انتظار تسویه</option>
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                                title="ورود اطلاعات از فایل اکسل یا CSV"
                            >
                                <Upload className="w-4 h-4 text-emerald-600" />
                                ورود اکسل
                            </button>

                            <button
                                onClick={handleExportFullXLSX}
                                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                                title="خروجی کامل کلیه شیت‌های معاملاتی، کارنامه پرسنل و خلاصه مدیریتی در یک فایل اکسل جامع (.xlsx)"
                            >
                                <Download className="w-4 h-4 text-emerald-600" />
                                خروجی جامع اکسل (XLSX)
                            </button>

                            <button
                                onClick={handleExportCurrentSheetXLSX}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                                title="دانلود فایل اکسل شیت و جدول فعلی (.xlsx)"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                                خروجی این شیت (XLSX)
                            </button>

                            <button
                                onClick={handleExportCSV}
                                className="px-2.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 text-xs font-medium rounded-xl flex items-center gap-1 transition-colors"
                                title="خروجی سریع در قالب فایل متنی CSV"
                            >
                                CSV
                            </button>

                            <button
                                onClick={() => window.print()}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                                title="چاپ جدول و گزارش"
                            >
                                <Printer className="w-4 h-4" />
                                چاپ
                            </button>

                            <button
                                onClick={() => {
                                    setEditingDeal(null);
                                    setIsDealModalOpen(true);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" />
                                ثبت معامله جدید
                            </button>
                        </div>

                    </div>

                    {/* Table for current Sheet */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-right border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="py-3 px-3 text-center">ردیف</th>
                                        <th className="py-3 px-3">تاریخ فروش</th>
                                        <th className="py-3 px-3.5">نام پرسنل فروش</th>
                                        
                                        {activeTab === 'AZAD' ? (
                                            <>
                                                <th className="py-3 px-3">نام فروشنده</th>
                                                <th className="py-3 px-3">نام خریدار</th>
                                            </>
                                        ) : (
                                            <th className="py-3 px-3.5">نام مشتری</th>
                                        )}

                                        <th className="py-3 px-3">مدل خودرو</th>
                                        
                                        {activeTab === 'LEASING' || activeTab === 'REGISTRATION' ? (
                                            <th className="py-3 px-3.5">پیش پرداخت ({metrics.unitLabel})</th>
                                        ) : (
                                            <>
                                                <th className="py-3 px-3.5">قیمت روز ({metrics.unitLabel})</th>
                                                <th className="py-3 px-3.5">نرخ خرید ({metrics.unitLabel})</th>
                                                <th className="py-3 px-3.5">نرخ فروش ({metrics.unitLabel})</th>
                                            </>
                                        )}

                                        {activeTab === 'AZAD' && (
                                            <th className="py-3 px-3.5">کمیسیون کل ({metrics.unitLabel})</th>
                                        )}

                                        {activeTab === 'HAVALEH' && (
                                            <>
                                                <th className="py-3 px-3.5">مبلغ سبد بعدی ({metrics.unitLabel})</th>
                                                <th className="py-3 px-3">سود و زیان</th>
                                            </>
                                        )}

                                        {activeTab === 'ANBAR' && (
                                            <th className="py-3 px-3">سود/زیان روز</th>
                                        )}

                                        <th className="py-3 px-3.5">پورسانت کل ({metrics.unitLabel})</th>
                                        <th className="py-3 px-3">وضعیت واریز</th>
                                        <th className="py-3 px-3">توضیحات واریز</th>
                                        <th className="py-3 px-3 text-center">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {filteredDeals.length === 0 ? (
                                        <tr>
                                            <td colSpan={14} className="py-12 text-center text-slate-400">
                                                هیچ معامله‌ای در این شیت مطابق با فیلترهای انتخابی یافت نشد.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDeals.map((deal, index) => {
                                            const div = metrics.divisor;
                                            const isShared = (deal.sharedPersons && deal.sharedPersons.length > 1) || (deal.salesPerson || '').includes('/');

                                            return (
                                                <tr key={deal.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                                                        {index + 1}
                                                    </td>
                                                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                        {deal.saleDate || '-'}
                                                    </td>
                                                    <td className="py-3 px-3.5 whitespace-nowrap">
                                                        <div className="font-bold text-slate-800 dark:text-white">
                                                            {deal.salesPerson}
                                                        </div>
                                                        {isShared && (
                                                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 mt-0.5 font-bold">
                                                                <Share2 className="w-3 h-3" />
                                                                تسهیم ۵۰٪ (۲ همکار)
                                                            </span>
                                                        )}
                                                        {deal.contractWriter && (
                                                            <div className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
                                                                نویسنده: {deal.contractWriter}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {activeTab === 'AZAD' ? (
                                                        <>
                                                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                {deal.sellerName || '-'}
                                                            </td>
                                                            <td className="py-3 px-3 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                                                                {deal.buyerName || deal.customerName}
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-white whitespace-nowrap">
                                                            {deal.customerName}
                                                        </td>
                                                    )}

                                                    <td className="py-3 px-3 font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                                        {deal.carModel}
                                                    </td>

                                                    {activeTab === 'LEASING' || activeTab === 'REGISTRATION' ? (
                                                        <td className="py-3 px-3.5 font-mono font-black text-slate-900 dark:text-white">
                                                            {deal.downPayment ? Math.round(deal.downPayment / div).toLocaleString('fa-IR') : '-'}
                                                        </td>
                                                    ) : (
                                                        <>
                                                            <td className="py-3 px-3.5 font-mono text-slate-500">
                                                                {deal.dailyPrice ? Math.round(deal.dailyPrice / div).toLocaleString('fa-IR') : '-'}
                                                            </td>
                                                            <td className="py-3 px-3.5 font-mono text-slate-500">
                                                                {deal.purchasePrice ? Math.round(deal.purchasePrice / div).toLocaleString('fa-IR') : '-'}
                                                            </td>
                                                            <td className="py-3 px-3.5 font-mono font-black text-slate-900 dark:text-white">
                                                                {deal.salePrice ? Math.round(deal.salePrice / div).toLocaleString('fa-IR') : '-'}
                                                            </td>
                                                        </>
                                                    )}

                                                    {activeTab === 'AZAD' && (
                                                        <td className={`py-3 px-3.5 font-mono font-bold ${
                                                            (deal.grossProfit || 0) >= 0 ? 'text-indigo-600' : 'text-rose-600'
                                                        }`}>
                                                            {deal.grossProfit !== undefined ? Math.round(deal.grossProfit / div).toLocaleString('fa-IR') : '-'}
                                                        </td>
                                                    )}

                                                    {activeTab === 'HAVALEH' && (
                                                        <>
                                                            <td className="py-3 px-3.5 font-mono text-slate-500">
                                                                {deal.nextBasketAmount ? Math.round(deal.nextBasketAmount / div).toLocaleString('fa-IR') : '-'}
                                                            </td>
                                                            <td className={`py-3 px-3 font-mono font-bold ${
                                                                (deal.dailyProfitLoss || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                            }`}>
                                                                {deal.dailyProfitLoss !== undefined ? Math.round(deal.dailyProfitLoss / div).toLocaleString('fa-IR') : '-'}
                                                            </td>
                                                        </>
                                                    )}

                                                    {activeTab === 'ANBAR' && (
                                                        <td className={`py-3 px-3 font-mono font-bold ${
                                                            (deal.dailyProfitLoss || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}>
                                                            {deal.dailyProfitLoss !== undefined ? Math.round(deal.dailyProfitLoss / div).toLocaleString('fa-IR') : '-'}
                                                        </td>
                                                    )}

                                                    {/* Commission Amount */}
                                                    <td className="py-3 px-3.5 font-mono font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{Math.round((deal.commissionAmount || 0) / div).toLocaleString('fa-IR')}</span>
                                                            {deal.isManualCommission && (
                                                                <span 
                                                                    className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-black border border-amber-300 dark:border-amber-800 cursor-help"
                                                                    title={deal.manualCommissionReason ? `تغییر دستی: ${deal.manualCommissionReason}` : 'پورسانت دستی'}
                                                                >
                                                                    دستی
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Payment Status Toggle */}
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleTogglePaymentStatus(deal.id)}
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                                                                deal.paymentStatus === 'PAID'
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                    : deal.paymentStatus === 'PARTIAL'
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                            }`}
                                                        >
                                                            {deal.paymentStatus === 'PAID' ? 'واریز شد' : deal.paymentStatus === 'PARTIAL' ? 'علی‌الحساب' : 'در انتظار'}
                                                        </button>
                                                    </td>

                                                    <td className="py-3 px-3 text-[11px] text-slate-500 max-w-[200px] truncate" title={deal.paymentNotes}>
                                                        {deal.paymentNotes || '-'}
                                                    </td>

                                                    <td className="py-3 px-3 text-center whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingDeal(deal);
                                                                    setIsDealModalOpen(true);
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                                                                title="ویرایش"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDeal(deal.id)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                                                title="حذف"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>

                                {/* Totals Footer Row */}
                                <tfoot className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-black border-t-2 border-slate-300 dark:border-slate-600 text-xs">
                                    <tr>
                                        <td colSpan={activeTab === 'AZAD' ? 5 : 4} className="py-3 px-4 text-left">
                                            جمع کل شیت ({activePeriod.title}):
                                        </td>
                                        
                                        {activeTab === 'LEASING' || activeTab === 'REGISTRATION' ? (
                                            <td className="py-3 px-3.5 font-mono">
                                                {metrics.totalSales.toLocaleString('fa-IR')}
                                            </td>
                                        ) : (
                                            <>
                                                <td className="py-3 px-3.5 font-mono">{metrics.totalDailyPrice.toLocaleString('fa-IR')}</td>
                                                <td className="py-3 px-3.5 font-mono">{metrics.totalPurchase.toLocaleString('fa-IR')}</td>
                                                <td className="py-3 px-3.5 font-mono font-black">{metrics.totalSales.toLocaleString('fa-IR')}</td>
                                            </>
                                        )}

                                        {activeTab === 'AZAD' && (
                                            <td className="py-3 px-3.5 font-mono text-indigo-600">
                                                {metrics.totalGrossProfit.toLocaleString('fa-IR')}
                                            </td>
                                        )}

                                        {activeTab === 'HAVALEH' && (
                                            <>
                                                <td className="py-3 px-3.5 font-mono">-</td>
                                                <td className="py-3 px-3 font-mono">{metrics.totalDailyProfitLoss.toLocaleString('fa-IR')}</td>
                                            </>
                                        )}

                                        {activeTab === 'ANBAR' && (
                                            <td className="py-3 px-3 font-mono">{metrics.totalDailyProfitLoss.toLocaleString('fa-IR')}</td>
                                        )}

                                        <td className="py-3 px-3.5 font-mono text-emerald-600 font-black">
                                            {metrics.totalCommission.toLocaleString('fa-IR')}
                                        </td>
                                        
                                        <td colSpan={3} className="py-3 px-3 text-[11px] text-slate-500">
                                            {metrics.totalDealsCount} ردیف معامله
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                </div>
            )}
            </>
            )}

            {/* Modals */}
            <CommissionDealModal
                isOpen={isDealModalOpen}
                onClose={() => {
                    setIsDealModalOpen(false);
                    setEditingDeal(null);
                }}
                onSave={handleSaveDeal}
                initialDeal={editingDeal}
                activePeriodId={activePeriodId}
                activePeriodName={activePeriod.title}
                crmUsers={crmUsers}
                commissionSettings={commissionSettings}
            />

            <CommissionSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                currentSettings={commissionSettings}
                onSaveSettings={handleSaveSettings}
            />

            <CommissionExcelImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportDeals}
                periods={periods}
                activePeriodId={activePeriodId}
                onAddNewPeriod={handleAddNewPeriodInline}
            />

            {/* Standardized Role Reports & Printing Modal (Supports Multi-Period Selection) */}
            <CommissionRoleReportsModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                reportType={activeReportRole}
                activePeriod={activePeriod}
                allPeriods={periods}
                deals={periodDeals}
                allDeals={deals}
                currencyUnit={currencyUnit}
                targetStaffName={reportTargetStaff}
            />

            {/* Period Manager & Cleanup Modal */}
            {isPeriodManagerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in" dir="rtl">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-l from-rose-500/10 via-slate-500/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-2xl">
                                    <SlidersHorizontal className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-white">
                                        مدیریت و پاکسازی دوره‌های مالی
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        حذف دوره‌ها، پاکسازی معاملات یا بازنشانی کامل داده‌ها
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPeriodManagerOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body: List of periods with counts and actions */}
                        <div className="p-6 overflow-y-auto space-y-4">
                            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
                                لیست دوره‌های مالی ثبت‌شده ({periods.length} دوره):
                            </h4>

                            <div className="space-y-2.5">
                                {periods.map(p => {
                                    const pDealsCount = deals.filter(d => d.periodId === p.id).length;
                                    const isCurrent = p.id === activePeriodId;

                                    return (
                                        <div
                                            key={p.id}
                                            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                isCurrent 
                                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
                                                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                                                    <Calendar className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-slate-800 dark:text-white">
                                                            {p.title}
                                                        </span>
                                                        {isCurrent && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                دوره فعال فعلی
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-mono">
                                                        {pDealsCount} معامله ثبت‌شده
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons per Period */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (confirm(`آیا مطمئنید که می‌خواهید فقط معاملات دوره «${p.title}» را پاکسازی کنید؟`)) {
                                                            handleClearPeriodDeals(p.id);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors"
                                                    title="پاکسازی تمام معاملات این دوره بدون حذف خود دوره"
                                                >
                                                    پاکسازی معاملات
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (confirm(`آیا از حذف کامل دوره مالی «${p.title}» و تمام معاملات آن اطمینان دارید؟`)) {
                                                            handleDeletePeriod(p.id, true);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                                                    title="حذف دوره به همراه معاملات"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    حذف دوره
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Danger Zone: Purge All or Reset Defaults */}
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                                <h4 className="text-xs font-black text-rose-600 flex items-center gap-1.5">
                                    <AlertOctagon className="w-4 h-4" />
                                    عملیات پیشرفته پاکسازی و بازنشانی:
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={handlePurgeAll}
                                        className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-2xl border border-rose-200 dark:border-rose-800 text-right text-xs transition-colors"
                                    >
                                        <div className="font-black mb-0.5">⚠️ پاکسازی کامل همه دوره‌ها و معاملات</div>
                                        <div className="text-[11px] text-rose-500">حذف تمام داده‌ها و ایجاد جدول خالی اولیه</div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleResetDefaults();
                                            setIsPeriodManagerOpen(false);
                                        }}
                                        className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-2xl border border-slate-200 dark:border-slate-700 text-right text-xs transition-colors"
                                    >
                                        <div className="font-black mb-0.5">🔄 بازنشانی به داده‌های اکسل تیر و مرداد</div>
                                        <div className="text-[11px] text-slate-500">بارگذاری مجدد ۵ شیت استاندارد پیش‌فرض</div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsPeriodManagerOpen(false)}
                                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                            >
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create New Period Modal */}
            {isNewPeriodModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
                        <h3 className="text-base font-black text-slate-800 dark:text-white mb-2">
                            تعریف دوره مالی جدید
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            عنوان ماه جدید را وارد کنید (مثلاً شهریور ۱۴۰۵)
                        </p>
                        <form onSubmit={handleCreatePeriod} className="space-y-4">
                            <input
                                type="text"
                                value={newPeriodTitle}
                                onChange={e => setNewPeriodTitle(e.target.value)}
                                placeholder="مثلاً: شهریور ۱۴۰۵"
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white font-bold"
                                autoFocus
                                required
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsNewPeriodModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                                >
                                    ایجاد دوره
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CommissionPage;
