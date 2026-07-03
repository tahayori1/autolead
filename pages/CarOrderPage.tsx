
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { CarOrder, MyProfile, CarSaleCondition, CarPriceStats } from '../types';
import { OrderStatus } from '../types';
import { carOrdersService, getMyProfile, getConditions, updateCondition, getCarPriceStats } from '../services/api';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import CarOrderModal from '../components/CarOrderModal';
import CarOrderList from '../components/CarOrderList';
import CarOrderReviewModal from '../components/CarOrderReviewModal';
import CarOrderPaymentModal from '../components/CarOrderPaymentModal';
import CarOrderFilterPanel from '../components/CarOrderFilterPanel';
import { CarOrderApproveModal, CarOrderRejectModal, CarOrderExitModal } from '../components/CarOrderAdminModals';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { RefreshIcon } from '../components/icons/RefreshIcon';

// Declare moment from global scope (loaded via CDN in index.html)
declare const moment: any;

type TabType = 'ALL' | 'DRAFT' | 'PENDING' | 'PAYMENT' | 'EXIT_PERM' | 'REJECTED';

const CarOrderPage: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
    const [orders, setOrders] = useState<CarOrder[]>([]);
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [priceStats, setPriceStats] = useState<CarPriceStats[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Auto Refresh State
    const [autoRefresh, setAutoRefresh] = useState(false);
    
    // Filters State
    const [filters, setFilters] = useState({
        search: '',
        carName: 'all',
        saleType: 'all',
        creator: 'all',
        status: 'all'
    });

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isRejectReasonModalOpen, setIsRejectReasonModalOpen] = useState(false);
    const [isApproveConfirmModalOpen, setIsApproveConfirmModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState<CarOrder | null>(null);
    const [currentUser, setCurrentUser] = useState<MyProfile | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Tab State
    const [activeTab, setActiveTab] = useState<TabType>('ALL');

    // Review Temp Data
    const [reviewData, setReviewData] = useState({
        finalPrice: 0,
        adminNotes: '',
        deliveryDeadline: ''
    });

    const fetchData = useCallback(async (isAutoRefresh = false) => {
        if (!isAutoRefresh) setLoading(true);
        try {
            const [ordersData, profileData, conditionsData, statsData] = await Promise.all([
                carOrdersService.getAll(),
                getMyProfile(),
                getConditions(),
                getCarPriceStats()
            ]);
            const validOrders = Array.isArray(ordersData) ? ordersData.filter(o => o && (o.id || o.status)) : [];
            setOrders(validOrders);
            setConditions(conditionsData);
            setPriceStats(statsData);
            if (profileData && 'id' in profileData) setCurrentUser(profileData as MyProfile);
        } catch (error) {
            if (!isAutoRefresh) setToast({ message: 'خطا در دریافت اطلاعات', type: 'error' });
        } finally {
            if (!isAutoRefresh) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto Refresh Effect
    useEffect(() => {
        let interval: any;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchData(true);
            }, 10000); // 10 seconds
        }
        return () => clearInterval(interval);
    }, [autoRefresh, fetchData]);

    // Filter Helpers
    const carNames = useMemo(() => Array.from(new Set(orders.map(o => o.carName))).sort(), [orders]);
    const creators = useMemo(() => Array.from(new Set(orders.map(o => o.createdBy))).sort(), [orders]);

    // --- Filter Logic ---
    const filteredOrders = useMemo(() => {
        let visibleOrders = orders;
        
        // 1. Filter by User Permissions (Admin sees all, User sees own)
        if (!isAdmin && currentUser?.username) {
            visibleOrders = orders.filter(o => o.createdBy === currentUser.username);
        }

        return visibleOrders.filter(order => {
            // Tab Logic
            let tabMatch = true;
            if (activeTab === 'DRAFT') tabMatch = order.status === OrderStatus.DRAFT;
            else if (activeTab === 'PENDING') tabMatch = order.status === OrderStatus.PENDING_ADMIN;
            else if (activeTab === 'PAYMENT') tabMatch = [OrderStatus.PENDING_PAYMENT, OrderStatus.PENDING_FINANCE, OrderStatus.READY_FOR_DELIVERY].includes(order.status);
            else if (activeTab === 'EXIT_PERM') tabMatch = [OrderStatus.EXIT_PROCESS, OrderStatus.COMPLETED].includes(order.status);
            else if (activeTab === 'REJECTED') tabMatch = order.status === OrderStatus.REJECTED;
            
            if (!tabMatch) return false;

            // Manual Filters
            // 1. Search (Phone, National ID, Address, Postal, City, Notes)
            if (filters.search) {
                const q = filters.search.toLowerCase();
                const matchesSearch = 
                    (order.buyerName?.toLowerCase().includes(q)) ||
                    (order.buyerPhone?.includes(q)) ||
                    (order.buyerNationalId?.includes(q)) ||
                    (order.buyerPostalCode?.includes(q)) ||
                    (order.buyerAddress?.toLowerCase().includes(q)) ||
                    (order.buyerCity?.toLowerCase().includes(q)) ||
                    (order.userNotes?.toLowerCase().includes(q)) ||
                    (order.adminNotes?.toLowerCase().includes(q)) ||
                    (order.trackingCode?.toLowerCase().includes(q));
                
                if (!matchesSearch) return false;
            }

            // 2. Car Name
            if (filters.carName !== 'all' && order.carName !== filters.carName) return false;

            // 3. Sale Type
            if (filters.saleType !== 'all') {
                const condition = conditions.find(c => c.id === order.conditionId);
                // Fallback check if condition deleted: try finding saleType string in conditionSummary
                const saleTypeInSummary = order.conditionSummary?.includes(filters.saleType);
                if (condition) {
                    if (condition.sale_type !== filters.saleType) return false;
                } else if (!saleTypeInSummary) {
                    return false;
                }
            }

            // 4. Creator
            if (filters.creator !== 'all' && order.createdBy !== filters.creator) return false;

            // 5. Status
            if (filters.status !== 'all' && order.status !== filters.status) return false;

            return true;
        });
    }, [orders, activeTab, isAdmin, currentUser, filters, conditions]);

    const counts = useMemo(() => {
        let userOrders = orders;
        if (!isAdmin && currentUser?.username) {
            userOrders = orders.filter(o => o.createdBy === currentUser.username);
        }
        return {
            all: userOrders.length,
            draft: userOrders.filter(o => o.status === OrderStatus.DRAFT).length,
            pending: userOrders.filter(o => o.status === OrderStatus.PENDING_ADMIN).length,
            payment: userOrders.filter(o => [OrderStatus.PENDING_PAYMENT, OrderStatus.PENDING_FINANCE, OrderStatus.READY_FOR_DELIVERY].includes(o.status)).length,
            exit: userOrders.filter(o => [OrderStatus.EXIT_PROCESS, OrderStatus.COMPLETED].includes(o.status)).length,
            rejected: userOrders.filter(o => o.status === OrderStatus.REJECTED).length
        };
    }, [orders, isAdmin, currentUser]);

    // --- Handlers ---

    const returnStockIfNecessary = async (order: CarOrder) => {
        const activeStatuses = [OrderStatus.PENDING_PAYMENT, OrderStatus.PENDING_FINANCE, OrderStatus.READY_FOR_DELIVERY, OrderStatus.EXIT_PROCESS, OrderStatus.COMPLETED];
        if (activeStatuses.includes(order.status)) {
            try {
                const allConditions = await getConditions();
                const cond = allConditions.find(c => c.id === order.conditionId);
                if (cond) {
                    await updateCondition(cond.id, { ...cond, stock_quantity: cond.stock_quantity + 1 });
                }
            } catch (err) {
                console.error("Failed to return stock:", err);
            }
        }
    };

    const handleCreateOrUpdateOrder = async (data: any, status: OrderStatus) => {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        try {
            if (selectedOrder) {
                await carOrdersService.update({ ...selectedOrder, ...data, status, updatedAt: now });
                setToast({ message: 'سفارش با موفقیت بروزرسانی شد', type: 'success' });
            } else {
                await carOrdersService.create({ ...data, status, createdBy: currentUser?.username || 'ناشناس', createdAt: now, updatedAt: now });
                setToast({ message: status === OrderStatus.DRAFT ? 'سفارش در پیش‌نویس ذخیره شد' : 'سفارش با موفقیت ثبت شد', type: 'success' });
            }
            setIsCreateModalOpen(false);
            setSelectedOrder(null);
            fetchData();
            setActiveTab(status === OrderStatus.DRAFT ? 'DRAFT' : 'PENDING');
        } catch (error) {
            setToast({ message: 'خطا در ثبت سفارش', type: 'error' });
        }
    };

    // Review Workflow
    const handleOpenReview = (order: CarOrder) => {
        setSelectedOrder(order);
        setIsReviewModalOpen(true);
    };

    const handleReviewApproveClick = (data: typeof reviewData) => {
        setReviewData(data);
        setIsApproveConfirmModalOpen(true);
    };

    const handleReviewRejectClick = (data: { adminNotes: string }) => {
        setReviewData(prev => ({...prev, adminNotes: data.adminNotes}));
        if (!data.adminNotes.trim()) {
            setIsRejectReasonModalOpen(true);
        } else {
            if(window.confirm('آیا از رد این سفارش اطمینان دارید؟')) {
                executeReject(data.adminNotes);
            }
        }
    };

    const executeApprove = async () => {
        if (!selectedOrder) return;
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        
        try {
            const allConditions = await getConditions();
            const associatedCondition = allConditions.find(c => c.id === selectedOrder.conditionId);
            
            if (associatedCondition) {
                if (associatedCondition.stock_quantity <= 0) {
                    setToast({ message: 'موجودی انبار تمام شده است.', type: 'error' });
                    return;
                }
                await updateCondition(associatedCondition.id, { ...associatedCondition, stock_quantity: associatedCondition.stock_quantity - 1 });
            }

            const trackingCode = `ACL-${Math.floor(100000 + Math.random() * 900000)}`;
            await carOrdersService.update({
                ...selectedOrder,
                ...reviewData,
                trackingCode,
                status: OrderStatus.PENDING_PAYMENT,
                updatedAt: now,
            });

            setToast({ message: `سفارش تایید و کد رهگیری ${trackingCode} صادر شد.`, type: 'success' });
            setIsReviewModalOpen(false);
            setIsApproveConfirmModalOpen(false);
            fetchData();
            setActiveTab('PAYMENT');
        } catch (error) {
            setToast({ message: 'خطا در فرآیند تایید', type: 'error' });
        }
    };

    const executeReject = async (notes: string) => {
        if (!selectedOrder) return;
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        try {
            await returnStockIfNecessary(selectedOrder);
            await carOrdersService.update({
                ...selectedOrder,
                adminNotes: notes,
                status: OrderStatus.REJECTED,
                updatedAt: now,
            });
            setToast({ message: 'معامله رد شد.', type: 'success' });
            setIsReviewModalOpen(false);
            setIsRejectReasonModalOpen(false);
            fetchData();
            setActiveTab('REJECTED');
        } catch (error) {
            setToast({ message: 'خطا در رد سفارش', type: 'error' });
        }
    };

    // Payment Workflow
    const handleRegisterPayment = async (data: { amount: string, chassis: string, plate: string, description: string }) => {
        if (!selectedOrder) return;
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        try {
            const paymentNote = `\n[ثبت فیش واریزی]\nمبلغ: ${Number(data.amount).toLocaleString('fa-IR')}\nشاسی: ${data.chassis}\nپلاک: ${data.plate}\nتوضیحات: ${data.description}`;
            await carOrdersService.update({
                ...selectedOrder,
                userNotes: (selectedOrder.userNotes || '') + paymentNote,
                status: OrderStatus.PENDING_FINANCE,
                updatedAt: now,
            });
            setToast({ message: 'فیش واریزی ثبت شد.', type: 'success' });
            setIsPaymentModalOpen(false);
            fetchData();
        } catch (error) {
            setToast({ message: 'خطا در ثبت فیش', type: 'error' });
        }
    };

    // General Actions
    const handleAction = async (order: CarOrder, nextStatus: OrderStatus) => {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        try {
            await carOrdersService.update({ ...order, status: nextStatus, updatedAt: now });
            setToast({ message: 'وضعیت بروزرسانی شد', type: 'success' });
            fetchData();
        } catch (error) {
            setToast({ message: 'خطا در عملیات', type: 'error' });
        }
    };

    const handleCancelAndReturn = async (order: CarOrder) => {
        if (!window.confirm('آیا از ابطال معامله اطمینان دارید؟')) return;
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        try {
            await returnStockIfNecessary(order);
            await carOrdersService.update({ ...order, status: OrderStatus.REJECTED, updatedAt: now });
            setToast({ message: 'معامله ابطال شد.', type: 'success' });
            fetchData();
        } catch (error) {
            setToast({ message: 'خطا در ابطال', type: 'error' });
        }
    };

    const handleDeleteOrder = async (id: number) => {
        const order = orders.find(o => o.id === id);
        if (!order) return;
        if (!window.confirm('آیا از حذف سفارش اطمینان دارید؟')) return;
        
        try {
            await returnStockIfNecessary(order);
            await carOrdersService.delete(id);
            setToast({ message: 'سفارش حذف شد.', type: 'success' });
            fetchData();
        } catch (error) {
            setToast({ message: 'خطا در حذف', type: 'error' });
        }
    };

    const handleConfirmExit = async () => {
        if (!selectedOrder) return;
        handleAction(selectedOrder, OrderStatus.EXIT_PROCESS);
        setIsExitModalOpen(false);
        setActiveTab('EXIT_PERM');
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-sky-600 rounded-2xl text-white shadow-lg shadow-sky-200 dark:shadow-none">
                        <ClipboardListIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">سفارشات فروش خودرو</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">مدیریت چرخه فروش و موجودی انبار</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    {/* Refresh Controls */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-1.5 rounded-xl">
                        <button 
                            onClick={() => fetchData(false)} 
                            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-all shadow-sm active:scale-95"
                            title="بروزرسانی لیست"
                        >
                            <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                autoRefresh 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-inner' 
                                : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-600'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            {autoRefresh ? 'بروزرسانی خودکار: روشن' : 'بروزرسانی خودکار: خاموش'}
                        </button>
                    </div>

                    <button 
                        onClick={() => { setSelectedOrder(null); setIsCreateModalOpen(true); }} 
                        className="bg-sky-600 text-white px-6 py-3 rounded-xl hover:bg-sky-700 flex items-center gap-2 font-bold shadow-md transition-all active:scale-95 w-full sm:w-auto justify-center"
                    >
                        <PlusIcon className="w-5 h-5" /> ثبت سفارش جدید
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <CarOrderFilterPanel 
                filters={filters}
                onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
                onClear={() => setFilters({ search: '', carName: 'all', saleType: 'all', creator: 'all', status: 'all' })}
                carNames={carNames}
                creators={creators}
            />

            {/* Tabs */}
            <div className="bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl flex gap-2 mb-6 overflow-x-auto shadow-inner no-scrollbar">
                <button onClick={() => setActiveTab('ALL')} className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'ALL' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>همه <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-1">{counts.all}</span></button>
                <button onClick={() => setActiveTab('DRAFT')} className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'DRAFT' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>پیش‌نویس <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-1">{counts.draft}</span></button>
                <button onClick={() => setActiveTab('PENDING')} className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'PENDING' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>در انتظار <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-1">{counts.pending}</span></button>
                <button onClick={() => setActiveTab('PAYMENT')} className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'PAYMENT' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>در انتظار پرداخت <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-1">{counts.payment}</span></button>
                <button onClick={() => setActiveTab('EXIT_PERM')} className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'EXIT_PERM' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>اجازه خروج <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-1">{counts.exit}</span></button>
                <button onClick={() => setActiveTab('REJECTED')} className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'REJECTED' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>رد شده <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-1">{counts.rejected}</span></button>
            </div>

            {loading ? <div className="flex justify-center p-20"><Spinner /></div> : (
                <CarOrderList 
                    orders={filteredOrders}
                    loading={loading}
                    isAdmin={isAdmin}
                    onEdit={(o) => { setSelectedOrder(o); setIsCreateModalOpen(true); }}
                    onDelete={(id) => handleDeleteOrder(id)}
                    onReview={handleOpenReview}
                    onPayment={(o) => { setSelectedOrder(o); setIsPaymentModalOpen(true); }}
                    onExit={(o) => { setSelectedOrder(o); setIsExitModalOpen(true); }}
                    onCancel={handleCancelAndReturn}
                    onAction={handleAction}
                />
            )}

            {/* Modals */}
            <CarOrderModal 
                isOpen={isCreateModalOpen} 
                onClose={() => { setIsCreateModalOpen(false); setSelectedOrder(null); }} 
                onSave={handleCreateOrUpdateOrder} 
                username={currentUser?.username || ''}
                editOrder={selectedOrder}
            />

            <CarOrderReviewModal 
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                order={selectedOrder}
                conditions={conditions}
                priceStats={priceStats}
                onApproveClick={handleReviewApproveClick}
                onRejectClick={handleReviewRejectClick}
            />

            <CarOrderPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                order={selectedOrder}
                onRegister={handleRegisterPayment}
            />

            <CarOrderApproveModal 
                isOpen={isApproveConfirmModalOpen}
                onClose={() => setIsApproveConfirmModalOpen(false)}
                order={selectedOrder}
                finalPrice={reviewData.finalPrice}
                deliveryDeadline={reviewData.deliveryDeadline}
                onConfirm={executeApprove}
            />

            <CarOrderRejectModal 
                isOpen={isRejectReasonModalOpen}
                onClose={() => setIsRejectReasonModalOpen(false)}
                initialNotes={reviewData.adminNotes}
                onConfirm={executeReject}
            />

            <CarOrderExitModal 
                isOpen={isExitModalOpen}
                onClose={() => setIsExitModalOpen(false)}
                order={selectedOrder}
                onConfirm={handleConfirmExit}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CarOrderPage;
