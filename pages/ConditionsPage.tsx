
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getConditions, createCondition, updateCondition, deleteCondition, getCars } from '../services/api';
import { SaleType, ConditionStatus } from '../types';
import type { CarSaleCondition, Car } from '../types';
import ConditionTable from '../components/ConditionTable';
import FilterPanel from '../components/FilterPanel';
import ConditionModal from '../components/ConditionModal';
import ConditionViewModal from '../components/ConditionViewModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import BulkEditConditionsModal from '../components/BulkEditConditionsModal';
import ConditionCopySettingsModal from '../components/ConditionCopySettingsModal';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import { PlusIcon } from '../components/icons/PlusIcon';
import { ExportIcon } from '../components/icons/ExportIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { CopyIcon } from '../components/icons/CopyIcon';

type SortConfig = { key: keyof CarSaleCondition; direction: 'ascending' | 'descending' } | null;

export interface ConditionsPageProps {
    isSubPage?: boolean;
}

const ConditionsPage: React.FC<ConditionsPageProps> = ({ isSubPage = false }) => {
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentCondition, setCurrentCondition] = useState<CarSaleCondition | null>(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [conditionToView, setConditionToView] = useState<CarSaleCondition | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [conditionToDelete, setConditionToDelete] = useState<CarSaleCondition | null>(null);

    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const [filters, setFilters] = useState<{ status: ConditionStatus | 'all'; car_model: string | 'all'; sale_type: SaleType | 'all' }>({ status: 'all', car_model: 'all', sale_type: 'all' });
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'descending' });


    const fetchAllConditions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [conditionsData, carsData] = await Promise.all([
                getConditions(),
                getCars()
            ]);
            setConditions(conditionsData);
            setCars(carsData);
        } catch (err) {
            setError('خطا در دریافت اطلاعات');
            showToast('خطا در دریافت اطلاعات', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllConditions();
    }, [fetchAllConditions]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    
    const handleAddNew = useCallback(() => {
        setCurrentCondition(null);
        setIsModalOpen(true);
    }, []);

    const handleEdit = (condition: CarSaleCondition) => {
        setCurrentCondition(condition);
        setIsModalOpen(true);
    };

    const handleDuplicate = (condition: CarSaleCondition) => {
        const duplicatedCondition = { ...condition, id: 0, colors: [...condition.colors] };
        setCurrentCondition(duplicatedCondition);
        setIsModalOpen(true);
    };

    const handleDelete = (condition: CarSaleCondition) => {
        setConditionToDelete(condition);
        setIsDeleteModalOpen(true);
    };

    const handleView = (condition: CarSaleCondition) => {
        setConditionToView(condition);
        setIsViewModalOpen(true);
    };
    
    const handleSave = async (conditionData: Omit<CarSaleCondition, 'id'>) => {
        try {
            if (currentCondition && currentCondition.id !== 0) {
                await updateCondition(currentCondition.id, { ...conditionData, id: currentCondition.id });
                showToast('شرط با موفقیت ویرایش شد', 'success');
            } else {
                await createCondition(conditionData);
                showToast('شرط جدید با موفقیت اضافه شد', 'success');
            }
            setIsModalOpen(false);
            setCurrentCondition(null);
            fetchAllConditions();
        } catch (err) {
            showToast('عملیات با خطا مواجه شد', 'error');
        }
    };
    
    const confirmDelete = async () => {
        if (conditionToDelete) {
            try {
                await deleteCondition(conditionToDelete.id);
                showToast('شرط با موفقیت حذف شد', 'success');
                setIsDeleteModalOpen(false);
                setConditionToDelete(null);
                fetchAllConditions();
            } catch (err) {
                showToast('حذف شرط با خطا مواجه شد', 'error');
            }
        }
    };

    const handleSort = (key: keyof CarSaleCondition) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredConditions = useMemo(() => {
        const filtered = conditions.filter(c => {
            const statusMatch = filters.status === 'all' || c.status === filters.status;
            const carModelMatch = filters.car_model === 'all' || (c.car_model && c.car_model.toLowerCase() === filters.car_model.toLowerCase());
            const saleTypeMatch = filters.sale_type === 'all' || c.sale_type === filters.sale_type;
            return statusMatch && carModelMatch && saleTypeMatch;
        });

        if (sortConfig !== null) {
            return [...filtered].sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                     if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }
                
                const aStr = String(aValue);
                const bStr = String(bValue);

                const comparison = aStr.localeCompare(bStr, 'fa-IR');
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return filtered;
    }, [conditions, filters, sortConfig]);

    const handleSelectionChange = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = (all: boolean) => {
        if (all) {
            setSelectedIds(new Set(sortedAndFilteredConditions.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleBulkSave = async (updates: Partial<CarSaleCondition>) => {
        try {
            setLoading(true);
            const selectedConditions = conditions.filter(c => selectedIds.has(c.id));
            
            // Sequential updates to the API
            for (const condition of selectedConditions) {
                await updateCondition(condition.id, { ...condition, ...updates });
            }

            showToast('تغییرات گروهی با موفقیت اعمال شد', 'success');
            setSelectedIds(new Set());
            fetchAllConditions();
        } catch (err) {
            showToast('خطا در اعمال تغییرات گروهی', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (sortedAndFilteredConditions.length === 0) {
            showToast('هیچ داده‌ای برای خروجی گرفتن وجود ندارد.', 'error');
            return;
        }

        const headers = [
            "شناسه", "وضعیت", "مدل خودرو", "سال مدل", "نوع فروش",
            "نحوه پرداخت", "وضعیت سند", "رنگ‌ها", "زمان تحویل",
            "پیش‌پرداخت / قیمت", "توضیحات"
        ];

        const escapeCSV = (value: any): string => {
            const str = String(value ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvRows = sortedAndFilteredConditions.map(c => [
            c.id,
            c.status,
            c.car_model,
            c.model,
            c.sale_type,
            c.pay_type,
            c.document_status,
            c.colors.join(' - '),
            c.delivery_time,
            c.initial_deposit,
            c.descriptions,
        ].map(escapeCSV).join(','));

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `conditions_export_${date}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('فایل CSV با موفقیت آماده شد.', 'success');
    };

    const saleTypeTabs = [
        { key: 'all', label: 'همه بخشنامه‌ها' },
        { key: SaleType.FACTORY_REGISTRATION, label: 'ثبت‌نام کارخانه' },
        { key: SaleType.TRANSFER, label: 'حواله' },
        { key: SaleType.LEASING, label: 'لیزینگی' },
        { key: SaleType.NEW_MARKET, label: 'صفر بازار' },
        { key: SaleType.USED, label: 'کارکرده' },
    ];

    const content = (
        <>
            <div className={`bg-white dark:bg-slate-800 ${isSubPage ? 'pb-6' : 'p-6 rounded-lg shadow-md mb-8'} space-y-4`}>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {!isSubPage && <h2 className="text-xl font-bold text-slate-700 dark:text-white">شرایط فروش</h2>}
                    <div className={`flex items-center gap-2 flex-wrap ${isSubPage ? 'w-full justify-end' : ''}`}>
                        <button
                            onClick={() => setIsCopyModalOpen(true)}
                            disabled={sortedAndFilteredConditions.length === 0 || loading}
                            className={`bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-300 shadow-sm flex items-center gap-2 disabled:opacity-50 ${isSubPage ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'}`}
                        >
                            <CopyIcon className="w-4 h-4" />
                            کپی شرایط
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={sortedAndFilteredConditions.length === 0 || loading}
                            className={`bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-sm flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed ${isSubPage ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'}`}
                        >
                            <ExportIcon />
                            خروجی CSV
                        </button>
                        <button
                            onClick={handleAddNew}
                            className={`bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors duration-300 shadow-sm flex items-center gap-2 ${isSubPage ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'}`}
                        >
                            <PlusIcon />
                            افزودن شرط جدید
                        </button>
                    </div>
                </div>

                {/* Sub-categories tab bar */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
                    <div className="flex gap-2 min-w-max pb-1">
                        {saleTypeTabs.map((tab) => {
                            const isActive = filters.sale_type === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilters(prev => ({ ...prev, sale_type: tab.key as SaleType | 'all' }))}
                                    className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                                        isActive 
                                        ? 'bg-sky-600 text-white shadow-md shadow-sky-100 dark:shadow-none scale-102' 
                                        : 'bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <FilterPanel
                    filters={filters}
                    onFilterChange={setFilters}
                    resultCount={sortedAndFilteredConditions.length}
                    totalCount={conditions.length}
                />
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner />
                </div>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : (
                <ConditionTable 
                    conditions={sortedAndFilteredConditions} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                    onView={handleView}
                    onDuplicate={handleDuplicate}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                    selectedIds={selectedIds}
                    onSelectionChange={handleSelectionChange}
                    onSelectAll={handleSelectAll}
                />
            )}

            {/* Bulk Actions Floating Bar */}
            {selectedIds.size > 0 && (
                <div className={`${isSubPage ? 'absolute' : 'fixed'} bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-6 animate-slide-up border border-slate-700`}>
                    <div className="flex items-center gap-3 border-l border-slate-700 pl-6">
                        <span className="bg-sky-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                            {selectedIds.size.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-sm font-bold">مورد انتخاب شد</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsBulkEditModalOpen(true)}
                            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                        >
                            <EditIcon className="w-4 h-4" />
                            ویرایش گروهی
                        </button>
                        <button 
                            onClick={() => setSelectedIds(new Set())}
                            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <>
            {isSubPage ? (
                <div className="animate-fade-in relative pb-20">{content}</div>
            ) : (
                <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
                    {content}
                </main>
            )}

            {isModalOpen && (
                <ConditionModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    condition={currentCondition}
                    cars={cars}
                />
            )}

            {isViewModalOpen && (
                <ConditionViewModal 
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    condition={conditionToView}
                />
            )}
            
            {isDeleteModalOpen && (
                <DeleteConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="حذف شرط فروش"
                    message={`آیا از حذف شرط فروش برای خودروی "${conditionToDelete?.car_model} مدل ${conditionToDelete?.model}" اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
                />
            )}

            {isBulkEditModalOpen && (
                <BulkEditConditionsModal 
                    isOpen={isBulkEditModalOpen}
                    onClose={() => setIsBulkEditModalOpen(false)}
                    onSave={handleBulkSave}
                    count={selectedIds.size}
                />
            )}

            {isCopyModalOpen && (
                <ConditionCopySettingsModal
                    isOpen={isCopyModalOpen}
                    onClose={() => setIsCopyModalOpen(false)}
                    conditions={sortedAndFilteredConditions}
                    onCopySuccess={() => showToast('شرایط فروش با موفقیت در حافظه کپی شد', 'success')}
                />
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <style>{`
                @keyframes slide-up {
                    from { transform: translate(-50%, 100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </>
    );
};

export default ConditionsPage;
