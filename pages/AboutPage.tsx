import React from 'react';
import { Info, GitCommit, Sparkles, ArrowUpRight, ShieldCheck, Heart } from 'lucide-react';

interface ChangelogItem {
    version: string;
    date: string;
    title: string;
    changes: {
        type: 'new' | 'improvement' | 'fix';
        text: string;
    }[];
}

const AboutPage: React.FC = () => {
    const appVersion = "v2.5.4";
    const releaseDate = "۱۲ تیر ۱۴۰۵";

    const changelog: ChangelogItem[] = [
        {
            version: "v2.5.4",
            date: "۱۴۰۵/۰۴/۱۲",
            title: "بهبود اصطلاحات بخشنامه متناسب با نحوه پرداخت نقدی",
            changes: [
                { type: 'improvement', text: "تغییر هوشمند واژه «پیش‌پرداخت» به «قیمت خودرو» در تمامی بخش‌های برنامه (مشاهده، ایجاد، سفارش، کپی، خروجی و تبلیغات) در صورتی که نحوه پرداخت نقدی باشد." }
            ]
        },
        {
            version: "v2.5.3",
            date: "۱۴۰۵/۰۴/۱۱",
            title: "اضافه شدن قابلیت کپی شرایط بخشنامه‌ها و هماهنگی کامل فیلتر نوع فروش",
            changes: [
                { type: 'new', text: "طراحی و پیاده‌سازی پنجره تنظیمات کپی شرایط بخشنامه های فروش با قابلیت انتخاب دستی فیلدهای دلخواه برای کپی منظم در کلیپ‌بورد." },
                { type: 'improvement', text: "هماهنگ‌سازی کامل و هوشمند فیلتر نوع فروش در بالای جدول بخشنامه‌ها بین تب‌های ناوبری سریع و کنترل‌های فیلتر پیشرفته." },
                { type: 'improvement', text: "یکپارچه‌سازی کامل کامپوننت فیلتر پیشرفته به عنوان یک کامپوننت کنترل‌شده (Controlled Component) در React." }
            ]
        },
        {
            version: "v2.5.2",
            date: "۱۴۰۵/۰۴/۱۰",
            title: "پیاده‌سازی فرم ثبت و گزارش تماس‌های مشتری با API اختصاصی",
            changes: [
                { type: 'new', text: "توسعه اندپوینت‌های واقعی سرور /calllog با پشتیبانی کامل از متدهای GET، POST و PUT جهت مدیریت بلادرنگ گزارش تماس‌ها." },
                { type: 'new', text: "بازطراحی ماژول گزارش تماس‌های مشتری برای ثبت، مشاهده و ویرایش لحظه‌ای داده‌ها با اتصال مستقیم به بک‌اند بجای استفاده از حافظه محلی (localStorage)." },
                { type: 'improvement', text: "یکپارچه‌سازی فرآیند درون‌ریزی فایل‌های VOIP با وب‌سرویس بک‌اند و بارگذاری داینامیک آمار نرخ موفقیت مکالمات در پیشخوان." }
            ]
        },
        {
            version: "v2.5.1",
            date: "۱۴۰۵/۰۴/۰۹",
            title: "یکپارچه‌سازی عمیق مرکز تماس VOIP و گزارش‌های تماس با CRM",
            changes: [
                { type: 'new', text: "امکان پردازش موازی و درون‌ریزی همزمان گزارشات تماس‌های VOIP به بخش تماس‌های CRM به همراه ثبت خودکار شماره‌های ورودی جدید به عنوان سرنخ‌های مستعد." },
                { type: 'improvement', text: "تشخیص هوشمند جهت تماس (ورودی/خروجی)، طول زمان مکالمه (ثانیه)، و دسته‌بندی خودکار بر اساس علت قطع ارتباط (مشغول، عدم پاسخ، لغو شده یا موفق)." },
                { type: 'improvement', text: "سیستم به‌روزرسانی آنی و سینک سراسری تب‌های باز شده مرورگر به وسیله Event-Emitters اختصاصی در CRM." }
            ]
        },
        {
            version: "v2.5.0",
            date: "۱۴۰۵/۰۴/۰۸",
            title: "پیاده‌سازی سیستم درون‌ریزی هوشمند اکسل در CRM",
            changes: [
                { type: 'new', text: "افزودن قابلیت آپلود مستقیم فایل‌های Excel (.xlsx, .xls) و CSV در بخش مدیریت ارتباط با مشتری." },
                { type: 'new', text: "پشتیبانی کامل از ۳ سناریوی متمایز: شماره‌های اینستاگرام، تاریخچه تماس‌های مرکز تلفن VOIP، و شماره‌های پنل پیامکی." },
                { type: 'improvement', text: "پیاده‌سازی موتور تطبیق هوشمند ستون‌ها (Smart Column Mapping) با قابلیت تشخیص خودکار و ویرایش دستی فیلدها." },
                { type: 'improvement', text: "جلوگیری هوشمند از ورود شماره‌های تکراری با بررسی بلادرنگ نسبت به کل بانک اطلاعاتی CRM و نمایش تفکیک آماری پیش از درون‌ریزی نهایی." }
            ]
        },
        {
            version: "v2.4.2",
            date: "۱۴۰۵/۰۴/۰۷",
            title: "اعمال محدودیت زمانی انقضای قیمت‌های روز خودروها",
            changes: [
                { type: 'improvement', text: "افزودن قابلیت فیلتر خودکار و عدم نمایش قیمت‌های مرجع روز خودرو در صورتی که بیش از ۳ روز از آخرین بروزرسانی آن‌ها گذشته باشد." },
                { type: 'fix', text: "بروزرسانی کارت‌های آماری خلاصه‌ قیمت‌ها جهت عدم نمایش آمارهای منقضی شده، به استثنای خودروهای دارای قیمت دستی مصوب جدید." }
            ]
        },
        {
            version: "v2.4.1",
            date: "۱۴۰۵/۰۴/۰۶",
            title: "توسعه ماژول بخشنامه‌های فروش و ادغام با بخش کارشناسی",
            changes: [
                { type: 'new', text: "اضافه شدن دسته‌بندی تب‌بندی شده برای انواع بخشنامه‌های فروش (ثبت نام کارخانه، حواله، لیزینگی، صفر بازار و کارکرده) به همراه تب «همه» جهت دسترسی جامع." },
                { type: 'new', text: "افزودن قابلیت ثبت اطلاعات کامل مالک (متصل به CRM نمایندگی) برای شرایط فروش صفر بازار و کارکرده با قابلیت جستجوی هوشمند و همچنین فرم ثبت آنی مالک جدید." },
                { type: 'new', text: "یکپارچه‌سازی کامل شرایط فروش کارکرده با ماژول کارشناسی خودروهای کارکرده و دریافت اطلاعات عیوب فنی و قیمت‌های کارشناسی به صورت خودکار." }
            ]
        },
        {
            version: "v2.4.0",
            date: "۱۴۰۵/۰۴/۰۴",
            title: "بازطراحی پیشخوان اصلی و افزودن بخش درباره سیستم",
            changes: [
                { type: 'new', text: "بازطراحی مدرن پیشخوان اصلی شامل تمرکز روی قیمت‌های روز خودرو، شرایط فروش فعال و منوی دسترسی سریع." },
                { type: 'new', text: "اضافه شدن بخش اختصاصی «درباره سیستم» و تاریخچه تغییرات (Change Log) جهت سهولت در رصد قابلیت‌ها." },
                { type: 'improvement', text: "افزایش سرعت بارگذاری پیشخوان و یکپارچه‌سازی کامل تم‌های تیره و روشن." }
            ]
        },
        {
            version: "v2.3.0",
            date: "۱۴۰۵/۰۴/۰۳",
            title: "اتصال هوشمند به وب‌هوک API و بازطراحی المان‌های پنل بازاریابی",
            changes: [
                { type: 'new', text: "اتصال هوشمند بخش «contact ساز» به API کسب‌وکار (وب‌هوک Hoseini Khodro) جهت استخراج خودکار آدرس، تلفن‌ها، شعار و نام نمایندگی." },
                { type: 'improvement', text: "تغییر نام ماژول‌های پنل تبلیغات به ساختار کوتاه‌تر و استاندارد: عنوان‌های آماده به «title ساز»، قلاب‌های متمایز به «hook ساز» و مشخصات فروشنده به «contact ساز»." },
                { type: 'improvement', text: "حذف المان‌های ناوبری تب اضافی در پنل بازاریابی و بهینه‌سازی دسترسی به هر بخش از منوی فرعی سیستم." }
            ]
        },
        {
            version: "v2.2.0",
            date: "۱۴۰۵/۰۳/۲۸",
            title: "محاسبه کف قیمت هوشمند خودرو و تنظیمات کپی گروهی",
            changes: [
                { type: 'new', text: "افزودن متغیر هوشمند lowestLimit (کف واقعی قیمت روز) بر اساس کمترین منبع موجود یا قیمت دستی ورودی." },
                { type: 'improvement', text: "یکپارچه‌سازی کف قیمت در فرمول‌های محاسباتی کپی گروهی قیمت و شرایط فروش." },
                { type: 'fix', text: "رفع خطا در مقادیر پیش‌فرض محاسبه بازه ۲ درصد نوسان خودرو در منوی خروجی آگهی." }
            ]
        },
        {
            version: "v2.1.0",
            date: "۱۴۰۵/۰۳/۱۵",
            title: "سیستم هوشمند تبلیغ‌نویس هوش مصنوعی و کمپین‌های بازاریابی",
            changes: [
                { type: 'new', text: "راه‌اندازی دستگاه هوشمند تبلیغ‌نویس با قابلیت سفارشی‌سازی بر اساس متغیرهای انتخابی خودرو." },
                { type: 'new', text: "افزودن امکان ثبت، ویرایش و تحلیل پیشرفته بازخورد کمپین‌های تبلیغاتی با بارگذاری فایل گزارش." },
                { type: 'new', text: "کتابخانه غنی با ۹۰ عنوان جذاب، ۹۰ قلاب فروش جلب توجه و ۹۰ دعوت به اقدام (CTA) متمایز." }
            ]
        },
        {
            version: "v2.0.0",
            date: "۱۴۰۵/۰۲/۲۰",
            title: "بازنگری معماری سامانه و ماژول کارشناسی خودرو",
            changes: [
                { type: 'new', text: "اضافه شدن ماژول بررسی و ثبت کارشناسی‌های فنی خودروهای کارکرده." },
                { type: 'new', text: "یکپارچه‌سازی فرآیند تحویل خودروهای صفر به مشتریان در دپارتمان ترخیص." },
                { type: 'improvement', text: "بهبود امنیت دسترسی به بخش مدیریت کاربران و پنل ادمین ارشد." }
            ]
        },
        {
            version: "v1.9.5",
            date: "۱۴۰۵/۰۲/۱۰",
            title: "پیاده‌سازی ماژول مدیریت مساعده حقوق کارمندان",
            changes: [
                { type: 'new', text: "طراحی فرآیند الکترونیکی درخواست و تایید مساعده ماهانه برای کادر فروش و اداری." },
                { type: 'new', text: "اضافه شدن ماشین حساب آنلاین محاسبه خودکار مانده و کسر اقساط به صورت ماهیانه." }
            ]
        },
        {
            version: "v1.9.0",
            date: "۱۴۰۵/۰۱/۲۵",
            title: "ماژول ثبت و کنترل اضافه کاری پرسنل",
            changes: [
                { type: 'new', text: "امکان ثبت دستی و خودکار ساعت‌های اضافه‌کاری کارکنان با تاییدیه نهایی مدیریت فروش نمایندگی." },
                { type: 'improvement', text: "ارائه خروجی اکسل و گزارش تجمیعی اضافه کار برای دپارتمان حسابداری نمایندگی." }
            ]
        },
        {
            version: "v1.8.5",
            date: "۱۴۰۴/۱۲/۱۵",
            title: "بهینه‌سازی سیستم فیلترینگ و جستجوی پیشرفته سرنخ‌ها",
            changes: [
                { type: 'improvement', text: "افزودن فیلتر هوشمند بر اساس نوع خودروی مورد علاقه مشتری، آخرین پیگیری و وضعیت خرید." },
                { type: 'improvement', text: "بهینه‌سازی سرعت واکشی داده‌های سنگین CRM و کاهش چشمگیر مصرف حافظه مرورگر." }
            ]
        },
        {
            version: "v1.8.0",
            date: "۱۴۰۴/۱۱/۳۰",
            title: "پیاده‌سازی باشگاه مشتریان و وفادارسازی",
            changes: [
                { type: 'new', text: "راه‌اندازی بخش اختصاصی باشگاه مشتریان با سیستم امتیازبندی هوشمند برای خریداران وفادار." },
                { type: 'new', text: "قابلیت ارسال خودکار پیامک تبریک تولد و یادآوری دوره‌های سرویس خودرو." }
            ]
        },
        {
            version: "v1.7.5",
            date: "۱۴۰۴/۱۱/۱۰",
            title: "بهبود خروجی چاپی پیش‌فاکتور و شرایط فروش",
            changes: [
                { type: 'improvement', text: "طراحی تم‌های زیبا و استاندارد جهت پرینت مستقیم بخشنامه‌های فروش و فاکتورهای رسمی نمایندگی." },
                { type: 'fix', text: "رفع مشکل ناهماهنگی فونت‌های فارسی در خروجی‌های PDF تولید شده توسط مرورگر." }
            ]
        },
        {
            version: "v1.7.0",
            date: "۱۴۰۴/۱۰/۲۲",
            title: "یکپارچه‌سازی کامل با وب‌سرویس قیمت روز خودروها",
            changes: [
                { type: 'new', text: "اتصال به APIهای مرجع قیمت جهت نمایش و بروزرسانی لحظه‌ای قیمت خودروهای صفر داخلی و وارداتی." },
                { type: 'new', text: "ثبت تاریخچه نوسانات قیمت هر خودرو به صورت نمودارهای گرافیکی خطی زیبا." }
            ]
        },
        {
            version: "v1.6.5",
            date: "۱۴۰۴/۱۰/۰۵",
            title: "طراحی بخش نظر سنجی و رضایت‌سنجی مشتریان",
            changes: [
                { type: 'new', text: "امکان تعریف فرم‌های نظرسنجی پویا پس از تحویل خودرو به مشتری." },
                { type: 'new', text: "داشبورد آماری پیشرفته برای نمایش شاخص رضایت مشتریان (CSAT) و ارزیابی کارشناسان." }
            ]
        },
        {
            version: "v1.6.0",
            date: "۱۴۰۴/۰۹/۱۸",
            title: "سیستم جامع ثبت کارهای اصلاحی و پیگیری خطاها",
            changes: [
                { type: 'new', text: "راه‌اندازی پنل ثبت کارهای اصلاحی در دپارتمان‌های فنی، فروش و ترخیص نمایندگی." },
                { type: 'improvement', text: "تخصیص خودکار تسک‌ها به پرسنل و مانیتورینگ زمان پاسخگویی و حل مشکل." }
            ]
        },
        {
            version: "v1.5.5",
            date: "۱۴۰۴/۰۸/۳۰",
            title: "مدیریت مرخصی‌های پرسنل به همراه تقویم شمسی هوشمند",
            changes: [
                { type: 'new', text: "ثبت درخواست مرخصی‌های استحقاقی و استعلاجی پرسنل و پیاده‌سازی کارتابل تاییدیه مدیران." },
                { type: 'improvement', text: "ادغام درخواست‌ها در تقویم کاری مشترک نمایندگی جهت هماهنگی شیفت‌ها." }
            ]
        },
        {
            version: "v1.5.0",
            date: "۱۴۰۴/۰۸/۱۰",
            title: "سامانه صندوق پیشنهادات و انتقادات ناشناس",
            changes: [
                { type: 'new', text: "امکان ارسال پیام‌های انتقادی یا پیشنهادی پرسنل به مدیریت ارشد به صورت کاملا ناشناس." },
                { type: 'new', text: "پنل پاسخگویی دوطرفه ایمن بدون افشای هویت فرستنده پیام در محیط سازمان." }
            ]
        },
        {
            version: "v1.4.5",
            date: "۱۴۰۴/۰۷/۲۵",
            title: "سیستم گزارش‌دهی پیشرفته و تحلیل نرخ تبدیل",
            changes: [
                { type: 'new', text: "تولید خودکار آمارهای نرخ تبدیل سرنخ به خریدار واقعی بر اساس عملکرد هر کارشناس فروش." },
                { type: 'new', text: "اضافه شدن داشبورد مقایسه‌ای فروش دپارتمان‌ها به صورت ماهانه و فصلی." }
            ]
        },
        {
            version: "v1.4.0",
            date: "۱۴۰۴/۰۷/۰۵",
            title: "سیستم مدیریت هوشمند خروج خودرو از نمایندگی",
            changes: [
                { type: 'new', text: "پیاده‌سازی فرم الکترونیکی برگه خروج خودرو به همراه تاییدیه حراست و بازرسی فنی بدنه." },
                { type: 'improvement', text: "ثبت خودکار شماره پلاک و مشخصات راننده تحویل گیرنده در بانک اطلاعات ترخیص." }
            ]
        },
        {
            version: "v1.3.0",
            date: "۱۴۰۴/۰۶/۱۵",
            title: "راه‌اندازی ماژول محاسبه پورسانت کارشناسان فروش",
            changes: [
                { type: 'new', text: "تعریف فرمول‌های داینامیک محاسبه پورسانت بر اساس نوع خودرو، حجم فروش و تارگت‌های فصلی." },
                { type: 'improvement', text: "خروجی خودکار فیش پورسانت ماهانه با قابلیت ایمپورت در سیستم حقوق و دستمزد." }
            ]
        },
        {
            version: "v1.0.0",
            date: "۱۴۰۴/۰۵/۰۱",
            title: "انتشار نسخه اولیه و پایدار سامانه مدیریت AutoLead",
            changes: [
                { type: 'new', text: "راه‌اندازی هسته مرکزی نرم‌افزار شامل مدیریت سرنخ‌ها (CRM)، اطلاعات خودروها و بخشنامه‌های فروش پایه." },
                { type: 'improvement', text: "طراحی رابط کاربری واکنش‌گرا و سازگار با سیستم‌های تیره/روشن، به همراه مدیریت دسترسی سطوح کاربران." }
            ]
        }
    ];

    return (
        <div className="animate-fade-in pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                        <Info className="w-4 h-4" />
                        <span>درباره نرم‌افزار</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                        درباره سامانه و سوابق تغییرات
                    </h2>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs font-bold">
                    <span>نسخه فعلی:</span>
                    <span className="font-mono">{appVersion}</span>
                </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-4">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">مدیریت هوشمند فروش</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            AutoLead بستری قدرتمند جهت خودکارسازی و هوشمندسازی فرآیندهای فروش، بازاریابی، مدیریت سرنخ‌ها و مانیتورینگ نرخ رشد و قیمت روز خودروهاست.
                        </p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>امنیت بالا و یکپارچه با داده‌های ابری</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-500 dark:text-sky-400 flex items-center justify-center mb-4">
                            <GitCommit className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">اتصال به وب‌هوک و API</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            امکان ارتباط بدون وقفه با وب‌هوک تنظیمات کسب‌وکار جهت همگام‌سازی داینامیک مشخصات نمایندگی، آدرس‌ها، شعار و کاتالوگ در تمام فرآیندها.
                        </p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-sky-500" />
                        <span>قابلیت به‌روزرسانی آنی و پویا</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 flex items-center justify-center mb-4">
                            <Heart className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">تضمین کارایی دپارتمان‌ها</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            ابزارهای کاربردی همگام نظیر محاسبه پورسانت کارشناسان، ثبت کارهای اصلاحی، کنترل اضافه کاری، خروج خودرو و مدیریت آدرس‌دهی متمرکز.
                        </p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>توسعه مداوم متناسب با نیاز بازار</span>
                    </div>
                </div>
            </div>

            {/* Change Log Section */}
            <div className="bg-white dark:bg-slate-850 rounded-[28px] border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <GitCommit className="w-5 h-5 text-indigo-500" />
                        سوابق تغییرات و بروزرسانی‌ها (Change Log)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        آخرین قابلیت‌ها، بهبودها و اصلاحات اعمال شده روی هسته و رابط کاربری سامانه AutoLead
                    </p>
                </div>

                <div className="p-6 space-y-8 relative">
                    {/* Visual Vertical Line for Timeline */}
                    <div className="absolute right-9 top-8 bottom-8 w-0.5 bg-slate-100 dark:bg-slate-800 hidden md:block"></div>

                    {changelog.map((item, index) => (
                        <div key={item.version} className="relative md:pr-10">
                            {/* Dot on the timeline */}
                            <div className="absolute right-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-850 bg-indigo-500 hidden md:block z-10"></div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                                        {item.version}
                                    </span>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white">{item.title}</h4>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                                    {item.date}
                                </span>
                            </div>

                            <div className="bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2">
                                {item.changes.map((change, cIdx) => (
                                    <div key={cIdx} className="flex items-start gap-2 text-xs leading-relaxed">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 mt-0.5 ${
                                            change.type === 'new' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                            change.type === 'improvement' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400' :
                                            'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                                        }`}>
                                            {change.type === 'new' ? 'جدید' : change.type === 'improvement' ? 'بهبود' : 'اصلاح'}
                                        </span>
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">{change.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
