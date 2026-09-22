import React from 'react';
import type { CarPeaceContract } from '../../types/bankLetter';
import { 
    validateIranianNationalCode, 
    validateIranianSheba, 
    formatCurrencyWithCommas, 
    numberToPersianWords, 
    toPersianDigits 
} from '../../services/bankLetterValidation';
import { CheckCircle2, AlertCircle, Sparkles, Building2, User, FileSignature, Car, ShieldCheck } from 'lucide-react';

interface PeaceContractFillableTemplateProps {
    contract: CarPeaceContract;
    onChange: (updates: Partial<CarPeaceContract>) => void;
}

const COMMON_CARS = [
    'KMC eagle',
    'KMC J7',
    'KMC T8',
    'KMC T9',
    'KMC X5',
    'KMC A5',
    'BAC X3 pro',
    'JAC J4',
    'JAC S5',
    'JAC S3'
];

const COMMON_COLORS = ['سفید', 'مشکی', 'خاکستری طوسی', 'قهوه‌ای تیتانیوم', 'سربی', 'آبی متالیک', 'قرمز'];

export const PeaceContractFillableTemplate: React.FC<PeaceContractFillableTemplateProps> = ({
    contract,
    onChange
}) => {
    const nationalCodeVal = validateIranianNationalCode(contract.releaseeNationalCode);
    const shebaVal = validateIranianSheba(contract.releaseeShebaNumber);

    const handleTotalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const num = parseInt(raw, 10) || 0;
        onChange({
            totalAmountRials: num,
            paidAmountRials: contract.paidAmountRials > 0 ? contract.paidAmountRials : num
        });
    };

    const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const num = parseInt(raw, 10) || 0;
        onChange({ paidAmountRials: num });
    };

    const handleShebaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.toUpperCase().replace(/\s/g, '');
        const digitsOnly = val.replace(/\D/g, '');
        const result = validateIranianSheba(val);
        
        const updates: Partial<CarPeaceContract> = {
            releaseeShebaNumber: digitsOnly
        };

        if (result.bankInfo && !contract.releaseeBankName) {
            updates.releaseeBankName = result.bankInfo.name;
        }

        onChange(updates);
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <FileSignature className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 dark:text-white text-base">
                            تکمیل تعاملی قرارداد صلح خودرو
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            جاهای خالی قرارداد صلح را تکمیل نمایید؛ متن رسمی حقوقی و نسخه چاپی بی‌درنگ به‌روزرسانی می‌شود.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>مطابق ماده ۱۰ قانون مدنی و شرط داوری</span>
                </div>
            </div>

            {/* Visual Interactive Text Template */}
            <div className="bg-slate-50/70 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-sm leading-[2.8]">
                {/* Header Title */}
                <div className="text-center space-y-1">
                    <div className="font-bold text-slate-600 dark:text-slate-400 text-sm">بسمه تعالی</div>
                    <div className="font-black text-slate-900 dark:text-white text-lg underline decoration-amber-500 decoration-2 underline-offset-8">
                        قرارداد صلح خودرو
                    </div>
                </div>

                {/* Mosaleh (First Party) info block */}
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        <span>مشخصات مصالح (شرکت تضامنی حسینی خودرو شیراز):</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-medium">
                        <div><span className="font-bold">مصالح:</span> {contract.releasorName}</div>
                        <div><span className="font-bold">شناسه ملی:</span> {toPersianDigits(contract.releasorNationalId)}</div>
                        <div><span className="font-bold">آدرس:</span> {contract.releasorAddress}</div>
                        <div><span className="font-bold">کد پستی:</span> {toPersianDigits(contract.releasorPostalCode)} | <span className="font-bold">تلفن:</span> {toPersianDigits(contract.releasorPhone)}</div>
                    </div>
                </div>

                {/* Motasaleh (Second Party) Interactive inputs */}
                <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-blue-600" />
                        <span>مشخصات متصالح (خریدار / طرف دوم):</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">متصالح:</span>
                        <select
                            value={contract.releaseeTitle}
                            onChange={(e) => onChange({ releaseeTitle: e.target.value })}
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100"
                        >
                            <option value="آقای">آقای</option>
                            <option value="خانم">خانم</option>
                            <option value="شرکت">شرکت</option>
                        </select>
                        <input
                            type="text"
                            placeholder="نام و نام خانوادگی متصالح"
                            value={contract.releaseeName}
                            onChange={(e) => onChange({ releaseeName: e.target.value })}
                            className="flex-1 min-w-[170px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">فرزند:</span>
                        <input
                            type="text"
                            placeholder="نام پدر"
                            value={contract.releaseeFatherName}
                            onChange={(e) => onChange({ releaseeFatherName: e.target.value })}
                            className="w-28 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                        />

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">شماره شناسنامه:</span>
                        <input
                            type="text"
                            placeholder="ش.ش"
                            value={contract.releaseeIdNumber}
                            onChange={(e) => onChange({ releaseeIdNumber: e.target.value })}
                            className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                        />

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">صادره از:</span>
                        <input
                            type="text"
                            placeholder="شهر صدور"
                            value={contract.releaseeIssuePlace}
                            onChange={(e) => onChange({ releaseeIssuePlace: e.target.value })}
                            className="w-28 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">کد ملی:</span>
                        <div className="relative inline-flex items-center">
                            <input
                                type="text"
                                maxLength={10}
                                placeholder="کد ملی ۱۰ رقمی"
                                value={contract.releaseeNationalCode}
                                onChange={(e) => onChange({ releaseeNationalCode: e.target.value.replace(/\D/g, '') })}
                                className={`w-36 bg-white dark:bg-slate-900 border rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden ${
                                    nationalCodeVal.isValid
                                        ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                                        : contract.releaseeNationalCode.length > 0
                                        ? 'border-amber-400 focus:ring-1 focus:ring-amber-400'
                                        : 'border-slate-300 dark:border-slate-700 focus:border-amber-500'
                                }`}
                            />
                            {nationalCodeVal.isValid && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute left-2.5 pointer-events-none" />
                            )}
                        </div>

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">تلفن:</span>
                        <input
                            type="text"
                            placeholder="0917..."
                            value={contract.releaseePhone}
                            onChange={(e) => onChange({ releaseePhone: e.target.value })}
                            className="w-36 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                        />

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">کد پستی:</span>
                        <input
                            type="text"
                            maxLength={10}
                            placeholder="کد پستی ۱۰ رقمی"
                            value={contract.releaseePostalCode}
                            onChange={(e) => onChange({ releaseePostalCode: e.target.value.replace(/\D/g, '') })}
                            className="w-36 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">آدرس کامل:</span>
                        <input
                            type="text"
                            placeholder="شیراز، خیابان..."
                            value={contract.releaseeAddress}
                            onChange={(e) => onChange({ releaseeAddress: e.target.value })}
                            className="flex-1 min-w-[260px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                        />
                    </div>
                </div>

                {/* Vehicle Details */}
                <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-emerald-600" />
                        <span>مورد صلح (مشخصات خودرو):</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">یک دستگاه خودروی:</span>
                        <div className="relative inline-flex items-center">
                            <input
                                list="peaceCarModels"
                                type="text"
                                placeholder="مثلاً KMC eagle یا BAC X3"
                                value={contract.carModel}
                                onChange={(e) => onChange({ carModel: e.target.value })}
                                className="w-44 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                            />
                            <datalist id="peaceCarModels">
                                {COMMON_CARS.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">به شماره شاسی:</span>
                        <input
                            type="text"
                            placeholder="شماره شاسی خودرو"
                            value={contract.chassisNumber}
                            onChange={(e) => onChange({ chassisNumber: e.target.value.toUpperCase() })}
                            className="w-48 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 uppercase"
                        />

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">به شماره پلاک انتظامی:</span>
                        <input
                            type="text"
                            placeholder="مثلاً ۱۲ ل ۳۴۵ ایران ۶۳ یا پلاک صفر"
                            value={contract.plateNumber}
                            onChange={(e) => onChange({ plateNumber: e.target.value })}
                            className="w-48 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">مدل:</span>
                        <input
                            type="text"
                            placeholder="1405"
                            value={contract.modelYear}
                            onChange={(e) => onChange({ modelYear: e.target.value })}
                            className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                        />

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">رنگ:</span>
                        <div className="relative inline-flex items-center">
                            <input
                                list="peaceCarColors"
                                type="text"
                                placeholder="سفید"
                                value={contract.color}
                                onChange={(e) => onChange({ color: e.target.value })}
                                className="w-28 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                            />
                            <datalist id="peaceCarColors">
                                {COMMON_COLORS.map(col => <option key={col} value={col} />)}
                            </datalist>
                        </div>

                        <span className="text-xs text-slate-600 dark:text-slate-400">
                            به همراه کلیه متعلقات طبق چک لیست تحویل خودرو که پیوست این قرارداد و جزء لاینفک آن است.
                        </span>
                    </div>
                </div>

                {/* Financial Details */}
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                        مبالغ و تراکنش پرداخت:
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">مبلغ مورد صلح:</span>
                        <input
                            type="text"
                            placeholder="مبلغ کل به ریال"
                            value={contract.totalAmountRials > 0 ? formatCurrencyWithCommas(contract.totalAmountRials) : ''}
                            onChange={handleTotalAmountChange}
                            className="w-44 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                        />
                        <span className="font-bold text-slate-700 dark:text-slate-300">ریال</span>

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">که مبلغ:</span>
                        <input
                            type="text"
                            placeholder="مبلغ واریز شده"
                            value={contract.paidAmountRials > 0 ? formatCurrencyWithCommas(contract.paidAmountRials) : ''}
                            onChange={handlePaidAmountChange}
                            className="w-44 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                        />
                        <span className="font-bold text-slate-700 dark:text-slate-300">ریال</span>

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">به شماره پیگیری:</span>
                        <input
                            type="text"
                            placeholder="کد پیگیری تراکنش"
                            value={contract.trackingNumber}
                            onChange={(e) => onChange({ trackingNumber: e.target.value })}
                            className="w-36 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                        />
                        <span className="text-slate-700 dark:text-slate-300">واریز گردید.</span>
                    </div>

                    {contract.totalAmountRials > 0 && (
                        <div className="text-xs bg-amber-50/50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 font-bold">
                            معادل به حروف: {numberToPersianWords(contract.totalAmountRials)} ریال
                        </div>
                    )}
                </div>

                {/* Section 5: Motasaleh Bank Account Info */}
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>۵- اطلاعات حساب بانکی متصالح (جهت انجام کلیه تراکنش‌ها):</span>
                        {shebaVal.bankInfo && (
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                بانک تشخیص داده شده: {shebaVal.bankInfo.name}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">شماره حساب:</span>
                        <input
                            type="text"
                            placeholder="شماره حساب"
                            value={contract.releaseeAccountNumber}
                            onChange={(e) => onChange({ releaseeAccountNumber: e.target.value })}
                            className="w-36 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                        />

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">شماره شبا:</span>
                        <div className="relative inline-flex items-center">
                            <span className="absolute right-2.5 text-xs font-mono font-bold text-slate-400">IR</span>
                            <input
                                type="text"
                                maxLength={26}
                                placeholder="۲۴ رقم شبا بدون IR"
                                value={contract.releaseeShebaNumber}
                                onChange={handleShebaChange}
                                dir="ltr"
                                className={`w-56 bg-white dark:bg-slate-900 border rounded-xl pr-8 pl-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden ${
                                    shebaVal.isValid
                                        ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                                        : contract.releaseeShebaNumber.length > 0
                                        ? 'border-amber-400 focus:ring-1 focus:ring-amber-400'
                                        : 'border-slate-300 dark:border-slate-700 focus:border-amber-500'
                                }`}
                            />
                        </div>

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">بانک:</span>
                        <input
                            type="text"
                            placeholder="نام بانک متصالح"
                            value={contract.releaseeBankName}
                            onChange={(e) => onChange({ releaseeBankName: e.target.value })}
                            className="w-32 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                            می‌باشد که پرداخت کلیه ثمن معامله صرفاً از طریق حساب مذکور انجام خواهد شد.
                        </span>
                    </div>
                </div>

                {/* Section 8 & Time/Date */}
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                        زمان قطعی شدن معامله و تاریخ صلحنامه:
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">تاریخ معامله و عقد صلحنامه:</span>
                        <input
                            type="text"
                            placeholder="مثلاً 1405/06/22"
                            value={contract.contractDate}
                            onChange={(e) => onChange({ contractDate: e.target.value })}
                            className="w-32 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                        />

                        <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">ساعت انجام معامله:</span>
                        <input
                            type="text"
                            placeholder="11:30"
                            value={contract.transactionTime}
                            onChange={(e) => onChange({ transactionTime: e.target.value })}
                            className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
