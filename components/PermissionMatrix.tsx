
import React from 'react';
import type { Permission, AppModule, ActionType } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { ConditionsIcon } from './icons/ConditionsIcon';
import { CarIcon } from './icons/CarIcon';
import { PriceIcon } from './icons/PriceIcon';
import { ExitFormIcon } from './icons/ExitFormIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface PermissionMatrixProps {
    permissions: Permission[];
    onChange: (updatedPermissions: Permission[]) => void;
}

const MODULES: { key: AppModule; label: string; icon: React.ReactNode }[] = [
    { key: 'users', label: 'مشتریان', icon: <UsersIcon className="w-5 h-5" /> },
    { key: 'cars', label: 'خودروها', icon: <CarIcon className="w-5 h-5" /> },
    { key: 'conditions', label: 'شرایط فروش', icon: <ConditionsIcon className="w-5 h-5" /> },
    { key: 'prices', label: 'قیمت روز', icon: <PriceIcon className="w-5 h-5" /> },
    { key: 'vehicle-exit', label: 'فرم خروج', icon: <ExitFormIcon className="w-5 h-5" /> },
    { key: 'settings', label: 'تنظیمات', icon: <SettingsIcon className="w-5 h-5" /> },
];

const ACTIONS: { key: ActionType; label: string }[] = [
    { key: 'view', label: 'مشاهده' },
    { key: 'add', label: 'افزودن' },
    { key: 'edit', label: 'ویرایش' },
    { key: 'delete', label: 'حذف' },
];

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ permissions, onChange }) => {
    
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

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-4 py-3 text-slate-700 dark:text-slate-300 font-bold w-1/3">بخش</th>
                        {ACTIONS.map(action => (
                            <th key={action.key} className="px-2 py-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                                {action.label}
                            </th>
                        ))}
                        <th className="px-2 py-3 text-center text-slate-600 dark:text-slate-400 font-medium w-12">کل</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
                    {MODULES.map(module => {
                        const modulePerms = permissions.find(p => p.module === module.key);
                        const allChecked = modulePerms ? modulePerms.actions.length === 4 : false;
                        return (
                            <tr key={module.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                        <span className="text-slate-400 dark:text-slate-500">{module.icon}</span>
                                        <span className="font-medium">{module.label}</span>
                                    </div>
                                </td>
                                {ACTIONS.map(action => (
                                    <td key={action.key} className="px-2 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={hasPermission(module.key, action.key)}
                                            onChange={() => handleToggle(module.key, action.key)}
                                            className="w-5 h-5 text-sky-600 rounded border-slate-300 dark:border-slate-600 focus:ring-sky-500 cursor-pointer"
                                        />
                                    </td>
                                ))}
                                <td className="px-2 py-3 text-center">
                                    <input 
                                        type="checkbox"
                                        checked={allChecked}
                                        onChange={(e) => handleToggleAllRow(module.key, e.target.checked)}
                                        className="w-5 h-5 text-emerald-500 rounded border-slate-300 dark:border-slate-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default PermissionMatrix;