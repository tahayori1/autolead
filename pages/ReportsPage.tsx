
import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, getCars, carOrdersService } from '../services/api';
import type { User, Car, CarOrder } from '../types';
import { OrderStatus, LeadStatus } from '../types';
import Spinner from '../components/Spinner';
import { motion } from 'framer-motion';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { 
    ChartBar, Users, Car as CarIcon, Map, Megaphone, 
    Calendar, Filter, TrendingUp, Activity, ShoppingCart,
    Copy, Check, FileText, Layers, Award, BarChart3, HelpCircle
} from 'lucide-react';

// Declare moment from global scope
declare const moment: any;

const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

type TimeRange = 'all' | 'today' | 'week' | '28days';

const StatCard = ({ title, value, subtitle, icon: Icon, color, delay }: any) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group"
    >
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5 transition-transform group-hover:scale-110 ${color}`}></div>
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white font-mono">{value}</h3>
                {subtitle && <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-slate-700 dark:text-slate-100`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </motion.div>
);

const ReportsPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [cars, setCars] = useState<Car[]>([]);
    const [orders, setOrders] = useState<CarOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Sub-tab selection and notifications
    const [activeSubTab, setActiveSubTab] = useState<'kpis' | 'analytics'>('kpis');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('گزارش با موفقیت در حافظه کپی شد', 'success');
            }).catch(() => {
                fallbackCopyTextToClipboard(text);
            });
        } else {
            fallbackCopyTextToClipboard(text);
        }
    };

    const fallbackCopyTextToClipboard = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('گزارش با موفقیت در حافظه کپی شد', 'success');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            showToast('خطا در کپی گزارش', 'error');
        }
        document.body.removeChild(textArea);
    };

    // Calculate KPI Stats
    const kpiStats = useMemo(() => {
        const now = moment().locale('fa');
        const todayStart = now.clone().startOf('day');
        const weekStart = now.clone().subtract(6, 'days').startOf('day');
        const month28Start = now.clone().subtract(27, 'days').startOf('day');

        const dailyLeads: User[] = [];
        const weeklyLeads: User[] = [];
        const month28Leads: User[] = [];

        users.forEach(u => {
            const dateStr = u.RegisterTime || u.createdAt;
            if (!dateStr) return;
            try {
                const m = moment(dateStr.replace(' ', 'T')).locale('fa');
                if (m.isSameOrAfter(todayStart)) {
                    dailyLeads.push(u);
                }
                if (m.isSameOrAfter(weekStart)) {
                    weeklyLeads.push(u);
                }
                if (m.isSameOrAfter(month28Start)) {
                    month28Leads.push(u);
                }
            } catch (e) {}
        });

        const getStatusCounts = (leadsList: User[]) => {
            const counts: Record<string, number> = {
                [LeadStatus.NEW]: 0,
                [LeadStatus.CONTACTED]: 0,
                [LeadStatus.MEETING]: 0,
                [LeadStatus.NEGOTIATION]: 0,
                [LeadStatus.WON]: 0,
                [LeadStatus.LOST]: 0,
                [LeadStatus.NO_ANSWER]: 0,
            };
            leadsList.forEach(u => {
                const status = u.leadStatus || LeadStatus.NEW;
                if (counts[status] !== undefined) {
                    counts[status]++;
                }
            });
            return counts;
        };

        return {
            daily: {
                count: dailyLeads.length,
                status: getStatusCounts(dailyLeads)
            },
            weekly: {
                count: weeklyLeads.length,
                status: getStatusCounts(weeklyLeads)
            },
            month28: {
                count: month28Leads.length,
                status: getStatusCounts(month28Leads)
            },
            funnel: getStatusCounts(users)
        };
    }, [users]);

    const handleCopyReport = (period: 'today' | 'week' | '28days' | 'all') => {
        const nowStr = moment().locale('fa').format('YYYY/MM/DD');
        let text = '';

        if (period === 'today') {
            const count = kpiStats.daily.count;
            const status = kpiStats.daily.status;
            text = `📊 *گزارش سرنخ‌های ورودی امروز* 📊
📅 تاریخ: ${nowStr}
⚡ تعداد کل ورودی: ${count.toLocaleString('fa-IR')} سرنخ 🆕

---
🔍 *تفکیک وضعیت سرنخ‌های امروز:*
🆕 جدید: ${status[LeadStatus.NEW].toLocaleString('fa-IR')}
📞 تماس گرفته شده: ${status[LeadStatus.CONTACTED].toLocaleString('fa-IR')}
👥 جلسه حضوری: ${status[LeadStatus.MEETING].toLocaleString('fa-IR')}
💬 در حال مذاکره: ${status[LeadStatus.NEGOTIATION].toLocaleString('fa-IR')}
🎉 موفق (خرید): ${status[LeadStatus.WON].toLocaleString('fa-IR')}
❌ ناموفق: ${status[LeadStatus.LOST].toLocaleString('fa-IR')}
☎️ پاسخ نداد: ${status[LeadStatus.NO_ANSWER].toLocaleString('fa-IR')}

🚗 *سیستم مدیریت سرنخ‌های حسینی خودرو*`;
        } else if (period === 'week') {
            const count = kpiStats.weekly.count;
            const status = kpiStats.weekly.status;
            text = `📊 *گزارش سرنخ‌های ورودی این هفته (۷ روز اخیر)* 📊
📅 تاریخ گزارش: ${nowStr}
⚡ تعداد کل ورودی: ${count.toLocaleString('fa-IR')} سرنخ 📅

---
🔍 *تفکیک وضعیت سرنخ‌های این هفته:*
🆕 جدید: ${status[LeadStatus.NEW].toLocaleString('fa-IR')}
📞 تماس گرفته شده: ${status[LeadStatus.CONTACTED].toLocaleString('fa-IR')}
👥 جلسه حضوری: ${status[LeadStatus.MEETING].toLocaleString('fa-IR')}
💬 در حال مذاکره: ${status[LeadStatus.NEGOTIATION].toLocaleString('fa-IR')}
🎉 موفق (خرید): ${status[LeadStatus.WON].toLocaleString('fa-IR')}
❌ ناموفق: ${status[LeadStatus.LOST].toLocaleString('fa-IR')}
☎️ پاسخ نداد: ${status[LeadStatus.NO_ANSWER].toLocaleString('fa-IR')}

🚗 *سیستم مدیریت سرنخ‌های حسینی خودرو*`;
        } else if (period === '28days') {
            const count = kpiStats.month28.count;
            const status = kpiStats.month28.status;
            text = `📊 *گزارش سرنخ‌های ورودی ۲۸ روز اخیر* 📊
📅 تاریخ گزارش: ${nowStr}
⚡ تعداد کل ورودی: ${count.toLocaleString('fa-IR')} سرنخ 🗓️

---
🔍 *تفکیک وضعیت سرنخ‌های ۲۸ روز اخیر:*
🆕 جدید: ${status[LeadStatus.NEW].toLocaleString('fa-IR')}
📞 تماس گرفته شده: ${status[LeadStatus.CONTACTED].toLocaleString('fa-IR')}
👥 جلسه حضوری: ${status[LeadStatus.MEETING].toLocaleString('fa-IR')}
💬 در حال مذاکره: ${status[LeadStatus.NEGOTIATION].toLocaleString('fa-IR')}
🎉 موفق (خرید): ${status[LeadStatus.WON].toLocaleString('fa-IR')}
❌ ناموفق: ${status[LeadStatus.LOST].toLocaleString('fa-IR')}
☎️ پاسخ نداد: ${status[LeadStatus.NO_ANSWER].toLocaleString('fa-IR')}

🚗 *سیستم مدیریت سرنخ‌های حسینی خودرو*`;
        } else {
            text = `📊 *گزارش جامع شاخص‌های کلیدی عملکرد (KPI)* 📊
📅 تاریخ گزارش: ${nowStr}

---
🔥 *۱. لیدهای ورودی جدید:*
▪️ امروز: ${kpiStats.daily.count.toLocaleString('fa-IR')} سرنخ 🆕
▪️ این هفته: ${kpiStats.weekly.count.toLocaleString('fa-IR')} سرنخ 📅
▪️ ۲۸ روز اخیر: ${kpiStats.month28.count.toLocaleString('fa-IR')} سرنخ 🗓️

---
⚡ *۲. وضعیت بررسی سرنخ‌های امروز:*
🆕 جدید: ${kpiStats.daily.status[LeadStatus.NEW].toLocaleString('fa-IR')}
📞 تماس گرفته شده: ${kpiStats.daily.status[LeadStatus.CONTACTED].toLocaleString('fa-IR')}
👥 جلسه حضوری: ${kpiStats.daily.status[LeadStatus.MEETING].toLocaleString('fa-IR')}
💬 در حال مذاکره: ${kpiStats.daily.status[LeadStatus.NEGOTIATION].toLocaleString('fa-IR')}
🎉 موفق (خرید): ${kpiStats.daily.status[LeadStatus.WON].toLocaleString('fa-IR')}
❌ ناموفق: ${kpiStats.daily.status[LeadStatus.LOST].toLocaleString('fa-IR')}
☎️ پاسخ نداد: ${kpiStats.daily.status[LeadStatus.NO_ANSWER].toLocaleString('fa-IR')}

---
📈 *۳. وضعیت بررسی سرنخ‌های این هفته:*
🆕 جدید: ${kpiStats.weekly.status[LeadStatus.NEW].toLocaleString('fa-IR')}
📞 تماس گرفته شده: ${kpiStats.weekly.status[LeadStatus.CONTACTED].toLocaleString('fa-IR')}
👥 جلسه حضوری: ${kpiStats.weekly.status[LeadStatus.MEETING].toLocaleString('fa-IR')}
💬 در حال مذاکره: ${kpiStats.weekly.status[LeadStatus.NEGOTIATION].toLocaleString('fa-IR')}
🎉 موفق (خرید): ${kpiStats.weekly.status[LeadStatus.WON].toLocaleString('fa-IR')}
❌ ناموفق: ${kpiStats.weekly.status[LeadStatus.LOST].toLocaleString('fa-IR')}
☎️ پاسخ نداد: ${kpiStats.weekly.status[LeadStatus.NO_ANSWER].toLocaleString('fa-IR')}

---
📊 *۴. وضعیت بررسی سرنخ‌های ۲۸ روز اخیر:*
🆕 جدید: ${kpiStats.month28.status[LeadStatus.NEW].toLocaleString('fa-IR')}
📞 تماس گرفته شده: ${kpiStats.month28.status[LeadStatus.CONTACTED].toLocaleString('fa-IR')}
👥 جلسه حضوری: ${kpiStats.month28.status[LeadStatus.MEETING].toLocaleString('fa-IR')}
💬 در حال مذاکره: ${kpiStats.month28.status[LeadStatus.NEGOTIATION].toLocaleString('fa-IR')}
🎉 موفق (خرید): ${kpiStats.month28.status[LeadStatus.WON].toLocaleString('fa-IR')}
❌ ناموفق: ${kpiStats.month28.status[LeadStatus.LOST].toLocaleString('fa-IR')}
☎️ پاسخ نداد: ${kpiStats.month28.status[LeadStatus.NO_ANSWER].toLocaleString('fa-IR')}

---
🏆 *۵. قیف فروش کل:*
🏁 سرنخ‌های جدید: ${kpiStats.funnel[LeadStatus.NEW].toLocaleString('fa-IR')}
📞 تماس‌های برقرار شده: ${kpiStats.funnel[LeadStatus.CONTACTED].toLocaleString('fa-IR')}
👥 جلسات حضوری: ${kpiStats.funnel[LeadStatus.MEETING].toLocaleString('fa-IR')}
💬 مذاکرات نهایی: ${kpiStats.funnel[LeadStatus.NEGOTIATION].toLocaleString('fa-IR')}
✅ خریدهای موفق: ${kpiStats.funnel[LeadStatus.WON].toLocaleString('fa-IR')}

🚗 *سیستم هوشمند مدیریت سرنخ‌های حسینی خودرو*`;
        }

        copyToClipboard(text);
    };

    // Filters
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedDay, setSelectedDay] = useState<string>('all');
    const [timeRange, setTimeRange] = useState<TimeRange>('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [usersData, carsData, ordersData] = await Promise.all([
                    getUsers(),
                    getCars(),
                    carOrdersService.getAll()
                ]);
                setUsers(usersData);
                setCars(carsData);
                setOrders(ordersData);
            } catch (err) {
                setError('خطا در دریافت اطلاعات گزارشات');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleTimeRangeChange = (range: TimeRange) => {
        setTimeRange(range);
        setSelectedMonth('all');
        setSelectedDay('all');
    };

    const handleManualFilterChange = (type: 'month' | 'day', value: string) => {
        if (type === 'month') {
            setSelectedMonth(value);
            if (value === 'all') setSelectedDay('all');
        } else {
            setSelectedDay(value);
        }
        setTimeRange('all');
    };

    // --- Filter Users based on Date ---
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const dateStr = u.RegisterTime || u.createdAt;
            if (!dateStr) return false;
            
            let m;
            try {
                m = moment(dateStr.replace(' ', 'T')).locale('fa');
            } catch (e) {
                return false;
            }

            if (timeRange !== 'all') {
                const now = moment().locale('fa');
                if (timeRange === 'today') return m.isSame(now, 'day');
                if (timeRange === 'week') return m.isSameOrAfter(now.clone().subtract(6, 'days').startOf('day'));
                if (timeRange === '28days') return m.isSameOrAfter(now.clone().subtract(27, 'days').startOf('day'));
            }

            if (selectedMonth !== 'all') {
                if (m.jMonth() !== parseInt(selectedMonth)) return false;
                if (selectedDay !== 'all' && m.jDate() !== parseInt(selectedDay)) return false;
            }

            return true;
        });
    }, [users, selectedMonth, selectedDay, timeRange]);

    // --- Process Data for Registration Trend ---
    const dailyRegistrations = useMemo(() => {
        const counts: Record<string, number> = {};
        let chartData: { date: string, label: string, count: number }[] = [];

        if (selectedMonth !== 'all') {
            const monthIndex = parseInt(selectedMonth);
            const currentYear = moment().jYear();
            const daysInMonth = moment.jDaysInMonth(currentYear, monthIndex);

            for (let i = 1; i <= daysInMonth; i++) counts[i] = 0;

            filteredUsers.forEach(user => {
                const dateStr = user.RegisterTime || user.createdAt;
                if (!dateStr) return;
                try {
                    const d = moment(dateStr.replace(' ', 'T')).locale('fa').jDate();
                    if (counts[d] !== undefined) counts[d]++;
                } catch(e) {}
            });

            chartData = Object.keys(counts).map(day => ({
                date: day,
                label: `${day} ${PERSIAN_MONTHS[monthIndex]}`,
                count: counts[day]
            })).sort((a, b) => parseInt(a.date) - parseInt(b.date));

        } else if (timeRange === 'today') {
             chartData = [{
                 date: moment().format('YYYY-MM-DD'),
                 label: 'امروز',
                 count: filteredUsers.length
             }];
        } else {
            let daysToShow = 14;
            if (timeRange === 'week') daysToShow = 7;
            if (timeRange === '28days') daysToShow = 28;

            const today = new Date();
            const dates = Array.from({ length: daysToShow }, (_, i) => {
                const d = new Date();
                d.setDate(today.getDate() - ((daysToShow - 1) - i)); 
                return d.toISOString().split('T')[0];
            });

            dates.forEach(date => counts[date] = 0);

            filteredUsers.forEach(user => {
                try {
                    const dateStr = (user.RegisterTime || user.createdAt || '').replace(' ', 'T').split('T')[0];
                    if (counts[dateStr] !== undefined) counts[dateStr]++;
                } catch (e) {}
            });

            chartData = dates.map(date => {
                const label = new Intl.DateTimeFormat('fa-IR', { month: 'numeric', day: 'numeric' }).format(new Date(date));
                return { date, label, count: counts[date] };
            });
        }

        return chartData;
    }, [filteredUsers, selectedMonth, timeRange]);

    // --- Process Data for Car Demand ---
    const carDemand = useMemo(() => {
        const counts: Record<string, number> = {};
        cars.forEach(car => { counts[car.name] = 0; });
        
        filteredUsers.forEach(user => {
            const userCar = user.CarModel ? user.CarModel.trim() : '';
            if (userCar && counts.hasOwnProperty(userCar)) {
                counts[userCar]++;
            }
        });

        return Object.entries(counts)
            .map(([name, count]) => ({ name, value: count }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 8); // Top 8
    }, [filteredUsers, cars]);

    // --- Process Data for Province Distribution ---
    const provinceStats = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredUsers.forEach(user => {
            let pname = user.Province?.trim();
            if (!pname || pname === '-' || pname === 'undefined') pname = 'نامشخص';
            counts[pname] = (counts[pname] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, value: count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10
    }, [filteredUsers]);

    // --- Process Data for Reference (Source) Distribution ---
    const referenceStats = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredUsers.forEach(user => {
            let ref = user.reference ? user.reference.trim() : '';
            if (!ref || ref === '-' || ref === 'undefined' || ref === 'null') {
                ref = 'نامشخص';
            }
            if (ref === 'صفحه شرایط' || ref === 'صفحه خام شرایط' || ref === 'سایت') {
                ref = 'سایت و لندینگ‌پیج';
            }
            counts[ref] = (counts[ref] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, value: count }))
            .sort((a, b) => b.value - a.value);
    }, [filteredUsers]);

    // --- Order Stats ---
    const orderStats = useMemo(() => {
        const completed = orders.filter(o => o.status === OrderStatus.COMPLETED).length;
        const totalValue = orders
            .filter(o => o.status === OrderStatus.COMPLETED)
            .reduce((sum, o) => sum + (o.finalPrice || o.proposedPrice || 0), 0);
        
        return {
            completed,
            totalValue,
            conversionRate: filteredUsers.length > 0 ? ((completed / filteredUsers.length) * 100).toFixed(1) : '0'
        };
    }, [orders, filteredUsers]);

    // --- Summary Stats ---
    const stats = useMemo(() => {
        const isFiltered = selectedMonth !== 'all' || selectedDay !== 'all' || timeRange !== 'all';
        const todayStr = new Date().toISOString().split('T')[0];
        let todayCount = 0;
        
        filteredUsers.forEach(user => {
            const dateStr = (user.RegisterTime || user.createdAt || '').replace(' ', 'T').split('T')[0];
            if (dateStr === todayStr) todayCount++;
        });

        const activeProvincesCount = new Set(filteredUsers.map(u => u.Province?.trim()).filter(p => p && p !== '-' && p !== 'undefined')).size;

        return {
            totalUsers: filteredUsers.length,
            todayRegistrations: todayCount,
            topCar: carDemand.length > 0 ? carDemand[0].name : '---',
            activeProvinces: activeProvincesCount,
            isFiltered
        };
    }, [filteredUsers, carDemand, selectedMonth, selectedDay, timeRange]);

    if (loading) return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs font-bold">
                    <p className="mb-1 text-slate-300">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color || entry.fill }}>
                            {entry.name}: {entry.value.toLocaleString('fa-IR')}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="animate-fade-in pb-20 space-y-8 relative">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                        <ChartBar className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white">گزارشات تحلیلی و KPI</h2>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">نمای کلی عملکرد، شاخص‌های کلیدی و قیف فروش تیم</p>
                    </div>
                </div>

                {/* Sub-tab selection */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start">
                    <button
                        onClick={() => setActiveSubTab('kpis')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            activeSubTab === 'kpis'
                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <Award className="w-4 h-4" />
                        شاخص‌های کلیدی (KPI)
                    </button>
                    <button
                        onClick={() => setActiveSubTab('analytics')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            activeSubTab === 'analytics'
                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        نمودارها و تحلیل عمومی
                    </button>
                </div>
            </div>

            {/* Render conditional views */}
            {activeSubTab === 'kpis' ? (
                <div className="space-y-8">
                    {/* KPI Quick Action Banner */}
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-[32px] text-white flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl shadow-indigo-500/15"
                    >
                        <div className="space-y-1 text-center sm:text-right">
                            <h3 className="text-lg font-black flex items-center gap-2 justify-center sm:justify-start">
                                <FileText className="w-5 h-5" />
                                کپی گزارش هوشمند عملکرد فروش
                            </h3>
                            <p className="text-xs text-indigo-50/90 font-medium">
                                اطلاعات و وضعیت سرنخ‌ها را در قالب متنی زیبا و ایموجی‌دار کپی کنید و در بله، واتساپ یا تلگرام ارسال کنید.
                            </p>
                        </div>
                        <button
                            onClick={() => handleCopyReport('all')}
                            className="bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-all flex items-center gap-2 shrink-0 active:scale-95"
                        >
                            <Copy className="w-4 h-4" />
                            کپی گزارش جامع KPI 📊
                        </button>
                    </motion.div>

                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Daily Leads Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden flex flex-col justify-between group h-full"
                        >
                            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[10px] font-black">امروز</span>
                                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">سرنخ‌های ورودی امروز</p>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white font-mono">{kpiStats.daily.count.toLocaleString('fa-IR')} <span className="text-sm font-bold text-slate-400">سرنخ</span></h3>
                            </div>
                            <button
                                onClick={() => handleCopyReport('today')}
                                className="mt-6 w-full py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-900/40 dark:hover:bg-blue-950/20 dark:text-slate-300 dark:hover:text-blue-400 rounded-xl text-xs font-bold transition-all border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                کپی گزارش امروز 🆕
                            </button>
                        </motion.div>

                        {/* Weekly Leads Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden flex flex-col justify-between group h-full"
                        >
                            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black">۷ روز اخیر</span>
                                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">سرنخ‌های ورودی این هفته</p>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white font-mono">{kpiStats.weekly.count.toLocaleString('fa-IR')} <span className="text-sm font-bold text-slate-400">سرنخ</span></h3>
                            </div>
                            <button
                                onClick={() => handleCopyReport('week')}
                                className="mt-6 w-full py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-900/40 dark:hover:bg-indigo-950/20 dark:text-slate-300 dark:hover:text-indigo-400 rounded-xl text-xs font-bold transition-all border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                کپی گزارش هفتگی 📅
                            </button>
                        </motion.div>

                        {/* 28-Day Leads Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden flex flex-col justify-between group h-full"
                        >
                            <div className="absolute right-0 top-0 w-24 h-24 bg-pink-500/5 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="px-2.5 py-1 rounded-xl bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 text-[10px] font-black">۲۸ روز اخیر</span>
                                    <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">سرنخ‌های ورودی ۲۸ روز اخیر</p>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white font-mono">{kpiStats.month28.count.toLocaleString('fa-IR')} <span className="text-sm font-bold text-slate-400">سرنخ</span></h3>
                            </div>
                            <button
                                onClick={() => handleCopyReport('28days')}
                                className="mt-6 w-full py-2 bg-slate-50 hover:bg-pink-50 hover:text-pink-600 dark:bg-slate-900/40 dark:hover:bg-pink-950/20 dark:text-slate-300 dark:hover:text-pink-400 rounded-xl text-xs font-bold transition-all border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                کپی گزارش ۲۸ روزه 🗓️
                            </button>
                        </motion.div>
                    </div>

                    {/* Lead Status Breakdown Table & Sales Funnel */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Status Breakdown Table */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700/60"
                        >
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-500" />
                                مقایسه وضعیت سرنخ‌ها (در ۳ بازه زمانی)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-bold">
                                            <th className="pb-3 pr-2">وضعیت سرنخ</th>
                                            <th className="pb-3 text-center">امروز</th>
                                            <th className="pb-3 text-center">این هفته</th>
                                            <th className="pb-3 text-center">۲۸ روز اخیر</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/60 dark:divide-slate-700/40">
                                        {[
                                            { status: LeadStatus.NEW, label: 'جدید', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
                                            { status: LeadStatus.CONTACTED, label: 'تماس گرفته شده', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
                                            { status: LeadStatus.NO_ANSWER, label: 'پاسخ نداد', badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' },
                                            { status: LeadStatus.MEETING, label: 'جلسه حضوری', badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' },
                                            { status: LeadStatus.NEGOTIATION, label: 'در حال مذاکره', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
                                            { status: LeadStatus.WON, label: 'موفق (خرید)', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
                                            { status: LeadStatus.LOST, label: 'ناموفق', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' }
                                        ].map((item, idx) => {
                                            const dCount = kpiStats.daily.status[item.status] || 0;
                                            const wCount = kpiStats.weekly.status[item.status] || 0;
                                            const m28Count = kpiStats.month28.status[item.status] || 0;

                                            const dPct = kpiStats.daily.count > 0 ? (dCount / kpiStats.daily.count) * 100 : 0;
                                            const wPct = kpiStats.weekly.count > 0 ? (wCount / kpiStats.weekly.count) * 100 : 0;
                                            const m28Pct = kpiStats.month28.count > 0 ? (m28Count / kpiStats.month28.count) * 100 : 0;

                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                                                    <td className="py-3.5 pr-2">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${item.badgeClass}`}>
                                                            {item.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 text-center font-mono">
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">
                                                            {dCount.toLocaleString('fa-IR')}
                                                        </div>
                                                        {dCount > 0 && (
                                                            <div className="w-12 mx-auto bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                                                                <div className="bg-blue-500 h-full" style={{ width: `${dPct}%` }}></div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 text-center font-mono">
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">
                                                            {wCount.toLocaleString('fa-IR')}
                                                        </div>
                                                        {wCount > 0 && (
                                                            <div className="w-12 mx-auto bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                                                                <div className="bg-indigo-500 h-full" style={{ width: `${wPct}%` }}></div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 text-center font-mono">
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">
                                                            {m28Count.toLocaleString('fa-IR')}
                                                        </div>
                                                        {m28Count > 0 && (
                                                            <div className="w-12 mx-auto bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                                                                <div className="bg-pink-500 h-full" style={{ width: `${m28Pct}%` }}></div>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>

                        {/* Sales Funnel */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-amber-500" />
                                    قیمت کل و قیف فروش CRM
                                </h3>
                                
                                <div className="space-y-4">
                                    {[
                                        { 
                                            label: '۱. ورود لید جدید (جدید)', 
                                            count: kpiStats.funnel[LeadStatus.NEW], 
                                            width: 'w-full', 
                                            gradient: 'from-slate-400 to-slate-500 text-slate-100' 
                                        },
                                        { 
                                            label: '۲. ارتباط اولیه (تماس/پاسخ نداد)', 
                                            count: kpiStats.funnel[LeadStatus.CONTACTED] + kpiStats.funnel[LeadStatus.NO_ANSWER], 
                                            width: 'w-[90%]', 
                                            gradient: 'from-sky-400 to-sky-500 text-sky-100' 
                                        },
                                        { 
                                            label: '۳. تشکیل جلسه (جلسه حضوری)', 
                                            count: kpiStats.funnel[LeadStatus.MEETING], 
                                            width: 'w-[80%]', 
                                            gradient: 'from-indigo-500 to-indigo-600 text-indigo-100' 
                                        },
                                        { 
                                            label: '۴. مذاکره نهایی (در حال مذاکره)', 
                                            count: kpiStats.funnel[LeadStatus.NEGOTIATION], 
                                            width: 'w-[70%]', 
                                            gradient: 'from-amber-500 to-amber-600 text-amber-100' 
                                        },
                                        { 
                                            label: '۵. خروجی موفق (خرید نهایی)', 
                                            count: kpiStats.funnel[LeadStatus.WON], 
                                            width: 'w-[60%]', 
                                            gradient: 'from-emerald-500 to-emerald-600 text-emerald-100' 
                                        }
                                    ].map((stage, sIdx, sArr) => {
                                        const totalLeads = users.length;
                                        const stageRate = totalLeads > 0 ? ((stage.count / totalLeads) * 100).toFixed(1) : '0';
                                        
                                        return (
                                            <div key={sIdx} className="flex flex-col items-center">
                                                <div className={`${stage.width} bg-gradient-to-r ${stage.gradient} rounded-2xl p-3.5 shadow-sm relative group overflow-hidden`}>
                                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <div className="flex justify-between items-center text-[11px] font-black">
                                                        <span>{stage.label}</span>
                                                        <div className="flex items-center gap-2 font-mono">
                                                            <span>{stage.count.toLocaleString('fa-IR')}</span>
                                                            <span className="opacity-75 bg-black/15 px-1.5 py-0.5 rounded-lg">{stageRate}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {sIdx < sArr.length - 1 && (
                                                    <div className="w-0.5 h-3 bg-slate-200 dark:bg-slate-700 my-0.5"></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-bold mt-6 leading-relaxed">
                                درصدها نشان‌دهنده نسبت تعداد سرنخ‌ها در هر مرحله به کل سرنخ‌های ثبت شده در سیستم هستند.
                            </p>
                        </motion.div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Filters for Manual Analytics */}
                    <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 self-end justify-end">
                        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
                            {[
                                { id: 'all', label: 'کل' },
                                { id: 'today', label: 'امروز' },
                                { id: 'week', label: 'هفته' },
                                { id: '28days', label: '۲۸ روز' }
                            ].map(range => (
                                <button 
                                    key={range.id}
                                    onClick={() => handleTimeRangeChange(range.id as TimeRange)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeRange === range.id ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <select
                                value={selectedMonth}
                                onChange={(e) => handleManualFilterChange('month', e.target.value)}
                                className="w-full sm:w-32 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 outline-none text-xs font-bold"
                            >
                                <option value="all">ماه (همه)</option>
                                {PERSIAN_MONTHS.map((m, idx) => (
                                    <option key={idx} value={idx}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={selectedDay}
                                onChange={(e) => handleManualFilterChange('day', e.target.value)}
                                disabled={selectedMonth === 'all'}
                                className="w-full sm:w-24 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 outline-none text-xs font-bold disabled:opacity-50"
                            >
                                <option value="all">روز (همه)</option>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard 
                            title={stats.isFiltered ? 'تعداد در بازه انتخابی' : 'کل مشتریان (سرنخ‌ها)'}
                            value={stats.totalUsers.toLocaleString('fa-IR')}
                            icon={Users}
                            color="bg-blue-500"
                            delay={0.1}
                        />
                        <StatCard 
                            title="ثبت نام امروز"
                            value={stats.todayRegistrations.toLocaleString('fa-IR')}
                            icon={Activity}
                            color="bg-emerald-500"
                            delay={0.2}
                        />
                        <StatCard 
                            title="فروش موفق (تکمیل شده)"
                            value={orderStats.completed.toLocaleString('fa-IR')}
                            subtitle={`نرخ تبدیل: ${orderStats.conversionRate}%`}
                            icon={ShoppingCart}
                            color="bg-amber-500"
                            delay={0.3}
                        />
                        <StatCard 
                            title="محبوب‌ترین خودرو"
                            value={stats.topCar}
                            icon={CarIcon}
                            color="bg-purple-500"
                            delay={0.4}
                        />
                    </div>

                    {/* Main Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Registration Trend Area Chart */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                روند ثبت سرنخ‌ها
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyRegistrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="count" name="تعداد" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Car Demand Pie Chart */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <CarIcon className="w-5 h-5 text-sky-500" />
                                تقاضای خودروها
                            </h3>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={carDemand}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {carDemand.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                                {carDemand.map((stat, index) => (
                                    <div key={stat.name} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate" title={stat.name}>{stat.name}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Secondary Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Province Distribution Bar Chart */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Map className="w-5 h-5 text-teal-500" />
                                پراکندگی جغرافیایی (استان‌ها)
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={provinceStats} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} width={80} />
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="value" name="تعداد" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={20}>
                                            {provinceStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Reference Source Bar Chart */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-orange-500" />
                                منابع ورودی مشتریان
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={referenceStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="value" name="تعداد" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* Success/Error Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold animate-slide-up border border-slate-700">
                    {toast.type === 'success' ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                        <span className="text-red-400 shrink-0">⚠️</span>
                    )}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
