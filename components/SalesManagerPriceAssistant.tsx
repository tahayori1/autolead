import React, { useState, useMemo } from 'react';
import type { CarPriceStats, ScrapedCarPrice } from '../types';
import type { GroupedCardData, ModelVariant } from './CarPriceCopySettingsModal';
import { getModelPriorityIndex, PRIORITY_MODELS } from './CarPriceCopySettingsModal';
import { 
    TrendingUp, Target, Sparkles, AlertTriangle, Clock, 
    ArrowUpDown, Search, Filter, Plus, Check, Copy, Send, 
    Calculator, DollarSign, Layers, ShieldCheck, ChevronDown, 
    ChevronUp, RefreshCw, BarChart3, HelpCircle, FileText, CheckCircle2,
    ShieldAlert, Scale, Star, Zap, Info, CheckCircle
} from 'lucide-react';

interface SalesManagerPriceAssistantProps {
    groupedCards: GroupedCardData[];
    allPrices: ScrapedCarPrice[];
    allSources: string[];
    priceStats: CarPriceStats[];
    lastUpdated?: string;
    onSelectApprovedPrice: (modelName: string, sourceName: string, priceRial: number) => Promise<void>;
    onAddCustomPriceSubmit: (payload: {
        source_name: 'custom';
        model_name: string;
        price_rial: number;
        price_text: string;
        captured_at: string;
    }) => Promise<void>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const DEFAULT_DEALERSHIP_FOOTER = `☎️ تماس با واحد فروش:
(پاسخگویی ۹ تا ۲۰)

07191690906

📌 آدرس نمایندگی ۲۶۰۶:
 شیراز، چهارراه بنفشه، نرسیده به فلکه هنگ، روبروی کوچه ۱۸`;

const isOlderThan24Hours = (dateString?: string): boolean => {
    if (!dateString) return false;
    try {
        const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
        if (!parts) return false;
        const [_, year, month, day, hour, minute, second] = parts.map(Number);
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
        if (isNaN(date.getTime())) return false;
        return (Date.now() - date.getTime()) > 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
};

export const SalesManagerPriceAssistant: React.FC<SalesManagerPriceAssistantProps> = ({
    groupedCards,
    allPrices,
    allSources,
    priceStats,
    lastUpdated,
    onSelectApprovedPrice,
    onAddCustomPriceSubmit,
    showToast
}) => {
    // Search, Filter & Tab States
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'priority' | 'high_credibility' | 'low_credibility' | 'pending' | 'approved' | 'high_variance'>('all');
    const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'priority' | 'credibility_desc' | 'credibility_asc' | 'suggested_price' | 'market_avg' | 'variance' | 'approved_price' | 'market_max' | 'market_min' | 'model_name'>('priority');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Modals State
    const [isBriefingModalOpen, setIsBriefingModalOpen] = useState<boolean>(false);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
    const [selectedCalcModel, setSelectedCalcModel] = useState<string>('');

    // Inline Quick Price Modal / Form State
    const [editingModel, setEditingModel] = useState<string | null>(null);
    const [inlinePriceInput, setInlinePriceInput] = useState<string>('');
    const [inlinePriceNote, setInlinePriceNote] = useState<string>('تعیین توسط مدیر فروش');
    const [isSubmittingInline, setIsSubmittingInline] = useState<boolean>(false);
    const [applyingSuggestedModel, setApplyingSuggestedModel] = useState<string | null>(null);

    // Extract all unique manufacturing years
    const availableYears = useMemo(() => {
        const set = new Set<string>();
        groupedCards.forEach(g => g.years.forEach(y => set.add(y)));
        return Array.from(set).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    }, [groupedCards]);

    // Flatten all variants across grouped cards with comprehensive analytical metrics
    const flatVariants = useMemo(() => {
        const items: Array<{
            baseModelName: string;
            rawModelName: string;
            year: string | null;
            manualPrice?: ScrapedCarPrice;
            hasApproved: boolean;
            approvedPriceRial?: number;
            highestMarketPrice: number; // بیشترین نرخ مراجع (سقف)
            lowestMarketPrice: number; // کمترین نرخ مراجع (کف)
            averageMarketPrice: number; // میانگین نرخ مراجع
            suggestedPrice: number; // پیشنهاد قیمت هوشمند بر مبنای مراجع
            suggestedStrategy: string;
            suggestedRationale: string;
            credibilityLevel: 'very_high' | 'high' | 'moderate' | 'low' | 'none';
            credibilityScore: number; // 0 - 100
            credibilityStars: number; // 0 - 5
            credibilityLabel: string;
            credibilityColor: { bg: string; text: string; border: string; badge: string; ring: string };
            priceSpread: number; // Difference between max and min
            spreadPercentage: number;
            sourceCount: number;
            sourcesList: Array<{ name: string; price: number; isStale: boolean }>;
            havaleh1Min: number;
            havaleh1Max: number;
            havaleh2Min: number;
            havaleh2Max: number;
            stat: CarPriceStats;
            isPriority: boolean;
            priorityIndex: number;
            isStale: boolean;
        }> = [];

        groupedCards.forEach(group => {
            const isGroupPriority = getModelPriorityIndex(group.baseModelName) < 999;
            const groupPriorityIdx = getModelPriorityIndex(group.baseModelName);

            group.variants.forEach(v => {
                const sourcePrices = Object.values(v.sourcePricesMap) as ScrapedCarPrice[];
                const validSources = sourcePrices
                    .filter((p): p is ScrapedCarPrice => !!p && p.price_rial > 0 && p.source_name !== 'custom');
                
                const numericPrices = validSources.map(p => p.price_rial);
                const sourceCount = numericPrices.length;

                // 1. Min, Max, Average Calculations
                const maxP = numericPrices.length > 0 ? Math.max(...numericPrices) : (v.stat?.maximum || 0);
                const minP = numericPrices.length > 0 ? Math.min(...numericPrices) : (v.stat?.minimum && v.stat.minimum > 0 ? v.stat.minimum : maxP);
                const avgP = numericPrices.length > 0 
                    ? Math.round(numericPrices.reduce((a, b) => a + b, 0) / numericPrices.length) 
                    : (v.stat?.average || maxP);

                const spread = maxP - minP;
                const spreadPct = minP > 0 ? ((spread / minP) * 100) : 0;

                // 2. Credibility / Reliability Score & Tier
                // Rules: More sources = Higher reliability, Fewer sources = Lower reliability / Caution
                let credibilityLevel: 'very_high' | 'high' | 'moderate' | 'low' | 'none';
                let credibilityScore = 0;
                let credibilityStars = 0;
                let credibilityLabel = '';
                let credibilityColor = {
                    bg: 'bg-slate-50 dark:bg-slate-800',
                    text: 'text-slate-500 dark:text-slate-400',
                    border: 'border-slate-200 dark:border-slate-700',
                    badge: 'bg-slate-400',
                    ring: 'ring-slate-300'
                };

                if (sourceCount >= 4) {
                    credibilityLevel = 'very_high';
                    credibilityScore = 95;
                    credibilityStars = 5;
                    credibilityLabel = 'بسیار بالا (۴+ مرجع)';
                    credibilityColor = {
                        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
                        text: 'text-emerald-700 dark:text-emerald-300',
                        border: 'border-emerald-200 dark:border-emerald-800',
                        badge: 'bg-emerald-500',
                        ring: 'ring-emerald-400'
                    };
                } else if (sourceCount === 3) {
                    credibilityLevel = 'high';
                    credibilityScore = 80;
                    credibilityStars = 4;
                    credibilityLabel = 'بالا (۳ مرجع)';
                    credibilityColor = {
                        bg: 'bg-teal-50 dark:bg-teal-950/40',
                        text: 'text-teal-700 dark:text-teal-300',
                        border: 'border-teal-200 dark:border-teal-800',
                        badge: 'bg-teal-500',
                        ring: 'ring-teal-400'
                    };
                } else if (sourceCount === 2) {
                    credibilityLevel = 'moderate';
                    credibilityScore = 60;
                    credibilityStars = 3;
                    credibilityLabel = 'متوسط (۲ مرجع)';
                    credibilityColor = {
                        bg: 'bg-amber-50 dark:bg-amber-950/40',
                        text: 'text-amber-700 dark:text-amber-300',
                        border: 'border-amber-200 dark:border-amber-800',
                        badge: 'bg-amber-500',
                        ring: 'ring-amber-400'
                    };
                } else if (sourceCount === 1) {
                    credibilityLevel = 'low';
                    credibilityScore = 35;
                    credibilityStars = 2;
                    credibilityLabel = 'پایین (تک‌مرجع)';
                    credibilityColor = {
                        bg: 'bg-rose-50 dark:bg-rose-950/40',
                        text: 'text-rose-700 dark:text-rose-300',
                        border: 'border-rose-200 dark:border-rose-800',
                        badge: 'bg-rose-500',
                        ring: 'ring-rose-400'
                    };
                } else {
                    credibilityLevel = 'none';
                    credibilityScore = 0;
                    credibilityStars = 0;
                    credibilityLabel = 'فاقد مرجع بازار';
                    credibilityColor = {
                        bg: 'bg-slate-100 dark:bg-slate-800',
                        text: 'text-slate-400 dark:text-slate-500',
                        border: 'border-slate-200 dark:border-slate-700',
                        badge: 'bg-slate-400',
                        ring: 'ring-slate-400'
                    };
                }

                // 3. Smart Suggested / Recommended Price
                let suggestedPrice = 0;
                let suggestedStrategy = '';
                let suggestedRationale = '';

                if (sourceCount >= 3) {
                    // Equilibrium trimmed/weighted market average
                    const sorted = [...numericPrices].sort((a, b) => a - b);
                    let targetVal = avgP;
                    if (sourceCount >= 4) {
                        // Trim highest and lowest for robust median pricing
                        const trimmed = sorted.slice(1, -1);
                        targetVal = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
                    }
                    // Round cleanly to 1,000,000 / 500,000 Tomans
                    suggestedPrice = Math.round(targetVal / 1_000_000) * 1_000_000;
                    suggestedStrategy = 'تعادلی بازار (مطمئن)';
                    suggestedRationale = `میانگین تعادلی ${sourceCount} مرجع استعلام، پالایش داده‌های حباب و گرد شده به میلیون`;
                } else if (sourceCount === 2) {
                    const rawAvg = (numericPrices[0] + numericPrices[1]) / 2;
                    suggestedPrice = Math.round(rawAvg / 1_000_000) * 1_000_000;
                    suggestedStrategy = 'میانگین ۲ مرجع';
                    suggestedRationale = 'میانگین مستقیم ۲ مرجع استعلام موجود در بازار';
                } else if (sourceCount === 1) {
                    suggestedPrice = numericPrices[0];
                    suggestedStrategy = 'تک‌مرجع (احتیاط)';
                    suggestedRationale = `بر مبنای تنها مرجع استعلام شده (${validSources[0]?.source_name || 'مرجع فعال'})`;
                } else {
                    suggestedPrice = v.manualPrice?.price_rial || v.stat?.average || 0;
                    suggestedStrategy = 'پایه / فاقد مرجع';
                    suggestedRationale = 'فاقد مرجع زنده بازار؛ نیازمند استعلام میدانی یا تعیین نرخ دستی';
                }

                const sourcesArr = (Object.entries(v.sourcePricesMap) as [string, ScrapedCarPrice][])
                    .filter(([_, sData]) => !!sData)
                    .map(([sName, sData]) => ({
                        name: sName,
                        price: sData.price_rial,
                        isStale: isOlderThan24Hours(sData.captured_at)
                    }));

                const isStaleItem = v.manualPrice ? isOlderThan24Hours(v.manualPrice.captured_at) : false;

                items.push({
                    baseModelName: group.baseModelName,
                    rawModelName: v.rawModelName,
                    year: v.year,
                    manualPrice: v.manualPrice,
                    hasApproved: !!v.manualPrice,
                    approvedPriceRial: v.manualPrice?.price_rial,
                    highestMarketPrice: maxP,
                    lowestMarketPrice: minP,
                    averageMarketPrice: avgP,
                    suggestedPrice,
                    suggestedStrategy,
                    suggestedRationale,
                    credibilityLevel,
                    credibilityScore,
                    credibilityStars,
                    credibilityLabel,
                    credibilityColor,
                    priceSpread: spread,
                    spreadPercentage: spreadPct,
                    sourceCount,
                    sourcesList: sourcesArr,
                    havaleh1Min: v.havaleh1Min,
                    havaleh1Max: v.havaleh1Max,
                    havaleh2Min: v.havaleh2Min,
                    havaleh2Max: v.havaleh2Max,
                    stat: v.stat,
                    isPriority: isGroupPriority,
                    priorityIndex: groupPriorityIdx,
                    isStale: isStaleItem
                });
            });
        });

        return items;
    }, [groupedCards]);

    // High-Level KPIs for the Sales Manager
    const kpis = useMemo(() => {
        const totalVariants = flatVariants.length;
        const approvedCount = flatVariants.filter(v => v.hasApproved).length;
        const pendingCount = totalVariants - approvedCount;
        const approvedCoveragePct = totalVariants > 0 ? Math.round((approvedCount / totalVariants) * 100) : 0;

        const maxSpreadItem = [...flatVariants].sort((a, b) => b.priceSpread - a.priceSpread)[0];
        const highVarianceCount = flatVariants.filter(v => v.priceSpread >= 50_000_000).length;

        const pricesWithMarket = flatVariants.filter(v => v.highestMarketPrice > 0);
        const fleetAvg = pricesWithMarket.length > 0
            ? Math.round(pricesWithMarket.reduce((sum, v) => sum + v.averageMarketPrice, 0) / pricesWithMarket.length)
            : 0;

        const highCredibilityCount = flatVariants.filter(v => v.credibilityLevel === 'very_high' || v.credibilityLevel === 'high').length;
        const lowCredibilityCount = flatVariants.filter(v => v.credibilityLevel === 'low' || v.credibilityLevel === 'none').length;

        const mostExpensive = [...flatVariants].sort((a, b) => b.highestMarketPrice - a.highestMarketPrice)[0];
        const mostAffordable = [...flatVariants].filter(v => v.lowestMarketPrice > 0).sort((a, b) => a.lowestMarketPrice - b.lowestMarketPrice)[0];

        const staleApprovedCount = flatVariants.filter(v => v.hasApproved && v.isStale).length;

        return {
            totalVariants,
            approvedCount,
            pendingCount,
            approvedCoveragePct,
            maxSpreadItem,
            highVarianceCount,
            highCredibilityCount,
            lowCredibilityCount,
            fleetAvg,
            mostExpensive,
            mostAffordable,
            staleApprovedCount
        };
    }, [flatVariants]);

    // Filter and Sort Table Rows
    const filteredRows = useMemo(() => {
        let result = [...flatVariants];

        // 1. Search Query
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter(r => 
                r.rawModelName.toLowerCase().includes(q) ||
                r.baseModelName.toLowerCase().includes(q) ||
                (r.year && r.year.includes(q))
            );
        }

        // 2. Status Filter
        if (statusFilter === 'approved') {
            result = result.filter(r => r.hasApproved);
        } else if (statusFilter === 'pending') {
            result = result.filter(r => !r.hasApproved);
        } else if (statusFilter === 'high_credibility') {
            result = result.filter(r => r.credibilityLevel === 'very_high' || r.credibilityLevel === 'high');
        } else if (statusFilter === 'low_credibility') {
            result = result.filter(r => r.credibilityLevel === 'low' || r.credibilityLevel === 'none');
        } else if (statusFilter === 'high_variance') {
            result = result.filter(r => r.priceSpread >= 50_000_000);
        } else if (statusFilter === 'priority') {
            result = result.filter(r => r.isPriority);
        }

        // 3. Year Filter
        if (selectedYearFilter !== 'all') {
            result = result.filter(r => r.year === selectedYearFilter);
        }

        // 4. Sorting
        result.sort((a, b) => {
            if (sortBy === 'priority') {
                if (a.priorityIndex !== b.priorityIndex) {
                    return sortDirection === 'asc' ? a.priorityIndex - b.priorityIndex : b.priorityIndex - a.priorityIndex;
                }
                // Then by approved status
                if (a.hasApproved !== b.hasApproved) {
                    return a.hasApproved ? -1 : 1;
                }
                return a.rawModelName.localeCompare(b.rawModelName, 'fa');
            }

            if (sortBy === 'credibility_desc') {
                return sortDirection === 'asc'
                    ? a.sourceCount - b.sourceCount
                    : b.sourceCount - a.sourceCount;
            }

            if (sortBy === 'credibility_asc') {
                return sortDirection === 'asc'
                    ? b.sourceCount - a.sourceCount
                    : a.sourceCount - b.sourceCount;
            }

            if (sortBy === 'suggested_price') {
                return sortDirection === 'asc'
                    ? a.suggestedPrice - b.suggestedPrice
                    : b.suggestedPrice - a.suggestedPrice;
            }

            if (sortBy === 'market_avg') {
                return sortDirection === 'asc'
                    ? a.averageMarketPrice - b.averageMarketPrice
                    : b.averageMarketPrice - a.averageMarketPrice;
            }

            if (sortBy === 'variance') {
                return sortDirection === 'asc'
                    ? a.priceSpread - b.priceSpread
                    : b.priceSpread - a.priceSpread;
            }

            if (sortBy === 'approved_price') {
                const pA = a.approvedPriceRial ?? (sortDirection === 'asc' ? Number.MAX_SAFE_INTEGER : -1);
                const pB = b.approvedPriceRial ?? (sortDirection === 'asc' ? Number.MAX_SAFE_INTEGER : -1);
                if (a.hasApproved !== b.hasApproved) {
                    return a.hasApproved ? -1 : 1;
                }
                return sortDirection === 'asc' ? pA - pB : pB - pA;
            }

            if (sortBy === 'market_max') {
                return sortDirection === 'asc'
                    ? a.highestMarketPrice - b.highestMarketPrice
                    : b.highestMarketPrice - a.highestMarketPrice;
            }

            if (sortBy === 'market_min') {
                return sortDirection === 'asc'
                    ? a.lowestMarketPrice - b.lowestMarketPrice
                    : b.lowestMarketPrice - a.lowestMarketPrice;
            }

            if (sortBy === 'model_name') {
                const cmp = a.rawModelName.localeCompare(b.rawModelName, 'fa');
                return sortDirection === 'asc' ? cmp : -cmp;
            }

            return 0;
        });

        return result;
    }, [flatVariants, searchQuery, statusFilter, selectedYearFilter, sortBy, sortDirection]);

    const handleOpenInlineEdit = (item: typeof flatVariants[0]) => {
        setEditingModel(item.rawModelName);
        setInlinePriceInput(
            item.approvedPriceRial 
                ? String(item.approvedPriceRial) 
                : (item.suggestedPrice > 0 ? String(item.suggestedPrice) : String(item.highestMarketPrice || ''))
        );
        setInlinePriceNote(item.suggestedPrice > 0 ? `بر مبنای پیشنهاد سیستم (${item.suggestedStrategy})` : 'تعیین توسط مدیر فروش');
    };

    const handleQuickApplySuggested = async (item: typeof flatVariants[0]) => {
        if (!item.suggestedPrice || item.suggestedPrice <= 0) {
            showToast('نرخ پیشنهادی معتبری برای این خودرو یافت نشد', 'error');
            return;
        }

        try {
            setApplyingSuggestedModel(item.rawModelName);
            await onAddCustomPriceSubmit({
                source_name: 'custom',
                model_name: item.rawModelName,
                price_rial: item.suggestedPrice,
                price_text: `پیشنهاد هوشمند سیستم (${item.suggestedStrategy} - ${item.credibilityLabel})`,
                captured_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            });
            showToast(`نرخ پیشنهادی ${item.suggestedPrice.toLocaleString('fa-IR')} تومان برای ${item.rawModelName} به عنوان قیمت مصوب ثبت گردید`, 'success');
        } catch {
            showToast('خطا در ثبت نرخ مصوب', 'error');
        } finally {
            setApplyingSuggestedModel(null);
        }
    };

    const handleSaveInlinePrice = async () => {
        if (!editingModel) return;
        const num = parseInt(inlinePriceInput.replace(/\D/g, ''), 10);
        if (isNaN(num) || num <= 0) {
            showToast('لطفاً یک مبلغ معتبر وارد کنید', 'error');
            return;
        }

        try {
            setIsSubmittingInline(true);
            await onAddCustomPriceSubmit({
                source_name: 'custom',
                model_name: editingModel,
                price_rial: num,
                price_text: inlinePriceNote.trim() || 'تعیین توسط مدیر فروش',
                captured_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            });
            setEditingModel(null);
            showToast(`قیمت مصوب برای ${editingModel} با موفقیت ذخیره شد`, 'success');
        } catch (err) {
            showToast('خطا در ثبت قیمت مصوب', 'error');
        } finally {
            setIsSubmittingInline(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" dir="rtl">
            {/* Main Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl border border-indigo-900/50">
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                <Target className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                                    <span>دستیار هوشمند تحلیل و استراتژی قیمت مدیر فروش</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black border border-amber-400/30">
                                        اختصاصی مدیریت
                                    </span>
                                </h1>
                                <p className="text-xs lg:text-sm text-slate-300 font-medium mt-1">
                                    پایش بلادرنگ حباب و نوسانات مراجع بازار، پوشش قیمت‌های مصوب نمایندگی و ابلاغیه استراتژی نرخ‌گذاری روزانه
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <button
                            type="button"
                            onClick={() => setIsBriefingModalOpen(true)}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-900/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                            <span>ابلاغیه روزانه نرخ‌ها (واتساپ/تلگرام)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsCalculatorOpen(true);
                                if (flatVariants.length > 0) setSelectedCalcModel(flatVariants[0].rawModelName);
                            }}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black border border-white/15 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                        >
                            <Calculator className="w-4 h-4 text-sky-400" />
                            <span>ماشین‌حساب حواله و حاشیه سود</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Strategic KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Tracked Models & Approved Coverage */}
                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 block">
                            پوشش نرخ‌های مصوب
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                                {kpis.approvedCount.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-xs font-bold text-slate-400">از {kpis.totalVariants} تیپ ({kpis.approvedCoveragePct}٪)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${kpis.approvedCoveragePct}%` }}
                            />
                        </div>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>

                {/* Metric 2: Pending Pricing Models */}
                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-black text-amber-500 block">
                            نیازمند تعیین نرخ فوری
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                                {kpis.pendingCount.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-xs font-bold text-slate-400">تیپ خودرو</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                            {kpis.pendingCount === 0 ? 'کلیه تیپ‌ها دارای نرخ مصوب هستند' : 'جهت یکپارچگی پیشنهادهای فروش تعیین گردد'}
                        </span>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </div>

                {/* Metric 3: Highest Market Spread */}
                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-black text-indigo-500 block">
                            بیشترین نوسان بازار (اسپرد)
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                {kpis.maxSpreadItem ? (kpis.maxSpreadItem.priceSpread / 1_000_000).toLocaleString('fa-IR') : 0}
                            </span>
                            <span className="text-xs font-bold text-slate-400">میلیون تومان</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[170px]" title={kpis.maxSpreadItem?.rawModelName}>
                            مدل: {kpis.maxSpreadItem?.rawModelName || '---'}
                        </span>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>

                {/* Metric 4: Fleet Average Price */}
                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 block">
                            میانگین نرخ بازار ناوگان
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
                                {kpis.fleetAvg > 0 ? (kpis.fleetAvg / 1_000_000).toFixed(0).toLocaleString() : 0}
                            </span>
                            <span className="text-xs font-bold text-slate-400">میلیون تومان</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                            گران‌ترین: {kpis.mostExpensive ? (kpis.mostExpensive.highestMarketPrice / 1_000_000_000).toFixed(2) : 0} م.ت
                        </span>
                    </div>
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-2xl border border-sky-100 dark:border-sky-900/50">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="جستجو در نام مدل خودرو یا سال ساخت..."
                            className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                statusFilter === 'all'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            همه ({flatVariants.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('priority')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                statusFilter === 'priority'
                                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            ⭐ اولویت نمایندگی
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('high_credibility')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                statusFilter === 'high_credibility'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            🛡️ اعتبار بالا ({kpis.highCredibilityCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('low_credibility')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                statusFilter === 'low_credibility'
                                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            ⚠️ اعتبار پایین ({kpis.lowCredibilityCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('pending')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                statusFilter === 'pending'
                                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            نیازمند مصوب ({kpis.pendingCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('approved')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                statusFilter === 'approved'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            دارای مصوب ({kpis.approvedCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter('high_variance')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                statusFilter === 'high_variance'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            🔥 نوسان &gt; ۵۰ م
                        </button>
                    </div>

                    {/* Year Filter Dropdown */}
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedYearFilter}
                            onChange={e => setSelectedYearFilter(e.target.value)}
                            aria-label="فیلتر سال ساخت خودرو"
                            className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                        >
                            <option value="all">📅 همه سال‌های ساخت</option>
                            {availableYears.map(y => (
                                <option key={y} value={y}>سال ساخت {y}</option>
                            ))}
                        </select>

                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            aria-label="مرتب‌سازی بر اساس"
                            className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                        >
                            <option value="priority">مرتب‌سازی: اولویت نمایندگی</option>
                            <option value="credibility_desc">مرتب‌سازی: بیشترین اعتبار مراجع (سورس‌های بیشتر)</option>
                            <option value="credibility_asc">مرتب‌سازی: کمترین اعتبار مراجع (تک‌مرجع/فاقد سورس)</option>
                            <option value="suggested_price">مرتب‌سازی: بیشترین نرخ پیشنهادی</option>
                            <option value="market_avg">مرتب‌سازی: بیشترین میانگین مراجع</option>
                            <option value="variance">مرتب‌سازی: بیشترین نوسان بازار (اسپرد)</option>
                            <option value="approved_price">مرتب‌سازی: قیمت مصوب نمایندگی</option>
                            <option value="market_max">مرتب‌سازی: بیشترین سقف قیمت</option>
                            <option value="market_min">مرتب‌سازی: کمترین کف قیمت</option>
                            <option value="model_name">مرتب‌سازی: نام خودرو</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title={sortDirection === 'asc' ? 'صعودی' : 'نزولی'}
                        >
                            <ArrowUpDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Price Strategy Table */}
            <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto" style={{ maxHeight: '75vh' }}>
                    <table className="w-full text-right text-xs text-slate-600 dark:text-slate-300 border-collapse">
                        <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-black border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th scope="col" className="py-3.5 px-4 sticky right-0 bg-slate-100 dark:bg-slate-800 z-30 min-w-[200px]">
                                    مدل خودرو و سال ساخت
                                </th>
                                <th scope="col" className="py-3.5 px-3 text-center min-w-[170px]">
                                    اعتبار نرخ (تعداد مراجع) 🛡️
                                </th>
                                <th scope="col" className="py-3.5 px-3 text-center min-w-[200px]">
                                    دامنه مراجع بازار (کف / میانگین / سقف) 📊
                                </th>
                                <th scope="col" className="py-3.5 px-3 text-center min-w-[190px]">
                                    قیمت پیشنهادی سیستم 💡
                                </th>
                                <th scope="col" className="py-3.5 px-3 text-center min-w-[170px]">
                                    قیمت مصوب نمایندگی 🏛️
                                </th>
                                <th scope="col" className="py-3.5 px-3 text-center min-w-[140px]">
                                    مراجع استعلام ({allSources.length})
                                </th>
                                <th scope="col" className="py-3.5 px-3 text-center min-w-[130px]">
                                    عملیات مدیریت
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold text-sm">
                                        خودرویی با شرایط فیلترشده یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((item, idx) => {
                                    const rowBg = idx % 2 === 0 ? 'bg-white dark:bg-slate-850' : 'bg-slate-50/50 dark:bg-slate-800/40';
                                    const isPriority = item.isPriority;
                                    const isApplyingThis = applyingSuggestedModel === item.rawModelName;

                                    return (
                                        <tr key={item.rawModelName} className={`${rowBg} hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors`}>
                                            {/* Model & Year */}
                                            <td className={`py-3.5 px-4 font-bold text-slate-900 dark:text-white sticky right-0 z-10 ${rowBg}`}>
                                                <div className="flex items-center gap-2">
                                                    {isPriority && (
                                                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="خودروی اولویت نمایندگی" />
                                                    )}
                                                    <div>
                                                        <span className="text-sm font-black text-slate-900 dark:text-white block">
                                                            {item.rawModelName}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            {item.year && (
                                                                <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono font-bold">
                                                                    سال {item.year}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-slate-400 font-normal">
                                                                {item.baseModelName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Credibility & Source Count Rating */}
                                            <td className="py-3.5 px-3 text-center">
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    {/* Stars Rating */}
                                                    <div className="flex items-center gap-0.5" title={`امتیاز اعتبار: ${item.credibilityScore} از ۱۰۰`}>
                                                        {[1, 2, 3, 4, 5].map(starIndex => (
                                                            <Star 
                                                                key={starIndex}
                                                                className={`w-3 h-3 ${
                                                                    starIndex <= item.credibilityStars 
                                                                        ? (item.credibilityStars >= 4 ? 'text-emerald-500 fill-emerald-500' : item.credibilityStars === 3 ? 'text-teal-500 fill-teal-500' : item.credibilityStars === 2 ? 'text-amber-500 fill-amber-500' : 'text-rose-500 fill-rose-500')
                                                                        : 'text-slate-200 dark:text-slate-700 fill-transparent'
                                                                }`} 
                                                            />
                                                        ))}
                                                    </div>
                                                    
                                                    {/* Credibility Badge */}
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border flex items-center gap-1 ${item.credibilityColor.bg} ${item.credibilityColor.text} ${item.credibilityColor.border}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${item.credibilityColor.badge}`} />
                                                        <span>{item.credibilityLabel}</span>
                                                    </span>

                                                    {item.sourceCount <= 1 && (
                                                        <span className="text-[9px] text-rose-500 font-bold">
                                                            نیاز به استعلام مکمل
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Market Price Range: Min, Avg, Max */}
                                            <td className="py-3.5 px-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    {/* Average Market Price */}
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-[10px] text-slate-400 font-bold">میانگین:</span>
                                                        <span className="font-mono font-black text-sm text-slate-850 dark:text-slate-100">
                                                            {item.averageMarketPrice > 0 ? (
                                                                <span>{item.averageMarketPrice.toLocaleString('fa-IR')} <span className="text-[10px] font-sans font-normal text-slate-400">تومان</span></span>
                                                            ) : (
                                                                <span className="text-slate-400 font-sans">-</span>
                                                            )}
                                                        </span>
                                                    </div>

                                                    {/* Min & Max Sub-row */}
                                                    <div className="flex items-center gap-2 text-[10px] font-mono">
                                                        <span className="text-emerald-600 dark:text-emerald-400" title="کمترین نرخ گزارش شده">
                                                            کف: {item.lowestMarketPrice > 0 ? (item.lowestMarketPrice / 1_000_000).toLocaleString('fa-IR') : '-'}
                                                        </span>
                                                        <span className="text-slate-300 dark:text-slate-700">|</span>
                                                        <span className="text-rose-600 dark:text-rose-400" title="بیشترین نرخ گزارش شده">
                                                            سقف: {item.highestMarketPrice > 0 ? (item.highestMarketPrice / 1_000_000).toLocaleString('fa-IR') : '-'}
                                                        </span>
                                                    </div>

                                                    {/* Variance / Spread */}
                                                    {item.priceSpread > 0 && (
                                                        <span className={`text-[9px] font-bold ${item.priceSpread >= 50_000_000 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                                                            اختلاف: {(item.priceSpread / 1_000_000).toLocaleString('fa-IR')} م.ت ({item.spreadPercentage.toFixed(1)}٪)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Smart Suggested Price & Quick Apply Action */}
                                            <td className="py-3.5 px-3 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    {item.suggestedPrice > 0 ? (
                                                        <>
                                                            <div className="inline-flex items-baseline gap-1 bg-amber-50/80 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800/60 shadow-xs">
                                                                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                                <span className="font-mono font-black text-sm text-amber-900 dark:text-amber-300">
                                                                    {item.suggestedPrice.toLocaleString('fa-IR')}
                                                                </span>
                                                                <span className="text-[10px] font-sans font-normal text-amber-700 dark:text-amber-400">تومان</span>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold" title={item.suggestedRationale}>
                                                                    {item.suggestedStrategy}
                                                                </span>

                                                                {/* Quick Apply Button */}
                                                                <button
                                                                    type="button"
                                                                    disabled={isApplyingThis}
                                                                    onClick={() => handleQuickApplySuggested(item)}
                                                                    className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs hover:scale-105 active:scale-95"
                                                                    title="تأیید و اعمال مستقیم این مبلغ به عنوان قیمت مصوب نمایندگی"
                                                                >
                                                                    {isApplyingThis ? (
                                                                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle className="w-2.5 h-2.5" />
                                                                    )}
                                                                    <span>تأیید پیشنهاد</span>
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400 font-sans text-[11px]">نیازمند بررسی</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Dealership Approved Price */}
                                            <td className="py-3.5 px-3 text-center">
                                                {item.hasApproved ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="font-mono font-black text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                                            {item.approvedPriceRial?.toLocaleString('fa-IR')} <span className="text-[10px] font-sans font-normal">ت</span>
                                                        </span>
                                                        {item.manualPrice?.price_text && (
                                                            <span className="text-[9px] text-slate-400 mt-0.5 max-w-[130px] truncate" title={item.manualPrice.price_text}>
                                                                {item.manualPrice.price_text}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenInlineEdit(item)}
                                                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-400 text-[11px] font-black border border-amber-200 dark:border-amber-800 transition-all cursor-pointer flex items-center gap-1 mx-auto"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        <span>تعیین نرخ مصوب</span>
                                                    </button>
                                                )}
                                            </td>

                                            {/* Scraped Sources Count & Tooltips */}
                                            <td className="py-3.5 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1 flex-wrap max-w-[160px] mx-auto">
                                                    {item.sourcesList.length === 0 ? (
                                                        <span className="text-slate-400 text-[10px]">فاقد سورس زنده</span>
                                                    ) : (
                                                        item.sourcesList.slice(0, 3).map(s => (
                                                            <span
                                                                key={s.name}
                                                                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold"
                                                                title={`${s.name}: ${s.price.toLocaleString('fa-IR')} تومان`}
                                                            >
                                                                {s.name}
                                                            </span>
                                                        ))
                                                    )}
                                                    {item.sourcesList.length > 3 && (
                                                        <span className="text-[9px] text-slate-400 font-bold">
                                                            +{item.sourcesList.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenInlineEdit(item)}
                                                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                                                        title="ویرایش یا تعیین قیمت مصوب"
                                                    >
                                                        {item.hasApproved ? 'تغییر نرخ' : 'تعیین نرخ'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCalcModel(item.rawModelName);
                                                            setIsCalculatorOpen(true);
                                                        }}
                                                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                                        title="محاسبه دقیق حواله این خودرو"
                                                    >
                                                        <Calculator className="w-3.5 h-3.5 text-sky-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL 1: DAILY PRICING STRATEGY BRIEFING FOR SALES SPECIALISTS */}
            {isBriefingModalOpen && (
                <SalesPricingBriefingModal
                    isOpen={isBriefingModalOpen}
                    onClose={() => setIsBriefingModalOpen(false)}
                    items={flatVariants}
                    lastUpdated={lastUpdated}
                    showToast={showToast}
                />
            )}

            {/* MODAL 2: HAVALEH & PROFIT SIMULATOR CALCULATOR */}
            {isCalculatorOpen && (
                <HavalehProfitCalculatorModal
                    isOpen={isCalculatorOpen}
                    onClose={() => setIsCalculatorOpen(false)}
                    items={flatVariants}
                    initialSelectedModel={selectedCalcModel}
                    onSaveApprovedPrice={async (modelName, priceRial) => {
                        await onAddCustomPriceSubmit({
                            source_name: 'custom',
                            model_name: modelName,
                            price_rial: priceRial,
                            price_text: 'محاسبه شده در دستیار قیمت مدیر فروش',
                            captured_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                        });
                        showToast(`قیمت ${priceRial.toLocaleString('fa-IR')} برای ${modelName} ثبت شد`, 'success');
                    }}
                />
            )}

            {/* MODAL 3: INLINE QUICK PRICE APPROVER */}
            {editingModel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" dir="rtl">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                <span>تعیین قیمت مصوب نمایندگی</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingModel(null)}
                                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                                انصراف
                            </button>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs text-slate-400 font-bold block">نام مدل خودرو:</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white block">{editingModel}</span>
                        </div>

                        {/* Price Input */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                                مبلغ قیمت مصوب (تومان):
                            </label>
                            <input
                                type="text"
                                value={inlinePriceInput ? Number(inlinePriceInput.replace(/\D/g, '')).toLocaleString('fa-IR') : ''}
                                onChange={e => {
                                    const raw = e.target.value.replace(/[^\d۰-۹]/g, '');
                                    const eng = raw.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
                                    setInlinePriceInput(eng);
                                }}
                                placeholder="مثلاً: ۱,۸۵۰,۰۰۰,۰۰۰"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-base font-mono font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Quick Reference Pickers from Scraped Sources */}
                        {(() => {
                            const curItem = flatVariants.find(v => v.rawModelName === editingModel);
                            if (!curItem || curItem.sourcesList.length === 0) return null;
                            return (
                                <div className="space-y-1 pt-1">
                                    <span className="text-[11px] font-bold text-slate-400 block">انتخاب سریع از مراجع استعلام:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {curItem.sourcesList.map(s => (
                                            <button
                                                key={s.name}
                                                type="button"
                                                onClick={() => {
                                                    setInlinePriceInput(String(s.price));
                                                    setInlinePriceNote(`انتخاب از مرجع ${s.name}`);
                                                }}
                                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                                            >
                                                {s.name}: {s.price.toLocaleString('fa-IR')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Note Input */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                                یادداشت یا مرجع:
                            </label>
                            <input
                                type="text"
                                value={inlinePriceNote}
                                onChange={e => setInlinePriceNote(e.target.value)}
                                placeholder="توضیح کوتاه در مورد این نرخ..."
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setEditingModel(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveInlinePrice}
                                disabled={isSubmittingInline}
                                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                            >
                                {isSubmittingInline ? 'در حال ثبت...' : 'ثبت به عنوان قیمت مصوب'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* =========================================================================
   SUB-COMPONENT: SALES PRICING BRIEFING MODAL (ابلاغیه نرخ روزانه)
   ========================================================================= */
interface SalesPricingBriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: Array<{
        rawModelName: string;
        year: string | null;
        hasApproved: boolean;
        approvedPriceRial?: number;
        highestMarketPrice: number;
        lowestMarketPrice: number;
        averageMarketPrice: number;
        suggestedPrice: number;
        credibilityLabel: string;
        havaleh1Min: number;
        havaleh1Max: number;
        isPriority: boolean;
    }>;
    lastUpdated?: string;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const SalesPricingBriefingModal: React.FC<SalesPricingBriefingModalProps> = ({
    isOpen,
    onClose,
    items,
    lastUpdated,
    showToast
}) => {
    const [managerNote, setManagerNote] = useState<string>(
        'همکاران گرامی واحد فروش، نرخ‌های مصوب فوق جهت انعقاد قرارداد و مذاکره با متقاضیان امروز ملاک عمل می‌باشد.'
    );
    const [includeHavaleh, setIncludeHavaleh] = useState<boolean>(true);
    const [includeSuggested, setIncludeSuggested] = useState<boolean>(true);
    const [priorityOnly, setPriorityOnly] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    const nowStr = useMemo(() => {
        const now = new Date();
        return {
            date: now.toLocaleDateString('fa-IR'),
            time: now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        };
    }, []);

    const briefingText = useMemo(() => {
        let text = `📊 ابلاغیه استراتژی و نرخ‌های مصوب فروش روزانه\n`;
        text += `🏢 نمایندگی ۲۶۰۶ کرمان موتور\n`;
        text += `📅 تاریخ: ${nowStr.date} - ساعت: ${nowStr.time}\n\n`;

        if (managerNote.trim()) {
            text += `📌 دستور کار مدیر فروش:\n`;
            text += `«${managerNote.trim()}»\n\n`;
        }

        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🚗 لیست قیمت‌های مصوب، میانگین مراجع و برآورد بازار:\n\n`;

        const displayItems = priorityOnly ? items.filter(i => i.isPriority) : items;

        displayItems.forEach((item, idx) => {
            text += `${idx + 1}. ${item.rawModelName}\n`;
            if (item.hasApproved && item.approvedPriceRial) {
                text += `   🏛️ نرخ مصوب نمایندگی: ${item.approvedPriceRial.toLocaleString('fa-IR')} تومان\n`;
            } else if (includeSuggested && item.suggestedPrice > 0) {
                text += `   💡 پیشنهاد تعادلی سیستم: ${item.suggestedPrice.toLocaleString('fa-IR')} تومان (${item.credibilityLabel})\n`;
            }
            if (item.highestMarketPrice > 0) {
                text += `   📊 میانگین مراجع: ${item.averageMarketPrice.toLocaleString('fa-IR')} تومان (کف: ${(item.lowestMarketPrice / 1_000_000).toLocaleString('fa-IR')} م | سقف: ${(item.highestMarketPrice / 1_000_000).toLocaleString('fa-IR')} م)\n`;
            }
            if (includeHavaleh && item.havaleh1Min > 0) {
                text += `   🎫 برآورد حواله ۱ ماهه: ${Math.round(item.havaleh1Min).toLocaleString('fa-IR')} تا ${Math.round(item.havaleh1Max).toLocaleString('fa-IR')} تومان\n`;
            }
            text += `\n`;
        });

        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `${DEFAULT_DEALERSHIP_FOOTER}\n`;

        return text;
    }, [nowStr, managerNote, items, priorityOnly, includeHavaleh, includeSuggested]);

    const handleCopy = () => {
        navigator.clipboard.writeText(briefingText);
        setCopied(true);
        showToast('ابلاغیه نرخ روز با موفقیت کپی شد', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Send className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                ابلاغیه استراتژی قیمت و نرخ‌های روزانه
                            </h3>
                            <p className="text-xs text-slate-400 font-bold">
                                قالب آماده کپی و اشتراک‌گذاری در گروه‌های کارشناسان و شبکه‌های اجتماعی
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-400">
                        ✕
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Note input */}
                    <div className="space-y-1">
                        <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                            دستور کار مدیر فروش برای تیم:
                        </label>
                        <textarea
                            value={managerNote}
                            onChange={e => setManagerNote(e.target.value)}
                            rows={2}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="متن دستور کار روزانه..."
                        />
                    </div>

                    {/* Toggle Options */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeHavaleh}
                                onChange={e => setIncludeHavaleh(e.target.checked)}
                                className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                            />
                            <span>شامل برآورد حواله‌ها</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeSuggested}
                                onChange={e => setIncludeSuggested(e.target.checked)}
                                className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                            />
                            <span>نمایش پیشنهاد تعادلی برای مدل‌های فاقد مصوب</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={priorityOnly}
                                onChange={e => setPriorityOnly(e.target.checked)}
                                className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                            />
                            <span>فقط خودروهای اولویت ۱</span>
                        </label>
                    </div>

                    {/* Text Preview Box */}
                    <div className="space-y-1 pt-2">
                        <span className="text-[11px] font-black text-slate-400 block">پیش‌نمایش متن خروجی:</span>
                        <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar border border-slate-800 select-all">
                            {briefingText}
                        </pre>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                    >
                        بستن
                    </button>

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'کپی شد!' : 'کپی کل متن ابلاغیه'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

/* =========================================================================
   SUB-COMPONENT: HAVALEH & ARBITRAGE CALCULATOR MODAL (ماشین‌حساب حواله)
   ========================================================================= */
interface HavalehProfitCalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: Array<{
        rawModelName: string;
        highestMarketPrice: number;
        lowestMarketPrice: number;
        averageMarketPrice: number;
        suggestedPrice: number;
        hasApproved: boolean;
        approvedPriceRial?: number;
    }>;
    initialSelectedModel?: string;
    onSaveApprovedPrice: (modelName: string, priceRial: number) => Promise<void>;
}

const HavalehProfitCalculatorModal: React.FC<HavalehProfitCalculatorModalProps> = ({
    isOpen,
    onClose,
    items,
    initialSelectedModel = '',
    onSaveApprovedPrice
}) => {
    const [selectedModel, setSelectedModel] = useState<string>(initialSelectedModel || (items[0]?.rawModelName || ''));
    const [basePriceType, setBasePriceType] = useState<'suggested' | 'market_avg' | 'market_max' | 'market_min' | 'approved' | 'custom'>('suggested');
    const [customBasePrice, setCustomBasePrice] = useState<string>('');
    const [discountMonth1Pct, setDiscountMonth1Pct] = useState<number>(4);
    const [discountMonth2Pct, setDiscountMonth2Pct] = useState<number>(8);
    const [discountMonth3Pct, setDiscountMonth3Pct] = useState<number>(12);

    const activeItem = useMemo(() => {
        return items.find(i => i.rawModelName === selectedModel) || items[0];
    }, [items, selectedModel]);

    const effectiveBasePrice = useMemo(() => {
        if (!activeItem) return 0;
        if (basePriceType === 'suggested' && activeItem.suggestedPrice > 0) {
            return activeItem.suggestedPrice;
        }
        if (basePriceType === 'market_avg' && activeItem.averageMarketPrice > 0) {
            return activeItem.averageMarketPrice;
        }
        if (basePriceType === 'approved' && activeItem.hasApproved && activeItem.approvedPriceRial) {
            return activeItem.approvedPriceRial;
        }
        if (basePriceType === 'market_min' && activeItem.lowestMarketPrice > 0) {
            return activeItem.lowestMarketPrice;
        }
        if (basePriceType === 'custom') {
            const parsed = parseInt(customBasePrice.replace(/\D/g, ''), 10);
            return isNaN(parsed) ? 0 : parsed;
        }
        return activeItem.highestMarketPrice || 0;
    }, [activeItem, basePriceType, customBasePrice]);

    const calculations = useMemo(() => {
        const m1 = effectiveBasePrice * (1 - discountMonth1Pct / 100);
        const m2 = effectiveBasePrice * (1 - discountMonth2Pct / 100);
        const m3 = effectiveBasePrice * (1 - discountMonth3Pct / 100);

        const m1Profit = effectiveBasePrice - m1;
        const m2Profit = effectiveBasePrice - m2;
        const m3Profit = effectiveBasePrice - m3;

        return {
            m1, m2, m3,
            m1Profit, m2Profit, m3Profit
        };
    }, [effectiveBasePrice, discountMonth1Pct, discountMonth2Pct, discountMonth3Pct]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                ماشین‌حساب تحلیل حواله و حاشیه سود تحویل مدت‌دار
                            </h3>
                            <p className="text-xs text-slate-400 font-bold">
                                شبیه‌سازی قیمت واگذاری حواله و تخفیف خواب سرمایه بر اساس نوسان بازار
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-400">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Model Select */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                            انتخاب خودرو جهت شبیه‌سازی:
                        </label>
                        <select
                            value={selectedModel}
                            onChange={e => setSelectedModel(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            {items.map(i => (
                                <option key={i.rawModelName} value={i.rawModelName}>
                                    {i.rawModelName} (پیشنهاد سیستم: {i.suggestedPrice > 0 ? i.suggestedPrice.toLocaleString('fa-IR') : i.highestMarketPrice.toLocaleString('fa-IR')} تومان)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Base Price Basis Selector */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                            مبنای قیمت نقدی خودرو:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setBasePriceType('suggested')}
                                className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    basePriceType === 'suggested'
                                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-800 dark:text-amber-300'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                💡 پیشنهاد سیستم
                            </button>

                            <button
                                type="button"
                                onClick={() => setBasePriceType('market_avg')}
                                className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    basePriceType === 'market_avg'
                                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                📊 میانگین مراجع
                            </button>

                            <button
                                type="button"
                                onClick={() => setBasePriceType('approved')}
                                className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    basePriceType === 'approved'
                                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                🏛️ نرخ مصوب
                            </button>

                            <button
                                type="button"
                                onClick={() => setBasePriceType('market_max')}
                                className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    basePriceType === 'market_max'
                                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                📈 سقف بازار
                            </button>

                            <button
                                type="button"
                                onClick={() => setBasePriceType('market_min')}
                                className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    basePriceType === 'market_min'
                                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                📉 کف بازار
                            </button>

                            <button
                                type="button"
                                onClick={() => setBasePriceType('custom')}
                                className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    basePriceType === 'custom'
                                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                ✏️ مبلغ دلخواه
                            </button>
                        </div>
                    </div>

                    {basePriceType === 'custom' && (
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                                مبلغ دلخواه نقدی (تومان):
                            </label>
                            <input
                                type="text"
                                value={customBasePrice ? Number(customBasePrice.replace(/\D/g, '')).toLocaleString('fa-IR') : ''}
                                onChange={e => {
                                    const raw = e.target.value.replace(/[^\d۰-۹]/g, '');
                                    const eng = raw.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
                                    setCustomBasePrice(eng);
                                }}
                                placeholder="مثلاً: ۲,۰۰۰,۰۰۰,۰۰۰"
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none"
                            />
                        </div>
                    )}

                    {/* Effective Base Display */}
                    <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">مبنای قیمت نقدی:</span>
                        <span className="text-lg font-mono font-black text-indigo-900 dark:text-indigo-200">
                            {effectiveBasePrice.toLocaleString('fa-IR')} <span className="text-xs font-sans font-normal">تومان</span>
                        </span>
                    </div>

                    {/* Calculated Scenarios Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 1 Month */}
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">تحویل ۱ ماهه</span>
                                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                                    {discountMonth1Pct}٪ تخفیف
                                </span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">قیمت تمام‌شده برای مشتری:</span>
                                <span className="text-base font-mono font-black text-emerald-950 dark:text-emerald-200 block">
                                    {Math.round(calculations.m1).toLocaleString('fa-IR')} تومان
                                </span>
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-medium">
                                    سود مشتری: {Math.round(calculations.m1Profit).toLocaleString('fa-IR')} ت
                                </span>
                            </div>
                        </div>

                        {/* 2 Months */}
                        <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/40 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-cyan-800 dark:text-cyan-300">تحویل ۲ ماهه</span>
                                <span className="text-[10px] font-mono font-bold text-cyan-600 bg-cyan-100 dark:bg-cyan-900/60 px-1.5 py-0.5 rounded">
                                    {discountMonth2Pct}٪ تخفیف
                                </span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">قیمت تمام‌شده برای مشتری:</span>
                                <span className="text-base font-mono font-black text-cyan-950 dark:text-cyan-200 block">
                                    {Math.round(calculations.m2).toLocaleString('fa-IR')} تومان
                                </span>
                                <span className="text-[10px] text-cyan-700 dark:text-cyan-400 block font-medium">
                                    سود مشتری: {Math.round(calculations.m2Profit).toLocaleString('fa-IR')} ت
                                </span>
                            </div>
                        </div>

                        {/* 3 Months */}
                        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/40 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-sky-800 dark:text-sky-300">تحویل ۳ ماهه</span>
                                <span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-100 dark:bg-sky-900/60 px-1.5 py-0.5 rounded">
                                    {discountMonth3Pct}٪ تخفیف
                                </span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">قیمت تمام‌شده برای مشتری:</span>
                                <span className="text-base font-mono font-black text-sky-950 dark:text-sky-200 block">
                                    {Math.round(calculations.m3).toLocaleString('fa-IR')} تومان
                                </span>
                                <span className="text-[10px] text-sky-700 dark:text-sky-400 block font-medium">
                                    سود مشتری: {Math.round(calculations.m3Profit).toLocaleString('fa-IR')} ت
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                    >
                        بستن
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            if (activeItem && effectiveBasePrice > 0) {
                                onSaveApprovedPrice(activeItem.rawModelName, effectiveBasePrice);
                                onClose();
                            }
                        }}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                        ثبت {effectiveBasePrice.toLocaleString('fa-IR')} تومان به عنوان قیمت مصوب
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesManagerPriceAssistant;
