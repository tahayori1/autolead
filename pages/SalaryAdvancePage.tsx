import React, { useState, useEffect, useMemo } from 'react';
import type { SalaryAdvanceRequest, MyProfile, SalaryAdvanceStatus } from '../types';
import { getMyProfile, salaryAdvanceService } from '../services/api';
import { 
    Wallet, 
    Plus, 
    Trash2, 
    Check, 
    X, 
    Search, 
    Calendar,
    HelpCircle,
    DollarSign,
    Clock,
    FileText,
    TrendingUp,
    Briefcase,
    AlertCircle
} from 'lucide-react';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import PersianDatePicker from '../components/PersianDatePicker';

declare const moment: any;

const toGregorian = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
        const normalized = dateStr.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                                  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
        if (!normalized.includes('/') && normalized.includes('-')) {
            const m = moment(normalized);
            if (m.isValid()) {
                return m.format('YYYY-MM-DD');
            }
        }
        const m = moment(normalized, 'jYYYY/jMM/jDD');
        if (m.isValid()) {
            return m.format('YYYY-MM-DD');
        }
    } catch (e) {
        console.error("Error converting Jalali to Gregorian:", e);
    }
    return dateStr || '';
};

const toJalali = (gregorianStr?: string): string => {
    if (!gregorianStr) return '';
    try {
        const m = moment(gregorianStr);
        if (m.isValid()) {
            return m.locale('fa').format('jYYYY/jMM/jDD');
        }
    } catch (e) {
        console.error("Error converting Gregorian to Jalali:", e);
    }
    return gregorianStr || '';
};

const INITIAL_REQUESTS: SalaryAdvanceRequest[] = [
    {
        id: 1,
        requesterName: 'امیررضا محمودی',
        amount: 8000000,
        targetDate: '1405/03/30',
        reason: 'پرداخت قسط بیمه بدنه خودرو شخصی و هزینه‌های درمانی خانواده',
        status: 'PENDING',
        createdAt: '1405/03/25',
    },
    {
        id: 2,
        requesterName: 'مریم اکبری',
        amount: 5000000,
        targetDate: '1405/03/28',
        reason: 'پیش‌پرداخت اجاره‌بهای منزل مسکونی و تمدید قرارداد سالانه',
        status: 'APPROVED',
        createdAt: '1405/03/20',
        notes: 'مورد تایید است. از محل منابع تنخواه‌گردان دفتر مرکزی پرداخت شود.'
    },
    {
        id: 3,
        requesterName: 'سید رضا علوی',
        amount: 12000000,
        targetDate: '1405/03/26',
        reason: 'خرید قطعات سخت‌افزاری کامپیوتر شخصی مورد استفاده در پروژه‌های شرکت',
        status: 'REJECTED',
        createdAt: '1405/03/18',
        notes: 'با عرض معذرت، به دلیل نداشتن سقف کارکرد ماهیانه کافی در این دوره امکان پذیر نیست.'
    },
    {
        id: 4,
        requesterName: 'محمد رضایی',
        amount: 6000000,
        targetDate: '1405/03/24',
        reason: 'هزینه‌های ثبت‌نام فرزند در کلاس‌های تابستانی و تهیه تجهیزات ورزشی',
        status: 'APPROVED',
        createdAt: '1405/03/15',
        notes: 'توسط مدیریت عامل تایید شد.'
    },
];

