
import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, getCars, carOrdersService } from '../services/api';
import type { User, Car, CarOrder } from '../types';
import { OrderStatus } from '../types';
import Spinner from '../components/Spinner';
import { motion } from 'framer-motion';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { 
    ChartBar, Users, Car as CarIcon, Map, Megaphone, 
    Calendar, Filter, TrendingUp, Activity, ShoppingCart
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
        <div className="animate-fade-in pb-20 space-y-8">
            {/* Header & Filters */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                        <ChartBar className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white">گزارشات تحلیلی</h2>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">نمای کلی عملکرد و آمار سیستم</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    {/* Quick Filters */}
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
    );
};

export default ReportsPage;
