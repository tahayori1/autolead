import React, { useState, useEffect, useRef } from 'react';
import type { IranianPlateParts } from '../../types/bankLetter';
import { 
    IRANIAN_PLATE_LETTERS, 
    IRANIAN_PLATE_PROVINCE_CODES,
    parseIranianPlate, 
    buildIranianPlateString, 
    validateIranianLicensePlate,
    toPersianDigits,
    toEnglishDigits
} from '../../services/bankLetterValidation';
import { CheckCircle2, AlertTriangle, Car, Check, RefreshCw, Edit3, ShieldCheck } from 'lucide-react';

interface IranLicensePlateInputProps {
    value: string;
    onChange: (formattedPlate: string) => void;
}

export const IranLicensePlateInput: React.FC<IranLicensePlateInputProps> = ({
    value,
    onChange
}) => {
    // Mode: 'structured' (Standard 4-part visual plate) | 'manual' (Direct text input)
    const [inputMode, setInputMode] = useState<'structured' | 'manual'>('structured');
    
    // Internal state for structured plate components
    const [part1, setPart1] = useState<string>('');
    const [letter, setLetter] = useState<string>('ب');
    const [part2, setPart2] = useState<string>('');
    const [iranCode, setIranCode] = useState<string>('');
    const [isZeroKm, setIsZeroKm] = useState<boolean>(false);
    const [manualText, setManualText] = useState<string>(value || '');

    // Track last emitted value to avoid cyclic feedback loops
    const lastEmittedValueRef = useRef<string>(value || '');

    // Input element refs for smooth auto-focus & backspace navigation
    const part1Ref = useRef<HTMLInputElement>(null);
    const letterRef = useRef<HTMLSelectElement>(null);
    const part2Ref = useRef<HTMLInputElement>(null);
    const iranRef = useRef<HTMLInputElement>(null);

    // Synchronize when value changes externally (e.g., initial load, template reset)
    useEffect(() => {
        if (value === lastEmittedValueRef.current) {
            return;
        }

        lastEmittedValueRef.current = value || '';
        setManualText(value || '');

        if (!value) {
            setPart1('');
            setLetter('ب');
            setPart2('');
            setIranCode('');
            setIsZeroKm(false);
            return;
        }

        if (value.includes('صفر') || value.includes('فاقد') || value.includes('بدون پلاک')) {
            setIsZeroKm(true);
            setPart1('');
            setPart2('');
            setIranCode('');
            return;
        }

        const parsed = parseIranianPlate(value);
        setPart1(parsed.part1 || '');
        setLetter(parsed.letter || 'ب');
        setPart2(parsed.part2 || '');
        setIranCode(parsed.iranCode || '');
        setIsZeroKm(!!parsed.isZeroOrFree);
    }, [value]);

    // Emit changes upwards
    const emitStructuredChange = (
        newP1: string, 
        newLetter: string, 
        newP2: string, 
        newIran: string, 
        zero: boolean = false
    ) => {
        if (zero) {
            const zeroText = 'پلاک صفر کیلومتر (فاقد پلاک انتظامی)';
            lastEmittedValueRef.current = zeroText;
            setManualText(zeroText);
            onChange(zeroText);
            return;
        }

        const newParts: IranianPlateParts = {
            part1: newP1,
            letter: newLetter,
            part2: newP2,
            iranCode: newIran,
            isZeroOrFree: false
        };

        const formatted = buildIranianPlateString(newParts);
        lastEmittedValueRef.current = formatted;
        setManualText(formatted);
        onChange(formatted);
    };

    // Handler for 2-digit first section
    const handlePart1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 2);
        setPart1(raw);
        setIsZeroKm(false);
        emitStructuredChange(raw, letter, part2, iranCode, false);

        if (raw.length === 2) {
            part2Ref.current?.focus();
        }
    };

    // Handler for middle Persian letter
    const handleLetterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setLetter(val);
        setIsZeroKm(false);
        emitStructuredChange(part1, val, part2, iranCode, false);
        part2Ref.current?.focus();
    };

    // Handler for 3-digit middle section
    const handlePart2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 3);
        setPart2(raw);
        setIsZeroKm(false);
        emitStructuredChange(part1, letter, raw, iranCode, false);

        if (raw.length === 3) {
            iranRef.current?.focus();
        }
    };

    // Handler for 2-digit Iran province section
    const handleIranChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 2);
        setIranCode(raw);
        setIsZeroKm(false);
        emitStructuredChange(part1, letter, part2, raw, false);
    };

    // Backspace key navigation between inputs
    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>, 
        currentVal: string, 
        prevInput: React.RefObject<HTMLInputElement | HTMLSelectElement | null> | null
    ) => {
        if (e.key === 'Backspace' && !currentVal && prevInput && prevInput.current) {
            prevInput.current.focus();
        }
    };

    // Paste handler to automatically distribute pasted plate string
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        if (!text) return;

        const parsed = parseIranianPlate(text);
        if (parsed.isZeroOrFree) {
            setIsZeroKm(true);
            setPart1('');
            setPart2('');
            setIranCode('');
            emitStructuredChange('', 'ب', '', '', true);
        } else {
            setIsZeroKm(false);
            setPart1(parsed.part1 || '');
            setLetter(parsed.letter || 'ب');
            setPart2(parsed.part2 || '');
            setIranCode(parsed.iranCode || '');
            emitStructuredChange(
                parsed.part1 || '', 
                parsed.letter || 'ب', 
                parsed.part2 || '', 
                parsed.iranCode || '', 
                false
            );
        }
    };

    // Set Zero KM Preset
    const setZeroKmPreset = () => {
        setIsZeroKm(true);
        setPart1('');
        setPart2('');
        setIranCode('');
        emitStructuredChange('', 'ب', '', '', true);
    };

    // Set Quick Province Code
    const setQuickProvince = (code: string) => {
        setIsZeroKm(false);
        setIranCode(code);
        emitStructuredChange(part1, letter, part2, code, false);
        if (!part1 && part1Ref.current) {
            part1Ref.current.focus();
        }
    };

    // Manual Direct Text Change
    const handleManualTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setManualText(text);
        lastEmittedValueRef.current = text;
        onChange(text);
    };

    // Validation
    const currentParts: IranianPlateParts = isZeroKm 
        ? { part1: '', letter: 'ب', part2: '', iranCode: '', isZeroOrFree: true, freeText: value }
        : { part1, letter, part2, iranCode, isZeroOrFree: false };

    const validation = validateIranianLicensePlate(
        inputMode === 'structured' ? currentParts : value
    );

    return (
        <div className="space-y-3">
            {/* Top Toolbar: Mode Switch & Fast Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => {
                            setInputMode('structured');
                            if (isZeroKm) {
                                emitStructuredChange('', 'ب', '', '', true);
                            } else {
                                emitStructuredChange(part1, letter, part2, iranCode, false);
                            }
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            inputMode === 'structured'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                        }`}
                    >
                        طرح پلاک ملی ایران (۴ قسمتی)
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setInputMode('manual');
                            setManualText(value);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            inputMode === 'manual'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                        }`}
                    >
                        <Edit3 className="w-3 h-3" />
                        ورود دستی / متنی
                    </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1">
                    <button
                        type="button"
                        onClick={setZeroKmPreset}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all border cursor-pointer ${
                            isZeroKm
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        🚗 پلاک صفر (فاقد پلاک)
                    </button>

                    <div className="hidden sm:flex items-center gap-1 text-[11px]">
                        <span className="text-slate-400">استان:</span>
                        <button
                            type="button"
                            onClick={() => setQuickProvince('63')}
                            className={`px-1.5 py-0.5 rounded font-mono font-bold border transition-all cursor-pointer ${
                                iranCode === '63' && !isZeroKm
                                    ? 'bg-blue-600 text-white border-blue-700'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}
                            title="شیراز (ایران ۶۳)"
                        >
                            ۶۳ (شیراز)
                        </button>
                        <button
                            type="button"
                            onClick={() => setQuickProvince('73')}
                            className={`px-1.5 py-0.5 rounded font-mono font-bold border transition-all cursor-pointer ${
                                iranCode === '73' && !isZeroKm
                                    ? 'bg-blue-600 text-white border-blue-700'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}
                            title="فارس (ایران ۷۳)"
                        >
                            ۷۳ (فارس)
                        </button>
                        <button
                            type="button"
                            onClick={() => setQuickProvince('11')}
                            className={`px-1.5 py-0.5 rounded font-mono font-bold border transition-all cursor-pointer ${
                                iranCode === '11' && !isZeroKm
                                    ? 'bg-blue-600 text-white border-blue-700'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}
                            title="تهران (ایران ۱۱)"
                        >
                            ۱۱ (تهران)
                        </button>
                    </div>
                </div>
            </div>

            {/* Structured Visual Iranian License Plate Box */}
            {inputMode === 'structured' ? (
                <div className="flex flex-wrap items-center gap-3">
                    <div 
                        className={`relative inline-flex items-stretch border-2 rounded-2xl overflow-hidden shadow-xs transition-all ${
                            validation.isValid 
                                ? 'border-slate-800 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md' 
                                : 'border-amber-400 bg-amber-50/20'
                        }`}
                        style={{ direction: 'ltr' }}
                    >
                        {/* Blue Left Strip (IR.IRAN) */}
                        <div className="bg-[#003399] text-white px-2.5 py-1.5 flex flex-col items-center justify-between min-w-[38px] select-none">
                            <div className="w-5 h-3.5 border border-white/50 flex flex-col rounded-xs overflow-hidden mt-0.5">
                                <div className="h-1 bg-[#239f40]"></div>
                                <div className="h-1 bg-white"></div>
                                <div className="h-1 bg-[#da0000]"></div>
                            </div>
                            <span className="text-[9px] font-black tracking-widest uppercase">I.R.</span>
                            <span className="text-[8px] font-bold">IRAN</span>
                        </div>

                        {/* Plate Content */}
                        {isZeroKm ? (
                            <div className="flex items-center justify-center px-6 py-2 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm select-none gap-2">
                                <span>🚗 خودروی صفر کیلومتر (فاقد پلاک انتظامی)</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsZeroKm(false);
                                        emitStructuredChange(part1 || '12', letter || 'ب', part2 || '345', iranCode || '63', false);
                                    }}
                                    className="text-[11px] text-blue-600 dark:text-blue-400 underline font-normal"
                                >
                                    ورود پلاک شماره‌دار
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center px-2.5 py-1 gap-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-black">
                                {/* 2 digits (part1) */}
                                <input
                                    ref={part1Ref}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={2}
                                    placeholder="12"
                                    value={part1}
                                    onChange={handlePart1Change}
                                    onPaste={handlePaste}
                                    className="w-12 text-center py-1.5 text-base sm:text-lg font-black bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                    title="دو رقم سمت چپ پلاک"
                                />

                                {/* Letter Selector */}
                                <select
                                    ref={letterRef}
                                    value={letter}
                                    onChange={handleLetterChange}
                                    className="px-2 py-1.5 text-sm sm:text-base font-black bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer text-center"
                                    title="حرف میانی پلاک"
                                >
                                    {IRANIAN_PLATE_LETTERS.map(item => (
                                        <option key={item.letter} value={item.letter}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>

                                {/* 3 digits (part2) */}
                                <input
                                    ref={part2Ref}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={3}
                                    placeholder="345"
                                    value={part2}
                                    onChange={handlePart2Change}
                                    onKeyDown={(e) => handleKeyDown(e, part2, part1Ref)}
                                    onPaste={handlePaste}
                                    className="w-16 text-center py-1.5 text-base sm:text-lg font-black bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                    title="سه رقم وسط پلاک"
                                />

                                {/* Divider & Iran Province Box */}
                                <div className="border-l-2 border-slate-300 dark:border-slate-700 pl-2 pr-1 flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-800/80 rounded-lg py-0.5">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 select-none">
                                        ایران
                                    </span>
                                    <input
                                        ref={iranRef}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={2}
                                        placeholder="63"
                                        value={iranCode}
                                        onChange={handleIranChange}
                                        onKeyDown={(e) => handleKeyDown(e, iranCode, part2Ref)}
                                        onPaste={handlePaste}
                                        className="w-11 text-center py-0.5 text-sm sm:text-base font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                        title="کد ۲ رقمی شهر / استان (مثلاً ۶۳ برای شیراز)"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Manual Text Input Mode */
                <div className="space-y-1.5">
                    <input
                        type="text"
                        placeholder="مثال: ۱۲ ل ۳۴۵ ایران ۶۳ یا فاقد پلاک"
                        value={manualText}
                        onChange={handleManualTextChange}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                    />
                    <p className="text-[11px] text-slate-500">
                        می‌توانید شماره پلاک را به صورت آزاد یا کپی‌شده وارد نمایید.
                    </p>
                </div>
            )}

            {/* Real-time Verification Feedback */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
                {validation.isValid ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>پلاک معتبر است: {validation.formattedPlate}</span>
                        {validation.provinceHint && (
                            <span className="text-emerald-700 dark:text-emerald-400 text-[11px] bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded-md">
                                ({validation.provinceHint})
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{validation.errorMessage || 'لطفاً ارقام و حروف پلاک را تکمیل نمایید.'}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
