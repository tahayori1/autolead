import React, { useState, useRef, useEffect } from 'react';
import { 
    Users, 
    ChevronDown, 
    ChevronRight, 
    ChevronLeft, 
    Search, 
    CalendarDays, 
    Trash2, 
    LayoutList 
} from 'lucide-react';
import type { EmployeeTimesheet } from '../types';

interface Props {
    timesheets: EmployeeTimesheet[];
    currentSheet: EmployeeTimesheet | null;
    selectedSheetId: string;
    onSelectSheetId: (id: string) => void;
    onSwitchToAggregate: () => void;
    onDeleteSheet: (id: string) => void;
    isAdmin?: boolean;
}

export const AttendanceEmployeeHeader: React.FC<Props> = ({
    timesheets,
    currentSheet,
    selectedSheetId,
    onSelectSheetId,
    onSwitchToAggregate,
    onDeleteSheet,
    isAdmin = true
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [dropdownSearch, setDropdownSearch] = useState<string>('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredDropdownSheets = timesheets.filter(s => {
        const q = dropdownSearch.trim().toLowerCase();
        if (!q) return true;
        return s.employeeName.toLowerCase().includes(q) || s.employeeCode.toLowerCase().includes(q);
    });

    const handleNextEmployee = () => {
        if (!isAdmin || timesheets.length <= 1) return;
        const currentIndex = timesheets.findIndex(s => s.id === selectedSheetId);
        const nextIndex = (currentIndex + 1) % timesheets.length;
        onSelectSheetId(timesheets[nextIndex].id);
    };

    const handlePrevEmployee = () => {
        if (!isAdmin || timesheets.length <= 1) return;
        const currentIndex = timesheets.findIndex(s => s.id === selectedSheetId);
        const prevIndex = (currentIndex - 1 + timesheets.length) % timesheets.length;
        onSelectSheetId(timesheets[prevIndex].id);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xs border border-slate-200/80 dark:border-slate-700/80 space-y-4" dir="rtl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Custom Dropdown Selector & Navigation */}
                <div className="flex flex-wrap items-center gap-3">
                    {isAdmin && (
                        <button
                            onClick={onSwitchToAggregate}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            title="بازگشت به لیست تجمیعی کلیه پرسنل"
                        >
                            <ChevronRight className="w-4 h-4 text-emerald-600" />
                            <span>لیست تجمیعی</span>
                        </button>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>{isAdmin ? 'انتخاب کارمند:' : 'کارنامه شما:'}</span>
                    </div>

                    {/* Custom Dropdown Menu */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => {
                                if (isAdmin && timesheets.length > 1) {
                                    setIsDropdownOpen(prev => !prev);
                                }
                            }}
                            className={`inline-flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black text-slate-800 dark:text-slate-100 shadow-2xs transition-all min-w-[220px] justify-between ${
                                isAdmin && timesheets.length > 1 ? 'hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer' : 'cursor-default'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-[11px] shadow-2xs">
                                    {currentSheet?.employeeName.charAt(0) || 'ک'}
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-slate-900 dark:text-white">
                                        {currentSheet?.employeeName}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                        کد: {currentSheet?.employeeCode}
                                    </div>
                                </div>
                            </div>
                            {isAdmin && timesheets.length > 1 && (
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            )}
                        </button>

                        {/* Dropdown Popup */}
                        {isAdmin && isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-40 p-2 space-y-1.5 animate-fade-in max-h-96 overflow-y-auto">
                                <div className="p-1.5">
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={dropdownSearch}
                                            onChange={e => setDropdownSearch(e.target.value)}
                                            placeholder="جستجوی نام کارمند..."
                                            className="w-full pl-2 pr-8 py-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden border border-transparent focus:border-emerald-500"
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    {filteredDropdownSheets.map(s => {
                                        const isSelected = s.id === selectedSheetId;
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    onSelectSheetId(s.id);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-colors cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-black' 
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                                        isSelected 
                                                            ? 'bg-emerald-600 text-white' 
                                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                    }`}>
                                                        {s.employeeName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold">{s.employeeName}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">کد: {s.employeeCode}</div>
                                                    </div>
                                                </div>

                                                <div className="text-left font-mono text-[10px] space-y-0.5">
                                                    <div className="text-emerald-600 dark:text-emerald-400">+{s.summary.totalOvertime}</div>
                                                    <div className="text-rose-600 dark:text-rose-400">-{s.summary.totalDeficit}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Previous / Next Buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handlePrevEmployee}
                            disabled={timesheets.length <= 1}
                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer disabled:opacity-30"
                            title="کارمند قبلی"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleNextEmployee}
                            disabled={timesheets.length <= 1}
                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer disabled:opacity-30"
                            title="کارمند بعدی"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Right: Date Range & Employee Sheet Controls */}
                {currentSheet && (
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                            <CalendarDays className="w-3.5 h-3.5 text-cyan-500" />
                            <span>{currentSheet.startDate} تا {currentSheet.endDate}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                            {currentSheet.records.length.toLocaleString('fa-IR')} روز کاری/تعطیل
                        </span>

                        {isAdmin && timesheets.length > 1 && (
                            <button
                                onClick={() => onDeleteSheet(currentSheet.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title={`حذف کارنامه ${currentSheet.employeeName}`}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Quick-Access Pills for All Staff */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] font-bold text-slate-400 shrink-0 ml-1">پرسنل:</span>
                {timesheets.map(sheet => {
                    const isSelected = sheet.id === selectedSheetId;
                    return (
                        <button
                            key={sheet.id}
                            onClick={() => onSelectSheetId(sheet.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                isSelected 
                                ? 'bg-emerald-600 text-white shadow-xs' 
                                : 'bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            <span>{sheet.employeeName}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>
                                کد: {sheet.employeeCode}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
