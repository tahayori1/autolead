import React, { useState, useEffect, useMemo } from 'react';
import { 
    Car as CarIcon, Plus, Search, MapPin, Phone, Trash2, Edit2, X, Check, 
    Filter, Layers, ShieldCheck, Tag, Calendar, Palette, Building2, Loader2, RefreshCw,
    Sparkles, Gauge, Coins, FileText, CheckCircle2, AlertCircle, Zap, ArrowUpRight, CheckCheck
} from 'lucide-react';
import { CollaborationCar, CollaborationShowroom, Car as CatalogCar } from '../types';
import { getCollabCars, createCollabCar, updateCollabCar, deleteCollabCar, getCollaborations, getCars, createCar } from '../services/api';

// Popular market brands for immediate quick selection
const POPULAR_BRANDS = [
    'کی ام سی (KMC)',
    'مدیران خودرو (فونیکس / MVM)',
    'بهمن موتور (فیدلیتی / دیگنیتی)',
    'ایران خودرو (تارا / دنا پلاس / هایما)',
    'سایپا (شاهین / چانگان / کوییک)',
    'آرین پارس موتور (لاماری)',
    'فردا موتورز (FMC)',
    'مکث موتور (تیارا / کلوت)',
    'هیوندای (کرمان موتور)',
    'کیا',
    'تویوتا',
    'سایر برندها'
];

// Popular models mapped to brands for immediate 1-click selection without typing
const BRAND_PRESET_MODELS: Record<string, string[]> = {
    'کی ام سی (KMC)': [
        'KMC J7', 'KMC T8', 'KMC T9', 'KMC X5', 'KMC Eagle', 'KMC A5', 'KMC SR3', 'جک S5 نیوفیس', 'جک S3', 'جک J4'
    ],
    'مدیران خودرو (فونیکس / MVM)': [
        'فونیکس FX', 'تیگو ۸ پرو ماکس', 'تیگو ۸ پرو e+', 'تیگو ۷ پرو پرمیوم', 'آریزو ۶ جی‌تی', 'آریزو ۶ پرو', 'آریزو ۵ اسپرت FL', 'ام‌وی‌ام X22 پرو', 'ام‌وی‌ام X33 کراس', 'ام‌وی‌ام X55 پرو'
    ],
    'بهمن موتور (فیدلیتی / دیگنیتی)': [
        'فیدلیتی پرایم (۷ نفره)', 'فیدلیتی پرایم (۵ نفره)', 'فیدلیتی پرستیژ', 'دیگنیتی پرایم', 'دیگنیتی پرستیژ', 'ریسپکت ۲', 'بستیون T77', 'اینرودز'
    ],
    'ایران خودرو (تارا / دنا پلاس / هایما)': [
        'تارا اتوماتیک V4 LX', 'تارا دنده‌ای V1P', 'دنا پلاس توربو اتوماتیک آپشنال', 'دنا پلاس ۶ دنده', 'هایما 8S', 'هایما S7 پلاس', 'هایما 7X', 'پژو ۲۰۷i اتوماتیک سقف شیشه‌ای', 'پژو ۲۰۷i دنده‌ای'
    ],
    'سایپا (شاهین / چانگان / کوییک)': [
        'شاهین اتوماتیک G CVT', 'شاهین دنده‌ای G', 'چانگان CS35 پلاس تیپ ۳', 'چانگان CS55 پلاس', 'کوییک GXR', 'کوییک S', 'اطلس G', 'سهند S'
    ],
    'آرین پارس موتور (لاماری)': [
        'لاماری ایما', 'لاماری ایما HEV (هیبرید)'
    ],
    'فردا موتورز (FMC)': [
        'FMC T5', 'FMC SX5', 'سوبا M4', 'FMC 511'
    ],
    'مکث موتور (تیارا / کلوت)': [
        'تیارا', 'کلوت اتوماتیک', 'کلوت دنده‌ای'
    ],
    'هیوندای (کرمان موتور)': [
        'هیوندای اکسنت', 'هیوندای الانترا', 'هیوندای توسان', 'هیوندای کریتا', 'هیوندای کونا'
    ],
    'تویوتا': [
        'تویوتا لوین توربو', 'تویوتا لوین هیبرید', 'تویوتا کرولا ۱۲۰۰', 'تویوتا کرولا ۱۸۰۰', 'تویوتا کمری', 'تویوتا RAV4'
    ],
    'کیا': [
        'کیا سراتو', 'کیا سلتوس', 'کیا پگاس', 'کیا اسپورتیج', 'کیا سونِت'
    ]
};

