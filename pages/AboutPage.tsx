import React, { useState, useEffect } from 'react';
import { Info, GitCommit, Sparkles, ArrowUpRight, ShieldCheck, Heart, RefreshCw, Github, AlertCircle, User } from 'lucide-react';

interface LiveUpdateItem {
    id: string;
    type: 'feat' | 'fix' | 'chore' | 'other';
    title: string;
    description: string;
    sha: string;
    authorName: string;
    authorAvatar: string;
    date: string;
    rawDate: string;
    repoName: string;
    githubUrl: string;
}

interface RepoConfig {
    name: string;
    eventsUrl: string;
    commitsUrl: string;
}

const AboutPage: React.FC = () => {
    const appVersion = "v2.5.4";

    const [liveEvents, setLiveEvents] = useState<LiveUpdateItem[]>([]);
    const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
    const [liveError, setLiveError] = useState<string | null>(null);

    const getRelativeTimePersian = (dateString: string): string => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffSec < 60) return "چند ثانیه پیش";
        if (diffMin < 60) return `${diffMin.toLocaleString('fa-IR')} دقیقه پیش`;
        if (diffHr < 24) return `${diffHr.toLocaleString('fa-IR')} ساعت پیش`;
        if (diffDay === 1) return "دیروز";
        if (diffDay === 2) return "پریروز";
        if (diffDay < 30) return `${diffDay.toLocaleString('fa-IR')} روز پیش`;
        
        return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(date);
    };

    const fetchLiveChanges = async () => {
        setIsLoadingLive(true);
        setLiveError(null);
        try {
            const configs: RepoConfig[] = [
                {
                    name: 'tahayori1/autolead',
                    eventsUrl: 'https://api.github.com/networks/tahayori1/autolead/events',
                    commitsUrl: 'https://api.github.com/repos/tahayori1/autolead/commits'
                },
                {
                    name: 'tahayori1/hkhodro-conditions',
                    eventsUrl: 'https://api.github.com/networks/tahayori1/hkhodro-conditions/events',
                    commitsUrl: 'https://api.github.com/repos/tahayori1/hkhodro-conditions/commits'
                }
            ];

            let allParsedUpdates: LiveUpdateItem[] = [];
            let rateLimitDetected = false;

            for (const config of configs) {
                let eventsData: any[] = [];
                let commitsData: any[] = [];
                let eventsOk = false;

                try {
                    const eventsResponse = await fetch(config.eventsUrl);
                    if (eventsResponse.ok) {
                        eventsData = await eventsResponse.json();
                        eventsOk = true;
                    } else if (eventsResponse.status === 403) {
                        rateLimitDetected = true;
                    }
                } catch (err) {
                    console.warn(`Could not fetch events for ${config.name}`, err);
                }

                try {
                    const commitsResponse = await fetch(config.commitsUrl);
                    if (commitsResponse.ok) {
                        commitsData = await commitsResponse.json();
                    } else if (commitsResponse.status === 403) {
                        rateLimitDetected = true;
                    }
                } catch (err) {
                    console.warn(`Could not fetch commits for ${config.name}`, err);
                }

                const commitMap = new Map<string, any>(
                    Array.isArray(commitsData) ? commitsData.map(c => [c.sha, c]) : []
                );

                let repoUpdates: LiveUpdateItem[] = [];

                if (eventsOk && Array.isArray(eventsData) && eventsData.length > 0) {
                    const processedCommitShas = new Set<string>();
                    for (const event of eventsData) {
                        if (event.type === 'PushEvent') {
                            const headSha = event.payload?.head;
                            if (!headSha || processedCommitShas.has(headSha)) continue;
                            processedCommitShas.add(headSha);

                            const commitInfo = commitMap.get(headSha);
                            let commitMessage = "";
                            let authorName = event.actor?.display_login || event.actor?.login || "توسعه‌دهنده";
                            let authorAvatar = event.actor?.avatar_url || "";

                            if (commitInfo) {
                                commitMessage = commitInfo.commit?.message || "";
                                if (commitInfo.commit?.author?.name) {
                                    authorName = commitInfo.commit.author.name;
                                }
                                if (commitInfo.author?.avatar_url) {
                                    authorAvatar = commitInfo.author.avatar_url;
                                }
                            } else {
                                commitMessage = `بروزرسانی هسته برنامه (${headSha.substring(0, 7)})`;
                            }

                            const cleanedMsg = commitMessage.trim();
                            let type: 'feat' | 'fix' | 'chore' | 'other' = 'other';
                            let displayTitle = cleanedMsg;
                            let displayDesc = "";

                            const lines = cleanedMsg.split('\n');
                            const firstLine = lines[0];
                            if (lines.length > 1) {
                                displayDesc = lines.slice(1).join('\n').trim();
                            }

                            if (firstLine.toLowerCase().startsWith('feat')) {
                                type = 'feat';
                                displayTitle = firstLine.replace(/^feat(\([^)]+\))?:\s*/i, '');
                            } else if (firstLine.toLowerCase().startsWith('fix')) {
                                type = 'fix';
                                displayTitle = firstLine.replace(/^fix(\([^)]+\))?:\s*/i, '');
                            } else if (firstLine.toLowerCase().startsWith('chore') || firstLine.toLowerCase().startsWith('refactor') || firstLine.toLowerCase().startsWith('style') || firstLine.toLowerCase().startsWith('docs')) {
                                type = 'chore';
                                displayTitle = firstLine.replace(/^(chore|refactor|style|docs)(\([^)]+\))?:\s*/i, '');
                            }

                            repoUpdates.push({
                                id: event.id,
                                type,
                                title: displayTitle || "بروزرسانی سراسری سیستم",
                                description: displayDesc,
                                sha: headSha,
                                authorName,
                                authorAvatar,
                                date: getRelativeTimePersian(event.created_at),
                                rawDate: event.created_at,
                                repoName: event.repo?.name || config.name,
                                githubUrl: `https://github.com/${event.repo?.name || config.name}/commit/${headSha}`
                            });
                        } else if (event.type === 'CreateEvent' && event.payload?.ref_type === 'tag') {
                            repoUpdates.push({
                                id: event.id,
                                type: 'feat',
                                title: `انتشار نسخه جدید: ${event.payload.ref}`,
                                description: `تگ نسخه جدید با موفقیت روی مخزن گیت‌هاب ایجاد و منتشر شد.`,
                                sha: '',
                                authorName: event.actor?.display_login || event.actor?.login || "توسعه‌دهنده",
                                authorAvatar: event.actor?.avatar_url || "",
                                date: getRelativeTimePersian(event.created_at),
                                rawDate: event.created_at,
                                repoName: event.repo?.name || config.name,
                                githubUrl: `https://github.com/${event.repo?.name || config.name}/releases/tag/${event.payload.ref}`
                            });
                        }
                    }
                }

                // Fallback: If no PushEvents matched, populate directly from commits
                if (repoUpdates.length === 0 && Array.isArray(commitsData) && commitsData.length > 0) {
                    commitsData.forEach(c => {
                        const commitMessage = c.commit?.message || "";
                        const cleanedMsg = commitMessage.trim();
                        let type: 'feat' | 'fix' | 'chore' | 'other' = 'other';
                        let displayTitle = cleanedMsg;
                        let displayDesc = "";

                        const lines = cleanedMsg.split('\n');
                        const firstLine = lines[0];
                        if (lines.length > 1) {
                            displayDesc = lines.slice(1).join('\n').trim();
                        }

                        if (firstLine.toLowerCase().startsWith('feat')) {
                            type = 'feat';
                            displayTitle = firstLine.replace(/^feat(\([^)]+\))?:\s*/i, '');
                        } else if (firstLine.toLowerCase().startsWith('fix')) {
                            type = 'fix';
                            displayTitle = firstLine.replace(/^fix(\([^)]+\))?:\s*/i, '');
                        } else if (firstLine.toLowerCase().startsWith('chore') || firstLine.toLowerCase().startsWith('refactor') || firstLine.toLowerCase().startsWith('style') || firstLine.toLowerCase().startsWith('docs')) {
                            type = 'chore';
                            displayTitle = firstLine.replace(/^(chore|refactor|style|docs)(\([^)]+\))?:\s*/i, '');
                        }

                        repoUpdates.push({
                            id: c.sha,
                            type,
                            title: displayTitle || "بهبود کلی کدهای سرور",
                            description: displayDesc,
                            sha: c.sha,
                            authorName: c.commit?.author?.name || "توسعه‌دهنده",
                            authorAvatar: c.author?.avatar_url || "",
                            date: getRelativeTimePersian(c.commit?.author?.date || new Date().toISOString()),
                            rawDate: c.commit?.author?.date || new Date().toISOString(),
                            repoName: config.name,
                            githubUrl: c.html_url || `https://github.com/${config.name}/commit/${c.sha}`
                        });
                    });
                }

                allParsedUpdates = [...allParsedUpdates, ...repoUpdates];
            }

            // Sort merged lists chronologically descending
            allParsedUpdates.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

            if (allParsedUpdates.length === 0 && rateLimitDetected) {
                throw new Error("محدودیت درخواست‌های API گیت‌هاب (Rate Limit) روی این آی‌پی فعال شده است.");
            }

            setLiveEvents(allParsedUpdates);
        } catch (error: any) {
            console.error("Error fetching live changes:", error);
            setLiveError(error.message || "خطا در برقراری ارتباط با مخزن گیت‌هاب");
        } finally {
            setIsLoadingLive(false);
        }
    };

    useEffect(() => {
        fetchLiveChanges();
    }, []);

    return (
        <div className="animate-fade-in pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                        <Info className="w-4 h-4" />
                        <span>درباره نرم‌افزار</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                        درباره سامانه و سوابق تغییرات
                    </h2>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs font-bold">
                    <span>نسخه فعلی سیستم:</span>
                    <span className="font-mono">{appVersion}</span>
                </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-4">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">مدیریت هوشمند فروش</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            AutoLead بستری قدرتمند جهت خودکارسازی و هوشمندسازی فرآیندهای فروش، بازاریابی، مدیریت سرنخ‌ها و مانیتورینگ نرخ رشد و قیمت روز خودروهاست.
                        </p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>امنیت بالا و یکپارچه با داده‌های ابری</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-500 dark:text-sky-400 flex items-center justify-center mb-4">
                            <GitCommit className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">اتصال به وب‌هوک و API</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            امکان ارتباط بدون وقفه با وب‌هوک تنظیمات کسب‌وکار جهت همگام‌سازی داینامیک مشخصات نمایندگی، آدرس‌ها، شعار و کاتالوگ در تمام فرآیندها.
                        </p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-sky-500" />
                        <span>قابلیت به‌روزرسانی آنی و پویا</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 flex items-center justify-center mb-4">
                            <Heart className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">تضمین کارایی دپارتمان‌ها</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            ابزارهای کاربردی همگام نظیر محاسبه پورسانت کارشناسان، ثبت کارهای اصلاحی، کنترل اضافه کاری، خروج خودرو و مدیریت آدرس‌دهی متمرکز.
                        </p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>توسعه مداوم متناسب با نیاز بازار</span>
                    </div>
                </div>
            </div>

            {/* Change Log Section */}
            <div className="bg-white dark:bg-slate-850 rounded-[28px] border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <GitCommit className="w-5 h-5 text-indigo-500" />
                        سوابق تغییرات و بروزرسانی‌ها (Change Log)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        آخرین قابلیت‌ها، بهبودها و اصلاحات اعمال شده روی هسته و رابط کاربری سامانه AutoLead به صورت بلادرنگ از گیت‌هاب
                    </p>
                </div>

                {/* Dynamic GitHub Events & Commits */}
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Github className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            <div className="text-right">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-white">مخازن گیت‌هاب متصل</h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                    autolead & hkhodro-conditions
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={fetchLiveChanges}
                            disabled={isLoadingLive}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
                            <span>بروزرسانی زنده</span>
                        </button>
                    </div>

                    {isLoadingLive ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-3">
                            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">در حال اتصال و دریافت آخرین تغییرات برنامه...</span>
                        </div>
                    ) : liveError ? (
                        <div className="flex flex-col items-center justify-center text-center py-12 p-6 bg-rose-50/50 dark:bg-rose-950/10 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                            <AlertCircle className="w-8 h-8 text-rose-500 mb-3" />
                            <h4 className="text-sm font-bold text-rose-800 dark:text-rose-400 mb-1">خطا در دریافت تغییرات</h4>
                            <p className="text-xs text-rose-600/80 dark:text-rose-400/70 max-w-md leading-relaxed mb-4">
                                {liveError}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <a
                                    href="https://github.com/tahayori1/autolead"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all"
                                >
                                    <Github className="w-4 h-4" />
                                    <span>مخزن اصلی AutoLead</span>
                                </a>
                                <a
                                    href="https://github.com/tahayori1/hkhodro-conditions"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                                >
                                    <Github className="w-4 h-4" />
                                    <span>مخزن hkhodro-conditions</span>
                                </a>
                            </div>
                        </div>
                    ) : liveEvents.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs">
                            هیچ تغییراتی یافت نشد.
                        </div>
                    ) : (
                        <div className="space-y-6 relative pr-2">
                            <div className="absolute right-7 top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800 hidden md:block"></div>

                            {liveEvents.map((event) => (
                                <div key={event.id} className="relative md:pr-10">
                                    {/* Timeline marker */}
                                    <div className="absolute right-1.5 top-2.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-850 bg-emerald-500 hidden md:block z-10 shadow-sm"></div>

                                    <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                                            <div className="flex items-center gap-2.5">
                                                {event.authorAvatar ? (
                                                    <img
                                                        src={event.authorAvatar}
                                                        alt={event.authorName}
                                                        referrerPolicy="no-referrer"
                                                        className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                                        {event.authorName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block -mt-0.5 font-mono">
                                                        {event.repoName}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                                {event.sha && (
                                                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                                                        {event.sha.substring(0, 7)}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                                    {event.date}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-start gap-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 mt-0.5 ${
                                                    event.type === 'feat' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                                    event.type === 'fix' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400' :
                                                    event.type === 'chore' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400' :
                                                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                                }`}>
                                                    {event.type === 'feat' ? 'قابلیت جدید' :
                                                     event.type === 'fix' ? 'اصلاح خطا' :
                                                     event.type === 'chore' ? 'بهبود عملکرد' : 'بروزرسانی'}
                                                </span>
                                                <h5 className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed">
                                                    {event.title}
                                                </h5>
                                            </div>

                                            {event.description && (
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mr-12 leading-relaxed bg-slate-50 dark:bg-slate-900/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40 whitespace-pre-wrap">
                                                    {event.description}
                                                </p>
                                            )}

                                            <div className="flex justify-end pt-1">
                                                <a
                                                    href={event.githubUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-0.5 group transition-colors"
                                                >
                                                    <span>مشاهده تغییر در گیت‌هاب</span>
                                                    <ArrowUpRight className="w-3 h-3 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
