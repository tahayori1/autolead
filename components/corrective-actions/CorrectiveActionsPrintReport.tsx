import React from 'react';
import type { CorrectiveAction, CorrectiveActionPriority, CorrectiveActionEffectiveness } from '../../types';
import { 
    ClipboardCheckIcon, 
    FileText, 
    Printer as PrintIcon, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    Calendar, 
    Building2, 
    User, 
    ShieldAlert, 
    Sparkles,
    Check,
    X
} from 'lucide-react';

declare const moment: any;

interface CorrectiveActionsPrintReportProps {
    isOpen: boolean;
    onClose: () => void;
    actions: CorrectiveAction[];
    reportPeriodTitle: string;
    filterDeptTitle?: string;
}

const PRIORITIES_MAP: Record<string, string> = {
    LOW: 'عادی',
    MEDIUM: 'متوسط',
    HIGH: 'بالا',
    CRITICAL: 'بحرانی / فوری'
};

const EFFECTIVENESS_MAP: Record<string, string> = {
    PENDING_REVIEW: 'در انتظار بررسی',
    EFFECTIVE: 'اثربخش (تاییدشده)',
    PARTIALLY_EFFECTIVE: 'تا حدودی اثربخش',
    INEFFECTIVE: 'فاقد اثربخشی'
};

const toJalali = (gregorianStr?: string): string => {
    if (!gregorianStr || !gregorianStr.trim()) return '-';
    try {
        const clean = gregorianStr.replace('T', ' ').split(' ')[0].trim();
        if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(clean)) {
            const firstNum = parseInt(clean.split(/[-/]/)[0], 10);
            if (firstNum >= 1300 && firstNum <= 1500) {
                const parts = clean.split(/[-/]/);
                return `${parts[0]}/${parts[1].padStart(2, '0')}/${parts[2].padStart(2, '0')}`;
            }
        }
        if (typeof moment !== 'undefined') {
            const m = moment(clean, ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY-M-D', 'YYYY/M/D']);
            if (m && m.isValid()) {
                return m.locale('fa').format('jYYYY/jMM/jDD');
            }
        }
    } catch (e) {}
    return gregorianStr || '-';
};

const getCurrentJalaliDate = (): string => {
    try {
        if (typeof moment !== 'undefined') {
            return moment().locale('fa').format('jYYYY/jMM/jDD');
        }
    } catch (e) {}
    return new Date().toLocaleDateString('fa-IR');
};

