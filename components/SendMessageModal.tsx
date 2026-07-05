import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, Smartphone, Sparkles, Sliders, Wrench, Info } from 'lucide-react';
import type { User, Car, CarSaleCondition } from '../types';
import ConditionSelectionModal from './ConditionSelectionModal';
import Toast from './Toast';

interface SendMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: User | null;
    cars: Car[];
    conditions: CarSaleCondition[];
    onSendMessage: (message: string, type: 'SMS' | 'WHATSAPP' | 'BALE', botId?: number) => Promise<void>;
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({
    isOpen,
    onClose,
    lead,
    cars,
    conditions,
    onSendMessage
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [quickSendCarModel, setQuickSendCarModel] = useState('');
    const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [successToast, setSuccessToast] = useState<string | null>(null);
    const [baleBotId, setBaleBotId] = useState<number>(1941315571);

    useEffect(() => {
        if (isOpen && lead) {
            setQuickSendCarModel(lead.CarModel || '');
            setNewMessage('');
            setValidationError(null);
        }
    }, [isOpen, lead]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [newMessage]);

    if (!isOpen || !lead) return null;

    const handleSendSMS = async () => {
        if (!newMessage.trim() || isSending) return;

        if (newMessage.length > 170) {
            setValidationError('متن پیامک نمی‌تواند بیشتر از ۱۷۰ کاراکتر باشد.');
            return;
        }

        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;
        if (urlRegex.test(newMessage)) {
            setValidationError('ارسال لینک در پیامک مجاز نیست.');
            return;
        }

        setIsSending(true);
        try {
            await onSendMessage(newMessage, 'SMS');
            setSuccessToast('پیامک با موفقیت ارسال شد');
            setNewMessage('');
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error: any) {
            setValidationError(error.message || 'خطا در ارسال پیامک');
        } finally {
            setIsSending(false);
        }
    };

    const handleSendWhatsApp = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await onSendMessage(newMessage, 'WHATSAPP');
            setSuccessToast('پیام واتساپ با موفقیت ارسال شد');
            setNewMessage('');
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error: any) {
            setValidationError(error.message || 'خطا در ارسال واتساپ');
        } finally {
            setIsSending(false);
        }
    };

    const handleSendBale = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await onSendMessage(newMessage, 'BALE', baleBotId);
            setSuccessToast('پیام بله با موفقیت ارسال شد');
            setNewMessage('');
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error: any) {
            setValidationError(error.message || 'خطا در ارسال بله');
        } finally {
            setIsSending(false);
        }
    };

    const handleQuickSend = (text: string) => {
        setNewMessage(prev => prev ? `${prev}\n\n${text}`.trim() : text);
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    const selectedCarForQuickSend = cars.find(c => c.name === quickSendCarModel);
    const conditionsForSelectedCar = conditions.filter(c => c.car_model === quickSendCarModel);

    const formatTechSpecs = (): string => {
        if (!selectedCarForQuickSend || !selectedCarForQuickSend.technical_specs) return '';
        return `مشخصات فنی خودرو ${selectedCarForQuickSend.name}:\n\n${selectedCarForQuickSend.technical_specs}`;
    };

    const formatComfortFeatures = (): string => {
        if (!selectedCarForQuickSend || !selectedCarForQuickSend.comfort_features) return '';
        return `امکانات رفاهی خودرو ${selectedCarForQuickSend.name}:\n\n${selectedCarForQuickSend.comfort_features}`;
    };

    const handleConditionsSelected = (selectedConditions: CarSaleCondition[]) => {
        if (selectedConditions.length === 0) return;

        const textParts = selectedConditions.map(c => {
            const descriptionsText = c.descriptions ? c.descriptions : 'ندارد';
            return `*شرایط فروش خودروی ${c.car_model} - مدل ${c.model}*

- *نوع فروش:* ${c.sale_type} (${c.pay_type})
- *وضعیت:* ${c.status}
- *وضعیت سند:* ${c.document_status}
- *زمان تحویل:* ${c.delivery_time}
- *رنگ‌ها:* ${c.colors.join('، ')}
- *${c.pay_type === 'نقدی' ? 'قیمت' : 'پیش پرداخت'}:* *${c.initial_deposit.toLocaleString('fa-IR')} تومان*

*توضیحات:*
${descriptionsText}`;
        });

        const text = textParts.join('\n\n--------------------------------\n\n');
        handleQuickSend(text);
        setIsConditionModalOpen(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4" onClick={onClose}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden transform transition-all border border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                    <header className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-white">ارسال پیام به مشتری</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {lead.FullName} ({lead.Number})
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </header>

                    <main className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                        {/* Quick options */}
                        <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                                    ارسال سریع مشخصات و شرایط فروش:
                                </label>
                            </div>
                            
                            <div className="flex flex-col gap-2.5">
                                <select
                                    value={quickSendCarModel}
                                    onChange={(e) => setQuickSendCarModel(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-sky-500 focus:border-sky-500 dark:text-white outline-none"
                                >
                                    <option value="">انتخاب خودرو...</option>
                                    {cars.map(car => (
                                        <option key={car.id} value={car.name}>{car.name}</option>
                                    ))}
                                </select>
                                
                                <div className="flex flex-wrap gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsConditionModalOpen(true)}
                                        disabled={!selectedCarForQuickSend || conditionsForSelectedCar.length === 0}
                                        className="text-xs font-semibold px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                    >
                                        <Sliders className="w-3 h-3 text-slate-400" />
                                        شرایط فروش
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickSend(formatTechSpecs())}
                                        disabled={!selectedCarForQuickSend || !selectedCarForQuickSend.technical_specs}
                                        className="text-xs font-semibold px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                    >
                                        <Wrench className="w-3 h-3 text-slate-400" />
                                        مشخصات فنی
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickSend(formatComfortFeatures())}
                                        disabled={!selectedCarForQuickSend || !selectedCarForQuickSend.comfort_features}
                                        className="text-xs font-semibold px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                    >
                                        <Sparkles className="w-3 h-3 text-slate-400" />
                                        امکانات رفاهی
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Text input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">متن پیام:</label>
                            <textarea
                                ref={textareaRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="متن پیام خود را اینجا بنویسید یا از دکمه‌های بالا برای درج سریع استفاده کنید..."
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition resize-y min-h-[120px] max-h-80 text-sm"
                                disabled={isSending}
                                autoComplete="off"
                            />
                            {newMessage.length > 0 && (
                                <div className="flex justify-between text-[11px] text-slate-500 px-1">
                                    <span>تعداد حروف: {newMessage.length} حرف</span>
                                    {newMessage.length > 170 && (
                                        <span className="text-rose-500 font-bold">بیش از ۱۷۰ کاراکتر (مخصوص پیامک نیست)</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bale Bot Selection */}
                        <div className="p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 rounded-xl space-y-2">
                            <label className="text-xs font-bold text-violet-700 dark:text-violet-300 block">
                                ربات ارسال‌کننده بله:
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="baleBotId"
                                        value={1941315571}
                                        checked={baleBotId === 1941315571}
                                        onChange={() => setBaleBotId(1941315571)}
                                        className="text-violet-600 focus:ring-violet-500"
                                    />
                                    <span>کرمان موتور ۲۶۰۶</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="baleBotId"
                                        value={49108418}
                                        checked={baleBotId === 49108418}
                                        onChange={() => setBaleBotId(49108418)}
                                        className="text-violet-600 focus:ring-violet-500"
                                    />
                                    <span>حسینی خودرو</span>
                                </label>
                            </div>
                        </div>
                    </main>

                    <footer className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5 bg-slate-50 dark:bg-slate-900/50">
                        <button
                            type="button"
                            onClick={handleSendWhatsApp}
                            disabled={isSending || !newMessage.trim()}
                            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>ارسال واتساپ</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleSendBale}
                            disabled={isSending || !newMessage.trim()}
                            className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>ارسال بله</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleSendSMS}
                            disabled={isSending || !newMessage.trim()}
                            className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>ارسال پیامک</span>
                        </button>
                    </footer>
                </div>
            </div>

            {isConditionModalOpen && (
                <ConditionSelectionModal
                    isOpen={isConditionModalOpen}
                    onClose={() => setIsConditionModalOpen(false)}
                    conditions={conditionsForSelectedCar}
                    onConfirm={handleConditionsSelected}
                />
            )}

            {validationError && (
                <Toast
                    message={validationError}
                    type="error"
                    onClose={() => setValidationError(null)}
                />
            )}

            {successToast && (
                <Toast
                    message={successToast}
                    type="success"
                    onClose={() => setSuccessToast(null)}
                />
            )}
        </>
    );
};

export default SendMessageModal;
