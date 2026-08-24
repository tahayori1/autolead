import React, { useState, useEffect, useMemo } from 'react';
import type { ZeroCarDelivery } from '../types';
import { zeroCarDeliveryService } from '../services/api';
import { TruckIcon } from '../components/icons/TruckIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import { UploadIcon } from '../components/icons/UploadIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { PhoneIcon } from '../components/icons/PhoneIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import PersianDatePicker from '../components/PersianDatePicker';
import ExcelUploadModal from '../components/ExcelUploadModal';
import Pagination from '../components/Pagination';

// Declare moment from global scope
declare const moment: any;

const STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string; borderClass: string }> = {
    'تحويل به مشتري': { label: 'تحویل به مشتری', bgClass: 'bg-emerald-100 dark:bg-emerald-950/60', textClass: 'text-emerald-800 dark:text-emerald-300', borderClass: 'border-emerald-300 dark:border-emerald-800' },
    'تحویل به مشتری': { label: 'تحویل به مشتری', bgClass: 'bg-emerald-100 dark:bg-emerald-950/60', textClass: 'text-emerald-800 dark:text-emerald-300', borderClass: 'border-emerald-300 dark:border-emerald-800' },
    'تحویل شده': { label: 'تحویل شده', bgClass: 'bg-emerald-100 dark:bg-emerald-950/60', textClass: 'text-emerald-800 dark:text-emerald-300', borderClass: 'border-emerald-300 dark:border-emerald-800' },
    'DELIVERED': { label: 'تحویل شده', bgClass: 'bg-emerald-100 dark:bg-emerald-950/60', textClass: 'text-emerald-800 dark:text-emerald-300', borderClass: 'border-emerald-300 dark:border-emerald-800' },
    'تایید مدارک': { label: 'تایید مدارک', bgClass: 'bg-amber-100 dark:bg-amber-950/60', textClass: 'text-amber-800 dark:text-amber-300', borderClass: 'border-amber-300 dark:border-amber-800' },
    'VERIFICATION': { label: 'تایید مدارک', bgClass: 'bg-amber-100 dark:bg-amber-950/60', textClass: 'text-amber-800 dark:text-amber-300', borderClass: 'border-amber-300 dark:border-amber-800' },
    'آماده تحویل': { label: 'آماده تحویل', bgClass: 'bg-teal-100 dark:bg-teal-950/60', textClass: 'text-teal-800 dark:text-teal-300', borderClass: 'border-teal-300 dark:border-teal-800' },
    'در حال آماده‌سازی': { label: 'در حال آماده‌سازی', bgClass: 'bg-blue-100 dark:bg-blue-950/60', textClass: 'text-blue-800 dark:text-blue-300', borderClass: 'border-blue-300 dark:border-blue-800' },
    'PROCESSING': { label: 'در حال آماده‌سازی', bgClass: 'bg-blue-100 dark:bg-blue-950/60', textClass: 'text-blue-800 dark:text-blue-300', borderClass: 'border-blue-300 dark:border-blue-800' },
    'در سالن': { label: 'در سالن', bgClass: 'bg-purple-100 dark:bg-purple-950/60', textClass: 'text-purple-800 dark:text-purple-300', borderClass: 'border-purple-300 dark:border-purple-800' },
    'IN_SHOWROOM': { label: 'در سالن', bgClass: 'bg-purple-100 dark:bg-purple-950/60', textClass: 'text-purple-800 dark:text-purple-300', borderClass: 'border-purple-300 dark:border-purple-800' },
    'در انبار ۱': { label: 'در انبار ۱', bgClass: 'bg-indigo-100 dark:bg-indigo-950/60', textClass: 'text-indigo-800 dark:text-indigo-300', borderClass: 'border-indigo-300 dark:border-indigo-800' },
    'IN_WAREHOUSE_1': { label: 'در انبار ۱', bgClass: 'bg-indigo-100 dark:bg-indigo-950/60', textClass: 'text-indigo-800 dark:text-indigo-300', borderClass: 'border-indigo-300 dark:border-indigo-800' },
    'در انبار ۲': { label: 'در انبار ۲', bgClass: 'bg-sky-100 dark:bg-sky-950/60', textClass: 'text-sky-800 dark:text-sky-300', borderClass: 'border-sky-300 dark:border-sky-800' },
    'IN_WAREHOUSE_2': { label: 'در انبار ۲', bgClass: 'bg-sky-100 dark:bg-sky-950/60', textClass: 'text-sky-800 dark:text-sky-300', borderClass: 'border-sky-300 dark:border-sky-800' },
};

const STANDARD_STATUS_OPTIONS = [
    { value: 'تحويل به مشتري', label: 'تحویل به مشتری' },
    { value: 'تایید مدارک', label: 'تایید مدارک' },
    { value: 'در حال آماده‌سازی', label: 'در حال آماده‌سازی' },
    { value: 'آماده تحویل', label: 'آماده تحویل' },
    { value: 'در سالن', label: 'در سالن' },
    { value: 'در انبار ۱', label: 'در انبار ۱' },
    { value: 'در انبار ۲', label: 'در انبار ۲' },
];

const POPULAR_CAR_MODELS = [
    'J4', 'JAC J4', 'S3', 'JAC S3', 'S5', 'JAC S5', 'BAC X3PRO', 'T8', 'KMC T8',
    'T9', 'KMC T9', 'A5', 'KMC A5', 'J7', 'KMC J7', 'X5', 'KMC X5',
    'SR3', 'KMC SR3', 'EAGLE', 'KMC EAGLE', 'SHADOW', 'KMC SHADOW', 'SR6', 'KMC SR6'
];

type SortField = 'deliveryDateTime' | 'arrivalDateTime' | 'contactDateTime' | 'documentDate' | 'createdAt' | 'customerName' | 'carModel' | 'chassisNumber' | 'contractNumber' | 'id';
type SortOrder = 'desc' | 'asc';

// Helper to format Persian date/time values nicely (handles "14050525", "1405/05/25 19:00", etc.)
const formatPersianDateTime = (val?: string | null): string => {
    if (!val) return '-';
    const str = String(val).trim();
    if (!str || str === 'null' || str === 'undefined') return '-';
    
    // Case 1: 8 continuous digits "14050525"
    if (/^\d{8}$/.test(str)) {
        return `${str.slice(0, 4)}/${str.slice(4, 6)}/${str.slice(6, 8)}`;
    }
    
    // Case 2: 8 continuous digits with time "14050525 19:00"
    if (/^\d{8}\s+\d{1,2}:\d{2}/.test(str)) {
        const parts = str.split(/\s+/);
        const d = parts[0];
        const t = parts[1];
        return `${d.slice(0, 4)}/${d.slice(4, 6)}/${d.slice(6, 8)} ${t}`;
    }
    
    return str;
};

