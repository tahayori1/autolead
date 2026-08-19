import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Megaphone, 
    Sparkles, 
    Plus, 
    Edit3, 
    Trash2, 
    Copy, 
    Check, 
    Download, 
    Printer, 
    Share2, 
    Eye, 
    Upload, 
    X, 
    BarChart3, 
    PieChart as PieIcon, 
    TrendingUp, 
    PhoneCall, 
    MessageSquare, 
    Smartphone, 
    Send, 
    Instagram, 
    Globe, 
    Users, 
    FileText, 
    Database, 
    RefreshCw, 
    Image as ImageIcon,
    CheckCircle2,
    Calendar,
    Clock,
    UserCheck,
    Layers,
    ChevronDown,
    ExternalLink,
    Filter,
    Search,
    ShieldAlert,
    Radio
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
    Cell,
    CartesianGrid
} from 'recharts';
import { advertisementService } from '../services/api';
import type { AdvertisementReport, MyProfile } from '../types';
import Spinner from './Spinner';

interface MarketingReportManagerProps {
    loggedInUser: MyProfile | null;
}

const LOCAL_STORAGE_KEY = 'autolead_marketing_reports_cache';

// Default initial sample template matching user prompt exactly
const SAMPLE_REPORT: Omit<AdvertisementReport, 'id'> = {
    title: 'کمپین فروش فوق‌العاده و معرفی شرایط جدید',
    campaign_date: '۱۴۰۵/۰۵/۲۶',
    start_time: '۱۵:۴۰',
    author_name: 'مدیر تبلیغات و بازاریابی',
    status: 'SUBMITTED',
    // Instagram
    ig_total_followers: 94000,
    ig_story_views: 55000,
    ig_story_replies: 1251,
    ig_story_notes: 'با استفاده از یک متد خلاقانه استوری‌ها در کمتر از ۲۴ ساعت ۵۵ هزار بازدید استوری گرفتند و همزمان ۱۲۵۱ ریپلای دریافت کردیم که عدد خیره‌کننده‌ای است. استوری توسط فالوورهای وفادار خودمان دیده می‌شود.',
    ig_reels_views: 200000,
    ig_reels_notes: 'ریل معرفی شرایط با استفاده از یک متد خلاقانه در کمتر از ۱۲ ساعت ۲۰۰ هزار بازدید گرفت که در نوع خود رکوردی بی‌نظیر است و هنوز با نرخ لگاریتمی در حال رشد است.',
    ig_channel_members: 10500,
    ig_channel_notes: 'انتشار اطلاعیه، آموزش‌ها و مطالب ترغیب‌کننده در کانال اینستاگرام',
    // Messaging & Channels
    telegram_members: 3870,
    telegram_new_members: 1250,
    telegram_notes: 'انتشار اطلاعیه‌ها و آموزش‌ها در کانال تلگرام که ۱۲۵۰ عضو تازه نفس و فعال دارد',
    bale_members: 12000,
    bale_notes: 'انتشار ویدیوهای آموزش ثبت‌نام و اطلاع‌رسانی شرایط و توضیحات در کانال بله',
    whatsapp_members: 3000,
    whatsapp_notes: 'انتشار در کانال واتساپ نمایندگی با مخاطبان هدف و مشتریان مرتبط',
    threads_members: 4000,
    threads_notes: 'انتشار اطلاعیه‌ها و پیام‌های ترغیب‌کننده در هر دو پیج نمایندگی',
    // Direct Marketing
    sms_sent_count: 8000,
    sms_database_total: 21000,
    sms_target_audience: 'استان فارسی‌های دیتابیس نمایندگی',
    sms_notes: 'ارسال پیامک با اطلاعات دقیق برای استان فارسی‌های دیتابیس نمایندگی با حدود ۸۰۰۰ شماره از بین بیشتر از ۲۱هزار شماره',
    call_center_inbound: 130,
    call_center_notes: 'از ساعت ۱۵:۴۰ روز گذشته (شروع کمپین) تا لحظه تنظیم گزارش ۱۳۰ تماس ورودی مستقیم ثبت شد.',
    website_status: 'انتشار محتوا و شرایط در وب‌سایت اصلی و صفحه اختصاصی شرایط نمایندگی (آمار بازدید در حال استخراج)',
    sales_team_coordination: 'تماس با کارشناسان تیم فروش و ترغیب برای انتشار محتوا در شبکه‌های اطلاع‌رسانی فردی و مطلع کردن مشتریان',
    total_views: 265500,
    total_leads_calls: 1381,
    attachments: [],
    executive_summary: `درود و صبح بخیر

با احترام گزارش اطلاع رسانی به شرح زیر است:

اینستاگرام (هر دو پیج با مجموع ۹۴هزار فالوور ):
استوری: 
با استفاده از یک متد خلاقانه استوری ها در کمتر از ۲۴ ساعت ۵۵هزار بازدید استوری گرفتند و همزمان ۱۲۵۱ ریپلای دریافت کردیم که عدد خیره کننده است. (احتمالا تا رسیدن به موعد ۲۴ ساعته رکوردهای جدیدی ثبت کند) استوری از آن جهت مهم است که توسط فالوورهای خودمان دیده میشود.

ریل: 
ریل معرفی شرایط با استفاده از یک متد خلاقانه در کمتر از ۱۲ ساعت ۲۰۰ هزار بازدید گرفت که در نوع خود عدد خیره کننده ای است (و هنوز در حال بازدید گرفتن لگاریتمی است)

کانال اینستاگرام:
انتشار اطلاعیه و آموزش و مطالب ترغیب کننده در کانال اینستاگرام با 10500 عضو

تلگرام: 
انتشار اطلاعیه ها و آموزشها و مطالب ترغیب کننده در کانال تلگرام با ۳۸۷۰ عضو که ۱۲۵۰ عضو تازه نفس دارد

بله:
انتشار ویدیوهای آموزش ثبت نام و اطلاع رسانی شرایط و توضیحات در کانال بله با ۱۲هزار ممبر

واتساپ:
انتشار در کانال واتساپ نمایندگی با بیش از ۳۰۰۰ ممبر مرتبط

ثردز:
انتشار اطلاعیه ها و پیام های ترغیب کننده در هر دو پیج نمایندگی با مجموع ۴۰۰۰ ممبر

پیامک: 
ارسال پیامک با اطلاعات دقیق برای استان فارسی های دیتابیس نمایندگی با حدود ۸۰۰۰ شماره از بین بیشتر از ۲۱هزار شماره

Call center:
از دیروز ساعت ۱۵:۴۰ که کمپین استارت زدم تا الان ۱۳۰ تماس ورودی داشتیم.

سایت:
انتشار محتوا و شرایط در سایت و صفحه خام شرایط نمایندگی (آمار بازدید هنوز نیامده)

هماهنگی با تیم فروش:
تماس با بچه های تیم فروش و ترغیب برای انتشار محتوا در شبکه اطلاع رسانی که در دست دارند و مطلع کردن مشتریانشان (علاوه بر اطلاع رسانی مرکزیت اطلاع رسانی)`
};

