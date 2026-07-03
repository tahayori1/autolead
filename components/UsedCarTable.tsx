
import React from 'react';
import type { UsedCar } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EyeIcon } from './icons/EyeIcon';

interface UsedCarTableProps {
    cars: UsedCar[];
    onEdit: (car: UsedCar) => void;
    onDelete: (id: number) => void;
}

const STATUS_LABELS: Record<string, string> = {
    'EXPERT_REVIEW': 'درحال کارشناسی',
    'ADVERTISING': 'مرحله تبلیغات',
    'SELLING': 'انجام مراحل فروش',
};

const STATUS_COLORS: Record<string, string> = {
    'EXPERT_REVIEW': 'bg-amber-100 text-amber-700',
    'ADVERTISING': 'bg-blue-100 text-blue-700',
    'SELLING': 'bg-green-100 text-green-700',
};

const UsedCarTable: React.FC<UsedCarTableProps> = ({ cars, onEdit, onDelete }) => {
    if (cars.length === 0) {
        return <div className="text-center py-12 text-slate-400">هیچ خودروی کارکرده‌ای ثبت نشده است.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map(car => (
                <div key={car.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    {/* Image Header */}
                    <div className="h-48 bg-slate-200 dark:bg-slate-700 relative">
                        {car.imageFront ? (
                            <img src={car.imageFront} alt={car.carName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <span>بدون تصویر</span>
                            </div>
                        )}
                        <div className="absolute top-3 right-3">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm ${STATUS_COLORS[car.status] || 'bg-slate-100'}`}>
                                {STATUS_LABELS[car.status] || car.status}
                            </span>
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{car.carName}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">مدل {car.modelYear}</p>
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                    {car.price ? car.price.toLocaleString('fa-IR') : 'توافقی'}
                                </span>
                                <span className="text-[10px] text-slate-400">تومان</span>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4 text-xs text-slate-600 dark:text-slate-300">
                            <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-1">
                                <span>کارکرد:</span>
                                <span className="font-mono">{car.mileage.toLocaleString('fa-IR')} km</span>
                            </div>
                            <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-1">
                                <span>محل بازدید:</span>
                                <span>{car.location === 'SHOWROOM' ? 'نمایشگاه' : car.location === 'OWNER' ? 'نزد مالک' : 'انبار'}</span>
                            </div>
                            <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-1">
                                <span>مالک:</span>
                                <span>{car.sellerName}</span>
                            </div>
                            <div className="flex justify-between pb-1">
                                <span>تماس:</span>
                                <span className="font-mono" dir="ltr">{car.sellerPhone1}</span>
                            </div>
                        </div>

                        <div className="mt-auto flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <button onClick={() => onEdit(car)} className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors" title="ویرایش">
                                <EditIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => onDelete(car.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="حذف">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UsedCarTable;
