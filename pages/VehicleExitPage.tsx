
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon';
import { getUsers, carOrdersService } from '../services/api';
import type { User, CarOrder } from '../types';

// --- Types & Constants ---

const STEPS = [
    { id: 1, title: 'مشخصات خودرو' },
    { id: 2, title: 'اطلاعات مشتری' },
    { id: 3, title: 'وضعیت مالی' },
    { id: 4, title: 'وضعیت فروش' },
    { id: 5, title: 'کنترل کیفیت (PDS)' },
    { id: 6, title: 'تحویل نهایی' },
    { id: 7, title: 'تأیید مدیریت' },
    { id: 8, title: 'تأیید مشتری' },
];

// --- Print Components (Compact, A4 Optimized) ---

const PrintSectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="bg-slate-100 border border-slate-300 px-3 py-1 font-bold text-slate-800 text-sm mb-2 mt-4 rounded-sm print:bg-slate-100 print:text-black">
        {title}
    </div>
);

const PrintInputField: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = "" }) => (
    <div className={`flex items-center gap-2 mb-1 ${className}`}>
        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap min-w-fit">{label}:</span>
        <div className="flex-grow border-b border-dotted border-slate-400 px-2 py-0.5 text-sm font-mono text-slate-900 min-h-[24px]">
            {value}
        </div>
    </div>
);

const PrintCheckboxField: React.FC<{ label: string; checked: boolean }> = ({ label, checked }) => (
    <div className="flex items-center gap-2 mb-1">
        <div className={`w-4 h-4 border border-slate-400 rounded flex items-center justify-center ${checked ? 'bg-slate-800' : 'bg-white'}`}>
            {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </div>
        <span className="text-sm text-slate-800">{label}</span>
    </div>
);

const PrintSignatureBox: React.FC<{ label: string; title: string }> = ({ label, title }) => (
    <div className="mt-2 flex flex-col items-center justify-end h-24 border border-slate-300 rounded p-2 relative page-break-inside-avoid bg-white">
        <span className="absolute top-1 right-2 text-[10px] font-bold text-slate-500">{title}</span>
        <div className="w-full border-b border-slate-300 mb-4"></div>
        <span className="text-sm font-bold text-slate-800">{label}</span>
    </div>
);

// --- Wizard Components (User Friendly, Form Style) ---

const WizardInput: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string; type?: string }> = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div className="mb-4">
        <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-slate-800 bg-white"
        />
    </div>
);

const WizardCheckbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="w-5 h-5 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
        />
        <span className="text-slate-700 font-medium">{label}</span>
    </label>
);

const VehicleExitPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [viewMode, setViewMode] = useState<'WIZARD' | 'PRINT'>('WIZARD');

    // Form State
    const [formData, setFormData] = useState({
        // 1. Vehicle
        model: '', color: '', chassis: '', engine: '', plate: '',
        // 2. Customer
        customerName: '', nationalId: '', phone: '',
        // 3. Financial
        invoiceNumber: '', totalAmount: '', paidAmount: '', balance: '0', accountantName: '',
        // 4. Sales
        salesRepName: '',
        // 5. PDS
        bodyStatus: 'healthy', pdsNotes: '', pdsRepName: '',
        // 6. Delivery
        docsGreenLeaf: false, docsCard: false, docsInsurance: false, docsFuelCard: false, docsWarranty: false, docsOther: '', deliveryRepName: '',
        // 7. Manager
        managerName: '',
        // 8. Customer
        customerSignName: '',
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // CRM & Orders Integration
    const [crmUsers, setCrmUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<CarOrder[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{
        type: 'ORDER' | 'CRM';
        id: string;
        title: string;
        subtitle: string;
        data: any;
    }[]>([]);

    const fetchData = React.useCallback(() => {
        Promise.all([getUsers(), carOrdersService.getAll()])
            .then(([usersData, ordersData]) => {
                setCrmUsers(usersData || []);
                setOrders(ordersData || []);
            })
            .catch(err => {
                console.error("Error loading CRM or Orders data:", err);
            });
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const handleRefresh = () => {
            fetchData();
        };
        window.addEventListener('app-refresh', handleRefresh);
        return () => window.removeEventListener('app-refresh', handleRefresh);
    }, [fetchData]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        const normalizedQuery = query.toLowerCase();
        const results: typeof searchResults = [];

        // 1. Search in orders
        const filteredOrders = orders.filter(o => 
            (o.buyerName && o.buyerName.toLowerCase().includes(normalizedQuery)) ||
            (o.buyerPhone && o.buyerPhone.includes(query)) ||
            (o.carName && o.carName.toLowerCase().includes(normalizedQuery)) ||
            (o.trackingCode && o.trackingCode.toLowerCase().includes(normalizedQuery))
        );

        filteredOrders.slice(0, 10).forEach(o => {
            results.push({
                type: 'ORDER',
                id: `order-${o.id}`,
                title: `📦 سفارش: ${o.buyerName} - ${o.carName}`,
                subtitle: `کد رهگیری: ${o.trackingCode || o.id} | تماس: ${o.buyerPhone}`,
                data: o
            });
        });

        // 2. Search in CRM
        const filteredCrm = crmUsers.filter(u => 
            (u.FullName && u.FullName.toLowerCase().includes(normalizedQuery)) ||
            (u.Number && u.Number.includes(query)) ||
            (u.CarModel && u.CarModel.toLowerCase().includes(normalizedQuery))
        );

        filteredCrm.slice(0, 10).forEach(u => {
            results.push({
                type: 'CRM',
                id: `crm-${u.id}`,
                title: `👤 مشتری CRM: ${u.FullName}`,
                subtitle: `خودرو درخواستی: ${u.CarModel || 'نامشخص'} | تماس: ${u.Number}`,
                data: u
            });
        });

        setSearchResults(results);
    };

    const handleSelectResult = (item: typeof searchResults[0]) => {
        if (item.type === 'ORDER') {
            const o = item.data as CarOrder;
            setFormData(prev => ({
                ...prev,
                model: o.carName || prev.model,
                color: o.selectedColor || prev.color,
                customerName: o.buyerName || prev.customerName,
                nationalId: o.buyerNationalId || prev.nationalId,
                phone: o.buyerPhone || prev.phone,
                invoiceNumber: o.trackingCode || String(o.id) || prev.invoiceNumber,
                totalAmount: String(o.finalPrice || o.proposedPrice || ''),
                paidAmount: String(o.finalPrice || o.proposedPrice || ''),
                salesRepName: o.createdBy || prev.salesRepName,
                customerSignName: o.buyerName || prev.customerSignName,
            }));
        } else if (item.type === 'CRM') {
            const u = item.data as User;
            setFormData(prev => ({
                ...prev,
                customerName: u.FullName || prev.customerName,
                phone: u.Number || prev.phone,
                model: u.CarModel || prev.model,
                customerSignName: u.FullName || prev.customerSignName,
            }));
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    // Auto-match based on typed data
    const autoMatchInfo = useMemo(() => {
        // Match by phone number
        if (formData.phone && formData.phone.length >= 4) {
            // First check orders
            const matchedOrder = orders.find(o => o.buyerPhone && o.buyerPhone.includes(formData.phone));
            if (matchedOrder && (formData.customerName !== matchedOrder.buyerName || formData.model !== matchedOrder.carName)) {
                return { type: 'ORDER', data: matchedOrder, label: `سفارش جدید: ${matchedOrder.buyerName} (${matchedOrder.carName})` };
            }
            // Then check CRM
            const matchedCrm = crmUsers.find(u => u.Number && u.Number.includes(formData.phone));
            if (matchedCrm && formData.customerName !== matchedCrm.FullName) {
                return { type: 'CRM', data: matchedCrm, label: `مشتری CRM: ${matchedCrm.FullName}` };
            }
        }
        // Match by name
        if (formData.customerName && formData.customerName.length >= 3) {
            const matchedOrder = orders.find(o => o.buyerName && o.buyerName.toLowerCase().includes(formData.customerName.toLowerCase()));
            if (matchedOrder && (formData.phone !== matchedOrder.buyerPhone || formData.model !== matchedOrder.carName)) {
                return { type: 'ORDER', data: matchedOrder, label: `سفارش جدید: ${matchedOrder.buyerName} (${matchedOrder.carName})` };
            }
            const matchedCrm = crmUsers.find(u => u.FullName && u.FullName.toLowerCase().includes(formData.customerName.toLowerCase()));
            if (matchedCrm && formData.phone !== matchedCrm.Number) {
                return { type: 'CRM', data: matchedCrm, label: `مشتری CRM: ${matchedCrm.FullName}` };
            }
        }
        return null;
    }, [formData.phone, formData.customerName, orders, crmUsers]);

    const handleApplyAutoMatch = () => {
        if (!autoMatchInfo) return;
        if (autoMatchInfo.type === 'ORDER') {
            const o = autoMatchInfo.data as CarOrder;
            setFormData(prev => ({
                ...prev,
                model: o.carName || prev.model,
                color: o.selectedColor || prev.color,
                customerName: o.buyerName || prev.customerName,
                nationalId: o.buyerNationalId || prev.nationalId,
                phone: o.buyerPhone || prev.phone,
                invoiceNumber: o.trackingCode || String(o.id) || prev.invoiceNumber,
                totalAmount: String(o.finalPrice || o.proposedPrice || ''),
                paidAmount: String(o.finalPrice || o.proposedPrice || ''),
                salesRepName: o.createdBy || prev.salesRepName,
                customerSignName: o.buyerName || prev.customerSignName,
            }));
        } else {
            const u = autoMatchInfo.data as User;
            setFormData(prev => ({
                ...prev,
                customerName: u.FullName || prev.customerName,
                phone: u.Number || prev.phone,
                model: u.CarModel || prev.model,
                customerSignName: u.FullName || prev.customerSignName,
            }));
        }
    };

    const handleNext = () => {
        if (step < 8) setStep(step + 1);
        else setViewMode('PRINT');
    };

    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
    };

    const handlePrint = () => {
        window.print();
    };

    // --- Render Wizard Step Content ---
    const renderWizardStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        {/* CRM & Order Search Section */}
                        <div className="bg-sky-50 dark:bg-sky-950/20 p-4 rounded-xl border border-sky-100 dark:border-sky-900/40 relative">
                            <div className="flex items-center gap-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-600 dark:text-sky-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200">جستجوی مشتری یا سفارش جهت تکمیل خودکار اطلاعات</span>
                            </div>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="نام مشتری، تلفن، مدل خودرو، یا کد رهگیری..."
                                    className="w-full px-4 py-2.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-sky-200 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                                    value={searchQuery}
                                    onChange={e => handleSearch(e.target.value)}
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl max-h-48 overflow-y-auto z-50 text-[11px] font-bold divide-y divide-slate-100 dark:divide-slate-700">
                                        {searchResults.map(res => (
                                            <button 
                                                key={res.id}
                                                type="button" 
                                                onClick={() => handleSelectResult(res)}
                                                className="w-full text-right px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/30 flex justify-between items-center transition-colors text-slate-700 dark:text-slate-300"
                                            >
                                                <div className="flex flex-col items-start gap-0.5">
                                                    <span className="font-extrabold">{res.title}</span>
                                                    <span className="text-[10px] text-slate-400 font-normal font-mono">{res.subtitle}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Smart Suggestion banner if matching CRM contact has been found */}
                        {autoMatchInfo && (
                            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 text-xs flex justify-between items-center text-slate-700 dark:text-slate-300 animate-pulse">
                                <div className="flex items-center gap-2 font-bold font-sans">
                                    <span className="text-amber-500">💡</span>
                                    <span>پرونده منطبق یافت شد: <span className="text-sky-600 dark:text-sky-400 font-extrabold">{autoMatchInfo.label}</span></span>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleApplyAutoMatch}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-black transition-colors"
                                >
                                    تکمیل هوشمند اطلاعات
                                </button>
                            </div>
                        )}

                        <WizardInput label="مدل خودرو" value={formData.model} onChange={(v) => handleChange('model', v)} placeholder="مثال: KMC T8" />
                        <WizardInput label="رنگ خودرو" value={formData.color} onChange={(v) => handleChange('color', v)} placeholder="مثال: سفید" />
                        <WizardInput label="شماره شاسی" value={formData.chassis} onChange={(v) => handleChange('chassis', v)} />
                        <WizardInput label="شماره موتور" value={formData.engine} onChange={(v) => handleChange('engine', v)} />
                        <WizardInput label="شماره پلاک (در صورت نصب)" value={formData.plate} onChange={(v) => handleChange('plate', v)} placeholder="مثال: ۱۱ ایران ۲۲۲ ب ۳۳" />
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        {/* CRM & Order Search Section */}
                        <div className="bg-sky-50 dark:bg-sky-950/20 p-4 rounded-xl border border-sky-100 dark:border-sky-900/40 relative">
                            <div className="flex items-center gap-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-600 dark:text-sky-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200">جستجوی مشتری یا سفارش جهت تکمیل خودکار اطلاعات مشتری</span>
                            </div>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="نام مشتری، تلفن، مدل خودرو، یا کد رهگیری..."
                                    className="w-full px-4 py-2.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-sky-200 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                                    value={searchQuery}
                                    onChange={e => handleSearch(e.target.value)}
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl max-h-48 overflow-y-auto z-50 text-[11px] font-bold divide-y divide-slate-100 dark:divide-slate-700">
                                        {searchResults.map(res => (
                                            <button 
                                                key={res.id}
                                                type="button" 
                                                onClick={() => handleSelectResult(res)}
                                                className="w-full text-right px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/30 flex justify-between items-center transition-colors text-slate-700 dark:text-slate-300"
                                            >
                                                <div className="flex flex-col items-start gap-0.5">
                                                    <span className="font-extrabold">{res.title}</span>
                                                    <span className="text-[10px] text-slate-400 font-normal font-mono">{res.subtitle}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Smart Suggestion banner if matching CRM contact has been found */}
                        {autoMatchInfo && (
                            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 text-xs flex justify-between items-center text-slate-700 dark:text-slate-300 animate-pulse">
                                <div className="flex items-center gap-2 font-bold font-sans">
                                    <span className="text-amber-500">💡</span>
                                    <span>پرونده منطبق یافت شد: <span className="text-sky-600 dark:text-sky-400 font-extrabold">{autoMatchInfo.label}</span></span>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleApplyAutoMatch}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-black transition-colors"
                                >
                                    تکمیل هوشمند اطلاعات
                                </button>
                            </div>
                        )}

                        <WizardInput label="نام و نام خانوادگی مشتری" value={formData.customerName} onChange={(v) => handleChange('customerName', v)} />
                        <WizardInput label="کد ملی" value={formData.nationalId} onChange={(v) => handleChange('nationalId', v)} type="number" />
                        <WizardInput label="شماره تماس" value={formData.phone} onChange={(v) => handleChange('phone', v)} type="tel" />
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-1">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 text-sm text-amber-800 leading-relaxed">
                            <strong>توجه حسابداری:</strong> خروج خودرو تنها در صورت تسویه کامل یا تعیین تکلیف چک‌های معوق مجاز است.
                        </div>
                        <WizardInput label="شماره فاکتور" value={formData.invoiceNumber} onChange={(v) => handleChange('invoiceNumber', v)} />
                        <WizardInput label="مبلغ کل فاکتور" value={formData.totalAmount} onChange={(v) => handleChange('totalAmount', v)} type="number" />
                        <WizardInput label="مبلغ واریزی" value={formData.paidAmount} onChange={(v) => handleChange('paidAmount', v)} type="number" />
                        <WizardInput label="مانده حساب" value={formData.balance} onChange={(v) => handleChange('balance', v)} type="number" />
                        <WizardInput label="نام مسئول حسابداری" value={formData.accountantName} onChange={(v) => handleChange('accountantName', v)} />
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-1">
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 text-sm text-blue-800">
                             تأیید صحت اطلاعات مشتری و تحویل مدارک فروش.
                        </div>
                        <WizardInput label="نام مسئول فروش" value={formData.salesRepName} onChange={(v) => handleChange('salesRepName', v)} />
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700">وضعیت بدنه و فنی</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleChange('bodyStatus', 'healthy')}
                                className={`p-4 rounded-xl border-2 transition-all ${formData.bodyStatus === 'healthy' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <span className="block font-bold mb-1">✅ سالم</span>
                                <span className="text-xs opacity-75">بدون ایراد ظاهری</span>
                            </button>
                            <button
                                onClick={() => handleChange('bodyStatus', 'damaged')}
                                className={`p-4 rounded-xl border-2 transition-all ${formData.bodyStatus === 'damaged' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <span className="block font-bold mb-1">⚠️ دارای آسیب</span>
                                <span className="text-xs opacity-75">ثبت در توضیحات</span>
                            </button>
                        </div>
                        <WizardInput label="توضیحات فنی / ایرادات" value={formData.pdsNotes} onChange={(v) => handleChange('pdsNotes', v)} placeholder="در صورت وجود خط و خش یا ایراد بنویسید..." />
                        <WizardInput label="نام مسئول PDS" value={formData.pdsRepName} onChange={(v) => handleChange('pdsRepName', v)} />
                    </div>
                );
            case 6:
                return (
                    <div className="space-y-4">
                         <label className="block text-sm font-bold text-slate-700 mb-2">مدارک تحویل داده شده</label>
                        <div className="grid grid-cols-2 gap-3">
                            <WizardCheckbox label="برگ سبز" checked={formData.docsGreenLeaf} onChange={(v) => handleChange('docsGreenLeaf', v)} />
                            <WizardCheckbox label="کارت خودرو" checked={formData.docsCard} onChange={(v) => handleChange('docsCard', v)} />
                            <WizardCheckbox label="بیمه‌نامه" checked={formData.docsInsurance} onChange={(v) => handleChange('docsInsurance', v)} />
                            <WizardCheckbox label="کارت سوخت" checked={formData.docsFuelCard} onChange={(v) => handleChange('docsFuelCard', v)} />
                            <WizardCheckbox label="دفترچه گارانتی" checked={formData.docsWarranty} onChange={(v) => handleChange('docsWarranty', v)} />
                        </div>
                        <WizardInput label="سایر مدارک" value={formData.docsOther} onChange={(v) => handleChange('docsOther', v)} />
                        <WizardInput label="نام کارشناس تحویل" value={formData.deliveryRepName} onChange={(v) => handleChange('deliveryRepName', v)} />
                    </div>
                );
            case 7:
                return (
                    <div className="space-y-1">
                         <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl mb-6 text-sm text-purple-800">
                             تأیید نهایی خروج خودرو توسط مدیریت یا مسئول شیفت.
                        </div>
                        <WizardInput label="نام مدیر / مسئول شیفت" value={formData.managerName} onChange={(v) => handleChange('managerName', v)} />
                    </div>
                );
            case 8:
                return (
                    <div className="space-y-1">
                         <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl mb-6 text-sm text-slate-700 leading-relaxed text-justify">
                            اینجانب کلیه مدارک، خودرو، وضعیت ظاهری، توضیحات فروش و خدمات پس از فروش را دریافت کرده‌ام و هیچ ادعای مالی یا شکایتی در زمان تحویل ندارم.
                        </div>
                        <WizardInput label="نام و نام خانوادگی مشتری (جهت امضا)" value={formData.customerSignName} onChange={(v) => handleChange('customerSignName', v)} />
                    </div>
                );
            default:
                return null;
        }
    };

    // --- MAIN RENDER ---

    if (viewMode === 'WIZARD') {
        return (
            <div className="min-h-full flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-slate-400">مرحله {step} از 8</span>
                            <span className="text-xs font-bold text-sky-600">{Math.round((step / 8) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-sky-500 h-full transition-all duration-500 ease-out" style={{ width: `${(step / 8) * 100}%` }}></div>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-6">{STEPS[step - 1].title}</h2>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex-grow">
                        {renderWizardStep()}
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <button
                            onClick={handlePrev}
                            disabled={step === 1}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                        >
                            قبلی
                        </button>
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-sky-200 dark:shadow-none transition-all active:scale-95"
                        >
                            {step === 8 ? 'مشاهده و چاپ' : 'مرحله بعد'}
                            {step < 8 && <ArrowRightIcon className="w-5 h-5 rotate-180" />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- PRINT VIEW ---
    return (
        <div className="w-full h-full flex flex-col items-center bg-slate-100 dark:bg-slate-900 min-h-screen">
            {/* Toolbar - Hidden in Print */}
            <div className="w-full max-w-[210mm] py-6 px-4 flex justify-between items-center print:hidden">
                <button 
                    onClick={() => setViewMode('WIZARD')}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-sky-600 font-bold bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm"
                >
                    <ArrowRightIcon className="w-5 h-5" />
                    بازگشت به ویرایش
                </button>
                <button 
                    onClick={handlePrint} 
                    className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-xl shadow-md hover:bg-sky-700 transition-colors font-bold"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    چاپ فرم
                </button>
            </div>

            {/* A4 Paper */}
            <div id="printable-form" className="bg-white text-black w-full max-w-[210mm] p-[15mm] shadow-xl print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 mx-auto mb-10">
                
                {/* Header Logo/Title */}
                <div className="text-center border-b-4 border-slate-800 pb-4 mb-4">
                    <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">نمایندگی حسین‌خودرو شیراز</h1>
                    <h2 className="text-xl font-bold text-slate-700 bg-slate-100 inline-block px-4 py-1 rounded">فرم خروج خودرو / سند تحویل نهایی</h2>
                    <p className="text-xs text-slate-600 mt-3 text-justify leading-relaxed px-4 font-medium">
                        این سند مطابق مقررات داخلی نمایندگی و الزامات قانونی تنظیم شده و هرگونه خروج خودرو از محوطه بدون تکمیل و امضای این فرم <span className="font-bold underline text-red-600 print:text-black">ممنوع</span> است.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {/* 1. Vehicle Info */}
                    <div className="col-span-1">
                        <PrintSectionHeader title="۱) مشخصات خودرو" />
                        <div className="pl-2">
                            <PrintInputField label="مدل" value={formData.model} />
                            <PrintInputField label="رنگ" value={formData.color} />
                            <PrintInputField label="شاسی" value={formData.chassis} className="font-mono" />
                            <PrintInputField label="موتور" value={formData.engine} className="font-mono" />
                            <PrintInputField label="پلاک" value={formData.plate} />
                        </div>
                    </div>

                    {/* 2. Customer Info */}
                    <div className="col-span-1">
                        <PrintSectionHeader title="۲) اطلاعات مشتری" />
                        <div className="pl-2">
                            <PrintInputField label="نام کامل" value={formData.customerName} />
                            <PrintInputField label="کد ملی" value={formData.nationalId} className="font-mono" />
                            <PrintInputField label="تماس" value={formData.phone} className="font-mono" />
                        </div>
                    </div>

                    {/* 3. Accounting */}
                    <div className="col-span-2">
                        <PrintSectionHeader title="۳) وضعیت مالی (تایید حسابداری)" />
                        <div className="grid grid-cols-4 gap-4 mb-2">
                            <PrintInputField label="فاکتور" value={formData.invoiceNumber} />
                            <PrintInputField label="مبلغ کل" value={formData.totalAmount} />
                            <PrintInputField label="واریزی" value={formData.paidAmount} />
                            <PrintInputField label="مانده" value={formData.balance} />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <PrintInputField label="نام حسابدار" value={formData.accountantName} />
                            <PrintSignatureBox label="امضا و مهر حسابداری" title="تایید مالی" />
                        </div>
                    </div>

                    {/* 4. Sales */}
                    <div className="col-span-1">
                        <PrintSectionHeader title="۴) وضعیت فروش" />
                        <PrintInputField label="مسئول فروش" value={formData.salesRepName} />
                        <PrintSignatureBox label="امضا مسئول فروش" title="تایید فروش" />
                    </div>

                    {/* 5. PDS */}
                    <div className="col-span-1">
                        <PrintSectionHeader title="۵) کنترل کیفیت / PDS" />
                        <div className="flex gap-4 mb-2 text-sm border-b border-dotted pb-1">
                            <span>وضعیت بدنه:</span>
                            <span className={formData.bodyStatus === 'healthy' ? 'font-bold' : ''}>[ {formData.bodyStatus === 'healthy' ? 'X' : ' '} ] سالم</span>
                            <span className={formData.bodyStatus === 'damaged' ? 'font-bold' : ''}>[ {formData.bodyStatus === 'damaged' ? 'X' : ' '} ] آسیب</span>
                        </div>
                        <PrintInputField label="توضیحات" value={formData.pdsNotes} />
                        <PrintInputField label="مسئول PDS" value={formData.pdsRepName} />
                        <PrintSignatureBox label="امضا مسئول PDS" title="تایید فنی" />
                    </div>

                    {/* 6. Delivery */}
                    <div className="col-span-2">
                        <PrintSectionHeader title="۶) تحویل نهایی (مدارک و تجهیزات)" />
                        <div className="grid grid-cols-6 gap-2 mb-2">
                            <PrintCheckboxField label="برگ سبز" checked={formData.docsGreenLeaf} />
                            <PrintCheckboxField label="کارت" checked={formData.docsCard} />
                            <PrintCheckboxField label="بیمه" checked={formData.docsInsurance} />
                            <PrintCheckboxField label="سوخت" checked={formData.docsFuelCard} />
                            <PrintCheckboxField label="گارانتی" checked={formData.docsWarranty} />
                            <div className="text-xs">{formData.docsOther}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                             <PrintInputField label="کارشناس تحویل" value={formData.deliveryRepName} />
                             <PrintSignatureBox label="امضا کارشناس تحویل" title="تایید تحویل" />
                        </div>
                    </div>

                    {/* 7. Management */}
                    <div className="col-span-1">
                        <PrintSectionHeader title="۷) تأیید مدیریت" />
                        <PrintInputField label="نام مدیر" value={formData.managerName} />
                        <PrintSignatureBox label="امضا و مهر مدیریت" title="مجوز خروج" />
                    </div>

                    {/* 8. Customer */}
                    <div className="col-span-1">
                        <PrintSectionHeader title="۸) تأیید مشتری" />
                        <div className="text-[10px] text-slate-600 mb-1 text-justify leading-tight">
                            اینجانب {formData.customerName || '..........'} تمام موارد فوق را تحویل گرفته و هیچ ادعایی ندارم.
                        </div>
                        <PrintSignatureBox label="امضا و اثر انگشت" title="تایید نهایی" />
                    </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono print:block hidden">
                     AutoLead System - {new Date().toLocaleDateString('fa-IR')}
                </div>
            </div>
            
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body * { visibility: hidden; }
                    #printable-form, #printable-form * { visibility: visible; }
                    #printable-form {
                        position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 10mm;
                    }
                    .page-break-inside-avoid { page-break-inside: avoid; }
                }
            `}</style>
        </div>
    );
};

export default VehicleExitPage;
