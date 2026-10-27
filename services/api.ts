
import type { 
    Car, 
    CarSaleCondition, 
    User, 
    LeadMessage, 
    DealershipInfo, 
    CarPrice, 
    ScrapedCarPrice, 
    CarPriceSource, 
    CarPriceStats,
    ActiveLead,
    DeliveryProcess,
    DeliveryStatus,
    StaffUser,
    ApiSystemUser,
    Permission,
    UserRoleDefinition,
    PollApiResponseItem,
    ProcessedPollData,
    ZeroCarDelivery,
    CorrectiveAction,
    LeaveRequest,
    AnonymousFeedback,
    MeetingMinute,
    MyProfile,
    NotificationLog,
    MessageTemplate,
    AdCampaign,
    UsedCar,
    CarOrder,
    CustomerJournal,
    Announcement,
    OvertimeRequest,
    CrmCallLog,
    TelephonyCallLog,
    SalaryAdvanceRequest,
    CrmMeeting,
    AdvertisementReport,
    DivarPriceItem,
    DivarAdvDetail,
    CollaborationShowroom,
    CollaborationCar,
    OrderPartner,
    StorageItem,
    StockTransaction,
    CallScoreItem
} from '../types';


export type { StorageItem, StockTransaction };

const API_BASE_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1';

const handleResponse = async (response: Response) => {
    if (response.status === 401) {
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('authToken');
        window.location.reload();
        throw new Error('نشست شما منقضی شده است. لطفا دوباره وارد شوید.');
    }

    if (response.ok) {
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return null;
        }
        const text = await response.text();
        if (!text || !text.trim()) {
            return null;
        }
        try {
            return JSON.parse(text);
        } catch (e) {
            return text;
        }
    } else {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: `Request failed with status ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
};

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const ensureOnline = () => {
    if (!navigator.onLine) {
        throw new Error('این عملیات در حالت آفلاین امکان‌پذیر نیست.');
    }
};

// --- Auth ---

export const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

// --- User Activity & Presence Tracking ---

export interface UserActivityEntry {
    lastLogin?: string;
    lastActivity?: string;
    lastActivityAction?: string;
    userAgent?: string;
}

const ACTIVITY_MAP_KEY = 'autolead_users_activity_map';

export const getAllUsersActivityMap = (): Record<string, UserActivityEntry> => {
    try {
        const raw = localStorage.getItem(ACTIVITY_MAP_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

/**
 * Specifically records a user login event.
 * Updates both lastLogin and lastActivity at login time.
 */
export const recordUserLogin = (username: string, userId?: number): void => {
    if (!username) return;
    try {
        const now = new Date().toISOString();
        const map = getAllUsersActivityMap();
        const key = username.trim().toLowerCase();
        const existing = map[key] || {};
        map[key] = {
            ...existing,
            lastLogin: now,
            lastActivity: now,
            lastActivityAction: 'ورود موفق به حساب کاربری',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
        };
        localStorage.setItem(ACTIVITY_MAP_KEY, JSON.stringify(map));
        localStorage.setItem('currentUsername', username.trim());
        sessionStorage.setItem('currentUsername', username.trim());
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('user-activity-updated', { 
                detail: { username: username.trim(), type: 'login', time: now } 
            }));
        }
    } catch (e) {
        console.warn('Could not record user login:', e);
    }
};

/**
 * Records user activity (such as dashboard interactions, route changes, or live 10-minute heartbeat).
 * CRITICAL: This NEVER modifies lastLogin. lastLogin is preserved strictly for authentication events.
 */
export const recordUserActivity = (action: string = 'فعالیت در سامانه', specificUsername?: string): void => {
    try {
        const username = specificUsername || localStorage.getItem('currentUsername') || sessionStorage.getItem('currentUsername');
        if (!username) return;
        const now = new Date().toISOString();
        const map = getAllUsersActivityMap();
        const key = username.trim().toLowerCase();
        const existing = map[key] || {};
        
        // Preserve existing lastLogin strictly
        map[key] = {
            ...existing,
            lastActivity: now,
            lastActivityAction: action,
        };
        localStorage.setItem(ACTIVITY_MAP_KEY, JSON.stringify(map));

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('user-activity-updated', { 
                detail: { username: username.trim(), type: 'activity', action, time: now } 
            }));
        }
    } catch (e) {
        console.warn('Could not record user activity:', e);
    }
};

/**
 * Sends a periodic live heartbeat pulse (every 10 minutes) when the app is open and active.
 */
export const sendLiveHeartbeatPulse = (customAction: string = 'پالس زنده فعالیت (هر ۱۰ دقیقه)'): void => {
    recordUserActivity(customAction);
};

export const getUserActivityInfo = (username: string): UserActivityEntry | undefined => {
    if (!username) return undefined;
    const map = getAllUsersActivityMap();
    return map[username.trim().toLowerCase()];
};

export const formatJalaliDateTime = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    try {
        const cleaned = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
        const d = new Date(cleaned);
        if (isNaN(d.getTime())) return dateStr;
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(d);
    } catch {
        return dateStr;
    }
};

export const formatJalaliDateOnly = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    try {
        const cleaned = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
        const d = new Date(cleaned);
        if (isNaN(d.getTime())) return dateStr;
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        }).format(d);
    } catch {
        return dateStr;
    }
};

export const getRelativeTimeAgo = (dateStr?: string | null): string => {
    if (!dateStr) return 'نامشخص';
    try {
        const cleaned = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
        const d = new Date(cleaned);
        if (isNaN(d.getTime())) return dateStr;
        const now = Date.now();
        const diffMs = now - d.getTime();
        if (diffMs < 0) return 'هم‌اکنون';
        
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'هم‌اکنون';
        if (diffMins < 60) return `${diffMins.toLocaleString('fa-IR')} دقیقه پیش`;
        if (diffHours < 24) return `${diffHours.toLocaleString('fa-IR')} ساعت پیش`;
        if (diffDays === 1) return 'دیروز';
        if (diffDays < 30) return `${diffDays.toLocaleString('fa-IR')} روز پیش`;
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `${diffMonths.toLocaleString('fa-IR')} ماه پیش`;
        return `${Math.floor(diffMonths / 12).toLocaleString('fa-IR')} سال پیش`;
    } catch {
        return dateStr;
    }
};

export type UserOnlineStatus = 'online' | 'recent' | 'offline';

export const getUserPresenceStatus = (lastActivityIso?: string | null): {
    status: UserOnlineStatus;
    label: string;
    colorClass: string;
    dotClass: string;
} => {
    if (!lastActivityIso) {
        return {
            status: 'offline',
            label: 'آفلاین',
            colorClass: 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-400',
            dotClass: 'bg-slate-400'
        };
    }

    try {
        const cleaned = lastActivityIso.includes('T') ? lastActivityIso : lastActivityIso.replace(' ', 'T');
        const d = new Date(cleaned);
        if (isNaN(d.getTime())) {
            return {
                status: 'offline',
                label: 'آفلاین',
                colorClass: 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-400',
                dotClass: 'bg-slate-400'
            };
        }

        const diffMinutes = (Date.now() - d.getTime()) / (1000 * 60);

        if (diffMinutes <= 12) {
            return {
                status: 'online',
                label: 'هم‌اکنون آنلاین',
                colorClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
                dotClass: 'bg-emerald-500 animate-pulse'
            };
        } else if (diffMinutes <= 60) {
            return {
                status: 'recent',
                label: 'اخیراً فعال',
                colorClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
                dotClass: 'bg-amber-500'
            };
        } else {
            return {
                status: 'offline',
                label: 'آفلاین',
                colorClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
                dotClass: 'bg-slate-400'
            };
        }
    } catch {
        return {
            status: 'offline',
            label: 'آفلاین',
            colorClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            dotClass: 'bg-slate-400'
        };
    }
};

export const login = async (username: string, password: string): Promise<{ token: string; id: number }> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        const data = await response.json();
        let result: { token: string; id: number } | null = null;
        if (Array.isArray(data) && data.length > 0) {
            result = data[0];
        } else if (data && typeof data === 'object' && !Array.isArray(data) && data.token && data.id) {
            result = data;
        }
        if (result) {
            recordUserLogin(username, result.id);
            recordUserActivity('ورود به سیستم', username);
            return result;
        }
        throw new Error('فرمت پاسخ ورود نامعتبر است.');
    } else {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: 'نام کاربری یا رمز عبور اشتباه است.' };
        }
        throw new Error(errorData.message || `خطا در ورود: ${response.status}`);
    }
};

export const createUserAccount = async (username: string, password: string): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/auth/new`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        return;
    } else {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: 'ایجاد کاربر با خطا مواجه شد. شاید این نام کاربری قبلا استفاده شده باشد.' };
        }
        throw new Error(errorData.message || `خطا در ایجاد کاربر: ${response.status}`);
    }
};

