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
import { useEffect, useState } from 'react';
import { sortProductsNaturally } from '@/lib/catalogueUtils';

const STORAGE_KEY = 'filtec_pretech1_state_v5';

export interface AppState {
  currentUser: User;
  products: Product[];
  dealers: Dealer[];
  employees: Employee[];
  plumbers: Plumber[];
  orders: Order[];
  rewardConfig: RewardConfig;
  rewardLedger: RewardTransaction[];
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
    attendanceRecords: [
      {
        id: 'att-1',
        employeeId: 'emp-1',
        employeeName: 'Purna Chandra Nayak',
        type: 'CHECK_IN',
        timestamp: '2026-09-11T09:15:00Z',
        latitude: 20.2960,
        longitude: 85.8245,
        locationName: 'Bhubaneswar Commercial Complex',
        photoUrl: '/brand/filtec-logo.jpg',
        verified: true
      }
    ],
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
      dealerId: 'dlr-1',
      items: [],
      notes: ''
    }
  };
};

type Listener = () => void;
let globalState: AppState = getInitialState();
const listeners = new Set<Listener>();

const notify = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
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

  initializeFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('filtec_pretech1_state_v3');
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

        // Migrate all employees to have systemRole and allowedPages
        existingEmployees = existingEmployees.map((e) => {
          const isSamir = e.name.toLowerCase() === 'samir' || e.code === 'FPPL/ADM-001';
          const systemRole: Role = e.systemRole || (isSamir ? 'ADMIN' : 'EMPLOYEE');
          const allowedPages =
            e.allowedPages && e.allowedPages.length > 0
              ? e.allowedPages
              : systemRole === 'ADMIN'
              ? ALL_ADMIN_PAGES
              : ALL_EMPLOYEE_PAGES;

          return {
            ...e,
            systemRole,
            allowedPages
          };
        });

        // Ensure current user is valid
        let currentUser: User = parsed.currentUser || INITIAL_USERS[0];
        if (currentUser.role === 'ADMIN' && !currentUser.allowedPages) {
          currentUser = {
            ...currentUser,
            allowedPages: ALL_ADMIN_PAGES
          };
        }

        globalState = {
          ...getInitialState(),
          ...parsed,
          currentUser,
          employees: existingEmployees,
          products: CATALOGUE_PRODUCTS,
          settings: {
            ...INITIAL_SETTINGS,
            ...(parsed.settings || {}),
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

  async syncWithDatabase() {
    if (typeof window === 'undefined') return;
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
            dealers: d.dealers?.length ? d.dealers : globalState.dealers,
            employees: d.employees?.length ? d.employees : globalState.employees,
            plumbers: d.plumbers?.length ? d.plumbers : globalState.plumbers,
            orders: d.orders?.length ? d.orders : globalState.orders,
            leaveRequests: d.leaveRequests?.length ? d.leaveRequests : globalState.leaveRequests,
            dailyAttendance: d.dailyAttendance?.length ? d.dailyAttendance : globalState.dailyAttendance,
            rewardLedger: d.rewardLedger?.length ? d.rewardLedger : globalState.rewardLedger,
            auditLogs: d.auditLogs?.length ? d.auditLogs : globalState.auditLogs,
            integrationEvents: d.integrationEvents?.length ? d.integrationEvents : globalState.integrationEvents,
            settings: d.settings?.company
              ? {
                  company: d.settings.company,
                  permissions: d.settings.permissions || globalState.settings.permissions,
                  policy: d.settings.policy || globalState.settings.policy,
                  notifications: d.settings.notifications || globalState.settings.notifications
                }
              : globalState.settings
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
          } catch (e) {}
          notify();
        }
      }
    } catch (e) {
      console.warn('Database sync fallback to local cache:', e);
    }
  },

  resetDemoData() {
    globalState = getInitialState();
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

    const subtotal = cart.items.reduce((acc, i) => acc + i.totalAmount, 0);
    const gstAmount = Number((subtotal * 0.18).toFixed(2));
    const totalAmount = Number((subtotal + gstAmount).toFixed(2));

    // Calculate reward based on configurable rate
    const totalReward = Number(((subtotal * rewardConfig.ratePercent) / 100).toFixed(2));
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
      status: 'PENDING_ADMIN_APPROVAL',
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
      messageBody: `FILTEC Polyplast: Order ${orderNumber} of ₹${totalAmount.toLocaleString('en-IN')} has been submitted by ${currentUser.name}. Awaiting central approval.`,
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
    return newOrder;
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

    // Update dealer purchases and available rewards
    const updatedDealers = globalState.dealers.map((d) => {
      if (d.id === existingOrder.dealerId) {
        return {
          ...d,
          totalPurchases: d.totalPurchases + existingOrder.subtotal,
          availableRewards: d.availableRewards + existingOrder.rewardDealerShare
        };
      }
      return d;
    });

    // Create reward ledger entry
    const rewardTx: RewardTransaction = {
      id: `rew-${Date.now()}`,
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
      rewardLedger: [rewardTx, ...globalState.rewardLedger],
      auditLogs: [audit, ...globalState.auditLogs],
      integrationEvents: [erpEvent, ...globalState.integrationEvents],
      whatsappMessages: [waMsg, ...globalState.whatsappMessages]
    };
    notify();
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
  },

  // Dealer allocates reward to plumber
  allocateRewardToPlumber(dealerId: string, plumberId: string, points: number) {
    const dealer = globalState.dealers.find((d) => d.id === dealerId);
    const plumber = globalState.plumbers.find((p) => p.id === plumberId);
    if (!dealer || !plumber || dealer.availableRewards < points) return false;

    const timestamp = new Date().toISOString();
    const updatedBalance = dealer.availableRewards - points;

    const updatedDealers = globalState.dealers.map((d) =>
      d.id === dealerId ? { ...d, availableRewards: updatedBalance } : d
    );

    const updatedPlumbers = globalState.plumbers.map((p) =>
      p.id === plumberId
        ? {
            ...p,
            totalAllocatedRewards: p.totalAllocatedRewards + points,
            rewardHistoryCount: p.rewardHistoryCount + 1
          }
        : p
    );

    const tx: RewardTransaction = {
      id: `rew-${Date.now()}`,
      dealerId,
      plumberId,
      plumberName: plumber.name,
      type: 'DEBIT_PLUMBER_ALLOCATION',
      amount: -points,
      balanceAfter: updatedBalance,
      description: `Reward points transfer to Plumber ${plumber.name}`,
      createdAt: timestamp
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: dealer.id,
      userName: dealer.name,
      role: 'DEALER',
      action: 'PLUMBER_REWARD_ALLOCATED',
      entityType: 'REWARD',
      entityId: tx.id,
      details: `Dealer ${dealer.name} transferred ₹${points} reward points to Plumber ${plumber.name}`,
      timestamp
    };

    const waMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      recipientPhone: plumber.phone,
      recipientName: plumber.name,
      templateName: 'plumber_reward_received',
      messageBody: `FILTEC Plumber Rewards: You have received ₹${points} reward points from ${dealer.name}! Total earned: ₹${plumber.totalAllocatedRewards + points}.`,
      sentAt: timestamp,
      status: 'DELIVERED'
    };

    globalState = {
      ...globalState,
      dealers: updatedDealers,
      plumbers: updatedPlumbers,
      rewardLedger: [tx, ...globalState.rewardLedger],
      auditLogs: [audit, ...globalState.auditLogs],
      whatsappMessages: [waMsg, ...globalState.whatsappMessages]
    };
    notify();
    return true;
  },

  // Add new plumber by dealer
  addPlumber(dealerId: string, name: string, phone: string) {
    const dealer = globalState.dealers.find((d) => d.id === dealerId);
    if (!dealer) return;

    const newPlumber: Plumber = {
      id: `plumb-${Date.now()}`,
      dealerId,
      dealerName: dealer.name,
      name,
      phone,
      status: 'ACTIVE',
      totalAllocatedRewards: 0,
      rewardHistoryCount: 0,
      dateAdded: new Date().toISOString().split('T')[0]
    };

    const updatedDealers = globalState.dealers.map((d) =>
      d.id === dealerId ? { ...d, plumbersCount: d.plumbersCount + 1 } : d
    );

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: dealer.id,
      userName: dealer.name,
      role: 'DEALER',
      action: 'PLUMBER_ONBOARDED',
      entityType: 'PLUMBER',
      entityId: newPlumber.id,
      details: `Dealer ${dealer.name} registered new plumber: ${name} (${phone})`,
      timestamp: new Date().toISOString()
    };

    globalState = {
      ...globalState,
      dealers: updatedDealers,
      plumbers: [newPlumber, ...globalState.plumbers],
      auditLogs: [audit, ...globalState.auditLogs]
    };
    notify();

    // Persist asynchronously to PostgreSQL
    if (typeof window !== 'undefined') {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_PLUMBER',
          payload: newPlumber
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
  updateRewardConfig(config: RewardConfig) {
    globalState = {
      ...globalState,
      rewardConfig: config
    };
    notify();
  },

  // Record Attendance
  recordAttendance(record: Omit<AttendanceRecord, 'id'>) {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}`
    };

    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayDateStr = new Date().toISOString().split('T')[0];

    // Update employee status
    const updatedEmployees = globalState.employees.map((e) => {
      if (e.code === record.employeeId || e.id === record.employeeId) {
        return {
          ...e,
          checkInStatus: (record.type === 'CHECK_IN' ? 'CHECKED_IN' : 'CHECKED_OUT') as 'CHECKED_IN' | 'CHECKED_OUT',
          lastCheckInTime: `${currentTimeStr} Today`,
          lastLocation: record.locationName
        };
      }
      return e;
    });

    // Synchronize to dailyAttendance for Admin visibility
    let updatedDaily = [...globalState.dailyAttendance];
    const dailyIndex = updatedDaily.findIndex(
      (d) => d.employeeCode === record.employeeId || d.employeeId === record.employeeId
    );

    const verificationPoint = {
      timestamp: new Date().toISOString(),
      time: currentTimeStr,
      latitude: record.latitude,
      longitude: record.longitude,
      locationName: record.locationName,
      photoUrl: record.photoUrl,
      verified: true
    };

    if (dailyIndex >= 0) {
      const current = updatedDaily[dailyIndex];
      updatedDaily[dailyIndex] = {
        ...current,
        status: record.type === 'CHECK_IN' ? 'ACTIVE_ON_FIELD' : 'CHECKED_OUT',
        ...(record.type === 'CHECK_IN'
          ? { checkIn: verificationPoint }
          : { checkOut: verificationPoint, hoursWorked: current.hoursWorked || 8.2 })
      };
    } else {
      const emp = globalState.employees.find((e) => e.code === record.employeeId || e.id === record.employeeId);
      updatedDaily.unshift({
        id: `att-sum-${Date.now()}`,
        date: todayDateStr,
        employeeId: emp?.id || record.employeeId,
        employeeCode: emp?.code || record.employeeId,
        employeeName: record.employeeName,
        territory: emp?.territory || 'Field Territory',
        phone: emp?.phone || '+91 94280 44556',
        status: record.type === 'CHECK_IN' ? 'ACTIVE_ON_FIELD' : 'CHECKED_OUT',
        ...(record.type === 'CHECK_IN' ? { checkIn: verificationPoint } : { checkOut: verificationPoint }),
        hoursWorked: record.type === 'CHECK_OUT' ? 8.0 : 0,
        dealerVisitsCount: 1,
        ordersCount: 0
      });
    }

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: record.employeeId,
      userName: record.employeeName,
      role: 'EMPLOYEE',
      action: `ATTENDANCE_${record.type}`,
      entityType: 'ATTENDANCE',
      entityId: newRecord.id,
      details: `${record.employeeName} recorded ${record.type} at ${record.locationName}`,
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
  },

  updateEmployee(employeeId: string, data: Partial<Employee>): Employee | null {
    const empIndex = globalState.employees.findIndex((e) => e.id === employeeId || e.code === employeeId);
    if (empIndex === -1) return null;

    const current = globalState.employees[empIndex];
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

    globalState = {
      ...globalState,
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
    const updatedDealer: Dealer = {
      ...current,
      ...data
    };

    const updatedDealers = [...globalState.dealers];
    updatedDealers[dIndex] = updatedDealer;

    const timestamp = new Date().toISOString();

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: globalState.currentUser.id,
      userName: globalState.currentUser.name,
      role: globalState.currentUser.role,
      action: 'DEALER_UPDATED',
      entityType: 'DEALER',
      entityId: current.id,
      details: `Updated dealer account for ${updatedDealer.name} (${updatedDealer.code}): Credit Limit: ₹${updatedDealer.creditLimit.toLocaleString('en-IN')}, Phone: ${updatedDealer.phone}, City: ${updatedDealer.city}, Tier: ${updatedDealer.tier}`,
      timestamp
    };

    const erpEvent: IntegrationEvent = {
      id: `erp-${Date.now()}`,
      type: 'ERP_SYNC',
      title: `Sync Dealer Master: ${updatedDealer.code}`,
      targetId: updatedDealer.code,
      status: 'SUCCESS',
      payloadSummary: `Updated ERP Commercial Master for ${updatedDealer.name} (${updatedDealer.code}). Credit Limit: ₹${updatedDealer.creditLimit.toLocaleString('en-IN')}, Tier: ${updatedDealer.tier}`,
      timestamp,
      latencyMs: 125
    };

    globalState = {
      ...globalState,
      dealers: updatedDealers,
      auditLogs: [audit, ...globalState.auditLogs],
      integrationEvents: [erpEvent, ...globalState.integrationEvents]
    };
    notify();
    return updatedDealer;
  },

  onboardDealer(data: {
    name: string;
    ownerName: string;
    phone: string;
    city: string;
    state?: string;
    address: string;
    creditLimit?: number;
    tier?: 'Platinum' | 'Gold' | 'Silver';
    code?: string;
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

    const newDealer: Dealer = {
      id: newId,
      code: dealerCode,
      name: data.name,
      ownerName: data.ownerName,
      phone: data.phone,
      city: data.city,
      state: data.state || 'Odisha',
      address: data.address,
      creditLimit: Number(data.creditLimit) || 300000,
      outstandingBalance: 0,
      tier: data.tier || 'Silver',
      totalPurchases: 0,
      availableRewards: 0,
      plumbersCount: 0
    };

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
      payloadSummary: `Created ERP Customer Account for ${data.name} (${dealerCode}). Credit Limit: ₹${newDealer.creditLimit}`,
      timestamp,
      latencyMs: 130
    };

    globalState = {
      ...globalState,
      dealers: [newDealer, ...globalState.dealers],
      auditLogs: [audit, ...globalState.auditLogs],
      integrationEvents: [erpEvent, ...globalState.integrationEvents]
    };
    notify();
    return newDealer;
  },

  updateSettings(data: Partial<AppSettings>): AppSettings {
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
