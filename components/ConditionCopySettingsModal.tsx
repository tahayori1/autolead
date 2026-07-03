import React, { useState, useEffect, useMemo } from 'react';
import type { CarSaleCondition } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { CopyIcon } from './icons/CopyIcon';

interface ConditionCopySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    conditions: CarSaleCondition[];
    onCopySuccess: () => void;
}

const ConditionCopySettingsModal: React.FC<ConditionCopySettingsModalProps> = ({ isOpen, onClose, conditions, onCopySuccess }) => {
    const [headerText, setHeaderText] = useState('');
    const [footerText, setFooterText] = useState('https://t.me/kermanmotor2606');
    
    // Checkboxes for fields to include
    const [includeModelYear, setIncludeModelYear] = useState(true);
    const [includeSaleType, setIncludeSaleType] = useState(true);
    const [includePayType, setIncludePayType] = useState(true);
    const [includeDocStatus, setIncludeDocStatus] = useState(true);
    const [includeColors, setIncludeColors] = useState(true);
    const [includeDeliveryTime, setIncludeDeliveryTime] = useState(true);
    const [includeInitialDeposit, setIncludeInitialDeposit] = useState(true);
    const [includeDescriptions, setIncludeDescriptions] = useState(true);

    // Selected conditions selection state
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Initialize defaults when modal opens
    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const date = now.toLocaleDateString('fa-IR');
            const time = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
            setHeaderText(`📋 بخشنامه‌ها و شرایط فروش فعال در تاریخ ${date} ساعت ${time}`);
            
            // By default select all conditions passed to modal
            setSelectedIds(new Set(conditions.map(c => c.id)));
        }
    }, [isOpen, conditions]);

    const handleToggleCondition = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = (select: boolean) => {
        if (select) {
            setSelectedIds(new Set(conditions.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const generatedText = useMemo(() => {
        const selectedConditions = conditions.filter(c => selectedIds.has(c.id));
        
        const rows = selectedConditions.map((c, index) => {
            let title = `🚗 ${c.car_model}`;
            if (includeModelYear && c.model) {
                title += ` (مدل ${c.model.toLocaleString('fa-IR')})`;
            }

            let lines = [title];

            if (includeSaleType && c.sale_type) {
                lines.push(`🔹 نوع فروش: ${c.sale_type}`);
            }
            if (includePayType && c.pay_type) {
                lines.push(`💳 نحوه پرداخت: ${c.pay_type}`);
            }
            if (includeDocStatus && c.document_status) {
                lines.push(`📂 وضعیت سند: ${c.document_status}`);
            }
            if (includeColors && c.colors && c.colors.length > 0) {
                lines.push(`🎨 رنگ‌های موجود: ${c.colors.join(' - ')}`);
            }
            if (includeDeliveryTime && c.delivery_time) {
                lines.push(`⏱ زمان تحویل: ${c.delivery_time}`);
            }
            if (includeInitialDeposit && c.initial_deposit !== undefined) {
                const label = c.pay_type === 'نقدی' ? 'قیمت' : 'پیش‌پرداخت';
                lines.push(`💰 ${label}: ${c.initial_deposit.toLocaleString('fa-IR')} تومان`);
            }
            if (includeDescriptions && c.descriptions) {
                lines.push(`📝 توضیحات: ${c.descriptions}`);
            }

            return lines.join('\n');
        });

        return `${headerText}\n\n${rows.join('\n\n───────────────────\n\n')}\n\n${footerText}`;
    }, [
        conditions, selectedIds, headerText, footerText,
        includeModelYear, includeSaleType, includePayType, includeDocStatus,
        includeColors, includeDeliveryTime, includeInitialDeposit, includeDescriptions
    ]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText).then(() => {
            onCopySuccess();
            onClose();
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">تنظیمات کپی شرایط فروش</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <CloseIcon className="text-slate-500 w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar: Settings */}
                    <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-900/50 p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-700">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">متن سرتیتر</label>
                                <textarea 
                                    value={headerText}
                                    onChange={e => setHeaderText(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">فیلدهای نمایشی در کپی</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={includeModelYear} onChange={e => setIncludeModelYear(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm dark:text-slate-300">سال مدل</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={includeSaleType} onChange={e => setIncludeSaleType(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm dark:text-slate-300">نوع فروش</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={includePayType} onChange={e => setIncludePayType(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm dark:text-slate-300">نحوه پرداخت</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={includeDocStatus} onChange={e => setIncludeDocStatus(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm dark:text-slate-300">وضعیت سند</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={includeColors} onChange={e => setIncludeColors(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm dark:text-slate-300">رنگ‌های موجود</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={includeDeliveryTime} onChange={e => setIncludeDeliveryTime(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm dark:text-slate-300">زمان تحویل</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={includeInitialDeposit} onChange={e => setIncludeInitialDeposit(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm dark:text-slate-300">پیش‌پرداخت</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={includeDescriptions} onChange={e => setIncludeDescriptions(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm dark:text-slate-300">توضیحات بخشنامه</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-slate-500">انتخاب بخشنامه‌ها ({conditions.length.toLocaleString('fa-IR')} مورد)</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSelectAll(true)} className="text-[10px] text-sky-600 hover:underline">همه</button>
                                        <button onClick={() => handleSelectAll(false)} className="text-[10px] text-red-500 hover:underline">هیچکدام</button>
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {conditions.map(c => (
                                        <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.has(c.id)} 
                                                onChange={() => handleToggleCondition(c.id)} 
                                                className="rounded text-sky-600 focus:ring-sky-500" 
                                            />
                                            <span className="text-sm dark:text-slate-300 truncate">
                                                {c.car_model} ({c.sale_type})
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">متن پاورقی</label>
                                <input 
                                    type="text" 
                                    value={footerText}
                                    onChange={e => setFooterText(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-100 dark:bg-black/20">
                        <div className="max-w-xl mx-auto">
                            <label className="block text-xs font-bold text-slate-500 mb-2 text-center">پیش‌نمایش متن کپی شده</label>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm whitespace-pre-wrap text-sm leading-relaxed dark:text-slate-200 font-mono">
                                {generatedText}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t dark:border-slate-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">انصراف</button>
                    <button onClick={handleCopy} className="px-8 py-2.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 shadow-lg shadow-sky-200 dark:shadow-none transition-all flex items-center gap-2">
                        <CopyIcon className="w-5 h-5" />
                        کپی در حافظه
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConditionCopySettingsModal;
