import React, { useState } from 'react';
import type {
    LeasingCase,
    LeasingCheckRow,
    LeasingFormId,
    LeasingPeaceParty,
    LeasingPersonInfo
} from '../../types/leasing';
import {
    buildAutoCheckSchedule,
    buildFullAddressLine,
    createEmptyPeaceParty,
    getPersonFullName,
    personToPeaceParty,
    addMonthsToPersianDate
} from '../../services/leasingService';
import {
    formatCurrencyWithCommas,
    getAmountDisplaySummary,
    toEnglishDigits,
    toPersianDigits,
    validateIranianMobile,
    validateIranianNationalCode,
    validateIranianPostalCode
} from '../../services/bankLetterValidation';
import {
    Car,
    Calculator,
    User,
    Users,
    FileSignature,
    ShieldCheck,
    Plus,
    Trash2,
    Copy,
    Wand2,
    Building2,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    CloudUpload
} from 'lucide-react';
import { DocumentUploadsPanel } from '../common/DocumentUploadsPanel';
import { IdentityQuickAutoFillBar } from '../common/IdentityQuickAutoFillBar';
import { applyExtractedIdentityToLeasingPerson } from '../../services/documentAutoFillService';
import type { ExtractedIdentityDocumentData } from '../../types/uploads';

export type LeasingEditorTab =
    | 'buyer'
    | 'contract'
    | 'finance'
    | 'guarantors'
    | 'affidavit_peace'
    | 'plate_mortgage'
    | 'uploads';

interface LeasingCaseEditorProps {
    leasingCase: LeasingCase;
    onChange: (updater: (prev: LeasingCase) => LeasingCase) => void;
    activeForm: LeasingFormId;
}

const CAR_MODELS_QUICK = [
    'KMC J7',
    'KMC Eagle',
    'KMC T8',
    'KMC T9',
    'KMC X5',
    'KMC A5',
    'KMC SR3',
    'BAC X3 pro',
    'JAC J4',
    'JAC S3'
];

const COLORS_QUICK = ['سفید', 'مشکی', 'خاکستری', 'سرمه‌ای', 'نوک مدادی', 'نقره‌ای'];

const inputCls =
    'w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all';
const labelCls = 'block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1';

interface PersonFieldsProps {
    person: LeasingPersonInfo;
    onUpdate: (next: LeasingPersonInfo) => void;
    roleTitle: string;
    onCopyAddressFromBuyer?: () => void;
    autoFillConfig?: {
        scopeId: string;
        roleLabel: string;
        onAutoFill: (extracted: ExtractedIdentityDocumentData) => string[];
    };
}

