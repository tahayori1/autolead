
import React, { useState, useEffect } from 'react';
import type { CarPrice } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface CarPriceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (price: Omit<CarPrice, 'id'>) => void;
    price: CarPrice | null;
}

const CAR_MODELS = [
    'JAC J4', 'JAC S3', 'JAC S5', 'BAC X3PRO', 'KMC T8', 'KMC T9', 'KMC A5',
    'KMC J7', 'KMC X5', 'KMC SR3', 'KMC EAGLE', 'KMC SHADOW', 'KMC SR6'
];

const initialFormState: Omit<CarPrice, 'id'> = {
    car_model: CAR_MODELS[0],
    price_date: new Date().toISOString().split('T')[0],
    factory_price: 0,
    market_price: 0,
};

const CarPriceModal: React.FC<CarPriceModalProps> = ({ isOpen, onClose, onSave, price }) => {
    const [formState, setFormState] = useState(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (price) {
            setFormState({
                ...price,
                price_date: price.price_date.split('T')[0] // Ensure date format is YYYY-MM-DD
            });
        } else {
            setFormState(initialFormState);
        }
        setErrors({});
    }, [price, isOpen]);

    const handleChange = (field: keyof typeof initialFormState, value: string | number) => {
        setFormState(prevState => ({ ...prevState, [field]: value }));
        if (errors[field]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formState.car_model.trim()) newErrors.car_model = 'مدل خودرو الزامی است.';
        if (!formState.price_date) newErrors.price_date = 'تاریخ الزامی است.';
        if (formState.factory_price <= 0) newErrors.factory_price = 'قیمت کارخانه باید بزرگتر از صفر باشد.';
        if (formState.market_price <= 0) newErrors.market_price = 'قیمت بازار باید بزرگتر از صفر باشد.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formState);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">{price ? 'ویرایش قیمت خودرو' : 'افزودن قیمت جدید'}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="car_model" className="block text-sm font-medium text-slate-700 mb-1">مدل خودرو</label>
                        <select id="car_model" value={formState.car_model} onChange={(e) => handleChange('car_model', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md bg-white ${errors.car_model ? 'border-red-500' : 'border-slate-300'}`}>
                            {CAR_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
                        </select>
                        {errors.car_model && <p className="text-red-500 text-xs mt-1">{errors.car_model}</p>}
                    </div>
                     <div>
                        <label htmlFor="price_date" className="block text-sm font-medium text-slate-700 mb-1">تاریخ قیمت</label>
                        <input type="date" id="price_date" value={formState.price_date} onChange={(e) => handleChange('price_date', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md ${errors.price_date ? 'border-red-500' : 'border-slate-300'}`} />
                        {errors.price_date && <p className="text-red-500 text-xs mt-1">{errors.price_date}</p>}
                    </div>
                     <div>
                        <label htmlFor="factory_price" className="block text-sm font-medium text-slate-700 mb-1">قیمت کارخانه (تومان)</label>
                        <input type="number" id="factory_price" value={formState.factory_price} onChange={(e) => handleChange('factory_price', parseInt(e.target.value, 10) || 0)}
                            className={`w-full px-3 py-2 border rounded-md ${errors.factory_price ? 'border-red-500' : 'border-slate-300'}`} />
                        {errors.factory_price && <p className="text-red-500 text-xs mt-1">{errors.factory_price}</p>}
                    </div>
                     <div>
                        <label htmlFor="market_price" className="block text-sm font-medium text-slate-700 mb-1">قیمت بازار (تومان)</label>
                        <input type="number" id="market_price" value={formState.market_price} onChange={(e) => handleChange('market_price', parseInt(e.target.value, 10) || 0)}
                            className={`w-full px-3 py-2 border rounded-md ${errors.market_price ? 'border-red-500' : 'border-slate-300'}`} />
                        {errors.market_price && <p className="text-red-500 text-xs mt-1">{errors.market_price}</p>}
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

export default CarPriceModal;
