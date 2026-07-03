
import React, { useState, useEffect, useCallback } from 'react';
import { getDeliveryProcesses, createDeliveryProcess, updateDeliveryProcessStatus } from '../services/api';
import type { DeliveryProcess } from '../types';
import { DeliveryStatus } from '../types';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import DeliveryCard from '../components/DeliveryCard';
import DeliveryProcessModal from '../components/DeliveryProcessModal';
import VehicleExitFormModal from '../components/VehicleExitFormModal';
import { PlusIcon } from '../components/icons/PlusIcon';

const STATUS_ORDER: DeliveryStatus[] = [
    DeliveryStatus.AWAITING_DOCUMENTS,
    DeliveryStatus.PREPARING_VEHICLE,
    DeliveryStatus.READY_FOR_PICKUP,
    DeliveryStatus.DELIVERED,
];

const STATUS_COLORS: Record<DeliveryStatus, string> = {
    [DeliveryStatus.AWAITING_DOCUMENTS]: 'border-t-yellow-500',
    [DeliveryStatus.PREPARING_VEHICLE]: 'border-t-blue-500',
    [DeliveryStatus.READY_FOR_PICKUP]: 'border-t-purple-500',
    [DeliveryStatus.DELIVERED]: 'border-t-green-500',
};

const DeliveryProcessPage: React.FC = () => {
    const [deliveries, setDeliveries] = useState<DeliveryProcess[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isExitFormOpen, setIsExitFormOpen] = useState(false);
    const [selectedDeliveryForExit, setSelectedDeliveryForExit] = useState<DeliveryProcess | null>(null);
    
    const fetchDeliveries = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getDeliveryProcesses();
            setDeliveries(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDeliveries();
    }, [fetchDeliveries]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, deliveryId: number) => {
        e.dataTransfer.setData("deliveryId", deliveryId.toString());
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: DeliveryStatus) => {
        e.preventDefault();
        const deliveryId = parseInt(e.dataTransfer.getData("deliveryId"), 10);
        const deliveryToMove = deliveries.find(d => d.id === deliveryId);

        if (!deliveryToMove || deliveryToMove.status === newStatus) return;

        // Optimistic UI update
        const originalDeliveries = [...deliveries];
        setDeliveries(prev => prev.map(d => 
            d.id === deliveryId ? { ...d, status: newStatus } : d
        ));

        try {
            await updateDeliveryProcessStatus(deliveryId, newStatus);
            showToast('وضعیت با موفقیت به‌روزرسانی شد.', 'success');
        } catch (err) {
            // Revert on error
            setDeliveries(originalDeliveries);
            showToast('خطا در به‌روزرسانی وضعیت.', 'error');
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleSave = async (deliveryData: Omit<DeliveryProcess, 'id'>) => {
        try {
            await createDeliveryProcess(deliveryData);
            showToast('مورد جدید با موفقیت اضافه شد', 'success');
            setIsAddModalOpen(false);
            fetchDeliveries();
        } catch (err) {
            showToast('عملیات با خطا مواجه شد', 'error');
        }
    };

    const handleOpenExitForm = (delivery: DeliveryProcess) => {
        setSelectedDeliveryForExit(delivery);
        setIsExitFormOpen(true);
    };

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center items-center h-96 col-span-full"><Spinner /></div>;
        }
        if (error) {
            return <p className="text-center text-red-500 col-span-full">{error}</p>;
        }
        return (
            <>
                {STATUS_ORDER.map(status => (
                    <div 
                        key={status} 
                        className="bg-slate-100 rounded-lg flex-shrink-0 w-80 h-full flex flex-col"
                        onDrop={(e) => handleDrop(e, status)}
                        onDragOver={handleDragOver}
                    >
                        <div className={`p-4 font-bold text-slate-700 border-t-4 ${STATUS_COLORS[status]} rounded-t-lg`}>
                            {status} ({deliveries.filter(d => d.status === status).length})
                        </div>
                        <div className="p-2 space-y-3 overflow-y-auto flex-grow">
                            {deliveries.filter(d => d.status === status)
                                .sort((a,b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                                .map(delivery => (
                                    <DeliveryCard 
                                        key={delivery.id} 
                                        delivery={delivery} 
                                        onDragStart={handleDragStart} 
                                        onOpenExitForm={handleOpenExitForm}
                                    />
                            ))}
                        </div>
                    </div>
                ))}
            </>
        );
    };

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-68px)]">
                <div className="bg-white p-6 rounded-lg shadow-md mb-6 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-700">فرایند تحویل خودرو</h2>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors duration-300 shadow-sm flex items-center gap-2"
                        >
                            <PlusIcon />
                            افزودن تحویل جدید
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-x-auto overflow-y-hidden pb-4">
                    <div className="flex gap-6 h-full">
                        {renderContent()}
                    </div>
                </div>
            </main>
            
            {isAddModalOpen && <DeliveryProcessModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSave} />}
            
            {isExitFormOpen && (
                <VehicleExitFormModal 
                    isOpen={isExitFormOpen} 
                    onClose={() => setIsExitFormOpen(false)} 
                    delivery={selectedDeliveryForExit} 
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default DeliveryProcessPage;
