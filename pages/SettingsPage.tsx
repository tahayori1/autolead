
import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/api';
import type { AppSettings } from '../services/api';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { NotificationIcon } from '../components/icons/NotificationIcon';

import { 
    MENU_GROUPS_REGISTRY, 
    MANDATORY_MENU_ITEMS,
    getHiddenMenuItems, 
    saveHiddenMenuItems, 
    DEFAULT_HIDDEN_MENU_ITEMS 
} from '../utils/menuConfig';
import { 
    Eye, 
    EyeOff, 
    Sliders, 
    RotateCcw, 
    Lock, 
    Search, 
    CheckSquare, 
    Square, 
    ChevronDown, 
    ChevronUp,
    Sparkles,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react';

const FormField: React.FC<{
    label: string,
    name: keyof AppSettings,
    value: string | number,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
    type?: string,
    rows?: number,
    placeholder?: string,
    disabled?: boolean
}> = ({ label, name, value, onChange, type = 'text', rows, placeholder, disabled = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        {type === 'textarea' ? (
            <textarea
                id={name} name={name} value={value} onChange={onChange} rows={rows || 3} placeholder={placeholder} disabled={disabled}
                className="w-full px-3 py-2 border rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-50 dark:disabled:bg-slate-800"
            />
        ) : (
            <input
                id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
                className="w-full px-3 py-2 border rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-50 dark:disabled:bg-slate-800"
            />
        )}
    </div>
);

const SettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<Partial<AppSettings>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hiddenMenuItems, setHiddenMenuItems] = useState<string[]>(() => getHiddenMenuItems());
    const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const toggleGroupCollapse = (groupId: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const handleToggleMenuItemVisibility = (id: string, isMandatory?: boolean) => {
        if (isMandatory || MANDATORY_MENU_ITEMS.includes(id)) {
            showToast('بخش تنظیمات سیستم ضروری بوده و امکان عدم نمایش آن وجود ندارد.', 'error');
            return;
        }

        setHiddenMenuItems(prev => {
            const updated = prev.includes(id) 
                ? prev.filter(item => item !== id)
                : [...prev, id];
            saveHiddenMenuItems(updated);
            return updated;
        });
        showToast('وضعیت نمایش منو بروزرسانی شد', 'success');
    };

    const handleToggleGroupVisibility = (groupId: string, childItems: { id: string; isMandatory?: boolean }[]) => {
        const nonMandatoryChildIds = childItems
            .filter(item => !item.isMandatory && !MANDATORY_MENU_ITEMS.includes(item.id))
            .map(item => item.id);

        const isCurrentlyHidden = hiddenMenuItems.includes(groupId) || 
            (nonMandatoryChildIds.length > 0 && nonMandatoryChildIds.every(id => hiddenMenuItems.includes(id)));

        setHiddenMenuItems(prev => {
            let updated: string[];
            if (isCurrentlyHidden) {
                // Show Group & All its children
                updated = prev.filter(id => id !== groupId && !nonMandatoryChildIds.includes(id));
                showToast('بخش و تمامی زیرمنوهای آن فعال شدند', 'success');
            } else {
                // Hide Group & All non-mandatory children
                const toAdd = [groupId, ...nonMandatoryChildIds];
                updated = Array.from(new Set([...prev, ...toAdd]));
                showToast('بخش و زیرمنوهای آن مخفی شدند', 'success');
            }
            saveHiddenMenuItems(updated);
            return updated;
        });
    };

    const handleShowAllMenus = () => {
        setHiddenMenuItems([]);
        saveHiddenMenuItems([]);
        showToast('تمامی منوها و بخش‌های سیستم فعال و نمایان شدند', 'success');
    };

    const handleResetMenuVisibilityToDefault = () => {
        setHiddenMenuItems(DEFAULT_HIDDEN_MENU_ITEMS);
        saveHiddenMenuItems(DEFAULT_HIDDEN_MENU_ITEMS);
        showToast('تنظیمات نمایش منوها به حالت پیش‌فرض بازنشانی شد', 'success');
    };

    // Calculate dynamic stats
    const totalRegisteredGroups = MENU_GROUPS_REGISTRY.length;
    const allRegisteredItems = MENU_GROUPS_REGISTRY.flatMap(g => g.items);
    const totalRegisteredItems = allRegisteredItems.length;
    const totalVisibleItems = allRegisteredItems.filter(item => 
        !hiddenMenuItems.includes(item.id) || item.isMandatory || MANDATORY_MENU_ITEMS.includes(item.id)
    ).length;

    // Filter groups and items based on search query
    const filteredMenuGroups = MENU_GROUPS_REGISTRY.map(group => {
        const query = menuSearchQuery.trim().toLowerCase();
        if (!query) return group;

        const groupMatches = group.label.toLowerCase().includes(query) || (group.description && group.description.toLowerCase().includes(query));
        const matchingItems = group.items.filter(item => 
            item.label.toLowerCase().includes(query) || 
            (item.description && item.description.toLowerCase().includes(query)) ||
            groupMatches
        );

        return {
            ...group,
            items: matchingItems
        };
    }).filter(group => group.items.length > 0);

    const [notificationPermission, setNotificationPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    const [isSubscribing, setIsSubscribing] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const fetchedSettings = await getSettings();
                setSettings(fetchedSettings);
            } catch (err) {
                showToast('خطا در دریافت تنظیمات', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: (type === 'number' && name === 'establishment_year') ? parseInt(value, 10) || '' : value,
        }));
    };

    const handleSettingsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateSettings(settings);
            showToast('تنظیمات با موفقیت ذخیره شد', 'success');
        } catch (err) {
            showToast('خطا در ذخیره تنظیمات', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNotificationPermission = async () => {
        if (Notification.permission === 'default') {
            setIsSubscribing(true);
            try {
                const permission = await Notification.requestPermission();
                setNotificationPermission(permission);
                if (permission === 'granted') {
                    showToast('اعلان‌ها با موفقیت فعال شدند.', 'success');
                    const registration = await navigator.serviceWorker.ready;
                    registration.showNotification('اعلان‌ها فعال شدند', {
                        body: 'شما از این پس اعلان‌های سرنخ‌های داغ را دریافت خواهید کرد.',
                        icon: '/vite.svg'
                    });
                } else {
                    showToast('شما اجازه ارسال اعلان‌ها را ندادید.', 'error');
                }
            } catch (error) {
                showToast('خطا در فعال‌سازی اعلان‌ها', 'error');
            } finally {
                setIsSubscribing(false);
            }
        }
    };

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <form onSubmit={handleSettingsSubmit}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">تنظیمات سیستم</h2>
                        <button
                            type="submit"
                            disabled={isSaving || loading}
                            className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center w-full sm:w-40 transition-colors"
                        >
                            {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'ذخیره تنظیمات'}
                        </button>
                    </div>

                    {loading ? (
                         <div className="flex justify-center p-8"><Spinner /></div>
                    ) : (
                        <div className="space-y-8">
                            {/* Dynamic Menu & Navigation Visibility Settings Section */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 space-y-6">
                                
                                {/* Section Header */}
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b pb-5 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-500/20">
                                            <Sliders className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                                                    مدیریت نمایش منوها و بخش‌های سیستم
                                                </h3>
                                                <span className="bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-sky-300 dark:border-sky-800">
                                                    پویا و هوشمند ⚡
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                امکان فعال‌سازی یا غیرفعال‌سازی تک‌تک بخش‌های کلی و زیرمنوهای اختصاصی (بخش تنظیمات عمومی سیستم برای دسترسی دائم همواره فعال است).
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                        <button
                                            type="button"
                                            onClick={handleShowAllMenus}
                                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                            title="نمایش تمام بخش‌ها و زیرمنوهای موجود"
                                        >
                                            <Eye className="w-4 h-4 text-emerald-500" />
                                            <span>نمایش همه منوها</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleResetMenuVisibilityToDefault}
                                            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200 dark:border-amber-800"
                                            title="بازنشانی به حالت پیش‌فرض اولیه"
                                        >
                                            <RotateCcw className="w-4 h-4 text-amber-500" />
                                            <span>تنظیمات پیش‌فرض</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Summary Statistics & Search Bar */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-bold">بخش‌های کلان سیستم</span>
                                            <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{totalRegisteredGroups} دسته</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-bold">آیتم‌های فعال فعلی</span>
                                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                                {totalVisibleItems} از {totalRegisteredItems} آیتم
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-bold">بخش حفاظت‌شده</span>
                                            <span className="text-xs font-black text-amber-600 dark:text-amber-400">تنظیمات سیستم (قفل)</span>
                                        </div>
                                    </div>

                                    {/* Real-time Search Box */}
                                    <div className="relative">
                                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={menuSearchQuery}
                                            onChange={(e) => setMenuSearchQuery(e.target.value)}
                                            placeholder="جستجوی منو یا بخش..."
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Groups & Items Accordions */}
                                <div className="space-y-4">
                                    {filteredMenuGroups.length > 0 ? (
                                        filteredMenuGroups.map((group) => {
                                            const isCollapsed = Boolean(collapsedGroups[group.id]);
                                            
                                            // Non-mandatory children in this group
                                            const nonMandatoryItems = group.items.filter(
                                                item => !item.isMandatory && !MANDATORY_MENU_ITEMS.includes(item.id)
                                            );
                                            const groupHasMandatory = group.items.some(
                                                item => item.isMandatory || MANDATORY_MENU_ITEMS.includes(item.id)
                                            );

                                            // Count visible items in this group
                                            const visibleCountInGroup = group.items.filter(
                                                item => !hiddenMenuItems.includes(item.id) || item.isMandatory || MANDATORY_MENU_ITEMS.includes(item.id)
                                            ).length;

                                            // Group Master Status: considered active if at least one item is visible
                                            const isGroupActive = visibleCountInGroup > 0;
                                            const isGroupAllActive = visibleCountInGroup === group.items.length;

                                            return (
                                                <div 
                                                    key={group.id}
                                                    className="bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden transition-all shadow-xs"
                                                >
                                                    {/* Group Header Bar with Master Toggle */}
                                                    <div className="p-4 bg-white dark:bg-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-700/80">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleGroupCollapse(group.id)}
                                                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
                                                                title={isCollapsed ? 'باز کردن لیست زیرمنوها' : 'بستن لیست زیرمنوها'}
                                                            >
                                                                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                                            </button>

                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-sm font-black text-slate-800 dark:text-white">
                                                                        {group.label}
                                                                    </h4>
                                                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                                                        visibleCountInGroup === group.items.length
                                                                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                                                            : visibleCountInGroup > 0
                                                                            ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                                    }`}>
                                                                        {visibleCountInGroup} از {group.items.length} آیتم فعال
                                                                    </span>
                                                                    {groupHasMandatory && (
                                                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                                                            <Lock className="w-3 h-3" />
                                                                            <span>شامل آیتم حفاظت‌شده</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {group.description && (
                                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                                        {group.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Master Group Action: Toggle whole section */}
                                                        <div className="flex items-center gap-3 mr-auto sm:mr-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleGroupVisibility(group.id, group.items)}
                                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                                    isGroupAllActive
                                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                                                        : isGroupActive
                                                                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100'
                                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                                                }`}
                                                                title={`تغییر وضعیت کلی تمامی زیرمنوهای بخش ${group.label}`}
                                                            >
                                                                {isGroupAllActive ? (
                                                                    <>
                                                                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                                                                        <span>غیرفعال‌سازی این بخش</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Square className="w-3.5 h-3.5 text-slate-400" />
                                                                        <span>فعال‌سازی کامل این بخش</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Child Items Grid */}
                                                    {!isCollapsed && (
                                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {group.items.map((item) => {
                                                                const isMandatory = item.isMandatory || MANDATORY_MENU_ITEMS.includes(item.id);
                                                                const isHidden = isMandatory ? false : hiddenMenuItems.includes(item.id);

                                                                return (
                                                                    <div
                                                                        key={item.id}
                                                                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                                                            isMandatory
                                                                                ? 'bg-gradient-to-r from-amber-500/10 to-amber-500/5 dark:from-amber-950/40 dark:to-transparent border-amber-300 dark:border-amber-700 shadow-xs ring-1 ring-amber-300/50'
                                                                                : isHidden
                                                                                ? 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                                                                                : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 shadow-xs'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-start gap-2.5 truncate">
                                                                            <span className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                                                                isMandatory
                                                                                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                                                                                    : isHidden
                                                                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                                                                                    : 'bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300'
                                                                            }`}>
                                                                                {isMandatory ? (
                                                                                    <Lock className="w-4 h-4 text-amber-600" />
                                                                                ) : isHidden ? (
                                                                                    <EyeOff className="w-4 h-4" />
                                                                                ) : (
                                                                                    <Eye className="w-4 h-4" />
                                                                                )}
                                                                            </span>

                                                                            <div className="truncate">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className={`text-xs font-black block truncate ${
                                                                                        isMandatory 
                                                                                            ? 'text-amber-900 dark:text-amber-200' 
                                                                                            : isHidden 
                                                                                            ? 'text-slate-500 line-through' 
                                                                                            : 'text-slate-800 dark:text-slate-100'
                                                                                    }`}>
                                                                                        {item.label}
                                                                                    </span>

                                                                                    {isMandatory && (
                                                                                        <span className="text-[9px] font-black bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-1.5 py-0.2 rounded-md shrink-0">
                                                                                            قفل
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-0.5 line-clamp-1">
                                                                                    {item.description || group.label}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Toggle Switch */}
                                                                        <div className="shrink-0 flex items-center">
                                                                            {isMandatory ? (
                                                                                <div 
                                                                                    className="relative inline-flex items-center cursor-not-allowed opacity-90"
                                                                                    title="این بخش جهت دسترسی همیشگی به پیکربندی سیستم غیرقابل مخفی‌سازی است."
                                                                                >
                                                                                    <div className="w-10 h-6 bg-amber-500 rounded-full flex items-center justify-end px-1 shadow-inner">
                                                                                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs">
                                                                                            <Lock className="w-2.5 h-2.5 text-amber-600" />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={!isHidden}
                                                                                        onChange={() => handleToggleMenuItemVisibility(item.id, isMandatory)}
                                                                                        className="sr-only peer"
                                                                                    />
                                                                                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-emerald-500"></div>
                                                                                </label>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                            هیچ منو یا بخشی متناسب با جستجوی «{menuSearchQuery}» پیدا نشد.
                                        </div>
                                    )}
                                </div>

                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 border-b pb-3 flex items-center gap-2 dark:border-slate-700">
                                    <NotificationIcon className="w-5 h-5" />
                                    تنظیمات اعلان‌ها
                                </h3>
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        برای دریافت اعلان‌ها در مورد سرنخ‌های داغ جدید، لطفاً اجازه دسترسی را بدهید.
                                    </p>
                                    {notificationPermission === 'granted' && (
                                        <div className="p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-md text-center font-semibold">
                                            اعلان‌ها فعال هستند.
                                        </div>
                                    )}
                                    {notificationPermission === 'denied' && (
                                        <div className="p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-md text-center">
                                            <p className="font-semibold">اعلان‌ها مسدود شده‌اند.</p>
                                            <p className="text-xs mt-1">برای فعال‌سازی، لطفاً از تنظیمات مرورگر خود اقدام کنید.</p>
                                        </div>
                                    )}
                                    {notificationPermission === 'default' && (
                                        <div className="pt-2 flex justify-end">
                                            <button 
                                                onClick={handleNotificationPermission} 
                                                disabled={isSubscribing}
                                                type="button"
                                                className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center w-40"
                                            >
                                                {isSubscribing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'فعال‌سازی اعلان‌ها'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 border-b pb-3 dark:border-slate-700">اطلاعات نمایندگی</h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <FormField label="نام نمایندگی" name="dealership_name" value={settings.dealership_name || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                        <FormField label="نام شرکت" name="company_name" value={settings.company_name || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                        <FormField label="URL لوگو" name="logo_url" value={settings.logo_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="سال تاسیس" name="establishment_year" value={settings.establishment_year || ''} onChange={handleSettingsChange} type="number" disabled={isSaving} />
                                        <FormField label="حوزه فعالیت" name="activity_area" value={settings.activity_area || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                    </div>
                                    <FormField label="آدرس نمایندگی" name="address" value={settings.address || ''} onChange={handleSettingsChange} type="textarea" disabled={isSaving} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="نقشه گوگل" name="google_maps_url" value={settings.google_maps_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="نقشه نشان" name="neshan_maps_url" value={settings.neshan_maps_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="تلفن های تماس" name="contact_phones" value={settings.contact_phones || ''} onChange={handleSettingsChange} placeholder="شماره‌ها را با ویرگول جدا کنید" disabled={isSaving} />
                                        <FormField label="شماره موبایل‌ها" name="mobile_numbers" value={settings.mobile_numbers || ''} onChange={handleSettingsChange} placeholder="شماره‌ها را با ویرگول جدا کنید" disabled={isSaving} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <FormField label="اینستاگرام" name="instagram_url" value={settings.instagram_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="یوتیوب" name="youtube_url" value={settings.youtube_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="کانال تلگرام" name="telegram_channel_url" value={settings.telegram_channel_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="کانال واتساپ" name="whatsapp_channel_url" value={settings.whatsapp_channel_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="تردز (Threads)" name="threads_url" value={settings.threads_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                    </div>
                                    <FormField label="مزیت‌های رقابتی" name="competitive_advantages" value={settings.competitive_advantages || ''} onChange={handleSettingsChange} type="textarea" disabled={isSaving} />
                                    <FormField label="توضیحات" name="description" value={settings.description || ''} onChange={handleSettingsChange} type="textarea" disabled={isSaving} />
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 border-b pb-3 dark:border-slate-700">تنظیمات API</h3>
                                <div className="space-y-4">
                                    <FormField label="کلید API واتساپ" name="whatsappApiKey" type="text" value={settings.whatsappApiKey || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                    <FormField label="کلید API پیامک (SMS)" name="smsApiKey" type="text" value={settings.smsApiKey || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                    <FormField label="کلید API دیدار" name="didarApiKey" type="text" value={settings.didarApiKey || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                </div>
                            </div>

                        </div>
                    )}
                </form>
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default SettingsPage;