export const syncPasswordChangeToWebhook = async (username: string, passwordHash: string): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/auth/new`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, password: passwordHash }),
    });

    if (response.ok) {
        return;
    } else {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: 'خطا در ارتباط با وب‌هوک همگام‌سازی رمز عبور.' };
        }
        throw new Error(errorData.message || `خطا در همگام‌سازی رمز عبور: ${response.status}`);
    }
};

// --- Staff Management ---

let cachedStaffUsers: StaffUser[] = [];
export const setCachedStaffUsers = (users: StaffUser[]) => {
    cachedStaffUsers = users;
};
export const getCachedStaffUsers = (): StaffUser[] => {
    return cachedStaffUsers;
};

const USER_MGMT_URL = `${API_BASE_URL}/auth/user`;

export const getStaffUsers = async (): Promise<StaffUser[]> => {
    ensureOnline();
    
    // Fetch users and permissions. We handle permissions failure gracefully.
    const usersPromise = (async () => {
        const response = await fetch(`${API_BASE_URL}/auth/userslist`, { headers: getAuthHeaders() });
        return handleResponse(response);
    })();

    const permissionsPromise = permissionsService.getAll().catch(() => []); // Return empty array on failure

    const [apiUsers, allPermissions] = await Promise.all([usersPromise, permissionsPromise]);
    
    let usersArray: ApiSystemUser[] = [];
    if (Array.isArray(apiUsers)) {
        usersArray = apiUsers;
    } else if (apiUsers && typeof apiUsers === 'object') {
        // Handle single object response
        usersArray = [apiUsers as ApiSystemUser];
    } else {
        console.error("Expected an array of users from API, but got:", apiUsers);
        return [];
    }

    const activityMap = getAllUsersActivityMap();

    const staffList: StaffUser[] = usersArray.map(user => {
        const isAdmin = user.isAdmin === 1;
        const usernameKey = (user.username || '').trim().toLowerCase();
        const activity = activityMap[usernameKey];
        
        // Find permission record for this user (excluding role definition records)
        const permRecord = (allPermissions as any[]).find((p: any) => 
            p && p.username === user.username && !p.isRoleDefinition && !String(p.username).startsWith('__ROLE__:')
        );

        const userLevel = permRecord?.level !== undefined ? Number(permRecord.level) : (isAdmin ? 10 : (user.permission_level === 0 ? 10 : 2));
        const roleTitle = permRecord?.roleTitle || (isAdmin ? 'مدیر ارشد سیستم' : (userLevel >= 10 ? 'مدیر ارشد سیستم' : 'کارمند اداری'));
        const roleId = permRecord?.roleId || (isAdmin ? 'super-admin' : (userLevel >= 10 ? 'super-admin' : 'staff-office'));
        
        // If user is admin, they have implicit full permissions. Otherwise, use stored permissions.
        const permissions = isAdmin ? [] : (permRecord?.permissions || []);
        
        const registerTime = user.register_time || user.last_update || new Date().toISOString();
        const lastLogin = activity?.lastLogin || user.last_login || user.last_update || user.register_time;
        const lastActivity = activity?.lastActivity || user.last_activity || user.last_update || lastLogin;
        const lastActivityAction = activity?.lastActivityAction || (activity?.lastActivity ? 'فعالیت در سیستم' : 'حضور در سامانه');

        return {
            id: user.id,
            username: user.username,
            fullName: user.full_name || user.username,
            full_name: user.full_name || user.username,
            role: isAdmin ? 'ADMIN' : 'STAFF',
            roleTitle: roleTitle,
            roleId: roleId,
            userLevel: userLevel,
            permission_level: user.permission_level !== undefined ? user.permission_level : (userLevel >= 10 ? 0 : 1),
            permissions: permissions,
            registerTime: registerTime,
            register_time: registerTime,
            createdAt: registerTime,
            lastLogin: lastLogin,
            last_login: lastLogin,
            lastActivity: lastActivity,
            last_activity: lastActivity,
            lastActivityAction: lastActivityAction,
            mobile: user.mobile || null,
            email: user.email || null,
            isActive: true 
        };
    });

    cachedStaffUsers = staffList;
    return staffList;
};

const addApiUser = async (payload: any): Promise<ApiSystemUser> => {
    const response = await fetch(USER_MGMT_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await handleResponse(response);
    if (Array.isArray(data) && data.length > 0) return data[0];
    if (data && typeof data === 'object' && 'id' in data) return data;
    throw new Error('Could not retrieve created user from API response.');
};

const updateApiUser = async (payload: any) => {
    const response = await fetch(USER_MGMT_URL, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
};

const deleteApiUser = async (id: number) => {
    const response = await fetch(USER_MGMT_URL, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id })
    });
    return handleResponse(response);
};

export const saveStaffUser = async (user: Omit<Partial<StaffUser & MyProfile>, 'id'> & { id?: number | string }): Promise<ApiSystemUser | void> => {
    ensureOnline();
    
    const fullNameValue = (user.fullName || user.full_name || '').trim();
    const usernameValue = (user.username || '').trim();

    // Prepare a comprehensive payload for the API
    const apiPayload: any = {
        // Core fields
        username: usernameValue,
        full_name: fullNameValue,
        isAdmin: user.role === 'ADMIN' ? 1 : 0,
        permission_level: user.role === 'ADMIN' ? 0 : 1,
        
        // Profile fields
        mobile: user.mobile ?? null,
        email: user.email ?? null,
        birth_date: user.birth_date ?? null,
        mbti: user.mbti ?? null,
        description: user.description ?? null,
        whatsapp_apikey: user.whatsapp_apikey ?? null,
    };

    if (user.password) {
        apiPayload.password = user.password;
    }

    let createdUser: ApiSystemUser | undefined;
    if (typeof user.id === 'number') {
        // This is an update.
        apiPayload.id = user.id;

        // 1. Update profile via MyProfile endpoint (standard profile endpoint)
        let profileSaved = false;
        try {
            await updateUserProfileAsAdmin(user.id, {
                full_name: fullNameValue,
                mobile: user.mobile ?? null,
                email: user.email ?? null,
                birth_date: user.birth_date ?? null,
                mbti: user.mbti ?? null,
                description: user.description ?? null,
                whatsapp_apikey: user.whatsapp_apikey ?? null,
                isAdmin: (user.role === 'ADMIN' ? 1 : 0) as (0 | 1),
                permission_level: user.role === 'ADMIN' ? 0 : 1,
                username: usernameValue
            });
            profileSaved = true;
        } catch (profileError) {
            console.warn("MyProfile update warning:", profileError);
        }

        // 2. Also attempt update via auth/user endpoint
        try {
            await updateApiUser(apiPayload);
            profileSaved = true;
        } catch (authError) {
            console.warn("auth/user update warning:", authError);
            if (!profileSaved) {
                // If both failed, try one more fallback via PUT /auth
                try {
                    const fallbackPayload: any = {
                        id: user.id,
                        username: usernameValue,
                        full_name: fullNameValue
                    };
                    const resp = await fetch(`${API_BASE_URL}/auth`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(fallbackPayload)
                    });
                    if (resp.ok) {
                        profileSaved = true;
                    }
                } catch (fallbackErr) {
                    console.warn("auth fallback warning:", fallbackErr);
                }
            }
        }
    } else {
        // This is a create.
        try {
            createdUser = await addApiUser(apiPayload);
        } catch (addError) {
            console.warn("addApiUser warning, attempting createUserAccount fallback:", addError);
            if (usernameValue && user.password) {
                await createUserAccount(usernameValue, user.password);
            } else {
                throw addError;
            }
        }
    }

    // Sync password to webhook if password is set or changed
    if (user.password && usernameValue) {
        try {
            await syncPasswordChangeToWebhook(usernameValue, user.password);
        } catch (pwdErr) {
            console.warn("Password sync warning:", pwdErr);
        }
    }
    
    // The permissions & role assignment logic via Permissions API endpoint
    const usernameForPerms = createdUser ? createdUser.username : usernameValue;
    if (usernameForPerms) {
        try {
            const allPermissions = await permissionsService.getAll();
            const existingRecord = (allPermissions as any[]).find((p: any) => 
                p && p.username === usernameForPerms && !p.isRoleDefinition && !String(p.username).startsWith('__ROLE__:')
            );

            const userRoleTitle = user.roleTitle || (user.role === 'ADMIN' ? 'مدیر ارشد سیستم' : 'کاربر سیستم');
            const userRoleId = user.roleId || (user.role === 'ADMIN' ? 'super-admin' : 'staff-office');
            const userLevel = user.userLevel !== undefined ? user.userLevel : (user.role === 'ADMIN' ? 10 : 2);
            const permList = user.role === 'ADMIN' ? [] : (user.permissions || []);

            const permPayload = {
                username: usernameForPerms,
                roleId: userRoleId,
                roleTitle: userRoleTitle,
                roleCode: user.role === 'ADMIN' ? 'SUPER_ADMIN' : 'STAFF',
                level: userLevel,
                permissions: permList,
                updatedAt: new Date().toISOString()
            };

            if (existingRecord && existingRecord.id) {
                await permissionsService.update({
                    ...permPayload,
                    id: existingRecord.id
                });
            } else {
                await permissionsService.create(permPayload);
            }
        } catch (permError) {
            console.warn("Permissions update warning:", permError);
        }
    }
    
    if (createdUser) {
        return createdUser;
    }
};

export const deleteStaffUser = async (id: number, username: string): Promise<void> => {
    ensureOnline();
    
    // Server-side deletion of user
    await deleteApiUser(id);

    // Delete permissions record
    try {
        const allPermissions = await permissionsService.getAll();
        const existingRecord = (allPermissions as any[]).find((p: any) => 
            p && p.username === username && !p.isRoleDefinition && !String(p.username).startsWith('__ROLE__:')
        );
        if (existingRecord && existingRecord.id) {
            await permissionsService.delete(existingRecord.id);
        }
    } catch (e) {
        console.warn("Permission deletion warning:", e);
    }
};


// --- Car Sale Conditions & Datetime Helpers ---

/**
 * Formats any Date, timestamp, ISO string, or date string to standard MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
 * Completely removes ISO 'T', 'Z', milliseconds, and timezone offsets so MySQL DATETIME / TIMESTAMP columns accept it without error.
 * Example output: '2026-09-06 10:39:29'
 */
export const toMySQLDateTime = (input?: Date | string | number | null): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatToSqlString = (d: Date): string => {
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        const seconds = pad(d.getSeconds());
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    if (!input) {
        return formatToSqlString(new Date());
    }

    if (input instanceof Date) {
        return isNaN(input.getTime()) ? formatToSqlString(new Date()) : formatToSqlString(input);
    }

    if (typeof input === 'number') {
        const d = new Date(input);
        return isNaN(d.getTime()) ? formatToSqlString(new Date()) : formatToSqlString(d);
    }

    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed.startsWith('0000')) {
            return formatToSqlString(new Date());
        }

        // If already in standard MySQL format: YYYY-MM-DD HH:MM:SS
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
            return trimmed;
        }

        // If Date only: YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return `${trimmed} 00:00:00`;
        }

        // Try standard Date parsing (handles ISO 8601 strings with Z or offsets properly)
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
            return formatToSqlString(d);
        }

        // Fallback regex matching YYYY-MM-DD and HH:MM:SS
        const match = trimmed.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
        if (match) {
            const [_, y, m, day, h, min, s = '00'] = match;
            return `${y}-${m}-${day} ${h}:${min}:${s.padStart(2, '0')}`;
        }
    }

    return formatToSqlString(new Date());
};

export const isValidDateString = (d: any): boolean => {
    if (!d) return false;
    const s = String(d).trim();
    if (!s || s === 'null' || s === 'undefined' || s === '0' || s === '0000-00-00' || s === '0000-00-00 00:00:00' || s.startsWith('0000')) {
        return false;
    }
    return true;
};

export const parseAndFormatPersianDateTime = (rawDate: any): string => {
    if (!rawDate) return '';
    try {
        const str = String(rawDate).trim();
        if (!str || str === 'null' || str === 'undefined' || str.startsWith('0000')) return '';

        // If string already contains Persian year (14xx or 13xx or ۱۴xx)
        if (str.startsWith('14') || str.startsWith('13') || str.startsWith('۱۴') || str.startsWith('۱۳')) {
            return str;
        }

        // Standard regex for ISO or SQL timestamp: YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS
        const parts = str.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
        if (parts) {
            const [_, y, m, d, h, min] = parts.map(Number);
            // If it's pure MySQL local datetime (no Z or offset in string), use local time
            const isLocal = !str.includes('Z') && !str.includes('+') && !str.match(/-\d{2}:\d{2}$/);
            const dateObj = isLocal ? new Date(y, m - 1, d, h, min) : new Date(str);
            if (!isNaN(dateObj.getTime())) {
                const persianDate = dateObj.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
                const persianTime = dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
                return `${persianDate} - ${persianTime}`;
            }
        }

        // Regex for date-only: YYYY-MM-DD
        const dateOnlyParts = str.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (dateOnlyParts) {
            const [_, y, m, d] = dateOnlyParts.map(Number);
            const dateObj = new Date(y, m - 1, d);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            }
        }

        const parsedDate = new Date(str);
        if (!isNaN(parsedDate.getTime())) {
            const persianDate = parsedDate.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const persianTime = parsedDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
            return `${persianDate} - ${persianTime}`;
        }

        return str;
    } catch {
        return String(rawDate);
    }
};

export interface ConditionDateInfo {
    formattedDate: string;
    isUpdateDate: boolean;
    dateLabel: string;        // 'بروزرسانی:' or 'تاریخ ایجاد:'
    longLabel: string;        // 'تاریخ و ساعت آخرین بروزرسانی:' or 'تاریخ و ساعت ایجاد:'
    createdDateFormatted?: string;
    updatedDateFormatted?: string;
}

export const getConditionDateInfo = (condition: CarSaleCondition | Partial<CarSaleCondition> | any): ConditionDateInfo => {
    if (!condition) {
        return {
            formattedDate: '—',
            isUpdateDate: false,
            dateLabel: 'تاریخ ایجاد:',
            longLabel: 'تاریخ و ساعت ایجاد:'
        };
    }

    const rawUpdate = condition.updatedAt || condition.updated_at || condition.last_update || condition.last_updated;
    const rawCreate = condition.createdAt || condition.created_at || condition.date || condition.timestamp;

    const hasValidUpdate = isValidDateString(rawUpdate);
    const hasValidCreate = isValidDateString(rawCreate);

    const formattedUpdate = hasValidUpdate ? parseAndFormatPersianDateTime(rawUpdate) : '';
    const formattedCreate = hasValidCreate ? parseAndFormatPersianDateTime(rawCreate) : '';

    if (hasValidUpdate && formattedUpdate) {
        return {
            formattedDate: formattedUpdate,
            isUpdateDate: true,
            dateLabel: 'بروزرسانی:',
            longLabel: 'تاریخ و ساعت آخرین بروزرسانی:',
            updatedDateFormatted: formattedUpdate,
            createdDateFormatted: formattedCreate || undefined
        };
    }

    // اگر تاریخ بروزرسانی معلوم نبود، تاریخ ایجاد را می‌نویسد
    if (hasValidCreate && formattedCreate) {
        return {
            formattedDate: formattedCreate,
            isUpdateDate: false,
            dateLabel: 'تاریخ ایجاد:',
            longLabel: 'تاریخ و ساعت ایجاد:',
            createdDateFormatted: formattedCreate
        };
    }

    return {
        formattedDate: 'نامشخص',
        isUpdateDate: false,
        dateLabel: 'تاریخ ایجاد:',
        longLabel: 'تاریخ و ساعت ایجاد:'
    };
};

export const formatConditionDateTime = (condition: CarSaleCondition | Partial<CarSaleCondition> | any): string => {
    const info = getConditionDateInfo(condition);
    return info.formattedDate;
};

/**
 * Resolves any user identifier (username, email, ID, or name) to Persian First and Last Name (نام و نام خانوادگی).
 */
export const resolveUserFullName = (
    identifier?: string | number | null, 
    customStaffList?: StaffUser[]
): string => {
    if (identifier === null || identifier === undefined) return '';
    const raw = String(identifier).trim();
    if (!raw || raw === 'undefined' || raw === 'null') return '';

    // If it's already a clean Persian full name (has Persian letters, no @, not "admin")
    const hasPersian = /[\u0600-\u06FF]/.test(raw);
    const hasAt = raw.includes('@');
    
    // Static well-known system dictionary for quick matching
    const knownDictionary: Record<string, string> = {
        'admin': 'مدیر سیستم (سید علی حسینی)',
        'administrator': 'مدیر سیستم (سید علی حسینی)',
        'hoseini': 'سید علی حسینی',
        'hoseinikhodro': 'سید علی حسینی',
        'hoseinikhodro@gmail.com': 'سید علی حسینی',
        'tahayori': 'علیرضا طاهری',
        'tahayori1': 'علیرضا طاهری',
        'tahayori1@gmail.com': 'علیرضا طاهری',
        'taha': 'طاها طاهری',
        'system': 'کاربر سیستم',
        'سیستم': 'کاربر سیستم',
        'کاربر سیستم': 'کاربر سیستم',
    };

    const key = raw.toLowerCase().trim();
    if (knownDictionary[key]) {
        return knownDictionary[key];
    }

    // Check custom staff list or cached staff list
    const staff = (customStaffList && customStaffList.length > 0) ? customStaffList : cachedStaffUsers;
    if (staff && staff.length > 0) {
        const found = staff.find(u => {
            const uName = (u.username || '').toLowerCase().trim();
            const uEmail = (u.email || '').toLowerCase().trim();
            const uId = String(u.id);
            const uMobile = (u.mobile || '').replace(/\D/g, '');
            const cleanRaw = raw.replace(/\D/g, '');

            return (
                uName === key ||
                uEmail === key ||
                (hasAt && uEmail.split('@')[0] === key.split('@')[0]) ||
                uId === raw ||
                (cleanRaw && cleanRaw.length >= 7 && uMobile && uMobile.endsWith(cleanRaw))
            );
        });

        if (found && (found.fullName || found.full_name)) {
            return (found.fullName || found.full_name || '').trim();
        }
    }

    // Check localStorage currentUser info
    try {
        const storedFullName = localStorage.getItem('currentUserFullName') || localStorage.getItem('userFullName');
        const storedUsername = localStorage.getItem('currentUsername') || localStorage.getItem('username');
        if (storedFullName && storedUsername && storedUsername.toLowerCase() === key) {
            return storedFullName;
        }
    } catch {}

    // If it contains Persian letters and is at least 3 chars long and no @, treat it as full name
    if (hasPersian && !hasAt) {
        return raw;
    }

    // If it is an email, check if the username part matches knownDictionary
    if (hasAt) {
        const userPart = raw.split('@')[0].toLowerCase();
        if (knownDictionary[userPart]) {
            return knownDictionary[userPart];
        }
    }

    return raw;
};

const normalizeCondition = (condition: any): CarSaleCondition => {
    if (!condition) return condition;

    const { 
        indeed_status, 
        is_public, 
        stock_quantity, 
        stock, 
        stock_qty, 
        qty, 
        inventory, 
        updatedAt,
        updated_at,
        last_update,
        last_updated,
        createdAt,
        created_at,
        created_by,
        createdBy,
        created_by_name,
        createdByName,
        updated_by,
        updatedBy,
        updated_by_name,
        updatedByName,
        ...restOfApiData 
    } = condition;
    
    const colorsArray = typeof condition.colors === 'string'
        ? condition.colors.split(',').map((c: string) => c.trim()).filter(Boolean)
        : Array.isArray(condition.colors)
            ? condition.colors
            : [];

    const rawStock = stock_quantity !== undefined ? stock_quantity
                     : stock !== undefined ? stock
                     : stock_qty !== undefined ? stock_qty
                     : qty !== undefined ? qty
                     : inventory !== undefined ? inventory
                     : 0;

    const hasValidUpdate = isValidDateString(updatedAt || updated_at || last_update || last_updated);
    const hasValidCreate = isValidDateString(createdAt || created_at);

    const updateStamp = hasValidUpdate ? (updatedAt || updated_at || last_update || last_updated) : null;
    const createStamp = hasValidCreate ? (createdAt || created_at) : null;

    const creatorNameVal = created_by_name || createdByName || null;
    const creatorUserVal = created_by || createdBy || restOfApiData.author || creatorNameVal || null;
    const creatorResolvedFullName = resolveUserFullName(creatorNameVal || creatorUserVal) || creatorNameVal || creatorUserVal || 'کاربر سیستم';

    const updaterNameVal = updated_by_name || updatedByName || null;
    const updaterUserVal = updated_by || updatedBy || updaterNameVal || null;
    const updaterResolvedFullName = updaterUserVal ? (resolveUserFullName(updaterNameVal || updaterUserVal) || updaterNameVal || updaterUserVal) : null;
            
    return { 
        ...restOfApiData, 
        document_status: indeed_status,
        colors: colorsArray,
        is_public: !!is_public,
        stock_quantity: parseInt(rawStock, 10) || 0,
        created_by: creatorUserVal,
        createdBy: creatorUserVal,
        created_by_name: creatorResolvedFullName,
        updated_by: updaterUserVal,
        updatedBy: updaterUserVal,
        updated_by_name: updaterResolvedFullName,
        updatedAt: updateStamp,
        updated_at: updateStamp,
        createdAt: createStamp,
        created_at: createStamp,
    } as CarSaleCondition;
};

const denormalizeCondition = (condition: Omit<CarSaleCondition, 'id'> | CarSaleCondition) => {
    const { document_status, ...restOfAppData } = condition;
    const stockQtyVal = typeof condition.stock_quantity === 'number' 
        ? condition.stock_quantity 
        : parseInt(condition.stock_quantity as any, 10) || 0;

    const creatorVal = condition.created_by || condition.createdBy || condition.created_by_name || null;
    const creatorFullName = condition.created_by_name || resolveUserFullName(creatorVal) || creatorVal;

    const updaterVal = condition.updated_by || condition.updatedBy || condition.updated_by_name || null;
    const updaterFullName = condition.updated_by_name || (updaterVal ? resolveUserFullName(updaterVal) : null) || updaterVal;
    
    // Convert all datetime fields strictly to MySQL 'YYYY-MM-DD HH:MM:SS' format
    const createdAtVal = toMySQLDateTime(condition.createdAt || condition.created_at);
    const updatedAtVal = toMySQLDateTime(condition.updatedAt || condition.updated_at);

    return {
        ...restOfAppData,
        indeed_status: document_status,
        colors: Array.isArray(condition.colors) ? condition.colors.join(',') : '',
        is_public: condition.is_public ? 1 : 0,
        stock_quantity: stockQtyVal,
        created_by: creatorVal,
        createdBy: creatorVal,
        created_by_name: creatorFullName,
        createdByName: creatorFullName,
        updated_by: updaterVal,
        updatedBy: updaterVal,
        updated_by_name: updaterFullName,
        updatedByName: updaterFullName,
        createdAt: createdAtVal,
        created_at: createdAtVal,
        updatedAt: updatedAtVal,
        updated_at: updatedAtVal,
        last_update: updatedAtVal,
        last_updated: updatedAtVal,
        stock: stockQtyVal,
        stock_qty: stockQtyVal,
        qty: stockQtyVal,
        inventory: stockQtyVal,
        quantity: stockQtyVal,
        stockQuantity: stockQtyVal,
        stockQty: stockQtyVal,
        stock_count: stockQtyVal,
        count: stockQtyVal,
        stock_quantity_str: String(stockQtyVal),
        stock_qty_str: String(stockQtyVal),
        stock_str: String(stockQtyVal),
        qty_str: String(stockQtyVal),
        inventory_str: String(stockQtyVal),
        quantity_str: String(stockQtyVal),
        stockQuantity_str: String(stockQtyVal),
        stockQty_str: String(stockQtyVal),
        stock_count_str: String(stockQtyVal),
        count_str: String(stockQtyVal)
    };
};

export const getConditions = async (): Promise<CarSaleCondition[]> => {
    const response = await fetch(`${API_BASE_URL}/conditions`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data.map(normalizeCondition) : [];
};

export const getConditionsByCarModel = async (carModel: string): Promise<CarSaleCondition[]> => {
    const response = await fetch(`${API_BASE_URL}/conditions?CarModel=${encodeURIComponent(carModel)}`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data.map(normalizeCondition) : [];
};

export const createCondition = async (condition: Omit<CarSaleCondition, 'id'>): Promise<CarSaleCondition> => {
    ensureOnline();
    const nowMysql = toMySQLDateTime();
    const payload = {
        ...condition,
        updatedAt: nowMysql,
        updated_at: nowMysql,
        createdAt: condition.createdAt ? toMySQLDateTime(condition.createdAt) : (condition.created_at ? toMySQLDateTime(condition.created_at) : nowMysql),
        created_at: condition.created_at ? toMySQLDateTime(condition.created_at) : (condition.createdAt ? toMySQLDateTime(condition.createdAt) : nowMysql),
    };
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(denormalizeCondition(payload)),
    });
    const newCondition = await handleResponse(response);
    const normalized = normalizeCondition(newCondition);
    if (!normalized.updatedAt) normalized.updatedAt = nowMysql;
    return normalized;
};

export const updateCondition = async (id: number, updatedCondition: CarSaleCondition): Promise<CarSaleCondition> => {
    ensureOnline();
    const nowMysql = toMySQLDateTime();
    const payload = {
        ...updatedCondition,
        updatedAt: nowMysql,
        updated_at: nowMysql,
        createdAt: updatedCondition.createdAt ? toMySQLDateTime(updatedCondition.createdAt) : (updatedCondition.created_at ? toMySQLDateTime(updatedCondition.created_at) : undefined),
        created_at: updatedCondition.created_at ? toMySQLDateTime(updatedCondition.created_at) : (updatedCondition.createdAt ? toMySQLDateTime(updatedCondition.createdAt) : undefined)
    };
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(denormalizeCondition(payload)),
    });
    const resultCondition = await handleResponse(response);
    const normalized = resultCondition ? normalizeCondition(resultCondition) : payload;
    if (!normalized.updatedAt) normalized.updatedAt = nowMysql;
    return normalized;
};

export const deleteCondition = async (id: number): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- Users (Sales Leads) ---
export interface Reference {
    reference: string;
}

export const getUserByNumber = async (number: string): Promise<User | null> => {
    const cleanNum = (number || '').replace(/\D/g, '').replace(/^0+/, '');
    try {
        const response = await fetch(`${API_BASE_URL}/user?number=${cleanNum || number}`, { headers: getAuthHeaders() });
        const data = await handleResponse(response);
        if (Array.isArray(data) && data.length > 0) {
            const first = data[0];
            // Check if it's a real user record and not webhook echo metadata
            if (first && (first.id || first.Number || first.FullName) && !first.webhookUrl && !first.headers) {
                return first;
            }
        }
    } catch (e) {
        console.warn("Direct user-by-number fetch failed:", e);
    }

    // Reliable fallback: search via /users?search=...
    try {
        const searchTarget = cleanNum || number;
        if (searchTarget) {
            const users = await getUsers({ search: searchTarget, items: 10 });
            if (Array.isArray(users) && users.length > 0) {
                const match = users.find(u => {
                    const uClean = (u.Number || '').replace(/\D/g, '').replace(/^0+/, '');
                    return uClean === searchTarget || (u.Number && u.Number.includes(searchTarget));
                });
                return match || users[0];
            }
        }
    } catch (e) {
        console.warn("Fallback search user by number failed:", e);
    }
    return null;
};

export const getLeadHistory = async (number: string): Promise<LeadMessage[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/history?number=${number}`, { headers: getAuthHeaders() });
        const data = await handleResponse(response);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.warn("Failed to fetch lead history:", e);
        return [];
    }
};

