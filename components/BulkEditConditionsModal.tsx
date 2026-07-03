
import React, { useState } from 'react';
import type { CarSaleCondition } from '../types';
import { ConditionStatus, SaleType, PayType, DocumentStatus } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface BulkEditConditionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: Partial<CarSaleCondition>) => Promise<void>;
    count: number;
}

const AVAILABLE_COLORS = ['سفید', 'مشکی', 'خاکستری', 'آبی', 'قرمز', 'قهوه ای', 'سایر'];

const BulkEditConditionsModal: React.FC<BulkEditConditionsModalProps> = ({ isOpen, onClose, onSave, count }) => {
    const [enabledFields, setEnabledFields] = useState<Set<string>>(new Set());
    const [formData, setFormData] = useState<Partial<CarSaleCondition>>({
        status: ConditionStatus.AVAILABLE,
        model: 1404,
        sale_type: SaleType.FACTORY_REGISTRATION,
        pay_type: PayType.CASH,
        document_status: DocumentStatus.FREE,
        colors: [],
        delivery_time: '',
        stock_quantity: 0,
        is_public: true,
    });
    const [isSaving, setIsSaving] = useState(false);

    const toggleField = (field: string) => {
        setEnabledFields(prev => {
            const next = new Set(prev);
            if (next.has(field)) next.delete(field);
            else next.add(field);
            return next;
        });
    };

    const handleChange = (field: keyof CarSaleCondition, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleColor = (color: string) => {
        const currentColors = [...(formData.colors || [])];
        const index = currentColors.indexOf(color);
        if (index > -1) {
            currentColors.splice(index, 1);
        } else {
            currentColors.push(color);
        }
        handleChange('colors', currentColors);
    };

    const handleSave = async () => {
        if (enabledFields.size === 0) {
            alert('حداقل یک فیلد را برای ویرایش انتخاب کنید.');
            return;
        }

        const updates: Partial<CarSaleCondition> = {};
        enabledFields.forEach(field => {
            (updates as any)[field] = (formData as any)[field];
        });

        setIsSaving(true);
        try {
            await onSave(updates);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    // FIX: Added '?' to children to resolve TypeScript "missing children" error when used in JSX tags.
    const FieldWrapper = ({ label, field, children }: { label: string, field: string, children?: React.ReactNode }) => (
        <div className={`p-4 border rounded-xl transition-all ${enabledFields.has(field) ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 ring-1 ring-sky-200' : 'border-slate-200 dark:border-slate-700 opacity-60'}`}>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input 
                    type="checkbox" 
                    checked={enabledFields.has(field)} 
                    onChange={() => toggleField(field)}
                    className="w-5 h-5 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
            </label>
            <div className={enabledFields.has(field) ? '' : 'pointer-events-none'}>
                {children}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">ویرایش گروهی شرایط فروش</h3>
                        <p className="text-sm text-sky-600 dark:text-sky-400 font-bold mt-1">{count.toLocaleString('fa-IR')} مورد انتخاب شده است</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><CloseIcon className="text-slate-500" /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldWrapper label="وضعیت موجودی" field="status">
                            <select value={formData.status} onChange={e => handleChange('status', e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white">
                                {Object.values(ConditionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </FieldWrapper>

                        <FieldWrapper label="سال مدل" field="model">
                            <input type="number" value={formData.model} onChange={e => handleChange('model', parseInt(e.target.value))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white font-mono" />
                        </FieldWrapper>

                        <FieldWrapper label="تعداد در انبار" field="stock_quantity">
                            <input type="number" value={formData.stock_quantity ?? ''} onChange={e => handleChange('stock_quantity', parseInt(e.target.value, 10) || 0)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white font-mono" />
                        </FieldWrapper>

                        <FieldWrapper label="زمان تحویل" field="delivery_time">
                            <input type="text" value={formData.delivery_time} onChange={e => handleChange('delivery_time', e.target.value)} placeholder="مثلاً: ۶۰ روز کاری" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" />
                        </FieldWrapper>

                        <FieldWrapper label="نوع فروش" field="sale_type">
                            <select value={formData.sale_type} onChange={e => handleChange('sale_type', e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white">
                                {Object.values(SaleType).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </FieldWrapper>

                        <FieldWrapper label="نحوه پرداخت" field="pay_type">
                            <select value={formData.pay_type} onChange={e => handleChange('pay_type', e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white">
                                {Object.values(PayType).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </FieldWrapper>
                        
                        <FieldWrapper label="وضعیت سند" field="document_status">
                            <select value={formData.document_status} onChange={e => handleChange('document_status', e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white">
                                {Object.values(DocumentStatus).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </FieldWrapper>

                        <FieldWrapper label="نمایش عمومی" field="is_public">
                            <div className="flex items-center gap-2 py-2">
                                <input 
                                    type="checkbox" 
                                    id="bulk_is_public"
                                    checked={formData.is_public} 
                                    onChange={e => handleChange('is_public', e.target.checked)}
                                    className="w-5 h-5 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                                />
                                <label htmlFor="bulk_is_public" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">نمایش عمومی در سایت</label>
                            </div>
                        </FieldWrapper>
                    </div>

                    <FieldWrapper label="انتخاب رنگ‌ها" field="colors">
                        <div className="flex flex-wrap gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            {AVAILABLE_COLORS.map(color => {
                                const isSelected = (formData.colors || []).includes(color);
                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => toggleColor(color)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                            isSelected 
                                            ? 'bg-sky-600 border-sky-600 text-white shadow-sm' 
                                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-sky-400'
                                        }`}
                                    >
                                        {color}
                                    </button>
                                );
                            })}
                        </div>
                    </FieldWrapper>
                </div>

                <div className="p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">انصراف</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving || enabledFields.size === 0}
                        className="px-8 py-2.5 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 disabled:opacity-30 shadow-lg shadow-sky-200 dark:shadow-none transition-all"
                    >
                        {isSaving ? 'در حال اعمال تغییرات...' : `اعمال بر روی ${count.toLocaleString('fa-IR')} مورد`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkEditConditionsModal;
