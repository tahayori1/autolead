
import React from 'react';
import { User, LeadStatus, MyProfile } from '../types';
import { PhoneIcon } from './icons/PhoneIcon';
import { UserIcon } from './icons/UserIcon';
import { ChatIcon } from './icons/ChatIcon';

interface CrmKanbanBoardProps {
    users: User[];
    onStatusChange: (userId: number, newStatus: LeadStatus) => void;
    onViewDetails: (user: User) => void;
    loggedInUser: MyProfile | null;
}

const COLUMNS: { status: LeadStatus; label: string; color: string; bg: string }[] = [
    { status: LeadStatus.NEW, label: 'سرنخ جدید', color: 'border-slate-300', bg: 'bg-slate-50' },
    { status: LeadStatus.CONTACTED, label: 'تماس گرفته شده', color: 'border-blue-300', bg: 'bg-blue-50' },
    { status: LeadStatus.MEETING, label: 'جلسه حضوری', color: 'border-yellow-300', bg: 'bg-yellow-50' },
    { status: LeadStatus.NEGOTIATION, label: 'در حال مذاکره', color: 'border-purple-300', bg: 'bg-purple-50' },
    { status: LeadStatus.WON, label: 'موفق (فروش)', color: 'border-emerald-300', bg: 'bg-emerald-50' },
    { status: LeadStatus.LOST, label: 'ناموفق', color: 'border-red-300', bg: 'bg-red-50' },
];

const CrmKanbanBoard: React.FC<CrmKanbanBoardProps> = ({ users, onStatusChange, onViewDetails, loggedInUser }) => {
    
    const handleDragStart = (e: React.DragEvent, user: User) => {
        e.dataTransfer.setData('userId', user.id.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
        e.preventDefault();
        const userId = parseInt(e.dataTransfer.getData('userId'), 10);
        if (userId) {
            onStatusChange(userId, status);
        }
    };

    const getColumnUsers = (status: LeadStatus) => {
        return users.filter(u => (u.leadStatus || LeadStatus.NEW) === status);
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] min-h-[500px]">
            {COLUMNS.map(col => {
                const columnUsers = getColumnUsers(col.status);
                
                return (
                    <div 
                        key={col.status}
                        className={`flex-shrink-0 w-80 rounded-xl flex flex-col border border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/50`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.status)}
                    >
                        {/* Header */}
                        <div className={`p-4 rounded-t-xl border-t-4 ${col.color} bg-white dark:bg-slate-800 shadow-sm mb-2`}>
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-white">{col.label}</h3>
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full font-mono font-bold">
                                    {columnUsers.length}
                                </span>
                            </div>
                        </div>

                        {/* Cards Container */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
                            {columnUsers.map(user => (
                                <div
                                    key={user.id}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, user)}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md group transition-all cursor-grab active:cursor-grabbing"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm truncate max-w-[180px]">
                                            {user.FullName}
                                        </div>
                                        <button 
                                            onClick={() => onViewDetails(user)}
                                            className="transition-colors text-slate-400 hover:text-sky-600"
                                        >
                                            <ChatIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                                        <PhoneIcon className="w-3 h-3" />
                                        <span className="font-mono" dir="ltr">{user.Number}</span>
                                    </div>

                                    {user.CarModel && (
                                        <div className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-1 rounded-md w-fit font-bold mb-2">
                                            {user.CarModel}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(user.updatedAt).toLocaleDateString('fa-IR')}
                                        </span>
                                        
                                        {/* Mobile Move Dropdown (visible on hover or focus) */}
                                        <select
                                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-[10px] rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-sky-500 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            value={user.leadStatus || LeadStatus.NEW}
                                            onChange={(e) => onStatusChange(user.id, e.target.value as LeadStatus)}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {COLUMNS.map(c => (
                                                <option key={c.status} value={c.status}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CrmKanbanBoard;
