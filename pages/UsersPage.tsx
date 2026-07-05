
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    getUsers, createUser, updateUser, deleteUser, getLeadHistory, 
    sendMessage, sendSMS, getUserByNumber, getCars, getConditions, 
    getReferences, carOrdersService, sendBulkSMS, getStaffUsers,
    sendBaleMessage, createCustomerJournal
} from '../services/api';
import type { Reference } from '../services/api';
import type { User, LeadMessage, Car, CarSaleCondition, MyProfile, StaffUser } from '../types';
import { OrderStatus, LeadStatus } from '../types';
import UserTable from '../components/UserTable';
import UserModal from '../components/UserModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import LeadDetailHistoryModal from '../components/LeadHistoryModal';
import BroadcastModal from '../components/BroadcastModal';
import CarOrderModal from '../components/CarOrderModal';
import { BroadcastIcon } from '../components/icons/BroadcastIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import UserFilterPanel from '../components/UserFilterPanel';
import { PlusIcon } from '../components/icons/PlusIcon';
import { ExportIcon } from '../components/icons/ExportIcon';
import { CopyIcon } from '../components/icons/CopyIcon';
import CrmKanbanBoard from '../components/CrmKanbanBoard';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon'; // Reused for list icon
import CrmCallLogs from '../components/CrmCallLogs';
import { Phone, FileSpreadsheet } from 'lucide-react';
import { ExcelImportModal } from '../components/ExcelImportModal';

// Declare moment from global scope (loaded via CDN in index.html)
declare const moment: any;

const ITEMS_PER_PAGE = 50;

type SortConfig = { key: keyof User; direction: 'ascending' | 'descending' } | null;
type UserFilters = { query: string; carModel: string; reference: string; status: LeadStatus | 'all'; };

interface UsersPageProps {
    initialFilters: { carModel?: string };
    onFiltersCleared: () => void;
    loggedInUser: MyProfile | null;
}

