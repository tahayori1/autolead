
import React, { useState, useEffect } from 'react';
import type { CarOrder } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { ExitFormIcon } from './icons/ExitFormIcon';

const PREDEFINED_ADMIN_NOTES = [
    'قیمت پایین است',
    'مشتری مورد تایید نمی باشد',
    'مبلغ بیعانه تناسب ندارد',
    'توقف موقت فروش',
    'لطفا با من تماس بگیرید'
];

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ApproveModalProps extends BaseModalProps {
    order: CarOrder | null;
    finalPrice: number;
    deliveryDeadline: string;
    onConfirm: () => void;
}

export const CarOrderApproveModal: React.FC<ApproveModalProps> = ({ isOpen, onClose, order, finalPrice, deliveryDeadline, onConfirm }) => {
    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border-t-4 border-emerald-500" onClick={e => e.stopPropagation()}>
                <h3 className="font-black text-xl text-slate-800 dark:text-white mb-6 text-center">تایید نهایی سفارش</h3>
                
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">خریدار:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{order.buyerName}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">خودرو:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{order.carName}</span>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-emerald-700 dark:text-emerald-400 text-sm font-bold">قیمت نهایی مصوب:</span>
                            <span className="font-mono font-black text-lg text-emerald-800 dark:text-emerald-300">
                                {(finalPrice || order.proposedPrice).toLocaleString('fa-IR')} <span className="text-xs font-sans">تومان</span>
                            </span>
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-500 text-center font-bold">
                            {finalPrice ? finalPrice.toLocaleString('fa-IR') : order.proposedPrice.toLocaleString('fa-IR')} تومان
                        </div>
                    </div>
                    {deliveryDeadline && (
                        <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">زمان تحویل:</span>
                            <span className="font-bold text-slate-800 dark:text-white">{deliveryDeadline}</span>
                        </div>
                    )}
                </div>

                <p className="text-center text-sm font-bold text-slate-600 dark:text-slate-300 mb-6">
                    آیا از تایید نهایی و اجازه فروش اطمینان دارید؟
                </p>

                <div className="flex justify-center gap-3">
                    <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl dark:text-slate-300 dark:hover:bg-slate-700 transition-colors w-1/3">
                        خیر
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-6 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-transform active:scale-95 w-2/3"
                    >
                        بله، تایید نهایی
                    </button>
                </div>
            </div>
        </div>
    );
};

interface RejectModalProps extends BaseModalProps {
    initialNotes: string;
    onConfirm: (notes: string) => void;
}

export const CarOrderRejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, initialNotes, onConfirm }) => {
    const [notes, setNotes] = useState(initialNotes);

    useEffect(() => {
        if(isOpen) setNotes(initialNotes);
    }, [isOpen, initialNotes]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-slate-700">
                    <h3 className="font-bold text-lg text-rose-600 dark:text-rose-400">ثبت دلیل رد سفارش</h3>
                    <button onClick={onClose}><CloseIcon className="text-slate-500" /></button>
                </div>
                <div className="mb-4 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200 text-sm p-3 rounded-lg">
                    لطفاً علت رد سفارش را وارد کنید. این متن برای درخواست‌کننده نمایش داده می‌شود.
                </div>
                <textarea 
                    rows={4} 
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all mb-3 resize-none"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="علت رد سفارش..."
                    autoFocus
                ></textarea>
                <div className="flex flex-wrap gap-2 mb-6">
                    {PREDEFINED_ADMIN_NOTES.map(note => (
                        <button 
                            key={note} 
                            onClick={() => setNotes(note)}
                            className="text-[10px] border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {note}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">انصراف</button>
                    <button 
                        onClick={() => onConfirm(notes)} 
                        disabled={!notes.trim()}
                        className="px-6 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 shadow-md disabled:bg-rose-300 disabled:cursor-not-allowed"
                    >
                        ثبت و رد سفارش
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ExitModalProps extends BaseModalProps {
    order: CarOrder | null;
    onConfirm: () => void;
}

export const CarOrderExitModal: React.FC<ExitModalProps> = ({ isOpen, onClose, order, onConfirm }) => {
    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExitFormIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">صدور اجازه خروج</h3>
                <p className="text-sm text-slate-500 mb-6">آیا از صدور مجوز خروج برای خودروی <span className="font-bold text-slate-800">{order.carName}</span> اطمینان دارید؟</p>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-left text-sm space-y-2 mb-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between"><span className="text-slate-500">خریدار:</span><span className="font-bold">{order.buyerName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">کد رهگیری:</span><span className="font-mono">{order.trackingCode}</span></div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">انصراف</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 dark:shadow-none transition-transform active:scale-95">اجازه خروج</button>
                </div>
            </div>
        </div>
    );
};
