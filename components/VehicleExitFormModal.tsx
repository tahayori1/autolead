
import React, { useState, useEffect } from 'react';
import type { DeliveryProcess } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface VehicleExitFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    delivery: DeliveryProcess | null;
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="bg-slate-100 border border-slate-300 px-3 py-1.5 font-bold text-slate-800 text-sm mb-3 mt-4 rounded-sm print:bg-slate-100 print:text-black">
        {title}
    </div>
);

const InputField: React.FC<{ label: string; value: string; onChange?: (val: string) => void; placeholder?: string; className?: string }> = ({ label, value, onChange, placeholder, className = "" }) => (
    <div className={`flex items-center gap-2 mb-2 ${className}`}>
        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{label}:</span>
        <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-grow border-b border-dotted border-slate-400 focus:border-sky-500 outline-none px-2 py-0.5 text-sm bg-transparent font-mono text-slate-900 print:placeholder-transparent"
        />
    </div>
);

const CheckboxField: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer mb-1 print:cursor-default">
        <input 
            type="checkbox" 
            checked={checked} 
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-slate-500"
        />
        <span className="text-sm text-slate-800">{label}</span>
    </label>
);

const SignatureBox: React.FC<{ label: string; title: string }> = ({ label, title }) => (
    <div className="mt-4 flex flex-col items-center justify-end h-24 border border-slate-300 rounded p-2 relative page-break-inside-avoid">
        <span className="absolute top-2 right-2 text-xs font-bold text-slate-500">{title}</span>
        <div className="w-full border-b border-slate-300 mb-6"></div>
        <span className="text-sm font-bold text-slate-800">{label}</span>
    </div>
);

