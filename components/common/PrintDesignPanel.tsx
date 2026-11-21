import React from 'react';
import type { DocumentPaperSize } from '../../types/bankLetter';
import type {
    DocumentPrintDesignSettings,
    PrintDesignVariant
} from '../../types/printDesign';
import {
    getDefaultPrintDesign,
    PRINT_DESIGN_PRESETS
} from '../../services/printDesignService';
import { toPersianDigits } from '../../services/bankLetterValidation';
import {
    Type,
    AlignJustify,
    PanelTop,
    PanelBottom,
    RotateCcw,
    Eye,
    EyeOff,
    X,
    Sparkles,
    Stamp
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

    const handleResetAll = () => {
        onChange(getDefaultPrintDesign(variant, paperSize));
    };

    const typographyPresets = PRINT_DESIGN_PRESETS.filter((p) => p.category === 'typography');
    const headerFooterPresets = PRINT_DESIGN_PRESETS.filter((p) => p.category === 'header_footer');
    const watermarkPresets = PRINT_DESIGN_PRESETS.filter((p) => p.category === 'watermark');

    const boxCls = darkMode
        ? 'bg-slate-900 border-slate-700 text-slate-100'
        : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100';

    const cardCls = darkMode
        ? 'bg-slate-800/80 border-slate-700'
        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700';

    const presetStripCls = darkMode
        ? 'bg-slate-800/60 border-slate-700/80'
        : 'bg-white/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/70';

    const presetBtnCls = darkMode
        ? 'px-2.5 py-1 rounded-lg bg-slate-700/70 hover:bg-sky-600 text-slate-100 hover:text-white border border-slate-600/80 text-[10.5px] font-bold cursor-pointer transition-colors'
        : 'px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10.5px] font-bold cursor-pointer transition-colors';

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
                            تنظیمات فونت، فاصله خطوط، ویرایش هدر، فوتر و واترمارک
                        </h4>
                        <p className="text-[10.5px] opacity-70">
                            تغییرات و پریست‌های آماده به‌صورت آنی در پیش‌نمایش زنده، صفحه‌بندی و چاپ نهایی ({paperSize}) اعمال می‌شوند.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={handleResetAll}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-[11px] font-bold cursor-pointer"
                    >
                        <RotateCcw className="w-3 h-3" />
                        <span>بازنشانی کامل ({paperSize})</span>
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

            {/* Ready-Made Presets Toolbar */}
            <div className={`p-2.5 rounded-2xl border grid grid-cols-1 lg:grid-cols-3 gap-2.5 ${presetStripCls}`}>
                {/* Typography Presets */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10.5px] font-black text-sky-600 dark:text-sky-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>پریست فونت و چیدمان:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {typographyPresets.map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                title={preset.description}
                                onClick={() => onChange(preset.apply(value, variant, paperSize))}
                                className={presetBtnCls}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Header & Footer Presets */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10.5px] font-black text-indigo-600 dark:text-indigo-400">
                        <PanelTop className="w-3.5 h-3.5" />
                        <span>پریست هدر و فوتر:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {headerFooterPresets.map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                title={preset.description}
                                onClick={() => onChange(preset.apply(value, variant, paperSize))}
                                className={presetBtnCls}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Watermark Presets */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10.5px] font-black text-amber-600 dark:text-amber-400">
                        <Stamp className="w-3.5 h-3.5" />
                        <span>پریست واترمارک:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {watermarkPresets.map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                title={preset.description}
                                onClick={() => onChange(preset.apply(value, variant, paperSize))}
                                className={presetBtnCls}
                            >
                                {preset.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                const def = getDefaultPrintDesign(variant, paperSize);
                                onChange({
                                    ...value,
                                    showWatermark: true,
                                    watermarkText: def.watermarkText,
                                    watermarkSubText: def.watermarkSubText,
                                    watermarkFontSizePt: def.watermarkFontSizePt,
                                    watermarkOpacity: def.watermarkOpacity,
                                    watermarkAngleDeg: def.watermarkAngleDeg
                                });
                            }}
                            className={presetBtnCls}
                        >
                            واترمارک پیش‌فرض نمایندگی
                        </button>
                    </div>
                </div>
            </div>

            {/* 4 Cards: Typography | Header | Footer | Watermark */}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3">
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
                                متن سمت چپ فوتر (متغیرها: {'{{DOC_TITLE}}'}، {'{{DOC_NUMBER}}'}، {'{{DOC_DATE}}'})
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
                                <span>نمایش شماره صفحه</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 4. Editable Watermark */}
                <div className={`p-3 rounded-2xl border space-y-2.5 ${cardCls}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400">
                            <Stamp className="w-4 h-4" />
                            <span>ویرایش واترمارک پس‌زمینه</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => update('showWatermark', !value.showWatermark)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold cursor-pointer ${
                                value.showWatermark
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                    : 'bg-rose-500/15 text-rose-500'
                            }`}
                        >
                            {value.showWatermark ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{value.showWatermark ? 'واترمارک فعال' : 'واترمارک خاموش'}</span>
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <label className={labelCls}>متن اصلی واترمارک (فارسی یا انگلیسی)</label>
                            <input
                                type="text"
                                value={value.watermarkText}
                                onChange={(e) => update('watermarkText', e.target.value)}
                                placeholder="مثلاً: HOSEINI KHODRO یا رونوشت برابر اصل"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>زیرمتن واترمارک (اختیاری)</label>
                            <input
                                type="text"
                                value={value.watermarkSubText}
                                onChange={(e) => update('watermarkSubText', e.target.value)}
                                placeholder="مثلاً: KERMAN MOTOR 2606"
                                className={inputCls}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <div>
                                <div className="flex items-center justify-between text-[10.5px] font-bold mb-1">
                                    <span>سایز (pt)</span>
                                    <span className="font-mono">{toPersianDigits(Math.round(value.watermarkFontSizePt))}</span>
                                </div>
                                <input
                                    type="range"
                                    min={14}
                                    max={64}
                                    step={1}
                                    value={value.watermarkFontSizePt}
                                    onChange={(e) => update('watermarkFontSizePt', Number(e.target.value))}
                                    className="w-full accent-amber-600 cursor-pointer"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between text-[10.5px] font-bold mb-1">
                                    <span>شفافیت (%)</span>
                                    <span className="font-mono">{toPersianDigits(Math.round(value.watermarkOpacity * 100))}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={0.01}
                                    max={0.25}
                                    step={0.005}
                                    value={value.watermarkOpacity}
                                    onChange={(e) => update('watermarkOpacity', Number(e.target.value))}
                                    className="w-full accent-amber-600 cursor-pointer"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between text-[10.5px] font-bold mb-1">
                                    <span>زاویه چرخش</span>
                                    <span className="font-mono" dir="ltr">{value.watermarkAngleDeg}°</span>
                                </div>
                                <input
                                    type="range"
                                    min={-45}
                                    max={45}
                                    step={1}
                                    value={value.watermarkAngleDeg}
                                    onChange={(e) => update('watermarkAngleDeg', Number(e.target.value))}
                                    className="w-full accent-amber-600 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
