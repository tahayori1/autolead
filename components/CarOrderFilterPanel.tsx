
import React from 'react';
import { SaleType, OrderStatus } from '../types';

interface CarOrderFilterPanelProps {
    filters: {
        search: string;
        carName: string;
        saleType: string;
        creator: string;
        status: string;
    };
    onChange: (key: string, value: string) => void;
    onClear: () => void;
    carNames: string[];
    creators: string[];
}

const STATUS_LABELS: Record<string, string> = {
    [OrderStatus.DRAFT]: 'پیش‌نویس',
    [OrderStatus.PENDING_ADMIN]: 'در انتظار تایید ادمین',
    [OrderStatus.PENDING_PAYMENT]: 'منتظر پرداخت',
    [OrderStatus.PENDING_FINANCE]: 'تایید مالی',
    [OrderStatus.READY_FOR_DELIVERY]: 'آماده تحویل',
    [OrderStatus.EXIT_PROCESS]: 'در حال خروج',
    [OrderStatus.COMPLETED]: 'تکمیل شده',
    [OrderStatus.REJECTED]: 'رد شده / ابطال',
};

const CarOrderFilterPanel: React.FC<CarOrderFilterPanelProps> = ({ 
    filters, onChange, onClear, carNames, creators 
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
                {/* Search */}
                <div className="md:col-span-2 lg:col-span-1 xl:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">جستجو</label>
                    <input
                        type="text"
                        placeholder="شماره تماس، کدملی، آدرس، توضیحات..."
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm"
                        value={filters.search}
                        onChange={(e) => onChange('search', e.target.value)}
                    />
                </div>

                {/* Car Model */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">مدل خودرو</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm"
                        value={filters.carName}
                        onChange={(e) => onChange('carName', e.target.value)}
                    >
                        <option value="all">همه</option>
                        {carNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>

                {/* Sale Type */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">نوع فروش</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm"
                        value={filters.saleType}
                        onChange={(e) => onChange('saleType', e.target.value)}
                    >
                        <option value="all">همه</option>
                        {Object.values(SaleType).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* Creator */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">کاربر ثبت کننده</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm"
                        value={filters.creator}
                        onChange={(e) => onChange('creator', e.target.value)}
                    >
                        <option value="all">همه</option>
                        {creators.map(creator => (
                            <option key={creator} value={creator}>{creator}</option>
                        ))}
                    </select>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">وضعیت دقیق</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm"
                        value={filters.status}
                        onChange={(e) => onChange('status', e.target.value)}
                    >
                        <option value="all">همه</option>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            {(filters.search || filters.carName !== 'all' || filters.saleType !== 'all' || filters.creator !== 'all' || filters.status !== 'all') && (
                <div className="mt-3 flex justify-end">
                    <button 
                        onClick={onClear}
                        className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        پاک کردن فیلترها
                    </button>
                </div>
            )}
        </div>
    );
};

export default CarOrderFilterPanel;
