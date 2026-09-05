import type { UserRoleDefinition, Permission } from '../types';

export const SYSTEM_ROLE_LEVELS: { level: number; title: string; description: string; color: string }[] = [
    { level: 10, title: 'سطح ۱۰ - مدیر ارشد سیستم (Super Admin)', description: 'دسترسی کامل نامحدود به تمامی ماژول‌ها و داده‌ها', color: 'rose' },
    { level: 8, title: 'سطح ۸ - مدیر ارشد بخش / بازرگانی', description: 'دسترسی مدیریتی، تاییدات، گزارشات و تنظیمات اجرایی', color: 'indigo' },
    { level: 6, title: 'سطح ۶ - سرپرست واحد / قراردادها', description: 'نظارت بر فرآیندها، ثبت، ویرایش و بازبینی پرونده‌ها', color: 'sky' },
    { level: 4, title: 'سطح ۴ - کارشناس تخصصی / کارشناس فروش', description: 'ثبت و پیگیری عملیات روزمره، صدور فرم‌ها و پیگیری', color: 'emerald' },
    { level: 2, title: 'سطح ۲ - کارمند اجرایی / اداری', description: 'دسترسی پایه، ثبت وظایف، ثبت مرخصی و مکاتبات', color: 'amber' },
    { level: 1, title: 'سطح ۱ - مشاهده‌گر (فقط خواندنی)', description: 'فقط مشاهده گزارش‌ها و اطلاعات بدون امکان تغییر', color: 'slate' },
];

export const DEFAULT_SYSTEM_ROLES: UserRoleDefinition[] = [
    {
        id: 'super-admin',
        name: 'مدیر ارشد سیستم',
        code: 'SUPER_ADMIN',
        description: 'دسترسی نامحدود به کلیه ماژول‌ها، تنظیمات، کنترل کاربران و عملیات سیستم',
        level: 10,
        color: 'rose',
        isSystem: true,
        permissions: [] // Admins have implicit full access
    },
    {
        id: 'sales-manager',
        name: 'مدیر فروش و بازرگانی',
        code: 'SALES_MANAGER',
        description: 'مدیریت و نظارت بر فرآیند فروش، تایید قراردادها، گزارشات و تحلیل بازار',
        level: 8,
        color: 'indigo',
        isSystem: true,
        permissions: [
            { module: 'users', actions: ['view', 'add', 'edit', 'delete'] },
            { module: 'conditions', actions: ['view', 'add', 'edit', 'delete'] },
            { module: 'cars', actions: ['view', 'add', 'edit', 'delete'] },
            { module: 'prices', actions: ['view', 'add', 'edit', 'delete'] },
            { module: 'vehicle-exit', actions: ['view', 'add', 'edit', 'delete'] },
            { module: 'announcements', actions: ['view', 'add', 'edit', 'delete'] },
            { module: 'reports', actions: ['view', 'add', 'edit', 'delete'] },
            { module: 'orders', actions: ['view', 'add', 'edit', 'delete'] },
            { module: 'inventory', actions: ['view', 'add', 'edit', 'delete'] },
            { module: 'commission', actions: ['view', 'add', 'edit', 'delete'] },
            { module: 'leave-requests', actions: ['view', 'add', 'edit'] }
        ]
    },
    {
        id: 'sales-supervisor',
        name: 'سرپرست فروش و قراردادها',
        code: 'SUPERVISOR',
        description: 'نظارت بر کارشناسان فروش، ثبت و بررسی پرونده‌ها و شرایط واگذاری',
        level: 6,
        color: 'sky',
        isSystem: true,
        permissions: [
            { module: 'users', actions: ['view', 'add', 'edit'] },
            { module: 'conditions', actions: ['view', 'add', 'edit'] },
            { module: 'cars', actions: ['view'] },
            { module: 'prices', actions: ['view', 'add', 'edit'] },
            { module: 'vehicle-exit', actions: ['view', 'add', 'edit'] },
            { module: 'announcements', actions: ['view'] },
            { module: 'orders', actions: ['view', 'add', 'edit'] },
            { module: 'inventory', actions: ['view'] },
            { module: 'leave-requests', actions: ['view', 'add'] }
        ]
    },
    {
        id: 'sales-expert',
        name: 'کارشناس فروش و پذیرش',
        code: 'SALES_EXPERT',
        description: 'ثبت پرونده مشتریان، فرم‌های خروج و پیگیری روند سفارشات و قیمت‌ها',
        level: 4,
        color: 'emerald',
        isSystem: true,
        permissions: [
            { module: 'users', actions: ['view', 'add', 'edit'] },
            { module: 'conditions', actions: ['view'] },
            { module: 'cars', actions: ['view'] },
            { module: 'prices', actions: ['view'] },
            { module: 'vehicle-exit', actions: ['view', 'add'] },
            { module: 'announcements', actions: ['view'] },
            { module: 'leave-requests', actions: ['view', 'add'] }
        ]
    },
    {
        id: 'staff-office',
        name: 'کارمند اداری و هماهنگی',
        code: 'STAFF',
        description: 'ثبت اطلاعات پایه، مکاتبات داخلی، پیگیری مرخصی‌ها و وظایف محوله',
        level: 2,
        color: 'amber',
        isSystem: true,
        permissions: [
            { module: 'users', actions: ['view'] },
            { module: 'announcements', actions: ['view'] },
            { module: 'leave-requests', actions: ['view', 'add'] }
        ]
    },
    {
        id: 'viewer',
        name: 'کاربر مشاهده‌گر (فقط خواندنی)',
        code: 'VIEWER',
        description: 'فقط مشاهده اطلاعات بدون امکان تغییر، ویرایش یا حذف داده‌ها',
        level: 1,
        color: 'slate',
        isSystem: true,
        permissions: [
            { module: 'users', actions: ['view'] },
            { module: 'cars', actions: ['view'] },
            { module: 'prices', actions: ['view'] },
            { module: 'announcements', actions: ['view'] }
        ]
    }
];