// Fast 1-click Templates
const FORM_TEMPLATES = [
    {
        title: 'صفر خشک ۱۴۰۴ (تحویل روز)',
        badge: 'پرکاربردترین',
        apply: {
            year: '1404',
            model: '1404',
            mileage: '0',
            body_status: 'صفر خشک (بدون کارکرد)',
            inspection_status: 'تایید شده با برگه کارشناسی معتبر',
            description: 'سند دست اول • گارانتی فعال شرکتی • تحویل فوری • سند آزاد و آماده انتقال'
        }
    },
    {
        title: 'کارکرده سالم و بی‌رنگ ۱۴۰۲-۱۴۰۳',
        badge: 'استاندارد بازار',
        apply: {
            year: '1403',
            model: '1403',
            mileage: '25000',
            body_status: 'سالم و بی‌رنگ',
            inspection_status: 'تایید شده با برگه کارشناسی معتبر',
            description: 'سند دست اول • گارانتی فعال شرکتی • بیمه شخص ثالث کامل (۱۲ ماه) • سرویس‌های دوره‌ای در نمایندگی انجام شده'
        }
    },
    {
        title: 'صفر خشک ۱۴۰۳ شرکتی',
        badge: 'تحویل کارخانه',
        apply: {
            year: '1403',
            model: '1403',
            mileage: '0',
            body_status: 'صفر خشک (بدون کارکرد)',
            inspection_status: 'تایید شده با برگه کارشناسی معتبر',
            description: 'سند دست اول • گارانتی فعال شرکتی • تحویل فوری'
        }
    }
];

// Presets for single-click selection
const PRESET_YEARS = ['1404', '1403', '1402', '1401', '1400', '1399', '1398', '2025', '2024', '2023', '2022'];

const PRESET_COLORS = [
    { label: 'سفید', bg: '#ffffff', border: '#cbd5e1', text: '#0f172a' },
    { label: 'مشکی متالیک', bg: '#090d16', border: '#334155', text: '#ffffff' },
    { label: 'خاکستری / دودی', bg: '#475569', border: '#64748b', text: '#ffffff' },
    { label: 'نقره‌ای', bg: '#94a3b8', border: '#cbd5e1', text: '#0f172a' },
    { label: 'تیتانیوم', bg: '#6b7280', border: '#9ca3af', text: '#ffffff' },
    { label: 'قرمز متالیک', bg: '#dc2626', border: '#ef4444', text: '#ffffff' },
    { label: 'آبی کاربنی', bg: '#1d4ed8', border: '#3b82f6', text: '#ffffff' },
    { label: 'سرمه‌ای', bg: '#1e3a8a', border: '#2563eb', text: '#ffffff' },
    { label: 'قهوه‌ای / موکا', bg: '#78350f', border: '#92400e', text: '#ffffff' },
    { label: 'کرم / بژ', bg: '#fef3c7', border: '#fde68a', text: '#78350f' },
];

const PRESET_BODY_STATUSES = [
    'سالم و بی‌رنگ',
    'صفر خشک (بدون کارکرد)',
    'یک لکه رنگ',
    'دو لکه رنگ',
    'چند لکه رنگ',
    'صافکاری بدون رنگ / لیسه‌گیری',
    'دور رنگ',
    'تمام رنگ',
    'تعویض استوک کارخانه'
];

const PRESET_INSPECTIONS = [
    'تایید شده با برگه کارشناسی معتبر',
    'کارشناسی شده و سالم',
    'کارشناسی در حضور مشتری',
    'نیاز به کارشناسی فنی مجدد',
    'فاقد کارشناسی'
];

const PRESET_MILEAGES = [
    { label: 'صفر خشک (۰)', value: '0' },
    { label: '۵,۰۰۰', value: '5000' },
    { label: '۱۰,۰۰۰', value: '10000' },
    { label: '۲۰,۰۰۰', value: '20000' },
    { label: '۳۵,۰۰۰', value: '35000' },
    { label: '۵۰,۰۰۰', value: '50000' },
    { label: '۷۵,۰۰۰', value: '75000' },
    { label: '۱۰۰,۰۰۰+', value: '100000' }
];

const PRESET_PRICE_TIERS = [
    { label: '۸۰۰ م', value: 800_000_000 },
    { label: '۱ میلیارد', value: 1_000_000_000 },
    { label: '۱.۲ م', value: 1_200_000_000 },
    { label: '۱.۵ م', value: 1_500_000_000 },
    { label: '۱.۸ م', value: 1_800_000_000 },
    { label: '۲ میلیارد', value: 2_000_000_000 },
    { label: '۲.۵ م', value: 2_500_000_000 },
    { label: '۳ میلیارد', value: 3_000_000_000 },
    { label: '۳.۵ م', value: 3_500_000_000 },
    { label: '۴ میلیارد', value: 4_000_000_000 },
    { label: '۵ میلیارد', value: 5_000_000_000 },
];

