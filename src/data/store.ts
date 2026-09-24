'use client';

import {
  AuditLog,
  Dealer,
  Employee,
  IntegrationEvent,
  Order,
  OrderItem,
  OrderStatus,
  Plumber,
  Product,
  RewardConfig,
  RewardTransaction,
  RewardVoucher,
  Role,
  User,
  WhatsAppMessage,
  AttendanceRecord,
  DailyAttendanceSummary,
  WeeklyAttendanceSummary,
  MonthlyAttendanceSummary,
  LeaveRequest,
  AppSettings
} from '@/types';
import { CATALOGUE_PRODUCTS } from './catalogueSeed';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_DEALERS,
  INITIAL_EMPLOYEES,
  INITIAL_INTEGRATION_EVENTS,
  INITIAL_ORDERS,
  INITIAL_PLUMBERS,
  INITIAL_REWARD_CONFIG,
  INITIAL_REWARD_LEDGER,
  INITIAL_REWARD_VOUCHERS,
  INITIAL_USERS,
  INITIAL_DAILY_ATTENDANCE,
  INITIAL_WEEKLY_ATTENDANCE,
  INITIAL_MONTHLY_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_SETTINGS,
  ALL_ADMIN_PAGES,
  ALL_EMPLOYEE_PAGES,
  ALL_DEALER_PAGES
} from './initialSeed';
import { calculateDistanceMeters, formatDistanceToFiltec } from '@/utils/distance';
import { useEffect, useState } from 'react';
import { sortProductsNaturally } from '@/lib/catalogueUtils';

const STORAGE_KEY = 'filtec_pretech1_state_v9';

export interface AppState {
  currentUser: User;
  products: Product[];
  dealers: Dealer[];
  employees: Employee[];
  plumbers: Plumber[];
  orders: Order[];
  rewardConfig: RewardConfig;
  rewardLedger: RewardTransaction[];
  rewardVouchers: RewardVoucher[];
  attendanceRecords: AttendanceRecord[];
  dailyAttendance: DailyAttendanceSummary[];
  weeklyAttendance: WeeklyAttendanceSummary[];
  monthlyAttendance: MonthlyAttendanceSummary[];
  leaveRequests: LeaveRequest[];
  settings: AppSettings;
  auditLogs: AuditLog[];
  integrationEvents: IntegrationEvent[];
  whatsappMessages: WhatsAppMessage[];
  // Active draft cart for field rep
  cart: {
    dealerId: string | null;
    items: OrderItem[];
    notes: string;
  };
}

const getInitialState = (): AppState => {
  return {
    currentUser: INITIAL_USERS[1], // Purna Chandra Nayak (Employee Demo) as initial default
    products: sortProductsNaturally(CATALOGUE_PRODUCTS),
    dealers: INITIAL_DEALERS,
    employees: INITIAL_EMPLOYEES,
    plumbers: INITIAL_PLUMBERS,
    orders: INITIAL_ORDERS,
    rewardConfig: INITIAL_REWARD_CONFIG,
    rewardLedger: INITIAL_REWARD_LEDGER,
    rewardVouchers: INITIAL_REWARD_VOUCHERS,
    attendanceRecords: [],
    dailyAttendance: INITIAL_DAILY_ATTENDANCE,
    weeklyAttendance: INITIAL_WEEKLY_ATTENDANCE,
    monthlyAttendance: INITIAL_MONTHLY_ATTENDANCE,
    leaveRequests: INITIAL_LEAVE_REQUESTS,
    settings: INITIAL_SETTINGS,
    auditLogs: INITIAL_AUDIT_LOGS,
    integrationEvents: INITIAL_INTEGRATION_EVENTS,
    whatsappMessages: [
      {
        id: 'wa-1',
        recipientPhone: '+91 94378 12345',
        recipientName: 'Kalinga Hardware Mart',
        templateName: 'order_confirmed',
        messageBody: 'FILTEC: Order #ORD-2026-1040 confirmed. Total: ₹32,172.70. Invoice: INV-FIL-2026-8821. Thank you!',
        sentAt: '2026-09-10T15:11:30Z',
        status: 'DELIVERED'
      }
    ],
    cart: {
      dealerId: null,
      items: [],
      notes: ''
    }
  };
};

type Listener = () => void;
let globalState: AppState = getInitialState();
const listeners = new Set<Listener>();

let hasInitializedFromStorage = false;
let inFlightSyncPromise: Promise<void> | null = null;
let lastSyncTimestamp = 0;

const notify = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
      const channel = new BroadcastChannel('filtec_channel');
      channel.postMessage({ type: 'STORE_UPDATED', state: globalState });
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }
  listeners.forEach((listener) => listener());
};

