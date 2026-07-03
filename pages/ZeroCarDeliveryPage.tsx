
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
import { CalendarIcon } from '../components/icons/CalendarIcon';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import PersianDatePicker from '../components/PersianDatePicker';
import ExcelUploadModal from '../components/ExcelUploadModal';
import Pagination from '../components/Pagination';

// Declare moment from global scope
declare const moment: any;

const STATUS_LABELS: Record<string, string> = {
    'VERIFICATION': 'تایید مدارک',
    'PROCESSING': 'در حال آماده‌سازی',
    'IN_SHOWROOM': 'در سالن',
    'IN_WAREHOUSE_1': 'در انبار ۱',
    'IN_WAREHOUSE_2': 'در انبار ۲',
    'DELIVERED': 'تحویل شده'
};

const STATUS_COLORS: Record<string, string> = {
    'VERIFICATION': 'bg-yellow-100 text-yellow-800',
    'PROCESSING': 'bg-blue-100 text-blue-800',
    'IN_SHOWROOM': 'bg-purple-100 text-purple-800',
    'IN_WAREHOUSE_1': 'bg-indigo-100 text-indigo-800',
    'IN_WAREHOUSE_2': 'bg-sky-100 text-sky-800',
    'DELIVERED': 'bg-green-100 text-green-800'
};

const CAR_MODELS = [
    'JAC J4', 'JAC S3', 'JAC S5', 'BAC X3PRO', 'KMC T8', 'KMC T9', 'KMC A5',
    'KMC J7', 'KMC X5', 'KMC SR3', 'KMC EAGLE', 'KMC SHADOW', 'KMC SR6'
];

const ITEMS_PER_PAGE = 50;

