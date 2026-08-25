import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    PieChart, Pie, Cell
} from 'recharts';
import { 
    Trophy, Award, Crown, TrendingUp, Users, Phone, PhoneCall, 
    CheckCircle2, Clock, Calendar, Search, ArrowUpDown, 
    Eye, Copy, Check, Download, Printer, Filter, Star, 
    Sparkles, Target, Zap, Activity, ShoppingCart, UserCheck, 
    FileSpreadsheet, ArrowUpRight, CheckCheck, X
} from 'lucide-react';
import type { User, CarOrder, CrmCallLog, CrmMeeting, StaffUser } from '../types';
import { LeadStatus } from '../types';
import * as XLSX from 'xlsx';

declare const moment: any;

interface StaffPerformanceReportProps {
    users: User[];
    orders: CarOrder[];
    callLogs: CrmCallLog[];
    meetings: CrmMeeting[];
    staffUsers?: StaffUser[];
    showToast: (message: string, type: 'success' | 'error') => void;
}

export interface StaffPerformanceData {
    id: string;
    name: string;
    username: string;
    role: string;
    // Leads
    assignedLeadsCount: number;
    wonLeadsCount: number;
    inProgressLeadsCount: number;
    lostLeadsCount: number;
    newLeadsCount: number;
    // Calls
    totalCalls: number;
    successfulCalls: number;
    inboundCalls: number;
    outboundCalls: number;
    missedOrNoAnswerCalls: number;
    totalCallDurationMinutes: number;
    callSuccessRate: number; // %
    // Meetings
    totalMeetings: number;
    completedMeetings: number;
    scheduledMeetings: number;
    cancelledMeetings: number;
    meetingSuccessRate: number; // %
    // Orders
    totalOrders: number;
    completedOrders: number;
    totalOrderAmount: number;
    // Conversion & Score
    conversionRate: number; // %
    performanceScore: number; // 0 - 100+
    rank: number;
    badgeTitle: string;
    badgeColor: string;
    efficiencyStatus: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'NEEDS_IMPROVEMENT';
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e', '#06b6d4', '#84cc16'];

const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

type PeriodType = 'today' | 'week' | 'month' | 'all' | 'custom';
type SortField = 'performanceScore' | 'wonLeadsCount' | 'successfulCalls' | 'completedMeetings' | 'conversionRate' | 'assignedLeadsCount' | 'totalOrders';

export const StaffPerformanceReport: React.FC<StaffPerformanceReportProps> = ({
    users,
    orders,
    callLogs,
    meetings,
    staffUsers = [],
    showToast
}) => {
    // Period filter states
    const [period, setPeriod] = useState<PeriodType>('month');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<SortField>('performanceScore');
    const [sortAsc, setSortAsc] = useState<boolean>(false);
    
    // Active chart view
    const [activeChartMetric, setActiveChartMetric] = useState<'score' | 'calls' | 'meetings' | 'sales' | 'conversion'>('score');

    // Selected staff for scorecard modal
    const [selectedStaffForModal, setSelectedStaffForModal] = useState<StaffPerformanceData | null>(null);

    // Custom Date Range states (Jalali)
    const [customStartYear, setCustomStartYear] = useState<string>('1405');
    const [customStartMonth, setCustomStartMonth] = useState<string>('01');
    const [customStartDay, setCustomStartDay] = useState<string>('01');

    const [customEndYear, setCustomEndYear] = useState<string>('1405');
    const [customEndMonth, setCustomEndMonth] = useState<string>('12');
    const [customEndDay, setCustomEndDay] = useState<string>('29');

    // Initialize custom date defaults
    React.useEffect(() => {
        try {
            const now = moment().locale('fa');
            const currentJYear = now.jYear().toString();
            const currentJMonth = (now.jMonth() + 1).toString().padStart(2, '0');
            const currentJDay = now.jDate().toString().padStart(2, '0');
            
            setCustomStartYear(currentJYear);
            setCustomStartMonth(currentJMonth);
            setCustomStartDay('01');
            
            setCustomEndYear(currentJYear);
            setCustomEndMonth(currentJMonth);
            setCustomEndDay(currentJDay);
        } catch (e) {
            console.error("Error setting custom date defaults in StaffPerformanceReport", e);
        }
    }, []);

    // Helper to check if a date string falls within selected period
    const isDateInPeriod = (dateStr?: string | null): boolean => {
        if (!dateStr) return false;
        try {
            const now = moment().locale('fa');
            let m;
            
            // Clean up date string
            const cleaned = dateStr.trim().replace(' ', 'T');
            if (cleaned.includes('/') || cleaned.includes('-')) {
                m = moment(cleaned).locale('fa');
            } else {
                m = moment(dateStr).locale('fa');
            }

            if (!m.isValid()) {
                // Try parsing standard Jalali format YYYY/MM/DD or YYYY-MM-DD
                const parts = dateStr.split(/[\/\-\sT]/);
                if (parts.length >= 3) {
                    const y = parseInt(parts[0], 10);
                    if (y > 1300 && y < 1500) {
                        m = moment(`${parts[0]}/${parts[1]}/${parts[2]}`, 'jYYYY/jMM/jDD').locale('fa');
                    }
                }
            }

            if (!m || !m.isValid()) return false;

            if (period === 'all') return true;
            if (period === 'today') return m.isSame(now, 'day');
            if (period === 'week') return m.isSameOrAfter(now.clone().subtract(6, 'days').startOf('day'));
            if (period === 'month') return m.isSameOrAfter(now.clone().subtract(29, 'days').startOf('day'));
            
            if (period === 'custom') {
                const startM = moment(`${customStartYear}/${customStartMonth}/${customStartDay}`, 'jYYYY/jMM/jDD').locale('fa').startOf('day');
                const endM = moment(`${customEndYear}/${customEndMonth}/${customEndDay}`, 'jYYYY/jMM/jDD').locale('fa').endOf('day');
                return m.isSameOrAfter(startM, 'day') && m.isSameOrBefore(endM, 'day');
            }

            return true;
        } catch (e) {
            return false;
        }
    };

    // Filter raw datasets based on active period
    const filteredCallLogs = useMemo(() => {
        return callLogs.filter(log => isDateInPeriod(log.timestamp));
    }, [callLogs, period, customStartYear, customStartMonth, customStartDay, customEndYear, customEndMonth, customEndDay]);

    const filteredMeetings = useMemo(() => {
        return meetings.filter(m => isDateInPeriod(m.meetingDate || m.createdAt));
    }, [meetings, period, customStartYear, customStartMonth, customStartDay, customEndYear, customEndMonth, customEndDay]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => isDateInPeriod(o.createdAt));
    }, [orders, period, customStartYear, customStartMonth, customStartDay, customEndYear, customEndMonth, customEndDay]);

    const filteredLeads = useMemo(() => {
        return users.filter(u => isDateInPeriod(u.RegisterTime || u.createdAt || u.crmDate));
    }, [users, period, customStartYear, customStartMonth, customStartDay, customEndYear, customEndMonth, customEndDay]);

    // Build consolidated list of staff identities
    const staffMembersMap = useMemo(() => {
        const map = new Map<string, { id: string; name: string; username: string; role: string }>();

        // 1. From staffUsers
        staffUsers.forEach(s => {
            const key = s.fullName?.trim() || s.username?.trim();
            if (key) {
                map.set(key, {
                    id: String(s.id),
                    name: s.fullName?.trim() || s.username?.trim(),
                    username: s.username?.trim() || s.fullName?.trim(),
                    role: s.role === 'ADMIN' ? 'مدیر سیستم / فروش' : 'کارشناس فروش'
                });
            }
        });

        // 2. From call logs
        filteredCallLogs.forEach(c => {
            const agent = c.agentName?.trim();
            if (agent && !map.has(agent)) {
                map.set(agent, {
                    id: agent,
                    name: agent,
                    username: agent,
                    role: 'کارشناس فروش'
                });
            }
        });

        // 3. From meetings
        filteredMeetings.forEach(m => {
            const agent = m.agentName?.trim();
            if (agent && !map.has(agent)) {
                map.set(agent, {
                    id: agent,
                    name: agent,
                    username: agent,
                    role: 'کارشناس فروش'
                });
            }
        });

        // 4. From leads
        filteredLeads.forEach(u => {
            const person = u.reservedByUserName?.trim() || u.crmPerson?.trim();
            if (person && !map.has(person)) {
                map.set(person, {
                    id: person,
                    name: person,
                    username: person,
                    role: 'کارشناس فروش'
                });
            }
        });

        // 5. From orders
        filteredOrders.forEach(o => {
            const creator = o.createdBy?.trim();
            if (creator && !map.has(creator)) {
                map.set(creator, {
                    id: creator,
                    name: creator,
                    username: creator,
                    role: 'کارشناس فروش'
                });
            }
        });

        return map;
    }, [staffUsers, filteredCallLogs, filteredMeetings, filteredLeads, filteredOrders]);

    // Calculate aggregated metrics for each staff member
    const calculatedStaffStats = useMemo<StaffPerformanceData[]>(() => {
        const staffList: StaffPerformanceData[] = [];

        staffMembersMap.forEach((staffInfo, staffKey) => {
            const nameLower = staffInfo.name.toLowerCase();
            const usernameLower = staffInfo.username.toLowerCase();

            // Match helper
            const isMatch = (target?: string | null) => {
                if (!target) return false;
                const t = target.trim().toLowerCase();
                return t === nameLower || t === usernameLower || t === staffKey.toLowerCase();
            };

            // 1. Leads assigned to this staff
            const staffLeads = filteredLeads.filter(u => 
                isMatch(u.reservedByUserName) || isMatch(u.crmPerson)
            );
            const assignedLeadsCount = staffLeads.length;
            const wonLeadsCount = staffLeads.filter(u => u.leadStatus === LeadStatus.WON).length;
            const lostLeadsCount = staffLeads.filter(u => u.leadStatus === LeadStatus.LOST).length;
            const newLeadsCount = staffLeads.filter(u => !u.leadStatus || u.leadStatus === LeadStatus.NEW).length;
            const inProgressLeadsCount = staffLeads.filter(u => 
                u.leadStatus === LeadStatus.CONTACTED || 
                u.leadStatus === LeadStatus.MEETING || 
                u.leadStatus === LeadStatus.NEGOTIATION
            ).length;

            // 2. Call logs by this staff
            const staffCalls = filteredCallLogs.filter(c => isMatch(c.agentName));
            const totalCalls = staffCalls.length;
            const successfulCalls = staffCalls.filter(c => c.callStatus === 'SUCCESSFUL').length;
            const outboundCalls = staffCalls.filter(c => c.callType === 'OUTBOUND').length;
            const inboundCalls = staffCalls.filter(c => c.callType === 'INBOUND').length;
            const missedOrNoAnswerCalls = staffCalls.filter(c => 
                c.callStatus === 'MISSED' || c.callStatus === 'NO_ANSWER' || c.callStatus === 'BUSY' || c.callStatus === 'REJECTED'
            ).length;
            const totalCallDurationSeconds = staffCalls.reduce((acc, c) => acc + (Number(c.duration) || 0), 0);
            const totalCallDurationMinutes = Math.round(totalCallDurationSeconds / 60);
            const callSuccessRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

            // 3. Meetings held by this staff
            const staffMeetings = filteredMeetings.filter(m => isMatch(m.agentName));
            const totalMeetings = staffMeetings.length;
            const completedMeetings = staffMeetings.filter(m => m.stage === 'برگزار شد').length;
            const scheduledMeetings = staffMeetings.filter(m => m.stage === 'تعیین وقت' || m.stage === 'دعوت').length;
            const cancelledMeetings = staffMeetings.filter(m => m.stage === 'برگزار نشد').length;
            const meetingSuccessRate = totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0;

            // 4. Car Orders submitted by this staff
            const staffOrders = filteredOrders.filter(o => isMatch(o.createdBy));
            const totalOrders = staffOrders.length;
            const completedOrders = staffOrders.filter(o => o.status === 'تکمیل شده').length;
            const totalOrderAmount = staffOrders.reduce((acc, o) => acc + (Number(o.proposedPrice || o.finalPrice) || 0), 0);

            // 5. Conversion Rate
            const totalOpportunities = assignedLeadsCount + (totalOrders > assignedLeadsCount ? totalOrders : 0);
            const totalSuccesses = wonLeadsCount + completedOrders;
            const conversionRate = totalOpportunities > 0 
                ? Math.min(100, Math.round((totalSuccesses / totalOpportunities) * 100))
                : (totalCalls > 0 && wonLeadsCount > 0 ? Math.round((wonLeadsCount / totalCalls) * 100) : 0);

            // 6. Comprehensive Weighted Performance Score Calculation
            // Weights:
            // - Each Won Lead / Completed Sale: +30 points
            // - Each In-Person Meeting Completed: +15 points
            // - Each Successful Call: +3 points
            // - Each Outbound Call made: +1 point
            // - Each Lead in active progress/negotiation: +2 points
            // - Conversion rate bonus: (conversionRate * 0.4)
            const rawScore = 
                (wonLeadsCount * 30) +
                (completedOrders * 25) +
                (completedMeetings * 15) +
                (scheduledMeetings * 5) +
                (successfulCalls * 3) +
                (outboundCalls * 1) +
                (inProgressLeadsCount * 2) +
                Math.round(conversionRate * 0.5);

            // Determine Efficiency Status
            let efficiencyStatus: StaffPerformanceData['efficiencyStatus'] = 'AVERAGE';
            if (rawScore >= 80 || (wonLeadsCount >= 3 && completedMeetings >= 2)) {
                efficiencyStatus = 'EXCELLENT';
            } else if (rawScore >= 40 || wonLeadsCount >= 1 || successfulCalls >= 10) {
                efficiencyStatus = 'GOOD';
            } else if (totalCalls === 0 && totalMeetings === 0 && assignedLeadsCount === 0) {
                efficiencyStatus = 'NEEDS_IMPROVEMENT';
            }

            staffList.push({
                id: staffInfo.id,
                name: staffInfo.name,
                username: staffInfo.username,
                role: staffInfo.role,
                assignedLeadsCount,
                wonLeadsCount,
                inProgressLeadsCount,
                lostLeadsCount,
                newLeadsCount,
                totalCalls,
                successfulCalls,
                inboundCalls,
                outboundCalls,
                missedOrNoAnswerCalls,
                totalCallDurationMinutes,
                callSuccessRate,
                totalMeetings,
                completedMeetings,
                scheduledMeetings,
                cancelledMeetings,
                meetingSuccessRate,
                totalOrders,
                completedOrders,
                totalOrderAmount,
                conversionRate,
                performanceScore: rawScore,
                efficiencyStatus,
                rank: 1, // Will assign after sorting
                badgeTitle: 'کارشناس فعال',
                badgeColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300'
            });
        });

        // Sort descending by performance score to assign ranks
        staffList.sort((a, b) => b.performanceScore - a.performanceScore);

        // Assign ranks and badges
        staffList.forEach((staff, index) => {
            staff.rank = index + 1;
            if (index === 0 && staff.performanceScore > 0) {
                staff.badgeTitle = '🥇 ستاره طلایی و نفر برتر فروش';
                staff.badgeColor = 'text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300';
            } else if (index === 1 && staff.performanceScore > 0) {
                staff.badgeTitle = '🥈 رتبه دوم و عملکرد ممتاز';
                staff.badgeColor = 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
            } else if (index === 2 && staff.performanceScore > 0) {
                staff.badgeTitle = '🥉 رتبه سوم و کارشناس کوشا';
                staff.badgeColor = 'text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200';
            } else if (staff.successfulCalls >= 20) {
                staff.badgeTitle = '📞 پیشتاز تماس‌ها و پیگیری';
                staff.badgeColor = 'text-sky-700 bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300 border-sky-300';
            } else if (staff.completedMeetings >= 5) {
                staff.badgeTitle = '🤝 قهرمان جلسات حضوری';
                staff.badgeColor = 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300';
            } else if (staff.conversionRate >= 30) {
                staff.badgeTitle = '🎯 بالاترین نرخ تبدیل';
                staff.badgeColor = 'text-purple-700 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300';
            } else {
                staff.badgeTitle = '🚗 کارشناس فروش';
                staff.badgeColor = 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400';
            }
        });

        return staffList;
    }, [staffMembersMap, filteredLeads, filteredCallLogs, filteredMeetings, filteredOrders]);

    // Filter and sort for the leaderboard table
    const displayedStaffList = useMemo(() => {
        let list = [...calculatedStaffStats];

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.trim().toLowerCase();
            list = list.filter(s => 
                s.name.toLowerCase().includes(term) || 
                s.username.toLowerCase().includes(term) ||
                s.badgeTitle.toLowerCase().includes(term)
            );
        }

        // Sorting
        list.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            if (typeof valA === 'string') valA = (valA as string).toLowerCase();
            if (typeof valB === 'string') valB = (valB as string).toLowerCase();

            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });

        return list;
    }, [calculatedStaffStats, searchTerm, sortField, sortAsc]);

    // Top 3 performers
    const top3Performers = useMemo(() => {
        return calculatedStaffStats.slice(0, 3).filter(s => s.performanceScore > 0);
    }, [calculatedStaffStats]);

    // Aggregated team totals for overview
    const teamTotals = useMemo(() => {
        const totalStaff = calculatedStaffStats.length;
        const totalCalls = calculatedStaffStats.reduce((a, b) => a + b.totalCalls, 0);
        const totalSuccessfulCalls = calculatedStaffStats.reduce((a, b) => a + b.successfulCalls, 0);
        const totalMeetings = calculatedStaffStats.reduce((a, b) => a + b.completedMeetings, 0);
        const totalWonLeads = calculatedStaffStats.reduce((a, b) => a + b.wonLeadsCount, 0);
        const totalOrders = calculatedStaffStats.reduce((a, b) => a + b.totalOrders, 0);
        const avgScore = totalStaff > 0 ? Math.round(calculatedStaffStats.reduce((a, b) => a + b.performanceScore, 0) / totalStaff) : 0;
        const overallConversion = totalCalls > 0 && totalWonLeads > 0 
            ? Math.round((totalWonLeads / (totalCalls + totalMeetings || 1)) * 100)
            : 0;

        return {
            totalStaff,
            totalCalls,
            totalSuccessfulCalls,
            totalMeetings,
            totalWonLeads,
            totalOrders,
            avgScore,
            overallConversion
        };
    }, [calculatedStaffStats]);

    // Chart data based on selected metric
    const chartData = useMemo(() => {
        return calculatedStaffStats.slice(0, 10).map(s => ({
            name: s.name.length > 12 ? `${s.name.slice(0, 12)}...` : s.name,
            fullName: s.name,
            score: s.performanceScore,
            calls: s.successfulCalls,
            totalCalls: s.totalCalls,
            meetings: s.completedMeetings,
            sales: s.wonLeadsCount + s.completedOrders,
            conversion: s.conversionRate
        }));
    }, [calculatedStaffStats]);

    // Period label generator
    const getPeriodLabel = () => {
        if (period === 'today') return 'امروز';
        if (period === 'week') return 'هفتگی (۷ روز اخیر)';
        if (period === 'month') return 'ماهانه (۳۰ روز اخیر)';
        if (period === 'custom') return `بازه دلخواه (${customStartYear}/${customStartMonth}/${customStartDay} تا ${customEndYear}/${customEndMonth}/${customEndDay})`;
        return 'کل دوره فعالیت';
    };

    // Copy Text Report for Sales Manager
    const handleCopyReportText = () => {
        const nowStr = moment().locale('fa').format('YYYY/MM/DD');
        const periodTitle = getPeriodLabel();

        let leaderboardText = '';
        calculatedStaffStats.forEach((s, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
            leaderboardText += `${medal} *${s.name}*
   ▫️ امتیاز: *${s.performanceScore.toLocaleString('fa-IR')}* | رتبه: *${(idx + 1).toLocaleString('fa-IR')}*
   ▫️ فروش موفق: *${s.wonLeadsCount.toLocaleString('fa-IR')}* معامله ✅
   ▫️ تماس‌های موفق: *${s.successfulCalls.toLocaleString('fa-IR')}* از ${s.totalCalls.toLocaleString('fa-IR')} تماس 📞
   ▫️ جلسات برگزار شده: *${s.completedMeetings.toLocaleString('fa-IR')}* جلسه 🤝
   ▫️ نرخ تبدیل: *${s.conversionRate.toLocaleString('fa-IR')}٪* 🎯
\n`;
        });

        const text = `📊 *گزارش و رتبه‌بندی عملکرد کارشناسان فروش* 📊
📅 *تاریخ:* ${nowStr}
⏱️ *بازه ارزیابی:* ${periodTitle}
👥 *تعداد کارشناسان ارزیابی‌شده:* ${calculatedStaffStats.length.toLocaleString('fa-IR')} نفر

━━━━━━━━━━━━━━━━━━━━
🏆 *خلاصه شاخص‌های کلیدی تیم فروش:*
⚡ کل تماس‌های برقرار شده: ${teamTotals.totalCalls.toLocaleString('fa-IR')} تماس
✅ تماس‌های موفق: ${teamTotals.totalSuccessfulCalls.toLocaleString('fa-IR')} تماس
🤝 جلسات حضوری برگزار شده: ${teamTotals.totalMeetings.toLocaleString('fa-IR')} جلسه
🎉 معاملات و خریدهای موفق (Won): ${teamTotals.totalWonLeads.toLocaleString('fa-IR')} معامله
📈 میانگین امتیاز عملکرد تیم: ${teamTotals.avgScore.toLocaleString('fa-IR')} امتیاز

━━━━━━━━━━━━━━━━━━━━
🏅 *جدول رتبه‌بندی و لیدربورد کارمندان:*
${leaderboardText}
━━━━━━━━━━━━━━━━━━━━
🚗 *سامانه یکپارچه مدیریت فروش و CRM حسینی خودرو*`;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('گزارش رتبه‌بندی کارمندان با موفقیت کپی شد', 'success');
            }).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    };

    const fallbackCopy = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('گزارش رتبه‌بندی کارمندان با موفقیت کپی شد', 'success');
        } catch (err) {
            showToast('خطا در کپی گزارش', 'error');
        }
        document.body.removeChild(textArea);
    };

    // Export to Excel
    const handleExportExcel = () => {
        try {
            const dataToExport = calculatedStaffStats.map((s, index) => ({
                'رتبه': index + 1,
                'نام کارشناس': s.name,
                'نام کاربری': s.username,
                'سمت': s.role,
                'امتیاز عملکرد': s.performanceScore,
                'نشان و وضعیت': s.badgeTitle,
                'کل سرنخ‌های اختصاصی': s.assignedLeadsCount,
                'معاملات موفق (Won)': s.wonLeadsCount,
                'سرنخ‌های در جریان': s.inProgressLeadsCount,
                'سرنخ‌های از دست رفته': s.lostLeadsCount,
                'کل تماس‌ها': s.totalCalls,
                'تماس‌های موفق': s.successfulCalls,
                'تماس‌های خروجی': s.outboundCalls,
                'تماس‌های ورودی': s.inboundCalls,
                'مدت مکالمه (دقیقه)': s.totalCallDurationMinutes,
                'درصد موفقیت تماس (%)': s.callSuccessRate,
                'کل جلسات حضوری': s.totalMeetings,
                'جلسات برگزار شده': s.completedMeetings,
                'جلسات لغو شده': s.cancelledMeetings,
                'سفارشات خودرو ثبت‌شده': s.totalOrders,
                'نرخ تبدیل نهایی (%)': s.conversionRate
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'رتبه‌بندی کارمندان');
            
            const fileName = `گزارش_رتبه_بندی_کارشناسان_${moment().locale('fa').format('YYYY-MM-DD')}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            showToast('فایل اکسل رتبه‌بندی کارمندان با موفقیت ذخیره شد', 'success');
        } catch (e) {
            console.error('Error exporting to Excel', e);
            showToast('خطا در دانلود فایل اکسل', 'error');
        }
    };

    // Print table
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Control Panel for Sales Manager */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Title & Description */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    گزارش جامع عملکرد و رتبه‌بندی کارشناسان فروش (CRM)
                                    <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                                        ویژه مدیر فروش 🎯
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                    ارزیابی روزانه، هفتگی و ماهانه تماس‌ها، جلسات حضوری، تبدیل سرنخ‌ها به فروش و لیدربورد پرسنل
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Period Switcher & Actions */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Period Selector */}
                        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                            {[
                                { id: 'today', label: 'امروز ⚡' },
                                { id: 'week', label: 'هفتگی (۷ روز) 📅' },
                                { id: 'month', label: 'ماهانه (۳۰ روز) 🗓️' },
                                { id: 'all', label: 'کل دوره 🎯' },
                                { id: 'custom', label: 'تاریخ دلخواه 📆' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setPeriod(item.id as PeriodType)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                                        period === item.id 
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm scale-100' 
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Export & Copy Actions */}
                        <button
                            onClick={handleCopyReportText}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                            title="کپی گزارش متنی رتبه‌بندی پرسنل"
                        >
                            <Copy className="w-4 h-4" />
                            <span>کپی متن گزارش 📋</span>
                        </button>

                        <button
                            onClick={handleExportExcel}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                            title="دانلود فایل اکسل"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>اکسل</span>
                        </button>

                        <button
                            onClick={handlePrint}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                            title="چاپ کارنامه"
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Custom Persian Range Filter Accordion */}
                {period === 'custom' && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {/* Start Date */}
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                            <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 block">شروع بازه ارزیابی کارمندان:</span>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-400 font-bold block">روز</label>
                                    <select 
                                        value={customStartDay} 
                                        onChange={(e) => setCustomStartDay(e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                                    >
                                        {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-400 font-bold block">ماه</label>
                                    <select 
                                        value={customStartMonth} 
                                        onChange={(e) => setCustomStartMonth(e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                                    >
                                        {PERSIAN_MONTHS.map((m, idx) => {
                                            const mVal = (idx + 1).toString().padStart(2, '0');
                                            return <option key={mVal} value={mVal}>{m}</option>;
                                        })}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-400 font-bold block">سال</label>
                                    <select 
                                        value={customStartYear} 
                                        onChange={(e) => setCustomStartYear(e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                                    >
                                        <option value="1404">۱۴۰۴</option>
                                        <option value="1405">۱۴۰۵</option>
                                        <option value="1406">۱۴۰۶</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                            <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 block">پایان بازه ارزیابی کارمندان:</span>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-400 font-bold block">روز</label>
                                    <select 
                                        value={customEndDay} 
                                        onChange={(e) => setCustomEndDay(e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                                    >
                                        {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-400 font-bold block">ماه</label>
                                    <select 
                                        value={customEndMonth} 
                                        onChange={(e) => setCustomEndMonth(e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                                    >
                                        {PERSIAN_MONTHS.map((m, idx) => {
                                            const mVal = (idx + 1).toString().padStart(2, '0');
                                            return <option key={mVal} value={mVal}>{m}</option>;
                                        })}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-slate-400 font-bold block">سال</label>
                                    <select 
                                        value={customEndYear} 
                                        onChange={(e) => setCustomEndYear(e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                                    >
                                        <option value="1404">۱۴۰۴</option>
                                        <option value="1405">۱۴۰۵</option>
                                        <option value="1406">۱۴۰۶</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Team Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-slate-400 dark:text-slate-500">تعداد کارشناسان</span>
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800 dark:text-white font-mono">
                            {teamTotals.totalStaff.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-xs text-slate-400">نفر فعال</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">میانگین امتیاز تیم: {teamTotals.avgScore.toLocaleString('fa-IR')} pts</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-slate-400 dark:text-slate-500">تماس‌های موفق تیم</span>
                        <div className="p-2.5 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl">
                            <PhoneCall className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800 dark:text-white font-mono">
                            {teamTotals.totalSuccessfulCalls.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-xs text-slate-400">از {teamTotals.totalCalls.toLocaleString('fa-IR')} تماس</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div 
                            className="bg-sky-500 h-full rounded-full transition-all"
                            style={{ width: `${teamTotals.totalCalls > 0 ? (teamTotals.totalSuccessfulCalls / teamTotals.totalCalls) * 100 : 0}%` }}
                        />
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-slate-400 dark:text-slate-500">جلسات حضوری موفق</span>
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800 dark:text-white font-mono">
                            {teamTotals.totalMeetings.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-xs text-slate-400">جلسه برگزار شده</span>
                    </div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-black flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        تعاملات رو در رو با مشتریان
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-slate-400 dark:text-slate-500">معاملات موفق (Won Leads)</span>
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                            <Award className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800 dark:text-white font-mono">
                            {teamTotals.totalWonLeads.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-xs text-slate-400">خرید نهایی</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        ثبت {teamTotals.totalOrders.toLocaleString('fa-IR')} پیش‌سفارش خودرو
                    </p>
                </motion.div>
            </div>

            {/* Top 3 Performers Podium (سکوی افتخار و رتبه‌بندی ۳ کارشناس برتر) */}
            {top3Performers.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-500" />
                            سکوی افتخار و ۳ کارشناس برتر در دوره ({getPeriodLabel()})
                        </h4>
                        <span className="text-xs text-slate-400 font-bold">رتبه‌بندی هوشمند بر مبنای امتیاز کل عملکرد</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {top3Performers.map((staff, idx) => {
                            const isFirst = idx === 0;
                            const isSecond = idx === 1;
                            const isThird = idx === 2;

                            return (
                                <motion.div
                                    key={staff.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => setSelectedStaffForModal(staff)}
                                    className={`relative p-6 rounded-[28px] cursor-pointer transition-all duration-300 hover:shadow-xl group border ${
                                        isFirst 
                                        ? 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white dark:to-slate-800 border-amber-300 dark:border-amber-700/60 shadow-amber-500/10'
                                        : isSecond
                                        ? 'bg-gradient-to-b from-slate-400/10 via-slate-400/5 to-white dark:to-slate-800 border-slate-300 dark:border-slate-700 shadow-slate-400/10'
                                        : 'bg-gradient-to-b from-amber-800/10 via-amber-800/5 to-white dark:to-slate-800 border-amber-600/30 dark:border-amber-800 shadow-amber-800/10'
                                    }`}
                                >
                                    {/* Podium Rank Badge */}
                                    <div className="absolute top-4 left-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shadow-md ${
                                            isFirst 
                                            ? 'bg-gradient-to-tr from-amber-400 to-amber-600 text-white shadow-amber-500/30 ring-4 ring-amber-100 dark:ring-amber-900/40' 
                                            : isSecond
                                            ? 'bg-gradient-to-tr from-slate-400 to-slate-600 text-white shadow-slate-500/30 ring-4 ring-slate-100 dark:ring-slate-800'
                                            : 'bg-gradient-to-tr from-amber-700 to-amber-900 text-white shadow-amber-800/30 ring-4 ring-amber-50 dark:ring-amber-950'
                                        }`}>
                                            {isFirst ? '🥇' : isSecond ? '🥈' : '🥉'}
                                        </div>
                                    </div>

                                    {/* Staff Info */}
                                    <div className="flex items-center gap-3.5 mb-5">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-xl shadow-inner border border-indigo-200 dark:border-indigo-800 shrink-0">
                                            {staff.name.slice(0, 1)}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                {staff.name}
                                            </h4>
                                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block mt-0.5">
                                                @{staff.username}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Badge */}
                                    <div className="mb-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${staff.badgeColor}`}>
                                            {staff.badgeTitle}
                                        </span>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4">
                                        <div className="text-center">
                                            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">امتیاز کل</span>
                                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                                {staff.performanceScore.toLocaleString('fa-IR')}
                                            </span>
                                        </div>
                                        <div className="text-center border-x border-slate-200 dark:border-slate-700/60">
                                            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">فروش موفق</span>
                                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                                {staff.wonLeadsCount.toLocaleString('fa-IR')}
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">جلسات موفق</span>
                                            <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                                                {staff.completedMeetings.toLocaleString('fa-IR')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer Details */}
                                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                        <span className="flex items-center gap-1 font-bold">
                                            <Phone className="w-3.5 h-3.5 text-sky-500" />
                                            {staff.successfulCalls.toLocaleString('fa-IR')} تماس موفق ({staff.callSuccessRate}٪)
                                        </span>
                                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-black group-hover:translate-x-[-4px] transition-transform flex items-center gap-0.5">
                                            مشاهده کارنامه 👈
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Visual Analytics & Comparison Charts */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-700/60 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            نمودار تحلیلی مقایسه فعالیت و بازدهی کارشناسان
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">مقایسه حجم و کیفیت عملکرد پرسنل بر اساس شاخص‌های کلیدی</p>
                    </div>

                    {/* Metric Tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl self-start">
                        {[
                            { id: 'score', label: 'امتیاز عملکرد ⚡' },
                            { id: 'sales', label: 'فروش و خریدهای موفق 🏆' },
                            { id: 'calls', label: 'تماس‌های موفق 📞' },
                            { id: 'meetings', label: 'جلسات حضوری 🤝' },
                            { id: 'conversion', label: 'نرخ تبدیل (٪) 🎯' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveChartMetric(tab.id as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    activeChartMetric === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[320px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} 
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <Tooltip 
                                cursor={{ fill: '#f8fafc', opacity: 0.7 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900 text-white p-3.5 rounded-2xl text-xs font-bold shadow-xl border border-slate-700 space-y-1.5">
                                                <p className="text-amber-400 font-black border-b border-slate-700 pb-1">{data.fullName}</p>
                                                <p className="flex justify-between gap-4">
                                                    <span className="text-slate-400">امتیاز عملکرد:</span>
                                                    <span className="font-mono text-indigo-300 font-black">{data.score} pts</span>
                                                </p>
                                                <p className="flex justify-between gap-4">
                                                    <span className="text-slate-400">فروش موفق:</span>
                                                    <span className="font-mono text-emerald-400 font-black">{data.sales} معامله</span>
                                                </p>
                                                <p className="flex justify-between gap-4">
                                                    <span className="text-slate-400">تماس‌های موفق:</span>
                                                    <span className="font-mono text-sky-400 font-black">{data.calls} از {data.totalCalls}</span>
                                                </p>
                                                <p className="flex justify-between gap-4">
                                                    <span className="text-slate-400">جلسات حضوری:</span>
                                                    <span className="font-mono text-purple-400 font-black">{data.meetings} جلسه</span>
                                                </p>
                                                <p className="flex justify-between gap-4">
                                                    <span className="text-slate-400">نرخ تبدیل:</span>
                                                    <span className="font-mono text-pink-400 font-black">{data.conversion}٪</span>
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar 
                                dataKey={activeChartMetric} 
                                fill="#6366f1" 
                                radius={[8, 8, 0, 0]} 
                                barSize={36}
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Leaderboard Table (جدول جامع رتبه‌بندی کارشناسان) */}
            <div className="bg-white dark:bg-slate-800 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                {/* Table Header & Search Filter */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-500" />
                            جدول رتبه‌بندی و مقایسه پرسنل فروش
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                            نمایش {displayedStaffList.length.toLocaleString('fa-IR')} نفر | برای تغییر ترتیب روی عنوان ستون‌ها کلیک نمایید
                        </p>
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text"
                            placeholder="جستجوی نام یا نشان کارشناس..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>

                {/* Responsive Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                        <thead>
                            <tr className="bg-slate-50/75 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 font-black border-b border-slate-100 dark:border-slate-700/60 select-none">
                                <th 
                                    onClick={() => {
                                        if (sortField === 'performanceScore') setSortAsc(!sortAsc);
                                        else { setSortField('performanceScore'); setSortAsc(false); }
                                    }}
                                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                    <div className="flex items-center gap-1">
                                        <span>رتبه و نشان</span>
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="py-4 px-4">کارشناس</th>
                                <th 
                                    onClick={() => {
                                        if (sortField === 'assignedLeadsCount') setSortAsc(!sortAsc);
                                        else { setSortField('assignedLeadsCount'); setSortAsc(false); }
                                    }}
                                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                    <div className="flex items-center gap-1">
                                        <span>سرنخ‌های تحت پوشش</span>
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th 
                                    onClick={() => {
                                        if (sortField === 'successfulCalls') setSortAsc(!sortAsc);
                                        else { setSortField('successfulCalls'); setSortAsc(false); }
                                    }}
                                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                    <div className="flex items-center gap-1">
                                        <span>تماس‌های موفق</span>
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th 
                                    onClick={() => {
                                        if (sortField === 'completedMeetings') setSortAsc(!sortAsc);
                                        else { setSortField('completedMeetings'); setSortAsc(false); }
                                    }}
                                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                    <div className="flex items-center gap-1">
                                        <span>جلسات حضوری</span>
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th 
                                    onClick={() => {
                                        if (sortField === 'wonLeadsCount') setSortAsc(!sortAsc);
                                        else { setSortField('wonLeadsCount'); setSortAsc(false); }
                                    }}
                                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                    <div className="flex items-center gap-1">
                                        <span>معاملات موفق (Won)</span>
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th 
                                    onClick={() => {
                                        if (sortField === 'conversionRate') setSortAsc(!sortAsc);
                                        else { setSortField('conversionRate'); setSortAsc(false); }
                                    }}
                                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                    <div className="flex items-center gap-1">
                                        <span>نرخ تبدیل</span>
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th 
                                    onClick={() => {
                                        if (sortField === 'performanceScore') setSortAsc(!sortAsc);
                                        else { setSortField('performanceScore'); setSortAsc(false); }
                                    }}
                                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                    <div className="flex items-center gap-1">
                                        <span>امتیاز عملکرد</span>
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="py-4 px-4 text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                            {displayedStaffList.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-400">
                                        هیچ کارشناسی در این بازه یا فیلتر یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                displayedStaffList.map((staff) => {
                                    const isTop1 = staff.rank === 1 && staff.performanceScore > 0;
                                    const isTop2 = staff.rank === 2 && staff.performanceScore > 0;
                                    const isTop3 = staff.rank === 3 && staff.performanceScore > 0;

                                    return (
                                        <tr 
                                            key={staff.id}
                                            className="hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors group"
                                        >
                                            {/* Rank */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                                                        isTop1 
                                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                                                        : isTop2 
                                                        ? 'bg-slate-400 text-white shadow-md' 
                                                        : isTop3 
                                                        ? 'bg-amber-800 text-white' 
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                    }`}>
                                                        {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : staff.rank}
                                                    </span>
                                                    {isTop1 && (
                                                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                                            صدرنشین
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Staff Name & Role */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-xs shrink-0">
                                                        {staff.name.slice(0, 1)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 dark:text-white">
                                                            {staff.name}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400">
                                                            @{staff.username}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Assigned Leads */}
                                            <td className="py-4 px-4">
                                                <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                                    {staff.assignedLeadsCount.toLocaleString('fa-IR')}
                                                </div>
                                                <span className="text-[10px] text-slate-400">
                                                    {staff.inProgressLeadsCount} در حال پیگیری
                                                </span>
                                            </td>

                                            {/* Calls */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="font-black text-sky-600 dark:text-sky-400 font-mono text-sm">
                                                        {staff.successfulCalls.toLocaleString('fa-IR')}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        / {staff.totalCalls.toLocaleString('fa-IR')}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 block font-mono">
                                                    {staff.totalCallDurationMinutes} دقیقه مکالمه
                                                </span>
                                            </td>

                                            {/* Meetings */}
                                            <td className="py-4 px-4">
                                                <div className="font-black text-slate-800 dark:text-white font-mono text-sm">
                                                    {staff.completedMeetings.toLocaleString('fa-IR')}
                                                </div>
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                                    {staff.meetingSuccessRate}٪ نرخ برگزاری
                                                </span>
                                            </td>

                                            {/* Won Deals */}
                                            <td className="py-4 px-4">
                                                <div className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm flex items-center gap-1">
                                                    <CheckCheck className="w-3.5 h-3.5" />
                                                    {staff.wonLeadsCount.toLocaleString('fa-IR')}
                                                </div>
                                                {staff.totalOrders > 0 && (
                                                    <span className="text-[10px] text-slate-400 block">
                                                        {staff.totalOrders} پیش‌سفارش
                                                    </span>
                                                )}
                                            </td>

                                            {/* Conversion Rate */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-12 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                        <div 
                                                            className="bg-purple-600 h-full rounded-full"
                                                            style={{ width: `${Math.min(100, staff.conversionRate)}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-mono font-black text-purple-600 dark:text-purple-400">
                                                        {staff.conversionRate}٪
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Score */}
                                            <td className="py-4 px-4">
                                                <div className="font-mono font-black text-base text-indigo-600 dark:text-indigo-400">
                                                    {staff.performanceScore.toLocaleString('fa-IR')}
                                                </div>
                                                <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-black mt-0.5 ${staff.badgeColor}`}>
                                                    {staff.badgeTitle.replace(/🥇|🥈|🥉|📞|🤝|🎯|🚗/g, '').trim()}
                                                </span>
                                            </td>

                                            {/* Action Button */}
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    onClick={() => setSelectedStaffForModal(staff)}
                                                    className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 mx-auto"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>کارنامه</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Individual Staff Detailed Scorecard Modal (مدال کارنامه تفصیلی و تحلیل انفرادی کارشناس) */}
            <AnimatePresence>
                {selectedStaffForModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/30 shadow-md">
                                        {selectedStaffForModal.name.slice(0, 1)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black">{selectedStaffForModal.name}</h3>
                                            <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                                                رتبه {selectedStaffForModal.rank.toLocaleString('fa-IR')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-indigo-100 mt-0.5">
                                            @{selectedStaffForModal.username} • {selectedStaffForModal.role}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedStaffForModal(null)}
                                    className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                                {/* Score & Badge Banner */}
                                <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">نشان و عنوان کسب‌شده:</span>
                                        <p className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                            {selectedStaffForModal.badgeTitle}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <span className="text-xs text-slate-400 font-bold block">مجموع امتیاز</span>
                                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                            {selectedStaffForModal.performanceScore.toLocaleString('fa-IR')} pts
                                        </span>
                                    </div>
                                </div>

                                {/* KPI Metrics 4-Box */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                                        <span className="text-[10px] text-slate-400 font-bold block mb-1">سرنخ‌های لید</span>
                                        <span className="text-xl font-black text-slate-800 dark:text-white font-mono">
                                            {selectedStaffForModal.assignedLeadsCount.toLocaleString('fa-IR')}
                                        </span>
                                        <span className="text-[9px] text-indigo-500 block mt-1">{selectedStaffForModal.inProgressLeadsCount} در جریان</span>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                                        <span className="text-[10px] text-slate-400 font-bold block mb-1">تماس‌های موفق</span>
                                        <span className="text-xl font-black text-sky-600 dark:text-sky-400 font-mono">
                                            {selectedStaffForModal.successfulCalls.toLocaleString('fa-IR')}
                                        </span>
                                        <span className="text-[9px] text-slate-400 block mt-1">{selectedStaffForModal.totalCallDurationMinutes} دقیقه</span>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                                        <span className="text-[10px] text-slate-400 font-bold block mb-1">جلسات برگزار شده</span>
                                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                            {selectedStaffForModal.completedMeetings.toLocaleString('fa-IR')}
                                        </span>
                                        <span className="text-[9px] text-emerald-600 block mt-1">{selectedStaffForModal.meetingSuccessRate}٪ موفق</span>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                                        <span className="text-[10px] text-slate-400 font-bold block mb-1">معاملات نهایی (Won)</span>
                                        <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                                            {selectedStaffForModal.wonLeadsCount.toLocaleString('fa-IR')}
                                        </span>
                                        <span className="text-[9px] text-purple-600 block mt-1">نرخ تبدیل {selectedStaffForModal.conversionRate}٪</span>
                                    </div>
                                </div>

                                {/* Call & Meeting Breakdown Charts */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Call Status Breakdown */}
                                    <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <h5 className="text-xs font-black text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                                            <Phone className="w-4 h-4 text-sky-500" />
                                            تفکیک وضعیت تماس‌ها
                                        </h5>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">تماس موفق و پاسخ‌داده:</span>
                                                <span className="font-black text-emerald-600 font-mono">{selectedStaffForModal.successfulCalls}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">بی‌پاسخ / رد شده:</span>
                                                <span className="font-black text-rose-500 font-mono">{selectedStaffForModal.missedOrNoAnswerCalls}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">تماس خروجی (پیگیری):</span>
                                                <span className="font-black text-indigo-600 font-mono">{selectedStaffForModal.outboundCalls}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">تماس ورودی (پاسخگویی):</span>
                                                <span className="font-black text-sky-600 font-mono">{selectedStaffForModal.inboundCalls}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meetings & Leads Breakdown */}
                                    <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <h5 className="text-xs font-black text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-purple-500" />
                                            وضعیت پیگیری لیدها و جلسات
                                        </h5>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">جلسات برگزار شده:</span>
                                                <span className="font-black text-emerald-600 font-mono">{selectedStaffForModal.completedMeetings}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">جلسات در انتظار وقت:</span>
                                                <span className="font-black text-amber-500 font-mono">{selectedStaffForModal.scheduledMeetings}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">خرید نهایی (موفق):</span>
                                                <span className="font-black text-emerald-600 font-mono">{selectedStaffForModal.wonLeadsCount}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">لیدهای ناموفق:</span>
                                                <span className="font-black text-slate-400 font-mono">{selectedStaffForModal.lostLeadsCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Coaching & Manager Recommendation */}
                                <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                                    <h5 className="text-xs font-black text-indigo-900 dark:text-indigo-200 mb-1 flex items-center gap-1.5">
                                        <Zap className="w-4 h-4 text-indigo-500" />
                                        توصیه مربی‌گری و هدایت فروش برای مدیر:
                                    </h5>
                                    <p className="text-xs text-indigo-800/90 dark:text-indigo-300 leading-relaxed">
                                        {selectedStaffForModal.conversionRate >= 20 
                                            ? `کارشناس ${selectedStaffForModal.name} دارای نرخ تبدیل بسیار عالی (${selectedStaffForModal.conversionRate}٪) می‌باشد. پیشنهاد می‌شود لیدهای VIP و داغ بیشتری به ایشان واگذار گردد.`
                                            : selectedStaffForModal.successfulCalls >= 15
                                            ? `حجم تماس‌های خروجی و پیگیری کارشناس مناسب است؛ برای ارتقای نرخ تبدیل، تمرکز بر روی دعوت مشتریان به جلسات حضوری نمایندگی توصیه می‌شود.`
                                            : `نیاز به پیگیری منظم‌تر سرنخ‌های اختصاص‌یافته و افزایش تعداد تماس‌های روزانه جهت دستیابی به تارگت‌های فروش دوره.`
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                <button
                                    onClick={() => setSelectedStaffForModal(null)}
                                    className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-black transition-all"
                                >
                                    بستن کارنامه
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StaffPerformanceReport;