export interface GetUsersParams {
    search?: string;
    items?: number | 'all' | string;
    Province?: string;
    City?: string;
    reference?: string;
    leadStatus?: string;
    crmPerson?: string;
    lastEditedBy?: string;
}

export const getUsers = async (params?: GetUsersParams): Promise<User[]> => {
    let url = `${API_BASE_URL}/users`;
    if (params) {
        const queryParams = new URLSearchParams();
        if (params.search && params.search.trim()) {
            queryParams.append('search', params.search.trim());
        }
        if (params.items !== undefined && params.items !== null && params.items !== '') {
            queryParams.append('items', String(params.items));
        }
        if (params.Province && params.Province !== 'all' && params.Province.trim()) {
            queryParams.append('Province', params.Province.trim());
        }
        if (params.City && params.City !== 'all' && params.City.trim()) {
            queryParams.append('City', params.City.trim());
        }
        if (params.reference && params.reference !== 'all' && params.reference.trim()) {
            queryParams.append('reference', params.reference.trim());
        }
        if (params.leadStatus && params.leadStatus !== 'all' && params.leadStatus.trim()) {
            queryParams.append('leadStatus', params.leadStatus.trim());
        }
        if (params.crmPerson && params.crmPerson !== 'all' && params.crmPerson.trim()) {
            queryParams.append('crmPerson', params.crmPerson.trim());
        }
        if (params.lastEditedBy && params.lastEditedBy !== 'all' && params.lastEditedBy.trim()) {
            queryParams.append('lastEditedBy', params.lastEditedBy.trim());
        }
        const qs = queryParams.toString();
        if (qs) {
            url += `?${qs}`;
        }
    }
    const response = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    if (!Array.isArray(data)) return [];

    // Client-side safety slice if items limit was requested and backend returned more
    if (params?.items && params.items !== 'all') {
        const limit = Number(params.items);
        if (!isNaN(limit) && limit > 0 && data.length > limit) {
            return data.slice(0, limit);
        }
    }

    return data;
};

