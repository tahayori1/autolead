/**
 * Dynamic Menu & Navigation Configuration Registry
 * Allows full per-item and per-section visibility control.
 * Supports adding future menu items/groups seamlessly.
 */

export interface MenuItemDefinition {
    id: string;
    label: string;
    description?: string;
    isMandatory?: boolean; // If true, CANNOT be hidden (e.g., settings)
    adminOnly?: boolean;
}

export interface MenuGroupDefinition {
    id: string;
    label: string;
    description?: string;
    isCollapsible: boolean;
    items: MenuItemDefinition[];
}

/**
 * Items that CANNOT be hidden under any circumstances to prevent locking administrators out.
 */
export const MANDATORY_MENU_ITEMS: string[] = ['settings'];

/**
 * Single Source of Truth for all menu groups and sub-items in AutoLead.
 * Any new menu item or group added here will automatically appear in SettingsPage
 * and be dynamically managed without modifying any other toggle logic.
 */
export const MENU_GROUPS_REGISTRY: MenuGroupDefinition[] = [
    {
        id: 'home-group',
        label: 'پیشخوان و خدمات هوشمند',
        description: 'داشبورد اصلی و ابزارهای مکالمه هوشمند هوش مصنوعی',
        isCollapsible: false,
        items: [
            { id: 'home', label: 'پیشخوان اصلی', description: 'صفحه اصلی و خلاصه وضعیت سیستم' },
            { id: 'ai-assistant', label: 'چت هوشمند با مشتری', description: 'دستیار خودکار پاسخگویی به مشتریان' },
        ]
    },
    {
        id: 'sales',
        label: 'چرخه فروش و ارتباط با مشتریان',
        description: 'مدیریت مشتریان، قیمت‌گذاری روز خودروها، بخشنامه‌ها و ثبت سفارشات',
        isCollapsible: true,
        items: [
            { id: 'users', label: 'مدیریت مشتریان (CRM)', description: 'سامانه پیگیری سرنخ‌ها، ثبت تماس و وضعیت مشتریان' },
            { id: 'car-prices', label: 'قیمت روز خودروها', description: 'استعلام و مقایسه لحظه‌ای قیمت بازار و کارخانه' },
            { id: 'conditions', label: 'بخشنامه‌ها فروش', description: 'جدیدترین شرایط و بخشنامه‌های فروش نقدی و اقساطی' },
            { id: 'inventory', label: 'لیست موجودی خودروها', description: 'موجودی خودروهای قابل واگذاری و آماده تحویل' },
            { id: 'announcements', label: 'اطلاعیه‌های داخلی', description: 'بخشنامه‌ها و مصوبات درون‌سازمانی' },
            { id: 'car-orders', label: 'ثبت سفارش فروش', description: 'فرم ثبت سفارش و فرایند بررسی مالی خرید خودرو' },
            { id: 'zero-car-delivery', label: 'ورود و خروج خودروها', description: 'ثبت پلاک، شاسی و ورود خودروهای صفر' },
            { id: 'bank-letter', label: 'قرارداد صلح و نامه بانک', description: 'صدور معرفی‌نامه بانک (ساتنا/پایا) و صلح‌نامه' },
            { id: 'cars', label: 'کاتالوگ و مشخصات خودروها', description: 'مشخصات فنی و آپشن‌های تمامی مدل‌های خودرو' },
            { id: 'collaboration', label: 'نمایشگاه‌های همکار', description: 'اطلاعات و شبکه نمایشگاه‌های همکار' },
            { id: 'collaboration-cars', label: 'موجودی همکاران', description: 'فهرست خودروهای به اشتراک گذاشته شده توسط همکاران' },
        ]
    },
    {
        id: 'hr',
        label: 'امور اداری و هماهنگی',
        description: 'درخواست‌ها، حضور و غیاب، انبارداری و جلسات داخلی',
        isCollapsible: true,
        items: [
            { id: 'requests', label: 'درخواست‌های پرسنلی', description: 'سامانه جامع ثبت انواع درخواست‌ها' },
            { id: 'attendance', label: 'حضور و غیاب', description: 'کارکرد ماهانه و تردد پرسنل' },
            { id: 'storage-center', label: 'انبارداری و مصرفی', description: 'کنترل موجودی اقلام مصرفی و اداری' },
            { id: 'corrective-actions', label: 'اقدامات اصلاحی', description: 'پیگیری مصوبات، مغایرت‌ها و بهبود فرایندها' },
            { id: 'meeting-minutes', label: 'صورت‌جلسات اداری', description: 'ثبت و آرشیو جلسات هماهنگی هفتگی و ماهانه' },
            { id: 'anonymous-feedback', label: 'صندوق پیشنهادات و انتقادات', description: 'ارسال نظرات محرمانه به مدیریت' },
        ]
    },
    {
        id: 'advertising-group',
        label: 'تبلیغات و بازاریابی',
        description: 'کمپین‌ها، پیام‌رسان هوشمند، تبلیغ‌نویسی و تولید محتوا',
        isCollapsible: true,
        items: [
            { id: 'notification-center', label: 'پیام‌رسان هوشمند', description: 'ارسال انبوه پیامک، واتساپ و بله به مشتریان' },
            { id: 'advertising-report', label: 'گزارش عملکرد تبلیغات', description: 'تحلیل بازخورد و نرخ جذب کمپین‌های تبلیغاتی' },
            { id: 'advertising-campaigns', label: 'آنالیز کمپین‌ها', description: 'بررسی بودجه، ورودی و نرخ بازگشت کمپین‌ها', adminOnly: true },
            { id: 'advertising-writer', label: 'تبلیغ نویس هوشمند', description: 'نگارش متون جذاب تبلیغاتی برای دیوار و اینستاگرام' },
            { id: 'advertising-titles', label: 'title ساز هوشمند', description: 'ایجاد عناوین کلیک‌خور و جذاب' },
            { id: 'advertising-hooks', label: 'hook ساز هوشمند', description: 'قلاب‌های جلب توجه برای ویدیوها و استوری‌ها' },
            { id: 'advertising-ctas', label: 'CTA ساز هوشمند', description: 'فراخوان‌های قدرتمند اقدام به خرید (Call to Action)' },
            { id: 'advertising-contact', label: 'contact ساز هوشمند', description: 'الگوهای نگارش اطلاعات تماس سازمانی' },
        ]
    },
    {
        id: 'ops',
        label: 'چرخه تحویل و کارشناسی',
        description: 'کارشناسی خودروهای کارکرده و صدور برگه‌های خروج نهایی',
        isCollapsible: true,
        items: [
            { id: 'used-cars', label: 'کارشناسی خودرو کارکرده', description: 'بررسی رنگ، شاسی، فنی و ثبت سوابق کارکرد' },
            { id: 'vehicle-exit', label: 'خروج نهایی خودرو', description: 'صدور و اعتبارسنجی مجوز خروج از نمایندگی' },
        ]
    },
    {
        id: 'stats',
        label: 'آمار، نظرسنجی و امور مالی',
        description: 'داشبورد پاسخگویی تلفنی، رتبه‌بندی عملکرد، کمیسیون و رضایت مشتری',
        isCollapsible: true,
        items: [
            { id: 'reports', label: 'گزارشات و نمودارهای تحلیلی', description: 'رتبه‌بندی ۵ معیار پرسنل و شاخص‌های کلیدی CRM' },
            { id: 'operator-scores', label: 'آمار پاسخگویی اپراتورها', description: 'داشبورد زنده پایش تماس‌های پاسخ داده شده تلفنی' },
            { id: 'commission', label: 'کمیسیون و پاداش معاملات', description: 'محاسبه سهم پرسنل از معاملات و تسویه‌حساب' },
            { id: 'poll', label: 'نظرسنجی مشتریان', description: 'سنجش سطح رضایت مشتریان پس از خرید یا مراجعه' },
        ]
    },
    {
        id: 'system',
        label: 'تنظیمات و مدیریت دسترسی',
        description: 'پروفایل کاربری، اطلاعات شرکت و دسترسی‌ها',
        isCollapsible: true,
        items: [
            { id: 'my-profile', label: 'پروفایل کاربری من', description: 'مشاهده مشخصات فردی و تغییر رمز عبور' },
            { id: 'about', label: 'درباره و سوابق تغییرات', description: 'اطلاعات نگارش و لاگ به‌روزرسانی‌های نرم‌افزار' },
            { id: 'access-control', label: 'مدیریت دسترسی کاربران', description: 'تعریف نقش‌ها و ماتریس دسترسی به بخش‌ها', adminOnly: true },
            { 
                id: 'settings', 
                label: 'تنظیمات عمومی سیستم', 
                description: 'پیکربندی سامانه، پیام‌رسان‌ها و اطلاعات نمایندگی (غیرقابل مخفی‌سازی)', 
                isMandatory: true, 
                adminOnly: true 
            },
        ]
    },
];

