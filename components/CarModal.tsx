import React, { useState, useEffect } from 'react';
import type { Car } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { Car as CarIcon, Check, Image as ImageIcon, Sparkles } from 'lucide-react';

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

const FormField: React.FC<{ 
    label: string, 
    name: keyof typeof initialFormState, 
    value: string, 
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, 
    type?: string, 
    required?: boolean, 
    error?: string, 
    rows?: number,
    placeholder?: string
}> = ({ label, name, value, onChange, type = 'text', required = false, error, rows, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {label}{required && <span className="text-red-500 mr-1">*</span>}
        </label>
        {type === 'textarea' ? (
            <textarea
                id={name} 
                name={name} 
                value={value} 
                onChange={onChange} 
                rows={rows || 3}
                placeholder={placeholder}
                className={`w-full px-3.5 py-2.5 text-xs border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all ${
                    error 
                    ? 'border-red-500 ring-2 ring-red-100 dark:ring-red-950/40' 
                    : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40'
                }`}
            />
        ) : (
            <input
                id={name} 
                name={name} 
                type={type} 
                value={value} 
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full px-3.5 py-2.5 text-xs border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all ${
                    error 
                    ? 'border-red-500 ring-2 ring-red-100 dark:ring-red-950/40' 
                    : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40'
                }`}
            />
        )}
        {error && <p className="text-red-500 text-[11px] mt-1 font-bold">{error}</p>}
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
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex justify-center items-center z-[70] p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80 rounded-t-2xl flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                            <CarIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                                {car ? 'ویرایش اطلاعات خودرو' : 'افزودن خودرو جدید'}
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                ثبت مشخصات کامل، مشخصات فنی، آپشن‌ها و تصاویر خودرو
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all"
                    >
                        <CloseIcon />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-4 sm:p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField 
                                label="نام و مدل خودرو" 
                                name="name" 
                                value={formState.name} 
                                onChange={handleChange} 
                                required 
                                error={errors.name} 
                                placeholder="مثال: دیگنیتی پرستیژ / فونیکس FX"
                            />
                            <FormField 
                                label="برند / شرکت سازنده" 
                                name="brand" 
                                value={formState.brand} 
                                onChange={handleChange} 
                                required 
                                error={errors.brand} 
                                placeholder="مثال: بهمن موتور / مدیران خودرو / سایپا"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField 
                                label="مشخصات فنی و موتوری" 
                                name="technical_specs" 
                                value={formState.technical_specs} 
                                onChange={handleChange} 
                                type="textarea" 
                                rows={4} 
                                placeholder="حجم موتور، گیربکس، اسب بخار، سیستم تعلیق و..."
                            />
                            <FormField 
                                label="امکانات رفاهی و آپشن‌ها" 
                                name="comfort_features" 
                                value={formState.comfort_features} 
                                onChange={handleChange} 
                                type="textarea" 
                                rows={4} 
                                placeholder="سانروف، کروز کنترل، رادارها، دوربین ۳۶۰ و..."
                            />
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-3">
                                <ImageIcon className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-xs font-black text-slate-700 dark:text-slate-300">لینک تصاویر خودرو (اختیاری)</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                <FormField label="تصویر اصلی (شاخص)" name="main_image_url" value={formState.main_image_url} onChange={handleChange} placeholder="https://..." />
                                <FormField label="تصویر نمای روبرو" name="front_image_url" value={formState.front_image_url} onChange={handleChange} placeholder="https://..." />
                                <FormField label="تصویر نمای جانبی (بغل)" name="side_image_url" value={formState.side_image_url} onChange={handleChange} placeholder="https://..." />
                                <FormField label="تصویر نمای پشت" name="rear_image_url" value={formState.rear_image_url} onChange={handleChange} placeholder="https://..." />
                                <FormField label="تصویر داشبورد و کابین" name="dashboard_image_url" value={formState.dashboard_image_url} onChange={handleChange} placeholder="https://..." />
                                <FormField label="تصویر نمای داخلی ۱" name="interior_image_1_url" value={formState.interior_image_1_url} onChange={handleChange} placeholder="https://..." />
                                <FormField label="تصویر نمای داخلی ۲" name="interior_image_2_url" value={formState.interior_image_2_url} onChange={handleChange} placeholder="https://..." />
                            </div>
                        </div>
                    </div>

                    <footer className="border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5 sticky bottom-0 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md py-3.5 px-6 rounded-b-2xl flex-shrink-0">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-bold transition-all"
                        >
                            انصراف
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/20 text-xs font-black transition-all flex items-center gap-1.5 active:scale-95"
                        >
                            <Check className="w-4 h-4" />
                            <span>{car ? 'ذخیره تغییرات' : 'ثبت خودرو جدید'}</span>
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default CarModal;