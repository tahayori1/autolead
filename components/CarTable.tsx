import React from 'react';
import type { Car } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EyeIcon } from './icons/EyeIcon';
import { CarIcon } from './icons/CarIcon';

interface CarTableProps {
    cars: Car[];
    onEdit: (car: Car) => void;
    onDelete: (id: number) => void;
    onView: (car: Car) => void;
}

const CarTable: React.FC<CarTableProps> = ({ cars, onEdit, onDelete, onView }) => {
    if (cars.length === 0) {
        return <p className="text-center text-slate-500 py-10">هیچ خودرویی یافت نشد.</p>;
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block">
                <table className="w-full text-sm text-right text-slate-600">
                    <thead className="text-xs text-slate-700 bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 uppercase font-bold">تصویر</th>
                            <th scope="col" className="px-6 py-3 uppercase font-bold">نام خودرو</th>
                            <th scope="col" className="px-6 py-3 uppercase font-bold">برند</th>
                            <th scope="col" className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {cars.map((car) => (
                            <tr key={car.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    {car.main_image_url ? (
                                        <img src={car.main_image_url} alt={car.name} className="h-10 w-16 object-cover rounded" />
                                    ) : (
                                        <div className="h-10 w-16 flex items-center justify-center bg-slate-100 rounded">
                                            <CarIcon className="h-6 w-6 text-slate-400" />
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{car.name}</td>
                                <td className="px-6 py-4">{car.brand}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-4">
                                        <button onClick={() => onView(car)} className="text-slate-500 hover:text-slate-800" title="نمایش جزئیات">
                                            <EyeIcon />
                                        </button>
                                        <button onClick={() => onEdit(car)} className="text-sky-600 hover:text-sky-800" title="ویرایش">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(car.id)} className="text-red-600 hover:text-red-800" title="حذف">
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
                {cars.map((car) => (
                     <div key={car.id} className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex flex-col justify-between">
                        <div>
                             {car.main_image_url ? (
                                <img src={car.main_image_url} alt={car.name} className="w-full h-32 object-cover" />
                            ) : (
                                <div className="w-full h-32 flex items-center justify-center bg-slate-100">
                                    <CarIcon className="w-12 h-12 text-slate-400" />
                                </div>
                            )}
                            <div className="p-4">
                                <h3 className="font-bold text-slate-800">{car.name}</h3>
                                <p className="text-sm text-slate-600"><strong>برند:</strong> {car.brand}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-4 p-4 border-t border-slate-200">
                            <button onClick={() => onView(car)} className="flex items-center gap-1 text-slate-600 hover:text-slate-800 text-sm">
                                <EyeIcon /> نمایش
                            </button>
                            <button onClick={() => onEdit(car)} className="flex items-center gap-1 text-sky-600 hover:text-sky-800 text-sm">
                                <EditIcon /> ویرایش
                            </button>
                            <button onClick={() => onDelete(car.id)} className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm">
                                <TrashIcon /> حذف
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CarTable;