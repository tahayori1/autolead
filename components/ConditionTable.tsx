import React, { useState } from 'react';
import type { CarSaleCondition } from '../types';
import { ConditionStatus } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EyeIcon } from './icons/EyeIcon';
import { SortIcon } from './icons/SortIcon';
import { CopyIcon } from './icons/CopyIcon';
import { 
    Clock, User, UserCheck, LayoutGrid, Table as TableIcon, 
    CheckSquare, Square, Calendar, ShieldCheck, Tag
} from 'lucide-react';
import { formatConditionDateTime, getConditionDateInfo, resolveUserFullName } from '../services/api';
import type { StaffUser } from '../types';

interface ConditionTableProps {
    conditions: CarSaleCondition[];
    staffUsers?: StaffUser[];
    onEdit: (condition: CarSaleCondition) => void;
    onDelete: (condition: CarSaleCondition) => void;
    onView: (condition: CarSaleCondition) => void;
    onDuplicate: (condition: CarSaleCondition) => void;
    onSort: (key: keyof CarSaleCondition) => void;
    sortConfig: { key: keyof CarSaleCondition; direction: 'ascending' | 'descending' } | null;
    selectedIds: Set<number>;
    onSelectionChange: (id: number) => void;
    onSelectAll: (all: boolean) => void;
}

const statusColorMap: Record<ConditionStatus, string> = {
    [ConditionStatus.AVAILABLE]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
    [ConditionStatus.SOLD_OUT]: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
    [ConditionStatus.CAPACITY_FULL]: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
};