/**
 * Merge base system roles with custom roles retrieved from the Permissions API endpoint.
 */
export const mergeRoles = (customRolesFromApi: UserRoleDefinition[] = []): UserRoleDefinition[] => {
    const customList = Array.isArray(customRolesFromApi) ? customRolesFromApi : [];
    // Ensure no duplicate IDs between system and custom
    const customFiltered = customList.filter(c => !DEFAULT_SYSTEM_ROLES.some(s => s.id === c.id));
    return [...DEFAULT_SYSTEM_ROLES, ...customFiltered];
};

/**
 * Resolve the user's role, level, color and metadata using API data and available roles list.
 * Completely free of browser local storage.
 */
export const resolveUserRole = (
    username?: string, 
    currentRole?: string, 
    permLevel?: number,
    permRecord?: { roleId?: string; roleTitle?: string; level?: number; roleCode?: string },
    availableRoles?: UserRoleDefinition[]
): { roleId: string; roleTitle: string; userLevel: number; color: string; code: string; isSystem: boolean } => {
    const allRoles = availableRoles && availableRoles.length > 0 ? availableRoles : DEFAULT_SYSTEM_ROLES;

    // 1. Explicit roleId from Permissions API record
    if (permRecord && permRecord.roleId) {
        const found = allRoles.find(r => r.id === permRecord.roleId);
        if (found) {
            return {
                roleId: found.id,
                roleTitle: permRecord.roleTitle || found.name,
                userLevel: permRecord.level !== undefined ? permRecord.level : found.level,
                color: found.color,
                code: found.code,
                isSystem: found.isSystem
            };
        }
    }

    // 2. Admin role or level 10
    if (currentRole === 'ADMIN' || permLevel === 0 || (permRecord && permRecord.level !== undefined && permRecord.level >= 10)) {
        const adminRole = DEFAULT_SYSTEM_ROLES[0];
        return {
            roleId: adminRole.id,
            roleTitle: adminRole.name,
            userLevel: 10,
            color: 'rose',
            code: 'SUPER_ADMIN',
            isSystem: true
        };
    }

    // 3. Match by numeric level
    const targetLevel = permRecord?.level !== undefined ? permRecord.level : permLevel;
    if (targetLevel !== undefined && targetLevel > 0) {
        const matched = allRoles.find(r => r.level === targetLevel);
        if (matched) {
            return {
                roleId: matched.id,
                roleTitle: matched.name,
                userLevel: matched.level,
                color: matched.color,
                code: matched.code,
                isSystem: matched.isSystem
            };
        }
    }

    // 4. Default to staff office role
    const staffRole = DEFAULT_SYSTEM_ROLES[4];
    return {
        roleId: staffRole.id,
        roleTitle: staffRole.name,
        userLevel: 2,
        color: staffRole.color,
        code: staffRole.code,
        isSystem: true
    };
};
