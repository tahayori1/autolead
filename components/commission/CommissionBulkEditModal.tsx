import React, { useState } from 'react';
import { CommissionDeal, CommissionCategory, CommissionPaymentStatus } from '../../types';
import { 
    X, 
    Check, 
    Edit, 
    Trash2, 
    Layers, 
    DollarSign, 
    User, 
    Calendar, 
    FileText, 
    Calculator,
    CheckCircle2,
    Clock,
    AlertCircle,
    Info
} from 'lucide-react';

interface CommissionBulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDeals: CommissionDeal[];
    onBulkUpdate: (updatedDeals: CommissionDeal[]) => void;
    onBulkDelete: (dealIds: string[]) => void;
    availableSalesPersons?: string[];
}

export const CommissionBulkEditModal: React.FC<CommissionBulkEditModalProps> = ({
    isOpen,
    onClose,
    selectedDeals,
    onBulkUpdate,
    onBulkDelete,
    availableSalesPersons = []
}) => {
    // Mode
    const [activeAction, setActiveAction] = useState<'edit' | 'delete'>('edit');

    // Bulk Edit Fields State
    const [changePaymentStatus, setChangePaymentStatus] = useState(false);
    const [targetPaymentStatus, setTargetPaymentStatus] = useState<CommissionPaymentStatus>('PAID');

    const [changeSalesPerson, setChangeSalesPerson] = useState(false);
    const [targetSalesPerson, setTargetSalesPerson] = useState('');

    const [changeCategory, setChangeCategory] = useState(false);
    const [targetCategory, setTargetCategory] = useState<CommissionCategory>('ANBAR');

    const [commissionActionType, setCommissionActionType] = useState<'none' | 'fixed' | 'percent_of_sale' | 'add_bonus' | 'recalc'>('none');
    const [commissionValue, setCommissionValue] = useState<number>(0);

    const [changeNotes, setChangeNotes] = useState(false);
    const [notesAction, setNotesAction] = useState<'append' | 'replace'>('append');
    const [targetNotes, setTargetNotes] = useState('');

    if (!isOpen || selectedDeals.length === 0) return null;

    const count = selectedDeals.length;

    const handleApplyBulkEdit = (e: React.FormEvent) => {
        e.preventDefault();

        const updated = selectedDeals.map(deal => {
            let d = { ...deal };

            // 1. Payment status
            if (changePaymentStatus) {
                d.paymentStatus = targetPaymentStatus;
                if (targetPaymentStatus === 'PAID') {
                    d.paidAt = new Date().toISOString();
                }
            }

            // 2. Sales person
            if (changeSalesPerson && targetSalesPerson.trim()) {
                d.salesPerson = targetSalesPerson.trim();
            }

            // 3. Category
            if (changeCategory) {
                d.category = targetCategory;
            }

            // 4. Commission action
            if (commissionActionType === 'fixed' && commissionValue > 0) {
                d.commissionAmount = commissionValue;
                d.isManualCommission = true;
                d.manualCommissionReason = `تنظیم گروهی مبلغ ثابت: ${commissionValue.toLocaleString('fa-IR')} ریال`;
            } else if (commissionActionType === 'percent_of_sale' && commissionValue > 0) {
                d.commissionAmount = Math.round((d.salePrice || 0) * (commissionValue / 100));
                d.isManualCommission = true;
                d.manualCommissionReason = `تنظیم گروهی ${commissionValue}٪ از نرخ فروش`;
            } else if (commissionActionType === 'add_bonus' && commissionValue !== 0) {
                d.commissionAmount = Math.max(0, (d.commissionAmount || 0) + commissionValue);
                d.isManualCommission = true;
                d.manualCommissionReason = `تغییر گروهی پاداش/کسورات (${commissionValue > 0 ? '+' : ''}${commissionValue.toLocaleString('fa-IR')} ریال)`;
            } else if (commissionActionType === 'recalc') {
                d.isManualCommission = false;
                d.manualCommissionReason = undefined;
            }

            // 5. Notes
            if (changeNotes && targetNotes.trim()) {
                if (notesAction === 'replace') {
                    d.paymentNotes = targetNotes.trim();
                } else {
                    d.paymentNotes = d.paymentNotes ? `${d.paymentNotes} | ${targetNotes.trim()}` : targetNotes.trim();
                }
            }

            d.updatedAt = new Date().toISOString();
            return d;
        });

        onBulkUpdate(updated);
        onClose();
    };

    const handleConfirmBulkDelete = () => {
        const ids = selectedDeals.map(d => d.id);
        onBulkDelete(ids);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                عملیات گروهی روی معاملات
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono">
                                    {count.toLocaleString('fa-IR')} ردیف انتخاب شده
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                اعمال تغییرات همزمان در پورسانت‌ها، وضعیت واریز، پرسنل یا حذف یکجای معاملات
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-2 bg-slate-50/50 dark:bg-slate-800/30">
                    <button
                        type="button"
                        onClick={() => setActiveAction('edit')}
                        className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                            activeAction === 'edit'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <Edit className="w-3.5 h-3.5" />
                        ویرایش گروهی اطلاعات و پورسانت
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveAction('delete')}
                        className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                            activeAction === 'delete'
                                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                                : 'border-transparent text-slate-500 hover:text-rose-600'
                        }`}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف گروهی ({count.toLocaleString('fa-IR')} معامله)
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 overflow-y-auto flex-1 space-y-4">
                    {activeAction === 'delete' ? (
                        <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-3xl space-y-4 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center mx-auto">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-rose-900 dark:text-rose-200">
                                    تایید حذف گروهی {count.toLocaleString('fa-IR')} معامله انتخابی
                                </h3>
                                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 max-w-md mx-auto">
                                    آیا مطمئن هستید که می‌خواهید این معاملات را به صورت دائمی حذف کنید؟ این عملیات روی تمام شیت‌ها اعمال خواهد شد.
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmBulkDelete}
                                    className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    تایید و حذف {count.toLocaleString('fa-IR')} معامله
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form id="bulkEditForm" onSubmit={handleApplyBulkEdit} className="space-y-4">
                            
                            {/* 1. Payment Status */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={changePaymentStatus}
                                        onChange={e => setChangePaymentStatus(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                    />
                                    <span className="text-xs font-black text-slate-800 dark:text-white">
                                        تغییر وضعیت واریز پورسانت‌ها
                                    </span>
                                </label>

                                {changePaymentStatus && (
                                    <div className="grid grid-cols-3 gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setTargetPaymentStatus('PAID')}
                                            className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                                                targetPaymentStatus === 'PAID'
                                                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            واریز شد
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTargetPaymentStatus('PARTIAL')}
                                            className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                                                targetPaymentStatus === 'PARTIAL'
                                                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <Clock className="w-3.5 h-3.5" />
                                            علی‌الحساب
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTargetPaymentStatus('PENDING')}
                                            className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                                                targetPaymentStatus === 'PENDING'
                                                    ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            در انتظار
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 2. Commission Adjustment */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                                <label className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-emerald-500" />
                                    تنظیم و تعدیل مبلغ پورسانت
                                </label>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCommissionActionType('none')}
                                        className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                                            commissionActionType === 'none'
                                                ? 'bg-indigo-600 text-white border-indigo-700'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        بدون تغییر
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCommissionActionType('fixed')}
                                        className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                                            commissionActionType === 'fixed'
                                                ? 'bg-indigo-600 text-white border-indigo-700'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        تنظیم مبلغ ثابت
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCommissionActionType('percent_of_sale')}
                                        className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                                            commissionActionType === 'percent_of_sale'
                                                ? 'bg-indigo-600 text-white border-indigo-700'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        درصد از نرخ فروش
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCommissionActionType('recalc')}
                                        className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                                            commissionActionType === 'recalc'
                                                ? 'bg-indigo-600 text-white border-indigo-700'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        بازنشانی به فرمول
                                    </button>
                                </div>

                                {commissionActionType === 'fixed' && (
                                    <div className="space-y-1.5 pt-1">
                                        <label className="text-[11px] text-slate-500 font-bold block">
                                            مبلغ پورسانت برای تمام {count} معامله انتخاب شده (ریال):
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="100000"
                                                min="0"
                                                value={commissionValue}
                                                onChange={e => setCommissionValue(parseFloat(e.target.value) || 0)}
                                                className="w-full pl-14 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none"
                                                placeholder="مثال: ۵۰۰۰۰۰۰"
                                            />
                                            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">ریال</span>
                                        </div>
                                        <span className="text-[10px] text-emerald-600 font-mono block">
                                            معادل: {Math.round(commissionValue / 10).toLocaleString('fa-IR')} تومان
                                        </span>
                                    </div>
                                )}

                                {commissionActionType === 'percent_of_sale' && (
                                    <div className="space-y-1.5 pt-1">
                                        <label className="text-[11px] text-slate-500 font-bold block">
                                            درصد پورسانت از نرخ فروش:
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={commissionValue}
                                                onChange={e => setCommissionValue(parseFloat(e.target.value) || 0)}
                                                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none"
                                                placeholder="مثال: ۰.۰۵"
                                            />
                                            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">٪</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3. Sales Person */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={changeSalesPerson}
                                        onChange={e => setChangeSalesPerson(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                    />
                                    <span className="text-xs font-black text-slate-800 dark:text-white">
                                        تغییر نام پرسنل فروش / مشاور
                                    </span>
                                </label>

                                {changeSalesPerson && (
                                    <div className="space-y-2 pt-1">
                                        <input
                                            type="text"
                                            list="salesPersonsList"
                                            value={targetSalesPerson}
                                            onChange={e => setTargetSalesPerson(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                            placeholder="نام مشاور یا تیم فروش جدید..."
                                        />
                                        <datalist id="salesPersonsList">
                                            {availableSalesPersons.map(p => (
                                                <option key={p} value={p} />
                                            ))}
                                        </datalist>
                                    </div>
                                )}
                            </div>

                            {/* 4. Payment Notes */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={changeNotes}
                                        onChange={e => setChangeNotes(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                    />
                                    <span className="text-xs font-black text-slate-800 dark:text-white">
                                        افزودن یا جایگزینی یادداشت واریز
                                    </span>
                                </label>

                                {changeNotes && (
                                    <div className="space-y-2 pt-1">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setNotesAction('append')}
                                                className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                                                    notesAction === 'append'
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}
                                            >
                                                الحاق به انتهای توضیحات فعلی
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNotesAction('replace')}
                                                className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                                                    notesAction === 'replace'
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}
                                            >
                                                جایگزینی کل متن یادداشت
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={targetNotes}
                                            onChange={e => setTargetNotes(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                                            placeholder="متن یادداشت واریز یا شماره سند..."
                                        />
                                    </div>
                                )}
                            </div>

                        </form>
                    )}
                </div>

                {/* Footer */}
                {activeAction === 'edit' && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                            روی {count.toLocaleString('fa-IR')} معامله اعمال خواهد شد.
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
                            >
                                انصراف
                            </button>
                            <button
                                type="submit"
                                form="bulkEditForm"
                                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                            >
                                <Check className="w-4 h-4" />
                                اعمال تغییرات گروهی
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
export default CommissionBulkEditModal;
