import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Rocket, 
    Sparkles, 
    Megaphone, 
    Copy, 
    Share2, 
    Download, 
    Plus, 
    Edit, 
    Trash, 
    Search, 
    Check, 
    ChevronLeft, 
    FileText, 
    TrendingUp, 
    DollarSign, 
    Users, 
    BarChart2, 
    Upload, 
    Eye, 
    AlertCircle, 
    FileSpreadsheet, 
    Smartphone, 
    Info, 
    Phone, 
    MapPin, 
    Layers,
    X,
    Filter,
    ArrowRight,
    RotateCw
} from 'lucide-react';
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip as RechartsTooltip, 
    Legend, 
    PieChart, 
    Pie, 
    Cell 
} from 'recharts';
import { 
    getCars, 
    getConditions, 
    getSettings, 
    adCampaignsService 
} from '../services/api';
import { 
    adTitles, 
    adHooks, 
    adCtas, 
    replacePlaceholders, 
    TemplateItem 
} from '../src/data/marketingTemplates';
import type { Car, CarSaleCondition, AdCampaign, MyProfile } from '../types';
import Spinner from '../components/Spinner';

interface AdvertisingPageProps {
    loggedInUser: MyProfile | null;
    initialTab?: 'writer' | 'campaigns' | 'titles' | 'hooks' | 'ctas' | 'contact';
}

