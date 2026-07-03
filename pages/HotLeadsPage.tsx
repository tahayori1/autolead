
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getActiveLeads, getLeadHistory, getUserByNumber, sendMessage, getCars, getConditions } from '../services/api';
import type { ActiveLead, LeadMessage, User, Car, CarSaleCondition } from '../types';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { SendIcon } from '../components/icons/SendIcon';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon';
import { InfoIcon } from '../components/icons/InfoIcon';
import ConditionSelectionModal from '../components/ConditionSelectionModal';

const timeAgo = (dateString: string): string => {
    try {
        const parsableDateString = dateString.replace(' ', 'T');
        const date = new Date(parsableDateString);
        if (isNaN(date.getTime())) return dateString;
        
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 0) return 'همین الان';
        if (seconds < 60) return new Intl.RelativeTimeFormat('fa-IR').format(-seconds, 'second');
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return new Intl.RelativeTimeFormat('fa-IR').format(-minutes, 'minute');

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return new Intl.RelativeTimeFormat('fa-IR').format(-hours, 'hour');

        const days = Math.floor(hours / 24);
        return new Intl.RelativeTimeFormat('fa-IR').format(-days, 'day');
    } catch(e) {
        return dateString;
    }
};

const LeadListItem: React.FC<{ lead: ActiveLead, isSelected: boolean, onSelect: () => void }> = ({ lead, isSelected, onSelect }) => {
    const [timeAgoText, setTimeAgoText] = useState(() => timeAgo(lead.updatedAt));

    useEffect(() => {
        const intervalId = setInterval(() => setTimeAgoText(timeAgo(lead.updatedAt)), 60000);
        return () => clearInterval(intervalId);
    }, [lead.updatedAt]);

    return (
        <button onClick={onSelect} className={`w-full text-right p-4 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 ${isSelected ? 'bg-sky-100 dark:bg-sky-900/30' : 'bg-white dark:bg-slate-900'}`}>
            <div className="flex justify-between items-center">
                <h3 className={`font-bold truncate ${isSelected ? 'text-sky-800 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'}`}>{lead.FullName}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{timeAgoText}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{lead.CarModel || 'خودرو مشخص نشده'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 truncate">{lead.Message}</p>
        </button>
    );
};

const DetailItem: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
    <div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value || '-'}</p>
    </div>
);

