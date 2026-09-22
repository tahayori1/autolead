import React, { useState } from 'react';
import type { SavedBankAccount, BankAccountType } from '../../types/bankLetter';
import { validateIranianSheba, formatShebaBlocks } from '../../services/bankLetterValidation';
import { X, Plus, Trash2, CheckCircle2, AlertCircle, Building2, User, Star, ShieldCheck } from 'lucide-react';

interface SavedAccountsModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: SavedBankAccount[];
    onSaveAccount: (account: Omit<SavedBankAccount, 'id'> & { id?: string }) => void;
    onDeleteAccount: (id: string) => void;
}

export const SavedAccountsModal: React.FC<SavedAccountsModalProps> = ({
    isOpen,
    onClose,
    accounts,
    onSaveAccount,
    onDeleteAccount
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [accountHolderName, setAccountHolderName] = useState('');
    const [shebaNumber, setShebaNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [accountType, setAccountType] = useState<BankAccountType>('COMPANY');
    const [description, setDescription] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    if (!isOpen) return null;

    const shebaVal = validateIranianSheba(shebaNumber);

    const handleShebaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9a-zA-Z]/g, '');
        setShebaNumber(val);
        const res = validateIranianSheba(val);
        if (res.bankInfo) {
            setBankName(res.bankInfo.name);
        }
    };

    const handleStartNew = () => {
        setEditingId(null);
        setAccountHolderName('');
        setShebaNumber('');
        setBankName('');
        setBranchName('');
        setAccountType('COMPANY');
        setDescription('');
        setIsDefault(false);
        setFormError(null);
    };

    const handleStartEdit = (acc: SavedBankAccount) => {
        setEditingId(acc.id);
        setAccountHolderName(acc.accountHolderName);
        setShebaNumber(acc.shebaNumber);
        setBankName(acc.bankName);
        setBranchName(acc.branchName || '');
        setAccountType(acc.accountType);
        setDescription(acc.description || '');
        setIsDefault(Boolean(acc.isDefault));
        setFormError(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountHolderName.trim()) {
            setFormError('لطفاً نام صاحب حساب را وارد نمایید.');
            return;
        }
        if (!shebaNumber.trim() || !shebaVal.isValid) {
            setFormError('شماره شبا وارد شده معتبر نیست. لطفاً شماره ۲۴ رقمی را به درستی وارد کنید.');
            return;
        }

        onSaveAccount({
            id: editingId || undefined,
            accountHolderName: accountHolderName.trim(),
            shebaNumber: shebaVal.rawDigits,
            bankName: bankName.trim() || shebaVal.bankInfo?.name || 'بانک نامشخص',
            bankCode: shebaVal.bankInfo?.code || '000',
            accountType,
            branchName: branchName.trim(),
            description: description.trim(),
            isDefault
        });

        handleStartNew();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-vazir animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-white text-base">
                                مدیریت حساب‌ها و شماره‌های شبای بانکی
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                لیست شماره شباهای شرکتی حسینی خودرو و حساب‌های شخصی جهت استفاده در نامه‌های بانک
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Add / Edit Form */}
                    <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                <Plus className="w-4 h-4 text-blue-600" />
                                {editingId ? 'ویرایش اطلاعات حساب' : 'افزودن شماره شبا جدید به لیست'}
                            </h4>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleStartNew}
                                    className="text-xs text-blue-600 hover:underline cursor-pointer"
                                >
                                    انصراف از ویرایش
                                </button>
                            )}
                        </div>

                        {formError && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Account Type */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    نوع حساب *
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAccountType('COMPANY')}
                                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            accountType === 'COMPANY'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span>حساب شرکتی / حقوقی</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAccountType('INDIVIDUAL')}
                                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            accountType === 'INDIVIDUAL'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <User className="w-3.5 h-3.5" />
                                        <span>حساب شخصی / حقیقی</span>
                                    </button>
                                </div>
                            </div>

                            {/* Account Holder Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    نام صاحب حساب *
                                </label>
                                <input
                                    type="text"
                                    value={accountHolderName}
                                    onChange={(e) => setAccountHolderName(e.target.value)}
                                    placeholder="مثال: شرکت حسینی خودرو شیراز / امیر رضا محمدی پیراهی"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                                />
                            </div>

                            {/* Sheba Number */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    شماره شبا (۲۴ رقم) *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        maxLength={26}
                                        value={shebaNumber}
                                        onChange={handleShebaChange}
                                        placeholder="590130100000000358157511"
                                        className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs font-mono font-bold tracking-wider direction-ltr text-left text-slate-900 dark:text-white focus:outline-hidden ${
                                            shebaNumber 
                                                ? (shebaVal.isValid ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-rose-400 ring-2 ring-rose-500/20')
                                                : 'border-slate-300 dark:border-slate-700'
                                        }`}
                                    />
                                    {shebaNumber && (
                                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                                            {shebaVal.isValid ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    شماره شبا معتبر است • بانک شناسایی شده: {shebaVal.bankInfo?.name}
                                                </span>
                                            ) : (
                                                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {shebaVal.errorMessage || 'شماره شبا نامعتبر است.'}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bank Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    نام بانک
                                </label>
                                <input
                                    type="text"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    placeholder="مثال: بانک رفاه کارگران، بانک سینا، بانک ملت"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                                />
                            </div>

                            {/* Branch Name / Description */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    شعبه / توضیحات
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="مثال: حساب اصلی شرکتی، شماره شبای ۱"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isDefault}
                                    onChange={(e) => setIsDefault(e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    تنظیم به عنوان حساب پیش‌فرض برای نامه‌ها
                                </span>
                            </label>

                            <button
                                type="submit"
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                            >
                                {editingId ? 'بروزرسانی حساب' : 'ذخیره در لیست'}
                            </button>
                        </div>
                    </form>

                    {/* Accounts List */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-xs text-slate-500 dark:text-slate-400">
                            حساب‌های تعریف شده ({accounts.length} حساب):
                        </h4>

                        <div className="space-y-2">
                            {accounts.map(acc => {
                                const v = validateIranianSheba(acc.shebaNumber);
                                return (
                                    <div
                                        key={acc.id}
                                        className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 shadow-xs ${
                                                acc.accountType === 'COMPANY' ? 'bg-blue-600' : 'bg-purple-600'
                                            }`}>
                                                {acc.accountType === 'COMPANY' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-sm text-slate-900 dark:text-white">
                                                        {acc.accountHolderName}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        acc.accountType === 'COMPANY' 
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300' 
                                                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                                                    }`}>
                                                        {acc.accountType === 'COMPANY' ? 'حساب شرکت' : 'شخصی'}
                                                    </span>
                                                    {acc.isDefault && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 flex items-center gap-1">
                                                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                            پیش‌فرض
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono direction-ltr">
                                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                        IR{acc.shebaNumber}
                                                    </span>
                                                    <span className="text-slate-700 dark:text-slate-300 font-sans font-medium">
                                                        • {acc.bankName}
                                                    </span>
                                                    {acc.description && (
                                                        <span className="text-slate-400 font-sans">
                                                            ({acc.description})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleStartEdit(acc)}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                            >
                                                ویرایش
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`آیا از حذف حساب ${acc.accountHolderName} اطمینان دارید؟`)) {
                                                        onDeleteAccount(acc.id);
                                                    }
                                                }}
                                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                                                title="حذف حساب"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
};
