import React, { useState } from 'react';
import type { Permission, AppModule, ActionType } from '../types';
import { 
    Users, 
    FileText, 
    Car, 
    TrendingUp, 
    ShoppingBag, 
    LogOut, 
    Truck, 
    Warehouse, 
    Bell, 
    Calendar, 
    BarChart3, 
    Settings, 
    Check 
} from 'lucide-react';

interface PermissionMatrixProps {
    permissions: Permission[];
    onChange: (updatedPermissions: Permission[]) => void;
}

interface ModuleMeta {
    key: AppModule;
    label: string;
    description: string;
    icon: React.ReactNode;
    category: 'crm' | 'sales' | 'inventory' | 'hr' | 'system';
}

const MODULES: ModuleMeta[] = [
    { key: 'users', label: 'مشتریان و لیدها', description: 'ثبت، ویرایش و پیگیری مخاطبان CRM', icon: <Users className="w-4 h-4" />, category: 'crm' },
    { key: 'conditions', label: 'شرایط فروش', description: 'مدیریت طرح‌های اقساطی و نقدی', icon: <FileText className="w-4 h-4" />, category: 'sales' },
    { key: 'cars', label: 'کاتالوگ خودروها', description: 'مشخصات فنی و گالری محصولات', icon: <Car className="w-4 h-4" />, category: 'sales' },
    { key: 'prices', label: 'قیمت روز بازار', description: 'استعلام و به‌روزرسانی نرخ‌های روزانه', icon: <TrendingUp className="w-4 h-4" />, category: 'sales' },
    { key: 'orders', label: 'سفارشات فروش', description: 'قراردادها و پیش‌فاکتورهای تحویل', icon: <ShoppingBag className="w-4 h-4" />, category: 'sales' },
    { key: 'vehicle-exit', label: 'فرم خروج خودرو', description: 'مجوز ترخیص و خروج از نمایندگی', icon: <LogOut className="w-4 h-4" />, category: 'inventory' },
    { key: 'zero-car-delivery', label: 'تحویل خودرو صفر', description: 'تحویل و ثبت پرونده‌های تحویل', icon: <Truck className="w-4 h-4" />, category: 'inventory' },
    { key: 'inventory', label: 'انبار و موجودی', description: 'رهگیری خودروهای موجود در پارکینگ', icon: <Warehouse className="w-4 h-4" />, category: 'inventory' },
    { key: 'announcements', label: 'بخشنامه‌های فروش', description: 'ابلاغیه‌ها و دستورالعمل‌های رسمی', icon: <Bell className="w-4 h-4" />, category: 'system' },
    { key: 'leave-requests', label: 'درخواست‌های مرخصی', description: 'مرخصی‌های ساعتی و روزانه پرسنل', icon: <Calendar className="w-4 h-4" />, category: 'hr' },
    { key: 'reports', label: 'گزارشات و آمار', description: 'داشبوردهای مدیریتی و عملکردی', icon: <BarChart3 className="w-4 h-4" />, category: 'system' },
    { key: 'settings', label: 'تنظیمات سامانه', description: 'پیکربندی عمومی و دسترسی‌ها', icon: <Settings className="w-4 h-4" />, category: 'system' },
];

