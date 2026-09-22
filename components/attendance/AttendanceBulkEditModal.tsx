import React, { useState } from 'react';
import { 
    Clock, 
    X, 
    Check, 
    CheckSquare, 
    Layers, 
    Calendar, 
    Sun, 
    Moon, 
    RotateCcw,
    Zap
} from 'lucide-react';
import type { TimesheetDayRecord } from '../../types';

interface Props {
    isOpen: boolean;
    selectedCount: number;
    selectedDates: string[];
    employeeName: string;
    onClose: () => void;
    onSave: (updates: Partial<TimesheetDayRecord>) => Promise<void> | void;
}

export const AttendanceBulkEditModal: React.FC<Props> = ({
    isOpen,
    selectedCount,
    selectedDates,
    employeeName,
    onClose,
    onSave
}) => {
    const [applyMorningEntry, setApplyMorningEntry] = useState(false);
    const [morningEntry, setMorningEntry] = useState('08:30');

    const [applyMorningExit, setApplyMorningExit] = useState(false);
    const [morningExit, setMorningExit] = useState('14:00');

    const [applyAfternoonEntry, setApplyAfternoonEntry] = useState(false);
    const [afternoonEntry, setAfternoonEntry] = useState('17:00');

    const [applyAfternoonExit, setApplyAfternoonExit] = useState(false);
    const [afternoonExit, setAfternoonExit] = useState('20:00');

    const [applyDutyHours, setApplyDutyHours] = useState(false);
    const [dutyHours, setDutyHours] = useState('07:00');

    const [applyStatus, setApplyStatus] = useState(false);
    const [status, setStatus] = useState('کاری');

    const [clearMorningDelay, setClearMorningDelay] = useState(false);
    const [clearAfternoon, setClearAfternoon] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleApplyTemplate = (type: 'STANDARD_SHIFT' | 'MORNING_ONLY' | 'GROUP_LEAVE' | 'CLEAR_DELAYS') => {
        if (type === 'STANDARD_SHIFT') {
            setApplyMorningEntry(true);
            setMorningEntry('08:30');
            setApplyMorningExit(true);
            setMorningExit('14:00');
            setApplyAfternoonEntry(true);
            setAfternoonEntry('17:00');
            setApplyAfternoonExit(true);
            setAfternoonExit('20:00');
            setApplyDutyHours(true);
            setDutyHours('07:00');
            setApplyStatus(true);
            setStatus('کاری');
            setClearMorningDelay(true);
            setClearAfternoon(false);
        } else if (type === 'MORNING_ONLY') {
            setApplyMorningEntry(true);
            setMorningEntry('08:30');
            setApplyMorningExit(true);
            setMorningExit('15:30');
            setApplyDutyHours(true);
            setDutyHours('07:00');
            setApplyStatus(true);
            setStatus('کاری');
            setClearAfternoon(true);
            setApplyAfternoonEntry(false);
            setApplyAfternoonExit(false);
        } else if (type === 'GROUP_LEAVE') {
            setApplyStatus(true);
            setStatus('مرخصی استحقاقی');
            setApplyMorningEntry(true);
            setMorningEntry('0');
            setApplyMorningExit(true);
            setMorningExit('0');
            setApplyAfternoonEntry(true);
            setAfternoonEntry('0');
            setApplyAfternoonExit(true);
            setAfternoonExit('0');
            setClearMorningDelay(true);
        } else if (type === 'CLEAR_DELAYS') {
            setClearMorningDelay(true);
            setApplyMorningEntry(true);
            setMorningEntry('08:30');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const updates: Partial<TimesheetDayRecord> = {};

        if (applyMorningEntry) updates.morningEntry = morningEntry;
        if (applyMorningExit) updates.morningExit = morningExit;

        if (clearAfternoon) {
            updates.afternoonEntry = '0';
            updates.afternoonExit = '0';
        } else {
            if (applyAfternoonEntry) updates.afternoonEntry = afternoonEntry;
            if (applyAfternoonExit) updates.afternoonExit = afternoonExit;
        }

        if (applyDutyHours) updates.dutyHours = dutyHours;
        if (applyStatus) updates.status = status;

        if (clearMorningDelay) {
            updates.morningDelay = '0';
            updates.unauthorizedDelay = '0';
        }

        if (Object.keys(updates).length === 0 && !clearMorningDelay && !clearAfternoon) {
            alert('لطفاً حداقل یک مورد را برای تغییر گروهی تیک بزنید.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(updates);
            onClose();
        } catch (err) {
            console.error('Error saving bulk updates:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in font-vazir"
            onClick={onClose}
            dir="rtl"
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-700 space-y-5 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-2xl">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-white text-base">
                                ویرایش گروهی تردد و ورود و خروج‌ها
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                اعمال تغییرات همزمان روی <strong>{selectedCount} روز انتخابی</strong> ({employeeName})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Selected Dates Summary Badges */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                    <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>تاریخ‌های انتخاب شده ({selectedCount} روز):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {selectedDates.map((d, i) => (
                            <span 
                                key={i} 
                                className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono text-slate-700 dark:text-slate-300 shadow-2xs"
                            >
                                {d}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Quick Bulk Templates */}
                <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>الگوهای سریع آماده:</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleApplyTemplate('STANDARD_SHIFT')}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-colors"
                        >
                            تنظیم ساعت اداری دوشیفته (۸:۳۰-۱۴ و ۱۷-۲۰)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleApplyTemplate('MORNING_ONLY')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                        >
                            تنظیم یکسره صبح (۸:۳۰ تا ۱۵:۳۰)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleApplyTemplate('CLEAR_DELAYS')}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition-colors"
                        >
                            بخشش تاخیر روزهای انتخابی
                        </button>
                        <button
                            type="button"
                            onClick={() => handleApplyTemplate('GROUP_LEAVE')}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold transition-colors"
                        >
                            ثبت مرخصی گروهی برای این روزها
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <p className="text-[11px] text-slate-500">
                        فیلدهایی که مایلید روی تمام روزهای انتخاب‌شده اعمال شوند را تیک بزنید:
                    </p>

                    {/* Checkbox fields list */}
                    <div className="space-y-3">
                        {/* Morning Shift */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                <Sun className="w-4 h-4 text-amber-500" />
                                <span>شیفت صبح</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="bulk-morning-entry"
                                        checked={applyMorningEntry}
                                        onChange={e => setApplyMorningEntry(e.target.checked)}
                                        className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="bulk-morning-entry" className="text-xs text-slate-700 dark:text-slate-300 select-none">
                                        ورود صبح:
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!applyMorningEntry}
                                        value={morningEntry}
                                        onChange={e => setMorningEntry(e.target.value)}
                                        className="w-24 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-center disabled:opacity-40"
                                        placeholder="08:30"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="bulk-morning-exit"
                                        checked={applyMorningExit}
                                        onChange={e => setApplyMorningExit(e.target.checked)}
                                        className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="bulk-morning-exit" className="text-xs text-slate-700 dark:text-slate-300 select-none">
                                        خروج صبح:
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!applyMorningExit}
                                        value={morningExit}
                                        onChange={e => setMorningExit(e.target.value)}
                                        className="w-24 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-center disabled:opacity-40"
                                        placeholder="14:00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Afternoon Shift */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                    <Moon className="w-4 h-4 text-indigo-500" />
                                    <span>شیفت عصر</span>
                                </div>
                                <label className="flex items-center gap-1.5 text-xs text-rose-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={clearAfternoon}
                                        onChange={e => setClearAfternoon(e.target.checked)}
                                        className="w-4 h-4 rounded-md text-rose-600 focus:ring-rose-500"
                                    />
                                    <span>حذف تردد عصر برای این روزها</span>
                                </label>
                            </div>

                            {!clearAfternoon && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="bulk-afternoon-entry"
                                            checked={applyAfternoonEntry}
                                            onChange={e => setApplyAfternoonEntry(e.target.checked)}
                                            className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="bulk-afternoon-entry" className="text-xs text-slate-700 dark:text-slate-300 select-none">
                                            ورود عصر:
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!applyAfternoonEntry}
                                            value={afternoonEntry}
                                            onChange={e => setAfternoonEntry(e.target.value)}
                                            className="w-24 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-center disabled:opacity-40"
                                            placeholder="17:00"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="bulk-afternoon-exit"
                                            checked={applyAfternoonExit}
                                            onChange={e => setApplyAfternoonExit(e.target.checked)}
                                            className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="bulk-afternoon-exit" className="text-xs text-slate-700 dark:text-slate-300 select-none">
                                            خروج عصر:
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!applyAfternoonExit}
                                            value={afternoonExit}
                                            onChange={e => setAfternoonExit(e.target.value)}
                                            className="w-24 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-center disabled:opacity-40"
                                            placeholder="20:00"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Duty & Status & Delay forgiveness */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="bulk-duty"
                                        checked={applyDutyHours}
                                        onChange={e => setApplyDutyHours(e.target.checked)}
                                        className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="bulk-duty" className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                                        ساعت موظفی:
                                    </label>
                                </div>
                                <input
                                    type="text"
                                    disabled={!applyDutyHours}
                                    value={dutyHours}
                                    onChange={e => setDutyHours(e.target.value)}
                                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center disabled:opacity-40"
                                    placeholder="07:00"
                                />
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="bulk-status"
                                        checked={applyStatus}
                                        onChange={e => setApplyStatus(e.target.checked)}
                                        className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="bulk-status" className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                                        وضعیت روز:
                                    </label>
                                </div>
                                <select
                                    disabled={!applyStatus}
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 disabled:opacity-40"
                                >
                                    <option value="کاری">کاری</option>
                                    <option value="مرخصی استحقاقی">مرخصی استحقاقی</option>
                                    <option value="مرخصی ساعتی">مرخصی ساعتی</option>
                                    <option value="تعطیل رسمی">تعطیل رسمی</option>
                                    <option value="تعطیل جمعه">تعطیل جمعه</option>
                                    <option value="ماموریت اداری">ماموریت اداری</option>
                                </select>
                            </div>

                            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={clearMorningDelay}
                                        onChange={e => setClearMorningDelay(e.target.checked)}
                                        className="w-4 h-4 rounded-md text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                        بخشش و صفر کردن تاخیر صبح
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="flex justify-between items-center pt-3 border-t dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs"
                        >
                            انصراف
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Check className="w-4 h-4" />
                            <span>{isSaving ? 'در حال اعمال و ارسال به سرور...' : `اعمال روی ${selectedCount} روز و ذخیره در سرور (PATCH)`}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
