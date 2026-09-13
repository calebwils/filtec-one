export type Role = 'ADMIN' | 'EMPLOYEE' | 'DEALER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl?: string;
  department?: string;
  employeeCode?: string;
  dealerId?: string;
  allowedPages?: string[];
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  phone: string;
  territory?: string;
  targetMonthly?: number;
  currentMonthSales?: number;
  activeOrdersCount?: number;
  checkInStatus?: 'CHECKED_IN' | 'CHECKED_OUT';
  lastCheckInTime?: string;
  lastLocation?: string;
  designation?: string;
  baseSalary?: number;
  assignedDealerIds?: string[];
  dateOfJoining?: string;
  email?: string;
  remarks?: string;
  systemRole?: Role;
  allowedPages?: string[];
}

export interface Dealer {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  phone: string;
  city: string;
  state: string;
  address: string;
  creditLimit: number;
  outstandingBalance: number;
  tier: 'Platinum' | 'Gold' | 'Silver';
  totalPurchases: number;
  availableRewards: number;
  plumbersCount: number;
  gstin?: string;
}

export interface Plumber {
  id: string;
  dealerId: string;
  dealerName: string;
  name: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalAllocatedRewards: number;
  rewardHistoryCount: number;
  dateAdded: string;
}

export type ProductCategory = 'pipes' | 'fittings' | 'valves' | 'solvents' | 'tape';
export type MaterialType = 'uPVC' | 'CPVC' | 'PTFE';

export interface ProductVariant {
  id: string;
  productId: string;
  length?: string; // '3 Mtr' | '6 Mtr'
  size?: string; // '15 mm (1/2")', etc.
  mrp: number; // Catalog MRP
  packingQty: number; // e.g. 30 pcs, 50 tube
  packingUnit: string; // 'Pcs' | 'Bundle' | 'Box' | 'Tin'
  inStock?: boolean;
}

export interface Product {
  id: string;
  code: string; // F1 to F99
  name: string;
  category: ProductCategory;
  material: MaterialType;
  standard: string; // SCH-40 (ASTM D1785), SDR-11 (ASTM D2846)
  sizeMm?: string;
  sizeInch?: string;
  application: string;
  variants: ProductVariant[];
  moq: number;
  packingSummary: string;
  tags: string[];
  inStock?: boolean;
  stockStatus?: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  isArchived?: boolean;
  imageUrl?: string;
}

export type OrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_ADMIN_APPROVAL'
  | 'APPROVED'
  | 'SENT_TO_ERP'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'INVOICED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  variantId: string;
  variantDescription: string;
  unitPrice: number;
  quantity: number;
  packingQty: number;
  packingUnit: string;
  totalAmount: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-2026-1042
  employeeId: string;
  employeeName: string;
  dealerId: string;
  dealerName: string;
  dealerPhone: string;
  dealerCity: string;
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  adminNotes?: string;
  rejectionReason?: string;
  rewardEstimated: number;
  rewardDealerShare: number;
  rewardPlumberShare: number;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  erpSyncAt?: string;
  confirmedAt?: string;
  invoicedAt?: string;
  invoiceNumber?: string;
}

export interface RewardTransaction {
  id: string;
  dealerId: string;
  orderId?: string;
  orderNumber?: string;
  plumberId?: string;
  plumberName?: string;
  type: 'CREDIT_ORDER' | 'DEBIT_PLUMBER_ALLOCATION' | 'ADJUSTMENT';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface RewardConfig {
  ratePercent: number; // default 1.0 (1%)
  dealerSharePercent: number; // default 75 (%)
  plumberSharePercent: number; // default 25 (%)
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  latitude: number;
  longitude: number;
  locationName: string;
  photoUrl: string;
  verified: boolean;
}

export interface IntegrationEvent {
  id: string;
  type: 'ERP_SYNC' | 'WHATSAPP_DISPATCH';
  title: string;
  targetId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  payloadSummary: string;
  timestamp: string;
  latencyMs?: number;
}

export interface WhatsAppMessage {
  id: string;
  recipientPhone: string;
  recipientName: string;
  templateName: string;
  messageBody: string;
  sentAt: string;
  status: 'SENT' | 'DELIVERED';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface AttendanceVerificationPoint {
  timestamp: string;
  time: string;
  latitude: number;
  longitude: number;
  locationName: string;
  photoUrl: string;
  verified: boolean;
}

export interface DailyAttendanceSummary {
  id: string;
  date: string; // YYYY-MM-DD
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  territory: string;
  phone: string;
  status: 'PRESENT' | 'ACTIVE_ON_FIELD' | 'CHECKED_OUT' | 'ABSENT' | 'ON_LEAVE';
  checkIn?: AttendanceVerificationPoint;
  checkOut?: AttendanceVerificationPoint;
  hoursWorked?: number;
  dealerVisitsCount?: number;
  ordersCount?: number;
  notes?: string;
}

export interface WeeklyDayStatus {
  date: string;
  dayName: string;
  status: 'PRESENT' | 'ACTIVE_ON_FIELD' | 'CHECKED_OUT' | 'ABSENT' | 'ON_LEAVE' | 'WEEKEND';
  hours: number;
  checkInLocation?: string;
  checkOutLocation?: string;
}

export interface WeeklyAttendanceSummary {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  territory: string;
  days: WeeklyDayStatus[];
  totalPresent: number;
  totalAbsent: number;
  totalHours: number;
  attendancePercentage: number;
}

export interface MonthlyAttendanceSummary {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  territory: string;
  monthName: string;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePercentage: number;
  ordersBooked: number;
  totalSalesAchieved: number;
  baseSalary: number;
  payableSalary: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'CASUAL' | 'SICK' | 'PLANNED' | 'COMPENSATORY';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isHalfDay?: boolean;
  contactNumber?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface AppSettings {
  company: {
    legalName: string;
    brandName: string;
    plantAddress: string;
    supportWhatsApp: string;
    supportEmail: string;
    gstin: string;
    defaultGstPercent: number;
    currency: string;
    timezone: string;
  };
  permissions: {
    admin: {
      canApproveOrders: boolean;
      canOverridePricing: boolean;
      canManageStaff: boolean;
      canManageDealers: boolean;
      canApproveLeave: boolean;
      canAccessIntegrations: boolean;
    };
    employee: {
      canCreateOrders: boolean;
      canViewDealers: boolean;
      canEditDealerContact: boolean;
      canApplyLeave: boolean;
      canViewAttendanceHistory: boolean;
    };
    dealer: {
      canCreateDirectOrders: boolean;
      canAllocatePlumberRewards: boolean;
      canViewInvoices: boolean;
      canManagePlumbers: boolean;
    };
    pageAccess: {
      adminPages: string[];
      employeePages: string[];
      dealerPages: string[];
    };
  };
  policy: {
    monthlyCasualLeaveQuota: number;
    annualLeaveQuota: number;
    workDayHours: number;
    checkInGraceMinutes: number;
    requirePhotoSelfie: boolean;
    creditLimitWarningPercent: number;
  };
  notifications: {
    whatsappOrderUpdates: boolean;
    whatsappLeaveUpdates: boolean;
    whatsappPaymentReceipts: boolean;
    erpSyncAutomated: boolean;
  };
}

