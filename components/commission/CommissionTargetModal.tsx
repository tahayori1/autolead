import React, { useState, useEffect } from 'react';
import { 
    X, 
    Target, 
    Plus, 
    Trash2, 
    Sparkles, 
    CheckCircle2, 
    Zap, 
    FileText, 
    Layers, 
    AlertCircle,
    RotateCcw,
    Award
} from 'lucide-react';
import { CommissionPeriod, MonthlyCommissionTarget, CommissionTargetGoal, CommissionCategory } from '../../types';
import { DEFAULT_SAMPLE_MONTHLY_TARGET } from '../../services/commissionService';

interface CommissionTargetModalProps {
    isOpen: boolean;
    onClose: () => void;
    period: CommissionPeriod;
    onSaveTarget: (target: MonthlyCommissionTarget) => void;
}

export const CommissionTargetModal: React.FC<CommissionTargetModalProps> = ({
    isOpen,
    onClose,
    period,
    onSaveTarget
}) => {
    const [title, setTitle] = useState('');
    const [goals, setGoals] = useState<CommissionTargetGoal[]>([]);
    const [specialNotes, setSpecialNotes] = useState('');
    const [instantPayoutModels, setInstantPayoutModels] = useState<string[]>([]);
    const [instantModelInput, setInstantModelInput] = useState('');

    useEffect(() => {
        if (period) {
            if (period.target) {
                setTitle(period.target.title || `تارگت فروش ${period.title}`);
                setGoals(period.target.goals ? JSON.parse(JSON.stringify(period.target.goals)) : []);
                setSpecialNotes(period.target.specialNotes || '');
                setInstantPayoutModels(period.target.instantPayoutModels || []);
            } else {
                // Initialize with intelligent default template based on user sample
                setTitle(`تارگت فروش ${period.title}`);
                setGoals([
                    {
                        id: `goal-${Date.now()}-1`,
                        title: '۱. دو ثبت نام لیزینگ',
                        category: 'LEASING',
                        targetCount: 2,
                        modelKeyword: '',
                        rewardText: 'واریز پورسانت با ضریب طلایی'
                    },
                    {
                        id: `goal-${Date.now()}-2`,
                        title: '۲. فروش سه دستگاه خودروهای موجود انبار (مدل ۱۴۰۴ و ۱۴۰۵)',
                        category: 'ANBAR',
                        targetCount: 3,
                        modelKeyword: '1404,1405,۱۴۰۴,۱۴۰۵',
                        rewardText: 'پاداش ویژه تخلیه موجودی انبار'
                    },
                    {
                        id: `goal-${Date.now()}-3`,
                        title: '۳. فروش سه دستگاه حواله ایگل',
                        category: 'HAVALEH',
                        targetCount: 3,
                        modelKeyword: 'eagle,ایگل',
                        rewardText: 'پاداش فروش حواله ایگل'
                    }
                ]);
                setSpecialNotes('در ضمن کمیسیون دو دستگاه جی۴ مشکی ۱۴۰۴ و یک دستگاه ایگل مشکی ۱۴۰۴ آنی واریز خواهد شد.');
                setInstantPayoutModels(['جی۴ مشکی ۱۴۰۴', 'ایگل مشکی ۱۴۰۴']);
            }
        }
    }, [period, isOpen]);

    if (!isOpen) return null;

    const handleAddGoal = () => {
        const newGoal: CommissionTargetGoal = {
            id: `goal-${Date.now()}`,
            title: `هدف ${goals.length + 1}`,
            category: 'ANY',
            targetCount: 1,
            modelKeyword: '',
            rewardText: ''
        };
        setGoals([...goals, newGoal]);
    };

    const handleUpdateGoal = (id: string, field: keyof CommissionTargetGoal, value: any) => {
        setGoals(goals.map(g => {
            if (g.id === id) {
                return { ...g, [field]: value };
            }
            return g;
        }));
    };

    const handleRemoveGoal = (id: string) => {
        setGoals(goals.filter(g => g.id !== id));
    };

    const handleAddInstantModel = () => {
        if (!instantModelInput.trim()) return;
        if (!instantPayoutModels.includes(instantModelInput.trim())) {
            setInstantPayoutModels([...instantPayoutModels, instantModelInput.trim()]);
        }
        setInstantModelInput('');
    };

    const handleRemoveInstantModel = (item: string) => {
        setInstantPayoutModels(instantPayoutModels.filter(m => m !== item));
    };

    const handleLoadSamplePreset = () => {
        setTitle(`تارگت فروش ${period.title}`);
        setGoals(JSON.parse(JSON.stringify(DEFAULT_SAMPLE_MONTHLY_TARGET.goals)));
        setSpecialNotes(DEFAULT_SAMPLE_MONTHLY_TARGET.specialNotes || '');
        setInstantPayoutModels(DEFAULT_SAMPLE_MONTHLY_TARGET.instantPayoutModels || []);
    };

    const handleSave = () => {
        const target: MonthlyCommissionTarget = {
            title: title.trim() || `تارگت فروش ${period.title}`,
            goals,
            specialNotes: specialNotes.trim(),
            instantPayoutModels,
            status: 'ACTIVE',
            announcedDate: new Date().toLocaleDateString('fa-IR')
        };
        onSaveTarget(target);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-800/40 dark:to-indigo-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                تنظیم و تعیین تارگت ماهانه
                                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold">
                                    {period.title}
                                </span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                تعریف اهداف فروش، مدل‌های دارای اولویت و ضوابط واریز آنی کمیسیون
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleLoadSamplePreset}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                            title="بارگذاری نمونه پیش‌فرض (۲ لیزینگ + ۳ انبار ۱۴۰۴/۱۴۰۵ + ۳ حواله ایگل + واریز آنی)"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            نمونه آماده
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
                    
                    {/* Target Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            عنوان تارگت ماه:
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={`مثلاً: تارگت فروش ${period.title}`}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>

                    {/* Goals List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Award className="w-4 h-4 text-indigo-600" />
                                بندها و اهداف مشخص‌شده فروش (تارگت‌های عددی):
                            </label>
                            <button
                                type="button"
                                onClick={handleAddGoal}
                                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 rounded-xl font-bold transition-colors flex items-center gap-1 text-[11px]"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                افزودن هدف جدید
                            </button>
                        </div>

                        {goals.length === 0 ? (
                            <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                                <AlertCircle className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                                هنوز هیچ هدفی برای این ماه اضافه نشده است. روی «افزودن هدف جدید» یا «نمونه آماده» کلیک کنید.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {goals.map((goal, idx) => (
                                    <div 
                                        key={goal.id}
                                        className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5 transition-all hover:border-indigo-300"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                                {idx + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={goal.title}
                                                onChange={(e) => handleUpdateGoal(goal.id, 'title', e.target.value)}
                                                placeholder="شرح تارگت (مثلاً: فروش ۳ دستگاه حواله ایگل)"
                                                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveGoal(goal.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                                title="حذف این بند"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                                            <div>
                                                <span className="text-slate-400 block mb-1">دسته معامله:</span>
                                                <select
                                                    value={goal.category || 'ANY'}
                                                    onChange={(e) => handleUpdateGoal(goal.id, 'category', e.target.value as CommissionCategory | 'ANY')}
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold"
                                                >
                                                    <option value="ANY">همه دسته‌ها</option>
                                                    <option value="LEASING">فروش لیزینگ (LEASING)</option>
                                                    <option value="ANBAR">فروش انبار (ANBAR)</option>
                                                    <option value="HAVALEH">فروش حواله (HAVALEH)</option>
                                                    <option value="AZAD">فروش آزاد (AZAD)</option>
                                                    <option value="REGISTRATION">ثبت‌نام کارخانه</option>
                                                </select>
                                            </div>

                                            <div>
                                                <span className="text-slate-400 block mb-1">تعداد هدف (دستگاه/قرارداد):</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={goal.targetCount}
                                                    onChange={(e) => handleUpdateGoal(goal.id, 'targetCount', Number(e.target.value) || 1)}
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-center font-mono"
                                                />
                                            </div>

                                            <div>
                                                <span className="text-slate-400 block mb-1">فیلتر مدل / سال ساخت:</span>
                                                <input
                                                    type="text"
                                                    value={goal.modelKeyword || ''}
                                                    onChange={(e) => handleUpdateGoal(goal.id, 'modelKeyword', e.target.value)}
                                                    placeholder="مثلاً: 1404,1405 یا ایگل یا j4"
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Special Notes & Instant Payout Terms */}
                    <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-xs">
                            <Zap className="w-4 h-4 text-amber-600 fill-amber-500/20" />
                            تبصره واریز آنی کمیسیون و اطلاعیه ویژه ماه:
                        </div>

                        <div>
                            <textarea
                                value={specialNotes}
                                onChange={(e) => setSpecialNotes(e.target.value)}
                                rows={2}
                                placeholder="مثلاً: در ضمن کمیسیون دو دستگاه جی۴ مشکی ۱۴۰۴ و یک دستگاه ایگل مشکی ۱۴۰۴ آنی واریز خواهد شد."
                                className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                            />
                        </div>

                        {/* Instant Models Tags */}
                        <div>
                            <span className="text-[11px] text-amber-800 dark:text-amber-400 font-bold block mb-1.5">
                                خودروهای مشمول تسویه و واریز آنی کمیسیون:
                            </span>
                            
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {instantPayoutModels.map((model) => (
                                    <span 
                                        key={model}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-xs border border-amber-300 dark:border-amber-700"
                                    >
                                        ⚡ {model}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveInstantModel(model)}
                                            className="text-amber-700 hover:text-rose-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={instantModelInput}
                                    onChange={(e) => setInstantModelInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddInstantModel();
                                        }
                                    }}
                                    placeholder="افزودن نام خودرو (مثلاً: جی۴ مشکی ۱۴۰۴)"
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddInstantModel}
                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition-colors"
                                >
                                    افزودن
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl transition-colors"
                    >
                        انصراف
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        ذخیره و ابلاغ تارگت {period.title}
                    </button>
                </div>

            </div>
        </div>
    );
};
