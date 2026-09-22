import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, 
    Save, 
    Calendar, 
    Clock, 
    User, 
    UserPlus, 
    AlertCircle, 
    CheckCircle2, 
    Sparkles, 
    Briefcase,
    Building2,
    Check
} from 'lucide-react';
import type { EmployeeTimesheet, TimesheetDayRecord } from '../../types';
import { 
    createManualTimesheet, 
    addOrUpdateManualDayRecord, 
    recalculateDayRecord 
} from '../../services/timesheetService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedOrNewSheet: EmployeeTimesheet) => Promise<void> | void;
    existingSheets?: EmployeeTimesheet[];
    timesheets?: EmployeeTimesheet[];
    selectedSheetId?: string;
    defaultEmployeeName?: string;
    currentEmployeeName?: string;
    currentEmployeeCode?: string;
    isAdmin?: boolean;
}

const DAYS_OF_WEEK = [
    'شنبه',
    'یکشنبه',
    'دوشنبه',
    'سه شنبه',
    'چهارشنبه',
    'پنج شنبه',
    'جمعه'
];

const STATUS_OPTIONS = [
    { value: 'کاری', label: 'حضور عادی (کاری)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { value: 'مرخصی استحقاقی', label: 'مرخصی استحقاقی (روزانه)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { value: 'مرخصی ساعتی', label: 'مرخصی ساعتی', color: 'text-orange-700 bg-orange-50 border-orange-200' },
    { value: 'مرخصی استعلاجی', label: 'مرخصی استعلاجی', color: 'text-pink-700 bg-pink-50 border-pink-200' },
    { value: 'ماموریت', label: 'ماموریت اداری', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { value: 'تعطیل', label: 'تعطیل رسمی / جمعه', color: 'text-slate-700 bg-slate-100 border-slate-200' }
];

export const AttendanceManualEntryModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSave,
    existingSheets,
    timesheets,
    selectedSheetId,
    defaultEmployeeName,
    currentEmployeeName,
    currentEmployeeCode = '',
    isAdmin = true
}) => {
    const safeSheets = useMemo(() => existingSheets || timesheets || [], [existingSheets, timesheets]);
    const empName = defaultEmployeeName || currentEmployeeName || '';

    const [entryMode, setEntryMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
    const [targetSheetId, setTargetSheetId] = useState<string>('');
    const [newEmployeeName, setNewEmployeeName] = useState<string>('');
    const [newEmployeeCode, setNewEmployeeCode] = useState<string>('');
    
    // Day details
    const [date, setDate] = useState<string>('');
    const [dayOfWeek, setDayOfWeek] = useState<string>('شنبه');
    const [status, setStatus] = useState<string>('کاری');
    const [dutyTime, setDutyTime] = useState<string>('07:00');
    
    // Punches
    const [morningEntry, setMorningEntry] = useState<string>('08:30');
    const [morningExit, setMorningExit] = useState<string>('14:30');
    const [afternoonEntry, setAfternoonEntry] = useState<string>('17:00');
    const [afternoonExit, setAfternoonExit] = useState<string>('20:00');
    const [leaveTime, setLeaveTime] = useState<string>('0:00');
    const [missionTime, setMissionTime] = useState<string>('0:00');
    
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize defaults on modal open
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setIsSaving(false);
            
            // Set Persian date default if empty
            if (!date) {
                const now = new Date();
                const year = 1405;
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                setDate(`${year}/${month}/${day}`);
            }

            if (safeSheets.length > 0) {
                const defaultSheet = safeSheets.find(s => s.id === selectedSheetId) || safeSheets[0];
                setTargetSheetId(defaultSheet.id);
                setEntryMode('EXISTING');
            } else {
                setEntryMode('NEW');
                if (empName) {
                    setNewEmployeeName(empName);
                    setNewEmployeeCode(currentEmployeeCode || '1');
                }
            }
        }
    }, [isOpen, selectedSheetId, safeSheets, empName, currentEmployeeCode]);

    // Live Calculation of the record
    const liveCalculatedRecord = useMemo(() => {
        const dummy: TimesheetDayRecord = {
            id: 'temp_preview',
            dayOfWeek,
            date: date || '1405/01/01',
            morningEntry: morningEntry || '0:00',
            morningExit: morningExit || '0:00',
            afternoonEntry: afternoonEntry || '0:00',
            afternoonExit: afternoonExit || '0:00',
            dutyHours: dutyTime || '07:00',
            presence: '0:00',
            workTime: '0:00',
            morningDelay: '0:00',
            morningEarlyExit: '0:00',
            afternoonEarlyExit: '0:00',
            unauthorizedDelay: '0:00',
            holidayOvertime: '0:00',
            finalWorkTime: '0:00',
            leaveDuty: '0:00',
            leaveTime: leaveTime || '0:00',
            missionTime: missionTime || '0:00',
            punchesCount: 4,
            status,
            overtime: '0:00',
            deficit: '0:00'
        };
        return recalculateDayRecord(dummy);
    }, [dayOfWeek, date, morningEntry, morningExit, afternoonEntry, afternoonExit, dutyTime, status, leaveTime, missionTime]);

    if (!isOpen) return null;

    const handleApplyPreset = (preset: 'FULL_DAY' | 'MORNING_ONLY' | 'HOLIDAY' | 'LEAVE') => {
        if (preset === 'FULL_DAY') {
            setStatus('کاری');
            setMorningEntry('08:30');
            setMorningExit('14:30');
            setAfternoonEntry('17:00');
            setAfternoonExit('20:00');
            setDutyTime('07:00');
            setLeaveTime('0:00');
            setMissionTime('0:00');
        } else if (preset === 'MORNING_ONLY') {
            setStatus('کاری');
            setMorningEntry('08:30');
            setMorningExit('14:00');
            setAfternoonEntry('0:00');
            setAfternoonExit('0:00');
            setDutyTime('05:00');
            setLeaveTime('0:00');
            setMissionTime('0:00');
        } else if (preset === 'HOLIDAY') {
            setStatus('تعطیل');
            setMorningEntry('0:00');
            setMorningExit('0:00');
            setAfternoonEntry('0:00');
            setAfternoonExit('0:00');
            setDutyTime('0');
            setLeaveTime('0:00');
            setMissionTime('0:00');
        } else if (preset === 'LEAVE') {
            setStatus('مرخصی استحقاقی');
            setMorningEntry('0:00');
            setMorningExit('0:00');
            setAfternoonEntry('0:00');
            setAfternoonExit('0:00');
            setDutyTime('07:00');
            setLeaveTime('07:00');
            setMissionTime('0:00');
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!date || !date.includes('/')) {
            setError('لطفاً تاریخ را با فرمت صحیح شمسی وارد کنید (مثال: 1405/06/15)');
            return;
        }

        setIsSaving(true);
        try {
            let resultingSheet: EmployeeTimesheet;

            if (entryMode === 'EXISTING') {
                const targetSheet = safeSheets.find(s => s.id === targetSheetId);
                if (!targetSheet) {
                    throw new Error('کارنامه پرسنل مورد نظر یافت نشد.');
                }
                resultingSheet = addOrUpdateManualDayRecord(targetSheet, {
                    dayOfWeek,
                    date,
                    morningEntry,
                    morningExit,
                    afternoonEntry,
                    afternoonExit,
                    dutyHours: dutyTime,
                    status,
                    leaveTime,
                    missionTime
                });
            } else {
                if (!newEmployeeName.trim()) {
                    throw new Error('لطفاً نام و نام خانوادگی پرسنل را وارد کنید.');
                }
                resultingSheet = createManualTimesheet(
                    newEmployeeName.trim(),
                    newEmployeeCode.trim() || String(safeSheets.length + 1),
                    date,
                    date,
                    {
                        dayOfWeek,
                        date,
                        morningEntry,
                        morningExit,
                        afternoonEntry,
                        afternoonExit,
                        dutyHours: dutyTime,
                        status,
                        leaveTime,
                        missionTime
                    }
                );
            }

            await onSave(resultingSheet);
            onClose();
        } catch (err: any) {
            setError(err.message || 'خطا در ثبت و ارسال اطلاعات به سرور');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-slate-100 text-base">
                                ثبت دستی کارکرد و تردد پرسنل
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                افزودن یا ویرایش سوابق تردد با محاسبه هوشمند و ارسال مستقیم به وب‌هوک
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="mt-5 space-y-5">
                    {/* Mode Toggle (if admin and existing sheets exist) */}
                    {isAdmin && safeSheets.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setEntryMode('EXISTING')}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    entryMode === 'EXISTING'
                                        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                ثبت برای پرسنل موجود
                            </button>
                            <button
                                type="button"
                                onClick={() => setEntryMode('NEW')}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    entryMode === 'NEW'
                                        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <UserPlus className="w-4 h-4" />
                                ایجاد کارنامه پرسنل جدید
                            </button>
                        </div>
                    )}

                    {/* Employee Target Selection */}
                    {entryMode === 'EXISTING' && safeSheets.length > 0 ? (
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                انتخاب پرسنل
                            </label>
                            <select
                                value={targetSheetId}
                                onChange={(e) => setTargetSheetId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            >
                                {safeSheets.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.employeeName} (کد: {s.employeeCode}) - {s.records?.length || 0} روز ثبت شده
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    نام و نام خانوادگی پرسنل *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: علیرضا حسینی"
                                    value={newEmployeeName}
                                    onChange={(e) => setNewEmployeeName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    کد پرسنلی
                                </label>
                                <input
                                    type="text"
                                    placeholder="مثال: 101"
                                    value={newEmployeeCode}
                                    onChange={(e) => setNewEmployeeCode(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Quick Presets */}
                    <div>
                        <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                            الگوهای سریع تردد:
                        </span>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleApplyPreset('FULL_DAY')}
                                className="px-3 py-1.5 text-[11px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 rounded-xl border border-sky-200 dark:border-sky-800 transition-colors"
                            >
                                روز کاری کامل (صبح + عصر)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyPreset('MORNING_ONLY')}
                                className="px-3 py-1.5 text-[11px] font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 rounded-xl border border-cyan-200 dark:border-cyan-800 transition-colors"
                            >
                                شیفت صبح (پنجشنبه)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyPreset('LEAVE')}
                                className="px-3 py-1.5 text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-xl border border-amber-200 dark:border-amber-800 transition-colors"
                            >
                                مرخصی روزانه
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyPreset('HOLIDAY')}
                                className="px-3 py-1.5 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors"
                            >
                                تعطیل رسمی / جمعه
                            </button>
                        </div>
                    </div>

                    {/* Date and Day of Week */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                تاریخ شمسی *
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: 1405/06/15"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 pl-10"
                                />
                                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                روز هفته
                            </label>
                            <select
                                value={dayOfWeek}
                                onChange={(e) => setDayOfWeek(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            >
                                {DAYS_OF_WEEK.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Status & Duty Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                وضعیت روز
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                ساعت موظفی روز
                            </label>
                            <input
                                type="text"
                                placeholder="07:00"
                                value={dutyTime}
                                onChange={(e) => setDutyTime(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                    </div>

                    {/* Punches Grid */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                ثبت ساعات تردد (ورود و خروج)
                            </span>
                            <span className="text-[11px] text-slate-400">فرمت: HH:MM یا 0</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div>
                                <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                                    ورود صبح
                                </label>
                                <input
                                    type="text"
                                    placeholder="08:30"
                                    value={morningEntry}
                                    onChange={(e) => setMorningEntry(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-3 py-2 text-xs font-black text-center text-slate-800 dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-sky-700 dark:text-sky-400 mb-1">
                                    خروج صبح
                                </label>
                                <input
                                    type="text"
                                    placeholder="14:30"
                                    value={morningExit}
                                    onChange={(e) => setMorningExit(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800/60 rounded-xl px-3 py-2 text-xs font-black text-center text-slate-800 dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                                    ورود عصر
                                </label>
                                <input
                                    type="text"
                                    placeholder="17:00"
                                    value={afternoonEntry}
                                    onChange={(e) => setAfternoonEntry(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/60 rounded-xl px-3 py-2 text-xs font-black text-center text-slate-800 dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-purple-700 dark:text-purple-400 mb-1">
                                    خروج عصر
                                </label>
                                <input
                                    type="text"
                                    placeholder="20:00"
                                    value={afternoonExit}
                                    onChange={(e) => setAfternoonExit(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/60 rounded-xl px-3 py-2 text-xs font-black text-center text-slate-800 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        {/* Secondary optional: Leave / Mission duration */}
                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                            <div>
                                <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">
                                    مدت مرخصی ساعتی
                                </label>
                                <input
                                    type="text"
                                    placeholder="0:00"
                                    value={leaveTime}
                                    onChange={(e) => setLeaveTime(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-center text-slate-800 dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-cyan-700 dark:text-cyan-400 mb-1">
                                    مدت ماموریت اداری
                                </label>
                                <input
                                    type="text"
                                    placeholder="0:00"
                                    value={missionTime}
                                    onChange={(e) => setMissionTime(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-center text-slate-800 dark:text-slate-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Real-time Calculation Summary Badge */}
                    <div className="p-3 bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold">
                            <Sparkles className="w-4 h-4 text-sky-600" />
                            <span>محاسبه هوشمند برخط:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-slate-600 dark:text-slate-400">
                                حضور: <strong className="text-slate-900 dark:text-slate-100">{liveCalculatedRecord.presence}</strong>
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                                اضافه کار: <strong className="text-emerald-600 dark:text-emerald-400">{liveCalculatedRecord.overtime}</strong>
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                                تاخیر/کسر: <strong className="text-rose-600 dark:text-rose-400">{liveCalculatedRecord.deficit}</strong>
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                                کارکرد نهایی: <strong className="text-sky-700 dark:text-sky-400">{liveCalculatedRecord.finalWorkTime}</strong>
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            انصراف
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-black shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSaving ? 'در حال ذخیره در وب‌هوک...' : 'ذخیره و ارسال به سرور'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
