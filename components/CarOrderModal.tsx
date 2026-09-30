import React, { useState, useEffect, useMemo } from 'react';
import type { CarOrder, Car, CarSaleCondition, CarPriceStats, ScrapedCarPrice, User, StaffUser, OrderPartner } from '../types';
import { OrderStatus, SaleType, PayType } from '../types';
import { 
    Search, 
    Car as CarIcon, 
    Layers, 
    DollarSign, 
    User as UserIcon, 
    CheckCircle2, 
    AlertTriangle, 
    Info, 
    Tag, 
    Calendar, 
    Clock, 
    ShieldCheck, 
    Palette, 
    Building2, 
    Phone, 
    MapPin, 
    Sparkles, 
    ArrowRight, 
    ArrowLeft,
    Check,
    TrendingUp,
    FileSpreadsheet,
    FileText,
    BarChart3,
    HelpCircle,
    XCircle,
    BadgeCheck,
    Plus,
    UserPlus,
    UserCheck,
    Warehouse,
    Truck,
    Calculator,
    Coins,
    ArrowUpDown,
    Trash2,
    Percent,
    Users,
    ArrowRightLeft
} from 'lucide-react';
import { CloseIcon } from './icons/CloseIcon';
import { getCars, getConditions, getCarPriceStats, getScrapedCarPrices, getUsers, getStaffUsers, createCondition, createUser, createCallLog, createCustomerJournal } from '../services/api';
import Spinner from './Spinner';
import ConditionModal from './ConditionModal';

interface CarOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: Omit<CarOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'status'>, status: OrderStatus) => void;
    username: string;
    initialBuyerData?: {
        name?: string;
        phone?: string;
        city?: string;
        nationalId?: string;
        address?: string;
        postalCode?: string;
    };
    editOrder?: CarOrder | null;
}

const PREDEFINED_USER_NOTES = [
    'فعلا بیعانه میدهد بقیه را تا تاریخ ... میدهد',
    'بخشی الان بقیه چک میدهد',
    'درخواست ارسال به شهر دیگر دارد',
    'برای تامین نقدینگی به چند روز زمان نیاز دارد',
    'با شرایطی که گفتید موافقت کرده است',
    'با توجه به نتیجه کارشناسی خودرو درخواست تخفیف دارد'
];

/**
 * Utility to convert numbers to Persian words
 */
const numberToPersianWords = (num: number): string => {
    if (num === 0) return 'صفر';
    if (!num || isNaN(num)) return '';

    const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    const steps = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

    const convertThreeDigits = (n: number): string => {
        let res = '';
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (h > 0) res += hundreds[h];
        
        if (t > 0 || u > 0) {
            if (res !== '') res += ' و ';
            if (t === 1) {
                res += teens[u];
            } else {
                if (t > 1) res += tens[t];
                if (u > 0) {
                    if (t > 1) res += ' و ';
                    res += units[u];
                }
            }
        }
        return res;
    };

    let result = '';
    let stepCount = 0;
    let tempNum = Math.abs(num);

    while (tempNum > 0) {
        const threeDigits = tempNum % 1000;
        if (threeDigits > 0) {
            const word = convertThreeDigits(threeDigits);
            const stepName = steps[stepCount];
            result = word + (stepName ? ' ' + stepName : '') + (result !== '' ? ' و ' + result : '');
        }
        tempNum = Math.floor(tempNum / 1000);
        stepCount++;
    }

    return result.trim();
};

