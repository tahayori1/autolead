import React, { useState, useMemo } from 'react';
import { 
    Users, 
    Clock, 
    TrendingUp, 
    AlertCircle, 
    Hourglass, 
    BarChart3, 
    Search, 
    X, 
    Eye, 
    Download, 
    Trash2, 
    RefreshCw, 
    FileSpreadsheet 
} from 'lucide-react';
import type { EmployeeTimesheet } from '../types';
import { parseTimeToMinutes, formatMinutesToTime } from '../services/timesheetService';

interface AggregateMetrics {
    totalEmployees: number;
    totalWorkTime: string;
    totalOvertime: string;
    totalDeficit: string;
    totalDuty: string;
    netBalance: string;
    isNetPositive: boolean;
    avgOvertimePerEmployee: string;
    totalPunches: number;
    totalLeaveDays: number;
}

interface Props {
    timesheets: EmployeeTimesheet[];
    selectedSheetId: string;
    aggregateMetrics: AggregateMetrics;
    onSelectEmployee: (sheetId: string) => void;
    onExportAggregateToExcel: () => void;
    onExportAllToExcel: () => void;
    onExportSingleToExcel: (sheet: EmployeeTimesheet) => void;
    onResetToSample?: () => void;
    onOpenUploadModal?: () => void;
    onDeleteSheet: (sheetId: string) => void;
}