export const getReferences = async (): Promise<Reference[]> => {
    const response = await fetch(`${API_BASE_URL}/users/refrences/`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const getUsersByCarModel = async (carModel: string): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users/cars?CarModel=${encodeURIComponent(carModel)}`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(user),
    });
    const result = await handleResponse(response);

    // 1. Check all standard ID properties that webhook or database can return
    let resolvedId: number | undefined;
    if (result) {
        if (typeof result === 'number' && !isNaN(result)) {
            resolvedId = result;
        } else if (Array.isArray(result) && result[0]) {
            const first = result[0];
            const candidate = first.id ?? first.customerId ?? first.customer_id ?? first.userId ?? first.insertId;
            if (candidate !== undefined && candidate !== null && !isNaN(Number(candidate))) {
                resolvedId = Number(candidate);
            }
        } else if (typeof result === 'object') {
            const candidate = result.id ?? result.customerId ?? result.customer_id ?? result.userId ?? result.insertId ?? result.data?.id ?? result.user?.id;
            if (candidate !== undefined && candidate !== null && !isNaN(Number(candidate))) {
                resolvedId = Number(candidate);
            }
        }
    }

    // 2. If ID is still not directly provided in response, query by phone number to obtain the newly generated customer ID
    if (!resolvedId && user.Number) {
        try {
            const fetched = await getUserByNumber(user.Number);
            if (fetched && fetched.id && !isNaN(Number(fetched.id))) {
                resolvedId = Number(fetched.id);
            }
        } catch (fetchErr) {
            console.warn("Could not query newly created user ID by phone number:", fetchErr);
        }
    }

    const finalUser: User = {
        ...user,
        ...(result && typeof result === 'object' && !Array.isArray(result) ? result : {}),
        id: (resolvedId || Date.now()) as number
    };

    return finalUser;
};

export const updateUser = async (id: number, updatedUser: User): Promise<User> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedUser),
    });
    const resultUser = await handleResponse(response);
    return (resultUser && (resultUser.id || resultUser.FullName)) ? { ...updatedUser, ...resultUser } : updatedUser;
};

export const deleteUser = async (id: number): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- Announcements (CRM Organizational Announcements) ---
const ANNOUNCEMENTS_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/crm/anouncement';

// Ensure no legacy persistent browser data remains
try {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('crm_org_announcements_store_v1');
    }
} catch (_) {}

export const getAnnouncements = async (): Promise<Announcement[]> => {
    ensureOnline();
    const response = await fetch(ANNOUNCEMENTS_URL, { 
        method: 'GET',
        headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    let items: any[] = [];
    if (Array.isArray(data)) {
        items = data;
    } else if (data && Array.isArray(data.data)) {
        items = data.data;
    } else if (data && Array.isArray(data.announcements)) {
        items = data.announcements;
    } else if (data && typeof data === 'object') {
        items = [data];
    }
    const mappedItems: Announcement[] = items.map((item: any) => {
        const rawCreated = item.createdAt || item.created_at;
        const rawUpdated = item.updatedAt || item.updated_at;
        const mysqlCreated = rawCreated ? toMySQLDateTime(rawCreated) : toMySQLDateTime();
        const mysqlUpdated = rawUpdated ? toMySQLDateTime(rawUpdated) : undefined;

        // Parse tags safely
        let tags: string[] = [];
        if (Array.isArray(item.tags)) {
            tags = item.tags;
        } else if (typeof item.tags === 'string' && item.tags.trim()) {
            try {
                const parsed = JSON.parse(item.tags);
                tags = Array.isArray(parsed) ? parsed : [item.tags];
            } catch {
                tags = item.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
            }
        }

        // Strictly convert isUrgent and isFromEmail to boolean to avoid 0 rendering in JSX
        const isUrgent = Boolean(item.isUrgent === 1 || item.isUrgent === true || item.isUrgent === '1' || item.isUrgent === 'true');
        const isFromEmail = Boolean(item.isFromEmail === 1 || item.isFromEmail === true || item.isFromEmail === '1' || item.isFromEmail === 'true');

        // Extract and normalize title and content/summary
        const title = (item.title !== undefined && item.title !== null && String(item.title).trim() !== '')
            ? String(item.title)
            : (item.Title || item.subject || item.Subject || item.name || 'بدون عنوان');
        
        const content = (item.content !== undefined && item.content !== null)
            ? String(item.content)
            : (item.Content || item.summary || item.Summary || item.description || item.Description || item.body || item.text || '');

        const author = item.author || item.createdBy || item.created_by || 'مدیریت بازرگانی';
        const createdBy = item.createdBy || item.created_by || item.author || 'مدیریت بازرگانی';
        const updatedBy = item.updatedBy || item.updated_by || item.updater || item.lastModifiedBy || undefined;

        const mapped: any = {
            ...item,
            id: Number(item.id) || item.id,
            title,
            content,
            author,
            createdBy,
            ...(updatedBy ? { updatedBy } : {}),
            tags,
            isUrgent,
            isFromEmail,
            createdAt: mysqlCreated,
            ...(mysqlUpdated ? { updatedAt: mysqlUpdated } : {}),
        };
        delete mapped.created_at;
        delete mapped.updated_at;
        return mapped as Announcement;
    });

    // Sort from newest to oldest (by createdAt timestamp descending, then by numeric id descending)
    return mappedItems.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt.includes('T') ? a.createdAt : a.createdAt.replace(' ', 'T')).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt.includes('T') ? b.createdAt : b.createdAt.replace(' ', 'T')).getTime() : 0;
        if (!isNaN(timeA) && !isNaN(timeB) && timeA > 0 && timeB > 0 && timeA !== timeB) {
            return timeB - timeA;
        }
        return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
};

export const createAnnouncement = async (announcement: Partial<Announcement>): Promise<Announcement> => {
    ensureOnline();
    const mysqlDateTime = toMySQLDateTime(announcement.createdAt);
    const createdBy = announcement.createdBy || announcement.author || 'مدیریت بازرگانی';
    const author = announcement.author || createdBy;
    const payload: any = {
        ...announcement,
        author,
        createdBy,
        createdAt: mysqlDateTime,
    };
    delete payload.created_at;
    delete payload.updated_at;

    const response = await fetch(ANNOUNCEMENTS_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    const result = await handleResponse(response);

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-refresh'));
    }

    return result || (payload as Announcement);
};

export const updateAnnouncement = async (announcement: Announcement): Promise<Announcement> => {
    ensureOnline();
    const updatedMysql = toMySQLDateTime();
    const payload: any = {
        ...announcement,
        author: announcement.author || announcement.createdBy || 'مدیریت بازرگانی',
        createdBy: announcement.createdBy || announcement.author || 'مدیریت بازرگانی',
        updatedBy: announcement.updatedBy || 'کاربر سیستم',
        updatedAt: updatedMysql,
    };
    if (announcement.createdAt) {
        payload.createdAt = toMySQLDateTime(announcement.createdAt);
    }
    delete payload.created_at;
    delete payload.updated_at;

    const response = await fetch(ANNOUNCEMENTS_URL, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    const result = await handleResponse(response);

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-refresh'));
    }

    return result || payload;
};

export const deleteAnnouncement = async (id: number): Promise<void> => {
    ensureOnline();
    const response = await fetch(ANNOUNCEMENTS_URL, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
    });
    await handleResponse(response);

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-refresh'));
    }
};

// --- Customer Journals (CRM Reports) ---

const JOURNALS_URL = `${API_BASE_URL}/CustomerJournals`;

export const getCustomerJournals = async (userNumberOrId: number | string): Promise<CustomerJournal[]> => {
    const rawValue = String(userNumberOrId || '').trim();
    if (!rawValue) return [];

    // Normalize Persian and Arabic digits
    const normalizedDigits = rawValue
        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
        .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
        .trim();

    const isNumericId = /^\d+$/.test(normalizedDigits) && Number(normalizedDigits) > 0 && !normalizedDigits.startsWith('09') && normalizedDigits.length <= 8;

    let targetUrl = '';
    if (isNumericId) {
        targetUrl = `${JOURNALS_URL}?id=${encodeURIComponent(normalizedDigits)}`;
    } else {
        const queryNumber = normalizedDigits || rawValue;
        targetUrl = `${JOURNALS_URL}?number=${encodeURIComponent(queryNumber)}`;
    }

    const response = await fetch(targetUrl, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    const data = await handleResponse(response);
    
    let list: CustomerJournal[] = [];
    if (Array.isArray(data)) {
        list = data;
    } else if (data && Array.isArray(data.data)) {
        list = data.data;
    } else if (data && Array.isArray(data.items)) {
        list = data.items;
    } else if (data && typeof data === 'object' && (data.content || data.id)) {
        list = [data as CustomerJournal];
    }

    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
};

export const createCustomerJournal = async (journal: Omit<CustomerJournal, 'id' | 'createdAt'> & { 
    number?: string; 
    customerNumber?: string;
    customerId?: number | string;
    customer_id?: number | string;
    userId?: number | string;
}): Promise<CustomerJournal> => {
    ensureOnline();

    const rawId = journal.userId ?? journal.customerId ?? journal.customer_id;
    let numId: number | undefined = undefined;
    if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsed = Number(rawId);
        if (!isNaN(parsed) && parsed > 0) {
            numId = parsed;
        }
    }

    let resolvedNumber = (journal.number || journal.customerNumber || '').trim();

    // If ID is missing but phone number is present, resolve customer ID via number query
    if (!numId && resolvedNumber) {
        try {
            const u = await getUserByNumber(resolvedNumber);
            if (u && u.id && !isNaN(Number(u.id))) {
                numId = Number(u.id);
            }
        } catch (e) {
            console.warn("Could not resolve customer ID from number:", e);
        }
    }

    const payload: Record<string, any> = {
        ...journal,
        createdAt: new Date().toLocaleString('fa-IR'),
        created_at: new Date().toISOString()
    };

    if (numId !== undefined) {
        payload.userId = numId;
        payload.customerId = numId;
        payload.customer_id = numId;
    }

    if (resolvedNumber) {
        payload.number = resolvedNumber;
        payload.customerNumber = resolvedNumber;
    }

    const response = await fetch(JOURNALS_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    const result = await handleResponse(response);
    
    return result;
};
export const getAllCustomerJournals = async (): Promise<CustomerJournal[]> => {
    const response = await fetch(JOURNALS_URL, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

// --- Cars ---
export const getCars = async (): Promise<Car[]> => {
    const response = await fetch(`${API_BASE_URL}/cars`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const createCar = async (car: Omit<Car, 'id'>): Promise<Car> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/cars`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(car),
    });
    return handleResponse(response);
};

export const updateCar = async (id: number, updatedCar: Car): Promise<Car> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/cars`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedCar),
    });
    const resultCar = await handleResponse(response);
    return resultCar ?? updatedCar;
};

export const deleteCar = async (id: number): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/cars`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- Car Prices ---

export const getCarPrices = async (): Promise<CarPrice[]> => {
    const response = await fetch(`${API_BASE_URL}/prices`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const createCarPrice = async (price: Omit<CarPrice, 'id'>): Promise<CarPrice> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/prices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(price),
    });
    return handleResponse(response);
};

export const updateCarPrice = async (id: number, updatedPrice: CarPrice): Promise<CarPrice> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/prices`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedPrice),
    });
    const resultPrice = await handleResponse(response);
    return resultPrice ?? updatedPrice;
};

export const deleteCarPrice = async (id: number): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/prices`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- Scraped Car Prices ---

const handleScrapedApiResponse = async (response: Response) => {
    if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } else {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: `Request failed with status ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
}

export const getScrapedCarPrices = async (): Promise<ScrapedCarPrice[]> => {
    const SCRAPED_PRICES_URL = `${API_BASE_URL}/car_price`;
    const response = await fetch(SCRAPED_PRICES_URL);
    return handleScrapedApiResponse(response);
};

export const getDivarPrices = async (
    model?: string,
    city?: string,
    signal?: AbortSignal
): Promise<DivarPriceItem[]> => {
    // 150-second timeout because scraper webhook may take time to collect live data
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150000);

    if (signal) {
        signal.addEventListener('abort', () => controller.abort());
    }

    const webhookUrl = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/divar-prices';
    const params = new URLSearchParams();
    if (model && model.trim()) {
        params.set('mode', model.trim());
    }
    if (city && city.trim()) {
        params.set('city', city.trim());
    }

    const queryString = params.toString();
    const primaryUrl = queryString ? `${webhookUrl}?${queryString}` : webhookUrl;
    const fallbackUrl = queryString ? `${API_BASE_URL}/divar-prices?${queryString}` : `${API_BASE_URL}/divar-prices`;

    const normalizeItems = (rawData: any, defaultCarName?: string): DivarPriceItem[] => {
        let items: any[] = [];
        if (Array.isArray(rawData)) {
            items = rawData;
        } else if (rawData && typeof rawData === 'object') {
            if (Array.isArray(rawData.data)) items = rawData.data;
            else if (Array.isArray(rawData.items)) items = rawData.items;
            else if (Array.isArray(rawData.result)) items = rawData.result;
            else if (Array.isArray(rawData.prices)) items = rawData.prices;
            else if (Array.isArray(rawData.listings)) items = rawData.listings;
            else if (Array.isArray(rawData.body)) items = rawData.body;
            else if (rawData.title || rawData.price) items = [rawData];
        }

        return items.map(item => {
            let rawPrice = item.price ?? item.price_rial ?? item.price_toman ?? item.amount ?? item.cost;
            let numPrice: number | null = null;
            if (typeof rawPrice === 'number' && !isNaN(rawPrice)) {
                numPrice = rawPrice;
            } else if (typeof rawPrice === 'string') {
                const digitsOnly = rawPrice.replace(/[^\d]/g, '');
                if (digitsOnly) numPrice = parseInt(digitsOnly, 10);
            }

            const rawKm = item.km ?? item.kilometer ?? item.mileage ?? item.usage ?? null;
            const cleanKm = rawKm !== null && rawKm !== undefined ? String(rawKm).trim() : null;

            return {
                title: item.title ?? item.name ?? item.subject ?? null,
                price: numPrice,
                km: cleanKm,
                desc: item.desc ?? item.description ?? item.details ?? null,
                car_name: item.car_name ?? item.model ?? item.car_model ?? item.model_name ?? defaultCarName ?? '',
                href: item.href ?? item.link ?? item.url ?? null
            };
        });
    };

    try {
        let response: Response | null = null;

        // Step 1: Try GET on primary webhook endpoint with mode and city query params
        try {
            response = await fetch(primaryUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });

            // If GET returns 404 or 405, fallback to POST with JSON body
            if (!response.ok && (response.status === 404 || response.status === 405)) {
                response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        mode: model?.trim() || '',
                        model: model?.trim() || '',
                        city: city?.trim() || '',
                        car_model: model?.trim() || ''
                    }),
                    signal: controller.signal
                });
            }
        } catch (fetchErr: any) {
            if (controller.signal.aborted) throw fetchErr;

            // Step 2: Fallback to fallbackUrl
            try {
                response = await fetch(fallbackUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                });
            } catch (fallbackErr: any) {
                if (controller.signal.aborted) throw fallbackErr;
                // Retry POST on webhook
                response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        mode: model?.trim() || '',
                        model: model?.trim() || '',
                        city: city?.trim() || ''
                    }),
                    signal: controller.signal
                });
            }
        }

        if (!response || !response.ok) {
            const status = response ? response.status : 'No Response';
            throw new Error(`دریافت قیمت‌های دیوار ناموفق بود (کد: ${status})`);
        }

        const data = await response.json();
        return normalizeItems(data, model);
    } finally {
        clearTimeout(timeoutId);
    }
};

export const getDivarArbitragePrices = async (
    title?: string,
    city?: string,
    signal?: AbortSignal
): Promise<DivarPriceItem[]> => {
    // 150-second timeout because scraper webhook may take time to collect live data
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150000);

    if (signal) {
        signal.addEventListener('abort', () => controller.abort());
    }

    const webhookUrl = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/divar-arbitrage';
    const params = new URLSearchParams();
    if (title && title.trim()) {
        params.set('title', title.trim());
    }
    if (city && city.trim()) {
        params.set('city', city.trim());
    }

    const queryString = params.toString();
    const primaryUrl = queryString ? `${webhookUrl}?${queryString}` : webhookUrl;
    const fallbackUrl = queryString ? `${API_BASE_URL}/divar-arbitrage?${queryString}` : `${API_BASE_URL}/divar-arbitrage`;

    const normalizeItems = (rawData: any, defaultCarName?: string): DivarPriceItem[] => {
        let items: any[] = [];
        if (Array.isArray(rawData)) {
            items = rawData;
        } else if (rawData && typeof rawData === 'object') {
            if (Array.isArray(rawData.data)) items = rawData.data;
            else if (Array.isArray(rawData.items)) items = rawData.items;
            else if (Array.isArray(rawData.result)) items = rawData.result;
            else if (Array.isArray(rawData.prices)) items = rawData.prices;
            else if (Array.isArray(rawData.listings)) items = rawData.listings;
            else if (Array.isArray(rawData.body)) items = rawData.body;
            else if (rawData.title || rawData.price) items = [rawData];
        }

        return items.map(item => {
            let rawPrice = item.price ?? item.price_rial ?? item.price_toman ?? item.middle_description_text ?? item.amount ?? item.cost;
            let numPrice: number | null = null;
            if (typeof rawPrice === 'number' && !isNaN(rawPrice)) {
                numPrice = rawPrice;
            } else if (typeof rawPrice === 'string') {
                const digitsOnly = rawPrice.replace(/[^\d]/g, '');
                if (digitsOnly) numPrice = parseInt(digitsOnly, 10);
            }

            const rawKm = item.km ?? item.top_description_text ?? item.kilometer ?? item.mileage ?? item.usage ?? null;
            const cleanKm = rawKm !== null && rawKm !== undefined ? String(rawKm).trim() : null;

            let href = item.href ?? item.link ?? item.url ?? null;
            if (!href && item.adv_id) {
                href = `https://divar.ir/v/${item.adv_id}`;
            } else if (!href && item.token) {
                href = `https://divar.ir/v/${item.token}`;
            }

            return {
                title: item.title ?? item.name ?? item.subject ?? null,
                price: numPrice,
                km: cleanKm,
                desc: item.description ?? item.desc ?? item.bottom_description_text ?? item.details ?? null,
                car_name: item.car_name ?? item.model ?? item.car_model ?? item.model_name ?? defaultCarName ?? '',
                href
            };
        });
    };

    try {
        let response: Response | null = null;

        // Step 1: Try GET on primary webhook endpoint: divar-arbitrage?title=...&city=...
        try {
            response = await fetch(primaryUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });

            // If GET returns 404 or 405, fallback to POST with JSON body
            if (!response.ok && (response.status === 404 || response.status === 405)) {
                response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        title: title?.trim() || '',
                        city: city?.trim() || '',
                        mode: title?.trim() || '',
                        model: title?.trim() || ''
                    }),
                    signal: controller.signal
                });
            }
        } catch (fetchErr: any) {
            if (controller.signal.aborted) throw fetchErr;

            // Step 2: Fallback to fallbackUrl
            try {
                response = await fetch(fallbackUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                });
            } catch (fallbackErr: any) {
                if (controller.signal.aborted) throw fallbackErr;
                // Retry POST on webhook
                response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        title: title?.trim() || '',
                        city: city?.trim() || ''
                    }),
                    signal: controller.signal
                });
            }
        }

        if (!response || !response.ok) {
            const status = response ? response.status : 'No Response';
            let errDetail = '';
            try {
                const errJson = await response?.json();
                if (errJson?.message) errDetail = `: ${errJson.message}`;
            } catch {
                // ignore
            }
            throw new Error(`دریافت آگهی‌های آربیتراژ دیوار ناموفق بود (کد: ${status}${errDetail})`);
        }

        const data = await response.json();
        return normalizeItems(data, title);
    } finally {
        clearTimeout(timeoutId);
    }
};

