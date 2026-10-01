import React, { useState, useEffect } from 'react';
import type { StorageItem } from '../types';
import { getStorageItems, createStorageItem } from '../services/api';
import Spinner from '../components/Spinner';
import { Boxes, Plus, Search, AlertTriangle, ArrowUpRight, ArrowDownLeft, Package, CheckCircle2, RefreshCw, Layers, BookOpen } from 'lucide-react';

const CATEGORIES = [
    'همه دسته‌ها',
    'لوازم تحریر و اداری',
    'شوینده و سلولوزی',
    'ظروف یکبار مصرف',
    'چای، قهوه و آبدارخانه',
    'مواد غذایی و نوشیدنی',
    'سایر اقلام مصرفی'
];

const LOCATIONS = [
    'انبار مرکزی',
    'اتاق سرور',
    'بالای آشپزخانه',
    'طبقه بالا'
];

// Preset options for IN (ورود به انبار)
const IN_REASONS = [
    'خرید جدید از تامین‌کننده / بازار',
    'شارژ دوره‌ای انبار',
    'مرجوعی از بخش‌ها',
    'هدیه / اهدایی',
    'انتقال از انبار دیگر'
];

const IN_SOURCES = [
    'واحد خرید و تدارکات',
    'فروشگاه مرکزی بازار',
    'تامین‌کننده آزاد',
    'انبار مرکزی شرکت'
];

// Preset options for OUT (خروج از انبار)
const OUT_REASONS = [
    'مصرف جاری و روزمره اداری',
    'تحویل به آبدارخانه برای پذیرایی',
    'جلسه رسمی مدیریت / مهمان‌داری',
    'خرابی / ضایعات / انقضا',
    'انتقال به شعبه یا بخش دیگر'
];

const OUT_RECEIVERS = [
    'آبدارخانه طبقه همکف',
    'آبدارخانه طبقه بالا',
    'واحد فروش و بازاریابی',
    'واحد مالی و اداری',
    'اتاق مدیریت',
    'پشتیبانی و IT',
    'عمومی پرسنل'
];

interface StockTransaction {
    id: string;
    itemId: string | number;
    itemName: string;
    type: 'IN' | 'OUT';
    quantity: number;
    unit: string;
    date: string;
    operator: string;
    reason: string;
    receiverOrSource: string;
    location: string;
}