export const AdvertisingPage: React.FC<AdvertisingPageProps> = ({ loggedInUser, initialTab = 'writer' }) => {
    const isAdmin = loggedInUser?.isAdmin === 1;
    
    // Page tabs: campaigns (Admin only), writer (All), titles (All), hooks (All), ctas (All), contact (All)
    const [activeTab, setActiveTab] = useState<'writer' | 'campaigns' | 'titles' | 'hooks' | 'ctas' | 'contact'>(initialTab);

    // Sync tab when initialTab prop shifts
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);
    
    // Data lists
    const [cars, setCars] = useState<Car[]>([]);
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [businessSettings, setBusinessSettings] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
    
    // Loadings & Errors
    const [isLoading, setIsLoading] = useState(true);
    const [isCampaignLoading, setIsCampaignLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Global Interactive Placeholders Testing state (at top of templates tabs)
    const [testCarId, setTestCarId] = useState<number | ''>('');
    const [testConditionId, setTestConditionId] = useState<number | ''>('');
    
    // Copywriter selections
    const [writerCarId, setWriterCarId] = useState<number | ''>('');
    const [writerConditionId, setWriterConditionId] = useState<number | ''>('');
    const [selectedTitleId, setSelectedTitleId] = useState<number>(1);
    const [selectedHookId, setSelectedHookId] = useState<number>(1);
    const [selectedCtaId, setSelectedCtaId] = useState<number>(1);
    const [adFormat, setAdFormat] = useState<'sms' | 'divar' | 'instagram' | 'telegram' | 'whatsapp'>('divar');
    
    // Text generator options (inspiration from stats settings modal)
    const [includeSpecs, setIncludeSpecs] = useState(true);
    const [includeComfort, setIncludeComfort] = useState(true);
    const [includeSaleDetails, setIncludeSaleDetails] = useState(true);
    const [includeBusinessInfo, setIncludeBusinessInfo] = useState(true);
    const [customIntroNotes, setCustomIntroNotes] = useState('');
    const [customOutroNotes, setCustomOutroNotes] = useState('');

    // Templates search & pagination
    const [templatesSearch, setTemplatesSearch] = useState('');
    const [templatePage, setTemplatePage] = useState(1);
    const itemsPerPage = 12;

    // Seller Contact Builder State
    const [contactForm, setContactForm] = useState({
        dealershipName: 'اتولید برتر (نمایندگی مجاز فروش خودرو)',
        advisorName: 'مهندس حسینی (مشاور ارشد فروش)',
        phone1: '۰۹۱۲۳۴۵۶۷۸۹',
        phone2: '۰۲۱-۸۸۸۸۹۹۹۹',
        telegram: 'AutoLead_Support',
        instagram: 'autolead_cars',
        website: 'www.autolead.ir',
        slogan: 'اطمینان در خرید، سرعت در تحویل؛ تجربه متمایز خرید خودرو صفر و کارکرده',
        address: 'تهران، خیابان شریعتی، بالاتر از پل سیدخندان، پلاک ۱۲۴',
        workingHours: 'همه روزه از ساعت ۹ صبح الی ۲۱ شب (حتی روزهای تعطیل)',
        cardTheme: 'dark' as 'dark' | 'gold' | 'minimal'
    });

    // Campaign CRUD states
    const [campaignModalOpen, setCampaignModalOpen] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState<AdCampaign | null>(null);
    const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
    const [campaignSearch, setCampaignSearch] = useState('');
    const [campaignPlatformFilter, setCampaignPlatformFilter] = useState<string>('ALL');
    const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>('ALL');
    
    // Campaign form state
    const [campaignForm, setCampaignForm] = useState<Partial<AdCampaign & { screenshotUrl?: string }>>({
        title: '',
        platform: 'INSTAGRAM',
        status: 'ACTIVE',
        budget: 0,
        spent: 0,
        startDate: '',
        endDate: '',
        impressions: 0,
        leads: 0,
        notes: '',
        screenshotUrl: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isContactFetching, setIsContactFetching] = useState(false);

    const fetchContactFromWebhook = async (silent = false) => {
        if (!silent) setIsContactFetching(true);
        try {
            const resp = await fetch('https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/settings');
            if (resp.ok) {
                const data = await resp.json();
                const settings = Array.isArray(data) ? (data[0] || {}) : (data || {});
                
                const getVal = (keys: string[], fallback: string) => {
                    for (const k of keys) {
                        if (settings[k] !== undefined && settings[k] !== null && settings[k] !== '') {
                            return String(settings[k]);
                        }
                    }
                    return fallback;
                };

                const extractHandle = (url: string, defaultValue: string) => {
                    if (!url) return defaultValue;
                    try {
                        const cleaned = url.replace(/\/$/, "");
                        const parts = cleaned.split("/");
                        const lastPart = parts[parts.length - 1];
                        if (lastPart && !lastPart.includes("http") && !lastPart.includes("www")) {
                            return lastPart;
                        }
                    } catch (e) {
                        // ignore
                    }
                    return url;
                };

                const rawPhones = getVal(['contact_phones', 'contactPhones', 'phones', 'phone'], '');
                const rawMobiles = getVal(['mobile_numbers', 'mobileNumbers', 'mobiles', 'mobile'], '');
                
                const phone1 = rawMobiles ? rawMobiles.split(',')[0].trim() : (rawPhones ? rawPhones.split(',')[0].trim() : '');
                const phone2 = rawPhones ? rawPhones.split(',')[0].trim() : '';

                setContactForm(prev => ({
                    ...prev,
                    dealershipName: getVal(['dealership_name', 'dealershipName', 'company_name', 'companyName', 'name', 'title'], prev.dealershipName),
                    advisorName: getVal(['advisor_name', 'advisorName', 'manager', 'sales_manager', 'advisor'], prev.advisorName),
                    phone1: phone1 || prev.phone1,
                    phone2: phone2 || prev.phone2,
                    address: getVal(['address', 'location'], prev.address),
                    instagram: extractHandle(getVal(['instagram_url', 'instagramUrl', 'instagram'], ''), prev.instagram),
                    telegram: extractHandle(getVal(['telegram_channel_url', 'telegramChannelUrl', 'telegram_url', 'telegramUrl', 'telegram'], ''), prev.telegram),
                    website: getVal(['website', 'website_url', 'websiteUrl', 'url'], prev.website),
                    slogan: getVal(['description', 'competitive_advantages', 'slogan'], prev.slogan),
                    workingHours: getVal(['working_hours', 'workingHours', 'hours', 'working_time'], prev.workingHours)
                }));
                if (!silent) {
                    showToast("اطلاعات کاربری با موفقیت از API کسب‌وکار به‌روزرسانی شد.", "success");
                }
            } else {
                if (!silent) showToast("خطا در دریافت اطلاعات از سرور جانبی", "error");
            }
        } catch (error) {
            console.error("Error fetching contact settings:", error);
            if (!silent) showToast("خطا در برقراری ارتباط با وب‌هوک تنظیمات", "error");
        } finally {
            if (!silent) setIsContactFetching(false);
        }
    };

    // Initial load
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch contact builder settings dynamically on mount
                fetchContactFromWebhook(true);

                const [carsData, conditionsData, settingsData] = await Promise.all([
                    getCars().catch(() => []),
                    getConditions().catch(() => []),
                    getSettings().catch(() => null)
                ]);

                setCars(carsData);
                setConditions(conditionsData);

                // Set default selected car & condition for live tester
                if (carsData.length > 0) {
                    setTestCarId(carsData[0].id);
                    setWriterCarId(carsData[0].id);
                    
                    // Preselect matching condition if any
                    const matchingCond = conditionsData.find(c => c.car_model === carsData[0].name);
                    if (matchingCond) {
                        setTestConditionId(matchingCond.id);
                        setWriterConditionId(matchingCond.id);
                    }
                }

                // Load business settings
                if (settingsData) {
                    setBusinessSettings(settingsData);
                } else {
                    // Try direct fetch without auth header fallback
                    const resp = await fetch('https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/settings');
                    if (resp.ok) {
                        const directSettings = await resp.json();
                        if (Array.isArray(directSettings) && directSettings.length > 0) {
                            setBusinessSettings(directSettings[0]);
                        } else {
                            setBusinessSettings(directSettings);
                        }
                    }
                }

                // If user is admin, fetch campaigns
                if (isAdmin) {
                    await fetchCampaigns();
                }
            } catch (err: any) {
                console.error("Error loading advertising data:", err);
                setError("خطا در بارگذاری اطلاعات تبلیغات و بازاریابی. لطفا اینترنت خود را بررسی نمایید.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [isAdmin]);

    // Fetch Campaigns from service
    const fetchCampaigns = async () => {
        setIsCampaignLoading(true);
        try {
            const data = await adCampaignsService.getAll();
            // Load screenshots from localStorage fallback
            const enriched = data.map(camp => {
                const storedScreenshot = localStorage.getItem(`campaign-screenshot-${camp.id}`);
                return {
                    ...camp,
                    screenshotUrl: storedScreenshot || (camp as any).screenshotUrl || ''
                };
            });
            setCampaigns(enriched);
        } catch (e) {
            console.warn("Failed to load campaigns from API, using mock/local storage backup", e);
            // Fallback to local storage campaigns
            const localCamps = localStorage.getItem('localAdCampaigns');
            if (localCamps) {
                setCampaigns(JSON.parse(localCamps));
            } else {
                // Pre-populate with realistic mock campaigns
                const defaultCamps: AdCampaign[] = [
                    { id: 101, title: 'کمپین کلیکی اینستاگرام فیدلیتی', platform: 'INSTAGRAM', status: 'ACTIVE', budget: 45000000, spent: 32000000, startDate: '1405/02/10', impressions: 185000, leads: 420, notes: 'تمرکز روی ساکنین شهرهای بزرگ و علاقمندان به شاسی بلند' },
                    { id: 102, title: 'پیامک انبوه بخشنامه اقساطی دیگنیتی', platform: 'SMS', status: 'COMPLETED', budget: 15000000, spent: 15000000, startDate: '1405/01/15', impressions: 50000, leads: 185, notes: 'ارسال به بانک اطلاعاتی صاحبان خودروهای خارجی در تهران' },
                    { id: 103, title: 'تبلیغ کانال تلگرام قیمت روز خودرو', platform: 'OTHER', status: 'ACTIVE', budget: 20000000, spent: 8500000, startDate: '1405/03/01', impressions: 65000, leads: 98, notes: 'تبلیغات در کانال‌های بزرگ اخبار خودرویی تلگرام' },
                    { id: 104, title: 'بنر وبسایت باما جک S5', platform: 'WEBSITE', status: 'PAUSED', budget: 30000000, spent: 12000000, startDate: '1405/02/01', impressions: 95000, leads: 130, notes: 'بنر متحرک در صفحه اول خرید و فروش خودرو' }
                ];
                localStorage.setItem('localAdCampaigns', JSON.stringify(defaultCamps));
                setCampaigns(defaultCamps);
            }
        } finally {
            setIsCampaignLoading(false);
        }
    };

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Filtered lists for selections
    const selectedCarForWriter = useMemo(() => {
        return cars.find(c => c.id === Number(writerCarId)) || null;
    }, [cars, writerCarId]);

    const conditionsForSelectedWriterCar = useMemo(() => {
        if (!selectedCarForWriter) return [];
        return conditions.filter(cond => cond.car_model === selectedCarForWriter.name);
    }, [conditions, selectedCarForWriter]);

    // Ensure matched condition is preselected when car shifts in Writer tab
    useEffect(() => {
        if (conditionsForSelectedWriterCar.length > 0) {
            setWriterConditionId(conditionsForSelectedWriterCar[0].id);
        } else {
            setWriterConditionId('');
        }
    }, [selectedCarForWriter, conditionsForSelectedWriterCar]);

    const selectedConditionForWriter = useMemo(() => {
        return conditions.find(c => c.id === Number(writerConditionId)) || null;
    }, [conditions, writerConditionId]);

    // Live Testing Selected Items
    const selectedTestCar = useMemo(() => {
        return cars.find(c => c.id === Number(testCarId)) || null;
    }, [cars, testCarId]);

    const selectedTestCondition = useMemo(() => {
        return conditions.find(c => c.id === Number(testConditionId)) || null;
    }, [conditions, testConditionId]);

    // ----------------------------------------------------
    // AD COPY GENERATOR ENGINE (Procedural, no AI API)
    // ----------------------------------------------------
    const generatedAdCopy = useMemo(() => {
        const car = selectedCarForWriter;
        const condition = selectedConditionForWriter;
        const business = businessSettings;

        // 1. Get Title Template
        const titleItem = adTitles.find(t => t.id === selectedTitleId) || adTitles[0];
        const formattedTitle = replacePlaceholders(titleItem.text, car, condition, business);

        // 2. Get Hook Template
        const hookItem = adHooks.find(h => h.id === selectedHookId) || adHooks[0];
        const formattedHook = replacePlaceholders(hookItem.text, car, condition, business);

        // 3. Technical Specifications
        let technicalSection = '';
        if (includeSpecs && car && car.technical_specs) {
            technicalSection = `🔧 مشخصات فنی و عملکرد:\n${car.technical_specs.trim()}`;
        }

        // 4. Comfort Features
        let comfortSection = '';
        if (includeComfort && car && car.comfort_features) {
            comfortSection = `✨ امکانات رفاهی و آپشن‌ها:\n${car.comfort_features.trim()}`;
        }

        // 5. Conditions Details
        let conditionSection = '';
        if (includeSaleDetails && condition) {
            const depositStr = condition.initial_deposit > 0 
                ? `${(condition.initial_deposit / 1000000).toLocaleString('fa-IR')} میلیون تومان` 
                : 'توافقی';
                
            const depositLabel = condition.pay_type === 'نقدی' ? 'قیمت خودرو' : 'پیش‌پرداخت اولیه';
                
            conditionSection = `📊 شرایط و جزئیات فروش:\n` +
                `▫ نوع فروش: ${condition.sale_type}\n` +
                `▫ نحوه پرداخت: ${condition.pay_type}\n` +
                `▫ ${depositLabel}: ${depositStr}\n` +
                `▫ زمان تحویل خودرو: ${condition.delivery_time}\n` +
                `▫ تنوع رنگ موجود: ${condition.colors.join('، ') || 'رنگ‌های مجاز ثبت‌نام'}\n` +
                `▫ وضعیت سند: ${condition.document_status || 'آزاد'}`;
                
            if (condition.descriptions) {
                conditionSection += `\n▫ توضیحات تکمیلی بخشنامه:\n${condition.descriptions.trim()}`;
            }
        }

        // 6. Seller Info & CTA
        const ctaItem = adCtas.find(c => c.id === selectedCtaId) || adCtas[0];
        const formattedCta = replacePlaceholders(ctaItem.text, car, condition, business);

        let sellerSection = '';
        if (includeBusinessInfo && business) {
            const dealershipName = business.dealership_name || 'حسینی خودرو';
            const phones = business.mobile_numbers || business.contact_phones || '';
            const address = business.address || '';
            
            sellerSection = `☎ اطلاعات تماس و هماهنگی خرید:\n` +
                `🏢 ${dealershipName}\n` +
                `📞 تلفن‌های تماس: ${phones}\n` +
                (address ? `📍 آدرس دفتر فروش: ${address}\n` : '') +
                (business.instagram_url ? `📱 اینستاگرام: ${business.instagram_url}\n` : '') +
                (business.telegram_channel_url ? `💬 تلگرام: ${business.telegram_channel_url}\n` : '');
        }

        // Assemble parts based on platform format rules
        let divider = "\n⚡----------------------⚡\n";
        let completeCopy = "";

        if (adFormat === 'sms') {
            // SMS should be compact, high conversion
            completeCopy = `${formattedTitle}\n\n${formattedHook}\n\n${formattedCta}`;
        } else if (adFormat === 'divar') {
            // Divar should be formal, clean, clear specification list
            completeCopy = `${formattedTitle}\n` +
                `${divider}` +
                `${formattedHook}\n\n` +
                (customIntroNotes ? `${customIntroNotes}\n\n` : '') +
                (conditionSection ? `${conditionSection}\n\n` : '') +
                (technicalSection ? `${technicalSection}\n\n` : '') +
                (comfortSection ? `${comfortSection}\n\n` : '') +
                (customOutroNotes ? `${customOutroNotes}\n\n` : '') +
                `${divider}` +
                `${formattedCta}\n\n` +
                `${sellerSection}`;
        } else if (adFormat === 'instagram') {
            // Instagram Caption has emojis, call to action, and hashtags
            const hashtags = `\n\n#${car ? car.name.replace(/\s+/g, '_') : 'خودرو'} #${car ? car.brand.replace(/\s+/g, '_') : 'برند'} #خرید_خودرو #اقساطی #فروش_خودرو #خودرو_صفر #ثبت_نام_خودرو #کرمان_موتور #بهمن_موتور #مدیران_خودرو`;
            
            completeCopy = `🌟 ${formattedTitle} 🌟\n\n` +
                `🔴 ${formattedHook}\n\n` +
                (customIntroNotes ? `${customIntroNotes}\n\n` : '') +
                (conditionSection ? `${conditionSection}\n\n` : '') +
                (technicalSection ? `${technicalSection}\n\n` : '') +
                (comfortSection ? `${comfortSection}\n\n` : '') +
                (customOutroNotes ? `${customOutroNotes}\n\n` : '') +
                `🔥 ${formattedCta}\n\n` +
                `${sellerSection}` +
                `${hashtags}`;
        } else {
            // Telegram and WhatsApp channels
            completeCopy = `📢 **${formattedTitle}**\n\n` +
                `📌 ${formattedHook}\n\n` +
                (customIntroNotes ? `📝 ${customIntroNotes}\n\n` : '') +
                (conditionSection ? `${conditionSection}\n\n` : '') +
                (technicalSection ? `${technicalSection}\n\n` : '') +
                (comfortSection ? `${comfortSection}\n\n` : '') +
                (customOutroNotes ? `💡 ${customOutroNotes}\n\n` : '') +
                `✅ **${formattedCta}**\n\n` +
                `${sellerSection}`;
        }

        return completeCopy.trim();
    }, [
        selectedCarForWriter, 
        selectedConditionForWriter, 
        businessSettings, 
        selectedTitleId, 
        selectedHookId, 
        selectedCtaId, 
        adFormat,
        includeSpecs,
        includeComfort,
        includeSaleDetails,
        includeBusinessInfo,
        customIntroNotes,
        customOutroNotes
    ]);

    const handleCopyAd = () => {
        navigator.clipboard.writeText(generatedAdCopy).then(() => {
            showToast('متن آگهی تبلیغاتی با موفقیت کپی شد!');
        }).catch(() => {
            showToast('خطا در کپی متن آگهی', 'error');
        });
    };

    const handleDownloadAd = () => {
        const carName = selectedCarForWriter ? selectedCarForWriter.name : 'آگهی_خودرو';
        const blob = new Blob([generatedAdCopy], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Ad_${carName}_${adFormat}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('فایل متن آگهی با موفقیت دانلود شد.');
    };

    // Template search/filter logic for Titles, Hooks, CTAs tabs
    const handleTemplateCopy = (text: string) => {
        const car = selectedTestCar;
        const condition = selectedTestCondition;
        const business = businessSettings;
        const formatted = replacePlaceholders(text, car, condition, business);
        
        navigator.clipboard.writeText(formatted).then(() => {
            showToast('متن الگو با متغیرها کپی شد!');
        }).catch(() => {
            showToast('خطا در کپی متن', 'error');
        });
    };

    const searchAndPaginateTemplates = (templates: TemplateItem[]) => {
        const filtered = templates.filter(t => 
            t.text.toLowerCase().includes(templatesSearch.toLowerCase()) || 
            String(t.id).includes(templatesSearch)
        );
        const startIndex = (templatePage - 1) * itemsPerPage;
        const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);

        return { paginated, totalPages, totalCount: filtered.length };
    };

    const titlesData = useMemo(() => searchAndPaginateTemplates(adTitles), [templatesSearch, templatePage]);
    const hooksData = useMemo(() => searchAndPaginateTemplates(adHooks), [templatesSearch, templatePage]);
    const ctasData = useMemo(() => searchAndPaginateTemplates(adCtas), [templatesSearch, templatePage]);

    useEffect(() => {
        setTemplatePage(1);
    }, [templatesSearch, activeTab]);

    // ----------------------------------------------------
    // CAMPAIGN CRUD ACTIONS
    // ----------------------------------------------------
    const handleOpenCreateCampaign = () => {
        setEditingCampaign(null);
        setCampaignForm({
            title: '',
            platform: 'INSTAGRAM',
            status: 'ACTIVE',
            budget: 0,
            spent: 0,
            startDate: new Date().toLocaleDateString('fa-IR'),
            endDate: '',
            impressions: 0,
            leads: 0,
            notes: '',
            screenshotUrl: ''
        });
        setCampaignModalOpen(true);
    };

    const handleOpenEditCampaign = (campaign: AdCampaign) => {
        setEditingCampaign(campaign);
        setCampaignForm({
            ...campaign,
            screenshotUrl: (campaign as any).screenshotUrl || ''
        });
        setCampaignModalOpen(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1.5 * 1024 * 1024) {
                showToast("حجم تصویر بسیار زیاد است (حداکثر ۱.۵ مگابایت)", "error");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCampaignForm(prev => ({ ...prev, screenshotUrl: reader.result as string }));
                showToast("اسکرین شات گزارش تبلیغات با موفقیت بارگذاری شد.");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!campaignForm.title) {
            showToast("لطفا عنوان کمپین را وارد کنید", "error");
            return;
        }

        try {
            let savedCamp: AdCampaign;
            if (editingCampaign) {
                // Update
                const payload = { ...editingCampaign, ...campaignForm };
                delete (payload as any).screenshotUrl; // Strip to avoid giant API payloads
                
                try {
                    savedCamp = await adCampaignsService.update(payload as any);
                } catch {
                    savedCamp = payload as any; // Fallback to local mutation on API issue
                }
                
                // Save screenshot in local storage backup
                if (campaignForm.screenshotUrl) {
                    localStorage.setItem(`campaign-screenshot-${savedCamp.id}`, campaignForm.screenshotUrl);
                } else {
                    localStorage.removeItem(`campaign-screenshot-${savedCamp.id}`);
                }
                
                showToast("کمپین تبلیغاتی با موفقیت ویرایش شد.");
            } else {
                // Create
                const id = Date.now();
                const payload = { id, ...campaignForm };
                delete (payload as any).screenshotUrl;
                
                try {
                    savedCamp = await adCampaignsService.create(payload as any);
                } catch {
                    savedCamp = payload as any;
                }
                
                if (campaignForm.screenshotUrl) {
                    localStorage.setItem(`campaign-screenshot-${savedCamp.id}`, campaignForm.screenshotUrl);
                }
                
                showToast("کمپین تبلیغاتی جدید ثبت شد.");
            }

            // Refresh list
            await fetchCampaigns();
            setCampaignModalOpen(false);
        } catch (err) {
            console.error(err);
            showToast("خطا در ذخیره کمپین", "error");
        }
    };

    const handleDeleteCampaign = async () => {
        if (!campaignToDelete) return;

        try {
            try {
                await adCampaignsService.delete(campaignToDelete.id);
            } catch {
                // If API fails, delete from local storage array backup
                const local = localStorage.getItem('localAdCampaigns');
                if (local) {
                    const parsed = JSON.parse(local).filter((c: any) => c.id !== campaignToDelete.id);
                    localStorage.setItem('localAdCampaigns', JSON.stringify(parsed));
                }
            }
            
            localStorage.removeItem(`campaign-screenshot-${campaignToDelete.id}`);
            showToast("کمپین تبلیغاتی با موفقیت حذف شد.");
            setCampaignToDelete(null);
            await fetchCampaigns();
        } catch (err) {
            showToast("خطا در حذف کمپین", "error");
        }
    };

    // Filter Campaigns list
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter(c => {
            const matchesSearch = c.title.toLowerCase().includes(campaignSearch.toLowerCase()) || 
                                (c.notes && c.notes.toLowerCase().includes(campaignSearch.toLowerCase()));
            const matchesPlatform = campaignPlatformFilter === 'ALL' || c.platform === campaignPlatformFilter;
            const matchesStatus = campaignStatusFilter === 'ALL' || c.status === campaignStatusFilter;
            return matchesSearch && matchesPlatform && matchesStatus;
        });
    }, [campaigns, campaignSearch, campaignPlatformFilter, campaignStatusFilter]);

    // KPI Summary Calculations for Campaigns tab
    const campaignKpiStats = useMemo(() => {
        let totalBudget = 0;
        let totalSpent = 0;
        let totalLeads = 0;
        let totalImpressions = 0;

        filteredCampaigns.forEach(c => {
            totalBudget += c.budget || 0;
            totalSpent += c.spent || 0;
            totalLeads += c.leads || 0;
            totalImpressions += c.impressions || 0;
        });

        const cpl = totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0;
        const ctr = totalImpressions > 0 ? ((totalLeads / totalImpressions) * 100).toFixed(2) : '0';

        return { totalBudget, totalSpent, totalLeads, totalImpressions, cpl, ctr };
    }, [filteredCampaigns]);

    // Charts preparation
    const platformChartData = useMemo(() => {
        const platformsMap: Record<string, { name: string; budget: number; spent: number; leads: number }> = {
            'INSTAGRAM': { name: 'اینستاگرام', budget: 0, spent: 0, leads: 0 },
            'TELEGRAM': { name: 'تلگرام', budget: 0, spent: 0, leads: 0 },
            'WHATSAPP': { name: 'واتساپ', budget: 0, spent: 0, leads: 0 },
            'SMS': { name: 'پیامکی', budget: 0, spent: 0, leads: 0 },
            'BALE': { name: 'بله', budget: 0, spent: 0, leads: 0 },
            'WEBSITE': { name: 'وب‌سایت', budget: 0, spent: 0, leads: 0 },
            'OTHER': { name: 'سایر موارد', budget: 0, spent: 0, leads: 0 },
        };

        campaigns.forEach(c => {
            const platformKey = c.platform || 'OTHER';
            if (platformsMap[platformKey]) {
                platformsMap[platformKey].budget += c.budget || 0;
                platformsMap[platformKey].spent += c.spent || 0;
                platformsMap[platformKey].leads += c.leads || 0;
            }
        });

        return Object.values(platformsMap).filter(p => p.budget > 0 || p.spent > 0 || p.leads > 0);
    }, [campaigns]);

    const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none">
                        <Rocket className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">پنل تخصصی تبلیغات و بازاریابی</h2>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">ابزارهای تبلیغ‌نویسی، الگوهای عنوان و قلاب فروش به همراه مدیریت و آنالیز کمپین‌ها</p>
                    </div>
                </div>
                
                {/* Global Live test settings */}
                {(activeTab === 'titles' || activeTab === 'hooks' || activeTab === 'ctas') && (
                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border dark:border-slate-800">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            تست زنده متغیرها:
                        </span>
                        
                        <select 
                            value={testCarId} 
                            onChange={e => setTestCarId(e.target.value ? Number(e.target.value) : '')}
                            className="text-xs bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-1.5 rounded-lg outline-none max-w-[150px]"
                        >
                            <option value="">-- انتخاب خودرو --</option>
                            {cars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <select 
                            value={testConditionId} 
                            onChange={e => setTestConditionId(e.target.value ? Number(e.target.value) : '')}
                            className="text-xs bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-1.5 rounded-lg outline-none max-w-[150px]"
                        >
                            <option value="">-- انتخاب بخشنامه --</option>
                            {conditions
                                .filter(c => !testCarId || c.car_model === cars.find(car => car.id === testCarId)?.name)
                                .map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.sale_type} ({c.delivery_time})
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                )}
            </div>



            {/* ERROR STATS DISPLAY */}
            {error && (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            {/* TOAST SYSTEM POPUP */}
            {toastMessage && (
                <div className="fixed bottom-24 right-6 z-[100] animate-slide-in">
                    <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-white font-bold text-sm ${
                        toastMessage.type === 'success' ? 'bg-indigo-600' : 'bg-red-600'
                    }`}>
                        <Check className="w-5 h-5" />
                        <span>{toastMessage.text}</span>
                    </div>
                </div>
            )}

            {/* TAB CONTENTS */}
            
            {/* 1. AD COPYWRITER TAB */}
            {activeTab === 'writer' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT PANEL: CONFIG FORM */}
                    <div className="lg:col-span-5 space-y-6 bg-white dark:bg-slate-850 p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-black border-b pb-3 dark:border-slate-800 flex items-center gap-2 text-indigo-600">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            تنظیمات آگهی و کاتالوگ فروش
                        </h3>

                        <div className="space-y-4">
                            {/* Car Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">انتخاب خودرو از کاتالوگ</label>
                                <select 
                                    value={writerCarId} 
                                    onChange={e => setWriterCarId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-4 py-3 rounded-xl outline-none font-bold"
                                >
                                    <option value="">-- لطفاً خودرو را انتخاب کنید --</option>
                                    {cars.map(c => <option key={c.id} value={c.id}>{c.brand} {c.name}</option>)}
                                </select>
                            </div>

                            {/* Conditions circular selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">انتخاب بخشنامه فروش خودرو</label>
                                <select 
                                    value={writerConditionId} 
                                    onChange={e => setWriterConditionId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-4 py-3 rounded-xl outline-none"
                                    disabled={!writerCarId}
                                >
                                    {conditionsForSelectedWriterCar.length === 0 ? (
                                        <option value="">بدون بخشنامه فعال برای این خودرو</option>
                                    ) : (
                                        <>
                                            <option value="">-- بخشنامه مورد نظر را انتخاب کنید --</option>
                                            {conditionsForSelectedWriterCar.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.sale_type} - {c.pay_type} ({c.delivery_time})
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                                {!writerCarId && (
                                    <p className="text-[10px] text-amber-500 mt-1 font-bold">جهت مشاهده بخشنامه‌های فروش ابتدا خودرو را انتخاب کنید.</p>
                                )}
                            </div>

                            {/* Title Selector from 90 templates */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">۱. انتخاب عنوان آگهی (از بین ۹۰ الگوی آماده)</label>
                                <select 
                                    value={selectedTitleId} 
                                    onChange={e => setSelectedTitleId(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-4 py-3 rounded-xl outline-none text-xs leading-relaxed"
                                >
                                    {adTitles.map(t => {
                                        const rendered = replacePlaceholders(t.text, selectedCarForWriter, selectedConditionForWriter, businessSettings);
                                        return (
                                            <option key={t.id} value={t.id}>
                                                عنوان {t.id}: {rendered.substring(0, 60)}...
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Hook Selector from 90 templates */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">۲. انتخاب قلاب جذب مخاطب (از بین ۹۰ الگوی آماده)</label>
                                <select 
                                    value={selectedHookId} 
                                    onChange={e => setSelectedHookId(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-4 py-3 rounded-xl outline-none text-xs leading-relaxed"
                                >
                                    {adHooks.map(h => {
                                        const rendered = replacePlaceholders(h.text, selectedCarForWriter, selectedConditionForWriter, businessSettings);
                                        return (
                                            <option key={h.id} value={h.id}>
                                                قلاب {h.id}: {rendered.substring(0, 60)}...
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* CTA Selector from 90 templates */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">۳. انتخاب کال تو اکشن (از بین ۹۰ الگوی آماده)</label>
                                <select 
                                    value={selectedCtaId} 
                                    onChange={e => setSelectedCtaId(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-4 py-3 rounded-xl outline-none text-xs leading-relaxed"
                                >
                                    {adCtas.map(c => {
                                        const rendered = replacePlaceholders(c.text, selectedCarForWriter, selectedConditionForWriter, businessSettings);
                                        return (
                                            <option key={c.id} value={c.id}>
                                                اقدام {c.id}: {rendered.substring(0, 60)}...
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Section Toggles (Inspiration from settings copying) */}
                            <div className="border-t pt-4 dark:border-slate-800 space-y-3">
                                <span className="block text-xs font-black text-slate-500 dark:text-slate-400">بخش‌های فعال در آگهی پایانی:</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border dark:border-slate-750 text-xs">
                                        <input type="checkbox" checked={includeSpecs} onChange={e => setIncludeSpecs(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        <span>مشخصات فنی خودرو</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border dark:border-slate-750 text-xs">
                                        <input type="checkbox" checked={includeComfort} onChange={e => setIncludeComfort(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        <span>آپشن‌ها و امکانات رفاهی</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border dark:border-slate-750 text-xs">
                                        <input type="checkbox" checked={includeSaleDetails} onChange={e => setIncludeSaleDetails(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        <span>جزئیات شرایط فروش</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border dark:border-slate-750 text-xs">
                                        <input type="checkbox" checked={includeBusinessInfo} onChange={e => setIncludeBusinessInfo(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        <span>مشخصات تماس فروشنده</span>
                                    </label>
                                </div>
                            </div>

                            {/* Custom notes to inject */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">توضیحات اختصاصی ابتدای آگهی (اختیاری)</label>
                                    <input 
                                        type="text"
                                        placeholder="مثلاً: هدیه نفیس نمایندگی ما به خریداران نقدی..."
                                        value={customIntroNotes}
                                        onChange={e => setCustomIntroNotes(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3 py-2 rounded-lg text-xs outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">توضیحات اختصاصی انتهای آگهی (اختیاری)</label>
                                    <input 
                                        type="text"
                                        placeholder="مثلاً: ساعات پاسخگویی ۸ الی ۲۲ روزهای اداری..."
                                        value={customOutroNotes}
                                        onChange={e => setCustomOutroNotes(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-3 py-2 rounded-lg text-xs outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: PREVIEW AREA */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex flex-col h-full min-h-[500px]">
                            
                            {/* Platform selector format switcher */}
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 dark:border-slate-800 mb-6">
                                <h3 className="text-lg font-black flex items-center gap-2">
                                    <Smartphone className="w-5 h-5 text-indigo-500" />
                                    پیش‌نمایش زنده خروجی آگهی
                                </h3>
                                
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-lg text-xs">
                                    <button 
                                        onClick={() => setAdFormat('divar')}
                                        className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                                            adFormat === 'divar' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'
                                        }`}
                                    >
                                        سایت دیوار
                                    </button>
                                    <button 
                                        onClick={() => setAdFormat('instagram')}
                                        className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                                            adFormat === 'instagram' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'
                                        }`}
                                    >
                                        کپشن اینستاگرام
                                    </button>
                                    <button 
                                        onClick={() => setAdFormat('sms')}
                                        className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                                            adFormat === 'sms' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'
                                        }`}
                                    >
                                        پیام کوتاه (SMS)
                                    </button>
                                    <button 
                                        onClick={() => setAdFormat('telegram')}
                                        className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                                            adFormat === 'telegram' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'
                                        }`}
                                    >
                                        تلگرام / واتساپ
                                    </button>
                                </div>
                            </div>

                            {/* PREVIEW BOX */}
                            <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl relative">
                                <div className="absolute top-3 left-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded text-[10px] font-black border dark:border-indigo-900">
                                    فرمت: {adFormat === 'divar' ? 'سایت دیوار' : adFormat === 'instagram' ? 'پست اینستاگرام' : adFormat === 'sms' ? 'پیامک تبلیغاتی' : 'پیام‌رسان اجتماعی'}
                                </div>
                                
                                <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed dark:text-slate-200 break-words mt-4 overflow-y-auto max-h-[500px] select-all">
                                    {generatedAdCopy}
                                </div>
                            </div>

                            {/* PREVIEW ACTION BAR */}
                            <div className="flex gap-3 justify-end mt-6 pt-4 border-t dark:border-slate-800">
                                <button 
                                    onClick={handleDownloadAd}
                                    className="px-5 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold rounded-xl border dark:border-slate-800 transition-all flex items-center gap-2 text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    دانلود فایل متنی (.txt)
                                </button>
                                
                                <button 
                                    onClick={handleCopyAd}
                                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 text-sm"
                                >
                                    <Copy className="w-5 h-5" />
                                    کپی کل متن آگهی
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* 2. ADVERTISING CAMPAIGNS ADMIN TAB */}
            {activeTab === 'campaigns' && isAdmin && (
                <div className="space-y-8 animate-fade-in">
                    
                    {/* KPI TOP ROW */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-xs font-black text-slate-500 dark:text-slate-400">کل بودجه تخصیص یافته</span>
                                <h4 className="text-xl lg:text-2xl font-black text-slate-800 dark:text-white mt-1">
                                    {(campaignKpiStats.totalBudget / 1000000).toLocaleString('fa-IR')} <span className="text-xs font-bold text-slate-400">میلیون ت</span>
                                </h4>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-xs font-black text-slate-500 dark:text-slate-400">کل هزینه مصرف شده</span>
                                <h4 className="text-xl lg:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                    {(campaignKpiStats.totalSpent / 1000000).toLocaleString('fa-IR')} <span className="text-xs font-bold text-slate-400">میلیون ت</span>
                                </h4>
                            </div>
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-xs font-black text-slate-500 dark:text-slate-400">تعداد کل لیدهای دریافتی</span>
                                <h4 className="text-xl lg:text-2xl font-black text-amber-500 mt-1">
                                    {campaignKpiStats.totalLeads.toLocaleString('fa-IR')} <span className="text-xs font-bold text-slate-400">مشتری راغب</span>
                                </h4>
                            </div>
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-xl">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-xs font-black text-slate-500 dark:text-slate-400">میانگین هزینه جذب (CPL)</span>
                                <h4 className="text-xl lg:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                                    {campaignKpiStats.cpl.toLocaleString('fa-IR')} <span className="text-xs font-bold text-slate-400">تومان</span>
                                </h4>
                            </div>
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <BarChart2 className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* CHARTS GRAPH SECTION */}
                    {platformChartData.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
                                <h4 className="text-sm font-black mb-6 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-sky-500" />
                                    مقایسه بودجه و هزینه مصرفی بر اساس پلتفرم
                                </h4>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={platformChartData}>
                                            <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                                            <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Bar dataKey="budget" name="بودجه تخصیصی" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="spent" name="هزینه واقعی" fill="#0284c7" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
                                <h4 className="text-sm font-black mb-6 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-500" />
                                    سهم جذب لید (مشتری راغب) بر اساس پلتفرم تبلیغاتی
                                </h4>
                                <div className="h-64 flex flex-col md:flex-row items-center justify-around">
                                    <div className="w-full md:w-1/2 h-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={platformChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="leads"
                                                >
                                                    {platformChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip formatter={(val) => `${val} لید`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-1 text-xs font-bold">
                                        {platformChartData.map((item, index) => (
                                            <div key={item.name} className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                <span className="text-slate-500 dark:text-slate-400">{item.name}:</span>
                                                <span className="text-slate-800 dark:text-slate-200">{item.leads.toLocaleString('fa-IR')} لید</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACTIONS BAR & SEARCH FILTERS */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl border dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                                <input 
                                    type="text"
                                    placeholder="جستجو در کمپین‌ها..."
                                    value={campaignSearch}
                                    onChange={e => setCampaignSearch(e.target.value)}
                                    className="bg-white dark:bg-slate-800 border dark:border-slate-700 pr-9 pl-4 py-2 rounded-xl text-xs outline-none w-full md:w-64"
                                />
                            </div>

                            <select 
                                value={campaignPlatformFilter}
                                onChange={e => setCampaignPlatformFilter(e.target.value)}
                                className="bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-2 rounded-xl text-xs outline-none"
                            >
                                <option value="ALL">همه پلتفرم‌ها</option>
                                <option value="INSTAGRAM">اینستاگرام</option>
                                <option value="TELEGRAM">تلگرام</option>
                                <option value="WHATSAPP">واتساپ</option>
                                <option value="SMS">پیامک</option>
                                <option value="BALE">بله</option>
                                <option value="WEBSITE">وب‌سایت</option>
                                <option value="OTHER">سایر موارد</option>
                            </select>

                            <select 
                                value={campaignStatusFilter}
                                onChange={e => setCampaignStatusFilter(e.target.value)}
                                className="bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-2 rounded-xl text-xs outline-none"
                            >
                                <option value="ALL">همه وضعیت‌ها</option>
                                <option value="ACTIVE">فعال</option>
                                <option value="PAUSED">متوقف شده</option>
                                <option value="COMPLETED">پایان یافته</option>
                                <option value="DRAFT">پیش‌نویس</option>
                            </select>
                        </div>

                        <button 
                            onClick={handleOpenCreateCampaign}
                            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-xs flex items-center gap-2 self-start md:self-auto"
                        >
                            <Plus className="w-4 h-4" />
                            ثبت کمپین تبلیغاتی جدید
                        </button>
                    </div>

                    {/* GRID TABLE LIST */}
                    {isCampaignLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Spinner />
                        </div>
                    ) : filteredCampaigns.length === 0 ? (
                        <div className="bg-white dark:bg-slate-850 p-12 text-center border dark:border-slate-800 rounded-2xl">
                            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 font-bold">هیچ کمپین تبلیغاتی یافت نشد.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCampaigns.map(camp => (
                                <div key={camp.id} className="bg-white dark:bg-slate-850 border dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-indigo-400 dark:hover:border-indigo-400 transition-all flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                                camp.platform === 'INSTAGRAM' ? 'bg-pink-100 text-pink-700' :
                                                camp.platform === 'TELEGRAM' ? 'bg-sky-100 text-sky-700' :
                                                camp.platform === 'SMS' ? 'bg-orange-100 text-orange-700' :
                                                camp.platform === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {camp.platform}
                                            </span>
                                            
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                camp.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                                                camp.status === 'PAUSED' ? 'bg-amber-500/10 text-amber-600' :
                                                'bg-slate-500/10 text-slate-500'
                                            }`}>
                                                {camp.status === 'ACTIVE' ? 'در حال اجرا' : camp.status === 'PAUSED' ? 'متوقف' : 'پایان یافته'}
                                            </span>
                                        </div>

                                        <h4 className="font-black text-base text-slate-800 dark:text-white leading-tight">{camp.title}</h4>
                                        {camp.notes && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{camp.notes}</p>}
                                        
                                        {/* Date metrics */}
                                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold border-b pb-2 dark:border-slate-800">
                                            <span>شروع: {camp.startDate || 'نامشخص'}</span>
                                            {camp.endDate && <span>پایان: {camp.endDate}</span>}
                                        </div>

                                        {/* Financial metrics */}
                                        <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                                            <div>
                                                <span className="block text-[10px] text-slate-400 font-bold">بودجه مصوب</span>
                                                <span className="font-bold">{(camp.budget || 0).toLocaleString('fa-IR')} ت</span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] text-slate-400 font-bold">هزینه مصرفی</span>
                                                <span className="font-bold text-red-500">{(camp.spent || 0).toLocaleString('fa-IR')} ت</span>
                                            </div>
                                        </div>

                                        {/* Conversion metrics */}
                                        <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border dark:border-slate-800">
                                            <div>
                                                <span className="block text-[9px] text-slate-400 font-bold">بازدید (Imp)</span>
                                                <span className="font-black">{(camp.impressions || 0).toLocaleString('fa-IR')}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] text-slate-400 font-bold">لیدها</span>
                                                <span className="font-black text-amber-500">{(camp.leads || 0).toLocaleString('fa-IR')}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] text-slate-400 font-bold">هزینه/لید</span>
                                                <span className="font-black text-indigo-500">
                                                    {camp.leads && camp.leads > 0 ? Math.round((camp.spent || 0) / camp.leads).toLocaleString('fa-IR') : '۰'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Screenshots attached */}
                                        {(camp as any).screenshotUrl && (
                                            <div className="relative border dark:border-slate-800 rounded-xl overflow-hidden group">
                                                <img 
                                                    src={(camp as any).screenshotUrl} 
                                                    alt="screenshot" 
                                                    className="w-full h-24 object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity" 
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                                     onClick={() => {
                                                         const win = window.open();
                                                         win?.document.write(`<img src="${(camp as any).screenshotUrl}" style="max-width:100%; max-height:100%; margin:auto; display:block;" />`);
                                                     }}
                                                >
                                                    <span className="text-[10px] text-white font-bold bg-slate-900/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                                        <Eye className="w-3.5 h-3.5" />
                                                        مشاهده گزارش اسکرین شات
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2 justify-end border-t pt-3 dark:border-slate-800 mt-4">
                                        <button 
                                            onClick={() => handleOpenEditCampaign(camp)}
                                            className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded-lg transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => setCampaignToDelete(camp)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 3. ADVERTISING READY-MADE TEMPLATES LISTING (TITLES, HOOKS, CTAs) */}
            {(activeTab === 'titles' || activeTab === 'hooks' || activeTab === 'ctas') && (
                <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-6">
                    {/* Inner search & title info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
                        <div>
                            <h3 className="text-lg font-black flex items-center gap-2">
                                {activeTab === 'titles' ? <Layers className="w-5 h-5 text-indigo-500" /> :
                                 activeTab === 'hooks' ? <Sparkles className="w-5 h-5 text-amber-500" /> :
                                 <Rocket className="w-5 h-5 text-emerald-500" />}
                                {activeTab === 'titles' ? 'title ساز' :
                                 activeTab === 'hooks' ? 'hook ساز' :
                                 'کتابخانه اختصاصی کال تو اکشن (CTA)'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">تعداد ۹۰ عنوان آماده. جهت تست زنده، متغیرهای خودرو و بخشنامه را در هدر بالای صفحه تغییر دهید.</p>
                        </div>

                        {/* Search templates input */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                            <input 
                                type="text"
                                placeholder="جستجوی شماره یا کلمات در الگوها..."
                                value={templatesSearch}
                                onChange={e => setTemplatesSearch(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-850 border dark:border-slate-700 pr-9 pl-4 py-2 rounded-xl text-xs outline-none w-full md:w-64"
                            />
                        </div>
                    </div>

                    {/* TEMPLATES GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(() => {
                            const data = activeTab === 'titles' ? titlesData : activeTab === 'hooks' ? hooksData : ctasData;
                            if (data.paginated.length === 0) {
                                return (
                                    <div className="col-span-full py-12 text-center text-slate-400">
                                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        هیچ الگوی منطبقی یافت نشد.
                                    </div>
                                );
                            }

                            return data.paginated.map(item => {
                                const replaced = replacePlaceholders(
                                    item.text,
                                    selectedTestCar,
                                    selectedTestCondition,
                                    businessSettings
                                );

                                return (
                                    <div key={item.id} className="border dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 hover:border-indigo-400 dark:hover:border-indigo-800 transition-all flex flex-col justify-between group">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-slate-400">الگوی شماره {item.id}</span>
                                                <button 
                                                    onClick={() => handleTemplateCopy(item.text)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md transition-all"
                                                    title="کپی کردن با متغیرها"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            {/* Processed live output */}
                                            <p className="text-sm font-medium leading-relaxed dark:text-slate-200">{replaced}</p>
                                        </div>
                                        
                                        {/* Raw template preview on hover */}
                                        <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-mono hidden group-hover:block">
                                            الگوی خام: {item.text}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {/* PAGINATION */}
                    {(() => {
                        const data = activeTab === 'titles' ? titlesData : activeTab === 'hooks' ? hooksData : ctasData;
                        if (data.totalPages <= 1) return null;

                        return (
                            <div className="flex items-center justify-between border-t pt-4 dark:border-slate-800">
                                <span className="text-xs text-slate-500 font-bold">
                                    نمایش {Math.min(data.totalCount, (templatePage - 1) * itemsPerPage + 1)} تا {Math.min(data.totalCount, templatePage * itemsPerPage)} از کل {data.totalCount} الگو
                                </span>

                                <div className="flex items-center gap-1">
                                    <button
                                        disabled={templatePage === 1}
                                        onClick={() => setTemplatePage(p => p - 1)}
                                        className="p-2 border dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4 transform rotate-180" />
                                    </button>
                                    
                                    {Array.from({ length: data.totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setTemplatePage(i + 1)}
                                            className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
                                                templatePage === i + 1
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            {(i + 1).toLocaleString('fa-IR')}
                                        </button>
                                    ))}

                                    <button
                                        disabled={templatePage === data.totalPages}
                                        onClick={() => setTemplatePage(p => p + 1)}
                                        className="p-2 border dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* 6. SELLER CONTACT BUILDER & DIGITAL BUSINESS CARD GENERATOR */}
            {activeTab === 'contact' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Right column: Form Inputs */}
                    <div className="lg:col-span-5 bg-white dark:bg-slate-850 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-indigo-500" />
                                    contact ساز
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">مشخصات کاری خود را وارد کنید تا کارت ویزیت دیجیتال و پاورقی‌های آماده برای شما ساخته شود.</p>
                            </div>
                            <button
                                onClick={() => fetchContactFromWebhook(false)}
                                disabled={isContactFetching}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/80 transition-all disabled:opacity-50"
                                title="دریافت اطلاعات مجدد از وب‌هوک تنظیمات کسب‌وکار"
                            >
                                <RotateCw className={`w-3.5 h-3.5 ${isContactFetching ? 'animate-spin' : ''}`} />
                                {isContactFetching ? 'دریافت...' : 'به‌روزرسانی از API'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">نام گالری / مجموعه یا نمایندگی</label>
                                <input
                                    type="text"
                                    value={contactForm.dealershipName}
                                    onChange={e => setContactForm(prev => ({ ...prev, dealershipName: e.target.value }))}
                                    className="w-full text-xs px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                                    placeholder="مثلا: گالری خودرو ممتاز"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">نام کارشناس فروش / مشاور</label>
                                <input
                                    type="text"
                                    value={contactForm.advisorName}
                                    onChange={e => setContactForm(prev => ({ ...prev, advisorName: e.target.value }))}
                                    className="w-full text-xs px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                                    placeholder="مثلا: مهندس کریمی"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">شماره همراه کارشناس</label>
                                    <input
                                        type="text"
                                        value={contactForm.phone1}
                                        onChange={e => setContactForm(prev => ({ ...prev, phone1: e.target.value }))}
                                        className="w-full text-xs px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-left"
                                        dir="ltr"
                                        placeholder="۰۹۱۲..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">تلفن دفتر فروش / ثابت</label>
                                    <input
                                        type="text"
                                        value={contactForm.phone2}
                                        onChange={e => setContactForm(prev => ({ ...prev, phone2: e.target.value }))}
                                        className="w-full text-xs px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-left"
                                        dir="ltr"
                                        placeholder="۰۲۱-..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">آیدی تلگرام</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono" dir="ltr">@</span>
                                        <input
                                            type="text"
                                            value={contactForm.telegram}
                                            onChange={e => setContactForm(prev => ({ ...prev, telegram: e.target.value }))}
                                            className="w-full text-xs pl-4 pr-7 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">آیدی اینستاگرام</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono" dir="ltr">@</span>
                                        <input
                                            type="text"
                                            value={contactForm.instagram}
                                            onChange={e => setContactForm(prev => ({ ...prev, instagram: e.target.value }))}
                                            className="w-full text-xs pl-4 pr-7 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">آدرس وب‌سایت</label>
                                    <input
                                        type="text"
                                        value={contactForm.website}
                                        onChange={e => setContactForm(prev => ({ ...prev, website: e.target.value }))}
                                        className="w-full text-xs px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-left"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">شعار گالری یا توضیحات خدمات</label>
                                <textarea
                                    rows={2}
                                    value={contactForm.slogan}
                                    onChange={e => setContactForm(prev => ({ ...prev, slogan: e.target.value }))}
                                    className="w-full text-xs px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                                    placeholder="شعار تبلیغاتی یا معرفی کوتاه فعالیت‌های شما..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">آدرس حضوری گالری / دفتر فروش</label>
                                <input
                                    type="text"
                                    value={contactForm.address}
                                    onChange={e => setContactForm(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full text-xs px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                                    placeholder="آدرس دقیق جهت مراجعه حضوری خریداران"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">ساعات کاری و پاسخگویی</label>
                                <input
                                    type="text"
                                    value={contactForm.workingHours}
                                    onChange={e => setContactForm(prev => ({ ...prev, workingHours: e.target.value }))}
                                    className="w-full text-xs px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                                    placeholder="ساعات پاسخگویی یا بازدید خودروها"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Left Column: Visual Card Preview & Generated Formats */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Interactive Digital Business Card */}
                        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    پیش‌نمایش کارت ویزیت دیجیتال شما
                                </h4>
                                
                                {/* Theme Picker */}
                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg gap-1 text-[10px] font-bold">
                                    <button
                                        onClick={() => setContactForm(prev => ({ ...prev, cardTheme: 'dark' }))}
                                        className={`px-3 py-1.5 rounded-md transition-all ${
                                            contactForm.cardTheme === 'dark'
                                                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400'
                                        }`}
                                    >
                                        کهکشانی تیره
                                    </button>
                                    <button
                                        onClick={() => setContactForm(prev => ({ ...prev, cardTheme: 'gold' }))}
                                        className={`px-3 py-1.5 rounded-md transition-all ${
                                            contactForm.cardTheme === 'gold'
                                                ? 'bg-amber-600 text-white shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400'
                                        }`}
                                    >
                                        طلایی مجلل
                                    </button>
                                    <button
                                        onClick={() => setContactForm(prev => ({ ...prev, cardTheme: 'minimal' }))}
                                        className={`px-3 py-1.5 rounded-md transition-all ${
                                            contactForm.cardTheme === 'minimal'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400'
                                        }`}
                                    >
                                        مینیمال مدرن
                                    </button>
                                </div>
                            </div>

                            {/* Digital Card render */}
                            <div className="relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
                                {contactForm.cardTheme === 'dark' && (
                                    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 border border-indigo-500/20 shadow-2xl relative text-white">
                                        {/* Background accent glow */}
                                        <div className="absolute right-0 bottom-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
                                        <div className="absolute left-0 top-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>

                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6 relative z-10">
                                            <div className="flex flex-col justify-between flex-1 space-y-4">
                                                <div>
                                                    <span className="text-[10px] tracking-widest text-indigo-400 font-bold uppercase block mb-1">کارت ویزیت الکترونیک</span>
                                                    <h2 className="text-xl font-black tracking-tight text-white">{contactForm.dealershipName}</h2>
                                                    <p className="text-xs text-slate-400 mt-1 font-medium">{contactForm.slogan}</p>
                                                </div>

                                                <div className="space-y-2 text-xs border-t border-slate-800/80 pt-4">
                                                    <div className="flex items-center gap-2 text-slate-300">
                                                        <Phone className="w-4 h-4 text-indigo-400" />
                                                        <span className="font-bold">مستقیم: {contactForm.phone1}</span>
                                                        {contactForm.phone2 && <span className="text-slate-500">|</span>}
                                                        {contactForm.phone2 && <span>ثابت: {contactForm.phone2}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-300">
                                                        <MapPin className="w-4 h-4 text-cyan-400" />
                                                        <span className="line-clamp-1">{contactForm.address}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between items-start md:items-end text-right md:border-r md:border-slate-800 pr-0 md:pr-6 md:min-w-[180px]">
                                                <div className="space-y-1">
                                                    <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-full inline-block">
                                                        کارشناس مجرب
                                                    </div>
                                                    <h3 className="text-md font-bold text-slate-200 mt-1">{contactForm.advisorName}</h3>
                                                </div>

                                                <div className="mt-4 md:mt-0 space-y-1.5 text-right font-mono text-[10px] text-slate-400">
                                                    <div>📸 {contactForm.instagram}</div>
                                                    <div>🆔 t.me/{contactForm.telegram}</div>
                                                    <div>🌐 {contactForm.website}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {contactForm.cardTheme === 'gold' && (
                                    <div className="bg-gradient-to-br from-amber-50 via-amber-100/50 to-amber-50 p-8 border border-amber-200 shadow-xl relative text-amber-950">
                                        {/* Golden design accent frames */}
                                        <div className="absolute top-4 right-4 left-4 bottom-4 border border-amber-400/20 rounded-xl pointer-events-none"></div>
                                        <div className="absolute top-6 right-6 left-6 bottom-6 border border-amber-400/10 rounded-lg pointer-events-none"></div>

                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6 relative z-10">
                                            <div className="flex flex-col justify-between flex-1 space-y-4">
                                                <div>
                                                    <span className="text-[10px] tracking-widest text-amber-700 font-black uppercase block mb-1">VIP DIGITAL CARD</span>
                                                    <h2 className="text-xl font-black text-amber-900">{contactForm.dealershipName}</h2>
                                                    <p className="text-xs text-amber-800/80 mt-1 font-bold italic">{contactForm.slogan}</p>
                                                </div>

                                                <div className="space-y-2 text-xs border-t border-amber-300/30 pt-4">
                                                    <div className="flex items-center gap-2 text-amber-900">
                                                        <Phone className="w-4 h-4 text-amber-600" />
                                                        <span className="font-bold">مستقیم: {contactForm.phone1}</span>
                                                        {contactForm.phone2 && <span className="text-amber-400">|</span>}
                                                        {contactForm.phone2 && <span>ثابت: {contactForm.phone2}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-amber-900">
                                                        <MapPin className="w-4 h-4 text-amber-600" />
                                                        <span className="line-clamp-1">{contactForm.address}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between items-start md:items-end text-right md:border-r md:border-amber-300/40 pr-0 md:pr-6 md:min-w-[180px]">
                                                <div className="space-y-1">
                                                    <div className="bg-amber-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block shadow-sm">
                                                        نماینده برتر VIP
                                                    </div>
                                                    <h3 className="text-md font-bold text-amber-900 mt-1">{contactForm.advisorName}</h3>
                                                </div>

                                                <div className="mt-4 md:mt-0 space-y-1.5 text-right font-mono text-[10px] text-amber-800/80 font-bold">
                                                    <div>📸 Instagram: {contactForm.instagram}</div>
                                                    <div>🆔 Telegram: {contactForm.telegram}</div>
                                                    <div>🌐 Web: {contactForm.website}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {contactForm.cardTheme === 'minimal' && (
                                    <div className="bg-white dark:bg-slate-900 p-8 border dark:border-slate-800 shadow-lg relative text-slate-800 dark:text-slate-100">
                                        {/* Minimal sleek border highlight */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600"></div>

                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6 relative z-10">
                                            <div className="flex flex-col justify-between flex-1 space-y-4">
                                                <div>
                                                    <span className="text-[9px] tracking-wider text-slate-400 dark:text-slate-500 font-bold uppercase block mb-1">مشخصات رسمی فروش</span>
                                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{contactForm.dealershipName}</h2>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{contactForm.slogan}</p>
                                                </div>

                                                <div className="space-y-2 text-xs pt-4">
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                        <Phone className="w-4 h-4 text-indigo-500" />
                                                        <span className="font-bold">همراه: {contactForm.phone1}</span>
                                                        {contactForm.phone2 && <span className="text-slate-300 dark:text-slate-700">|</span>}
                                                        {contactForm.phone2 && <span>ثابت: {contactForm.phone2}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                        <MapPin className="w-4 h-4 text-indigo-500" />
                                                        <span className="line-clamp-1">{contactForm.address}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between items-start md:items-end text-right md:border-r dark:border-slate-800 pr-0 md:pr-6 md:min-w-[180px]">
                                                <div className="space-y-1">
                                                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-black block">کارشناس رسمی فروش خودرو</span>
                                                    <h3 className="text-md font-bold text-slate-900 dark:text-white">{contactForm.advisorName}</h3>
                                                </div>

                                                <div className="mt-4 md:mt-0 space-y-1 text-right text-[10px] text-slate-500 dark:text-slate-400">
                                                    <div>اینستاگرام: {contactForm.instagram}</div>
                                                    <div>تلگرام: @{contactForm.telegram}</div>
                                                    <div>سایت: {contactForm.website}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        const cardTxt = `🏢 نمایندگی: ${contactForm.dealershipName}\n👤 کارشناس فروش: ${contactForm.advisorName}\n📞 همراه: ${contactForm.phone1}\n☎️ دفتر: ${contactForm.phone2}\n📸 اینستاگرام: ${contactForm.instagram}\n🆔 تلگرام: @${contactForm.telegram}\n🌐 وبسایت: ${contactForm.website}\n📍 آدرس: ${contactForm.address}\n🕒 ساعت پاسخگویی: ${contactForm.workingHours}`;
                                        navigator.clipboard.writeText(cardTxt);
                                        showToast('مشخصات کارت ویزیت در حافظه کپی شد!');
                                    }}
                                    className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
                                >
                                    <Copy className="w-4 h-4" />
                                    کپی تمام اطلاعات کارت ویزیت
                                </button>
                            </div>
                        </div>

                        {/* Text Formats & Ready Text Templates */}
                        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border dark:border-slate-800 shadow-sm space-y-5">
                            <div>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                                    متون آماده و پاورقی‌های تولید شده برای آگهی
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">از فرمت‌های زیر در انتهای پست‌ها، آگهی‌های دیوار و پیامک‌ها استفاده کنید.</p>
                            </div>

                            <div className="space-y-4">
                                {/* 1. Classic Divar Footer */}
                                <div className="border dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300">فرمت ۱: پاورقی استاندارد شیپور و دیوار</span>
                                        <button
                                            onClick={() => {
                                                const txt = `🏢 نمایندگی: ${contactForm.dealershipName}\n👤 کارشناس فروش: ${contactForm.advisorName}\n📞 تلفن همراه: ${contactForm.phone1}\n☎️ تلفن دفتر: ${contactForm.phone2}\n📍 آدرس حضوری: ${contactForm.address}\n🕒 ساعت کاری: ${contactForm.workingHours}\n✨ جهت هماهنگی و بازدید تماس بگیرید.`;
                                                navigator.clipboard.writeText(txt);
                                                showToast('پاورقی دیوار کپی شد!');
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all"
                                            title="کپی کردن"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border dark:border-slate-800 text-[11px] leading-relaxed font-sans space-y-1 text-slate-700 dark:text-slate-300 whitespace-pre-line">
                                        {`🏢 نمایندگی: ${contactForm.dealershipName}\n👤 کارشناس فروش: ${contactForm.advisorName}\n📞 تلفن همراه: ${contactForm.phone1}\n☎️ تلفن دفتر: ${contactForm.phone2}\n📍 آدرس حضوری: ${contactForm.address}\n🕒 ساعت کاری: ${contactForm.workingHours}\n✨ جهت هماهنگی و بازدید تماس بگیرید.`}
                                    </div>
                                </div>

                                {/* 2. Telegram VIP Card */}
                                <div className="border dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300">فرمت ۲: شناسنامه ارتباطی VIP (تلگرام و ایتا)</span>
                                        <button
                                            onClick={() => {
                                                const txt = `🌟 ${contactForm.slogan}\n━━━━━━━━━━━━━━━━━━━━\n🏢 مجموعه: ${contactForm.dealershipName}\n🤝 مشاور شما: ${contactForm.advisorName}\n📞 تماس مستقیم: ${contactForm.phone1}\n☎️ تلفن دفتر: ${contactForm.phone2}\n🆔 تلگرام: @${contactForm.telegram}\n📸 اینستاگرام: ${contactForm.instagram}\n📍 آدرس مراجعه: ${contactForm.address}\n🕒 ساعت پاسخگویی: ${contactForm.workingHours}`;
                                                navigator.clipboard.writeText(txt);
                                                showToast('فرمت تلگرام کپی شد!');
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all"
                                            title="کپی کردن"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border dark:border-slate-800 text-[11px] leading-relaxed font-sans space-y-1 text-slate-700 dark:text-slate-300 whitespace-pre-line">
                                        {`🌟 ${contactForm.slogan}\n━━━━━━━━━━━━━━━━━━━━\n🏢 مجموعه: ${contactForm.dealershipName}\n🤝 مشاور شما: ${contactForm.advisorName}\n📞 تماس مستقیم: ${contactForm.phone1}\n☎️ تلفن دفتر: ${contactForm.phone2}\n🆔 تلگرام: @${contactForm.telegram}\n📸 اینستاگرام: ${contactForm.instagram}\n📍 آدرس مراجعه: ${contactForm.address}\n🕒 ساعت پاسخگویی: ${contactForm.workingHours}`}
                                    </div>
                                </div>

                                {/* 3. Minimal SMS Style */}
                                <div className="border dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300">فرمت ۳: امضای پیامکی (کوتاه و ارزان)</span>
                                        <button
                                            onClick={() => {
                                                const txt = `${contactForm.dealershipName}\nمشاور: ${contactForm.advisorName}\nتلفن: ${contactForm.phone1}\nآدرس: ${contactForm.address}\nساعت بازدید: ${contactForm.workingHours}`;
                                                navigator.clipboard.writeText(txt);
                                                showToast('امضای پیامک کپی شد!');
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all"
                                            title="کپی کردن"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border dark:border-slate-800 text-[11px] leading-relaxed font-sans space-y-1 text-slate-700 dark:text-slate-300 whitespace-pre-line">
                                        {`${contactForm.dealershipName}\nمشاور: ${contactForm.advisorName}\nتلفن: ${contactForm.phone1}\nآدرس: ${contactForm.address}\nساعت بازدید: ${contactForm.workingHours}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* 4. DIALOG MODALS SECTION                             */}
            {/* ---------------------------------------------------- */}

            {/* CREATE/EDIT CAMPAIGN MODAL (ADMIN ONLY) */}
            {campaignModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] p-4 backdrop-blur-sm" onClick={() => setCampaignModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col animate-scale-up" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b dark:border-slate-800">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-indigo-500" />
                                {editingCampaign ? 'ویرایش اطلاعات کمپین تبلیغاتی' : 'ثبت کمپین تبلیغاتی جدید'}
                            </h3>
                            <button onClick={() => setCampaignModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSaveCampaign} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Campaign Title */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">عنوان کمپین تبلیغاتی *</label>
                                    <input 
                                        type="text"
                                        required
                                        value={campaignForm.title}
                                        onChange={e => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="مثلاً: تبلیغات گسترده پیامکی کرمان موتور"
                                        className="w-full px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                                    />
                                </div>

                                {/* Platform */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">رسانه / پلتفرم انتشار</label>
                                    <select 
                                        value={campaignForm.platform}
                                        onChange={e => setCampaignForm(prev => ({ ...prev, platform: e.target.value as any }))}
                                        className="w-full px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                                    >
                                        <option value="INSTAGRAM">اینستاگرام</option>
                                        <option value="TELEGRAM">تلگرام</option>
                                        <option value="WHATSAPP">واتساپ</option>
                                        <option value="SMS">پیامکی</option>
                                        <option value="BALE">پیام‌رسان بله</option>
                                        <option value="WEBSITE">وب‌سایت</option>
                                        <option value="OTHER">سایر موارد</option>
                                    </select>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">وضعیت کمپین</label>
                                    <select 
                                        value={campaignForm.status}
                                        onChange={e => setCampaignForm(prev => ({ ...prev, status: e.target.value as any }))}
                                        className="w-full px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                                    >
                                        <option value="ACTIVE">در حال اجرا (فعال)</option>
                                        <option value="PAUSED">متوقف شده موقت</option>
                                        <option value="COMPLETED">پایان یافته</option>
                                        <option value="DRAFT">پیش‌نویس</option>
                                    </select>
                                </div>

                                {/* Budget */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">بودجه مصوب کمپین (تومان)</label>
                                    <input 
                                        type="number"
                                        value={campaignForm.budget || ''}
                                        onChange={e => setCampaignForm(prev => ({ ...prev, budget: Number(e.target.value) }))}
                                        className="w-full px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                                    />
                                </div>

                                {/* Spent */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">هزینه واقعی مصرف شده (تومان)</label>
                                    <input 
                                        type="number"
                                        value={campaignForm.spent || ''}
                                        onChange={e => setCampaignForm(prev => ({ ...prev, spent: Number(e.target.value) }))}
                                        className="w-full px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                                    />
                                </div>

                                {/* Impressions */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">میزان بازدید / Impressions</label>
                                    <input 
                                        type="number"
                                        value={campaignForm.impressions || ''}
                                        onChange={e => setCampaignForm(prev => ({ ...prev, impressions: Number(e.target.value) }))}
                                        className="w-full px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                                    />
                                </div>

                                {/* Leads */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">تعداد لیدهای دریافتی (مشتری راغب)</label>
                                    <input 
                                        type="number"
                                        value={campaignForm.leads || ''}
                                        onChange={e => setCampaignForm(prev => ({ ...prev, leads: Number(e.target.value) }))}
                                        className="w-full px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none"
                                    />
                                </div>

                                {/* Start Date */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">تاریخ شروع کمپین</label>
                                    <input 
                                        type="text"
                                        value={campaignForm.startDate}
                                        onChange={e => setCampaignForm(prev => ({ ...prev, startDate: e.target.value }))}
                                        placeholder="مثلاً: 1405/03/15"
                                        className="w-full px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-left"
                                        dir="ltr"
                                    />
                                </div>

                                {/* End Date */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">تاریخ پایان کمپین</label>
                                    <input 
                                        type="text"
                                        value={campaignForm.endDate}
                                        onChange={e => setCampaignForm(prev => ({ ...prev, endDate: e.target.value }))}
                                        placeholder="مثلاً: 1405/04/15"
                                        className="w-full px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-left"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            {/* Campaign notes */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">یادداشت‌ها و مخاطبان هدف</label>
                                <textarea 
                                    rows={3}
                                    value={campaignForm.notes}
                                    onChange={e => setCampaignForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="یادداشت‌های فنی، کلیدواژه‌های هدف‌گیری یا اهداف فروش..."
                                    className="w-full px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-xs"
                                />
                            </div>

                            {/* Screenshots File Uploader */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">آپلود اسکرین شات گزارش تبلیغات (PNG/JPG)</label>
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2.5 border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
                                    >
                                        <Upload className="w-4 h-4 text-indigo-500" />
                                        انتخاب تصویر گزارش
                                    </button>
                                    <input 
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                    {campaignForm.screenshotUrl && (
                                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded">
                                            <Check className="w-4 h-4" />
                                            تصویر انتخاب شد
                                        </span>
                                    )}
                                </div>
                                {campaignForm.screenshotUrl && (
                                    <div className="mt-3 relative border dark:border-slate-800 rounded-xl overflow-hidden max-w-sm">
                                        <img src={campaignForm.screenshotUrl} alt="preview" className="w-full max-h-32 object-cover object-top" />
                                        <button 
                                            type="button"
                                            onClick={() => setCampaignForm(prev => ({ ...prev, screenshotUrl: '' }))}
                                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 border-t pt-4 dark:border-slate-800 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setCampaignModalOpen(false)}
                                    className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold rounded-xl text-xs"
                                >
                                    انصراف
                                </button>
                                <button 
                                    type="submit"
                                    className="px-7 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all text-xs"
                                >
                                    ذخیره اطلاعات کمپین
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CAMPAIGN CONFIRMATION MODAL */}
            {campaignToDelete && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] p-4 backdrop-blur-sm" onClick={() => setCampaignToDelete(null)}>
                    <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-up" onClick={e => e.stopPropagation()}>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            تایید حذف کمپین تبلیغاتی
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                            آیا از حذف کمپین تبلیغاتی <span className="font-bold text-slate-800 dark:text-white">«{campaignToDelete.title}»</span> اطمینان دارید؟ این عملیات غیرقابل بازگشت می‌باشد.
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                onClick={() => setCampaignToDelete(null)}
                                className="px-5 py-2.5 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold rounded-xl text-xs"
                            >
                                انصراف
                            </button>
                            <button 
                                onClick={handleDeleteCampaign}
                                className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-xs"
                            >
                                بله، حذف شود
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
