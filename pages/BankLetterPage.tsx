import React, { useState, useEffect, useMemo } from 'react';
import type { 
    BankLetter, 
    SavedBankAccount, 
    BankLetterType,
    CarPeaceContract
} from '../types/bankLetter';
import { 
    getSavedBankAccounts, 
    getSavedBankLetters, 
    saveOrUpdateBankLetter, 
    addOrUpdateBankAccount, 
    deleteBankAccount, 
    deleteBankLetter, 
    generateLetterNumber, 
    getCurrentPersianDate,
    formatOfficialLetterText
} from '../services/bankLetterService';
import {
    DEFAULT_PEACE_CONTRACT,
    getSavedPeaceContracts,
    saveOrUpdatePeaceContract,
    deletePeaceContract,
    generatePeaceContractNumber,
    formatPeaceContractText
} from '../services/peaceContractService';
import { 
    validateIranianNationalCode, 
    validateIranianSheba, 
    formatCurrencyWithCommas,
    toPersianDigits 
} from '../services/bankLetterValidation';
import { exportPeaceContractToWord, exportBankLetterToWord } from '../services/wordExportService';
import { BankLetterOfficialView } from '../components/bankLetter/BankLetterOfficialView';
import { BankLetterFillableTemplate } from '../components/bankLetter/BankLetterFillableTemplate';
import { PeaceContractFillableTemplate } from '../components/bankLetter/PeaceContractFillableTemplate';
import { PeaceContractOfficialView } from '../components/bankLetter/PeaceContractOfficialView';
import { SavedAccountsModal } from '../components/bankLetter/SavedAccountsModal';
import Toast from '../components/Toast';
import { 
    Landmark, 
    FileText, 
    Building2, 
    Search, 
    Copy, 
    Check, 
    Sparkles, 
    CheckCircle2, 
    Trash2, 
    Edit, 
    RotateCcw,
    FileSignature,
    Scale,
    Car,
    FileDown,
    Printer
} from 'lucide-react';

interface BankLetterPageProps {
    isAdmin?: boolean;
    loggedInUser?: any;
}

const DEFAULT_BLANK_LETTER: Omit<BankLetter, 'id' | 'letterNumber' | 'letterDate'> = {
    letterType: 'CORPORATE',
    destinationBankName: 'بانک رفاه کارگران',
    destinationBranchName: 'شعبه مرکزی شیراز',
    customerTitle: 'خانم',
    customerName: '',
    customerNationalCode: '',
    amountRials: 0,
    amountWords: '',
    paymentMethod: 'حواله ساتنا',
    shebaNumber: '590130100000000358157511',
    beneficiaryBankName: 'بانک رفاه کارگران',
    accountHolderName: 'شرکت حسینی خودرو شیراز',
    accountHolderType: 'COMPANY',
    carModel: 'KMC eagle',
    carModelYear: '1405',
    carColor: 'سفید',
    dealershipName: 'نمایندگی کرمان موتور 2606',
    signatoryTitle: 'مدیریت نمایندگی ۲۶۰۶ کرمان موتور (شرکت حسینی خودرو شیراز)',
    status: 'DRAFT',
    createdAt: ''
};

