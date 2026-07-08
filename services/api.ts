
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
    OvertimeRequest,
    CrmCallLog
} from '../types';

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
            return;
        }
        return response.json();
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
        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        }
        if (data && typeof data === 'object' && !Array.isArray(data) && data.token && data.id) {
            return data;
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

    return usersArray.map(user => {
        const isAdmin = user.isAdmin === 1;
        // Find permission record for this user (assuming username match)
        const permRecord = (allPermissions as any[]).find((p: any) => p.username === user.username);
        // If user is admin, they have implicit full permissions. Otherwise, use stored permissions.
        const permissions = isAdmin ? [] : (permRecord?.permissions || []);
        
        return {
            id: user.id,
            username: user.username,
            fullName: user.full_name || user.username,
            role: isAdmin ? 'ADMIN' : 'STAFF',
            permissions: permissions,
            lastLogin: user.last_update || user.register_time,
            isActive: true 
        };
    });
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
    
    // Prepare a comprehensive payload for the API
    const apiPayload: any = {
        // Core fields
        username: user.username,
        full_name: user.fullName || user.full_name,
        isAdmin: user.role === 'ADMIN' ? 1 : 0,
        permission_level: 1, // Default permission level
        
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
        // This is an update. Add the id to the payload.
        apiPayload.id = user.id;
        await updateApiUser(apiPayload);
    } else {
        // This is a create. The temporary string id should not be sent.
        createdUser = await addApiUser(apiPayload);
    }

    // Sync password to webhook if password is set or changed
    if (user.password && user.username) {
        await syncPasswordChangeToWebhook(user.username, user.password);
    }
    
    // The permissions logic is separate and seems to work correctly.
    // It uses a different endpoint (/Permissions) so it should remain separate.
    const usernameForPerms = createdUser ? createdUser.username : user.username;
    if (usernameForPerms && user.role === 'STAFF' && user.permissions) {
        const allPermissions = await permissionsService.getAll();
        const existingRecord = allPermissions.find((p: any) => p.username === usernameForPerms);

        if (existingRecord) {
            await permissionsService.update({
                id: existingRecord.id,
                username: usernameForPerms,
                permissions: user.permissions
            });
        } else {
            await permissionsService.create({
                username: usernameForPerms,
                permissions: user.permissions
            });
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
    const allPermissions = await permissionsService.getAll();
    const existingRecord = allPermissions.find((p: any) => p.username === username);
    if (existingRecord) {
        await permissionsService.delete(existingRecord.id);
    }
};


// --- Car Sale Conditions ---

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
            
    return { 
        ...restOfApiData, 
        document_status: indeed_status,
        colors: colorsArray,
        is_public: !!is_public,
        stock_quantity: parseInt(rawStock, 10) || 0
    } as CarSaleCondition;
};

const denormalizeCondition = (condition: Omit<CarSaleCondition, 'id'> | CarSaleCondition) => {
    const { document_status, ...restOfAppData } = condition;
    const stockQtyVal = typeof condition.stock_quantity === 'number' 
        ? condition.stock_quantity 
        : parseInt(condition.stock_quantity as any, 10) || 0;

    return {
        ...restOfAppData,
        indeed_status: document_status,
        colors: Array.isArray(condition.colors) ? condition.colors.join(',') : '',
        is_public: condition.is_public ? 1 : 0,
        stock_quantity: stockQtyVal,
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
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(denormalizeCondition(condition)),
    });
    const newCondition = await handleResponse(response);
    return normalizeCondition(newCondition);
};

export const updateCondition = async (id: number, updatedCondition: CarSaleCondition): Promise<CarSaleCondition> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(denormalizeCondition(updatedCondition)),
    });
    const resultCondition = await handleResponse(response);
    return resultCondition ? normalizeCondition(resultCondition) : updatedCondition;
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
    const response = await fetch(`${API_BASE_URL}/user?number=${number}`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    // API returns an array, we want the first item as per the provided response format
    return (Array.isArray(data) && data.length > 0) ? data[0] : null;
};

export const getLeadHistory = async (number: string): Promise<LeadMessage[]> => {
    const response = await fetch(`${API_BASE_URL}/users/history?number=${number}`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const getUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
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
    return handleResponse(response);
};

export const updateUser = async (id: number, updatedUser: User): Promise<User> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedUser),
    });
    const resultUser = await handleResponse(response);
    return resultUser ? resultUser : updatedUser;
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

// --- Announcements ---
const ANNOUNCEMENTS_URL = `${API_BASE_URL}/announcements`;

