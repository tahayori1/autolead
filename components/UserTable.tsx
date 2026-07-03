
import React from 'react';
import { LeadStatus } from '../types';
import type { User, MyProfile } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SortIcon } from './icons/SortIcon';
import { ChatIcon } from './icons/ChatIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { UsersIcon } from './icons/UsersIcon';
import { SendToCrmIcon } from './icons/SendToCrmIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { SecurityIcon } from './icons/SecurityIcon';

interface UserTableProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (id: number) => void;
    onViewDetails: (user: User) => void;
    onSort: (key: keyof User) => void;
    sortConfig: { key: keyof User; direction: 'ascending' | 'descending' } | null;
    selectedUserIds: Set<number>;
    onSelectionChange: (userId: number) => void;
    onSelectAllChange: (selectAll: boolean) => void;
    onRegisterOrder: (user: User) => void;
    loggedInUser: MyProfile | null;
}

const UserTable: React.FC<UserTableProps> = ({ 
    users, onEdit, onDelete, onViewDetails, onSort, sortConfig, 
    selectedUserIds, onSelectionChange, onSelectAllChange,
    onRegisterOrder, loggedInUser
}) => {
    const getStatusBadge = (status?: LeadStatus) => {
        const value = status || LeadStatus.NEW;
        switch (value) {
            case LeadStatus.NEW:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        جدید
                    </span>
                );
            case LeadStatus.CONTACTED:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-slate-800">
                        تماس گرفته شده
                    </span>
                );
            case LeadStatus.MEETING:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-slate-800">
                        جلسه حضوری
                    </span>
                );
            case LeadStatus.NEGOTIATION:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-slate-800">
                        در حال مذاکره
                    </span>
                );
            case LeadStatus.WON:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-slate-800">
                        موفق
                    </span>
                );
            case LeadStatus.LOST:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-slate-800">
                        ناموفق
                    </span>
                );
            case LeadStatus.NO_ANSWER:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-slate-800">
                        پاسخ نداد
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        {value}
                    </span>
                );
        }
    };

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 border-dashed mx-4">
                <UsersIcon className="w-16 h-16 mb-4 opacity-30" />
                <p className="font-medium">هیچ سرنخی یافت نشد.</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        try {
            const parsableDateString = dateString.replace(' ', 'T');
            return new Intl.DateTimeFormat('fa-IR', {
                month: 'short',
                day: 'numeric',
            }).format(new Date(parsableDateString));
        } catch (e) {
            return dateString;
        }
    };
    
    const formatDateForTooltip = (dateString?: string) => {
        if (!dateString) return '';
        try {
            return new Date(dateString.replace(' ', 'T')).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });
        } catch {
            return dateString;
        }
    };

    const SortableHeader: React.FC<{ title: string; sortKey: keyof User; }> = ({ title, sortKey }) => {
        const isSorted = sortConfig?.key === sortKey;
        const direction = isSorted ? sortConfig.direction : 'none';

        return (
            <th scope="col" className="px-6 py-4">
                <button
                    className="flex items-center gap-1 uppercase font-bold text-xs text-slate-700 dark:text-slate-300 group hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    onClick={() => onSort(sortKey)}
                >
                    {title}
                    <SortIcon direction={direction} />
                </button>
            </th>
        );
    };

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??';
    };

    return (
        <div className="bg-transparent md:bg-white md:dark:bg-slate-800 md:rounded-[24px] md:shadow-sm md:border md:border-slate-200 md:dark:border-slate-700 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-right text-slate-600 dark:text-slate-300">
                    <thead className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                        <tr>
                            <th scope="col" className="p-4 w-4">
                                <div className="flex items-center">
                                    <input
                                        id="checkbox-all-desktop"
                                        type="checkbox"
                                        className="w-4 h-4 text-sky-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-sky-500 dark:focus:ring-sky-600 transition-all cursor-pointer"
                                        checked={users.length > 0 && users.every(u => selectedUserIds.has(u.id))}
                                        onChange={(e) => onSelectAllChange(e.target.checked)}
                                    />
                                </div>
                            </th>
                            <SortableHeader title="کاربر" sortKey="FullName" />
                            <SortableHeader title="تماس" sortKey="Number" />
                            <SortableHeader title="خودرو" sortKey="CarModel" />
                            <SortableHeader title="وضعیت سرنخ" sortKey="leadStatus" />
                            <SortableHeader title="موقعیت" sortKey="Province" />
                            <SortableHeader title="آخرین بروزرسانی" sortKey="updatedAt" />
                            <th scope="col" className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className={`border-b border-slate-50 dark:border-slate-700/50 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/50 
                                ${selectedUserIds.has(user.id) ? 'bg-sky-50/60 dark:bg-sky-900/20' : ''}
                            `}>
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <input
                                            id={`checkbox-desktop-${user.id}`}
                                            type="checkbox"
                                            className="w-4 h-4 text-sky-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-sky-500 dark:focus:ring-sky-600 transition-all cursor-pointer"
                                            checked={selectedUserIds.has(user.id)}
                                            onChange={() => onSelectionChange(user.id)}
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900 dark:to-blue-900 text-sky-700 dark:text-sky-300 flex items-center justify-center text-xs font-bold shadow-sm">
                                            {getInitials(user.FullName)}
                                        </div>
                                        <span className="font-bold text-slate-800 dark:text-slate-100">{user.FullName}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono font-medium text-slate-600 dark:text-slate-400" dir="ltr">{user.Number}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600">{user.CarModel || '-'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(user.leadStatus)}
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{user.City || user.Province || '-'}</td>
                                <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500">{formatDate(user.updatedAt)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <button 
                                            onClick={() => onRegisterOrder(user)} 
                                            className="p-2 rounded-xl transition-colors text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                            title="ثبت سفارش فروش"
                                        >
                                            <ClipboardListIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => onViewDetails(user)} 
                                            className="p-2 rounded-xl transition-colors text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                                            title="گفتگو"
                                        >
                                            <ChatIcon />
                                        </button>
                                        <button 
                                            onClick={() => onEdit(user)} 
                                            className="p-2 rounded-xl transition-colors text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                                            title="ویرایش"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(user.id)} 
                                            className="p-2 rounded-xl transition-colors text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                            title="حذف"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden flex flex-col gap-3 pb-20">
                {users.map((user) => (
                    <div 
                        key={user.id} 
                        className={`relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border transition-all 
                        ${selectedUserIds.has(user.id) ? 'border-sky-500 ring-1 ring-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-100 dark:border-slate-700'}
                        `}
                    >
                        <div className="flex items-start gap-3">
                            <div 
                                onClick={(e) => { e.stopPropagation(); onSelectionChange(user.id); }}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors mt-1 ${selectedUserIds.has(user.id) ? 'bg-sky-500 border-sky-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'}`}
                            >
                                {selectedUserIds.has(user.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                            </div>

                            <div className="flex-1 min-w-0" onClick={() => onViewDetails(user)}>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{user.FullName}</h3>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded-full flex-shrink-0 font-mono">{formatDate(user.updatedAt)}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold truncate max-w-[100px]">
                                        {user.CarModel || 'بدون خودرو'}
                                    </span>
                                    <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 font-mono" dir="ltr">
                                        <PhoneIcon className="w-3 h-3 mr-1" />
                                        {user.Number}
                                    </div>
                                </div>
                                <div className="mt-2">
                                    {getStatusBadge(user.leadStatus)}
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onRegisterOrder(user); }} 
                                    className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" 
                                    title="ثبت سفارش"
                                >
                                    <ClipboardListIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onViewDetails(user); }} 
                                    className="p-2 rounded-xl text-sky-600 bg-sky-50 dark:bg-sky-900/30"
                                >
                                    <ChatIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserTable;