export const StorageCenterPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'ledger' | 'inventory'>('ledger');
    const [items, setItems] = useState<StorageItem[]>([]);
    const [transactions, setTransactions] = useState<StockTransaction[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('همه دسته‌ها');
    const [selectedLocation, setSelectedLocation] = useState<string>('همه');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Modal state for "افزودن تبادل" (Append-only Ledger entry)
    const [isExchangeModalOpen, setIsExchangeModalOpen] = useState<boolean>(false);
    const [exchangeData, setExchangeData] = useState({
        itemId: 'NEW',
        type: 'IN' as 'IN' | 'OUT',
        quantity: 1,
        reason: IN_REASONS[0],
        receiverOrSource: IN_SOURCES[0],
        location: 'انبار مرکزی',
        newItemName: '',
        newItemCategory: 'شوینده و سلولوزی',
        newItemUnit: 'عدد',
        newItemMinStock: 5,
        newItemPrice: 0,
        newItemSupplier: '',
        newItemDescription: ''
    });

    const loadItems = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getStorageItems();
            setItems(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || 'خطا در بارگذاری اطلاعات از سرور');
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    const handleOpenExchangeModal = () => {
        const defaultType = 'IN';
        setExchangeData({
            itemId: items.length > 0 ? String(items[0].id) : 'NEW',
            type: defaultType,
            quantity: 1,
            reason: IN_REASONS[0],
            receiverOrSource: IN_SOURCES[0],
            location: 'انبار مرکزی',
            newItemName: '',
            newItemCategory: 'شوینده و سلولوزی',
            newItemUnit: 'عدد',
            newItemMinStock: 5,
            newItemPrice: 0,
            newItemSupplier: '',
            newItemDescription: ''
        });
        setIsExchangeModalOpen(true);
    };

    const handleTypeChange = (newType: 'IN' | 'OUT') => {
        setExchangeData({
            ...exchangeData,
            type: newType,
            reason: newType === 'IN' ? IN_REASONS[0] : OUT_REASONS[0],
            receiverOrSource: newType === 'IN' ? IN_SOURCES[0] : OUT_RECEIVERS[0]
        });
    };

    const handleSaveExchange = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let targetItem: StorageItem | undefined;

            if (exchangeData.itemId === 'NEW') {
                if (!exchangeData.newItemName.trim()) {
                    alert('لطفاً نام کالای جدید را وارد کنید.');
                    return;
                }
                const fullPayload = {
                    name: exchangeData.newItemName,
                    category: exchangeData.newItemCategory,
                    quantity: exchangeData.type === 'IN' ? exchangeData.quantity : 0,
                    unit: exchangeData.newItemUnit,
                    minStock: exchangeData.newItemMinStock,
                    location: exchangeData.location,
                    unitPrice: exchangeData.newItemPrice,
                    totalValue: (exchangeData.type === 'IN' ? exchangeData.quantity : 0) * exchangeData.newItemPrice,
                    supplier: exchangeData.newItemSupplier,
                    description: exchangeData.newItemDescription || 'ثبت از طریق تبادل انبار',
                    lastRestockDate: new Date().toLocaleDateString('fa-IR'),
                    transactionType: exchangeData.type,
                    transactionReason: exchangeData.reason,
                    transactionReceiverOrSource: exchangeData.receiverOrSource
                };

                const created = await createStorageItem(fullPayload);
                targetItem = created || fullPayload;
            } else {
                targetItem = items.find(i => String(i.id) === String(exchangeData.itemId));
                if (!targetItem) {
                    alert('کالای مورد نظر یافت نشد.');
                    return;
                }

                const currentQty = targetItem.quantity || 0;
                const delta = exchangeData.type === 'IN' ? Number(exchangeData.quantity) : -Number(exchangeData.quantity);
                const newQty = Math.max(0, currentQty + delta);

                const fullUpdatePayload = {
                    name: targetItem.name,
                    category: targetItem.category,
                    unit: targetItem.unit,
                    minStock: targetItem.minStock,
                    unitPrice: targetItem.unitPrice,
                    supplier: targetItem.supplier,
                    description: targetItem.description,
                    quantity: newQty,
                    totalValue: newQty * (targetItem.unitPrice || 0),
                    location: exchangeData.location,
                    lastRestockDate: exchangeData.type === 'IN' ? new Date().toLocaleDateString('fa-IR') : targetItem.lastRestockDate,
                    transactionType: exchangeData.type,
                    transactionQuantity: exchangeData.quantity,
                    transactionReason: exchangeData.reason,
                    transactionReceiverOrSource: exchangeData.receiverOrSource
                };

                // Append-only ledger rule: recorded via POST (createStorageItem)
                const createdTx = await createStorageItem(fullUpdatePayload);
                targetItem = createdTx || { ...targetItem, ...fullUpdatePayload };
            }

            if (targetItem) {
                const tx: StockTransaction = {
                    id: 'tx_' + Date.now(),
                    itemId: targetItem.id,
                    itemName: targetItem.name || exchangeData.newItemName,
                    type: exchangeData.type,
                    quantity: Number(exchangeData.quantity),
                    unit: targetItem.unit || exchangeData.newItemUnit,
                    date: new Date().toLocaleString('fa-IR'),
                    operator: localStorage.getItem('currentUsername') || 'مدیر سیستم',
                    reason: exchangeData.reason,
                    receiverOrSource: exchangeData.receiverOrSource,
                    location: exchangeData.location
                };
                setTransactions(prev => [tx, ...prev]);
            }

            setSuccessMessage(`تبادل (${exchangeData.type === 'IN' ? 'ورود' : 'خروج'}) با موفقیت به عنوان سند دفتر کل روی سرور ثبت شد.`);
            setIsExchangeModalOpen(false);
            loadItems();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            alert(err.message || 'خطا در ارتباط با سرور جهت ثبت تبادل');
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.location?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'همه دسته‌ها' || item.category === selectedCategory;
        const matchesLocation = selectedLocation === 'همه' || item.location === selectedLocation;
        return matchesSearch && matchesCategory && matchesLocation;
    });

    const totalItemsCount = items.length;
    const lowStockCount = items.filter(i => (i.quantity || 0) <= (i.minStock || 0)).length;
    const totalInventoryValue = items.reduce((sum, i) => sum + ((i.quantity || 0) * (i.unitPrice || 0)), 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-vazir text-right" dir="rtl">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/30">
                        <Boxes className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">انبارداری</h1>
                        <p className="text-xs text-indigo-200 mt-1">
                            سیستم انبارداری و دفتر کل اقلام مصرفی (بدون قابلیت ویرایش یا حذف سند، ثبت فقط از طریق متد پست)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadItems}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                        title="بارگذاری مجدد از سرور"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>بروزرسانی از سرور</span>
                    </button>
                    <button
                        onClick={handleOpenExchangeModal}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>افزودن تبادل (ورود/خروج)</span>
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {successMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}
            {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 font-bold block mb-1">تنوع اقلام سرور</span>
                        <span className="text-2xl font-black font-mono text-slate-800 dark:text-white">{totalItemsCount} <span className="text-xs font-sans text-slate-400">قلم</span></span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <Package className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 font-bold block mb-1">اقلام نیازمند شارژ (هشدار کمبود)</span>
                        <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">{lowStockCount} <span className="text-xs font-sans text-rose-500">قلم</span></span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 font-bold block mb-1">ارزش کل موجودی سرور</span>
                        <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{totalInventoryValue.toLocaleString('fa-IR')} <span className="text-xs font-sans">تومان</span></span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <Layers className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6">
                <button
                    onClick={() => setActiveTab('ledger')}
                    className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                        activeTab === 'ledger'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span>سوابق تبادلات نشست فعلی ({transactions.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                        activeTab === 'inventory'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <Boxes className="w-4 h-4" />
                    <span>موجودی لحظه‌ای سرور ({items.length})</span>
                </button>
            </div>

            {activeTab === 'ledger' ? (
                /* Ledger Tab */
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-5 space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                            <div>
                                <h3 className="font-black text-sm text-slate-800 dark:text-white">سوابق اسناد تبادلات (دفتر کل)</h3>
                                <p className="text-[11px] text-slate-400">ثبت اسناد انبار صرفاً به صورت افزودن (POST) بوده و غیرقابل ویرایش یا حذف است</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleOpenExchangeModal}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>افزودن تبادل جدید</span>
                            </button>
                            {transactions.length > 0 && (
                                <button
                                    onClick={() => setTransactions([])}
                                    className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                >
                                    پاک‌سازی لیست نشست
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Live Stock Quick Strip */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Boxes className="w-4 h-4 text-indigo-500" />
                                <span>موجودی لحظه‌ای اقلام روی سرور:</span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">تعداد کل اقلام: {items.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                            {items.map(item => {
                                const isLow = (item.quantity || 0) <= (item.minStock || 0);
                                return (
                                    <div key={item.id} className={`px-3 py-1.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                                        isLow 
                                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200' 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                                    }`}>
                                        <span className="font-black">{item.name}</span>
                                        <span className={`font-mono font-black px-1.5 py-0.5 rounded ${isLow ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'}`}>
                                            {(item.quantity || 0).toLocaleString('fa-IR')} {item.unit}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="p-16 text-center space-y-3">
                            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                            <p className="text-sm font-bold text-slate-500">هیچ سند تبادلی در این نشست ثبت نشده است.</p>
                            <p className="text-xs text-slate-400">اطلاعات مستقیماً روی سرور ثبت می‌شوند.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold">
                                    <tr>
                                        <th className="p-3.5">تاریخ و ساعت</th>
                                        <th className="p-3.5">نوع سند</th>
                                        <th className="p-3.5">نام کالا</th>
                                        <th className="p-3.5">مقدار</th>
                                        <th className="p-3.5">محل نگهداری</th>
                                        <th className="p-3.5">علت تبادل</th>
                                        <th className="p-3.5">منبع / تحویل‌گیرنده</th>
                                        <th className="p-3.5">ثبت‌کننده</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {transactions.map(tx => {
                                        const isIn = tx.type === 'IN';
                                        return (
                                            <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                <td className="p-3.5 font-mono text-slate-500">{tx.date}</td>
                                                <td className="p-3.5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-[11px] ${
                                                        isIn
                                                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                                                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                                                    }`}>
                                                        {isIn ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                                        <span>{isIn ? 'ورود به انبار' : 'خروج از انبار'}</span>
                                                    </span>
                                                </td>
                                                <td className="p-3.5 font-black text-slate-800 dark:text-white text-sm">{tx.itemName}</td>
                                                <td className="p-3.5 font-mono font-black text-sm text-slate-800 dark:text-white">
                                                    {isIn ? '+' : '-'}{tx.quantity.toLocaleString('fa-IR')} <span className="text-xs font-sans font-normal text-slate-400">{tx.unit}</span>
                                                </td>
                                                <td className="p-3.5 text-slate-600 dark:text-slate-300">
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[11px] font-bold">
                                                        {tx.location || 'انبار مرکزی'}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 font-bold text-slate-700 dark:text-slate-200">{tx.reason || '---'}</td>
                                                <td className="p-3.5 text-indigo-600 dark:text-indigo-400 font-bold">{tx.receiverOrSource || '---'}</td>
                                                <td className="p-3.5 text-slate-500 font-medium">@{tx.operator}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                /* Inventory Catalog Tab */
                <div className="space-y-4">
                    {/* Filters & Search Toolbar */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                            <div className="relative flex-1">
                                <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="جستجوی نام کالا، تامین‌کننده یا محل نگهداری..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <select
                                value={selectedLocation}
                                onChange={e => setSelectedLocation(e.target.value)}
                                className="px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="همه">همه محل‌ها (انبار، سرور، آشپزخانه...)</option>
                                {LOCATIONS.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Items Table (Immutable / Read-only inventory list per ledger rules) */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="p-16 flex justify-center items-center">
                                <Spinner />
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="p-16 text-center space-y-3">
                                <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                                <p className="text-sm font-bold text-slate-500">هیچ کالایی در سرور یافت نشد.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold">
                                        <tr>
                                            <th className="p-4">ردیف</th>
                                            <th className="p-4">نام کالا و مشخصات</th>
                                            <th className="p-4">دسته‌بندی</th>
                                            <th className="p-4">موجودی فعلی</th>
                                            <th className="p-4">حداقل هشدار</th>
                                            <th className="p-4">محل نگهداری</th>
                                            <th className="p-4">قیمت واحد (تومان)</th>
                                            <th className="p-4">ارزش کل</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {filteredItems.map((item, idx) => {
                                            const isLow = (item.quantity || 0) <= (item.minStock || 0);
                                            return (
                                                <tr key={item.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                                                    <td className="p-4">
                                                        <div className="font-black text-slate-800 dark:text-white text-sm">{item.name}</div>
                                                        {item.supplier && <div className="text-[10px] text-slate-400 mt-0.5">تامین‌کننده: {item.supplier}</div>}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold text-[11px]">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-mono font-black text-sm ${isLow ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
                                                                {(item.quantity || 0).toLocaleString('fa-IR')}
                                                            </span>
                                                            <span className="text-slate-400 text-[11px]">{item.unit}</span>
                                                            {isLow && (
                                                                <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded font-bold" title="موجودی کمتر از حد مجاز است">
                                                                    کمبود!
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-mono text-slate-500">
                                                        {(item.minStock || 0).toLocaleString('fa-IR')} {item.unit}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px]">
                                                            {item.location}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-200">
                                                        {(item.unitPrice || 0).toLocaleString('fa-IR')}
                                                    </td>
                                                    <td className="p-4 font-mono font-black text-emerald-600 dark:text-emerald-400">
                                                        {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('fa-IR')} ت
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: افزودن تبادل (Add Exchange - Append Only) */}
            {isExchangeModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsExchangeModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                            <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-600" />
                                <span>ثبت سند تبادل انبار (دفتر کل - POST)</span>
                            </h3>
                            <button onClick={() => setIsExchangeModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
                        </div>

                        <form onSubmit={handleSaveExchange} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                            {/* Exchange Type Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('IN')}
                                    className={`py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                                        exchangeData.type === 'IN'
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    <ArrowDownLeft className="w-4 h-4" />
                                    <span>📥 ورود به انبار (خرید / شارژ)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('OUT')}
                                    className={`py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                                        exchangeData.type === 'OUT'
                                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    <ArrowUpRight className="w-4 h-4" />
                                    <span>📤 خروج از انبار (مصرف اداری)</span>
                                </button>
                            </div>

                            {/* Select Item */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">انتخاب کالا از سرور * (کل اقلام: {items.length})</label>
                                <select
                                    value={exchangeData.itemId}
                                    onChange={e => setExchangeData({...exchangeData, itemId: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="NEW">➕ افزودن کالای جدید (ثبت سند اولیه در سرور)</option>
                                    {items.map(i => (
                                        <option key={i.id} value={i.id}>
                                            {i.name} — موجودی فعلی: {i.quantity} {i.unit} (محل: {i.location})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* If NEW Item */}
                            {exchangeData.itemId === 'NEW' && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">مشخصات کامل کالای جدید جهت ارسال سند به سرور:</span>
                                    <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام کالا *</label>
                                        <input
                                            type="text"
                                            value={exchangeData.newItemName}
                                            onChange={e => setExchangeData({...exchangeData, newItemName: e.target.value})}
                                            placeholder="مثلاً: نسکافه گلد شیشه‌ای، پوشه دکمه‌دار..."
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white font-bold text-xs outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">دسته‌بندی</label>
                                            <select
                                                value={exchangeData.newItemCategory}
                                                onChange={e => setExchangeData({...exchangeData, newItemCategory: e.target.value})}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white font-bold text-xs"
                                            >
                                                {CATEGORIES.filter(c => c !== 'همه دسته‌ها').map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">واحد اندازه‌گیری</label>
                                            <input
                                                type="text"
                                                value={exchangeData.newItemUnit}
                                                onChange={e => setExchangeData({...exchangeData, newItemUnit: e.target.value})}
                                                placeholder="عدد، بسته، رول..."
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white font-bold text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">قیمت واحد (تومان)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={exchangeData.newItemPrice}
                                                onChange={e => setExchangeData({...exchangeData, newItemPrice: Number(e.target.value)})}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white font-mono font-bold text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">حداقل هشدار</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={exchangeData.newItemMinStock}
                                                onChange={e => setExchangeData({...exchangeData, newItemMinStock: Number(e.target.value)})}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white font-mono font-bold text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تامین‌کننده / برند</label>
                                            <input
                                                type="text"
                                                value={exchangeData.newItemSupplier}
                                                onChange={e => setExchangeData({...exchangeData, newItemSupplier: e.target.value})}
                                                placeholder="نام شرکت..."
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white font-bold text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">توضیحات و مشخصات کالا</label>
                                        <input
                                            type="text"
                                            value={exchangeData.newItemDescription}
                                            onChange={e => setExchangeData({...exchangeData, newItemDescription: e.target.value})}
                                            placeholder="توضیحات تکمیلی..."
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white font-bold text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Quantity & Location */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مقدار تبادل *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={exchangeData.quantity}
                                        onChange={e => setExchangeData({...exchangeData, quantity: Math.max(1, Number(e.target.value))})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">محل نگهداری</label>
                                    <select
                                        value={exchangeData.location}
                                        onChange={e => setExchangeData({...exchangeData, location: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {LOCATIONS.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="space-y-1.5">
                                <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                    <span>{exchangeData.type === 'IN' ? 'علت ورود به انبار *' : 'علت خروج از انبار *'}</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={exchangeData.reason}
                                    onChange={e => setExchangeData({...exchangeData, reason: e.target.value})}
                                    placeholder="علت تبادل..."
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold text-xs outline-none"
                                />
                                <div className="flex flex-wrap gap-1 pt-1">
                                    {(exchangeData.type === 'IN' ? IN_REASONS : OUT_REASONS).map(qR => (
                                        <button
                                            key={qR}
                                            type="button"
                                            onClick={() => setExchangeData({...exchangeData, reason: qR})}
                                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all"
                                        >
                                            {qR}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Receiver or Source */}
                            <div className="space-y-1.5">
                                <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                    <span>{exchangeData.type === 'IN' ? 'تامین‌کننده / منبع ورود *' : 'تحویل‌گیرنده / بخش مربوطه *'}</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={exchangeData.receiverOrSource}
                                    onChange={e => setExchangeData({...exchangeData, receiverOrSource: e.target.value})}
                                    placeholder="نام منبع یا تحویل‌گیرنده..."
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold text-xs outline-none"
                                />
                                <div className="flex flex-wrap gap-1 pt-1">
                                    {(exchangeData.type === 'IN' ? IN_SOURCES : OUT_RECEIVERS).map(qS => (
                                        <button
                                            key={qS}
                                            type="button"
                                            onClick={() => setExchangeData({...exchangeData, receiverOrSource: qS})}
                                            className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-bold transition-all"
                                        >
                                            {qS}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsExchangeModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition-colors"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                                >
                                    ثبت سند در دفتر کل (ارسال POST)
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorageCenterPage;
