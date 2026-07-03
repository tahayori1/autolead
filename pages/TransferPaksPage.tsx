
import React, { useState } from 'react';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { CarIcon } from '../components/icons/CarIcon';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import type { SecureTransaction, TransactionRole, TransactionStep, TransactionType } from '../types';
import { TransactionStatus } from '../types';

// --- MOCK DATA ---
const INITIAL_STEPS_USED: TransactionStep[] = [
    { id: 1, title: 'احراز هویت خودرو و طرفین', roleRequired: ['ADMIN', 'TECH_EXPERT'], isCompleted: false },
    { id: 2, title: 'کارشناسی فنی و بدنه', roleRequired: ['TECH_EXPERT'], isCompleted: false },
    { id: 3, title: 'استعلامات حقوقی (فراجا/قوه قضاییه)', roleRequired: ['LEGAL_EXPERT'], isCompleted: false },
    { id: 4, title: 'تاییدیه مالی و قرارداد', roleRequired: ['FINANCE_EXPERT'], isCompleted: false },
    { id: 5, title: 'امضای دیجیتال و تحویل', roleRequired: ['ADMIN', 'CUSTOMER'], isCompleted: false },
];

// --- COMPONENTS ---

const RoleSelector: React.FC<{ currentRole: TransactionRole, setRole: (r: TransactionRole) => void }> = ({ currentRole, setRole }) => (
    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm mb-4 flex flex-wrap gap-2 items-center justify-between border border-emerald-100 dark:border-emerald-900">
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 px-2">مشاهده به عنوان:</span>
        <div className="flex gap-1 overflow-x-auto">
            {(['ADMIN', 'TECH_EXPERT', 'LEGAL_EXPERT', 'FINANCE_EXPERT', 'CUSTOMER'] as TransactionRole[]).map(role => (
                <button
                    key={role}
                    onClick={() => setRole(role)}
                    className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
                        currentRole === role 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900'
                    }`}
                >
                    {role === 'ADMIN' ? 'مدیر' : role === 'TECH_EXPERT' ? 'کارشناس فنی' : role === 'LEGAL_EXPERT' ? 'حقوقی' : role === 'FINANCE_EXPERT' ? 'مالی' : 'مشتری'}
                </button>
            ))}
        </div>
    </div>
);

const TransactionCard: React.FC<{ transaction: SecureTransaction, onClick: () => void }> = ({ transaction, onClick }) => (
    <div onClick={onClick} className="bg-white dark:bg-slate-800 p-4 rounded-xl border-r-4 border-emerald-500 shadow-sm hover:shadow-md transition-all cursor-pointer mb-3">
        <div className="flex justify-between items-start">
            <div>
                <h4 className="font-bold text-slate-800 dark:text-white">{transaction.carModel || 'خودرو جدید'}</h4>
                <p className="text-xs text-slate-500 mt-1">فروشنده: {transaction.sellerName || '---'}</p>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                transaction.status === TransactionStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
                {transaction.status}
            </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-emerald-600 font-mono font-bold">
                {transaction.price.toLocaleString('fa-IR')} تومان
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>مرحله {transaction.currentStep} از {transaction.steps.length}</span>
                <ArrowRightIcon className="w-3 h-3 rotate-180" />
            </div>
        </div>
        <div className="mt-2 w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${(transaction.currentStep / transaction.steps.length) * 100}%` }}
            ></div>
        </div>
    </div>
);

