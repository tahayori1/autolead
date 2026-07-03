import React, { useState } from 'react';
import type { DeliveryProcess } from '../types';
import { DeliveryStatus } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import PersianDatePicker from './PersianDatePicker';

interface DeliveryProcessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (delivery: Omit<DeliveryProcess, 'id'>) => void;
}

const CAR_MODELS = [
    'JAC J4', 'JAC S3', 'JAC S5', 'BAC X3PRO', 'KMC T8', 'KMC T9', 'KMC A5',
    'KMC J7', 'KMC X5', 'KMC SR3', 'KMC EAGLE', 'KMC SHADOW', 'KMC SR6'
];

const initialFormState: Omit<DeliveryProcess, 'id' | 'deliveredDate'> = {
    customerName: '',
    carModel: CAR_MODELS[0],
    chassisNumber: '',
    status: DeliveryStatus.AWAITING_DOCUMENTS,
    scheduledDate: new Date().toISOString().split('T')[0],
    notes: '',
};

const DeliveryProcessModal: React.FC<DeliveryProcessModalProps> = ({ isOpen, onClose, onSave }) => {
    const [formState, setFormState] = useState(initialFormState);
    // FIX: Corrected the typing for the 'errors' state to be more specific and avoid index type errors.
    const [errors, setErrors] = useState<Partial<Record<keyof typeof initialFormState, string>>>({});

    const handleChange = (field: keyof typeof initialFormState, value: string) => {
        setFormState(prevState => ({ ...prevState, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                // FIX: Removed unnecessary type casting which caused the error.
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        // FIX: Ensured newErrors matches the more specific type of the errors state.
        const newErrors: Partial<Record<keyof typeof initialFormState, string>> = {};
        if (!formState.customerName.trim()) newErrors.customerName = 'نام مشتری الزامی است.';
        if (!formState.chassisNumber.trim()) newErrors.chassisNumber = 'شماره شاسی الزامی است.';
        if (!formState.scheduledDate) newErrors.scheduledDate = 'تاریخ تحویل الزامی است.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave({
                ...formState,
                deliveredDate: null
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">افزودن فرایند تحویل جدید</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="customerName" className="block text-sm font-medium text-slate-700 mb-1">نام مشتری</label>
                        <input type="text" id="customerName" value={formState.customerName} onChange={(e) => handleChange('customerName', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md ${errors.customerName ? 'border-red-500' : 'border-slate-300'}`} />
                        {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="carModel" className="block text-sm font-medium text-slate-700 mb-1">مدل خودرو</label>
                            <select id="carModel" value={formState.carModel} onChange={(e) => handleChange('carModel', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md bg-white border-slate-300">
                                {CAR_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="chassisNumber" className="block text-sm font-medium text-slate-700 mb-1">شماره شاسی</label>
                            <input type="text" id="chassisNumber" value={formState.chassisNumber} onChange={(e) => handleChange('chassisNumber', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md ${errors.chassisNumber ? 'border-red-500' : 'border-slate-300'}`} />
                            {errors.chassisNumber && <p className="text-red-500 text-xs mt-1">{errors.chassisNumber}</p>}
                        </div>
                     </div>
                     <div>
                        <label htmlFor="scheduledDate" className="block text-sm font-medium text-slate-700 mb-1">تاریخ تحویل برنامه‌ریزی شده</label>
                        <PersianDatePicker
                            value={formState.scheduledDate}
                            onChange={(date) => handleChange('scheduledDate', date)}
                        />
                        {errors.scheduledDate && <p className="text-red-500 text-xs mt-1">{errors.scheduledDate}</p>}
                    </div>
                     <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">یادداشت</label>
                        <textarea id="notes" rows={3} value={formState.notes} onChange={(e) => handleChange('notes', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                    </div>

                    <div className="pt-4 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">انصراف</button>
                        <button type="submit" className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">ذخیره</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeliveryProcessModal;