const ACTIONS: { key: ActionType; label: string }[] = [
    { key: 'view', label: 'مشاهده' },
    { key: 'add', label: 'افزودن' },
    { key: 'edit', label: 'ویرایش' },
    { key: 'delete', label: 'حذف' },
];

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ permissions, onChange }) => {
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'crm' | 'sales' | 'inventory' | 'hr' | 'system'>('ALL');

    const hasPermission = (module: AppModule, action: ActionType) => {
        const perm = permissions.find(p => p.module === module);
        return perm?.actions.includes(action) || false;
    };

    const handleToggle = (module: AppModule, action: ActionType) => {
        const updatedPermissions = JSON.parse(JSON.stringify(permissions));
        let modulePerm = updatedPermissions.find((p: Permission) => p.module === module);

        if (!modulePerm) {
            modulePerm = { module, actions: [] };
            updatedPermissions.push(modulePerm);
        }

        const actionIndex = modulePerm.actions.indexOf(action);
        if (actionIndex > -1) {
            modulePerm.actions.splice(actionIndex, 1);
        } else {
            modulePerm.actions.push(action);
        }
        
        onChange(updatedPermissions.filter((p: Permission) => p.actions.length > 0));
    };

    const handleToggleAllRow = (module: AppModule, enable: boolean) => {
        const updatedPermissions = JSON.parse(JSON.stringify(permissions));
        let modulePerm = updatedPermissions.find((p: Permission) => p.module === module);

        if (enable) {
            const allActions: ActionType[] = ['view', 'add', 'edit', 'delete'];
            if (modulePerm) {
                modulePerm.actions = allActions;
            } else {
                updatedPermissions.push({ module, actions: allActions });
            }
        } else {
            if (modulePerm) {
                modulePerm.actions = [];
            }
        }
        onChange(updatedPermissions.filter((p: Permission) => p.actions.length > 0));
    };

    const handleGrantAll = () => {
        const all: Permission[] = MODULES.map(m => ({
            module: m.key,
            actions: ['view', 'add', 'edit', 'delete']
        }));
        onChange(all);
    };

    const handleGrantViewOnly = () => {
        const viewOnly: Permission[] = MODULES.map(m => ({
            module: m.key,
            actions: ['view']
        }));
        onChange(viewOnly);
    };

    const handleClearAll = () => {
        onChange([]);
    };

    const displayedModules = filterCategory === 'ALL' 
        ? MODULES 
        : MODULES.filter(m => m.category === filterCategory);

    return (
        <div className="space-y-3">
            {/* Quick Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                        type="button"
                        onClick={handleGrantAll}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                        <Check className="w-3.5 h-3.5" />
                        <span>انتخاب تمام دسترسی‌ها</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleGrantViewOnly}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition-colors"
                    >
                        فقط مشاهده همه
                    </button>
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-colors"
                    >
                        لغو همه
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setFilterCategory('ALL')}
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${filterCategory === 'ALL' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        همه ({MODULES.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterCategory('sales')}
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${filterCategory === 'sales' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        فروش
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterCategory('inventory')}
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${filterCategory === 'inventory' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        انبار
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterCategory('hr')}
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${filterCategory === 'hr' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        اداری
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-slate-700 dark:text-slate-300 font-bold w-2/5">بخش / ماژول</th>
                            {ACTIONS.map(action => (
                                <th key={action.key} className="px-2 py-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                                    {action.label}
                                </th>
                            ))}
                            <th className="px-2 py-3 text-center text-slate-600 dark:text-slate-400 font-medium w-12">کل</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {displayedModules.map(module => {
                            const modulePerms = permissions.find(p => p.module === module.key);
                            const allChecked = modulePerms ? modulePerms.actions.length === 4 : false;
                            return (
                                <tr key={module.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                                            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                                                {module.icon}
                                            </span>
                                            <div>
                                                <span className="font-bold text-xs block leading-tight">{module.label}</span>
                                                <span className="text-[11px] text-slate-400 hidden sm:block leading-tight mt-0.5">{module.description}</span>
                                            </div>
                                        </div>
                                    </td>
                                    {ACTIONS.map(action => (
                                        <td key={action.key} className="px-2 py-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={hasPermission(module.key, action.key)}
                                                onChange={() => handleToggle(module.key, action.key)}
                                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600 focus:ring-emerald-500 cursor-pointer"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-2 py-2 text-center">
                                        <input 
                                            type="checkbox"
                                            checked={allChecked}
                                            onChange={(e) => handleToggleAllRow(module.key, e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PermissionMatrix;
