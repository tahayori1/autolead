
import React from 'react';
import type { CarOrder } from '../types';
import { OrderStatus } from '../types';
import { EditIcon } from './icons/EditIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';

interface CarOrderListProps {
    orders: CarOrder[];
    isAdmin: boolean;
    onEdit: (order: CarOrder) => void;
    onDelete: (id: number) => void;
    onReview: (order: CarOrder) => void;
    onPayment: (order: CarOrder) => void;
    onExit: (order: CarOrder) => void;
    onCancel: (order: CarOrder) => void;
    onAction: (order: CarOrder, nextStatus: OrderStatus) => void;
    loading: boolean;
}

const STATUS_CONFIG: Record<string, { label: string, color: string }> = {
    [OrderStatus.DRAFT]: { label: 'پیش‌نویس', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    [OrderStatus.PENDING_ADMIN]: { label: 'در انتظار تایید ادمین', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    [OrderStatus.REJECTED]: { label: 'رد شده / ابطال', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    [OrderStatus.PENDING_PAYMENT]: { label: 'منتظر پرداخت', color: 'bg-sky-100 text-sky-700 border-sky-200' },
    [OrderStatus.PENDING_FINANCE]: { label: 'تایید مالی', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    [OrderStatus.READY_FOR_DELIVERY]: { label: 'آماده تحویل', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    [OrderStatus.EXIT_PROCESS]: { label: 'در حال خروج', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    [OrderStatus.COMPLETED]: { label: 'تکمیل شده', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const DEFAULT_STATUS_CONFIG = { label: 'نامشخص', color: 'bg-slate-100 text-slate-500 border-slate-200' };

const CarOrderList: React.FC<CarOrderListProps> = ({ 
    orders, isAdmin, onEdit, onDelete, onReview, onPayment, onExit, onCancel, onAction, loading 
}) => {
    if (loading) {
        return null; // Spinner handled by parent
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                <ClipboardListIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">موردی یافت نشد.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            {[...orders].reverse().map(order => {
                const config = STATUS_CONFIG[order.status] || DEFAULT_STATUS_CONFIG;
                const statusColor = config.color;
                const sideBarColor = statusColor.split(' ')[0] || 'bg-slate-200';

                return (
                    <div key={order.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md animate-fade-in">
                        <div className={`w-full md:w-2 ${sideBarColor}`}></div>
                        
                        <div className="p-6 flex-1">
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{order.carName} <span className="text-sm text-slate-400 font-medium">({order.selectedColor})</span></h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusColor}`}>
                                            {config.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md line-clamp-1" title={order.conditionSummary}>{order.conditionSummary}</p>
                                </div>
                                <div className="text-left">
                                    {order.trackingCode && (
                                        <div className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-900/30 px-2 py-1 rounded-md mb-2 border border-sky-100 dark:border-sky-800">
                                            کد رهگیری: {order.trackingCode}
                                        </div>
                                    )}
                                    <div className="font-mono text-sm text-slate-400">{order.createdAt}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                                <div>
                                    <span className="block text-xs text-slate-400 mb-1">خریدار:</span>
                                    <span className="font-bold">{order.buyerName}</span>
                                    <span className="block text-[10px] text-slate-500 mt-0.5" dir="ltr">{order.buyerPhone}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 mb-1">قیمت پیشنهادی:</span>
                                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{(order.proposedPrice || 0).toLocaleString('fa-IR')}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 mb-1">قیمت نهایی:</span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{order.finalPrice ? order.finalPrice.toLocaleString('fa-IR') : '---'}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                
                                {/* Logic for returning stock on delete */}
                                {[OrderStatus.DRAFT, OrderStatus.PENDING_ADMIN, OrderStatus.REJECTED].includes(order.status) ? (
                                        <button onClick={() => onDelete(order.id)} className="px-4 py-2 rounded-lg text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors">حذف قطعی</button>
                                ) : (
                                        <button onClick={() => onCancel(order)} className="px-4 py-2 rounded-lg text-sm font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors">ابطال معامله و بازگشت به انبار</button>
                                )}

                                {order.status === OrderStatus.DRAFT && (
                                    <button onClick={() => onEdit(order)} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-700 flex items-center gap-2">
                                        <EditIcon className="w-4 h-4" /> ویرایش و ارسال
                                    </button>
                                )}

                                {order.status === OrderStatus.REJECTED && (
                                    <button onClick={() => onEdit(order)} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 flex items-center gap-2">
                                        <EditIcon className="w-4 h-4" /> اصلاح و ارسال مجدد
                                    </button>
                                )}

                                {isAdmin && order.status === OrderStatus.PENDING_ADMIN && (
                                    <button onClick={() => onReview(order)} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-700 shadow-md">بررسی و تایید نهایی</button>
                                )}
                                
                                {order.status === OrderStatus.PENDING_PAYMENT && (
                                    <button onClick={() => onPayment(order)} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600">ثبت فیش واریزی</button>
                                )}

                                {isAdmin && order.status === OrderStatus.PENDING_FINANCE && (
                                    <button onClick={() => onAction(order, OrderStatus.READY_FOR_DELIVERY)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700">تایید مالی نهایی</button>
                                )}

                                {order.status === OrderStatus.READY_FOR_DELIVERY && (
                                    <button onClick={() => onExit(order)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700">ارسال به واحد خروج</button>
                                )}

                                <div className="mr-auto text-[10px] text-slate-400 flex items-center self-center">
                                    ثبت: @{order.createdBy}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CarOrderList;