const ChatView: React.FC<{
    lead: ActiveLead,
    onBack: () => void,
}> = ({ lead, onBack }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [messages, setMessages] = useState<LeadMessage[]>([]);
    const [fullUser, setFullUser] = useState<User | null>(null);
    const [chatLoading, setChatLoading] = useState(true);
    const [chatError, setChatError] = useState<string | null>(null);
    
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);

    const [cars, setCars] = useState<Car[]>([]);
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [quickSendCarModel, setQuickSendCarModel] = useState(lead.CarModel || '');
    const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchChatData = useCallback(async () => {
        setChatLoading(true);
        setChatError(null);
        try {
            const historyPromise = getLeadHistory(lead.number);
            const userPromise = getUserByNumber(lead.number);
            const [historyData, userData] = await Promise.all([historyPromise, userPromise]);
            
            const parseDate = (dateString: string) => new Date(dateString.replace(' ', 'T'));
            setMessages(historyData.sort((a, b) => parseDate(a.createdAt).getTime() - parseDate(b.createdAt).getTime()));
            setFullUser(userData);
        } catch (err) {
            setChatError('خطا در دریافت اطلاعات چت');
        } finally {
            setChatLoading(false);
        }
    }, [lead.number]);
    
    useEffect(() => {
        fetchChatData();
        const interval = setInterval(fetchChatData, 30000); // Refresh chat every 30 seconds
        return () => clearInterval(interval);
    }, [fetchChatData]);
    
    useEffect(() => {
        const fetchQuickSendData = async () => {
            try {
                const [carsData, conditionsData] = await Promise.all([getCars(), getConditions()]);
                setCars(carsData);
                setConditions(conditionsData);
            } catch (error) {
                console.error("Failed to load cars or conditions for quick send");
            }
        };
        fetchQuickSendData();
    }, []);

    useEffect(() => {
        if (!chatLoading) {
            setTimeout(scrollToBottom, 100);
        }
    }, [chatLoading, messages]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [newMessage]);
    
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await sendMessage(lead.number, newMessage);
            setNewMessage('');
            await fetchChatData(); // Refresh messages after sending
        } catch (error) {
            showToast('ارسال پیام با خطا مواجه شد', 'error');
        } finally {
            setIsSending(false);
        }
    };
    
    const formatDate = (dateString: string, withTime = true) => {
        if (!dateString) return '-';
        try {
            const parsableDateString = dateString.replace(' ', 'T');
            const options: Intl.DateTimeFormatOptions = withTime ? 
                { hour: '2-digit', minute: '2-digit' } :
                { year: 'numeric', month: 'long', day: 'numeric' };
            return new Intl.DateTimeFormat('fa-IR', options).format(new Date(parsableDateString));
        } catch (e) { return dateString; }
    };
    
    const handleQuickSend = (text: string) => {
        setNewMessage(prev => prev ? `${prev}\n\n${text}`.trim() : text);
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    const handleConditionsSelected = (selectedConditions: CarSaleCondition[]) => {
        if (selectedConditions.length === 0) return;
        const textParts = selectedConditions.map(c => {
            const descriptionsText = c.descriptions ? c.descriptions : 'ندارد';
            return `*شرایط فروش خودروی ${c.car_model} - مدل ${c.model}*

- *نوع فروش:* ${c.sale_type} (${c.pay_type})
- *وضعیت:* ${c.status}
- *زمان تحویل:* ${c.delivery_time}
- *${c.pay_type === 'نقدی' ? 'قیمت' : 'پیش پرداخت'}:* *${c.initial_deposit.toLocaleString('fa-IR')} تومان*

*توضیحات:*
${descriptionsText}`;
        });
        const text = textParts.join('\n\n--------------------------------\n\n');
        handleQuickSend(text);
        setIsConditionModalOpen(false);
    };
    
    const selectedCarForQuickSend = cars.find(c => c.name === quickSendCarModel);
    const conditionsForSelectedCar = conditions.filter(c => c.car_model === quickSendCarModel);
    
    return (
        <>
            <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-900">
                <header className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0 bg-white dark:bg-slate-800 z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="lg:hidden text-slate-600 dark:text-slate-300 hover:text-sky-700 p-2 rounded-full">
                            <ArrowRightIcon />
                        </button>
                        <div>
                            <h2 className="font-bold text-slate-800 dark:text-white">{lead.FullName}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400" dir="ltr">{lead.number}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsDetailsVisible(!isDetailsVisible)} className="text-slate-600 dark:text-slate-300 hover:text-sky-700 p-2 rounded-full" title="مشاهده اطلاعات">
                        <InfoIcon />
                    </button>
                </header>

                <div className={`collapsible ${isDetailsVisible ? 'open' : ''}`}>
                    <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-inner">
                        <h3 className="text-md font-bold text-slate-700 dark:text-slate-300 mb-3">اطلاعات سرنخ</h3>
                        {fullUser ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <DetailItem label="خودروی درخواستی" value={fullUser.CarModel} />
                                <DetailItem label="استان" value={fullUser.Province} />
                                <DetailItem label="شهر" value={fullUser.City} />
                                <DetailItem label="مرجع" value={fullUser.reference} />
                                <DetailItem label="زمان ثبت" value={formatDate(fullUser.RegisterTime, false)} />
                                {fullUser.Decription && (
                                    <div className="col-span-full">
                                        <DetailItem label="توضیحات" value={<span className="whitespace-pre-wrap">{fullUser.Decription}</span>} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400 text-sm">در حال بارگذاری اطلاعات...</p>
                        )}
                    </div>
                </div>

                <main className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#e0e7ff] dark:bg-[#1e293b]">
                    {chatLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
                    {chatError && <div className="flex justify-center items-center h-full"><p className="text-red-500">{chatError}</p></div>}
                    {!chatLoading && messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.receive === 1 ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-xs md:max-w-md p-3 ${msg.receive === 1 ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm rounded-t-xl rounded-br-xl' : 'bg-sky-600 dark:bg-sky-700 text-white rounded-t-xl rounded-bl-xl'}`}>
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.Message}</p>
                                <p className={`text-xs mt-2 ${msg.receive === 1 ? 'text-slate-400 dark:text-slate-400' : 'text-sky-200'}`}>{formatDate(msg.createdAt)}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
                    <div className="p-2 mb-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <div className="flex flex-wrap items-center gap-2">
                             <select
                                value={quickSendCarModel}
                                onChange={(e) => setQuickSendCarModel(e.target.value)}
                                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-sky-500 focus:border-sky-500"
                            >
                                <option value="">ارسال سریع...</option>
                                {cars.map(car => <option key={car.id} value={car.name}>{car.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setIsConditionModalOpen(true)} disabled={!selectedCarForQuickSend || conditionsForSelectedCar.length === 0}
                                className="text-xs px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors">
                                شرایط فروش
                            </button>
                            <button type="button" onClick={() => handleQuickSend(`مشخصات فنی ${selectedCarForQuickSend?.name}:\n\n${selectedCarForQuickSend?.technical_specs}`)}
                                disabled={!selectedCarForQuickSend?.technical_specs} className="text-xs px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors">
                                مشخصات فنی
                            </button>
                        </div>
                    </div>
                    <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                        <textarea ref={textareaRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="پیام شما..."
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition resize-none min-h-[44px] max-h-36 text-sm placeholder-slate-400"
                            rows={1} disabled={isSending} />
                        <button type="submit" disabled={isSending || !newMessage.trim()}
                            className="p-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-300 dark:disabled:bg-slate-600 transition-colors flex-shrink-0">
                            {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SendIcon />}
                        </button>
                    </form>
                </footer>
            </div>
             <style>{`
                .collapsible {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-in-out;
                }
                .collapsible.open {
                    max-height: 300px; /* Adjust as needed */
                }
            `}</style>
            {isConditionModalOpen && <ConditionSelectionModal isOpen={isConditionModalOpen} onClose={() => setIsConditionModalOpen(false)} conditions={conditionsForSelectedCar} onConfirm={handleConditionsSelected} />}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

const HotLeadsPage: React.FC = () => {
    const [activeLeads, setActiveLeads] = useState<ActiveLead[]>([]);
    const [leadsLoading, setLeadsLoading] = useState(true);
    const [leadsError, setLeadsError] = useState<string | null>(null);
    const [selectedLead, setSelectedLead] = useState<ActiveLead | null>(null);
    const [showChatView, setShowChatView] = useState(false);

    const fetchLeads = useCallback(async () => {
        setLeadsLoading(true);
        setLeadsError(null);
        try {
            const leads = await getActiveLeads();
            setActiveLeads(leads);
        } catch (err) {
            setLeadsError('خطا در دریافت سرنخ‌های داغ');
        } finally {
            setLeadsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
        const interval = setInterval(fetchLeads, 60000); // Refresh list every minute
        return () => clearInterval(interval);
    }, [fetchLeads]);
    
    const handleSelectLead = (lead: ActiveLead) => {
        setSelectedLead(lead);
        setShowChatView(true);
    };

    return (
        <div className="flex h-[calc(100vh-68px)] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:border-none">
            <aside className={`w-full lg:w-1/3 xl:w-1/4 border-l border-slate-200 dark:border-slate-800 flex flex-col ${showChatView ? 'hidden lg:flex' : 'flex'}`}>
                <header className="p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">سرنخ‌های داغ</h2>
                </header>
                <div className="overflow-y-auto flex-grow bg-white dark:bg-slate-900">
                    {leadsLoading && <div className="flex justify-center p-8"><Spinner /></div>}
                    {leadsError && <p className="text-center text-red-500 p-4">{leadsError}</p>}
                    {!leadsLoading && activeLeads.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 p-4">سرنخ داغی وجود ندارد.</p>}
                    {!leadsLoading && activeLeads.map(lead => (
                        <LeadListItem
                            key={`${lead.number}-${lead.updatedAt}`}
                            lead={lead}
                            isSelected={selectedLead?.number === lead.number}
                            onSelect={() => handleSelectLead(lead)}
                        />
                    ))}
                </div>
            </aside>

            <main className={`flex-grow ${showChatView ? 'flex' : 'hidden lg:flex'}`}>
                {selectedLead ? (
                    <ChatView
                        key={selectedLead.number}
                        lead={selectedLead}
                        onBack={() => setShowChatView(false)}
                    />
                ) : (
                    <div className="flex flex-col justify-center items-center h-full text-center text-slate-500 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-800 w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h3 className="font-semibold text-lg">گفتگویی انتخاب نشده است</h3>
                        <p className="text-sm">یک سرنخ را از لیست کناری انتخاب کنید تا پیام‌های آن را مشاهده کنید.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HotLeadsPage;