const StepWizard: React.FC<{ 
    transaction: SecureTransaction, 
    role: TransactionRole, 
    onUpdate: (updated: SecureTransaction) => void,
    onClose: () => void 
}> = ({ transaction, role, onUpdate, onClose }) => {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const currentStepIndex = transaction.currentStep - 1;
    const currentStep = transaction.steps[currentStepIndex];

    const hasPermission = currentStep && (role === 'ADMIN' || currentStep.roleRequired.includes(role));

    const handleInputChange = (field: keyof SecureTransaction, value: any) => {
        onUpdate({ ...transaction, [field]: value });
    };

    const handleApproveStep = async () => {
        // Basic validation for step 1
        if (transaction.currentStep === 1) {
            if (!transaction.carModel || !transaction.sellerName || !transaction.buyerName || !transaction.price) {
                alert('لطفاً تمام اطلاعات خودرو و طرفین را تکمیل کنید.');
                return;
            }
        }

        setLoadingAction('approve');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const updatedSteps = [...transaction.steps];
        updatedSteps[currentStepIndex].isCompleted = true;
        
        let nextStep = transaction.currentStep + 1;
        let nextStatus = transaction.status;

        if (nextStep > transaction.steps.length) {
            nextStep = transaction.steps.length;
            nextStatus = TransactionStatus.COMPLETED;
        } else {
             // Map step ID to status enum approximately
             if (nextStep === 2) nextStatus = TransactionStatus.TECH_CHECK;
             if (nextStep === 3) nextStatus = TransactionStatus.LEGAL_CHECK;
             if (nextStep === 4) nextStatus = TransactionStatus.FINANCE_CHECK;
             if (nextStep === 5) nextStatus = TransactionStatus.CONTRACT_SIGN;
        }

        onUpdate({
            ...transaction,
            currentStep: nextStep,
            status: nextStatus,
            steps: updatedSteps
        });
        setLoadingAction(null);
    };

    const simulateApiCall = async (name: string) => {
        setLoadingAction(name);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setLoadingAction(null);
        alert(`استعلام ${name} با موفقیت انجام شد و نتیجه مثبت است.`);
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 bg-emerald-700 text-white flex justify-between items-center shadow-md">
                <div>
                    <h2 className="font-bold text-lg">معامله {transaction.carModel || 'جدید'}</h2>
                    <p className="text-xs opacity-80">کد رهگیری: {transaction.id}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Stepper Header */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 overflow-x-auto">
                <div className="flex items-center min-w-max gap-2">
                    {transaction.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div className={`flex flex-col items-center gap-1 ${idx + 1 === transaction.currentStep ? 'opacity-100 scale-105' : 'opacity-60'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                    step.isCompleted 
                                        ? 'bg-emerald-600 text-white' 
                                        : idx + 1 === transaction.currentStep 
                                            ? 'bg-amber-500 text-white animate-pulse' 
                                            : 'bg-slate-300 text-slate-600'
                                }`}>
                                    {step.isCompleted ? '✓' : idx + 1}
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{step.title.split(' ')[0]}...</span>
                            </div>
                            {idx < transaction.steps.length - 1 && (
                                <div className={`w-8 h-0.5 mx-1 ${step.isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 border-b pb-2">
                        مرحله {transaction.currentStep}: {currentStep?.title}
                    </h3>
                    
                    {/* Dynamic Content based on Step */}
                    <div className="space-y-6">
                        {transaction.currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-700 p-5 rounded-xl border border-slate-200 dark:border-slate-600">
                                     <h4 className="font-bold text-sm mb-4 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                        <CarIcon className="w-5 h-5" />
                                        اطلاعات پایه معامله
                                     </h4>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">مدل خودرو</label>
                                            <input 
                                                type="text" 
                                                value={transaction.carModel} 
                                                onChange={(e) => handleInputChange('carModel', e.target.value)}
                                                placeholder="مثال: KMC T8"
                                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">مبلغ توافقی (تومان)</label>
                                            <input 
                                                type="number" 
                                                value={transaction.price || ''} 
                                                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                                                placeholder="0"
                                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">نام کامل فروشنده</label>
                                            <input 
                                                type="text" 
                                                value={transaction.sellerName} 
                                                onChange={(e) => handleInputChange('sellerName', e.target.value)}
                                                placeholder="نام و نام خانوادگی"
                                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">نام کامل خریدار</label>
                                            <input 
                                                type="text" 
                                                value={transaction.buyerName} 
                                                onChange={(e) => handleInputChange('buyerName', e.target.value)}
                                                placeholder="نام و نام خانوادگی"
                                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                     </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-bold text-sm mb-3 text-slate-700 dark:text-slate-300">استعلامات اولیه هویت</h4>
                                    <button onClick={() => simulateApiCall('ثبت احوال (شاهکار)')} className="w-full border-2 border-dashed border-emerald-500 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center justify-center gap-2 transition-colors">
                                        {loadingAction === 'ثبت احوال (شاهکار)' ? <Spinner /> : 'تایید هویت طرفین (استعلام شاهکار)'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {transaction.currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                                    <p>لطفاً تصاویر بدنه خودرو را به همراه موقعیت مکانی و زمان دقیق آپلود کنید.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 border border-dashed border-slate-300 dark:border-slate-500">
                                        + تصویر جلو
                                    </div>
                                    <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 border border-dashed border-slate-300 dark:border-slate-500">
                                        + تصویر عقب
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    موقعیت مکانی (GPS): تایید شده
                                </div>
                            </div>
                        )}

                        {transaction.currentStep === 3 && (
                            <div className="space-y-3">
                                <button onClick={() => simulateApiCall('خلافی و عوارض (آیتول)')} className="w-full p-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                                    <span className="text-slate-700 dark:text-slate-200">استعلام خلافی و عوارض</span>
                                    {loadingAction === 'خلافی و عوارض (آیتول)' ? <Spinner /> : <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded text-slate-700 dark:text-slate-300">بررسی</span>}
                                </button>
                                <button onClick={() => simulateApiCall('ممنوع‌المعامله (عدل ایران)')} className="w-full p-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                                    <span className="text-slate-700 dark:text-slate-200">استعلام ممنوع‌المعامله (قوه قضاییه)</span>
                                    {loadingAction === 'ممنوع‌المعامله (عدل ایران)' ? <Spinner /> : <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded text-slate-700 dark:text-slate-300">بررسی</span>}
                                </button>
                                <button onClick={() => simulateApiCall('توقیف پلاک (پلیس راهور)')} className="w-full p-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                                    <span className="text-slate-700 dark:text-slate-200">استعلام وضعیت پلاک (راهور)</span>
                                    {loadingAction === 'توقیف پلاک (پلیس راهور)' ? <Spinner /> : <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded text-slate-700 dark:text-slate-300">بررسی</span>}
                                </button>
                            </div>
                        )}

                        {transaction.currentStep === 4 && (
                            <div className="text-center space-y-4">
                                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                    {transaction.price.toLocaleString('fa-IR')} <span className="text-sm">تومان</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">مبلغ قرارداد تایید شده است. پیش‌نویس قرارداد آماده امضا می‌باشد.</p>
                                <button className="text-sky-600 dark:text-sky-400 text-sm font-bold underline hover:text-sky-800 dark:hover:text-sky-300">مشاهده پیش‌نویس PDF</button>
                            </div>
                        )}

                        {transaction.currentStep === 5 && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-6">
                                <div className="w-24 h-24 border-4 border-emerald-500 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-center text-slate-700 dark:text-slate-200 font-bold text-lg">همه چیز آماده تحویل است!</p>
                                <button className="bg-emerald-600 text-white px-8 py-3 rounded-xl shadow-lg shadow-emerald-300 dark:shadow-none font-bold hover:bg-emerald-700 transition-transform hover:scale-105">
                                    امضای دیجیتال و پایان
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <button onClick={onClose} className="px-6 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    خروج موقت
                </button>
                
                {transaction.currentStep <= 5 && (
                    <button
                        onClick={handleApproveStep}
                        disabled={!hasPermission || loadingAction === 'approve'}
                        className={`px-6 sm:px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${
                            hasPermission 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-none' 
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        {loadingAction === 'approve' ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'تایید و مرحله بعد'}
                        {!hasPermission && <span className="text-[10px] block hidden sm:block">(نیاز به {currentStep?.roleRequired.join('/')})</span>}
                    </button>
                )}
            </div>
        </div>
    );
};

const TransferPaksPage: React.FC = () => {
    const [currentRole, setCurrentRole] = useState<TransactionRole>('ADMIN');
    const [transactions, setTransactions] = useState<SecureTransaction[]>([
        {
            id: 'TP-140308001',
            type: 'USED',
            status: TransactionStatus.TECH_CHECK,
            carModel: 'KMC T8',
            sellerName: 'علی محمدی',
            buyerName: 'رضا کریمی',
            price: 1850000000,
            currentStep: 2,
            createdAt: '1403/08/15',
            steps: JSON.parse(JSON.stringify(INITIAL_STEPS_USED)),
        }
    ]);
    const [activeTransaction, setActiveTransaction] = useState<SecureTransaction | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const createNewTransaction = (type: TransactionType) => {
        const newTx: SecureTransaction = {
            id: `TP-${Math.floor(Math.random() * 1000000)}`,
            type,
            status: TransactionStatus.DRAFT,
            carModel: '',
            sellerName: '',
            buyerName: '',
            price: 0,
            currentStep: 1,
            createdAt: new Date().toLocaleDateString('fa-IR'),
            steps: JSON.parse(JSON.stringify(INITIAL_STEPS_USED)), 
        };
        setTransactions([newTx, ...transactions]);
        setActiveTransaction(newTx);
    };
    
    const handleUpdateTransaction = (updated: SecureTransaction) => {
        setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
        setActiveTransaction(updated);
        if (updated.status === TransactionStatus.COMPLETED) {
            setToast({ message: 'معامله با موفقیت تکمیل شد!', type: 'success' });
        }
    };

    return (
        <div className="pb-20">
             {/* Header */}
             <div className="bg-emerald-800 text-white p-6 rounded-b-[32px] shadow-lg mb-6 -mx-4 sm:-mx-6 lg:-mx-8 mt-[-2rem] pt-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <ShieldCheckIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black">معامله پاک</h1>
                        <p className="text-emerald-100 text-xs opacity-90">سامانه امن خرید و فروش خودرو</p>
                    </div>
                </div>
                <p className="text-sm opacity-80 leading-relaxed">
                    مسیر امن معامله خودرو با نظارت کارشناسان فنی، حقوقی و مالی.
                    تمام مراحل با استعلام رسمی و امضای دیجیتال انجام می‌شود.
                </p>
            </div>

            <div className="container mx-auto px-4">
                <RoleSelector currentRole={currentRole} setRole={setCurrentRole} />

                {/* Main Actions */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <button onClick={() => createNewTransaction('ZERO')} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-2 hover:scale-105 transition-transform group active:scale-95">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <CarIcon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">صفر (نقدی)</span>
                    </button>
                    <button onClick={() => createNewTransaction('USED')} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-2 hover:scale-105 transition-transform group active:scale-95">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <ShieldCheckIcon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">کارکرده</span>
                    </button>
                    <button onClick={() => createNewTransaction('HAVALEH')} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-2 hover:scale-105 transition-transform group active:scale-95">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <PlusIcon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">حواله</span>
                    </button>
                </div>

                {/* Ongoing Transactions */}
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                    معاملات در جریان
                </h3>
                
                {transactions.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300">
                        هیچ معامله‌ای یافت نشد.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map(tx => (
                            <TransactionCard 
                                key={tx.id} 
                                transaction={tx} 
                                onClick={() => setActiveTransaction(tx)} 
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Wizard Modal */}
            {activeTransaction && (
                <StepWizard 
                    transaction={activeTransaction} 
                    role={currentRole}
                    onUpdate={handleUpdateTransaction}
                    onClose={() => setActiveTransaction(null)} 
                />
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default TransferPaksPage;
