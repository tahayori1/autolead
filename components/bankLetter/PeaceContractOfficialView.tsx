import React, { useRef } from 'react';
import type { CarPeaceContract } from '../../types/bankLetter';
import { 
    formatCurrencyWithCommas, 
    numberToPersianWords, 
    toPersianDigits 
} from '../../services/bankLetterValidation';
import { Printer, Copy, Check, ShieldCheck, Building2, Car, Scale, FileText } from 'lucide-react';

interface PeaceContractOfficialViewProps {
    contract: CarPeaceContract;
    onCopyText: () => void;
    isCopied: boolean;
}

export const PeaceContractOfficialView: React.FC<PeaceContractOfficialViewProps> = ({
    contract,
    onCopyText,
    isCopied
}) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const totalAmountWords = contract.totalAmountRials > 0 ? numberToPersianWords(contract.totalAmountRials) : '';
    const totalAmountFormatted = contract.totalAmountRials > 0 ? formatCurrencyWithCommas(contract.totalAmountRials) : '........................';
    const paidAmountFormatted = contract.paidAmountRials > 0 ? formatCurrencyWithCommas(contract.paidAmountRials) : (contract.totalAmountRials > 0 ? formatCurrencyWithCommas(contract.totalAmountRials) : '........................');

    return (
        <div className="space-y-4">
            {/* Action Bar (Hidden on Print) */}
            <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                        پیش‌نمایش رسمی قرارداد صلح خودرو (تنظیم شده بر اساس ماده ۱۰ قانون مدنی)
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={onCopyText}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-md'
                        }`}
                        title="کپی متن کامل قرارداد صلح خودرو"
                    >
                        {isCopied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                        <span>{isCopied ? 'متن صلحنامه کپی شد!' : 'کپی متن قرارداد صلح'}</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="چاپ یا ذخیره به صورت PDF"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span>چاپ رسمی (A4) / PDF</span>
                    </button>
                </div>
            </div>

            {/* Official Legal A4 Sheet */}
            <div 
                ref={printRef}
                className="bank-letter-print-container bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800 max-w-[850px] mx-auto min-h-[1050px] flex flex-col justify-between relative overflow-hidden"
                style={{ direction: 'rtl', fontFamily: 'inherit' }}
            >
                {/* Background Seal Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none select-none">
                    <Scale className="w-[450px] h-[450px] text-slate-900" />
                </div>

                {/* Top Header */}
                <div className="border-b-2 border-slate-800 pb-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-600 block">
                                شرکت تضامنی حسینی خودرو شیراز
                            </span>
                            <span className="text-[10px] text-slate-500">
                                نمایندگی رسمی کرمان موتور - کد ۲۶۰۶
                            </span>
                        </div>

                        <div className="text-center">
                            <div className="font-bold text-slate-800 text-sm mb-1">بسمه تعالی</div>
                            <h1 className="text-xl font-black text-slate-900 tracking-wide border-b-2 border-amber-600 pb-0.5 inline-block">
                                قرارداد صلح خودرو
                            </h1>
                        </div>

                        <div className="text-left text-[11px] space-y-1 font-mono text-slate-700">
                            <div>
                                <span className="font-sans font-bold text-slate-500 ml-1">شماره:</span>
                                <span>{toPersianDigits(contract.contractNumber || '1405/PC-1001')}</span>
                            </div>
                            <div>
                                <span className="font-sans font-bold text-slate-500 ml-1">تاریخ:</span>
                                <span>{toPersianDigits(contract.contractDate || '1405/06/22')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contract Body */}
                <div className="space-y-3.5 text-xs sm:text-[13px] leading-[2.3] text-slate-900 text-justify">
                    {/* Mosaleh (First Party) */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <p>
                            <span className="font-black">مصالح: </span>
                            {contract.releasorName || 'شرکت تضامنی حسینی خودرو شیراز به نمایندگی خانم حسینی'}
                            <span className="mx-2 font-bold">|</span>
                            <span className="font-bold">شناسه ملی: </span>
                            {toPersianDigits(contract.releasorNationalId || '14012274787')}
                            <span className="mx-2 font-bold">|</span>
                            <span className="font-bold">آدرس: </span>
                            {contract.releasorAddress || 'شیراز، چهارراه بنفشه، روبروی کوچه 18 استقلال'}
                            <span className="mx-2 font-bold">|</span>
                            <span className="font-bold">کد پستی: </span>
                            {toPersianDigits(contract.releasorPostalCode || '7173714734')}
                            <span className="mx-2 font-bold">|</span>
                            <span className="font-bold">تلفن: </span>
                            {toPersianDigits(contract.releasorPhone || '09370518538')}
                        </p>
                    </div>

                    {/* Motasaleh (Second Party) */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <p>
                            <span className="font-black">متصالح: </span>
                            <span className="font-bold text-blue-900">{contract.releaseeTitle || 'آقای/خانم'} {contract.releaseeName || '................................'}</span>
                            <span className="font-bold mr-3">فرزند: </span>
                            <span className="font-semibold">{contract.releaseeFatherName || '..........'}</span>
                            <span className="font-bold mr-3">به شماره شناسنامه: </span>
                            <span className="font-semibold">{toPersianDigits(contract.releaseeIdNumber) || '..........'}</span>
                            <span className="font-bold mr-3">صادره از: </span>
                            <span className="font-semibold">{contract.releaseeIssuePlace || '..........'}</span>
                            <span className="font-bold mr-3">کد ملی: </span>
                            <span className="font-bold text-blue-900 font-mono">{toPersianDigits(contract.releaseeNationalCode) || '..........'}</span>
                        </p>
                        <p className="mt-1">
                            <span className="font-bold">آدرس: </span>
                            <span>{contract.releaseeAddress || '....................................................................................................'}</span>
                            <span className="font-bold mr-3">کد پستی: </span>
                            <span className="font-mono">{toPersianDigits(contract.releaseePostalCode) || '..........'}</span>
                            <span className="font-bold mr-3">تلفن: </span>
                            <span className="font-mono">{toPersianDigits(contract.releaseePhone) || '..........'}</span>
                        </p>
                    </div>

                    {/* Subject of Peace (Vehicle) */}
                    <div>
                        <p>
                            <span className="font-black">مورد صلح : </span>
                            یک دستگاه خودروی <span className="font-bold text-blue-900">{contract.carModel || '....................'}</span> به شماره شاسی <span className="font-mono font-bold">{contract.chassisNumber || '................................'}</span> به شماره پلاک انتظامی <span className="font-bold">{contract.plateNumber || '....................'}</span> مدل <span className="font-bold">{toPersianDigits(contract.modelYear) || '....'}</span> رنگ: <span className="font-bold">{contract.color || '..........'}</span> به همراه کلیه متعلقات طبق چک لیست تحویل خودرو که پیوست این قرارداد و جزء لاینفک آن است.
                        </p>
                    </div>

                    {/* Amount & Payments */}
                    <div>
                        <p>
                            <span className="font-black">مبلغ مورد صلح: </span>
                            <span className="font-bold">{toPersianDigits(totalAmountFormatted)} ریال</span> {totalAmountWords && <span className="font-semibold">({totalAmountWords} ریال)</span>} که مبلغ <span className="font-bold">{toPersianDigits(paidAmountFormatted)} ریال</span> به شماره پیگیری <span className="font-mono font-bold">{toPersianDigits(contract.trackingNumber) || '....................'}</span> واریز گردید.
                        </p>
                    </div>

                    {/* Explanation */}
                    <p>
                        <span className="font-black">توضیحات: </span>
                        کلیه مخارج انتقال سند و عوارض شهرداری و مالیات نقل و انتقال به عهده متصالح میباشد که طبق تعرفه دفترخانه اسناد رسمی باید پرداخت نماید. سند خودرو فوق پس از به نام خوردن به نام مصالح، در دفتر خانه اسناد رسمی به صورت وکالت تعویض پلاک به نام متصالح انتقال می یابد.متصالح نیز متعهد می گردد به محض دریافت وکالت و سند نسبت به تعویض پلاک ظرف مدت وکالت اقدام و پلاک مصالح را فک نماید در غیر این صورت روزانه مبلغ 500 هزارتومان خسارت باید به مصالح پرداخت نماید.این معامله در تاریخ <span className="font-bold">{toPersianDigits(contract.contractDate) || '....................'}</span> وساعت <span className="font-bold">{toPersianDigits(contract.transactionTime) || '....:....'}</span> بصورت قطعی انجام شد حق فسخ وجود ندارد.ارتکاب هرگونه خلافی از تاریخ تحویل خودرو به عهده متصالح می باشد.
                    </p>

                    {/* Conditions */}
                    <div className="space-y-1.5 pt-1">
                        <div className="font-black text-slate-900">شروط و توضیحات :</div>
                        <p>
                            <span className="font-bold">۱- </span>
                            کلیه هزینه های قراردادی،مالیات ها،عوارض،بیمه شخص ثالث، مالیات ارزش افزوده و سایر هزینه هایی که قانون یا قرارداد پرداخت آن را به عهده متصالح و مصرف کننده گذاشته است،به عهده متصالح می باشد.بدیهی است نرخ های موارد فوق بر اساس قوانین و توافقات فعلی محاسبه شده است.
                        </p>
                        <p>
                            <span className="font-bold">۲- </span>
                            متصالح در کمال صحت عقل و اختیار و به موجب مفاد این صلح نامه کافه خیارات خصوصا خیار غبن ولو فاحش به اعلي مرتبه ونیز هرگونه ادعایی نسبت به خودروی موضوع صلح را از جمله گرانفروشی و غیره و حق هرگونه دعوی و یا شکایت و اعتراض در هر یک از مراجع اداری ، انتظامی و قضایی از خود سلب و ساقط نمود.
                        </p>
                        <p>
                            <span className="font-bold">۳- </span>
                            مرجع رسیدگی به هرگونه شکایت یا دعوی در خصوص این قرارداد شهرستان شیراز می باشد.
                        </p>
                        <p>
                            <span className="font-bold">۴- </span>
                            در صورت بروز هرگونه اختلاف در تفسیر و یا تعبیر یا اجرای این قرارداد(صلحنامه) اعم از اجرای تعهدات،انحلال قرارداد(اقاله،فسخ،انفساخ،بطلان و ابطال و اتمام مدت)،آثار و تبعات و الزامات بعد از انحلال قرارداد، خسارات،تفسیر و غیره بدوا از طریق مذاکره حداکثر ظرف مدت 15 روز حل و فصل خواهد شد و در صورت عدم حصول نتیجه موضوع از طریق داور مرضی الطرفین <span className="font-bold">آقای محمد شکرشکن</span> به شماره ملی <span className="font-mono font-bold">2298920087</span> با شناسه داوری <span className="font-mono font-bold">98188</span> و عضو کانون داوران استان فارس رسیدگی و حل و فصل می گردد.مدت داوری سه ماه و با تشخیص داور مدت سه ماه دیگر نیز قابل افزایش است و رای داور برای طرفین و قائم مقام قانونی آنان لازم الاتباع است و شرط داوری مستقل از اعتبار و صحت و بقای قرارداد (صلحنامه) است.
                        </p>
                        <p>
                            <span className="font-bold">۵- </span>
                            <span className="font-bold">اطلاعات حساب بانکی متصالح: </span>
                            شماره حساب <span className="font-mono font-bold">{toPersianDigits(contract.releaseeAccountNumber) || '....................'}</span> شماره شبا <span className="font-mono font-bold">{contract.releaseeShebaNumber ? ('IR' + contract.releaseeShebaNumber.replace(/^IR/i, '')) : '........................'}</span> بانک <span className="font-bold">{contract.releaseeBankName || '..........'}</span> می باشد که پرداخت کلیه ثمن معامله صرفا از طریق حساب مذکور انجام خواهد شد.
                        </p>
                        <p>
                            <span className="font-bold">۶- </span>
                            تمامی مکاتبات و تماس و پیامک ها به آدرس و شماره همراه مذکور ابلاغ و اعلام می گردد.بدیهی است در صورت هرگونه تغییر در آدرس یا شماره تلفن همراه و اطلاعات حساب بانکی فوق الذکر متصالح موظف است ظرف مدت3 روز مراتب را کتبا به مصالح اعلام نماید.در غیر اینصورت مسئولیت آن متوجه متصالح می باشد.
                        </p>
                        <p>
                            <span className="font-bold">۷- </span>
                            تنظیم صورتجلسه تحویل خودرو به منزله تایید صحت و سلامت خودروی تحویل گرفته شده از سوی مصالح میباشد.با این وجود مسئولیت رفع هرگونه ایراد و یا نقص فنی خودرو و جبران خسارات به عهده مراجع و نمایندگی های مجاز خدمات پس از فروش شرکت کرمان موتور است و از این حیث هیچ مسئولیتی متوجه مصالح نیست.
                        </p>
                        <p>
                            <span className="font-bold">۸- </span>
                            این صلحنامه در تاریخ <span className="font-bold">{toPersianDigits(contract.contractDate) || '....................'}</span> طبق ماده10 قانون مدنی در دو نسخه با متن و حکم و اعتبار واحد فی مابین طرفین و امضا و مبادله شد و مفاد آن برای طرفین لازم الاتباع است.
                        </p>
                    </div>

                    {/* Customer Confirmation Note */}
                    <div className="pt-2 border-t border-slate-300">
                        <p className="font-medium text-[12px]">
                            اينجانب {contract.releaseeTitle || 'آقای/خانم'} <span className="font-bold text-blue-900">{contract.releaseeName || '................................'}</span> با مطالعه دقيق قرارداد فوق و علم و آگاهي كامل از مفاد آن با رضايت آنرا امضاء نمودم.
                        </p>
                    </div>
                </div>

                {/* Signatures & Seals Block */}
                <div className="mt-8 pt-4 border-t-2 border-slate-800">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="space-y-8">
                            <span className="font-black text-xs text-slate-800 block">
                                امضاء مصالح:
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                                شرکت تضامنی حسینی خودرو شیراز
                                <br />
                                (نمایندگی ۲۶۰۶ کرمان موتور)
                            </span>
                        </div>

                        <div className="space-y-8">
                            <span className="font-black text-xs text-slate-800 block">
                                امضا و اثر انگشت متصالح:
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                                {contract.releaseeTitle || 'آقای/خانم'} {contract.releaseeName || '....................'}
                            </span>
                        </div>

                        <div className="space-y-8">
                            <span className="font-black text-xs text-slate-800 block">
                                امضا شهود:
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                                شاهد اول / شاهد دوم
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
