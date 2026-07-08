
export enum ConditionStatus {
    AVAILABLE = 'موجود',
    SOLD_OUT = 'فروخته شد',
    CAPACITY_FULL = 'تکمیل ظرفیت',
}

export enum SaleType {
    FACTORY_REGISTRATION = 'ثبت‌نام کارخانه',
    TRANSFER = 'حواله',
    LEASING = 'لیزینگی',
    NEW_MARKET = 'صفر بازار',
    USED = 'کارکرده',
}

export enum PayType {
    INSTALLMENT = 'قسطی',
    CASH = 'نقدی',
    PRE_SALE = 'پیش فروش',
}

export enum DocumentStatus {
    FREE = 'آزاد',
    PLEDGED = 'در رهن',
}

// --- Customer Club Types ---
export enum CustomerSegment {
    REGULAR = 'عادی',
    INVESTOR = 'سرمایه‌گذار',
    POLITICAL = 'نفوذ سیاسی/حاکمیتی',
    FRIEND = 'سابقه دوستی',
    VIP = 'سفارشی',
    OCCUPATIONAL = 'تخفیف مشاغل',
}

export enum LeadStatus {
    NEW = 'جدید',
    CONTACTED = 'تماس گرفته شده',
    MEETING = 'جلسه حضوری',
    NEGOTIATION = 'در حال مذاکره',
    WON = 'موفق (خرید)',
    LOST = 'ناموفق',
    NO_ANSWER = 'پاسخ نداد',
}

export interface Announcement {
    id: number;
    title: string;
    content: string;
    category: 'NEWS' | 'ALERT' | 'SYSTEM';
    isUrgent: boolean;
    author: string;
    createdAt: string;
}

export interface CustomerJournal {
    id: number;
    userId: number;
    author: string;
    content: string;
    createdAt: string;
}

export interface CarSaleCondition {
    id: number;
    status: ConditionStatus;
    car_model: string;
    model: number; // Sale year
    sale_type: SaleType;
    pay_type: PayType;
    document_status: DocumentStatus;
    colors: string[];
    delivery_time: string; // e.g., '30 روز کاری'
    initial_deposit: number;
    descriptions?: string;
    is_public: boolean;
    stock_quantity: number;
    owner_id?: number | null;
    owner_name?: string | null;
    owner_phone?: string | null;
    expert_report_id?: number | null;
    expert_report_title?: string | null;
}

export interface User {
    id: number;
    CarModel: string;
    FullName: string;
    Number: string;
    Province: string | null;
    City: string;
    Decription: string;
    IP: string | null;
    RegisterTime: string;
    reference: string;
    LastAction: string | null;
    createdAt: string;
    updatedAt: string;
    crmIsSend?: 0 | 1;
    crmPerson?: string | null;
    crmDate?: string | null;
    // Club Fields
    segment?: CustomerSegment;
    behaviorScore?: number; // 1 to 5
    tags?: string[]; // e.g., ["خوش‌حساب", "عجول"]
    // CRM Fields
    leadStatus?: LeadStatus;
    reservedByUserId?: number | null;
    reservedByUserName?: string | null;
}

export interface LeadMessage {
    id: number;
    number: string;
    Message: string;
    media: string | null;
    receive: 0 | 1; // 1 for incoming (customer), 0 for outgoing (agent/system)
    createdAt: string;
    updatedAt: string;
}

export interface Car {
    id: number;
    name: string;
    brand: string;
    technical_specs: string;
    comfort_features: string;
    main_image_url: string;
    front_image_url: string;
    side_image_url: string;
    rear_image_url: string;
    dashboard_image_url: string;
    interior_image_1_url: string;
    interior_image_2_url: string;
}

export interface DealershipInfo {
    dealership_name: string;
    company_name: string;
    logo_url: string;
    establishment_year: number | string;
    activity_area: string;
    address: string;
    google_maps_url: string;
    neshan_maps_url: string;
    contact_phones: string;
    mobile_numbers: string;
    instagram_url: string;
    youtube_url: string;
    telegram_channel_url: string;
    whatsapp_channel_url: string;
    threads_url: string;
    competitive_advantages: string;
    description: string;
}

export interface CarPrice {
    id: number;
    car_model: string;
    price_date: string;
    factory_price: number;
    market_price: number;
}

export interface ScrapedCarPrice {
    id: number;
    source_name: string;
    model_name: string;
    price_text: string;
    price_rial: number;
    status: string;
    captured_at: string;
}

export interface CarPriceSource {
    source_name: string;
}

export interface CarPriceStats {
    id: number;
    model_name: string;
    minimum: number;
    maximum: number;
    average: number;
    computed_at: string;
    lowestLimit?: number;
}

export interface ActiveLead {
    FullName: string;
    CarModel: string | null;
    Message: string;
    number: string;
    updatedAt: string;
}

export enum DeliveryStatus {
    AWAITING_DOCUMENTS = 'در انتظار مدارک',
    PREPARING_VEHICLE = 'آماده‌سازی خودرو',
    READY_FOR_PICKUP = 'آماده تحویل',
    DELIVERED = 'تحویل داده شد',
}

