import React, { useState } from 'react';
import { 
    Target, 
    CheckCircle2, 
    TrendingUp, 
    Zap, 
    Edit3, 
    Award, 
    Calendar,
    ChevronDown,
    ChevronUp,
    Sparkles,
    AlertCircle,
    Check,
    CreditCard,
    Building2,
    FileText,
    Repeat,
    ClipboardList
} from 'lucide-react';
import { CommissionPeriod, CommissionDeal, MonthlyCommissionTarget, CommissionCategory } from '../../types';
import { calculateGoalProgress } from '../../services/commissionService';

interface CommissionMonthlyTargetCardProps {
    period: CommissionPeriod;
    deals: CommissionDeal[];
    onEditTarget: () => void;
    userRoleLabel?: string;
}

export const CommissionMonthlyTargetCard: React.FC<CommissionMonthlyTargetCardProps> = ({
    period,
    deals,
    onEditTarget,
    userRoleLabel
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const target = period?.target;

    const getCategoryIcon = (cat?: CommissionCategory | 'ANY') => {
        switch (cat) {
            case 'LEASING': return <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
            case 'ANBAR': return <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
            case 'HAVALEH': return <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
            case 'AZAD': return <Repeat className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
            case 'REGISTRATION': return <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
            default: return <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
        }
    };

    if (!target || !target.goals || target.goals.length === 0) {
        return (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl border border-indigo-500/20 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in" dir="rtl">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30 shrink-0">
                        <Target className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-white">
                                پایش اهداف فروش ماهانه ({period?.title || 'دوره جاری'})
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                بدون تارگت تعریف‌شده
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                            تعریف اهداف ماهانه (لیزینگ، انبار، حواله و شرایط واریز فوری) جهت ارزیابی پیشرفت و ایجاد انگیزه در تیم فروش.
                        </p>
                    </div>
                </div>

                <button
                    onClick={onEditTarget}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-2xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95"
                >
                    <Target className="w-4 h-4" />
                    تنظیم تارگت ماه {period?.title}
                </button>
            </div>
        );
    }

    // Compute overall stats
    let totalTargetUnits = 0;
    let totalAchievedUnits = 0;
    let completedGoalsCount = 0;

    const goalProgressList = target.goals.map(goal => {
        const progress = calculateGoalProgress(goal, deals);
        totalTargetUnits += goal.targetCount;
        totalAchievedUnits += progress.count;
        if (progress.isCompleted) completedGoalsCount++;
        return {
            goal,
            progress
        };
    });

    const overallPercentage = totalTargetUnits > 0 ? Math.min(100, Math.round((totalAchievedUnits / totalTargetUnits) * 100)) : 100;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden mb-6 animate-fade-in" dir="rtl">
            
            {/* Header / Banner */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30 shrink-0">
                        <Target className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                                {period.title}
                            </span>
                            <h3 className="text-sm sm:text-base font-black text-white">
                                {target.title || `تارگت فروش ${period.title}`}
                            </h3>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                            اهداف مصوب، پیشرفت تحقق شاخص‌های ماهانه و تسهیلات واریز آنی کمیسیون
                        </p>
                    </div>
                </div>

                {/* Progress Summary and Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 text-xs flex items-center gap-3">
                        <div>
                            <span className="text-[10px] text-slate-400 block font-medium">تحقق کل:</span>
                            <span className="font-mono font-black text-emerald-400 text-sm">
                                {overallPercentage}٪
                            </span>
                        </div>
                        <div className="w-px h-6 bg-white/20" />
                        <div>
                            <span className="text-[10px] text-slate-400 block font-medium">تکمیل اهداف:</span>
                            <span className="font-mono font-bold text-white text-xs">
                                {completedGoalsCount} از {target.goals.length}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onEditTarget}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                        title="ویرایش یا بازتعریف اهداف ماه"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        ویرایش اهداف
                    </button>

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 text-slate-400 hover:text-white rounded-2xl hover:bg-white/10 transition-colors"
                        title={isCollapsed ? 'نمایش جزئیات' : 'جمع کردن کارت'}
                    >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Expandable Body */}
            {!isCollapsed && (
                <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                    
                    {/* Target Goals Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {goalProgressList.map(({ goal, progress }) => {
                            const isDone = progress.isCompleted;

                            return (
                                <div 
                                    key={goal.id}
                                    className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                                        isDone 
                                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-sm'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
                                    }`}
                                >
                                    {/* Top badge */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 shadow-xs border border-slate-200/60 dark:border-slate-600">
                                                {getCategoryIcon(goal.category)}
                                            </div>
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                                {goal.title}
                                            </span>
                                        </div>

                                        {isDone ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] shadow-xs shrink-0">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                                تکمیل شد
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold shrink-0">
                                                {progress.count} / {goal.targetCount}
                                            </span>
                                        )}
                                    </div>

                                    {/* Model filter note if present */}
                                    {goal.modelKeyword && (
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 font-medium">
                                            مدل‌های مدنظر: <span className="font-bold text-slate-700 dark:text-slate-200">{goal.modelKeyword}</span>
                                        </div>
                                    )}

                                    {/* Progress bar */}
                                    <div className="space-y-1.5 mt-2">
                                        <div className="flex justify-between text-[11px] font-mono">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">عملکرد ثبت‌شده:</span>
                                            <span className={`font-bold ${isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                {progress.count} از {goal.targetCount} دستگاه ({progress.percentage}٪)
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isDone 
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                                                        : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                                }`}
                                                style={{ width: `${progress.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Special Announcement / Instant Commission Payout Banner */}
                    {target.specialNotes && (
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3 text-xs">
                            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                                <Zap className="w-4 h-4 fill-white" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                                    <span>دستورالعمل تسویه و واریز آنی کمیسیون:</span>
                                    {target.instantPayoutModels && target.instantPayoutModels.length > 0 && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-mono font-bold">
                                            {target.instantPayoutModels.join(' • ')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-amber-900 dark:text-amber-300 font-bold leading-relaxed text-xs">
                                    {target.specialNotes}
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            )}

        </div>
    );
};