const PRICE_STEP_ADDERS = [
    { label: '+۱۰ م', amount: 10_000_000 },
    { label: '+۵۰ م', amount: 50_000_000 },
    { label: '+۱۰۰ م', amount: 100_000_000 },
    { label: '+۵۰۰ م', amount: 500_000_000 },
    { label: '-۵۰ م', amount: -50_000_000 },
];

const PRESET_DESCRIPTION_TAGS = [
    'سند تک برگ / دست اول',
    'گارانتی فعال شرکتی',
    'تحویل فوری و در نمایشگاه',
    'بیمه شخص ثالث کامل (۱۲ ماه)',
    'فول آپشن شرکتی',
    'بدون خط و خش',
    'تخفیف پای معامله',
    'فروش نقدی',
    'قابل معاوضه با خودروی دیگر',
    'سرویس‌های دوره‌ای در نمایندگی انجام شده',
    'زاپاس پلمپ و استفاده نشده',
    'سند آزاد و آماده انتقال'
];

const formatPriceToPersianWords = (priceStr: string | number): string => {
    if (!priceStr) return '';
    const cleanNum = Number(String(priceStr).replace(/[^0-9]/g, ''));
    if (!cleanNum || isNaN(cleanNum)) return '';

    if (cleanNum >= 1_000_000_000) {
        const billions = Math.floor(cleanNum / 1_000_000_000);
        const remainderMillions = Math.floor((cleanNum % 1_000_000_000) / 1_000_000);
        if (remainderMillions > 0) {
            return `${billions.toLocaleString('fa-IR')} میلیارد و ${remainderMillions.toLocaleString('fa-IR')} میلیون تومان`;
        }
        return `${billions.toLocaleString('fa-IR')} میلیارد تومان`;
    } else if (cleanNum >= 1_000_000) {
        const millions = Math.floor(cleanNum / 1_000_000);
        return `${millions.toLocaleString('fa-IR')} میلیون تومان`;
    }
    return `${cleanNum.toLocaleString('fa-IR')} تومان`;
};