export const getDivarAdvDetails = async (adUrl: string, signal?: AbortSignal): Promise<DivarAdvDetail[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 65000); // 65 seconds
    if (signal) {
        signal.addEventListener('abort', () => controller.abort());
    }

    const encodedUrl = encodeURIComponent(adUrl);
    const endpoint = `https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/divar-adv?url=${encodedUrl}`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) return data;
            if (data && typeof data === 'object') {
                if (Array.isArray(data.data)) return data.data;
                if (Array.isArray(data.items)) return data.items;
                return [data];
            }
        }
        throw new Error(`خطا در استعلام جزئیات آگهی (کد ${response.status})`);
    } catch (err: any) {
        clearTimeout(timeoutId);
        throw err;
    }
};

export const addCustomPrice = async (payload: {
    source_name: 'custom';
    model_name: string;
    price_rial: number;
    price_text: string;
    captured_at: string;
}): Promise<any> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/CustomPrice`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const getScrapedCarPriceSources = async (): Promise<CarPriceSource[]> => {
    const SCRAPED_SOURCES_URL = `${API_BASE_URL}/sources`;
    const response = await fetch(SCRAPED_SOURCES_URL);
    return handleScrapedApiResponse(response);
};

export const getCarPriceStats = async (): Promise<CarPriceStats[]> => {
    const STATS_URL = `${API_BASE_URL}/car_price_stats`;
    const response = await fetch(STATS_URL);
    const data = await handleScrapedApiResponse(response);
    if (!Array.isArray(data)) {
        return [];
    }
    return data.map((item: any, index: number) => ({
        id: index, // Synthetic ID for React keys
        model_name: item.model_name,
        minimum: item.min_price || 0,
        maximum: item.max_price || 0,
        average: parseFloat(item.avg_price) || 0,
        computed_at: new Date().toISOString(), // This is in the type but not the API
    }));
};

// --- Active Leads (for dashboard/hot leads) ---
export const getActiveLeads = async (): Promise<ActiveLead[]> => {
    const response = await fetch(`${API_BASE_URL}/users/active`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

// --- Delivery Process (Old/Simulated) ---
export const getDeliveryProcesses = async (): Promise<DeliveryProcess[]> => {
    const response = await fetch(`${API_BASE_URL}/deliveries`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const createDeliveryProcess = async (delivery: Omit<DeliveryProcess, 'id'>): Promise<DeliveryProcess> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/deliveries`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(delivery),
    });
    return handleResponse(response);
};

export const updateDeliveryProcessStatus = async (id: number, status: DeliveryStatus): Promise<DeliveryProcess> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
};


// --- WhatsApp ---
export const sendMessage = async (number: string, message: string): Promise<{ Sent: string }> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/whatsapp/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ number, message }),
    });
    return handleResponse(response);
};

// --- SMS ---
export const sendSMS = async (number: string, message: string): Promise<{ Sent: string }> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/sms/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ number, message }),
    });
    return handleResponse(response);
};

// --- Bale Messenger Formatting & API ---
export function formatBalePhoneNumber(phone: string): string | null {
    let cleaned = phone.trim().replace(/\s+/g, '').replace(/[-+]/g, '');
    if (cleaned.startsWith('0098')) {
        cleaned = cleaned.substring(4);
    }
    if (cleaned.startsWith('09')) {
        cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith('9') && cleaned.length === 10) {
        return '98' + cleaned;
    }
    if (cleaned.startsWith('989') && cleaned.length === 12) {
        return cleaned;
    }
    return null;
}

export const sendBaleMessage = async (number: string, message: string, botId: number): Promise<{ message_id: string; error_data: any }> => {
    ensureOnline();
    const formattedPhone = formatBalePhoneNumber(number);
    if (!formattedPhone) {
        throw new Error('شماره تلفن نامعتبر است یا قابلیت ارسال پیام به بله را ندارد (باید شماره موبایل معتبر باشد).');
    }
    const response = await fetch('https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/bale/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({
            bot_id: botId,
            phone_number: formattedPhone,
            message_data: {
                message: {
                    text: message
                }
            }
        }),
    });
    return handleResponse(response);
};