const SalaryAdvancePage: React.FC = () => {
    const [requests, setRequests] = useState<SalaryAdvanceRequest[]>([]);

    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdminNotesModalOpen, setIsAdminNotesModalOpen] = useState(false);
    const [selectedRequestForReview, setSelectedRequestForReview] = useState<SalaryAdvanceRequest | null>(null);
    const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
    const [adminNotesText, setAdminNotesText] = useState('');

    // Form inputs
    const [formData, setFormData] = useState({
        amount: '',
        targetDate: '',
        reason: ''
    });

    const [currentUserProfile, setCurrentUserProfile] = useState<Partial<MyProfile>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Filters and sub-tabs
    const [viewMode, setViewMode] = useState<'MY_REQUESTS' | 'ALL_REQUESTS'>('MY_REQUESTS');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAllRequests = async () => {
        try {
            const data = await salaryAdvanceService.getAll();
            setRequests(data);
        } catch (error) {
            console.error("Error fetching salary advances:", error);
            setRequests(INITIAL_REQUESTS);
        }
    };

    // Fetch user profile info on mount
    const fetchUserData = async () => {
        setLoading(true);
        try {
            const profile = await getMyProfile() as MyProfile;
            setCurrentUserProfile(profile);
            // If user is admin, default view can be all requests or my requests
            if (profile.isAdmin === 1) {
                setViewMode('ALL_REQUESTS');
            } else {
                setViewMode('MY_REQUESTS');
            }
            await fetchAllRequests();
        } catch (error) {
            setToast({ message: 'خطا در دریافت اطلاعات کاربر متصل', type: 'error' });
            await fetchAllRequests();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    // Set Default targetDate to today + 5 days in Persian
    useEffect(() => {
        if (isModalOpen) {
            let pDate = '1405/03/25';
            try {
                if (typeof moment !== 'undefined') {
                    pDate = moment().add(5, 'days').locale('fa').format('jYYYY/jMM/jDD');
                }
            } catch (e) {}
            
            setFormData({
                amount: '',
                targetDate: pDate,
                reason: ''
            });
        }
    }, [isModalOpen]);

    // Format numbers with commas (e.g., 5,000,000)
    const formatNumberWithCommas = (value: string) => {
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue === '') return '';
        return Number(cleanValue).toLocaleString('fa-IR');
    };

    const getRawNumber = (formattedValue: string) => {
        return parseInt(formattedValue.replace(/[^\d]/g, ''), 10) || 0;
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value;
        const cleanVal = inputVal.replace(/[^\d]/g, '');
        // Limit maximum length to prevent overflow
        if (cleanVal.length > 10) return;
        setFormData(prev => ({
            ...prev,
            amount: formatNumberWithCommas(cleanVal)
        }));
    };

    // Human-readable Rial / Toman conversion helper in Persian words
    const convertToPersianWords = (numStr: string) => {
        const rawNum = parseInt(numStr.replace(/[^\d]/g, ''), 10);
        if (!rawNum) return '';
        // Simulating basic text outputs for typical values (thousands, millions)
        // A fully featured helper
        if (rawNum < 1000) return `${rawNum.toLocaleString('fa-IR')} تومان`;
        if (rawNum >= 1000 && rawNum < 1000000) {
            const thousands = Math.round(rawNum / 1000);
            return `${thousands.toLocaleString('fa-IR')} هزار تومان`;
        }
        if (rawNum >= 1000000) {
            const millionsCount = rawNum / 1000000;
            return `${millionsCount.toLocaleString('fa-IR')} میلیون تومان`;
        }
        return '';
    };

    // Save Salary Request
    const handleSaveRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const rawAmount = getRawNumber(formData.amount);
        if (rawAmount <= 0) {
            setToast({ message: 'لطفاً مبلغ معتبری وارد کنید.', type: 'error' });
            return;
        }

        if (!formData.targetDate.trim() || !formData.reason.trim()) {
            setToast({ message: 'لطفاً تمامی فیلدهای الزامی را تکمیل کنید.', type: 'error' });
            return;
        }

        let currentDateStr = '1405/03/25';
        try {
            if (typeof moment !== 'undefined') {
                currentDateStr = moment().locale('fa').format('jYYYY/jMM/jDD');
            }
        } catch (e) {}

        const newRequest: Omit<SalaryAdvanceRequest, 'id'> = {
            requesterName: currentUserProfile.full_name || 'کاربر سیستم',
            amount: rawAmount,
            targetDate: toGregorian(formData.targetDate.trim()),
            reason: formData.reason.trim(),
            status: 'PENDING',
            createdAt: currentDateStr
        };

        try {
            setLoading(true);
            await salaryAdvanceService.create(newRequest);
            setIsModalOpen(false);
            setToast({ message: 'درخواست مساعده رسمی شما با موفقیت ثبت شد و در صف بررسی قرار گرفت.', type: 'success' });
            await fetchAllRequests();
        } catch (error) {
            setToast({ message: 'خطا در ثبت درخواست مساعده در سرور', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Delete a request
    const handleDeleteRequest = async (id: number) => {
        if (window.confirm('آیا مطمئن هستید که می‌خواهید این درخواست مساعده را حذف کنید؟')) {
            try {
                setLoading(true);
                await salaryAdvanceService.delete(id);
                setToast({ message: 'درخواست مساعده با موفقیت حذف شد.', type: 'success' });
                await fetchAllRequests();
            } catch (error) {
                setToast({ message: 'خطا در حذف درخواست مساعده از سرور', type: 'error' });
            } finally {
                setLoading(false);
            }
        }
    };

    // Admin Review action triggers
    const openReviewModal = (request: SalaryAdvanceRequest, action: 'APPROVE' | 'REJECT') => {
        setSelectedRequestForReview(request);
        setReviewAction(action);
        setAdminNotesText('');
        setIsAdminNotesModalOpen(true);
    };

    const handleConfirmReview = async () => {
        if (!selectedRequestForReview) return;

        const updatedRequest: SalaryAdvanceRequest = {
            ...selectedRequestForReview,
            status: reviewAction === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            notes: adminNotesText.trim() || undefined
        };

        try {
            setLoading(true);
            await salaryAdvanceService.update(updatedRequest);
            setIsAdminNotesModalOpen(false);
            setSelectedRequestForReview(null);
            setToast({ 
                message: reviewAction === 'APPROVE' ? 'درخواست مساعده با موفقیت تایید شد.' : 'درخواست مساعده رد شد.', 
                type: 'success' 
            });
            await fetchAllRequests();
        } catch (error) {
            setToast({ message: 'خطا در بروزرسانی وضعیت درخواست مساعده در سرور', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Stats calculations
    const stats = useMemo(() => {
        const totalCount = requests.length;
        const myRequestsCount = requests.filter(r => r.requesterName === currentUserProfile.full_name).length;
        const pendingCount = requests.filter(r => r.status === 'PENDING').length;
        const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
        
        const totalApprovedAmount = requests
            .filter(r => r.status === 'APPROVED')
            .reduce((sum, r) => sum + r.amount, 0);

        const totalPendingAmount = requests
            .filter(r => r.status === 'PENDING')
            .reduce((sum, r) => sum + r.amount, 0);

        return {
            totalCount,
            myRequestsCount,
            pendingCount,
            approvedCount,
            totalApprovedAmount,
            totalPendingAmount
        };
    }, [requests, currentUserProfile]);

    // Filtering logic
    const filteredRequestsByTabAndSearch = useMemo(() => {
        return requests.filter(req => {
            // View Mode request subset
            if (viewMode === 'MY_REQUESTS') {
                if (req.requesterName !== currentUserProfile.full_name) return false;
            }

            // Status Filter Tab
            if (statusFilter === 'PENDING' && req.status !== 'PENDING') return false;
            if (statusFilter === 'APPROVED' && req.status !== 'APPROVED') return false;
            if (statusFilter === 'REJECTED' && req.status !== 'REJECTED') return false;

            // Search query filter
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                return (
                    req.requesterName.toLowerCase().includes(q) ||
                    req.reason.toLowerCase().includes(q) ||
                    (req.notes && req.notes.toLowerCase().includes(q)) ||
                    req.amount.toString().includes(q)
                );
            }

            return true;
        });
    }, [requests, viewMode, statusFilter, searchQuery, currentUserProfile]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col space-y-6 animate-fade-in">
            {/* Header section with Stats */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-sky-100 dark:bg-sky-950 rounded-2xl text-sky-600 dark:text-sky-300">
                        <Wallet className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white font-extrabold flex items-center gap-2">
                            <span>امور رسمی مساعده کارمندان</span>
                            <span className="text-xs bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 px-2 py-0.5 rounded-full font-bold">بخش هماهنگی</span>
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">سامانه متمرکز ثبت، پیگیری و تأیید درخواست‌های رسمی مساعده مالی پرسنل شرکت</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>ثبت درخواست مساعده</span>
                </button>
            </div>

            {/* Quick Summary Cards Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block mb-1">جمعاً تایید و پرداخت شده</span>
                        <h4 className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {stats.totalApprovedAmount.toLocaleString('fa-IR')} <span className="text-[10px] font-bold">تومان</span>
                        </h4>
                    </div>
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <Check className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block mb-1">در دست بررسی فعلی</span>
                        <h4 className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                            {stats.totalPendingAmount.toLocaleString('fa-IR')} <span className="text-[10px] font-bold">تومان</span>
                        </h4>
                    </div>
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block mb-1">کل درخواست‌ها</span>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white font-mono">
                            {stats.totalCount.toLocaleString('fa-IR')} <span className="text-xs text-slate-400 dark:text-slate-500">مورد</span>
                        </h4>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-500 rounded-lg">
                        <FileText className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block mb-1">درخواست‌های ارسالی من</span>
                        <h4 className="text-xl font-black text-sky-600 dark:text-sky-400 font-mono">
                            {stats.myRequestsCount.toLocaleString('fa-IR')} <span className="text-xs text-slate-400">مورد</span>
                        </h4>
                    </div>
                    <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg">
                        <Briefcase className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filter Tabs & Content Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-5">
                
                {/* Role Switch: My requests vs Admin all requests */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-1 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('MY_REQUESTS')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                viewMode === 'MY_REQUESTS'
                                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-white shadow font-black'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            درخواست‌های من
                        </button>
                        {currentUserProfile.isAdmin === 1 && (
                            <button
                                onClick={() => setViewMode('ALL_REQUESTS')}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                    viewMode === 'ALL_REQUESTS'
                                        ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-white shadow font-black'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                                }`}
                            >
                                مدیریت کل درخواست‌ها (پنل ارشد)
                            </button>
                        )}
                    </div>

                    {/* Status filtering and Search bar */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {[
                            { id: 'ALL', label: 'همه وضعیت‌ها' },
                            { id: 'PENDING', label: '⏳ در انتظار' },
                            { id: 'APPROVED', label: '✅ تایید شده' },
                            { id: 'REJECTED', label: '❌ رد شده' }
                        ].map(st => (
                            <button
                                key={st.id}
                                onClick={() => setStatusFilter(st.id as any)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    statusFilter === st.id
                                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/10'
                                        : 'bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sub search input */}
                <div className="relative">
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="جستجوی درخواست مساعده بر اساس متقاضی، علت درخواست یا شرح بررسی..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pr-9 pl-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 placeholder-slate-400"
                    />
                </div>

                {/* Requests table listing */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Spinner />
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                        <table className="w-full text-right border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                                    {viewMode === 'ALL_REQUESTS' && <th className="p-4">پرسنل متقاضی</th>}
                                    <th className="p-4">مبلغ درخواستی</th>
                                    <th className="p-4">تاریخ نیاز به مساعده</th>
                                    <th className="p-4">علت درخواست / توضیحات</th>
                                    <th className="p-4">تاریخ ثبت رسمی</th>
                                    <th className="p-4">آخرین وضعیت</th>
                                    <th className="p-4">پیگیری مدیریت / یادداشت اداری</th>
                                    <th className="p-4 text-center">عملیات اداری</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                {filteredRequestsByTabAndSearch.map(req => {
                                    const isPending = req.status === 'PENDING';
                                    const isOwner = req.requesterName === currentUserProfile.full_name;
                                    const isAdmin = currentUserProfile.isAdmin === 1;

                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                            {viewMode === 'ALL_REQUESTS' && (
                                                <td className="p-4 font-bold text-slate-800 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-300 font-bold">
                                                            {req.requesterName.charAt(0)}
                                                        </div>
                                                        <span>{req.requesterName}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="p-4 font-bold font-mono text-cyan-700 dark:text-cyan-400">
                                                {req.amount.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-slate-400">تومان</span>
                                            </td>
                                            <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{toJalali(req.targetDate)}</td>
                                            <td className="p-4 max-w-sm">
                                                <p className="line-clamp-2 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed" title={req.reason}>
                                                    {req.reason}
                                                </p>
                                            </td>
                                            <td className="p-4 font-mono text-slate-400">{req.createdAt}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    req.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-990/25 text-emerald-600 dark:text-emerald-400' :
                                                    req.status === 'REJECTED' ? 'bg-rose-50 dark:bg-rose-990/25 text-rose-600 dark:text-rose-400' :
                                                    'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        req.status === 'APPROVED' ? 'bg-emerald-500' :
                                                        req.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                                                    }`} />
                                                    {req.status === 'APPROVED' ? 'تایید شده' : req.status === 'REJECTED' ? 'رد شده' : 'در انتظار بررسی'}
                                                </span>
                                            </td>
                                            <td className="p-4 max-w-xs">
                                                {req.notes ? (
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 border-r-2 border-slate-200 dark:border-slate-700 pr-2 italic line-clamp-2">
                                                        {req.notes}
                                                    </p>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 font-light">---</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* Admin approval buttons */}
                                                    {isAdmin && viewMode === 'ALL_REQUESTS' && isPending && (
                                                        <>
                                                            <button
                                                                onClick={() => openReviewModal(req, 'APPROVE')}
                                                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded text-[10px] flex items-center gap-1 transition-all"
                                                                title="تایید درخواست"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                                تایید
                                                            </button>
                                                            <button
                                                                onClick={() => openReviewModal(req, 'REJECT')}
                                                                className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded text-[10px] flex items-center gap-1 transition-all"
                                                                title="رد درخواست"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                                رد
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Delete option - owners can delete pending, admin can delete any */}
                                                    {(isAdmin || (isOwner && isPending)) ? (
                                                        <button
                                                            onClick={() => handleDeleteRequest(req.id)}
                                                            className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                                                            title="حذف و ابطال درخواست"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 dark:text-slate-600">غیرقابل ابطال</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredRequestsByTabAndSearch.length === 0 && (
                                    <tr>
                                        <td colSpan={viewMode === 'ALL_REQUESTS' ? 8 : 7} className="p-12 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/10">
                                            <AlertCircle className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
                                            <p className="text-sm font-bold">هیچ درخواست مساعده تطابق یافته‌ای یافت نشد.</p>
                                            <p className="text-xs text-slate-400 mt-1">تغییر فیلترها یا درج یک درخواست مساعده جدید را امتحان فرمایید.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Request Salary Advance Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        
                        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-4.5 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-sky-100" />
                                <h3 className="font-extrabold text-sm">ثبت درخواست جدید مساعده پرسنلی</h3>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRequest} className="p-6 space-y-4">
                            {/* Locked requester info */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">نام درخواست‌کننده رسمی</label>
                                <input
                                    type="text"
                                    value={currentUserProfile.full_name || 'کاربر متصل به سیستم'}
                                    disabled
                                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-bold dark:disabled:text-slate-400"
                                />
                            </div>

                            {/* Amount field */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="amount-input" className="text-xs font-bold text-slate-500 dark:text-slate-400">مبلغ مساعده درخواستی (تومان)</label>
                                    {formData.amount && (
                                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">
                                            ({convertToPersianWords(formData.amount)})
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        id="amount-input"
                                        type="text"
                                        value={formData.amount}
                                        onChange={handleAmountChange}
                                        placeholder="مثال: ۵,۰۰۰,۰۰۰"
                                        className="w-full pr-10 pl-3 py-2.5 text-xs font-bold font-mono text-left bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:text-white"
                                        required
                                        dir="ltr"
                                    />
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-[10px]">
                                        T
                                    </span>
                                </div>
                            </div>

                            {/* Target Date */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تاریخ نیاز به پرداخت (جلالی)</label>
                                <div className="relative">
                                    <PersianDatePicker
                                        value={formData.targetDate}
                                        onChange={val => setFormData(p => ({ ...p, targetDate: val }))}
                                        placeholder="تاریخ نیاز به پرداخت"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1">توصیه می‌شود تاریخ درخواستی حداقل ۵ روز کاری پس از زمان فعلی باشد.</p>
                            </div>

                            {/* Reason for requests */}
                            <div>
                                <label htmlFor="reason-textarea" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">علت و توضیحات بابت درخواست کمک‌هزینه/مساعده</label>
                                <textarea
                                    id="reason-textarea"
                                    rows={3}
                                    value={formData.reason}
                                    onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                                    placeholder="شرح کامل علت توجیهی جهت تقاضای رسمی مساعده مالی خود را مکتوب نمایید..."
                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:text-white"
                                    required
                                />
                            </div>

                            {/* Confirmations footer */}
                            <div className="flex gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                                >
                                    ارسال نهایی درخواست
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-xs rounded-xl transition-all"
                                >
                                    انصراف
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Notes / Review feedback modal */}
            {isAdminNotesModalOpen && selectedRequestForReview && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        
                        <div className={`px-6 py-4 text-white flex justify-between items-center ${reviewAction === 'APPROVED' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                            <h3 className="font-extrabold text-sm flex items-center gap-2">
                                {reviewAction === 'APPROVE' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                <span>بررسی نهایی درخواست مساعده {selectedRequestForReview.requesterName}</span>
                            </h3>
                            <button
                                onClick={() => setIsAdminNotesModalOpen(false)}
                                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                                <p className="mb-1"><span className="font-bold">متقاضی مساعده:</span> {selectedRequestForReview.requesterName}</p>
                                <p className="mb-1"><span className="font-bold">مبلغ درخواست:</span> {selectedRequestForReview.amount.toLocaleString('fa-IR')} تومان</p>
                                <p><span className="font-bold">علت متقاضی:</span> {selectedRequestForReview.reason}</p>
                            </div>

                            <div>
                                <label htmlFor="admin-notes-textarea" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    پیوست یادداشت بررسی مدیریت (اختیاری)
                                </label>
                                <textarea
                                    id="admin-notes-textarea"
                                    rows={3}
                                    value={adminNotesText}
                                    onChange={e => setAdminNotesText(e.target.value)}
                                    placeholder="یادداشت، منبع پرداخت یا علت مخالفت را یادداشت کنید..."
                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:text-white"
                                />
                            </div>

                            <div className="flex gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={handleConfirmReview}
                                    className={`flex-1 py-2.5 px-4 text-white font-bold text-xs rounded-xl transition-all shadow-sm ${
                                        reviewAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    {reviewAction === 'APPROVED' ? 'تایید و ابلاغ مالی' : 'رد قطعی درخواست'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAdminNotesModalOpen(false)}
                                    className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-xs rounded-xl transition-all"
                                >
                                    برگشت
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default SalaryAdvancePage;