export interface DeliveryProcess {
    id: number;
    customerName: string;
    carModel: string;
    chassisNumber: string;
    status: DeliveryStatus;
    scheduledDate: string; // ISO date string
    deliveredDate: string | null; // ISO date string
    notes?: string;
}

// --- Car Sale Orders ---

export enum OrderStatus {
    DRAFT = 'پیش‌نویس',
    PENDING_ADMIN = 'در انتظار تایید مدیریت',
    REJECTED = 'رد شده',
    PENDING_PAYMENT = 'منتظر پرداخت کاربر',
    PENDING_FINANCE = 'در انتظار تایید مالی',
    READY_FOR_DELIVERY = 'آماده تحویل',
    EXIT_PROCESS = 'در فرآیند خروج',
    COMPLETED = 'تکمیل شده',
}

export interface CarOrder {
    id: number;
    trackingCode?: string;
    // Step 1: Buyer
    buyerName: string;
    buyerNationalId: string;
    buyerPhone: string;
    buyerCity: string;
    buyerAddress: string;
    buyerAddressPostalCode?: string; // Potential legacy field
    buyerPostalCode: string;
    // Step 2: Car & Condition
    carName: string;
    conditionId: number;
    conditionSummary: string; // Detailed snapshot
    // Step 3: Proposal
    selectedColor: string;
    proposedPrice: number;
    userNotes: string;
    // Admin Review
    adminNotes?: string;
    finalPrice?: number;
    deliveryDeadline?: string;
    // System
    status: OrderStatus;
    createdBy: string; // username
    createdAt: string;
    updatedAt: string;
}

// --- Access Control Types ---

export type AppModule = 'users' | 'conditions' | 'cars' | 'prices' | 'vehicle-exit' | 'settings' | 'orders';
export type ActionType = 'view' | 'add' | 'edit' | 'delete';

export interface Permission {
    module: AppModule;
    actions: ActionType[];
}

export interface ApiSystemUser {
    id: number;
    username: string;
    full_name: string | null;
    whatsapp_apikey: string | null;
    permission_level: number; // 0 or 1
    isAdmin: number; // 0 or 1
    register_time: string;
    last_update: string;
    mobile: string | null;
    email: string | null;
    password?: string; // Optional for request payloads
    // Expanded Profile Fields
    personality_type?: string;
    birth_date?: string;
    org_phone?: string;
    org_email?: string;
    didar_username?: string;
}

export interface MyProfile {
    id: number;
    username: string;
    full_name: string | null;
    whatsapp_apikey: string | null;
    permission_level: number;
    isAdmin: 0 | 1;
    register_time: string;
    last_update: string;
    mobile: string | null;
    email: string | null;
    mbti: string | null;
    description: string | null;
    last_login: string | null;
    birth_date: string | null;
}

export interface StaffUser {
    id: number | string; // string for new users
    username: string;
    password?: string; // Optional, used only for creation
    fullName: string;
    role: 'ADMIN' | 'STAFF';
    permissions: Permission[];
    lastLogin?: string;
    isActive: boolean;
}

// --- Poll Types ---

export interface PollQuestionMap {
    Title: string;
    Key: string;
}

export interface PollCustomerFields {
    [key: string]: string | number;
}

export interface PollCustomerContact {
    DisplayName: string | null;
    MobilePhone: string | null;
}

export interface PollCustomerResult {
    Fields: PollCustomerFields;
    Description: string; 
    Contact: PollCustomerContact;
    PipelineChangeTime: string;
    DeliveryDate?: string;
    DeliveryMonth?: number;
    DeliveryYear?: string;
    ignore?: boolean;
}

export interface PollAverages {
    [key: string]: number;
}

export interface PollApiResponseItem {
    AverageAll?: PollAverages;
    perCustomerResults?: PollCustomerResult[];
    inProgress?: PollCustomerResult[];
    NotAnswered?: PollCustomerResult[];
    fieldsGuid?: PollQuestionMap[];
}

export interface ProcessedPollData {
    averages: PollAverages;
    customers: PollCustomerResult[]; // Completed
    inProgress: PollCustomerResult[]; // In Progress
    notAnswered: PollCustomerResult[]; // Not Answered
    questions: Record<string, string>; // Key -> Title Mapping
}

// --- HR & Admin Types ---

export interface CorrectiveAction {
    id: number;
    title: string;
    description: string;
    responsiblePerson: string;
    dueDate: string;
    isCompleted: boolean;
    createdAt: string;
}

export interface MeetingMinute {
    id: number;
    title: string;
    date: string;
    attendees: string;
    decisions: string;
}

export type LeaveType = 'HOURLY' | 'DAILY';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
    id: number;
    requesterName: string;
    type: LeaveType;
    startDate: string;
    endDate?: string; // For daily
    hours?: number; // For hourly
    reason: string;
    status: LeaveStatus;
    createdAt: string;
}

export interface AnonymousFeedback {
    id: number;
    subject: string;
    message: string;
    createdAt: string;
    isRead: boolean;
}

