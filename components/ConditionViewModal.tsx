import React from 'react';
import type { CarSaleCondition } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { User, ClipboardCheck, Info, Sparkles } from 'lucide-react';

interface ConditionViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    condition: CarSaleCondition | null;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
    <div className={`flex flex-col p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/30 ${className}`}>
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
);

const ConditionViewModal: React.FC<ConditionViewModalProps> = ({ isOpen, onClose, condition }) => {
    if (!isOpen || !condition) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 print:bg-transparent print:p-0" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col print:shadow-none print:max-h-full print:rounded-none" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b dark:border-slate-700 flex justify-between items-center print:hidden">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">نمایش جزئیات شرایط فروش</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400">
                        <CloseIcon />
                    </button>
                </header>

                <main id="printable-area" className="p-6 overflow-y-auto space-y-4">
                    <div className="p-4 border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20 rounded-lg text-center relative">
                        <h3 className="text-xl font-black text-sky-800 dark:text-sky-300">{condition.car_model} - {condition.model}</h3>
                        <div className="absolute top-2 left-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${condition.is_public ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                                {condition.is_public ? 'نمایش عمومی' : 'عدم نمایش'}
                            </span>
                        </div>
                    </div>

                    {/* Integrated Used Car Appraisal Section */}
                    {condition.expert_report_id && (
                        <div className="p-4 rounded-xl border border-indigo-150 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/15 flex items-start gap-3">
                            <ClipboardCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">گزارش کارشناسی خودرو متصل شده</h4>
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-1">
                                    {condition.expert_report_title || `گزارش کارشناسی کد ${condition.expert_report_id}`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Integrated Owner Information Section */}
                    {condition.owner_name && (
                        <div className="p-4 rounded-xl border border-sky-150 dark:border-sky-900/40 bg-sky-50/40 dark:bg-sky-950/15 flex items-start gap-3">
                            <User className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-black text-sky-700 dark:text-sky-400 uppercase tracking-wider">اطلاعات مالک خودرو (CRM)</h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                                        نام کامل: <span className="text-slate-900 dark:text-white">{condition.owner_name}</span>
                                    </p>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                                        تلفن همراه: <span className="text-slate-900 dark:text-white font-mono">{condition.owner_phone || 'ثبت نشده'}</span>
                                    </p>
                                    {condition.owner_id && (
                                        <span className="text-[9px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold px-1.5 py-0.5 rounded-full">
                                            شناسه CRM: {condition.owner_id}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <DetailItem label="وضعیت" value={condition.status} />
                        <DetailItem label="موجودی انبار" value={`${condition.stock_quantity.toLocaleString('fa-IR')} عدد`} />
                        <DetailItem label="نوع فروش" value={condition.sale_type} className="text-indigo-600 dark:text-indigo-400" />
                        <DetailItem label="نحوه پرداخت" value={condition.pay_type} />
                        <DetailItem label="وضعیت سند" value={condition.document_status} />
                        <DetailItem label="زمان تحویل" value={condition.delivery_time} />
                    </div>
                    
                    <DetailItem label="رنگ‌های مجاز" value={condition.colors.join('، ')} className="bg-sky-50/50 dark:bg-sky-950/10" />

                    <DetailItem 
                        label={condition.pay_type === 'نقدی' ? 'قیمت خودرو' : 'مبلغ پیش‌پرداخت'}
                        value={<><span className="font-mono text-xl text-emerald-700 dark:text-emerald-400">{condition.initial_deposit.toLocaleString('fa-IR')}</span> تومان</>}
                        className="text-center bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30"
                    />
                    
                    {condition.descriptions && (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/30">
                            <span className="text-xs text-slate-500 dark:text-slate-400">توضیحات</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{condition.descriptions}</p>
                        </div>
                    )}
                </main>
                
                <footer className="p-4 border-t dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/20 print:hidden">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-bold">بستن</button>
                    <button type="button" onClick={handlePrint} className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-lg shadow-sky-200 dark:shadow-none">پرینت بخشنامه</button>
                </footer>
            </div>
            <style>
                {`
                    @media print {
                        body > *:not(.fixed) {
                            display: none;
                        }
                        .fixed {
                            position: static;
                        }
                        #printable-area {
                            display: block;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default ConditionViewModal;
