import React, { useState, useEffect, useMemo } from 'react';
import type { StorageItem, StockTransaction } from '../types';
import { 
    getStorageData, 
    createStorageItem, 
    updateStorageItem, 
    deleteStorageItem, 
    recordStockMovement, 
    updateStockMovement, 
    deleteStockMovement,
    getNowGregorianDateTime,
    getTodayGregorianDate
} from '../services/api';
import Spinner from '../components/Spinner';
import { 
    Boxes, 
    Plus, 
    Search, 
    AlertTriangle, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Package, 
    CheckCircle2, 
    RefreshCw, 
    Layers, 
    Edit2, 
    Trash2, 
    Download, 
    Calendar, 
    SlidersHorizontal,
    FileText,
    History,
    Check,
    X,
    TrendingDown,
    TrendingUp,
    FolderKanban
} from 'lucide-react';

const CATEGORIES = [
    'همه دسته‌ها',
    'چای، قهوه و آبدارخانه',
    'ظروف یکبار مصرف',
    'شوینده و سلولوزی',
    'لوازم تحریر و اداری',
    'مواد غذایی و نوشیدنی',
    'سایر اقلام مصرفی'
];

const LOCATIONS = [
    'انبار مرکزی',
    'آبدارخانه طبقه همکف',
    'آبدارخانه طبقه بالا',
    'قفسه A1 انبار',
    'قفسه A2 انبار',
    'قفسه شوینده B1',
    'قفسه C1 ملزومات اداری',
    'قفسه C2',
    'اتاق سرور / تجهیزات',
    'کمد ملزومات اداری'
];

const UNITS = ['عدد', 'بسته', 'جعبه', 'کارتن', 'گالن', 'کیسه', 'کیلوگرم', 'لیتر', 'قوطی', 'رول', 'پک'];

const IN_REASONS = [
    'خرید جدید از تامین‌کننده / بازار',
    'شارژ دوره‌ای انبار ماهانه',
    'مرجوعی از بخش‌ها',
    'هدیه / اهدایی',
    'انتقال از انبار دیگر',
    'تعدیل مثبت انبارگردانی'
];

const IN_SOURCES = [
    'واحد خرید و تدارکات',
    'فروشگاه مرکزی بازار',
    'تامین‌کننده آزاد',
    'چای دوغزال / توزیع بازار',
    'شرکت بن مانو',
    'صنایع سلولوزی پاپیروس',
    'توزیع‌کننده Double A',
    'پخش شوینده البرز'
];

const OUT_REASONS = [
    'مصرف جاری و روزمره اداری',
    'تحویل به آبدارخانه برای پذیرایی',
    'جلسه رسمی مدیریت / مهمان‌داری',
    'تحویل به واحد فروش و قراردادها',
    'خرابی / ضایعات / انقضا',
    'انتقال به شعبه یا بخش دیگر'
];

const OUT_RECEIVERS = [
    'آبدارخانه طبقه همکف و مهمان‌داری',
    'آبدارخانه طبقه بالا',
    'واحد فروش و صدور قرارداد',
    'واحد مالی و اداری',
    'اتاق مدیریت و هیئت مدیره',
    'پشتیبانی و IT',
    'خدمات و انتظامات',
    'عمومی پرسنل'
];

