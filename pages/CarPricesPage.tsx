
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getScrapedCarPrices, getScrapedCarPriceSources, getCarPriceStats, addCustomPrice } from '../services/api';
import type { ScrapedCarPrice, CarPriceSource, CarPriceStats } from '../types';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { SortIcon } from '../components/icons/SortIcon';
import { CopyIcon } from '../components/icons/CopyIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import CarPriceCopySettingsModal, { PRIORITY_MODELS, getModelPriorityIndex } from '../components/CarPriceCopySettingsModal';
import AddCustomPriceModal from '../components/AddCustomPriceModal';
import { 
    Plus, Clock, ChevronDown, ChevronUp, AlertTriangle, RefreshCw, 
    TrendingUp, Search, Filter, ArrowUpDown, X, Car, Sparkles, Layers, Calendar
} from 'lucide-react';

export interface ModelYearParsed {
    baseModel: string;
    year: string | null;
    originalName: string;
}

export const parseModelAndYear = (rawName: string): ModelYearParsed => {
    if (!rawName) return { baseModel: '', year: null, originalName: '' };
    const trimmed = rawName.trim();
    
    // Normalize Persian digits to English digits for year detection
    const persianToEnglish = (s: string) =>
        s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());

    const normalized = persianToEnglish(trimmed);

    // Matches year patterns at the end of the string, e.g. "1403", "1404", "1405", "2023", "2024", "مدل 1403", "- 1404", "(1404)"
    const match = normalized.match(/\s*[-–_/(]?\s*(?:مدل\s*)?(13[89]\d|140\d|141\d|142\d|20[123]\d)\s*[)]?$/i);
    
    if (match && match.index !== undefined) {
        const year = match[1];
        const base = trimmed.substring(0, match.index).trim();
        if (base.length > 0) {
            return {
                baseModel: base,
                year,
                originalName: trimmed
            };
        }
    }
    
    return {
        baseModel: trimmed,
        year: null,
        originalName: trimmed
    };
};

const timeAgo = (dateString: string): string => {
    try {
        // API returns UTC in 'YYYY-MM-DD HH:MM:SS' format.
        // We parse it manually as UTC to avoid browser inconsistencies with `new Date(string)`.
        const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
        if (!parts) return dateString;

        const [_, year, month, day, hour, minute, second] = parts.map(Number);
        // Date.UTC expects month to be 0-indexed.
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

        if (isNaN(date.getTime())) return dateString;
        
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'همین الان';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return new Intl.RelativeTimeFormat('fa-IR').format(-minutes, 'minute');

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return new Intl.RelativeTimeFormat('fa-IR').format(-hours, 'hour');

        const days = Math.floor(hours / 24);
        return new Intl.RelativeTimeFormat('fa-IR').format(-days, 'day');

    } catch(e) {
        return dateString;
    }
};

const isOlderThan24Hours = (dateString: string): boolean => {
    try {
        const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
        if (!parts) return false;

        const [_, year, month, day, hour, minute, second] = parts.map(Number);
        // Date.UTC expects month to be 0-indexed.
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

        if (isNaN(date.getTime())) return false;
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        return diffMs > 24 * 60 * 60 * 1000;
    } catch(e) {
        return false;
    }
};

const isOlderThan3Days = (dateString: string): boolean => {
    try {
        const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
        if (!parts) return false;

        const [_, year, month, day, hour, minute, second] = parts.map(Number);
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

        if (isNaN(date.getTime())) return false;
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        return diffMs > 3 * 24 * 60 * 60 * 1000;
    } catch(e) {
        return false;
    }
};

type TableRow = { 
    model_name: string;
    minPrice: number;
    maxPrice: number;
    [source: string]: number | string; 
};

interface ModelVariant {
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

interface GroupedCardData {
    baseModelName: string;
    variants: ModelVariant[];
    years: string[];
    hasApprovedPrice: boolean;
    primaryApprovedPrice?: number;
    highestMarketPrice: number;
    lowestMarketPrice: number;
    allSources: string[];
}

interface CarPricesPageProps {}

const CarPricesPage: React.FC<CarPricesPageProps> = () => {
    const [prices, setPrices] = useState<ScrapedCarPrice[]>([]);
    const [sources, setSources] = useState<string[]>([]);
    const [priceStats, setPriceStats] = useState<CarPriceStats[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'model_name', direction: 'ascending' });
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Auto Refresh State
    const [refreshInterval, setRefreshInterval] = useState<number>(0); // 0 means manual
    const [secondsLeft, setSecondsLeft] = useState<number>(0);