export const sendBulkSMS = async (numbers: string[], message: string): Promise<any> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/sms/bulksend`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ number: numbers, message }),
    });
    return handleResponse(response);
};

// --- Poll / Survey ---
export const normalizeSurveyQuestion = (title: string): string => {
    if (!title) return 'سوال نظرسنجی';
    const clean = title.trim();
    if (clean.includes('سرعت')) {
        return '۱. رضایت از سرعت خدمات نمایندگی:';
    }
    if (clean.includes('فرایند') || clean.includes('تحویل خودرو') || clean.includes('مدارک') || clean.includes('زمان تحویل') || clean.includes('توضیحات هنگام')) {
        return '۲. رضایت از فرایند تحویل خودرو (مدارک، زمان، توضیحات هنگام تحویل):';
    }
    if (clean.includes('برخورد') || clean.includes('پاسخگویی') || clean.includes('پرسنل')) {
        return '۳. رضایت از برخورد و پاسخگویی پرسنل نمایندگی:';
    }
    if (clean.includes('سلامت') || clean.includes('کیفیت')) {
        return '۴. رضایت از سلامت و کیفیت خودرو تحویل‌شده:';
    }
    if (clean.includes('اطلاع') || clean.includes('پیامک') || clean.includes('تماس')) {
        return '۵. رضایت از اطلاع‌رسانی نمایندگی (تماس‌ها، پیامک‌ها و توضیحات):';
    }
    if (clean.includes('امکانات') || clean.includes('رفاهی') || clean.includes('انتظار') || clean.includes('پارکینگ') || clean.includes('نوشیدنی')) {
        return '۶. رضایت از امکانات رفاهی نمایندگی (اتاق انتظار، نوشیدنی، پارکینگ):';
    }
    return clean;
};

export const getPollAverages = async (): Promise<ProcessedPollData> => {
    const response = await fetch(`${API_BASE_URL}/poll/avg`, { headers: getAuthHeaders() });
    const rawData: PollApiResponseItem[] = await handleResponse(response);
    
    const result: ProcessedPollData = {
        averages: {},
        customers: [],
        inProgress: [],
        notAnswered: [],
        questions: {}
    };

    if (Array.isArray(rawData)) {
        rawData.forEach(item => {
            if (item.AverageAll) {
                result.averages = item.AverageAll;
            }
            if (item.perCustomerResults) {
                result.customers = item.perCustomerResults;
            }
            if (item.inProgress) {
                result.inProgress = item.inProgress;
            }
            if (item.NotAnswered) {
                result.notAnswered = item.NotAnswered;
            }
            if (item.fieldsGuid) {
                item.fieldsGuid.forEach(field => {
                    result.questions[field.Key] = normalizeSurveyQuestion(field.Title);
                });
            }
        });
    }

    return result;
};


// --- Settings ---

export interface ApiSettings {
    whatsappApiKey: string;
    smsApiKey: string;
    didarApiKey: string;
}

export type AppSettings = ApiSettings & DealershipInfo;

export const getSettings = async (): Promise<Partial<AppSettings>> => {
    const response = await fetch(`${API_BASE_URL}/settings`, { headers: getAuthHeaders() });
    if (response.status === 204) {
        return {};
    }
    const data = await handleResponse(response);
    // API returns an array with a single settings object
    if (Array.isArray(data) && data.length > 0) {
        return data[0];
    }
    // Fallback for empty array or other unexpected format
    return {};
};

export const updateSettings = async (settings: Partial<AppSettings>): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
    });
    return handleResponse(response);
};

export const updateUserCredentials = async (
    currentPasswordHash: string,
    newUsername: string,
    newPasswordHash?: string,
    currentUsername?: string
): Promise<void> => {
    ensureOnline();
    const payload: any = {
        currentPassword: currentPasswordHash,
    };
    if (newUsername) payload.username = newUsername;
    if (newPasswordHash) payload.password = newPasswordHash;

    // Do not send if no changes are requested besides current password
    if (!newUsername && !newPasswordHash) {
        return Promise.resolve();
    }

    const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    
    await handleResponse(response);

    // If password was changed, trigger password update webhook
    if (newPasswordHash) {
        const activeUsername = newUsername || currentUsername;
        if (activeUsername) {
            await syncPasswordChangeToWebhook(activeUsername, newPasswordHash);
        }
    }
};

// --- CRUD Services ---

const ZERO_CAR_DELIVERY_URL = `${API_BASE_URL}/ZeroCarDelivery`;
const CORRECTIVE_ACTIONS_URL = `${API_BASE_URL}/CorrectiveActions`;
const LEAVE_REQUESTS_URL = `${API_BASE_URL}/LeaveReguests`; // Matches provided typo
const ANONYMOUS_SUGGESTIONS_URL = `${API_BASE_URL}/AnonymousSuggestions`;
const MY_PROFILE_URL = `${API_BASE_URL}/MyProfile`;
const PERMISSIONS_URL = `${API_BASE_URL}/Permissions`;
const MEETING_MINUTES_URL = `${API_BASE_URL}/MeetingMinutes`;
const AD_CAMPAIGNS_URL = `${API_BASE_URL}/AdCampaigns`;
const ADVERTISEMENT_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/advertisment';
const USED_CARS_URL = `${API_BASE_URL}/UsedCars`;
const CAR_ORDERS_URL = `${API_BASE_URL}/CarOrders`;
const OVERTIME_URL = `${API_BASE_URL}/overtime`;
const CRM_URL = `${API_BASE_URL}/crm`;
const CALLOG_URL = `${API_BASE_URL}/calllog`;
const SALARY_ADVANCE_URL = `${API_BASE_URL}/SalaryAdvance`;
export const TIMESHEET_URL = `${API_BASE_URL}/timesheet`;

// Helper to sanitize payload and prevent MySQL ER_TRUNCATED_WRONG_VALUE on empty date strings or syntax errors from unquoted arrays
const sanitizePayload = <T>(item: Partial<T>): any => {
    if (!item || typeof item !== 'object') return item;
    const sanitized: any = { ...item };
    
    const knownDateFields = [
        'executionDate', 'dueDate', 'executedAt', 'registrationDate', 'createdAt', 'updatedAt',
        'targetDate', 'startDate', 'endDate', 'deliveryDate', 'purchaseDate', 'saleDate',
        'paymentDate', 'meetingDate', 'followUpDate', 'completedAt', 'crmDate', 'created_at', 'updated_at'
    ];

    for (const key of Object.keys(sanitized)) {
        const val = sanitized[key];
        if (val === undefined) {
            delete sanitized[key];
            continue;
        }
        if (Array.isArray(val)) {
            sanitized[key] = JSON.stringify(val);
            continue;
        }
        if (val === '') {
            if (knownDateFields.includes(key) || key.endsWith('Date') || key.endsWith('At') || key.endsWith('_at')) {
                sanitized[key] = null;
            }
        }
    }
    return sanitized;
};

// Generic CRUD helper
const createCrudService = <T>(url: string) => ({
    getAll: async (): Promise<T[]> => {
        try {
            const response = await fetch(url, { headers: getAuthHeaders() });
            if (!response.ok) {
                console.warn(`API returned status ${response.status} for ${url}`);
                return [];
            }
            const text = await response.text();
            if (!text || text.trim() === '') return [];
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                return [];
            }
            if (Array.isArray(data)) return data;
            if (data && typeof data === 'object') {
                if (Array.isArray((data as any).data)) return (data as any).data;
                if (Array.isArray((data as any).items)) return (data as any).items;
                return [data] as T[];
            }
            return [];
        } catch (e) {
            console.warn(`Failed to fetch from ${url}:`, e);
            return [];
        }
    },
    create: async (item: Partial<T>): Promise<T> => {
        ensureOnline();
        const payload = sanitizePayload(item);
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },
    update: async (item: Partial<T> & { id: number }): Promise<T> => {
        ensureOnline();
        const payload = sanitizePayload(item);
        const response = await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },
    delete: async (id: number): Promise<void> => {
        ensureOnline();
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
        });
        return handleResponse(response);
    }
});

export const zeroCarDeliveryService = createCrudService<ZeroCarDelivery>(ZERO_CAR_DELIVERY_URL);
export const correctiveActionsService = createCrudService<CorrectiveAction>(CORRECTIVE_ACTIONS_URL);
export const leaveRequestsService = createCrudService<LeaveRequest>(LEAVE_REQUESTS_URL);
export const anonymousSuggestionsService = createCrudService<AnonymousFeedback>(ANONYMOUS_SUGGESTIONS_URL);
export const permissionsService = createCrudService<any>(PERMISSIONS_URL);

// --- Custom Role Definitions API Service (Pure API Endpoint, zero persistent browser data) ---

export const getCustomRolesFromApi = async (): Promise<UserRoleDefinition[]> => {
    try {
        const allRecords = await permissionsService.getAll();
        if (!Array.isArray(allRecords)) return [];

        const roleDefRecords = allRecords.filter((item: any) => {
            if (!item || typeof item !== 'object') return false;
            return (
                item.isRoleDefinition === true ||
                item.isRoleDefinition === 1 ||
                item.isRoleDefinition === 'true' ||
                (typeof item.username === 'string' && item.username.startsWith('__ROLE__:')) ||
                (typeof item.roleId === 'string' && item.roleId.startsWith('custom-')) ||
                item.role_def === 1
            );
        });

        return roleDefRecords.map((item: any, idx: number) => {
            const cleanId = item.roleId || (typeof item.username === 'string' && item.username.startsWith('__ROLE__:') ? item.username.replace('__ROLE__:', '') : `custom-role-${item.id || idx}`);
            return {
                id: cleanId,
                apiId: item.id,
                name: item.name || item.roleTitle || item.title || 'نقش سفارشی',
                code: item.code || item.roleCode || 'CUSTOM_ROLE',
                description: item.description || '',
                level: item.level !== undefined ? Number(item.level) : 4,
                color: item.color || 'indigo',
                isSystem: false,
                isRoleDefinition: true,
                permissions: Array.isArray(item.permissions) ? item.permissions : [],
                createdAt: item.createdAt || item.created_at,
                updatedAt: item.updatedAt || item.updated_at
            };
        });
    } catch (error) {
        console.warn('Failed to load custom roles from API:', error);
        return [];
    }
};

export const saveCustomRoleToApi = async (role: UserRoleDefinition): Promise<any> => {
    ensureOnline();
    const allRecords = await permissionsService.getAll();
    const existing = Array.isArray(allRecords) 
        ? allRecords.find((item: any) => 
            (role.apiId && item.id === role.apiId) ||
            (item.roleId && item.roleId === role.id) ||
            (item.username && item.username === `__ROLE__:${role.id}`)
          )
        : null;

    const payload = {
        username: `__ROLE__:${role.id}`,
        roleId: role.id,
        name: role.name,
        roleTitle: role.name,
        code: role.code,
        roleCode: role.code,
        description: role.description || '',
        level: Number(role.level) || 4,
        color: role.color || 'indigo',
        isSystem: false,
        isRoleDefinition: true,
        permissions: role.permissions || [],
        updatedAt: new Date().toISOString()
    };

    if (existing && existing.id) {
        return await permissionsService.update({
            ...payload,
            id: existing.id
        });
    } else {
        return await permissionsService.create({
            ...payload,
            createdAt: new Date().toISOString()
        });
    }
};

export const deleteCustomRoleFromApi = async (roleId: string, apiId?: number): Promise<void> => {
    ensureOnline();
    if (apiId) {
        await permissionsService.delete(apiId);
        return;
    }
    const allRecords = await permissionsService.getAll();
    if (Array.isArray(allRecords)) {
        const existing = allRecords.find((item: any) => 
            (item.roleId && item.roleId === roleId) ||
            (item.username && item.username === `__ROLE__:${roleId}`)
        );
        if (existing && existing.id) {
            await permissionsService.delete(existing.id);
        }
    }
};
export const meetingMinutesService = createCrudService<MeetingMinute>(MEETING_MINUTES_URL);
export const adCampaignsService = createCrudService<AdCampaign>(AD_CAMPAIGNS_URL);
export const advertisementService = createCrudService<AdvertisementReport>(ADVERTISEMENT_URL);
export const usedCarsService = createCrudService<UsedCar>(USED_CARS_URL);

// --- Car Orders Normalizer & Service ---
const normalizeCarOrder = (order: any): CarOrder => {
    if (!order || typeof order !== 'object') return order;

    let experts: string[] = [];
    if (Array.isArray(order.carExperts)) {
        experts = order.carExperts;
    } else if (Array.isArray(order.car_experts)) {
        experts = order.car_experts;
    } else if (typeof order.carExperts === 'string' && order.carExperts.trim()) {
        try {
            const parsed = JSON.parse(order.carExperts);
            if (Array.isArray(parsed)) experts = parsed;
            else experts = order.carExperts.split('،').map((s: string) => s.trim()).filter(Boolean);
        } catch {
            experts = order.carExperts.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
    } else if (typeof order.car_experts === 'string' && order.car_experts.trim()) {
        try {
            const parsed = JSON.parse(order.car_experts);
            if (Array.isArray(parsed)) experts = parsed;
            else experts = order.car_experts.split('،').map((s: string) => s.trim()).filter(Boolean);
        } catch {
            experts = order.car_experts.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
    }

    const parseNum = (v: any) => {
        if (v === null || v === undefined || v === '') return undefined;
        const n = Number(v);
        return isNaN(n) ? undefined : n;
    };

    let partners: OrderPartner[] = [];
    if (Array.isArray(order.partners)) {
        partners = order.partners;
    } else if (Array.isArray(order.order_partners)) {
        partners = order.order_partners;
    } else if (typeof order.partners === 'string' && order.partners.trim()) {
        try {
            const parsed = JSON.parse(order.partners);
            if (Array.isArray(parsed)) partners = parsed;
        } catch {}
    } else if (typeof order.order_partners === 'string' && order.order_partners.trim()) {
        try {
            const parsed = JSON.parse(order.order_partners);
            if (Array.isArray(parsed)) partners = parsed;
        } catch {}
    }

    return {
        id: Number(order.id),
        trackingCode: order.trackingCode || order.tracking_code || '',
        buyerName: order.buyerName || order.buyer_name || '',
        buyerNationalId: order.buyerNationalId || order.buyer_national_id || '',
        buyerPhone: order.buyerPhone || order.buyer_phone || '',
        buyerCity: order.buyerCity || order.buyer_city || '',
        buyerAddress: order.buyerAddress || order.buyer_address || '',
        buyerPostalCode: order.buyerPostalCode || order.buyer_postal_code || order.buyerAddressPostalCode || '',
        carName: order.carName || order.car_name || '',
        conditionId: Number(order.conditionId || order.condition_id || 0),
        conditionSummary: order.conditionSummary || order.condition_summary || '',
        selectedColor: order.selectedColor || order.selected_color || '',
        proposedPrice: Number(order.proposedPrice || order.proposed_price || 0),
        userNotes: order.userNotes || order.user_notes || '',
        
        // Financial & Commission breakdown
        purchasePrice: parseNum(order.purchasePrice ?? order.purchase_price),
        sellingPrice: parseNum(order.sellingPrice ?? order.selling_price ?? order.proposedPrice ?? order.proposed_price),
        shippingCost: parseNum(order.shippingCost ?? order.shipping_cost),
        netCommission: parseNum(order.netCommission ?? order.net_commission),
        totalCommissionBonus: parseNum(order.totalCommissionBonus ?? order.total_commission_bonus),
        partnerCommissionShare: parseNum(order.partnerCommissionShare ?? order.partner_commission_share),

        // Seller & Warehouse
        sellerType: order.sellerType || order.seller_type || (order.deductFromStock ? 'COMPANY_WAREHOUSE' : 'OTHER'),
        sellerName: order.sellerName || order.seller_name || '',
        sellerPhone: order.sellerPhone || order.seller_phone || '',
        sellerNationalId: order.sellerNationalId || order.seller_national_id || '',
        sellerSheba: order.sellerSheba || order.seller_sheba || '',
        sellerCity: order.sellerCity || order.seller_city || '',
        sellerAddress: order.sellerAddress || order.seller_address || '',
        sellerNotes: order.sellerNotes || order.seller_notes || '',

        // Collaborating Partners
        partners: partners,

        carExperts: experts,
        expertIds: Array.isArray(order.expertIds) ? order.expertIds : [],
        adminNotes: order.adminNotes || order.admin_notes || '',
        finalPrice: parseNum(order.finalPrice ?? order.final_price),
        deliveryDeadline: order.deliveryDeadline || order.delivery_deadline || '',
        deductFromStock: order.deductFromStock === true || order.deductFromStock === 1 || order.deductFromStock === '1' || order.deduct_from_stock === 1 || order.deduct_from_stock === '1' || order.deduct_from_stock === true,
        status: order.status || 'PENDING_ADMIN',
        createdBy: order.createdBy || order.created_by || '',
        createdAt: order.createdAt || order.created_at || '',
        updatedAt: order.updatedAt || order.updated_at || '',
    };
};

const denormalizeCarOrder = (order: Partial<CarOrder>): any => {
    if (!order || typeof order !== 'object') return order;
    
    const expertsArray = Array.isArray(order.carExperts) ? [...order.carExperts] : [];
    const expertIdsArray = Array.isArray(order.expertIds) ? order.expertIds : [];
    const partnersArray = Array.isArray(order.partners) ? order.partners : [];
    const partnersJson = JSON.stringify(partnersArray);

    // Sync partners to expertsArray if expertsArray is empty for backward compatibility
    if (partnersArray.length > 0 && expertsArray.length === 0) {
        partnersArray.forEach(p => {
            expertsArray.push(`${p.name} (${p.side})`);
        });
    }

    const expertsJson = JSON.stringify(expertsArray);
    const expertIdsJson = JSON.stringify(expertIdsArray);

    const deductVal = order.deductFromStock === false || (order as any).deduct_from_stock === false ? 0 : 1;
    const finalPriceVal = order.finalPrice !== undefined && order.finalPrice !== null && !isNaN(Number(order.finalPrice)) 
        ? Number(order.finalPrice) 
        : null;
    const proposedPriceVal = Number(order.proposedPrice) || Number(order.sellingPrice) || 0;

    const result: any = {
        id: order.id ? Number(order.id) : undefined,
        trackingCode: order.trackingCode || null,
        tracking_code: order.trackingCode || null,
        buyerName: order.buyerName || '',
        buyer_name: order.buyerName || '',
        buyerNationalId: order.buyerNationalId || '',
        buyer_national_id: order.buyerNationalId || '',
        buyerPhone: order.buyerPhone || '',
        buyer_phone: order.buyerPhone || '',
        buyerCity: order.buyerCity || '',
        buyer_city: order.buyerCity || '',
        buyerAddress: order.buyerAddress || '',
        buyer_address: order.buyerAddress || '',
        buyerPostalCode: order.buyerPostalCode || '',
        buyer_postal_code: order.buyerPostalCode || '',
        carName: order.carName || '',
        car_name: order.carName || '',
        conditionId: order.conditionId ? Number(order.conditionId) : null,
        condition_id: order.conditionId ? Number(order.conditionId) : null,
        conditionSummary: order.conditionSummary || '',
        condition_summary: order.conditionSummary || '',
        selectedColor: order.selectedColor || '',
        selected_color: order.selectedColor || '',
        proposedPrice: proposedPriceVal,
        proposed_price: proposedPriceVal,
        userNotes: order.userNotes || '',
        user_notes: order.userNotes || '',

        // Financial & Commission breakdown
        purchasePrice: order.purchasePrice !== undefined ? Number(order.purchasePrice) : null,
        purchase_price: order.purchasePrice !== undefined ? Number(order.purchasePrice) : null,
        sellingPrice: order.sellingPrice !== undefined ? Number(order.sellingPrice) : proposedPriceVal,
        selling_price: order.sellingPrice !== undefined ? Number(order.sellingPrice) : proposedPriceVal,
        shippingCost: order.shippingCost !== undefined ? Number(order.shippingCost) : 0,
        shipping_cost: order.shippingCost !== undefined ? Number(order.shippingCost) : 0,
        netCommission: order.netCommission !== undefined ? Number(order.netCommission) : null,
        net_commission: order.netCommission !== undefined ? Number(order.netCommission) : null,
        totalCommissionBonus: order.totalCommissionBonus !== undefined ? Number(order.totalCommissionBonus) : null,
        total_commission_bonus: order.totalCommissionBonus !== undefined ? Number(order.totalCommissionBonus) : null,
        partnerCommissionShare: order.partnerCommissionShare !== undefined ? Number(order.partnerCommissionShare) : null,
        partner_commission_share: order.partnerCommissionShare !== undefined ? Number(order.partnerCommissionShare) : null,

        // Seller & Warehouse
        sellerType: order.sellerType || 'OTHER',
        seller_type: order.sellerType || 'OTHER',
        sellerName: order.sellerName || '',
        seller_name: order.sellerName || '',
        sellerPhone: order.sellerPhone || '',
        seller_phone: order.sellerPhone || '',
        sellerNationalId: order.sellerNationalId || '',
        seller_national_id: order.sellerNationalId || '',
        sellerSheba: order.sellerSheba || '',
        seller_sheba: order.sellerSheba || '',
        sellerCity: order.sellerCity || '',
        seller_city: order.sellerCity || '',
        sellerAddress: order.sellerAddress || '',
        seller_address: order.sellerAddress || '',
        sellerNotes: order.sellerNotes || '',
        seller_notes: order.sellerNotes || '',

        // Collaborating Partners
        partners: partnersJson,
        order_partners: partnersJson,

        carExperts: expertsJson,
        car_experts: expertsJson,
        expertIds: expertIdsJson,
        expert_ids: expertIdsJson,
        adminNotes: order.adminNotes || '',
        admin_notes: order.adminNotes || '',
        finalPrice: finalPriceVal,
        final_price: finalPriceVal,
        deliveryDeadline: order.deliveryDeadline || '',
        delivery_deadline: order.deliveryDeadline || '',
        deductFromStock: deductVal,
        deduct_from_stock: deductVal,
        status: order.status || 'PENDING_ADMIN',
        createdBy: order.createdBy || '',
        created_by: order.createdBy || '',
        createdAt: order.createdAt || null,
        created_at: order.createdAt || null,
        updatedAt: order.updatedAt || null,
        updated_at: order.updatedAt || null,
    };

    if (result.id === undefined) {
        delete result.id;
    }

    return result;
};

export const carOrdersService = {
    getAll: async (): Promise<CarOrder[]> => {
        const response = await fetch(CAR_ORDERS_URL, { headers: getAuthHeaders() });
        const data = await handleResponse(response);
        if (Array.isArray(data)) return data.map(normalizeCarOrder);
        if (data && typeof data === 'object') return [normalizeCarOrder(data)];
        return [];
    },
    getById: async (id: number): Promise<CarOrder | null> => {
        const response = await fetch(`${CAR_ORDERS_URL}/${id}`, { headers: getAuthHeaders() });
        const data = await handleResponse(response);
        return data ? normalizeCarOrder(data) : null;
    },
    create: async (item: Partial<CarOrder>): Promise<CarOrder> => {
        ensureOnline();
        const payload = sanitizePayload(denormalizeCarOrder(item));
        const response = await fetch(CAR_ORDERS_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        const resData = await handleResponse(response);
        return resData ? normalizeCarOrder(resData) : (item as CarOrder);
    },
    update: async (item: Partial<CarOrder> & { id: number }): Promise<CarOrder> => {
        ensureOnline();
        const payload = sanitizePayload(denormalizeCarOrder(item));
        const response = await fetch(CAR_ORDERS_URL, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        const resData = await handleResponse(response);
        return resData ? normalizeCarOrder(resData) : (item as CarOrder);
    },
    delete: async (id: number): Promise<void> => {
        ensureOnline();
        const response = await fetch(CAR_ORDERS_URL, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
        });
        return handleResponse(response);
    }
};

export const overtimeService = createCrudService<OvertimeRequest>(OVERTIME_URL);
export const salaryAdvanceService = createCrudService<SalaryAdvanceRequest>(SALARY_ADVANCE_URL);

// New method for uploading Excel
export const importZeroCarDeliveryExcel = async (file: File): Promise<any> => {
    ensureOnline();
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // Do NOT set Content-Type header for FormData, browser does it with boundary

    const response = await fetch(`${API_BASE_URL}/ZeroCarDelivery/import`, {
        method: 'POST',
        headers: headers,
        body: formData,
    });
    return handleResponse(response);
};

// My Profile Service
export const getMyProfile = async (): Promise<MyProfile | {}> => {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!userId) {
        console.warn("User ID not found, cannot fetch profile.");
        return {};
    }

    try {
        const response = await fetch(MY_PROFILE_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id: Number(userId) })
        });
        
        const data = await handleResponse(response);
        
        if (!data) return {};
        
        const profileObj: MyProfile = Array.isArray(data) ? (data.length > 0 ? data[0] : {}) : data;
        
        if (profileObj && profileObj.username) {
            const usernameKey = profileObj.username.trim().toLowerCase();
            const activity = getUserActivityInfo(usernameKey);
            if (activity) {
                if (!profileObj.last_login && activity.lastLogin) {
                    profileObj.last_login = activity.lastLogin;
                }
                profileObj.last_activity = activity.lastActivity || new Date().toISOString();
                profileObj.last_activity_action = activity.lastActivityAction || 'مشاهده پروفایل';
            } else {
                profileObj.last_activity = new Date().toISOString();
                profileObj.last_activity_action = 'مشاهده پروفایل';
            }
            if (!profileObj.last_login) {
                profileObj.last_login = profileObj.last_update || profileObj.register_time || new Date().toISOString();
            }
            if (!profileObj.register_time) {
                profileObj.register_time = profileObj.last_update || new Date().toISOString();
            }
        }
        
        return profileObj;
    } catch (error) {
        console.warn("Could not fetch user profile, proceeding without it:", error);
        return {};
    }
};

export const updateMyProfile = async (profile: Partial<MyProfile>): Promise<MyProfile> => {
    ensureOnline();
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!userId) {
        throw new Error("User ID not found");
    }
    
    const payload = { ...profile, id: Number(userId) };
    
    const response = await fetch(MY_PROFILE_URL, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    recordUserActivity('بروزرسانی مشخصات پروفایل');
    return handleResponse(response);
};

export const getUserProfileById = async (userId: number): Promise<MyProfile | null> => {
    try {
        const response = await fetch(MY_PROFILE_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id: userId })
        });
        const data = await handleResponse(response);
        let profileObj: MyProfile | null = null;
        if (Array.isArray(data) && data.length > 0) profileObj = data[0];
        else if (data && typeof data === 'object') profileObj = data as MyProfile;

        if (profileObj && profileObj.username) {
            const usernameKey = profileObj.username.trim().toLowerCase();
            const activity = getUserActivityInfo(usernameKey);
            if (activity) {
                if (!profileObj.last_login && activity.lastLogin) {
                    profileObj.last_login = activity.lastLogin;
                }
                profileObj.last_activity = activity.lastActivity || profileObj.last_update;
                profileObj.last_activity_action = activity.lastActivityAction;
            }
        }
        return profileObj;
    } catch (error) {
        console.error(`Failed to fetch profile for user ${userId}:`, error);
        return null;
    }
};

export const updateUserProfileAsAdmin = async (userId: number, profile: Partial<MyProfile>): Promise<MyProfile> => {
    ensureOnline();
    const payload = { ...profile, id: userId };
    const response = await fetch(MY_PROFILE_URL, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

// --- Notification Center ---

let memoryMessageTemplates: MessageTemplate[] = [];
let memoryNotificationLogs: NotificationLog[] = [];

const getStoredTemplates = (): MessageTemplate[] => {
    return memoryMessageTemplates;
};

const getStoredLogs = (): NotificationLog[] => {
    return memoryNotificationLogs;
};

export const getNotificationLogs = async (): Promise<NotificationLog[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(getStoredLogs());
        }, 500);
    });
};

export const sendNotification = async (type: 'WHATSAPP' | 'SMS' | 'BALE', recipientNumber: string, recipientName: string, message: string, botId?: number): Promise<void> => {
    // We try to use the real WhatsApp API for WhatsApp messages if configured
    if (type === 'WHATSAPP') {
        try {
            await sendMessage(recipientNumber, message);
        } catch (error) {
            console.error("Real send failed, logging as failed.");
            // Proceed to log it as failed or just log it
        }
    } else if (type === 'BALE') {
        try {
            await sendBaleMessage(recipientNumber, message, botId || 1941315571);
        } catch (error) {
            console.error("Real Bale send failed:", error);
            throw error;
        }
    }

    const newLog: NotificationLog = {
        id: `LOG-${Date.now()}`,
        type,
        recipientName,
        recipientNumber,
        message,
        status: 'SENT', // Optimistic success
        sentAt: new Date().toLocaleString('fa-IR'),
        sender: 'سیستم' // Could be current user
    };

    const logs = getStoredLogs();
    logs.unshift(newLog);
    memoryNotificationLogs = logs;
    
    return Promise.resolve();
};

export const getMessageTemplates = async (): Promise<MessageTemplate[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(getStoredTemplates());
        }, 300);
    });
};

export const saveMessageTemplate = async (template: Omit<MessageTemplate, 'id' | 'createdAt'>): Promise<MessageTemplate> => {
    const newTemplate: MessageTemplate = {
        ...template,
        id: `TMP-${Date.now()}`,
        createdAt: new Date().toLocaleDateString('fa-IR')
    };
    
    const templates = getStoredTemplates();
    templates.push(newTemplate);
    memoryMessageTemplates = templates;
    
    return Promise.resolve(newTemplate);
};

export const deleteMessageTemplate = async (id: string): Promise<void> => {
    const templates = getStoredTemplates();
    const filtered = templates.filter(t => t.id !== id);
    memoryMessageTemplates = filtered;
    return Promise.resolve();
};

// --- CRM Call Logs Server Endpoints ---
export const getCallLogs = async (_customerNumber?: string): Promise<CrmCallLog[]> => {
    return [];
};

export const getCallLogsByCustomerNumber = async (_customerNumber: string): Promise<CrmCallLog[]> => {
    return [];
};

/**
 * Normalizes phone number to international Iranian standard format without leading '+' or '0'
 * Example: 09153090724 -> 989153090724, 9153090724 -> 989153090724
 */
export const normalizeToTelephonyNumber = (phone: string): string => {
    if (!phone) return '';
    // Convert Persian and Arabic digits to English digits
    let str = String(phone).trim()
        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
        .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    
    let clean = str.replace(/\D/g, '');
    if (!clean) return '';
    
    if (clean.startsWith('0098')) {
        clean = clean.substring(2);
    } else if (clean.startsWith('098')) {
        clean = clean.substring(1);
    } else if (clean.startsWith('09')) {
        clean = '98' + clean.substring(1);
    } else if (clean.startsWith('9') && clean.length === 10) {
        clean = '98' + clean;
    } else if (!clean.startsWith('98') && clean.startsWith('9')) {
        clean = '98' + clean;
    }
    return clean;
};

/**
 * Fetches VoIP / PBX Call Logs for a specific customer phone number
 * Endpoint: https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/callLogs?number=...
 */
export const getTelephonyCallLogs = async (phoneNumber: string): Promise<TelephonyCallLog[]> => {
    const normalized = normalizeToTelephonyNumber(phoneNumber);
    if (!normalized) return [];
    
    try {
        const url = `${API_BASE_URL}/callLogs?number=${encodeURIComponent(normalized)}`;
        const response = await fetch(url, { headers: getAuthHeaders() });
        const data = await handleResponse(response);
        if (Array.isArray(data)) {
            // If response is [ {} ] or empty, return []
            if (data.length === 1 && data[0] && Object.keys(data[0]).length === 0) {
                return [];
            }
            return data as TelephonyCallLog[];
        }
        if (data && Array.isArray(data.data)) {
            if (data.data.length === 1 && data.data[0] && Object.keys(data.data[0]).length === 0) {
                return [];
            }
            return data.data;
        }
        return [];
    } catch (e) {
        console.warn("Failed to fetch telephony VoIP call logs:", e);
        return [];
    }
};

export const createCallLog = async (log: Omit<CrmCallLog, 'id'> & { id?: string }): Promise<CrmCallLog> => {
    if (log.userId) {
        try {
            await registerCrmActivity(Number(log.userId), log.agentName, log.agentName);
        } catch (e) {}
    }
    return {
        id: log.id || `LOG-${Date.now()}`,
        userId: log.userId,
        customerName: log.customerName || '',
        customerNumber: log.customerNumber || '',
        callType: log.callType || 'OUTBOUND',
        callStatus: log.callStatus || 'SUCCESSFUL',
        duration: log.duration || 0,
        agentName: log.agentName || 'کاربر سیستم',
        notes: log.notes || '',
        timestamp: log.timestamp || new Date().toLocaleString('fa-IR')
    };
};

export const updateCallLog = async (log: CrmCallLog): Promise<CrmCallLog> => {
    return log;
};

// --- CRM Meetings ---
const CRM_MEETINGS_URL = `${API_BASE_URL}/crmMeetings`;

export const getCrmMeetings = async (customerId?: string | number): Promise<CrmMeeting[]> => {
    let url = CRM_MEETINGS_URL;
    if (customerId !== undefined && customerId !== null && customerId !== '' && customerId !== 0) {
        url += `?customer_id=${encodeURIComponent(String(customerId).trim())}`;
    }
    const response = await fetch(url, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
        id: item.id,
        userId: item.customer_id !== undefined ? Number(item.customer_id) : (item.userId !== undefined ? Number(item.userId) : 0),
        customerName: item.customer_name || item.customerName || 'مشتری',
        customerNumber: item.customer_phone || item.customer_number || item.customerNumber || '',
        stage: item.meeting_stage || item.stage || 'دعوت',
        meetingDate: item.meeting_date || item.meetingDate || '',
        meetingTime: item.meeting_time || item.meetingTime || '',
        meetingLocation: item.location || item.meetingLocation || '',
        meetingResult: item.result_notes || item.meetingResult || '',
        agentName: item.agent_name || item.agentName || 'کاربر سیستم',
        createdAt: item.created_at || item.createdAt || ''
    }));
};

export const getCrmMeetingsByCustomerId = async (customerId: string | number): Promise<CrmMeeting[]> => {
    return getCrmMeetings(customerId);
};

export const createCrmMeeting = async (meeting: Omit<CrmMeeting, 'id'> & { id?: string | number }): Promise<CrmMeeting> => {
    ensureOnline();
    
    // Map to the webhook API structure
    const payload = {
        customer_id: meeting.userId,
        agent_name: meeting.agentName,
        meeting_stage: meeting.stage,
        meeting_date: meeting.meetingDate,
        meeting_time: meeting.meetingTime,
        location: meeting.meetingLocation,
        result_notes: meeting.meetingResult || '',
        // Include camelCase just in case
        userId: meeting.userId,
        customerName: meeting.customerName,
        customerNumber: meeting.customerNumber,
        stage: meeting.stage,
        meetingDate: meeting.meetingDate,
        meetingTime: meeting.meetingTime,
        meetingLocation: meeting.meetingLocation,
        meetingResult: meeting.meetingResult || '',
        agentName: meeting.agentName
    };

    const response = await fetch(CRM_MEETINGS_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    const result = await handleResponse(response);
    
    // Map response back to camelCase
    const mapped: CrmMeeting = {
        id: result.id,
        userId: result.customer_id !== undefined ? Number(result.customer_id) : (result.userId !== undefined ? Number(result.userId) : meeting.userId),
        customerName: result.customer_name || result.customerName || meeting.customerName || 'مشتری',
        customerNumber: result.customer_phone || result.customer_number || result.customerNumber || meeting.customerNumber || '',
        stage: result.meeting_stage || result.stage || meeting.stage,
        meetingDate: result.meeting_date || result.meetingDate || meeting.meetingDate,
        meetingTime: result.meeting_time || result.meetingTime || meeting.meetingTime,
        meetingLocation: result.location || result.meetingLocation || meeting.meetingLocation,
        meetingResult: result.result_notes || result.meetingResult || meeting.meetingResult,
        agentName: result.agent_name || result.agentName || meeting.agentName,
        createdAt: result.created_at || result.createdAt || ''
    };

    // Register lock/activity on local Express server if userId exists
    if (meeting.userId) {
        try {
            await registerCrmActivity(Number(meeting.userId), meeting.agentName, meeting.agentName);
        } catch (e) {
            console.warn("Failed to register CRM activity for meeting:", e);
        }
    }
    
    return mapped;
};

export const updateCrmMeeting = async (meeting: CrmMeeting): Promise<CrmMeeting> => {
    ensureOnline();

    // Map to the webhook API structure
    const payload = {
        id: meeting.id,
        customer_id: meeting.userId,
        agent_name: meeting.agentName,
        meeting_stage: meeting.stage,
        meeting_date: meeting.meetingDate,
        meeting_time: meeting.meetingTime,
        location: meeting.meetingLocation,
        result_notes: meeting.meetingResult || '',
        // Include camelCase just in case
        userId: meeting.userId,
        customerName: meeting.customerName,
        customerNumber: meeting.customerNumber,
        stage: meeting.stage,
        meetingDate: meeting.meetingDate,
        meetingTime: meeting.meetingTime,
        meetingLocation: meeting.meetingLocation,
        meetingResult: meeting.meetingResult || '',
        agentName: meeting.agentName
    };

    const response = await fetch(CRM_MEETINGS_URL, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    const result = await handleResponse(response);
    
    // Map response back to camelCase
    return {
        id: result.id,
        userId: result.customer_id !== undefined ? Number(result.customer_id) : (result.userId !== undefined ? Number(result.userId) : meeting.userId),
        customerName: result.customer_name || result.customerName || meeting.customerName || 'مشتری',
        customerNumber: result.customer_phone || result.customer_number || result.customerNumber || meeting.customerNumber || '',
        stage: result.meeting_stage || result.stage || meeting.stage,
        meetingDate: result.meeting_date || result.meetingDate || meeting.meetingDate,
        meetingTime: result.meeting_time || result.meetingTime || meeting.meetingTime,
        meetingLocation: result.location || result.meetingLocation || meeting.meetingLocation,
        meetingResult: result.result_notes || result.meetingResult || meeting.meetingResult,
        agentName: result.agent_name || result.agentName || meeting.agentName,
        createdAt: result.created_at || result.createdAt || ''
    };
};

// --- CRM Live Status & Locks ---

export interface CrmStatusResponse {
    activeViews: Array<{
        leadId: number;
        username: string;
        fullName: string;
        isEditing: boolean;
        lastActive: number;
    }>;
    locks: Array<{
        leadId: number;
        username: string;
        fullName: string;
        timestamp: number;
    }>;
}

// CRM status and heartbeat endpoints completely removed to prevent excessive server requests
export const getCrmStatus = async (): Promise<CrmStatusResponse> => {
    return { activeViews: [], locks: [] };
};

export const sendCrmHeartbeat = async (_leadId?: number, _username?: string, _fullName?: string, _isEditing?: boolean): Promise<void> => {
    // No-op: Completely removed to eliminate excessive server requests
};

export const registerCrmActivity = async (leadId: number, username: string, fullName: string): Promise<void> => {
    await fetch(`${CRM_URL}/activity`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ leadId, username, fullName }),
    });
};

export const clearCrmLock = async (leadId: number): Promise<void> => {
    await fetch(`${CRM_URL}/clear-lock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ leadId }),
    });
};