const ConditionTable: React.FC<ConditionTableProps> = ({ 
    conditions, staffUsers, onEdit, onDelete, onView, onDuplicate, onSort, sortConfig,
    selectedIds, onSelectionChange, onSelectAll
}) => {
    // Default to 'grid' (2-column layout) as requested: "ردیف های بخشنامه های فروش را دو ردیفه کن که عرض ردیفها کم شود"
    const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
        const saved = localStorage.getItem('condition_view_mode');
        return saved === 'table' ? 'table' : 'grid';
    });

    const handleViewModeChange = (mode: 'grid' | 'table') => {
        setViewMode(mode);
        localStorage.setItem('condition_view_mode', mode);
    };

    if (conditions.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-12 text-center border border-slate-200 dark:border-slate-700">
                <Tag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">هیچ شرایط فروشی یافت نشد</p>
                <p className="text-xs text-slate-400">با تغییر فیلترها یا افزودن بخشنامه جدید موارد را مشاهده نمایید.</p>
            </div>
        );
    }

    const formatPrice = (num: number) => {
        return num.toLocaleString('fa-IR');
    };

    const isAllSelected = conditions.length > 0 && selectedIds.size === conditions.length;
    const isSomeSelected = selectedIds.size > 0 && selectedIds.size < conditions.length;

    const SortableHeader: React.FC<{ title: string; sortKey: keyof CarSaleCondition; }> = ({ title, sortKey }) => {
        const isSorted = sortConfig?.key === sortKey;
        const direction = isSorted ? sortConfig.direction : 'none';

        return (
            <th scope="col" className="px-5 py-3.5">
                <button
                    className="flex items-center gap-1.5 uppercase font-bold text-xs text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors group"
                    onClick={() => onSort(sortKey)}
                >
                    {title}
                    <SortIcon direction={direction} />
                </button>
            </th>
        );
    };

    return (
        <div className="space-y-4">
            {/* Top Layout Control & Bulk Selection Bar */}
            <div className="bg-white dark:bg-slate-850 p-3 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onSelectAll(!isAllSelected)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors text-xs font-bold"
                    >
                        {isAllSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        ) : isSomeSelected ? (
                            <div className="w-4 h-4 rounded bg-sky-600 flex items-center justify-center text-white text-[10px] font-bold">-</div>
                        ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{isAllSelected ? 'لغو انتخاب همه' : 'انتخاب همه'}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({conditions.length.toLocaleString('fa-IR')})</span>
                    </button>

                    {selectedIds.size > 0 && (
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 rounded-lg border border-sky-200/60 dark:border-sky-800/60">
                            {selectedIds.size.toLocaleString('fa-IR')} مورد انتخاب شده
                        </span>
                    )}
                </div>

                {/* View Switcher: Two Columns (Default) vs Table */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <button
                        onClick={() => handleViewModeChange('grid')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            viewMode === 'grid'
                                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                        title="نمایش ردیف‌های دو ستونه با عرض متناسب"
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>دو ردیفه (کارت‌ها)</span>
                    </button>
                    <button
                        onClick={() => handleViewModeChange('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            viewMode === 'table'
                                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                        title="نمایش جدول سراسری"
                    >
                        <TableIcon className="w-3.5 h-3.5" />
                        <span>جدول</span>
                    </button>
                </div>
            </div>

            {/* 2-Column Grid Layout (Primary requested display: "ردیف های بخشنامه های فروش را دو ردیفه کن که عرض ردیفها کم شود") */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                    {conditions.map((condition) => {
                        const dateInfo = getConditionDateInfo(condition);
                        const isSelected = selectedIds.has(condition.id);
                        
                        // Resolve First & Last Name for Creator & Updater
                        const creatorIdentifier = condition.created_by_name || condition.created_by || condition.createdBy;
                        const creatorFullName = resolveUserFullName(creatorIdentifier, staffUsers) || 'کاربر سیستم';

                        const updaterIdentifier = condition.updated_by_name || condition.updated_by || condition.updatedBy;
                        const updaterFullName = updaterIdentifier ? resolveUserFullName(updaterIdentifier, staffUsers) : null;

                        return (
                            <div 
                                key={condition.id}
                                className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                                    isSelected
                                        ? 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800 ring-2 ring-sky-400/20'
                                        : 'bg-white dark:bg-slate-850 border-slate-200/90 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/40'
                                }`}
                            >
                                {/* Card Header */}
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <input 
                                             type="checkbox" 
                                            className="w-4.5 h-4.5 text-sky-600 rounded border-slate-300 dark:border-slate-600 focus:ring-sky-500 cursor-pointer shrink-0"
                                            checked={isSelected}
                                            onChange={() => onSelectionChange(condition.id)}
                                        />
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h3 className="font-black text-slate-900 dark:text-white text-base truncate">
                                                {condition.car_model}
                                            </h3>
                                            {condition.model ? (
                                                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                                                    مدل {condition.model}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusColorMap[condition.status]}`}>
                                            {condition.status}
                                        </span>
                                        {condition.is_public ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                                عمومی
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                پیش‌نویس
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 space-y-3.5 flex-1">
                                    {/* Price Banner */}
                                    <div className="p-3 bg-gradient-to-r from-sky-50/80 to-indigo-50/80 dark:from-sky-950/30 dark:to-indigo-950/30 rounded-xl border border-sky-100 dark:border-sky-900/40 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                                                {condition.pay_type === 'نقدی' ? 'قیمت خودرو:' : 'مبلغ پیش‌پرداخت:'}
                                            </span>
                                            <div className="text-lg font-black font-mono text-sky-700 dark:text-sky-300 tracking-tight mt-0.5">
                                                {formatPrice(condition.initial_deposit)} <span className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">تومان</span>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 shadow-2xs">
                                                {condition.sale_type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Specification Grid (2 columns in card) */}
                                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/70 flex flex-col gap-0.5">
                                            <span className="text-[10px] text-slate-400">نحوه پرداخت:</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{condition.pay_type || 'نامشخص'}</span>
                                        </div>
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/70 flex flex-col gap-0.5">
                                            <span className="text-[10px] text-slate-400">زمان تحویل:</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{condition.delivery_time || 'نامشخص'}</span>
                                        </div>
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/70 flex flex-col gap-0.5">
                                            <span className="text-[10px] text-slate-400">وضعیت سند:</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{condition.document_status || 'آزاد'}</span>
                                        </div>
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/70 flex flex-col gap-0.5">
                                            <span className="text-[10px] text-slate-400">رنگ‌های ارائه شده:</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate" title={condition.colors.join('، ')}>
                                                {condition.colors.length > 0 ? condition.colors.join('، ') : 'انتخابی'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Description Preview (if any) */}
                                    {condition.descriptions && condition.descriptions.trim() && (
                                        <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed line-clamp-2">
                                            <span className="font-bold ml-1">توضیحات:</span>
                                            {condition.descriptions}
                                        </div>
                                    )}

                                    {/* Audit Trail: کاربر ثبت‌کننده و کاربر ویرایش‌کننده - نام و نام خانوادگی */}
                                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2 text-[11px]">
                                        {/* کاربر ثبت‌کننده */}
                                        <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-900/40 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">کاربر ثبت‌کننده:</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate" title={`نام و نام خانوادگی: ${creatorFullName}`}>
                                                    {creatorFullName}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-mono dir-ltr shrink-0">
                                                {dateInfo.createdDateFormatted || (condition.created_at ? formatConditionDateTime(condition.created_at) : dateInfo.formattedDate)}
                                            </span>
                                        </div>

                                        {/* کاربر ویرایش‌کننده */}
                                        {updaterFullName ? (
                                            <div className="flex items-center justify-between gap-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 px-2.5 py-1.5 rounded-xl border border-indigo-100/80 dark:border-indigo-900/40">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                                    <span className="text-[10px] text-indigo-500/90 shrink-0 font-medium">کاربر ویرایش‌کننده:</span>
                                                    <span className="font-bold text-indigo-700 dark:text-indigo-300 truncate" title={`نام و نام خانوادگی: ${updaterFullName}`}>
                                                        {updaterFullName}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono dir-ltr shrink-0">
                                                    {dateInfo.formattedDate}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between gap-2 text-slate-400 dark:text-slate-500 px-2.5 py-1 text-[10px]">
                                                <div className="flex items-center gap-1">
                                                    <span>کاربر ویرایش‌کننده:</span>
                                                    <span className="font-medium text-slate-500 dark:text-slate-400">بدون ویرایش ثانویه</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Actions Footer */}
                                <div className="p-3 bg-slate-50/80 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    <button 
                                        onClick={() => onView(condition)} 
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-650 border border-slate-200/80 dark:border-slate-600 transition-colors shadow-2xs"
                                        title="مشاهده جزئیات کامل"
                                    >
                                        <EyeIcon />
                                        <span>مشاهده</span>
                                    </button>

                                    <button 
                                        onClick={() => onDuplicate(condition)} 
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200/80 dark:border-teal-800/60 transition-colors"
                                        title="کپی کردن این بخشنامه"
                                    >
                                        <CopyIcon />
                                        <span>کپی</span>
                                    </button>

                                    <button 
                                        onClick={() => onEdit(condition)} 
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-200/80 dark:border-sky-800/60 transition-colors"
                                        title="ویرایش بخشنامه"
                                    >
                                        <EditIcon />
                                        <span>ویرایش</span>
                                    </button>

                                    <button 
                                        onClick={() => onDelete(condition)} 
                                        className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-800/60 transition-colors"
                                        title="حذف بخشنامه"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Full Table View */
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden border border-slate-200/80 dark:border-slate-700/80">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-slate-600 dark:text-slate-300">
                            <thead className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-750 border-b dark:border-slate-700">
                                <tr>
                                    <th className="px-5 py-3.5 w-4">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-sky-600 rounded border-slate-300 dark:border-slate-600 focus:ring-sky-500 cursor-pointer"
                                            checked={isAllSelected}
                                            onChange={(e) => onSelectAll(e.target.checked)}
                                        />
                                    </th>
                                    <SortableHeader title="وضعیت" sortKey="status" />
                                    <SortableHeader title="مدل خودرو" sortKey="car_model" />
                                    <SortableHeader title="قیمت (تومان)" sortKey="initial_deposit" />
                                    <SortableHeader title="نوع فروش" sortKey="sale_type" />
                                    <SortableHeader title="تحویل" sortKey="delivery_time" />
                                    <SortableHeader title="عمومی" sortKey="is_public" />
                                    <th scope="col" className="px-5 py-3.5 font-bold text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                        کاربر ثبت و ویرایش‌کننده
                                    </th>
                                    <th scope="col" className="px-5 py-3.5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 dark:divide-slate-700/60">
                                {conditions.map((condition) => {
                                    const dateInfo = getConditionDateInfo(condition);
                                    const creatorIdentifier = condition.created_by_name || condition.created_by || condition.createdBy;
                                    const creatorFullName = resolveUserFullName(creatorIdentifier, staffUsers) || 'کاربر سیستم';

                                    const updaterIdentifier = condition.updated_by_name || condition.updated_by || condition.updatedBy;
                                    const updaterFullName = updaterIdentifier ? resolveUserFullName(updaterIdentifier, staffUsers) : null;
                                    const isSelected = selectedIds.has(condition.id);

                                    return (
                                        <tr key={condition.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors ${isSelected ? 'bg-sky-50/80 dark:bg-sky-900/20' : 'bg-white dark:bg-slate-800'}`}>
                                            <td className="px-5 py-4">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-sky-600 rounded border-slate-300 dark:border-slate-600 focus:ring-sky-500 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => onSelectionChange(condition.id)}
                                                />
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusColorMap[condition.status]}`}>
                                                    {condition.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                                {condition.car_model}
                                                {condition.model ? <span className="text-xs text-slate-400 font-normal mr-1.5 font-mono">({condition.model})</span> : null}
                                            </td>
                                            <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                                                {formatPrice(condition.initial_deposit)} <span className="text-[11px] font-sans font-normal text-slate-500 dark:text-slate-400">تومان</span>
                                            </td>
                                            <td className="px-5 py-4">{condition.sale_type}</td>
                                            <td className="px-5 py-4">{condition.delivery_time}</td>
                                            <td className="px-5 py-4">
                                                {condition.is_public ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">منتشر شده</span>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">پیش‌نویس</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-2 text-[11px] min-w-[210px]">
                                                    {/* کاربر ثبت‌کننده */}
                                                    <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                                                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                                            <User className="w-3 h-3" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-[10px] text-slate-400 shrink-0 font-medium">کاربر ثبت‌کننده:</span>
                                                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate" title={`نام و نام خانوادگی: ${creatorFullName}`}>
                                                                    {creatorFullName}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-mono dir-ltr text-right">
                                                                {dateInfo.createdDateFormatted || (condition.created_at ? formatConditionDateTime(condition.created_at) : dateInfo.formattedDate)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* کاربر ویرایش‌کننده */}
                                                    {updaterFullName ? (
                                                        <div className="flex items-start gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                                                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                                                                <UserCheck className="w-3 h-3" />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-[10px] text-indigo-500 shrink-0 font-medium">کاربر ویرایش‌کننده:</span>
                                                                    <span className="font-bold text-indigo-600 dark:text-indigo-300 truncate" title={`نام و نام خانوادگی: ${updaterFullName}`}>
                                                                        {updaterFullName}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 font-mono dir-ltr text-right">
                                                                    {dateInfo.formattedDate}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-1">
                                                            <span>کاربر ویرایش‌کننده:</span>
                                                            <span className="text-slate-400">بدون ویرایش ثانویه</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2.5">
                                                    <button onClick={() => onView(condition)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="نمایش">
                                                        <EyeIcon />
                                                    </button>
                                                    <button onClick={() => onDuplicate(condition)} className="p-1.5 rounded-lg text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors" title="کپی کردن">
                                                        <CopyIcon />
                                                    </button>
                                                    <button onClick={() => onEdit(condition)} className="p-1.5 rounded-lg text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors" title="ویرایش">
                                                        <EditIcon />
                                                    </button>
                                                    <button onClick={() => onDelete(condition)} className="p-1.5 rounded-lg text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors" title="حذف">
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConditionTable;
