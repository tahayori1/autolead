
import React, { useState, useEffect } from 'react';

// Make moment available from the global scope (loaded via CDN)
declare const moment: any;

interface PersianDatePickerProps {
    value: string; // YYYY-MM-DD or YYYY-MM-DD HH:mm or jYYYY/jMM/jDD
    onChange: (date: string) => void;
    enableTime?: boolean;
    placeholder?: string;
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({ value, onChange, enableTime = false, placeholder }) => {
    
    // Output format is always Jalali string with padding
    const outputFormat = enableTime ? 'jYYYY/jMM/jDD HH:mm' : 'jYYYY/jMM/jDD';

    // Helper to parse input value safely
    const parseValue = (val: string) => {
        if (!val) return null;
        
        // Normalize Persian/Arabic digits to English
        const normalizedVal = val.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                                 .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

        let m;
        // Check for Jalali format (slash separator)
        if (normalizedVal.includes('/')) {
            // Use jM/jD to allow parsing 1403/2/1 as well as 1403/02/01
            // Use loose parsing (strict=false is default) to handle missing time or extra spaces
            const parseFormat = enableTime && normalizedVal.includes(':') ? 'jYYYY/jM/jD HH:mm' : 'jYYYY/jM/jD';
            m = moment(normalizedVal, parseFormat);
        } else {
            // Assume Gregorian ISO (dash separator or standard date string)
            m = moment(normalizedVal);
        }

        return m.isValid() ? m.locale('fa') : null;
    };

    const [selectedDate, setSelectedDate] = useState(() => parseValue(value));
    const [displayDate, setDisplayDate] = useState(() => (selectedDate ? selectedDate.clone() : moment().locale('fa')));
    
    // Initialize time with value or current time
    const [time, setTime] = useState(() => {
        const m = parseValue(value);
        if (m) return { hour: m.format('HH'), minute: m.format('mm') };
        const now = moment();
        return { hour: now.format('HH'), minute: now.format('mm') };
    });
    
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const m = parseValue(value);
        // Only update state if the new value is actually different/valid to avoid loops
        if (m && (!selectedDate || !m.isSame(selectedDate))) {
            setSelectedDate(m);
            if (!isOpen) setDisplayDate(m.clone());
            if (enableTime) {
                setTime({
                    hour: m.format('HH'),
                    minute: m.format('mm')
                });
            }
        } else if (!value && selectedDate) {
            setSelectedDate(null);
        }
    }, [value, enableTime]);

    // Update time to current when opening if no value is set
    useEffect(() => {
        if (isOpen && !selectedDate) {
            const now = moment();
            setTime({ hour: now.format('HH'), minute: now.format('mm') });
        }
    }, [isOpen, selectedDate]);

    const changeMonth = (amount: number) => {
        setDisplayDate(prev => prev.clone().add(amount, 'jMonth'));
    };

    const handleDayClick = (day: any) => {
        const newSelectedDate = day.clone();
        
        if (enableTime) {
            newSelectedDate.hour(parseInt(time.hour));
            newSelectedDate.minute(parseInt(time.minute));
        }
        
        // Ensure we format as Jalali string
        const finalString = newSelectedDate.locale('fa').format(outputFormat);
        onChange(finalString);
        setSelectedDate(newSelectedDate);
        
        if (!enableTime) {
            setIsOpen(false);
        }
    };

    const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
        let numericVal = parseInt(val);
        if (isNaN(numericVal)) numericVal = 0;
        
        if (type === 'hour') numericVal = Math.min(23, Math.max(0, numericVal));
        if (type === 'minute') numericVal = Math.min(59, Math.max(0, numericVal));

        const strVal = numericVal.toString().padStart(2, '0');
        const newTime = { ...time, [type]: strVal };
        setTime(newTime);

        if (selectedDate) {
            const newDate = selectedDate.clone();
            newDate.hour(parseInt(newTime.hour));
            newDate.minute(parseInt(newTime.minute));
            onChange(newDate.locale('fa').format(outputFormat));
            setSelectedDate(newDate);
        }
    };

    const handleConfirm = () => {
        if (!selectedDate) {
            // If no date selected, select today with current time
            const now = moment().locale('fa');
            if (enableTime) {
                now.hour(parseInt(time.hour));
                now.minute(parseInt(time.minute));
            }
            const finalString = now.format(outputFormat);
            onChange(finalString);
            setSelectedDate(now);
        }
        setIsOpen(false);
    };

    const handleNow = () => {
        const now = moment().locale('fa');
        setSelectedDate(now);
        setDisplayDate(now.clone());
        
        if (enableTime) {
            setTime({
                hour: now.format('HH'),
                minute: now.format('mm')
            });
        }
        
        onChange(now.format(outputFormat));
        
        // If it's just a date picker, we can close immediately. 
        // If it has time, usually "Now" implies exact current time, so we can also close or leave open for adjustment.
        // Let's close it for convenience as requested by "Now" button semantics.
        setIsOpen(false); 
    };

    const renderCalendarModal = () => {
        const startOfMonth = displayDate.clone().startOf('jMonth');
        
        // Jalali calendar usually starts on Saturday
        const startOfWeek = startOfMonth.clone().startOf('week');
        
        const days = [];
        let day = startOfWeek.clone();

        // Render 6 weeks (42 days) to cover all month layouts
        for (let i = 0; i < 42; i++) {
             days.push(day.clone());
             day.add(1, 'day');
        }

        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm overflow-hidden flex flex-col max-h-[90vh] animate-scale-up" onClick={e => e.stopPropagation()}>
                    
                    {/* Header: Month Navigation */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                        <div className="font-bold text-slate-800 dark:text-white text-lg">
                            {displayDate.format('jMMMM jYYYY')}
                        </div>
                        <button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-500 transition-colors">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="p-4">
                        <div className="grid grid-cols-7 text-center text-xs text-slate-400 mb-3 font-bold">
                            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((wd) => <div key={wd}>{wd}</div>)}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-2">
                            {days.map((d, i) => {
                                const isCurrentMonth = d.isSame(displayDate, 'jMonth');
                                const isSelected = selectedDate && d.isSame(selectedDate, 'day');
                                const isToday = d.isSame(moment(), 'day');
                                
                                let classes = "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-sm cursor-pointer transition-all duration-200 ";
                                
                                if (!isCurrentMonth) {
                                    classes += "text-slate-300 dark:text-slate-600";
                                } else if (isSelected) {
                                    classes += "bg-sky-600 text-white font-bold shadow-lg shadow-sky-200 dark:shadow-none transform scale-110";
                                } else if (isToday) {
                                    classes += "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white font-bold border border-slate-300 dark:border-slate-500";
                                } else {
                                    classes += "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105";
                                }
                                
                                return (
                                    <div key={i} onClick={() => handleDayClick(d)} className="flex justify-center">
                                        <div className={classes}>
                                            {d.format('jD')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time Picker Section */}
                    {enableTime && (
                        <div className="border-t border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/30">
                            <div className="flex items-center justify-center gap-4" dir="ltr">
                                <div className="flex flex-col items-center">
                                    <label className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">ساعت</label>
                                    <input 
                                        type="number" 
                                        className="w-16 p-2 text-center text-xl font-bold border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                                        value={time.hour}
                                        onChange={(e) => handleTimeChange('hour', e.target.value)}
                                        min="0" max="23"
                                    />
                                </div>
                                <span className="text-slate-300 text-2xl font-bold mt-4">:</span>
                                <div className="flex flex-col items-center">
                                    <label className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">دقیقه</label>
                                    <input 
                                        type="number" 
                                        className="w-16 p-2 text-center text-xl font-bold border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                                        value={time.minute}
                                        onChange={(e) => handleTimeChange('minute', e.target.value)}
                                        min="0" max="59"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
                        <div className="flex gap-2">
                            <button onClick={() => { onChange(''); setSelectedDate(null); setIsOpen(false); }} className="text-sm text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors">
                                پاک کردن
                            </button>
                            <button onClick={handleNow} className="text-sm text-sky-600 font-bold hover:bg-sky-50 dark:hover:bg-sky-900/20 px-3 py-2 rounded-lg transition-colors">
                                {enableTime ? 'هم‌اکنون' : 'امروز'}
                            </button>
                        </div>
                        <button onClick={handleConfirm} className="bg-sky-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-sky-700 transition-transform active:scale-95">
                            تایید
                        </button>
                    </div>
                </div>
                <style>{`
                    @keyframes scale-up {
                        from { transform: scale(0.95); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    .animate-scale-up {
                        animation: scale-up 0.2s ease-out forwards;
                    }
                    @keyframes fade-in {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    .animate-fade-in {
                        animation: fade-in 0.2s ease-out forwards;
                    }
                `}</style>
            </div>
        );
    };

    // Ensure display value is always up to date and correct
    const displayValue = selectedDate ? selectedDate.clone().locale('fa').format(outputFormat) : '';

    return (
        <>
            <div onClick={() => setIsOpen(true)} className="relative cursor-pointer group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 group-hover:text-sky-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <input
                    type="text"
                    readOnly
                    value={displayValue}
                    placeholder={placeholder || 'انتخاب تاریخ'}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-left font-mono cursor-pointer focus:ring-2 focus:ring-sky-500 outline-none transition-all bg-white"
                    dir="ltr"
                />
            </div>
            {isOpen && renderCalendarModal()}
        </>
    );
};

export default PersianDatePicker;
