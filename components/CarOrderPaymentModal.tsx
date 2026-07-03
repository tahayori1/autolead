
import React, { useState, useEffect } from 'react';
import type { CarOrder } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';

interface CarOrderPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: CarOrder | null;
    onRegister: (data: { amount: string, chassis: string, plate: string, description: string, receiptImage: File | null }) => void;
}

const numberToPersianWords = (num: number): string => num.toLocaleString('fa-IR');

const CarOrderPaymentModal: React.FC<CarOrderPaymentModalProps> = ({ isOpen, onClose, order, onRegister }) => {
    const [formData, setFormData] = useState({
        amount: '',
        chassis: '',
        plate: '',
        description: '',
        receiptImage: null as File | null
    });
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                amount: '',
                chassis: '',
                plate: '',
                description: '',
                receiptImage: null
            });
            setIsConfirmOpen(false);
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!formData.chassis || !formData.plate || !formData.amount) {
            setError('لطفاً شماره شاسی، پلاک و مبلغ را وارد کنید.');
            return;
        }

        const requiredAmount = order?.finalPrice || order?.proposedPrice || 0;
        const enteredAmount = Number(formData.amount);

        if (enteredAmount !== requiredAmount) {
            setError(`مبلغ واریزی باید دقیقاً برابر با مبلغ تایید شده (${requiredAmount.toLocaleString('fa-IR')} تومان) باشد.`);
            return;
        }

        setError(null);
        setIsConfirmOpen(true);
    };

    const handleConfirm = () => {
        onRegister(formData);
    };

    if (!isOpen || !order) return null;

    if (isConfirmOpen) {
        return (
            <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[70] p-4 backdrop-blur-sm" onClick={() => setIsConfirmOpen(false)}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 text-center">تایید اطلاعات پرداخت</h3>
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-sm mb-6">
                        <div className="flex justify-between"><span className="text-slate-500">مبلغ:</span><span className="font-bold font-mono">{Number(formData.amount).toLocaleString('fa-IR')}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">شاسی:</span><span className="font-mono">{formData.chassis}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">پلاک:</span><span className="font-mono">{formData.plate}</span></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50">اصلاح</button>
                        <button onClick={handleConfirm} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg">تایید نهایی</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">ثبت فیش واریزی</h3>
                    <button onClick={onClose}><CloseIcon className="text-slate-500" /></button>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 text-sm mb-4">
                        <div className="flex justify-between mb-1">
                            <span className="text-slate-500">خریدار:</span>
                            <span className="font-bold">{order.buyerName}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-slate-500">خودرو:</span>
                            <span className="font-bold">{order.carName}</span>
                        </div>
                        <div className="flex justify-between bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="font-bold text-xs self-center">مبلغ مصوب قابل پرداخت:</span>
                            <span className="font-black font-mono text-sm">{(order.finalPrice || order.proposedPrice).toLocaleString('fa-IR')} تومان</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">شماره شاسی <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={formData.chassis}
                                onChange={e => setFormData({...formData, chassis: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono text-sm"
                                placeholder="VIN..."
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">شماره پلاک <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={formData.plate}
                                onChange={e => setFormData({...formData, plate: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono text-sm"
                                placeholder="11ب222-33"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">مبلغ واریزی (تومان) <span className="text-red-500">*</span></label>
                        <input 
                            type="number" 
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono text-lg font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="0"
                        />
                        {formData.amount && (
                            <p className="text-[10px] text-slate-500 mt-1">{numberToPersianWords(Number(formData.amount))} تومان</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">تصویر فیش <span className="text-red-500">*</span></label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                <UploadIcon className="w-8 h-8" />
                                <span className="text-xs">برای آپلود تصویر کلیک کنید</span>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setFormData({...formData, receiptImage: e.target.files[0]})} />
                        </div>
                        {formData.receiptImage && <p className="text-xs text-green-600 mt-1 text-center font-bold">تصویر انتخاب شد: {formData.receiptImage.name}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">توضیحات (اختیاری)</label>
                        <textarea 
                            rows={2}
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                        ></textarea>
                    </div>
                    {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-slate-700">
                    <button onClick={onClose} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700">انصراف</button>
                    <button onClick={handleSubmit} className="px-8 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 shadow-lg shadow-amber-200 dark:shadow-none">ثبت فیش واریزی</button>
                </div>
            </div>
        </div>
    );
};

export default CarOrderPaymentModal;