// Helper to verify if approved price (نرخ مصوب) was updated within last 24 hours
export const isPriceUpdatedWithin24Hours = (capturedAt?: string | null): boolean => {
    if (!capturedAt) return false;
    try {
        let date = new Date(capturedAt);
        if (isNaN(date.getTime())) {
            date = new Date(capturedAt.replace(' ', 'T'));
        }
        if (isNaN(date.getTime())) return false;
        const diffMs = Date.now() - date.getTime();
        return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
};

const SALE_TYPE_TABS = [
    { id: 'ALL', label: 'همه شرایط', type: null, icon: Layers },
    { id: 'FACTORY', label: 'ثبت‌نام کارخانه', type: SaleType.FACTORY_REGISTRATION, icon: Building2 },
    { id: 'HAVALEH', label: 'حواله', type: SaleType.TRANSFER, icon: FileText },
    { id: 'LEASING', label: 'لیزینگی', type: SaleType.LEASING, icon: DollarSign },
    { id: 'ZERO_MARKET', label: 'صفر بازار', type: SaleType.NEW_MARKET, icon: Sparkles },
    { id: 'USED', label: 'کارکرده', type: SaleType.USED, icon: Tag },
];

const COLOR_MAP: Record<string, string> = {
    'سفید': '#FFFFFF',
    'مشکی': '#1E293B',
    'خاکستری': '#64748B',
    'نقره‌ای': '#94A3B8',
    'نوک مدادی': '#334155',
    'قرمز': '#EF4444',
    'آبی': '#3B82F6',
    'قهوه ای': '#78350F',
    'تیتانیوم': '#475569',
    'کربن بلک': '#0F172A',
};

const CarOrderModal: React.FC<CarOrderModalProps> = ({ 
    isOpen, onClose, onSave, username, initialBuyerData, editOrder 
}) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cars, setCars] = useState<Car[]>([]);
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [priceStats, setPriceStats] = useState<CarPriceStats[]>([]);
    const [scrapedPrices, setScrapedPrices] = useState<ScrapedCarPrice[]>([]);
    const [crmUsers, setCrmUsers] = useState<User[]>([]);
    const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
    const [expertSearchQuery, setExpertSearchQuery] = useState('');
    const [selectedPriceYear, setSelectedPriceYear] = useState<string | null>(null);
    const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Step 1: Car Filtering States
    const [carSearchQuery, setCarSearchQuery] = useState('');
    const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
    const [priceFilter, setPriceFilter] = useState<'ALL' | 'UNDER_1B' | '1B_TO_2B' | 'OVER_2B' | 'SORT_ASC' | 'SORT_DESC'>('ALL');

    // Step 2: Sale Type & Condition Filter States
    const [activeSaleTypeTab, setActiveSaleTypeTab] = useState<string>('ALL');
    const [selectedConditionObj, setSelectedConditionObj] = useState<CarSaleCondition | null>(null);

    // Step 4: CRM Search State
    const [crmSearchQuery, setCrmSearchQuery] = useState('');
    const [crmResults, setCrmResults] = useState<User[]>([]);

    // Partner selection state
    const [newPartnerStaffName, setNewPartnerStaffName] = useState<string>('');
    const [newPartnerSide, setNewPartnerSide] = useState<'فروش' | 'خرید'>('فروش');

    const [formData, setFormData] = useState({
        buyerName: '',
        buyerNationalId: '',
        buyerPhone: '',
        buyerCity: '',
        buyerAddress: '',
        buyerPostalCode: '',
        carName: '',
        conditionId: 0,
        conditionSummary: '',
        selectedColor: '',
        proposedPrice: 0,
        userNotes: '',
        purchasePrice: 0,
        sellingPrice: 0,
        shippingCost: 0,
        commissionRatePercent: 10,
        netCommission: 0,
        totalCommissionBonus: 0,
        partnerCommissionShare: 0,
        sellerType: 'COMPANY_WAREHOUSE' as 'COMPANY_WAREHOUSE' | 'OTHER',
        sellerName: 'انبار مرکزی شرکت (حسینی خودرو)',
        sellerPhone: '',
        sellerNationalId: '',
        sellerSheba: '',
        sellerCity: '',
        sellerAddress: '',
        sellerNotes: '',
        partners: [] as OrderPartner[],
        carExperts: [] as string[]
    });

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setStep(1);
            setSelectedPriceYear(null);
            setExpertSearchQuery('');
            setNewPartnerStaffName('');
            setNewPartnerSide('فروش');
            
            if (editOrder) {
                const sPrice = editOrder.sellingPrice || editOrder.proposedPrice || 0;
                const pPrice = editOrder.purchasePrice || 0;
                const sCost = editOrder.shippingCost || 0;
                const commRate = editOrder.commissionRatePercent !== undefined ? editOrder.commissionRatePercent : 10;
                const netComm = editOrder.netCommission !== undefined ? editOrder.netCommission : (sPrice - pPrice - sCost);
                const bonus = editOrder.totalCommissionBonus !== undefined ? editOrder.totalCommissionBonus : (netComm > 0 ? Math.round(netComm * (commRate / 100)) : 0);
                const partnerList: OrderPartner[] = editOrder.partners && editOrder.partners.length > 0 
                    ? editOrder.partners 
                    : (editOrder.carExperts || []).map(exp => ({
                        name: exp.replace(/\(.*\)/, '').trim(),
                        side: exp.includes('خرید') ? ('خرید' as const) : ('فروش' as const)
                    }));
                const share = editOrder.partnerCommissionShare !== undefined ? editOrder.partnerCommissionShare : (partnerList.length > 0 && bonus > 0 ? Math.round(bonus / partnerList.length) : 0);

                setFormData({
                    buyerName: editOrder.buyerName || '',
                    buyerNationalId: editOrder.buyerNationalId || '',
                    buyerPhone: editOrder.buyerPhone || '',
                    buyerCity: editOrder.buyerCity || '',
                    buyerAddress: editOrder.buyerAddress || '',
                    buyerPostalCode: editOrder.buyerPostalCode || '',
                    carName: editOrder.carName || '',
                    conditionId: editOrder.conditionId || 0,
                    conditionSummary: editOrder.conditionSummary || '',
                    selectedColor: editOrder.selectedColor || '',
                    proposedPrice: sPrice,
                    userNotes: editOrder.userNotes || '',
                    purchasePrice: pPrice,
                    sellingPrice: sPrice,
                    shippingCost: sCost,
                    commissionRatePercent: commRate,
                    netCommission: netComm,
                    totalCommissionBonus: bonus,
                    partnerCommissionShare: share,
                    sellerType: (editOrder.sellerType as any) || (editOrder.deductFromStock ? 'COMPANY_WAREHOUSE' : 'OTHER'),
                    sellerName: editOrder.sellerName || (editOrder.sellerType === 'OTHER' ? '' : 'انبار مرکزی شرکت (حسینی خودرو)'),
                    sellerPhone: editOrder.sellerPhone || '',
                    sellerNationalId: editOrder.sellerNationalId || '',
                    sellerSheba: editOrder.sellerSheba || '',
                    sellerCity: editOrder.sellerCity || '',
                    sellerAddress: editOrder.sellerAddress || '',
                    sellerNotes: editOrder.sellerNotes || '',
                    partners: partnerList,
                    carExperts: editOrder.carExperts || []
                });
            } else if (initialBuyerData) {
                setFormData(prev => ({
                    ...prev,
                    buyerName: initialBuyerData.name || prev.buyerName,
                    buyerPhone: initialBuyerData.phone || prev.buyerPhone,
                    buyerCity: initialBuyerData.city || prev.buyerCity,
                    buyerNationalId: initialBuyerData.nationalId || prev.buyerNationalId,
                    buyerAddress: initialBuyerData.address || prev.buyerAddress,
                    buyerPostalCode: initialBuyerData.postalCode || prev.buyerPostalCode,
                    commissionRatePercent: 10,
                    partners: [],
                    carExperts: []
                }));
            } else {
                setFormData({
                    buyerName: '',
                    buyerNationalId: '',
                    buyerPhone: '',
                    buyerCity: '',
                    buyerAddress: '',
                    buyerPostalCode: '',
                    carName: '',
                    conditionId: 0,
                    conditionSummary: '',
                    selectedColor: '',
                    proposedPrice: 0,
                    userNotes: '',
                    purchasePrice: 0,
                    sellingPrice: 0,
                    shippingCost: 0,
                    commissionRatePercent: 10,
                    netCommission: 0,
                    totalCommissionBonus: 0,
                    partnerCommissionShare: 0,
                    sellerType: 'COMPANY_WAREHOUSE',
                    sellerName: 'انبار مرکزی شرکت (حسینی خودرو)',
                    sellerPhone: '',
                    sellerNationalId: '',
                    sellerSheba: '',
                    sellerCity: '',
                    sellerAddress: '',
                    sellerNotes: '',
                    partners: [],
                    carExperts: []
                });
            }

            Promise.all([
                getCars(), 
                getConditions(), 
                getCarPriceStats(), 
                getScrapedCarPrices(), 
                getUsers(),
                getStaffUsers().catch(() => [])
            ])
                .then(([carsData, conditionsData, statsData, scrapedData, usersData, staffData]) => {
                    setCars(carsData);
                    setConditions(conditionsData);
                    setPriceStats(statsData);
                    setScrapedPrices(scrapedData || []);
                    setCrmUsers(usersData);
                    setStaffUsers(staffData || []);
                    
                    if (editOrder) {
                        const cond = conditionsData.find(c => c.id === editOrder.conditionId);
                        if (cond) {
                            setSelectedConditionObj(cond);
                            if (cond.model) setSelectedPriceYear(cond.model);
                        }
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, initialBuyerData, editOrder]);

    // Parse model name & year helper
    const parseModelAndYear = (rawName: string) => {
        if (!rawName) return { baseModel: '', year: null, originalName: '' };
        const trimmed = rawName.trim();
        const persianToEnglish = (s: string) =>
            s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
        const normalized = persianToEnglish(trimmed);
        const match = normalized.match(/\s*[-–_/(]?\s*(?:مدل\s*)?(13[89]\d|140\d|141\d|142\d|20[123]\d)\s*[)]?$/i);
        if (match && match.index !== undefined) {
            const year = match[1];
            const base = trimmed.substring(0, match.index).trim();
            if (base.length > 0) {
                return { baseModel: base, year, originalName: trimmed };
            }
        }
        return { baseModel: trimmed, year: null, originalName: trimmed };
    };

    // Calculate highest approximate market price for a given car model from scraped prices and price stats
    const getCarHighestApproxPrice = (carName: string): number => {
        if (!carName) return 0;
        const cleanCarName = carName.trim().toLowerCase();
        const targetParsed = parseModelAndYear(carName);
        const targetBase = targetParsed.baseModel.toLowerCase();

        // 1. Matching scraped prices (all scraped sources for this model)
        const matchingScraped = scrapedPrices.filter(p => {
            if (!p.model_name || !p.price_rial || p.price_rial <= 0) return false;
            const pName = p.model_name.trim().toLowerCase();
            const pParsed = parseModelAndYear(p.model_name).baseModel.toLowerCase();
            return pName === cleanCarName || pParsed === targetBase || pName.includes(targetBase) || targetBase.includes(pParsed);
        });

        // 2. Matching stats
        const matchingStats = priceStats.filter(s => {
            if (!s.model_name) return false;
            const sName = s.model_name.trim().toLowerCase();
            const sParsed = parseModelAndYear(s.model_name).baseModel.toLowerCase();
            return sName === cleanCarName || sParsed === targetBase || sName.includes(targetBase) || targetBase.includes(sParsed);
        });

        let maxPrice = 0;
        matchingScraped.forEach(p => {
            if (p.price_rial > maxPrice) maxPrice = p.price_rial;
        });
        matchingStats.forEach(s => {
            if (s.maximum && s.maximum > maxPrice) maxPrice = s.maximum;
            if (s.average && s.average > maxPrice) maxPrice = s.average;
        });

        return maxPrice;
    };

    // Time ago helper for price timestamps
    const timeAgo = (dateString?: string): string => {
        if (!dateString) return 'نامشخص';
        try {
            const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
            if (!parts) return dateString;
            const [_, year, month, day, hour, minute, second] = parts.map(Number);
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
        } catch {
            return dateString;
        }
    };

    // Unique Brands extracted from car list
    const availableBrands = useMemo(() => {
        const brands = new Set<string>();
        cars.forEach(c => {
            if (c.brand && c.brand.trim()) brands.add(c.brand.trim());
        });
        return Array.from(brands).sort();
    }, [cars]);

    // Map stats by model name for quick lookup
    const statsMap = useMemo(() => {
        const map = new Map<string, CarPriceStats>();
        priceStats.forEach(s => {
            if (s.model_name) map.set(s.model_name.trim().toLowerCase(), s);
        });
        return map;
    }, [priceStats]);

    // Filtered cars for Step 1
    const filteredCars = useMemo(() => {
        return cars.filter(car => {
            // Brand filter
            if (selectedBrand !== 'ALL' && car.brand !== selectedBrand) {
                return false;
            }
            // Search query
            if (carSearchQuery.trim()) {
                const q = carSearchQuery.toLowerCase();
                const matchName = (car.name || '').toLowerCase().includes(q);
                const matchBrand = (car.brand || '').toLowerCase().includes(q);
                if (!matchName && !matchBrand) return false;
            }
            // Price range filter using approximate highest price
            const price = getCarHighestApproxPrice(car.name);
            if (priceFilter === 'UNDER_1B' && price > 0 && price > 1_000_000_000) return false;
            if (priceFilter === '1B_TO_2B' && price > 0 && (price < 1_000_000_000 || price > 2_000_000_000)) return false;
            if (priceFilter === 'OVER_2B' && price > 0 && price < 2_000_000_000) return false;
            
            return true;
        }).sort((a, b) => {
            if (priceFilter === 'SORT_ASC' || priceFilter === 'SORT_DESC') {
                const priceA = getCarHighestApproxPrice(a.name);
                const priceB = getCarHighestApproxPrice(b.name);
                return priceFilter === 'SORT_ASC' ? priceA - priceB : priceB - priceA;
            }
            return a.name.localeCompare(b.name, 'fa');
        });
    }, [cars, selectedBrand, carSearchQuery, priceFilter, scrapedPrices, priceStats]);

    // Selected car object
    const selectedCarObj = useMemo(() => {
        return cars.find(c => c.name === formData.carName) || null;
    }, [cars, formData.carName]);

    // Conditions matching selected car and sale type for Step 2
    const filteredConditions = useMemo(() => {
        if (!formData.carName) return [];
        return conditions.filter(c => {
            if (c.car_model !== formData.carName) return false;
            if (activeSaleTypeTab !== 'ALL') {
                const tab = SALE_TYPE_TABS.find(t => t.id === activeSaleTypeTab);
                if (tab && tab.type && c.sale_type !== tab.type) return false;
            }
            return true;
        });
    }, [conditions, formData.carName, activeSaleTypeTab]);

    // Counts per sale type for selected car
    const saleTypeCounts = useMemo(() => {
        const counts: Record<string, number> = { ALL: 0 };
        SALE_TYPE_TABS.forEach(tab => { counts[tab.id] = 0; });
        if (!formData.carName) return counts;

        const carConditions = conditions.filter(c => c.car_model === formData.carName);
        counts.ALL = carConditions.length;

        carConditions.forEach(c => {
            const foundTab = SALE_TYPE_TABS.find(t => t.type === c.sale_type);
            if (foundTab) {
                counts[foundTab.id] = (counts[foundTab.id] || 0) + 1;
            }
        });
        return counts;
    }, [conditions, formData.carName]);

    // Price statistics for selected car
    const currentPriceStat = useMemo(() => {
        if (!formData.carName) return null;
        return statsMap.get(formData.carName.trim().toLowerCase()) || null;
    }, [formData.carName, statsMap]);

    // Comprehensive Grouping of Car Prices (including Approved / Custom price & Online Market sources)
    const matchedCarPriceGroup = useMemo(() => {
        if (!formData.carName) return null;
        const cleanCarName = formData.carName.trim().toLowerCase();
        const targetParsed = parseModelAndYear(formData.carName);
        const targetBase = targetParsed.baseModel.toLowerCase();

        // 1. Find matching stats
        const matchingStats = priceStats.filter(s => {
            if (!s.model_name) return false;
            const sName = s.model_name.trim().toLowerCase();
            const sParsed = parseModelAndYear(s.model_name).baseModel.toLowerCase();
            return sName === cleanCarName || sParsed === targetBase || sName.includes(targetBase) || targetBase.includes(sParsed);
        });

        // 2. Find matching scraped prices
        const matchingPrices = scrapedPrices.filter(p => {
            if (!p.model_name) return false;
            const pName = p.model_name.trim().toLowerCase();
            const pParsed = parseModelAndYear(p.model_name).baseModel.toLowerCase();
            return pName === cleanCarName || pParsed === targetBase || pName.includes(targetBase) || targetBase.includes(pParsed);
        });

        const allModelNames = new Set<string>();
        matchingStats.forEach(s => allModelNames.add(s.model_name));
        matchingPrices.forEach(p => allModelNames.add(p.model_name));

        if (allModelNames.size === 0) {
            allModelNames.add(formData.carName);
        }

        const variants: Array<{
            rawModelName: string;
            year: string | null;
            stat?: CarPriceStats;
            manualPrice?: ScrapedCarPrice;
            isApprovedFresh: boolean;
            otherPrices: ScrapedCarPrice[];
            divarPrices: ScrapedCarPrice[];
            divarAveragePrice: number;
            sourcePricesMap: Record<string, ScrapedCarPrice>;
            sourceCount: number;
            isSufficientSources: boolean;
            lowestMarketPrice: number;
            highestMarketPrice: number;
            averageMarketPrice: number;
            modePrice: number;
            modeCount: number;
        }> = [];

        const yearsSet = new Set<string>();
        let hasApprovedPrice = false;

        allModelNames.forEach(rawModelName => {
            const parsed = parseModelAndYear(rawModelName);
            const year = parsed.year;
            if (year) yearsSet.add(year);

            const stat = matchingStats.find(s => s.model_name === rawModelName) || currentPriceStat || undefined;
            const manualPrice = matchingPrices.find(p => p.model_name === rawModelName && p.source_name === 'custom') ||
                               matchingPrices.find(p => p.source_name === 'custom'); // General approved price if present
            
            const otherPrices = matchingPrices
                .filter(p => (p.model_name === rawModelName || allModelNames.size === 1) && p.source_name !== 'custom' && p.price_rial > 0)
                .sort((a, b) => a.price_rial - b.price_rial);

            const divarPrices = otherPrices.filter(p => {
                const s = (p.source_name || '').toLowerCase();
                return s.includes('divar') || s.includes('دیوار');
            });
            const divarPriceValues = divarPrices.map(p => p.price_rial).filter(p => p > 0);
            const divarAveragePrice = divarPriceValues.length > 0
                ? Math.round(divarPriceValues.reduce((sum, p) => sum + p, 0) / divarPriceValues.length)
                : 0;

            const isApprovedFresh = isPriceUpdatedWithin24Hours(manualPrice?.captured_at);

            const sourcePricesMap: Record<string, ScrapedCarPrice> = {};
            otherPrices.forEach(p => {
                sourcePricesMap[p.source_name] = p;
            });

            const priceValues = otherPrices.map(p => p.price_rial);
            const lowestMarketPrice = priceValues.length > 0 
                ? Math.min(...priceValues) 
                : (stat?.minimum && stat.minimum > 0 ? stat.minimum : (stat?.maximum || 0));
            const highestMarketPrice = priceValues.length > 0 
                ? Math.max(...priceValues) 
                : (stat?.maximum || 0);
            const averageMarketPrice = priceValues.length > 0
                ? Math.round(priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length)
                : (stat?.average || stat?.maximum || 0);

            const priceFreq = new Map<number, number>();
            priceValues.forEach(p => {
                priceFreq.set(p, (priceFreq.get(p) || 0) + 1);
            });
            let modePrice = 0;
            let modeCount = 0;
            priceFreq.forEach((cnt, p) => {
                if (cnt > modeCount || (cnt === modeCount && p > modePrice)) {
                    modeCount = cnt;
                    modePrice = p;
                }
            });
            if (modePrice === 0 && priceValues.length > 0) {
                modePrice = priceValues[0];
                modeCount = 1;
            }

            const sourceCount = Object.keys(sourcePricesMap).length;
            const isSufficientSources = sourceCount >= 3;

            if (manualPrice && manualPrice.price_rial > 0) {
                hasApprovedPrice = true;
            }

            variants.push({
                rawModelName,
                year,
                stat,
                manualPrice,
                isApprovedFresh,
                otherPrices,
                divarPrices,
                divarAveragePrice,
                sourcePricesMap,
                sourceCount,
                isSufficientSources,
                lowestMarketPrice,
                highestMarketPrice,
                averageMarketPrice,
                modePrice,
                modeCount
            });
        });

        const years = Array.from(yearsSet).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

        variants.sort((a, b) => {
            if (!a.year) return 1;
            if (!b.year) return -1;
            return b.year.localeCompare(a.year, undefined, { numeric: true });
        });

        return {
            baseModelName: targetParsed.baseModel || formData.carName,
            variants,
            years,
            hasApprovedPrice
        };
    }, [formData.carName, priceStats, scrapedPrices, currentPriceStat]);

    // Active Variant (based on selected year or condition model)
    const activePriceVariant = useMemo(() => {
        if (!matchedCarPriceGroup || matchedCarPriceGroup.variants.length === 0) return null;
        
        if (selectedPriceYear) {
            const found = matchedCarPriceGroup.variants.find(v => v.year === selectedPriceYear);
            if (found) return found;
        }

        if (selectedConditionObj?.model) {
            const condModelClean = selectedConditionObj.model.trim();
            const found = matchedCarPriceGroup.variants.find(v => v.year === condModelClean || v.rawModelName.includes(condModelClean));
            if (found) return found;
        }

        const withApproved = matchedCarPriceGroup.variants.find(v => v.manualPrice && v.manualPrice.price_rial > 0 && v.isApprovedFresh);
        if (withApproved) return withApproved;

        const anyApproved = matchedCarPriceGroup.variants.find(v => v.manualPrice && v.manualPrice.price_rial > 0);
        if (anyApproved) return anyApproved;

        return matchedCarPriceGroup.variants[0];
    }, [matchedCarPriceGroup, selectedPriceYear, selectedConditionObj]);

    // Proposed Price Credibility & Soundness Assessment with 24-Hour Approved Rate Rule
    const credibilityVerdict = useMemo(() => {
        const proposed = formData.proposedPrice;
        const manualPrice = activePriceVariant?.manualPrice;
        const isApprovedFresh = activePriceVariant?.isApprovedFresh || false;
        const hasApproved = !!(manualPrice && manualPrice.price_rial > 0);
        const approvedVal = manualPrice?.price_rial || 0;

        const sourceCount = activePriceVariant?.sourceCount || 0;
        const isSufficient = activePriceVariant?.isSufficientSources || false;
        const lowestMarket = activePriceVariant?.lowestMarketPrice || currentPriceStat?.minimum || 0;
        const highestMarket = activePriceVariant?.highestMarketPrice || currentPriceStat?.maximum || 0;
        const avgMarket = activePriceVariant?.averageMarketPrice || currentPriceStat?.average || 0;
        const divarAvg = (activePriceVariant?.divarAveragePrice && activePriceVariant.divarAveragePrice > 0)
            ? activePriceVariant.divarAveragePrice
            : avgMarket;

        const isHavaleh = selectedConditionObj?.sale_type === SaleType.TRANSFER;

        if (!proposed || proposed <= 0) {
            return {
                status: 'EMPTY',
                isCredible: false,
                title: 'در انتظار ورود قیمت معامله پیشنهادی',
                badgeText: 'نیازمند ورود مبلغ',
                badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
                description: 'جهت بررسی استناد، انطباق با نرخ مصوب یا میانگین دیوار، مبلغ پیشنهادی را در کادر زیر وارد کنید.',
                icon: <HelpCircle className="w-5 h-5 text-slate-500" />
            };
        }

        // SCENARIO 1: APPROVED PRICE EXISTS AND UPDATED WITHIN 24 HOURS (نرخ مصوب معتبر حداکثر ۲۴ ساعت قبل)
        if (hasApproved && approvedVal > 0 && isApprovedFresh) {
            const threshold = approvedVal * 0.98; // 2% tolerance
            if (proposed >= threshold) {
                const isExact = proposed === approvedVal;
                return {
                    status: 'VALID',
                    isCredible: true,
                    title: isExact 
                        ? 'قیمت پیشنهادی کاملاً قابل استناد است (منطبق با نرخ مصوب معتبر ۲۴ ساعت اخیر)'
                        : 'قیمت پیشنهادی قابل استناد است (در محدوده مجاز نرخ مصوب معتبر نمایندگی)',
                    badgeText: 'نرخ مصوب معتبر (۲۴h) ⭐',
                    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
                    description: `مبلغ پیشنهادی (${proposed.toLocaleString('fa-IR')} تومان) با نرخ مصوب رسمی شرکت (${approvedVal.toLocaleString('fa-IR')} تومان - بروزرسانی در ۲۴ ساعت گذشته) مطابقت کامل دارد.`,
                    icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                };
            } else {
                const diff = approvedVal - proposed;
                return {
                    status: 'INVALID',
                    isCredible: false,
                    title: 'قیمت پیشنهادی فاقد استناد قطعی است (کمتر از نرخ مصوب ۲۴ ساعت اخیر)',
                    badgeText: 'زیر نرخ مصوب ⚠️',
                    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
                    description: `مبلغ پیشنهادی ${diff.toLocaleString('fa-IR')} تومان کمتر از نرخ مصوب معتبر نمایندگی (${approvedVal.toLocaleString('fa-IR')} تومان) است و ثبت آن منوط به تایید ویژه مدیریت است.`,
                    icon: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                };
            }
        }

        // SCENARIO 2: APPROVED PRICE EXPIRED (>24h) OR ABSENT -> RELY ON DIVAR AVERAGE PRICE
        const isExpiredApproved = hasApproved && !isApprovedFresh;
        const benchmarkPrice = divarAvg > 0 ? divarAvg : (lowestMarket > 0 ? lowestMarket : avgMarket);

        if (benchmarkPrice > 0) {
            const minAllowed = benchmarkPrice * 0.96;
            if (proposed >= minAllowed) {
                return {
                    status: 'VALID',
                    isCredible: true,
                    title: isExpiredApproved
                        ? 'قیمت پیشنهادی منطبق بر میانگین دیوار است (نرخ مصوب به دلیل گذشت بیش از ۲۴ ساعت منقضی است)'
                        : 'قیمت پیشنهادی قابل استناد است (منطبق با میانگین قیمت آگهی‌های دیوار)',
                    badgeText: isExpiredApproved ? 'مبنا: میانگین دیوار (مصوب منقضی)' : 'مبنا: میانگین دیوار 📱',
                    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800',
                    description: isExpiredApproved
                        ? `به دلیل گذشت بیش از ۲۴ ساعت از آخرین بروزرسانی نرخ مصوب، میانگین قیمت دیوار (${benchmarkPrice.toLocaleString('fa-IR')} تومان) مبنا قرار گرفت و مبلغ پیشنهادی (${proposed.toLocaleString('fa-IR')} تومان) موجه است.`
                        : `مبلغ پیشنهادی (${proposed.toLocaleString('fa-IR')} تومان) با میانگین روز دیوار (${benchmarkPrice.toLocaleString('fa-IR')} تومان) همخوانی دارد.`,
                    icon: <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                };
            } else {
                const diff = Math.round(minAllowed - proposed);
                return {
                    status: 'INVALID',
                    isCredible: false,
                    title: 'قیمت پیشنهادی کمتر از میانگین قیمت دیوار است',
                    badgeText: 'کمتر از میانگین دیوار 📉',
                    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
                    description: `مبلغ وارد شده ${diff.toLocaleString('fa-IR')} تومان کمتر از حداقل مجاز میانگین دیوار (${Math.round(minAllowed).toLocaleString('fa-IR')} تومان) است.${isExpiredApproved ? ' (نرخ مصوب قبلی بیش از ۲۴ ساعت است بروز نشده و فاقد اعتبار است)' : ''}`,
                    icon: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                };
            }
        }

        // SCENARIO 3: FALLBACK TO MARKET CHECKS
        if (!isSufficient) {
            return {
                status: 'WARNING',
                isCredible: false,
                title: 'قیمت پیشنهادی قابل استناد قطعی نیست (مراجع بازار ناکافی و فاقد نرخ مصوب)',
                badgeText: 'غیرقابل استناد قطعی ⚠️',
                badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
                description: `برای این خودرو نرخ مصوب ۲۴ ساعت اخیر ثبت نشده و تعداد مراجع برخط (${sourceCount} مرجع) به حدنصاب ۳ مرجع نرسیده است. قیمت وارد شده پیش از تایید نیازمند استعلام تلفنی و تایید مدیریت است.`,
                icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            };
        }

        return {
            status: 'VALID',
            isCredible: true,
            title: 'قیمت پیشنهادی قابل استناد است (منطبق با محدوده مراجع برخط بازار)',
            badgeText: 'قابل استناد 📊',
            badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
            description: `مبلغ پیشنهادی با استناد به ${sourceCount} مرجع برخط (بین کف ${lowestMarket.toLocaleString('fa-IR')} و سقف ${highestMarket.toLocaleString('fa-IR')} تومان) ارزیابی شده و کاملاً موجه است.`,
            icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        };
    }, [formData.proposedPrice, activePriceVariant, currentPriceStat, selectedConditionObj]);

    // Financial Analysis Logic for Havaleh & Zero Market
    const priceAnalysis = useMemo(() => {
        if (!selectedConditionObj || !formData.carName || !currentPriceStat) return null;

        const maxMarketPrice = activePriceVariant?.highestMarketPrice || currentPriceStat.maximum || 0;
        const avgMarketPrice = activePriceVariant?.averageMarketPrice || currentPriceStat.average || 0;
        const minMarketPrice = activePriceVariant?.lowestMarketPrice || currentPriceStat.minimum || 0;

        const isHavaleh = selectedConditionObj.sale_type === SaleType.TRANSFER;
        const isZeroMarket = selectedConditionObj.sale_type === SaleType.NEW_MARKET;

        let info: any = null;

        if (isHavaleh && maxMarketPrice > 0) {
            const h1Min = maxMarketPrice * 0.95;
            const h1Max = maxMarketPrice * 0.97;
            const h1Avg = (h1Min + h1Max) / 2;

            const h2Min = maxMarketPrice * 0.90;
            const h2Max = maxMarketPrice * 0.94;
            const h2Avg = (h2Min + h2Max) / 2;

            const warnH1 = formData.proposedPrice > 0 && formData.proposedPrice < (h1Avg * 0.98);
            const warnH2 = formData.proposedPrice > 0 && formData.proposedPrice < (h2Avg * 0.98);

            info = {
                type: 'HAVALEH',
                h1Min,
                h1Max,
                h1Avg,
                h2Min,
                h2Max,
                h2Avg,
                h1Range: `${Math.round(h1Min).toLocaleString('fa-IR')} تا ${Math.round(h1Max).toLocaleString('fa-IR')}`,
                h2Range: `${Math.round(h2Min).toLocaleString('fa-IR')} تا ${Math.round(h2Max).toLocaleString('fa-IR')}`,
                warnH1,
                warnH2
            };
        } else if (isZeroMarket && maxMarketPrice > 0) {
            const warningThreshold = maxMarketPrice * 0.98;
            const isUnderSelling = formData.proposedPrice > 0 && formData.proposedPrice < warningThreshold;

            info = {
                type: 'ZERO_MARKET',
                maxLabel: 'بالاترین قیمت روز بازار',
                maxValue: maxMarketPrice,
                avgValue: avgMarketPrice,
                minValue: minMarketPrice,
                isUnderSelling
            };
        }

        return { info, maxMarketPrice, avgMarketPrice, minMarketPrice };
    }, [selectedConditionObj, formData.carName, formData.proposedPrice, currentPriceStat, activePriceVariant]);

    // Handle Car Selection
    const handleSelectCar = (car: Car) => {
        setFormData(prev => ({
            ...prev,
            carName: car.name,
            conditionId: 0,
            conditionSummary: '',
            selectedColor: '',
            proposedPrice: 0
        }));
        setSelectedConditionObj(null);
        setSelectedPriceYear(null);
        setActiveSaleTypeTab('ALL');
        setStep(2);
    };

    // Handle Condition Selection
    const handleSelectCondition = (c: CarSaleCondition) => {
        setSelectedConditionObj(c);
        if (c.model) setSelectedPriceYear(c.model);
        const conditionText = `بخشنامه ${c.id}: ${c.sale_type} - ${c.pay_type} | مدل ${c.model} | تحویل ${c.delivery_time} | ${c.pay_type === PayType.CASH ? 'قیمت' : 'پیش‌پرداخت'} ${c.initial_deposit.toLocaleString('fa-IR')} تومان`;
        
        setFormData(prev => ({
            ...prev,
            conditionId: c.id,
            conditionSummary: conditionText,
            selectedColor: c.colors && c.colors.length > 0 ? c.colors[0] : '',
            proposedPrice: c.initial_deposit || 0
        }));
    };

    // Step Navigation
    const handleNext = () => {
        if (step === 1 && !formData.carName) return;
        if (step === 2 && !formData.conditionId) return;
        if (step === 3 && (!formData.proposedPrice || formData.proposedPrice <= 0)) return;
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => Math.max(1, prev - 1));
    };

    // Financial Calculation Helper
    const updateFinancials = (partial: { 
        purchasePrice?: number; 
        sellingPrice?: number; 
        shippingCost?: number; 
        proposedPrice?: number;
        commissionRatePercent?: number;
        sellerType?: 'COMPANY_WAREHOUSE' | 'OTHER';
        sellerName?: string;
    }) => {
        setFormData(prev => {
            const selling = partial.sellingPrice !== undefined 
                ? partial.sellingPrice 
                : (partial.proposedPrice !== undefined ? partial.proposedPrice : (prev.sellingPrice || prev.proposedPrice || 0));
            const purchase = partial.purchasePrice !== undefined ? partial.purchasePrice : (prev.purchasePrice || 0);
            const shipping = partial.shippingCost !== undefined ? partial.shippingCost : (prev.shippingCost || 0);
            const ratePercent = partial.commissionRatePercent !== undefined
                ? partial.commissionRatePercent
                : (prev.commissionRatePercent !== undefined ? prev.commissionRatePercent : 10);

            const netCommission = selling - purchase - shipping;
            const totalCommissionBonus = netCommission > 0 ? Math.round(netCommission * (ratePercent / 100)) : 0;
            const partnersCount = (prev.partners || []).length;
            const partnerCommissionShare = partnersCount > 0 && totalCommissionBonus > 0 
                ? Math.round(totalCommissionBonus / partnersCount) 
                : 0;

            return {
                ...prev,
                ...partial,
                sellingPrice: selling,
                proposedPrice: selling,
                purchasePrice: purchase,
                shippingCost: shipping,
                commissionRatePercent: ratePercent,
                netCommission,
                totalCommissionBonus,
                partnerCommissionShare
            };
        });
    };

    // Collaborating Partners Handlers (Max 4 Partners - Buy / Sale side)
    const handleAddPartner = (staffName: string, side: 'فروش' | 'خرید') => {
        const trimmed = staffName.trim();
        if (!trimmed) return;
        setFormData(prev => {
            const currentPartners = prev.partners || [];
            if (currentPartners.some(p => p.name === trimmed)) return prev;
            if (currentPartners.length >= 4) return prev; // Maximum 4 partners
            
            const staffObj = staffUsers.find(s => (s.fullName || s.username) === trimmed);
            const newPartner: OrderPartner = {
                name: trimmed,
                side,
                role: staffObj?.roleTitle || staffObj?.role || '',
                userId: staffObj?.id
            };
            const updated = [...currentPartners, newPartner];
            const netComm = (prev.sellingPrice || prev.proposedPrice || 0) - (prev.purchasePrice || 0) - (prev.shippingCost || 0);
            const ratePercent = prev.commissionRatePercent !== undefined ? prev.commissionRatePercent : 10;
            const bonus = netComm > 0 ? Math.round(netComm * (ratePercent / 100)) : 0;
            const share = updated.length > 0 && bonus > 0 ? Math.round(bonus / updated.length) : 0;

            return {
                ...prev,
                partners: updated,
                carExperts: updated.map(p => `${p.name} (سمت ${p.side})`),
                partnerCommissionShare: share
            };
        });
    };

    const handleRemovePartner = (partnerName: string) => {
        setFormData(prev => {
            const updated = (prev.partners || []).filter(p => p.name !== partnerName);
            const netComm = (prev.sellingPrice || prev.proposedPrice || 0) - (prev.purchasePrice || 0) - (prev.shippingCost || 0);
            const ratePercent = prev.commissionRatePercent !== undefined ? prev.commissionRatePercent : 10;
            const bonus = netComm > 0 ? Math.round(netComm * (ratePercent / 100)) : 0;
            const share = updated.length > 0 && bonus > 0 ? Math.round(bonus / updated.length) : 0;

            return {
                ...prev,
                partners: updated,
                carExperts: updated.map(p => `${p.name} (سمت ${p.side})`),
                partnerCommissionShare: share
            };
        });
    };

    const handleTogglePartnerSide = (partnerName: string) => {
        setFormData(prev => {
            const updated = (prev.partners || []).map(p => {
                if (p.name === partnerName) {
                    return { ...p, side: p.side === 'فروش' ? ('خرید' as const) : ('فروش' as const) };
                }
                return p;
            });
            return {
                ...prev,
                partners: updated,
                carExperts: updated.map(p => `${p.name} (سمت ${p.side})`)
            };
        });
    };

    // Expert Selection Handlers (Legacy / Max 4 Experts)
    const handleToggleExpert = (expertName: string) => {
        const trimmed = expertName.trim();
        if (!trimmed) return;
        setFormData(prev => {
            const current = prev.carExperts || [];
            if (current.includes(trimmed)) {
                return { ...prev, carExperts: current.filter(e => e !== trimmed) };
            }
            if (current.length >= 4) {
                return prev; // Maximum 4 experts
            }
            return { ...prev, carExperts: [...current, trimmed] };
        });
    };

    const handleRemoveExpert = (expertName: string) => {
        setFormData(prev => ({
            ...prev,
            carExperts: (prev.carExperts || []).filter(e => e !== expertName)
        }));
    };

    // Filter staff users by search query
    const filteredStaffUsers = useMemo(() => {
        if (!expertSearchQuery.trim()) return staffUsers;
        const q = expertSearchQuery.toLowerCase();
        return staffUsers.filter(u => 
            (u.fullName && u.fullName.toLowerCase().includes(q)) ||
            (u.username && u.username.toLowerCase().includes(q)) ||
            (u.role && u.role.toLowerCase().includes(q))
        );
    }, [staffUsers, expertSearchQuery]);

    // CRM Search Handlers
    const handleCrmSearch = (query: string) => {
        setCrmSearchQuery(query);
        if (!query.trim()) {
            setCrmResults([]);
            return;
        }
        const q = query.toLowerCase();
        const filtered = crmUsers.filter(u => 
            (u?.FullName && u.FullName.toLowerCase().includes(q)) ||
            (u?.Number && u.Number.includes(query))
        );
        setCrmResults(filtered.slice(0, 8));
    };

    const handleSelectCrmUser = (u: User) => {
        setFormData(prev => ({
            ...prev,
            buyerName: u?.FullName || prev.buyerName,
            buyerPhone: u?.Number || prev.buyerPhone,
            buyerCity: u?.City || prev.buyerCity,
            buyerAddress: [u?.Province, u?.Decription].filter(Boolean).join(' - ') || prev.buyerAddress,
        }));
        setCrmSearchQuery('');
        setCrmResults([]);
    };

    const autoMatchCrmUser = useMemo(() => {
        if (formData.buyerPhone && formData.buyerPhone.length >= 5) {
            const foundByPhone = crmUsers.find(u => u?.Number && u.Number.includes(formData.buyerPhone));
            if (foundByPhone && (formData.buyerName !== foundByPhone.FullName || formData.buyerCity !== foundByPhone.City)) {
                return foundByPhone;
            }
        }
        if (formData.buyerName && formData.buyerName.length >= 3) {
            const nameSearch = formData.buyerName.toLowerCase();
            const foundByName = crmUsers.find(u => u?.FullName && u.FullName.toLowerCase().includes(nameSearch));
            if (foundByName && (formData.buyerPhone !== foundByName.Number || formData.buyerCity !== foundByName.City)) {
                return foundByName;
            }
        }
        return null;
    }, [formData.buyerPhone, formData.buyerName, crmUsers]);

    // Check if the current buyer details match an existing CRM contact
    const matchingCrmContact = useMemo(() => {
        if (!formData.buyerPhone && !formData.buyerName) return null;
        const cleanPhone = (formData.buyerPhone || '').trim().replace(/[\s\-\(\)]/g, '');
        const cleanName = (formData.buyerName || '').trim().toLowerCase();
        
        return crmUsers.find(u => {
            if (!u) return false;
            const uPhone = (u.Number || '').replace(/[\s\-\(\)]/g, '');
            if (cleanPhone && cleanPhone.length >= 7 && uPhone && (uPhone === cleanPhone || uPhone.endsWith(cleanPhone) || cleanPhone.endsWith(uPhone))) {
                return true;
            }
            if (cleanName && cleanName.length >= 3 && u.FullName && u.FullName.trim().toLowerCase() === cleanName) {
                return true;
            }
            return false;
        }) || null;
    }, [formData.buyerPhone, formData.buyerName, crmUsers]);

    // Handle creating a new condition from Step 2
    const handleSaveNewCondition = async (newCondData: Omit<CarSaleCondition, 'id'>) => {
        try {
            const payload: Omit<CarSaleCondition, 'id'> = {
                ...newCondData,
                car_model: newCondData.car_model || formData.carName,
            };
            const created = await createCondition(payload);
            const refreshed = await getConditions();
            setConditions(refreshed);
            setIsConditionModalOpen(false);
            if (created && created.id) {
                handleSelectCondition(created);
            } else {
                const found = refreshed.find(c => c.car_model === (payload.car_model || formData.carName));
                if (found) handleSelectCondition(found);
            }
        } catch (err) {
            console.error("Error creating new condition:", err);
        }
    };

    // Process CRM registration / activity logs and submit order
    const submitOrderWithCrm = async (status: OrderStatus) => {
        if (!formData.buyerName || !formData.buyerPhone) return;
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const cleanPhone = (formData.buyerPhone || '').trim();
            const cleanName = (formData.buyerName || '').trim();
            const normalizedPhone = cleanPhone.replace(/[\s\-\(\)]/g, '');

            // 1. Find existing CRM contact
            const existingUser = crmUsers.find(u => {
                if (!u) return false;
                const uPhone = (u.Number || '').replace(/[\s\-\(\)]/g, '');
                if (uPhone && normalizedPhone && (uPhone === normalizedPhone || uPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(uPhone))) {
                    return true;
                }
                if (u.FullName && cleanName && u.FullName.trim().toLowerCase() === cleanName.toLowerCase()) {
                    return true;
                }
                return false;
            });

            const expertsStr = (formData.carExperts && formData.carExperts.length > 0)
                ? `\nکارشناسان خودرو دخیل در معامله: ${formData.carExperts.join('، ')}`
                : '';

            const orderDescription = `ثبت سفارش خودرو ${formData.carName} (${selectedConditionObj?.sale_type || ''} - ${selectedConditionObj?.pay_type || ''})\nقیمت معامله پیشنهادی: ${(formData.proposedPrice || 0).toLocaleString('fa-IR')} تومان\nکد ملی: ${formData.buyerNationalId || '-'}\nکد پستی: ${formData.buyerPostalCode || '-'}\nآدرس: ${formData.buyerAddress || formData.buyerCity || '-'}\nرنگ انتخابی: ${formData.selectedColor || '-'}${expertsStr}${formData.userNotes ? `\nتوضیحات: ${formData.userNotes}` : ''}`;

            if (!existingUser) {
                // Customer is NOT in CRM -> Create in CRM with descriptions
                try {
                    const newUserPayload: Omit<User, 'id'> = {
                        FullName: cleanName,
                        Number: cleanPhone,
                        CarModel: formData.carName,
                        Province: formData.buyerAddress || '',
                        City: formData.buyerCity || '',
                        Decription: orderDescription,
                        IP: '',
                        RegisterTime: new Date().toLocaleDateString('fa-IR'),
                        reference: 'ثبت سفارش خودرو',
                        LastAction: 'ثبت سفارش خودرو',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    const createdUser = await createUser(newUserPayload);
                    if (createdUser && createdUser.id) {
                        const targetId = Number(createdUser.id);
                        setCrmUsers(prev => [createdUser, ...prev]);

                        // Journal entry
                        await createCustomerJournal({
                            userId: targetId,
                            content: `🚗 ثبت مشتری جدید و سفارش خودرو در سیستم\nخودرو: ${formData.carName}\nنوع فروش: ${selectedConditionObj?.sale_type || '-'}\nشیوه پرداخت: ${selectedConditionObj?.pay_type || '-'}\nقیمت معامله پیشنهادی: ${(formData.proposedPrice || 0).toLocaleString('fa-IR')} تومان\nرنگ: ${formData.selectedColor || '-'}\nکد ملی: ${formData.buyerNationalId || '-'}\nآدرس: ${formData.buyerAddress || formData.buyerCity || '-'}${expertsStr}${formData.userNotes ? `\nتوضیحات خریدار: ${formData.userNotes}` : ''}`,
                            author: username || 'کاربر سیستم'
                        }).catch(e => console.warn("Failed to create customer journal:", e));

                        // Call log entry
                        await createCallLog({
                            userId: targetId,
                            customerName: cleanName,
                            customerNumber: cleanPhone,
                            callType: 'INBOUND',
                            callStatus: 'SUCCESSFUL',
                            duration: 0,
                            agentName: username || 'کاربر سیستم',
                            notes: `📋 ثبت سفارش خودرو ${formData.carName} (ثبت نام مخاطب جدید در CRM) با قیمت پیشنهادی ${(formData.proposedPrice || 0).toLocaleString('fa-IR')} تومان${(formData.carExperts && formData.carExperts.length > 0) ? ` | کارشناسان: ${formData.carExperts.join('، ')}` : ''}`,
                            timestamp: new Date().toLocaleString('fa-IR')
                        }).catch(e => console.warn("Failed to create call log:", e));
                    }
                } catch (err) {
                    console.error("Failed to register customer in CRM:", err);
                }
            } else {
                // Customer ALREADY in CRM -> Register new call log / activity
                try {
                    const targetId = Number(existingUser.id);
                    if (targetId) {
                        await createCallLog({
                            userId: targetId,
                            customerName: cleanName || existingUser.FullName,
                            customerNumber: cleanPhone || existingUser.Number,
                            callType: 'INBOUND',
                            callStatus: 'SUCCESSFUL',
                            duration: 0,
                            agentName: username || 'کاربر سیستم',
                            notes: `📋 ثبت گزارش فعالیت / ثبت سفارش خودرو: ${formData.carName} (${selectedConditionObj?.sale_type || ''}) با قیمت پیشنهادی ${(formData.proposedPrice || 0).toLocaleString('fa-IR')} تومان\nرنگ: ${formData.selectedColor || '-'}${(formData.carExperts && formData.carExperts.length > 0) ? ` | کارشناسان: ${formData.carExperts.join('، ')}` : ''}${formData.userNotes ? ` | توضیحات: ${formData.userNotes}` : ''}`,
                            timestamp: new Date().toLocaleString('fa-IR')
                        }).catch(e => console.warn("Failed to create call log for existing user:", e));

                        await createCustomerJournal({
                            userId: targetId,
                            content: `🚗 ثبت سفارش جدید خودرو برای این مشتری در CRM\nخودرو: ${formData.carName}\nنوع فروش: ${selectedConditionObj?.sale_type || '-'}\nشیوه پرداخت: ${selectedConditionObj?.pay_type || '-'}\nقیمت معامله پیشنهادی: ${(formData.proposedPrice || 0).toLocaleString('fa-IR')} تومان\nرنگ: ${formData.selectedColor || '-'}${expertsStr}${formData.userNotes ? `\nتوضیحات: ${formData.userNotes}` : ''}`,
                            author: username || 'کاربر سیستم'
                        }).catch(e => console.warn("Failed to create customer journal:", e));
                    }
                } catch (err) {
                    console.error("Failed to register CRM activity for existing user:", err);
                }
            }

            onSave(formData, status);
        } catch (e) {
            console.error("Error submitting order:", e);
            onSave(formData, status);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit Handlers
    const handleFinalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitOrderWithCrm(OrderStatus.PENDING_ADMIN);
    };

    const handleSaveAsDraft = (e: React.MouseEvent) => {
        e.preventDefault();
        submitOrderWithCrm(OrderStatus.DRAFT);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-3 sm:p-4 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] border border-slate-200 dark:border-slate-800 overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                            <CarIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">
                                {editOrder ? 'ویرایش سفارش فروش خودرو' : 'ثبت سفارش فروش خودرو'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                گام {step} از ۵: {
                                    step === 1 ? 'انتخاب خودرو از لیست' :
                                    step === 2 ? 'نوع فروش و شرایط' :
                                    step === 3 ? 'قیمت‌گذاری معامله و ارقام مالی' :
                                    step === 4 ? 'همکاران مشارکت‌کننده در معامله' : 'اطلاعات فروشنده و خریدار و ثبت نهایی'
                                }
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Stepper Progress Bar */}
                <div className="px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between overflow-x-auto">
                    {[
                        { num: 1, title: 'انتخاب خودرو', icon: CarIcon },
                        { num: 2, title: 'نوع فروش و شرایط', icon: Layers },
                        { num: 3, title: 'قیمت‌گذاری معامله', icon: DollarSign },
                        { num: 4, title: 'همکاران معامله', icon: Users },
                        { num: 5, title: 'طرفین و ثبت نهایی', icon: UserIcon },
                    ].map((s, idx) => {
                        const Icon = s.icon;
                        const isCompleted = step > s.num;
                        const isCurrent = step === s.num;
                        return (
                            <React.Fragment key={s.num}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isCompleted) setStep(s.num);
                                    }}
                                    disabled={!isCompleted}
                                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                                        isCurrent 
                                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-black ring-1 ring-sky-500/30 shadow-sm'
                                            : isCompleted 
                                                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer font-bold'
                                                : 'text-slate-400 dark:text-slate-600 cursor-not-allowed font-medium'
                                    }`}
                                >
                                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[11px] sm:text-xs ${
                                        isCurrent 
                                            ? 'bg-sky-600 text-white font-black' 
                                            : isCompleted 
                                                ? 'bg-emerald-500 text-white' 
                                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                    }`}>
                                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                                    </div>
                                    <span className="text-xs hidden md:inline">{s.title}</span>
                                </button>
                                {idx < 4 && (
                                    <div className={`flex-1 min-w-2 h-0.5 mx-1 sm:mx-2 rounded-full transition-colors ${
                                        step > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                                    }`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[420px]">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-24 gap-4">
                            <Spinner />
                            <p className="text-sm text-slate-400 font-bold animate-pulse">در حال فراخوانی داده‌های خودروها و بخشنامه‌ها...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* Rejection Alert if editing a rejected order */}
                            {editOrder && editOrder.status === OrderStatus.REJECTED && editOrder.adminNotes && (
                                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl text-xs text-rose-800 dark:text-rose-200">
                                    <div className="flex items-center gap-2 mb-1 font-bold text-sm">
                                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                                        علت رد شدن درخواست توسط مدیریت:
                                    </div>
                                    <p className="mr-6 font-medium leading-relaxed">{editOrder.adminNotes}</p>
                                </div>
                            )}

                            {/* ------------------------------------------------------------- */}
                            {/* STEP 1: SELECT CAR FROM LIST WITH PHOTO & BRAND/PRICE FILTERS */}
                            {/* ------------------------------------------------------------- */}
                            {step === 1 && (
                                <div className="space-y-5 animate-fade-in">
                                    {/* Filter Toolbar */}
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            {/* Search Input */}
                                            <div className="relative flex-1">
                                                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="جستجوی مدل یا برند خودرو..."
                                                    className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                                                    value={carSearchQuery}
                                                    onChange={e => setCarSearchQuery(e.target.value)}
                                                />
                                            </div>

                                            {/* Price Range Filter */}
                                            <div className="sm:w-56">
                                                <select
                                                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                                                    value={priceFilter}
                                                    onChange={e => setPriceFilter(e.target.value as any)}
                                                >
                                                    <option value="ALL">همه بازه‌های قیمتی</option>
                                                    <option value="UNDER_1B">زیر ۱ میلیارد تومان</option>
                                                    <option value="1B_TO_2B">۱ تا ۲ میلیارد تومان</option>
                                                    <option value="OVER_2B">بالای ۲ میلیارد تومان</option>
                                                    <option value="SORT_ASC">مرتب‌سازی: ارزان‌ترین</option>
                                                    <option value="SORT_DESC">مرتب‌سازی: گران‌ترین</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Brand Chips */}
                                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                                            <span className="text-[11px] font-bold text-slate-400 ml-1 whitespace-nowrap">برند:</span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedBrand('ALL')}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                                    selectedBrand === 'ALL'
                                                        ? 'bg-sky-600 text-white shadow-sm'
                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                                }`}
                                            >
                                                همه ({cars.length})
                                            </button>
                                            {availableBrands.map(brand => {
                                                const count = cars.filter(c => c.brand === brand).length;
                                                return (
                                                    <button
                                                        key={brand}
                                                        type="button"
                                                        onClick={() => setSelectedBrand(brand)}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                                            selectedBrand === brand
                                                                ? 'bg-sky-600 text-white shadow-sm'
                                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        {brand} ({count})
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Car Cards Grid */}
                                    {filteredCars.length === 0 ? (
                                        <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                            <CarIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                            <p className="font-bold text-sm">هیچ خودرویی با فیلترهای انتخابی یافت نشد.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {filteredCars.map(car => {
                                                const isSelected = formData.carName === car.name;
                                                const carConds = conditions.filter(c => c.car_model === car.name);
                                                const stat = statsMap.get(car.name.trim().toLowerCase());
                                                const imageUrl = car.main_image_url || car.front_image_url;

                                                return (
                                                    <div
                                                        key={car.id}
                                                        onClick={() => handleSelectCar(car)}
                                                        className={`group relative bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 ${
                                                            isSelected 
                                                                ? 'border-sky-500 ring-4 ring-sky-500/10 shadow-lg' 
                                                                : 'border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700'
                                                        }`}
                                                    >
                                                        {/* Car Image Header */}
                                                        <div className="h-36 bg-slate-100 dark:bg-slate-900/60 relative overflow-hidden flex items-center justify-center">
                                                            {imageUrl ? (
                                                                <img 
                                                                    src={imageUrl} 
                                                                    alt={car.name} 
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                    onError={(e) => {
                                                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <CarIcon className="w-16 h-16 text-slate-300 dark:text-slate-700" />
                                                            )}

                                                            {/* Brand Badge */}
                                                            {car.brand && (
                                                                <span className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-white/20">
                                                                    {car.brand}
                                                                </span>
                                                            )}

                                                            {/* Selection check */}
                                                            {isSelected && (
                                                                <div className="absolute top-2.5 left-2.5 bg-sky-600 text-white p-1 rounded-full shadow-md">
                                                                    <Check className="w-4 h-4" />
                                                                </div>
                                                            )}

                                                            {/* Conditions Count Badge */}
                                                            <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                                                <FileSpreadsheet className="w-3 h-3 text-sky-600" />
                                                                <span>{carConds.length} بخشنامه فعال</span>
                                                            </div>
                                                        </div>

                                                        {/* Details Content */}
                                                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                                            <div>
                                                                <h4 className="text-base font-black text-slate-800 dark:text-white group-hover:text-sky-600 transition-colors">
                                                                    {car.name}
                                                                </h4>
                                                            </div>

                                                            {/* Approximate Price Box */}
                                                            <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl text-xs space-y-1">
                                                                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
                                                                    <span>قیمت تقریبی:</span>
                                                                    <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                                                                        {(() => {
                                                                            const approxPrice = getCarHighestApproxPrice(car.name);
                                                                            return approxPrice > 0 
                                                                                ? `${approxPrice.toLocaleString('fa-IR')} ت` 
                                                                                : 'استعلام نشده';
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Action Button */}
                                                            <button
                                                                type="button"
                                                                className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                                                                    isSelected
                                                                        ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 group-hover:bg-sky-50 dark:group-hover:bg-sky-950 group-hover:text-sky-600'
                                                                }`}
                                                            >
                                                                <span>{isSelected ? 'انتخاب شده ✓' : 'انتخاب این خودرو'}</span>
                                                                <ArrowLeft className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ------------------------------------------------------------------ */}
                            {/* STEP 2: SELECT BY SALE TYPE (ثبت‌نام کارخانه، حواله، لیزینگی، صفر، کارکرده) */}
                            {/* ------------------------------------------------------------------ */}
                            {step === 2 && (
                                <div className="space-y-5 animate-fade-in">
                                    {/* Car Selected Snapshot Bar */}
                                    <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            {selectedCarObj?.main_image_url || selectedCarObj?.front_image_url ? (
                                                <img 
                                                    src={selectedCarObj.main_image_url || selectedCarObj.front_image_url} 
                                                    alt={formData.carName} 
                                                    className="w-14 h-14 rounded-xl object-cover border border-sky-200 dark:border-sky-800"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                                                    <CarIcon className="w-7 h-7" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-sky-600 text-white font-black px-2 py-0.5 rounded-md">
                                                        {selectedCarObj?.brand || 'خودرو'}
                                                    </span>
                                                    <h4 className="text-base font-black text-slate-800 dark:text-white">
                                                        {formData.carName}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    لطفاً یکی از انواع شرایط فروش و بخشنامه‌های موجود را انتخاب نمایید.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-slate-700 shadow-sm"
                                        >
                                            تغییر خودرو
                                        </button>
                                    </div>

                                    {/* Sale Type Categorization Tabs & Add Condition Button */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin flex-1">
                                            {SALE_TYPE_TABS.map(tab => {
                                                const Icon = tab.icon;
                                                const count = saleTypeCounts[tab.id] || 0;
                                                const isActive = activeSaleTypeTab === tab.id;

                                                return (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => setActiveSaleTypeTab(tab.id)}
                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${
                                                            isActive
                                                                ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/20'
                                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                        }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        <span>{tab.label}</span>
                                                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                                                            isActive 
                                                                ? 'bg-white/20 text-white' 
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                                        }`}>
                                                            {count}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Add New Condition Trigger */}
                                        <button
                                            type="button"
                                            onClick={() => setIsConditionModalOpen(true)}
                                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all whitespace-nowrap"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>افزودن شرایط جدید</span>
                                        </button>
                                    </div>

                                    {/* Conditions List */}
                                    {filteredConditions.length === 0 ? (
                                        <div className="p-10 text-center bg-rose-50/70 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 space-y-3">
                                            <AlertTriangle className="w-10 h-10 mx-auto text-rose-500" />
                                            <p className="font-bold text-sm">هیچ بخشنامه یا شرایط فعالی در دسته‌بندی انتخابی برای {formData.carName} ثبت نشده است.</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">می‌توانید بخشنامه و شرایط فروش جدیدی برای این خودرو ایجاد نمایید یا سایر دسته‌بندی‌ها را بررسی کنید.</p>
                                            <button
                                                type="button"
                                                onClick={() => setIsConditionModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/20 transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>افزودن شرایط فروش جدید برای {formData.carName}</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                                            {filteredConditions.map(c => {
                                                const isSelected = formData.conditionId === c.id;
                                                const isOutOfStock = c.stock_quantity <= 0;

                                                // Badges styling
                                                let typeColor = 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300';
                                                if (c.sale_type === SaleType.FACTORY_REGISTRATION) typeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
                                                if (c.sale_type === SaleType.TRANSFER) typeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
                                                if (c.sale_type === SaleType.LEASING) typeColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
                                                if (c.sale_type === SaleType.NEW_MARKET) typeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
                                                if (c.sale_type === SaleType.USED) typeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';

                                                return (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => handleSelectCondition(c)}
                                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-800 relative ${
                                                            isSelected
                                                                ? 'border-sky-500 ring-4 ring-sky-500/10 shadow-lg bg-sky-50/40 dark:bg-sky-950/20'
                                                                : 'border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-slate-600'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className={`px-3 py-1 rounded-xl text-xs font-black ${typeColor}`}>
                                                                    {c.sale_type}
                                                                </span>
                                                                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                                    نوع پرداخت: {c.pay_type}
                                                                </span>
                                                                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                                    مدل {c.model}
                                                                </span>
                                                                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                                    سند {c.document_status}
                                                                </span>
                                                            </div>

                                                            {/* Deposit Price */}
                                                            <div className="text-left">
                                                                <span className="text-[10px] text-slate-400 block">
                                                                    {c.pay_type === PayType.CASH ? 'قیمت مصوب' : 'پیش‌پرداخت اولیه'}:
                                                                </span>
                                                                <span className="text-base font-black font-mono text-sky-700 dark:text-sky-400">
                                                                    {c.initial_deposit.toLocaleString('fa-IR')} <span className="text-xs font-sans">تومان</span>
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Details Footer */}
                                                        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 gap-2">
                                                            <div className="flex items-center gap-4">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                                    موعد تحویل: <strong className="text-slate-700 dark:text-slate-200">{c.delivery_time || 'مشخص نشده'}</strong>
                                                                </span>

                                                                {/* Stock Status Badge */}
                                                                <span className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                                                                    isOutOfStock
                                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                                                        : c.stock_quantity <= 2
                                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                                                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                                }`}>
                                                                    موجودی انبار: {c.stock_quantity.toLocaleString('fa-IR')} عدد
                                                                </span>
                                                            </div>

                                                            {/* Color swatches */}
                                                            {c.colors && c.colors.length > 0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-[11px] text-slate-400">رنگ‌های مجاز:</span>
                                                                    <div className="flex items-center gap-1">
                                                                        {c.colors.map(col => (
                                                                            <span 
                                                                                key={col} 
                                                                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-bold"
                                                                            >
                                                                                {col}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ------------------------------------------------------------- */}
                            {/* STEP 3: FINANCIAL INTELLIGENCE & PROPOSED DEAL PRICE ENTRY     */}
                            {/* ------------------------------------------------------------- */}
                            {step === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    {/* Primary Financial Reference Cards */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                        
                                        {/* Left/Main Column: Approved Price OR Full Car Price Stats Card */}
                                        <div className="lg:col-span-7 space-y-4">
                                            {activePriceVariant?.manualPrice && activePriceVariant.manualPrice.price_rial > 0 ? (
                                                /* -------------------------------------------------------- */
                                                /* BRANCH 1: APPROVED PRICE CARD (قیمت مصوب نمایندگی)       */
                                                /* -------------------------------------------------------- */
                                                <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/50 to-slate-50 dark:from-slate-800 dark:via-indigo-950/30 dark:to-slate-850 p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/70 shadow-sm relative overflow-hidden space-y-4">
                                                    {/* Glow Accent */}
                                                    <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

                                                    <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/50 pb-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                                                                <BadgeCheck className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h5 className="font-black text-sm text-indigo-950 dark:text-indigo-200">
                                                                        قیمت مصوب نمایندگی (نرخ رسمی شرکت)
                                                                    </h5>
                                                                    <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                                                        نرخ مصوب
                                                                    </span>
                                                                </div>
                                                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                    مرجع رسمی و قطعی قیمت‌گذاری برای {formData.carName} {activePriceVariant.year ? `(مدل ${activePriceVariant.year})` : ''}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                            {timeAgo(activePriceVariant.manualPrice.captured_at)}
                                                        </span>
                                                    </div>

                                                    {/* Approved Price Number */}
                                                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pt-1">
                                                        <div>
                                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">مبلغ قطعی مصوب:</span>
                                                            <div className="flex items-baseline gap-1.5">
                                                                <span className="font-mono font-black text-2xl sm:text-3xl text-indigo-950 dark:text-indigo-100">
                                                                    {activePriceVariant.manualPrice.price_rial.toLocaleString('fa-IR')}
                                                                </span>
                                                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">تومان</span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({...formData, proposedPrice: activePriceVariant.manualPrice!.price_rial})}
                                                            className="text-xs bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            <span>درج این نرخ برای معامله</span>
                                                        </button>
                                                    </div>

                                                    {/* Notes or Description if present */}
                                                    {activePriceVariant.manualPrice.price_text && (
                                                        <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-indigo-100/80 dark:border-indigo-950 text-xs text-slate-600 dark:text-slate-300">
                                                            <span className="font-bold text-indigo-900 dark:text-indigo-300 ml-1">توضیحات نرخ مصوب:</span>
                                                            <span>{activePriceVariant.manualPrice.price_text}</span>
                                                        </div>
                                                    )}

                                                    {/* Market comparison micro-stats */}
                                                    {activePriceVariant.highestMarketPrice > 0 && (
                                                        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                                            <div className="bg-white/60 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-indigo-50 dark:border-slate-800 flex justify-between items-center">
                                                                <span className="text-slate-500">میانگین بازار:</span>
                                                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                                                    {activePriceVariant.averageMarketPrice.toLocaleString('fa-IR')} ت
                                                                </span>
                                                            </div>
                                                            <div className="bg-white/60 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-indigo-50 dark:border-slate-800 flex justify-between items-center">
                                                                <span className="text-slate-500">سقف بازار:</span>
                                                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                                    {activePriceVariant.highestMarketPrice.toLocaleString('fa-IR')} ت
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* -------------------------------------------------------- */
                                                /* BRANCH 2: AUTHENTIC CAR PRICE CARD (کارت قیمت خودرو)     */
                                                /* -------------------------------------------------------- */
                                                <div className="space-y-3">
                                                    {/* Notice that approved price was not entered */}
                                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                            <span className="font-bold">قیمت مصوب نمایندگی برای این خودرو وارد نشده است.</span>
                                                        </div>
                                                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg font-bold">
                                                            استعلام از مراجع برخط بازار
                                                        </span>
                                                    </div>

                                                    {/* The Full Authentic Car Price Card from CarPricesPage */}
                                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                                        
                                                        {/* Header with Car Name & Year Tabs */}
                                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black">
                                                                    <CarIcon className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                                                                        {matchedCarPriceGroup?.baseModelName || formData.carName}
                                                                    </h4>
                                                                    <span className="text-[10px] text-slate-400">
                                                                        کارت خلاصه آمار و استعلام نرخ‌های کشف‌شده بازار
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Year selector tabs if multiple years available */}
                                                            {matchedCarPriceGroup && matchedCarPriceGroup.years.length > 1 && (
                                                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/70 p-1 rounded-xl">
                                                                    <span className="text-[10px] font-bold text-slate-400 px-1">سال مدل:</span>
                                                                    {matchedCarPriceGroup.years.map(y => {
                                                                        const isSelected = (activePriceVariant?.year === y);
                                                                        return (
                                                                            <button
                                                                                key={y}
                                                                                type="button"
                                                                                onClick={() => setSelectedPriceYear(y)}
                                                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                                                                    isSelected 
                                                                                        ? 'bg-sky-600 text-white shadow-sm' 
                                                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600'
                                                                                }`}
                                                                            >
                                                                                مدل {y}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Source Sufficiency & Authenticity Badge */}
                                                        {activePriceVariant?.isSufficientSources ? (
                                                            <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-2 rounded-xl flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                                                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                    <span>قیمت‌های بازار قابل استناد است</span>
                                                                </div>
                                                                <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-lg">
                                                                    {activePriceVariant.sourceCount} مرجع برخط فعال
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-2 rounded-xl flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                                                                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                                    <span>مرجع کافی نیست (نیازمند استعلام تلفنی بازار)</span>
                                                                </div>
                                                                <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg">
                                                                    {activePriceVariant?.sourceCount ? `${activePriceVariant.sourceCount} مرجع` : 'فاقد مرجع'}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* 3-Rate Market Box */}
                                                        {activePriceVariant && (
                                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-2.5">
                                                                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/50 pb-1.5">
                                                                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                                        <BarChart3 className="w-3.5 h-3.5 text-sky-500" />
                                                                        <span>نرخ‌های مراجع بازار</span>
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                        میانگین: <strong className="font-mono font-bold text-slate-800 dark:text-slate-200">{Math.round(activePriceVariant.averageMarketPrice).toLocaleString('fa-IR')}</strong> تومان
                                                                    </span>
                                                                </div>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                                                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                                                            <span>📉</span>
                                                                            <span>کمترین نرخ:</span>
                                                                        </span>
                                                                        <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                                                                            {activePriceVariant.lowestMarketPrice.toLocaleString('fa-IR')} <span className="text-[9px] font-normal text-slate-400">تومان</span>
                                                                        </span>
                                                                    </div>
                                                                    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                            <span>📈</span>
                                                                            <span>بیشترین نرخ:</span>
                                                                        </span>
                                                                        <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                                                                            {activePriceVariant.highestMarketPrice.toLocaleString('fa-IR')} <span className="text-[9px] font-normal text-slate-400">تومان</span>
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {activePriceVariant.modePrice > 0 && (
                                                                    <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                                                                        <span className="text-slate-500 dark:text-slate-400 font-bold">🎯 نرخ پرتکرار مراجع (Mode):</span>
                                                                        <div className="flex items-center gap-1 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                                            <span>{activePriceVariant.modePrice.toLocaleString('fa-IR')}</span>
                                                                            <span className="text-[9px] font-sans font-normal text-slate-400">({activePriceVariant.modeCount} مرجع هم‌نظر)</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Scraped Sources Breakdown */}
                                                        {activePriceVariant && activePriceVariant.otherPrices.length > 0 && (
                                                            <div className="space-y-1.5 pt-1">
                                                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                                                                    قیمت‌های ثبت‌شده در مراجع برخط:
                                                                </span>
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                    {activePriceVariant.otherPrices.map(op => (
                                                                        <div key={op.id} className="bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between">
                                                                            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                                                                                <span className="font-bold text-slate-600 dark:text-slate-300">{op.source_name}</span>
                                                                                <span>{timeAgo(op.captured_at)}</span>
                                                                            </div>
                                                                            <span className="font-mono font-black text-xs text-slate-800 dark:text-slate-100">
                                                                                {op.price_rial.toLocaleString('fa-IR')} <span className="text-[9px] font-sans font-normal text-slate-400">ت</span>
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Column: Condition Price Card & Quick Facts */}
                                        <div className="lg:col-span-5 space-y-4">
                                            {/* Circular/Condition Price Card */}
                                            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800 dark:to-slate-800/40 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm space-y-3.5 h-full flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                            <h5 className="font-black text-sm text-slate-800 dark:text-white">
                                                                قیمت درج‌شده در بخشنامه
                                                            </h5>
                                                        </div>
                                                        <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                                                            {selectedConditionObj?.sale_type}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2.5">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 dark:text-slate-400">
                                                                {selectedConditionObj?.pay_type === PayType.CASH ? 'قیمت کل فروش:' : 'پیش‌پرداخت اولیه:'}
                                                            </span>
                                                            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-lg">
                                                                {(selectedConditionObj?.initial_deposit || 0).toLocaleString('fa-IR')} <span className="text-xs font-sans">تومان</span>
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs text-slate-500">
                                                            <span>شیوه پرداخت:</span>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">{selectedConditionObj?.pay_type}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs text-slate-500">
                                                            <span>موعد تحویل:</span>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">{selectedConditionObj?.delivery_time || 'فوری'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs text-slate-500">
                                                            <span>سال مدل بخشنامه:</span>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">مدل {selectedConditionObj?.model || 'جاری'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Button to sync with condition deposit */}
                                                {selectedConditionObj?.initial_deposit ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({...formData, proposedPrice: selectedConditionObj.initial_deposit})}
                                                        className="w-full text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                                                        <span>استفاده از قیمت بخشنامه برای معامله</span>
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ------------------------------------------------------------- */}
                                    {/* PROPOSED PRICE CREDIBILITY & SOUNDNESS ASSESSMENT BANNER      */}
                                    {/* (مشخص کردن اینکه آیا قیمت پیشنهادی قابل استناد است یا خیر)   */}
                                    {/* ------------------------------------------------------------- */}
                                    <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                                        credibilityVerdict.status === 'VALID'
                                            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                                            : credibilityVerdict.status === 'WARNING'
                                                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                                                : credibilityVerdict.status === 'INVALID'
                                                    ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                                                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                                                credibilityVerdict.status === 'VALID'
                                                    ? 'bg-emerald-500 text-white'
                                                    : credibilityVerdict.status === 'WARNING'
                                                        ? 'bg-amber-500 text-white'
                                                        : credibilityVerdict.status === 'INVALID'
                                                            ? 'bg-rose-500 text-white'
                                                            : 'bg-slate-400 text-white'
                                            }`}>
                                                {credibilityVerdict.icon}
                                            </div>
                                            <div className="space-y-1.5 min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap justify-between">
                                                    <h6 className="font-black text-sm sm:text-base">
                                                        {credibilityVerdict.title}
                                                    </h6>
                                                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-sm ${credibilityVerdict.badgeClass}`}>
                                                        {credibilityVerdict.badgeText}
                                                    </span>
                                                </div>
                                                <p className="text-xs leading-relaxed opacity-90">
                                                    {credibilityVerdict.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Smart Formula Market Analysis for Havaleh and Zero Market if triggered */}
                                    {priceAnalysis?.info && (
                                        <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-xs space-y-2">
                                            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                                <Sparkles className="w-4 h-4 text-amber-500" />
                                                <span>تحلیل تخصصی قیمت‌گذاری و هشدارهای کارشناسی:</span>
                                            </div>

                                            {priceAnalysis.info.type === 'HAVALEH' && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                    <div className={`p-3 rounded-xl border ${
                                                        priceAnalysis.info.warnH1 
                                                            ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800' 
                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                                    }`}>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-bold text-slate-600 dark:text-slate-300">حواله ۱ ماهه (۹۵-۹۷٪ سقف بازار):</span>
                                                            {priceAnalysis.info.warnH1 && (
                                                                <span className="text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded">هشدار زیرفروشی</span>
                                                            )}
                                                        </div>
                                                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                                            {priceAnalysis.info.h1Range} تومان
                                                        </div>
                                                    </div>

                                                    <div className={`p-3 rounded-xl border ${
                                                        priceAnalysis.info.warnH2 
                                                            ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800' 
                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                                    }`}>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-bold text-slate-600 dark:text-slate-300">حواله ۲ ماهه (۹۰-۹۴٪ سقف بازار):</span>
                                                            {priceAnalysis.info.warnH2 && (
                                                                <span className="text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded">هشدار زیرفروشی</span>
                                                            )}
                                                        </div>
                                                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                                            {priceAnalysis.info.h2Range} تومان
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {priceAnalysis.info.type === 'ZERO_MARKET' && priceAnalysis.info.isUnderSelling && (
                                                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 font-bold flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                                                    <span>هشدار زیرفروشی: قیمت معامله پیشنهادی از حداقل مجاز سقف بازار پایین‌تر است.</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ------------------------------------------------------------- */}
                                    {/* STEP 3.1: SELLER & WAREHOUSE SELECTION                        */}
                                    {/* ------------------------------------------------------------- */}
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                                    <Warehouse className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-sm text-slate-800 dark:text-white">
                                                        تامین‌کننده و فروشنده خودرو
                                                    </h4>
                                                    <span className="text-[11px] text-slate-400">
                                                        مشخص فرمایید خودرو از انبار شرکت تامین شده یا توسط شخص/نمایشگاه همکار
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                                                {formData.sellerType === 'COMPANY_WAREHOUSE' ? '🏢 فروشنده: خود شرکت' : '👤 فروشنده: همکار / شخص'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => updateFinancials({ 
                                                    sellerType: 'COMPANY_WAREHOUSE', 
                                                    sellerName: 'انبار مرکزی شرکت (حسینی خودرو)' 
                                                })}
                                                className={`p-3.5 rounded-xl border text-right transition-all flex items-start gap-3 ${
                                                    formData.sellerType === 'COMPANY_WAREHOUSE'
                                                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-sm'
                                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                <div className={`p-2 rounded-lg ${
                                                    formData.sellerType === 'COMPANY_WAREHOUSE' 
                                                        ? 'bg-indigo-600 text-white' 
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                                }`}>
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-black text-xs">انبار خود شرکت (فروشنده خود شرکت می‌باشد)</span>
                                                        {formData.sellerType === 'COMPANY_WAREHOUSE' && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                                        موجودی از انبار رسمی حسینی خودرو تامین و پس از تایید از انبار کسر می‌گردد.
                                                    </p>
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => updateFinancials({ 
                                                    sellerType: 'OTHER', 
                                                    sellerName: formData.sellerName === 'انبار مرکزی شرکت (حسینی خودرو)' ? '' : formData.sellerName 
                                                })}
                                                className={`p-3.5 rounded-xl border text-right transition-all flex items-start gap-3 ${
                                                    formData.sellerType === 'OTHER'
                                                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-sm'
                                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                <div className={`p-2 rounded-lg ${
                                                    formData.sellerType === 'OTHER' 
                                                        ? 'bg-indigo-600 text-white' 
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                                }`}>
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-black text-xs">سایر / شخص حقیقی یا نمایشگاه همکار</span>
                                                        {formData.sellerType === 'OTHER' && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                                        خودرو از نمایشگاه‌های همکار یا اشخاص خریداری شده و واسطه‌گری صورت می‌گیرد.
                                                    </p>
                                                </div>
                                            </button>
                                        </div>

                                        {formData.sellerType === 'OTHER' && (
                                            <div className="pt-2 animate-fade-in">
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                                    نام فروشنده، مالک خودرو یا نمایشگاه همکار:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.sellerName || ''}
                                                    onChange={e => updateFinancials({ sellerName: e.target.value })}
                                                    placeholder="مثلاً: نمایشگاه الماس، آقای رضایی، نمایشگاه همکار..."
                                                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* ------------------------------------------------------------- */}
                                    {/* STEP 3.2: PURCHASE PRICE, SELLING PRICE & SHIPPING COST INPUTS */}
                                    {/* ------------------------------------------------------------- */}
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-sky-500/30 shadow-md space-y-5">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black">
                                                    <Coins className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                                                        ورود ارقام مالی معامله (قیمت خرید، فروش و هزینه حمل)
                                                    </h4>
                                                    <span className="text-[11px] text-slate-400">
                                                        اختلاف خرید و فروش پس از کسر حمل، مبنای محاسبه کمیسیون و پورسانت ۱۰٪ خواهد بود
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-lg font-bold">
                                                فرمول سود معامله
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {/* SELLING / PROPOSED PRICE */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                        قیمت فروش خودرو (قیمت معامله پیشنهادی)
                                                    </label>
                                                    <span className="text-[10px] text-emerald-600 font-bold">تومان</span>
                                                </div>

                                                <div className="relative">
                                                    <input 
                                                        required 
                                                        type="number" 
                                                        className={`w-full px-4 py-3 border-2 rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-4 font-mono text-xl font-black transition-all ${
                                                            credibilityVerdict.status === 'INVALID'
                                                                ? 'border-rose-500 text-rose-600 focus:ring-rose-500/20' 
                                                                : credibilityVerdict.status === 'VALID'
                                                                    ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-500/20'
                                                                    : 'border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-sky-500/20 text-slate-900'
                                                        }`} 
                                                        value={formData.proposedPrice || ''} 
                                                        onChange={e => updateFinancials({ sellingPrice: Number(e.target.value), proposedPrice: Number(e.target.value) })} 
                                                        placeholder="مثلاً ۲,۱۰۰,۰۰۰,۰۰۰"
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                                        تومان
                                                    </span>
                                                </div>

                                                {formData.proposedPrice > 0 && (
                                                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg">
                                                        به حروف: {numberToPersianWords(formData.proposedPrice)} تومان
                                                    </div>
                                                )}

                                                {/* Pricing Freshness & Rule Explanatory Banner */}
                                                <div className="bg-amber-50/80 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/60 text-xs flex items-start gap-2">
                                                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                                    <div className="space-y-0.5">
                                                        <span className="font-bold text-amber-900 dark:text-amber-200 block">
                                                            قانون استناد به نرخ مصوب و میانگین دیوار:
                                                        </span>
                                                        <span className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed block">
                                                            نرخ مصوب تنها در صورتی معتبر و قابل استناد است که آخرین بروزرسانی آن حداکثر طی ۲۴ ساعت گذشته ثبت شده باشد؛ در غیر این صورت به صورت خودکار میانگین قیمت آگهی‌های دیوار ملاک قرار می‌گیرد.
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Fast Fill Buttons for Selling Price */}
                                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                                    {activePriceVariant?.manualPrice && activePriceVariant.manualPrice.price_rial > 0 && activePriceVariant.isApprovedFresh && (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateFinancials({ sellingPrice: activePriceVariant.manualPrice!.price_rial, proposedPrice: activePriceVariant.manualPrice!.price_rial })}
                                                            className="text-[10px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-bold transition-colors border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                            <span>نرخ مصوب معتبر ({activePriceVariant.manualPrice.price_rial.toLocaleString('fa-IR')} ت)</span>
                                                        </button>
                                                    )}

                                                    {activePriceVariant?.manualPrice && activePriceVariant.manualPrice.price_rial > 0 && !activePriceVariant.isApprovedFresh && (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateFinancials({ sellingPrice: activePriceVariant.manualPrice!.price_rial, proposedPrice: activePriceVariant.manualPrice!.price_rial })}
                                                            className="text-[10px] bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg font-bold transition-colors border border-amber-300 dark:border-amber-800 flex items-center gap-1 cursor-pointer"
                                                            title="آخرین بروزرسانی بیش از ۲۴ ساعت قبل بوده و منقضی است"
                                                        >
                                                            <span>نرخ مصوب قدیمی (منقضی &gt;۲۴h)</span>
                                                        </button>
                                                    )}

                                                    {activePriceVariant?.divarAveragePrice && activePriceVariant.divarAveragePrice > 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateFinancials({ sellingPrice: activePriceVariant.divarAveragePrice, proposedPrice: activePriceVariant.divarAveragePrice })}
                                                            className={`text-[10px] px-2.5 py-1 rounded-lg font-black transition-all flex items-center gap-1 cursor-pointer ${
                                                                !activePriceVariant.isApprovedFresh
                                                                    ? 'bg-sky-600 text-white shadow-xs hover:bg-sky-700'
                                                                    : 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                                                            }`}
                                                        >
                                                            <span>📱 میانگین قیمت دیوار: {activePriceVariant.divarAveragePrice.toLocaleString('fa-IR')} ت {!activePriceVariant.isApprovedFresh ? '(مبنای خودکار)' : ''}</span>
                                                        </button>
                                                    ) : null}

                                                    {selectedConditionObj?.initial_deposit ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateFinancials({ sellingPrice: selectedConditionObj.initial_deposit, proposedPrice: selectedConditionObj.initial_deposit })}
                                                            className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                                                        >
                                                            قیمت بخشنامه: {selectedConditionObj.initial_deposit.toLocaleString('fa-IR')} ت
                                                        </button>
                                                    ) : null}

                                                    {activePriceVariant?.averageMarketPrice ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateFinancials({ sellingPrice: activePriceVariant.averageMarketPrice, proposedPrice: activePriceVariant.averageMarketPrice })}
                                                            className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                                                        >
                                                            میانگین بازار: {activePriceVariant.averageMarketPrice.toLocaleString('fa-IR')} ت
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* PURCHASE PRICE */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                        قیمت خرید خودرو (تومان)
                                                    </label>
                                                    <span className="text-[10px] text-blue-600 font-bold">بهای تمام‌شده خرید</span>
                                                </div>

                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-white outline-none font-mono text-xl font-black transition-all" 
                                                        value={formData.purchasePrice || ''} 
                                                        onChange={e => updateFinancials({ purchasePrice: Number(e.target.value) })} 
                                                        placeholder="مثلاً ۲,۰۰۰,۰۰۰,۰۰۰"
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                                        تومان
                                                    </span>
                                                </div>

                                                {formData.purchasePrice > 0 && (
                                                    <div className="text-[11px] text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg">
                                                        به حروف: {numberToPersianWords(formData.purchasePrice)} تومان
                                                    </div>
                                                )}
                                                <span className="text-[10px] text-slate-400 block">
                                                    مبلغ پرداخت شده بابت خرید خودرو از تامین‌کننده، شرکت یا مالک قبلی
                                                </span>
                                            </div>
                                        </div>

                                        {/* SHIPPING COST */}
                                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                                    <Truck className="w-3.5 h-3.5 text-amber-500" />
                                                    هزینه حمل و باربری خودرو (تومان)
                                                </label>
                                                <span className="text-[10px] text-amber-600 font-bold">کسر از سود معامله</span>
                                            </div>

                                            <div className="relative max-w-md">
                                                <input 
                                                    type="number" 
                                                    className="w-full px-4 py-2.5 border-2 border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 rounded-xl bg-slate-50 dark:bg-slate-900 dark:text-white outline-none font-mono text-base font-black transition-all" 
                                                    value={formData.shippingCost || ''} 
                                                    onChange={e => updateFinancials({ shippingCost: Number(e.target.value) })} 
                                                    placeholder="مثلاً ۲۰,۰۰۰,۰۰۰"
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                                    تومان
                                                </span>
                                            </div>

                                            {formData.shippingCost > 0 && (
                                                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg max-w-md">
                                                    به حروف: {numberToPersianWords(formData.shippingCost)} تومان
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ------------------------------------------------------------- */}
                                    {/* STEP 3.3: LIVE COMMISSION & EDITABLE BONUS CALCULATION CARD   */}
                                    {/* ------------------------------------------------------------- */}
                                    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-800 shadow-xl space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/60 pb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                                                    <Calculator className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-sm text-white flex items-center gap-2">
                                                        محاسبه کمیسیون خالص و پورسانت معامله
                                                    </h4>
                                                    <span className="text-[10px] text-indigo-300">
                                                        فرمول: (قیمت فروش) - (قیمت خرید) - (هزینه حمل) = کمیسیون خالص
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-xl text-xs font-bold">
                                                <Percent className="w-3.5 h-3.5" />
                                                <span>درصد پورسانت معامله: {formData.commissionRatePercent || 10}٪</span>
                                            </div>
                                        </div>

                                        {/* Step-by-Step Financial Equation Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                            {/* Selling Price */}
                                            <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                                <span className="text-slate-400 block text-[11px] mb-1">قیمت فروش:</span>
                                                <span className="font-mono font-bold text-base text-emerald-400">
                                                    {(formData.proposedPrice || 0).toLocaleString('fa-IR')}
                                                </span>
                                                <span className="text-[10px] text-slate-400 mr-1">تومان</span>
                                            </div>

                                            {/* Purchase Price */}
                                            <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                                <span className="text-slate-400 block text-[11px] mb-1">قیمت خرید:</span>
                                                <span className="font-mono font-bold text-base text-blue-400">
                                                    - {(formData.purchasePrice || 0).toLocaleString('fa-IR')}
                                                </span>
                                                <span className="text-[10px] text-slate-400 mr-1">تومان</span>
                                            </div>

                                            {/* Shipping Cost */}
                                            <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                                <span className="text-slate-400 block text-[11px] mb-1">هزینه حمل:</span>
                                                <span className="font-mono font-bold text-base text-amber-400">
                                                    - {(formData.shippingCost || 0).toLocaleString('fa-IR')}
                                                </span>
                                                <span className="text-[10px] text-slate-400 mr-1">تومان</span>
                                            </div>

                                            {/* Net Commission */}
                                            <div className={`p-3 rounded-xl border ${
                                                (formData.netCommission || 0) > 0 
                                                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                                                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                                            }`}>
                                                <span className="block text-[11px] mb-1 font-bold">کمیسیون خالص معامله:</span>
                                                <span className="font-mono font-black text-lg">
                                                    {(formData.netCommission || 0).toLocaleString('fa-IR')}
                                                </span>
                                                <span className="text-[10px] mr-1 font-bold">تومان</span>
                                            </div>
                                        </div>

                                        {/* Commission Rate (%) Input & Live Total Bonus */}
                                        <div className="bg-indigo-900/40 border border-indigo-700/60 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                                            {/* Commission Rate (%) Setting */}
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                                                        <Percent className="w-3.5 h-3.5 text-yellow-400" />
                                                        <span>درصد پورسانت معامله (پیش‌فرض ۱۰٪ و قابل ویرایش):</span>
                                                    </label>
                                                    <span className="text-[10px] text-indigo-300 font-bold">
                                                        قابل تغییر
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="relative w-32">
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            max="100"
                                                            step="0.5"
                                                            value={formData.commissionRatePercent !== undefined ? formData.commissionRatePercent : 10}
                                                            onChange={e => updateFinancials({ commissionRatePercent: Number(e.target.value) })}
                                                            className="w-full px-3 py-2 bg-slate-900 border border-indigo-500 rounded-xl text-yellow-300 font-mono text-center text-lg font-black outline-none focus:ring-2 focus:ring-yellow-400"
                                                        />
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-300 font-bold text-xs">
                                                            ٪
                                                        </span>
                                                    </div>

                                                    {/* Quick Percentage Presets */}
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        {[5, 10, 15, 20, 25].map(pct => {
                                                            const isSelected = (formData.commissionRatePercent || 10) === pct;
                                                            return (
                                                                <button
                                                                    key={pct}
                                                                    type="button"
                                                                    onClick={() => updateFinancials({ commissionRatePercent: pct })}
                                                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                        isSelected
                                                                            ? 'bg-yellow-400 text-slate-950 font-black shadow-sm'
                                                                            : 'bg-white/10 hover:bg-white/20 text-indigo-200'
                                                                    }`}
                                                                >
                                                                    {pct}٪ {pct === 10 ? '(پیش‌فرض)' : ''}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Calculated Total Bonus */}
                                            <div className="bg-slate-950/70 border border-indigo-500/50 p-3.5 rounded-xl text-right min-w-[240px] space-y-1">
                                                <span className="text-[11px] text-slate-400 block">
                                                    مبلغ پورسانت کل ({formData.commissionRatePercent || 10}٪ از کمیسیون خالص):
                                                </span>
                                                <div className="font-mono font-black text-xl text-yellow-300">
                                                    {(formData.totalCommissionBonus || 0).toLocaleString('fa-IR')} <span className="text-xs font-sans text-yellow-400">تومان</span>
                                                </div>
                                                {formData.totalCommissionBonus > 0 && (
                                                    <span className="text-[10px] text-slate-300 block">
                                                        به حروف: {numberToPersianWords(formData.totalCommissionBonus)} تومان
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ------------------------------------------------------------- */}
                            {/* STEP 4: COLLABORATING PARTNERS (همکاران مشارکت‌کننده در معامله) */}
                            {/* ------------------------------------------------------------- */}
                            {step === 4 && (
                                <div className="space-y-6 animate-fade-in">
                                    {/* Step 4 Top Banner & Financials from Step 3 */}
                                    <div className="bg-gradient-to-r from-violet-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-violet-800 shadow-md flex flex-wrap justify-between items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-black shadow-md shadow-violet-500/30">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-base text-white flex items-center gap-2">
                                                    همکاران مشارکت‌کننده در معامله
                                                    <span className="text-[10px] bg-violet-500/30 text-violet-200 border border-violet-400/30 px-2.5 py-0.5 rounded-full font-bold">
                                                        گام ۴
                                                    </span>
                                                </h4>
                                                <span className="text-xs text-violet-200">
                                                    تعیین پرسنل و کارشناسان همکار در سمت فروش یا خرید خودرو (حداکثر ۴ همکار)
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/15">
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-300 block">پورسانت کل معامله ({formData.commissionRatePercent || 10}٪):</span>
                                                <span className="font-mono font-black text-yellow-300 text-base">
                                                    {(formData.totalCommissionBonus || 0).toLocaleString('fa-IR')} تومان
                                                </span>
                                            </div>
                                            <div className="h-8 w-px bg-white/20"></div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-300 block">سهم هر همکار (تقسیم بر {(formData.partners || []).length || 1}):</span>
                                                <span className="font-mono font-black text-emerald-300 text-base">
                                                    {(formData.partnerCommissionShare || 0).toLocaleString('fa-IR')} تومان
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rule & Guidelines Banner */}
                                    <div className="bg-violet-50/80 dark:bg-violet-950/30 p-4 rounded-2xl border border-violet-200 dark:border-violet-900/40 text-xs text-violet-950 dark:text-violet-200 flex items-start gap-3">
                                        <Info className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                                        <div className="space-y-1 leading-relaxed">
                                            <p className="font-bold">قوانین و تسهیم پورسانت همکاران معامله:</p>
                                            <p className="text-slate-600 dark:text-slate-300">
                                                در هر معامله حداکثر ۴ همکار می‌توانند ثبت شوند (سمت فروش و سمت خرید). کل مبلغ پورسانت معامله ({formData.totalCommissionBonus?.toLocaleString('fa-IR') || 0} تومان) به نسبت مساوی بین همکاران منتخب تقسیم می‌گردد.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Current Selected Partners List */}
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-sm text-slate-900 dark:text-white">
                                                    لیست همکاران اختصاص‌یافته به معامله
                                                </span>
                                                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg font-mono font-bold">
                                                    {(formData.partners || []).length} / ۴
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                برای تغییر سمت همکاری، روی دکمه سمت هر همکار کلیک نمایید
                                            </span>
                                        </div>

                                        {(formData.partners || []).length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {(formData.partners || []).map((partner, idx) => {
                                                    const isSaleSide = partner.side === 'فروش';
                                                    return (
                                                        <div 
                                                            key={partner.name}
                                                            className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                                                                isSaleSide
                                                                    ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800'
                                                                    : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                                                                    isSaleSide 
                                                                        ? 'bg-sky-600 text-white' 
                                                                        : 'bg-emerald-600 text-white'
                                                                }`}>
                                                                    {idx + 1}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-black text-sm text-slate-800 dark:text-white truncate">
                                                                            {partner.name}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleTogglePartnerSide(partner.name)}
                                                                            className={`text-[10px] px-2.5 py-1 rounded-lg font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                                                                                isSaleSide
                                                                                    ? 'bg-sky-600 text-white hover:bg-sky-700'
                                                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                                            }`}
                                                                            title="کلیک برای تغییر سمت همکاری بین خرید و فروش"
                                                                        >
                                                                            <ArrowRightLeft className="w-2.5 h-2.5" />
                                                                            <span>سمت {partner.side}</span>
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                            سهم پورسانت: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{(formData.partnerCommissionShare || 0).toLocaleString('fa-IR')}</strong> تومان
                                                                        </span>
                                                                        {partner.role && (
                                                                            <span className="text-[10px] text-slate-400 font-normal">({partner.role})</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemovePartner(partner.name)}
                                                                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                                                    title="حذف همکار از معامله"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-8 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                                                <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    هنوز همکار مشارکت‌کننده‌ای به این سفارش اختصاص نیافته است.
                                                </p>
                                                <p className="text-[11px] text-slate-400">
                                                    می‌توانید از فرم زیر همکاران سمت فروش یا سمت خرید را به سادگی اضافه کنید. در صورت عدم وجود همکار، کل پورسانت برای ثبت‌کننده لحاظ می‌شود.
                                                </p>
                                            </div>
                                        )}

                                        {/* Add Partner Form */}
                                        {(formData.partners || []).length < 4 ? (
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                                    <span>افزودن همکار جدید به معامله (انتخاب از لیست پرسنل و کاربران دارای دسترسی):</span>
                                                    <span className="text-[11px] text-violet-600 dark:text-violet-400 font-bold">
                                                        {4 - (formData.partners || []).length} جایگاه خالی
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                                                    {/* Select Staff User */}
                                                    <div className="sm:col-span-6">
                                                        <select
                                                            value={newPartnerStaffName}
                                                            onChange={e => setNewPartnerStaffName(e.target.value)}
                                                            className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-violet-500"
                                                        >
                                                            <option value="">-- انتخاب نام همکار از لیست کاربران --</option>
                                                            {filteredStaffUsers
                                                                .filter(u => !(formData.partners || []).some(p => p.name === (u.fullName || u.username)))
                                                                .map(u => (
                                                                    <option key={u.id} value={u.fullName || u.username}>
                                                                        {u.fullName || u.username} {u.role ? `(${u.role})` : ''}
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                    </div>

                                                    {/* Side Selector (فروش / خرید) */}
                                                    <div className="sm:col-span-3 flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewPartnerSide('فروش')}
                                                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                                                newPartnerSide === 'فروش'
                                                                    ? 'bg-sky-600 text-white shadow-sm'
                                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                            }`}
                                                        >
                                                            سمت فروش
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewPartnerSide('خرید')}
                                                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                                                                newPartnerSide === 'خرید'
                                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                            }`}
                                                        >
                                                            سمت خرید
                                                        </button>
                                                    </div>

                                                    {/* Add Button */}
                                                    <div className="sm:col-span-3">
                                                        <button
                                                            type="button"
                                                            disabled={!newPartnerStaffName}
                                                            onClick={() => {
                                                                if (newPartnerStaffName) {
                                                                    handleAddPartner(newPartnerStaffName, newPartnerSide);
                                                                    setNewPartnerStaffName('');
                                                                }
                                                            }}
                                                            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            <span>افزودن همکار</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Fast Staff Chips */}
                                                <div className="pt-1">
                                                    <span className="text-[10px] text-slate-400 block mb-1.5">انتخاب سریع با یک کلیک:</span>
                                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                                                        {filteredStaffUsers
                                                            .filter(u => !(formData.partners || []).some(p => p.name === (u.fullName || u.username)))
                                                            .slice(0, 12)
                                                            .map(u => {
                                                                const name = u.fullName || u.username;
                                                                return (
                                                                    <div key={u.id} className="inline-flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 text-[10px]">
                                                                        <span className="px-2 font-bold text-slate-700 dark:text-slate-300">{name}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleAddPartner(name, 'فروش')}
                                                                            className="px-1.5 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200 rounded font-bold transition-colors ml-0.5 cursor-pointer"
                                                                            title="افزودن در سمت فروش"
                                                                        >
                                                                            + فروش
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleAddPartner(name, 'خرید')}
                                                                            className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 rounded font-bold transition-colors cursor-pointer"
                                                                            title="افزودن در سمت خرید"
                                                                        >
                                                                            + خرید
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                                                <span>حداکثر سقف مجاز (۴ همکار مشارکت‌کننده) برای این معامله تکمیل شده است.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ------------------------------------------------------------- */}
                            {/* STEP 5: SELLER & BUYER INFORMATION AND FINAL SUBMISSION       */}
                            {/* ------------------------------------------------------------- */}
                            {step === 5 && (
                                <div className="space-y-6 animate-fade-in">
                                    
                                    {/* Order & Financial Summary Snapshot */}
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4 text-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black shadow-sm">
                                                <CarIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="font-black text-sm text-slate-800 dark:text-white block">
                                                    {formData.carName}
                                                </span>
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    {selectedConditionObj?.sale_type} - {selectedConditionObj?.pay_type}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 flex-wrap">
                                            <div className="text-right">
                                                <span className="text-slate-400 block text-[10px]">قیمت فروش:</span>
                                                <span className="font-mono font-black text-slate-800 dark:text-white text-sm">
                                                    {(formData.proposedPrice || 0).toLocaleString('fa-IR')} ت
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-slate-400 block text-[10px]">کمیسیون خالص:</span>
                                                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                                    {(formData.netCommission || 0).toLocaleString('fa-IR')} ت
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-slate-400 block text-[10px]">پورسانت ({formData.commissionRatePercent || 10}٪):</span>
                                                <span className="font-mono font-black text-yellow-600 dark:text-yellow-400 text-sm">
                                                    {(formData.totalCommissionBonus || 0).toLocaleString('fa-IR')} ت
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-slate-400 block text-[10px]">تعداد همکاران:</span>
                                                <span className="font-bold text-violet-600 dark:text-violet-400 text-xs">
                                                    {(formData.partners || []).length} نفر
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vehicle Configuration Section */}
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                                        <h4 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                            <Palette className="w-4 h-4 text-sky-600" />
                                            پیکربندی رنگ و شرایط اختصاصی
                                        </h4>

                                        {/* Color Selection */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                                                انتخاب رنگ خودرو
                                            </label>
                                            <div className="flex flex-wrap gap-2.5">
                                                {selectedConditionObj?.colors && selectedConditionObj.colors.length > 0 ? (
                                                    selectedConditionObj.colors.map(col => {
                                                        const isSelected = formData.selectedColor === col;
                                                        const colorHex = COLOR_MAP[col] || '#94A3B8';
                                                        return (
                                                            <button
                                                                key={col}
                                                                type="button"
                                                                onClick={() => setFormData({...formData, selectedColor: col})}
                                                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                                    isSelected
                                                                        ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20 shadow-sm'
                                                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                                }`}
                                                            >
                                                                <span 
                                                                    className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" 
                                                                    style={{ backgroundColor: colorHex }}
                                                                />
                                                                <span>{col}</span>
                                                                {isSelected && <Check className="w-3 h-3 text-sky-600" />}
                                                            </button>
                                                        );
                                                    })
                                                ) : (
                                                    <input 
                                                        type="text" 
                                                        placeholder="نام رنگ (مثلاً سفید)"
                                                        className="px-4 py-2 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white text-xs font-bold"
                                                        value={formData.selectedColor}
                                                        onChange={e => setFormData({...formData, selectedColor: e.target.value})}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* User Notes */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                                توضیحات و شرایط اختصاصی سفارش
                                            </label>
                                            <textarea 
                                                rows={2} 
                                                className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 text-xs transition-all" 
                                                value={formData.userNotes} 
                                                onChange={e => setFormData({...formData, userNotes: e.target.value})} 
                                                placeholder="مثلاً: هدیه روی ماشین، شرایط چک، تحویل شهرستان..."
                                            />
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {PREDEFINED_USER_NOTES.map(note => (
                                                    <button
                                                        key={note}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({
                                                            ...prev, 
                                                            userNotes: prev.userNotes ? prev.userNotes + '\n' + note : note
                                                        }))}
                                                        className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600 font-medium"
                                                    >
                                                        + {note}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buyer Details Form & CRM Auto-fill */}
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                                        <h4 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                            <UserIcon className="w-4 h-4 text-sky-600" />
                                            مشخصات و نشانی خریدار
                                        </h4>

                                        {/* CRM Quick Search */}
                                        <div className="bg-sky-50/70 dark:bg-sky-950/30 p-3.5 rounded-2xl border border-sky-100 dark:border-sky-900/40 relative space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-black text-sky-900 dark:text-sky-200">
                                                <Sparkles className="w-4 h-4 text-sky-600" />
                                                <span>جستجو و تکمیل هوشمند از لیست مخاطبان CRM:</span>
                                            </div>
                                            <div className="relative">
                                                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="جستجوی نام یا شماره تلفن مشتری در CRM..."
                                                    className="w-full pr-10 pl-4 py-2 text-xs bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                                                    value={crmSearchQuery}
                                                    onChange={e => handleCrmSearch(e.target.value)}
                                                />
                                                {crmResults.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl max-h-48 overflow-y-auto z-50 text-xs font-bold divide-y divide-slate-100 dark:divide-slate-700">
                                                        {crmResults.map(u => (
                                                            <button 
                                                                key={u.id}
                                                                type="button" 
                                                                onClick={() => handleSelectCrmUser(u)}
                                                                className="w-full text-right px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/30 flex justify-between items-center transition-colors text-slate-700 dark:text-slate-300"
                                                            >
                                                                <span>{u.FullName}</span>
                                                                <span className="font-mono text-slate-400 font-normal">{u.Number}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Smart Suggestion banner if matching CRM contact has been found */}
                                        {autoMatchCrmUser && (
                                            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 text-xs flex justify-between items-center text-slate-700 dark:text-slate-300">
                                                <div className="flex items-center gap-2 font-bold">
                                                    <span className="text-amber-500">💡</span>
                                                    <span>مشتری منطبق در CRM یافت شد: <span className="text-sky-600 dark:text-sky-400">{autoMatchCrmUser.FullName} ({autoMatchCrmUser.Number})</span></span>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleSelectCrmUser(autoMatchCrmUser)}
                                                    className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded-lg font-black transition-colors"
                                                >
                                                    تکمیل خودکار
                                                </button>
                                            </div>
                                        )}

                                        {/* Live CRM Status Badge for the Customer */}
                                        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                            matchingCrmContact
                                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                                                : formData.buyerPhone && formData.buyerPhone.length >= 7
                                                    ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300'
                                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                        }`}>
                                            <div className="flex items-center gap-2 font-bold">
                                                {matchingCrmContact ? (
                                                    <>
                                                        <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                        <span>مشتری موجود در CRM ({matchingCrmContact.FullName}): <span className="font-normal text-emerald-700 dark:text-emerald-300">گزارش فعالیت / لاگ تماس جدید برای ثبت سفارش ثبت خواهد شد.</span></span>
                                                    </>
                                                ) : formData.buyerPhone && formData.buyerPhone.length >= 7 ? (
                                                    <>
                                                        <UserPlus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                                        <span>مشتری جدید: <span className="font-normal text-sky-700 dark:text-sky-300">مشتری به همراه توضیحات کامل سفارش به صورت خودکار در CRM ذخیره خواهد شد.</span></span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Info className="w-4 h-4 text-slate-400" />
                                                        <span>با تکمیل نام و شماره تماس، وضعیت CRM مشتری بررسی و همگام‌سازی می‌شود.</span>
                                                    </>
                                                )}
                                            </div>
                                            {matchingCrmContact && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 font-black">
                                                    ثبت لاگ CRM
                                                </span>
                                            )}
                                            {!matchingCrmContact && formData.buyerPhone && formData.buyerPhone.length >= 7 && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 font-black">
                                                    عضو جدید CRM
                                                </span>
                                            )}
                                        </div>

                                        {/* Input Fields */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                                    نام و نام خانوادگی خریدار *
                                                </label>
                                                <input 
                                                    required 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 text-xs font-bold" 
                                                    value={formData.buyerName} 
                                                    onChange={e => setFormData({...formData, buyerName: e.target.value})} 
                                                    placeholder="مطابق کارت ملی"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                                    کد ملی خریدار
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-mono text-xs" 
                                                    value={formData.buyerNationalId} 
                                                    onChange={e => setFormData({...formData, buyerNationalId: e.target.value})} 
                                                    dir="ltr" 
                                                    placeholder="10 رقمی"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                                    شماره تلفن همراه *
                                                </label>
                                                <input 
                                                    required 
                                                    type="tel" 
                                                    className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-mono text-xs font-bold" 
                                                    value={formData.buyerPhone} 
                                                    onChange={e => setFormData({...formData, buyerPhone: e.target.value})} 
                                                    dir="ltr" 
                                                    placeholder="09120000000"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                                    شهر محل سکونت
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 text-xs" 
                                                    value={formData.buyerCity} 
                                                    onChange={e => setFormData({...formData, buyerCity: e.target.value})} 
                                                    placeholder="مثلاً: شیراز"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                                    کد پستی
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-mono text-xs" 
                                                    value={formData.buyerPostalCode} 
                                                    onChange={e => setFormData({...formData, buyerPostalCode: e.target.value})} 
                                                    dir="ltr" 
                                                    placeholder="10 رقمی"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                                    آدرس کامل پستی خریدار
                                                </label>
                                                <textarea 
                                                    rows={2} 
                                                    className="w-full px-4 py-2 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 text-xs" 
                                                    value={formData.buyerAddress} 
                                                    onChange={e => setFormData({...formData, buyerAddress: e.target.value})} 
                                                    placeholder="استان، شهر، خیابان، پلاک، واحد..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Seller Details Form (فقط در صورتی که مالک خودرو فردی به غیر از انبار باشد) */}
                                    {formData.sellerType !== 'COMPANY_WAREHOUSE' && (
                                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 shadow-xs space-y-4 animate-fade-in">
                                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
                                                <h4 className="font-black text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                    <span>مشخصات و اطلاعات فروشنده / مالک خودرو (به غیر از انبار شرکت)</span>
                                                </h4>
                                                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                                    مالک غیر انبار
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                                                <div>
                                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                        نام و نام خانوادگی فروشنده / نام نمایشگاه مالک *
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        required={formData.sellerType !== 'COMPANY_WAREHOUSE'}
                                                        className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                                                        value={formData.sellerName} 
                                                        onChange={e => setFormData({...formData, sellerName: e.target.value})} 
                                                        placeholder="مثلاً: آقای بهرامی، نمایشگاه الماس..."
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                        شماره تلفن همراه فروشنده
                                                    </label>
                                                    <input 
                                                        type="tel" 
                                                        dir="ltr"
                                                        className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono" 
                                                        value={formData.sellerPhone || ''} 
                                                        onChange={e => setFormData({...formData, sellerPhone: e.target.value})} 
                                                        placeholder="09170000000"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                        کد ملی / شناسه ملی فروشنده
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        dir="ltr"
                                                        className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono" 
                                                        value={formData.sellerNationalId || ''} 
                                                        onChange={e => setFormData({...formData, sellerNationalId: e.target.value})} 
                                                        placeholder="10 رقمی"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                        شماره شبا / کارت بانکی جهت تسویه
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        dir="ltr"
                                                        className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono" 
                                                        value={formData.sellerSheba || ''} 
                                                        onChange={e => setFormData({...formData, sellerSheba: e.target.value})} 
                                                        placeholder="IR000000000000000000000000"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                        شهر فروشنده
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                                                        value={formData.sellerCity || ''} 
                                                        onChange={e => setFormData({...formData, sellerCity: e.target.value})} 
                                                        placeholder="مثلاً: شیراز، تهران..."
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                        توضیحات و توافقات اختصاصی فروشنده
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                                                        value={formData.sellerNotes || ''} 
                                                        onChange={e => setFormData({...formData, sellerNotes: e.target.value})} 
                                                        placeholder="مثلاً: سند امانی، تسویه نقدی پس از تعویض پلاک..."
                                                    />
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                        آدرس کامل پستی فروشنده
                                                    </label>
                                                    <textarea 
                                                        rows={2} 
                                                        className="w-full px-4 py-2 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-xs" 
                                                        value={formData.sellerAddress || ''} 
                                                        onChange={e => setFormData({...formData, sellerAddress: e.target.value})} 
                                                        placeholder="استان، شهر، خیابان، پلاک..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-wrap justify-between items-center gap-3">
                    <button 
                        type="button"
                        onClick={step === 1 ? onClose : handleBack} 
                        className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-xs transition-colors"
                    >
                        {step === 1 ? 'انصراف' : 'مرحله قبل'}
                    </button>

                    <div className="flex items-center gap-2.5">
                        {step < 5 ? (
                            <button 
                                type="button"
                                disabled={
                                    loading || 
                                    (step === 1 && !formData.carName) || 
                                    (step === 2 && !formData.conditionId) || 
                                    (step === 3 && (!formData.proposedPrice || formData.proposedPrice <= 0))
                                } 
                                onClick={handleNext} 
                                className="px-7 py-2.5 bg-sky-600 text-white text-xs font-black rounded-xl hover:bg-sky-700 disabled:opacity-40 shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>مرحله بعد</span>
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        ) : (
                            <>
                                <button 
                                    type="button"
                                    onClick={handleSaveAsDraft}
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? 'در حال ثبت...' : 'ذخیره در پیش‌نویس'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleFinalSubmit} 
                                    disabled={!formData.buyerName || !formData.buyerPhone || (formData.sellerType !== 'COMPANY_WAREHOUSE' && !formData.sellerName) || isSubmitting}
                                    className="px-7 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Spinner size="sm" />
                                            <span>در حال ثبت و ذخیره CRM...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>{editOrder && editOrder.status === OrderStatus.DRAFT ? 'ارسال نهایی برای مدیریت' : 'ثبت و ارسال به مدیریت'}</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Condition Modal for Adding New Conditions */}
            {isConditionModalOpen && (
                <ConditionModal
                    isOpen={isConditionModalOpen}
                    onClose={() => setIsConditionModalOpen(false)}
                    onSave={handleSaveNewCondition}
                    condition={null}
                    cars={cars}
                />
            )}
        </div>
    );
};

export default CarOrderModal;