const ZeroCarDeliveryPage: React.FC = () => {
    const [deliveries, setDeliveries] = useState<ZeroCarDelivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<Partial<ZeroCarDelivery>>({});
    const [activeTab, setActiveTab] = useState<1 | 2>(1);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // View Mode
    const [viewMode, setViewMode] = useState<'LIST' | 'REPORT'>('LIST');

    // Filter States (List View)
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Filter States (Report View)
    const [reportCarModel, setReportCarModel] = useState('all');
    const [reportStatus, setReportStatus] = useState('all');
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const data = await zeroCarDeliveryService.getAll();
            setDeliveries(data);
        } catch (error) {
            setToast({ message: 'خطا در بارگذاری اطلاعات', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, startDate, endDate]);

    // Filter & Sort Logic (List View)
    const filteredDeliveries = useMemo(() => {
        const filtered = deliveries.filter(item => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = 
                (item.customerName?.toLowerCase() || '').includes(searchLower) ||
                (item.plateNumber?.toLowerCase() || '').includes(searchLower) ||
                (item.chassisNumber?.toLowerCase() || '').includes(searchLower) ||
                (item.phoneNumber || '').includes(searchLower) ||
                (item.contractNumber || '').includes(searchLower);

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

            let matchesDate = true;
            const itemDate = item.documentDate; 
            
            if (itemDate) {
                if (startDate && itemDate < startDate) matchesDate = false;
                if (endDate && itemDate > endDate) matchesDate = false;
            } else if (startDate || endDate) {
                matchesDate = false;
            }

            return matchesSearch && matchesStatus && matchesDate;
        });

        return filtered.sort((a, b) => {
            const contractA = a.contractNumber || '';
            const contractB = b.contractNumber || '';
            return contractB.localeCompare(contractA, 'fa-IR', { numeric: true });
        });
    }, [deliveries, searchQuery, statusFilter, startDate, endDate]);

    // Report Logic
    const reportData = useMemo(() => {
        return deliveries.filter(item => {
            const matchesModel = reportCarModel === 'all' || item.carModel === reportCarModel;
            const matchesStatus = reportStatus === 'all' || item.status === reportStatus;
            
            let matchesDate = true;
            // Use Delivery Date for reporting if available, otherwise Document Date as fallback
            const dateStr = item.deliveryDateTime ? item.deliveryDateTime.split(' ')[0] : item.documentDate;
            
            if (dateStr) {
                if (reportStartDate && dateStr < reportStartDate) matchesDate = false;
                if (reportEndDate && dateStr > reportEndDate) matchesDate = false;
            } else if (reportStartDate || reportEndDate) {
                // If filter is set but item has no date, exclude it
                matchesDate = false;
            }

            return matchesModel && matchesStatus && matchesDate;
        });
    }, [deliveries, reportCarModel, reportStatus, reportStartDate, reportEndDate]);

    const reportStats = useMemo(() => {
        const stats = {
            total: reportData.length,
            byStatus: {} as Record<string, number>,
            byModel: {} as Record<string, number>
        };

        reportData.forEach(item => {
            // Status Count
            stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
            // Model Count
            if (item.carModel) {
                stats.byModel[item.carModel] = (stats.byModel[item.carModel] || 0) + 1;
            }
        });

        return stats;
    }, [reportData]);

    const paginatedDeliveries = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredDeliveries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredDeliveries, currentPage]);

    const totalPages = Math.ceil(filteredDeliveries.length / ITEMS_PER_PAGE);

    const handleSave = async () => {
        if (!currentRecord.customerName || !currentRecord.chassisNumber) {
            setToast({ message: 'نام مشتری و شماره شاسی الزامی است', type: 'error' });
            return;
        }

        try {
            if (currentRecord.id) {
                await zeroCarDeliveryService.update(currentRecord as ZeroCarDelivery);
                setToast({ message: 'رکورد با موفقیت ویرایش شد', type: 'success' });
            } else {
                await zeroCarDeliveryService.create({
                    ...currentRecord,
                    status: currentRecord.status || 'VERIFICATION'
                });
                setToast({ message: 'رکورد جدید ثبت شد', type: 'success' });
            }
            setIsModalOpen(false);
            fetchDeliveries();
        } catch (error) {
            setToast({ message: 'خطا در ذخیره اطلاعات', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('آیا از حذف این رکورد اطمینان دارید؟')) {
            try {
                await zeroCarDeliveryService.delete(id);
                setToast({ message: 'حذف شد', type: 'success' });
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
                updates.status = 'DELIVERED';
            }
            return { ...prev, ...updates };
        });
        if (updateStatus) {
            setToast({ message: 'زمان ثبت شد و وضعیت به "تحویل شده" تغییر یافت.', type: 'success' });
        } else {
            setToast({ message: 'زمان کنونی ثبت شد.', type: 'success' });
        }
    };

    const openModal = (record?: ZeroCarDelivery) => {
        setCurrentRecord(record || { status: 'VERIFICATION' });
        setActiveTab(1);
        setIsModalOpen(true);
    };

    // Render Logic
    if (viewMode === 'REPORT') {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl text-indigo-600 dark:text-indigo-300">
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">گزارش‌گیری تحویل خودرو</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">تحلیل آماری بر اساس وضعیت و تاریخ تحویل</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setViewMode('LIST')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-bold text-sm"
                    >
                        <CloseIcon className="w-4 h-4" />
                        بازگشت به لیست
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">خودرو</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={reportCarModel}
                                onChange={(e) => setReportCarModel(e.target.value)}
                            >
                                <option value="all">همه مدل‌ها</option>
                                {CAR_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">وضعیت</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={reportStatus}
                                onChange={(e) => setReportStatus(e.target.value)}
                            >
                                <option value="all">همه وضعیت‌ها</option>
                                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">از تاریخ (تحویل/سند)</label>
                            <PersianDatePicker value={reportStartDate} onChange={setReportStartDate} placeholder="انتخاب کنید" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تا تاریخ (تحویل/سند)</label>
                            <PersianDatePicker value={reportEndDate} onChange={setReportEndDate} placeholder="انتخاب کنید" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 text-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">کل خودروها</span>
                        <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">{reportStats.total}</span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800 text-center">
                        <span className="text-xs text-green-600 dark:text-green-400 block mb-1">تحویل شده</span>
                        <span className="text-2xl font-black text-green-700 dark:text-green-300 font-mono">{reportStats.byStatus['DELIVERED'] || 0}</span>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800 text-center">
                        <span className="text-xs text-purple-600 dark:text-purple-400 block mb-1">در سالن</span>
                        <span className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">{reportStats.byStatus['IN_SHOWROOM'] || 0}</span>
                    </div>
                    <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-xl border border-sky-200 dark:border-sky-800 text-center">
                        <span className="text-xs text-sky-600 dark:text-sky-400 block mb-1">در انبارها</span>
                        <span className="text-2xl font-black text-sky-700 dark:text-sky-300 font-mono">{(reportStats.byStatus['IN_WAREHOUSE_1'] || 0) + (reportStats.byStatus['IN_WAREHOUSE_2'] || 0)}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                <tr>
                                    <th className="p-4">مشتری</th>
                                    <th className="p-4">خودرو</th>
                                    <th className="p-4">وضعیت</th>
                                    <th className="p-4">تاریخ تحویل</th>
                                    <th className="p-4">توضیحات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {reportData.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{item.customerName}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">
                                            {item.carModel} <span className="text-xs opacity-70">({item.chassisNumber})</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${STATUS_COLORS[item.status]}`}>
                                                {STATUS_LABELS[item.status]}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-slate-600 dark:text-slate-300">
                                            {item.deliveryDateTime ? item.deliveryDateTime.split(' ')[0] : '-'}
                                        </td>
                                        <td className="p-4 text-xs text-slate-500 max-w-xs truncate">{item.deliveryNotes || '-'}</td>
                                    </tr>
                                ))}
                                {reportData.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">اطلاعاتی یافت نشد.</td></tr>
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-xl text-cyan-600 dark:text-cyan-300">
                        <TruckIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">تحویل خودرو صفر</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">مدیریت تایید مدارک و فرآیند تحویل</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('REPORT')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-transform active:scale-95">
                        <ChartBarIcon className="w-5 h-5" /> <span className="hidden sm:inline">گزارش‌گیری</span>
                    </button>
                    <button onClick={() => setIsExcelModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm transition-transform active:scale-95">
                        <UploadIcon className="w-5 h-5" /> <span className="hidden sm:inline">آپلود اکسل</span>
                    </button>
                    <button onClick={() => openModal()} className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center gap-2 shadow-sm transition-transform active:scale-95">
                        <PlusIcon className="w-5 h-5" /> <span className="hidden sm:inline">ثبت جدید</span>
                    </button>
                </div>
            </div>

            {/* Search & Filter Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">جستجو</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="نام، قرارداد، شاسی، پلاک..." 
                            className="w-full px-4 py-2 pl-10 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute left-3 top-2.5 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">وضعیت</label>
                    <select 
                        className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">همه وضعیت‌ها</option>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">از تاریخ (سند)</label>
                    <PersianDatePicker value={startDate} onChange={setStartDate} placeholder="انتخاب کنید" />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تا تاریخ (سند)</label>
                    <PersianDatePicker value={endDate} onChange={setEndDate} placeholder="انتخاب کنید" />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Spinner /></div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                <tr>
                                    <th className="p-4">مشتری</th>
                                    <th className="p-4">خودرو</th>
                                    <th className="p-4">شاسی / قرارداد</th>
                                    <th className="p-4">پلاک</th>
                                    <th className="p-4">وضعیت</th>
                                    <th className="p-4">تماس</th>
                                    <th className="p-4">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {paginatedDeliveries.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-800 dark:text-slate-200">
                                        <td className="p-4 font-bold">{item.customerName}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span>{item.carModel}</span>
                                                <span className="text-xs text-slate-400">{item.color}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-mono text-xs">{item.chassisNumber}</span>
                                                {item.contractNumber && <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded w-fit">{item.contractNumber}</span>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {item.plateNumber ? (
                                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-mono text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 inline-block direction-ltr">
                                                    {item.plateNumber}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${STATUS_COLORS[item.status] || 'bg-slate-200 text-slate-700'}`}>
                                                {STATUS_LABELS[item.status] || item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono">{item.phoneNumber}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openModal(item)} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg"><EditIcon /></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedDeliveries.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400">موردی یافت نشد</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={setCurrentPage} 
                            totalItems={filteredDeliveries.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                        />
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">پرونده تحویل خودرو صفر</h3>
                            <button onClick={() => setIsModalOpen(false)}><CloseIcon className="text-slate-500" /></button>
                        </div>
                        
                        {/* Tabs */}
                        <div className="flex border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <button 
                                onClick={() => setActiveTab(1)}
                                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 1 ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                ۱- تایید مدارک و سلامت خودرو
                            </button>
                            <button 
                                onClick={() => setActiveTab(2)}
                                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 2 ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                ۲- روند تحویل به مشتری
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {activeTab === 1 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">نام و نام خانوادگی</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.customerName || ''} onChange={e => setCurrentRecord({...currentRecord, customerName: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">شماره تماس</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono" dir="ltr" value={currentRecord.phoneNumber || ''} onChange={e => setCurrentRecord({...currentRecord, phoneNumber: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">نوع خودرو</label>
                                            <select className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.carModel || ''} onChange={e => setCurrentRecord({...currentRecord, carModel: e.target.value})}>
                                                <option value="">انتخاب کنید</option>
                                                {CAR_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">رنگ خودرو</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.color || ''} onChange={e => setCurrentRecord({...currentRecord, color: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">شماره شاسی</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono" dir="ltr" value={currentRecord.chassisNumber || ''} onChange={e => setCurrentRecord({...currentRecord, chassisNumber: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">شماره پلاک</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono" value={currentRecord.plateNumber || ''} onChange={e => setCurrentRecord({...currentRecord, plateNumber: e.target.value})} placeholder="مثال: ۱۱ ع ۲۲۲ ایران ۳۳" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">شماره قرارداد</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono" dir="ltr" value={currentRecord.contractNumber || ''} onChange={e => setCurrentRecord({...currentRecord, contractNumber: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">شماره سند</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono" dir="ltr" value={currentRecord.documentNumber || ''} onChange={e => setCurrentRecord({...currentRecord, documentNumber: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">تاریخ سند</label>
                                            <PersianDatePicker 
                                                value={currentRecord.documentDate || ''}
                                                onChange={date => setCurrentRecord({...currentRecord, documentDate: date})}
                                                enableTime={false}
                                                placeholder="1403/xx/xx"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">نام مالک دوم (اختیاری)</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.secondOwnerName || ''} onChange={e => setCurrentRecord({...currentRecord, secondOwnerName: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">وضعیت فعلی</label>
                                            <select className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.status || 'VERIFICATION'} onChange={e => setCurrentRecord({...currentRecord, status: e.target.value as any})}>
                                                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                                    <option key={key} value={key}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400">سایر توضیحات</label>
                                        <textarea rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.verificationNotes || ''} onChange={e => setCurrentRecord({...currentRecord, verificationNotes: e.target.value})}></textarea>
                                    </div>
                                </div>
                            )}

                            {activeTab === 2 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">تاریخ و ساعت ورود خودرو</label>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetNow('arrivalDateTime')}
                                                    className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                >
                                                    ثبت زمان اکنون
                                                </button>
                                            </div>
                                            <PersianDatePicker 
                                                value={currentRecord.arrivalDateTime || ''}
                                                onChange={date => setCurrentRecord({...currentRecord, arrivalDateTime: date})}
                                                enableTime={true}
                                                placeholder="1403/xx/xx xx:xx"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">تاریخ و ساعت تماس با مشتری</label>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetNow('contactDateTime')}
                                                    className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 transition-colors dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/50"
                                                >
                                                    ثبت زمان اکنون
                                                </button>
                                            </div>
                                            <PersianDatePicker 
                                                value={currentRecord.contactDateTime || ''}
                                                onChange={date => setCurrentRecord({...currentRecord, contactDateTime: date})}
                                                enableTime={true}
                                                placeholder="1403/xx/xx xx:xx"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">تاریخ و ساعت تحویل نهایی</label>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetNow('deliveryDateTime', true)}
                                                    className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors font-bold dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                                                >
                                                    ثبت تحویل نهایی (اکنون)
                                                </button>
                                            </div>
                                            <PersianDatePicker 
                                                value={currentRecord.deliveryDateTime || ''}
                                                onChange={date => setCurrentRecord({...currentRecord, deliveryDateTime: date})}
                                                enableTime={true}
                                                placeholder="1403/xx/xx xx:xx"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">آپشن‌های نصب شده</label>
                                            <input type="text" placeholder="کفی، شیشه دودی..." className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.installedOptions || ''} onChange={e => setCurrentRecord({...currentRecord, installedOptions: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400">توضیحات تکمیلی روند تحویل</label>
                                        <textarea rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.deliveryNotes || ''} onChange={e => setCurrentRecord({...currentRecord, deliveryNotes: e.target.value})}></textarea>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700">انصراف</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">ذخیره تغییرات</button>
                        </div>
                    </div>
                </div>
            )}
            
            <ExcelUploadModal 
                isOpen={isExcelModalOpen} 
                onClose={() => setIsExcelModalOpen(false)} 
                onSuccess={fetchDeliveries} 
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ZeroCarDeliveryPage;