export const clearAllCrmLocks = async (): Promise<void> => {
    await fetch(`${CRM_URL}/clear-all-locks`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
};

// --- Collaboration Showrooms Services ---
export const COLLAB_WEBHOOK_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/collabration';

export const getCollaborations = async (): Promise<CollaborationShowroom[]> => {
    try {
        const response = await fetch(COLLAB_WEBHOOK_URL, {
            headers: getAuthHeaders()
        });
        const data = await handleResponse(response);
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && Array.isArray(data.items)) return data.items;
        return [];
    } catch (e) {
        return [];
    }
};

export const createCollaboration = async (payload: Omit<CollaborationShowroom, 'id'>): Promise<CollaborationShowroom> => {
    ensureOnline();
    const response = await fetch(COLLAB_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
};

export const updateCollaboration = async (id: string | number, payload: Partial<CollaborationShowroom>): Promise<CollaborationShowroom> => {
    ensureOnline();
    const response = await fetch(COLLAB_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ id, ...payload })
    });
    return handleResponse(response);
};

export const deleteCollaboration = async (id: string | number): Promise<void> => {
    ensureOnline();
    const response = await fetch(COLLAB_WEBHOOK_URL, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ id })
    });
    return handleResponse(response);
};

// --- Collaboration Cars / Partner Inventory Services ---
export const COLLAB_CAR_LIST_WEBHOOK_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/collabration-car-list';

