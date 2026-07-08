
import React from 'react';
import type { Reference } from '../services/api';
import { LeadStatus } from '../types';

interface UserFilterPanelProps {
    filters: { query: string, carModel: string, reference: string, status: LeadStatus | 'all' };
    onFilterChange: (filters: { query: string, carModel: string, reference: string, status: LeadStatus | 'all' }) => void;
    onClear: () => void;
    references: Reference[];
}

const CAR_MODELS = [
    'JAC J4', 'JAC S3', 'JAC S5', 'BAC X3PRO', 'KMC T8', 'KMC T9', 'KMC A5',
    'KMC J7', 'KMC X5', 'KMC SR3', 'KMC EAGLE', 'KMC SHADOW', 'KMC SR6'
];

const UserFilterPanel: React.FC<UserFilterPanelProps> = ({ filters, onFilterChange, onClear, references }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="lg:col-span-5">
                <label htmlFor="user-search" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">جستجو</label>
                <input
                    id="user-search"
                    name="query"
                    type="text"
                    placeholder="جستجو بر اساس نام، شماره، خودرو، استان، شهر..."
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white dark:bg-slate-700"
                    value={filters.query}
                    onChange={handleChange}
                />
            </div>
             <div>
                <label htmlFor="car-model-filter" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">خودروی درخواستی</label>
                <select
                    id="car-model-filter"
                    name="carModel"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                    value={filters.carModel}
                    onChange={handleChange}
                >
                    <option value="all">همه مدل‌ها</option>
                    {CAR_MODELS.map(model => (
                        <option key={model} value={model}>{model}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">وضعیت سرنخ</label>
                <select
                    id="status-filter"
                    name="status"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                    value={filters.status}
                    onChange={handleChange}
                >
                    <option value="all">همه وضعیت‌ها</option>
                    {Object.values(LeadStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="reference-filter" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">مرجع</label>
                <select
                    id="reference-filter"
                    name="reference"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                    value={filters.reference}
                    onChange={handleChange}
                >
                    <option value="all">همه مراجع</option>
                    {references.map(ref => (
                        <option key={ref.reference} value={ref.reference}>{ref.reference}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-2">
                 <button
                    onClick={onClear}
                    className="w-full px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                    title="پاک کردن فیلترها"
                >
                    پاک کردن فیلترها
                </button>
            </div>
        </div>
    );
};

export default UserFilterPanel;