/**
 * Default list of items hidden on first visit
 */
export const DEFAULT_HIDDEN_MENU_ITEMS: string[] = [
    'ai-assistant',
    'car-orders',
    'zero-car-delivery',
    'attendance',
    'meeting-minutes',
    'anonymous-feedback',
    'advertising-group',
    'notification-center',
    'advertising-report',
    'advertising-campaigns',
    'advertising-writer',
    'advertising-titles',
    'advertising-hooks',
    'advertising-ctas',
    'advertising-contact',
    'ops',
    'used-cars',
    'vehicle-exit',
    'poll',
];

/**
 * Helper to flatten all registered menu items across all groups
 */
export const getAllRegisteredMenuItems = (): MenuItemDefinition[] => {
    return MENU_GROUPS_REGISTRY.flatMap(group => group.items);
};

/**
 * Retrieves the currently hidden menu item and group IDs from localStorage
 * Guarantees mandatory items (like 'settings') are NEVER in the hidden list.
 */
export const getHiddenMenuItems = (): string[] => {
    try {
        const saved = localStorage.getItem('hiddenMenuItems');
        if (saved !== null) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                // Filter out any mandatory items in case they were previously stored
                return parsed.filter(id => !MANDATORY_MENU_ITEMS.includes(id));
            }
        }
    } catch (e) {
        console.error('Error reading hiddenMenuItems from localStorage:', e);
    }
    return DEFAULT_HIDDEN_MENU_ITEMS.filter(id => !MANDATORY_MENU_ITEMS.includes(id));
};

/**
 * Persists hidden menu items and groups to localStorage and dispatches a live event.
 * Ensures mandatory items can never be hidden.
 */
export const saveHiddenMenuItems = (items: string[]): void => {
    try {
        const safeItems = items.filter(id => !MANDATORY_MENU_ITEMS.includes(id));
        localStorage.setItem('hiddenMenuItems', JSON.stringify(safeItems));
        window.dispatchEvent(new CustomEvent('menu-visibility-changed', { detail: safeItems }));
    } catch (e) {
        console.error('Error saving hiddenMenuItems to localStorage:', e);
    }
};

/**
 * Checks if a specific menu item is marked as hidden
 */
export const isMenuItemHidden = (id: string, hiddenList?: string[]): boolean => {
    if (MANDATORY_MENU_ITEMS.includes(id)) return false;
    const list = hiddenList || getHiddenMenuItems();
    return list.includes(id);
};

/**
 * Checks if a whole group/section is marked as hidden
 */
export const isGroupHidden = (groupId: string, hiddenList?: string[]): boolean => {
    const list = hiddenList || getHiddenMenuItems();
    return list.includes(groupId);
};