export const StorageCenterPage: React.FC = () => {
    // Tabs: 'inventory' (موجودی کالاها) | 'movements' (گردش ورود و خروج) | 'adjustment' (انبارگردانی و تنظیم سریع)
    const [activeTab, setActiveTab] = useState<'inventory' | 'movements' | 'adjustment'>('inventory');

    const [items, setItems] = useState<StorageItem[]>([]);
    const [transactions, setTransactions] = useState<StockTransaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Filters for Inventory
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('همه دسته‌ها');
    const [selectedLocation, setSelectedLocation] = useState<string>('همه');
    const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);

    // Filters for Movements
    const [movementTypeFilter, setMovementTypeFilter] = useState<'ALL' | 'IN' | 'OUT' | 'ADJUSTMENT'>('ALL');
    const [movementSearchQuery, setMovementSearchQuery] = useState<string>('');
    const [startDateFilter, setStartDateFilter] = useState<string>('');
    const [endDateFilter, setEndDateFilter] = useState<string>('');

    // --- Modals State ---
    // 1. Inbound Modal (ورود کالا)
    const [isInboundModalOpen, setIsInboundModalOpen] = useState<boolean>(false);
    const [inboundForm, setInboundForm] = useState({
        itemId: '',
        quantity: 1,
        date: getTodayGregorianDate(),
        referenceNumber: '',
        supplier: IN_SOURCES[0],
        unitPrice: 0,
        reason: IN_REASONS[0],
        notes: ''
    });

    // 2. Outbound Modal (خروج کالا)
    const [isOutboundModalOpen, setIsOutboundModalOpen] = useState<boolean>(false);
    const [outboundForm, setOutboundForm] = useState({
        itemId: '',
        quantity: 1,
        date: getTodayGregorianDate(),
        referenceNumber: '',
        receiver: OUT_RECEIVERS[0],
        reason: OUT_REASONS[0],
        notes: ''
    });

    // 3. Add/Edit Item Modal
    const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
    const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
    const [itemForm, setItemForm] = useState({
        name: '',
        category: CATEGORIES[1],
        quantity: 0,
        unit: 'عدد',
        minStock: 5,
        location: LOCATIONS[0],
        unitPrice: 0,
        supplier: '',
        description: ''
    });

    // 4. Direct Stock Adjustment Modal (تنظیم سریع موجودی)
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
    const [adjustingItem, setAdjustingItem] = useState<StorageItem | null>(null);
    const [adjustForm, setAdjustForm] = useState({
        newQuantity: 0,
        reason: 'انبارگردانی دوره‌ای و تطبیق موجودی فیزیکی',
        date: getTodayGregorianDate(),
        notes: ''
    });

    // 5. Edit Movement Modal
    const [isEditMovementModalOpen, setIsEditMovementModalOpen] = useState<boolean>(false);
    const [editingMovement, setEditingMovement] = useState<StockTransaction | null>(null);
    const [editMovementForm, setEditMovementForm] = useState({
        date: '',
        referenceNumber: '',
        sourceOrDestination: '',
        reason: '',
        notes: ''
    });

    // Load initial data
    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getStorageData();
            setItems(Array.isArray(data.items) ? data.items : []);
            setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        } catch (err: any) {
            setError(err.message || 'خطا در بارگذاری اطلاعات انبار');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const showToast = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 4000);
    };

    // --- Inbound Handlers ---
    const handleOpenInboundModal = (targetItemId?: string | number) => {
        const selectedId = targetItemId ? String(targetItemId) : (items.length > 0 ? String(items[0].id) : '');
        const targetItem = items.find(i => String(i.id) === selectedId);
        setInboundForm({
            itemId: selectedId,
            quantity: 1,
            date: getTodayGregorianDate(),
            referenceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
            supplier: targetItem?.supplier || IN_SOURCES[0],
            unitPrice: targetItem?.unitPrice || 0,
            reason: IN_REASONS[0],
            notes: ''
        });
        setIsInboundModalOpen(true);
    };

    const handleSaveInbound = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inboundForm.itemId) {
            alert('لطفاً کالای مورد نظر را انتخاب کنید.');
            return;
        }
        if (Number(inboundForm.quantity) <= 0) {
            alert('مقدار ورودی باید بزرگتر از صفر باشد.');
            return;
        }

        try {
            const result = await recordStockMovement({
                itemId: inboundForm.itemId,
                type: 'IN',
                quantity: Number(inboundForm.quantity),
                date: inboundForm.date ? `${inboundForm.date} ${getNowGregorianDateTime().split(' ')[1] || '12:00'}` : getNowGregorianDateTime(),
                referenceNumber: inboundForm.referenceNumber,
                sourceOrDestination: inboundForm.supplier,
                reason: inboundForm.reason,
                unitPrice: Number(inboundForm.unitPrice) || 0,
                notes: inboundForm.notes
            });

            // Update local state
            setItems(prev => prev.map(i => String(i.id) === String(result.item.id) ? result.item : i));
            setTransactions(prev => [result.transaction, ...prev]);

            showToast(`ورود ${inboundForm.quantity} واحد به موجودی کالای «${result.item.name}» با موفقیت ثبت شد.`);
            setIsInboundModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'خطا در ثبت ورود کالا');
        }
    };

    // --- Outbound Handlers ---
    const handleOpenOutboundModal = (targetItemId?: string | number) => {
        const selectedId = targetItemId ? String(targetItemId) : (items.length > 0 ? String(items[0].id) : '');
        setOutboundForm({
            itemId: selectedId,
            quantity: 1,
            date: getTodayGregorianDate(),
            referenceNumber: `REQ-${Math.floor(100 + Math.random() * 900)}`,
            receiver: OUT_RECEIVERS[0],
            reason: OUT_REASONS[0],
            notes: ''
        });
        setIsOutboundModalOpen(true);
    };

    const handleSaveOutbound = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!outboundForm.itemId) {
            alert('لطفاً کالای مورد نظر را انتخاب کنید.');
            return;
        }

        const targetItem = items.find(i => String(i.id) === String(outboundForm.itemId));
        if (!targetItem) {
            alert('کالای مورد نظر یافت نشد.');
            return;
        }

        const outQty = Number(outboundForm.quantity);
        if (outQty <= 0) {
            alert('مقدار خروجی باید بزرگتر از صفر باشد.');
            return;
        }

        if ((targetItem.quantity || 0) < outQty) {
            alert(`موجودی فعلی این کالا (${targetItem.quantity} ${targetItem.unit}) کمتر از مقدار درخواستی (${outQty} ${targetItem.unit}) است.`);
            return;
        }

        try {
            const result = await recordStockMovement({
                itemId: outboundForm.itemId,
                type: 'OUT',
                quantity: outQty,
                date: outboundForm.date ? `${outboundForm.date} ${getNowGregorianDateTime().split(' ')[1] || '12:00'}` : getNowGregorianDateTime(),
                referenceNumber: outboundForm.referenceNumber,
                sourceOrDestination: outboundForm.receiver,
                reason: outboundForm.reason,
                notes: outboundForm.notes
            });

            // Update local state
            setItems(prev => prev.map(i => String(i.id) === String(result.item.id) ? result.item : i));
            setTransactions(prev => [result.transaction, ...prev]);

            showToast(`خروج ${outQty} واحد از موجودی کالای «${result.item.name}» ثبت شد. (موجودی جدید: ${result.item.quantity})`);
            setIsOutboundModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'خطا در ثبت خروج کالا');
        }
    };

    // --- Direct Stock Adjustment Handlers ---
    const handleOpenAdjustModal = (item: StorageItem) => {
        setAdjustingItem(item);
        setAdjustForm({
            newQuantity: item.quantity || 0,
            reason: 'انبارگردانی دوره‌ای و تطبیق موجودی فیزیکی',
            date: getTodayGregorianDate(),
            notes: ''
        });
        setIsAdjustModalOpen(true);
    };

    const handleSaveAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustingItem) return;

        const targetQty = Number(adjustForm.newQuantity);
        if (targetQty < 0) {
            alert('موجودی جدید نمی‌تواند منفی باشد.');
            return;
        }

        const diff = targetQty - (adjustingItem.quantity || 0);

        try {
            const result = await recordStockMovement({
                itemId: adjustingItem.id,
                type: 'ADJUSTMENT',
                quantity: Math.abs(diff),
                targetStock: targetQty,
                date: adjustForm.date ? `${adjustForm.date} ${getNowGregorianDateTime().split(' ')[1] || '12:00'}` : getNowGregorianDateTime(),
                referenceNumber: `ADJ-${Math.floor(100 + Math.random() * 900)}`,
                sourceOrDestination: 'انبارگردانی و تطبیق دستی',
                reason: `${adjustForm.reason} (تغییر از ${adjustingItem.quantity} به ${targetQty})`,
                notes: adjustForm.notes
            });

            setItems(prev => prev.map(i => String(i.id) === String(result.item.id) ? result.item : i));
            setTransactions(prev => [result.transaction, ...prev]);

            showToast(`موجودی کالای «${result.item.name}» با موفقیت روی ${targetQty} ${result.item.unit} تنظیم شد.`);
            setIsAdjustModalOpen(false);
            setAdjustingItem(null);
        } catch (err: any) {
            alert(err.message || 'خطا در تنظیم موجودی کالا');
        }
    };

    // --- Add / Edit Item Handlers ---
    const handleOpenAddItem = () => {
        setEditingItemId(null);
        setItemForm({
            name: '',
            category: CATEGORIES[1],
            quantity: 0,
            unit: 'عدد',
            minStock: 5,
            location: LOCATIONS[0],
            unitPrice: 0,
            supplier: '',
            description: ''
        });
        setIsItemModalOpen(true);
    };

    const handleOpenEditItem = (item: StorageItem) => {
        setEditingItemId(item.id);
        setItemForm({
            name: item.name || '',
            category: item.category || CATEGORIES[1],
            quantity: item.quantity || 0,
            unit: item.unit || 'عدد',
            minStock: item.minStock || 5,
            location: item.location || LOCATIONS[0],
            unitPrice: item.unitPrice || 0,
            supplier: item.supplier || '',
            description: item.description || ''
        });
        setIsItemModalOpen(true);
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemForm.name.trim()) {
            alert('لطفاً نام کالا را وارد کنید.');
            return;
        }

        try {
            if (editingItemId) {
                // Update existing item
                const updated = await updateStorageItem(editingItemId, {
                    name: itemForm.name.trim(),
                    category: itemForm.category,
                    quantity: Number(itemForm.quantity) || 0,
                    unit: itemForm.unit,
                    minStock: Number(itemForm.minStock) || 0,
                    location: itemForm.location,
                    unitPrice: Number(itemForm.unitPrice) || 0,
                    supplier: itemForm.supplier.trim(),
                    description: itemForm.description.trim()
                });
                setItems(prev => prev.map(i => String(i.id) === String(editingItemId) ? updated : i));
                showToast(`مشخصات کالای «${updated.name}» بروزرسانی شد.`);
            } else {
                // Create new item
                const created = await createStorageItem({
                    name: itemForm.name.trim(),
                    category: itemForm.category,
                    quantity: Number(itemForm.quantity) || 0,
                    unit: itemForm.unit,
                    minStock: Number(itemForm.minStock) || 0,
                    location: itemForm.location,
                    unitPrice: Number(itemForm.unitPrice) || 0,
                    supplier: itemForm.supplier.trim(),
                    description: itemForm.description.trim(),
                    lastRestockDate: getTodayGregorianDate()
                });

                // If initial quantity > 0, record initial inbound movement
                if (created.quantity > 0) {
                    await recordStockMovement({
                        itemId: created.id,
                        type: 'IN',
                        quantity: created.quantity,
                        date: getNowGregorianDateTime(),
                        referenceNumber: `INIT-${Math.floor(100 + Math.random() * 900)}`,
                        sourceOrDestination: created.supplier || 'موجودی افتتاحیه انبار',
                        reason: 'ثبت کالای جدید و موجودی اولیه انبار',
                        unitPrice: created.unitPrice
                    });
                }

                loadData();
                showToast(`کالای جدید «${created.name}» به انبار اضافه شد.`);
            }
            setIsItemModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'خطا در ذخیره‌سازی اطلاعات کالا');
        }
    };

    const handleDeleteItem = async (item: StorageItem) => {
        if (!window.confirm(`آیا از حذف کالای «${item.name}» از انبار اطمینان دارید؟`)) return;

        try {
            await deleteStorageItem(item.id);
            setItems(prev => prev.filter(i => String(i.id) !== String(item.id)));
            showToast(`کالای «${item.name}» با موفقیت حذف شد.`);
        } catch (err: any) {
            alert(err.message || 'خطا در حذف کالا');
        }
    };

    // --- Movement Edit & Delete Handlers ---
    const handleOpenEditMovement = (tx: StockTransaction) => {
        setEditingMovement(tx);
        setEditMovementForm({
            date: tx.date ? tx.date.split(' ')[0] : getTodayGregorianDate(),
            referenceNumber: tx.referenceNumber || '',
            sourceOrDestination: tx.sourceOrDestination || tx.receiverOrSource || '',
            reason: tx.reason || '',
            notes: tx.notes || ''
        });
        setIsEditMovementModalOpen(true);
    };

    const handleSaveEditMovement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMovement) return;

        try {
            const timePart = editingMovement.date?.split(' ')[1] || '12:00';
            const updatedTx = await updateStockMovement(editingMovement.id, {
                date: editMovementForm.date ? `${editMovementForm.date} ${timePart}` : editingMovement.date,
                referenceNumber: editMovementForm.referenceNumber,
                sourceOrDestination: editMovementForm.sourceOrDestination,
                receiverOrSource: editMovementForm.sourceOrDestination,
                reason: editMovementForm.reason,
                notes: editMovementForm.notes
            });

            setTransactions(prev => prev.map(t => String(t.id) === String(editingMovement.id) ? updatedTx : t));
            showToast('سند گردش انبار با موفقیت بروزرسانی شد.');
            setIsEditMovementModalOpen(false);
            setEditingMovement(null);
        } catch (err: any) {
            alert(err.message || 'خطا در ویرایش سند');
        }
    };

    const handleDeleteMovement = async (tx: StockTransaction) => {
        const shouldRevert = window.confirm(
            `آیا این سند گردش (${tx.type === 'IN' ? 'ورود' : tx.type === 'OUT' ? 'خروج' : 'تعدیل'}) حذف شود؟\n\nبرای بازگرداندن موجودی کالا به حالت قبل از این سند، دکمه OK را بزنید.`
        );

        try {
            await deleteStockMovement(tx.id, shouldRevert);
            setTransactions(prev => prev.filter(t => String(t.id) !== String(tx.id)));
            if (shouldRevert) {
                // reload to get accurate reverted item stocks
                const data = await getStorageData();
                setItems(data.items);
            }
            showToast('سند گردش با موفقیت حذف شد.');
        } catch (err: any) {
            alert(err.message || 'خطا در حذف سند گردش');
        }
    };

    // --- CSV Export (Gregorian format) ---
    const handleExportCSV = () => {
        const header = ['ID', 'Date_Gregorian', 'Type', 'Item_Name', 'Quantity', 'Unit', 'Previous_Stock', 'New_Stock', 'Ref_Number', 'Source_or_Destination', 'Reason', 'Operator'];
        const rows = transactions.map(t => [
            t.id,
            t.date || '',
            t.type === 'IN' ? 'Inbound' : t.type === 'OUT' ? 'Outbound' : 'Adjustment',
            `"${(t.itemName || t.name || '').replace(/"/g, '""')}"`,
            t.quantity || 0,
            t.unit || '',
            t.previousStock ?? '',
            t.newStock ?? '',
            `"${(t.referenceNumber || '').replace(/"/g, '""')}"`,
            `"${(t.sourceOrDestination || t.receiverOrSource || '').replace(/"/g, '""')}"`,
            `"${(t.reason || '').replace(/"/g, '""')}"`,
            `"${(t.operator || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = '\uFEFF' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `warehouse_movements_${getTodayGregorianDate()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filtered Items
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = !searchQuery.trim() || 
                (item.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.supplier?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.location?.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = selectedCategory === 'همه دسته‌ها' || item.category === selectedCategory;
            const matchesLocation = selectedLocation === 'همه' || item.location === selectedLocation;
            const matchesLowStock = !filterLowStockOnly || ((item.quantity || 0) <= (item.minStock || 0));

            return matchesSearch && matchesCategory && matchesLocation && matchesLowStock;
        });
    }, [items, searchQuery, selectedCategory, selectedLocation, filterLowStockOnly]);

    // Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const matchesType = movementTypeFilter === 'ALL' || tx.type === movementTypeFilter;
            const matchesSearch = !movementSearchQuery.trim() ||
                (tx.itemName?.toLowerCase().includes(movementSearchQuery.toLowerCase())) ||
                (tx.referenceNumber?.toLowerCase().includes(movementSearchQuery.toLowerCase())) ||
                (tx.sourceOrDestination?.toLowerCase().includes(movementSearchQuery.toLowerCase())) ||
                (tx.receiverOrSource?.toLowerCase().includes(movementSearchQuery.toLowerCase())) ||
                (tx.reason?.toLowerCase().includes(movementSearchQuery.toLowerCase()));

            let matchesDate = true;
            if (tx.date) {
                const txDatePart = tx.date.split(' ')[0];
                if (startDateFilter && txDatePart < startDateFilter) matchesDate = false;
                if (endDateFilter && txDatePart > endDateFilter) matchesDate = false;
            }

            return matchesType && matchesSearch && matchesDate;
        });
    }, [transactions, movementTypeFilter, movementSearchQuery, startDateFilter, endDateFilter]);

    // KPI Metrics
    const totalItemsCount = items.length;
    const lowStockCount = items.filter(i => (i.quantity || 0) <= (i.minStock || 0)).length;
    const totalInventoryValue = items.reduce((sum, i) => sum + ((i.quantity || 0) * (i.unitPrice || 0)), 0);
    const totalInboundCount = transactions.filter(t => t.type === 'IN').length;
    const totalOutboundCount = transactions.filter(t => t.type === 'OUT').length;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-vazir text-right" dir="rtl">
            {/* Top Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/30 shrink-0">
                        <Boxes className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight">سامانه مدیریت انبار و موجودی کالا</h1>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                🗓️ تقویم میلادی
                            </span>
                        </div>
                        <p className="text-xs text-indigo-200 mt-1">
                            سیستم استاندارد کنترل موجودی، ثبت و ویرایش حواله‌های ورود و خروج، و انبارگردانی
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    {/* Fast Inbound Button */}
                    <button
                        onClick={() => handleOpenInboundModal()}
                        className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        title="ثبت ورود کالا به انبار"
                    >
                        <ArrowDownLeft className="w-4 h-4" />
                        <span>ثبت ورود کالا 📥</span>
                    </button>

                    {/* Fast Outbound Button */}
                    <button
                        onClick={() => handleOpenOutboundModal()}
                        className="flex-1 md:flex-initial px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        title="ثبت خروج و تحویل کالا"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>ثبت خروج کالا 📤</span>
                    </button>

                    {/* Add Item Button */}
                    <button
                        onClick={handleOpenAddItem}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>کالای جدید</span>
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={loadData}
                        className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                        title="بروزرسانی داده‌ها"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {successMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-fade-in shadow-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[11px] text-slate-400 font-bold block mb-1">تنوع اقلام انبار</span>
                        <span className="text-2xl font-black font-mono text-slate-800 dark:text-white">
                            {totalItemsCount} <span className="text-xs font-sans text-slate-400">قلم</span>
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Package className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[11px] text-slate-400 font-bold block mb-1">هشدار کمبود موجودی</span>
                        <span className={`text-2xl font-black font-mono ${lowStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                            {lowStockCount} <span className="text-xs font-sans text-rose-500">مورد</span>
                        </span>
                    </div>
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${lowStockCount > 0 ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[11px] text-slate-400 font-bold block mb-1">ارزش کل موجودی</span>
                        <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {totalInventoryValue.toLocaleString('en-US')} <span className="text-[11px] font-sans">تومان</span>
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[11px] text-slate-400 font-bold block mb-1">گردش اسناد (ورود/خروج)</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-black text-emerald-600 font-mono flex items-center gap-0.5">
                                <TrendingDown className="w-3.5 h-3.5" /> {totalInboundCount} ورود
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-xs font-black text-rose-600 font-mono flex items-center gap-0.5">
                                <TrendingUp className="w-3.5 h-3.5" /> {totalOutboundCount} خروج
                            </span>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <History className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                        activeTab === 'inventory'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <Boxes className="w-4 h-4" />
                    <span>موجودی و اقلام انبار ({items.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('movements')}
                    className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                        activeTab === 'movements'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <History className="w-4 h-4" />
                    <span>گردش ورود و خروج ({transactions.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('adjustment')}
                    className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                        activeTab === 'adjustment'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>انبارگردانی و تنظیم سریع موجودی</span>
                </button>
            </div>

            {/* TAB 1: INVENTORY & STOCK LEVELS */}
            {activeTab === 'inventory' && (
                <div className="space-y-4">
                    {/* Search & Filters */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="جستجوی نام کالا، تامین‌کننده، قفسه انبار..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <select
                                value={selectedLocation}
                                onChange={e => setSelectedLocation(e.target.value)}
                                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="همه">همه محل‌ها و قفسه‌ها</option>
                                {LOCATIONS.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
                                    filterLowStockOnly
                                        ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300'
                                }`}
                            >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>فقط اقلام با کمبود موجودی ({lowStockCount})</span>
                            </button>
                        </div>

                        <button
                            onClick={handleOpenAddItem}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>افزودن کالای جدید</span>
                        </button>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="p-16 flex justify-center items-center">
                                <Spinner />
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="p-16 text-center space-y-3">
                                <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                                <p className="text-sm font-bold text-slate-500">هیچ کالایی با فیلترهای انتخابی یافت نشد.</p>
                                <button
                                    onClick={handleOpenAddItem}
                                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md"
                                >
                                    افزودن اولین کالا
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold">
                                        <tr>
                                            <th className="p-3.5">کد / نام کالا</th>
                                            <th className="p-3.5">دسته‌بندی</th>
                                            <th className="p-3.5">موجودی فعلی</th>
                                            <th className="p-3.5">حداقل هشدار</th>
                                            <th className="p-3.5">محل نگهداری</th>
                                            <th className="p-3.5">قیمت واحد (تومان)</th>
                                            <th className="p-3.5">ارزش کل</th>
                                            <th className="p-3.5">آخرین ورود (میلادی)</th>
                                            <th className="p-3.5 text-center">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {filteredItems.map(item => {
                                            const qty = item.quantity || 0;
                                            const min = item.minStock || 0;
                                            const isLow = qty <= min;
                                            const isOut = qty === 0;

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-3.5">
                                                        <div className="font-black text-slate-800 dark:text-white text-sm">{item.name}</div>
                                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                                            <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded font-bold">{item.id}</span>
                                                            {item.supplier && <span>تامین‌کننده: {item.supplier}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold text-[11px]">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-mono font-black text-base ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800 dark:text-white'}`}>
                                                                {qty.toLocaleString('en-US')}
                                                            </span>
                                                            <span className="text-slate-400 text-[11px] font-bold">{item.unit || 'عدد'}</span>
                                                            {isOut ? (
                                                                <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded font-black">
                                                                    اتمام موجودی!
                                                                </span>
                                                            ) : isLow ? (
                                                                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                                                                    کمبود
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5 font-mono text-slate-500 font-bold">
                                                        {min.toLocaleString('en-US')} {item.unit}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px]">
                                                            {item.location || 'انبار مرکزی'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-200">
                                                        {(item.unitPrice || 0).toLocaleString('en-US')}
                                                    </td>
                                                    <td className="p-3.5 font-mono font-black text-emerald-600 dark:text-emerald-400">
                                                        {(qty * (item.unitPrice || 0)).toLocaleString('en-US')} ت
                                                    </td>
                                                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                                                        {item.lastRestockDate || '---'}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {/* Inbound Quick */}
                                                            <button
                                                                onClick={() => handleOpenInboundModal(item.id)}
                                                                title="ثبت ورود کالا"
                                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <ArrowDownLeft className="w-4 h-4" />
                                                            </button>

                                                            {/* Outbound Quick */}
                                                            <button
                                                                onClick={() => handleOpenOutboundModal(item.id)}
                                                                title="ثبت خروج کالا"
                                                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <ArrowUpRight className="w-4 h-4" />
                                                            </button>

                                                            {/* Direct Stock Adjust */}
                                                            <button
                                                                onClick={() => handleOpenAdjustModal(item)}
                                                                title="تنظیم دستی موجودی (انبارگردانی)"
                                                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <SlidersHorizontal className="w-4 h-4" />
                                                            </button>

                                                            {/* Edit Item */}
                                                            <button
                                                                onClick={() => handleOpenEditItem(item)}
                                                                title="ویرایش مشخصات کالا"
                                                                className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>

                                                            {/* Delete Item */}
                                                            <button
                                                                onClick={() => handleDeleteItem(item)}
                                                                title="حذف کالا از انبار"
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
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

            {/* TAB 2: MOVEMENTS & TRANSACTIONS LOG */}
            {activeTab === 'movements' && (
                <div className="space-y-4">
                    {/* Movements Filter Toolbar */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                            {/* Type Pills */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setMovementTypeFilter('ALL')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        movementTypeFilter === 'ALL'
                                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    همه ({transactions.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMovementTypeFilter('IN')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                        movementTypeFilter === 'IN'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300'
                                    }`}
                                >
                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                    <span>ورودی‌ها</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMovementTypeFilter('OUT')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                        movementTypeFilter === 'OUT'
                                            ? 'bg-rose-600 text-white shadow-sm'
                                            : 'text-rose-700 hover:bg-rose-50 dark:text-rose-300'
                                    }`}
                                >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    <span>خروجی‌ها</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMovementTypeFilter('ADJUSTMENT')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                        movementTypeFilter === 'ADJUSTMENT'
                                            ? 'bg-amber-600 text-white shadow-sm'
                                            : 'text-amber-700 hover:bg-amber-50 dark:text-amber-300'
                                    }`}
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    <span>تعدیل انبار</span>
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative flex-1 min-w-[180px]">
                                <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="جستجو در نام کالا، شماره فاکتور، تحویل‌گیرنده..."
                                    value={movementSearchQuery}
                                    onChange={e => setMovementSearchQuery(e.target.value)}
                                    className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                />
                            </div>

                            {/* Gregorian Date Range Filter */}
                            <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                <span className="text-[11px] text-slate-400 px-1 font-bold">تاریخ میلادی:</span>
                                <input
                                    type="date"
                                    value={startDateFilter}
                                    onChange={e => setStartDateFilter(e.target.value)}
                                    className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono outline-none"
                                    title="از تاریخ (میلادی)"
                                />
                                <span className="text-slate-400">تا</span>
                                <input
                                    type="date"
                                    value={endDateFilter}
                                    onChange={e => setEndDateFilter(e.target.value)}
                                    className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono outline-none"
                                    title="تا تاریخ (میلادی)"
                                />
                                {(startDateFilter || endDateFilter) && (
                                    <button
                                        type="button"
                                        onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
                                        className="text-slate-400 hover:text-slate-600 px-1 text-[10px] font-bold"
                                    >
                                        پاک کردن
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportCSV}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="خروجی فایل اکسل / CSV با تاریخ‌های میلادی"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>خروجی اکسل (CSV)</span>
                            </button>
                        </div>
                    </div>

                    {/* Movements Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        {filteredTransactions.length === 0 ? (
                            <div className="p-16 text-center space-y-3">
                                <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                                <p className="text-sm font-bold text-slate-500">هیچ سابقه گردشی یافت نشد.</p>
                                <div className="flex justify-center gap-2 pt-2">
                                    <button
                                        onClick={() => handleOpenInboundModal()}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                                    >
                                        ثبت ورود کالا 📥
                                    </button>
                                    <button
                                        onClick={() => handleOpenOutboundModal()}
                                        className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
                                    >
                                        ثبت خروج کالا 📤
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold">
                                        <tr>
                                            <th className="p-3.5">تاریخ و ساعت (میلادی)</th>
                                            <th className="p-3.5">نوع عملیات</th>
                                            <th className="p-3.5">نام کالا</th>
                                            <th className="p-3.5">مقدار جابجایی</th>
                                            <th className="p-3.5">موجودی قبلی → جدید</th>
                                            <th className="p-3.5">شماره سند / فاکتور</th>
                                            <th className="p-3.5">تامین‌کننده / تحویل‌گیرنده</th>
                                            <th className="p-3.5">علت / شرح بابت</th>
                                            <th className="p-3.5">مسئول ثبت</th>
                                            <th className="p-3.5 text-center">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {filteredTransactions.map(tx => {
                                            const isOut = tx.type === 'OUT' || (Number(tx.transactionQuantity || tx.quantity) < 0 && tx.type !== 'IN');
                                            const isAdj = tx.type === 'ADJUSTMENT';
                                            const qty = Math.abs(Number(tx.quantity || tx.transactionQuantity || 0));

                                            return (
                                                <tr key={tx.id || Math.random()} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300 font-bold">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <span>{tx.date || '---'}</span>
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5">
                                                        {isAdj ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-[11px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200">
                                                                <SlidersHorizontal className="w-3 h-3" />
                                                                <span>تعدیل موجودی</span>
                                                            </span>
                                                        ) : isOut ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-[11px] bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200">
                                                                <ArrowUpRight className="w-3 h-3" />
                                                                <span>خروج از انبار</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-[11px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200">
                                                                <ArrowDownLeft className="w-3 h-3" />
                                                                <span>ورود به انبار</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 font-black text-slate-800 dark:text-white text-sm">
                                                        {tx.itemName || tx.name || '---'}
                                                    </td>
                                                    <td className="p-3.5 font-mono font-black text-sm">
                                                        <span className={isOut ? 'text-rose-600 dark:text-rose-400' : isAdj ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'}>
                                                            {isOut ? `-${qty.toLocaleString('en-US')}` : `+${qty.toLocaleString('en-US')}`}
                                                        </span>{' '}
                                                        <span className="text-xs font-sans font-normal text-slate-400">{tx.unit || 'عدد'}</span>
                                                    </td>
                                                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                                                        {tx.previousStock !== undefined && tx.newStock !== undefined ? (
                                                            <span>{tx.previousStock} → <strong className="text-slate-800 dark:text-slate-200">{tx.newStock}</strong></span>
                                                        ) : (
                                                            '---'
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-bold">
                                                            {tx.referenceNumber || '---'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-indigo-600 dark:text-indigo-400 font-bold">
                                                        {tx.sourceOrDestination || tx.receiverOrSource || tx.supplier || '---'}
                                                    </td>
                                                    <td className="p-3.5 font-bold text-slate-700 dark:text-slate-200">
                                                        {tx.reason || tx.notes || '---'}
                                                    </td>
                                                    <td className="p-3.5 text-slate-500 text-[11px]">
                                                        @{tx.operator || 'سیستم'}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                onClick={() => handleOpenEditMovement(tx)}
                                                                title="ویرایش سند گردش"
                                                                className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMovement(tx)}
                                                                title="حذف سند گردش"
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
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

            {/* TAB 3: DIRECT STOCK ADJUSTMENT & AUDIT */}
            {activeTab === 'adjustment' && (
                <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <SlidersHorizontal className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                                <span className="font-black block">انبارگردانی مستقیم و تطبیق موجودی فیزیکی</span>
                                <span className="text-[11px] text-amber-700 dark:text-amber-300">
                                    در این بخش می‌توانید بدون نیاز به فرم پیچیده، موجودی واقعی قفسه‌ها را مستقیماً وارد کرده و تنظیم کنید. تغییرات همراه با تاریخ میلادی ثبت خواهند شد.
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold">
                                    <tr>
                                        <th className="p-4">نام کالا</th>
                                        <th className="p-4">دسته‌بندی</th>
                                        <th className="p-4">محل نگهداری</th>
                                        <th className="p-4">موجودی فعلی سیستمی</th>
                                        <th className="p-4">حداقل هشدار</th>
                                        <th className="p-4 text-center">تنظیم مستقیم موجودی</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {items.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4 font-black text-slate-800 dark:text-white text-sm">
                                                {item.name}
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.id}</div>
                                            </td>
                                            <td className="p-4 text-slate-600 dark:text-slate-300">{item.category}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-300">{item.location}</td>
                                            <td className="p-4 font-mono font-black text-sm text-slate-800 dark:text-white">
                                                {item.quantity} {item.unit}
                                            </td>
                                            <td className="p-4 font-mono text-slate-500">
                                                {item.minStock} {item.unit}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleOpenAdjustModal(item)}
                                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-600 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                                                >
                                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                                    <span>تنظیم موجودی واقعی</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 1: INBOUND (ثبت ورود کالا) --- */}
            {isInboundModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsInboundModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/40 flex justify-between items-center shrink-0">
                            <h3 className="font-black text-base text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                                <span>ثبت ورود کالا به انبار (Inbound)</span>
                            </h3>
                            <button onClick={() => setIsInboundModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleSaveInbound} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                            {/* Item Selection */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">کالای ورودی *</label>
                                <select
                                    required
                                    value={inboundForm.itemId}
                                    onChange={e => {
                                        const sel = items.find(i => String(i.id) === e.target.value);
                                        setInboundForm({
                                            ...inboundForm,
                                            itemId: e.target.value,
                                            unitPrice: sel?.unitPrice || inboundForm.unitPrice,
                                            supplier: sel?.supplier || inboundForm.supplier
                                        });
                                    }}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="" disabled>انتخاب کالا...</option>
                                    {items.map(i => (
                                        <option key={i.id} value={i.id}>
                                            {i.name} (موجودی فعلی: {i.quantity} {i.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Quantity & Date (Gregorian) */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تعداد / مقدار ورود *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={inboundForm.quantity}
                                        onChange={e => setInboundForm({...inboundForm, quantity: Math.max(1, Number(e.target.value))})}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-black text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ ورود (میلادی YYYY-MM-DD) *</label>
                                    <input
                                        type="date"
                                        required
                                        value={inboundForm.date}
                                        onChange={e => setInboundForm({...inboundForm, date: e.target.value})}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-bold outline-none"
                                    />
                                </div>
                            </div>

                            {/* Reference Number & Price */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شماره فاکتور / سند خرید</label>
                                    <input
                                        type="text"
                                        value={inboundForm.referenceNumber}
                                        onChange={e => setInboundForm({...inboundForm, referenceNumber: e.target.value})}
                                        placeholder="مثلاً: INV-1044"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-bold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">قیمت واحد خرید (تومان)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={inboundForm.unitPrice}
                                        onChange={e => setInboundForm({...inboundForm, unitPrice: Number(e.target.value)})}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-bold outline-none"
                                    />
                                </div>
                            </div>

                            {/* Supplier */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تامین‌کننده / فروشنده</label>
                                <input
                                    type="text"
                                    value={inboundForm.supplier}
                                    onChange={e => setInboundForm({...inboundForm, supplier: e.target.value})}
                                    placeholder="نام فروشگاه یا شرکت تامین‌کننده..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                />
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {IN_SOURCES.slice(0, 4).map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setInboundForm({...inboundForm, supplier: s})}
                                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">علت / بابت ورود *</label>
                                <input
                                    type="text"
                                    required
                                    value={inboundForm.reason}
                                    onChange={e => setInboundForm({...inboundForm, reason: e.target.value})}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                />
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {IN_REASONS.map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setInboundForm({...inboundForm, reason: r})}
                                            className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold"
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">یادداشت تکمیلی</label>
                                <input
                                    type="text"
                                    value={inboundForm.notes}
                                    onChange={e => setInboundForm({...inboundForm, notes: e.target.value})}
                                    placeholder="توضیحات اضافی در صورت نیاز..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsInboundModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/30 cursor-pointer"
                                >
                                    ثبت و افزایش موجودی انبار 📥
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: OUTBOUND (ثبت خروج کالا) --- */}
            {isOutboundModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsOutboundModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-rose-50 dark:bg-rose-950/40 flex justify-between items-center shrink-0">
                            <h3 className="font-black text-base text-rose-900 dark:text-rose-200 flex items-center gap-2">
                                <ArrowUpRight className="w-5 h-5 text-rose-600" />
                                <span>ثبت خروج و تحویل کالا (Outbound)</span>
                            </h3>
                            <button onClick={() => setIsOutboundModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleSaveOutbound} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                            {/* Item Selection */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">کالای درخواستی برای خروج *</label>
                                <select
                                    required
                                    value={outboundForm.itemId}
                                    onChange={e => setOutboundForm({...outboundForm, itemId: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-rose-500"
                                >
                                    <option value="" disabled>انتخاب کالا...</option>
                                    {items.map(i => (
                                        <option key={i.id} value={i.id}>
                                            {i.name} — موجودی: {i.quantity} {i.unit} (محل: {i.location})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Quantity & Date (Gregorian) */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تعداد / مقدار خروج *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={outboundForm.quantity}
                                        onChange={e => setOutboundForm({...outboundForm, quantity: Math.max(1, Number(e.target.value))})}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-black text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ خروج (میلادی YYYY-MM-DD) *</label>
                                    <input
                                        type="date"
                                        required
                                        value={outboundForm.date}
                                        onChange={e => setOutboundForm({...outboundForm, date: e.target.value})}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-bold outline-none"
                                    />
                                </div>
                            </div>

                            {/* Reference Number */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شماره حواله / درخواست خروج</label>
                                <input
                                    type="text"
                                    value={outboundForm.referenceNumber}
                                    onChange={e => setOutboundForm({...outboundForm, referenceNumber: e.target.value})}
                                    placeholder="مثلاً: REQ-104"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-bold outline-none"
                                />
                            </div>

                            {/* Receiver */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تحویل‌گیرنده / واحد متقاضی *</label>
                                <input
                                    type="text"
                                    required
                                    value={outboundForm.receiver}
                                    onChange={e => setOutboundForm({...outboundForm, receiver: e.target.value})}
                                    placeholder="نام فرد یا واحد تحویل‌گیرنده..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                />
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {OUT_RECEIVERS.map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setOutboundForm({...outboundForm, receiver: r})}
                                            className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded text-[10px] font-bold"
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">علت / بابت خروج *</label>
                                <input
                                    type="text"
                                    required
                                    value={outboundForm.reason}
                                    onChange={e => setOutboundForm({...outboundForm, reason: e.target.value})}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                />
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {OUT_REASONS.map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setOutboundForm({...outboundForm, reason: r})}
                                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold"
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">یادداشت تکمیلی</label>
                                <input
                                    type="text"
                                    value={outboundForm.notes}
                                    onChange={e => setOutboundForm({...outboundForm, notes: e.target.value})}
                                    placeholder="توضیحات تحویل..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsOutboundModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-lg shadow-rose-600/30 cursor-pointer"
                                >
                                    ثبت و کسر از موجودی انبار 📤
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: DIRECT STOCK ADJUSTMENT --- */}
            {isAdjustModalOpen && adjustingItem && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsAdjustModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-amber-50 dark:bg-amber-950/40 flex justify-between items-center">
                            <h3 className="font-black text-base text-amber-900 dark:text-amber-200 flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-amber-600" />
                                <span>تنظیم مستقیم موجودی کالا</span>
                            </h3>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleSaveAdjust} className="p-6 space-y-4 text-xs">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                                <span className="text-[11px] text-slate-400 block font-bold">کالای انتخابی:</span>
                                <span className="font-black text-sm text-slate-800 dark:text-white block">{adjustingItem.name}</span>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700 mt-2">
                                    <span className="text-slate-500">موجودی فعلی سیستمی:</span>
                                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                                        {adjustingItem.quantity} {adjustingItem.unit}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    موجودی واقعی شمارش شده در انبار *
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        required
                                        value={adjustForm.newQuantity}
                                        onChange={e => setAdjustForm({...adjustForm, newQuantity: Math.max(0, Number(e.target.value))})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-black text-base outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    <span className="text-sm font-bold text-slate-500 shrink-0">{adjustingItem.unit}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ انبارگردانی (میلادی YYYY-MM-DD)</label>
                                <input
                                    type="date"
                                    required
                                    value={adjustForm.date}
                                    onChange={e => setAdjustForm({...adjustForm, date: e.target.value})}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-bold outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">علت تغییر و اصلاح موجودی *</label>
                                <input
                                    type="text"
                                    required
                                    value={adjustForm.reason}
                                    onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAdjustModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-lg shadow-amber-600/30 cursor-pointer"
                                >
                                    اعمال موجودی جدید
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: ADD / EDIT ITEM --- */}
            {isItemModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsItemModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                            <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                                <Boxes className="w-5 h-5 text-indigo-600" />
                                <span>{editingItemId ? 'ویرایش مشخصات کالا' : 'افزودن کالای جدید به انبار'}</span>
                            </h3>
                            <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام کامل کالا *</label>
                                <input
                                    type="text"
                                    required
                                    value={itemForm.name}
                                    onChange={e => setItemForm({...itemForm, name: e.target.value})}
                                    placeholder="مثلاً: چای سیاه شکسته اعلا، کاغذ A4 دابل آ..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">دسته‌بندی</label>
                                    <select
                                        value={itemForm.category}
                                        onChange={e => setItemForm({...itemForm, category: e.target.value})}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                    >
                                        {CATEGORIES.filter(c => c !== 'همه دسته‌ها').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">واحد اندازه‌گیری</label>
                                    <select
                                        value={itemForm.unit}
                                        onChange={e => setItemForm({...itemForm, unit: e.target.value})}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                    >
                                        {UNITS.map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        {editingItemId ? 'موجودی فعلی' : 'موجودی اولیه'}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={itemForm.quantity}
                                        onChange={e => setItemForm({...itemForm, quantity: Math.max(0, Number(e.target.value))})}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-bold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">حداقل هشدار کمبود</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={itemForm.minStock}
                                        onChange={e => setItemForm({...itemForm, minStock: Math.max(0, Number(e.target.value))})}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-bold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">قیمت واحد (تومان)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={itemForm.unitPrice}
                                        onChange={e => setItemForm({...itemForm, unitPrice: Math.max(0, Number(e.target.value))})}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-bold outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">محل نگهداری / قفسه</label>
                                    <select
                                        value={itemForm.location}
                                        onChange={e => setItemForm({...itemForm, location: e.target.value})}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                    >
                                        {LOCATIONS.map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تامین‌کننده / برند</label>
                                    <input
                                        type="text"
                                        value={itemForm.supplier}
                                        onChange={e => setItemForm({...itemForm, supplier: e.target.value})}
                                        placeholder="نام برند یا شرکت..."
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">توضیحات و مشخصات کالا</label>
                                <textarea
                                    rows={2}
                                    value={itemForm.description}
                                    onChange={e => setItemForm({...itemForm, description: e.target.value})}
                                    placeholder="توضیحات مربوط به مصارف، ابعاد، مشخصات..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none resize-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsItemModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-600/30 cursor-pointer"
                                >
                                    {editingItemId ? 'بروزرسانی مشخصات کالا' : 'ذخیره کالا در انبار'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 5: EDIT MOVEMENT RECORD --- */}
            {isEditMovementModalOpen && editingMovement && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsEditMovementModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-indigo-600" />
                                <span>ویرایش سند گردش انبار</span>
                            </h3>
                            <button onClick={() => setIsEditMovementModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleSaveEditMovement} className="p-6 space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ سند (میلادی YYYY-MM-DD) *</label>
                                <input
                                    type="date"
                                    required
                                    value={editMovementForm.date}
                                    onChange={e => setEditMovementForm({...editMovementForm, date: e.target.value})}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-bold outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شماره سند / فاکتور</label>
                                <input
                                    type="text"
                                    value={editMovementForm.referenceNumber}
                                    onChange={e => setEditMovementForm({...editMovementForm, referenceNumber: e.target.value})}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono font-bold outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تامین‌کننده / تحویل‌گیرنده</label>
                                <input
                                    type="text"
                                    value={editMovementForm.sourceOrDestination}
                                    onChange={e => setEditMovementForm({...editMovementForm, sourceOrDestination: e.target.value})}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">علت / شرح بابت</label>
                                <input
                                    type="text"
                                    value={editMovementForm.reason}
                                    onChange={e => setEditMovementForm({...editMovementForm, reason: e.target.value})}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">یادداشت تکمیلی</label>
                                <input
                                    type="text"
                                    value={editMovementForm.notes}
                                    onChange={e => setEditMovementForm({...editMovementForm, notes: e.target.value})}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditMovementModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-600/30 cursor-pointer"
                                >
                                    ذخیره تغییرات سند
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
