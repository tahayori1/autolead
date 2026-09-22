import React from 'react';
import type { BankLetter, SavedBankAccount } from '../../types/bankLetter';
import { 
    validateIranianNationalCode, 
    validateIranianSheba, 
    formatCurrencyWithCommas, 
    numberToPersianWords, 
    toPersianDigits 
} from '../../services/bankLetterValidation';
import { CheckCircle2, AlertCircle, Sparkles, Building2, User, Landmark } from 'lucide-react';

interface BankLetterFillableTemplateProps {
    letter: BankLetter;
    savedAccounts: SavedBankAccount[];
    onChange: (updates: Partial<BankLetter>) => void;
    onSelectAccount: (account: SavedBankAccount) => void;
}

export const BankLetterFillableTemplate: React.FC<BankLetterFillableTemplateProps> = ({
    letter,
    savedAccounts,
    onChange,
    onSelectAccount
}) => {
    const nationalCodeVal = validateIranianNationalCode(letter.customerNationalCode);
    const shebaVal = validateIranianSheba(letter.shebaNumber);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const num = parseInt(raw, 10) || 0;
        onChange({
            amountRials: num,
            amountWords: num > 0 ? (numberToPersianWords(num) + ' ریال') : ''
        });
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-white text-base">
                            تکمیل جاهای خالی نامه بانک (فایل ورد)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            مقادیر فیلدها را وارد یا انتخاب نمایید تا نامه رسمی به‌صورت خودکار شکل گیرد.
                        </p>
                    </div>
                </div>

                {/* Quick Account Selector */}
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        انتخاب از حساب‌های آماده:
                    </label>
                    <select
                        onChange={(e) => {
                            const acc = savedAccounts.find(a => a.id === e.target.value);
                            if (acc) onSelectAccount(acc);
                        }}
                        className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-hidden focus:border-blue-500"
                        defaultValue=""
                    >
                        <option value="" disabled>-- انتخاب حساب / شماره شبا --</option>
                        {savedAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.accountType === 'COMPANY' ? '🏢 [شرکتی]' : '👤 [شخصی]'} {acc.accountHolderName} ({acc.bankName})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Quick Validation Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
                {/* National Code check */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    nationalCodeVal.isValid
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : letter.customerNationalCode.length > 0
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                        <User className="w-4 h-4" />
                        <span>کد ملی مشتری:</span>
                        <span>{nationalCodeVal.isValid ? 'معتبر (۱۰ رقمی تایید شد)' : (letter.customerNationalCode ? nationalCodeVal.errorMessage : 'وارد نشده')}</span>
                    </div>
                    {nationalCodeVal.isValid && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>

                {/* Sheba check */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    shebaVal.isValid
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : letter.shebaNumber.length > 0
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                        <Landmark className="w-4 h-4" />
                        <span>شماره شبا حساب واریزی:</span>
                        <span>{shebaVal.isValid ? `${shebaVal.bankInfo?.name} (تایید شد)` : (letter.shebaNumber ? shebaVal.errorMessage : 'وارد نشده')}</span>
                    </div>
                    {shebaVal.isValid && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
            </div>

            {/* Visual Interactive Text Template */}
            <div className="bg-slate-50/70 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-sm leading-[2.8]">
                {/* Bismillah */}
                <div className="text-center font-black text-slate-700 dark:text-slate-300 text-base">
                    بنام خدا
                </div>

                {/* Destination Bank Line */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        ریاست محترم بانک:
                    </span>
                    <input
                        type="text"
                        value={letter.destinationBankName}
                        onChange={(e) => onChange({ destinationBankName: e.target.value })}
                        placeholder="مثال: بانک ملی، بانک ملت، بانک رفاه..."
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1 text-sm font-bold text-slate-900 dark:text-white min-w-[200px] flex-1 focus:outline-hidden focus:border-blue-500"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        شعبه (اختیاری):
                    </span>
                    <input
                        type="text"
                        value={letter.destinationBranchName || ''}
                        onChange={(e) => onChange({ destinationBranchName: e.target.value })}
                        placeholder="مثال: شعبه مرکزی شیراز"
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1 text-sm text-slate-900 dark:text-white min-w-[160px] focus:outline-hidden focus:border-blue-500"
                    />
                </div>

                <div className="font-bold text-slate-800 dark:text-slate-200">
                    با سلام
                </div>

                {/* Main Body with Fillable Slots */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">احتراماً</span>
                        
                        {/* Customer Title */}
                        <select
                            value={letter.customerTitle}
                            onChange={(e) => onChange({ customerTitle: e.target.value })}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                        >
                            <option value="خانم">خانم</option>
                            <option value="آقای">آقای</option>
                            <option value="شرکت">شرکت</option>
                            <option value="جناب آقای">جناب آقای</option>
                            <option value="سرکار خانم">سرکار خانم</option>
                        </select>

                        {/* Customer Name */}
                        <input
                            type="text"
                            value={letter.customerName}
                            onChange={(e) => onChange({ customerName: e.target.value })}
                            placeholder="نام و نام خانوادگی مشتری (مثال: نوش آفرین گورنگی)"
                            className="bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-1 text-sm font-bold text-blue-900 dark:text-blue-200 min-w-[220px] flex-1 focus:outline-hidden focus:border-blue-500"
                        />

                        <span className="font-bold text-slate-800 dark:text-slate-200">به کدملی</span>

                        {/* Customer National Code + Validator badge */}
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                maxLength={10}
                                value={letter.customerNationalCode}
                                onChange={(e) => onChange({ customerNationalCode: e.target.value.replace(/\D/g, '') })}
                                placeholder="کد ملی ۱۰ رقمی (مثال: 2291545914)"
                                className={`bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-1 text-sm font-mono font-bold tracking-wider text-slate-900 dark:text-white w-40 focus:outline-hidden ${
                                    letter.customerNationalCode 
                                        ? (nationalCodeVal.isValid ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-rose-400 ring-2 ring-rose-500/20')
                                        : 'border-slate-300 dark:border-slate-700'
                                }`}
                            />
                            {letter.customerNationalCode && (
                                <span className="mr-2">
                                    {nationalCodeVal.isValid ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                            <CheckCircle2 className="w-3 h-3" />
                                            معتبر
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800">
                                            <AlertCircle className="w-3 h-3" />
                                            نامعتبر
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">جهت امور بانکی و واریز وجه به مبلغ</span>

                        {/* Amount in Rials */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                            <input
                                type="text"
                                value={letter.amountRials ? formatCurrencyWithCommas(letter.amountRials) : ''}
                                onChange={handleAmountChange}
                                placeholder="مبلغ به ریال (مثال: 25,000,000,000)"
                                className="bg-white dark:bg-slate-900 rounded-lg px-3 py-1 text-sm font-mono font-bold text-blue-900 dark:text-blue-300 min-w-[180px] focus:outline-hidden"
                            />
                            <span className="px-2 text-xs font-bold text-slate-500 dark:text-slate-400">ریال</span>
                        </div>

                        {/* Payment Method */}
                        <select
                            value={letter.paymentMethod}
                            onChange={(e) => onChange({ paymentMethod: e.target.value })}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                        >
                            <option value="بصورت حواله ساتنا">بصورت حواله ساتنا</option>
                            <option value="بصورت حواله پایا">بصورت حواله پایا</option>
                            <option value="بصورت واریز نقدی">بصورت واریز نقدی</option>
                            <option value="بصورت چک رمزدار بانکی">بصورت چک رمزدار بانکی</option>
                            <option value="بصورت حواله بین بانکی">بصورت حواله بین بانکی</option>
                        </select>
                    </div>

                    {/* Amount In Words Helper */}
                    {letter.amountRials > 0 && (
                        <div className="text-xs bg-blue-50/70 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-center justify-between gap-2">
                            <span>
                                <strong>مبلغ به حروف:</strong> {numberToPersianWords(letter.amountRials)} ریال
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-mono">
                                (معادل {numberToPersianWords(Math.floor(letter.amountRials / 10))} تومان)
                            </span>
                        </div>
                    )}

                    {/* Sheba & Beneficiary Account */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">به شماره شبا</span>

                        {/* Sheba Number Input */}
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                maxLength={26}
                                value={letter.shebaNumber}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9a-zA-Z]/g, '');
                                    const vRes = validateIranianSheba(val);
                                    onChange({ 
                                        shebaNumber: val,
                                        beneficiaryBankName: vRes.bankInfo?.name || letter.beneficiaryBankName
                                    });
                                }}
                                placeholder="شماره شبا ۲۴ رقمی (مثال: 590130100000000358157511)"
                                className={`bg-emerald-50/50 dark:bg-emerald-950/30 border rounded-xl px-3 py-1 text-sm font-mono font-bold tracking-wider text-emerald-900 dark:text-emerald-200 w-64 direction-ltr focus:outline-hidden ${
                                    letter.shebaNumber 
                                        ? (shebaVal.isValid ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-rose-400 ring-2 ring-rose-500/20')
                                        : 'border-slate-300 dark:border-slate-700'
                                }`}
                            />
                            {letter.shebaNumber && (
                                <span className="mr-2">
                                    {shebaVal.isValid ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {shebaVal.bankInfo?.name || 'معتبر'}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800">
                                            <AlertCircle className="w-3 h-3" />
                                            نامعتبر
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>

                        {/* Beneficiary Bank Name */}
                        <input
                            type="text"
                            value={letter.beneficiaryBankName}
                            onChange={(e) => onChange({ beneficiaryBankName: e.target.value })}
                            placeholder="نام بانک (مثال: بانک رفاه کارگران)"
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1 text-sm font-bold text-slate-900 dark:text-white min-w-[150px] focus:outline-hidden focus:border-blue-500"
                        />

                        <span className="font-bold text-slate-800 dark:text-slate-200">بنام</span>

                        {/* Account Holder Name */}
                        <input
                            type="text"
                            value={letter.accountHolderName}
                            onChange={(e) => onChange({ accountHolderName: e.target.value })}
                            placeholder="نام صاحب حساب (مثال: شرکت حسینی خودرو شیراز)"
                            className="bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-1 text-sm font-bold text-blue-900 dark:text-blue-200 min-w-[220px] flex-1 focus:outline-hidden focus:border-blue-500"
                        />
                    </div>

                    {/* Vehicle Details */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-800 dark:text-slate-200">جهت خرید یک دستگاه</span>

                        {/* Car Model */}
                        <input
                            type="text"
                            value={letter.carModel}
                            onChange={(e) => onChange({ carModel: e.target.value })}
                            placeholder="مدل خودرو (مثال: KMC eagle، BAC X3 pro، KMC J7، KMC T8...)"
                            className="bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1 text-sm font-bold text-amber-900 dark:text-amber-200 min-w-[170px] focus:outline-hidden focus:border-amber-500"
                        />

                        <span className="font-bold text-slate-800 dark:text-slate-200">مدل</span>

                        {/* Model Year */}
                        <input
                            type="text"
                            value={letter.carModelYear}
                            onChange={(e) => onChange({ carModelYear: e.target.value })}
                            placeholder="1405"
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1 text-sm font-bold text-slate-900 dark:text-white w-20 text-center focus:outline-hidden"
                        />

                        <span className="font-bold text-slate-800 dark:text-slate-200">به رنگ</span>

                        {/* Car Color */}
                        <input
                            type="text"
                            value={letter.carColor}
                            onChange={(e) => onChange({ carColor: e.target.value })}
                            placeholder="سفید / مشکی / خاکستری..."
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1 text-sm font-bold text-slate-900 dark:text-white w-32 text-center focus:outline-hidden"
                        />

                        <span className="font-bold text-slate-800 dark:text-slate-200">به خدمت حضورتان معرفی می گردند.</span>
                    </div>
                </div>

                <div className="font-medium text-slate-700 dark:text-slate-300">
                    خواهشمند است بذل لطف نموده همکاری های لازم با نامبرده را مبذول فرمایید.
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <span>با تشکر</span>
                    <input
                        type="text"
                        value={letter.dealershipName}
                        onChange={(e) => onChange({ dealershipName: e.target.value })}
                        placeholder="نمایندگی کرمان موتور ۲۶۰۶"
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[200px] text-left focus:outline-hidden"
                    />
                </div>
            </div>
        </div>
    );
};