export const store = {
  getState(): AppState {
    return globalState;
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  initializeFromStorage(force = false) {
    if (typeof window === 'undefined') return;

    // Attach cross-tab synchronization listeners once
    if (!(window as any).__filtec_storage_listener_attached) {
      (window as any).__filtec_storage_listener_attached = true;

      const mergeExternalState = (parsed: any) => {
        if (!parsed) return;
        globalState = {
          ...globalState,
          orders: Array.isArray(parsed.orders) ? parsed.orders : globalState.orders,
          dealers: Array.isArray(parsed.dealers) ? parsed.dealers : globalState.dealers,
          plumbers: Array.isArray(parsed.plumbers) ? parsed.plumbers : globalState.plumbers,
          rewardLedger: Array.isArray(parsed.rewardLedger) ? parsed.rewardLedger : globalState.rewardLedger,
          rewardVouchers: Array.isArray(parsed.rewardVouchers) ? parsed.rewardVouchers : globalState.rewardVouchers,
          dailyAttendance: Array.isArray(parsed.dailyAttendance) ? parsed.dailyAttendance : globalState.dailyAttendance,
          employees: Array.isArray(parsed.employees) ? parsed.employees : globalState.employees,
          attendanceRecords: Array.isArray(parsed.attendanceRecords) ? parsed.attendanceRecords : globalState.attendanceRecords
        };
        listeners.forEach((l) => l());
      };

      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            mergeExternalState(parsed);
          } catch (err) {}
        }
      });

      window.addEventListener('filtec:attendance_updated', () => {
        listeners.forEach((l) => l());
      });

      try {
        const channel = new BroadcastChannel('filtec_channel');
        channel.onmessage = (msg) => {
          if (msg.data?.type === 'STORE_UPDATED' && msg.data?.state) {
            mergeExternalState(msg.data.state);
          }
        };
      } catch (err) {}
    }

    if (hasInitializedFromStorage && !force) return;
    try {
      hasInitializedFromStorage = true;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Ensure Samir is in employees list as ADMIN
        let existingEmployees: Employee[] = parsed.employees || [];
        const hasSamir = existingEmployees.some(
          (e) => e.name.toLowerCase() === 'samir' || e.id === 'emp-admin-samir'
        );

        if (!hasSamir) {
          const samirSeed = INITIAL_EMPLOYEES.find((e) => e.name === 'Samir');
          if (samirSeed) {
            existingEmployees = [samirSeed, ...existingEmployees];
          }
        }

        // Normalize phone numbers to include +91 prefix
        const normalizePhone = (p: string | undefined | null) => {
          if (!p || p === '-' || p === '(-)') return p || '(-)';
          const clean = p.replace(/^\+91[\s-]*/, '').replace(/^91(?=\d{10})/, '').replace(/\s+/g, '').trim();
          return clean ? `+91 ${clean}` : p;
        };

        // Migrate all employees to have systemRole, allowedPages, and +91 phone prefix
        existingEmployees = existingEmployees.map((e) => {
          const isSamir = e.name.toLowerCase() === 'samir' || e.code === 'FPPL/ADM-001' || e.id === 'emp-admin-samir';
          const systemRole: Role = e.systemRole || (isSamir ? 'ADMIN' : 'EMPLOYEE');
          const phone = isSamir ? '+91 9437505814' : normalizePhone(e.phone);
          const allowedPages =
            e.allowedPages && e.allowedPages.length > 0
              ? e.allowedPages
              : systemRole === 'ADMIN'
              ? ALL_ADMIN_PAGES
              : ALL_EMPLOYEE_PAGES;

          const seedMatch = INITIAL_EMPLOYEES.find((s) => s.id === e.id || s.code === e.code);
          const baseSalary = typeof e.baseSalary === 'number' && e.baseSalary > 0
            ? e.baseSalary
            : (seedMatch?.baseSalary || (systemRole === 'ADMIN' ? 55000 : 30000));

          return {
            ...e,
            phone,
            systemRole,
            allowedPages,
            baseSalary
          };
        });

        // Ensure current user is valid and has corrected phone
        let currentUser: User = parsed.currentUser || INITIAL_USERS[0];
        const isSamirUser = currentUser.name?.toLowerCase() === 'samir' || currentUser.id === 'user-admin-samir';
        currentUser = {
          ...currentUser,
          phone: isSamirUser ? '+91 9437505814' : normalizePhone(currentUser.phone),
          allowedPages: currentUser.role === 'ADMIN' && !currentUser.allowedPages ? ALL_ADMIN_PAGES : currentUser.allowedPages
        };

        const rawDealers: Dealer[] = Array.isArray(parsed.dealers) && parsed.dealers.length > 0
          ? parsed.dealers
          : INITIAL_DEALERS;

        const normalizedDealers = rawDealers.map((d: Dealer) => ({
          ...d,
          phone: normalizePhone(d.phone),
          creditLimit: 0,
          outstandingBalance: 0
        }));

        for (const initD of INITIAL_DEALERS) {
          if (!normalizedDealers.some((x: Dealer) => x.id === initD.id || x.code === initD.code)) {
            normalizedDealers.push(initD);
          }
        }

        const rawPlumbers: Plumber[] = Array.isArray(parsed.plumbers) && parsed.plumbers.length > 0
          ? parsed.plumbers
          : INITIAL_PLUMBERS;
        const normalizedPlumbers = [...rawPlumbers];
        for (const initP of INITIAL_PLUMBERS) {
          if (!normalizedPlumbers.some((p) => p.id === initP.id)) {
            normalizedPlumbers.push(initP);
          }
        }

        const cleanDailyAttendance: DailyAttendanceSummary[] = Array.isArray(parsed.dailyAttendance)
          ? parsed.dailyAttendance.filter((d: DailyAttendanceSummary) => {
              const isMock = d.id === 'att-sum-1' || d.id === 'att-sum-2' || d.id === 'att-sum-3' || d.id === 'att-sum-4' || d.id === 'att-sum-5' || d.date === '2026-09-11';
              return !isMock;
            })
          : [];

        const cleanAttendanceRecords = Array.isArray(parsed.attendanceRecords)
          ? parsed.attendanceRecords.filter((r: any) => {
              const isMock = r.id === 'att-1' || r.id === 'att-2' || r.id === 'att-3' || r.id === 'att-4' || r.id === 'att-5' || (r.timestamp && r.timestamp.startsWith('2026-09-11'));
              return !isMock;
            })
          : [];

        globalState = {
          ...getInitialState(),
          ...parsed,
          currentUser,
          dealers: normalizedDealers,
          employees: existingEmployees,
          plumbers: normalizedPlumbers,
          products: CATALOGUE_PRODUCTS,
          dailyAttendance: cleanDailyAttendance,
          attendanceRecords: cleanAttendanceRecords,
          settings: {
            ...INITIAL_SETTINGS,
            ...(parsed.settings || {}),
            company: {
              ...INITIAL_SETTINGS.company,
              ...((parsed.settings && parsed.settings.company) || {}),
              supportWhatsApp: '+91 9437505814',
              phone: '+91 9437505814'
            },
            permissions: {
              ...INITIAL_SETTINGS.permissions,
              ...((parsed.settings && parsed.settings.permissions) || {}),
              pageAccess: {
                adminPages: ALL_ADMIN_PAGES,
                employeePages: ALL_EMPLOYEE_PAGES,
                dealerPages: ALL_DEALER_PAGES,
                ...((parsed.settings && parsed.settings.permissions && parsed.settings.permissions.pageAccess) || {})
              }
            }
          }
        };
        listeners.forEach((listener) => listener());
      }
    } catch (e) {
      console.warn('Failed to parse local storage', e);
    }
  },

  async syncWithDatabase(force = false): Promise<void> {
    if (typeof window === 'undefined') return;
    if (inFlightSyncPromise) return inFlightSyncPromise;
    if (!force && Date.now() - lastSyncTimestamp < 30000) return;

    inFlightSyncPromise = (async () => {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            const syncedProducts: Product[] = sortProductsNaturally<Product>(
              (d.products?.length ? d.products : globalState.products).map((p: any) => {
                const seed = CATALOGUE_PRODUCTS.find(
                  (c) => c.code === p.code || c.id === p.id || c.code.replace(/\D/g, '') === (p.code || '').replace(/\D/g, '')
                );
                return {
                  ...p,
                  imageUrl: p.imageUrl || seed?.imageUrl || null
                } as Product;
              })
            );

            globalState = {
              ...globalState,
              products: syncedProducts,
              dealers: Array.isArray(d.dealers) && d.dealers.length > 0
                ? (() => {
                    const normalized = d.dealers.map((dlr: Dealer) => {
                      const p = (dlr.phone || '').trim();
                      const clean = p.replace(/^\+91[\s-]*/, '').replace(/^91(?=\d{10})/, '').trim();
                      return {
                        ...dlr,
                        phone: clean && clean !== '-' ? `+91 ${clean}` : (dlr.phone || '-')
                      };
                    });
                    for (const initD of INITIAL_DEALERS) {
                      if (!normalized.some((x: Dealer) => x.id === initD.id || x.code === initD.code)) {
                        normalized.push(initD);
                      }
                    }
                    return normalized;
                  })()
                : globalState.dealers,
              employees: d.employees?.length
                ? d.employees.map((emp: Employee) => {
                    const isSamir = emp.name.toLowerCase() === 'samir' || emp.code === 'FPPL/ADM-001';
                    const p = (emp.phone || '').trim();
                    const clean = p.replace(/^\+91[\s-]*/, '').replace(/^91(?=\d{10})/, '').replace(/\s+/g, '').trim();
                    return {
                      ...emp,
                      phone: isSamir ? '+91 9437505814' : (clean && clean !== '-' && clean !== '(-)' ? `+91 ${clean}` : emp.phone),
                      checkInStatus: emp.checkInStatus || 'CHECKED_OUT',
                      lastCheckInTime: emp.lastCheckInTime || null,
                      lastLocation: emp.lastLocation || null,
                      baseSalary: emp.baseSalary || 30000
                    };
                  })
                : globalState.employees,
              plumbers: (() => {
                const fetched = Array.isArray(d.plumbers) ? d.plumbers : [];
                const merged = [...fetched];
                for (const initP of INITIAL_PLUMBERS) {
                  if (!merged.some((p: Plumber) => p.id === initP.id)) {
                    merged.push(initP);
                  }
                }
                for (const curP of globalState.plumbers) {
                  if (!merged.some((p: Plumber) => p.id === curP.id)) {
                    merged.push(curP);
                  }
                }
                return merged;
              })(),
              orders: Array.isArray(d.orders) ? d.orders : [],
              leaveRequests: d.leaveRequests?.length ? d.leaveRequests : globalState.leaveRequests,
              dailyAttendance: Array.isArray(d.dailyAttendance) ? d.dailyAttendance : [],
              attendanceRecords: Array.isArray(d.attendanceRecords) ? d.attendanceRecords : [],
              rewardLedger: Array.isArray(d.rewardLedger) ? d.rewardLedger : [],
              auditLogs: Array.isArray(d.auditLogs) ? d.auditLogs : [],
              integrationEvents: Array.isArray(d.integrationEvents) ? d.integrationEvents : [],
              settings: d.settings?.company
                ? {
                    company: {
                      ...globalState.settings.company,
                      ...d.settings.company,
                      supportWhatsApp: '+91 9437505814',
                      phone: '+91 9437505814'
                    },
                    permissions: d.settings.permissions || globalState.settings.permissions,
                    policy: d.settings.policy || globalState.settings.policy,
                    notifications: d.settings.notifications || globalState.settings.notifications
                  }
                : globalState.settings,
              rewardConfig: d.settings?.rewardConfig || globalState.rewardConfig
            };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
            } catch (e) {}
            notify();
          }
        }
      } catch (e) {
        console.warn('Database sync fallback to local cache:', e);
      } finally {
        inFlightSyncPromise = null;
        lastSyncTimestamp = Date.now();
      }
    })();

    return inFlightSyncPromise;
  },

  resetDemoData() {
    globalState = getInitialState();
    hasInitializedFromStorage = false;
    lastSyncTimestamp = 0;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('filtec_pretech1_state_v3');
    }
    notify();
  },

  // Set authenticated user directly
  setUser(user: User) {
    globalState = {
      ...globalState,
      currentUser: user
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
      } catch (e) {}
    }
    notify();
  },

  // Switch demo user
  switchUser(role: Role, dealerId?: string, userNameOrId?: string) {
    let user: User | undefined;
    if (userNameOrId) {
      user = INITIAL_USERS.find(
        (u) => u.id === userNameOrId || u.name.toLowerCase() === userNameOrId.toLowerCase()
      );
    }
    if (!user) {
      user = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    }
    globalState = {
      ...globalState,
      currentUser: dealerId ? { ...user, dealerId } : user
    };
    notify();
  },

  // Cart operations
  setCartDealer(dealerId: string) {
    globalState = {
      ...globalState,
      cart: { ...globalState.cart, dealerId }
    };
    notify();
  },

  setCartNotes(notes: string) {
    globalState = {
      ...globalState,
      cart: { ...globalState.cart, notes }
    };
    notify();
  },

  addToCart(item: OrderItem) {
    const existingIndex = globalState.cart.items.findIndex(
      (i) => i.productId === item.productId && i.variantId === item.variantId
    );
    let updatedItems = [...globalState.cart.items];
    if (existingIndex >= 0) {
      const existing = updatedItems[existingIndex];
      const newQty = existing.quantity + item.quantity;
      updatedItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalAmount: Number((newQty * existing.unitPrice).toFixed(2))
      };
    } else {
      updatedItems.push(item);
    }
    globalState = {
      ...globalState,
      cart: { ...globalState.cart, items: updatedItems }
    };
    notify();
  },

  removeFromCart(itemId: string) {
    globalState = {
      ...globalState,
      cart: {
        ...globalState.cart,
        items: globalState.cart.items.filter((i) => i.id !== itemId)
      }
    };
    notify();
  },

  updateCartItemQty(itemId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }
    const updatedItems = globalState.cart.items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          totalAmount: Number((quantity * item.unitPrice).toFixed(2))
        };
      }
      return item;
    });
    globalState = {
      ...globalState,
      cart: { ...globalState.cart, items: updatedItems }
    };
    notify();
  },

  clearCart() {
    globalState = {
      ...globalState,
      cart: { ...globalState.cart, items: [], notes: '' }
    };
    notify();
  },

  // Submit order from cart
  submitCurrentOrder(): Order | null {
    const { cart, currentUser, dealers, rewardConfig } = globalState;
    if (!cart.dealerId || cart.items.length === 0) return null;

    const dealer = dealers.find((d) => d.id === cart.dealerId);
    if (!dealer) return null;

    const discountPercent = globalState.settings.company.defaultDiscountPercent ?? 48;
    const grossTotal = cart.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice || i.totalAmount), 0);
    const discountAmount = Number(((grossTotal * discountPercent) / 100).toFixed(2));
    const subtotal = Number((grossTotal - discountAmount).toFixed(2));
    const gstPercent = globalState.settings.company.defaultGstPercent || 18;
    const gstAmount = Number((subtotal * (gstPercent / 100)).toFixed(2));
    const totalAmount = Math.round(subtotal + gstAmount);

    // Calculate reward based on total order value (1% rule: 75% dealer, 25% plumber)
    const totalReward = Number(((totalAmount * rewardConfig.ratePercent) / 100).toFixed(2));
    const dealerReward = Number(((totalReward * rewardConfig.dealerSharePercent) / 100).toFixed(2));
    const plumberReward = Number(((totalReward * rewardConfig.plumberSharePercent) / 100).toFixed(2));

    const orderNumber = `ORD-2026-${1040 + globalState.orders.length + 1}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      employeeId: currentUser.employeeCode || 'FPPL/OD-002',
      employeeName: currentUser.name,
      dealerId: dealer.id,
      dealerName: dealer.name,
      dealerPhone: dealer.phone,
      dealerCity: dealer.city,
      items: [...cart.items],
      subtotal,
      gstAmount,
      totalAmount,
      status: 'SUBMITTED',
      notes: cart.notes,
      rewardEstimated: totalReward,
      rewardDealerShare: dealerReward,
      rewardPlumberShare: plumberReward,
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString()
    };

    const newAuditLog: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: 'ORDER_SUBMITTED',
      entityType: 'ORDER',
      entityId: newOrder.id,
      details: `Field rep ${currentUser.name} submitted order ${orderNumber} for ${dealer.name} (${newOrder.items.length} items, ₹${totalAmount})`,
      timestamp: new Date().toISOString()
    };

    // Simulated WhatsApp alert
    const waMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      recipientPhone: dealer.phone,
      recipientName: dealer.name,
      templateName: 'order_submitted',
      messageBody: `FILTEC Polyplast: Order ${orderNumber} of ₹${totalAmount.toLocaleString('en-IN')} has been created by ${currentUser.name}.`,
      sentAt: new Date().toISOString(),
      status: 'SENT'
    };

    globalState = {
      ...globalState,
      orders: [newOrder, ...globalState.orders],
      auditLogs: [newAuditLog, ...globalState.auditLogs],
      whatsappMessages: [waMsg, ...globalState.whatsappMessages],
      cart: { ...cart, items: [], notes: '' }
    };
    notify();

    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_ORDER', payload: newOrder })
      }).catch((err) => console.warn('PostgreSQL create order failed:', err));
    }

    return newOrder;
  },

  // Release order with invoice details and automatic 1% reward calculation
  releaseOrder(
    orderId: string,
    invoiceData?: {
      invoiceNumber?: string;
      invoiceDate?: string;
      invoiceValue?: number;
      plumberId?: string;
    }
  ) {
    const orderIndex = globalState.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return;

    const existingOrder = globalState.orders[orderIndex];
    const timestamp = new Date().toISOString();

    const invNum = invoiceData?.invoiceNumber || existingOrder.invoiceNumber || `INV-FIL-${new Date().getFullYear()}-${8800 + globalState.orders.length}`;
    const invDate = invoiceData?.invoiceDate || existingOrder.invoiceDate || new Date().toISOString().split('T')[0];
    const invVal = typeof invoiceData?.invoiceValue === 'number' && invoiceData.invoiceValue > 0 
      ? invoiceData.invoiceValue 
      : existingOrder.totalAmount;

    // Automatically calculate 1% reward based on the invoice value only
    const ratePercent = globalState.rewardConfig.ratePercent || 1;
    const totalReward = Number(((invVal * ratePercent) / 100).toFixed(2));
    const dealerSharePercent = globalState.rewardConfig.dealerSharePercent ?? 75;
    const plumberSharePercent = globalState.rewardConfig.plumberSharePercent ?? 25;
    const dealerReward = Number(((totalReward * dealerSharePercent) / 100).toFixed(2));
    const plumberReward = Number(((totalReward * plumberSharePercent) / 100).toFixed(2));

    const updatedOrder: Order = {
      ...existingOrder,
      status: 'COMPLETED',
      confirmedAt: timestamp,
      invoicedAt: invDate,
      invoiceNumber: invNum,
      invoiceDate: invDate,
      invoiceValue: invVal,
      rewardEstimated: totalReward,
      rewardDealerShare: dealerReward,
      rewardPlumberShare: plumberReward,
    };

    const updatedOrders = [...globalState.orders];
    updatedOrders[orderIndex] = updatedOrder;

    // Check if dealer has registered active plumbers
    const dealerPlumbers = globalState.plumbers.filter(
      (p) => (p.dealerId === existingOrder.dealerId || p.dealerName === existingOrder.dealerName) && p.status === 'ACTIVE'
    );
    const hasPlumbers = dealerPlumbers.length > 0;

    let selectedPlumber: Plumber | undefined;
    if (invoiceData?.plumberId) {
      selectedPlumber = globalState.plumbers.find((p) => p.id === invoiceData.plumberId);
    } else if (hasPlumbers) {
      selectedPlumber = dealerPlumbers[0];
    }

    // Update dealer total purchases, available rewards, and plumber escrow
    // BUSINESS RULE: If a dealer does NOT have a plumber, the plumber reward stays in escrow
    // and NEVER goes to the dealer until a new plumber is onboarded.
    const updatedDealers = globalState.dealers.map((d) => {
      if (d.id === existingOrder.dealerId || d.code === existingOrder.dealerId || d.name === existingOrder.dealerName) {
        const currentEscrow = d.pendingPlumberRewards || 0;
        return {
          ...d,
          totalPurchases: Number((d.totalPurchases + invVal).toFixed(2)),
          availableRewards: Number((d.availableRewards + dealerReward).toFixed(2)),
          pendingPlumberRewards: Number((currentEscrow + (!hasPlumbers ? plumberReward : 0)).toFixed(2))
        };
      }
      return d;
    });

    const updatedPlumbers = globalState.plumbers.map((p) => {
      if (selectedPlumber && p.id === selectedPlumber.id) {
        return {
          ...p,
          totalAllocatedRewards: Number((p.totalAllocatedRewards + plumberReward).toFixed(2)),
          rewardHistoryCount: p.rewardHistoryCount + 1
        };
      }
      return p;
    });

    // Reward transactions
    const newRewardTxns: RewardTransaction[] = [];

    // 1. Dealer reward transaction (Strictly dealer's share)
    if (dealerReward > 0) {
      const dealerBal = (updatedDealers.find((d) => d.id === existingOrder.dealerId || d.code === existingOrder.dealerId || d.name === existingOrder.dealerName)?.availableRewards || 0);
      newRewardTxns.push({
        id: `rew-${Date.now()}-dlr`,
        dealerId: existingOrder.dealerId,
        orderId: existingOrder.id,
        orderNumber: existingOrder.orderNumber,
        type: 'CREDIT_ORDER',
        amount: dealerReward,
        balanceAfter: dealerBal,
        description: `1% Reward from Order ${existingOrder.orderNumber} (Invoice #${invNum} • ₹${invVal.toLocaleString('en-IN')} • Dealer ${dealerSharePercent}%)`,
        createdAt: timestamp
      });
    }

    // 2. Plumber reward transaction (Either to registered plumber or held in escrow)
    if (plumberReward > 0) {
      if (hasPlumbers && selectedPlumber) {
        newRewardTxns.push({
          id: `rew-${Date.now()}-plm`,
          dealerId: existingOrder.dealerId,
          orderId: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          plumberId: selectedPlumber.id,
          plumberName: selectedPlumber.name,
          type: 'PLUMBER_REWARD',
          amount: plumberReward,
          balanceAfter: Number((selectedPlumber.totalAllocatedRewards + plumberReward).toFixed(2)),
          description: `1% Reward from Order ${existingOrder.orderNumber} (Invoice #${invNum} • Plumber ${plumberSharePercent}% • ${selectedPlumber.name})`,
          createdAt: timestamp
        });
      } else {
        // Dealer has NO plumbers: reward stays in escrow and NEVER goes to the dealer!
        const escrowBal = updatedDealers.find((d) => d.id === existingOrder.dealerId || d.code === existingOrder.dealerId || d.name === existingOrder.dealerName)?.pendingPlumberRewards || plumberReward;
        newRewardTxns.push({
          id: `rew-${Date.now()}-plm-esc`,
          dealerId: existingOrder.dealerId,
          orderId: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          type: 'PLUMBER_REWARD_ESCROW',
          amount: plumberReward,
          balanceAfter: escrowBal,
          description: `Plumber Reward (${plumberSharePercent}%) held in escrow — dealer has no registered plumbers. Stays in pool until a new plumber is onboarded. (Invoice #${invNum})`,
          createdAt: timestamp
        });
      }
    }

    // Create audit log
    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: 'ADMIN',
      action: 'ORDER_APPROVED',
      entityType: 'ORDER',
      entityId: existingOrder.id,
      details: `Order ${existingOrder.orderNumber} released. Invoice #${invNum} (₹${invVal.toLocaleString('en-IN')}) with 1% reward: Dealer ₹${dealerReward}, Plumber ₹${plumberReward}.`,
      timestamp
    };

    globalState = {
      ...globalState,
      orders: updatedOrders,
      dealers: updatedDealers,
      plumbers: updatedPlumbers,
      rewardLedger: [...newRewardTxns, ...globalState.rewardLedger],
      auditLogs: [audit, ...globalState.auditLogs]
    };
    notify();

    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RELEASE_ORDER',
          payload: {
            orderId: existingOrder.id,
            invoiceNumber: invNum,
            invoiceDate: invDate,
            invoiceValue: invVal,
            dealerReward,
            plumberReward,
            plumberId: selectedPlumber?.id,
            dealerId: existingOrder.dealerId
          }
        })
      })
        .then(() => {
          this.syncWithDatabase(true);
        })
        .catch((err) => console.warn('PostgreSQL release order failed:', err));
    }
  },

  // Admin approves order
  approveOrder(orderId: string, adminNotes?: string) {
    const orderIndex = globalState.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return;

    const existingOrder = globalState.orders[orderIndex];
    const timestamp = new Date().toISOString();
    const invoiceNumber = `INV-FIL-2026-${8820 + globalState.orders.length}`;

    const updatedOrder: Order = {
      ...existingOrder,
      status: 'CONFIRMED',
      approvedAt: timestamp,
      erpSyncAt: timestamp,
      confirmedAt: timestamp,
      invoicedAt: timestamp,
      invoiceNumber,
      adminNotes
    };

    const dealerPlumbers = globalState.plumbers.filter((p) => p.dealerId === existingOrder.dealerId && p.status === 'ACTIVE');
    const hasPlumbers = dealerPlumbers.length > 0;
    const plumberReward = existingOrder.rewardPlumberShare || 0;

    // Update dealer purchases, available rewards, and plumber escrow
    const updatedDealers = globalState.dealers.map((d) => {
      if (d.id === existingOrder.dealerId) {
        const currentEscrow = d.pendingPlumberRewards || 0;
        return {
          ...d,
          totalPurchases: d.totalPurchases + existingOrder.subtotal,
          availableRewards: d.availableRewards + existingOrder.rewardDealerShare,
          pendingPlumberRewards: Number((currentEscrow + (!hasPlumbers ? plumberReward : 0)).toFixed(2))
        };
      }
      return d;
    });

    const updatedPlumbers = globalState.plumbers.map((p) => {
      if (hasPlumbers && p.id === dealerPlumbers[0].id && plumberReward > 0) {
        return {
          ...p,
          totalAllocatedRewards: Number((p.totalAllocatedRewards + plumberReward).toFixed(2)),
          rewardHistoryCount: p.rewardHistoryCount + 1
        };
      }
      return p;
    });

    // Create dealer reward ledger entry
    const rewardTx: RewardTransaction = {
      id: `rew-${Date.now()}-dlr`,
      dealerId: existingOrder.dealerId,
      orderId: existingOrder.id,
      orderNumber: existingOrder.orderNumber,
      type: 'CREDIT_ORDER',
      amount: existingOrder.rewardDealerShare,
      balanceAfter:
        (updatedDealers.find((d) => d.id === existingOrder.dealerId)?.availableRewards || 0),
      description: `${globalState.rewardConfig.ratePercent}% Reward from Order ${existingOrder.orderNumber} (Dealer 75% Share)`,
      createdAt: timestamp
    };

    const newTxns: RewardTransaction[] = [rewardTx];

    // Plumber reward entry
    if (plumberReward > 0) {
      if (hasPlumbers) {
        newTxns.push({
          id: `rew-${Date.now()}-plm`,
          dealerId: existingOrder.dealerId,
          orderId: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          plumberId: dealerPlumbers[0].id,
          plumberName: dealerPlumbers[0].name,
          type: 'PLUMBER_REWARD',
          amount: plumberReward,
          balanceAfter: Number((dealerPlumbers[0].totalAllocatedRewards + plumberReward).toFixed(2)),
          description: `Plumber Reward from Order ${existingOrder.orderNumber} (Plumber 25% Share • ${dealerPlumbers[0].name})`,
          createdAt: timestamp
        });
      } else {
        const escrowBal = updatedDealers.find((d) => d.id === existingOrder.dealerId)?.pendingPlumberRewards || plumberReward;
        newTxns.push({
          id: `rew-${Date.now()}-plm-esc`,
          dealerId: existingOrder.dealerId,
          orderId: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          type: 'PLUMBER_REWARD_ESCROW',
          amount: plumberReward,
          balanceAfter: escrowBal,
          description: `Plumber Reward held in escrow — dealer has no registered plumbers. Stays in pool until plumber is onboarded.`,
          createdAt: timestamp
        });
      }
    }

    // Create audit log
    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: 'ADMIN',
      action: 'ORDER_APPROVED',
      entityType: 'ORDER',
      entityId: existingOrder.id,
      details: `Admin ${globalState.currentUser.name} approved order ${existingOrder.orderNumber}. Synced to ERP as ${invoiceNumber}.`,
      timestamp
    };

    // ERP integration event
    const erpEvent: IntegrationEvent = {
      id: `int-${Date.now()}`,
      type: 'ERP_SYNC',
      title: 'ERP Invoice Generated',
      targetId: existingOrder.orderNumber,
      status: 'SUCCESS',
      payloadSummary: `ERP Synced ${existingOrder.orderNumber} -> ${invoiceNumber} (Latency: 118ms)`,
      timestamp,
      latencyMs: 118
    };

    // WhatsApp notification
    const waMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      recipientPhone: existingOrder.dealerPhone,
      recipientName: existingOrder.dealerName,
      templateName: 'order_approved',
      messageBody: `FILTEC Polyplast: Great news! Order ${existingOrder.orderNumber} has been APPROVED and confirmed. Invoice #${invoiceNumber} generated. ₹${existingOrder.rewardDealerShare} reward points credited to your ledger.`,
      sentAt: timestamp,
      status: 'DELIVERED'
    };

    const updatedOrders = [...globalState.orders];
    updatedOrders[orderIndex] = updatedOrder;

    globalState = {
      ...globalState,
      orders: updatedOrders,
      dealers: updatedDealers,
      plumbers: updatedPlumbers,
      rewardLedger: [...newTxns, ...globalState.rewardLedger],
      auditLogs: [audit, ...globalState.auditLogs],
      integrationEvents: [erpEvent, ...globalState.integrationEvents],
      whatsappMessages: [waMsg, ...globalState.whatsappMessages]
    };
    notify();

    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE_ORDER',
          payload: {
            orderId: existingOrder.id,
            adminNotes,
            invoiceNumber,
            approvedAt: timestamp,
            confirmedAt: timestamp,
            dealerId: existingOrder.dealerId,
            rewardDealerShare: existingOrder.rewardDealerShare,
            subtotal: existingOrder.subtotal
          }
        })
      }).catch((err) => console.warn('PostgreSQL approve order failed:', err));
    }
  },

  // Admin rejects order
  rejectOrder(orderId: string, reason: string) {
    const orderIndex = globalState.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return;

    const existingOrder = globalState.orders[orderIndex];
    const timestamp = new Date().toISOString();

    const updatedOrder: Order = {
      ...existingOrder,
      status: 'REJECTED',
      rejectionReason: reason
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: 'ADMIN',
      action: 'ORDER_REJECTED',
      entityType: 'ORDER',
      entityId: existingOrder.id,
      details: `Admin rejected order ${existingOrder.orderNumber}. Reason: ${reason}`,
      timestamp
    };

    const waMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      recipientPhone: existingOrder.dealerPhone,
      recipientName: existingOrder.dealerName,
      templateName: 'order_rejected',
      messageBody: `FILTEC: Order ${existingOrder.orderNumber} could not be approved. Reason: ${reason}. Please contact your sales representative.`,
      sentAt: timestamp,
      status: 'DELIVERED'
    };

    const updatedOrders = [...globalState.orders];
    updatedOrders[orderIndex] = updatedOrder;

    globalState = {
      ...globalState,
      orders: updatedOrders,
      auditLogs: [audit, ...globalState.auditLogs],
      whatsappMessages: [waMsg, ...globalState.whatsappMessages]
    };
    notify();

    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT_ORDER',
          payload: {
            orderId: existingOrder.id,
            rejectionReason: reason
          }
        })
      }).catch((err) => console.warn('PostgreSQL reject order failed:', err));
    }
  },

  // Dealer allocates reward to plumber (Generates Plumber Voucher P-001, P-002...)
  allocateRewardToPlumber(
    dealerId: string,
    plumberOrId: string | Plumber,
    points: number,
    source: 'PLUMBER_POOL' | 'DEALER_ACCOUNT' | 'ESCROW' = 'PLUMBER_POOL'
  ): RewardVoucher | null {
    // Robust plumber lookup
    let plumber: Plumber | undefined;
    if (plumberOrId && typeof plumberOrId === 'object') {
      plumber = plumberOrId;
    } else if (typeof plumberOrId === 'string') {
      plumber = globalState.plumbers.find((p) => p.id === plumberOrId)
        || globalState.plumbers.find((p) => p.name?.toLowerCase() === plumberOrId?.toLowerCase())
        || INITIAL_PLUMBERS.find((p) => p.id === plumberOrId || p.name?.toLowerCase() === plumberOrId?.toLowerCase());
    }

    if (!plumber && globalState.plumbers.length > 0) {
      plumber = globalState.plumbers[0];
    }
    if (!plumber && INITIAL_PLUMBERS.length > 0) {
      plumber = INITIAL_PLUMBERS[0];
    }
    if (!plumber) {
      console.error('allocateRewardToPlumber: Plumber not found', plumberOrId);
      return null;
    }

    // Ensure plumber exists in globalState.plumbers
    if (!globalState.plumbers.some((p) => p.id === plumber!.id)) {
      globalState.plumbers = [plumber, ...globalState.plumbers];
    }

    // Robust dealer lookup: by id, code, name, plumber's dealerId, or fallback
    const dealer = globalState.dealers.find((d) => d.id === dealerId || d.code === dealerId || d.name?.toLowerCase() === dealerId?.toLowerCase())
      || globalState.dealers.find((d) => d.id === plumber?.dealerId || d.name === plumber?.dealerName)
      || INITIAL_DEALERS.find((d) => d.id === dealerId || d.code === dealerId || d.id === plumber?.dealerId)
      || globalState.dealers.find((d) => d.id === 'dlr-012')
      || INITIAL_DEALERS.find((d) => d.id === 'dlr-012')
      || globalState.dealers[0]
      || INITIAL_DEALERS[0];

    if (!dealer || points <= 0) {
      console.error('allocateRewardToPlumber: Dealer not found or invalid points', { dealerId, points });
      return null;
    }

    if (!globalState.dealers.some((d) => d.id === dealer.id)) {
      globalState.dealers = [dealer, ...globalState.dealers];
    }

    // Calculate plumber's existing vouchers safely
    const issuedTotal = (globalState.rewardVouchers || [])
      .filter((v) => v.plumberId === plumber.id && v.type === 'PLUMBER')
      .reduce((s, v) => s + (v.amount || 0), 0);
    const plumberAvailable = Math.max(0, Number((plumber.totalAllocatedRewards - issuedTotal).toFixed(2)));

    // Verify balance availability depending on source (with auto-fallback if source has insufficient)
    if (source === 'DEALER_ACCOUNT' && dealer.availableRewards < points) {
      if (plumberAvailable >= points) {
        source = 'PLUMBER_POOL';
      } else {
        return null;
      }
    }
    if (source === 'ESCROW' && (dealer.pendingPlumberRewards || 0) < points) {
      if (plumberAvailable >= points) {
        source = 'PLUMBER_POOL';
      } else {
        return null;
      }
    }
    if (source === 'PLUMBER_POOL' && plumberAvailable < points) {
      if (dealer.availableRewards >= points) {
        source = 'DEALER_ACCOUNT';
      } else if ((dealer.pendingPlumberRewards || 0) >= points) {
        source = 'ESCROW';
      } else if (plumberAvailable <= 0) {
        return null;
      }
    }

    const timestamp = new Date().toISOString();
    const seqP = (globalState.rewardVouchers || []).filter((v) => v.type === 'PLUMBER').length + 1;
    const voucherNumber = `P-${String(seqP).padStart(3, '0')}`;
    const now = new Date();
    const dateRedeemed = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const voucher: RewardVoucher = {
      id: `vouch-p-${Date.now()}`,
      voucherNumber,
      type: 'PLUMBER',
      dealerId: dealer.id,
      dealerName: dealer.name,
      dealerCode: dealer.code,
      plumberId: plumber.id,
      plumberName: plumber.name,
      plumberPhone: plumber.phone,
      points,
      amount: points,
      status: 'ISSUED',
      dateRedeemed,
      createdAt: timestamp,
      contactNumber: '+91 94378 60479',
      instructions: `Present coupon ${voucherNumber} or contact FILTEC Head Office (+91 94378 60479) / your dealer to redeem.`
    };

    let updatedDealers = globalState.dealers;
    let updatedPlumbers = globalState.plumbers;
    let tx: RewardTransaction;

    if (source === 'DEALER_ACCOUNT') {
      const updatedBalance = Number((dealer.availableRewards - points).toFixed(2));
      updatedDealers = globalState.dealers.map((d) =>
        d.id === dealer.id ? { ...d, availableRewards: updatedBalance } : d
      );
      updatedPlumbers = globalState.plumbers.map((p) =>
        p.id === plumber.id
          ? {
              ...p,
              totalAllocatedRewards: Number((p.totalAllocatedRewards + points).toFixed(2)),
              rewardHistoryCount: p.rewardHistoryCount + 1
            }
          : p
      );
      tx = {
        id: `rew-${Date.now()}`,
        dealerId: dealer.id,
        plumberId: plumber.id,
        plumberName: plumber.name,
        type: 'DEBIT_PLUMBER_ALLOCATION',
        amount: -points,
        balanceAfter: updatedBalance,
        voucherNumber,
        description: `Reward points transfer from Dealer Account to Plumber ${plumber.name} (Voucher ${voucherNumber})`,
        createdAt: timestamp
      };
    } else if (source === 'ESCROW') {
      const updatedEscrow = Math.max(0, Number(((dealer.pendingPlumberRewards || 0) - points).toFixed(2)));
      updatedDealers = globalState.dealers.map((d) =>
        d.id === dealer.id ? { ...d, pendingPlumberRewards: updatedEscrow } : d
      );
      updatedPlumbers = globalState.plumbers.map((p) =>
        p.id === plumber.id
          ? {
              ...p,
              totalAllocatedRewards: Number((p.totalAllocatedRewards + points).toFixed(2)),
              rewardHistoryCount: p.rewardHistoryCount + 1
            }
          : p
      );
      tx = {
        id: `rew-${Date.now()}`,
        dealerId: dealer.id,
        plumberId: plumber.id,
        plumberName: plumber.name,
        type: 'ESCROW_RELEASE',
        amount: points,
        balanceAfter: updatedEscrow,
        voucherNumber,
        description: `Released ₹${points} from Escrow to Plumber ${plumber.name} (Voucher ${voucherNumber})`,
        createdAt: timestamp
      };
    } else {
      // PLUMBER_POOL: Issued directly from plumber's earned 25% order reward share
      const remainingPlumberBalance = Math.max(0, Number((plumberAvailable - points).toFixed(2)));
      tx = {
        id: `rew-${Date.now()}`,
        dealerId: dealer.id,
        plumberId: plumber.id,
        plumberName: plumber.name,
        type: 'PLUMBER_REDEEM_VOUCHER',
        amount: -points,
        balanceAfter: remainingPlumberBalance,
        voucherNumber,
        description: `Issued Plumber Reward Coupon ${voucherNumber} for ₹${points} to ${plumber.name}`,
        createdAt: timestamp
      };
    }

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: dealer.id,
      userName: dealer.name,
      role: 'DEALER',
      action: 'PLUMBER_REWARD_ALLOCATED',
      entityType: 'REWARD',
      entityId: tx.id,
      details: `Dealer ${dealer.name} issued Plumber Coupon ${voucherNumber} (₹${points}) to ${plumber.name} via ${source}`,
      timestamp
    };

    const waMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      recipientPhone: plumber.phone,
      recipientName: plumber.name,
      templateName: 'plumber_reward_received',
      messageBody: `FILTEC Plumber Reward Voucher: ${voucherNumber}\nBeneficiary: ${plumber.name}\nValue: ₹${points}\nIssued by: ${dealer.name}\nDate: ${dateRedeemed}\n\nTo redeem, please contact FILTEC Head Office at +91 94378 60479 or present to your dealer.`,
      sentAt: timestamp,
      status: 'DELIVERED'
    };

    globalState = {
      ...globalState,
      dealers: updatedDealers,
      plumbers: updatedPlumbers,
      rewardVouchers: [voucher, ...(globalState.rewardVouchers || [])],
      rewardLedger: [tx, ...(globalState.rewardLedger || [])],
      auditLogs: [audit, ...(globalState.auditLogs || [])],
      whatsappMessages: [waMsg, ...(globalState.whatsappMessages || [])]
    };
    notify();

    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ALLOCATE_PLUMBER_REWARD',
          payload: { dealerId: dealer.id, plumberId: plumber.id, points, source, voucher }
        })
      }).catch((err) => console.warn('PostgreSQL allocate plumber reward failed:', err));
    }

    return voucher;
  },

  // Dealer redeems their own reward balance (Generates Dealer Voucher D-001, D-002...)
  redeemDealerReward(dealerId: string, points: number): RewardVoucher | null {
    const dealer = globalState.dealers.find((d) => d.id === dealerId || d.code === dealerId);
    if (!dealer || points <= 0 || dealer.availableRewards < points) return null;

    const timestamp = new Date().toISOString();
    const updatedBalance = Number((dealer.availableRewards - points).toFixed(2));
    const seqD = (globalState.rewardVouchers || []).filter((v) => v.type === 'DEALER').length + 1;
    const voucherNumber = `D-${String(seqD).padStart(3, '0')}`;
    const now = new Date();
    const dateRedeemed = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const voucher: RewardVoucher = {
      id: `vouch-d-${Date.now()}`,
      voucherNumber,
      type: 'DEALER',
      dealerId: dealer.id,
      dealerName: dealer.name,
      dealerCode: dealer.code,
      points,
      amount: points,
      status: 'ISSUED',
      dateRedeemed,
      createdAt: timestamp,
      contactNumber: '+91 94378 60479',
      instructions: `Present this voucher to your FILTEC Area Sales Executive or contact Head Office (+91 94378 60479) to settle as Credit Note.`
    };

    const tx: RewardTransaction = {
      id: `rew-${Date.now()}`,
      dealerId: dealer.id,
      type: 'DEALER_REDEEM_VOUCHER',
      amount: -points,
      balanceAfter: updatedBalance,
      voucherNumber,
      description: `Redeemed Voucher ${voucherNumber} for Credit Note Settlement`,
      createdAt: timestamp
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: dealer.id,
      userName: dealer.name,
      role: 'DEALER',
      action: 'DEALER_REWARD_REDEEMED',
      entityType: 'REWARD',
      entityId: voucher.id,
      details: `Dealer ${dealer.name} redeemed ₹${points} (Voucher ${voucherNumber}) for Credit Note settlement`,
      timestamp
    };

    const updatedDealers = globalState.dealers.map((d) =>
      d.id === dealer.id ? { ...d, availableRewards: updatedBalance } : d
    );

    globalState = {
      ...globalState,
      dealers: updatedDealers,
      rewardVouchers: [voucher, ...(globalState.rewardVouchers || [])],
      rewardLedger: [tx, ...globalState.rewardLedger],
      auditLogs: [audit, ...globalState.auditLogs]
    };
    notify();

    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DEALER_REDEEM_REWARD',
          payload: { dealerId: dealer.id, points, voucherNumber, voucher }
        })
      }).catch((err) => console.warn('PostgreSQL dealer redeem reward failed:', err));
    }

    return voucher;
  },

  // Settle voucher by Admin / Finance with Credit Note
  settleVoucher(voucherId: string, creditNoteNumber?: string) {
    const timestamp = new Date().toISOString();
    const updatedVouchers = (globalState.rewardVouchers || []).map((v) =>
      v.id === voucherId
        ? {
            ...v,
            status: 'SETTLED' as const,
            settledAt: timestamp,
            creditNoteNumber: creditNoteNumber || `CN-2026-${Math.floor(100 + Math.random() * 900)}`
          }
        : v
    );

    globalState = {
      ...globalState,
      rewardVouchers: updatedVouchers
    };
    notify();
  },

  // Add new plumber by dealer
  // BUSINESS RULE: If the dealer had plumber rewards held in escrow (because they had no plumbers),
  // that accumulated reward is now unlocked and transferred directly to this newly onboarded plumber!
  addPlumber(dealerId: string, name: string, phone: string) {
    const dealer = globalState.dealers.find((d) => d.id === dealerId);
    if (!dealer) return;

    const escrowBalance = Number((dealer.pendingPlumberRewards || 0).toFixed(2));
    const timestamp = new Date().toISOString();

    const newPlumber: Plumber = {
      id: `plumb-${Date.now()}`,
      dealerId,
      dealerName: dealer.name,
      name,
      phone,
      status: 'ACTIVE',
      // Release held escrow points directly to this new plumber
      totalAllocatedRewards: escrowBalance,
      rewardHistoryCount: escrowBalance > 0 ? 1 : 0,
      dateAdded: timestamp.split('T')[0]
    };

    const updatedDealers = globalState.dealers.map((d) =>
      d.id === dealerId
        ? {
            ...d,
            plumbersCount: d.plumbersCount + 1,
            pendingPlumberRewards: 0 // Reset escrow now that plumber has been onboarded!
          }
        : d
    );

    const newTxns: RewardTransaction[] = [];
    if (escrowBalance > 0) {
      newTxns.push({
        id: `rew-${Date.now()}-unlocked`,
        dealerId,
        plumberId: newPlumber.id,
        plumberName: newPlumber.name,
        type: 'ESCROW_RELEASE',
        amount: escrowBalance,
        balanceAfter: escrowBalance,
        description: `Escrow Released: ₹${escrowBalance.toLocaleString('en-IN')} in held plumber rewards unlocked and awarded to newly onboarded plumber ${newPlumber.name}`,
        createdAt: timestamp
      });
    }

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: dealer.id,
      userName: dealer.name,
      role: 'DEALER',
      action: 'PLUMBER_ONBOARDED',
      entityType: 'PLUMBER',
      entityId: newPlumber.id,
      details: escrowBalance > 0
        ? `Dealer ${dealer.name} registered new plumber: ${name} (${phone}). Released ₹${escrowBalance.toLocaleString('en-IN')} in held plumber escrow rewards directly to ${name}.`
        : `Dealer ${dealer.name} registered new plumber: ${name} (${phone})`,
      timestamp
    };

    const waMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      recipientPhone: phone,
      recipientName: name,
      templateName: 'plumber_onboarded',
      messageBody: escrowBalance > 0
        ? `FILTEC Plumber Rewards: Welcome ${name}! You have been registered by ${dealer.name}. ₹${escrowBalance.toLocaleString('en-IN')} in accumulated plumber rewards have been unlocked from escrow and credited to your account!`
        : `FILTEC Plumber Rewards: Welcome ${name}! You have been registered by ${dealer.name} to earn reward points on every FILTEC plumbing installation.`,
      sentAt: timestamp,
      status: 'DELIVERED'
    };

    globalState = {
      ...globalState,
      dealers: updatedDealers,
      plumbers: [newPlumber, ...globalState.plumbers],
      rewardLedger: [...newTxns, ...globalState.rewardLedger],
      auditLogs: [audit, ...globalState.auditLogs],
      whatsappMessages: [waMsg, ...globalState.whatsappMessages]
    };
    notify();

    // Persist asynchronously to PostgreSQL
    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_PLUMBER',
          payload: {
            ...newPlumber,
            dealerId,
            unlockedEscrow: escrowBalance
          }
        })
      }).catch((err) => console.warn('PostgreSQL create plumber failed:', err));
    }
  },

  // Update existing plumber information
  updatePlumber(plumberId: string, data: Partial<Plumber>): Plumber | null {
    const pIndex = globalState.plumbers.findIndex((p) => p.id === plumberId);
    if (pIndex === -1) return null;

    const current = globalState.plumbers[pIndex];
    const updatedPlumber: Plumber = {
      ...current,
      ...data
    };

    const updatedPlumbers = [...globalState.plumbers];
    updatedPlumbers[pIndex] = updatedPlumber;

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: globalState.currentUser.role,
      action: 'PLUMBER_UPDATED',
      entityType: 'PLUMBER',
      entityId: updatedPlumber.id,
      details: `${globalState.currentUser.name} updated plumber details for ${updatedPlumber.name} (${updatedPlumber.phone}) - Status: ${updatedPlumber.status}`,
      timestamp: new Date().toISOString()
    };

    globalState = {
      ...globalState,
      plumbers: updatedPlumbers,
      auditLogs: [audit, ...globalState.auditLogs]
    };
    notify();

    // Persist asynchronously to PostgreSQL
    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PLUMBER',
          payload: updatedPlumber
        })
      }).catch((err) => console.warn('PostgreSQL update plumber failed:', err));
    }

    return updatedPlumber;
  },

  // Update reward rate configuration
  async updateRewardConfig(config: RewardConfig): Promise<RewardConfig> {
    globalState = {
      ...globalState,
      rewardConfig: config
    };
    notify();

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'UPDATE_SETTINGS',
            payload: { key: 'rewardConfig', value: config }
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to persist reward config');
        }
      } catch (err) {
        console.warn('PostgreSQL update rewardConfig failed:', err);
      }
    }
    return config;
  },

  // Record Attendance
  recordAttendance(record: Omit<AttendanceRecord, 'id'>) {
    const distanceFromOffice =
      record.distanceFromOffice !== undefined
        ? record.distanceFromOffice
        : calculateDistanceMeters(record.latitude, record.longitude);

    const newRecord: AttendanceRecord = {
      ...record,
      distanceFromOffice,
      id: `att-${Date.now()}`
    };

    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayDateStr = new Date().toISOString().split('T')[0];

    // 1. Resolve target employee reliably (handling code, id, user-id prefix, or name)
    const rawId = record.employeeId || '';
    const cleanId = rawId.replace(/^user-/, '');
    const matchedEmp = globalState.employees.find(
      (e) =>
        e.code === rawId ||
        e.id === rawId ||
        e.id === cleanId ||
        e.code.toLowerCase() === rawId.toLowerCase() ||
        (record.employeeName && e.name.toLowerCase() === record.employeeName.toLowerCase())
    );

    const empId = matchedEmp?.id || cleanId || rawId;
    const empCode = matchedEmp?.code || rawId;
    const empName = matchedEmp?.name || record.employeeName;
    const empTerritory = matchedEmp?.territory || 'Central Operations';
    const empPhone = matchedEmp?.phone || '+91 9437860619';

    // 2. Update employee check-in status in staff directory
    const updatedEmployees = globalState.employees.map((e) => {
      if (
        e.id === empId ||
        e.code === empCode ||
        (matchedEmp && e.id === matchedEmp.id) ||
        (record.employeeName && e.name.toLowerCase() === record.employeeName.toLowerCase())
      ) {
        return {
          ...e,
          checkInStatus: (record.type === 'CHECK_IN' ? 'CHECKED_IN' : 'CHECKED_OUT') as 'CHECKED_IN' | 'CHECKED_OUT',
          lastCheckInTime: `${currentTimeStr} Today`,
          lastLocation: record.locationName
        };
      }
      return e;
    });

    // 3. Synchronize to dailyAttendance for Admin visibility (matched strictly on today's date)
    let updatedDaily = [...globalState.dailyAttendance];
    const dailyIndex = updatedDaily.findIndex(
      (d) =>
        d.date === todayDateStr &&
        (d.employeeId === empId ||
          d.employeeCode === empCode ||
          (matchedEmp && (d.employeeId === matchedEmp.id || d.employeeCode === matchedEmp.code)) ||
          (empName && d.employeeName.toLowerCase() === empName.toLowerCase()))
    );

    const verificationPoint = {
      timestamp: new Date().toISOString(),
      time: currentTimeStr,
      latitude: record.latitude,
      longitude: record.longitude,
      locationName: record.locationName,
      photoUrl: record.photoUrl,
      verified: true,
      accuracy: record.accuracy || 14.5,
      accuracyBand: record.accuracyBand || ((record.accuracy || 14.5) <= 15 ? 'OPTIMAL' : (record.accuracy || 14.5) <= 25 ? 'ACCEPTABLE' : 'LOW'),
      distanceFromOffice
    };

    const stableId = dailyIndex >= 0 && updatedDaily[dailyIndex].id
      ? updatedDaily[dailyIndex].id
      : `att-sum-${empId}-${todayDateStr}`;

    let summaryRecord: DailyAttendanceSummary;

    if (dailyIndex >= 0) {
      const current = updatedDaily[dailyIndex];
      summaryRecord = {
        ...current,
        id: current.id || stableId,
        date: todayDateStr,
        employeeId: empId,
        employeeCode: empCode,
        employeeName: empName,
        territory: empTerritory,
        phone: empPhone,
        status: record.type === 'CHECK_IN' ? 'ACTIVE_ON_FIELD' : 'CHECKED_OUT',
        ...(record.type === 'CHECK_IN'
          ? { checkIn: verificationPoint }
          : { checkOut: verificationPoint, hoursWorked: current.hoursWorked || 8.0 })
      };
      updatedDaily[dailyIndex] = summaryRecord;
    } else {
      summaryRecord = {
        id: stableId,
        date: todayDateStr,
        employeeId: empId,
        employeeCode: empCode,
        employeeName: empName,
        territory: empTerritory,
        phone: empPhone,
        status: record.type === 'CHECK_IN' ? 'ACTIVE_ON_FIELD' : 'CHECKED_OUT',
        ...(record.type === 'CHECK_IN' ? { checkIn: verificationPoint } : { checkOut: verificationPoint }),
        hoursWorked: record.type === 'CHECK_OUT' ? 8.0 : 0,
        dealerVisitsCount: 1,
        ordersCount: 0
      };
      updatedDaily.unshift(summaryRecord);
    }

    const distLabel = formatDistanceToFiltec(distanceFromOffice);
    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: empId,
      userName: empName,
      role: 'EMPLOYEE',
      action: `ATTENDANCE_${record.type}`,
      entityType: 'ATTENDANCE',
      entityId: newRecord.id,
      details: `${empName} recorded ${record.type} at ${record.locationName} (${distLabel} | GPS Accuracy: ±${record.accuracy || 14.5}m)`,
      timestamp: new Date().toISOString()
    };

    globalState = {
      ...globalState,
      employees: updatedEmployees,
      attendanceRecords: [newRecord, ...globalState.attendanceRecords],
      dailyAttendance: updatedDaily,
      auditLogs: [audit, ...globalState.auditLogs]
    };
    notify();

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('filtec:attendance_updated', {
            detail: { record: newRecord, summary: summaryRecord }
          })
        );
        const channel = new BroadcastChannel('filtec_attendance_channel');
        channel.postMessage({ type: 'ATTENDANCE_PUNCH', state: globalState });
        channel.close();
      } catch (e) {}

      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_ATTENDANCE',
          payload: {
            record: newRecord,
            employeeId: empId,
            checkInStatus: record.type === 'CHECK_IN' ? 'CHECKED_IN' : 'CHECKED_OUT',
            lastCheckInTime: `${currentTimeStr} Today`,
            lastLocation: record.locationName,
            summary: summaryRecord
          }
        })
      }).catch((err) => console.warn('PostgreSQL record attendance failed:', err));
    }
  },

  // 1-Click WhatsApp attendance reminder
  sendAttendanceReminderWhatsApp(employeeId: string) {
    const emp = globalState.employees.find((e) => e.id === employeeId || e.code === employeeId);
    if (!emp) return;

    const timestamp = new Date().toISOString();
    const waMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      recipientPhone: emp.phone,
      recipientName: emp.name,
      templateName: 'attendance_missing_alert',
      messageBody: `FILTEC Attendance Alert: Hi ${emp.name}, your morning GPS attendance has not been recorded yet. Please open Pre-Tech 1 and record your verified field check-in.`,
      sentAt: timestamp,
      status: 'DELIVERED'
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: 'ADMIN',
      action: 'ATTENDANCE_REMINDER_SENT',
      entityType: 'ATTENDANCE',
      entityId: emp.id,
      details: `Admin dispatched attendance check-in reminder via WhatsApp to ${emp.name} (${emp.phone})`,
      timestamp
    };

    globalState = {
      ...globalState,
      whatsappMessages: [waMsg, ...globalState.whatsappMessages],
      auditLogs: [audit, ...globalState.auditLogs]
    };
    notify();
  },

  submitLeaveRequest(data: {
    employeeId: string;
    employeeName: string;
    leaveType: 'CASUAL' | 'SICK' | 'PLANNED' | 'COMPENSATORY';
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string;
    isHalfDay?: boolean;
    contactNumber?: string;
  }): LeaveRequest {
    const timestamp = new Date().toISOString();
    const newId = `leave-${Date.now()}`;
    const newLeave: LeaveRequest = {
      ...data,
      id: newId,
      status: 'PENDING',
      createdAt: timestamp
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: globalState.currentUser.role,
      action: 'LEAVE_REQUEST_SUBMITTED',
      entityType: 'HR_LEAVE',
      entityId: newId,
      details: `${data.employeeName} submitted ${data.leaveType} leave request for ${data.daysCount} day(s) (${data.startDate} to ${data.endDate})`,
      timestamp
    };

    const waMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      recipientPhone: globalState.settings.company.supportWhatsApp,
      recipientName: 'FILTEC Operations Admin',
      templateName: 'leave_request_submitted',
      messageBody: `FILTEC HR: New leave request from ${data.employeeName} (${data.leaveType} - ${data.daysCount} day(s), ${data.startDate} to ${data.endDate}). Reason: "${data.reason}". Open Admin Portal to review.`,
      sentAt: timestamp,
      status: 'DELIVERED'
    };

    globalState = {
      ...globalState,
      leaveRequests: [newLeave, ...globalState.leaveRequests],
      auditLogs: [audit, ...globalState.auditLogs],
      whatsappMessages: [waMsg, ...globalState.whatsappMessages]
    };
    notify();

    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_LEAVE_REQUEST', payload: newLeave })
      }).catch((err) => console.warn('PostgreSQL create leave request failed:', err));
    }

    return newLeave;
  },

  approveLeaveRequest(requestId: string) {
    const reqIndex = globalState.leaveRequests.findIndex((l) => l.id === requestId);
    if (reqIndex === -1) return;

    const current = globalState.leaveRequests[reqIndex];
    const timestamp = new Date().toISOString();
    const updated = [...globalState.leaveRequests];
    updated[reqIndex] = { ...current, status: 'APPROVED' };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: 'ADMIN',
      action: 'LEAVE_REQUEST_APPROVED',
      entityType: 'HR_LEAVE',
      entityId: requestId,
      details: `Admin approved leave request for ${current.employeeName}`,
      timestamp
    };

    const emp = globalState.employees.find((e) => e.id === current.employeeId || e.name === current.employeeName);
    const recipientPhone = current.contactNumber || emp?.phone || '+91 94378 60619';

    const waMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      recipientPhone,
      recipientName: current.employeeName,
      templateName: 'leave_request_approved',
      messageBody: `FILTEC HR: Your leave request for ${current.startDate} to ${current.endDate} (${current.daysCount} day(s)) has been APPROVED by Operations. Enjoy your time off!`,
      sentAt: timestamp,
      status: 'DELIVERED'
    };

    globalState = {
      ...globalState,
      leaveRequests: updated,
      auditLogs: [audit, ...globalState.auditLogs],
      whatsappMessages: [waMsg, ...globalState.whatsappMessages]
    };
    notify();

    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_LEAVE_REQUEST', payload: { id: requestId, status: 'APPROVED' } })
      }).catch((err) => console.warn('PostgreSQL approve leave request failed:', err));
    }
  },

  rejectLeaveRequest(requestId: string, reason?: string) {
    const reqIndex = globalState.leaveRequests.findIndex((l) => l.id === requestId);
    if (reqIndex === -1) return;

    const current = globalState.leaveRequests[reqIndex];
    const timestamp = new Date().toISOString();
    const rejectionReason = reason?.trim() || 'Operational requirements at plant / field territory';

    const updated = [...globalState.leaveRequests];
    updated[reqIndex] = {
      ...current,
      status: 'REJECTED',
      rejectionReason
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: 'ADMIN',
      action: 'LEAVE_REQUEST_REJECTED',
      entityType: 'HR_LEAVE',
      entityId: requestId,
      details: `Admin rejected leave request for ${current.employeeName}: ${rejectionReason}`,
      timestamp
    };

    const emp = globalState.employees.find((e) => e.id === current.employeeId || e.name === current.employeeName);
    const recipientPhone = current.contactNumber || emp?.phone || '+91 94378 60619';

    const waMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      recipientPhone,
      recipientName: current.employeeName,
      templateName: 'leave_request_rejected',
      messageBody: `FILTEC HR: Your leave request for ${current.startDate} to ${current.endDate} was not approved. Reason: ${rejectionReason}. Please contact Operations leadership.`,
      sentAt: timestamp,
      status: 'DELIVERED'
    };

    globalState = {
      ...globalState,
      leaveRequests: updated,
      auditLogs: [audit, ...globalState.auditLogs],
      whatsappMessages: [waMsg, ...globalState.whatsappMessages]
    };
    notify();

    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_LEAVE_REQUEST', payload: { id: requestId, status: 'REJECTED', rejectionReason } })
      }).catch((err) => console.warn('PostgreSQL reject leave request failed:', err));
    }
  },

  updateEmployee(employeeId: string, data: Partial<Employee>): Employee | null {
    const empIndex = globalState.employees.findIndex((e) => e.id === employeeId || e.code === employeeId);
    if (empIndex === -1) return null;

    const current = globalState.employees[empIndex];
    if (data.phone) {
      const p = data.phone.trim();
      const isSamir = current.name.toLowerCase() === 'samir' || current.code === 'FPPL/ADM-001';
      if (isSamir) {
        data.phone = '+91 9437505814';
      } else if (p && p !== '-' && p !== '(-)') {
        const clean = p.replace(/^\+91[\s-]*/, '').replace(/^91(?=\d{10})/, '').replace(/\s+/g, '').trim();
        data.phone = clean ? `+91 ${clean}` : p;
      }
    }
    const updatedEmployee: Employee = {
      ...current,
      ...data
    };

    const updatedEmployees = [...globalState.employees];
    updatedEmployees[empIndex] = updatedEmployee;

    const timestamp = new Date().toISOString();

    let updatedCurrentUser = globalState.currentUser;
    if (
      globalState.currentUser.id === current.id ||
      globalState.currentUser.employeeCode === current.code ||
      globalState.currentUser.name === current.name
    ) {
      updatedCurrentUser = {
        ...globalState.currentUser,
        name: updatedEmployee.name,
        phone: updatedEmployee.phone,
        email: updatedEmployee.email && updatedEmployee.email !== '(-)' ? updatedEmployee.email : globalState.currentUser.email,
        role: updatedEmployee.systemRole || globalState.currentUser.role,
        allowedPages: updatedEmployee.allowedPages || globalState.currentUser.allowedPages
      };
    }

    const updatedDailyAttendance = globalState.dailyAttendance.map((d) => {
      if (d.employeeId === current.id || d.employeeCode === current.code) {
        return {
          ...d,
          employeeName: updatedEmployee.name,
          phone: updatedEmployee.phone,
          territory: updatedEmployee.territory || d.territory
        };
      }
      return d;
    });

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: globalState.currentUser.role,
      action: 'EMPLOYEE_UPDATED',
      entityType: 'EMPLOYEE',
      entityId: current.id,
      details: `Updated employee profile for ${updatedEmployee.name} (${updatedEmployee.code}): Designation: ${updatedEmployee.designation || '(-)'}, Phone: ${updatedEmployee.phone}, Territory: ${updatedEmployee.territory || '(-)'}`,
      timestamp
    };

    const erpEvent: IntegrationEvent = {
      id: `erp-${Date.now()}`,
      type: 'ERP_SYNC',
      title: `Sync Employee Master: ${updatedEmployee.code}`,
      targetId: updatedEmployee.code,
      status: 'SUCCESS',
      payloadSummary: `Synced changes for ${updatedEmployee.name} (${updatedEmployee.code}) to HR/Payroll ERP master. Designation: ${updatedEmployee.designation || '(-)'}`,
      timestamp,
      latencyMs: 110
    };

    let updatedDealers = globalState.dealers;
    if (data.assignedDealerIds !== undefined) {
      const newAssignedSet = new Set(data.assignedDealerIds);
      updatedDealers = globalState.dealers.map((dlr) => {
        if (newAssignedSet.has(dlr.id) || newAssignedSet.has(dlr.code)) {
          return { ...dlr, assignedRepId: updatedEmployee.id };
        } else if (dlr.assignedRepId === updatedEmployee.id || dlr.assignedRepId === updatedEmployee.code) {
          return { ...dlr, assignedRepId: undefined };
        }
        return dlr;
      });
    }

    globalState = {
      ...globalState,
      dealers: updatedDealers,
      employees: updatedEmployees,
      currentUser: updatedCurrentUser,
      dailyAttendance: updatedDailyAttendance,
      auditLogs: [audit, ...globalState.auditLogs],
      integrationEvents: [erpEvent, ...globalState.integrationEvents]
    };
    notify();

    // Persist asynchronously to PostgreSQL
    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_EMPLOYEE',
          payload: updatedEmployee
        })
      }).catch((err) => console.warn('PostgreSQL update employee failed:', err));
    }

    return updatedEmployee;
  },

  updateDealer(dealerId: string, data: Partial<Dealer>): Dealer | null {
    const dIndex = globalState.dealers.findIndex((d) => d.id === dealerId || d.code === dealerId);
    if (dIndex === -1) return null;

    const current = globalState.dealers[dIndex];
    let phone = data.phone !== undefined ? (data.phone || '').trim() : current.phone;
    if (phone && phone !== '-') {
      const clean = phone.replace(/^\+91[\s-]*/, '').replace(/^91(?=\d{10})/, '').trim();
      phone = clean ? `+91 ${clean}` : phone;
    }

    const updatedDealer: Dealer = {
      ...current,
      ...data,
      phone,
      creditLimit: data.creditLimit !== undefined ? Number(data.creditLimit) : 0,
      outstandingBalance: data.outstandingBalance !== undefined ? Number(data.outstandingBalance) : 0,
      assignedRepId: data.assignedRepId !== undefined ? (data.assignedRepId || undefined) : current.assignedRepId
    };

    const updatedDealers = [...globalState.dealers];
    updatedDealers[dIndex] = updatedDealer;

    // Sync employee's assignedDealerIds if assignedRepId changed
    let updatedEmployees = globalState.employees;
    if (data.assignedRepId !== undefined) {
      const newRepId = data.assignedRepId;
      const oldRepId = current.assignedRepId;
      if (newRepId !== oldRepId) {
        updatedEmployees = globalState.employees.map((emp) => {
          let ids = Array.isArray(emp.assignedDealerIds) ? [...emp.assignedDealerIds] : [];
          if (emp.id === newRepId || emp.code === newRepId) {
            if (!ids.includes(current.id)) ids.push(current.id);
          } else if (emp.id === oldRepId || emp.code === oldRepId) {
            ids = ids.filter((id) => id !== current.id);
          }
          return { ...emp, assignedDealerIds: ids };
        });
      }
    }

    const timestamp = new Date().toISOString();

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: globalState.currentUser.role,
      action: 'DEALER_UPDATED',
      entityType: 'DEALER',
      entityId: current.id,
      details: `Updated dealer account for ${updatedDealer.name} (${updatedDealer.code}): Phone: ${updatedDealer.phone}, City: ${updatedDealer.city}, Assigned Rep: ${updatedDealer.assignedRepId || 'Unassigned'}`,
      timestamp
    };

    const erpEvent: IntegrationEvent = {
      id: `erp-${Date.now()}`,
      type: 'ERP_SYNC',
      title: `Sync Dealer Master: ${updatedDealer.code}`,
      targetId: updatedDealer.code,
      status: 'SUCCESS',
      payloadSummary: `Updated ERP Commercial Master for ${updatedDealer.name} (${updatedDealer.code}). Tier: ${updatedDealer.tier}`,
      timestamp,
      latencyMs: 125
    };

    globalState = {
      ...globalState,
      dealers: updatedDealers,
      employees: updatedEmployees,
      auditLogs: [audit, ...globalState.auditLogs],
      integrationEvents: [erpEvent, ...globalState.integrationEvents]
    };
    notify();

    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_DEALER', payload: updatedDealer })
      }).catch((err) => console.warn('PostgreSQL update dealer failed:', err));
    }

    return updatedDealer;
  },

  onboardDealer(data: {
    name: string;
    ownerName: string;
    phone: string;
    email?: string;
    city: string;
    state?: string;
    address: string;
    pincode?: string;
    gstin?: string;
    creditLimit?: number;
    tier?: 'Platinum' | 'Gold' | 'Silver';
    code?: string;
    assignedRepId?: string;
  }): Dealer {
    const timestamp = new Date().toISOString();
    const newId = `dlr-${Date.now()}`;
    
    let dealerCode = data.code?.trim();
    if (!dealerCode) {
      const maxNum = globalState.dealers.reduce((max, d) => {
        const match = d.code.match(/DLR-(\d+)/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 300);
      dealerCode = `DLR-${maxNum + 1}`;
    }

    let phone = (data.phone || '').trim();
    if (phone && phone !== '-') {
      const clean = phone.replace(/^\+91[\s-]*/, '').replace(/^91(?=\d{10})/, '').trim();
      phone = clean ? `+91 ${clean}` : phone;
    }

    const newDealer: Dealer = {
      id: newId,
      code: dealerCode,
      name: data.name,
      ownerName: data.ownerName,
      phone,
      email: data.email,
      city: data.city,
      state: data.state || 'Odisha',
      address: data.address,
      pincode: data.pincode,
      gstin: data.gstin,
      creditLimit: Number(data.creditLimit) || 0,
      outstandingBalance: 0,
      tier: data.tier || 'Silver',
      totalPurchases: 0,
      availableRewards: 0,
      plumbersCount: 0,
      assignedRepId: data.assignedRepId || undefined
    };

    let updatedEmployees = globalState.employees;
    if (newDealer.assignedRepId) {
      updatedEmployees = globalState.employees.map((emp) => {
        if (emp.id === newDealer.assignedRepId || emp.code === newDealer.assignedRepId) {
          const ids = Array.isArray(emp.assignedDealerIds) ? [...emp.assignedDealerIds] : [];
          if (!ids.includes(newId)) ids.push(newId);
          return { ...emp, assignedDealerIds: ids };
        }
        return emp;
      });
    }

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: 'ADMIN',
      action: 'DEALER_ONBOARDED',
      entityType: 'DEALER',
      entityId: newId,
      details: `Admin onboarded new authorized dealer ${data.name} (${dealerCode}) in ${data.city}`,
      timestamp
    };

    const erpEvent: IntegrationEvent = {
      id: `erp-${Date.now()}`,
      type: 'ERP_SYNC',
      title: `Sync New Dealer: ${dealerCode}`,
      targetId: dealerCode,
      status: 'SUCCESS',
      payloadSummary: `Created ERP Customer Account for ${data.name} (${dealerCode}). Tier: ${newDealer.tier}`,
      timestamp,
      latencyMs: 130
    };

    globalState = {
      ...globalState,
      dealers: [newDealer, ...globalState.dealers],
      employees: updatedEmployees,
      auditLogs: [audit, ...globalState.auditLogs],
      integrationEvents: [erpEvent, ...globalState.integrationEvents]
    };
    notify();

    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_DEALER', payload: newDealer })
      }).catch((err) => console.warn('PostgreSQL create dealer failed:', err));
    }

    return newDealer;
  },

  async updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
    const updatedSettings: AppSettings = {
      ...globalState.settings,
      ...data,
      company: {
        ...globalState.settings.company,
        ...(data.company || {})
      },
      permissions: {
        ...globalState.settings.permissions,
        ...(data.permissions || {})
      },
      policy: {
        ...globalState.settings.policy,
        ...(data.policy || {})
      },
      notifications: {
        ...globalState.settings.notifications,
        ...(data.notifications || {})
      }
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: 'ADMIN',
      action: 'SETTINGS_UPDATED',
      entityType: 'SYSTEM_SETTINGS',
      entityId: 'global-settings',
      details: `Admin ${globalState.currentUser.name} updated system operational settings`,
      timestamp: new Date().toISOString()
    };

    globalState = {
      ...globalState,
      settings: updatedSettings,
      auditLogs: [audit, ...globalState.auditLogs]
    };
    notify();

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'UPDATE_SETTINGS',
            payload: { settings: updatedSettings }
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save settings to database');
        }
      } catch (err) {
        console.warn('PostgreSQL update settings failed:', err);
        throw err;
      }
    }

    return updatedSettings;
  },

  // Assign Employee Role & Page Permissions
  assignEmployeeRole(employeeId: string, role: Role, allowedPages?: string[]): Employee | null {
    const pages =
      allowedPages || (role === 'ADMIN' ? ALL_ADMIN_PAGES : ALL_EMPLOYEE_PAGES);
    return this.updateEmployee(employeeId, {
      systemRole: role,
      allowedPages: pages
    });
  },

  // Onboard New Field Employee or Operations Admin
  onboardEmployee(data: {
    name: string;
    phone: string;
    email?: string;
    code?: string;
    designation?: string;
    territory?: string;
    targetMonthly?: number;
    baseSalary?: number;
    assignedDealerIds?: string[];
    remarks?: string;
    systemRole?: Role;
    allowedPages?: string[];
  }): Employee {
    const timestamp = new Date().toISOString();
    const todayDateStr = timestamp.split('T')[0];

    const isSamir = data.name.trim().toLowerCase() === 'samir';
    const isExplicitAdmin = data.systemRole === 'ADMIN' || isSamir;
    const systemRole: Role = isExplicitAdmin ? 'ADMIN' : (data.systemRole || 'EMPLOYEE');

    const allowedPages =
      data.allowedPages && data.allowedPages.length > 0
        ? data.allowedPages
        : systemRole === 'ADMIN'
        ? ALL_ADMIN_PAGES
        : ALL_EMPLOYEE_PAGES;

    // Auto-generate next code if not provided
    let employeeCode = data.code?.trim();
    if (!employeeCode) {
      if (systemRole === 'ADMIN') {
        const adminCount = globalState.employees.filter((e) => e.systemRole === 'ADMIN').length;
        employeeCode = `FPPL/ADM-${String(adminCount + 1).padStart(3, '0')}`;
      } else {
        const maxNum = globalState.employees.reduce((max, e) => {
          const match = e.code.match(/(?:EMP-|FPPL\/OD-)(\d+)/);
          return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 9);
        const pad = String(maxNum + 1).padStart(3, '0');
        employeeCode = `FPPL/OD-${pad}`;
      }
    }

    const territory = data.territory?.trim() || '(-)';
    const targetMonthly = Number(data.targetMonthly) || 0;
    const baseSalary = Number(data.baseSalary) || 0;
    const remarks = data.remarks?.trim() || '(-)';

    const newEmpId = `emp-${Date.now()}`;
    const newEmployee: Employee = {
      id: newEmpId,
      code: employeeCode,
      name: data.name,
      phone: data.phone,
      territory,
      targetMonthly,
      currentMonthSales: 0,
      activeOrdersCount: 0,
      checkInStatus: 'CHECKED_OUT',
      lastCheckInTime: '(-)',
      lastLocation: '(-)',
      designation: data.designation || '(-)',
      baseSalary,
      assignedDealerIds: data.assignedDealerIds || [],
      dateOfJoining: todayDateStr,
      email: data.email || '(-)',
      remarks,
      systemRole,
      allowedPages
    };

    // Add to dailyAttendance roster
    const newAttendanceSummary: DailyAttendanceSummary = {
      id: `att-sum-${Date.now()}`,
      date: todayDateStr,
      employeeId: newEmpId,
      employeeCode: employeeCode,
      employeeName: data.name,
      territory,
      phone: data.phone,
      status: 'ABSENT',
      hoursWorked: 0,
      dealerVisitsCount: 0,
      ordersCount: 0,
      notes: 'Newly onboarded - awaiting first punch'
    };

    // Automated WhatsApp welcome dispatch
    const waMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      recipientPhone: data.phone,
      recipientName: data.name,
      templateName: 'employee_welcome_onboarding',
      messageBody: `Welcome ${data.name} to FILTEC Polyplast Pvt Ltd! Your Pre-Tech 1 account (${employeeCode}) is active. Access the portal to record daily GPS attendance and manage operations. Designation: ${data.designation || '(-)'}. Territory: ${territory}.`,
      sentAt: timestamp,
      status: 'DELIVERED'
    };

    // ERP Synchronization Event
    const erpEvent: IntegrationEvent = {
      id: `erp-${Date.now()}`,
      type: 'ERP_SYNC',
      title: `Sync New Employee: ${employeeCode}`,
      targetId: employeeCode,
      status: 'SUCCESS',
      payloadSummary: `Mapped ${data.name} (${employeeCode}) to ERP Ledger. Designation: ${data.designation || '(-)'}, Territory: ${territory}`,
      timestamp,
      latencyMs: 142
    };

    // Audit Log
    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: 'ADMIN',
      action: 'EMPLOYEE_ONBOARDED',
      entityType: 'EMPLOYEE',
      entityId: newEmpId,
      details: `Admin ${globalState.currentUser.name} onboarded new employee ${data.name} (${employeeCode}) - ${data.designation || '(-)'}`,
      timestamp
    };

    globalState = {
      ...globalState,
      employees: [newEmployee, ...globalState.employees],
      dailyAttendance: [newAttendanceSummary, ...globalState.dailyAttendance],
      whatsappMessages: [waMsg, ...globalState.whatsappMessages],
      integrationEvents: [erpEvent, ...globalState.integrationEvents],
      auditLogs: [audit, ...globalState.auditLogs]
    };
    notify();

    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_EMPLOYEE', payload: newEmployee })
      }).catch((err) => console.warn('PostgreSQL create employee failed:', err));
    }

    return newEmployee;
  },

  // Toggle Product Stock Status
  toggleProductStock(productId: string, inStock?: boolean) {
    const pIndex = globalState.products.findIndex((p) => p.id === productId);
    if (pIndex === -1) return;

    const current = globalState.products[pIndex];
    const newStock = inStock !== undefined ? inStock : !(current.inStock !== false);
    const newStatus = newStock ? 'IN_STOCK' : 'OUT_OF_STOCK';

    const updatedVariants = current.variants.map((v) => ({
      ...v,
      inStock: newStock
    }));

    const updatedProduct: Product = {
      ...current,
      inStock: newStock,
      stockStatus: newStatus,
      variants: updatedVariants
    };

    const updatedProducts = [...globalState.products];
    updatedProducts[pIndex] = updatedProduct;

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: 'ADMIN',
      action: 'STOCK_STATUS_CHANGED',
      entityType: 'CATALOGUE_PRODUCT',
      entityId: current.id,
      details: `Admin changed stock status of ${current.code} (${current.name}) to ${newStatus}`,
      timestamp: new Date().toISOString()
    };

    globalState = {
      ...globalState,
      products: updatedProducts,
      auditLogs: [audit, ...globalState.auditLogs]
    };
    notify();

    // Persist to PostgreSQL
    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_PRODUCT_STOCK',
          payload: { productId, inStock: newStock }
        })
      }).catch((err) => console.warn('PostgreSQL toggle stock failed:', err));
    }
  },

  // Toggle Variant Stock
  toggleVariantStock(productId: string, variantId: string, inStock?: boolean) {
    const pIndex = globalState.products.findIndex((p) => p.id === productId);
    if (pIndex === -1) return;

    const current = globalState.products[pIndex];
    const updatedVariants = current.variants.map((v) => {
      if (v.id === variantId) {
        const vStock = inStock !== undefined ? inStock : !(v.inStock !== false);
        return { ...v, inStock: vStock };
      }
      return v;
    });

    const anyInStock = updatedVariants.some((v) => v.inStock !== false);
    const updatedProduct: Product = {
      ...current,
      inStock: anyInStock,
      stockStatus: anyInStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
      variants: updatedVariants
    };

    const updatedProducts = [...globalState.products];
    updatedProducts[pIndex] = updatedProduct;

    globalState = {
      ...globalState,
      products: updatedProducts
    };
    notify();

    if (typeof window !== 'undefined') {
      const targetVariant = updatedVariants.find((v) => v.id === variantId);
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_VARIANT_STOCK',
          payload: { productId, variantId, inStock: targetVariant?.inStock ?? false }
        })
      }).catch((err) => console.warn('PostgreSQL update variant stock failed:', err));
    }
  },

  // Add New Product
  addProduct(productData: Omit<Product, 'id'>): Product {
    const newId = `prod-${productData.code.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now()}`;
    const timestamp = new Date().toISOString();

    const variantsWithIds = productData.variants.map((v, idx) => ({
      ...v,
      id: v.id || `${newId}-var-${idx + 1}`,
      productId: newId,
      inStock: v.inStock !== false
    }));

    const newProduct: Product = {
      ...productData,
      id: newId,
      inStock: productData.inStock !== false,
      stockStatus: productData.stockStatus || 'IN_STOCK',
      isArchived: false,
      variants: variantsWithIds
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: 'ADMIN',
      action: 'PRODUCT_CREATED',
      entityType: 'CATALOGUE_PRODUCT',
      entityId: newId,
      details: `Admin added new catalogue product ${newProduct.code}: ${newProduct.name} (${newProduct.variants.length} variants)`,
      timestamp
    };

    const erpEvent: IntegrationEvent = {
      id: `erp-${Date.now()}`,
      type: 'ERP_SYNC',
      title: `Sync New Product SKU: ${newProduct.code}`,
      targetId: newProduct.code,
      status: 'SUCCESS',
      payloadSummary: `Created SKU ${newProduct.code} in billing master: ${newProduct.name}, Material: ${newProduct.material}, Standard: ${newProduct.standard}`,
      timestamp,
      latencyMs: 135
    };

    globalState = {
      ...globalState,
      products: sortProductsNaturally([newProduct, ...globalState.products]),
      auditLogs: [audit, ...globalState.auditLogs],
      integrationEvents: [erpEvent, ...globalState.integrationEvents]
    };
    notify();

    // Persist to PostgreSQL
    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_PRODUCT',
          payload: newProduct
        })
      }).catch((err) => console.warn('PostgreSQL create product failed:', err));
    }

    return newProduct;
  },

  // Update Product
  updateProduct(productId: string, data: Partial<Product>) {
    const pIndex = globalState.products.findIndex((p) => p.id === productId);
    if (pIndex === -1) return;

    const current = globalState.products[pIndex];
    const updatedProduct: Product = {
      ...current,
      ...data
    };

    const updatedProducts: Product[] = sortProductsNaturally<Product>([
      ...globalState.products.filter((p) => p.id !== productId),
      updatedProduct
    ]);

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: 'ADMIN',
      action: 'PRODUCT_UPDATED',
      entityType: 'CATALOGUE_PRODUCT',
      entityId: productId,
      details: `Admin updated product details for ${current.code} (${current.name})`,
      timestamp: new Date().toISOString()
    };

    globalState = {
      ...globalState,
      products: updatedProducts,
      auditLogs: [audit, ...globalState.auditLogs]
    };
    notify();

    // Persist to PostgreSQL
    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PRODUCT',
          payload: { id: productId, ...data }
        })
      }).catch((err) => console.warn('PostgreSQL update product failed:', err));
    }
  },

  // Delete / Archive Product (with integrity check against existing orders)
  deleteProduct(productId: string): { success: boolean; archivedOnly: boolean; message: string } {
    const product = globalState.products.find((p) => p.id === productId);
    if (!product) return { success: false, archivedOnly: false, message: 'Product not found' };

    // Check if any order references this product
    const isReferenced = globalState.orders.some((o) =>
      o.items.some((item) => item.productId === productId || item.productCode === product.code)
    );

    const timestamp = new Date().toISOString();

    if (isReferenced) {
      // Soft-archive to preserve accounting integrity
      const updatedProducts = globalState.products.map((p) =>
        p.id === productId ? { ...p, isArchived: true, inStock: false, stockStatus: 'OUT_OF_STOCK' as const } : p
      );

      const audit: AuditLog = {
        id: `aud-${Date.now()}`,
        userId: globalState.currentUser.id,
        userName: globalState.currentUser.name,
        role: 'ADMIN',
        action: 'PRODUCT_ARCHIVED',
        entityType: 'CATALOGUE_PRODUCT',
        entityId: productId,
        details: `Product ${product.code} archived rather than deleted because it is referenced in past/active orders`,
        timestamp
      };

      globalState = {
        ...globalState,
        products: updatedProducts,
        auditLogs: [audit, ...globalState.auditLogs]
      };
      notify();

      // Persist to PostgreSQL
      if (typeof window !== 'undefined') {
        fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'UPDATE_PRODUCT',
            payload: { id: productId, isArchived: true, inStock: false }
          })
        }).catch((err) => console.warn('PostgreSQL archive product failed:', err));
      }

      return {
        success: true,
        archivedOnly: true,
        message: `${product.code} is referenced in past orders. It has been archived and marked out of stock to preserve billing history.`
      };
    } else {
      // Hard delete safe because no order references it
      const updatedProducts = globalState.products.filter((p) => p.id !== productId);

      const audit: AuditLog = {
        id: `aud-${Date.now()}`,
        userId: globalState.currentUser.id,
        userName: globalState.currentUser.name,
        role: 'ADMIN',
        action: 'PRODUCT_DELETED',
        entityType: 'CATALOGUE_PRODUCT',
        entityId: productId,
        details: `Admin deleted unreferenced product ${product.code} from catalogue`,
        timestamp
      };

      globalState = {
        ...globalState,
        products: updatedProducts,
        auditLogs: [audit, ...globalState.auditLogs]
      };
      notify();

      // Persist to PostgreSQL
      if (typeof window !== 'undefined') {
        fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'DELETE_PRODUCT',
            payload: { productId }
          })
        }).catch((err) => console.warn('PostgreSQL delete product failed:', err));
      }

      return {
        success: true,
        archivedOnly: false,
        message: `${product.code} (${product.name}) has been completely removed from catalogue.`
      };
    }
  }
};

// React hook for consuming state in client components
export function useAppStore(): AppState {
  const [state, setState] = useState<AppState>(store.getState());

  useEffect(() => {
    store.initializeFromStorage();
    store.syncWithDatabase();
    setState(store.getState());
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}