export const getAnnouncements = async (): Promise<any[]> => {
    try {
        const response = await fetch(ANNOUNCEMENTS_URL, { headers: getAuthHeaders() });
        const data = await handleResponse(response);
        if (Array.isArray(data)) {
            return data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return [];
    } catch (e) {
        // Fallback if endpoint doesn't exist
        return [];
    }
};

export const createAnnouncement = async (announcement: Omit<any, 'id' | 'createdAt'>): Promise<any> => {
    ensureOnline();
    const payload = {
        ...announcement,
        createdAt: new Date().toLocaleString('fa-IR'),
    };
    const response = await fetch(ANNOUNCEMENTS_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const deleteAnnouncement = async (id: number): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${ANNOUNCEMENTS_URL}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- Customer Journals (CRM Reports) ---

const JOURNALS_URL = `${API_BASE_URL}/CustomerJournals`;

export const getCustomerJournals = async (userId: number | string): Promise<CustomerJournal[]> => {
    const response = await fetch(`${JOURNALS_URL}?userId=${userId}`, { headers: getAuthHeaders() });
    let data = await handleResponse(response);
    
    // Fallback client-side filtering in case the API ignores the query parameter
    if(Array.isArray(data)) {
        data = data.filter((j: CustomerJournal) => String(j.userId) === String(userId));
        return data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
};

export const createCustomerJournal = async (journal: Omit<CustomerJournal, 'id' | 'createdAt'>): Promise<CustomerJournal> => {
    ensureOnline();
    const payload = {
        ...journal,
        createdAt: new Date().toLocaleString('fa-IR'),
    };
    const response = await fetch(JOURNALS_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
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
                    result.questions[field.Key] = field.Title;
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
const USED_CARS_URL = `${API_BASE_URL}/UsedCars`;
const CAR_ORDERS_URL = `${API_BASE_URL}/CarOrders`;
const OVERTIME_URL = `${API_BASE_URL}/overtime`;

// Generic CRUD helper
const createCrudService = <T>(url: string) => ({
    getAll: async (): Promise<T[]> => {
        const response = await fetch(url, { headers: getAuthHeaders() });
        const data = await handleResponse(response);
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object') return [data] as T[];
        return [];
    },
    create: async (item: Partial<T>): Promise<T> => {
        ensureOnline();
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(item),
        });
        return handleResponse(response);
    },
    update: async (item: Partial<T> & { id: number }): Promise<T> => {
        ensureOnline();
        const response = await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(item),
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
export const meetingMinutesService = createCrudService<MeetingMinute>(MEETING_MINUTES_URL);
export const adCampaignsService = createCrudService<AdCampaign>(AD_CAMPAIGNS_URL);
export const usedCarsService = createCrudService<UsedCar>(USED_CARS_URL);
export const carOrdersService = createCrudService<CarOrder>(CAR_ORDERS_URL);

export const overtimeService = createCrudService<OvertimeRequest>(OVERTIME_URL);

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
        
        if (Array.isArray(data)) {
            return data.length > 0 ? data[0] : {};
        }
        
        return data;
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
        if (Array.isArray(data) && data.length > 0) return data[0];
        if (data && typeof data === 'object') return data as MyProfile;
        return null;
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

const getStoredTemplates = (): MessageTemplate[] => {
    const stored = localStorage.getItem('messageTemplates');
    return stored ? JSON.parse(stored) : [];
};

const getStoredLogs = (): NotificationLog[] => {
    const stored = localStorage.getItem('notificationLogs');
    return stored ? JSON.parse(stored) : [];
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
    localStorage.setItem('notificationLogs', JSON.stringify(logs));
    
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
    localStorage.setItem('messageTemplates', JSON.stringify(templates));
    
    return Promise.resolve(newTemplate);
};

export const deleteMessageTemplate = async (id: string): Promise<void> => {
    const templates = getStoredTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem('messageTemplates', JSON.stringify(filtered));
    return Promise.resolve();
};

// --- CRM Call Logs Server Endpoints ---
export const getCallLogs = async (): Promise<CrmCallLog[]> => {
    const response = await fetch('/calllog');
    return handleResponse(response);
};

export const createCallLog = async (log: Omit<CrmCallLog, 'id'> & { id?: string }): Promise<CrmCallLog> => {
    const response = await fetch('/calllog', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(log),
    });
    return handleResponse(response);
};

export const updateCallLog = async (log: CrmCallLog): Promise<CrmCallLog> => {
    const response = await fetch('/calllog', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(log),
    });
    return handleResponse(response);
};