export type SalaryAdvanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SalaryAdvanceRequest {
    id: number;
    requesterName: string;
    amount: number; // amount in Tomans
    targetDate: string; // "jYYYY/jMM/jDD"
    reason: string;
    status: SalaryAdvanceStatus;
    createdAt: string;
    notes?: string;
}

// --- Overtime Request Types ---
export type OvertimeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OvertimeRequest {
    id: number;
    requesterName: string;
    date: string; // "jYYYY/jMM/jDD" or "YYYY/MM/DD"
    hours: number; // e.g., 2.5
    reason: string;
    status: OvertimeStatus;
    createdAt: string;
    notes?: string;
}

// --- Zero Car Delivery Types ---

export interface ZeroCarDelivery {
    id: number;
    // Section 1: Verification
    customerName: string;
    carModel: string;
    color: string;
    chassisNumber: string;
    plateNumber?: string;
    contractNumber?: string;
    documentNumber?: string;
    documentDate: string;
    phoneNumber: string;
    status: 'VERIFICATION' | 'PROCESSING' | 'DELIVERED';
    secondOwnerName?: string;
    verificationNotes?: string;

    // Section 2: Delivery Process (Dates include times)
    arrivalDateTime?: string;
    contactDateTime?: string;
    deliveryDateTime?: string;
    installedOptions?: string;
    deliveryNotes?: string;
}

// --- Secure Transaction (Transfer Paks) Types ---

export enum TransactionStatus {
    DRAFT = 'پیش‌نویس',
    TECH_CHECK = 'کارشناسی فنی',
    LEGAL_CHECK = 'استعلام حقوقی',
    FINANCE_CHECK = 'تایید مالی',
    CONTRACT_SIGN = 'امضای قرارداد',
    COMPLETED = 'تکمیل شده',
}

export type TransactionRole = 'ADMIN' | 'TECH_EXPERT' | 'LEGAL_EXPERT' | 'FINANCE_EXPERT' | 'CUSTOMER';

export type TransactionType = 'ZERO' | 'USED' | 'HAVALEH';

export interface TransactionStep {
    id: number;
    title: string;
    roleRequired: TransactionRole[];
    isCompleted: boolean;
}

export interface SecureTransaction {
    id: string;
    type: TransactionType;
    status: TransactionStatus;
    carModel: string;
    sellerName: string;
    buyerName: string;
    price: number;
    currentStep: number;
    createdAt: string;
    steps: TransactionStep[];
}

// --- Notification Center ---

export type NotificationType = 'WHATSAPP' | 'SMS' | 'BALE';
export type NotificationStatus = 'SENT' | 'FAILED' | 'PENDING';

export interface NotificationLog {
    id: string;
    type: NotificationType;
    recipientName: string;
    recipientNumber: string;
    message: string;
    status: NotificationStatus;
    sentAt: string;
    sender: string;
}

export interface MessageTemplate {
    id: string;
    title: string;
    content: string;
    category: string; // e.g., 'Conditions', 'FollowUp', 'Greeting'
    createdAt: string;
}

// --- Advertising Types ---

export type AdPlatform = 'INSTAGRAM' | 'GOOGLE' | 'SMS' | 'WEBSITE' | 'BILLBOARD' | 'OTHER';
export type AdStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT';

export interface AdCampaign {
    id: number;
    title: string;
    platform: AdPlatform;
    status: AdStatus;
    budget: number; // In Tomans
    spent: number; // In Tomans
    startDate: string;
    endDate?: string;
    impressions?: number;
    leads?: number; // Number of leads generated
    notes?: string;
}

// --- Used Car Types ---

export type UsedCarLocation = 'OWNER' | 'SHOWROOM' | 'WAREHOUSE' | 'OTHER';
export type UsedCarStatus = 'EXPERT_REVIEW' | 'ADVERTISING' | 'SELLING';

export interface UsedCar {
    id: number;
    // Seller
    sellerName: string;
    sellerPhone1: string;
    sellerPhone2?: string;
    // Car
    carName: string;
    modelYear: number;
    mileage: number;
    color: string;
    // Technical
    bodyStatus: string;
    engineStatus: string;
    expertReportImage?: string;
    // Images
    imageFront?: string;
    imageBack?: string;
    imageRight?: string;
    imageLeft?: string;
    imageInterior?: string;
    imageDashboard?: string;
    imageEngine?: string;
    imageTrunk?: string;
    // Status
    insuranceThirdParty: string;
    insuranceBody: string;
    warrantyStatus: string;
    location: UsedCarLocation;
    // Sales
    price: number;
    salesRep: string;
    status: UsedCarStatus;
    createdAt: string;
}

export interface CrmCallLog {
    id: string;
    userId?: number;
    customerName: string;
    customerNumber: string;
    callType: 'INBOUND' | 'OUTBOUND';
    callStatus: 'SUCCESSFUL' | 'MISSED' | 'NO_ANSWER' | 'BUSY' | 'REJECTED';
    duration: number; // in seconds
    agentName: string;
    followUpPhone?: string; // تلفن پیگیری
    notes: string;
    timestamp: string; // "jYYYY/jMM/jDD HH:mm"
}

