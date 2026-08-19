import React, { useState, useMemo } from 'react';
import { CarYardItem } from '../../types';
import { 
    Car, 
    Plus, 
    Search, 
    Filter, 
    CheckCircle2, 
    Clock, 
    Warehouse, 
    Printer, 
    Edit, 
    Trash2, 
    FileText, 
    X,
    Building,
    Key
} from 'lucide-react';

interface CommissionCarYardLedgerProps {
    items: CarYardItem[];
    onUpdateItems: (items: CarYardItem[]) => void;
    activePeriodId: string;
    activePeriodName: string;
}

export const CommissionCarYardLedger: React.FC<CommissionCarYardLedgerProps> = ({
    items,
    onUpdateItems,
    activePeriodId,
    activePeriodName
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterLocation, setFilterLocation] = useState<string>('ALL');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CarYardItem | null>(null);

    // Form states
    const [carModel, setCarModel] = useState('');
    const [carColor, setCarColor] = useState('');
    const [chassisNumber, setChassisNumber] = useState('');
    const [plateNumber, setPlateNumber] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [entryDate, setEntryDate] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [storageLocation, setStorageLocation] = useState('نمایشگاه مرکزی');
    const [deliveredBy, setDeliveredBy] = useState('');
    const [status, setStatus] = useState<'PARKED' | 'RELEASED' | 'IN_REPAIR'>('PARKED');
    const [notes, setNotes] = useState('');

    const handleOpenModal = (item?: CarYardItem) => {
        if (item) {
            setEditingItem(item);
            setCarModel(item.carModel);
            setCarColor(item.carColor);
            setChassisNumber(item.chassisNumber || '');
            setPlateNumber(item.plateNumber || '');
            setOwnerName(item.ownerName);
            setEntryDate(item.entryDate);
            setReleaseDate(item.releaseDate || '');
            setStorageLocation(item.storageLocation);
            setDeliveredBy(item.deliveredBy);
            setStatus(item.status);
            setNotes(item.notes || '');
        } else {
            setEditingItem(null);
            setCarModel('');
            setCarColor('سفید');
            setChassisNumber('');
            setPlateNumber('');
            setOwnerName('');
            setEntryDate(`1405/${activePeriodId.slice(5)}/01`);
            setReleaseDate('');
            setStorageLocation('نمایشگاه مرکزی');
            setDeliveredBy('');
            setStatus('PARKED');
            setNotes('');
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!carModel.trim() || !ownerName.trim()) {
            alert('لطفاً نوع خودرو و نام مالک را وارد کنید.');
            return;
        }

        const newItem: CarYardItem = {
            id: editingItem?.id || `yard-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            periodId: activePeriodId,
            carModel: carModel.trim(),
            carColor: carColor.trim(),
            chassisNumber: chassisNumber.trim() || undefined,
            plateNumber: plateNumber.trim() || undefined,
            ownerName: ownerName.trim(),
            entryDate: entryDate.trim(),
            releaseDate: releaseDate.trim() || undefined,
            storageLocation: storageLocation.trim(),
            deliveredBy: deliveredBy.trim(),
            status,
            notes: notes.trim() || undefined
        };

        if (editingItem) {
            onUpdateItems(items.map(i => i.id === editingItem.id ? newItem : i));
        } else {
            onUpdateItems([newItem, ...items]);
        }

        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (!confirm('آیا از حذف این ردیف خودرو اطمینان دارید؟')) return;
        onUpdateItems(items.filter(i => i.id !== id));
    };

    const handleToggleStatus = (id: string) => {
        onUpdateItems(items.map(i => {
            if (i.id === id) {
                const nextStatus = i.status === 'PARKED' ? 'RELEASED' : 'PARKED';
                return {
                    ...i,
                    status: nextStatus,
                    releaseDate: nextStatus === 'RELEASED' ? (i.releaseDate || '1405/05/22') : undefined
                };
            }
            return i;
        }));
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
            if (filterLocation !== 'ALL' && item.storageLocation !== filterLocation) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchCar = item.carModel.toLowerCase().includes(q);
                const matchOwner = item.ownerName.toLowerCase().includes(q);
                const matchPlate = (item.plateNumber || '').toLowerCase().includes(q);
                const matchChassis = (item.chassisNumber || '').toLowerCase().includes(q);
                const matchDeliverer = item.deliveredBy.toLowerCase().includes(q);
                if (!matchCar && !matchOwner && !matchPlate && !matchChassis && !matchDeliverer) return false;
            }

            return true;
        });
    }, [items, filterStatus, filterLocation, searchQuery]);

    const locations = useMemo(() => {
        const set = new Set<string>();
        items.forEach(i => set.add(i.storageLocation));
        return Array.from(set);
    }, [items]);

    return (
        <div className="space-y-6 animate-fade-in" dir="rtl">
            
            {/* Header & Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                        <Car className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-bold block">کل خودروهای ثبت‌شده کاردکس</span>
                        <span className="font-mono font-black text-slate-800 dark:text-white text-lg">{items.length} دستگاه</span>
                    </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Warehouse className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-bold block">موجود در پارکینگ و انبار</span>
                        <span className="font-mono font-black text-amber-600 text-lg">
                            {items.filter(i => i.status === 'PARKED').length} دستگاه
                        </span>
                    </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-bold block">ترخیص و تحویل‌شده به خریدار</span>
                        <span className="font-mono font-black text-emerald-600 text-lg">
                            {items.filter(i => i.status === 'RELEASED').length} دستگاه
                        </span>
                    </div>
                </div>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <div className="relative flex-1 min-w-[220px]">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="جستجو در مدل، مالک، پلاک، شاسی یا تحویل‌دهنده..."
                            className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    >
                        <option value="ALL">همه وضعیت‌ها</option>
                        <option value="PARKED">موجود در پارکینگ</option>
                        <option value="RELEASED">ترخیص‌شده</option>
                    </select>

                    <select
                        value={filterLocation}
                        onChange={e => setFilterLocation(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    >
                        <option value="ALL">همه محل‌های نگهداری</option>
                        {locations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => window.print()}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        چاپ کاردکس
                    </button>

                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        ثبت ورود خودرو
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="py-3 px-3 text-center">ردیف</th>
                                <th className="py-3 px-3.5">نوع خودرو</th>
                                <th className="py-3 px-3">رنگ</th>
                                <th className="py-3 px-3">شماره شاسی</th>
                                <th className="py-3 px-3">شماره پلاک</th>
                                <th className="py-3 px-3.5">نام مالک سند</th>
                                <th className="py-3 px-3">تاریخ ورود</th>
                                <th className="py-3 px-3">تاریخ ترخیص</th>
                                <th className="py-3 px-3.5">محل نگهداری</th>
                                <th className="py-3 px-3">نام تحویل‌دهنده</th>
                                <th className="py-3 px-3 text-center">وضعیت</th>
                                <th className="py-3 px-3 text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="py-10 text-center text-slate-400">
                                        هیچ خودرویی در کاردکس ثبت نشده است.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="py-3 px-3 text-center font-mono text-slate-400">
                                            {index + 1}
                                        </td>
                                        <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                                            {item.carModel}
                                        </td>
                                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            {item.carColor}
                                        </td>
                                        <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                                            {item.chassisNumber || '-'}
                                        </td>
                                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                            {item.plateNumber || '-'}
                                        </td>
                                        <td className="py-3 px-3.5 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                            {item.ownerName}
                                        </td>
                                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {item.entryDate}
                                        </td>
                                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {item.releaseDate || '-'}
                                        </td>
                                        <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                            {item.storageLocation}
                                        </td>
                                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {item.deliveredBy}
                                        </td>
                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleStatus(item.id)}
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition-all ${
                                                    item.status === 'RELEASED'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                }`}
                                            >
                                                {item.status === 'RELEASED' ? 'ترخیص شده' : 'موجود در پارکینگ'}
                                            </button>
                                        </td>
                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                                                    title="ویرایش"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Car Entry/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl p-6">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <Car className="w-5 h-5 text-emerald-600" />
                                {editingItem ? 'ویرایش اطلاعات خودرو در کاردکس' : 'ثبت ورود خودرو به پارکینگ / نمایشگاه'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        نوع و مدل خودرو <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={carModel}
                                        onChange={e => setCarModel(e.target.value)}
                                        placeholder="مثلاً: کی‌ام‌سی T9 یا ایگل"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        رنگ خودرو <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={carColor}
                                        onChange={e => setCarColor(e.target.value)}
                                        placeholder="مثلاً: مشکی متالیک"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        نام مالک سند <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={ownerName}
                                        onChange={e => setOwnerName(e.target.value)}
                                        placeholder="مثلاً: اکبر نجف آبادی پور"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        شماره شاسی
                                    </label>
                                    <input
                                        type="text"
                                        value={chassisNumber}
                                        onChange={e => setChassisNumber(e.target.value)}
                                        placeholder="NAG84930129"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        شماره پلاک
                                    </label>
                                    <input
                                        type="text"
                                        value={plateNumber}
                                        onChange={e => setPlateNumber(e.target.value)}
                                        placeholder="۳۴ ایران ۷۲۶ ج ۱۸"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        نام تحویل‌دهنده
                                    </label>
                                    <input
                                        type="text"
                                        value={deliveredBy}
                                        onChange={e => setDeliveredBy(e.target.value)}
                                        placeholder="مثلاً: محمد مبین غلامی"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        محل نگهداری خودرو
                                    </label>
                                    <select
                                        value={storageLocation}
                                        onChange={e => setStorageLocation(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                    >
                                        <option value="نمایشگاه مرکزی">نمایشگاه مرکزی</option>
                                        <option value="پارکینگ شماره ۱">پارکینگ شماره ۱</option>
                                        <option value="انبار حسینی خودرو">انبار حسینی خودرو</option>
                                        <option value="پارکینگ ترخیص">پارکینگ ترخیص</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        تاریخ ورود <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={entryDate}
                                        onChange={e => setEntryDate(e.target.value)}
                                        placeholder="۱۴۰۵/۰۵/۰۱"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none text-center font-bold"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        وضعیت
                                    </label>
                                    <select
                                        value={status}
                                        onChange={e => setStatus(e.target.value as any)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                                    >
                                        <option value="PARKED">موجود در پارکینگ</option>
                                        <option value="RELEASED">ترخیص شده</option>
                                        <option value="IN_REPAIR">در حال کارشناسی / تعمیرات</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                                >
                                    ذخیره در کاردکس
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