export const getCollabCars = async (): Promise<CollaborationCar[]> => {
    try {
        const response = await fetch(COLLAB_CAR_LIST_WEBHOOK_URL, {
            headers: getAuthHeaders()
        });
        const data = await handleResponse(response);
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && Array.isArray(data.items)) return data.items;
        return [];
    } catch (e) {
        return [];
    }
};

export const createCollabCar = async (payload: Omit<CollaborationCar, 'id'>): Promise<CollaborationCar> => {
    ensureOnline();
    const response = await fetch(COLLAB_CAR_LIST_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
};

export const updateCollabCar = async (id: string | number, payload: Partial<CollaborationCar>): Promise<CollaborationCar> => {
    ensureOnline();
    const response = await fetch(COLLAB_CAR_LIST_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ id, ...payload })
    });
    return handleResponse(response);
};

export const deleteCollabCar = async (id: string | number): Promise<void> => {
    ensureOnline();
    const response = await fetch(COLLAB_CAR_LIST_WEBHOOK_URL, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ id })
    });
    return handleResponse(response);
};

// --- Storage Center Services (سامانه استاندارد مدیریت انبار و گردش کالا - اتصال مستقیم API) ---
export const STORAGE_WEBHOOK_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/storage-center';
export const STORAGE_TRANSACTIONS_WEBHOOK_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/storage-transactions';

// Helper to get current Gregorian datetime (e.g. "2026-10-13 14:30")
export const getNowGregorianDateTime = (): string => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

export const getTodayGregorianDate = (): string => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Get all storage inventory and stock movements directly from API (GET)
 * Strictly connects to webhook API - avoids offline mock data.
 */
export const getStorageData = async (): Promise<{ items: StorageItem[]; transactions: StockTransaction[] }> => {
    ensureOnline();

    // Clean up any legacy offline caches if present
    try {
        localStorage.removeItem('hk_storage_center_items_v2');
        localStorage.removeItem('hk_storage_center_transactions_v2');
        localStorage.removeItem('hk_storage_items');
        localStorage.removeItem('hk_storage_transactions');
    } catch {
        // ignore
    }

    let items: StorageItem[] = [];
    let transactions: StockTransaction[] = [];

    // 1. Fetch items from STORAGE_WEBHOOK_URL
    try {
        const response = await fetch(STORAGE_WEBHOOK_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...getAuthHeaders()
            }
        });
        const data = await handleResponse(response);
        if (Array.isArray(data)) {
            items = data;
        } else if (data && typeof data === 'object') {
            if (Array.isArray(data.items)) items = data.items;
            else if (Array.isArray(data.data)) items = data.data;
            if (Array.isArray(data.transactions)) transactions = data.transactions;
        }
    } catch (e) {
        console.warn('Error fetching storage items:', e);
    }

    // 2. Fetch transactions from STORAGE_TRANSACTIONS_WEBHOOK_URL
    try {
        const resTx = await fetch(STORAGE_TRANSACTIONS_WEBHOOK_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...getAuthHeaders()
            }
        });
        const dataTx = await handleResponse(resTx);
        if (Array.isArray(dataTx)) {
            transactions = dataTx;
        } else if (dataTx && typeof dataTx === 'object') {
            if (Array.isArray(dataTx.transactions)) transactions = dataTx.transactions;
            else if (Array.isArray(dataTx.data)) transactions = dataTx.data;
            else if (Array.isArray(dataTx.logs)) transactions = dataTx.logs;
            else if (Array.isArray(dataTx.movements)) transactions = dataTx.movements;
            else if (Array.isArray(dataTx.history)) transactions = dataTx.history;
        }
    } catch (e) {
        console.warn('Error fetching storage transactions:', e);
    }

    // Normalize items with Gregorian dates and numeric fields
    items = items.map(it => ({
        ...it,
        quantity: Number(it.quantity) || 0,
        minStock: Number(it.minStock) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        lastRestockDate: it.lastRestockDate ? String(it.lastRestockDate).replace(/\//g, '-') : undefined
    }));

    transactions = transactions.map(tx => ({
        ...tx,
        quantity: Number(tx.quantity || tx.transactionQuantity) || 0,
        previousStock: tx.previousStock !== undefined ? Number(tx.previousStock) : undefined,
        newStock: tx.newStock !== undefined ? Number(tx.newStock) : undefined,
        unitPrice: tx.unitPrice !== undefined ? Number(tx.unitPrice) : undefined,
        totalPrice: tx.totalPrice !== undefined ? Number(tx.totalPrice) : undefined
    }));

    return { items, transactions };
};

export const getStorageItems = async (): Promise<StorageItem[]> => {
    const data = await getStorageData();
    return data.items;
};

/**
 * Create a new storage item directly via API (POST)
 */
export const createStorageItem = async (payload: Omit<StorageItem, 'id'> & { id?: string | number }): Promise<StorageItem> => {
    ensureOnline();
    const itemData: StorageItem = {
        ...payload,
        id: payload.id || `ITM-${Date.now().toString().slice(-6)}`,
        quantity: Number(payload.quantity) || 0,
        minStock: Number(payload.minStock) || 0,
        unitPrice: Number(payload.unitPrice) || 0,
        lastRestockDate: payload.lastRestockDate || getTodayGregorianDate(),
        createdAt: getNowGregorianDateTime()
    };

    const response = await fetch(STORAGE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({
            action: 'CREATE_ITEM',
            ...itemData
        })
    });

    const res = await handleResponse(response);
    if (res && typeof res === 'object' && res.id) {
        return res as StorageItem;
    }
    return itemData;
};

/**
 * Update an existing storage item directly via API (PUT)
 */
export const updateStorageItem = async (id: string | number, payload: Partial<StorageItem>): Promise<StorageItem> => {
    ensureOnline();
    const updatePayload = {
        id,
        action: 'UPDATE_ITEM',
        ...payload,
        updatedAt: getNowGregorianDateTime()
    };

    const response = await fetch(STORAGE_WEBHOOK_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(updatePayload)
    });

    const res = await handleResponse(response);
    if (res && typeof res === 'object') {
        return { ...(updatePayload as any), ...res };
    }
    return updatePayload as StorageItem;
};

/**
 * Delete a storage item directly via API (DELETE)
 */
export const deleteStorageItem = async (id: string | number): Promise<void> => {
    ensureOnline();
    const response = await fetch(STORAGE_WEBHOOK_URL, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({
            id,
            action: 'DELETE_ITEM'
        })
    });
    await handleResponse(response);
};

/**
 * Record a standard Warehouse Stock Movement (Inbound, Outbound, or Adjustment)
 * Directly dispatches to API (POST / PUT) without offline fallback.
 */
export const recordStockMovement = async (params: {
    itemId: string | number;
    currentItem?: StorageItem;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    targetStock?: number;
    date?: string;
    referenceNumber?: string;
    sourceOrDestination?: string;
    reason: string;
    unitPrice?: number;
    operator?: string;
    notes?: string;
}): Promise<{ item: StorageItem; transaction: StockTransaction }> => {
    ensureOnline();

    let item = params.currentItem;
    if (!item) {
        const currentData = await getStorageData();
        item = currentData.items.find(i => String(i.id) === String(params.itemId));
    }

    if (!item) {
        throw new Error('کالای مورد نظر برای ثبت گردش انبار یافت نشد.');
    }

    const prevStock = Number(item.quantity) || 0;
    let newStock = prevStock;
    const qty = Math.abs(Number(params.quantity) || 0);

    if (params.type === 'IN') {
        newStock = prevStock + qty;
    } else if (params.type === 'OUT') {
        if (prevStock < qty) {
            throw new Error(`موجودی فعلی کالا (${prevStock} ${item.unit}) کمتر از مقدار درخواستی برای خروج (${qty} ${item.unit}) است.`);
        }
        newStock = prevStock - qty;
    } else if (params.type === 'ADJUSTMENT') {
        newStock = params.targetStock !== undefined ? Number(params.targetStock) : qty;
    }

    const updatedItem: StorageItem = {
        ...item,
        quantity: Math.max(0, newStock),
        lastRestockDate: params.type === 'IN' ? (params.date?.split(' ')[0] || getTodayGregorianDate()) : item.lastRestockDate,
        updatedAt: getNowGregorianDateTime()
    };

    const movement: StockTransaction = {
        id: `MOV-${Date.now().toString().slice(-6)}`,
        itemId: item.id,
        itemName: item.name || '',
        category: item.category,
        unit: item.unit || 'عدد',
        location: item.location || 'انبار مرکزی',
        type: params.type,
        quantity: qty,
        transactionQuantity: params.type === 'OUT' ? -qty : qty,
        previousStock: prevStock,
        newStock: newStock,
        date: params.date || getNowGregorianDateTime(),
        referenceNumber: params.referenceNumber || '',
        sourceOrDestination: params.sourceOrDestination || '',
        receiverOrSource: params.sourceOrDestination || '',
        reason: params.reason || '',
        unitPrice: params.unitPrice !== undefined ? params.unitPrice : item.unitPrice,
        totalPrice: (params.unitPrice !== undefined ? params.unitPrice : (item.unitPrice || 0)) * qty,
        operator: params.operator || localStorage.getItem('currentUsername') || 'مسئول انبار',
        notes: params.notes || ''
    };

    // 1. Send movement transaction via POST to API endpoints
    await Promise.allSettled([
        fetch(STORAGE_TRANSACTIONS_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                action: 'STOCK_MOVEMENT',
                transaction: movement,
                item: updatedItem
            })
        }),
        fetch(STORAGE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                action: 'STOCK_MOVEMENT',
                transaction: movement,
                item: updatedItem
            })
        })
    ]);

    // 2. Sync updated item stock to API via PUT
    try {
        await updateStorageItem(item.id, {
            quantity: updatedItem.quantity,
            lastRestockDate: updatedItem.lastRestockDate
        });
    } catch (e) {
        console.warn('Item stock PUT notice:', e);
    }

    return { item: updatedItem, transaction: movement };
};

/**
 * Update stock movement record directly via API (PUT)
 */
export const updateStockMovement = async (id: string | number, payload: Partial<StockTransaction>): Promise<StockTransaction> => {
    ensureOnline();
    const updatePayload = {
        id,
        action: 'UPDATE_MOVEMENT',
        ...payload
    };

    const response = await fetch(STORAGE_WEBHOOK_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(updatePayload)
    });

    const res = await handleResponse(response);
    return (res && typeof res === 'object') ? res : (updatePayload as any);
};

/**
 * Delete stock movement record directly via API (DELETE)
 */
export const deleteStockMovement = async (id: string | number, revertStock: boolean = false, tx?: StockTransaction): Promise<void> => {
    ensureOnline();
    const response = await fetch(STORAGE_WEBHOOK_URL, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({
            id,
            action: 'DELETE_MOVEMENT',
            revertStock
        })
    });
    await handleResponse(response);

    if (revertStock && tx && tx.itemId) {
        try {
            const data = await getStorageData();
            const currentItem = data.items.find(i => String(i.id) === String(tx.itemId));
            if (currentItem) {
                const qty = Number(tx.quantity) || 0;
                let revertedQty = currentItem.quantity;
                if (tx.type === 'IN') {
                    revertedQty = Math.max(0, currentItem.quantity - qty);
                } else if (tx.type === 'OUT') {
                    revertedQty = currentItem.quantity + qty;
                } else if (tx.type === 'ADJUSTMENT' && tx.previousStock !== undefined) {
                    revertedQty = tx.previousStock;
                }
                await updateStorageItem(currentItem.id, { quantity: revertedQty });
            }
        } catch (e) {
            console.warn('Revert stock notice:', e);
        }
    }
};

// --- Attendance / Timesheet Services ---
export * from './timesheetService';

// --- Operator Call Scores API ---
export const CALL_SCORE_API_URL = `${API_BASE_URL}/call_score`;

export const getCallScores = async (): Promise<CallScoreItem[]> => {
    ensureOnline();
    const response = await fetch(CALL_SCORE_API_URL, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};



