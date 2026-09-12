import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { CATALOGUE_PRODUCTS } from '../src/data/catalogueSeed';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_DEALERS,
  INITIAL_EMPLOYEES,
  INITIAL_INTEGRATION_EVENTS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_ORDERS,
  INITIAL_PLUMBERS,
  INITIAL_REWARD_LEDGER,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_DAILY_ATTENDANCE
} from '../src/data/initialSeed';

import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/filtec_pretech1';
const pool = new Pool({ connectionString, max: 20 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log('🌱 Starting Filtec-One PostgreSQL database seed...');

  // 1. App Settings
  console.log('⚙️ Seeding App Settings...');
  const settingsEntries = [
    { key: 'company', value: JSON.stringify(INITIAL_SETTINGS.company) },
    { key: 'permissions', value: JSON.stringify(INITIAL_SETTINGS.permissions) },
    { key: 'policy', value: JSON.stringify(INITIAL_SETTINGS.policy) },
    { key: 'notifications', value: JSON.stringify(INITIAL_SETTINGS.notifications) },
    { key: 'rewardConfig', value: JSON.stringify({ ratePercent: 1.0, dealerSharePercent: 75, plumberSharePercent: 25 }) }
  ];

  for (const s of settingsEntries) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value }
    });
  }

  // 2. Products & Variants (99 items from catalogue)
  console.log(`📦 Seeding ${CATALOGUE_PRODUCTS.length} Products & Variants from official catalogue...`);
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});

  for (const p of CATALOGUE_PRODUCTS) {
    await prisma.product.create({
      data: {
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
        material: p.material,
        standard: p.standard,
        sizeMm: p.sizeMm || null,
        sizeInch: p.sizeInch || null,
        application: p.application,
        moq: p.moq || 1,
        packingSummary: p.packingSummary || '',
        tags: JSON.stringify(p.tags || []),
        inStock: p.inStock ?? true,
        stockStatus: p.stockStatus || 'IN_STOCK',
        imageUrl: p.imageUrl || null,
        isArchived: p.isArchived ?? false,
        variants: {
          create: (p.variants || []).map((v) => ({
            id: v.id,
            length: v.length || null,
            size: v.size || null,
            mrp: v.mrp,
            packingQty: v.packingQty || 1,
            packingUnit: v.packingUnit || 'Pcs',
            inStock: v.inStock ?? true
          }))
        }
      }
    });
  }

  // 3. Employees (including Samir as Admin)
  console.log(`👥 Seeding ${INITIAL_EMPLOYEES.length} Employees...`);
  for (const emp of INITIAL_EMPLOYEES) {
    await prisma.employee.upsert({
      where: { code: emp.code },
      update: {
        name: emp.name,
        phone: emp.phone,
        email: emp.email || null,
        designation: emp.designation || null,
        territory: emp.territory || null,
        targetMonthly: emp.targetMonthly || 0,
        currentMonthSales: emp.currentMonthSales || 0,
        activeOrdersCount: emp.activeOrdersCount || 0,
        checkInStatus: emp.checkInStatus || 'CHECKED_OUT',
        lastCheckInTime: emp.lastCheckInTime || null,
        lastLocation: emp.lastLocation || null,
        baseSalary: emp.baseSalary || 0,
        assignedDealerIds: JSON.stringify(emp.assignedDealerIds || []),
        dateOfJoining: emp.dateOfJoining || null,
        remarks: emp.remarks || null,
        systemRole: emp.systemRole || 'EMPLOYEE',
        allowedPages: JSON.stringify(emp.allowedPages || [])
      },
      create: {
        id: emp.id,
        code: emp.code,
        name: emp.name,
        phone: emp.phone,
        email: emp.email || null,
        designation: emp.designation || null,
        territory: emp.territory || null,
        targetMonthly: emp.targetMonthly || 0,
        currentMonthSales: emp.currentMonthSales || 0,
        activeOrdersCount: emp.activeOrdersCount || 0,
        checkInStatus: emp.checkInStatus || 'CHECKED_OUT',
        lastCheckInTime: emp.lastCheckInTime || null,
        lastLocation: emp.lastLocation || null,
        baseSalary: emp.baseSalary || 0,
        assignedDealerIds: JSON.stringify(emp.assignedDealerIds || []),
        dateOfJoining: emp.dateOfJoining || null,
        remarks: emp.remarks || null,
        systemRole: emp.systemRole || 'EMPLOYEE',
        allowedPages: JSON.stringify(emp.allowedPages || [])
      }
    });
  }

  // 4. Users
  console.log(`🔑 Seeding ${INITIAL_USERS.length} Users...`);
  for (const u of INITIAL_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        phone: u.phone,
        role: u.role,
        avatarUrl: u.avatarUrl || null,
        department: u.department || null,
        employeeCode: u.employeeCode || null,
        dealerId: u.dealerId || null,
        allowedPages: JSON.stringify(u.allowedPages || [])
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatarUrl: u.avatarUrl || null,
        department: u.department || null,
        employeeCode: u.employeeCode || null,
        dealerId: u.dealerId || null,
        allowedPages: JSON.stringify(u.allowedPages || [])
      }
    });
  }

  // 5. Dealers
  console.log(`🏢 Seeding ${INITIAL_DEALERS.length} Dealers...`);
  for (const d of INITIAL_DEALERS) {
    await prisma.dealer.upsert({
      where: { code: d.code },
      update: {
        name: d.name,
        ownerName: d.ownerName,
        phone: d.phone,
        city: d.city,
        state: d.state,
        address: d.address,
        creditLimit: d.creditLimit,
        outstandingBalance: d.outstandingBalance,
        tier: d.tier,
        totalPurchases: d.totalPurchases,
        availableRewards: d.availableRewards,
        plumbersCount: d.plumbersCount
      },
      create: {
        id: d.id,
        code: d.code,
        name: d.name,
        ownerName: d.ownerName,
        phone: d.phone,
        city: d.city,
        state: d.state,
        address: d.address,
        creditLimit: d.creditLimit,
        outstandingBalance: d.outstandingBalance,
        tier: d.tier,
        totalPurchases: d.totalPurchases,
        availableRewards: d.availableRewards,
        plumbersCount: d.plumbersCount
      }
    });
  }

  // 6. Plumbers
  console.log(`🔧 Seeding ${INITIAL_PLUMBERS.length} Plumbers...`);
  for (const pl of INITIAL_PLUMBERS) {
    await prisma.plumber.upsert({
      where: { id: pl.id },
      update: {
        dealerId: pl.dealerId,
        dealerName: pl.dealerName,
        name: pl.name,
        phone: pl.phone,
        status: pl.status,
        totalAllocatedRewards: pl.totalAllocatedRewards,
        rewardHistoryCount: pl.rewardHistoryCount,
        dateAdded: pl.dateAdded
      },
      create: {
        id: pl.id,
        dealerId: pl.dealerId,
        dealerName: pl.dealerName,
        name: pl.name,
        phone: pl.phone,
        status: pl.status,
        totalAllocatedRewards: pl.totalAllocatedRewards,
        rewardHistoryCount: pl.rewardHistoryCount,
        dateAdded: pl.dateAdded
      }
    });
  }

  // 7. Orders
  console.log(`🛒 Seeding ${INITIAL_ORDERS.length} Orders...`);
  for (const o of INITIAL_ORDERS) {
    await prisma.order.upsert({
      where: { orderNumber: o.orderNumber },
      update: {
        status: o.status,
        subtotal: o.subtotal,
        gstAmount: o.gstAmount,
        totalAmount: o.totalAmount
      },
      create: {
        id: o.id,
        orderNumber: o.orderNumber,
        employeeId: o.employeeId,
        employeeName: o.employeeName,
        dealerId: o.dealerId,
        dealerName: o.dealerName,
        dealerPhone: o.dealerPhone,
        dealerCity: o.dealerCity,
        subtotal: o.subtotal,
        gstAmount: o.gstAmount,
        totalAmount: o.totalAmount,
        status: o.status,
        notes: o.notes || null,
        adminNotes: o.adminNotes || null,
        rewardEstimated: o.rewardEstimated || 0,
        rewardDealerShare: o.rewardDealerShare || 0,
        rewardPlumberShare: o.rewardPlumberShare || 0,
        submittedAt: o.submittedAt || null,
        approvedAt: o.approvedAt || null,
        items: {
          create: o.items.map((it) => ({
            id: it.id,
            productId: it.productId,
            productCode: it.productCode,
            productName: it.productName,
            variantId: it.variantId,
            variantDescription: it.variantDescription,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            packingQty: it.packingQty,
            packingUnit: it.packingUnit,
            totalAmount: it.totalAmount
          }))
        }
      }
    });
  }

  // 8. Leave Requests
  console.log(`🏖️ Seeding ${INITIAL_LEAVE_REQUESTS.length} Leave Requests...`);
  for (const lr of INITIAL_LEAVE_REQUESTS) {
    await prisma.leaveRequest.upsert({
      where: { id: lr.id },
      update: { status: lr.status },
      create: {
        id: lr.id,
        employeeId: lr.employeeId,
        employeeName: lr.employeeName,
        leaveType: lr.leaveType,
        startDate: lr.startDate,
        endDate: lr.endDate,
        daysCount: lr.daysCount,
        reason: lr.reason,
        status: lr.status,
        isHalfDay: lr.isHalfDay ?? false,
        contactNumber: lr.contactNumber || null,
        rejectionReason: lr.rejectionReason || null
      }
    });
  }

  // 9. Daily Attendance Summaries
  console.log(`📋 Seeding ${INITIAL_DAILY_ATTENDANCE.length} Daily Attendance Records...`);
  for (const da of INITIAL_DAILY_ATTENDANCE) {
    await prisma.dailyAttendanceSummary.upsert({
      where: { id: da.id },
      update: {
        status: da.status,
        hoursWorked: da.hoursWorked || 0
      },
      create: {
        id: da.id,
        date: da.date,
        employeeId: da.employeeId,
        employeeCode: da.employeeCode,
        employeeName: da.employeeName,
        territory: da.territory,
        phone: da.phone,
        status: da.status,
        checkInJson: da.checkIn ? JSON.stringify(da.checkIn) : null,
        checkOutJson: da.checkOut ? JSON.stringify(da.checkOut) : null,
        hoursWorked: da.hoursWorked || 0,
        dealerVisitsCount: da.dealerVisitsCount || 0,
        ordersCount: da.ordersCount || 0,
        notes: da.notes || null
      }
    });
  }

  // 10. Reward Ledger
  console.log(`🎁 Seeding ${INITIAL_REWARD_LEDGER.length} Reward Transactions...`);
  for (const rt of INITIAL_REWARD_LEDGER) {
    await prisma.rewardTransaction.upsert({
      where: { id: rt.id },
      update: { amount: rt.amount, balanceAfter: rt.balanceAfter },
      create: {
        id: rt.id,
        dealerId: rt.dealerId,
        orderId: rt.orderId || null,
        orderNumber: rt.orderNumber || null,
        plumberId: rt.plumberId || null,
        plumberName: rt.plumberName || null,
        type: rt.type,
        amount: rt.amount,
        balanceAfter: rt.balanceAfter,
        description: rt.description
      }
    });
  }

  // 11. Audit Logs
  console.log(`📜 Seeding ${INITIAL_AUDIT_LOGS.length} Audit Logs...`);
  for (const al of INITIAL_AUDIT_LOGS) {
    await prisma.auditLog.upsert({
      where: { id: al.id },
      update: { details: al.details },
      create: {
        id: al.id,
        userId: al.userId,
        userName: al.userName,
        role: al.role,
        action: al.action,
        entityType: al.entityType,
        entityId: al.entityId,
        details: al.details
      }
    });
  }

  // 12. Integration Events
  console.log(`🔗 Seeding ${INITIAL_INTEGRATION_EVENTS.length} Integration Events...`);
  for (const ie of INITIAL_INTEGRATION_EVENTS) {
    await prisma.integrationEvent.upsert({
      where: { id: ie.id },
      update: { status: ie.status },
      create: {
        id: ie.id,
        type: ie.type,
        title: ie.title,
        targetId: ie.targetId,
        status: ie.status,
        payloadSummary: ie.payloadSummary,
        latencyMs: ie.latencyMs || null
      }
    });
  }

  console.log('✅ Filtec-One PostgreSQL database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

