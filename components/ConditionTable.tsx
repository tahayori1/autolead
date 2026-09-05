
import React from 'react';
import type { CarSaleCondition } from '../types';
import { ConditionStatus } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EyeIcon } from './icons/EyeIcon';
import { SortIcon } from './icons/SortIcon';
import { CopyIcon } from './icons/CopyIcon';
import { Clock, User, UserCheck } from 'lucide-react';
import { formatConditionDateTime, getConditionDateInfo } from '../services/api';

interface ConditionTableProps {
    conditions: CarSaleCondition[];
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
    [ConditionStatus.AVAILABLE]: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300',
    [ConditionStatus.SOLD_OUT]: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
    [ConditionStatus.CAPACITY_FULL]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
};

const ConditionTable: React.FC<ConditionTableProps> = ({ 
    conditions, onEdit, onDelete, onView, onDuplicate, onSort, sortConfig,
    selectedIds, onSelectionChange, onSelectAll
}) => {
    if (conditions.length === 0) {
        return <p className="text-center text-slate-500 dark:text-slate-400 py-10">هیچ شرایط فروشی یافت نشد.</p>;
    }

    const formatPrice = (num: number) => {
        return num.toLocaleString('fa-IR');
    };

    const SortableHeader: React.FC<{ title: string; sortKey: keyof CarSaleCondition; }> = ({ title, sortKey }) => {
        const isSorted = sortConfig?.key === sortKey;
        const direction = isSorted ? sortConfig.direction : 'none';

        return (
            <th scope="col" className="px-6 py-3">
                <button
                    className="flex items-center gap-1 uppercase font-bold text-xs text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors group"
                    onClick={() => onSort(sortKey)}
                >
                    {title}
                    <SortIcon direction={direction} />
                </button>
            </th>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200/80 dark:border-slate-700/80">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-right text-slate-600 dark:text-slate-300">
                    <thead className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-750 border-b dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 w-4">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-sky-600 rounded border-slate-300 dark:border-slate-600 focus:ring-sky-500 cursor-pointer"
                                    checked={conditions.length > 0 && selectedIds.size === conditions.length}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                />
                            </th>
                            <SortableHeader title="وضعیت" sortKey="status" />
                            <SortableHeader title="مدل خودرو" sortKey="car_model" />
                            <SortableHeader title="قیمت (تومان)" sortKey="initial_deposit" />
                            <SortableHeader title="نوع فروش" sortKey="sale_type" />
                            <SortableHeader title="تحویل" sortKey="delivery_time" />
                            <SortableHeader title="عمومی" sortKey="is_public" />
                            <th scope="col" className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-700/60">
                        {conditions.map((condition) => {
                            const dateInfo = getConditionDateInfo(condition);
                            return (
                            <tr key={condition.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors ${selectedIds.has(condition.id) ? 'bg-sky-50/80 dark:bg-sky-900/20' : 'bg-white dark:bg-slate-800'}`}>
                                <td className="px-6 py-4">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-sky-600 rounded border-slate-300 dark:border-slate-600 focus:ring-sky-500 cursor-pointer"
                                        checked={selectedIds.has(condition.id)}
                                        onChange={() => onSelectionChange(condition.id)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusColorMap[condition.status]}`}>
                                        {condition.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                    {condition.car_model}
                                    {condition.model ? <span className="text-xs text-slate-400 font-normal mr-1.5 font-mono">({condition.model})</span> : null}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                                            {formatPrice(condition.initial_deposit)} <span className="text-[11px] font-sans font-normal text-slate-500 dark:text-slate-400">تومان</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                            <Clock className={`w-3 h-3 ${dateInfo.isUpdateDate ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'} shrink-0`} />
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{dateInfo.dateLabel}</span>
                                            <span className="font-mono font-medium text-slate-600 dark:text-slate-300 dir-ltr text-right">
                                                {dateInfo.formattedDate}
                                            </span>
                                        </div>
                                        {/* Creator & Editor info */}
                                        {(condition.created_by_name || condition.created_by || condition.createdBy || condition.updated_by_name || condition.updated_by) && (
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                                {(condition.created_by_name || condition.created_by || condition.createdBy) && (
                                                    <span className="flex items-center gap-0.5" title="کاربر ثبت‌کننده">
                                                        <User className="w-2.5 h-2.5 text-slate-400" />
                                                        <span>ثبت:</span>
                                                        <span className="font-bold text-slate-600 dark:text-slate-300">{condition.created_by_name || condition.created_by || condition.createdBy}</span>
                                                    </span>
                                                )}
                                                {(condition.updated_by_name || condition.updated_by) && (
                                                    <span className="flex items-center gap-0.5" title="کاربر آخرین ویرایش‌کننده">
                                                        <UserCheck className="w-2.5 h-2.5 text-indigo-400" />
                                                        <span>ویرایش:</span>
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-300">{condition.updated_by_name || condition.updated_by}</span>
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{condition.sale_type}</td>
                                <td className="px-6 py-4">{condition.delivery_time}</td>
                                <td className="px-6 py-4">
                                    {condition.is_public ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">منتشر شده</span>
                                    ) : (
                                        <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">پیش‌نویس</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-3">
                                         <button onClick={() => onView(condition)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" title="نمایش">
                                            <EyeIcon />
                                        </button>
                                        <button onClick={() => onDuplicate(condition)} className="text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 transition-colors" title="کپی کردن">
                                            <CopyIcon />
                                        </button>
                                        <button onClick={() => onEdit(condition)} className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 transition-colors" title="ویرایش">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(condition)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors" title="حذف">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );})}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 md:hidden">
                {conditions.map((condition) => {
                    const dateInfo = getConditionDateInfo(condition);
                    return (
                    <div key={condition.id} className={`border rounded-xl shadow-sm flex flex-col transition-all ${selectedIds.has(condition.id) ? 'bg-sky-50/80 dark:bg-sky-900/20 border-sky-300 dark:border-sky-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                        <div className="p-4 border-b dark:border-slate-700/80">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 text-sky-600 rounded border-slate-300 dark:border-slate-600 focus:ring-sky-500 cursor-pointer"
                                        checked={selectedIds.has(condition.id)}
                                        onChange={() => onSelectionChange(condition.id)}
                                    />
                                    <h3 className="font-bold text-slate-800 dark:text-white text-md">{condition.car_model}</h3>
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusColorMap[condition.status]}`}>
                                    {condition.status}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 flex-grow">
                            <div className="text-center mb-4 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <p className="text-xs text-slate-500 dark:text-slate-400">{condition.pay_type === 'نقدی' ? 'قیمت خودرو' : 'مبلغ پیش‌پرداخت'}</p>
                                <p className="text-xl font-bold font-mono text-sky-700 dark:text-sky-400 my-0.5">
                                    {formatPrice(condition.initial_deposit)} <span className="text-sm font-sans font-normal text-slate-500 dark:text-slate-400">تومان</span>
                                </p>
                                <div className="flex items-center justify-center gap-1.5 mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-600/60 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    <Clock className={`w-3.5 h-3.5 ${dateInfo.isUpdateDate ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'} shrink-0`} />
                                    <span className="text-[10px] text-slate-400 dark:text-slate-400">
                                        {dateInfo.isUpdateDate ? 'آخرین بروزرسانی:' : 'تاریخ ایجاد:'}
                                    </span>
                                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300 dir-ltr">
                                        {dateInfo.formattedDate}
                                    </span>
                                </div>
                                {(condition.created_by_name || condition.created_by || condition.createdBy || condition.updated_by_name || condition.updated_by) && (
                                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1.5 pt-1.5 border-t border-slate-200/40 dark:border-slate-600/40 text-[10px] text-slate-500 dark:text-slate-400">
                                        {(condition.created_by_name || condition.created_by || condition.createdBy) && (
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3 text-slate-400" />
                                                <span>ثبت:</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{condition.created_by_name || condition.created_by || condition.createdBy}</span>
                                            </span>
                                        )}
                                        {(condition.updated_by_name || condition.updated_by) && (
                                            <span className="flex items-center gap-1">
                                                <UserCheck className="w-3 h-3 text-indigo-400" />
                                                <span>ویرایش:</span>
                                                <span className="font-bold text-indigo-600 dark:text-indigo-300">{condition.updated_by_name || condition.updated_by}</span>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">نوع فروش:</span>
                                    <span className="font-semibold">{condition.sale_type}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">نمایش عمومی:</span>
                                    <span className={`font-semibold ${condition.is_public ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{condition.is_public ? 'بله' : 'خیر'}</span>
                                </div>
                                <div className="flex flex-col col-span-2">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">رنگ‌ها:</span>
                                    <span className="font-semibold text-xs">{condition.colors.join('، ')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 p-3 bg-slate-50 dark:bg-slate-750 border-t dark:border-slate-700 rounded-b-xl">
                            <button onClick={() => onView(condition)} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-semibold px-2 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="نمایش">
                                <EyeIcon />
                            </button>
                            <button onClick={() => onDuplicate(condition)} className="flex items-center gap-1.5 text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-semibold px-2 py-1.5 rounded-md hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors" title="کپی">
                                <CopyIcon />
                            </button>
                            <button onClick={() => onEdit(condition)} className="flex items-center gap-1.5 text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 text-sm font-semibold px-2 py-1.5 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors" title="ویرایش">
                                <EditIcon />
                            </button>
                            <button onClick={() => onDelete(condition)} className="flex items-center gap-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-semibold px-2 py-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="حذف">
                                <TrashIcon />
                            </button>
                        </div>
                    </div>
                );})}
            </div>
        </div>
    );
};

export default ConditionTable;