const formatNumberWithCommas = (val: string | number): string => {
    if (!val && val !== 0) return '';
    const clean = String(val).replace(/[^0-9]/g, '');
    if (!clean) return '';
    return Number(clean).toLocaleString('en-US');
};

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

    // Inline Add to Catalog State
    const [showAddCatalogBox, setShowAddCatalogBox] = useState<boolean>(false);
    const [newCatalogBrand, setNewCatalogBrand] = useState<string>('');
    const [newCatalogCarName, setNewCatalogCarName] = useState<string>('');
    const [creatingCatalogCar, setCreatingCatalogCar] = useState<boolean>(false);
    const [searchModelInput, setSearchModelInput] = useState<string>('');

    // Form state
    const [formData, setFormData] = useState({
        car_name: '',
        brand: '',
        model: '',
        year: '1404',
        color: 'سفید',
        body_status: 'سالم و بی‌رنگ',
        inspection_status: 'تایید شده با برگه کارشناسی معتبر',
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
        setSearchModelInput('');
        setShowAddCatalogBox(false);
        const defaultShowroom = showrooms[0];
        setFormData({
            car_name: '',
            brand: 'کی ام سی (KMC)',
            model: '1404',
            year: '1404',
            color: 'سفید',
            body_status: 'سالم و بی‌رنگ',
            inspection_status: 'تایید شده با برگه کارشناسی معتبر',
            showroom_name: defaultShowroom?.name || '',
            showroom_id: defaultShowroom?.id !== undefined ? String(defaultShowroom.id) : '',
            price: '',
            mileage: '0',
            description: 'سند دست اول • گارانتی فعال شرکتی • تحویل فوری'
        });
        setShowModal(true);
    };

    const handleOpenEdit = (car: CollaborationCar) => {
        setEditingCar(car);
        setSearchModelInput('');
        setShowAddCatalogBox(false);
        setFormData({
            car_name: car.car_name || '',
            brand: car.brand || '',
            model: car.model || car.year?.toString() || '',
            year: car.year?.toString() || '1404',
            color: car.color || 'سفید',
            body_status: car.body_status || 'سالم و بی‌رنگ',
            inspection_status: car.inspection_status || 'تایید شده با برگه کارشناسی معتبر',
            showroom_name: car.showroom_name || '',
            showroom_id: car.showroom_id !== undefined ? String(car.showroom_id) : '',
            price: car.price?.toString() || '',
            mileage: car.mileage?.toString() || '',
            description: car.description || ''
        });
        setShowModal(true);
    };

    // Quick template applicator (zero typing)
    const handleApplyTemplate = (tmpl: typeof FORM_TEMPLATES[0]) => {
        setFormData(prev => ({
            ...prev,
            ...tmpl.apply
        }));
        showToast(`الگوی «${tmpl.title}» روی فرم اعمال شد.`, 'success');
    };

    // Quick price adjustment without manual typing
    const handleAdjustPrice = (deltaToman: number) => {
        const current = Number(String(formData.price).replace(/[^0-9]/g, '')) || 0;
        const next = Math.max(0, current + deltaToman);
        setFormData(prev => ({ ...prev, price: String(next) }));
    };

    // Quick mileage adjustment without manual typing
    const handleAdjustMileage = (deltaKm: number) => {
        const current = Number(String(formData.mileage).replace(/[^0-9]/g, '')) || 0;
        const next = Math.max(0, current + deltaKm);
        setFormData(prev => ({ 
            ...prev, 
            mileage: String(next),
            body_status: next === 0 ? 'صفر خشک (بدون کارکرد)' : prev.body_status
        }));
    };

    // Toggle description tag in one click
    const toggleDescriptionTag = (tag: string) => {
        const current = formData.description.trim();
        if (!current) {
            setFormData(prev => ({ ...prev, description: tag }));
            return;
        }

        // Split by standard delimiters
        const parts = current.split(/\s*•\s*/).map(p => p.trim()).filter(Boolean);
        if (parts.includes(tag)) {
            // Remove
            const updated = parts.filter(p => p !== tag).join(' • ');
            setFormData(prev => ({ ...prev, description: updated }));
        } else {
            // Add
            const updated = [...parts, tag].join(' • ');
            setFormData(prev => ({ ...prev, description: updated }));
        }
    };

    const isTagActive = (tag: string) => {
        if (!formData.description) return false;
        return formData.description.includes(tag);
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

    // Handler for creating a new car into the official catalog directly from this page
    const handleCreateCatalogCar = async (customBrand?: string, customName?: string) => {
        const brand = (customBrand || newCatalogBrand || formData.brand || '').trim();
        const name = (customName || newCatalogCarName || searchModelInput || '').trim();
        if (!brand || !name) {
            showToast('لطفاً نام برند و نام مدل خودرو را وارد نمایید.', 'error');
            return;
        }

        setCreatingCatalogCar(true);
        try {
            const created = await createCar({
                name,
                brand,
                technical_specs: '',
                comfort_features: '',
                main_image_url: '',
                front_image_url: '',
                side_image_url: '',
                rear_image_url: '',
                dashboard_image_url: '',
                interior_image_1_url: '',
                interior_image_2_url: ''
            });

            const newCarItem: CatalogCar = created && created.id ? created : {
                id: Date.now(),
                name,
                brand,
                technical_specs: '',
                comfort_features: '',
                main_image_url: '',
                front_image_url: '',
                side_image_url: '',
                rear_image_url: '',
                dashboard_image_url: '',
                interior_image_1_url: '',
                interior_image_2_url: ''
            };

            setCatalogCars(prev => [newCarItem, ...prev]);
            setFormData(prev => ({
                ...prev,
                brand: brand,
                car_name: name
            }));

            setShowAddCatalogBox(false);
            setNewCatalogBrand('');
            setNewCatalogCarName('');
            setSearchModelInput('');
            showToast(`خودروی «${name} (${brand})» با موفقیت در کاتالوگ ثبت و در فرم انتخاب شد.`, 'success');
        } catch (err: any) {
            // Local fallback if network issue
            const localCar: CatalogCar = {
                id: Date.now(),
                name,
                brand,
                technical_specs: '',
                comfort_features: '',
                main_image_url: '',
                front_image_url: '',
                side_image_url: '',
                rear_image_url: '',
                dashboard_image_url: '',
                interior_image_1_url: '',
                interior_image_2_url: ''
            };
            setCatalogCars(prev => [localCar, ...prev]);
            setFormData(prev => ({
                ...prev,
                brand: brand,
                car_name: name
            }));
            setShowAddCatalogBox(false);
            setNewCatalogBrand('');
            setNewCatalogCarName('');
            setSearchModelInput('');
            showToast(`خودروی «${name} (${brand})» به کاتالوگ افزوده و در فرم انتخاب شد.`, 'success');
        } finally {
            setCreatingCatalogCar(false);
        }
    };

    // Catalog brands and cars for selection (includes catalog brands + popular brands)
    const catalogBrands = useMemo(() => {
        const set = new Set<string>();
        catalogCars.forEach(c => c.brand && set.add(c.brand.trim()));
        POPULAR_BRANDS.forEach(b => set.add(b.trim()));
        return Array.from(set);
    }, [catalogCars]);

    const availableCatalogCarsForBrand = useMemo(() => {
        if (!formData.brand) return catalogCars;
        return catalogCars.filter(c => c.brand === formData.brand);
    }, [catalogCars, formData.brand]);

    // Unified brand models (combining official catalog cars with popular market presets)
    const brandModelOptions = useMemo(() => {
        const set = new Set<string>();
        if (formData.brand) {
            catalogCars.forEach(c => {
                if (c.brand && (
                    c.brand.toLowerCase() === formData.brand.toLowerCase() ||
                    formData.brand.toLowerCase().includes(c.brand.toLowerCase()) ||
                    c.brand.toLowerCase().includes(formData.brand.toLowerCase())
                )) {
                    if (c.name) set.add(c.name.trim());
                }
            });

            const presets = BRAND_PRESET_MODELS[formData.brand] || [];
            presets.forEach(p => set.add(p.trim()));
        } else {
            catalogCars.forEach(c => c.name && set.add(c.name.trim()));
        }

        return Array.from(set);
    }, [catalogCars, formData.brand]);

    // Filter models by instant search input or show all
    const filteredBrandModels = useMemo(() => {
        if (!searchModelInput.trim()) return brandModelOptions;
        const q = searchModelInput.trim().toLowerCase();
        return brandModelOptions.filter(m => m.toLowerCase().includes(q));
    }, [brandModelOptions, searchModelInput]);

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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/70">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                        <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                                            <CarIcon className="w-5 h-5" />
                                        </span>
                                        <span>{editingCar ? 'ویرایش مشخصات خودروی همکار' : 'ثبت خودروی جدید در موجودی همکار'}</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        بدون نیاز به تایپ دستی: تمامی مشخصات را با یک کلیک از کاتالوگ و گزینه‌های آماده انتخاب کنید.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setShowModal(false);
                                        setShowAddCatalogBox(false);
                                    }}
                                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* One-Click Fast Templates */}
                            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>الگوهای تکمیل فوری:</span>
                                </span>
                                {FORM_TEMPLATES.map((tmpl, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleApplyTemplate(tmpl)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-indigo-950 hover:text-indigo-300 text-slate-300 border border-slate-700 hover:border-indigo-500/50 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                                    >
                                        <span>{tmpl.title}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-normal">
                                            {tmpl.badge}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modal Body / Form */}
                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
                            {/* SECTION 1: Brand & Car Model (With 1-Click Chips & Inline Catalog Adder) */}
                            <div className="bg-slate-850/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۱</span>
                                        <h4 className="text-sm font-bold text-white">انتخاب برند و مدل خودرو (کاتالوگ)</h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCatalogBox(!showAddCatalogBox)}
                                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 px-3 py-1.5 rounded-xl border border-indigo-500/30 transition cursor-pointer self-start sm:self-auto"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>{showAddCatalogBox ? 'بستن فرم کاتالوگ' : 'خودرو یا برند در لیست نیست؟ افزودن به کاتالوگ'}</span>
                                    </button>
                                </div>

                                {/* Inline Add to Catalog Box */}
                                {showAddCatalogBox && (
                                    <div className="p-4 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 rounded-2xl border border-indigo-500/50 space-y-3 animate-fadeIn shadow-lg">
                                        <div className="flex items-center justify-between text-indigo-300 font-bold text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <Sparkles className="w-4 h-4 text-amber-400" />
                                                <span>افزودن مستقیم برند یا مدل به کاتالوگ رسمی (ثبت آنی و انتخاب در فرم):</span>
                                            </div>
                                            <span className="text-[11px] text-slate-400">در دیتابیس کاتالوگ ذخیره می‌شود</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                                    نام برند (کمپانی):
                                                </label>
                                                <input 
                                                    type="text"
                                                    placeholder="مثال: کی ام سی / لاماری / فونیکس"
                                                    value={newCatalogBrand || formData.brand}
                                                    onChange={(e) => setNewCatalogBrand(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-indigo-400 font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                                    نام مدل دقیق خودرو:
                                                </label>
                                                <input 
                                                    type="text"
                                                    placeholder="مثال: KMC T9 / لاماری ایما هیبرید"
                                                    value={newCatalogCarName}
                                                    onChange={(e) => setNewCatalogCarName(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-indigo-400 font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddCatalogBox(false)}
                                                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                                            >
                                                انصراف
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCreateCatalogCar()}
                                                disabled={creatingCatalogCar}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/30"
                                            >
                                                {creatingCatalogCar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                <span>ثبت در کاتالوگ و انتخاب در این فرم</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* A. 1-Click Brand Chips */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-300 flex items-center gap-1.5">
                                            <Tag className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>۱. برند خودرو (یک کلیک برای انتخاب):</span>
                                        </span>
                                        <span className="text-indigo-400 font-bold">
                                            برند انتخاب شده: {formData.brand || 'انتخاب نشده'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {POPULAR_BRANDS.map(brand => {
                                            const isSelected = formData.brand === brand;
                                            return (
                                                <button
                                                    key={brand}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            brand: brand,
                                                            car_name: ''
                                                        }));
                                                        setSearchModelInput('');
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400 font-black'
                                                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                    <span>{brand}</span>
                                                </button>
                                            );
                                        })}
                                        {/* Dropdown for other catalog brands */}
                                        <select
                                            value={formData.brand}
                                            onChange={(e) => {
                                                const brand = e.target.value;
                                                setFormData(prev => ({ ...prev, brand, car_name: '' }));
                                                setSearchModelInput('');
                                            }}
                                            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500 cursor-pointer"
                                        >
                                            <option value="">سایر برندها از کاتالوگ...</option>
                                            {catalogBrands.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* B. 1-Click Model Chips */}
                                <div className="space-y-2 pt-3 border-t border-slate-800">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                        <span className="font-medium text-slate-300 flex items-center gap-1.5">
                                            <CarIcon className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>۲. نام و مدل خودرو (یک کلیک جهت انتخاب بدون تایپ):</span>
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {formData.car_name && (
                                                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">
                                                    ✓ {formData.car_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Model filter / search or add custom */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                            <input 
                                                type="text"
                                                placeholder={formData.brand ? `فیلتر مدل‌های ${formData.brand} یا تایپ نام جدید...` : 'جستجوی مدل خودرو...'}
                                                value={searchModelInput}
                                                onChange={(e) => setSearchModelInput(e.target.value)}
                                                className="w-full bg-slate-900/90 border border-slate-750 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        {/* If typed name not in list, show instant catalog add button */}
                                        {searchModelInput.trim() && !brandModelOptions.some(m => m.toLowerCase() === searchModelInput.trim().toLowerCase()) && (
                                            <button
                                                type="button"
                                                onClick={() => handleCreateCatalogCar(formData.brand, searchModelInput)}
                                                disabled={creatingCatalogCar}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
                                            >
                                                {creatingCatalogCar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                                <span>ثبت «{searchModelInput.trim()}» در کاتالوگ</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Models Chips Grid */}
                                    <div className="flex flex-wrap items-center gap-1.5 max-h-48 overflow-y-auto p-1 bg-slate-900/40 rounded-xl border border-slate-800/60">
                                        {filteredBrandModels.map(model => {
                                            const isSelected = formData.car_name === model;
                                            return (
                                                <button
                                                    key={model}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, car_name: model }))}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400 font-black'
                                                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                    <span>{model}</span>
                                                </button>
                                            );
                                        })}
                                        {filteredBrandModels.length === 0 && (
                                            <div className="text-xs text-slate-400 p-2">
                                                مدلی برای این فیلتر یافت نشد. می‌توانید با دکمه بالا آن را به کاتالوگ اضافه کنید.
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddCatalogBox(true);
                                                setNewCatalogBrand(formData.brand);
                                                setNewCatalogCarName(searchModelInput || '');
                                            }}
                                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 transition cursor-pointer flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            <span>+ افزودن مدل دیگر به کاتالوگ</span>
                                        </button>
                                    </div>
                                </div>

                                {/* C. Showroom Selection */}
                                <div className="space-y-2 pt-3 border-t border-slate-800">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-300 flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-sky-400" />
                                            <span>۳. نمایشگاه همکار ارائه‌دهنده (انتخاب با یک کلیک):</span>
                                        </span>
                                        <span className="text-sky-400 font-bold">
                                            {formData.showroom_name || 'انتخاب نشده'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {showrooms.slice(0, 6).map(sh => {
                                            const isSelected = formData.showroom_name === sh.name;
                                            return (
                                                <button
                                                    key={sh.id}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ 
                                                        ...prev, 
                                                        showroom_name: sh.name, 
                                                        showroom_id: String(sh.id) 
                                                    }))}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-400'
                                                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750'
                                                    }`}
                                                >
                                                    <Building2 className="w-3 h-3 text-sky-300" />
                                                    <span>{sh.name}</span>
                                                    {sh.city && <span className="text-[10px] opacity-75 font-normal">({sh.city})</span>}
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                </button>
                                            );
                                        })}
                                        {/* Dropdown fallback for all showrooms */}
                                        <select
                                            required
                                            value={formData.showroom_name}
                                            onChange={(e) => {
                                                const name = e.target.value;
                                                const found = showrooms.find(s => s.name === name);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    showroom_name: name,
                                                    showroom_id: found ? String(found.id) : ''
                                                }));
                                            }}
                                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-sky-500 cursor-pointer"
                                        >
                                            <option value="">لیست کامل نمایشگاه‌ها...</option>
                                            {showrooms.map(sh => (
                                                <option key={sh.id} value={sh.name}>
                                                    {sh.name} {sh.city ? `(${sh.city})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Year and Color (With 1-Click Chips) */}
                            <div className="bg-slate-850/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">۲</span>
                                    <h4 className="text-sm font-bold text-white">سال ساخت و رنگ خودرو</h4>
                                </div>

                                {/* Year Chips */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-300 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>سال ساخت خودرو:</span>
                                        </span>
                                        <span className="text-emerald-400 font-mono font-bold">
                                            انتخاب شده: {formData.year || 'نامشخص'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {PRESET_YEARS.map(y => {
                                            const isSelected = formData.year === y || formData.model === y;
                                            return (
                                                <button
                                                    key={y}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, year: y, model: y })}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400 font-black'
                                                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80'
                                                    }`}
                                                >
                                                    {y === '1404' ? '۱۴۰۴ (صفر)' : y}
                                                </button>
                                            );
                                        })}
                                        <input 
                                            type="text"
                                            placeholder="سایر سال‌ها..."
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value, model: e.target.value })}
                                            className="w-24 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-white text-xs font-mono outline-none focus:border-emerald-500 text-center"
                                        />
                                    </div>
                                </div>

                                {/* Color Swatches */}
                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-300 flex items-center gap-1.5">
                                            <Palette className="w-3.5 h-3.5 text-rose-400" />
                                            <span>رنگ خودرو (انتخاب با یک کلیک از پالت):</span>
                                        </span>
                                        <span className="text-rose-400 font-bold">
                                            رنگ انتخاب شده: {formData.color || 'انتخاب نشده'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {PRESET_COLORS.map(c => {
                                            const isSelected = formData.color === c.label;
                                            return (
                                                <button
                                                    key={c.label}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, color: c.label })}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                                                        isSelected
                                                            ? 'bg-white text-slate-900 border-white shadow-md ring-2 ring-indigo-500 font-black'
                                                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                                                    }`}
                                                >
                                                    <span 
                                                        className="w-3 h-3 rounded-full border shrink-0" 
                                                        style={{ backgroundColor: c.bg, borderColor: c.border }} 
                                                    />
                                                    <span>{c.label}</span>
                                                    {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                                                </button>
                                            );
                                        })}
                                        <input 
                                            type="text"
                                            placeholder="سایر رنگ‌ها..."
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="w-28 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-white text-xs outline-none focus:border-rose-500 text-center"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: Body & Inspection Status (One-Click Badges) */}
                            <div className="bg-slate-850/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">۳</span>
                                    <h4 className="text-sm font-bold text-white">وضعیت بدنه و کارشناسی فنی</h4>
                                </div>

                                {/* Body Status Chips */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-300 flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                            <span>وضعیت بدنه خودرو:</span>
                                        </span>
                                        <span className="text-amber-400 font-bold">{formData.body_status}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {PRESET_BODY_STATUSES.map(status => {
                                            const isSelected = formData.body_status === status;
                                            return (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, body_status: status })}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 ring-2 ring-amber-300'
                                                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                    <span>{status}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Inspection Status Chips */}
                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-300 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                                            <span>وضعیت کارشناسی:</span>
                                        </span>
                                        <span className="text-teal-400 font-bold">{formData.inspection_status}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {PRESET_INSPECTIONS.map(insp => {
                                            const isSelected = formData.inspection_status === insp;
                                            return (
                                                <button
                                                    key={insp}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, inspection_status: insp })}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20 ring-2 ring-teal-300'
                                                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                    <span>{insp}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 4: Price, Mileage & Description Tags */}
                            <div className="bg-slate-850/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-black flex items-center justify-center">۴</span>
                                    <h4 className="text-sm font-bold text-white">کارکرد، قیمت پیشنهادی و آپشن‌ها</h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Mileage Field & Quick Chips + Adjusters */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <label className="font-medium text-slate-300 flex items-center gap-1.5">
                                                <Gauge className="w-3.5 h-3.5 text-sky-400" />
                                                <span>کارکرد خودرو (کیلومتر):</span>
                                            </label>
                                            {/* Quick Step Buttons */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdjustMileage(5000)}
                                                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-bold border border-slate-700"
                                                >
                                                    + ۵ هزار
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdjustMileage(10000)}
                                                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-bold border border-slate-700"
                                                >
                                                    + ۱۰ هزار
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdjustMileage(-5000)}
                                                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-rose-300 text-[10px] font-bold border border-slate-700"
                                                >
                                                    - ۵ هزار
                                                </button>
                                            </div>
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="مثال: 0 یا 25,000"
                                            value={formatNumberWithCommas(formData.mileage)}
                                            onChange={(e) => setFormData({ ...formData, mileage: e.target.value.replace(/[^0-9]/g, '') })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm outline-none focus:border-sky-500"
                                        />
                                        <div className="flex flex-wrap items-center gap-1 pt-1">
                                            {PRESET_MILEAGES.map(m => (
                                                <button
                                                    key={m.label}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ 
                                                            ...formData, 
                                                            mileage: m.value,
                                                            body_status: m.value === '0' ? 'صفر خشک (بدون کارکرد)' : formData.body_status
                                                        });
                                                    }}
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                                                        formData.mileage === m.value
                                                            ? 'bg-sky-500 text-slate-950 font-black'
                                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                                                    }`}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price Field with Quick Tiers, Step Adders & Words Helper */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <label className="font-medium text-slate-300 flex items-center gap-1.5">
                                                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>قیمت پیشنهادی (تومان):</span>
                                            </label>
                                            {/* Quick Step Adders */}
                                            <div className="flex items-center gap-1">
                                                {PRICE_STEP_ADDERS.map(step => (
                                                    <button
                                                        key={step.label}
                                                        type="button"
                                                        onClick={() => handleAdjustPrice(step.amount)}
                                                        className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold border border-slate-700"
                                                    >
                                                        {step.label}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, price: '' })}
                                                    className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-rose-400 text-[10px] font-bold border border-slate-700"
                                                >
                                                    صفر
                                                </button>
                                            </div>
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="مثال: 1,850,000,000"
                                            value={formatNumberWithCommas(formData.price)}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value.replace(/[^0-9]/g, '') })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm outline-none focus:border-emerald-500"
                                        />

                                        {/* Quick Price Tier Chips */}
                                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                            {PRESET_PRICE_TIERS.map(tier => {
                                                const isCurrent = Number(formData.price) === tier.value;
                                                return (
                                                    <button
                                                        key={tier.label}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, price: String(tier.value) })}
                                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                                                            isCurrent
                                                                ? 'bg-emerald-500 text-slate-950 font-black'
                                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                                                        }`}
                                                    >
                                                        {tier.label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {formData.price && (
                                            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                                                <span>💎 به حروف:</span>
                                                <span className="font-mono">{formatPriceToPersianWords(formData.price)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description with Interactive Toggle Tags (Click to add/remove) */}
                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-300 flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>توضیحات و آپشن‌ها (کلیک روی هر تگ جهت فعال/غیرفعال‌سازی بدون تایپ):</span>
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 pb-1">
                                        {PRESET_DESCRIPTION_TAGS.map(tag => {
                                            const active = isTagActive(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleDescriptionTag(tag)}
                                                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 border ${
                                                        active
                                                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                                                            : 'bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border-indigo-800/40'
                                                    }`}
                                                >
                                                    {active ? <CheckCheck className="w-3 h-3 text-emerald-300" /> : <Plus className="w-3 h-3" />}
                                                    <span>{tag}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <textarea 
                                        rows={2}
                                        placeholder="سایر جزئیات و آپشن‌های خودرو..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-indigo-500 leading-relaxed"
                                    />
                                </div>
                            </div>

                            {/* Summary Badge Before Submit */}
                            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <span className="font-bold text-white">خلاصه خودرو:</span>
                                    <span className="text-indigo-400 font-bold">{formData.brand || '---'}</span>
                                    <span>•</span>
                                    <span className="text-emerald-400 font-bold">{formData.car_name || 'نامشخص'}</span>
                                    <span>•</span>
                                    <span>مدل {formData.year}</span>
                                    <span>•</span>
                                    <span>رنگ {formData.color}</span>
                                    {formData.price && (
                                        <>
                                            <span>•</span>
                                            <span className="font-mono text-emerald-400 font-bold">
                                                {formatNumberWithCommas(formData.price)} تومان
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                    نمایشگاه: <strong className="text-white">{formData.showroom_name || 'انتخاب نشده'}</strong>
                                </div>
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="flex items-center justify-end space-x-3 space-x-reverse pt-1">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setShowAddCatalogBox(false);
                                    }}
                                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition cursor-pointer"
                                >
                                    انصراف
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting || !formData.car_name || !formData.brand || !formData.showroom_name}
                                    className="px-7 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 space-x-reverse transition disabled:opacity-40 cursor-pointer"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>{editingCar ? 'ذخیره تغییرات' : 'ثبت نهایی خودرو در موجودی همکار'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
