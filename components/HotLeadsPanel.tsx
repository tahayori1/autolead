import React, { useState, useEffect } from 'react';
import type { ActiveLead } from '../types';
import Spinner from './Spinner';
import { PhoneIcon } from './icons/PhoneIcon';
import { ChatIcon } from './icons/ChatIcon';

const timeAgo = (dateString: string): string => {
    try {
        const parsableDateString = dateString.replace(' ', 'T');
        const date = new Date(parsableDateString);

        if (isNaN(date.getTime())) {
            return dateString;
        }
        
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 0) return 'همین الان';
        if (seconds < 60) return new Intl.RelativeTimeFormat('fa-IR').format(-seconds, 'second');
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return new Intl.RelativeTimeFormat('fa-IR').format(-minutes, 'minute');

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return new Intl.RelativeTimeFormat('fa-IR').format(-hours, 'hour');

        const days = Math.floor(hours / 24);
        if (days < 30) return new Intl.RelativeTimeFormat('fa-IR').format(-days, 'day');

        const months = Math.floor(days / 30);
        if (months < 12) return new Intl.RelativeTimeFormat('fa-IR').format(-months, 'month');

        const years = Math.floor(days / 365);
        return new Intl.RelativeTimeFormat('fa-IR').format(-years, 'year');

    } catch(e) {
        return dateString;
    }
};

const useTimeAgo = (dateString: string) => {
    const [timeAgoText, setTimeAgoText] = useState(() => timeAgo(dateString));

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTimeAgoText(timeAgo(dateString));
        }, 60000);

        return () => clearInterval(intervalId);
    }, [dateString]);

    return timeAgoText;
};

interface HotLeadsPanelProps {
    leads: ActiveLead[];
    isLoading: boolean;
    error: string | null;
    onViewDetails: (lead: ActiveLead) => void;
}

const HotLeadCard: React.FC<{ 
    lead: ActiveLead, 
    onViewDetails: (lead: ActiveLead) => void;
}> = ({ lead, onViewDetails }) => {
    const timeAgoText = useTimeAgo(lead.updatedAt);
    return (
        <div className="flex-shrink-0 w-72 bg-white rounded-xl shadow-md p-4 border border-slate-200 flex flex-col justify-between h-auto min-h-[12rem] text-right transition-shadow hover:shadow-lg">
            <div>
                 <h3 className="font-bold text-slate-800 truncate">{lead.FullName}</h3>
                 <p className="text-sm font-semibold text-slate-600">{lead.CarModel || 'خودرو مشخص نشده'}</p>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed overflow-hidden my-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {lead.Message || <span className="italic text-slate-400">بدون پیام</span>}
            </p>

            <div className="mt-auto pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-sky-600 font-semibold text-sm" dir="ltr">
                        <PhoneIcon className="w-4 h-4" />
                        <span>{lead.number}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <button onClick={() => onViewDetails(lead)} className="text-slate-500 hover:text-sky-600 transition-colors" title="جزئیات و تاریخچه گفتگو">
                            <ChatIcon />
                        </button>
                    </div>
                </div>
                 <p className="text-xs text-slate-400 mt-1 text-left">{timeAgoText}</p>
            </div>
        </div>
    );
};

const HotLeadsPanel: React.FC<HotLeadsPanelProps> = ({ leads, isLoading, error, onViewDetails }) => {
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-40">
                    <Spinner />
                </div>
            );
        }
        if (error) {
            return <p className="text-center text-red-600 font-semibold h-40 flex items-center justify-center">{error}</p>;
        }
        if (leads.length === 0) {
            return <p className="text-center text-slate-500 h-40 flex items-center justify-center">در حال حاضر سرنخ داغی وجود ندارد.</p>;
        }
        return (
            <div className="flex gap-4 overflow-x-auto p-2 -m-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                 <style>{`
                    .flex.gap-4.overflow-x-auto::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                 {leads.map((lead, index) => (
                    <HotLeadCard 
                        key={`${lead.number}-${index}`} 
                        lead={lead} 
                        onViewDetails={onViewDetails}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg shadow-md mb-8 border border-amber-200">
            <h2 className="text-xl font-bold text-amber-800 mb-4">
                سرنخ‌های داغ 🔥
            </h2>
            {renderContent()}
        </div>
    );
};

export default HotLeadsPanel;