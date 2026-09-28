import React, { useState, useEffect, useMemo } from 'react';
import { 
    Store, Plus, Search, MapPin, Phone, User, Trash2, Edit2, X, Check, 
    Filter, Layers, Briefcase, CheckCircle2, AlertCircle, RefreshCw, Loader2, Building2, Clock
} from 'lucide-react';
import type { CollaborationShowroom, StaffUser } from '../types';
import { getCollaborations, createCollaboration, updateCollaboration, deleteCollaboration, getStaffUsers } from '../services/api';
import Toast from '../components/Toast';

export const PRODUCT_BASKETS = [
    'وارداتی',
    'سایپا',
    'ایران خودرو',
    'مدیران خودرو',
    'کارکرده',
    'مونتاژی',
    'سایر'
];

export const COLLAB_STATUSES = [
    { key: 'در حال همکاری', label: 'در حال همکاری', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200' },
    { key: 'در حال مذاکره', label: 'در حال مذاکره', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200' },
    { key: 'توقف همکاری', label: 'توقف همکاری', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200' }
];

export const CollabShowroomsPage: React.FC = () => {
    const [showrooms, setShowrooms] = useState<CollaborationShowroom[]>([]);
    const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [basketFilter, setBasketFilter] = useState<string>('all');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Modal state for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingShowroom, setEditingShowroom] = useState<CollaborationShowroom | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        contact_name: '',
        contact_phone: '',
        introducer: '',
        product_basket: [] as string[],
        status: 'در حال مذاکره',
        description: ''
    });

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [collabData, staffData] = await Promise.all([
                getCollaborations(),
                getStaffUsers().catch(() => [])
            ]);
            setShowrooms(Array.isArray(collabData) ? collabData : []);
            setStaffUsers(Array.isArray(staffData) ? staffData : []);
        } catch (err) {
            showToast('خطا در دریافت اطلاعات نمایشگاه‌های همکار', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenAddModal = () => {
        setEditingShowroom(null);
        setFormData({
            name: '',
            address: '',
            phone: '',
            contact_name: '',
            contact_phone: '',
            introducer: '',
            product_basket: ['وارداتی'],
            status: 'در حال مذاکره',
            description: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item: CollaborationShowroom) => {
        setEditingShowroom(item);
        let baskets: string[] = [];
        if (Array.isArray(item.product_basket)) {
            baskets = item.product_basket;
        } else if (typeof item.product_basket === 'string') {
            baskets = item.product_basket.split(',').map(s => s.trim()).filter(Boolean);
        }

        setFormData({
            name: item.name || '',
            address: item.address || '',
            phone: item.phone || '',
            contact_name: item.contact_name || '',
            contact_phone: item.contact_phone || '',
            introducer: item.introducer || '',
            product_basket: baskets.length > 0 ? baskets : ['وارداتی'],
            status: item.status || 'در حال مذاکره',
            description: item.description || ''
        });
        setIsModalOpen(true);
    };

    const handleToggleBasket = (basketItem: string) => {
        setFormData(prev => {
            const exists = prev.product_basket.includes(basketItem);
            if (exists) {
                return { ...prev, product_basket: prev.product_basket.filter(b => b !== basketItem) };
            } else {
                return { ...prev, product_basket: [...prev.product_basket, basketItem] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            showToast('لطفا نام نمایشگاه را وارد کنید', 'error');
            return;
        }

        const payload = {
            ...formData,
            product_basket: formData.product_basket.join(', ')
        };

        setIsSubmitting(true);
        try {
            if (editingShowroom) {
                await updateCollaboration(editingShowroom.id, payload);
                showToast('اطلاعات نمایشگاه با موفقیت ویرایش شد', 'success');
            } else {
                await createCollaboration(payload);
                showToast('نمایشگاه همکار جدید با موفقیت ثبت شد', 'success');
            }
            setIsModalOpen(false);
            await fetchData();
        } catch (err) {
            showToast('خطا در ذخیره اطلاعات نمایشگاه', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!window.confirm('آیا از حذف این نمایشگاه همکار اطمینان دارید؟')) return;
        try {
            await deleteCollaboration(id);
            showToast('نمایشگاه با موفقیت حذف شد', 'success');
            setShowrooms(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            showToast('خطا در حذف نمایشگاه همکار', 'error');
        }
    };

    // Filter staff users (admin or lower access level)
    const filteredStaffUsers = useMemo(() => {
        return staffUsers.filter(u => {
            const level = u.userLevel ?? u.permission_level ?? 1;
            // Admin or lower (level <= 10)
            return level <= 10;
        });
    }, [staffUsers]);

    const filteredShowrooms = useMemo(() => {
        return showrooms.filter(item => {
            if (statusFilter !== 'all' && item.status !== statusFilter) return false;
            if (basketFilter !== 'all') {
                const itemBaskets = Array.isArray(item.product_basket) 
                    ? item.product_basket.join(',') 
                    : (item.product_basket || '');
                if (!itemBaskets.includes(basketFilter)) return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = (item.name || '').toLowerCase().includes(q);
                const matchContact = (item.contact_name || '').toLowerCase().includes(q);
                const matchPhone = (item.phone || '').toLowerCase().includes(q);
                const matchIntroducer = (item.introducer || '').toLowerCase().includes(q);
                if (!matchName && !matchContact && !matchPhone && !matchIntroducer) return false;
            }
            return true;
        });
    }, [showrooms, statusFilter, basketFilter, searchQuery]);

    const stats = useMemo(() => {
        const total = showrooms.length;
        const active = showrooms.filter(s => s.status === 'در حال همکاری').length;
        const negotiating = showrooms.filter(s => s.status === 'در حال مذاکره').length;
        const stopped = showrooms.filter(s => s.status === 'توقف همکاری').length;
        return { total, active, negotiating, stopped };
    }, [showrooms]);

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-16">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-500/20">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <Store className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black">مدیریت نمایشگاه‌های همکار</h1>
                            <span className="bg-indigo-500/30 text-indigo-300 text-xs font-bold px-3 py-0.5 rounded-full border border-indigo-500/40">
                                شبکه همکاران
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            ثبت، پیگیری و مدیریت اطلاعات نمایشگاه‌های خودرو همکار، سبد محصولات چندگانه و معرف‌های سیستم
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={fetchData}
                        disabled={loading}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
                        title="بارگذاری مجدد"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>بروزرسانی</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="flex-1 md:flex-initial px-5 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>ثبت نمایشگاه جدید</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Store className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[11px] text-slate-400 font-bold">کل نمایشگاه‌ها</div>
                        <div className="text-lg font-black text-slate-800 dark:text-white">{stats.total}</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[11px] text-slate-400 font-bold">در حال همکاری</div>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.active}</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[11px] text-slate-400 font-bold">در حال مذاکره</div>
                        <div className="text-lg font-black text-amber-600 dark:text-amber-400">{stats.negotiating}</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[11px] text-slate-400 font-bold">توقف همکاری</div>
                        <div className="text-lg font-black text-rose-600 dark:text-rose-400">{stats.stopped}</div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:w-80">
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="جستجو نام نمایشگاه، رابط، تلفن یا معرف..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">وضعیت:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:outline-hidden"
                        >
                            <option value="all">همه وضعیت‌ها</option>
                            {COLLAB_STATUSES.map(s => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">سبد محصولات:</span>
                        <select
                            value={basketFilter}
                            onChange={(e) => setBasketFilter(e.target.value)}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:outline-hidden"
                        >
                            <option value="all">همه سبدها</option>
                            {PRODUCT_BASKETS.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Showrooms Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-3">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-xs font-bold text-slate-500">در حال دریافت لیست نمایشگاه‌های همکار...</p>
                </div>
            ) : filteredShowrooms.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
                    <Store className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">هیچ نمایشگاه همکاری یافت نشد</h3>
                    <p className="text-xs text-slate-500">می‌توانید با استفاده از دکمه ثبت نمایشگاه جدید، مورد جدیدی اضافه کنید.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredShowrooms.map(item => {
                        const statusObj = COLLAB_STATUSES.find(s => s.key === item.status) || COLLAB_STATUSES[1];
                        return (
                            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black shrink-0">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 dark:text-white text-base">
                                                    {item.name}
                                                </h3>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {Array.isArray(item.product_basket) ? (
                                                        item.product_basket.map((b: string) => (
                                                            <span key={b} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200/50">
                                                                {b}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        (item.product_basket || '').split(',').map((b: string) => b.trim()).filter(Boolean).map((b: string) => (
                                                            <span key={b} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200/50">
                                                                {b}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${statusObj.color}`}>
                                            {item.status || 'در حال مذاکره'}
                                        </span>
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                        {item.phone && (
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                <span className="font-mono font-bold">{item.phone}</span>
                                            </div>
                                        )}
                                        {item.address && (
                                            <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{item.address}</span>
                                            </div>
                                        )}
                                        {item.contact_name && (
                                            <div className="flex items-center justify-between pt-1 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl">
                                                <span className="text-slate-400">رابط:</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                                    {item.contact_name} {item.contact_phone ? `(${item.contact_phone})` : ''}
                                                </span>
                                            </div>
                                        )}
                                        {item.introducer && (
                                            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300">
                                                <span className="text-slate-400">معرف:</span>
                                                <span className="font-bold">{item.introducer}</span>
                                            </div>
                                        )}
                                        {item.description && (
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 italic line-clamp-2">
                                                توضیح: {item.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEditModal(item)}
                                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>ویرایش</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item.id)}
                                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>حذف</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-850 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center">
                                    <Store className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-slate-800 dark:text-white text-base">
                                    {editingShowroom ? 'ویرایش اطلاعات نمایشگاه همکار' : 'ثبت نمایشگاه همکار جدید'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 space-y-4 pr-1">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300">نام نمایشگاه *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: نمایشگاه اتومبیل پایتخت"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-700 dark:text-slate-300">تلفن نمایشگاه</label>
                                    <input
                                        type="text"
                                        placeholder="مثال: 02122334455"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-700 dark:text-slate-300">وضعیت همکاری</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
                                    >
                                        {COLLAB_STATUSES.map(s => (
                                            <option key={s.key} value={s.key}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Multi-select Product Basket Checkboxes */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300">سبد محصولات (انتخاب چندگانه)</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    {PRODUCT_BASKETS.map(basketItem => {
                                        const isSelected = formData.product_basket.includes(basketItem);
                                        return (
                                            <button
                                                key={basketItem}
                                                type="button"
                                                onClick={() => handleToggleBasket(basketItem)}
                                                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-right ${
                                                    isSelected 
                                                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                                                    isSelected ? 'bg-white text-rose-600 border-white' : 'border-slate-400 bg-transparent'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                                <span>{basketItem}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300">آدرس</label>
                                <textarea
                                    rows={2}
                                    placeholder="آدرس دقیق نمایشگاه..."
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-700 dark:text-slate-300">نام رابط</label>
                                    <input
                                        type="text"
                                        placeholder="نام شخص رابط"
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-700 dark:text-slate-300">شماره رابط</label>
                                    <input
                                        type="text"
                                        placeholder="مثال: 09123456789"
                                        value={formData.contact_phone}
                                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300">معرف (انتخاب از پرسنل / ادمین)</label>
                                <select
                                    value={formData.introducer}
                                    onChange={(e) => setFormData({ ...formData, introducer: e.target.value })}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
                                >
                                    <option value="">انتخاب معرف از پرسنل و ادمین‌ها...</option>
                                    {filteredStaffUsers.map((u: StaffUser) => {
                                        const name = u.fullName || u.full_name || u.username;
                                        const roleBadge = u.roleTitle || u.role || '';
                                        return (
                                            <option key={u.id} value={name}>
                                                {name} {roleBadge ? `(${roleBadge})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300">توضیح نوع همکاری</label>
                                <textarea
                                    rows={3}
                                    placeholder="توضیحات تکمیلی پیرامون توافقات، شرایط همکاری و..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>{editingShowroom ? 'ذخیره تغییرات' : 'ثبت نمایشگاه'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollabShowroomsPage;
