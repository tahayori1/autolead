
import React from 'react';
import type { DeliveryProcess } from '../types';
import { ExitFormIcon } from './icons/ExitFormIcon';

interface DeliveryCardProps {
    delivery: DeliveryProcess;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, deliveryId: number) => void;
    onOpenExitForm?: (delivery: DeliveryProcess) => void;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({ delivery, onDragStart, onOpenExitForm }) => {

    const formatDate = (dateString: string) => {
        try {
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }).format(new Date(dateString));
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, delivery.id)}
            className="bg-white rounded-md shadow-sm p-3 border border-slate-200 cursor-grab active:cursor-grabbing relative group"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-sm text-slate-800">{delivery.customerName}</h4>
                    <p className="text-xs text-slate-600 mb-1">{delivery.carModel}</p>
                </div>
                {onOpenExitForm && (
                    <button 
                        onClick={() => onOpenExitForm(delivery)}
                        className="text-slate-400 hover:text-sky-600 transition-colors p-1"
                        title="فرم خروج خودرو"
                    >
                        <ExitFormIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
            
            <p className="text-xs text-slate-500 font-mono" dir="ltr">{delivery.chassisNumber}</p>
            <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                <span>تاریخ تحویل:</span>
                <span className="font-semibold">{formatDate(delivery.scheduledDate)}</span>
            </div>
             {delivery.notes && (
                <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded whitespace-pre-wrap">{delivery.notes}</p>
            )}
        </div>
    );
};

export default DeliveryCard;