export const MarketingReportManager: React.FC<MarketingReportManagerProps> = ({ loggedInUser }) => {
    const [reports, setReports] = useState<AdvertisementReport[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedReport, setSelectedReport] = useState<AdvertisementReport | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
    const [editingReport, setEditingReport] = useState<AdvertisementReport | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'report_view' | 'sql_guide'>('dashboard');
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
    const [copiedSql, setCopiedSql] = useState<boolean>(false);
    const [evidenceViewerImage, setEvidenceViewerImage] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<AdvertisementReport>>({
        title: '',
        campaign_date: new Date().toLocaleDateString('fa-IR'),
        start_time: '۰۹:۰۰',
        author_name: loggedInUser?.username || 'مدیر تبلیغات',
        status: 'SUBMITTED',
        ig_total_followers: 0,
        ig_story_views: 0,
        ig_story_replies: 0,
        ig_story_notes: '',
        ig_reels_views: 0,
        ig_reels_notes: '',
        ig_channel_members: 0,
        ig_channel_notes: '',
        telegram_members: 0,
        telegram_new_members: 0,
        telegram_notes: '',
        bale_members: 0,
        bale_notes: '',
        whatsapp_members: 0,
        whatsapp_notes: '',
        threads_members: 0,
        threads_notes: '',
        sms_sent_count: 0,
        sms_database_total: 0,
        sms_target_audience: '',
        sms_notes: '',
        call_center_inbound: 0,
        call_center_notes: '',
        website_status: '',
        sales_team_coordination: '',
        attachments: [],
        executive_summary: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Load Reports
    const fetchReports = async (silent = false) => {
        if (!silent) setIsLoading(true);
        setIsRefreshing(true);
        try {
            const data = await advertisementService.getAll();
            if (Array.isArray(data) && data.length > 0) {
                setReports(data);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
                if (!selectedReport) setSelectedReport(data[0]);
            } else {
                // Check local storage fallback
                const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setReports(parsed);
                    if (!selectedReport && parsed.length > 0) setSelectedReport(parsed[0]);
                } else {
                    // Seed initial sample report
                    const initialSample: AdvertisementReport = {
                        id: 1,
                        ...SAMPLE_REPORT,
                        created_at: new Date().toISOString()
                    };
                    setReports([initialSample]);
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([initialSample]));
                    setSelectedReport(initialSample);
                }
            }
        } catch (error) {
            console.warn("Could not fetch from advertisement webhook, using local cache:", error);
            const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                setReports(parsed);
                if (!selectedReport && parsed.length > 0) setSelectedReport(parsed[0]);
            } else {
                const initialSample: AdvertisementReport = {
                    id: 1,
                    ...SAMPLE_REPORT,
                    created_at: new Date().toISOString()
                };
                setReports([initialSample]);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([initialSample]));
                setSelectedReport(initialSample);
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // Generate Executive Summary Text automatically
    const generateSummaryText = (data: Partial<AdvertisementReport>) => {
        const title = data.title || 'گزارش اطلاع‌رسانی کمپین';
        const date = data.campaign_date || 'امروز';
        const startTime = data.start_time ? ` (شروع از ساعت ${data.start_time})` : '';
        const followers = Number(data.ig_total_followers || 0).toLocaleString('fa-IR');
        
        let text = `درود و وقت بخیر\n\n`;
        text += `با احترام گزارش اطلاع‌رسانی ${title} مورخ ${date}${startTime} به شرح زیر تقدیم می‌گردد:\n\n`;

        // Instagram
        text += `📱 اینستاگرام (مجموع مخاطبان: ${followers} فالوور):\n`;
        if (data.ig_story_views || data.ig_story_replies) {
            text += `• استوری: ${Number(data.ig_story_views || 0).toLocaleString('fa-IR')} بازدید و ${Number(data.ig_story_replies || 0).toLocaleString('fa-IR')} ریپلای ثبت شده. ${data.ig_story_notes ? `(${data.ig_story_notes})` : ''}\n`;
        }
        if (data.ig_reels_views) {
            text += `• ریلز: ${Number(data.ig_reels_views || 0).toLocaleString('fa-IR')} بازدید در ساعات اولیه. ${data.ig_reels_notes ? `(${data.ig_reels_notes})` : ''}\n`;
        }
        if (data.ig_channel_members) {
            text += `• کانال اینستاگرام: انتشار اطلاعیه برای ${Number(data.ig_channel_members || 0).toLocaleString('fa-IR')} عضو. ${data.ig_channel_notes ? `(${data.ig_channel_notes})` : ''}\n`;
        }
        text += `\n`;

        // Messaging
        text += `📢 شبکه‌های پیام‌رسان و کانال‌ها:\n`;
        if (data.telegram_members) {
            text += `• تلگرام: ${Number(data.telegram_members || 0).toLocaleString('fa-IR')} عضو ${data.telegram_new_members ? `(با جذب ${Number(data.telegram_new_members).toLocaleString('fa-IR')} عضو جدید)` : ''}. ${data.telegram_notes ? `(${data.telegram_notes})` : ''}\n`;
        }
        if (data.bale_members) {
            text += `• بله: انتشار آموزش‌ها و شرایط برای ${Number(data.bale_members || 0).toLocaleString('fa-IR')} ممبر کانال. ${data.bale_notes ? `(${data.bale_notes})` : ''}\n`;
        }
        if (data.whatsapp_members) {
            text += `• واتساپ: انتشار در کانال نمایندگی با بیش از ${Number(data.whatsapp_members || 0).toLocaleString('fa-IR')} مخاطب هدف. ${data.whatsapp_notes ? `(${data.whatsapp_notes})` : ''}\n`;
        }
        if (data.threads_members) {
            text += `• ثردز: انتشار پیام‌ها در صفحات نمایندگی با مجموع ${Number(data.threads_members || 0).toLocaleString('fa-IR')} کاربر.\n`;
        }
        text += `\n`;

        // SMS & Direct
        text += `✉️ اطلاع‌رسانی مستقیم و پیامک:\n`;
        if (data.sms_sent_count) {
            text += `• ارسال پیامک: تعداد ${Number(data.sms_sent_count || 0).toLocaleString('fa-IR')} پیامک هدفمند ${data.sms_target_audience ? `(جامعه هدف: ${data.sms_target_audience})` : ''} از کل دیتابیس ${Number(data.sms_database_total || 0).toLocaleString('fa-IR')} شماره.\n`;
        }
        if (data.call_center_inbound) {
            text += `• تماس‌های ورودی کال سنتر (Call Center): ثبت ${Number(data.call_center_inbound || 0).toLocaleString('fa-IR')} تماس ورودی مستقیم تا این لحظه. ${data.call_center_notes ? `(${data.call_center_notes})` : ''}\n`;
        }
        if (data.website_status) {
            text += `• وب‌سایت: ${data.website_status}\n`;
        }
        if (data.sales_team_coordination) {
            text += `• هماهنگی تیم فروش: ${data.sales_team_coordination}\n`;
        }

        text += `\nتهیه و تنظیم: ${data.author_name || 'مدیر تبلیغات و بازاریابی'}`;
        return text;
    };

    // Open Modal for Create
    const handleOpenCreate = () => {
        setEditingReport(null);
        const newForm: Partial<AdvertisementReport> = {
            title: '',
            campaign_date: new Date().toLocaleDateString('fa-IR'),
            start_time: '۱۵:۴۰',
            author_name: loggedInUser?.username || 'مدیر تبلیغات',
            status: 'SUBMITTED',
            ig_total_followers: 94000,
            ig_story_views: 0,
            ig_story_replies: 0,
            ig_story_notes: '',
            ig_reels_views: 0,
            ig_reels_notes: '',
            ig_channel_members: 10500,
            ig_channel_notes: '',
            telegram_members: 3870,
            telegram_new_members: 0,
            telegram_notes: '',
            bale_members: 12000,
            bale_notes: '',
            whatsapp_members: 3000,
            whatsapp_notes: '',
            threads_members: 4000,
            threads_notes: '',
            sms_sent_count: 0,
            sms_database_total: 21000,
            sms_target_audience: 'استان فارسی‌های دیتابیس نمایندگی',
            sms_notes: '',
            call_center_inbound: 0,
            call_center_notes: '',
            website_status: 'انتشار محتوا در سایت و صفحه اختصاصی شرایط نمایندگی',
            sales_team_coordination: 'ترغیب و اطلاع‌رسانی تیم فروش برای نشر در شبکه‌های فردی',
            attachments: [],
            executive_summary: ''
        };
        newForm.executive_summary = generateSummaryText(newForm);
        setFormData(newForm);
        setIsModalOpen(true);
    };

    // Open Modal for Edit
    const handleOpenEdit = (report: AdvertisementReport) => {
        setEditingReport(report);
        setFormData({
            ...report,
            attachments: Array.isArray(report.attachments) ? report.attachments : []
        });
        setIsModalOpen(true);
    };

    // Fill Form with Sample Data from User Request
    const handleFillSample = () => {
        setFormData({
            ...SAMPLE_REPORT,
            title: 'کمپین فروش فوق‌العاده شرایط اقساطی نمایندگی',
            campaign_date: new Date().toLocaleDateString('fa-IR'),
            start_time: '۱۵:۴۰',
            author_name: loggedInUser?.username || 'مدیر تبلیغات و بازاریابی',
            attachments: formData.attachments || []
        });
        showToast("اطلاعات نمونه با موفقیت در فرم درج شد.");
    };

    // Handle File Upload (Screenshots & Proofs)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        (Array.from(files) as File[]).forEach((file: File) => {
            if (file.size > 2 * 1024 * 1024) {
                showToast(`فایل ${file.name} بیشتر از ۲ مگابایت است.`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setFormData(prev => ({
                    ...prev,
                    attachments: [...(prev.attachments || []), base64]
                }));
                showToast(`تصویر ${file.name} با موفقیت ضمیمه شد.`);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveAttachment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attachments: (prev.attachments || []).filter((_, i) => i !== index)
        }));
    };

    // Save Report (Create or Update)
    const handleSaveReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title?.trim()) {
            showToast("لطفا عنوان کمپین/گزارش را وارد کنید.", "error");
            return;
        }

        const totalViews = Number(formData.ig_story_views || 0) + 
                           Number(formData.ig_reels_views || 0) + 
                           Number(formData.telegram_members || 0) + 
                           Number(formData.bale_members || 0) + 
                           Number(formData.whatsapp_members || 0);

        const totalLeads = Number(formData.call_center_inbound || 0) + 
                          Number(formData.ig_story_replies || 0);

        const summaryText = formData.executive_summary?.trim() || generateSummaryText(formData);

        const payload: AdvertisementReport = {
            id: editingReport ? editingReport.id : Date.now(),
            title: formData.title || 'گزارش تبلیغات',
            campaign_date: formData.campaign_date || new Date().toLocaleDateString('fa-IR'),
            start_time: formData.start_time || '۰۹:۰۰',
            author_name: formData.author_name || 'مدیر تبلیغات',
            status: formData.status || 'SUBMITTED',
            ig_total_followers: Number(formData.ig_total_followers || 0),
            ig_story_views: Number(formData.ig_story_views || 0),
            ig_story_replies: Number(formData.ig_story_replies || 0),
            ig_story_notes: formData.ig_story_notes || '',
            ig_reels_views: Number(formData.ig_reels_views || 0),
            ig_reels_notes: formData.ig_reels_notes || '',
            ig_channel_members: Number(formData.ig_channel_members || 0),
            ig_channel_notes: formData.ig_channel_notes || '',
            telegram_members: Number(formData.telegram_members || 0),
            telegram_new_members: Number(formData.telegram_new_members || 0),
            telegram_notes: formData.telegram_notes || '',
            bale_members: Number(formData.bale_members || 0),
            bale_notes: formData.bale_notes || '',
            whatsapp_members: Number(formData.whatsapp_members || 0),
            whatsapp_notes: formData.whatsapp_notes || '',
            threads_members: Number(formData.threads_members || 0),
            threads_notes: formData.threads_notes || '',
            sms_sent_count: Number(formData.sms_sent_count || 0),
            sms_database_total: Number(formData.sms_database_total || 0),
            sms_target_audience: formData.sms_target_audience || '',
            sms_notes: formData.sms_notes || '',
            call_center_inbound: Number(formData.call_center_inbound || 0),
            call_center_notes: formData.call_center_notes || '',
            website_status: formData.website_status || '',
            sales_team_coordination: formData.sales_team_coordination || '',
            total_views: totalViews,
            total_leads_calls: totalLeads,
            executive_summary: summaryText,
            attachments: formData.attachments || [],
            created_at: editingReport ? editingReport.created_at : new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            // Save to Webhook Endpoint
            let savedRecord: AdvertisementReport = payload;
            try {
                if (editingReport) {
                    savedRecord = await advertisementService.update(payload);
                } else {
                    savedRecord = await advertisementService.create(payload);
                }
            } catch (apiErr) {
                console.warn("API direct call failed, persisting locally:", apiErr);
            }

            // Sync Local State & Local Storage
            let updatedList: AdvertisementReport[];
            if (editingReport) {
                updatedList = reports.map(r => r.id === editingReport.id ? { ...payload, id: editingReport.id } : r);
            } else {
                updatedList = [payload, ...reports];
            }

            setReports(updatedList);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
            setSelectedReport(payload);
            setIsModalOpen(false);
            showToast(editingReport ? "گزارش با موفقیت به‌روزرسانی شد." : "گزارش تبلیغات با موفقیت ثبت گردید.");
        } catch (err) {
            console.error("Error saving advertisement report:", err);
            showToast("خطا در ثبت گزارش. نسخه محلی ذخیره شد.", "error");
        }
    };

    // Delete Report
    const handleDeleteReport = async (id: number) => {
        if (!window.confirm("آیا از حذف این گزارش تبلیغات اطمینان دارید؟")) return;

        try {
            try {
                await advertisementService.delete(id);
            } catch (e) {
                console.warn("API delete fallback:", e);
            }

            const updatedList = reports.filter(r => r.id !== id);
            setReports(updatedList);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
            if (selectedReport?.id === id) {
                setSelectedReport(updatedList[0] || null);
            }
            showToast("گزارش با موفقیت حذف شد.");
        } catch (err) {
            showToast("خطا در حذف گزارش", "error");
        }
    };

    // Copy Executive Summary to Clipboard
    const handleCopySummary = (text?: string) => {
        const content = text || selectedReport?.executive_summary || '';
        navigator.clipboard.writeText(content).then(() => {
            setCopiedSummary(true);
            showToast("متن گزارش با موفقیت در کلیپ‌بورد کپی شد (آماده ارسال در واتساپ یا تلگرام)");
            setTimeout(() => setCopiedSummary(false), 2500);
        }).catch(() => {
            showToast("خطا در کپی متن", "error");
        });
    };

    // Print Report
    const handlePrintReport = () => {
        window.print();
    };

    // Download Text Report
    const handleDownloadReport = () => {
        if (!selectedReport) return;
        const text = selectedReport.executive_summary || generateSummaryText(selectedReport);
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Marketing_Report_${selectedReport.campaign_date?.replace(/\//g, '-') || 'Ad'}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        showToast("فایل متن گزارش دانلود شد.");
    };

    // Filtered reports
    const filteredReports = useMemo(() => {
        const term = (searchTerm || '').toLowerCase();
        return (reports || []).filter(r => 
            (r?.title || '').toLowerCase().includes(term) ||
            (r?.author_name && r.author_name.toLowerCase().includes(term)) ||
            (r?.campaign_date && r.campaign_date.includes(searchTerm))
        );
    }, [reports, searchTerm]);

    // Active report to visualize
    const currentReport = selectedReport || reports[0] || null;

    // Visual Chart Data for current selected report
    const reachChartData = useMemo(() => {
        if (!currentReport) return [];
        return [
            { name: 'ریلز اینستاگرام', value: Number(currentReport.ig_reels_views || 0), fill: '#ec4899' },
            { name: 'استوری اینستاگرام', value: Number(currentReport.ig_story_views || 0), fill: '#f43f5e' },
            { name: 'کانال بله', value: Number(currentReport.bale_members || 0), fill: '#10b981' },
            { name: 'کانال اینستاگرام', value: Number(currentReport.ig_channel_members || 0), fill: '#8b5cf6' },
            { name: 'پیامک ارسالی', value: Number(currentReport.sms_sent_count || 0), fill: '#3b82f6' },
            { name: 'کانال تلگرام', value: Number(currentReport.telegram_members || 0), fill: '#0ea5e9' },
            { name: 'کانال واتساپ', value: Number(currentReport.whatsapp_members || 0), fill: '#22c55e' },
            { name: 'شبکه ثردز', value: Number(currentReport.threads_members || 0), fill: '#64748b' }
        ].filter(item => item.value > 0);
    }, [currentReport]);

    const leadEngagementData = useMemo(() => {
        if (!currentReport) return [];
        return [
            { name: 'ریپلای استوری', count: Number(currentReport.ig_story_replies || 0), fill: '#ec4899' },
            { name: 'تماس کال سنتر', count: Number(currentReport.call_center_inbound || 0), fill: '#3b82f6' },
            { name: 'عضو جدید تلگرام', count: Number(currentReport.telegram_new_members || 0), fill: '#0ea5e9' }
        ];
    }, [currentReport]);

    const smsCoverageData = useMemo(() => {
        if (!currentReport || !currentReport.sms_database_total) return [];
        const sent = Number(currentReport.sms_sent_count || 0);
        const remaining = Math.max(0, Number(currentReport.sms_database_total || 0) - sent);
        return [
            { name: 'پیامک‌های ارسال شده', value: sent, fill: '#3b82f6' },
            { name: 'باقیمانده بانک شماره‌ها', value: remaining, fill: '#cbd5e1' }
        ];
    }, [currentReport]);

    // MySQL Table Creation Query Script
    const sqlCreateQuery = `-- ======================================================================
-- 📊 اسکریپت ساخت جدول گزارشات تبلیغات و بازاریابی (Advertisements Table)
-- دیتابیس: MySQL 5.7+ / MySQL 8.0+ / MariaDB
-- آدرس اندپوینت: https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/advertisment
-- متدها: GET / POST / PUT / DELETE
-- ======================================================================

CREATE TABLE IF NOT EXISTS \`advertisements\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'شناسه یکتا گزارش',
  \`title\` VARCHAR(255) NOT NULL COMMENT 'عنوان کمپین یا گزارش تبلیغات',
  \`campaign_date\` VARCHAR(50) NULL DEFAULT NULL COMMENT 'تاریخ اجرای کمپین (مثلا ۱۴۰۵/۰۵/۲۶)',
  \`start_time\` VARCHAR(20) NULL DEFAULT NULL COMMENT 'ساعت شروع کمپین (مثلا ۱۵:۴۰)',
  \`author_name\` VARCHAR(150) NULL DEFAULT 'مدیر تبلیغات' COMMENT 'نام تکمیل‌کننده گزارش',
  
  -- بخش اینستاگرام
  \`ig_total_followers\` INT UNSIGNED DEFAULT 0 COMMENT 'مجموع فالوورهای پیج‌ها',
  \`ig_story_views\` INT UNSIGNED DEFAULT 0 COMMENT 'تعداد بازدید استوری‌ها',
  \`ig_story_replies\` INT UNSIGNED DEFAULT 0 COMMENT 'تعداد ریپلای‌های استوری',
  \`ig_story_notes\` TEXT NULL COMMENT 'توضیحات و بازخورد استوری',
  \`ig_reels_views\` INT UNSIGNED DEFAULT 0 COMMENT 'تعداد بازدید ریلز معرفی شرایط',
  \`ig_reels_notes\` TEXT NULL COMMENT 'توضیحات و بازخورد ریلز',
  \`ig_channel_members\` INT UNSIGNED DEFAULT 0 COMMENT 'تعداد اعضای کانال اینستاگرام',
  \`ig_channel_notes\` TEXT NULL COMMENT 'توضیحات کانال اینستاگرام',
  
  -- پیام‌رسان‌ها و شبکه‌های اجتماعی
  \`telegram_members\` INT UNSIGNED DEFAULT 0 COMMENT 'تعداد اعضای کانال تلگرام',
  \`telegram_new_members\` INT UNSIGNED DEFAULT 0 COMMENT 'اعضای تازه نفس اضافه شده به تلگرام',
  \`telegram_notes\` TEXT NULL COMMENT 'توضیحات کانال تلگرام',
  \`bale_members\` INT UNSIGNED DEFAULT 0 COMMENT 'تعداد اعضای کانال بله',
  \`bale_notes\` TEXT NULL COMMENT 'توضیحات کانال بله و ویدیوهای آموزشی',
  \`whatsapp_members\` INT UNSIGNED DEFAULT 0 COMMENT 'تعداد اعضای کانال واتساپ',
  \`whatsapp_notes\` TEXT NULL COMMENT 'توضیحات کانال واتساپ',
  \`threads_members\` INT UNSIGNED DEFAULT 0 COMMENT 'تعداد اعضای شبکه ثردز',
  \`threads_notes\` TEXT NULL COMMENT 'توضیحات شبکه ثردز',
  
  -- اطلاع‌رسانی مستقیم، پیامک و کال‌سنتر
  \`sms_sent_count\` INT UNSIGNED DEFAULT 0 COMMENT 'تعداد پیامک‌های ارسالی',
  \`sms_database_total\` INT UNSIGNED DEFAULT 0 COMMENT 'کل بانک شماره‌های نمایندگی',
  \`sms_target_audience\` VARCHAR(255) NULL COMMENT 'جامعه هدف پیامک (مثلا استان فارس)',
  \`sms_notes\` TEXT NULL COMMENT 'توضیحات پیامک',
  \`call_center_inbound\` INT UNSIGNED DEFAULT 0 COMMENT 'تعداد تماس‌های ورودی کال سنتر',
  \`call_center_notes\` TEXT NULL COMMENT 'توضیحات تماس‌های ورودی',
  \`website_status\` TEXT NULL COMMENT 'وضعیت انتشار در وب‌سایت و لندینگ پیج',
  \`sales_team_coordination\` TEXT NULL COMMENT 'هماهنگی با تیم فروش جهت انتشار در شبکه‌های فردی',
  
  -- خروجی‌ها و مستندات
  \`total_views\` BIGINT UNSIGNED DEFAULT 0 COMMENT 'مجموع تخمینی بازدیدها',
  \`total_leads_calls\` INT UNSIGNED DEFAULT 0 COMMENT 'مجموع لیدها و تعاملات ثبت شده',
  \`executive_summary\` LONGTEXT NULL COMMENT 'متن گزارش جامع مدیریتی',
  \`attachments\` LONGTEXT NULL COMMENT 'آرایه JSON حاوی تصاویر مستندات و اسکرین‌شات‌ها',
  \`status\` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'ARCHIVED') DEFAULT 'SUBMITTED' COMMENT 'وضعیت گزارش',
  
  -- زمان‌بندی
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاریخ ایجاد رکورد',
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاریخ آخرین ویرایش',
  
  INDEX \`idx_campaign_date\` (\`campaign_date\`),
  INDEX \`idx_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول گزارش‌های جامع تبلیغات و بازاریابی نمایندگی حسینی خودرو';`;

    const handleCopySql = () => {
        navigator.clipboard.writeText(sqlCreateQuery).then(() => {
            setCopiedSql(true);
            showToast("کد کوئری MySQL با موفقیت کپی شد.");
            setTimeout(() => setCopiedSql(false), 2500);
        }).catch(() => {
            showToast("خطا در کپی کد SQL", "error");
        });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4 font-vazir text-right">
            {/* Header section */}
            <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden border border-indigo-900/40">
                <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30 backdrop-blur-md">
                            <Megaphone className="w-3.5 h-3.5 animate-pulse" />
                            <span>سامانه هوشمند گزارش‌دهی مدیر تبلیغات و بازاریابی</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                            <span>گزارش عملکرد و آنالیز کمپین‌های تبلیغاتی</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                            ثبت آمار بازدید شبکه‌های اجتماعی، استوری‌ها، ریلز، کانال‌ها، پیامک، کال سنتر، آپلود مستندات و تولید خودکار گزارش آماده مدیریتی همراه با نمودار
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setIsSqlModalOpen(true)}
                            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-indigo-200 hover:text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border border-indigo-500/30 shadow-sm"
                        >
                            <Database className="w-4 h-4 text-indigo-400" />
                            <span>کوئری MySQL جدول</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => fetchReports()}
                            disabled={isRefreshing}
                            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all backdrop-blur-sm border border-white/10"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span>بروزرسانی</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleOpenCreate}
                            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg shadow-emerald-900/30 hover:scale-[1.02] active:scale-95"
                        >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>ثبت گزارش جدید تبلیغات</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick KPI Overview Cards */}
            {currentReport && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center shrink-0">
                            <Instagram className="w-6 h-6" />
                        </div>
                        <div className="overflow-hidden">
                            <span className="text-[11px] font-bold text-slate-400 block truncate">مجموع بازدیدهای اینستاگرام</span>
                            <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-white font-mono">
                                {(Number(currentReport.ig_story_views || 0) + Number(currentReport.ig_reels_views || 0)).toLocaleString('fa-IR')}
                            </span>
                            <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold block">استوری + ریلز</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                            <PhoneCall className="w-6 h-6" />
                        </div>
                        <div className="overflow-hidden">
                            <span className="text-[11px] font-bold text-slate-400 block truncate">تماس‌های کال سنتر</span>
                            <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-white font-mono">
                                {Number(currentReport.call_center_inbound || 0).toLocaleString('fa-IR')}
                            </span>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">تماس ورودی مستقیم</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
                            <Send className="w-6 h-6" />
                        </div>
                        <div className="overflow-hidden">
                            <span className="text-[11px] font-bold text-slate-400 block truncate">پیامک ارسالی هدفمند</span>
                            <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-white font-mono">
                                {Number(currentReport.sms_sent_count || 0).toLocaleString('fa-IR')}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold block">
                                از {Number(currentReport.sms_database_total || 0).toLocaleString('fa-IR')} مخاطب
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="overflow-hidden">
                            <span className="text-[11px] font-bold text-slate-400 block truncate">اعضای کانال‌های اطلاع‌رسانی</span>
                            <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-white font-mono">
                                {(
                                    Number(currentReport.ig_channel_members || 0) +
                                    Number(currentReport.telegram_members || 0) +
                                    Number(currentReport.bale_members || 0) +
                                    Number(currentReport.whatsapp_members || 0) +
                                    Number(currentReport.threads_members || 0)
                                ).toLocaleString('fa-IR')}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">تجمیع بله، تلگرام، واتساپ</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content: Reports Selector + Detail View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Right Column: Reports History List (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-500" />
                                <h2 className="text-sm font-black text-slate-800 dark:text-white">سوابق گزارشات تبلیغات</h2>
                            </div>
                            <span className="text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg">
                                {filteredReports.length} گزارش
                            </span>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="جستجو در عنوان، تاریخ و..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                        {/* List */}
                        {isLoading ? (
                            <div className="py-12 text-center">
                                <Spinner />
                            </div>
                        ) : filteredReports.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 space-y-2">
                                <FileText className="w-8 h-8 mx-auto opacity-40" />
                                <p className="text-xs font-bold">هیچ گزارشی یافت نشد.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                                {filteredReports.map((item) => {
                                    const isSelected = selectedReport?.id === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedReport(item)}
                                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                                                isSelected
                                                ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-sm'
                                                : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className={`text-xs font-black line-clamp-1 ${
                                                    isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-white'
                                                }`}>
                                                    {item.title}
                                                </h3>
                                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                                    {item.campaign_date}
                                                </span>
                                            </div>

                                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 font-mono text-pink-600 font-bold">
                                                        <Instagram className="w-3 h-3" />
                                                        {(Number(item.ig_story_views || 0) + Number(item.ig_reels_views || 0)).toLocaleString('fa-IR')}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 font-mono text-blue-600 font-bold">
                                                        <PhoneCall className="w-3 h-3" />
                                                        {Number(item.call_center_inbound || 0).toLocaleString('fa-IR')}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenEdit(item);
                                                        }}
                                                        className="p-1 hover:text-indigo-600 rounded-md transition-colors"
                                                        title="ویرایش"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteReport(item.id);
                                                        }}
                                                        className="p-1 hover:text-red-600 rounded-md transition-colors"
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Left Column: Full Report Details, Graphs, Generated Executive Text & Attachments (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    {currentReport ? (
                        <>
                            {/* Report Header Bar */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                                تاریخ: {currentReport.campaign_date || 'ثبت نشده'} {currentReport.start_time ? `| ساعت ${currentReport.start_time}` : ''}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                ثبت‌کننده: <strong className="text-slate-700 dark:text-slate-300">{currentReport.author_name || 'مدیر تبلیغات'}</strong>
                                            </span>
                                        </div>
                                        <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white mt-1.5">
                                            {currentReport.title}
                                        </h2>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleCopySummary()}
                                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                                            title="کپی متن گزارش آماده برای پیام‌رسان‌ها"
                                        >
                                            {copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            <span>{copiedSummary ? 'کپی شد!' : 'کپی گزارش برای واتساپ/تلگرام'}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleDownloadReport}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs transition-colors"
                                            title="دانلود فایل متنی"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handlePrintReport}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs transition-colors"
                                            title="چاپ گزارش رسمی"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(currentReport)}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs transition-colors"
                                            title="ویرایش این گزارش"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Visual Charts Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    {/* Chart 1: Social Reach Breakdown */}
                                    <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <BarChart3 className="w-4 h-4 text-indigo-500" />
                                                <span>تفکیک بازدید و نفوذ رسانه‌ها</span>
                                            </h3>
                                        </div>
                                        <div className="h-56 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={reachChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} interval={0} angle={-25} textAnchor="end" />
                                                    <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(v) => Number(v).toLocaleString('fa-IR')} />
                                                    <RechartsTooltip 
                                                        formatter={(value: any) => [Number(value).toLocaleString('fa-IR') + ' بازدید/مخاطب', 'حجم']}
                                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', direction: 'rtl' }}
                                                    />
                                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                        {reachChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Chart 2: Lead & Action Conversion */}
                                    <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                <span>تعاملات مستقیم، ریپلای و تماس‌ها</span>
                                            </h3>
                                        </div>
                                        <div className="h-56 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={leadEngagementData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
                                                    <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(v) => Number(v).toLocaleString('fa-IR')} />
                                                    <RechartsTooltip 
                                                        formatter={(value: any) => [Number(value).toLocaleString('fa-IR') + ' مورد', 'تعداد']}
                                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', direction: 'rtl' }}
                                                    />
                                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                        {leadEngagementData.map((entry, index) => (
                                                            <Cell key={`cell-lead-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Executive Summary Box (متن گزارش آماده برای مدیریت) */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                        <h3 className="text-sm font-black text-slate-800 dark:text-white">متن رسمی گزارش جهت ارسال به مدیریت</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopySummary()}
                                        className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>کپی متن</span>
                                    </button>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 font-sans text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed select-text">
                                    {currentReport.executive_summary || generateSummaryText(currentReport)}
                                </div>
                            </div>

                            {/* Detailed Channels Breakdown Grid */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-500" />
                                    <span>جزئیات دقیق مراجع اطلاع‌رسانی</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {/* Instagram Box */}
                                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-pink-600">
                                            <span className="flex items-center gap-1.5">
                                                <Instagram className="w-4 h-4" />
                                                اینستاگرام (استوری و ریلز)
                                            </span>
                                            <span className="font-mono">{Number(currentReport.ig_total_followers || 0).toLocaleString('fa-IR')} فالوور</span>
                                        </div>
                                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                            <div className="flex justify-between">
                                                <span>بازدید استوری:</span>
                                                <strong className="font-mono text-slate-900 dark:text-white">{Number(currentReport.ig_story_views || 0).toLocaleString('fa-IR')}</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>ریپلای‌های استوری:</span>
                                                <strong className="font-mono text-emerald-600">{Number(currentReport.ig_story_replies || 0).toLocaleString('fa-IR')}</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>بازدید ریلز معرفی:</span>
                                                <strong className="font-mono text-pink-600">{Number(currentReport.ig_reels_views || 0).toLocaleString('fa-IR')}</strong>
                                            </div>
                                            {currentReport.ig_story_notes && (
                                                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
                                                    {currentReport.ig_story_notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Call Center & SMS */}
                                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-blue-600">
                                            <span className="flex items-center gap-1.5">
                                                <PhoneCall className="w-4 h-4" />
                                                کال سنتر و پیامک
                                            </span>
                                            <span className="font-mono text-[11px]">{currentReport.sms_target_audience || 'بانک مشتریان'}</span>
                                        </div>
                                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                            <div className="flex justify-between">
                                                <span>تماس‌های ورودی:</span>
                                                <strong className="font-mono text-blue-600 text-sm">{Number(currentReport.call_center_inbound || 0).toLocaleString('fa-IR')} تماس</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>پیامک‌های ارسالی:</span>
                                                <strong className="font-mono text-slate-900 dark:text-white">{Number(currentReport.sms_sent_count || 0).toLocaleString('fa-IR')}</strong>
                                            </div>
                                            {currentReport.call_center_notes && (
                                                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
                                                    {currentReport.call_center_notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Channels: Telegram & Bale */}
                                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-emerald-600">
                                            <span className="flex items-center gap-1.5">
                                                <Send className="w-4 h-4" />
                                                کانال‌های بله و تلگرام
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                            <div className="flex justify-between">
                                                <span>ممبر کانال بله:</span>
                                                <strong className="font-mono text-slate-900 dark:text-white">{Number(currentReport.bale_members || 0).toLocaleString('fa-IR')}</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>ممبر کانال تلگرام:</span>
                                                <strong className="font-mono text-slate-900 dark:text-white">
                                                    {Number(currentReport.telegram_members || 0).toLocaleString('fa-IR')}
                                                    {currentReport.telegram_new_members ? ` (${Number(currentReport.telegram_new_members).toLocaleString('fa-IR')} جدید)` : ''}
                                                </strong>
                                            </div>
                                            {currentReport.bale_notes && (
                                                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
                                                    {currentReport.bale_notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Website & Sales Team Coordination */}
                                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-indigo-600">
                                            <span className="flex items-center gap-1.5">
                                                <Globe className="w-4 h-4" />
                                                وب‌سایت و هماهنگی فروش
                                            </span>
                                        </div>
                                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                            <div>
                                                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">وضعیت سایت:</span>
                                                <span className="text-[11px] text-slate-500 block leading-tight">{currentReport.website_status || 'ثبت نشده'}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">اقدامات تیم فروش:</span>
                                                <span className="text-[11px] text-slate-500 block leading-tight">{currentReport.sales_team_coordination || 'ثبت نشده'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Attachments & Documentation Gallery */}
                            {currentReport.attachments && currentReport.attachments.length > 0 && (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4 text-pink-500" />
                                            <h3 className="text-sm font-black text-slate-800 dark:text-white">مستندات و اسکرین‌شات‌های بازدید (Insights)</h3>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 font-mono">
                                            {currentReport.attachments.length} تصویر
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {currentReport.attachments.map((img, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setEvidenceViewerImage(img)}
                                                className="group relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm hover:shadow-md transition-all"
                                            >
                                                <img 
                                                    src={img} 
                                                    alt={`مستند ${idx + 1}`} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <Eye className="w-5 h-5" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-400 space-y-3">
                            <Megaphone className="w-12 h-12 mx-auto opacity-30 text-indigo-500" />
                            <p className="text-sm font-bold">هنوز هیچ گزارشی انتخاب نشده است.</p>
                            <button
                                type="button"
                                onClick={handleOpenCreate}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                            >
                                ثبت اولین گزارش
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Create / Edit Advertising Report */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-gradient-to-l from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <Megaphone className="w-5 h-5 text-indigo-400" />
                                <div>
                                    <h2 className="text-base font-black">
                                        {editingReport ? 'ویرایش گزارش عملکرد تبلیغات' : 'ثبت گزارش جدید عملکرد تبلیغات و بازاریابی'}
                                    </h2>
                                    <span className="text-[11px] text-slate-300">
                                        ورود آمار شبکه‌های اجتماعی، پیامک، کال‌سنتر و تولید خودکار گزارش مدیریتی
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleFillSample}
                                    className="bg-indigo-600/60 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-400/30"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>درج داده نمونه کمپین</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Form Body */}
                        <form onSubmit={handleSaveReport} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                            
                            {/* Section 1: Basic Info */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 pb-1 border-b border-indigo-100 dark:border-indigo-950">
                                    <FileText className="w-4 h-4" />
                                    <span>مشخصات عمومی کمپین و گزارش</span>
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            عنوان کمپین یا گزارش <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="مثلا: کمپین فروش فوق‌العاده شرایط اقساطی تابستان"
                                            value={formData.title || ''}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            تاریخ و ساعت اجرا
                                        </label>
                                        <div className="flex gap-1.5">
                                            <input
                                                type="text"
                                                placeholder="۱۴۰۵/۰۵/۲۶"
                                                value={formData.campaign_date || ''}
                                                onChange={(e) => setFormData({ ...formData, campaign_date: e.target.value })}
                                                className="w-2/3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2.5 text-xs text-slate-800 dark:text-white text-center focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                            />
                                            <input
                                                type="text"
                                                placeholder="۱۵:۴۰"
                                                value={formData.start_time || ''}
                                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                                className="w-1/3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2.5 text-xs text-slate-800 dark:text-white text-center focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Instagram Metrics */}
                            <div className="space-y-3 bg-pink-50/40 dark:bg-pink-950/20 p-4 rounded-2xl border border-pink-100 dark:border-pink-900/40">
                                <h3 className="text-xs font-black text-pink-600 dark:text-pink-400 flex items-center justify-between pb-1 border-b border-pink-200/50 dark:border-pink-900/50">
                                    <span className="flex items-center gap-1.5">
                                        <Instagram className="w-4 h-4" />
                                        اینستاگرام (استوری، ریلز و کانال)
                                    </span>
                                    <span className="text-[11px] font-normal text-slate-500">هر دو پیج نمایندگی</span>
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            کل فالوورها (هر دو پیج)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.ig_total_followers || ''}
                                            onChange={(e) => setFormData({ ...formData, ig_total_followers: Number(e.target.value) })}
                                            placeholder="94000"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            تعداد بازدید استوری
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.ig_story_views || ''}
                                            onChange={(e) => setFormData({ ...formData, ig_story_views: Number(e.target.value) })}
                                            placeholder="55000"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            تعداد ریپلای استوری
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.ig_story_replies || ''}
                                            onChange={(e) => setFormData({ ...formData, ig_story_replies: Number(e.target.value) })}
                                            placeholder="1251"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white text-emerald-600 font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            بازدید ریلز معرفی
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.ig_reels_views || ''}
                                            onChange={(e) => setFormData({ ...formData, ig_reels_views: Number(e.target.value) })}
                                            placeholder="200000"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white text-pink-600 font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            توضیحات و متد استوری‌ها
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.ig_story_notes || ''}
                                            onChange={(e) => setFormData({ ...formData, ig_story_notes: e.target.value })}
                                            placeholder="استفاده از متد خلاقانه و تعاملی برای فالوورهای خودمان..."
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            توضیحات و بازخورد ریلز
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.ig_reels_notes || ''}
                                            onChange={(e) => setFormData({ ...formData, ig_reels_notes: e.target.value })}
                                            placeholder="بازدید لگاریتمی در ساعات اولیه..."
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Messaging Channels (Telegram, Bale, WhatsApp, Threads) */}
                            <div className="space-y-3 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                                <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-emerald-200/50 dark:border-emerald-900/50">
                                    <Send className="w-4 h-4" />
                                    <span>کانال‌های اطلاع‌رسانی (تلگرام، بله، واتساپ، ثردز، کانال اینستا)</span>
                                </h3>

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            کانال اینستاگرام
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.ig_channel_members || ''}
                                            onChange={(e) => setFormData({ ...formData, ig_channel_members: Number(e.target.value) })}
                                            placeholder="10500"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            کانال تلگرام
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.telegram_members || ''}
                                            onChange={(e) => setFormData({ ...formData, telegram_members: Number(e.target.value) })}
                                            placeholder="3870"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            عضو جدید تلگرام
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.telegram_new_members || ''}
                                            onChange={(e) => setFormData({ ...formData, telegram_new_members: Number(e.target.value) })}
                                            placeholder="1250"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white text-emerald-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            کانال بله
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.bale_members || ''}
                                            onChange={(e) => setFormData({ ...formData, bale_members: Number(e.target.value) })}
                                            placeholder="12000"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            کانال واتساپ
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.whatsapp_members || ''}
                                            onChange={(e) => setFormData({ ...formData, whatsapp_members: Number(e.target.value) })}
                                            placeholder="3000"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: SMS, Call Center & Direct Actions */}
                            <div className="space-y-3 bg-blue-50/40 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                                <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 pb-1 border-b border-blue-200/50 dark:border-blue-900/50">
                                    <PhoneCall className="w-4 h-4" />
                                    <span>پیامک، کال سنتر (Call Center)، وب‌سایت و هماهنگی تیم فروش</span>
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            تعداد پیامک‌های ارسالی
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.sms_sent_count || ''}
                                            onChange={(e) => setFormData({ ...formData, sms_sent_count: Number(e.target.value) })}
                                            placeholder="8000"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            کل بانک شماره‌های دیتابیس
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.sms_database_total || ''}
                                            onChange={(e) => setFormData({ ...formData, sms_database_total: Number(e.target.value) })}
                                            placeholder="21000"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            تماس‌های ورودی کال سنتر
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.call_center_inbound || ''}
                                            onChange={(e) => setFormData({ ...formData, call_center_inbound: Number(e.target.value) })}
                                            placeholder="130"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white text-blue-600 font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            وضعیت انتشار در سایت و لندینگ پیج
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.website_status || ''}
                                            onChange={(e) => setFormData({ ...formData, website_status: e.target.value })}
                                            placeholder="انتشار در صفحه شرایط نمایندگی..."
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            هماهنگی و اطلاع‌رسانی تیم فروش
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.sales_team_coordination || ''}
                                            onChange={(e) => setFormData({ ...formData, sales_team_coordination: e.target.value })}
                                            placeholder="ارتباط با کارشناسان فروش جهت اطلاع به مشتریان..."
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Upload Screenshots & Proofs */}
                            <div className="space-y-3 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                        <Upload className="w-4 h-4 text-indigo-500" />
                                        <span>آپلود مستندات و اسکرین‌شات‌های بازدید (Insights)</span>
                                    </h3>
                                    <span className="text-[10px] text-slate-400">حداکثر ۲ مگابایت برای هر تصویر</span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileUpload} 
                                        accept="image/*" 
                                        multiple 
                                        className="hidden" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-700 px-4 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        <span>انتخاب اسکرین‌شات‌ها (اینسایت اینستاگرام، گزارش پیامک و...)</span>
                                    </button>

                                    {formData.attachments && formData.attachments.length > 0 && (
                                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" />
                                            {formData.attachments.length} تصویر ضمیمه شد
                                        </span>
                                    )}
                                </div>

                                {/* Preview Attached Thumbnails */}
                                {formData.attachments && formData.attachments.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
                                        {formData.attachments.map((img, idx) => (
                                            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 group">
                                                <img src={img} alt={`ضمیمه ${idx}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAttachment(idx)}
                                                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Section 6: Executive Report Text Generator */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                        <span>متن گزارش مدیریتی (تولید خودکار بر اساس داده‌های فرم)</span>
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, executive_summary: generateSummaryText(formData) })}
                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>بازسازی هوشمند متن گزارش</span>
                                    </button>
                                </div>

                                <textarea
                                    rows={8}
                                    value={formData.executive_summary || ''}
                                    onChange={(e) => setFormData({ ...formData, executive_summary: e.target.value })}
                                    placeholder="متن گزارش رسمی به صورت خودکار ایجاد می‌شود یا می‌توانید به صورت دستی آن را تکمیل نمایید..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                />
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-900/20 transition-all"
                                >
                                    {editingReport ? 'ذخیره تغییرات گزارش' : 'ثبت نهایی گزارش تبلیغات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: MySQL SQL Query Schema */}
            {isSqlModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <Database className="w-5 h-5 text-indigo-400" />
                                <div>
                                    <h2 className="text-sm font-black">اسکریپت SQL ساخت جدول دیتابیس (MySQL Table Schema)</h2>
                                    <span className="text-[11px] text-slate-400">مناسب برای اجرای مستقیم در phpMyAdmin یا MySQL Workbench</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSqlModalOpen(false)}
                                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-bold">
                                    اندپوینت متصل: <code className="bg-slate-100 dark:bg-slate-800 text-indigo-600 px-2 py-0.5 rounded font-mono text-[11px]">/api/v1/advertisment</code>
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCopySql}
                                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                                >
                                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedSql ? 'کپی شد!' : 'کپی کوئری SQL'}</span>
                                </button>
                            </div>

                            <div className="relative">
                                <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-96 text-left" dir="ltr">
                                    {sqlCreateQuery}
                                </pre>
                            </div>
                        </div>

                        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 flex justify-end border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setIsSqlModalOpen(false)}
                                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold"
                            >
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Fullscreen Evidence Viewer */}
            {evidenceViewerImage && (
                <div 
                    className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 cursor-pointer"
                    onClick={() => setEvidenceViewerImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
                        <img src={evidenceViewerImage} alt="مستند گزارش" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
                        <button
                            type="button"
                            onClick={() => setEvidenceViewerImage(null)}
                            className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold text-white animate-in slide-in-from-bottom-5 duration-200 ${
                    toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
                }`}>
                    {toast.type === 'error' ? <ShieldAlert className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    <span>{toast.text}</span>
                </div>
            )}
        </div>
    );
};

export default MarketingReportManager;
