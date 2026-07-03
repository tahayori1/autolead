import React from 'react';
import AnnouncementsSubPage from '../components/AnnouncementsSubPage';
import { Tag } from 'lucide-react';

const AnnouncementsHubPage: React.FC<{ loggedInUser: any }> = ({ loggedInUser }) => {
    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-900 to-slate-800 rounded-2xl p-8 mb-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-teal-500/20 p-4 rounded-xl border border-teal-400/30">
                            <Tag className="w-8 h-8 text-teal-300" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">اطلاعیه‌های سازمانی</h1>
                            <p className="text-teal-200 text-sm font-medium">مشاهده آخرین اخبار، بخشنامه‌های داخلی و اطلاعیه‌های همکاران</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-6">
                <AnnouncementsSubPage loggedInUser={loggedInUser} />
            </div>
        </main>
    );
};

export default AnnouncementsHubPage;