export const CorrectiveActionsPrintReport: React.FC<CorrectiveActionsPrintReportProps> = ({
    isOpen,
    onClose,
    actions,
    reportPeriodTitle,
    filterDeptTitle = 'تمامی دپارتمان‌ها و واحدها'
}) => {
    if (!isOpen) return null;

    const printDate = getCurrentJalaliDate();
    const total = actions.length;
    const completed = actions.filter(a => a.isCompleted).length;
    const inProgress = actions.filter(a => !a.isCompleted).length;
    const critical = actions.filter(a => a.priority === 'CRITICAL' || a.priority === 'HIGH').length;
    const effective = actions.filter(a => a.effectiveness === 'EFFECTIVE').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const effectivenessRate = completed > 0 ? Math.round((effective / completed) * 100) : 0;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex justify-center items-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
            <div className="bg-white text-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
                
                {/* Print Control Header (hidden during print) */}
                <div className="px-6 py-3.5 bg-slate-900 text-white flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        <div>
                            <h3 className="text-sm font-black">پیش‌نمایش چاپ و صدور گزارش رسمی اقدامات اصلاحی (CAPA)</h3>
                            <span className="text-[11px] text-slate-400">فرمت رسمی سازمانی جهت ارزیابی کیفیت، ممیزی و ارائه به مدیریت</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95"
                        >
                            <PrintIcon className="w-4 h-4" />
                            <span>چاپ گزارش / ذخیره PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Area */}
                <div className="p-8 overflow-y-auto flex-grow print:p-0 print:overflow-visible space-y-6 text-xs text-slate-800 bg-white" id="capa-printable-report">
                    
                    {/* Official Letterhead Header */}
                    <div className="border-b-2 border-slate-900 pb-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl">
                                    CAPA
                                </div>
                                <div>
                                    <h1 className="text-lg font-black text-slate-900">گزارش جامع وضعیت و اثربخشی اقدامات اصلاحی و پیشگیرانه</h1>
                                    <p className="text-xs text-slate-600 font-medium mt-0.5">سیستم مدیریت یکپارچه کیفیت و تضمین فرآیندها (CAPA Quality Audit Report)</p>
                                </div>
                            </div>

                            <div className="text-left font-mono text-[11px] space-y-1 text-slate-600">
                                <div><strong className="text-slate-900">تاریخ صدور گزارش:</strong> {printDate}</div>
                                <div><strong className="text-slate-900">بازه زمانی:</strong> {reportPeriodTitle}</div>
                                <div><strong className="text-slate-900">محدوده بررسی:</strong> {filterDeptTitle}</div>
                                <div><strong className="text-slate-900">کد سند:</strong> QA-CAPA-REP-{printDate.replace(/\//g, '')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Executive KPI Summary Table */}
                    <div className="grid grid-cols-5 gap-2.5 text-center">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-500 block">کل اقدامات ثبت شده</span>
                            <span className="text-lg font-black font-mono text-slate-900 mt-1 block">{total}</span>
                        </div>
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <span className="text-[10px] font-bold text-emerald-700 block">اقدامات تکمیل و اجرا شده</span>
                            <span className="text-lg font-black font-mono text-emerald-800 mt-1 block">{completed}</span>
                        </div>
                        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                            <span className="text-[10px] font-bold text-sky-700 block">در جریان پیگیری</span>
                            <span className="text-lg font-black font-mono text-sky-800 mt-1 block">{inProgress}</span>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <span className="text-[10px] font-bold text-amber-700 block">نرخ تحقق اقدامات</span>
                            <span className="text-lg font-black font-mono text-amber-800 mt-1 block">{completionRate}%</span>
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                            <span className="text-[10px] font-bold text-purple-700 block">نرخ اثربخشی کیفی</span>
                            <span className="text-lg font-black font-mono text-purple-800 mt-1 block">{effectivenessRate}%</span>
                        </div>
                    </div>

                    {/* Actions Detailed Matrix Table */}
                    <div className="space-y-2">
                        <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span>فهرست تفصیلی اقدامات اصلاحی در بازه انتخابی:</span>
                            <span className="text-[10px] font-normal text-slate-500">({actions.length} مورد)</span>
                        </h2>

                        <div className="border border-slate-300 rounded-xl overflow-hidden">
                            <table className="w-full text-right border-collapse text-[10px]">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-black">
                                        <th className="p-2 border-l border-slate-300 text-center w-8">#</th>
                                        <th className="p-2 border-l border-slate-300">عنوان عدم انطباق / مشکل</th>
                                        <th className="p-2 border-l border-slate-300">واحد سازمانی</th>
                                        <th className="p-2 border-l border-slate-300 text-center">اولویت</th>
                                        <th className="p-2 border-l border-slate-300">مسئول اجرا</th>
                                        <th className="p-2 border-l border-slate-300 text-center">زمان ثبت</th>
                                        <th className="p-2 border-l border-slate-300 text-center">مهلت (Due)</th>
                                        <th className="p-2 border-l border-slate-300 text-center">تاریخ اجرا</th>
                                        <th className="p-2 border-l border-slate-300 text-center">وضعیت</th>
                                        <th className="p-2 text-center">ارزیابی اثربخشی</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {actions.map((action, idx) => {
                                        const regDate = action.registrationDate ? toJalali(action.registrationDate) : toJalali(action.createdAt);
                                        const dueDate = toJalali(action.dueDate);
                                        const execDate = action.executionDate ? toJalali(action.executionDate) : (action.isCompleted ? 'اجرا شده' : '-');

                                        return (
                                            <tr key={action.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                                <td className="p-2 border-l border-slate-200 text-center font-mono font-bold text-slate-600">{idx + 1}</td>
                                                <td className="p-2 border-l border-slate-200 font-bold text-slate-900 max-w-[180px] truncate">
                                                    {action.title}
                                                </td>
                                                <td className="p-2 border-l border-slate-200 text-slate-700">{action.department || 'عمومی'}</td>
                                                <td className="p-2 border-l border-slate-200 text-center font-bold">
                                                    <span className={action.priority === 'CRITICAL' ? 'text-rose-600' : action.priority === 'HIGH' ? 'text-amber-600' : 'text-slate-700'}>
                                                        {PRIORITIES_MAP[action.priority || 'MEDIUM'] || 'متوسط'}
                                                    </span>
                                                </td>
                                                <td className="p-2 border-l border-slate-200 font-medium text-slate-800">{action.responsiblePerson}</td>
                                                <td className="p-2 border-l border-slate-200 text-center font-mono text-slate-600">{regDate}</td>
                                                <td className="p-2 border-l border-slate-200 text-center font-mono text-slate-600">{dueDate}</td>
                                                <td className="p-2 border-l border-slate-200 text-center font-mono font-bold text-slate-800">{execDate}</td>
                                                <td className="p-2 border-l border-slate-200 text-center">
                                                    <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                                                        action.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                                                    }`}>
                                                        {action.isCompleted ? 'اجرا شده' : 'در جریان'}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <span className={`font-bold text-[9px] ${
                                                        action.effectiveness === 'EFFECTIVE' ? 'text-emerald-700' : 
                                                        action.effectiveness === 'PARTIALLY_EFFECTIVE' ? 'text-amber-700' : 
                                                        action.effectiveness === 'INEFFECTIVE' ? 'text-rose-700' : 'text-slate-500'
                                                    }`}>
                                                        {EFFECTIVENESS_MAP[action.effectiveness || 'PENDING_REVIEW'] || 'در انتظار'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {actions.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="p-6 text-center text-slate-400">هیچ رکوردی برای نمایش در این گزارش یافت نشد.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quality & Management Remarks Section */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
                            <strong className="text-slate-900 block">نکات و تحلیل تضمین کیفیت:</strong>
                            <p className="text-slate-600 leading-relaxed text-[10px]">
                                اقدامات تعریف‌شده در این دوره تحت پایش دوره‌ای قرار داشته و اولویت‌های بحرانی با موفقیت پیگیری گردیده‌اند. بخش‌های نیازمند اقدام مجدد در دستور کار ممیزی داخلی قرار خواهند گرفت.
                            </p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
                            <strong className="text-slate-900 block">توصیه‌های بهبود مستمر (Kaizen):</strong>
                            <p className="text-slate-600 leading-relaxed text-[10px]">
                                کاهش میانگین زمان بستن اقدامات اصلاحی، بازنگری مستمر در فرآیندهای ریشه‌یابی خطاهای تکراری و توانمندسازی پرسنل اجرایی در رفع موانع فرآیندی.
                            </p>
                        </div>
                    </div>

                    {/* Official Signatures Footer */}
                    <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-[11px] font-bold text-slate-800">
                        <div className="space-y-8">
                            <span>مسئول ثبت و پایش کیفیت</span>
                            <div className="text-[10px] text-slate-400 font-normal">امضا و تاریخ</div>
                        </div>
                        <div className="space-y-8">
                            <span>مدیر تضمین کیفیت و استانداردها</span>
                            <div className="text-[10px] text-slate-400 font-normal">امضا و تاریخ</div>
                        </div>
                        <div className="space-y-8">
                            <span>مدیریت ارشد / مدیرعامل</span>
                            <div className="text-[10px] text-slate-400 font-normal">امضا و تاریخ</div>
                        </div>
                    </div>

                </div>

                {/* Footer Controls in Preview */}
                <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center print:hidden">
                    <span className="text-[11px] text-slate-500">
                        برای دریافت بهترین کیفیت چاپ، در پنجره چاپگر گزینه <strong className="text-slate-700">Background Graphics</strong> را فعال نگه دارید.
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                        >
                            بستن
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                        >
                            <PrintIcon className="w-4 h-4" />
                            <span>چاپ گزارش</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