    // Search, Filter & Sort states for Price Summary
    const [statsSearchQuery, setStatsSearchQuery] = useState<string>('');
    const [statsSortField, setStatsSortField] = useState<'priority' | 'approved_price' | 'model_name' | 'max_price' | 'min_price'>('priority');
    const [statsSortDirection, setStatsSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all'); // 'all', 'custom', or specific source name
    const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all'); // 'all' or specific year like '1404'
    const [selectedYearByModel, setSelectedYearByModel] = useState<Record<string, string>>({});

    const formatTimeLeft = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Copy Modal State
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

    // Add Custom Price Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
    
    // Havaleh Visibility States
    const [showHavalehs, setShowHavalehs] = useState<boolean>(false);
    const [expandedHavalehs, setExpandedHavalehs] = useState<Record<string, boolean>>({});

    const toggleHavalehExpanded = (modelKey: string) => {
        setExpandedHavalehs(prev => ({
            ...prev,
            [modelKey]: prev[modelKey] !== undefined ? !prev[modelKey] : !showHavalehs
        }));
    };

    const toggleCardExpanded = (modelKey: string) => {
        setExpandedCards(prev => {
            const isCurrentlyExpanded = prev[modelKey] !== undefined ? prev[modelKey] : true;
            return {
                ...prev,
                [modelKey]: !isCurrentlyExpanded
            };
        });
    };

    const existingModelsList = useMemo(() => {
        const models = new Set<string>();
        priceStats.forEach(stat => models.add(stat.model_name));
        prices.forEach(p => models.add(p.model_name));
        return Array.from(models).sort();
    }, [priceStats, prices]);

    const handleAddCustomPriceSubmit = async (payload: {
        source_name: 'custom';
        model_name: string;
        price_rial: number;
        price_text: string;
        captured_at: string;
    }) => {
        await addCustomPrice(payload);
        showToast('قیمت دستی خودرو با موفقیت ثبت شد', 'success');
        await fetchAllData();
    };

    const handleSelectAsApprovedPrice = async (modelName: string, sourceName: string, priceRial: number) => {
        const formattedPrice = priceRial.toLocaleString('fa-IR');
        const isConfirmed = window.confirm(
            `آیا می‌خواهید این قیمت (${formattedPrice} تومان از مرجع «${sourceName}») را به عنوان قیمت مصوب برای «${modelName}» انتخاب کنید؟`
        );

        if (!isConfirmed) return;

        try {
            setLoading(true);
            await addCustomPrice({
                source_name: 'custom',
                model_name: modelName,
                price_rial: priceRial,
                price_text: `انتخاب شده از مرجع ${sourceName}`,
                captured_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            });
            showToast(`قیمت ${formattedPrice} تومان به عنوان قیمت مصوب برای ${modelName} ثبت شد`, 'success');
            await fetchAllData();
        } catch (err) {
            showToast('خطا در ثبت قیمت مصوب', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [pricesData, sourcesData, statsData] = await Promise.all([
                getScrapedCarPrices(),
                getScrapedCarPriceSources(),
                getCarPriceStats()
            ]);
            
            const filteredPrices = pricesData.filter(price => {
                if (price.source_name === 'custom') {
                    return !isOlderThan24Hours(price.captured_at);
                }
                return !isOlderThan3Days(price.captured_at);
            });

            const latestPrices = new Map<string, ScrapedCarPrice>();
            filteredPrices.forEach(price => {
                const key = `${price.model_name}-${price.source_name}`;
                const existing = latestPrices.get(key);
                const priceDate = new Date(price.captured_at.replace(' ', 'T') + 'Z');
                if (!existing || priceDate > new Date(existing.captured_at.replace(' ', 'T') + 'Z')) {
                    latestPrices.set(key, price);
                }
            });

            const uniquePrices = Array.from(latestPrices.values());
            setPrices(uniquePrices);
            
            const customExists = uniquePrices.some(p => p.source_name === 'custom');
            const sourceNamesList = sourcesData.map((s: CarPriceSource) => s.source_name);
            if (customExists && !sourceNamesList.includes('custom')) {
                sourceNamesList.push('custom');
            }
            setSources(sourceNamesList.sort());
            
            const filteredStats = statsData.filter(stat => {
                const hasActiveCustom = uniquePrices.some(p => p.model_name === stat.model_name && p.source_name === 'custom');
                if (hasActiveCustom) return true;
                return !isOlderThan3Days(stat.computed_at);
            });
            setPriceStats(filteredStats.sort((a, b) => b.maximum - a.maximum));

            if (uniquePrices.length > 0) {
                 const mostRecentDateString = uniquePrices.reduce((latest, current) => {
                    const latestDate = new Date(latest.captured_at.replace(' ', 'T') + 'Z');
                    const currentDate = new Date(current.captured_at.replace(' ', 'T') + 'Z');
                    return currentDate > latestDate ? current : latest;
                }).captured_at;
                
                setLastUpdated(mostRecentDateString);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        const handleRefresh = () => {
            fetchAllData();
        };
        window.addEventListener('app-refresh', handleRefresh);
        return () => window.removeEventListener('app-refresh', handleRefresh);
    }, [fetchAllData]);

    // Effect for the auto refresh timer
    useEffect(() => {
        if (refreshInterval <= 0) {
            setSecondsLeft(0);
            return;
        }

        setSecondsLeft(refreshInterval * 60);

        const intervalId = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    fetchAllData();
                    return refreshInterval * 60;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [refreshInterval, fetchAllData]);

    const tableData = useMemo((): TableRow[] => {
        const groupedByModel = prices.reduce((acc, price) => {
            if (!acc[price.model_name]) {
                acc[price.model_name] = {};
            }
            acc[price.model_name][price.source_name] = price.price_rial;
            return acc;
        }, {} as Record<string, Record<string, number>>);

        return Object.entries(groupedByModel).map(([model_name, sourcePrices]) => {
            const numericPrices = Object.values(sourcePrices).filter(p => p > 0);
            
            const row: Partial<TableRow> = { 
                model_name,
                minPrice: numericPrices.length > 0 ? Math.min(...numericPrices) : 0,
                maxPrice: numericPrices.length > 0 ? Math.max(...numericPrices) : 0,
            };

            sources.forEach(source => {
                row[source] = sourcePrices[source] ?? 0;
            });
            return row as TableRow;
        });
    }, [prices, sources]);

    const sortedTableData = useMemo(() => {
        if (!sortConfig.key) return tableData;

        return [...tableData].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                if (aValue === 0 && bValue > 0) return 1;
                if (bValue === 0 && aValue > 0) return -1;
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            }
            
            const aStr = String(aValue);
            const bStr = String(bValue);

            const comparison = aStr.localeCompare(bStr, 'fa-IR');
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }, [tableData, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const handleCopyStatsClick = () => {
        if (priceStats.length === 0) {
            showToast('آماری برای کپی کردن وجود ندارد', 'error');
            return;
        }
        setIsCopyModalOpen(true);
    };

    const SortableHeader: React.FC<{ title: string; sortKey: string; className?: string }> = ({ title, sortKey, className='' }) => {
        const isSorted = sortConfig?.key === sortKey;
        const direction = isSorted ? sortConfig.direction : 'none';

        return (
            <th scope="col" className={`px-4 py-3 sticky top-0 bg-slate-100 z-10 ${className}`}>
                <button
                    className="flex items-center gap-1 uppercase font-bold text-xs text-slate-700 group whitespace-nowrap"
                    onClick={() => handleSort(sortKey)}
                >
                    {title}
                    <SortIcon direction={direction} />
                </button>
            </th>
        );
    };

    const priceStatsWithOverride = useMemo(() => {
        // First map existing stats
        const overridden = priceStats.map(stat => {
            const manualPrice = prices.find(p => p.model_name === stat.model_name && p.source_name === 'custom');
            const lowestLimit = (manualPrice ? manualPrice.price_rial : (stat.minimum && stat.minimum > 0 ? stat.minimum : stat.maximum)) * 0.98;
            if (manualPrice) {
                return {
                    ...stat,
                    maximum: manualPrice.price_rial,
                    lowestLimit,
                };
            }
            return {
                ...stat,
                lowestLimit,
            };
        });

        // Search for manual prices of models NOT in priceStats yet
        const existingModelNames = new Set(priceStats.map(s => s.model_name));
        let syntheticId = priceStats.length + 1000;
        
        prices.forEach(price => {
            if (price.source_name === 'custom' && !existingModelNames.has(price.model_name)) {
                overridden.push({
                    id: syntheticId++,
                    model_name: price.model_name,
                    minimum: price.price_rial,
                    maximum: price.price_rial,
                    average: price.price_rial,
                    computed_at: price.captured_at,
                    lowestLimit: price.price_rial * 0.98
                });
                existingModelNames.add(price.model_name);
            }
        });

        return overridden;
    }, [priceStats, prices]);

    // Grouping by Base Model (e.g. BAC X3PRO 1404 and 1405 into BAC X3PRO)
    const groupedModelCards = useMemo((): GroupedCardData[] => {
        const groupsMap = new Map<string, GroupedCardData>();

        priceStatsWithOverride.forEach(stat => {
            const parsed = parseModelAndYear(stat.model_name);
            const baseName = parsed.baseModel;
            const year = parsed.year;

            const manualPrice = prices.find(p => p.model_name === stat.model_name && p.source_name === 'custom');
            const otherPrices = prices
                .filter(p => p.model_name === stat.model_name && p.source_name !== 'custom' && p.price_rial > 0)
                .sort((a, b) => a.price_rial - b.price_rial);

            const sourcePricesMap: Record<string, ScrapedCarPrice> = {};
            prices.filter(p => p.model_name === stat.model_name && p.price_rial > 0).forEach(p => {
                sourcePricesMap[p.source_name] = p;
            });

            const highestLimit = stat.maximum * 1.02;
            const lowestLimit = (manualPrice ? manualPrice.price_rial : (stat.minimum && stat.minimum > 0 ? stat.minimum : stat.maximum)) * 0.98;

            const havaleh1Min = stat.maximum * 0.95;
            const havaleh1Max = stat.maximum * 0.97;
            const havaleh2Min = stat.maximum * 0.90;
            const havaleh2Max = stat.maximum * 0.94;

            const variant: ModelVariant = {
                rawModelName: stat.model_name,
                year,
                stat,
                manualPrice,
                otherPrices,
                lowestLimit,
                highestLimit,
                havaleh1Min,
                havaleh1Max,
                havaleh2Min,
                havaleh2Max,
                sourcePricesMap
            };

            if (!groupsMap.has(baseName)) {
                groupsMap.set(baseName, {
                    baseModelName: baseName,
                    variants: [variant],
                    years: year ? [year] : [],
                    hasApprovedPrice: !!manualPrice,
                    primaryApprovedPrice: manualPrice?.price_rial,
                    highestMarketPrice: stat.maximum,
                    lowestMarketPrice: stat.minimum && stat.minimum > 0 ? stat.minimum : stat.maximum,
                    allSources: Object.keys(sourcePricesMap)
                });
            } else {
                const group = groupsMap.get(baseName)!;
                group.variants.push(variant);
                if (year && !group.years.includes(year)) {
                    group.years.push(year);
                }
                if (manualPrice) {
                    group.hasApprovedPrice = true;
                    if (!group.primaryApprovedPrice || manualPrice.price_rial < group.primaryApprovedPrice) {
                        group.primaryApprovedPrice = manualPrice.price_rial;
                    }
                }
                if (stat.maximum > group.highestMarketPrice) {
                    group.highestMarketPrice = stat.maximum;
                }
                if (stat.minimum && stat.minimum > 0 && stat.minimum < group.lowestMarketPrice) {
                    group.lowestMarketPrice = stat.minimum;
                }
                Object.keys(sourcePricesMap).forEach(s => {
                    if (!group.allSources.includes(s)) group.allSources.push(s);
                });
            }
        });

        // Sort years inside each group descending (e.g. 1405 before 1404)
        const groups = Array.from(groupsMap.values()).map(group => {
            group.years.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
            group.variants.sort((a, b) => {
                if (!a.year) return 1;
                if (!b.year) return -1;
                return b.year.localeCompare(a.year, undefined, { numeric: true });
            });
            return group;
        });

        return groups;
    }, [priceStatsWithOverride, prices]);

    // Extract all unique manufacturing years across all groups
    const allAvailableYears = useMemo(() => {
        const yearsSet = new Set<string>();
        groupedModelCards.forEach(group => {
            group.years.forEach(y => yearsSet.add(y));
        });
        return Array.from(yearsSet).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    }, [groupedModelCards]);

    // Filter & Sort Grouped Cards
    const filteredAndSortedCards = useMemo(() => {
        let result = [...groupedModelCards];

        // 1. Search Filter (by Car Name)
        if (statsSearchQuery.trim()) {
            const q = statsSearchQuery.trim().toLowerCase();
            result = result.filter(card => {
                const matchBase = card.baseModelName.toLowerCase().includes(q);
                const matchVariant = card.variants.some(v => 
                    v.rawModelName.toLowerCase().includes(q) || 
                    (v.year && v.year.includes(q))
                );
                return matchBase || matchVariant;
            });
        }

        // 2. Source Filter (نمایش قیمت بر اساس مرجع)
        if (selectedSourceFilter !== 'all') {
            if (selectedSourceFilter === 'custom') {
                result = result.filter(card => card.hasApprovedPrice);
            } else {
                result = result.filter(card => 
                    card.variants.some(v => v.sourcePricesMap[selectedSourceFilter] !== undefined)
                );
            }
        }

        // 3. Year of Manufacture Filter (فیلتر بر اساس سال ساخت)
        if (selectedYearFilter !== 'all') {
            result = result.filter(card => card.years.includes(selectedYearFilter));
        }

        // 4. Sorting
        result.sort((a, b) => {
            if (statsSortField === 'priority') {
                const pA = getModelPriorityIndex(a.baseModelName);
                const pB = getModelPriorityIndex(b.baseModelName);
                if (pA !== pB) {
                    return statsSortDirection === 'asc' ? pA - pB : pB - pA;
                }
                // If both are priority or neither, sort by approved price then name
                if (a.hasApprovedPrice !== b.hasApprovedPrice) {
                    return a.hasApprovedPrice ? -1 : 1;
                }
                return a.baseModelName.localeCompare(b.baseModelName, 'fa');
            }

            if (statsSortField === 'approved_price') {
                // Priority to cars with approved price
                const valA = a.primaryApprovedPrice ?? (statsSortDirection === 'asc' ? Number.MAX_SAFE_INTEGER : -1);
                const valB = b.primaryApprovedPrice ?? (statsSortDirection === 'asc' ? Number.MAX_SAFE_INTEGER : -1);

                if (a.hasApprovedPrice !== b.hasApprovedPrice) {
                    return a.hasApprovedPrice ? -1 : 1;
                }

                if (valA !== valB) {
                    return statsSortDirection === 'asc' ? valA - valB : valB - valA;
                }
                return a.baseModelName.localeCompare(b.baseModelName, 'fa');
            }

            if (statsSortField === 'model_name') {
                const cmp = a.baseModelName.localeCompare(b.baseModelName, 'fa');
                return statsSortDirection === 'asc' ? cmp : -cmp;
            }

            if (statsSortField === 'max_price') {
                return statsSortDirection === 'asc' 
                    ? a.highestMarketPrice - b.highestMarketPrice 
                    : b.highestMarketPrice - a.highestMarketPrice;
            }

            if (statsSortField === 'min_price') {
                return statsSortDirection === 'asc' 
                    ? a.lowestMarketPrice - b.lowestMarketPrice 
                    : b.lowestMarketPrice - a.lowestMarketPrice;
            }

            return 0;
        });

        return result;
    }, [groupedModelCards, statsSearchQuery, selectedSourceFilter, selectedYearFilter, statsSortField, statsSortDirection]);

    const renderPriceStats = () => (
        <div className="mb-8 space-y-4">
            {/* Header & Main Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                 <div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">آمار خلاصه قیمت‌ها</h2>
                    </div>
                    {lastUpdated && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>آخرین بروزرسانی استعلام‌ها:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{timeAgo(lastUpdated)}</span>
                        </p>
                    )}
                 </div>

                 <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    {/* Global Havaleh Toggle */}
                    <label className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer select-none text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                        <input
                            type="checkbox"
                            checked={showHavalehs}
                            onChange={(e) => setShowHavalehs(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span>محاسبات حواله</span>
                    </label>

                    {/* Auto Refresh Select */}
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                        <span className="text-slate-500 dark:text-slate-400">بروزرسانی خودکار:</span>
                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                            className="bg-transparent border-none text-indigo-600 dark:text-indigo-400 font-bold outline-none cursor-pointer"
                        >
                            <option value={0} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">دستی</option>
                            <option value={5} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">۵ دقیقه</option>
                            <option value={10} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">۱۰ دقیقه</option>
                            <option value={15} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">۱۵ دقیقه</option>
                            <option value={30} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">۳۰ دقیقه</option>
                            <option value={60} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">۱ ساعت</option>
                        </select>
                        {refreshInterval > 0 && (
                            <span className="text-slate-600 dark:text-slate-300 font-mono font-bold mr-1 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                                {formatTimeLeft(secondsLeft)}
                             </span>
                        )}
                    </div>

                    {/* Refresh Button */}
                    <button 
                        onClick={fetchAllData}
                        disabled={loading}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center active:scale-95"
                        title="بروزرسانی داده‌ها"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Add Custom Price Button */}
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>ثبت دستی قیمت</span>
                    </button>

                    {/* Copy Stats Button */}
                    <button 
                        onClick={handleCopyStatsClick}
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                        disabled={loading || !!error || groupedModelCards.length === 0}
                    >
                        <CopyIcon />
                        <span>کپی آمار</span>
                    </button>
                 </div>
            </div>

            {/* Filter, Search & Sorting Controls Bar */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-grow">
                    {/* 1. Search by Car Name */}
                    <div className="relative flex-grow sm:flex-grow-0 sm:w-60">
                        <input
                            type="text"
                            value={statsSearchQuery}
                            onChange={(e) => setStatsSearchQuery(e.target.value)}
                            placeholder="جستجوی نام خودرو..."
                            className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 pr-9 pl-8 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                        {statsSearchQuery && (
                            <button
                                type="button"
                                onClick={() => setStatsSearchQuery('')}
                                className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* 2. Manufacturing Year Filter (فیلتر سال ساخت) */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">سال ساخت:</span>
                        <select
                            value={selectedYearFilter}
                            onChange={(e) => setSelectedYearFilter(e.target.value)}
                            className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">همه سال‌ها</option>
                            {allAvailableYears.map(year => (
                                <option key={year} value={year} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                    مدل {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 3. Source Filter (نمایش قیمت بر اساس مرجع) */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <Filter className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">مرجع قیمت:</span>
                        <select
                            value={selectedSourceFilter}
                            onChange={(e) => setSelectedSourceFilter(e.target.value)}
                            className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">همه مراجع (پیش‌فرض)</option>
                            <option value="custom" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">فقط قیمت مصوب (دستی)</option>
                            {sources.filter(s => s !== 'custom').map(s => (
                                <option key={s} value={s} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                    مرجع {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 4. Sort Field & Direction */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">مرتب‌سازی:</span>
                        <select
                            value={statsSortField}
                            onChange={(e) => setStatsSortField(e.target.value as any)}
                            className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                        >
                            <option value="priority" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">اولویت اختصاصی (KMC EAGLE، JAC J4، ...)</option>
                            <option value="approved_price" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">بر اساس قیمت مصوب</option>
                            <option value="model_name" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">بر اساس نام خودرو (الفبایی)</option>
                            <option value="max_price" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">بالاترین قیمت بازار</option>
                            <option value="min_price" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">کمترین قیمت بازار</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => setStatsSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 font-black text-[10px] flex items-center gap-1 transition-colors"
                            title={statsSortDirection === 'asc' ? 'تغییر به نزولی' : 'تغییر به صعودی'}
                        >
                            {statsSortDirection === 'asc' ? 'صعودی ↑' : 'نزولی ↓'}
                        </button>
                    </div>
                </div>

                {/* Match Counter & Reset */}
                <div className="flex items-center justify-between md:justify-end gap-2 text-xs text-slate-500 dark:text-slate-400 font-bold shrink-0">
                    <span className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        نمایش <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">{filteredAndSortedCards.length}</span> از <span className="font-mono">{groupedModelCards.length}</span> مدل
                    </span>
                    {(statsSearchQuery || selectedSourceFilter !== 'all' || selectedYearFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setStatsSearchQuery('');
                                setSelectedSourceFilter('all');
                                setSelectedYearFilter('all');
                            }}
                            className="text-xs text-rose-500 hover:text-rose-600 font-bold underline px-1"
                        >
                            پاک‌کردن فیلترها
                        </button>
                    )}
                </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 px-1">
                * سال‌های ساخت مختلف هر خودرو در یک کارت تجمیع شده‌اند. کمترین نرخ معامله (کف) برابر با کمترین قیمت منبع - ۲٪ و بیشترین نرخ معامله (سقف) برابر با بیشترین قیمت منبع + ۲٪ است.
            </p>

            {loading ? (
                <div className="flex justify-center items-center h-40 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <Spinner />
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 p-4 rounded-2xl border border-red-200 dark:border-red-800 shadow-sm">
                    <p className="text-sm font-bold">{error}</p>
                </div>
            ) : filteredAndSortedCards.length === 0 ? (
                <div className="bg-white dark:bg-slate-850 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                    <Car className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h4 className="text-base font-black text-slate-800 dark:text-white">خودرویی با این مشخصات یافت نشد</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        لطفاً عبارت جستجو یا فیلتر سال ساخت و مرجع را تغییر دهید.
                    </p>
                    <button
                        onClick={() => {
                            setStatsSearchQuery('');
                            setSelectedSourceFilter('all');
                            setSelectedYearFilter('all');
                        }}
                        className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                        نمایش تمام مدل‌ها
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredAndSortedCards.map(card => {
                        // Determine the active variant for this card based on selected year
                        const currentSelectedYear = (selectedYearFilter !== 'all' && card.years.includes(selectedYearFilter))
                            ? selectedYearFilter
                            : (selectedYearByModel[card.baseModelName] || card.years[0] || null);
                        const activeVariant = (currentSelectedYear 
                            ? card.variants.find(v => v.year === currentSelectedYear)
                            : null) || card.variants[0];

                        const manualPrice = activeVariant.manualPrice;
                        const otherPrices = activeVariant.otherPrices;
                        const cardModelKey = `${card.baseModelName}-${activeVariant.rawModelName}`;
                        const isPriorityModel = getModelPriorityIndex(card.baseModelName) < 999;
                        
                        const isCardExpanded = expandedCards[cardModelKey] !== undefined 
                            ? expandedCards[cardModelKey] 
                            : true;

                        const isHavalehOpen = expandedHavalehs[cardModelKey] !== undefined 
                            ? expandedHavalehs[cardModelKey] 
                            : showHavalehs;

                        // Check if selected source filter exists for active variant
                        const activeSourcePrice = (selectedSourceFilter !== 'all' && selectedSourceFilter !== 'custom')
                            ? activeVariant.sourcePricesMap[selectedSourceFilter]
                            : null;

                        return (
                        <div 
                            key={card.baseModelName} 
                            className={`bg-white dark:bg-slate-850 rounded-2xl shadow-sm p-5 border ${
                                manualPrice 
                                    ? 'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-50 dark:ring-indigo-950/20' 
                                    : 'border-slate-200/80 dark:border-slate-800'
                            } flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden`}
                        >
                            {/* Approved Price Badge */}
                            {manualPrice && (
                                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-bl-xl flex items-center gap-1.5 shadow-sm">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                    <span>قیمت مصوب</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Card Header: Base Model Name & Year Selector */}
                                <div className="pr-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-2 pr-16">
                                        <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                                            {card.baseModelName}
                                        </h3>
                                        {isPriorityModel && (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center gap-1">
                                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                                <span>اولویت</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Year Tabs / Badges */}
                                    {card.years.length > 1 ? (
                                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                            <span className="text-[10px] font-bold text-slate-400">سال ساخت:</span>
                                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                                {card.years.map(y => {
                                                    const isSelected = (activeVariant.year === y);
                                                    const varObj = card.variants.find(v => v.year === y);
                                                    const hasCustom = !!varObj?.manualPrice;

                                                    return (
                                                        <button
                                                            key={y}
                                                            type="button"
                                                            onClick={() => setSelectedYearByModel(prev => ({ ...prev, [card.baseModelName]: y }))}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                                                isSelected 
                                                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                                                            }`}
                                                        >
                                                            <span>مدل {y}</span>
                                                            {hasCustom && (
                                                                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-indigo-500'}`} title="دارای قیمت مصوب" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : card.years.length === 1 && card.years[0] ? (
                                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                                            <Layers className="w-3 h-3 text-indigo-500" />
                                            <span>مدل {card.years[0]}</span>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Active Source Highlight Box (When filtered by a specific source) */}
                                {activeSourcePrice && (
                                    <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 p-3 rounded-2xl flex items-center justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block">
                                                قیمت مرجع «{selectedSourceFilter}»:
                                            </span>
                                            <span className="font-mono font-black text-amber-950 dark:text-amber-100 text-lg">
                                                {activeSourcePrice.price_rial.toLocaleString('fa-IR')} <span className="text-xs font-sans font-bold text-amber-700">تومان</span>
                                            </span>
                                            <p className="text-[9px] text-amber-600/80 mt-0.5 font-medium">
                                                استعلام {timeAgo(activeSourcePrice.captured_at)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectAsApprovedPrice(activeVariant.rawModelName, selectedSourceFilter, activeSourcePrice.price_rial)}
                                            className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 shrink-0"
                                            title="انتخاب این نرخ به عنوان قیمت مصوب"
                                        >
                                            <Plus className="w-3 h-3" />
                                            <span>ثبت به عنوان مصوب</span>
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-4 text-sm">
                                    {/* Base / Approved Price */}
                                    <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                        {manualPrice ? (
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1">
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        <span>قیمت مصوب:</span>
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {timeAgo(manualPrice.captured_at)}
                                                    </span>
                                                </div>
                                                <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex flex-col">
                                                    <span className="font-mono font-black text-indigo-900 dark:text-indigo-200 text-2xl">
                                                        {manualPrice.price_rial.toLocaleString('fa-IR')} <span className="text-xs font-bold font-sans">تومان</span>
                                                    </span>
                                                    {manualPrice.price_text && (
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                                                            {manualPrice.price_text}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center py-1">
                                                <span className="text-slate-500 dark:text-slate-400 font-bold text-xs">قیمت مصوب:</span>
                                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                                    وارد نشده
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Havaleh Section Toggle */}
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={() => toggleHavalehExpanded(cardModelKey)}
                                            className="w-full flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition-all outline-none"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>محاسبات حواله (۱ و ۲ ماهه)</span>
                                            </span>
                                            {isHavalehOpen ? (
                                                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                            )}
                                        </button>
                                        
                                        {isHavalehOpen && (
                                            <div className="mt-2.5 space-y-2 animate-fade-in">
                                                {/* Havaleh 1 Month */}
                                                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">حواله ۱ ماهه</span>
                                                        <span className="text-[10px] text-emerald-600/80 font-mono font-bold">(۳٪ - ۵٪)</span>
                                                    </div>
                                                    <div className="flex justify-between items-center font-mono text-sm text-emerald-950 dark:text-emerald-200 font-bold">
                                                        <span>{Math.round(activeVariant.havaleh1Min).toLocaleString('fa-IR')}</span>
                                                        <span className="text-[10px] text-emerald-400 mx-1 font-sans">تا</span>
                                                        <span>{Math.round(activeVariant.havaleh1Max).toLocaleString('fa-IR')}</span>
                                                    </div>
                                                </div>

                                                {/* Havaleh 2 Month */}
                                                <div className="bg-cyan-50 dark:bg-cyan-950/30 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-900/40">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">حواله ۲ ماهه</span>
                                                        <span className="text-[10px] text-cyan-600/80 font-mono font-bold">(۶٪ - ۱۰٪)</span>
                                                    </div>
                                                    <div className="flex justify-between items-center font-mono text-sm text-cyan-950 dark:text-cyan-200 font-bold">
                                                        <span>{Math.round(activeVariant.havaleh2Min).toLocaleString('fa-IR')}</span>
                                                        <span className="text-[10px] text-cyan-400 mx-1 font-sans">تا</span>
                                                        <span>{Math.round(activeVariant.havaleh2Max).toLocaleString('fa-IR')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Limits */}
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-slate-400 font-bold text-xs">کمترین نرخ معامله (کف):</span>
                                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                                {Math.round(activeVariant.lowestLimit).toLocaleString('fa-IR')} <span className="text-[9px] font-sans font-normal">تومان</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-slate-400 font-bold text-xs">بیشترین نرخ معامله (سقف):</span>
                                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {Math.round(activeVariant.highestLimit).toLocaleString('fa-IR')} <span className="text-[9px] font-sans font-normal">تومان</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Collapsible Panel for other source prices */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => toggleCardExpanded(cardModelKey)}
                                            className="w-full flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold transition-all outline-none"
                                        >
                                            <span>مشاهده قیمت سایر مراجع ({otherPrices.length} مرجع)</span>
                                            {isCardExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                                        </button>
                                        
                                        {isCardExpanded && (
                                            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                                {otherPrices.length === 0 ? (
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-2">مرجع فعال دیگری برای این سال ساخت یافت نشد.</p>
                                                ) : (
                                                    otherPrices.map(op => {
                                                        const isStale = isOlderThan24Hours(op.captured_at);
                                                        return (
                                                            <div key={op.id} className="flex justify-between items-center text-[11px] border-b border-slate-100 dark:border-slate-800/60 py-2 last:border-0 gap-2">
                                                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                                                                    {op.source_name}
                                                                    {isStale && (
                                                                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" title="بیش از ۲۴ ساعت از آخرین بروزرسانی گذشته است" />
                                                                    )}
                                                                    :
                                                                </span>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{op.price_rial.toLocaleString('fa-IR')}</span>
                                                                    <span className="text-[10px] text-slate-400 font-normal">({timeAgo(op.captured_at)})</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSelectAsApprovedPrice(activeVariant.rawModelName, op.source_name, op.price_rial)}
                                                                        className="w-6 h-6 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:bg-indigo-950/50 dark:hover:bg-indigo-600 dark:text-indigo-400 dark:hover:text-white border border-indigo-200 dark:border-indigo-800 transition-all flex items-center justify-center font-bold shadow-sm"
                                                                        title="انتخاب این قیمت به عنوان قیمت مصوب"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>
    );

    const renderComparisonTable = () => {
        if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
        if (error) return <p className="text-center text-red-500 py-10">{error}</p>;
        if (sortedTableData.length === 0) return <p className="text-center text-slate-500 py-10">هیچ قیمتی یافت نشد.</p>;

        return (
            <div className="overflow-x-auto rounded-lg shadow-md border border-slate-200 dark:border-slate-700" style={{maxHeight: '70vh'}}>
                <table className="w-full text-sm text-right text-slate-600 dark:text-slate-300 border-collapse">
                    <thead className="text-xs text-slate-700 bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <SortableHeader title="مدل خودرو" sortKey="model_name" className="sticky left-0 bg-slate-200 dark:bg-slate-900 z-20" />
                            {sources.map(source => (
                                <SortableHeader key={source} title={source} sortKey={source} />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800">
                        {sortedTableData.map((row, index) => {
                            const rowBg = index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50';
                            return (
                                <tr key={row.model_name} className={`${rowBg}`}>
                                    <td className={`px-4 py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap sticky left-0 z-10 border-b border-slate-200 dark:border-slate-700 ${rowBg}`}>
                                        {row.model_name}
                                    </td>
                                    {sources.map(source => {
                                        const price = row[source] as number;
                                        const modelRow = prices.find(p => p.model_name === row.model_name && p.source_name === source);
                                        const isStale = modelRow ? isOlderThan24Hours(modelRow.captured_at) : false;
                                        
                                        let cellClasses = 'px-4 py-3 text-center border-b border-slate-200 dark:border-slate-700 transition-colors duration-200 font-mono';
                                        
                                        if (price > 0 && row.minPrice !== row.maxPrice) {
                                            if (price === row.minPrice) {
                                                cellClasses += ' bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 font-bold';
                                            } else if (price === row.maxPrice) {
                                                cellClasses += ' bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 font-bold';
                                            }
                                        }

                                        return (
                                            <td key={source} className={cellClasses}>
                                                <div className="flex items-center justify-center gap-1">
                                                    {price > 0 ? (
                                                        <>
                                                            <span>{price.toLocaleString('fa-IR')}</span>
                                                            {isStale && (
                                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" title="بیش از ۲۴ ساعت از آخرین بروزرسانی گذشته است" />
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-600">-</span>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderPriceStats()}
                {renderComparisonTable()}
            </main>
            
            <CarPriceCopySettingsModal 
                isOpen={isCopyModalOpen} 
                onClose={() => setIsCopyModalOpen(false)} 
                groupedCards={groupedModelCards}
                stats={priceStatsWithOverride}
                lastUpdated={lastUpdated}
                onCopySuccess={() => showToast('آمار با موفقیت کپی شد', 'success')}
            />

            <AddCustomPriceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddCustomPriceSubmit}
                existingModels={existingModelsList}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default CarPricesPage;