export const AttendanceAggregateView: React.FC<Props> = ({
    timesheets,
    selectedSheetId,
    aggregateMetrics,
    onSelectEmployee,
    onExportAggregateToExcel,
    onExportAllToExcel,
    onExportSingleToExcel,
    onResetToSample,
    onOpenUploadModal,
    onDeleteSheet,
}) => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERTIME' | 'DEFICIT' | 'POSITIVE_BALANCE'>('ALL');

    // Filtered timesheets based on search and selected filter
    const filteredSheets = useMemo(() => {
        return timesheets.filter(ts => {
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch = !query || 
                ts.employeeName.toLowerCase().includes(query) ||
                ts.employeeCode.toLowerCase().includes(query);
            
            if (!matchesSearch) return false;

            const otMinutes = parseTimeToMinutes(ts.summary.totalOvertime);
            const defMinutes = parseTimeToMinutes(ts.summary.totalDeficit);

            if (statusFilter === 'OVERTIME') return otMinutes > 0;
            if (statusFilter === 'DEFICIT') return defMinutes > 0;
            if (statusFilter === 'POSITIVE_BALANCE') return (otMinutes - defMinutes) >= 0;
            return true;
        });
    }, [timesheets, searchQuery, statusFilter]);

    return (
        <div className="space-y-5 animate-fade-in" dir="rtl">
            {/* Dealership Aggregate Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Total Staff */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">کل پرسنل</span>
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">
                            {aggregateMetrics.totalEmployees.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-xs text-slate-400 mr-1 font-bold">نفر</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">ثبت‌شده در سیستم</p>
                    </div>
                </div>

                {/* Total Work Time */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">مجموع کارکرد</span>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-xl font-black text-slate-800 dark:text-white font-mono dir-ltr inline-block">
                            {aggregateMetrics.totalWorkTime}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            موظفی کل: {aggregateMetrics.totalDuty}
                        </p>
                    </div>
                </div>

                {/* Total Overtime */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">مجموع اضافه کار</span>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono dir-ltr inline-block">
                            +{aggregateMetrics.totalOvertime}
                        </span>
                        <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 font-bold">
                            ساعات مازاد مجاز
                        </p>
                    </div>
                </div>

                {/* Total Deficit */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-300">مجموع کسری کار</span>
                        <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono dir-ltr inline-block">
                            -{aggregateMetrics.totalDeficit}
                        </span>
                        <p className="text-[10px] text-rose-500/80 dark:text-rose-400/80 mt-0.5 font-bold">
                            شامل تاخیر و تعجیل
                        </p>
                    </div>
                </div>

                {/* Net Time Balance */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">تراز خالص ساعت</span>
                        <div className={`p-2 rounded-xl ${aggregateMetrics.isNetPositive ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'}`}>
                            <Hourglass className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className={`text-xl font-black font-mono dir-ltr inline-block ${aggregateMetrics.isNetPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {aggregateMetrics.isNetPositive ? `+${aggregateMetrics.netBalance}` : `-${aggregateMetrics.netBalance}`}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            (اضافه کار منهای کسری)
                        </p>
                    </div>
                </div>

                {/* Average Overtime */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">میانگین اضافه کار</span>
                        <div className="p-2 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono dir-ltr inline-block">
                            {aggregateMetrics.avgOvertimePerEmployee}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">به ازای هر کارمند</p>
                    </div>
                </div>
            </div>

            {/* Aggregate Toolbar & Search */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="جستجوی نام یا کد پرسنلی در لیست تجمیعی..."
                            className="w-full pl-3 pr-9 py-2 bg-slate-100 dark:bg-slate-700/70 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden border border-transparent focus:border-emerald-500"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                statusFilter === 'ALL'
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            همه پرسنل ({timesheets.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('OVERTIME')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                statusFilter === 'OVERTIME'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                            }`}
                        >
                            <span>دارای اضافه کار</span>
                        </button>
                        <button
                            onClick={() => setStatusFilter('DEFICIT')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                statusFilter === 'DEFICIT'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                            }`}
                        >
                            <span>دارای کسری کار</span>
                        </button>
                        <button
                            onClick={() => setStatusFilter('POSITIVE_BALANCE')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                statusFilter === 'POSITIVE_BALANCE'
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100'
                            }`}
                        >
                            تراز مثبت ساعت
                        </button>
                    </div>
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                        onClick={onExportAggregateToExcel}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-xl transition-colors cursor-pointer"
                        title="دانلود فایل اکسل جدول تجمیعی کارکرد و اضافه کار"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>اکسل تجمیعی</span>
                    </button>
                    {onOpenUploadModal && (
                        <button
                            onClick={onOpenUploadModal}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors cursor-pointer"
                            title="بارگذاری و ارسال فایل اکسل به وب‌هوک سرور"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>بارگذاری فایل اکسل جدید</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Master Aggregate Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <span>لیست تجمیعی کارکرد هر کارمند</span>
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                (کارکرد، اضافه کار و کسری کار تک‌تک پرسنل حسینی خودرو شیراز)
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            جهت مشاهده کارنامه تفصیلی و ثبت ترددهای روزانه هر کارمند، بر روی سطر مربوطه یا دکمه «مشاهده کارنامه» کلیک نمایید.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-bold">
                            تعداد کارمندان در جدول: {filteredSheets.length.toLocaleString('fa-IR')}
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 text-[11px] font-black border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-3.5 text-center w-12">#</th>
                                <th className="p-3.5 pr-4">کارمند</th>
                                <th className="p-3.5 text-center">کد پرسنلی</th>
                                <th className="p-3.5 text-center">دوره کارکرد</th>
                                <th className="p-3.5 text-center">روزهای کاری</th>
                                <th className="p-3.5 text-center bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-black">
                                    کارکرد نهایی
                                </th>
                                <th className="p-3.5 text-center bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black">
                                    مجموع اضافه کار
                                </th>
                                <th className="p-3.5 text-center bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-black">
                                    مجموع کسری کار
                                </th>
                                <th className="p-3.5 text-center">تراز خالص</th>
                                <th className="p-3.5 text-center">موظفی</th>
                                <th className="p-3.5 text-center">مرخصی</th>
                                <th className="p-3.5 text-center">کل ترددها</th>
                                <th className="p-3.5 text-center w-36">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {filteredSheets.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="p-12 text-center text-slate-400">
                                        <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                                        <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                                            {timesheets.length === 0 
                                                ? 'هیچ کارنامه‌ای بر روی سرور ثبت نشده است' 
                                                : 'هیچ کارمندی با فیلترهای انتخابی یافت نشد.'}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {timesheets.length === 0 
                                                ? 'برای ارسال و همگام‌سازی کارکرد با وب‌هوک سرور، فایل اکسل تردد را آپلود نمایید.'
                                                : 'لطفاً عبارت جستجو را پاک کنید یا فیلتر دیگری را برگزینید.'}
                                        </p>
                                        {timesheets.length === 0 && onOpenUploadModal && (
                                            <button
                                                onClick={onOpenUploadModal}
                                                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2"
                                            >
                                                <FileSpreadsheet className="w-4 h-4" />
                                                <span>بارگذاری فایل‌های اکسل و ارسال به وب‌هوک (POST)</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredSheets.map((sheet, index) => {
                                    const otMin = parseTimeToMinutes(sheet.summary.totalOvertime);
                                    const defMin = parseTimeToMinutes(sheet.summary.totalDeficit);
                                    const diffMin = otMin - defMin;
                                    const isNetPos = diffMin >= 0;
                                    const netStr = formatMinutesToTime(Math.abs(diffMin));
                                    const isCurrentSelected = sheet.id === selectedSheetId;

                                    return (
                                        <tr
                                            key={sheet.id}
                                            onClick={() => onSelectEmployee(sheet.id)}
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group ${
                                                isCurrentSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                                            }`}
                                        >
                                            <td className="p-3.5 text-center text-slate-400 font-mono">
                                                {(index + 1).toLocaleString('fa-IR')}
                                            </td>
                                            <td className="p-3.5 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                                                        {sheet.employeeName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors block text-xs">
                                                            {sheet.employeeName}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            پرسنل حسینی خودرو
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                                                    {sheet.employeeCode}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-center text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                                {sheet.startDate} تا {sheet.endDate}
                                            </td>
                                            <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                                                {sheet.summary.workDaysCount} روز
                                            </td>
                                            <td className="p-3.5 text-center font-mono font-black text-slate-900 dark:text-white bg-emerald-50/40 dark:bg-emerald-950/20 text-xs dir-ltr">
                                                {sheet.summary.totalFinalWorkTime}
                                            </td>
                                            <td className="p-3.5 text-center font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 text-xs dir-ltr">
                                                +{sheet.summary.totalOvertime}
                                            </td>
                                            <td className="p-3.5 text-center font-mono font-black text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/40 text-xs dir-ltr">
                                                -{sheet.summary.totalDeficit}
                                            </td>
                                            <td className="p-3.5 text-center font-mono text-xs dir-ltr">
                                                <span className={`px-2 py-0.5 rounded-md font-bold ${
                                                    isNetPos
                                                        ? 'text-emerald-700 bg-emerald-100/80 dark:text-emerald-300 dark:bg-emerald-950/80'
                                                        : 'text-rose-700 bg-rose-100/80 dark:text-rose-300 dark:bg-rose-950/80'
                                                }`}>
                                                    {isNetPos ? `+${netStr}` : `-${netStr}`}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-center font-mono text-slate-500 text-[11px]">
                                                {sheet.summary.totalDuty}
                                            </td>
                                            <td className="p-3.5 text-center text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                                                {sheet.summary.leaveDaysCount > 0 ? `${sheet.summary.leaveDaysCount} روز` : '-'}
                                            </td>
                                            <td className="p-3.5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                                                {sheet.summary.totalPunches.toLocaleString('fa-IR')}
                                            </td>
                                            <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => onSelectEmployee(sheet.id)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                                                        title="مشاهده کارنامه تفصیلی و روزهای ماه"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>کارنامه</span>
                                                    </button>
                                                    <button
                                                        onClick={() => onExportSingleToExcel(sheet)}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                                        title={`دانلود اکسل فردی ${sheet.employeeName}`}
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                    {timesheets.length > 1 && (
                                                        <button
                                                            onClick={() => onDeleteSheet(sheet.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                                            title={`حذف ${sheet.employeeName}`}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>

                        {/* Aggregate Totals Footer Row */}
                        {filteredSheets.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-200/90 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white">
                                    <td colSpan={5} className="p-4 pr-6 text-xs font-black">
                                        جمع کل کارکرد، اضافه کار و کسری کار پرسنل حسینی خودرو ({filteredSheets.length} کارمند)
                                    </td>
                                    <td className="p-4 text-center font-mono font-black text-slate-900 dark:text-white text-xs dir-ltr bg-emerald-100/50 dark:bg-emerald-950/40">
                                        {aggregateMetrics.totalWorkTime}
                                    </td>
                                    <td className="p-4 text-center font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs dir-ltr bg-emerald-100/70 dark:bg-emerald-950/60">
                                        +{aggregateMetrics.totalOvertime}
                                    </td>
                                    <td className="p-4 text-center font-mono font-black text-rose-700 dark:text-rose-400 text-xs dir-ltr bg-rose-100/70 dark:bg-rose-950/60">
                                        -{aggregateMetrics.totalDeficit}
                                    </td>
                                    <td className="p-4 text-center font-mono text-xs dir-ltr">
                                        <span className={`px-2 py-0.5 rounded-md font-black ${
                                            aggregateMetrics.isNetPositive
                                                ? 'text-emerald-700 bg-emerald-200 dark:text-emerald-300 dark:bg-emerald-950'
                                                : 'text-rose-700 bg-rose-200 dark:text-rose-300 dark:bg-rose-950'
                                        }`}>
                                            {aggregateMetrics.isNetPositive ? `+${aggregateMetrics.netBalance}` : `-${aggregateMetrics.netBalance}`}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                        {aggregateMetrics.totalDuty}
                                    </td>
                                    <td className="p-4 text-center font-bold text-[11px] text-purple-700 dark:text-purple-300">
                                        {aggregateMetrics.totalLeaveDays} روز
                                    </td>
                                    <td className="p-4 text-center font-mono text-[11px]">
                                        {aggregateMetrics.totalPunches.toLocaleString('fa-IR')}
                                    </td>
                                    <td className="p-4 text-center text-slate-500 text-[11px]">
                                        مجموع کل سازمان
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};
