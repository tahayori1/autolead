import React, { useState, useEffect, useMemo } from 'react';
import type { CarPriceStats, ScrapedCarPrice } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { CopyIcon } from './icons/CopyIcon';
import { 
    Check, Sparkles, Filter, Search, Calendar, Phone, MapPin, 
    Layers, Settings2, Sliders, RefreshCw, CheckSquare, Square
} from 'lucide-react';

export const PRIORITY_MODELS = [
    'KMC EAGLE',
    'JAC J4',
    'BAC X3PRO',
    'KMC T9',
    'KMC J7',
    'KMC T8',
    'KMC X5',
    'KMC SR3'
];

export const getModelPriorityIndex = (modelName: string): number => {
    if (!modelName) return 999;
    const clean = modelName.trim().toUpperCase().replace(/[\s\-_]+/g, ' ');
    
    for (let i = 0; i < PRIORITY_MODELS.length; i++) {
        const target = PRIORITY_MODELS[i].toUpperCase().replace(/[\s\-_]+/g, ' ');
        if (clean === target || clean.includes(target) || target.includes(clean)) {
            return i;
        }
    }
    return 999;
};

export interface ModelVariant {
    rawModelName: string;
    year: string | null;
    stat: CarPriceStats;
    manualPrice?: ScrapedCarPrice;
    otherPrices: ScrapedCarPrice[];
    lowestLimit: number;
    highestLimit: number;
    havaleh1Min: number;
    havaleh1Max: number;
    havaleh2Min: number;
    havaleh2Max: number;
    sourcePricesMap: Record<string, ScrapedCarPrice>;
}

export interface GroupedCardData {
    baseModelName: string;
    variants: ModelVariant[];
    years: string[];
    hasApprovedPrice: boolean;
    primaryApprovedPrice?: number;
    highestMarketPrice: number;
    lowestMarketPrice: number;
    allSources: string[];
}

interface CarPriceCopySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupedCards: GroupedCardData[];
    stats?: CarPriceStats[];
    lastUpdated?: string;
    onCopySuccess: () => void;
}

const DEFAULT_FOOTER = `☎️تماس بگیرید:
(پاسخگویی ۹ تا ۲۰)

07191690906

📌 آدرس نمایندگی ۲۶۰۶:
 شیراز، چهارراه بنفشه، نرسیده به فلکه هنگ، روبروی کوچه ۱۸`;

const generateDefaultHeader = (lastUpdatedStr?: string) => {
    let dateStr = '';
    let timeStr = '';

    if (lastUpdatedStr) {
        try {
            // handle format: 'YYYY-MM-DD HH:mm:ss' or ISO
            const dateObj = new Date(lastUpdatedStr.replace(' ', 'T') + (lastUpdatedStr.includes('Z') ? '' : 'Z'));
            if (!isNaN(dateObj.getTime())) {
                dateStr = dateObj.toLocaleDateString('fa-IR');
                timeStr = dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
            }
        } catch {
            // fallback
        }
    }

    if (!dateStr || !timeStr) {
        const now = new Date();
        dateStr = now.toLocaleDateString('fa-IR');
        timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    }

    return `📋 لیست قیمت روز محصولات
(قیمت‌های بازار بر اساس آخرین استعلام از سایت‌های معتبر خودرویی)
⏳ آخرین به‌روزرسانی: تاریخ ${dateStr} - ساعت ${timeStr}`;
};

