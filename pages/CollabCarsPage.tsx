import React, { useState, useEffect, useMemo } from 'react';
import { 
    Car as CarIcon, Plus, Search, MapPin, Phone, Trash2, Edit2, X, Check, 
    Filter, Layers, ShieldCheck, Tag, Calendar, Palette, Building2, Loader2, RefreshCw
} from 'lucide-react';
import { CollaborationCar, CollaborationShowroom, Car as CatalogCar } from '../types';
import { getCollabCars, createCollabCar, updateCollabCar, deleteCollabCar, getCollaborations, getCars } from '../services/api';

export const CollabCarsPage: React.FC = () => {
    const [cars, setCars] = useState<CollaborationCar[]>([]);
    const [showrooms, setShowrooms] = useState<CollaborationShowroom[]>([]);
    const [catalogCars, setCatalogCars] = useState<CatalogCar[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedShowroomFilter, setSelectedShowroomFilter] = useState<string>('all');
    const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');

    // Modal state
    const [showModal, setShowModal] = useState<boolean>(false);
    const [editingCar, setEditingCar] = useState<CollaborationCar | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        car_name: '',
        brand: '',
        model: '',
        year: new Date().getFullYear().toString(),
        color: '',
        body_status: 'سالم و بی‌رنگ',
        inspection_status: 'تایید شده',
        showroom_name: '',
        showroom_id: '',
        price: '',
        mileage: '',
        description: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [carsData, showroomsData, catalogData] = await Promise.all([
                getCollabCars(),
                getCollaborations(),
                getCars()
            ]);
            setCars(carsData);
            setShowrooms(showroomsData);
            setCatalogCars(catalogData);
        } catch (error) {
            showToast('خطا در دریافت اطلاعات موجودی خودروهای همکار', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const showToast = (text: string, type: 'success' | 'error') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleOpenAdd = () => {
        setEditingCar(null);
        setFormData({
            car_name: '',
            brand: '',
            model: '',
            year: new Date().getFullYear().toString(),
            color: '',
            body_status: 'سالم و بی‌رنگ',
            inspection_status: 'تایید شده',
            showroom_name: showrooms[0]?.name || '',
            showroom_id: showrooms[0]?.id || '',
            price: '',
            mileage: '',
            description: ''
        });
        setShowModal(true);
    };

    const handleOpenEdit = (car: CollaborationCar) => {
        setEditingCar(car);
        setFormData({
            car_name: car.car_name || '',
            brand: car.brand || '',
            model: car.model || '',
            year: car.year?.toString() || '',
            color: car.color || '',
            body_status: car.body_status || 'سالم و بی‌رنگ',
            inspection_status: car.inspection_status || 'تایید شده',
            showroom_name: car.showroom_name || '',
            showroom_id: car.showroom_id || '',
            price: car.price?.toString() || '',
            mileage: car.mileage?.toString() || '',
            description: car.description || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.car_name || !formData.brand || !formData.showroom_name) {
            showToast('لطفاً فیلدهای ضروری (نام خودرو، برند و نام نمایشگاه) را از کاتالوگ انتخاب کنید.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            if (editingCar) {
                await updateCollabCar(editingCar.id, formData);
                showToast('خودروی همکار با موفقیت ویرایش شد.', 'success');
            } else {
                await createCollabCar(formData);
                showToast('خودروی جدید به موجودی همکار اضافه شد.', 'success');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            showToast('خطا در ذخیره اطلاعات خودروی همکار', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!window.confirm('آیا از حذف این خودرو از موجودی همکار اطمینان دارید؟')) return;
        try {
            await deleteCollabCar(id);
            showToast('خودرو با موفقیت حذف شد.', 'success');
            fetchData();
        } catch (error) {
            showToast('خطا در حذف خودرو', 'error');
        }
    };

    // Catalog brands and cars for selection
    const catalogBrands = useMemo(() => {
        const set = new Set<string>();
        catalogCars.forEach(c => c.brand && set.add(c.brand));
        return Array.from(set);
    }, [catalogCars]);

    const availableCatalogCarsForBrand = useMemo(() => {
        if (!formData.brand) return catalogCars;
        return catalogCars.filter(c => c.brand === formData.brand);
    }, [catalogCars, formData.brand]);

    const brands = useMemo(() => {
        const set = new Set<string>();
        cars.forEach(c => c.brand && set.add(c.brand));
        return Array.from(set);
    }, [cars]);

    const filteredCars = useMemo(() => {
        return cars.filter(car => {
            const matchesSearch = 
                (car.car_name && car.car_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (car.brand && car.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (car.model && car.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (car.showroom_name && car.showroom_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (car.color && car.color.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesShowroom = selectedShowroomFilter === 'all' || car.showroom_name === selectedShowroomFilter;
            const matchesBrand = selectedBrandFilter === 'all' || car.brand === selectedBrandFilter;

            return matchesSearch && matchesShowroom && matchesBrand;
        });
    }, [cars, searchTerm, selectedShowroomFilter, selectedBrandFilter]);

    return (
        <div className="space-y-6 pb-12">
            {/* Toast Notification */}
            {toastMessage && (
                <div className={`fixed top-6 left-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-medium flex items-center space-x-3 space-x-reverse transition-all animate-bounce ${
                    toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                    <span>{toastMessage.text}</span>
                </div>
            )}

            {/* Header / Title Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center space-x-2 space-x-reverse bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-indigo-500/30">
                        <CarIcon className="w-4 h-4" />
                        <span>شبکه فروش و موجودی شرکا</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">موجودی خودروهای نمایشگاه‌های همکار</h1>
                    <p className="text-slate-300 text-sm mt-2 max-w-2xl">
                        مدیریت و مشاهده آنی خودروهای موجود در نمایشگاه‌های همکار سراسر کشور به همراه مشخصات فنی، وضعیت بدنه، کارشناسی و نمایشگاه ارائه‌دهنده.
                    </p>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse w-full md:w-auto justify-end">
                    <button 
                        onClick={fetchData}
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition border border-slate-700 flex items-center justify-center"
                        title="بروزرسانی لیست"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={handleOpenAdd}
                        className="flex-1 md:flex-initial px-6 py-3 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 space-x-reverse transition"
                    >
                        <Plus className="w-5 h-5" />
                        <span>ثبت خودروی جدید همکار</span>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:w-96">
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="جستجو بر اساس نام خودرو، برند، رنگ یا نمایشگاه..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pr-11 pl-4 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <select 
                            value={selectedShowroomFilter}
                            onChange={(e) => setSelectedShowroomFilter(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        >
                            <option value="all">همه نمایشگاه‌ها</option>
                            {showrooms.map(sh => (
                                <option key={sh.id} value={sh.name}>{sh.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Tag className="w-4 h-4 text-slate-400" />
                        <select 
                            value={selectedBrandFilter}
                            onChange={(e) => setSelectedBrandFilter(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        >
                            <option value="all">همه برندها</option>
                            {brands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Cars List / Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-slate-400 font-medium">در حال دریافت موجودی خودروهای همکار...</p>
                </div>
            ) : filteredCars.length === 0 ? (
                <div className="bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-800 space-y-4">
                    <CarIcon className="w-16 h-16 text-slate-600 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-300">خودرویی یافت نشد</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                        هیچ خودرویی با فیلترهای انتخاب شده مطابقت ندارد یا هنوز خودرویی ثبت نشده است.
                    </p>
                    <button 
                        onClick={handleOpenAdd}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm inline-flex items-center space-x-2 space-x-reverse hover:bg-indigo-500 transition"
                    >
                        <Plus className="w-4 h-4" />
                        <span>ثبت اولین خودروی همکار</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCars.map((car) => (
                        <div key={car.id} className="bg-slate-900/90 rounded-3xl border border-slate-800 hover:border-indigo-500/50 shadow-xl transition overflow-hidden flex flex-col justify-between group">
                            <div className="p-6 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-block mb-2">
                                            {car.brand || 'سایر'} {car.model ? `- ${car.model}` : ''}
                                        </span>
                                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition">
                                            {car.car_name}
                                        </h3>
                                    </div>
                                    <div className="flex items-center space-x-1 space-x-reverse">
                                        <button 
                                            onClick={() => handleOpenEdit(car)}
                                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition"
                                            title="ویرایش"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(car.id)}
                                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-slate-800">
                                    <div className="flex items-center space-x-2 space-x-reverse text-slate-300">
                                        <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                                        <span>سال: <strong className="text-white">{car.year || 'نامشخص'}</strong></span>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse text-slate-300">
                                        <Palette className="w-4 h-4 text-rose-400 shrink-0" />
                                        <span>رنگ: <strong className="text-white">{car.color || 'نامشخص'}</strong></span>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse text-slate-300">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>بدنه: <strong className="text-white">{car.body_status || 'سالم'}</strong></span>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse text-slate-300">
                                        <Check className="w-4 h-4 text-amber-400 shrink-0" />
                                        <span>کارشناسی: <strong className="text-white">{car.inspection_status || 'تایید شده'}</strong></span>
                                    </div>
                                </div>

                                {car.price && (
                                    <div className="bg-slate-800/60 p-3 rounded-2xl flex items-center justify-between text-sm">
                                        <span className="text-slate-400">قیمت پیشنهادی:</span>
                                        <span className="text-emerald-400 font-extrabold">{car.price} تومان</span>
                                    </div>
                                )}

                                {car.description && (
                                    <p className="text-slate-400 text-xs line-clamp-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                                        {car.description}
                                    </p>
                                )}
                            </div>

                            <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                                <div className="flex items-center space-x-1.5 space-x-reverse">
                                    <Building2 className="w-4 h-4 text-indigo-400" />
                                    <span className="font-medium text-slate-300">{car.showroom_name || 'نمایشگاه همکار'}</span>
                                </div>
                                {car.mileage && (
                                    <span>کارکرد: {car.mileage} کیلومتر</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center space-x-2 space-x-reverse">
                                <CarIcon className="w-5 h-5 text-indigo-500" />
                                <span>{editingCar ? 'ویرایش مشخصات خودروی همکار' : 'ثبت خودروی جدید در موجودی همکار'}</span>
                            </h3>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-2 text-slate-400 hover:text-white rounded-xl transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">انتخاب برند خودرو از کاتالوگ *</label>
                                    <select 
                                        required
                                        value={formData.brand}
                                        onChange={(e) => {
                                            const brand = e.target.value;
                                            setFormData({ 
                                                ...formData, 
                                                brand: brand,
                                                car_name: '' // reset car name when brand changes
                                            });
                                        }}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">انتخاب برند از کاتالوگ...</option>
                                        {catalogBrands.map(brand => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">انتخاب نام خودرو از کاتالوگ *</label>
                                    <select 
                                        required
                                        value={formData.car_name}
                                        onChange={(e) => {
                                            const carName = e.target.value;
                                            const foundCatalogCar = catalogCars.find(c => c.name === carName);
                                            setFormData({ 
                                                ...formData, 
                                                car_name: carName,
                                                brand: foundCatalogCar ? foundCatalogCar.brand : formData.brand
                                            });
                                        }}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">انتخاب نام خودرو...</option>
                                        {availableCatalogCarsForBrand.map(catCar => (
                                            <option key={catCar.id} value={catCar.name}>{catCar.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">انتخاب نمایشگاه همکار *</label>
                                    <select 
                                        required
                                        value={formData.showroom_name}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            const found = showrooms.find(s => s.name === name);
                                            setFormData({ 
                                                ...formData, 
                                                showroom_name: name,
                                                showroom_id: found ? found.id : ''
                                            });
                                        }}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">انتخاب نمایشگاه...</option>
                                        {showrooms.map(sh => (
                                            <option key={sh.id} value={sh.name}>{sh.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">مدل خودرو</label>
                                    <input 
                                        type="text"
                                        placeholder="مثال: 1403"
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">سال ساخت</label>
                                    <input 
                                        type="text"
                                        placeholder="مثال: 1402"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">رنگ</label>
                                    <input 
                                        type="text"
                                        placeholder="مثال: سفید متالیک"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">وضعیت بدنه</label>
                                    <input 
                                        type="text"
                                        placeholder="مثال: سالم و بی‌رنگ / دو لکه رنگ"
                                        value={formData.body_status}
                                        onChange={(e) => setFormData({ ...formData, body_status: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">وضعیت کارشناسی</label>
                                    <input 
                                        type="text"
                                        placeholder="مثال: کارشناسی شده و تایید شده"
                                        value={formData.inspection_status}
                                        onChange={(e) => setFormData({ ...formData, inspection_status: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">قیمت (تومان)</label>
                                    <input 
                                        type="text"
                                        placeholder="مثال: 850,000,000"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">کارکرد (کیلومتر)</label>
                                    <input 
                                        type="text"
                                        placeholder="مثال: 12000"
                                        value={formData.mileage}
                                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">توضیحات تکمیلی و سایر مشخصات مهم</label>
                                <textarea 
                                    rows={3}
                                    placeholder="سایر جزئیات و آپشن‌های خودرو..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4 border-t border-slate-800">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                                >
                                    انصراف
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 space-x-reverse transition disabled:opacity-50"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>{editingCar ? 'ذخیره تغییرات' : 'ثبت خودرو'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
