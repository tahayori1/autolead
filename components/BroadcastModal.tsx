
import React, { useState, useEffect } from 'react';
import type { Car, CarSaleCondition } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { BroadcastIcon } from './icons/BroadcastIcon';
import { ChatIcon } from './icons/ChatIcon';
import { ChatAltIcon } from './icons/ChatAltIcon';
import ConditionSelectionModal from './ConditionSelectionModal';

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string, type: 'SMS' | 'WHATSAPP' | 'BALE', onProgress: (progress: { sent: number; errors: number }) => void, botId?: number) => Promise<{finalSuccess: number, finalErrors: number}>;
    recipientCount: number;
    cars: Car[];
    conditions: CarSaleCondition[];
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose, onSend, recipientCount, cars, conditions }) => {
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'SMS' | 'WHATSAPP' | 'BALE'>('WHATSAPP');
    const [baleBotId, setBaleBotId] = useState<number>(1941315571);
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState<{ sent: number; errors: number } | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [selectedCarModel, setSelectedCarModel] = useState('');
    const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedCarModel('');
            setMessage('');
            setMessageType('WHATSAPP');
            setValidationError(null);
        }
    }, [isOpen]);

    // Validate SMS constraints whenever message or type changes
    useEffect(() => {
        if (messageType === 'SMS') {
            if (message.length > 170) {
                setValidationError('متن پیامک نمی‌تواند بیشتر از ۱۷۰ کاراکتر باشد.');
            } else if (/(https?:\/\/[^\s]+)|(www\.[^\s]+)/i.test(message)) {
                setValidationError('ارسال لینک در پیامک مجاز نیست.');
            } else {
                setValidationError(null);
            }
        } else {
            setValidationError(null);
        }
    }, [message, messageType]);

    const handleSend = async () => {
        if (!message.trim() || validationError) return;

        setIsSending(true);
        setIsFinished(false);
        setProgress({ sent: 0, errors: 0 });

        await onSend(message, messageType, (p) => {
            setProgress(p);
        }, messageType === 'BALE' ? baleBotId : undefined);
        
        setIsFinished(true);
        setIsSending(false);
    };
    
    const handleClose = () => {
        if (isSending) return;
        setMessage('');
        setIsSending(false);
        setIsFinished(false);
        setProgress(null);
        setSelectedCarModel('');
        onClose();
    };
    
    const handleQuickSend = (text: string) => {
        setMessage(prev => prev ? `${prev}\n\n${text}`.trim() : text);
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

    const selectedCar = cars.find(c => c.name === selectedCarModel);
    const conditionsForSelectedCar = conditions.filter(c => c.car_model === selectedCarModel);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={handleClose}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <BroadcastIcon className="w-6 h-6 text-sky-600" />
                            <div>
                                 <h2 className="text-xl font-bold text-slate-800">ارسال پیام گروهی</h2>
                                 <p className="text-sm text-slate-500">
                                    به {recipientCount.toLocaleString('fa-IR')} گیرنده
                                 </p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="text-slate-500 hover:text-slate-800 disabled:opacity-50" disabled={isSending}>
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        {isFinished ? (
                             <div className="text-center p-4 rounded-lg bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-800 mb-2">ارسال تکمیل شد</h3>
                                <p className="text-slate-600">
                                    {progress?.sent.toLocaleString('fa-IR')} پیام با موفقیت ارسال شد.
                                </p>
                                 {progress && progress.errors > 0 && (
                                    <p className="text-red-600 mt-1">
                                        ارسال {progress.errors.toLocaleString('fa-IR')} پیام با خطا مواجه شد.
                                    </p>
                                 )}
                            </div>
                        ) : (
                            <>  
                                <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg">
                                    <button 
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${messageType === 'WHATSAPP' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}
                                        onClick={() => setMessageType('WHATSAPP')}
                                        disabled={isSending}
                                    >
                                        <ChatIcon className="w-4 h-4" />
                                        واتساپ
                                    </button>
                                    <button 
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${messageType === 'SMS' ? 'bg-white shadow text-sky-600' : 'text-slate-500'}`}
                                        onClick={() => setMessageType('SMS')}
                                        disabled={isSending}
                                    >
                                        <ChatAltIcon className="w-4 h-4" />
                                        پیامک
                                    </button>
                                    <button 
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${messageType === 'BALE' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                                        onClick={() => setMessageType('BALE')}
                                        disabled={isSending}
                                    >
                                        <ChatIcon className="w-4 h-4 text-indigo-500" />
                                        بله
                                    </button>
                                </div>

                                {messageType === 'BALE' && (
                                    <div className="space-y-1.5 p-3 mb-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                                        <label className="text-xs font-bold text-indigo-950">انتخاب ربات ارسال‌کننده بله:</label>
                                        <select
                                            value={baleBotId}
                                            onChange={(e) => setBaleBotId(Number(e.target.value))}
                                            disabled={isSending}
                                            className="w-full px-3 py-2 border border-indigo-200 rounded-lg bg-white text-sm focus:ring-indigo-500 outline-none"
                                        >
                                            <option value={1941315571}>ربات کرمان موتور ۲۶۰۶ (1941315571)</option>
                                            <option value={49108418}>ربات حسینی خودرو (49108418)</option>
                                        </select>
                                    </div>
                                )}

                                <div className="p-3 mb-4 border rounded-lg bg-slate-50">
                                    <p className="text-sm font-semibold text-slate-600 mb-2">ارسال سریع (اختیاری):</p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <select
                                            value={selectedCarModel}
                                            onChange={(e) => setSelectedCarModel(e.target.value)}
                                            className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                                            disabled={isSending}
                                        >
                                            <option value="">انتخاب خودرو...</option>
                                            {cars.map(car => (
                                                <option key={car.id} value={car.name}>{car.name}</option>
                                            ))}
                                        </select>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsConditionModalOpen(true)}
                                                disabled={!selectedCarModel || conditionsForSelectedCar.length === 0 || isSending}
                                                className="text-xs px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                شرایط فروش
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => handleQuickSend(`مشخصات فنی خودرو ${selectedCar?.name}:\n\n${selectedCar?.technical_specs}`)}
                                                disabled={!selectedCar || !selectedCar.technical_specs || isSending}
                                                className="text-xs px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                مشخصات فنی
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => handleQuickSend(`امکانات رفاهی خودرو ${selectedCar?.name}:\n\n${selectedCar?.comfort_features}`)}
                                                disabled={!selectedCar || !selectedCar.comfort_features || isSending}
                                                className="text-xs px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                امکانات رفاهی
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={6}
                                    placeholder="پیام خود را اینجا بنویسید..."
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 outline-none transition ${validationError ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'}`}
                                    disabled={isSending}
                                />
                                <div className="flex justify-between mt-1">
                                    {validationError ? (
                                        <p className="text-red-500 text-xs font-bold">{validationError}</p>
                                    ) : <div></div>}
                                    
                                    {messageType === 'SMS' && (
                                        <p className={`text-xs ${message.length > 170 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                            {message.length} / 170
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {isSending && progress && (
                            <div className="mt-4">
                                <div className="flex justify-between text-sm font-medium text-slate-600 mb-1">
                                    <span>در حال ارسال...</span>
                                    <span>{progress.sent.toLocaleString('fa-IR')} / {recipientCount.toLocaleString('fa-IR')}</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div 
                                        className="bg-sky-600 h-2.5 rounded-full transition-all duration-300" 
                                        style={{ width: `${(progress.sent / recipientCount) * 100}%` }}
                                    ></div>
                                </div>
                                {progress.errors > 0 && <p className="text-red-500 text-xs mt-1 text-right">خطاها: {progress.errors}</p>}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
                        <button 
                            type="button" 
                            onClick={handleClose} 
                            disabled={isSending}
                            className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 disabled:opacity-50"
                        >
                            {isFinished ? 'بستن' : 'انصراف'}
                        </button>
                        {!isFinished && (
                            <button 
                                type="button" 
                                onClick={handleSend}
                                disabled={isSending || !message.trim() || !!validationError}
                                className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed flex items-center justify-center w-32"
                            >
                                {isSending ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    'ارسال'
                                )}
                            </button>
                        )}
                    </div>
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
        </>
    );
};

export default BroadcastModal;
