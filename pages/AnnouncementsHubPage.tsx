import React from 'react';
import AnnouncementsSubPage from '../components/AnnouncementsSubPage';
import { Megaphone, Mail, ShieldCheck, Tag } from 'lucide-react';

const AnnouncementsHubPage: React.FC<{ loggedInUser: any }> = ({ loggedInUser }) => {
    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-500/20 p-4 rounded-2xl border border-indigo-400/30 text-indigo-300">
                            <Megaphone className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                    تابلو اعلانات و بخشنامه‌های سازمانی
                                </h1>
                                <span className="bg-indigo-500/30 text-indigo-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                                    نسخه هوشمند CRM
                                </span>
                            </div>
                            <p className="text-indigo-200/80 text-xs sm:text-sm font-medium">
                                ابلاغ بخشنامه‌های رسمی، پشتیبانی از چسباندن (Paste) مستقیم ایمیل‌های سازمانی و تفکیک بر اساس سطح دسترسی
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-200/70">
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                            <Mail className="w-3.5 h-3.5 text-sky-400" />
                            <span>پشتیبانی از جداول ایمیل</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                            <Tag className="w-3.5 h-3.5 text-indigo-400" />
                            <span>تگ‌گذاری چندگانه</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>سطوح دسترسی اختصاصی</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div>
                <AnnouncementsSubPage loggedInUser={loggedInUser} />
            </div>
        </main>
    );
};

export default AnnouncementsHubPage;