const CarPriceCopySettingsModal: React.FC<CarPriceCopySettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    groupedCards,
    lastUpdated,
    onCopySuccess 
}) => {
    const [headerText, setHeaderText] = useState('');
    const [footerText, setFooterText] = useState(DEFAULT_FOOTER);
    
    // Display Customization Options
    const [includeYear, setIncludeYear] = useState(true);
    const [yearFormat, setYearFormat] = useState<'model' | 'parentheses' | 'simple'>('model'); // 'model 1404' vs '(1404)' vs '1404'
    const [priceDisplayType, setPriceDisplayType] = useState<'both' | 'approved_first' | 'market_only'>('both'); // how to show approved vs market
    const [priceUnit, setPriceUnit] = useState<'toman' | 'million'>('toman');
    const [includeHavaleh1, setIncludeHavaleh1] = useState(false);
    const [includeHavaleh2, setIncludeHavaleh2] = useState(false);
    const [includeMinLimit, setIncludeMinLimit] = useState(false);
    const [includeMaxLimit, setIncludeMaxLimit] = useState(false);
    const [itemDivider, setItemDivider] = useState<'emoji' | 'dash' | 'line'>('emoji');
    
    // Variant Selection State (Key: rawModelName)
    const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
    const [searchFilter, setSearchFilter] = useState('');

    // Sorted Grouped Cards based on priority
    const sortedGroups = useMemo(() => {
        const list = [...groupedCards];
        list.sort((a, b) => {
            const pA = getModelPriorityIndex(a.baseModelName);
            const pB = getModelPriorityIndex(b.baseModelName);
            if (pA !== pB) return pA - pB;
            return a.baseModelName.localeCompare(b.baseModelName, 'fa');
        });
        return list;
    }, [groupedCards]);

    // Initialize defaults on Open
    useEffect(() => {
        if (isOpen) {
            setHeaderText(generateDefaultHeader(lastUpdated));
            setFooterText(DEFAULT_FOOTER);

            // Default Selected Variants: Priority models (newest year variant or all priority variants)
            const defaultSelected = new Set<string>();
            groupedCards.forEach(group => {
                const isPriority = getModelPriorityIndex(group.baseModelName) < 999;
                if (isPriority) {
                    // select all variants of this priority model
                    group.variants.forEach(v => defaultSelected.add(v.rawModelName));
                }
            });

            // If none matched, select the top 8 variants
            if (defaultSelected.size === 0) {
                groupedCards.slice(0, 8).forEach(g => {
                    if (g.variants[0]) defaultSelected.add(g.variants[0].rawModelName);
                });
            }

            setSelectedVariants(defaultSelected);
        }
    }, [isOpen, groupedCards, lastUpdated]);

    const handleToggleVariant = (rawModelName: string) => {
        setSelectedVariants(prev => {
            const next = new Set(prev);
            if (next.has(rawModelName)) next.delete(rawModelName);
            else next.add(rawModelName);
            return next;
        });
    };

    const handleToggleGroup = (group: GroupedCardData) => {
        const allSelected = group.variants.every(v => selectedVariants.has(v.rawModelName));
        setSelectedVariants(prev => {
            const next = new Set(prev);
            group.variants.forEach(v => {
                if (allSelected) {
                    next.delete(v.rawModelName);
                } else {
                    next.add(v.rawModelName);
                }
            });
            return next;
        });
    };

    const handleSelectAll = (select: boolean) => {
        if (select) {
            const all = new Set<string>();
            groupedCards.forEach(g => g.variants.forEach(v => all.add(v.rawModelName)));
            setSelectedVariants(all);
        } else {
            setSelectedVariants(new Set());
        }
    };

    const handleSelectPriorityOnly = () => {
        const next = new Set<string>();
        groupedCards.forEach(g => {
            if (getModelPriorityIndex(g.baseModelName) < 999) {
                g.variants.forEach(v => next.add(v.rawModelName));
            }
        });
        setSelectedVariants(next);
    };

    const formatPriceNumber = (priceRial: number): string => {
        if (priceUnit === 'million') {
            const millions = priceRial / 1000000;
            return millions.toLocaleString('fa-IR', { maximumFractionDigits: 1 }) + ' میلیون تومان';
        }
        return priceRial.toLocaleString('fa-IR') + ' تومان';
    };

    const generatedText = useMemo(() => {
        // Collect selected variants in order of priority and groups
        const selectedList: { variant: ModelVariant; baseName: string }[] = [];

        sortedGroups.forEach(group => {
            group.variants.forEach(variant => {
                if (selectedVariants.has(variant.rawModelName)) {
                    selectedList.push({ variant, baseName: group.baseModelName });
                }
            });
        });

        if (selectedList.length === 0) {
            return `${headerText}\n\n(هیچ خودرویی انتخاب نشده است)\n\n${footerText}`;
        }

        const rows = selectedList.map(({ variant, baseName }) => {
            const manualPrice = variant.manualPrice;
            const marketMax = variant.stat.maximum;
            const minLimit = Math.round(variant.lowestLimit ?? marketMax * 0.98);
            const maxLimit = Math.round(marketMax * 1.02);
            const havaleh1Min = Math.round(variant.havaleh1Min);
            const havaleh1Max = Math.round(variant.havaleh1Max);
            const havaleh2Min = Math.round(variant.havaleh2Min);
            const havaleh2Max = Math.round(variant.havaleh2Max);

            // Construct Car Name Line with Year if enabled
            let title = baseName;
            if (includeYear && variant.year) {
                if (yearFormat === 'model') {
                    title += ` مدل ${variant.year}`;
                } else if (yearFormat === 'parentheses') {
                    title += ` (${variant.year})`;
                } else {
                    title += ` ${variant.year}`;
                }
            }

            const lines: string[] = [];
            lines.push(`🚗 ${title}`);

            // Prices
            if (manualPrice && priceDisplayType !== 'market_only') {
                lines.push(`⭐️ قیمت مصوب: ${formatPriceNumber(manualPrice.price_rial)}`);
                if (priceDisplayType === 'both' && marketMax > 0 && marketMax !== manualPrice.price_rial) {
                    lines.push(`💰 قیمت بازار: ${formatPriceNumber(marketMax)}`);
                }
            } else {
                lines.push(`💰 قیمت بازار: ${formatPriceNumber(marketMax)}`);
            }

            if (includeMinLimit) {
                lines.push(`📉 کف نرخ معامله: ${formatPriceNumber(minLimit)}`);
            }
            if (includeMaxLimit) {
                lines.push(`📈 سقف نرخ معامله: ${formatPriceNumber(maxLimit)}`);
            }
            if (includeHavaleh1) {
                lines.push(`📄 حواله ۱ ماهه: ${formatPriceNumber(havaleh1Min)} تا ${formatPriceNumber(havaleh1Max)}`);
            }
            if (includeHavaleh2) {
                lines.push(`📄 حواله ۲ ماهه: ${formatPriceNumber(havaleh2Min)} تا ${formatPriceNumber(havaleh2Max)}`);
            }

            return lines.join('\n');
        });

        const divider = itemDivider === 'line' ? '\n────────────────\n' : '\n\n';
        return `${headerText}\n\n${rows.join(divider)}\n\n${footerText}`;
    }, [
        sortedGroups, 
        selectedVariants, 
        headerText, 
        footerText, 
        includeYear, 
        yearFormat, 
        priceDisplayType, 
        priceUnit, 
        includeMinLimit, 
        includeMaxLimit, 
        includeHavaleh1, 
        includeHavaleh2, 
        itemDivider
    ]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText).then(() => {
            onCopySuccess();
            onClose();
        });
    };

    if (!isOpen) return null;

    // Filter groups by search
    const filteredGroups = sortedGroups.filter(g => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.trim().toLowerCase();
        return (g?.baseModelName || '').toLowerCase().includes(q) || 
               (g?.variants || []).some(v => (v?.rawModelName || '').toLowerCase().includes(q) || (v?.year && v.year.includes(q)));
    });

    return (
        <div className="fixed inset-0 bg-slate-950/70 flex justify-center items-center z-[70] p-3 sm:p-5 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                            <Settings2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <span>تنظیمات و شخصی‌سازی متن کپی آمار</span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                                    نسخه جدید
                                </span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                شخصی‌سازی کامل قالب پیام، فیلتر خودروها، نمایش سال ساخت و اطلاعات تماس
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body: Split View (Settings on right/top, Live Preview on left/bottom) */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    
                    {/* Settings Sidebar */}
                    <div className="w-full lg:w-1/2 p-5 overflow-y-auto border-l border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-6">
                        
                        {/* 1. Header & Footer Customization */}
                        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-sm">
                            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                <span>سرتیتر و پاورقی پیام</span>
                            </h4>
                            
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                        متن سرتیتر (عنوان لیست و توضیح استعلام):
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={() => setHeaderText(generateDefaultHeader(lastUpdated))}
                                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        <span>بازنشانی سرتیتر</span>
                                    </button>
                                </div>
                                <textarea 
                                    value={headerText}
                                    onChange={e => setHeaderText(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-medium outline-none focus:border-indigo-500 transition-all resize-none"
                                    placeholder="سرتیتر پیام..."
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                        متن پاورقی (اطلاعات تماس و آدرس):
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={() => setFooterText(DEFAULT_FOOTER)}
                                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        <span>بازنشانی پیش‌فرض</span>
                                    </button>
                                </div>
                                <textarea 
                                    value={footerText}
                                    onChange={e => setFooterText(e.target.value)}
                                    rows={6}
                                    className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-medium outline-none focus:border-indigo-500 transition-all"
                                    placeholder="پاورقی پیام..."
                                />
                            </div>
                        </div>

                        {/* 2. Display Options & Year Setting */}
                        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
                            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                <Sliders className="w-4 h-4 text-indigo-500" />
                                <span>تنظیمات نمایش سال ساخت و جزئیات</span>
                            </h4>

                            {/* Year Switch & Format */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700 space-y-2.5">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        <span>نمایش سال ساخت خودرو در متن</span>
                                    </span>
                                    <input 
                                        type="checkbox" 
                                        checked={includeYear} 
                                        onChange={e => setIncludeYear(e.target.checked)} 
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                    />
                                </label>

                                {includeYear && (
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">فرمت نمایش سال:</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setYearFormat('model')}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                                    yearFormat === 'model'
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                مدل 1404
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setYearFormat('parentheses')}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                                    yearFormat === 'parentheses'
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                (1404)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setYearFormat('simple')}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                                    yearFormat === 'simple'
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                1404
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Additional Checkboxes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={includeMinLimit} 
                                        onChange={e => setIncludeMinLimit(e.target.checked)} 
                                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500" 
                                    />
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">کف نرخ معامله (-۲٪)</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={includeMaxLimit} 
                                        onChange={e => setIncludeMaxLimit(e.target.checked)} 
                                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500" 
                                    />
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">سقف نرخ معامله (+۲٪)</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={includeHavaleh1} 
                                        onChange={e => setIncludeHavaleh1(e.target.checked)} 
                                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500" 
                                    />
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">حواله ۱ ماهه (۳٪ - ۵٪)</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={includeHavaleh2} 
                                        onChange={e => setIncludeHavaleh2(e.target.checked)} 
                                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500" 
                                    />
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">حواله ۲ ماهه (۶٪ - ۱۰٪)</span>
                                </label>
                            </div>

                            {/* Unit and Divider */}
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">واحد قیمت:</span>
                                    <select
                                        value={priceUnit}
                                        onChange={e => setPriceUnit(e.target.value as any)}
                                        className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 font-bold outline-none cursor-pointer"
                                    >
                                        <option value="toman">تومان کامل</option>
                                        <option value="million">میلیون تومان</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">فاصله آیتم‌ها:</span>
                                    <select
                                        value={itemDivider}
                                        onChange={e => setItemDivider(e.target.value as any)}
                                        className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 font-bold outline-none cursor-pointer"
                                    >
                                        <option value="emoji">فاصله خالی خطی</option>
                                        <option value="line">خط جداکننده (───)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 3. Car Selection by Priority & Groups */}
                        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                        <Layers className="w-4 h-4 text-indigo-500" />
                                        <span>انتخاب خودروها برای کپی</span>
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {selectedVariants.size} مورد انتخاب شده است
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button 
                                        type="button" 
                                        onClick={handleSelectPriorityOnly} 
                                        className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black hover:bg-indigo-100 transition-colors"
                                    >
                                        فقط خودروهای دارای اولویت
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleSelectAll(true)} 
                                        className="px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:underline"
                                    >
                                        همه
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleSelectAll(false)} 
                                        className="px-2 py-1 text-[10px] font-bold text-rose-500 hover:underline"
                                    >
                                        هیچکدام
                                    </button>
                                </div>
                            </div>

                            {/* Search inside selector */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchFilter}
                                    onChange={e => setSearchFilter(e.target.value)}
                                    placeholder="جستجوی سریع خودرو..."
                                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-8 outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                                />
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                            </div>

                            {/* Grouped Car List */}
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {filteredGroups.map(group => {
                                    const isPriority = getModelPriorityIndex(group.baseModelName) < 999;
                                    const allVariantsSelected = group.variants.every(v => selectedVariants.has(v.rawModelName));
                                    const someVariantsSelected = group.variants.some(v => selectedVariants.has(v.rawModelName));

                                    return (
                                        <div 
                                            key={group.baseModelName}
                                            className={`p-2.5 rounded-xl border transition-all ${
                                                isPriority 
                                                    ? 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40' 
                                                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div 
                                                    onClick={() => handleToggleGroup(group)}
                                                    className="flex items-center gap-2 cursor-pointer select-none flex-grow"
                                                >
                                                    <div className="text-indigo-600 dark:text-indigo-400">
                                                        {allVariantsSelected ? (
                                                            <CheckSquare className="w-4 h-4" />
                                                        ) : someVariantsSelected ? (
                                                            <div className="w-4 h-4 rounded border-2 border-indigo-600 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                                                <div className="w-2 h-0.5 bg-indigo-600" />
                                                            </div>
                                                        ) : (
                                                            <Square className="w-4 h-4 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                                        {group.baseModelName}
                                                    </span>
                                                    {isPriority && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                                                            اولویت
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Variant year pills */}
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {group.variants.map(v => {
                                                        const isSelected = selectedVariants.has(v.rawModelName);
                                                        return (
                                                            <button
                                                                key={v.rawModelName}
                                                                type="button"
                                                                onClick={() => handleToggleVariant(v.rawModelName)}
                                                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border ${
                                                                    isSelected
                                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-400'
                                                                }`}
                                                            >
                                                                {v.year ? `مدل ${v.year}` : 'اصلی'}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    {/* Live Preview Area */}
                    <div className="w-full lg:w-1/2 p-5 overflow-y-auto bg-slate-100/70 dark:bg-slate-950 flex flex-col justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <span>پیش‌نمایش زنده پیام</span>
                                    <span className="text-[10px] font-normal text-slate-400 font-mono">
                                        ({generatedText.length.toLocaleString('fa-IR')} کاراکتر)
                                    </span>
                                </label>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                    آماده کپی در تلگرام / واتساپ
                                </span>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm whitespace-pre-wrap text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-mono max-h-[58vh] overflow-y-auto select-all selection:bg-indigo-100 selection:text-indigo-900">
                                {generatedText}
                            </div>
                        </div>

                        {/* Quick Tips */}
                        <p className="text-[10px] text-slate-400 mt-3 text-center">
                            با کلیک روی دکمه «کپی در حافظه»، متن بالا مستقیماً در کلیپ‌بورد دستگاه شما ذخیره می‌شود.
                        </p>
                    </div>

                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between">
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        انصراف
                    </button>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleCopy} 
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
                        >
                            <CopyIcon className="w-4 h-4" />
                            <span>کپی متن در حافظه</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CarPriceCopySettingsModal;
