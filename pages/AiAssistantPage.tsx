import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Bot, 
    Sparkles, 
    Send, 
    RefreshCw, 
    Trash2, 
    Plus, 
    Download, 
    Upload, 
    Copy, 
    Check, 
    Search, 
    MessageSquare, 
    History, 
    User, 
    Clock, 
    Wifi, 
    WifiOff, 
    Menu, 
    X, 
    Edit2,
    FileText,
    ArrowRight,
    CornerDownLeft,
    Share2,
    AlertCircle,
    TrendingUp,
    ShieldCheck,
    Lock,
    Landmark,
    FileSpreadsheet,
    Users,
    Layers,
    SlidersHorizontal
} from 'lucide-react';
import type { MyProfile } from '../types';
import type { ChatMessage, ChatSession } from '../types/aiChat';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { 
    getOfflineSessions, 
    createNewChatSession, 
    getActiveChatSessionId, 
    setActiveChatSessionId,
    updateChatSessionTitle,
    deleteChatSession,
    clearAllChatHistory,
    getOfflineMessages,
    saveOfflineMessages,
    appendOfflineMessage,
    updateOfflineMessage,
    sendChatMessageToWebhook,
    generateChatId,
    exportAllChatHistory,
    importChatHistory
} from '../services/aiChatService';

interface AiAssistantPageProps {
    loggedInUser?: MyProfile | null;
}

interface UpcomingModuleItem {
    id: string;
    title: string;
    phase: string;
    desc: string;
    icon: React.ReactNode;
}

const UPCOMING_AI_MODULES: UpcomingModuleItem[] = [
    {
        id: 'price-analysis',
        title: 'تحلیل قیمت بر اساس خودرو',
        phase: 'فاز ۲',
        desc: 'تحلیل روند قیمت روز خودروها، استعلام کف و سقف بازار و قیمت‌گذاری بر اساس مدل و سال',
        icon: <TrendingUp className="w-4 h-4 text-sky-500" />
    },
    {
        id: 'sales-circulars',
        title: 'تحلیل بخشنامه‌های فروش',
        phase: 'فاز ۲',
        desc: 'بررسی خودکار شرایط پیش‌پرداخت، سود مشارکت، فرمول اقساط و موعدهای تحویل بخشنامه‌ها',
        icon: <FileSpreadsheet className="w-4 h-4 text-purple-500" />
    },
    {
        id: 'contract-bank',
        title: 'تحلیل قرارداد و نامه بانک',
        phase: 'فاز ۳',
        desc: 'اعتبارسنجی مفاد قرارداد صلح، تعهدات مالی، تضامین، چک‌ها و تسهیلات بانکی',
        icon: <Landmark className="w-4 h-4 text-amber-500" />
    },
    {
        id: 'deal-supervision',
        title: 'نظارت بر معامله',
        phase: 'فاز ۳',
        desc: 'پایش گام‌به‌گام مراحل معامله، کنترل اسناد، تطبیق‌های مالی و تایید نهایی تحویل خودرو',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />
    },
    {
        id: 'crm-analytics',
        title: 'تحلیل داده‌های CRM',
        phase: 'فاز ۴',
        desc: 'آنالیز رفتار مشتریان، سوابق مراجعات، طبقه‌بندی سرنخ‌های راکد و افزایش نرخ تبدیل',
        icon: <Users className="w-4 h-4 text-rose-500" />
    }
];

