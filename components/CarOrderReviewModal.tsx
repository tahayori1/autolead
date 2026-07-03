
import React, { useMemo, useState, useEffect } from 'react';
import type { CarOrder, CarSaleCondition, CarPriceStats } from '../types';
import { SaleType } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';

interface CarOrderReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: CarOrder | null;
    conditions: CarSaleCondition[];
    priceStats: CarPriceStats[];
    onApproveClick: (data: { finalPrice: number; adminNotes: string; deliveryDeadline: string }) => void;
    onRejectClick: (data: { adminNotes: string }) => void;
}

const PREDEFINED_DELIVERY_TIMES = [
    '۶۰ روز کاری',
    '۳۰ روز کاری',
    'احتمال تحویل زودتر ۴۵ روز',
    'احتمال تحویل زودتر ۳۰ روز'
];

const PREDEFINED_ADMIN_NOTES = [
    'قیمت پایین است',
    'مشتری مورد تایید نمی باشد',
    'مبلغ بیعانه تناسب ندارد',
    'توقف موقت فروش',
    'لطفا با من تماس بگیرید'
];

const numberToPersianWords = (num: number): string => {
    if (num === 0) return 'صفر';
    if (!num) return '';
    // Simplified for brevity in this snippet, full implementation in original file
    return num.toLocaleString('fa-IR'); 
};