const UsersPage: React.FC<UsersPageProps> = ({ initialFilters, onFiltersCleared, loggedInUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [cars, setCars] = useState<Car[]>([]);
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [references, setReferences] = useState<Reference[]>([]);
    const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [selectedLead, setSelectedLead] = useState<User | null>(null);
    const [modalMessages, setModalMessages] = useState<LeadMessage[]>([]);
    const [modalFullUser, setModalFullUser] = useState<User | null>(null);
    const [modalLoading, setModalLoading] = useState<boolean>(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedUserForOrder, setSelectedUserForOrder] = useState<User | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'updatedAt', direction: 'descending' });
    const [filters, setFilters] = useState<UserFilters>({ query: '', carModel: 'all', reference: 'all', status: 'all' });

    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    
    // View Mode State
    const [viewMode, setViewMode] = useState<'LIST' | 'BOARD' | 'CALLS'>('LIST');

    useEffect(() => {
        setFilters(prev => ({ ...prev, carModel: initialFilters.carModel || 'all' }));
    }, [initialFilters]);


    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersData, carsData, conditionsData, referencesData, staffData] = await Promise.all([
                getUsers(),
                getCars(),
                getConditions(),
                getReferences(),
                getStaffUsers()
            ]);
            
            setUsers(usersData);
            setCars(carsData);
            setConditions(conditionsData);
            setReferences(referencesData);
            setStaffUsers(staffData);
        } catch (err) {
            setError('خطا در دریافت اطلاعات');
            showToast('خطا در دریافت اطلاعات', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedUserIds(new Set());
    }, [sortConfig, filters, viewMode]);
    
    const filteredUsers = useMemo(() => {
        const lowercasedQuery = filters.query.toLowerCase();
        return users.filter(user => {
            const queryMatch = filters.query === '' ||
                (user.FullName?.toLowerCase().includes(lowercasedQuery)) ||
                (user.Number?.includes(lowercasedQuery)) ||
                (user.CarModel?.toLowerCase().includes(lowercasedQuery)) ||
                (user.Province?.toLowerCase().includes(lowercasedQuery)) ||
                (user.City?.toLowerCase().includes(lowercasedQuery)) ||
                (user.Decription?.toLowerCase().includes(lowercasedQuery));

            const carModelMatch = filters.carModel === 'all' || user.CarModel === filters.carModel;
            const referenceMatch = filters.reference === 'all' || user.reference === filters.reference;
            const statusMatch = filters.status === 'all' || (user.leadStatus || LeadStatus.NEW) === filters.status;

            return queryMatch && carModelMatch && referenceMatch && statusMatch;
        });
    }, [users, filters]);

    const sortedUsers = useMemo(() => {
        let usersCopy = [...filteredUsers];

        if (sortConfig !== null) {
            usersCopy.sort((a, b) => {
                if (sortConfig.key === 'crmIsSend') {
                    const valA = a.crmIsSend ?? 0;
                    const valB = b.crmIsSend ?? 0;
                    if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }

                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (['RegisterTime', 'LastAction', 'createdAt', 'updatedAt'].includes(sortConfig.key)) {
                    const dateA = new Date((aValue as string || '').replace(' ', 'T')).getTime();
                    const dateB = new Date((bValue as string || '').replace(' ', 'T')).getTime();
                    if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (dateB > dateA) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }

                const aStr = String(aValue ?? '');
                const bStr = String(bValue ?? '');
                const comparison = aStr.localeCompare(bStr, 'fa-IR');
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        
        return usersCopy;
    }, [filteredUsers, sortConfig]);

    const paginatedUsers = useMemo(() => {
        if (viewMode === 'BOARD') return sortedUsers; // No pagination for board
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedUsers, currentPage, viewMode]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    
    const handleAddNew = useCallback(() => {
        setCurrentUser(null);
        setIsModalOpen(true);
    }, []);

    const handleEdit = (user: User) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setUserToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleViewDetails = async (lead: User) => {
        setIsDetailModalOpen(true);
        setSelectedLead(lead);
        setModalLoading(true);
        setModalError(null);
        setModalMessages([]);
        setModalFullUser(null);
        
        try {
            const historyPromise = getLeadHistory(lead.Number).catch(e => {
                console.error("Failed to load history", e);
                return []; 
            });

            const userPromise = getUserByNumber(lead.Number).catch(e => {
                console.error("Failed to load user details", e);
                return null;
            });
            
            const [historyData, userData] = await Promise.all([historyPromise, userPromise]);
            
            if (Array.isArray(historyData)) {
                const parseDate = (dateString: string) => new Date(dateString.replace(' ', 'T'));
                setModalMessages(historyData.sort((a, b) => parseDate(a.createdAt).getTime() - parseDate(b.createdAt).getTime()));
            }
            
            if (userData) {
                setModalFullUser(userData);
            } else {
                setModalFullUser(lead);
            }

        } catch (err) {
            console.error("Unexpected error in view details", err);
        } finally {
            setModalLoading(false);
        }
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedLead(null);
        setModalMessages([]);
        setModalFullUser(null);
    };

    const handleNavigateLead = async (direction: 'prev' | 'next') => {
        if (!selectedLead) return;
        const currentIndex = sortedUsers.findIndex(u => u.id === selectedLead.id);
        if (currentIndex === -1) return;
        
        let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= 0 && nextIndex < sortedUsers.length) {
            const nextLead = sortedUsers[nextIndex];
            await handleViewDetails(nextLead);
        }
    };
    
    const handleSave = async (userData: Omit<User, 'id'>) => {
        try {
            let savedUser: User;
            if (currentUser) {
                savedUser = await updateUser(currentUser.id, { ...userData, id: currentUser.id });
                showToast('کاربر با موفقیت ویرایش شد', 'success');
            } else {
                savedUser = await createUser(userData);
                showToast('کاربر جدید با موفقیت اضافه شد', 'success');
            }
            
            setIsModalOpen(false);
            setCurrentUser(null);
            fetchAllData();
        } catch (err) {
            showToast('عملیات با خطا مواجه شد', 'error');
        }
    };
    
    const handleStatusChange = async (userId: number, newStatus: LeadStatus) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        // Optimistic Update
        const originalUsers = [...users];
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, leadStatus: newStatus } : u));
        
        try {
            // Update via API
            await updateUser(userId, { ...user, leadStatus: newStatus });
        } catch (e) {
            // Revert on error
            setUsers(originalUsers);
            showToast('خطا در تغییر وضعیت سرنخ', 'error');
        }
    };

    const confirmDelete = async () => {
        if (userToDelete !== null) {
            try {
                await deleteUser(userToDelete);
                showToast('کاربر با موفقیت حذف شد', 'success');
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
                fetchAllData();
            } catch (err) {
                showToast('حذف کاربر با خطا مواجه شد', 'error');
            }
        }
    };
    
    const handleSort = (key: keyof User) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSendMessage = async (message: string, type: 'SMS' | 'WHATSAPP' | 'BALE', botId?: number) => {
        if (!selectedLead) {
            throw new Error("No active lead selected for sending message.");
        }
        
        const number = selectedLead.Number;

        try {
            const authorName = loggedInUser?.full_name || loggedInUser?.username || 'کاربر سیستم';
            if (type === 'SMS') {
                await sendSMS(number, message);
                showToast('پیامک با موفقیت ارسال شد', 'success');
                try {
                    await createCustomerJournal({
                        userId: selectedLead.id,
                        content: `ارسال موفق پیامک - متن پیام:\n${message}`,
                        author: authorName
                    });
                } catch (je) { console.error(je); }
            } else if (type === 'WHATSAPP') {
                await sendMessage(number, message);
                showToast('پیام واتساپ با موفقیت ارسال شد', 'success');
                try {
                    await createCustomerJournal({
                        userId: selectedLead.id,
                        content: `ارسال موفق پیام در واتساپ - متن پیام:\n${message}`,
                        author: authorName
                    });
                } catch (je) { console.error(je); }
            } else if (type === 'BALE') {
                const finalBotId = botId || 1941315571;
                await sendBaleMessage(finalBotId, number, message);
                showToast('پیام بله با موفقیت ارسال شد', 'success');
                try {
                    await createCustomerJournal({
                        userId: selectedLead.id,
                        content: `ارسال موفق پیام در بله - متن پیام:\n${message}`,
                        author: authorName
                    });
                } catch (je) { console.error(je); }
            }
            
            const data = await getLeadHistory(number);
            const parseDate = (dateString: string) => new Date(dateString.replace(' ', 'T'));
            setModalMessages(data.sort((a, b) => parseDate(a.createdAt).getTime() - parseDate(b.createdAt).getTime()));
        } catch (err) {
            showToast('ارسال پیام با خطا مواجه شد', 'error');
            throw err;
        }
    };
    
    const handleOpenOrderModal = (user: User) => {
        setSelectedUserForOrder(user);
        setIsOrderModalOpen(true);
    };

    const handleSaveOrder = async (orderData: any) => {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        try {
            await carOrdersService.create({
                ...orderData,
                status: OrderStatus.PENDING_ADMIN,
                createdBy: loggedInUser?.username || 'ناشناس',
                createdAt: now,
                updatedAt: now,
            });
            showToast('سفارش فروش برای مشتری با موفقیت ثبت شد', 'success');
            setIsOrderModalOpen(false);
            setSelectedUserForOrder(null);
        } catch (err) {
            showToast('خطا در ثبت سفارش فروش', 'error');
        }
    };

    const handleSelectionChange = (userId: number) => {
        setSelectedUserIds(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(userId)) {
                newSelection.delete(userId);
            } else {
                newSelection.add(userId);
            }
            return newSelection;
        });
    };

    const handleSelectAllChange = (selectAll: boolean) => {
        if (selectAll) {
            const allUserIdsOnPage = paginatedUsers.map(u => u.id);
            setSelectedUserIds(prev => {
                const next = new Set(prev);
                allUserIdsOnPage.forEach(id => next.add(id));
                return next;
            });
        } else {
            const allUserIdsOnPage = paginatedUsers.map(u => u.id);
            setSelectedUserIds(prev => {
                const next = new Set(prev);
                allUserIdsOnPage.forEach(id => next.delete(id));
                return next;
            });
        }
    };

    const handleSelectAllFiltered = () => {
        const allIds = filteredUsers.map(u => u.id);
        setSelectedUserIds(new Set(allIds));
        showToast(`${filteredUsers.length.toLocaleString('fa-IR')} کاربر انتخاب شدند`, 'success');
    };
    
    const handleSendBroadcast = async (
        message: string,
        type: 'SMS' | 'WHATSAPP' | 'BALE',
        onProgress: (progress: { sent: number; errors: number }) => void,
        botId?: number
    ): Promise<{finalSuccess: number, finalErrors: number}> => {
        const selectedUsers = users.filter(u => selectedUserIds.has(u.id));
        if (selectedUsers.length === 0 || !message.trim()) {
            return {finalSuccess: 0, finalErrors: 0};
        }

        let successCount = 0;
        let errorCount = 0;
        const authorName = loggedInUser?.full_name || loggedInUser?.username || 'کاربر سیستم';

        if (type === 'SMS') {
            const numbers = selectedUsers.map(u => u.Number).filter(n => n && n.trim().length > 0);
            if (numbers.length === 0) return { finalSuccess: 0, finalErrors: 0 };
            
            try {
                await sendBulkSMS(numbers, message);
                successCount = numbers.length;
                onProgress({ sent: successCount, errors: 0 });
                // Log journal entry for each user
                for (const user of selectedUsers) {
                    try {
                        await createCustomerJournal({
                            userId: user.id,
                            content: `ارسال موفق پیامک - متن پیام:\n${message}`,
                            author: authorName
                        });
                    } catch (je) { console.error(je); }
                }
            } catch (err) {
                console.error("Bulk SMS failed", err);
                errorCount = numbers.length;
                onProgress({ sent: 0, errors: errorCount });
                showToast('ارسال پیامک گروهی با خطا مواجه شد', 'error');
            }
            return { finalSuccess: successCount, finalErrors: errorCount };
        }

        for (const user of selectedUsers) {
            try {
                if (type === 'WHATSAPP') {
                    await sendMessage(user.Number, message);
                    try {
                        await createCustomerJournal({
                            userId: user.id,
                            content: `ارسال موفق پیام در واتساپ - متن پیام:\n${message}`,
                            author: authorName
                        });
                    } catch (je) { console.error(je); }
                } else if (type === 'BALE') {
                    const finalBotId = botId || 1941315571;
                    await sendBaleMessage(finalBotId, user.Number, message);
                    try {
                        await createCustomerJournal({
                            userId: user.id,
                            content: `ارسال موفق پیام در بله - متن پیام:\n${message}`,
                            author: authorName
                        });
                    } catch (je) { console.error(je); }
                }
                successCount++;
            } catch (err) {
                console.error(`Failed to send message to ${user.Number}:`, err);
                errorCount++;
            }
            onProgress({ sent: successCount, errors: errorCount });
        }
        
        return {finalSuccess: successCount, finalErrors: errorCount};
    };

    const handleCopySelected = () => {
        const selectedUsers = users.filter(u => selectedUserIds.has(u.id));
        if (selectedUsers.length === 0) {
            showToast('هیچ کاربری انتخاب نشده است.', 'error');
            return;
        }

        const textToCopy = selectedUsers.map(u => 
            `👤 ${u.FullName}\n🚗 ${u.CarModel || 'نامشخص'}\n📱 ${u.Number}`
        ).join('\n\n-------------------\n\n');

        navigator.clipboard.writeText(textToCopy)
            .then(() => showToast('اطلاعات مشتریان با موفقیت کپی شد', 'success'))
            .catch(() => showToast('کپی کردن با خطا مواجه شد', 'error'));
    };

    const handleExportSelectedToExcel = () => {
        const selectedUsers = users.filter(u => selectedUserIds.has(u.id));
        if (selectedUsers.length === 0) {
            showToast('هیچ کاربری انتخاب نشده است.', 'error');
            return;
        }

        const escapeCsv = (str: any) => {
            if (str === null || str === undefined) return '';
            const stringValue = String(str);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const headers = ['نام و نام خانوادگی', 'شماره تماس', 'خودرو', 'استان', 'شهر', 'وضعیت', 'توضیحات', 'تاریخ ثبت'];
        
        const csvContent = [
            headers.join(','),
            ...selectedUsers.map(u => [
                u.FullName,
                u.Number,
                u.CarModel,
                u.Province,
                u.City,
                u.leadStatus || LeadStatus.NEW,
                u.Decription,
                u.RegisterTime
            ].map(escapeCsv).join(','))
        ].join('\n');

        const blob = new Blob(["\uFEFF"+csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
        link.setAttribute("download", `crm_export_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('فایل اکسل با موفقیت دانلود شد', 'success');
    };

    const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6 space-y-4 flex-shrink-0">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-100 font-extrabold">مدیریت ارتباط با مشتری (CRM)</h2>
                            
                            {/* View Switcher */}
                            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                <button 
                                    onClick={() => setViewMode('LIST')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                                >
                                    <ClipboardListIcon className="w-4 h-4" />
                                    لیست
                                </button>
                                <button 
                                    onClick={() => setViewMode('BOARD')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'BOARD' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                                >
                                    <ChartBarIcon className="w-4 h-4" />
                                    برد کانبان
                                </button>
                                <button 
                                    onClick={() => setViewMode('CALLS')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'CALLS' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                                >
                                    <Phone className="w-4 h-4 text-sky-500" />
                                    تماس‌ها
                                </button>
                            </div>
                        </div>

                        {viewMode !== 'CALLS' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-300 shadow-sm flex items-center gap-2 text-sm"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    درون‌ریزی از اکسل
                                </button>
                                <button
                                    onClick={handleAddNew}
                                    className="bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors duration-300 shadow-sm flex items-center gap-2 text-sm"
                                >
                                    <PlusIcon />
                                    افزودن مشتری جدید
                                </button>
                            </div>
                        )}
                    </div>
                    {viewMode !== 'CALLS' && (
                        <UserFilterPanel
                            filters={filters}
                            onFilterChange={(newFilters: any) => setFilters(prev => ({...prev, ...newFilters}))}
                            references={references}
                            onClear={() => {
                                setFilters({ query: '', carModel: 'all', reference: 'all', status: 'all' });
                                onFiltersCleared();
                            }}
                        />
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center flex-grow">
                        <Spinner />
                    </div>
                ) : error ? (
                    <p className="text-center text-red-500 flex-grow">{error}</p>
                ) : (
                    <>
                        {viewMode === 'LIST' ? (
                            <>
                                <UserTable 
                                    users={paginatedUsers} 
                                    onEdit={handleEdit} 
                                    onDelete={handleDelete}
                                    onViewDetails={handleViewDetails}
                                    onSort={handleSort}
                                    sortConfig={sortConfig}
                                    selectedUserIds={selectedUserIds}
                                    onSelectionChange={handleSelectionChange}
                                    onSelectAllChange={handleSelectAllChange}
                                    onRegisterOrder={handleOpenOrderModal}
                                    loggedInUser={loggedInUser}
                                />
                                {totalPages > 1 && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                        totalItems={sortedUsers.length}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                    />
                                )}
                            </>
                        ) : viewMode === 'BOARD' ? (
                            <CrmKanbanBoard 
                                users={sortedUsers}
                                onStatusChange={handleStatusChange}
                                onViewDetails={handleViewDetails}
                                loggedInUser={loggedInUser}
                            />
                        ) : (
                            <CrmCallLogs 
                                users={users}
                                staffUsers={staffUsers}
                                loggedInUser={loggedInUser}
                            />
                        )}
                    </>
                )}
            </main>

            {isModalOpen && (
                <UserModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    user={currentUser}
                />
            )}

            {isImportModalOpen && (
                <ExcelImportModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    existingUsers={users}
                    onImportSuccess={() => {
                        fetchAllData();
                    }}
                />
            )}

            {isDetailModalOpen && (
                <LeadDetailHistoryModal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetailModal}
                    lead={selectedLead}
                    fullUserDetails={modalFullUser}
                    messages={modalMessages}
                    isLoading={modalLoading}
                    error={modalError}
                    onSendMessage={handleSendMessage}
                    onRegisterOrder={handleOpenOrderModal}
                    onEdit={(user) => {
                        // Close history modal first, then open edit modal
                        setIsDetailModalOpen(false);
                        handleEdit(user);
                    }}
                    hasPrevious={selectedLead ? sortedUsers.findIndex(u => u.id === selectedLead.id) > 0 : false}
                    hasNext={selectedLead ? (sortedUsers.findIndex(u => u.id === selectedLead.id) > -1 && sortedUsers.findIndex(u => u.id === selectedLead.id) < sortedUsers.length - 1) : false}
                    onNavigate={handleNavigateLead}
                    cars={cars}
                    conditions={conditions}
                    loggedInUser={loggedInUser}
                    onStatusChange={async (userId, newStatus) => {
                        await handleStatusChange(userId, newStatus);
                        setModalFullUser(prev => prev && prev.id === userId ? { ...prev, leadStatus: newStatus } : prev);
                        setSelectedLead(prev => prev && prev.id === userId ? { ...prev, leadStatus: newStatus } : prev);
                    }}
                />
            )}
            
            {isBroadcastModalOpen && (
                 <BroadcastModal
                    isOpen={isBroadcastModalOpen}
                    onClose={() => {
                        setIsBroadcastModalOpen(false);
                        setSelectedUserIds(new Set());
                    }}
                    onSend={handleSendBroadcast}
                    recipientCount={selectedUserIds.size}
                    cars={cars}
                    conditions={conditions}
                />
            )}

            {isOrderModalOpen && (
                <CarOrderModal
                    isOpen={isOrderModalOpen}
                    onClose={() => {
                        setIsOrderModalOpen(false);
                        setSelectedUserForOrder(null);
                    }}
                    onSave={handleSaveOrder}
                    username={loggedInUser?.username || ''}
                    initialBuyerData={selectedUserForOrder ? {
                        name: selectedUserForOrder.FullName,
                        phone: selectedUserForOrder.Number,
                        city: selectedUserForOrder.City,
                        address: selectedUserForOrder.Province,
                        postalCode: ''
                    } : undefined}
                />
            )}

            {isDeleteModalOpen && (
                <DeleteConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="حذف مشتری"
                    message="آیا از حذف این مشتری اطمینان دارید؟ این عملیات قابل بازگشت نیست."
                />
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {selectedUserIds.size > 0 && viewMode === 'LIST' && (
                <div className="fixed bottom-0 left-0 right-0 bg-sky-700 text-white p-3 sm:p-4 shadow-lg z-30 flex flex-col sm:flex-row justify-between items-center gap-3 animate-slide-up">
                    <div className="flex items-center gap-4">
                        <p className="text-sm sm:text-base font-bold">{selectedUserIds.size.toLocaleString('fa-IR')} کاربر انتخاب شده</p>
                        {selectedUserIds.size < filteredUsers.length && (
                             <button 
                                onClick={handleSelectAllFiltered}
                                className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/30"
                             >
                                انتخاب کل {filteredUsers.length.toLocaleString('fa-IR')} نتیجه
                             </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={handleCopySelected}
                            className="bg-amber-500 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2 text-sm sm:text-base"
                            title="کپی کردن اطلاعات"
                        >
                            <CopyIcon className="w-5 h-5" /> کپی
                        </button>
                        <button
                            onClick={handleExportSelectedToExcel}
                            className="bg-emerald-600 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
                            title="دانلود اکسل"
                        >
                            <ExportIcon className="w-5 h-5" /> اکسل
                        </button>
                        <button
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className="bg-white text-sky-700 font-semibold px-3 sm:px-4 py-2 rounded-lg hover:bg-sky-100 transition-colors flex items-center gap-2 text-sm sm:text-base"
                        >
                            <BroadcastIcon /> ارسال پیام گروهی
                        </button>
                        <button
                            onClick={() => setSelectedUserIds(new Set())}
                            className="text-white hover:bg-sky-600 p-2 rounded-full"
                            title="لغو انتخاب"
                        >
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out forwards;
                }
            `}</style>
        </>
    );
};

export default UsersPage;
