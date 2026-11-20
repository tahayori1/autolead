import React from 'react';
import type { DocumentPaperSize } from '../../types/bankLetter';
import type {
    DocumentPrintDesignSettings,
    PrintDesignVariant
} from '../../types/printDesign';
import { getDefaultPrintDesign } from '../../services/printDesignService';
import { toPersianDigits } from '../../services/bankLetterValidation';
import {
    Type,
    AlignJustify,
    PanelTop,
    PanelBottom,
    RotateCcw,
    Eye,
    EyeOff,
    X
} from 'lucide-react';

interface PrintDesignPanelProps {
    variant: PrintDesignVariant;
    paperSize: DocumentPaperSize;
    value: DocumentPrintDesignSettings;
    onChange: (next: DocumentPrintDesignSettings) => void;
    onClose?: () => void;
    darkMode?: boolean;
}

export const PrintDesignPanel: React.FC<PrintDesignPanelProps> = ({
    variant,
    paperSize,
    value,
    onChange,
    onClose,
    darkMode = false
}) => {
    const update = <K extends keyof DocumentPrintDesignSettings>(
        key: K,
        val: DocumentPrintDesignSettings[K]
    ) => {
        onChange({ ...value, [key]: val });
    };

    const applyPreset = (preset: 'compact' | 'standard' | 'large') => {
        const base = getDefaultPrintDesign(variant, paperSize);
        if (preset === 'compact') {
            onChange({
                ...value,
                bodyFontSizePt: variant === 'leasing' ? 8.8 : 9.5,
                bodyLineHeight: 1.65,
                headerFontSizePt: 7.5,
                headerTitleFontSizePt: variant === 'leasing' ? 10.5 : 12,
                headerPaddingPx: 5,
                footerFontSizePt: 6.8,
                footerPaddingPx: 4
            });
        } else if (preset === 'large') {
            onChange({
                ...value,
                bodyFontSizePt: variant === 'leasing' ? 11.5 : 12.5,
                bodyLineHeight: 2.25,
                headerFontSizePt: 10,
                headerTitleFontSizePt: variant === 'leasing' ? 14.5 : 17,
                headerPaddingPx: 12,
                footerFontSizePt: 9,
                footerPaddingPx: 8
            });
        } else {
            onChange({
                ...value,
                bodyFontSizePt: base.bodyFontSizePt,
                bodyLineHeight: base.bodyLineHeight,
                headerFontSizePt: base.headerFontSizePt,
                headerTitleFontSizePt: base.headerTitleFontSizePt,
                headerPaddingPx: base.headerPaddingPx,
                footerFontSizePt: base.footerFontSizePt,
                footerPaddingPx: base.footerPaddingPx
            });
        }
    };

    const handleResetAll = () => {
        onChange(getDefaultPrintDesign(variant, paperSize));
    };

    const boxCls = darkMode
        ? 'bg-slate-900 border-slate-700 text-slate-100'
        : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100';

    const cardCls = darkMode
        ? 'bg-slate-800/80 border-slate-700'
        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700';

    const inputCls = darkMode
        ? 'w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-600 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40'
        : 'w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40';

    const labelCls = darkMode
        ? 'block text-[10.5px] font-bold text-slate-300 mb-1'
        : 'block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1';

    return (
        <div
            className={`border-b px-4 sm:px-5 py-3.5 space-y-3 font-vazir ${boxCls}`}
            dir="rtl"
        >
            {/* Header Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-sky-600/15 text-sky-500">
                        <Type className="w-4 h-4" />
                    </span>
                    <div>
                        <h4 className="text-xs sm:text-sm font-black">
                            تنظیمات فونت، فاصله خطوط، سایز و ویرایش متن هدر و فوتر
                        </h4>
                        <p className="text-[10.5px] opacity-70">
                            تغییرات به‌صورت آنی در پیش‌نمایش زنده، صفحه‌بندی خودکار (صفحه ۱، ۲ و ...) و چاپ نهایی اعمال می‌شود.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => applyPreset('compact')}
                        className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-[11px] font-bold cursor-pointer transition-colors"
                    >
                        چیدمان فشرده
                    </button>
                    <button
                        type="button"
                        onClick={() => applyPreset('standard')}
                        className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-[11px] font-bold cursor-pointer transition-colors"
                    >
                        سایز استاندارد ({paperSize})
                    </button>
                    <button
                        type="button"
                        onClick={() => applyPreset('large')}
                        className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-[11px] font-bold cursor-pointer transition-colors"
                    >
                        خوانا و درشت
                    </button>
                    <button
                        type="button"
                        onClick={handleResetAll}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-[11px] font-bold cursor-pointer"
                    >
                        <RotateCcw className="w-3 h-3" />
                        <span>بازنشانی کامل</span>
                    </button>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                            title="بستن پنل تنظیمات"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* 3 Columns: Body Typography | Header Size & Text | Footer Size & Text */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* 1. Body Font & Line Height */}
                <div className={`p-3 rounded-2xl border space-y-3 ${cardCls}`}>
                    <div className="flex items-center gap-1.5 text-xs font-black text-sky-600 dark:text-sky-400">
                        <AlignJustify className="w-4 h-4" />
                        <span>فونت و ارتفاع خط متن</span>
                    </div>

                    <div className="space-y-2.5">
                        <div>
                            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                <span>اندازه فونت متن اصلی (pt)</span>
                                <span className="font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300">
                                    {toPersianDigits(value.bodyFontSizePt.toFixed(1))} pt
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => update('bodyFontSizePt', Math.max(7, Number((value.bodyFontSizePt - 0.5).toFixed(1))))}
                                    className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-xs font-black cursor-pointer"
                                >
                                    -
                                </button>
                                <input
                                    type="range"
                                    min={7}
                                    max={16}
                                    step={0.2}
                                    value={value.bodyFontSizePt}
                                    onChange={(e) => update('bodyFontSizePt', Number(e.target.value))}
                                    className="flex-1 accent-sky-600 cursor-pointer"
                                />
                                <button
                                    type="button"
                                    onClick={() => update('bodyFontSizePt', Math.min(16, Number((value.bodyFontSizePt + 0.5).toFixed(1))))}
                                    className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-xs font-black cursor-pointer"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                <span>ارتفاع خطوط (Line Height)</span>
                                <span className="font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                                    {toPersianDigits(value.bodyLineHeight.toFixed(2))}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => update('bodyLineHeight', Math.max(1.25, Number((value.bodyLineHeight - 0.1).toFixed(2))))}
                                    className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-xs font-black cursor-pointer"
                                >
                                    -
                                </button>
                                <input
                                    type="range"
                                    min={1.25}
                                    max={2.8}
                                    step={0.05}
                                    value={value.bodyLineHeight}
                                    onChange={(e) => update('bodyLineHeight', Number(e.target.value))}
                                    className="flex-1 accent-emerald-600 cursor-pointer"
                                />
                                <button
                                    type="button"
                                    onClick={() => update('bodyLineHeight', Math.min(2.8, Number((value.bodyLineHeight + 0.1).toFixed(2))))}
                                    className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-xs font-black cursor-pointer"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <div>
                                <div className="flex items-center justify-between text-[10.5px] font-bold mb-1">
                                    <span>سایز عنوان هدر</span>
                                    <span className="font-mono">{toPersianDigits(value.headerTitleFontSizePt.toFixed(1))}</span>
                                </div>
                                <input
                                    type="range"
                                    min={9}
                                    max={22}
                                    step={0.5}
                                    value={value.headerTitleFontSizePt}
                                    onChange={(e) => update('headerTitleFontSizePt', Number(e.target.value))}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-[10.5px] font-bold mb-1">
                                    <span>سایز فونت هدر</span>
                                    <span className="font-mono">{toPersianDigits(value.headerFontSizePt.toFixed(1))}</span>
                                </div>
                                <input
                                    type="range"
                                    min={6.5}
                                    max={13}
                                    step={0.5}
                                    value={value.headerFontSizePt}
                                    onChange={(e) => update('headerFontSizePt', Number(e.target.value))}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-[10.5px] font-bold mb-1">
                                    <span>فاصله/ارتفاع هدر (px)</span>
                                    <span className="font-mono">{toPersianDigits(value.headerPaddingPx)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={2}
                                    max={24}
                                    step={1}
                                    value={value.headerPaddingPx}
                                    onChange={(e) => update('headerPaddingPx', Number(e.target.value))}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-[10.5px] font-bold mb-1">
                                    <span>سایز فونت فوتر</span>
                                    <span className="font-mono">{toPersianDigits(value.footerFontSizePt.toFixed(1))}</span>
                                </div>
                                <input
                                    type="range"
                                    min={5.5}
                                    max={12}
                                    step={0.5}
                                    value={value.footerFontSizePt}
                                    onChange={(e) => update('footerFontSizePt', Number(e.target.value))}
                                    className="w-full accent-teal-600 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Editable Header */}
                <div className={`p-3 rounded-2xl border space-y-2 ${cardCls}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400">
                            <PanelTop className="w-4 h-4" />
                            <span>ویرایش متن و اجزای هدر (سربرگ)</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => update('showHeader', !value.showHeader)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold cursor-pointer ${
                                value.showHeader
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                    : 'bg-rose-500/15 text-rose-500'
                            }`}
                        >
                            {value.showHeader ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{value.showHeader ? 'نمایش هدر فعال' : 'هدر مخفی'}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                            <label className={labelCls}>نشان / کد لوگو</label>
                            <input
                                type="text"
                                value={value.headerBadgeText}
                                onChange={(e) => update('headerBadgeText', e.target.value)}
                                placeholder="مثلاً ۲۶۰۶"
                                className={inputCls}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelCls}>نام مجموعه در سربرگ</label>
                            <input
                                type="text"
                                value={value.headerCompanyName}
                                onChange={(e) => update('headerCompanyName', e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelCls}>زیرعنوان برند / نمایندگی</label>
                            <input
                                type="text"
                                value={value.headerCompanySub}
                                onChange={(e) => update('headerCompanySub', e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>خط تلفن / متن سمت راست</label>
                            <input
                                type="text"
                                value={value.headerExtraLine}
                                onChange={(e) => update('headerExtraLine', e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>سرآغاز (خالی = پیش‌فرض)</label>
                            <input
                                type="text"
                                value={value.headerBasmala}
                                onChange={(e) => update('headerBasmala', e.target.value)}
                                placeholder="بسمه تعالی / به نام خدا"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>عنوان دلخواه سند</label>
                            <input
                                type="text"
                                value={value.headerCustomTitle}
                                onChange={(e) => update('headerCustomTitle', e.target.value)}
                                placeholder="پیش‌فرض عنوان فرم"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>زیرعنوان دلخواه سند</label>
                            <input
                                type="text"
                                value={value.headerCustomSubtitle}
                                onChange={(e) => update('headerCustomSubtitle', e.target.value)}
                                placeholder="پیش‌فرض زیرعنوان فرم"
                                className={inputCls}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Editable Footer */}
                <div className={`p-3 rounded-2xl border space-y-2 ${cardCls}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-teal-600 dark:text-teal-400">
                            <PanelBottom className="w-4 h-4" />
                            <span>ویرایش متن و سایز فوتر (پاورقی)</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => update('showFooter', !value.showFooter)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold cursor-pointer ${
                                value.showFooter
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                    : 'bg-rose-500/15 text-rose-500'
                            }`}
                        >
                            {value.showFooter ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{value.showFooter ? 'نمایش فوتر فعال' : 'فوتر مخفی'}</span>
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <label className={labelCls}>متن سمت راست فوتر (آدرس، تلفن یا توضیحات)</label>
                            <input
                                type="text"
                                value={value.footerRightText}
                                onChange={(e) => update('footerRightText', e.target.value)}
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>
                                متن سمت چپ فوتر (متغیرهای مجاز: {'{{DOC_TITLE}}'}، {'{{DOC_NUMBER}}'}، {'{{DOC_DATE}}'})
                            </label>
                            <input
                                type="text"
                                value={value.footerLeftText}
                                onChange={(e) => update('footerLeftText', e.target.value)}
                                className={inputCls}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 items-center pt-1">
                            <div>
                                <div className="flex items-center justify-between text-[10.5px] font-bold mb-1">
                                    <span>فاصله بالای فوتر (px)</span>
                                    <span className="font-mono">{toPersianDigits(value.footerPaddingPx)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={2}
                                    max={24}
                                    step={1}
                                    value={value.footerPaddingPx}
                                    onChange={(e) => update('footerPaddingPx', Number(e.target.value))}
                                    className="w-full accent-teal-600 cursor-pointer"
                                />
                            </div>

                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer pt-2">
                                <input
                                    type="checkbox"
                                    checked={value.showPageNumbers}
                                    onChange={(e) => update('showPageNumbers', e.target.checked)}
                                    className="w-4 h-4 accent-teal-600 rounded"
                                />
                                <span>نمایش شماره صفحه (صفحه X از Y)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