const BankLetterPage: React.FC<BankLetterPageProps> = ({ isAdmin = false, loggedInUser }) => {
    // Document Mode: Bank Letter vs Peace Contract
    const [docMode, setDocMode] = useState<'BANK_LETTER' | 'PEACE_CONTRACT'>('PEACE_CONTRACT');
    const [activeTab, setActiveTab] = useState<'create' | 'archive'>('create');
    
    // Accounts and Letters State
    const [savedAccounts, setSavedAccounts] = useState<SavedBankAccount[]>([]);
    const [savedLetters, setSavedLetters] = useState<BankLetter[]>([]);
    const [savedContracts, setSavedContracts] = useState<CarPeaceContract[]>([]);
    
    // Current Active Letter
    const [currentLetter, setCurrentLetter] = useState<BankLetter>(() => ({
        ...DEFAULT_BLANK_LETTER,
        id: `bl-${Date.now()}`,
        letterNumber: generateLetterNumber(),
        letterDate: getCurrentPersianDate(),
        createdAt: new Date().toISOString()
    }));

    // Current Active Peace Contract
    const [currentContract, setCurrentContract] = useState<CarPeaceContract>(() => ({
        ...DEFAULT_PEACE_CONTRACT,
        id: `pc-${Date.now()}`,
        contractNumber: generatePeaceContractNumber(),
        contractDate: getCurrentPersianDate(),
        transactionTime: '11:00',
        createdAt: new Date().toISOString()
    }));

    // Search and Filters in Archive
    const [archiveSearch, setArchiveSearch] = useState('');
    const [archiveFilterType, setArchiveFilterType] = useState<'ALL' | BankLetterType>('ALL');

    // Modals & Feedback
    const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isContractCopied, setIsContractCopied] = useState(false);
    const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Initial Load
    useEffect(() => {
        const accounts = getSavedBankAccounts();
        const letters = getSavedBankLetters();
        const contracts = getSavedPeaceContracts();
        setSavedAccounts(accounts);
        setSavedLetters(letters);
        setSavedContracts(contracts);

        // Set default account if exists
        const def = accounts.find(a => a.isDefault) || accounts[0];
        if (def) {
            setCurrentLetter(prev => ({
                ...prev,
                shebaNumber: def.shebaNumber,
                beneficiaryBankName: def.bankName,
                accountHolderName: def.accountHolderName,
                accountHolderType: def.accountType
            }));
        }
    }, []);

    // Handle Bank Letter Updates
    const handleUpdateLetter = (updates: Partial<BankLetter>) => {
        setCurrentLetter(prev => ({ ...prev, ...updates }));
    };

    // Handle Peace Contract Updates
    const handleUpdateContract = (updates: Partial<CarPeaceContract>) => {
        setCurrentContract(prev => ({ ...prev, ...updates }));
    };

    // Reset Bank Letter Form
    const handleResetLetterForm = () => {
        const def = savedAccounts.find(a => a.isDefault) || savedAccounts[0];
        setCurrentLetter({
            ...DEFAULT_BLANK_LETTER,
            id: `bl-${Date.now()}`,
            letterNumber: generateLetterNumber(),
            letterDate: getCurrentPersianDate(),
            shebaNumber: def ? def.shebaNumber : '590130100000000358157511',
            beneficiaryBankName: def ? def.bankName : 'بانک رفاه کارگران',
            accountHolderName: def ? def.accountHolderName : 'شرکت حسینی خودرو شیراز',
            accountHolderType: def ? def.accountType : 'COMPANY'
        });
        setToast({ message: 'فرم صدور نامه بانک بازنشانی شد.', type: 'info' });
    };

    // Reset Peace Contract Form
    const handleResetContractForm = () => {
        setCurrentContract({
            ...DEFAULT_PEACE_CONTRACT,
            id: `pc-${Date.now()}`,
            contractNumber: generatePeaceContractNumber(),
            contractDate: getCurrentPersianDate(),
            transactionTime: '11:00',
            createdAt: new Date().toISOString()
        });
        setToast({ message: 'فرم قرارداد صلح خودرو بازنشانی شد.', type: 'info' });
    };

    // Select Saved Account for Bank Letter
    const handleSelectAccount = (account: SavedBankAccount) => {
        setCurrentLetter(prev => ({
            ...prev,
            shebaNumber: account.shebaNumber,
            beneficiaryBankName: account.bankName,
            accountHolderName: account.accountHolderName,
            accountHolderType: account.accountType,
            letterType: account.accountType === 'COMPANY' ? 'CORPORATE' : 'PERSONAL'
        }));
        setToast({ message: `حساب ${account.accountHolderName} (${account.bankName}) انتخاب شد.`, type: 'info' });
    };

    // Save Bank Account
    const handleSaveAccount = (acc: Omit<SavedBankAccount, 'id'> & { id?: string }) => {
        const updated = addOrUpdateBankAccount(acc);
        setSavedAccounts(updated);
        setToast({ message: 'اطلاعات حساب با موفقیت در لیست ذخیره گردید.', type: 'success' });
    };

    // Delete Bank Account
    const handleDeleteAccount = (id: string) => {
        const updated = deleteBankAccount(id);
        setSavedAccounts(updated);
        setToast({ message: 'حساب با موفقیت حذف شد.', type: 'info' });
    };

    // Save Current Letter to Archive
    const handleSaveLetterToArchive = () => {
        if (!currentLetter.customerName.trim()) {
            setToast({ message: 'لطفاً نام مشتری را وارد نمایید.', type: 'error' });
            return;
        }
        if (!currentLetter.customerNationalCode.trim()) {
            setToast({ message: 'لطفاً کد ملی مشتری را وارد نمایید.', type: 'error' });
            return;
        }

        const toSave: BankLetter = {
            ...currentLetter,
            status: 'ISSUED'
        };

        const updated = saveOrUpdateBankLetter(toSave);
        setSavedLetters(updated);
        setToast({ message: `نامه بانک برای «${toSave.customerName}» با موفقیت در بایگانی ذخیره شد.`, type: 'success' });
    };

    // Save Current Peace Contract to Archive
    const handleSaveContractToArchive = () => {
        if (!currentContract.releaseeName.trim()) {
            setToast({ message: 'لطفاً نام و نام خانوادگی متصالح را وارد نمایید.', type: 'error' });
            return;
        }
        if (!currentContract.releaseeNationalCode.trim()) {
            setToast({ message: 'لطفاً کد ملی متصالح را وارد نمایید.', type: 'error' });
            return;
        }

        const toSave: CarPeaceContract = {
            ...currentContract,
            status: 'SIGNED'
        };

        const updated = saveOrUpdatePeaceContract(toSave);
        setSavedContracts(updated);
        setToast({ message: `قرارداد صلح خودرو برای «${toSave.releaseeName}» در بایگانی ذخیره شد.`, type: 'success' });
    };

    // Delete Letter from Archive
    const handleDeleteLetter = (id: string) => {
        if (window.confirm('آیا از حذف این نامه از بایگانی اطمینان دارید؟')) {
            const updated = deleteBankLetter(id);
            setSavedLetters(updated);
            setToast({ message: 'نامه از بایگانی حذف شد.', type: 'info' });
        }
    };

    // Delete Peace Contract from Archive
    const handleDeleteContract = (id: string) => {
        if (window.confirm('آیا از حذف این قرارداد صلح از بایگانی اطمینان دارید؟')) {
            const updated = deletePeaceContract(id);
            setSavedContracts(updated);
            setToast({ message: 'قرارداد صلح از بایگانی حذف شد.', type: 'info' });
        }
    };

    // Edit Letter from Archive
    const handleEditLetterFromArchive = (letter: BankLetter) => {
        setCurrentLetter(letter);
        setDocMode('BANK_LETTER');
        setActiveTab('create');
        setToast({ message: `نامه ${letter.customerName} بارگذاری شد.`, type: 'info' });
    };

    // Edit Peace Contract from Archive
    const handleEditContractFromArchive = (contract: CarPeaceContract) => {
        setCurrentContract(contract);
        setDocMode('PEACE_CONTRACT');
        setActiveTab('create');
        setToast({ message: `قرارداد صلح ${contract.releaseeName} بارگذاری شد.`, type: 'info' });
    };

    // Export Peace Contract to Word from Archive
    const handleExportContractWord = async (contract: CarPeaceContract) => {
        try {
            await exportPeaceContractToWord(contract);
            setToast({ message: `فایل Word صلح‌نامه برای «${contract.releaseeName || 'مشتری'}» دانلود شد.`, type: 'success' });
        } catch (error) {
            console.error('Word export error:', error);
            setToast({ message: 'خطا در ایجاد فایل Word', type: 'error' });
        }
    };

    // Export Bank Letter to Word from Archive
    const handleExportLetterWord = async (letter: BankLetter) => {
        try {
            await exportBankLetterToWord(letter);
            setToast({ message: `فایل Word نامه بانک برای «${letter.customerName || 'مشتری'}» دانلود شد.`, type: 'success' });
        } catch (error) {
            console.error('Word export error:', error);
            setToast({ message: 'خطا در ایجاد فایل Word', type: 'error' });
        }
    };

    // Copy formatted text for current letter
    const handleCopyLetterText = () => {
        const text = formatOfficialLetterText(currentLetter);
        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
            setToast({ message: 'متن کامل نامه بانک کپی شد.', type: 'success' });
        });
    };

    // Copy formatted text for current peace contract
    const handleCopyContractText = () => {
        const text = formatPeaceContractText(currentContract);
        navigator.clipboard.writeText(text).then(() => {
            setIsContractCopied(true);
            setTimeout(() => setIsContractCopied(false), 2500);
            setToast({ message: 'متن کامل قرارداد صلح خودرو کپی شد.', type: 'success' });
        });
    };

    // Copy formatted text for archived items
    const handleCopyArchivedItem = (text: string, id: string, name: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedItemId(id);
            setTimeout(() => setCopiedItemId(null), 2500);
            setToast({ message: `متن سند برای «${name}» کپی شد.`, type: 'success' });
        });
    };

    // Filtered Bank Letters
    const filteredLetters = useMemo(() => {
        return savedLetters.filter(l => {
            const matchType = archiveFilterType === 'ALL' || l.letterType === archiveFilterType;
            if (!matchType) return false;

            if (!archiveSearch.trim()) return true;
            const q = archiveSearch.trim().toLowerCase();
            return (
                l.customerName.toLowerCase().includes(q) ||
                l.customerNationalCode.includes(q) ||
                l.carModel.toLowerCase().includes(q) ||
                l.destinationBankName.toLowerCase().includes(q) ||
                l.accountHolderName.toLowerCase().includes(q) ||
                l.letterNumber.toLowerCase().includes(q)
            );
        });
    }, [savedLetters, archiveSearch, archiveFilterType]);

    // Filtered Peace Contracts
    const filteredContracts = useMemo(() => {
        if (!archiveSearch.trim()) return savedContracts;
        const q = archiveSearch.trim().toLowerCase();
        return savedContracts.filter(c => 
            c.releaseeName.toLowerCase().includes(q) ||
            c.releaseeNationalCode.includes(q) ||
            c.carModel.toLowerCase().includes(q) ||
            c.chassisNumber.toLowerCase().includes(q) ||
            c.plateNumber.includes(q) ||
            c.contractNumber.toLowerCase().includes(q)
        );
    }, [savedContracts, archiveSearch]);

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto font-vazir space-y-6 animate-fadeIn pb-24">
            {/* Header with Document Selector */}
            <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-blue-700 text-white flex items-center justify-center font-bold shadow-md">
                        {docMode === 'PEACE_CONTRACT' ? <Scale className="w-7 h-7" /> : <Landmark className="w-7 h-7" />}
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
                                {docMode === 'PEACE_CONTRACT' ? 'قرارداد صلح خودرو' : 'نامه معرفی به بانک'}
                            </h1>
                            <span className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                {docMode === 'PEACE_CONTRACT' ? 'ماده ۱۰ قانون مدنی و شرط داوری' : 'حواله ساتنا و معرفی‌نامه'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            تکمیل خودکار جاهای خالی قالب، اعتبارسنجی زنده کد ملی و شبا، و قابلیت کپی مستقیم متن
                        </p>
                    </div>
                </div>

                {/* Document Type Switcher Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => { setDocMode('PEACE_CONTRACT'); setActiveTab('create'); }}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                docMode === 'PEACE_CONTRACT'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            <FileSignature className="w-4 h-4" />
                            <span>قرارداد صلح خودرو</span>
                        </button>
                        <button
                            onClick={() => { setDocMode('BANK_LETTER'); setActiveTab('create'); }}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                docMode === 'BANK_LETTER'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            <Landmark className="w-4 h-4" />
                            <span>نامه معرفی بانک</span>
                        </button>
                    </div>

                    {docMode === 'BANK_LETTER' && (
                        <button
                            onClick={() => setIsAccountsModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                            <Building2 className="w-4 h-4" />
                            <span>حساب‌های شرکتی ({savedAccounts.length})</span>
                        </button>
                    )}

                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'create'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            صدور و ویرایش
                        </button>
                        <button
                            onClick={() => setActiveTab('archive')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'archive'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            بایگانی ({docMode === 'PEACE_CONTRACT' ? savedContracts.length : savedLetters.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* ==================== PEACE CONTRACT WORKSPACE ==================== */}
            {docMode === 'PEACE_CONTRACT' && activeTab === 'create' && (
                <div className="space-y-6">
                    {/* Top Action Bar */}
                    <div className="no-print bg-slate-100/80 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                مصالح قرارداد:
                            </span>
                            <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-amber-800 dark:text-amber-300">
                                شرکت تضامنی حسینی خودرو شیراز (نمایندگی ۲۶۰۶ کرمان موتور)
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleResetContractForm}
                                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>بازنشانی فرم</span>
                            </button>
                            <button
                                onClick={handleSaveContractToArchive}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ذخیره در بایگانی</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Workspace Layout (Single Column) */}
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {/* 1. Interactive Fillable Template */}
                        <div className="no-print space-y-4">
                            <PeaceContractFillableTemplate
                                contract={currentContract}
                                onChange={handleUpdateContract}
                            />
                        </div>

                        {/* 2. Official Printable View & 1-Click Copy */}
                        <div className="space-y-4">
                            <PeaceContractOfficialView
                                contract={currentContract}
                                onCopyText={handleCopyContractText}
                                isCopied={isContractCopied}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== PEACE CONTRACT ARCHIVE ==================== */}
            {docMode === 'PEACE_CONTRACT' && activeTab === 'archive' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <FileSignature className="w-5 h-5 text-amber-600" />
                                    <span>بایگانی قراردادهای صلح خودرو</span>
                                    <span className="text-xs font-normal text-slate-500">({savedContracts.length} قرارداد ثبت شده)</span>
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    جستجو، کپی مستقیم متن، مشاهده پیش‌نمایش و چاپ مجدد صلحنامه‌ها
                                </p>
                            </div>

                            {/* Search */}
                            <div className="relative min-w-[260px]">
                                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                                <input
                                    type="text"
                                    placeholder="جستجوی نام متصالح، کد ملی، شاسی..."
                                    value={archiveSearch}
                                    onChange={(e) => setArchiveSearch(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-4 py-2 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                                        <th className="p-3.5">شماره و تاریخ قرارداد</th>
                                        <th className="p-3.5">متصالح (خریدار)</th>
                                        <th className="p-3.5">کد ملی</th>
                                        <th className="p-3.5">خودرو و شاسی</th>
                                        <th className="p-3.5">مبلغ صلح</th>
                                        <th className="p-3.5 text-center">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredContracts.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-slate-400">
                                                هنوز قرارداد صلحی در بایگانی ثبت نشده است. با تکمیل فرم و کلیک بر روی «ذخیره در بایگانی»، قراردادها در اینجا آرشیو می‌شوند.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredContracts.map(contract => (
                                            <tr key={contract.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="p-3.5">
                                                    <div className="font-bold text-slate-900 dark:text-white font-mono">
                                                        {contract.contractNumber}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {toPersianDigits(contract.contractDate)} - ساعت {toPersianDigits(contract.transactionTime)}
                                                    </div>
                                                </td>
                                                <td className="p-3.5">
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        {contract.releaseeTitle} {contract.releaseeName}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        فرزند {contract.releaseeFatherName || '-'}
                                                    </div>
                                                </td>
                                                <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                    {toPersianDigits(contract.releaseeNationalCode)}
                                                </td>
                                                <td className="p-3.5">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">
                                                        {contract.carModel} ({toPersianDigits(contract.modelYear)})
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-mono">
                                                        شاسی: {contract.chassisNumber || '-'}
                                                    </div>
                                                </td>
                                                <td className="p-3.5 font-bold text-emerald-700 dark:text-emerald-400">
                                                    {contract.totalAmountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(contract.totalAmountRials))} ریال` : '-'}
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => handleCopyArchivedItem(formatPeaceContractText(contract), contract.id, contract.releaseeName)}
                                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                                copiedItemId === contract.id
                                                                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950'
                                                                    : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950'
                                                            }`}
                                                            title="کپی متن کامل قرارداد صلح"
                                                        >
                                                            {copiedItemId === contract.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleExportContractWord(contract)}
                                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors cursor-pointer"
                                                            title="دانلود مستقیم فایل Word (.docx)"
                                                        >
                                                            <FileDown className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditContractFromArchive(contract)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                                                            title="مشاهده، ویرایش و چاپ"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteContract(contract.id)}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                                                            title="حذف از بایگانی"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== BANK LETTER WORKSPACE ==================== */}
            {docMode === 'BANK_LETTER' && activeTab === 'create' && (
                <div className="space-y-6">
                    {/* Actions Bar */}
                    <div className="no-print bg-slate-100/80 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                حساب پیش‌فرض فعال:
                            </span>
                            <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-blue-700 dark:text-blue-300">
                                {currentLetter.accountHolderName} ({currentLetter.beneficiaryBankName})
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleResetLetterForm}
                                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>بازنشانی فرم</span>
                            </button>
                            <button
                                onClick={handleSaveLetterToArchive}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ذخیره در بایگانی</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Workspace Layout (Single Column) */}
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {/* 1. Input & Template Fill Form */}
                        <div className="no-print space-y-4">
                            <BankLetterFillableTemplate
                                letter={currentLetter}
                                savedAccounts={savedAccounts}
                                onChange={handleUpdateLetter}
                                onSelectAccount={handleSelectAccount}
                            />

                            {/* Meta info card */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4 text-xs">
                                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    اطلاعات سربرگ و شماره نامه
                                </h4>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-500 font-bold mb-1">شماره نامه:</label>
                                        <input
                                            type="text"
                                            value={currentLetter.letterNumber}
                                            onChange={(e) => handleUpdateLetter({ letterNumber: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold font-mono text-slate-800 dark:text-slate-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 font-bold mb-1">تاریخ صدور:</label>
                                        <input
                                            type="text"
                                            value={currentLetter.letterDate}
                                            onChange={(e) => handleUpdateLetter({ letterDate: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold text-slate-800 dark:text-slate-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Live Official Printable Letterhead View */}
                        <div className="space-y-4">
                            <BankLetterOfficialView
                                letter={currentLetter}
                                onCopyText={handleCopyLetterText}
                                isCopied={isCopied}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== BANK LETTER ARCHIVE ==================== */}
            {docMode === 'BANK_LETTER' && activeTab === 'archive' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Landmark className="w-5 h-5 text-blue-600" />
                                    <span>بایگانی نامه‌های معرفی به بانک</span>
                                    <span className="text-xs font-normal text-slate-500">({savedLetters.length} نامه ثبت شده)</span>
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    جستجو، کپی مستقیم متن، مشاهده پیش‌نمایش و چاپ مجدد نامه‌ها
                                </p>
                            </div>

                            {/* Search and Filters */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative min-w-[220px]">
                                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                                    <input
                                        type="text"
                                        placeholder="جستجوی نام، کد ملی، مدل خودرو..."
                                        value={archiveSearch}
                                        onChange={(e) => setArchiveSearch(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-4 py-2 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                                        <th className="p-3.5">شماره و تاریخ</th>
                                        <th className="p-3.5">مشتری</th>
                                        <th className="p-3.5">خودرو</th>
                                        <th className="p-3.5">مبلغ واریزی</th>
                                        <th className="p-3.5">بانک و حساب مقصد</th>
                                        <th className="p-3.5 text-center">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredLetters.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-slate-400">
                                                هنوز نامه‌ای در بایگانی ذخیره نشده است. با تکمیل فرم و کلیک روی «ذخیره در بایگانی»، نامه‌ها در اینجا آرشیو می‌شوند.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLetters.map(letter => (
                                            <tr key={letter.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="p-3.5 font-mono">
                                                    <div className="font-bold text-slate-900 dark:text-white">{letter.letterNumber}</div>
                                                    <div className="text-[11px] text-slate-500">{toPersianDigits(letter.letterDate)}</div>
                                                </td>
                                                <td className="p-3.5">
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        {letter.customerTitle} {letter.customerName}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-mono">
                                                        کد ملی: {toPersianDigits(letter.customerNationalCode)}
                                                    </div>
                                                </td>
                                                <td className="p-3.5">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{letter.carModel}</div>
                                                    <div className="text-[11px] text-slate-500">رنگ {letter.carColor} - مدل {toPersianDigits(letter.carModelYear)}</div>
                                                </td>
                                                <td className="p-3.5 font-bold text-emerald-700 dark:text-emerald-400">
                                                    {letter.amountRials > 0 ? `${toPersianDigits(formatCurrencyWithCommas(letter.amountRials))} ریال` : '-'}
                                                </td>
                                                <td className="p-3.5">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">
                                                        {letter.beneficiaryBankName}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                                                        {letter.accountHolderName}
                                                    </div>
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => handleCopyArchivedItem(formatOfficialLetterText(letter), letter.id, letter.customerName)}
                                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                                copiedItemId === letter.id
                                                                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950'
                                                                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950'
                                                            }`}
                                                            title="کپی متن نامه"
                                                        >
                                                            {copiedItemId === letter.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleExportLetterWord(letter)}
                                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors cursor-pointer"
                                                            title="دانلود مستقیم فایل Word (.docx)"
                                                        >
                                                            <FileDown className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditLetterFromArchive(letter)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                                                            title="مشاهده و ویرایش"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLetter(letter.id)}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                                                            title="حذف از بایگانی"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Saved Accounts Modal */}
            <SavedAccountsModal
                isOpen={isAccountsModalOpen}
                onClose={() => setIsAccountsModalOpen(false)}
                accounts={savedAccounts}
                onSaveAccount={handleSaveAccount}
                onDeleteAccount={handleDeleteAccount}
            />

            {/* Toast Feedback */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default BankLetterPage;