const PersonIdentityAndAddressFields: React.FC<PersonFieldsProps> = ({
    person,
    onUpdate,
    roleTitle,
    onCopyAddressFromBuyer,
    autoFillConfig
}) => {
    const ncCheck = person.nationalCode ? validateIranianNationalCode(person.nationalCode) : null;
    const postalCheck = person.address.postalCode ? validateIranianPostalCode(person.address.postalCode) : null;
    const mobileCheck = person.address.mobilePhone ? validateIranianMobile(person.address.mobilePhone) : null;

    const updateField = <K extends keyof LeasingPersonInfo>(key: K, val: LeasingPersonInfo[K]) => {
        onUpdate({ ...person, [key]: val });
    };

    const updateAddr = <K extends keyof LeasingPersonInfo['address']>(
        key: K,
        val: LeasingPersonInfo['address'][K]
    ) => {
        onUpdate({
            ...person,
            address: {
                ...person.address,
                [key]: val
            }
        });
    };

    const autoAddressPreview = buildFullAddressLine({ ...person.address, fullAddressText: '' });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-sky-600" />
                    <span>{roleTitle}</span>
                    {getPersonFullName(person) && (
                        <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-[11px]">
                            {person.title} {getPersonFullName(person)}
                        </span>
                    )}
                </h4>
                {onCopyAddressFromBuyer && (
                    <button
                        type="button"
                        onClick={onCopyAddressFromBuyer}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی استان و نشانی از خریدار</span>
                    </button>
                )}
            </div>

            {autoFillConfig && (
                <IdentityQuickAutoFillBar
                    scopeType="LEASING"
                    scopeId={autoFillConfig.scopeId}
                    roleLabel={autoFillConfig.roleLabel}
                    nationalCode={person.nationalCode}
                    customerName={getPersonFullName(person)}
                    phone={person.address.mobilePhone}
                    onAutoFill={(extracted) => autoFillConfig.onAutoFill(extracted)}
                />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                    <label className={labelCls}>عنوان</label>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {(['آقای', 'خانم'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => updateField('title', t)}
                                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    person.title === t
                                        ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-white shadow-xs'
                                        : 'text-slate-500'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className={labelCls}>نام</label>
                    <input type="text" value={person.firstName} onChange={(e) => updateField('firstName', e.target.value)} placeholder="مثلاً: علی" className={inputCls} />
                </div>

                <div>
                    <label className={labelCls}>نام خانوادگی</label>
                    <input type="text" value={person.lastName} onChange={(e) => updateField('lastName', e.target.value)} placeholder="مثلاً: رضایی" className={inputCls} />
                </div>

                <div>
                    <label className={labelCls}>نام پدر</label>
                    <input type="text" value={person.fatherName} onChange={(e) => updateField('fatherName', e.target.value)} placeholder="مثلاً: محمد" className={inputCls} />
                </div>

                <div>
                    <label className={labelCls}>کد ملی (۱۰ رقمی)</label>
                    <input
                        type="text"
                        dir="ltr"
                        maxLength={10}
                        value={person.nationalCode}
                        onChange={(e) => updateField('nationalCode', toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                        placeholder="2290000000"
                        className={inputCls}
                    />
                    {ncCheck && (
                        <div className={`mt-1 text-[10px] flex items-center gap-1 ${ncCheck.isValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {ncCheck.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            <span>{ncCheck.isValid ? 'کد ملی معتبر' : ncCheck.errorMessage}</span>
                        </div>
                    )}
                </div>

                <div>
                    <label className={labelCls}>شماره شناسنامه</label>
                    <input type="text" dir="ltr" value={person.idNumber} onChange={(e) => updateField('idNumber', toEnglishDigits(e.target.value))} placeholder="شماره شناسنامه" className={inputCls} />
                </div>

                <div>
                    <label className={labelCls}>تاریخ تولد (شمسی)</label>
                    <input type="text" dir="ltr" value={person.birthDate} onChange={(e) => updateField('birthDate', e.target.value)} placeholder="1365/05/12" className={inputCls} />
                </div>

                <div>
                    <label className={labelCls}>تاریخ صدور شناسنامه</label>
                    <input type="text" dir="ltr" value={person.idIssueDate} onChange={(e) => updateField('idIssueDate', e.target.value)} placeholder="1385/02/10" className={inputCls} />
                </div>

                <div>
                    <label className={labelCls}>صادره از (حوزه / شهر)</label>
                    <input type="text" value={person.issuePlace} onChange={(e) => updateField('issuePlace', e.target.value)} placeholder="شیراز" className={inputCls} />
                </div>

                <div>
                    <label className={labelCls}>استان / شهرستان محل تولد</label>
                    <div className="grid grid-cols-2 gap-1.5">
                        <input type="text" value={person.birthProvince} onChange={(e) => updateField('birthProvince', e.target.value)} placeholder="استان" className={inputCls} />
                        <input type="text" value={person.birthCounty} onChange={(e) => updateField('birthCounty', e.target.value)} placeholder="شهرستان" className={inputCls} />
                    </div>
                </div>

                <div>
                    <label className={labelCls}>استان / شهرستان محل صدور</label>
                    <div className="grid grid-cols-2 gap-1.5">
                        <input type="text" value={person.issueProvince} onChange={(e) => updateField('issueProvince', e.target.value)} placeholder="استان" className={inputCls} />
                        <input type="text" value={person.issueCounty} onChange={(e) => updateField('issueCounty', e.target.value)} placeholder="شهرستان" className={inputCls} />
                    </div>
                </div>

                <div>
                    <label className={labelCls}>وضعیت تاهل</label>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {(['متاهل', 'مجرد'] as const).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => updateField('maritalStatus', m)}
                                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    person.maritalStatus === m
                                        ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-white shadow-xs'
                                        : 'text-slate-500'
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className={labelCls}>مدرک تحصیلی</label>
                    <input type="text" value={person.education} onChange={(e) => updateField('education', e.target.value)} placeholder="کارشناسی / دیپلم..." className={inputCls} />
                </div>

                <div>
                    <label className={labelCls}>شغل</label>
                    <input type="text" value={person.occupation} onChange={(e) => updateField('occupation', e.target.value)} placeholder="آزاد / کارمند / پزشک..." className={inputCls} />
                </div>

                <div>
                    <label className={labelCls}>تلفن همراه</label>
                    <input
                        type="text"
                        dir="ltr"
                        maxLength={11}
                        value={person.address.mobilePhone}
                        onChange={(e) => updateAddr('mobilePhone', toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                        placeholder="09170000000"
                        className={inputCls}
                    />
                    {mobileCheck && (
                        <div className={`mt-1 text-[10px] ${mobileCheck.isValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {mobileCheck.isValid ? mobileCheck.operatorName : mobileCheck.errorMessage}
                        </div>
                    )}
                </div>

                <div>
                    <label className={labelCls}>تلفن ثابت</label>
                    <input type="text" dir="ltr" value={person.address.landlinePhone} onChange={(e) => updateAddr('landlinePhone', toEnglishDigits(e.target.value))} placeholder="07130000000" className={inputCls} />
                </div>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                        نشانی تفکیکی محل سکونت (جهت احراز سکونت، پلاک و قرارداد)
                    </span>
                    <span className="text-[10px] text-slate-500">
                        در قرارداد اقساطی به‌صورت خودکار ترکیب می‌شود
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    <div>
                        <label className={labelCls}>استان</label>
                        <input type="text" value={person.address.province} onChange={(e) => updateAddr('province', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>شهرستان</label>
                        <input type="text" value={person.address.county} onChange={(e) => updateAddr('county', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>شهر</label>
                        <input type="text" value={person.address.city} onChange={(e) => updateAddr('city', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>خیابان اصلی</label>
                        <input type="text" value={person.address.mainStreet} onChange={(e) => updateAddr('mainStreet', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>خیابان فرعی</label>
                        <input type="text" value={person.address.subStreet} onChange={(e) => updateAddr('subStreet', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>کوچه</label>
                        <input type="text" value={person.address.alley} onChange={(e) => updateAddr('alley', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>پلاک</label>
                        <input type="text" value={person.address.plaque} onChange={(e) => updateAddr('plaque', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>طبقه</label>
                        <input type="text" value={person.address.floor} onChange={(e) => updateAddr('floor', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>واحد</label>
                        <input type="text" value={person.address.unit} onChange={(e) => updateAddr('unit', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>منطقه شهرداری</label>
                        <input type="text" value={person.address.municipalityZone} onChange={(e) => updateAddr('municipalityZone', e.target.value)} className={inputCls} />
                    </div>
                    <div className="col-span-2">
                        <label className={labelCls}>کد پستی ۱۰ رقمی</label>
                        <input
                            type="text"
                            dir="ltr"
                            maxLength={10}
                            value={person.address.postalCode}
                            onChange={(e) => updateAddr('postalCode', toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                            placeholder="7100000000"
                            className={inputCls}
                        />
                        {postalCheck && (
                            <div className={`mt-1 text-[10px] ${postalCheck.isValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {postalCheck.isValid ? `معتبر (${postalCheck.provinceHint})` : postalCheck.errorMessage}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className={labelCls}>
                        نشانی کامل خطی (اختیاری — در صورت خالی بودن از فیلدهای بالا خودکار ساخته می‌شود)
                    </label>
                    <input
                        type="text"
                        value={person.address.fullAddressText}
                        onChange={(e) => updateAddr('fullAddressText', e.target.value)}
                        placeholder={autoAddressPreview || 'پیش‌نمایش خودکار نشانی...'}
                        className={inputCls}
                    />
                </div>
            </div>
        </div>
    );
};

interface PeacePartyEditorProps {
    title: string;
    party: LeasingPeaceParty;
    onUpdate: (next: LeasingPeaceParty) => void;
    onCopyBuyer: () => void;
    onSetLeasingCompany: () => void;
}

const PeacePartyEditor: React.FC<PeacePartyEditorProps> = ({
    title,
    party,
    onUpdate,
    onCopyBuyer,
    onSetLeasingCompany
}) => {
    return (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 dark:text-white">{title}</span>
                    <div className="inline-flex bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
                        <button type="button" onClick={() => onUpdate({ ...party, isLegal: false })} className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${!party.isLegal ? 'bg-sky-600 text-white' : 'text-slate-500'}`}>
                            حقیقی
                        </button>
                        <button type="button" onClick={() => onUpdate({ ...party, isLegal: true })} className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${party.isLegal ? 'bg-sky-600 text-white' : 'text-slate-500'}`}>
                            حقوقی
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={onCopyBuyer} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-[11px] font-bold cursor-pointer">
                        <Copy className="w-3 h-3" />
                        <span>کپی از خریدار</span>
                    </button>
                    <button type="button" onClick={onSetLeasingCompany} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-[11px] font-bold cursor-pointer">
                        <Building2 className="w-3 h-3" />
                        <span>شرکت واسپاری کرمان موتور</span>
                    </button>
                </div>
            </div>

            {party.isLegal ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                        <label className={labelCls}>نام شخص حقوقی / شرکت</label>
                        <input type="text" value={party.legalName} onChange={(e) => onUpdate({ ...party, legalName: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>شماره ثبت</label>
                        <input type="text" dir="ltr" value={party.legalRegNumber} onChange={(e) => onUpdate({ ...party, legalRegNumber: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>اقامتگاه قانونی</label>
                        <input type="text" value={party.legalAddress} onChange={(e) => onUpdate({ ...party, legalAddress: e.target.value })} className={inputCls} />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div><label className={labelCls}>نام</label><input type="text" value={party.firstName} onChange={(e) => onUpdate({ ...party, firstName: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>نام خانوادگی</label><input type="text" value={party.lastName} onChange={(e) => onUpdate({ ...party, lastName: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>نام پدر</label><input type="text" value={party.fatherName} onChange={(e) => onUpdate({ ...party, fatherName: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>شماره شناسنامه</label><input type="text" dir="ltr" value={party.idNumber} onChange={(e) => onUpdate({ ...party, idNumber: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>محل صدور</label><input type="text" value={party.issuePlace} onChange={(e) => onUpdate({ ...party, issuePlace: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>تاریخ تولد</label><input type="text" dir="ltr" value={party.birthDate} onChange={(e) => onUpdate({ ...party, birthDate: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>تاریخ صدور</label><input type="text" dir="ltr" value={party.idIssueDate} onChange={(e) => onUpdate({ ...party, idIssueDate: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>کد ملی</label><input type="text" dir="ltr" maxLength={10} value={party.nationalCode} onChange={(e) => onUpdate({ ...party, nationalCode: toEnglishDigits(e.target.value).replace(/\D/g, '') })} className={inputCls} /></div>
                    <div><label className={labelCls}>کد پستی</label><input type="text" dir="ltr" maxLength={10} value={party.postalCode} onChange={(e) => onUpdate({ ...party, postalCode: toEnglishDigits(e.target.value).replace(/\D/g, '') })} className={inputCls} /></div>
                    <div><label className={labelCls}>تلفن همراه</label><input type="text" dir="ltr" maxLength={11} value={party.mobilePhone} onChange={(e) => onUpdate({ ...party, mobilePhone: toEnglishDigits(e.target.value).replace(/\D/g, '') })} className={inputCls} /></div>
                </div>
            )}
        </div>
    );
};

export const LeasingCaseEditor: React.FC<LeasingCaseEditorProps> = ({
    leasingCase,
    onChange,
    activeForm
}) => {
    const [activeTab, setActiveTab] = useState<LeasingEditorTab>('buyer');
    const [activeGuarantorEdit, setActiveGuarantorEdit] = useState<'guarantor1' | 'guarantor2'>('guarantor1');
    const [checkIssuerSource, setCheckIssuerSource] = useState<'buyer' | 'guarantor1' | 'guarantor2'>('buyer');
    const [defaultCheckBank, setDefaultCheckBank] = useState<string>('ملت');
    const [uploadAutoFillTarget, setUploadAutoFillTarget] = useState<'buyer' | 'guarantor1' | 'guarantor2'>('buyer');

    const handleAutoFillPerson = (
        target: 'buyer' | 'guarantor1' | 'guarantor2',
        extracted: ExtractedIdentityDocumentData
    ): string[] => {
        const preview = applyExtractedIdentityToLeasingPerson(leasingCase[target], extracted);
        onChange((prev) => ({
            ...prev,
            [target]: applyExtractedIdentityToLeasingPerson(prev[target], extracted).next
        }));
        return preview.filledFields;
    };

    const tabs: { id: LeasingEditorTab; label: string; sub: string; icon: React.ReactNode }[] = [
        { id: 'buyer', label: '۱. مشخصات خریدار', sub: 'حقیقی و حقوقی', icon: <User className="w-4 h-4" /> },
        { id: 'contract', label: '۲. قرارداد و خودرو', sub: 'مدل، شاسی، نمایندگی', icon: <Car className="w-4 h-4" /> },
        { id: 'finance', label: '۳. مالی، اقساط و چک‌ها', sub: 'ماده ۵، ۷ و ۳۶', icon: <Calculator className="w-4 h-4" /> },
        { id: 'guarantors', label: '۴. ضامن‌ها (حقیقی/شرکتی)', sub: 'ضامن ۱، ۲ و شرکتی', icon: <Users className="w-4 h-4" /> },
        { id: 'affidavit_peace', label: '۵. اقرارنامه و صلح‌نامه', sub: 'واریز، صلح، متمم', icon: <FileSignature className="w-4 h-4" /> },
        { id: 'plate_mortgage', label: '۶. تعویض پلاک و فک رهن', sub: 'فرم ۱۲ تا ۱۶', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'uploads', label: '۷. مدارک هویتی و بانکی', sub: 'شناسنامه، کارت ملی، بانکی', icon: <CloudUpload className="w-4 h-4" /> }
    ];

    const computedRemaining = Math.max(
        0,
        (leasingCase.installmentTotalPriceRials || leasingCase.cashPriceRials) - leasingCase.prepaymentRials
    );
    const computed120 = Math.round((leasingCase.remainingAmountRials || computedRemaining) * 1.2);

    const handleAutoCalculateFinance = () => {
        onChange((prev) => {
            const months = Math.max(1, prev.installmentsCount * prev.installmentIntervalMonths);
            const principal = Math.max(0, prev.cashPriceRials - prev.prepaymentRials);
            let nextInstallmentTotal = prev.installmentTotalPriceRials;
            if (nextInstallmentTotal <= 0 && prev.cashPriceRials > 0) {
                const profitFactor = (prev.annualProfitPercent / 100) * (months / 12);
                nextInstallmentTotal = Math.round(prev.prepaymentRials + principal * (1 + profitFactor * 0.55));
            }
            const nextRemaining = Math.max(0, (nextInstallmentTotal || prev.cashPriceRials) - prev.prepaymentRials);
            const next120 = Math.round(nextRemaining * 1.2);
            const start = prev.contractStartDate || prev.contractDate;
            const end = start ? addMonthsToPersianDate(start, months) : prev.contractEndDate;

            return {
                ...prev,
                installmentTotalPriceRials: nextInstallmentTotal,
                remainingAmountRials: nextRemaining,
                guarantee120PercentRials: next120,
                article36FacilityTotalRials: nextRemaining,
                article36ObligationCheckRials: next120,
                contractDurationMonths: months,
                contractStartDate: start,
                contractEndDate: end
            };
        });
    };

    const handleGenerateChecks = () => {
        onChange((prev) => ({
            ...prev,
            checks: buildAutoCheckSchedule(prev, checkIssuerSource, defaultCheckBank)
        }));
    };

    const handleAutoFill120GuaranteeCheck = () => {
        onChange((prev) => {
            const rem = prev.remainingAmountRials || Math.max(0, (prev.installmentTotalPriceRials || prev.cashPriceRials) - prev.prepaymentRials);
            const g120 = prev.guarantee120PercentRials > 0 ? prev.guarantee120PercentRials : Math.round(rem * 1.2);
            const firstRow: LeasingCheckRow = {
                id: prev.guaranteeChecks[0]?.id || `gchk-${Date.now()}`,
                amountRials: g120,
                checkDate: prev.guaranteeChecks[0]?.checkDate || prev.contractDate,
                checkNumber: prev.guaranteeChecks[0]?.checkNumber || '',
                issuerName: getPersonFullName(prev.buyer),
                issuerNationalCode: prev.buyer.nationalCode,
                bankName: prev.guaranteeChecks[0]?.bankName || defaultCheckBank
            };
            return {
                ...prev,
                guarantee120PercentRials: g120,
                guaranteeChecks: [firstRow, ...prev.guaranteeChecks.slice(1)]
            };
        });
    };

    const updateCheckRow = (listKey: 'checks' | 'guaranteeChecks', idx: number, patch: Partial<LeasingCheckRow>) => {
        onChange((prev) => ({
            ...prev,
            [listKey]: prev[listKey].map((row, i) => (i === idx ? { ...row, ...patch } : row))
        }));
    };

    const addCheckRow = (listKey: 'checks' | 'guaranteeChecks') => {
        onChange((prev) => ({
            ...prev,
            [listKey]: [
                ...prev[listKey],
                {
                    id: `${listKey}-${Date.now()}`,
                    amountRials: 0,
                    checkDate: '',
                    checkNumber: '',
                    issuerName: getPersonFullName(prev.buyer),
                    issuerNationalCode: prev.buyer.nationalCode,
                    bankName: defaultCheckBank
                }
            ]
        }));
    };

    const removeCheckRow = (listKey: 'checks' | 'guaranteeChecks', idx: number) => {
        onChange((prev) => ({
            ...prev,
            [listKey]: prev[listKey].filter((_, i) => i !== idx)
        }));
    };

    const parseAmountInput = (raw: string): number => {
        const cleaned = toEnglishDigits(raw).replace(/\D/g, '');
        return cleaned ? parseInt(cleaned, 10) : 0;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Top Dossier Bar */}
            <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-sky-950 text-white px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs sm:text-sm font-black">
                        پرونده واحد لیزینگ — مطابق ساختار کامل kmc-leasing.ir (ورود یک‌باره برای تمام ۱۶ فرم)
                    </span>
                </div>
                <span className="text-[11px] text-sky-200 font-bold">
                    {activeForm === 'INSTALLMENT_CONTRACT'
                        ? `قرارداد ۸ صفحه‌ای (۲۸ ماده) — ${leasingCase.guarantorMode === 'corporate' ? 'نسخه ضامن شرکتی' : 'نسخه ضامن حقیقی'}`
                        : 'به‌روزرسانی لحظه‌ای فرم انتخابی'}
                </span>
            </div>

            {/* 7 Sub-Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                {tabs.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-3 py-2.5 text-right border-b-2 transition-all cursor-pointer ${
                                active
                                    ? 'bg-white dark:bg-slate-900 border-sky-600 text-sky-700 dark:text-sky-400'
                                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/40'
                            }`}
                        >
                            <span className={`p-1.5 rounded-lg ${active ? 'bg-sky-50 dark:bg-sky-900/40 text-sky-600' : 'bg-slate-200/70 dark:bg-slate-800'}`}>
                                {tab.icon}
                            </span>
                            <div className="min-w-0">
                                <div className="text-xs font-black truncate">{tab.label}</div>
                                <div className="text-[10px] text-slate-400 truncate">{tab.sub}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Tab Panels */}
            <div className="p-4 sm:p-5">
                {activeTab === 'buyer' && (
                    <div className="space-y-5">
                        <PersonIdentityAndAddressFields
                            person={leasingCase.buyer}
                            onUpdate={(next) => onChange((prev) => ({ ...prev, buyer: next }))}
                            roleTitle="مشخصات کامل خریدار / متقاضی (حقیقی)"
                            autoFillConfig={{
                                scopeId: leasingCase.id,
                                roleLabel: 'خریدار / متقاضی',
                                onAutoFill: (extracted) => handleAutoFillPerson('buyer', extracted)
                            }}
                        />

                        {/* Legal Buyer Toggle + Extra fields for فرم ۱۰ (آخرین اطلاعات مشتری حقوقی) */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 bg-slate-50/60 dark:bg-slate-800/30">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-indigo-600" />
                                    <span className="text-xs font-black text-slate-800 dark:text-white">
                                        اطلاعات خریدار حقوقی / شرکتی (بند ب-۲ قرارداد اقساطی و فرم آخرین اطلاعات مشتری حقوقی)
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={leasingCase.legalBuyer.isActive}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            legalBuyer: { ...prev.legalBuyer, isActive: e.target.checked }
                                        }))
                                    }
                                    className="w-4 h-4 accent-sky-600 rounded"
                                />
                            </label>

                            {leasingCase.legalBuyer.isActive && (
                                <div className="space-y-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div><label className={labelCls}>نام شرکت / موسسه</label><input type="text" value={leasingCase.legalBuyer.companyName} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, companyName: e.target.value } }))} className={inputCls} /></div>
                                        <div><label className={labelCls}>شماره ثبت</label><input type="text" dir="ltr" value={leasingCase.legalBuyer.registrationNumber} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, registrationNumber: e.target.value } }))} className={inputCls} /></div>
                                        <div><label className={labelCls}>شناسه ملی</label><input type="text" dir="ltr" value={leasingCase.legalBuyer.nationalId} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, nationalId: e.target.value } }))} className={inputCls} /></div>
                                        <div><label className={labelCls}>شماره اقتصادی</label><input type="text" dir="ltr" value={leasingCase.legalBuyer.economicCode} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, economicCode: e.target.value } }))} className={inputCls} /></div>
                                        <div><label className={labelCls}>اداره ثبت شرکت‌های</label><input type="text" value={leasingCase.legalBuyer.registrationOffice} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, registrationOffice: e.target.value } }))} className={inputCls} /></div>
                                        <div>
                                            <label className={labelCls}>نماینده ۱ و سمت</label>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <input type="text" placeholder="نام" value={leasingCase.legalBuyer.rep1Name} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, rep1Name: e.target.value } }))} className={inputCls} />
                                                <input type="text" placeholder="سمت" value={leasingCase.legalBuyer.rep1Title} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, rep1Title: e.target.value } }))} className={inputCls} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>نماینده ۲ و سمت</label>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <input type="text" placeholder="نام" value={leasingCase.legalBuyer.rep2Name} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, rep2Name: e.target.value } }))} className={inputCls} />
                                                <input type="text" placeholder="سمت" value={leasingCase.legalBuyer.rep2Title} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, rep2Title: e.target.value } }))} className={inputCls} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>روزنامه رسمی (شماره / تاریخ)</label>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <input type="text" dir="ltr" placeholder="شماره" value={leasingCase.legalBuyer.gazetteNumber} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, gazetteNumber: e.target.value } }))} className={inputCls} />
                                                <input type="text" dir="ltr" placeholder="تاریخ" value={leasingCase.legalBuyer.gazetteDate} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, gazetteDate: e.target.value } }))} className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2"><label className={labelCls}>نشانی شرکت</label><input type="text" value={leasingCase.legalBuyer.address} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, address: e.target.value } }))} className={inputCls} /></div>
                                        <div><label className={labelCls}>کد پستی شرکت</label><input type="text" dir="ltr" value={leasingCase.legalBuyer.postalCode} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, postalCode: e.target.value } }))} className={inputCls} /></div>
                                        <div><label className={labelCls}>تلفن شرکت</label><input type="text" dir="ltr" value={leasingCase.legalBuyer.phone} onChange={(e) => onChange((p) => ({ ...p, legalBuyer: { ...p.legalBuyer, phone: e.target.value } }))} className={inputCls} /></div>
                                    </div>

                                    {/* Extra fields for فرم ۱۰: آخرین اطلاعات مشتری حقوقی */}
                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-3">
                                        <div className="text-[11px] font-black text-indigo-700 dark:text-indigo-300">
                                            فیلدهای تکمیلی فرم «آخرین اطلاعات مشتری حقوقی» (سند و پلاک شرکتی)
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                            <div>
                                                <label className={labelCls}>نوع شرکت</label>
                                                <select
                                                    value={leasingCase.legalCustomerExtra.companyType}
                                                    onChange={(e) => onChange((p) => ({ ...p, legalCustomerExtra: { ...p.legalCustomerExtra, companyType: e.target.value as 'خصوصی' | 'دولتی' } }))}
                                                    className={inputCls}
                                                >
                                                    <option value="خصوصی">خصوصی</option>
                                                    <option value="دولتی">دولتی</option>
                                                </select>
                                            </div>
                                            <div><label className={labelCls}>نام مدیرعامل</label><input type="text" value={leasingCase.legalCustomerExtra.ceoName} onChange={(e) => onChange((p) => ({ ...p, legalCustomerExtra: { ...p.legalCustomerExtra, ceoName: e.target.value } }))} className={inputCls} /></div>
                                            <div><label className={labelCls}>نام کارگزار</label><input type="text" value={leasingCase.legalCustomerExtra.brokerName} onChange={(e) => onChange((p) => ({ ...p, legalCustomerExtra: { ...p.legalCustomerExtra, brokerName: e.target.value } }))} className={inputCls} /></div>
                                            <div><label className={labelCls}>تاریخ ثبت / شروع فعالیت</label><div className="grid grid-cols-2 gap-1"><input type="text" dir="ltr" placeholder="ثبت" value={leasingCase.legalCustomerExtra.registrationDate} onChange={(e) => onChange((p) => ({ ...p, legalCustomerExtra: { ...p.legalCustomerExtra, registrationDate: e.target.value } }))} className={inputCls} /><input type="text" dir="ltr" placeholder="شروع" value={leasingCase.legalCustomerExtra.activityStartDate} onChange={(e) => onChange((p) => ({ ...p, legalCustomerExtra: { ...p.legalCustomerExtra, activityStartDate: e.target.value } }))} className={inputCls} /></div></div>
                                            <div><label className={labelCls}>نام نماینده حقیقی</label><input type="text" value={leasingCase.legalCustomerExtra.repFullName} onChange={(e) => onChange((p) => ({ ...p, legalCustomerExtra: { ...p.legalCustomerExtra, repFullName: e.target.value } }))} className={inputCls} /></div>
                                            <div><label className={labelCls}>کد ملی نماینده</label><input type="text" dir="ltr" maxLength={10} value={leasingCase.legalCustomerExtra.repNationalCode} onChange={(e) => onChange((p) => ({ ...p, legalCustomerExtra: { ...p.legalCustomerExtra, repNationalCode: toEnglishDigits(e.target.value).replace(/\D/g, '') } }))} className={inputCls} /></div>
                                            <div><label className={labelCls}>موبایل نماینده</label><input type="text" dir="ltr" maxLength={11} value={leasingCase.legalCustomerExtra.repMobile} onChange={(e) => onChange((p) => ({ ...p, legalCustomerExtra: { ...p.legalCustomerExtra, repMobile: toEnglishDigits(e.target.value).replace(/\D/g, '') } }))} className={inputCls} /></div>
                                            <div><label className={labelCls}>آدرس نماینده</label><input type="text" value={leasingCase.legalCustomerExtra.repAddress} onChange={(e) => onChange((p) => ({ ...p, legalCustomerExtra: { ...p.legalCustomerExtra, repAddress: e.target.value } }))} className={inputCls} /></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'contract' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div><label className={labelCls}>کد نمایندگی</label><input type="text" dir="ltr" value={leasingCase.dealershipCode} onChange={(e) => onChange((p) => ({ ...p, dealershipCode: e.target.value }))} className={inputCls} /></div>
                            <div><label className={labelCls}>نام نمایندگی</label><input type="text" value={leasingCase.dealershipName} onChange={(e) => onChange((p) => ({ ...p, dealershipName: e.target.value }))} className={inputCls} /></div>
                            <div><label className={labelCls}>نام مدیر نمایندگی (فرم فک رهن)</label><input type="text" value={leasingCase.dealershipManagerName} onChange={(e) => onChange((p) => ({ ...p, dealershipManagerName: e.target.value }))} placeholder="آقای حسینی" className={inputCls} /></div>
                            <div><label className={labelCls}>شماره قرارداد فروش اقساطی</label><input type="text" dir="ltr" value={leasingCase.contractNumber} onChange={(e) => onChange((p) => ({ ...p, contractNumber: e.target.value }))} className={inputCls} /></div>
                            <div><label className={labelCls}>تاریخ قرارداد</label><input type="text" dir="ltr" value={leasingCase.contractDate} onChange={(e) => onChange((p) => ({ ...p, contractDate: e.target.value }))} className={inputCls} /></div>
                            <div><label className={labelCls}>تاریخ فرم‌ها (پیش‌ثبت‌نام / ماده ۳۶ / احراز)</label><input type="text" dir="ltr" value={leasingCase.formDate} onChange={(e) => onChange((p) => ({ ...p, formDate: e.target.value }))} className={inputCls} /></div>
                            <div><label className={labelCls}>شماره فرم درخواست ثبت‌نام</label><input type="text" dir="ltr" value={leasingCase.registrationRequestNumber} onChange={(e) => onChange((p) => ({ ...p, registrationRequestNumber: e.target.value }))} className={inputCls} /></div>
                            <div><label className={labelCls}>تاریخ فرم درخواست ثبت‌نام</label><input type="text" dir="ltr" value={leasingCase.registrationRequestDate} onChange={(e) => onChange((p) => ({ ...p, registrationRequestDate: e.target.value }))} className={inputCls} /></div>
                            <div><label className={labelCls}>شماره فاکتور / مبایعه‌نامه</label><input type="text" value={leasingCase.invoiceOrBillRef} onChange={(e) => onChange((p) => ({ ...p, invoiceOrBillRef: e.target.value }))} className={inputCls} /></div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 space-y-3">
                            <div>
                                <label className={labelCls}>انتخاب سریع مدل خودرو</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {CAR_MODELS_QUICK.map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => onChange((p) => ({ ...p, carModel: m }))}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${
                                                leasingCase.carModel === m
                                                    ? 'bg-sky-600 text-white border-sky-600'
                                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                                <div><label className={labelCls}>تعداد دستگاه</label><input type="number" min={1} value={leasingCase.vehicleQuantity || 1} onChange={(e) => onChange((p) => ({ ...p, vehicleQuantity: Math.max(1, Number(e.target.value) || 1) }))} className={inputCls} /></div>
                                <div><label className={labelCls}>مدل خودرو</label><input type="text" value={leasingCase.carModel} onChange={(e) => onChange((p) => ({ ...p, carModel: e.target.value }))} className={inputCls} /></div>
                                <div><label className={labelCls}>سال ساخت (مدل)</label><input type="text" dir="ltr" value={leasingCase.modelYear} onChange={(e) => onChange((p) => ({ ...p, modelYear: e.target.value }))} className={inputCls} /></div>
                                <div>
                                    <label className={labelCls}>رنگ خودرو</label>
                                    <input type="text" value={leasingCase.color} onChange={(e) => onChange((p) => ({ ...p, color: e.target.value }))} className={inputCls} />
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {COLORS_QUICK.map((clr) => (
                                            <button key={clr} type="button" onClick={() => onChange((p) => ({ ...p, color: clr }))} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 hover:bg-sky-100 cursor-pointer">
                                                {clr}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div><label className={labelCls}>شماره شاسی</label><input type="text" dir="ltr" value={leasingCase.chassisNumber} onChange={(e) => onChange((p) => ({ ...p, chassisNumber: e.target.value.toUpperCase() }))} className={inputCls} /></div>
                                <div><label className={labelCls}>شماره موتور</label><input type="text" dir="ltr" value={leasingCase.engineNumber} onChange={(e) => onChange((p) => ({ ...p, engineNumber: e.target.value.toUpperCase() }))} className={inputCls} /></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                            <div><label className={labelCls}>استان محل تحویل</label><input type="text" value={leasingCase.deliveryProvince} onChange={(e) => onChange((p) => ({ ...p, deliveryProvince: e.target.value }))} className={inputCls} /></div>
                            <div><label className={labelCls}>شهرستان محل تحویل</label><input type="text" value={leasingCase.deliveryCounty} onChange={(e) => onChange((p) => ({ ...p, deliveryCounty: e.target.value }))} className={inputCls} /></div>
                            <div><label className={labelCls}>شهر محل تحویل</label><input type="text" value={leasingCase.deliveryCity} onChange={(e) => onChange((p) => ({ ...p, deliveryCity: e.target.value }))} className={inputCls} /></div>
                            <button type="button" onClick={() => onChange((p) => ({ ...p, deliveryProvince: 'فارس', deliveryCounty: 'شیراز', deliveryCity: 'شیراز' }))} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                تنظیم پیش‌فرض شیراز / فارس
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="text-xs font-black text-slate-700 dark:text-slate-200">
                                تمامی مبالغ به <span className="text-emerald-600">ریال</span> وارد می‌شوند و تضمین ۱۲۰٪ ماده ۷ و ماده ۳۶ خودکار محاسبه می‌گردد.
                            </div>
                            <button
                                type="button"
                                onClick={handleAutoCalculateFinance}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs cursor-pointer"
                            >
                                <Calculator className="w-3.5 h-3.5" />
                                <span>محاسبه خودکار اقساط، تاریخ پایان و تضمین ۱۲۰٪</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                                <label className={labelCls}>قیمت فروش نقدی / ثمن معامله (ریال)</label>
                                <input type="text" dir="ltr" value={leasingCase.cashPriceRials > 0 ? formatCurrencyWithCommas(leasingCase.cashPriceRials) : ''} onChange={(e) => onChange((p) => ({ ...p, cashPriceRials: parseAmountInput(e.target.value) }))} placeholder="مثلاً 15,000,000,000" className={inputCls} />
                                {leasingCase.cashPriceRials > 0 && <div className="mt-1 text-[10px] text-emerald-600 font-bold">{getAmountDisplaySummary(leasingCase.cashPriceRials).tomansInWords}</div>}
                            </div>

                            <div>
                                <label className={labelCls}>مبلغ پیش پرداخت (ریال)</label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    value={leasingCase.prepaymentRials > 0 ? formatCurrencyWithCommas(leasingCase.prepaymentRials) : ''}
                                    onChange={(e) => {
                                        const val = parseAmountInput(e.target.value);
                                        onChange((p) => {
                                            const rem = Math.max(0, (p.installmentTotalPriceRials || p.cashPriceRials) - val);
                                            return { ...p, prepaymentRials: val, remainingAmountRials: rem, guarantee120PercentRials: Math.round(rem * 1.2) };
                                        });
                                    }}
                                    placeholder="پیش پرداخت"
                                    className={inputCls}
                                />
                                {leasingCase.prepaymentRials > 0 && <div className="mt-1 text-[10px] text-sky-600 font-bold">{getAmountDisplaySummary(leasingCase.prepaymentRials).tomansInWords}</div>}
                            </div>

                            <div>
                                <label className={labelCls}>قیمت فروش اقساطی با سود (ریال)</label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    value={leasingCase.installmentTotalPriceRials > 0 ? formatCurrencyWithCommas(leasingCase.installmentTotalPriceRials) : ''}
                                    onChange={(e) => {
                                        const val = parseAmountInput(e.target.value);
                                        onChange((p) => {
                                            const rem = Math.max(0, val - p.prepaymentRials);
                                            return { ...p, installmentTotalPriceRials: val, remainingAmountRials: rem, guarantee120PercentRials: Math.round(rem * 1.2) };
                                        });
                                    }}
                                    placeholder="قیمت اقساطی کل"
                                    className={inputCls}
                                />
                            </div>

                            <div>
                                <label className={labelCls}>الباقی ثمن معامله / مبلغ تسهیلات (ریال)</label>
                                <input type="text" dir="ltr" value={(leasingCase.remainingAmountRials || computedRemaining) > 0 ? formatCurrencyWithCommas(leasingCase.remainingAmountRials || computedRemaining) : ''} onChange={(e) => onChange((p) => ({ ...p, remainingAmountRials: parseAmountInput(e.target.value) }))} className={inputCls} />
                            </div>

                            <div><label className={labelCls}>تعداد قسط</label><input type="number" min={1} max={60} value={leasingCase.installmentsCount} onChange={(e) => onChange((p) => ({ ...p, installmentsCount: Math.max(1, Number(e.target.value) || 1) }))} className={inputCls} /></div>
                            <div><label className={labelCls}>تناوب اقساط (هر چند ماه)</label><input type="number" min={1} max={12} value={leasingCase.installmentIntervalMonths} onChange={(e) => onChange((p) => ({ ...p, installmentIntervalMonths: Math.max(1, Number(e.target.value) || 1) }))} className={inputCls} /></div>
                            <div><label className={labelCls}>نرخ سود سالانه (درصد)</label><input type="number" step="0.5" value={leasingCase.annualProfitPercent} onChange={(e) => onChange((p) => ({ ...p, annualProfitPercent: Number(e.target.value) || 0 }))} className={inputCls} /></div>
                            <div><label className={labelCls}>مدت قرارداد (ماه شمسی)</label><input type="number" value={leasingCase.contractDurationMonths} onChange={(e) => onChange((p) => ({ ...p, contractDurationMonths: Number(e.target.value) || 0 }))} className={inputCls} /></div>
                            <div><label className={labelCls}>شروع قرارداد (از تاریخ)</label><input type="text" dir="ltr" value={leasingCase.contractStartDate} onChange={(e) => onChange((p) => ({ ...p, contractStartDate: e.target.value }))} className={inputCls} /></div>
                            <div><label className={labelCls}>پایان قرارداد (لغایت تاریخ)</label><input type="text" dir="ltr" value={leasingCase.contractEndDate} onChange={(e) => onChange((p) => ({ ...p, contractEndDate: e.target.value }))} className={inputCls} /></div>
                            <div>
                                <label className={labelCls}>تضمین ۱۲۰٪ ماده ۷ و ۳۶ (ریال)</label>
                                <input type="text" dir="ltr" value={(leasingCase.guarantee120PercentRials || computed120) > 0 ? formatCurrencyWithCommas(leasingCase.guarantee120PercentRials || computed120) : ''} onChange={(e) => onChange((p) => ({ ...p, guarantee120PercentRials: parseAmountInput(e.target.value) }))} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>مبلغ اصل و فرع تسهیلات ماده ۳۶ (ریال)</label>
                                <input type="text" dir="ltr" value={leasingCase.article36FacilityTotalRials > 0 ? formatCurrencyWithCommas(leasingCase.article36FacilityTotalRials) : ''} onChange={(e) => onChange((p) => ({ ...p, article36FacilityTotalRials: parseAmountInput(e.target.value) }))} placeholder="پیش‌فرض = الباقی تسهیلات" className={inputCls} />
                            </div>
                        </div>

                        {/* Installment Checks Table (ماده ۵ صفحه ۲) */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 bg-slate-50/70 dark:bg-slate-800/30 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-black text-slate-800 dark:text-white">
                                    جدول چک‌های اقساط — ماده ۵ صفحه ۲ ({toPersianDigits(leasingCase.checks.length)} چک)
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <select value={checkIssuerSource} onChange={(e) => setCheckIssuerSource(e.target.value as 'buyer' | 'guarantor1' | 'guarantor2')} className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold">
                                        <option value="buyer">صادرکننده: خریدار</option>
                                        <option value="guarantor1">صادرکننده: ضامن اول</option>
                                        <option value="guarantor2">صادرکننده: ضامن دوم</option>
                                    </select>
                                    <input type="text" value={defaultCheckBank} onChange={(e) => setDefaultCheckBank(e.target.value)} placeholder="نام بانک" className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
                                    <button type="button" onClick={handleGenerateChecks} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black cursor-pointer">
                                        <Wand2 className="w-3.5 h-3.5" />
                                        <span>تولید خودکار اقساط</span>
                                    </button>
                                    <button type="button" onClick={() => addCheckRow('checks')} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer">
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>ردیف جدید</span>
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">#</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">مبلغ چک (ریال)</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">تاریخ سررسید</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">شماره چک</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">صادرکننده</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">کد ملی</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">بانک</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">حذف</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leasingCase.checks.map((chk, idx) => (
                                            <tr key={chk.id} className="bg-white dark:bg-slate-900">
                                                <td className="p-1.5 border border-slate-200 dark:border-slate-700 text-center font-bold">{toPersianDigits(idx + 1)}</td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" dir="ltr" value={chk.amountRials > 0 ? formatCurrencyWithCommas(chk.amountRials) : ''} onChange={(e) => updateCheckRow('checks', idx, { amountRials: parseAmountInput(e.target.value) })} className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" dir="ltr" value={chk.checkDate} onChange={(e) => updateCheckRow('checks', idx, { checkDate: e.target.value })} placeholder="1405/06/01" className="w-24 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" dir="ltr" value={chk.checkNumber} onChange={(e) => updateCheckRow('checks', idx, { checkNumber: e.target.value })} className="w-28 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={chk.issuerName} onChange={(e) => updateCheckRow('checks', idx, { issuerName: e.target.value })} className="w-full min-w-[110px] px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" dir="ltr" maxLength={10} value={chk.issuerNationalCode} onChange={(e) => updateCheckRow('checks', idx, { issuerNationalCode: toEnglishDigits(e.target.value).replace(/\D/g, '') })} className="w-24 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={chk.bankName} onChange={(e) => updateCheckRow('checks', idx, { bankName: e.target.value })} className="w-24 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700 text-center"><button type="button" onClick={() => removeCheckRow('checks', idx)} className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Guarantee Checks Table (ماده ۷ صفحه ۳) */}
                        <div className="border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5 bg-amber-50/40 dark:bg-amber-950/15 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-black text-slate-800 dark:text-white">
                                    جدول چک/سفته تضامین (ماده ۷ صفحه ۳ — ۱۲۰٪ اصل + سود تسهیلات)
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" onClick={handleAutoFill120GuaranteeCheck} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black cursor-pointer">
                                        <Wand2 className="w-3.5 h-3.5" />
                                        <span>تنظیم خودکار چک ۱۲۰٪ به نام خریدار</span>
                                    </button>
                                    <button type="button" onClick={() => addCheckRow('guaranteeChecks')} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer">
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>ردیف تضمین</span>
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-amber-100/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">#</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">مبلغ چک/سفته (ریال)</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">تاریخ</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">شماره چک/سفته</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">صادرکننده</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">کد ملی</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">بانک</th>
                                            <th className="p-2 border border-slate-300 dark:border-slate-700">حذف</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leasingCase.guaranteeChecks.map((chk, idx) => (
                                            <tr key={chk.id} className="bg-white dark:bg-slate-900">
                                                <td className="p-1.5 border border-slate-200 dark:border-slate-700 text-center font-bold">{toPersianDigits(idx + 1)}</td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" dir="ltr" value={chk.amountRials > 0 ? formatCurrencyWithCommas(chk.amountRials) : ''} onChange={(e) => updateCheckRow('guaranteeChecks', idx, { amountRials: parseAmountInput(e.target.value) })} className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" dir="ltr" value={chk.checkDate} onChange={(e) => updateCheckRow('guaranteeChecks', idx, { checkDate: e.target.value })} placeholder="1405/06/01" className="w-24 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" dir="ltr" value={chk.checkNumber} onChange={(e) => updateCheckRow('guaranteeChecks', idx, { checkNumber: e.target.value })} className="w-28 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={chk.issuerName} onChange={(e) => updateCheckRow('guaranteeChecks', idx, { issuerName: e.target.value })} className="w-full min-w-[110px] px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" dir="ltr" maxLength={10} value={chk.issuerNationalCode} onChange={(e) => updateCheckRow('guaranteeChecks', idx, { issuerNationalCode: toEnglishDigits(e.target.value).replace(/\D/g, '') })} className="w-24 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={chk.bankName} onChange={(e) => updateCheckRow('guaranteeChecks', idx, { bankName: e.target.value })} className="w-24 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-transparent" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700 text-center"><button type="button" onClick={() => removeCheckRow('guaranteeChecks', idx)} className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'guarantors' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">نوع ضمانت در قرارداد اقساطی:</span>
                                <button
                                    type="button"
                                    onClick={() => onChange((p) => ({ ...p, guarantorMode: 'natural' }))}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                                        leasingCase.guarantorMode === 'natural'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    ۲ ضامن حقیقی (عادی)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onChange((p) => ({ ...p, guarantorMode: 'corporate' }))}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                                        leasingCase.guarantorMode === 'corporate'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    ضامن شرکتی + حقیقی (نسخه جدید)
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">منبع چاپ فرم ۱۱ (ضامن/صادرکننده چک):</span>
                                <select
                                    value={leasingCase.activeGuarantorTabForFinalForm}
                                    onChange={(e) => onChange((p) => ({ ...p, activeGuarantorTabForFinalForm: e.target.value as 'guarantor1' | 'guarantor2' | 'buyer' }))}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                                >
                                    <option value="guarantor1">ضامن اول</option>
                                    <option value="guarantor2">ضامن دوم</option>
                                    <option value="buyer">خریدار (به عنوان صادرکننده چک)</option>
                                </select>
                            </div>
                        </div>

                        {leasingCase.guarantorMode === 'corporate' && (
                            <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/15 space-y-3">
                                <div className="text-xs font-black text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    <span>مشخصات شرکت ضامن (بند ج - نسخه جدید قرارداد اقساطی)</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div><label className={labelCls}>نام شرکت ضامن</label><input type="text" value={leasingCase.corporateGuarantor.companyName} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, companyName: e.target.value } }))} className={inputCls} /></div>
                                    <div><label className={labelCls}>شماره ثبت</label><input type="text" dir="ltr" value={leasingCase.corporateGuarantor.registrationNumber} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, registrationNumber: e.target.value } }))} className={inputCls} /></div>
                                    <div><label className={labelCls}>شناسه ملی</label><input type="text" dir="ltr" value={leasingCase.corporateGuarantor.nationalId} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, nationalId: e.target.value } }))} className={inputCls} /></div>
                                    <div><label className={labelCls}>شماره اقتصادی</label><input type="text" dir="ltr" value={leasingCase.corporateGuarantor.economicCode} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, economicCode: e.target.value } }))} className={inputCls} /></div>
                                    <div><label className={labelCls}>اداره ثبت شرکت‌های</label><input type="text" value={leasingCase.corporateGuarantor.registrationOffice} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, registrationOffice: e.target.value } }))} className={inputCls} /></div>
                                    <div><label className={labelCls}>نماینده ۱ و سمت</label><div className="grid grid-cols-2 gap-1.5"><input type="text" placeholder="نام" value={leasingCase.corporateGuarantor.rep1Name} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, rep1Name: e.target.value } }))} className={inputCls} /><input type="text" placeholder="سمت" value={leasingCase.corporateGuarantor.rep1Title} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, rep1Title: e.target.value } }))} className={inputCls} /></div></div>
                                    <div><label className={labelCls}>نماینده ۲ و سمت</label><div className="grid grid-cols-2 gap-1.5"><input type="text" placeholder="نام" value={leasingCase.corporateGuarantor.rep2Name} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, rep2Name: e.target.value } }))} className={inputCls} /><input type="text" placeholder="سمت" value={leasingCase.corporateGuarantor.rep2Title} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, rep2Title: e.target.value } }))} className={inputCls} /></div></div>
                                    <div><label className={labelCls}>روزنامه رسمی (شماره / تاریخ)</label><div className="grid grid-cols-2 gap-1.5"><input type="text" dir="ltr" placeholder="شماره" value={leasingCase.corporateGuarantor.gazetteNumber} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, gazetteNumber: e.target.value } }))} className={inputCls} /><input type="text" dir="ltr" placeholder="تاریخ" value={leasingCase.corporateGuarantor.gazetteDate} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, gazetteDate: e.target.value } }))} className={inputCls} /></div></div>
                                    <div className="sm:col-span-2"><label className={labelCls}>نشانی شرکت ضامن</label><input type="text" value={leasingCase.corporateGuarantor.address} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, address: e.target.value } }))} className={inputCls} /></div>
                                    <div><label className={labelCls}>کد پستی شرکت ضامن</label><input type="text" dir="ltr" value={leasingCase.corporateGuarantor.postalCode} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, postalCode: e.target.value } }))} className={inputCls} /></div>
                                    <div><label className={labelCls}>تلفن شرکت ضامن</label><input type="text" dir="ltr" value={leasingCase.corporateGuarantor.phone} onChange={(e) => onChange((p) => ({ ...p, corporateGuarantor: { ...p.corporateGuarantor, phone: e.target.value } }))} className={inputCls} /></div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setActiveGuarantorEdit('guarantor1')} className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${activeGuarantorEdit === 'guarantor1' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                ضامن اول (ج-۱)
                            </button>
                            <button type="button" onClick={() => setActiveGuarantorEdit('guarantor2')} className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${activeGuarantorEdit === 'guarantor2' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                ضامن دوم (ج-۲)
                            </button>
                        </div>

                        <PersonIdentityAndAddressFields
                            person={activeGuarantorEdit === 'guarantor1' ? leasingCase.guarantor1 : leasingCase.guarantor2}
                            onUpdate={(next) => onChange((prev) => ({ ...prev, [activeGuarantorEdit]: next }))}
                            roleTitle={activeGuarantorEdit === 'guarantor1' ? 'مشخصات کامل ضامن اول (ج-۱)' : 'مشخصات کامل ضامن دوم (ج-۲)'}
                            autoFillConfig={{
                                scopeId: leasingCase.id,
                                roleLabel: activeGuarantorEdit === 'guarantor1' ? 'ضامن اول' : 'ضامن دوم',
                                onAutoFill: (extracted) => handleAutoFillPerson(activeGuarantorEdit, extracted)
                            }}
                            onCopyAddressFromBuyer={() =>
                                onChange((prev) => ({
                                    ...prev,
                                    [activeGuarantorEdit]: {
                                        ...prev[activeGuarantorEdit],
                                        address: {
                                            ...prev.buyer.address,
                                            landlinePhone: prev[activeGuarantorEdit].address.landlinePhone || prev.buyer.address.landlinePhone,
                                            mobilePhone: prev[activeGuarantorEdit].address.mobilePhone
                                        }
                                    }
                                }))
                            }
                        />
                    </div>
                )}

                {activeTab === 'affidavit_peace' && (
                    <div className="space-y-5">
                        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                                    اقرارنامه واریز وجه (حقیقی و حقوقی)
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button type="button" onClick={() => onChange((p) => ({ ...p, affidavitAmountRials: p.prepaymentRials, affidavitDepositDate: p.contractDate || p.formDate }))} className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold cursor-pointer">
                                        کپی مبلغ از پیش‌پرداخت
                                    </button>
                                    <button type="button" onClick={() => onChange((p) => ({ ...p, naturalPayer: { fullName: getPersonFullName(p.buyer), fatherName: p.buyer.fatherName, nationalCode: p.buyer.nationalCode } }))} className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold cursor-pointer">
                                        کپی واریزکننده حقیقی از خریدار
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div><label className={labelCls}>تاریخ واریز</label><input type="text" dir="ltr" value={leasingCase.affidavitDepositDate} onChange={(e) => onChange((p) => ({ ...p, affidavitDepositDate: e.target.value }))} className={inputCls} /></div>
                                <div><label className={labelCls}>مبلغ واریزی اقرارنامه (ریال)</label><input type="text" dir="ltr" value={(leasingCase.affidavitAmountRials || leasingCase.prepaymentRials) > 0 ? formatCurrencyWithCommas(leasingCase.affidavitAmountRials || leasingCase.prepaymentRials) : ''} onChange={(e) => onChange((p) => ({ ...p, affidavitAmountRials: parseAmountInput(e.target.value) }))} className={inputCls} /></div>
                                <div><label className={labelCls}>نام و نام خانوادگی واریزکننده حقیقی</label><input type="text" value={leasingCase.naturalPayer.fullName} onChange={(e) => onChange((p) => ({ ...p, naturalPayer: { ...p.naturalPayer, fullName: e.target.value } }))} placeholder="در صورت خالی بودن = نام خریدار" className={inputCls} /></div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div><label className={labelCls}>نام پدر واریزکننده</label><input type="text" value={leasingCase.naturalPayer.fatherName} onChange={(e) => onChange((p) => ({ ...p, naturalPayer: { ...p.naturalPayer, fatherName: e.target.value } }))} className={inputCls} /></div>
                                    <div><label className={labelCls}>کد ملی واریزکننده</label><input type="text" dir="ltr" maxLength={10} value={leasingCase.naturalPayer.nationalCode} onChange={(e) => onChange((p) => ({ ...p, naturalPayer: { ...p.naturalPayer, nationalCode: toEnglishDigits(e.target.value).replace(/\D/g, '') } }))} className={inputCls} /></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div><label className={labelCls}>نام شرکت واریزکننده (اقرارنامه حقوقی)</label><input type="text" value={leasingCase.legalPayer.companyName} onChange={(e) => onChange((p) => ({ ...p, legalPayer: { ...p.legalPayer, companyName: e.target.value } }))} className={inputCls} /></div>
                                <div><label className={labelCls}>شماره ثبت شرکت واریزکننده</label><input type="text" dir="ltr" value={leasingCase.legalPayer.registrationNumber} onChange={(e) => onChange((p) => ({ ...p, legalPayer: { ...p.legalPayer, registrationNumber: e.target.value } }))} className={inputCls} /></div>
                                <div><label className={labelCls}>شناسه ملی شرکت واریزکننده</label><input type="text" dir="ltr" value={leasingCase.legalPayer.nationalId} onChange={(e) => onChange((p) => ({ ...p, legalPayer: { ...p.legalPayer, nationalId: e.target.value } }))} className={inputCls} /></div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">صلحنامه و متمم صلحنامه واسپاری</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div><label className={labelCls}>شماره صلحنامه</label><input type="text" dir="ltr" value={leasingCase.peaceNumber} onChange={(e) => onChange((p) => ({ ...p, peaceNumber: e.target.value }))} className={inputCls} /></div>
                                <div><label className={labelCls}>تاریخ صلحنامه</label><input type="text" dir="ltr" value={leasingCase.peaceDate} onChange={(e) => onChange((p) => ({ ...p, peaceDate: e.target.value }))} className={inputCls} /></div>
                                <div><label className={labelCls}>تاریخ متمم صلحنامه</label><input type="text" dir="ltr" value={leasingCase.peaceAddendumDate} onChange={(e) => onChange((p) => ({ ...p, peaceAddendumDate: e.target.value }))} className={inputCls} /></div>
                                <div><label className={labelCls}>شماره حواله موضوع صلح (متمم)</label><input type="text" dir="ltr" value={leasingCase.peaceAddendumReferenceNo} onChange={(e) => onChange((p) => ({ ...p, peaceAddendumReferenceNo: e.target.value }))} placeholder="در صورت خالی بودن = شماره فرم ثبت‌نام" className={inputCls} /></div>
                            </div>

                            <PeacePartyEditor
                                title="مشخصات مصالح (انتقال دهنده)"
                                party={leasingCase.mosaleh}
                                onUpdate={(next) => onChange((p) => ({ ...p, mosaleh: next }))}
                                onCopyBuyer={() => onChange((p) => ({ ...p, mosaleh: personToPeaceParty(p.buyer) }))}
                                onSetLeasingCompany={() => onChange((p) => ({ ...p, mosaleh: createEmptyPeaceParty(true) }))}
                            />

                            <PeacePartyEditor
                                title="مشخصات متصالح (انتقال گیرنده)"
                                party={leasingCase.motasaleh}
                                onUpdate={(next) => onChange((p) => ({ ...p, motasaleh: next }))}
                                onCopyBuyer={() => onChange((p) => ({ ...p, motasaleh: personToPeaceParty(p.buyer) }))}
                                onSetLeasingCompany={() => onChange((p) => ({ ...p, motasaleh: createEmptyPeaceParty(true) }))}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div><label className={labelCls}>نام شاهد صلحنامه</label><input type="text" value={leasingCase.peaceWitness.name} onChange={(e) => onChange((p) => ({ ...p, peaceWitness: { ...p.peaceWitness, name: e.target.value } }))} className={inputCls} /></div>
                                <div><label className={labelCls}>نام پدر شاهد</label><input type="text" value={leasingCase.peaceWitness.fatherName} onChange={(e) => onChange((p) => ({ ...p, peaceWitness: { ...p.peaceWitness, fatherName: e.target.value } }))} className={inputCls} /></div>
                                <div><label className={labelCls}>محل سکونت شاهد</label><input type="text" value={leasingCase.peaceWitness.address} onChange={(e) => onChange((p) => ({ ...p, peaceWitness: { ...p.peaceWitness, address: e.target.value } }))} className={inputCls} /></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'plate_mortgage' && (
                    <div className="space-y-4">
                        {/* Plate Change Check (الحاقیه تعهد به تعویض پلاک + فرم ۱۵ عودت چک) */}
                        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                                    چک حسن انجام تعهد تعویض پلاک (فرم الحاقیه تعویض پلاک و فرم ۱۵ عودت چک)
                                </h4>
                                <button
                                    type="button"
                                    onClick={() =>
                                        onChange((p) => ({
                                            ...p,
                                            plateChangeCheck: {
                                                ...p.plateChangeCheck,
                                                amountRials: 1_000_000_000,
                                                issuerName: getPersonFullName(p.buyer),
                                                issuerNationalCode: p.buyer.nationalCode,
                                                bankName: p.plateChangeCheck.bankName || defaultCheckBank
                                            }
                                        }))
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-black cursor-pointer"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>تنظیم خودکار چک ۱ میلیارد ریالی به نام خریدار</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                                <div><label className={labelCls}>مبلغ چک (ریال)</label><input type="text" dir="ltr" value={formatCurrencyWithCommas(leasingCase.plateChangeCheck.amountRials)} onChange={(e) => onChange((p) => ({ ...p, plateChangeCheck: { ...p.plateChangeCheck, amountRials: parseAmountInput(e.target.value) } }))} className={inputCls} /></div>
                                <div><label className={labelCls}>تاریخ چک</label><input type="text" dir="ltr" value={leasingCase.plateChangeCheck.checkDate} onChange={(e) => onChange((p) => ({ ...p, plateChangeCheck: { ...p.plateChangeCheck, checkDate: e.target.value } }))} className={inputCls} /></div>
                                <div><label className={labelCls}>شماره و سری چک</label><input type="text" dir="ltr" value={leasingCase.plateChangeCheck.checkNumber} onChange={(e) => onChange((p) => ({ ...p, plateChangeCheck: { ...p.plateChangeCheck, checkNumber: e.target.value } }))} className={inputCls} /></div>
                                <div><label className={labelCls}>صادرکننده</label><input type="text" value={leasingCase.plateChangeCheck.issuerName} onChange={(e) => onChange((p) => ({ ...p, plateChangeCheck: { ...p.plateChangeCheck, issuerName: e.target.value } }))} className={inputCls} /></div>
                                <div><label className={labelCls}>کد ملی صادرکننده</label><input type="text" dir="ltr" maxLength={10} value={leasingCase.plateChangeCheck.issuerNationalCode} onChange={(e) => onChange((p) => ({ ...p, plateChangeCheck: { ...p.plateChangeCheck, issuerNationalCode: toEnglishDigits(e.target.value).replace(/\D/g, '') } }))} className={inputCls} /></div>
                                <div><label className={labelCls}>بانک</label><input type="text" value={leasingCase.plateChangeCheck.bankName} onChange={(e) => onChange((p) => ({ ...p, plateChangeCheck: { ...p.plateChangeCheck, bankName: e.target.value } }))} className={inputCls} /></div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div><label className={labelCls}>شماره نامه (فرم ۱۵)</label><input type="text" dir="ltr" value={leasingCase.plateReturnRequest.letterNumber} onChange={(e) => onChange((p) => ({ ...p, plateReturnRequest: { ...p.plateReturnRequest, letterNumber: e.target.value } }))} className={inputCls} /></div>
                                <div><label className={labelCls}>تاریخ نامه (فرم ۱۵)</label><input type="text" dir="ltr" value={leasingCase.plateReturnRequest.letterDate} onChange={(e) => onChange((p) => ({ ...p, plateReturnRequest: { ...p.plateReturnRequest, letterDate: e.target.value } }))} className={inputCls} /></div>
                                <div><label className={labelCls}>پیوست (فرم ۱۵)</label><input type="text" value={leasingCase.plateReturnRequest.attachment} onChange={(e) => onChange((p) => ({ ...p, plateReturnRequest: { ...p.plateReturnRequest, attachment: e.target.value } }))} className={inputCls} /></div>
                                <div><label className={labelCls}>تاریخ مراجعه دریافت نامه تعویض پلاک</label><input type="text" dir="ltr" value={leasingCase.plateReturnRequest.receiptReferralDate} onChange={(e) => onChange((p) => ({ ...p, plateReturnRequest: { ...p.plateReturnRequest, receiptReferralDate: e.target.value } }))} className={inputCls} /></div>
                            </div>
                        </div>

                        {/* Mortgage Release Options (فرم فک رهن) */}
                        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 space-y-3">
                            <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                                گزینه‌های فرم فک رهن و استرداد اسناد
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                                {[
                                    { key: 'guaranteeDocs', label: 'الف - عودت اسناد ضمانت قرارداد' },
                                    { key: 'earlySettlementChecks', label: 'ب - استرداد چک‌های اقساط به واسطه تسویه زودتر از موعد' },
                                    { key: 'mortgageReleaseLetter', label: 'ج - ارائه نامه فک رهن خودرو' },
                                    { key: 'bouncedCheck', label: 'د - استرداد چک برگشتی' },
                                    { key: 'bankDepositChecks', label: 'ه - استرداد چک‌های تسهیلات اقساط بابت واریز بانکی' }
                                ].map((item) => {
                                    const k = item.key as keyof Pick<
                                        LeasingCase['mortgageReleaseOptions'],
                                        'guaranteeDocs' | 'earlySettlementChecks' | 'mortgageReleaseLetter' | 'bouncedCheck' | 'bankDepositChecks'
                                    >;
                                    return (
                                        <label key={k} className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={leasingCase.mortgageReleaseOptions[k]}
                                                onChange={(e) =>
                                                    onChange((p) => ({
                                                        ...p,
                                                        mortgageReleaseOptions: { ...p.mortgageReleaseOptions, [k]: e.target.checked }
                                                    }))
                                                }
                                                className="w-4 h-4 accent-sky-600 rounded"
                                            />
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                            <div className="sm:w-1/2">
                                <label className={labelCls}>نام و نام خانوادگی ارائه‌دهنده اسناد (فرم فک رهن)</label>
                                <input
                                    type="text"
                                    value={leasingCase.mortgageReleaseOptions.presenterName}
                                    onChange={(e) => onChange((p) => ({ ...p, mortgageReleaseOptions: { ...p.mortgageReleaseOptions, presenterName: e.target.value } }))}
                                    placeholder="در صورت تفاوت با خریدار"
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'uploads' && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                تکمیل خودکار مشخصات هنگام آپلود کارت ملی یا شناسنامه اعمال شود روی:
                            </span>
                            <div className="inline-flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
                                {(
                                    [
                                        { id: 'buyer', label: 'خریدار / متقاضی' },
                                        { id: 'guarantor1', label: 'ضامن اول' },
                                        { id: 'guarantor2', label: 'ضامن دوم' }
                                    ] as const
                                ).map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setUploadAutoFillTarget(opt.id)}
                                        className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                                            uploadAutoFillTarget === opt.id
                                                ? 'bg-sky-600 text-white'
                                                : 'text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <DocumentUploadsPanel
                            scopeType="LEASING"
                            scopeId={leasingCase.id}
                            nationalCode={leasingCase.buyer?.nationalCode}
                            customerName={getPersonFullName(leasingCase.buyer)}
                            phone={leasingCase.buyer?.address?.mobilePhone}
                            autoFillRoleLabel={
                                uploadAutoFillTarget === 'guarantor1'
                                    ? 'ضامن اول'
                                    : uploadAutoFillTarget === 'guarantor2'
                                    ? 'ضامن دوم'
                                    : 'خریدار / متقاضی'
                            }
                            onAutoFillFromDocument={(extracted) =>
                                handleAutoFillPerson(uploadAutoFillTarget, extracted)
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