const VehicleExitFormModal: React.FC<VehicleExitFormModalProps> = ({ isOpen, onClose, delivery }) => {
    // Form State
    const [formData, setFormData] = useState({
        // 1. Vehicle
        model: '',
        color: '',
        chassis: '',
        engine: '',
        plate: '',
        // 2. Customer
        customerName: '',
        nationalId: '',
        phone: '',
        // 3. Financial
        invoiceNumber: '',
        totalAmount: '',
        paidAmount: '',
        balance: '0',
        accountantName: '',
        // 4. Sales
        salesRepName: '',
        // 5. PDS
        bodyStatus: 'healthy', // healthy, damaged
        pdsNotes: '',
        pdsRepName: '',
        // 6. Delivery
        docsGreenLeaf: false,
        docsCard: false,
        docsInsurance: false,
        docsFuelCard: false,
        docsWarranty: false,
        docsOther: '',
        deliveryRepName: '',
        // 7. Manager
        managerName: '',
        // 8. Customer
        customerSignName: '',
    });

    useEffect(() => {
        if (delivery) {
            setFormData(prev => ({
                ...prev,
                model: delivery.carModel || '',
                chassis: delivery.chassisNumber || '',
                customerName: delivery.customerName || '',
                customerSignName: delivery.customerName || '',
            }));
        }
    }, [delivery, isOpen]);

    if (!isOpen || !delivery) return null;

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 print:p-0 print:bg-white print:static print:block">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col print:shadow-none print:max-h-none print:w-full print:max-w-none">
                
                {/* Modal Header - Hidden in Print */}
                <header className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-lg print:hidden">
                    <h2 className="text-lg font-bold text-slate-800">فرم خروج خودرو / سند تحویل نهایی</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            چاپ فرم
                        </button>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 px-2">
                            <CloseIcon />
                        </button>
                    </div>
                </header>

                {/* Printable Content */}
                <main id="printable-form" className="flex-grow overflow-y-auto p-8 print:p-0 print:overflow-visible">
                    
                    {/* Header Logo/Title */}
                    <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
                        <h1 className="text-2xl font-black text-slate-900 mb-2">حسینی خودرو شیراز</h1>
                        <h2 className="text-lg font-bold text-slate-700">فرم خروج خودرو / سند تحویل نهایی</h2>
                        <p className="text-xs text-slate-500 mt-2 text-justify px-4">
                            این سند مطابق مقررات داخلی نمایندگی و الزامات قانونی تنظیم شده و هرگونه خروج خودرو از محوطه بدون تکمیل و امضای این فرم «ممنوع» است. تمامی امضاکنندگان، مسئول صحت اطلاعات مرتبط با واحد خود هستند.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        {/* 1. Vehicle Info */}
                        <div className="col-span-full md:col-span-1">
                            <SectionHeader title="۱) مشخصات خودرو" />
                            <div className="pl-4">
                                <InputField label="مدل" value={formData.model} onChange={(v) => handleChange('model', v)} />
                                <InputField label="رنگ" value={formData.color} onChange={(v) => handleChange('color', v)} />
                                <InputField label="شماره شاسی" value={formData.chassis} onChange={(v) => handleChange('chassis', v)} className="font-mono" />
                                <InputField label="شماره موتور" value={formData.engine} onChange={(v) => handleChange('engine', v)} className="font-mono" />
                                <InputField label="شماره پلاک" value={formData.plate} onChange={(v) => handleChange('plate', v)} placeholder="(در صورت نصب)" />
                            </div>
                        </div>

                        {/* 2. Customer Info */}
                        <div className="col-span-full md:col-span-1">
                            <SectionHeader title="۲) اطلاعات مشتری" />
                            <div className="pl-4">
                                <InputField label="نام و نام خانوادگی" value={formData.customerName} onChange={(v) => handleChange('customerName', v)} />
                                <InputField label="کد ملی" value={formData.nationalId} onChange={(v) => handleChange('nationalId', v)} className="font-mono" />
                                <InputField label="شماره تماس" value={formData.phone} onChange={(v) => handleChange('phone', v)} className="font-mono" />
                            </div>
                        </div>

                        {/* 3. Accounting */}
                        <div className="col-span-full">
                            <SectionHeader title="۳) کنترل وضعیت مالی – (مسئولیت کامل با حسابداری)" />
                            <div className="text-xs text-slate-600 mb-3 leading-relaxed bg-slate-50 p-2 rounded print:bg-transparent print:p-0">
                                با امضا و مهر این بخش، حسابداری تأیید می‌کند:
                                <ul className="list-disc list-inside mt-1 space-y-0.5">
                                    <li>هیچ‌گونه بدهی، چک معوق، مانده حساب یا تعهد پرداخت باقی نمانده است.</li>
                                    <li>کلیه مبالغ واریزی مشتری با فاکتور و سیستم مالی تطبیق داده شده است.</li>
                                    <li>خروج خودرو از نظر مالی بلامانع است.</li>
                                </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="شماره فاکتور" value={formData.invoiceNumber} onChange={(v) => handleChange('invoiceNumber', v)} />
                                <InputField label="مبلغ کل" value={formData.totalAmount} onChange={(v) => handleChange('totalAmount', v)} />
                                <InputField label="مبلغ واریزی" value={formData.paidAmount} onChange={(v) => handleChange('paidAmount', v)} />
                                <InputField label="مانده حساب" value={formData.balance} onChange={(v) => handleChange('balance', v)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <InputField label="نام مسئول حسابداری" value={formData.accountantName} onChange={(v) => handleChange('accountantName', v)} />
                                <SignatureBox label="امضا و مهر حسابداری" title="تایید مالی" />
                            </div>
                        </div>

                        {/* 4. Sales */}
                        <div className="col-span-full md:col-span-1">
                            <SectionHeader title="۴) کنترل وضعیت فروش" />
                            <div className="text-xs text-slate-600 mb-2">
                                مسئول فروش تأیید می‌کند: صحت اطلاعات مشتری، کنترل مبالغ و تخفیف‌ها، تحویل مدارک فروش و ارائه توضیحات پشتیبانی.
                            </div>
                            <InputField label="نام مسئول فروش" value={formData.salesRepName} onChange={(v) => handleChange('salesRepName', v)} />
                            <SignatureBox label="امضا مسئول فروش" title="تایید فروش" />
                        </div>

                        {/* 5. PDS */}
                        <div className="col-span-full md:col-span-1">
                            <SectionHeader title="۵) کنترل کیفیت / PDS" />
                            <div className="text-xs text-slate-600 mb-2">
                                بررسی ظاهری، فنی و تجهیزاتی انجام شد و برگه PDS بایگانی گردید.
                            </div>
                            <div className="flex gap-4 mb-2">
                                <label className="flex items-center gap-1"><input type="radio" checked={formData.bodyStatus === 'healthy'} onChange={() => handleChange('bodyStatus', 'healthy')} /> <span className="text-sm">بدنه سالم</span></label>
                                <label className="flex items-center gap-1"><input type="radio" checked={formData.bodyStatus === 'damaged'} onChange={() => handleChange('bodyStatus', 'damaged')} /> <span className="text-sm">دارای آسیب (توضیحات)</span></label>
                            </div>
                            <InputField label="توضیحات" value={formData.pdsNotes} onChange={(v) => handleChange('pdsNotes', v)} />
                            <InputField label="نام مسئول PDS" value={formData.pdsRepName} onChange={(v) => handleChange('pdsRepName', v)} />
                            <SignatureBox label="امضا مسئول PDS" title="تایید فنی" />
                        </div>

                        {/* 6. Delivery */}
                        <div className="col-span-full">
                            <SectionHeader title="۶) تحویل نهایی به مشتری – (مسئولیت کامل با کارشناس تحویل)" />
                            <div className="text-xs text-slate-600 mb-2">
                                کارشناس تحویل تأیید می‌کند: هویت خریدار کنترل شد و مدارک زیر تحویل گردید:
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <CheckboxField label="برگ سبز" checked={formData.docsGreenLeaf} onChange={(v) => handleChange('docsGreenLeaf', v)} />
                                <CheckboxField label="کارت خودرو" checked={formData.docsCard} onChange={(v) => handleChange('docsCard', v)} />
                                <CheckboxField label="بیمه‌نامه" checked={formData.docsInsurance} onChange={(v) => handleChange('docsInsurance', v)} />
                                <CheckboxField label="کارت سوخت" checked={formData.docsFuelCard} onChange={(v) => handleChange('docsFuelCard', v)} />
                                <CheckboxField label="دفترچه گارانتی" checked={formData.docsWarranty} onChange={(v) => handleChange('docsWarranty', v)} />
                                <InputField label="سایر" value={formData.docsOther} onChange={(v) => handleChange('docsOther', v)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="نام کارشناس تحویل" value={formData.deliveryRepName} onChange={(v) => handleChange('deliveryRepName', v)} />
                                <SignatureBox label="امضا کارشناس تحویل" title="تایید تحویل" />
                            </div>
                        </div>

                        {/* 7. Management */}
                        <div className="col-span-full md:col-span-1">
                            <SectionHeader title="۷) تأیید نهایی مدیریت / مسئول شیفت" />
                            <div className="text-xs text-slate-600 mb-2">
                                تأیید نهایی کنترل تمام امضاها و مجوز خروج خودرو.
                            </div>
                            <InputField label="نام مدیر/مسئول" value={formData.managerName} onChange={(v) => handleChange('managerName', v)} />
                            <SignatureBox label="امضا و مهر مدیریت" title="مجوز خروج" />
                        </div>

                        {/* 8. Customer */}
                        <div className="col-span-full md:col-span-1">
                            <SectionHeader title="۸) تأیید نهایی مشتری" />
                            <div className="text-xs text-slate-600 mb-2 text-justify">
                                اینجانب کلیه مدارک، خودرو، وضعیت ظاهری، توضیحات فروش و خدمات پس از فروش را دریافت کرده‌ام.
                                هیچ ادعای مالی یا شکایتی در زمان تحویل ندارم.
                            </div>
                            <InputField label="نام مشتری" value={formData.customerSignName} onChange={(v) => handleChange('customerSignName', v)} />
                            <SignatureBox label="امضا و اثر انگشت مشتری" title="تایید مشتری" />
                        </div>
                    </div>

                    <div className="mt-6 text-center text-[10px] text-slate-400 font-mono print:block hidden">
                         سیستم مدیریت مشتریان AutoLead - چاپ شده در {new Date().toLocaleDateString('fa-IR')}
                    </div>
                </main>
            </div>
            
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-form, #printable-form * {
                        visibility: visible;
                    }
                    #printable-form {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 20px;
                        background: white;
                    }
                    .page-break-inside-avoid {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
};

export default VehicleExitFormModal;
