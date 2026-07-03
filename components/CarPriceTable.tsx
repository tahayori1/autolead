
import React from 'react';
import type { CarPrice } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SortIcon } from './icons/SortIcon';

interface CarPriceTableProps {
    prices: CarPrice[];
    onEdit: (price: CarPrice) => void;
    onDelete: (id: number) => void;
    onSort: (key: keyof CarPrice) => void;
    sortConfig: { key: keyof CarPrice; direction: 'ascending' | 'descending' } | null;
}

const CarPriceTable: React.FC<CarPriceTableProps> = ({ prices, onEdit, onDelete, onSort, sortConfig }) => {
    if (prices.length === 0) {
        return <p className="text-center text-slate-500 py-10">هیچ قیمتی ثبت نشده است.</p>;
    }

    const formatDate = (dateString: string) => {
        try {
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }).format(new Date(dateString));
        } catch (e) {
            return dateString;
        }
    };

    const SortableHeader: React.FC<{ title: string; sortKey: keyof CarPrice; }> = ({ title, sortKey }) => {
        const isSorted = sortConfig?.key === sortKey;
        const direction = isSorted ? sortConfig.direction : 'none';

        return (
            <th scope="col" className="px-6 py-3">
                <button
                    className="flex items-center gap-1 uppercase font-bold text-xs text-slate-700 group"
                    onClick={() => onSort(sortKey)}
                >
                    {title}
                    <SortIcon direction={direction} />
                </button>
            </th>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block">
                <table className="w-full text-sm text-right text-slate-600">
                    <thead className="text-xs text-slate-700 bg-slate-50">
                        <tr>
                            <SortableHeader title="مدل خودرو" sortKey="car_model" />
                            <SortableHeader title="تاریخ" sortKey="price_date" />
                            <SortableHeader title="قیمت کارخانه (تومان)" sortKey="factory_price" />
                            <SortableHeader title="قیمت بازار (تومان)" sortKey="market_price" />
                            <th scope="col" className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {prices.map((price) => (
                            <tr key={price.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{price.car_model}</td>
                                <td className="px-6 py-4">{formatDate(price.price_date)}</td>
                                <td className="px-6 py-4 font-mono">{price.factory_price.toLocaleString('fa-IR')}</td>
                                <td className="px-6 py-4 font-mono">{price.market_price.toLocaleString('fa-IR')}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-4">
                                        <button onClick={() => onEdit(price)} className="text-sky-600 hover:text-sky-800" title="ویرایش">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(price.id)} className="text-red-600 hover:text-red-800" title="حذف">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 md:hidden">
                {prices.map((price) => (
                    <div key={price.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-800">{price.car_model}</h3>
                                <span className="text-xs text-slate-500">{formatDate(price.price_date)}</span>
                            </div>
                            <div className="text-sm text-slate-600 space-y-2 mt-4">
                                <p><strong>قیمت کارخانه:</strong> <span className="font-mono text-green-700">{price.factory_price.toLocaleString('fa-IR')} تومان</span></p>
                                <p><strong>قیمت بازار:</strong> <span className="font-mono text-blue-700">{price.market_price.toLocaleString('fa-IR')} تومان</span></p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-slate-200">
                            <button onClick={() => onEdit(price)} className="flex items-center gap-1 text-sky-600 hover:text-sky-800 text-sm">
                                <EditIcon /> ویرایش
                            </button>
                            <button onClick={() => onDelete(price.id)} className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm">
                                <TrashIcon /> حذف
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CarPriceTable;