const CarOrderReviewModal: React.FC<CarOrderReviewModalProps> = ({ 
    isOpen, onClose, order, conditions, priceStats, onApproveClick, onRejectClick 
}) => {
    const [reviewData, setReviewData] = useState({
        finalPrice: 0,
        adminNotes: '',
        deliveryDeadline: ''
    });

    useEffect(() => {
        if (isOpen && order) {
            setReviewData({
                finalPrice: order.proposedPrice,
                adminNotes: '',
                deliveryDeadline: ''
            });
        }
    }, [isOpen, order]);

    const reviewPriceAnalysis = useMemo(() => {
        if (!order || !conditions.length || !priceStats.length) return null;

        const cond = conditions.find(c => c.id === order.conditionId);
        const stat = priceStats.find(s => s.model_name === order.carName);
        const maxMarketPrice = stat ? stat.maximum : 0;
        
        if (!cond) return null;

        const isHavaleh = cond.sale_type === SaleType.TRANSFER;
        const isZeroMarket = cond.sale_type === SaleType.NEW_MARKET;

        let info = null;

        if (isHavaleh && maxMarketPrice > 0) {
             const h1Min = maxMarketPrice * 0.95;
             const h1Max = maxMarketPrice * 0.97;
             const h1Avg = (h1Min + h1Max) / 2;

             const h2Min = maxMarketPrice * 0.90;
             const h2Max = maxMarketPrice * 0.94;
             const h2Avg = (h2Min + h2Max) / 2;

             const warnH1 = order.proposedPrice > 0 && order.proposedPrice < (h1Avg * 0.98);
             const warnH2 = order.proposedPrice > 0 && order.proposedPrice < (h2Avg * 0.98);

             info = {
                 type: 'HAVALEH',
                 h1Range: `${Math.round(h1Min).toLocaleString('fa-IR')} تا ${Math.round(h1Max).toLocaleString('fa-IR')}`,
                 h2Range: `${Math.round(h2Min).toLocaleString('fa-IR')} تا ${Math.round(h2Max).toLocaleString('fa-IR')}`,
                 warnH1,
                 warnH2
             };
        } else if (isZeroMarket && maxMarketPrice > 0) {
             const warningThreshold = maxMarketPrice * 0.98;
             const isUnderSelling = order.proposedPrice > 0 && order.proposedPrice < warningThreshold;
             info = {
                 type: 'ZERO_MARKET',
                 maxLabel: 'بالاترین قیمت روز (بازار)',
                 maxValue: maxMarketPrice.toLocaleString('fa-IR'),
                 isUnderSelling
             };
        }

        return { info };
    }, [order, conditions, priceStats]);

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-sky-100 dark:bg-sky-900 p-2 rounded-xl text-sky-600 dark:text-sky-400">
                            <ClipboardListIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">بررسی و تایید نهایی</h3>
                            <p className="text-xs text-slate-500 font-bold">کد رهگیری: {order.trackingCode || '---'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><CloseIcon /></button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* LEFT COLUMN: INFORMATION (Context) */}
                        <div className="space-y-6">
                            
                            {/* 1. Customer Info */}
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
                                <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">اطلاعات خریدار</h4>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-lg font-black text-slate-800 dark:text-white mb-1">{order.buyerName}</div>
                                        <div className="text-sm text-slate-500 font-mono font-bold" dir="ltr">{order.buyerPhone}</div>
                                    </div>
                                    <div className="text-right text-xs text-slate-400">
                                        <div>کد ملی: <span className="font-mono">{order.buyerNationalId}</span></div>
                                        <div className="mt-1">{order.buyerCity}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Order Details */}
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>
                                <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">مشخصات سفارش</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-slate-700 pb-2">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">خودرو:</span>
                                        <span className="text-sm font-black text-slate-800 dark:text-white">{order.carName} <span className="text-xs font-medium text-slate-400">({order.selectedColor})</span></span>
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        <span className="block text-xs text-slate-400 mb-1">شرایط:</span>
                                        {order.conditionSummary}
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl mt-2">
                                        <span className="text-xs font-bold text-slate-500">قیمت پیشنهادی کاربر:</span>
                                        <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">{order.proposedPrice?.toLocaleString('fa-IR')} <span className="text-xs">تومان</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Sales Notes */}
                            {order.userNotes && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-5">
                                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                                        <span className="text-lg">💬</span>
                                        توضیحات کارشناس فروش
                                    </h4>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                        "{order.userNotes}"
                                    </p>
                                </div>
                            )}
                            
                            {/* 4. Market Analysis */}
                            {reviewPriceAnalysis && reviewPriceAnalysis.info && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 border-b pb-2 dark:border-slate-700">
                                        📊 تحلیل هوشمند بازار
                                    </h4>
                                    
                                    {reviewPriceAnalysis.info.type === 'HAVALEH' && (
                                        <div className="space-y-2">
                                            <div className={`flex flex-col sm:flex-row justify-between items-center p-2 rounded ${reviewPriceAnalysis.info.warnH1 ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300' : ''}`}>
                                                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">حواله ۱ ماهه:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">{reviewPriceAnalysis.info.h1Range}</span>
                                                    {reviewPriceAnalysis.info.warnH1 && <span className="font-bold text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded">⚠️ زیر قیمت</span>}
                                                </div>
                                            </div>
                                            <div className={`flex flex-col sm:flex-row justify-between items-center p-2 rounded ${reviewPriceAnalysis.info.warnH2 ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300' : ''}`}>
                                                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">حواله ۲ ماهه:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">{reviewPriceAnalysis.info.h2Range}</span>
                                                    {reviewPriceAnalysis.info.warnH2 && <span className="font-bold text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded">⚠️ زیر قیمت</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {reviewPriceAnalysis.info.type === 'ZERO_MARKET' && (
                                        <div>
                                            <div className="flex justify-between mb-1 items-center">
                                                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">{reviewPriceAnalysis.info.maxLabel}:</span>
                                                <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">{reviewPriceAnalysis.info.maxValue}</span>
                                            </div>
                                            {reviewPriceAnalysis.info.isUnderSelling && (
                                                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded font-bold flex items-center justify-center gap-2 text-xs">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    هشدار: قیمت پیشنهادی پایین‌تر از عرف بازار است
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* RIGHT COLUMN: DECISION (Actions) */}
                        <div className="flex flex-col h-full">
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg flex-1">
                                <h4 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                                    تصمیم‌گیری مدیریت
                                </h4>

                                <div className="space-y-6">
                                    {/* Final Price Input */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">قیمت نهایی مصوب</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                className="w-full px-4 py-3 text-xl font-black font-mono border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:bg-slate-700 dark:text-white"
                                                value={reviewData.finalPrice || ''}
                                                onChange={e => setReviewData({...reviewData, finalPrice: Number(e.target.value)})}
                                                placeholder="مبلغ را وارد کنید"
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">تومان</div>
                                        </div>
                                        {reviewData.finalPrice > 0 && (
                                            <div className="mt-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                                                {reviewData.finalPrice.toLocaleString('fa-IR')} تومان
                                            </div>
                                        )}
                                    </div>

                                    {/* Delivery Time */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">زمان تحویل</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all mb-3"
                                            value={reviewData.deliveryDeadline}
                                            onChange={e => setReviewData({...reviewData, deliveryDeadline: e.target.value})}
                                            placeholder="مثلاً: ۳۰ روز کاری"
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {PREDEFINED_DELIVERY_TIMES.map(time => (
                                                <button 
                                                    key={time} 
                                                    onClick={() => setReviewData({...reviewData, deliveryDeadline: time})}
                                                    className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg transition-colors font-bold"
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Admin Notes */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">توضیحات (علت رد/تایید)</label>
                                        <textarea 
                                            rows={4} 
                                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all mb-3 resize-none"
                                            value={reviewData.adminNotes}
                                            onChange={e => setReviewData({...reviewData, adminNotes: e.target.value})}
                                            placeholder="توضیحات تکمیلی برای مشتری..."
                                        ></textarea>
                                        <div className="flex flex-wrap gap-2">
                                            {PREDEFINED_ADMIN_NOTES.map(note => (
                                                <button 
                                                    key={note} 
                                                    onClick={() => setReviewData({...reviewData, adminNotes: note})}
                                                    className="text-[10px] border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    {note}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button 
                        onClick={() => onRejectClick(reviewData)} 
                        className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-rose-100 text-rose-600 font-black rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm active:scale-95"
                    >
                        رد درخواست / ابطال
                    </button>
                    <div className="flex w-full sm:w-auto gap-3">
                        <button 
                            onClick={onClose} 
                            className="flex-1 sm:flex-none px-6 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                        >
                            انصراف
                        </button>
                        <button 
                            onClick={() => onApproveClick(reviewData)} 
                            className="flex-1 sm:flex-none px-8 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            تایید نهایی و اجازه فروش
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarOrderReviewModal;
