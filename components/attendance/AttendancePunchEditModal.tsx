import React, { useState, useEffect, useMemo } from 'react';
import { 
    Clock, 
    X, 
    Check, 
    AlertCircle, 
    Calendar, 
    Coffee, 
    Sun, 
    Moon, 
    ShieldCheck, 
    RotateCcw,
    FileText,
    TrendingUp,
    Hourglass
} from 'lucide-react';
import type { TimesheetDayRecord } from '../../types';
import { 
    recalculateDayRecord, 
    parseTimeToMinutes, 
    formatMinutesToTime 
} from '../../services/timesheetService';

interface Props {
    isOpen: boolean;
    record: TimesheetDayRecord;
    employeeName: string;
    onClose: () => void;
    onSave: (updatedRecord: TimesheetDayRecord) => Promise<void> | void;
    onRequestLeave?: (date: string) => void;
    onRequestOvertime?: (date: string, calculatedHours?: number) => void;
}

export const AttendancePunchEditModal: React.FC<Props> = ({
    isOpen,
    record,
    employeeName,
    onClose,
    onSave,
    onRequestLeave,
    onRequestOvertime
}) => {
    const [formData, setFormData] = useState<TimesheetDayRecord>({ ...record });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData({ ...record });
    }, [record]);

    // Live recalculation
    const calculated = useMemo(() => {
        return recalculateDayRecord(formData);
    }, [formData]);

    if (!isOpen) return null;

    const handleFieldChange = (field: keyof TimesheetDayRecord, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleApplyPreset = (type: 'STANDARD' | 'MORNING_ONLY' | 'LEAVE' | 'CLEAR_DELAY' | 'CLEAR_AFTERNOON') => {
        if (type === 'STANDARD') {
            setFormData(prev => ({
                ...prev,
                morningEntry: '08:30',
                morningExit: '14:00',
                afternoonEntry: '17:00',
                afternoonExit: '20:00',
                dutyHours: '07:00',
                status: 'کاری'
            }));
        } else if (type === 'MORNING_ONLY') {
            setFormData(prev => ({
                ...prev,
                morningEntry: '08:30',
                morningExit: '15:30',
                afternoonEntry: '0',
                afternoonExit: '0',
                dutyHours: '07:00',
                status: 'کاری'
            }));
        } else if (type === 'LEAVE') {
            setFormData(prev => ({
                ...prev,
                status: 'مرخصی استحقاقی',
                morningEntry: '0',
                morningExit: '0',
                afternoonEntry: '0',
                afternoonExit: '0'
            }));
        } else if (type === 'CLEAR_DELAY') {
            setFormData(prev => ({
                ...prev,
                morningEntry: '08:30',
                morningDelay: '0',
                unauthorizedDelay: '0'
            }));
        } else if (type === 'CLEAR_AFTERNOON') {
            setFormData(prev => ({
                ...prev,
                afternoonEntry: '0',
                afternoonExit: '0'
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(calculated);
            onClose();
        } catch (err) {
            console.error('Error saving day record:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const overtimeHoursNum = Math.round((parseTimeToMinutes(calculated.overtime) / 60) * 10) / 10;

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
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-2xl">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-white text-base">
                                ویرایش تردد و ساعات کارکرد روزانه
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>کارمند: <strong>{employeeName}</strong></span>
                                <span>•</span>
                                <span>{formData.dayOfWeek} {formData.date}</span>
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

                {/* Quick Presets */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                        <span>الگوهای سریع تردد:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleApplyPreset('STANDARD')}
                            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors shadow-2xs"
                        >
                            ☀️ شیفت دوشیفته استاندارد (۸:۳۰-۱۴ و ۱۷-۲۰)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleApplyPreset('MORNING_ONLY')}
                            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors shadow-2xs"
                        >
                            🌅 شیفت یکسره صبح (۸:۳۰ تا ۱۵:۳۰)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleApplyPreset('CLEAR_DELAY')}
                            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                        >
                            ⚡ بخشش تاخیر صبح
                        </button>
                        <button
                            type="button"
                            onClick={() => handleApplyPreset('CLEAR_AFTERNOON')}
                            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-slate-400 transition-colors shadow-2xs"
                        >
                            حذف تردد عصر
                        </button>
                        <button
                            type="button"
                            onClick={() => handleApplyPreset('LEAVE')}
                            className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors"
                        >
                            ثبت به عنوان مرخصی
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Punches Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Morning Shift */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                                <Sun className="w-4 h-4 text-amber-500" />
                                <span>شیفت صبح</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-[11px] text-slate-500 mb-1">ورود صبح</label>
                                    <input
                                        type="text"
                                        value={formData.morningEntry === '0' ? '' : formData.morningEntry}
                                        onChange={e => handleFieldChange('morningEntry', e.target.value)}
                                        placeholder="08:30"
                                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center focus:border-blue-500 focus:outline-hidden"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-slate-500 mb-1">خروج صبح</label>
                                    <input
                                        type="text"
                                        value={formData.morningExit === '0' ? '' : formData.morningExit}
                                        onChange={e => handleFieldChange('morningExit', e.target.value)}
                                        placeholder="14:00"
                                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center focus:border-blue-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Afternoon Shift */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                                <Moon className="w-4 h-4 text-indigo-500" />
                                <span>شیفت عصر</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-[11px] text-slate-500 mb-1">ورود عصر</label>
                                    <input
                                        type="text"
                                        value={formData.afternoonEntry === '0' ? '' : formData.afternoonEntry}
                                        onChange={e => handleFieldChange('afternoonEntry', e.target.value)}
                                        placeholder="17:00"
                                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center focus:border-blue-500 focus:outline-hidden"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-slate-500 mb-1">خروج عصر</label>
                                    <input
                                        type="text"
                                        value={formData.afternoonExit === '0' ? '' : formData.afternoonExit}
                                        onChange={e => handleFieldChange('afternoonExit', e.target.value)}
                                        placeholder="20:00"
                                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center focus:border-blue-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Duty & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                ساعت موظفی روز
                            </label>
                            <input
                                type="text"
                                value={formData.dutyHours}
                                onChange={e => handleFieldChange('dutyHours', e.target.value)}
                                placeholder="07:00"
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                وضعیت روز
                            </label>
                            <select
                                value={formData.status}
                                onChange={e => handleFieldChange('status', e.target.value)}
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-hidden"
                            >
                                <option value="کاری">کاری</option>
                                <option value="مرخصی استحقاقی">مرخصی استحقاقی</option>
                                <option value="مرخصی ساعتی">مرخصی ساعتی</option>
                                <option value="تعطیل رسمی">تعطیل رسمی</option>
                                <option value="تعطیل جمعه">تعطیل جمعه</option>
                                <option value="ماموریت اداری">ماموریت اداری</option>
                            </select>
                        </div>
                    </div>

                    {/* Real-time Calculation Result Box */}
                    <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2">
                        <div className="text-xs font-black text-blue-900 dark:text-blue-200 flex items-center justify-between">
                            <span>محاسبه آنی کارکرد با تغییرات جاری:</span>
                            <span className="font-mono text-xs">{calculated.punchesCount} تردد ثبت شده</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                                <span className="text-[11px] text-slate-500 block">حضور کل:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{calculated.presence}</span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                                <span className="text-[11px] text-slate-500 block">کارکرد نهایی:</span>
                                <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{calculated.finalWorkTime}</span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                                <span className="text-[11px] text-emerald-600 block font-medium">اضافه کار:</span>
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">+{calculated.overtime}</span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                                <span className="text-[11px] text-rose-600 block font-medium">کسر کار / تاخیر:</span>
                                <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                                    {calculated.deficit !== '0' && calculated.deficit !== '0:00' ? `-${calculated.deficit}` : (calculated.morningDelay !== '0' ? calculated.morningDelay : '-')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Connected Requests Quick Actions */}
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                        {onRequestLeave && (
                            <button
                                type="button"
                                onClick={() => onRequestLeave(formData.date)}
                                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                                <Coffee className="w-3.5 h-3.5" />
                                <span>ثبت درخواست مرخصی برای این روز</span>
                            </button>
                        )}
                        {onRequestOvertime && (
                            <button
                                type="button"
                                onClick={() => onRequestOvertime(formData.date, overtimeHoursNum > 0 ? overtimeHoursNum : undefined)}
                                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>ثبت درخواست اضافه کاری ({calculated.overtime})</span>
                            </button>
                        )}
                    </div>

                    {/* Footer Actions */}
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
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Check className="w-4 h-4" />
                            <span>{isSaving ? 'در حال ارسال به سرور...' : 'ثبت و ارسال به سرور (PATCH)'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
