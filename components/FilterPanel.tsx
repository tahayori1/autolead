
import React, { useState, useEffect } from 'react';
import type { ConditionStatus, SaleType } from '../types';
import { ConditionStatus as ConditionStatusEnum, SaleType as SaleTypeEnum } from '../types';

interface FilterPanelProps {
    filters: { status: ConditionStatus | 'all'; car_model: string | 'all'; sale_type: SaleType | 'all' };
    onFilterChange: (filters: { status: ConditionStatus | 'all'; car_model: string | 'all'; sale_type: SaleType | 'all' }) => void;
    resultCount: number;
    totalCount: number;
}

const CAR_MODELS = [
    'JAC J4', 'JAC S3', 'JAC S5', 'BAC X3PRO', 'KMC T8', 'KMC T9', 'KMC A5',
    'KMC J7', 'KMC X5', 'KMC SR3', 'KMC EAGLE', 'KMC SHADOW', 'KMC SR6'
];

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange, resultCount, totalCount }) => {
    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                value={filters.car_model}
                onChange={(e) => onFilterChange({ ...filters, car_model: e.target.value })}
            >
                <option value="all">همه مدل‌ها</option>
                {CAR_MODELS.map(model => (
                    <option key={model} value={model}>{model}</option>
                ))}
            </select>
             <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                value={filters.sale_type}
                onChange={(e) => onFilterChange({ ...filters, sale_type: e.target.value as SaleType | 'all' })}
            >
                <option value="all">همه انواع فروش</option>
                {Object.values(SaleTypeEnum).map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
            <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                value={filters.status}
                onChange={(e) => onFilterChange({ ...filters, status: e.target.value as ConditionStatus | 'all' })}
            >
                <option value="all">همه وضعیت‌ها</option>
                {Object.values(ConditionStatusEnum).map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
            <div className="text-right lg:text-left">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    <span className="font-bold text-sky-700 dark:text-sky-400">{resultCount.toLocaleString('fa-IR')}</span> / {totalCount.toLocaleString('fa-IR')} نتیجه
                </p>
            </div>
        </div>
    );
};

export default FilterPanel;
