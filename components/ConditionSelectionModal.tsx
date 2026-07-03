import React, { useState, useEffect } from 'react';
import type { CarSaleCondition } from '../types';
import { ConditionStatus } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface ConditionSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedConditions: CarSaleCondition[]) => void;
    conditions: CarSaleCondition[];
}

const statusColorMap: Record<ConditionStatus, string> = {
    [ConditionStatus.AVAILABLE]: 'bg-green-100 text-green-800 border-green-200',
    [ConditionStatus.SOLD_OUT]: 'bg-red-100 text-red-800 border-red-200',
    [ConditionStatus.CAPACITY_FULL]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};


const ConditionSelectionModal: React.FC<ConditionSelectionModalProps> = ({ isOpen, onClose, onConfirm, conditions }) => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set());
        }
    }, [isOpen]);

    const handleToggle = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        const selectedConditions = conditions.filter(c => selectedIds.has(c.id));
        onConfirm(selectedConditions);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center sticky top-0 bg-white flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">انتخاب شرایط فروش</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-4 space-y-3">
                    {conditions.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">هیچ شرطی برای انتخاب وجود ندارد.</p>
                    ) : (
                        conditions.map(condition => {
                            const isSelected = selectedIds.has(condition.id);
                            return (
                                <div
                                    key={condition.id}
                                    onClick={() => handleToggle(condition.id)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 mr-4 mt-1">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                                className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            />
                                        </div>
                                        <div className="flex-grow text-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="font-bold text-slate-800">{condition.sale_type} - {condition.pay_type}</h3>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusColorMap[condition.status]}`}>
                                                    {condition.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
                                                <p><strong>مدل:</strong> {condition.model}</p>
                                                <p><strong>سند:</strong> {condition.document_status}</p>
                                                <p><strong>تحویل:</strong> {condition.delivery_time}</p>
                                                <p><strong>رنگ‌ها:</strong> {condition.colors.join('، ')}</p>
                                            </div>
                                            <p className="font-semibold text-slate-700 mt-2">
                                                {condition.pay_type === 'نقدی' ? 'قیمت خودرو:' : 'پیش پرداخت:'} <span className="font-mono text-sky-700">{condition.initial_deposit.toLocaleString('fa-IR')} تومان</span>
                                            </p>
                                            {condition.descriptions && (
                                                <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200 whitespace-pre-wrap">{condition.descriptions}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </main>

                <footer className="p-4 border-t flex justify-end gap-3 bg-slate-50 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">انصراف</button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0}
                        className="px-5 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed"
                    >
                        تایید ({selectedIds.size.toLocaleString('fa-IR')})
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ConditionSelectionModal;