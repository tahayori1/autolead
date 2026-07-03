import React, { useState, useEffect } from 'react';
import type { Car } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface CarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (car: Omit<Car, 'id'>) => void;
    car: Car | null;
}

const initialFormState: Omit<Car, 'id'> = {
    name: '',
    brand: '',
    technical_specs: '',
    comfort_features: '',
    main_image_url: '',
    front_image_url: '',
    side_image_url: '',
    rear_image_url: '',
    dashboard_image_url: '',
    interior_image_1_url: '',
    interior_image_2_url: '',
};

const FormField: React.FC<{ label: string, name: keyof typeof initialFormState, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, type?: string, required?: boolean, error?: string, rows?: number }> = 
({ label, name, value, onChange, type = 'text', required = false, error, rows }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
        {type === 'textarea' ? (
            <textarea
                id={name} name={name} value={value} onChange={onChange} rows={rows || 3}
                className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-slate-300'}`}
            />
        ) : (
            <input
                id={name} name={name} type={type} value={value} onChange={onChange}
                className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-slate-300'}`}
            />
        )}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);


const CarModal: React.FC<CarModalProps> = ({ isOpen, onClose, onSave, car }) => {
    const [formState, setFormState] = useState(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (car) {
            setFormState(car);
        } else {
            setFormState(initialFormState);
        }
        setErrors({});
    }, [car, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof typeof errors];
                return newErrors;
            });
        }
    };
    
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formState.name.trim()) newErrors.name = 'نام خودرو الزامی است.';
        if (!formState.brand.trim()) newErrors.brand = 'برند خودرو الزامی است.';
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-6 border-b flex justify-between items-center sticky top-0 bg-white flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">{car ? 'ویرایش خودرو' : 'افزودن خودرو جدید'}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="نام خودرو" name="name" value={formState.name} onChange={handleChange} required error={errors.name} />
                            <FormField label="برند خودرو" name="brand" value={formState.brand} onChange={handleChange} required error={errors.brand} />
                        </div>
                        <FormField label="مشخصات فنی" name="technical_specs" value={formState.technical_specs} onChange={handleChange} type="textarea" rows={4} />
                        <FormField label="امکانات رفاهی" name="comfort_features" value={formState.comfort_features} onChange={handleChange} type="textarea" rows={4} />
                        
                        <div className="pt-4 border-t">
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">لینک تصاویر</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="تصویر اصلی" name="main_image_url" value={formState.main_image_url} onChange={handleChange} />
                                <FormField label="تصویر از جلو" name="front_image_url" value={formState.front_image_url} onChange={handleChange} />
                                <FormField label="تصویر از بقل" name="side_image_url" value={formState.side_image_url} onChange={handleChange} />
                                <FormField label="تصویر از پشت" name="rear_image_url" value={formState.rear_image_url} onChange={handleChange} />
                                <FormField label="تصویر داشبورد" name="dashboard_image_url" value={formState.dashboard_image_url} onChange={handleChange} />
                                <FormField label="تصویر داخلی ۱" name="interior_image_1_url" value={formState.interior_image_1_url} onChange={handleChange} />
                                <FormField label="تصویر داخلی ۲" name="interior_image_2_url" value={formState.interior_image_2_url} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                    <footer className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white py-4 px-6 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">انصراف</button>
                        <button type="submit" className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">ذخیره</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default CarModal;