// Helper to normalize dates for accurate chronological sorting
const normalizeDateForSort = (val?: string | null): string => {
    if (!val) return '';
    const str = String(val).trim();
    const digits = str.replace(/[^\d]/g, '');
    if (digits.length >= 8) {
        return digits.padEnd(14, '0');
    }
    return str;
};

const getStatusBadge = (status?: string | null) => {
    if (!status) {
        return (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                نامشخص
            </span>
        );
    }
    const config = STATUS_CONFIG[status] || {
        label: status,
        bgClass: 'bg-slate-100 dark:bg-slate-700',
        textClass: 'text-slate-700 dark:text-slate-200',
        borderClass: 'border-slate-200 dark:border-slate-600'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs ${config.bgClass} ${config.textClass} ${config.borderClass}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {config.label}
        </span>
    );
};

const ZeroCarDeliveryPage: React.FC = () => {
    const [deliveries, setDeliveries] = useState<ZeroCarDelivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<Partial<ZeroCarDelivery>>({});
    const [viewRecord, setViewRecord] = useState<ZeroCarDelivery | null>(null);
    const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // View Mode
    const [viewMode, setViewMode] = useState<'LIST' | 'REPORT'>('LIST');

    // Filter States (List View)
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [carModelFilter, setCarModelFilter] = useState('all');
    const [dateFieldFilter, setDateFieldFilter] = useState<'deliveryDateTime' | 'arrivalDateTime' | 'contactDateTime' | 'documentDate'>('deliveryDateTime');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [deliveryStatusQuickFilter, setDeliveryStatusQuickFilter] = useState<'ALL' | 'DELIVERED' | 'PENDING_DELIVERY' | 'HAS_DELIVERY_DATE' | 'NO_PLATE'>('ALL');

    // Sorting State (Default sort by deliveryDateTime descending)
    const [sortField, setSortField] = useState<SortField>('deliveryDateTime');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Filter States (Report View)
    const [reportCarModel, setReportCarModel] = useState('all');
    const [reportStatus, setReportStatus] = useState('all');
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const data = await zeroCarDeliveryService.getAll();
            setDeliveries(Array.isArray(data) ? data : []);
        } catch (error) {
            setToast({ message: 'خطا در بارگذاری اطلاعات تحویل خودرو', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

    useEffect(() => {
        const handleRefresh = () => {
            fetchDeliveries();
        };
        window.addEventListener('app-refresh', handleRefresh);
        return () => window.removeEventListener('app-refresh', handleRefresh);
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, carModelFilter, dateFieldFilter, startDate, endDate, deliveryStatusQuickFilter, sortField, sortOrder, itemsPerPage]);

    // Unique options derived from data
    const availableStatuses = useMemo(() => {
        const set = new Set<string>();
        STANDARD_STATUS_OPTIONS.forEach(opt => set.add(opt.value));
        deliveries.forEach(d => {
            if (d.status) set.add(d.status);
        });
        return Array.from(set);
    }, [deliveries]);

    const availableCarModels = useMemo(() => {
        const set = new Set<string>();
        POPULAR_CAR_MODELS.forEach(m => set.add(m));
        deliveries.forEach(d => {
            if (d.carModel) set.add(d.carModel);
        });
        return Array.from(set).sort();
    }, [deliveries]);

    // Filter & Sort Logic (List View)
    const filteredDeliveries = useMemo(() => {
        const filtered = deliveries.filter(item => {
            // Text search
            const searchLower = searchQuery.toLowerCase().trim();
            if (searchLower) {
                const customer = (item.customerName || '').toLowerCase();
                const phone = (item.phoneNumber || '').toLowerCase();
                const model = (item.carModel || '').toLowerCase();
                const color = (item.color || '').toLowerCase();
                const chassis = (item.chassisNumber || '').toLowerCase();
                const plate = (item.plateNumber || '').toLowerCase();
                const contract = (item.contractNumber || '').toLowerCase();
                const docNum = (item.documentNumber || '').toLowerCase();
                const secondOwner = (item.secondOwnerName || '').toLowerCase();
                const verNotes = (item.verificationNotes || '').toLowerCase();
                const delNotes = (item.deliveryNotes || '').toLowerCase();
                const options = (item.installedOptions || '').toLowerCase();

                const matchesSearch =
                    customer.includes(searchLower) ||
                    phone.includes(searchLower) ||
                    model.includes(searchLower) ||
                    color.includes(searchLower) ||
                    chassis.includes(searchLower) ||
                    plate.includes(searchLower) ||
                    contract.includes(searchLower) ||
                    docNum.includes(searchLower) ||
                    secondOwner.includes(searchLower) ||
                    verNotes.includes(searchLower) ||
                    delNotes.includes(searchLower) ||
                    options.includes(searchLower);

                if (!matchesSearch) return false;
            }

            // Status filter
            if (statusFilter !== 'all') {
                if (item.status !== statusFilter) return false;
            }

            // Car Model filter
            if (carModelFilter !== 'all') {
                if (item.carModel !== carModelFilter) return false;
            }

            // Quick Status Pills
            if (deliveryStatusQuickFilter === 'DELIVERED') {
                const isDelivered = item.status === 'تحويل به مشتري' || item.status === 'تحویل به مشتری' || item.status === 'تحویل شده' || item.status === 'DELIVERED' || Boolean(item.deliveryDateTime);
                if (!isDelivered) return false;
            } else if (deliveryStatusQuickFilter === 'PENDING_DELIVERY') {
                const isDelivered = item.status === 'تحويل به مشتري' || item.status === 'تحویل به مشتری' || item.status === 'تحویل شده' || item.status === 'DELIVERED';
                if (isDelivered) return false;
            } else if (deliveryStatusQuickFilter === 'HAS_DELIVERY_DATE') {
                if (!item.deliveryDateTime) return false;
            } else if (deliveryStatusQuickFilter === 'NO_PLATE') {
                if (item.plateNumber && item.plateNumber.trim() !== '') return false;
            }

            // Date Range Filter based on selected dateFieldFilter
            if (startDate || endDate) {
                let targetDateRaw = item[dateFieldFilter];
                if (!targetDateRaw) return false;
                const normalizedTarget = normalizeDateForSort(targetDateRaw).slice(0, 8); // YYYYMMDD
                const normalizedStart = normalizeDateForSort(startDate).slice(0, 8);
                const normalizedEnd = normalizeDateForSort(endDate).slice(0, 8);

                if (normalizedStart && normalizedTarget < normalizedStart) return false;
                if (normalizedEnd && normalizedTarget > normalizedEnd) return false;
            }

            return true;
        });

        // Sorting Logic (Default: deliveryDateTime descending -> Latest Deliveries First)
        return filtered.sort((a, b) => {
            let valA: any = a[sortField];
            let valB: any = b[sortField];

            // If sorting by dates
            if (['deliveryDateTime', 'arrivalDateTime', 'contactDateTime', 'documentDate', 'createdAt'].includes(sortField)) {
                const normA = normalizeDateForSort(valA);
                const normB = normalizeDateForSort(valB);

                // Handle empty/null values: push to end if desc, start if asc
                if (!normA && !normB) {
                    return (Number(b.id) || 0) - (Number(a.id) || 0);
                }
                if (!normA) return sortOrder === 'desc' ? 1 : -1;
                if (!normB) return sortOrder === 'desc' ? -1 : 1;

                const comp = normA.localeCompare(normB);
                if (comp !== 0) {
                    return sortOrder === 'desc' ? -comp : comp;
                }
                // Secondary fallback sort by ID descending
                return (Number(b.id) || 0) - (Number(a.id) || 0);
            }

            // Numeric ID sort
            if (sortField === 'id') {
                const numA = Number(a.id) || 0;
                const numB = Number(b.id) || 0;
                return sortOrder === 'desc' ? numB - numA : numA - numB;
            }

            // String sort
            const strA = (valA || '').toString();
            const strB = (valB || '').toString();

            if (!strA && !strB) {
                return (Number(b.id) || 0) - (Number(a.id) || 0);
            }
            if (!strA) return 1;
            if (!strB) return -1;

            const comp = strA.localeCompare(strB, 'fa-IR', { numeric: true });
            if (comp !== 0) {
                return sortOrder === 'desc' ? -comp : comp;
            }
            return (Number(b.id) || 0) - (Number(a.id) || 0);
        });
    }, [deliveries, searchQuery, statusFilter, carModelFilter, dateFieldFilter, startDate, endDate, deliveryStatusQuickFilter, sortField, sortOrder]);

    // Report Logic (Sorted by latest delivery date descending)
    const reportData = useMemo(() => {
        const filtered = deliveries.filter(item => {
            const matchesModel = reportCarModel === 'all' || item.carModel === reportCarModel;
            const matchesStatus = reportStatus === 'all' || item.status === reportStatus;
            
            let matchesDate = true;
            const dateStr = item.deliveryDateTime ? normalizeDateForSort(item.deliveryDateTime).slice(0, 8) : (item.documentDate ? normalizeDateForSort(item.documentDate).slice(0, 8) : '');
            
            if (dateStr) {
                const startNorm = reportStartDate ? normalizeDateForSort(reportStartDate).slice(0, 8) : '';
                const endNorm = reportEndDate ? normalizeDateForSort(reportEndDate).slice(0, 8) : '';
                if (startNorm && dateStr < startNorm) matchesDate = false;
                if (endNorm && dateStr > endNorm) matchesDate = false;
            } else if (reportStartDate || reportEndDate) {
                matchesDate = false;
            }

            return matchesModel && matchesStatus && matchesDate;
        });

        return filtered.sort((a, b) => {
            const normA = normalizeDateForSort(a.deliveryDateTime);
            const normB = normalizeDateForSort(b.deliveryDateTime);
            if (!normA && !normB) return (Number(b.id) || 0) - (Number(a.id) || 0);
            if (!normA) return 1;
            if (!normB) return -1;
            const comp = normA.localeCompare(normB);
            return comp !== 0 ? -comp : (Number(b.id) || 0) - (Number(a.id) || 0);
        });
    }, [deliveries, reportCarModel, reportStatus, reportStartDate, reportEndDate]);

    const reportStats = useMemo(() => {
        const stats = {
            total: reportData.length,
            deliveredCount: 0,
            hasPlateCount: 0,
            byStatus: {} as Record<string, number>,
            byModel: {} as Record<string, number>
        };

        reportData.forEach(item => {
            const statusKey = item.status || 'نامشخص';
            stats.byStatus[statusKey] = (stats.byStatus[statusKey] || 0) + 1;
            if (item.carModel) {
                stats.byModel[item.carModel] = (stats.byModel[item.carModel] || 0) + 1;
            }
            if (item.status === 'تحويل به مشتري' || item.status === 'تحویل به مشتری' || item.status === 'تحویل شده' || item.status === 'DELIVERED' || item.deliveryDateTime) {
                stats.deliveredCount++;
            }
            if (item.plateNumber && item.plateNumber.trim() !== '') {
                stats.hasPlateCount++;
            }
        });

        return stats;
    }, [reportData]);

    const paginatedDeliveries = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredDeliveries.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredDeliveries, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const handleSave = async () => {
        if (!currentRecord.customerName || !currentRecord.chassisNumber) {
            setToast({ message: 'نام مشتری و شماره شاسی الزامی است', type: 'error' });
            return;
        }

        try {
            if (currentRecord.id) {
                await zeroCarDeliveryService.update(currentRecord as ZeroCarDelivery);
                setToast({ message: 'پرونده خودرو با موفقیت ویرایش و ذخیره شد', type: 'success' });
            } else {
                await zeroCarDeliveryService.create({
                    ...currentRecord,
                    status: currentRecord.status || 'تایید مدارک'
                });
                setToast({ message: 'پرونده جدید تحویل خودرو با موفقیت ایجاد شد', type: 'success' });
            }
            setIsModalOpen(false);
            fetchDeliveries();
        } catch (error) {
            setToast({ message: 'خطا در ذخیره اطلاعات در سرور', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('آیا از حذف این پرونده تحویل خودرو اطمینان دارید؟')) {
            try {
                await zeroCarDeliveryService.delete(id);
                setToast({ message: 'رکورد با موفقیت حذف شد', type: 'success' });
                fetchDeliveries();
            } catch (error) {
                setToast({ message: 'خطا در حذف رکورد', type: 'error' });
            }
        }
    };

    const handleSetNow = (field: keyof ZeroCarDelivery, updateStatus: boolean = false) => {
        const now = moment().locale('fa').format('jYYYY/jMM/jDD HH:mm');
        setCurrentRecord(prev => {
            const updates: Partial<ZeroCarDelivery> = { [field]: now };
            if (updateStatus) {
                updates.status = 'تحويل به مشتري';
            }
            return { ...prev, ...updates };
        });
        if (updateStatus) {
            setToast({ message: 'زمان ثبت شد و وضعیت به «تحویل به مشتری» تغییر یافت.', type: 'success' });
        } else {
            setToast({ message: 'زمان جاری با موفقیت درج شد.', type: 'success' });
        }
    };

    const handleQuickDeliverNow = async (item: ZeroCarDelivery) => {
        const now = moment().locale('fa').format('jYYYY/jMM/jDD HH:mm');
        try {
            await zeroCarDeliveryService.update({
                ...item,
                deliveryDateTime: now,
                status: 'تحويل به مشتري'
            });
            setToast({ message: `خودرو ${item.customerName} در ساعت ${now} تحویل ثبت شد`, type: 'success' });
            fetchDeliveries();
        } catch (e) {
            setToast({ message: 'خطا در ثبت سریع تحویل', type: 'error' });
        }
    };

    const openEditModal = (record?: ZeroCarDelivery) => {
        setCurrentRecord(record || {
            status: 'تایید مدارک',
            customerName: '',
            phoneNumber: '',
            carModel: 'J4',
            color: 'سفید',
            chassisNumber: '',
            plateNumber: '',
            contractNumber: '',
            documentNumber: '',
            documentDate: '',
            secondOwnerName: '',
            arrivalDateTime: '',
            contactDateTime: '',
            deliveryDateTime: '',
            installedOptions: '',
            verificationNotes: '',
            deliveryNotes: ''
        });
        setActiveTab(1);
        setIsModalOpen(true);
    };

    const openViewModal = (record: ZeroCarDelivery) => {
        setViewRecord(record);
        setIsViewModalOpen(true);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setCarModelFilter('all');
        setDateFieldFilter('deliveryDateTime');
        setStartDate('');
        setEndDate('');
        setDeliveryStatusQuickFilter('ALL');
        setSortField('deliveryDateTime');
        setSortOrder('desc');
        setCurrentPage(1);
    };

    // Render Report View
    if (viewMode === 'REPORT') {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/60 rounded-2xl text-indigo-600 dark:text-indigo-300">
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">گزارش‌گیری تحویل خودرو صفر</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">تحلیل آماری و رهگیری زمان‌بندی فرآیند تحویل</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setViewMode('LIST')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition-colors font-bold text-sm shadow-xs"
                    >
                        <CloseIcon className="w-4 h-4" />
                        بازگشت به لیست پرونده‌ها
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">مدل خودرو</label>
                            <select 
                                className="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold"
                                value={reportCarModel}
                                onChange={(e) => setReportCarModel(e.target.value)}
                            >
                                <option value="all">همه مدل‌ها ({deliveries.length})</option>
                                {availableCarModels.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">وضعیت پرونده</label>
                            <select 
                                className="w-full px-3.5 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold"
                                value={reportStatus}
                                onChange={(e) => setReportStatus(e.target.value)}
                            >
                                <option value="all">همه وضعیت‌ها</option>
                                {availableStatuses.map(st => (
                                    <option key={st} value={st}>{STATUS_CONFIG[st]?.label || st}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">از تاریخ (تحویل / سند)</label>
                            <PersianDatePicker value={reportStartDate} onChange={setReportStartDate} placeholder="انتخاب تاریخ شروع" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">تا تاریخ (تحویل / سند)</label>
                            <PersianDatePicker value={reportEndDate} onChange={setReportEndDate} placeholder="انتخاب تاریخ پایان" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-xs">
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">کل پرونده‌های گزارش</span>
                        <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">{reportStats.total.toLocaleString('fa-IR')}</span>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center shadow-xs">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 block mb-1">تحویل شده به مشتری</span>
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">{reportStats.deliveredCount.toLocaleString('fa-IR')}</span>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-200 dark:border-purple-800 text-center shadow-xs">
                        <span className="text-xs text-purple-600 dark:text-purple-400 block mb-1">دارای پلاک ثبت‌شده</span>
                        <span className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">{reportStats.hasPlateCount.toLocaleString('fa-IR')}</span>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 text-center shadow-xs">
                        <span className="text-xs text-amber-600 dark:text-amber-400 block mb-1">در انتظار تحویل نهایی</span>
                        <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">{(reportStats.total - reportStats.deliveredCount).toLocaleString('fa-IR')}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black">
                                <tr>
                                    <th className="p-3.5"># شناسه</th>
                                    <th className="p-3.5">نام مشتری</th>
                                    <th className="p-3.5">خودرو و رنگ</th>
                                    <th className="p-3.5">شماره شاسی</th>
                                    <th className="p-3.5">پلاک</th>
                                    <th className="p-3.5">وضعیت</th>
                                    <th className="p-3.5">تاریخ تحویل</th>
                                    <th className="p-3.5">توضیحات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {reportData.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                        <td className="p-3.5 font-mono text-slate-400">{item.id}</td>
                                        <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{item.customerName}</td>
                                        <td className="p-3.5 text-slate-700 dark:text-slate-300">
                                            {item.carModel} <span className="text-slate-400">({item.color})</span>
                                        </td>
                                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{item.chassisNumber}</td>
                                        <td className="p-3.5 font-mono">{item.plateNumber || '-'}</td>
                                        <td className="p-3.5">{getStatusBadge(item.status)}</td>
                                        <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                            {formatPersianDateTime(item.deliveryDateTime)}
                                        </td>
                                        <td className="p-3.5 text-slate-500 max-w-xs truncate">{item.deliveryNotes || item.verificationNotes || '-'}</td>
                                    </tr>
                                ))}
                                {reportData.length === 0 && (
                                    <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-bold">هیچ رکوردی منطبق با شروط گزارش یافت نشد.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // Default LIST View
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="p-3.5 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-2xl text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                        <TruckIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">تحویل خودرو صفر</h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                                {filteredDeliveries.length.toLocaleString('fa-IR')} رکورد
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">مدیریت پرونده‌های مدارک، انبارداری، تماس و زمان‌بندی تحویل به مشتری</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    <button 
                        onClick={() => setViewMode('REPORT')} 
                        className="flex-1 sm:flex-initial bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs shadow-2xs transition-all active:scale-95"
                    >
                        <ChartBarIcon className="w-4 h-4 text-indigo-500" />
                        <span>گزارش آماری</span>
                    </button>
                    <button 
                        onClick={() => setIsExcelModalOpen(true)} 
                        className="flex-1 sm:flex-initial bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs shadow-2xs transition-all active:scale-95"
                    >
                        <UploadIcon className="w-4 h-4 text-emerald-600" />
                        <span>ورود اکسل</span>
                    </button>
                    <button 
                        onClick={() => openEditModal()} 
                        className="flex-1 sm:flex-initial bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-sm transition-all active:scale-95"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>ثبت پرونده جدید</span>
                    </button>
                </div>
            </div>

            {/* Quick Status Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
                <button
                    onClick={() => setDeliveryStatusQuickFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        deliveryStatusQuickFilter === 'ALL'
                            ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                >
                    همه پرونده‌ها ({deliveries.length.toLocaleString('fa-IR')})
                </button>
                <button
                    onClick={() => setDeliveryStatusQuickFilter('DELIVERED')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        deliveryStatusQuickFilter === 'DELIVERED'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50/50'
                    }`}
                >
                    تحویل شده به مشتری
                </button>
                <button
                    onClick={() => setDeliveryStatusQuickFilter('PENDING_DELIVERY')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        deliveryStatusQuickFilter === 'PENDING_DELIVERY'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-50/50'
                    }`}
                >
                    در انتظار تحویل
                </button>
                <button
                    onClick={() => setDeliveryStatusQuickFilter('HAS_DELIVERY_DATE')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        deliveryStatusQuickFilter === 'HAS_DELIVERY_DATE'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-50/50'
                    }`}
                >
                    دارای تاریخ تحویل (برنامه‌ریزی شده)
                </button>
                <button
                    onClick={() => setDeliveryStatusQuickFilter('NO_PLATE')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        deliveryStatusQuickFilter === 'NO_PLATE'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50/50'
                    }`}
                >
                    فاقد شماره پلاک
                </button>
            </div>

            {/* Filter & Sorting Control Card */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                    {/* Search Field */}
                    <div className="md:col-span-4">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">جستجوی جامع</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="نام مشتری، تلفن، شاسی، پلاک، قرارداد، سند..." 
                                className="w-full pl-4 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute right-3.5 top-2.5 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    <CloseIcon className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">وضعیت</label>
                        <select 
                            className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none font-bold"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">همه وضعیت‌ها</option>
                            {availableStatuses.map(st => (
                                <option key={st} value={st}>{STATUS_CONFIG[st]?.label || st}</option>
                            ))}
                        </select>
                    </div>

                    {/* Car Model Filter */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">مدل خودرو</label>
                        <select 
                            className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none font-bold"
                            value={carModelFilter}
                            onChange={(e) => setCarModelFilter(e.target.value)}
                        >
                            <option value="all">همه مدل‌ها</option>
                            {availableCarModels.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sorting Field & Direction (Explicit deliveryDateTime requirement) */}
                    <div className="md:col-span-4 flex items-center gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                                <span>مرتب‌سازی بر اساس</span>
                                {sortField === 'deliveryDateTime' && (
                                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-black">پیش‌فرض: آخرین تحویل</span>
                                )}
                            </label>
                            <select 
                                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none font-bold"
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value as SortField)}
                            >
                                <option value="deliveryDateTime">آخرین تحویل - تاریخ و ساعت تحویل (deliveryDateTime)</option>
                                <option value="arrivalDateTime">تاریخ ورود خودرو (arrivalDateTime)</option>
                                <option value="contactDateTime">تاریخ تماس با مشتری (contactDateTime)</option>
                                <option value="documentDate">تاریخ سند (documentDate)</option>
                                <option value="id">شناسه پرونده (ID)</option>
                                <option value="createdAt">تاریخ ثبت سیستم (createdAt)</option>
                                <option value="customerName">نام مشتری (الفبایی)</option>
                                <option value="carModel">مدل خودرو</option>
                                <option value="chassisNumber">شماره شاسی</option>
                                <option value="contractNumber">شماره قرارداد</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            title={sortOrder === 'desc' ? 'ترتیب نزولی (جدیدترین به قدیمی‌ترین)' : 'ترتیب صعودی (قدیمی‌ترین به جدیدترین)'}
                            className="mt-6 p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl border border-slate-200 dark:border-slate-600 flex items-center gap-1.5 text-xs font-bold transition-colors"
                        >
                            <span>{sortOrder === 'desc' ? 'نزولی ↓' : 'صعودی ↑'}</span>
                        </button>
                    </div>
                </div>

                {/* Date Range Sub-Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
                    <div className="sm:col-span-3 flex items-center gap-2">
                        <span className="text-slate-400 font-bold whitespace-nowrap">فیلتر بازه زمانی:</span>
                        <select
                            value={dateFieldFilter}
                            onChange={(e) => setDateFieldFilter(e.target.value as any)}
                            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
                        >
                            <option value="deliveryDateTime">تاریخ تحویل</option>
                            <option value="arrivalDateTime">تاریخ ورود</option>
                            <option value="contactDateTime">تاریخ تماس</option>
                            <option value="documentDate">تاریخ سند</option>
                        </select>
                    </div>

                    <div className="sm:col-span-4">
                        <PersianDatePicker value={startDate} onChange={setStartDate} placeholder="از تاریخ..." />
                    </div>
                    <div className="sm:col-span-4">
                        <PersianDatePicker value={endDate} onChange={setEndDate} placeholder="تا تاریخ..." />
                    </div>
                    
                    <div className="sm:col-span-1 flex justify-end">
                        {(searchQuery || statusFilter !== 'all' || carModelFilter !== 'all' || startDate || endDate || deliveryStatusQuickFilter !== 'ALL' || sortField !== 'deliveryDateTime' || sortOrder !== 'desc') && (
                            <button
                                onClick={handleResetFilters}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors whitespace-nowrap"
                            >
                                بازنشانی
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table or Loading */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Spinner />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-3">در حال فراخوانی اطلاعات خودروهای صفر...</span>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black">
                                <tr>
                                    <th className="p-4 w-12 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('id')}>
                                        <span>ردیف</span>
                                        {sortField === 'id' && <span className="mr-1 text-cyan-600">{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                                    </th>
                                    <th className="p-4">وضعیت</th>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('customerName')}>
                                        <span>مشتری و تماس</span>
                                        {sortField === 'customerName' && <span className="mr-1 text-cyan-600">{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('carModel')}>
                                        <span>خودرو و رنگ</span>
                                        {sortField === 'carModel' && <span className="mr-1 text-cyan-600">{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('chassisNumber')}>
                                        <span>شماره شاسی / قرارداد</span>
                                        {sortField === 'chassisNumber' && <span className="mr-1 text-cyan-600">{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                                    </th>
                                    <th className="p-4">پلاک</th>
                                    <th className="p-4 cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-950/40 bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-900 dark:text-cyan-200" onClick={() => handleSort('deliveryDateTime')}>
                                        <div className="flex items-center gap-1">
                                            <CalendarIcon className="w-3.5 h-3.5 text-cyan-600" />
                                            <span>تاریخ و ساعت تحویل</span>
                                            {sortField === 'deliveryDateTime' && <span className="mr-1 font-black text-cyan-600">{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                                        </div>
                                    </th>
                                    <th className="p-4">سند و ورود</th>
                                    <th className="p-4 text-center">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {paginatedDeliveries.map((item, index) => {
                                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                                    const isDelivered = item.status === 'تحويل به مشتري' || item.status === 'تحویل به مشتری' || item.status === 'تحویل شده' || item.status === 'DELIVERED';

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors text-slate-800 dark:text-slate-200 group">
                                            {/* Row Number & ID */}
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{rowNumber.toLocaleString('fa-IR')}</span>
                                                    <span className="font-mono text-[10px] text-slate-400">#{item.id}</span>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="p-4">
                                                {getStatusBadge(item.status)}
                                            </td>

                                            {/* Customer Name & Phone */}
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-slate-900 dark:text-white text-xs">{item.customerName}</span>
                                                    <div className="flex items-center gap-2">
                                                        <a 
                                                            href={`tel:${item.phoneNumber}`} 
                                                            className="font-mono text-[11px] text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1 dir-ltr"
                                                        >
                                                            <PhoneIcon className="w-3 h-3" />
                                                            <span>{item.phoneNumber}</span>
                                                        </a>
                                                        {item.secondOwnerName && (
                                                            <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                                                مالک ۲: {item.secondOwnerName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Car Model & Color */}
                                            <td className="p-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-black text-slate-800 dark:text-slate-100">{item.carModel || '-'}</span>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                                        <span>{item.color || 'رنگ نامشخص'}</span>
                                                    </div>
                                                    {item.installedOptions && (
                                                        <span className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded mt-0.5 max-w-[140px] truncate" title={item.installedOptions}>
                                                            آپشن: {item.installedOptions}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Chassis & Contract */}
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 select-all">{item.chassisNumber}</span>
                                                    {item.contractNumber ? (
                                                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md w-fit">
                                                            قرارداد: {item.contractNumber}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400">فاقد قرارداد</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Plate Number */}
                                            <td className="p-4">
                                                {item.plateNumber ? (
                                                    <span className="bg-slate-100 dark:bg-slate-700/80 px-2.5 py-1 rounded-xl font-mono text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 inline-block direction-ltr shadow-2xs">
                                                        {item.plateNumber}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800/60 font-bold">
                                                        بدون پلاک
                                                    </span>
                                                )}
                                            </td>

                                            {/* Delivery DateTime (Highlighted) */}
                                            <td className="p-4 bg-cyan-50/30 dark:bg-cyan-950/10">
                                                {item.deliveryDateTime ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-300/80 dark:border-emerald-800 inline-block w-fit">
                                                            {formatPersianDateTime(item.deliveryDateTime)}
                                                        </span>
                                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                            <CheckCircleIcon className="w-3 h-3 inline" />
                                                            تحویل قطعی
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-400 text-xs">ثبت‌نشده</span>
                                                        <button
                                                            onClick={() => handleQuickDeliverNow(item)}
                                                            className="text-[10px] bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-900/60 dark:hover:bg-cyan-800 dark:text-cyan-200 px-2 py-1 rounded-lg font-bold border border-cyan-300 dark:border-cyan-700 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="ثبت تحویل در تاریخ و ساعت جاری"
                                                        >
                                                            تحویل اکنون
                                                        </button>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Document & Arrival details */}
                                            <td className="p-4">
                                                <div className="flex flex-col gap-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                    {item.documentNumber && <span>سند: <strong className="font-mono text-slate-700 dark:text-slate-300">{item.documentNumber}</strong></span>}
                                                    {item.arrivalDateTime && <span>ورود: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatPersianDateTime(item.arrivalDateTime)}</strong></span>}
                                                    {item.contactDateTime && <span>تماس: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatPersianDateTime(item.contactDateTime)}</strong></span>}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button 
                                                        onClick={() => openViewModal(item)} 
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 rounded-xl transition-colors"
                                                        title="مشاهده پرونده کامل"
                                                    >
                                                        <EyeIcon className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => openEditModal(item)} 
                                                        className="p-2 text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-950/50 rounded-xl transition-colors"
                                                        title="ویرایش پرونده"
                                                    >
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)} 
                                                        className="p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                                                        title="حذف پرونده"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {paginatedDeliveries.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="p-12 text-center text-slate-400 font-bold text-sm">
                                            هیچ پرونده‌ای با شرایط فیلتر انتخاب‌شده یافت نشد.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination with First, Previous, Numbers, Next, Last Navigation */}
                    {filteredDeliveries.length > 0 && (
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={setCurrentPage} 
                            totalItems={filteredDeliveries.length}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    )}
                </div>
            )}

            {/* View Full Dossier Modal */}
            {isViewModalOpen && viewRecord && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4" onClick={() => setIsViewModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 rounded-2xl">
                                    <TruckIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-slate-900 dark:text-white">پرونده تحویل خودرو صفر</h3>
                                    <span className="text-xs text-slate-400 font-mono">شناسه رکورد: #{viewRecord.id}</span>
                                </div>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5 text-xs">
                            {/* Status Header Bar */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <span className="font-bold text-slate-600 dark:text-slate-400">وضعیت فرآیند تحویل:</span>
                                <div>{getStatusBadge(viewRecord.status)}</div>
                            </div>

                            {/* Section 1: Customer & Contract */}
                            <div className="space-y-2.5">
                                <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                    اطلاعات مشتری و قرارداد
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">نام مشتری:</span>
                                        <strong className="font-bold text-slate-900 dark:text-white">{viewRecord.customerName}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">شماره تماس:</span>
                                        <a href={`tel:${viewRecord.phoneNumber}`} className="font-mono font-bold text-cyan-600 dark:text-cyan-400 dir-ltr inline-block">{viewRecord.phoneNumber}</a>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">مالک دوم:</span>
                                        <span className="font-bold">{viewRecord.secondOwnerName || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">شماره قرارداد:</span>
                                        <span className="font-mono font-bold">{viewRecord.contractNumber || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">شماره سند:</span>
                                        <span className="font-mono font-bold">{viewRecord.documentNumber || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">تاریخ سند:</span>
                                        <span className="font-mono font-bold">{formatPersianDateTime(viewRecord.documentDate)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Vehicle Specs */}
                            <div className="space-y-2.5">
                                <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                    مشخصات فنی و پلاک خودرو
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">مدل خودرو:</span>
                                        <strong className="font-bold text-slate-900 dark:text-white">{viewRecord.carModel}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">رنگ:</span>
                                        <span className="font-bold">{viewRecord.color}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">شماره شاسی:</span>
                                        <span className="font-mono font-bold select-all text-cyan-700 dark:text-cyan-300">{viewRecord.chassisNumber}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block mb-0.5">پلاک خودرو:</span>
                                        <span className="font-mono font-bold">{viewRecord.plateNumber || 'فاقد پلاک'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-slate-400 block mb-0.5">آپشن‌های نصب شده:</span>
                                        <span>{viewRecord.installedOptions || 'هیچ آپشنی ثبت نشده است'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Delivery Timeline */}
                            <div className="space-y-2.5">
                                <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    گاه‌شمار و زمان‌بندی تحویل
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/60">
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">تاریخ ورود خودرو:</span>
                                        <strong className="font-mono text-emerald-800 dark:text-emerald-300">{formatPersianDateTime(viewRecord.arrivalDateTime)}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">تاریخ تماس با مشتری:</span>
                                        <strong className="font-mono text-emerald-800 dark:text-emerald-300">{formatPersianDateTime(viewRecord.contactDateTime)}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">تاریخ و ساعت تحویل:</span>
                                        <strong className="font-mono text-emerald-700 dark:text-emerald-300 font-black">{formatPersianDateTime(viewRecord.deliveryDateTime)}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {(viewRecord.verificationNotes || viewRecord.deliveryNotes) && (
                                <div className="space-y-2.5">
                                    <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm">یادداشت‌ها و توضیحات</h4>
                                    {viewRecord.verificationNotes && (
                                        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/50 text-amber-900 dark:text-amber-200">
                                            <strong className="block text-[11px] mb-1">توضیحات مدارک و فنی:</strong>
                                            <p className="whitespace-pre-wrap">{viewRecord.verificationNotes}</p>
                                        </div>
                                    )}
                                    {viewRecord.deliveryNotes && (
                                        <div className="p-3 bg-cyan-50/60 dark:bg-cyan-950/30 rounded-xl border border-cyan-200/60 dark:border-cyan-800/50 text-cyan-900 dark:text-cyan-200">
                                            <strong className="block text-[11px] mb-1">توضیحات فرآیند تحویل:</strong>
                                            <p className="whitespace-pre-wrap">{viewRecord.deliveryNotes}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* System timestamps */}
                            {(viewRecord.createdAt || viewRecord.updatedAt) && (
                                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t dark:border-slate-700 font-mono">
                                    <span>ثبت سیستمی: {viewRecord.createdAt || '-'}</span>
                                    <span>آخرین بروزرسانی: {viewRecord.updatedAt || '-'}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
                            <button
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    openEditModal(viewRecord);
                                }}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors"
                            >
                                <EditIcon className="w-4 h-4" />
                                ویرایش پرونده
                            </button>
                            <button 
                                onClick={() => setIsViewModalOpen(false)} 
                                className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-bold transition-colors"
                            >
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit / Create Dossier Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 rounded-t-3xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-300 rounded-2xl">
                                    <TruckIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-slate-800 dark:text-white">
                                        {currentRecord.id ? `ویرایش پرونده تحویل #${currentRecord.id}` : 'ثبت پرونده جدید تحویل خودرو'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">تمام فیلدهای هماهنگ با پایگاه‌داده خودروهای صفر</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Tabs */}
                        <div className="flex border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-6 gap-2">
                            <button 
                                onClick={() => setActiveTab(1)}
                                className={`py-3.5 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
                                    activeTab === 1 ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                            >
                                <span>۱. مشتری و قرارداد</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab(2)}
                                className={`py-3.5 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
                                    activeTab === 2 ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                            >
                                <span>۲. خودرو و آپشن‌ها</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab(3)}
                                className={`py-3.5 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
                                    activeTab === 3 ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                            >
                                <span>۳. زمان‌بندی و تحویل</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab(4)}
                                className={`py-3.5 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
                                    activeTab === 4 ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                            >
                                <span>۴. توضیحات و مستندات</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Tab 1: Customer & Documents */}
                            {activeTab === 1 && (
                                <div className="space-y-4 animate-fade-in text-xs">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                <span>نام و نام خانوادگی مشتری</span>
                                                <span className="text-rose-500">*</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500" 
                                                value={currentRecord.customerName || ''} 
                                                onChange={e => setCurrentRecord({...currentRecord, customerName: e.target.value})} 
                                                placeholder="مثال: هادي عباس زاده اکبرآبادي"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-700 dark:text-slate-300">شماره تلفن تماس</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono dir-ltr outline-none focus:ring-2 focus:ring-cyan-500" 
                                                value={currentRecord.phoneNumber || ''} 
                                                onChange={e => setCurrentRecord({...currentRecord, phoneNumber: e.target.value})} 
                                                placeholder="0917..."
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-700 dark:text-slate-300">نام مالک دوم (در صورت وجود)</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" 
                                                value={currentRecord.secondOwnerName || ''} 
                                                onChange={e => setCurrentRecord({...currentRecord, secondOwnerName: e.target.value})} 
                                                placeholder="اختیاری..."
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-700 dark:text-slate-300">شماره قرارداد</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono dir-ltr outline-none focus:ring-2 focus:ring-cyan-500" 
                                                value={currentRecord.contractNumber || ''} 
                                                onChange={e => setCurrentRecord({...currentRecord, contractNumber: e.target.value})} 
                                                placeholder="مثال: 981245"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-700 dark:text-slate-300">شماره سند</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono dir-ltr outline-none focus:ring-2 focus:ring-cyan-500" 
                                                value={currentRecord.documentNumber || ''} 
                                                onChange={e => setCurrentRecord({...currentRecord, documentNumber: e.target.value})} 
                                                placeholder="مثال: 20315248"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-700 dark:text-slate-300">تاریخ سند</label>
                                            <PersianDatePicker 
                                                value={currentRecord.documentDate || ''}
                                                onChange={date => setCurrentRecord({...currentRecord, documentDate: date})}
                                                enableTime={false}
                                                placeholder="1405/xx/xx"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Vehicle Specs */}
                            {activeTab === 2 && (
                                <div className="space-y-4 animate-fade-in text-xs">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-700 dark:text-slate-300">مدل خودرو</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500" 
                                                    value={currentRecord.carModel || ''} 
                                                    onChange={e => setCurrentRecord({...currentRecord, carModel: e.target.value})} 
                                                    placeholder="مثال: J4 یا KMC T8"
                                                />
                                                <select 
                                                    className="px-3 py-2 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white font-bold outline-none text-xs"
                                                    value=""
                                                    onChange={e => {
                                                        if (e.target.value) {
                                                            setCurrentRecord({...currentRecord, carModel: e.target.value});
                                                        }
                                                    }}
                                                >
                                                    <option value="">انتخاب سریع</option>
                                                    {POPULAR_CAR_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-700 dark:text-slate-300">رنگ خودرو</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500" 
                                                value={currentRecord.color || ''} 
                                                onChange={e => setCurrentRecord({...currentRecord, color: e.target.value})} 
                                                placeholder="سفید، مشکی، خاکستری..."
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                <span>شماره شاسی خودرو</span>
                                                <span className="text-rose-500">*</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono dir-ltr font-black outline-none focus:ring-2 focus:ring-cyan-500 uppercase" 
                                                value={currentRecord.chassisNumber || ''} 
                                                onChange={e => setCurrentRecord({...currentRecord, chassisNumber: e.target.value.toUpperCase()})} 
                                                placeholder="مثال: NAKNF7526TB175622"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-700 dark:text-slate-300">شماره پلاک</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono outline-none focus:ring-2 focus:ring-cyan-500" 
                                                value={currentRecord.plateNumber || ''} 
                                                onChange={e => setCurrentRecord({...currentRecord, plateNumber: e.target.value})} 
                                                placeholder="مثال: 88ص187-93ايران"
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="font-bold text-slate-700 dark:text-slate-300">آپشن‌های نصب شده</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" 
                                                value={currentRecord.installedOptions || ''} 
                                                onChange={e => setCurrentRecord({...currentRecord, installedOptions: e.target.value})} 
                                                placeholder="کفی ۵ بعدی، شیشه دودی، کروز کنترل، سینی زیر موتور..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Logistics & Timelines */}
                            {activeTab === 3 && (
                                <div className="space-y-4 animate-fade-in text-xs">
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-700 dark:text-slate-300">وضعیت فرآیند تحویل</label>
                                        <div className="flex gap-2">
                                            <select 
                                                className="flex-1 px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white font-bold outline-none focus:ring-2 focus:ring-cyan-500" 
                                                value={currentRecord.status || 'تایید مدارک'} 
                                                onChange={e => setCurrentRecord({...currentRecord, status: e.target.value})}
                                            >
                                                {availableStatuses.map(st => (
                                                    <option key={st} value={st}>{STATUS_CONFIG[st]?.label || st}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        {/* Arrival Date */}
                                        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="font-bold text-slate-700 dark:text-slate-300">تاریخ و ساعت ورود خودرو</label>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetNow('arrivalDateTime')}
                                                    className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 font-bold"
                                                >
                                                    ثبت اکنون
                                                </button>
                                            </div>
                                            <PersianDatePicker 
                                                value={currentRecord.arrivalDateTime || ''}
                                                onChange={date => setCurrentRecord({...currentRecord, arrivalDateTime: date})}
                                                enableTime={true}
                                                placeholder="1405/xx/xx xx:xx"
                                            />
                                        </div>

                                        {/* Contact Date */}
                                        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="font-bold text-slate-700 dark:text-slate-300">تاریخ و ساعت تماس با مشتری</label>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetNow('contactDateTime')}
                                                    className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300 font-bold"
                                                >
                                                    ثبت اکنون
                                                </button>
                                            </div>
                                            <PersianDatePicker 
                                                value={currentRecord.contactDateTime || ''}
                                                onChange={date => setCurrentRecord({...currentRecord, contactDateTime: date})}
                                                enableTime={true}
                                                placeholder="1405/xx/xx xx:xx"
                                            />
                                        </div>

                                        {/* Delivery Date */}
                                        <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="font-black text-emerald-800 dark:text-emerald-300">تاریخ و ساعت تحویل نهایی</label>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetNow('deliveryDateTime', true)}
                                                    className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-lg font-black hover:bg-emerald-700 shadow-2xs"
                                                >
                                                    تحویل قطعی اکنون
                                                </button>
                                            </div>
                                            <PersianDatePicker 
                                                value={currentRecord.deliveryDateTime || ''}
                                                onChange={date => setCurrentRecord({...currentRecord, deliveryDateTime: date})}
                                                enableTime={true}
                                                placeholder="1405/xx/xx xx:xx"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 4: Notes */}
                            {activeTab === 4 && (
                                <div className="space-y-4 animate-fade-in text-xs">
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-700 dark:text-slate-300">توضیحات تایید مدارک و سلامت خودرو</label>
                                        <textarea 
                                            rows={3} 
                                            className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" 
                                            value={currentRecord.verificationNotes || ''} 
                                            onChange={e => setCurrentRecord({...currentRecord, verificationNotes: e.target.value})}
                                            placeholder="نکات مربوط به احراز هویت، مدارک شناسایی، وضعیت بدنه و سند..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-700 dark:text-slate-300">توضیحات فرآیند تحویل و خروج</label>
                                        <textarea 
                                            rows={3} 
                                            className="w-full px-3.5 py-2.5 border rounded-2xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" 
                                            value={currentRecord.deliveryNotes || ''} 
                                            onChange={e => setCurrentRecord({...currentRecord, deliveryNotes: e.target.value})}
                                            placeholder="توضیحات مربوط به تحویل فیزیکی، فرم رضایت، اقلام همراه..."
                                        />
                                    </div>

                                    {currentRecord.id && (
                                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                                            <span>شناسه رکورد: #{currentRecord.id}</span>
                                            {currentRecord.createdAt && <span>ایجاد: {currentRecord.createdAt}</span>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 rounded-b-3xl">
                            <div className="flex gap-2">
                                {activeTab > 1 && (
                                    <button 
                                        type="button"
                                        onClick={() => setActiveTab((activeTab - 1) as any)} 
                                        className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors"
                                    >
                                        مرحله قبل
                                    </button>
                                )}
                                {activeTab < 4 && (
                                    <button 
                                        type="button"
                                        onClick={() => setActiveTab((activeTab + 1) as any)} 
                                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold transition-colors"
                                    >
                                        مرحله بعد
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)} 
                                    className="px-4 py-2.5 text-slate-500 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:bg-slate-700 rounded-2xl text-xs font-bold transition-colors"
                                >
                                    انصراف
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleSave} 
                                    className="px-6 py-2.5 bg-cyan-600 text-white rounded-2xl hover:bg-cyan-700 text-xs font-black shadow-sm transition-transform active:scale-95"
                                >
                                    ذخیره اطلاعات
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Excel Upload Modal */}
            <ExcelUploadModal 
                isOpen={isExcelModalOpen} 
                onClose={() => setIsExcelModalOpen(false)} 
                onSuccess={fetchDeliveries} 
            />

            {/* Toast Feedback */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ZeroCarDeliveryPage;
