import React from 'react';
import type { Car, CarSaleCondition } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import Spinner from './Spinner';
import { ConditionStatus } from '../types';
import { UsersIcon } from './icons/UsersIcon';

interface CarViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    car: Car | null;
    conditions: CarSaleCondition[];
    conditionsLoading: boolean;
    conditionsError: string | null;
    onNavigateToLeads: (carModel: string) => void;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
    <div className={`flex flex-col p-3 rounded-lg bg-slate-50 ${className}`}>
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-sm font-semibold text-slate-800 whitespace-pre-wrap break-words">{value || '-'}</span>
    </div>
);

const statusColorMap: Record<ConditionStatus, string> = {
    [ConditionStatus.AVAILABLE]: 'bg-green-100 text-green-800',
    [ConditionStatus.SOLD_OUT]: 'bg-red-100 text-red-800',
    [ConditionStatus.CAPACITY_FULL]: 'bg-yellow-100 text-yellow-800',
};

const CarViewModal: React.FC<CarViewModalProps> = ({ isOpen, onClose, car, conditions, conditionsLoading, conditionsError, onNavigateToLeads }) => {
    if (!isOpen || !car) return null;

    const renderImage = (url: string | null, alt: string) => {
        if (!url) return null;
        return <img src={url} alt={alt} className="w-full h-auto object-cover rounded-lg border" loading="lazy" />;
    };
    
    const renderConditions = () => {
        if (conditionsLoading) {
            return <div className="flex justify-center p-4"><Spinner /></div>;
        }
        if (conditionsError) {
            return <p className="text-center text-red-500 p-4">{conditionsError}</p>;
        }
        if (conditions.length === 0) {
            return <p className="text-center text-slate-500 p-4">هیچ شرایط فروشی برای این خودرو یافت نشد.</p>;
        }
        return (
            <ul className="divide-y divide-slate-200">
                {conditions.map(cond => (
                    <li key={cond.id} className="p-3">
                        <div className="flex justify-between items-center mb-1">
                             <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColorMap[cond.status]}`}>
                                {cond.status}
                            </span>
                            <span className="text-sm font-semibold text-slate-700">{cond.sale_type}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex justify-between">
                            <span>{cond.pay_type}</span>
                            <span>{cond.pay_type === 'نقدی' ? 'قیمت:' : 'پیش پرداخت:'} <span className="font-mono">{cond.initial_deposit.toLocaleString('fa-IR')}</span></span>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">مشخصات خودرو</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Car Details Column */}
                        <div className="space-y-4">
                            <div className="p-4 border border-sky-200 bg-sky-50 rounded-lg text-center">
                                <h3 className="text-xl font-bold text-sky-800">{car.name}</h3>
                                <p className="text-md text-sky-700">{car.brand}</p>
                            </div>
                            
                            <div className="space-y-3">
                                <DetailItem label="مشخصات فنی" value={car.technical_specs} />
                                <DetailItem label="امکانات رفاهی" value={car.comfort_features} />
                            </div>

                            <div className="pt-4 border-t">
                                <h4 className="text-md font-semibold text-slate-700 mb-3">تصاویر</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {renderImage(car.main_image_url, 'تصویر اصلی')}
                                    {renderImage(car.front_image_url, 'تصویر جلو')}
                                    {renderImage(car.side_image_url, 'تصویر بغل')}
                                    {renderImage(car.rear_image_url, 'تصویر پشت')}
                                    {renderImage(car.dashboard_image_url, 'داشبورد')}
                                    {renderImage(car.interior_image_1_url, 'داخل کابین ۱')}
                                    {renderImage(car.interior_image_2_url, 'داخل کابین ۲')}
                                </div>
                            </div>
                        </div>

                        {/* Conditions Column */}
                        <div>
                           <div className="bg-slate-50 rounded-lg border border-slate-200 h-full flex flex-col">
                                <h4 className="text-md font-semibold text-slate-700 p-4 border-b border-slate-200 flex-shrink-0">
                                    شرایط موجود برای این خودرو
                                </h4>
                                <div className="overflow-y-auto flex-grow">
                                    {renderConditions()}
                                </div>
                           </div>
                        </div>
                    </div>
                </main>
                
                <footer className="p-4 border-t flex justify-between items-center gap-3 bg-slate-50 flex-shrink-0">
                    <button 
                        type="button" 
                        onClick={() => onNavigateToLeads(car.name)}
                        className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 flex items-center gap-2"
                    >
                        <UsersIcon />
                        مشاهده سرنخ های علاقه مند
                    </button>
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">بستن</button>
                </footer>
            </div>
        </div>
    );
};

export default CarViewModal;