export const AiAssistantPage: React.FC<AiAssistantPageProps> = ({ loggedInUser }) => {
    // Current user identifier
    const defaultUserId = useMemo(() => {
        if (loggedInUser?.id) return String(loggedInUser.id);
        if (loggedInUser?.mobile) return loggedInUser.mobile;
        if (loggedInUser?.username) return loggedInUser.username;
        return 'user_' + Math.random().toString(36).substring(2, 8);
    }, [loggedInUser]);

    const [userId, setUserId] = useState<string>(() => {
        return localStorage.getItem('autolead_ai_user_id') || defaultUserId;
    });

    // Sessions and Active Chat
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputPrompt, setInputPrompt] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    
    // UI states
    const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
    const [sessionTitleInput, setSessionTitleInput] = useState<string>('');
    const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);
    const [statusBanner, setStatusBanner] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Online/Offline listener
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Load Sessions on Mount
    useEffect(() => {
        const loadedSessions = getOfflineSessions();
        setSessions(loadedSessions);

        let activeId = getActiveChatSessionId();
        if (!activeId || !loadedSessions.some(s => s.id === activeId)) {
            if (loadedSessions.length > 0) {
                activeId = loadedSessions[0].id;
            } else {
                const newSess = createNewChatSession();
                activeId = newSess.id;
                setSessions([newSess]);
            }
        }
        setActiveSessionIdState(activeId);
    }, []);

    // Load Messages whenever activeSessionId changes
    useEffect(() => {
        if (!activeSessionId) {
            setMessages([]);
            return;
        }
        setActiveChatSessionId(activeSessionId);
        const msgs = getOfflineMessages(activeSessionId);
        setMessages(msgs);

        const currentSession = sessions.find(s => s.id === activeSessionId);
        if (currentSession) {
            setSessionTitleInput(currentSession.title);
        }
        setIsEditingTitle(false);
    }, [activeSessionId, sessions]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    // Show temporary status banner
    const notify = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
        setStatusBanner({ text, type });
        setTimeout(() => setStatusBanner(null), 3500);
    };

    // Switch session
    const handleSelectSession = (sessionId: string) => {
        setActiveSessionIdState(sessionId);
        setIsSidebarOpenMobile(false);
    };

    // Create New Session
    const handleCreateNewSession = () => {
        const newSess = createNewChatSession();
        setSessions(getOfflineSessions());
        setActiveSessionIdState(newSess.id);
        setIsSidebarOpenMobile(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    // Delete single session
    const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('آیا از حذف این گفتگو اطمینان دارید؟')) {
            deleteChatSession(sessionId);
            const remaining = getOfflineSessions();
            setSessions(remaining);
            if (activeSessionId === sessionId) {
                if (remaining.length > 0) {
                    setActiveSessionIdState(remaining[0].id);
                } else {
                    const fresh = createNewChatSession();
                    setSessions([fresh]);
                    setActiveSessionIdState(fresh.id);
                }
            }
            notify('گفتگو با موفقیت حذف شد.', 'info');
        }
    };

    // Save title changes
    const handleSaveTitle = () => {
        if (!activeSessionId) return;
        const trimmed = sessionTitleInput.trim();
        if (trimmed) {
            updateChatSessionTitle(activeSessionId, trimmed);
            setSessions(getOfflineSessions());
        }
        setIsEditingTitle(false);
    };

    // Send Message
    const handleSendMessage = async (customPrompt?: string) => {
        const textToSend = (customPrompt || inputPrompt).trim();
        if (!textToSend || isSending) return;

        if (!activeSessionId) {
            const newSess = createNewChatSession();
            setActiveSessionIdState(newSess.id);
            setSessions(getOfflineSessions());
        }

        const currentSessId = activeSessionId || getActiveChatSessionId()!;

        const userMsgId = generateChatId();
        const userMsg: ChatMessage = {
            id: userMsgId,
            sessionId: currentSessId,
            role: 'user',
            content: textToSend,
            timestamp: new Date().toISOString(),
            status: 'sent'
        };

        // Add user message to state & storage
        const nextMessages = [...messages, userMsg];
        setMessages(nextMessages);
        saveOfflineMessages(currentSessId, nextMessages);
        setInputPrompt('');
        setIsSending(true);

        // Abort previous if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Create placeholder assistant message
        const assistantMsgId = generateChatId();
        const assistantPlaceholder: ChatMessage = {
            id: assistantMsgId,
            sessionId: currentSessId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            status: 'sending'
        };

        const withPlaceholder = [...nextMessages, assistantPlaceholder];
        setMessages(withPlaceholder);

        try {
            const responseText = await sendChatMessageToWebhook(
                userId,
                textToSend,
                controller.signal
            );

            const finalizedAssistantMsg: ChatMessage = {
                ...assistantPlaceholder,
                content: responseText,
                status: 'sent',
                timestamp: new Date().toISOString()
            };

            const finalizedList = nextMessages.concat(finalizedAssistantMsg);
            setMessages(finalizedList);
            saveOfflineMessages(currentSessId, finalizedList);
            setSessions(getOfflineSessions());
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                const errorAssistantMsg: ChatMessage = {
                    ...assistantPlaceholder,
                    content: 'خطا در برقراری ارتباط با وب‌هوک هوش مصنوعی: ' + (err.message || 'پاسخی دریافت نشد.'),
                    status: 'error',
                    errorMsg: err.message,
                    timestamp: new Date().toISOString()
                };

                const failedList = nextMessages.concat(errorAssistantMsg);
                setMessages(failedList);
                saveOfflineMessages(currentSessId, failedList);
                notify('خطا در دریافت پاسخ از سرور هوش مصنوعی', 'error');
            }
        } finally {
            setIsSending(false);
            abortControllerRef.current = null;
        }
    };

    // Retry sending
    const handleRetry = (msg: ChatMessage) => {
        if (msg.role === 'user') {
            handleSendMessage(msg.content);
        } else {
            // Find preceding user message
            const idx = messages.findIndex(m => m.id === msg.id);
            if (idx > 0) {
                const prev = messages[idx - 1];
                if (prev.role === 'user') {
                    handleSendMessage(prev.content);
                }
            }
        }
    };

    // Copy message text
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
        notify('متن در کلیپ‌بورد کپی شد.', 'success');
    };

    // Export entire history
    const handleExport = () => {
        const jsonStr = exportAllChatHistory();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `autolead_ai_chat_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        notify('پشتیبان تاریخچه چت دانلود شد.', 'success');
    };

    // Import history
    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                const res = importChatHistory(content);
                if (res.success) {
                    const reloaded = getOfflineSessions();
                    setSessions(reloaded);
                    if (reloaded.length > 0) {
                        setActiveSessionIdState(reloaded[0].id);
                    }
                    notify(`تعداد ${res.count} گفتگوی آفلاین با موفقیت بازیابی شد.`, 'success');
                } else {
                    notify(res.error || 'خطا در بارگذاری فایل', 'error');
                }
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // Clear all history
    const handleConfirmDeleteAll = () => {
        clearAllChatHistory();
        const fresh = createNewChatSession();
        setSessions([fresh]);
        setActiveSessionIdState(fresh.id);
        setMessages([]);
        setShowDeleteAllModal(false);
        notify('تمام تاریخچه گفتگوی آفلاین پاکسازی شد.', 'info');
    };

    // Filter sessions by search term
    const filteredSessions = useMemo(() => {
        if (!searchTerm.trim()) return sessions;
        const q = searchTerm.toLowerCase();
        return sessions.filter(s => 
            s.title.toLowerCase().includes(q) || 
            s.lastMessagePreview.toLowerCase().includes(q)
        );
    }, [sessions, searchTerm]);

    const activeSession = sessions.find(s => s.id === activeSessionId);

    return (
        <div className="flex h-full w-full bg-slate-100 dark:bg-slate-950 font-vazir text-right overflow-hidden relative">
            {/* Status Toast Banner */}
            {statusBanner && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce transition-all ${
                    statusBanner.type === 'success' 
                        ? 'bg-emerald-600 text-white' 
                        : statusBanner.type === 'error'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 text-white border border-slate-700'
                }`}>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{statusBanner.text}</span>
                </div>
            )}

            {/* Offline Chat Sessions Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 right-0 z-40 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 shadow-xl lg:shadow-none
                ${isSidebarOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
                {/* Sidebar Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-800 dark:text-white">دستیار هوشمند</h2>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <History className="w-3 h-3 text-sky-500" />
                                <span>تاریخچه آفلاین ({sessions.length})</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsSidebarOpenMobile(false)}
                            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* New Chat Button */}
                <div className="p-3">
                    <button
                        onClick={handleCreateNewSession}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>گفتگوی جدید</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-3 mb-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="جستجو در گفتگوها..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    {filteredSessions.length === 0 ? (
                        <div className="text-center py-10 px-4 text-slate-400 text-xs">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <span>موردی در تاریخچه یافت نشد</span>
                        </div>
                    ) : (
                        filteredSessions.map((session) => {
                            const isActive = session.id === activeSessionId;
                            return (
                                <div
                                    key={session.id}
                                    onClick={() => handleSelectSession(session.id)}
                                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                                        isActive
                                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 shadow-sm'
                                            : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden flex-1 pl-1">
                                        <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold truncate">
                                                {session.title || 'گفتگوی بدون عنوان'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                {session.lastMessagePreview || 'بدون پیام'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleDeleteSession(session.id, e)}
                                            title="حذف گفتگو"
                                            className="p-1 hover:text-rose-500 rounded text-slate-400"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Sidebar Footer Controls */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                            <User className="w-3 h-3 text-sky-500" />
                            ID: {userId.substring(0, 10)}
                        </span>
                        <div className="flex items-center gap-1">
                            {isOnline ? (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                    <Wifi className="w-3 h-3" /> آنلاین
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-amber-500 text-[10px] font-bold">
                                    <WifiOff className="w-3 h-3" /> آفلاین
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                        <button
                            onClick={handleExport}
                            title="دانلود فایل پشتیبان JSON"
                            className="flex-1 py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                        >
                            <Download className="w-3 h-3 text-sky-500" />
                            <span>خروجی</span>
                        </button>
                        
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            title="بارگذاری فایل پشتیبان JSON"
                            className="flex-1 py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                        >
                            <Upload className="w-3 h-3 text-indigo-500" />
                            <span>ورودی</span>
                        </button>

                        <button
                            onClick={() => setShowDeleteAllModal(true)}
                            title="پاکسازی کامل حافظه آفلاین"
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-900 text-[10px] transition-all"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImportFile} 
                        accept=".json,application/json" 
                        className="hidden" 
                    />
                </div>
            </aside>

            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpenMobile && (
                <div 
                    onClick={() => setIsSidebarOpenMobile(false)}
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
                />
            )}

            {/* Main Chat Workspace */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
                {/* Chat Top Header */}
                <header className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpenMobile(true)}
                            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            </div>

                            <div>
                                {isEditingTitle ? (
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="text"
                                            value={sessionTitleInput}
                                            onChange={(e) => setSessionTitleInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                                            className="px-2 py-0.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-sky-400 rounded-lg focus:outline-none"
                                            autoFocus
                                        />
                                        <button 
                                            onClick={handleSaveTitle}
                                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <h1 className="text-sm font-black text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-md">
                                            {activeSession?.title || 'چت هوشمند با مشتری'}
                                        </h1>
                                        <button
                                            onClick={() => setIsEditingTitle(true)}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
                                            title="ویرایش عنوان گفتگو"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        ماژول اختصاصی چت با مشتری
                                    </span>
                                    <span>•</span>
                                    <span className="text-sky-500 font-bold">ذخیره‌سازی آفلاین فعال</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Tools */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => {
                                const allText = messages.map(m => `[${m.role === 'user' ? 'شما' : 'هوش مصنوعی'} - ${new Date(m.timestamp).toLocaleTimeString('fa-IR')}]:\n${m.content}\n`).join('\n---\n');
                                if (!allText) {
                                    notify('مکالمه‌ای برای کپی وجود ندارد', 'info');
                                    return;
                                }
                                navigator.clipboard.writeText(allText);
                                notify('کل متن گفتگو در کلیپ‌بورد کپی شد.', 'success');
                            }}
                            title="کپی متن کل گفتگو"
                            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                            <Copy className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => {
                                if (messages.length === 0) return;
                                if (window.confirm('آیا از پاک کردن پیام‌های این گفتگو اطمینان دارید؟')) {
                                    if (activeSessionId) {
                                        saveOfflineMessages(activeSessionId, []);
                                        setMessages([]);
                                        notify('پیام‌های این گفتگو پاک شدند.', 'info');
                                    }
                                }
                            }}
                            title="پاک کردن پیام‌های جاری"
                            className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="max-w-3xl mx-auto py-6 px-2 sm:px-4">
                            {/* Upcoming Modules (Roadmap) */}
                            <div className="text-right">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                                            <span>سایر بخش‌های هوش مصنوعی (به‌زودی در فازهای بعدی)</span>
                                        </h3>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                            ماژول‌های زیر در حال توسعه هستند و در مراحل بعدی سامانه معرفی و فعال خواهند شد:
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                        فازهای آینده
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {UPCOMING_AI_MODULES.map((mod) => (
                                        <div
                                            key={mod.id}
                                            className="p-3.5 bg-white/70 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-right opacity-80 hover:opacity-100 transition-opacity"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                    {mod.icon}
                                                </div>
                                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                    {mod.phase} • بزودی
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 mb-1">
                                                {mod.title}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {mod.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex items-start gap-3 max-w-3xl ${
                                        isUser ? 'mr-auto flex-row-reverse' : 'ml-auto'
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                                        isUser
                                            ? 'bg-sky-600 text-white shadow-sm'
                                            : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-sm'
                                    }`}>
                                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={`group relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-xs text-xs leading-relaxed ${
                                        isUser
                                            ? 'bg-sky-600 text-white rounded-tr-xs'
                                            : msg.status === 'error'
                                                ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-tl-xs'
                                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                                    }`}>
                                        {/* Status indicator for sending */}
                                        {msg.status === 'sending' ? (
                                            <div className="flex items-center gap-2 text-slate-400 py-1">
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
                                                <span>در حال پردازش و پاسخگویی توسط هوش مصنوعی...</span>
                                            </div>
                                        ) : (
                                            <MarkdownRenderer content={msg.content} isUser={isUser} />
                                        )}

                                        {/* Timestamp & Actions */}
                                        <div className={`flex items-center justify-between gap-3 mt-2 pt-2 border-t text-[10px] ${
                                            isUser
                                                ? 'border-white/20 text-white/70'
                                                : 'border-slate-100 dark:border-slate-800 text-slate-400'
                                        }`}>
                                            <span className="font-mono">
                                                {new Date(msg.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {msg.status === 'error' && (
                                                    <button
                                                        onClick={() => handleRetry(msg)}
                                                        className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-bold"
                                                    >
                                                        <RefreshCw className="w-2.5 h-2.5" /> تلاش مجدد
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleCopy(msg.content, msg.id)}
                                                    className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
                                                    title="کپی متن"
                                                >
                                                    {copiedMessageId === msg.id ? (
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <div className="max-w-4xl mx-auto">
                        {!isOnline && (
                            <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <WifiOff className="w-4 h-4 text-amber-500" />
                                    <span>دستگاه در حالت آفلاین است. تاریخچه پیام‌ها محفوظ است اما ارسال پیام نیازمند اینترنت است.</span>
                                </div>
                            </div>
                        )}

                        <div className="relative flex items-end gap-2 bg-slate-100 dark:bg-slate-800/90 rounded-2xl p-2 border border-slate-200 dark:border-slate-700 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
                            <textarea
                                ref={textareaRef}
                                value={inputPrompt}
                                onChange={(e) => setInputPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="پیام، سوال یا درخواست مشتری را اینجا بنویسید (Shift+Enter برای خط جدید)..."
                                rows={1}
                                className="flex-1 bg-transparent border-none resize-none px-2 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none max-h-32 min-h-[38px]"
                                disabled={isSending}
                            />

                            <button
                                type="button"
                                onClick={() => handleSendMessage()}
                                disabled={!inputPrompt.trim() || isSending}
                                className={`p-2.5 rounded-xl text-white font-bold transition-all shrink-0 cursor-pointer ${
                                    !inputPrompt.trim() || isSending
                                        ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 active:scale-95 shadow-md shadow-sky-600/20'
                                }`}
                                title="ارسال پیام"
                            >
                                {isSending ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 rotate-180" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 px-2 mt-2">
                            <span>دستیار چت با مشتری حسینی خودرو • متصل به وب‌هوک و دارای حافظه آفلاین</span>
                            <span className="hidden sm:inline">کلید Enter جهت ارسال</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Clear All History Confirmation Modal */}
            {showDeleteAllModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scaleIn">
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2">
                            پاکسازی تمام تاریخچه چت
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                            آیا مطمئن هستید که می‌خواهید تمام گفتگوها و پیام‌های ذخیره‌شده آفلاین را حذف کنید؟ این عملیات غیرقابل برگشت است.
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleConfirmDeleteAll}
                                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
                            >
                                بله، حذف کامل
                            </button>
                            <button
                                onClick={() => setShowDeleteAllModal(false)}
                                className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiAssistantPage;
