import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Starting clean up of test attendance, orders, and rewards for live launch...');

  // 1. Delete Order Items and Orders
  const deletedOrderItems = await prisma.orderItem.deleteMany({});
  console.log(`✓ Deleted ${deletedOrderItems.count} OrderItems.`);

  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✓ Deleted ${deletedOrders.count} Orders.`);

  // 2. Delete Attendance Records and Daily Attendance Summaries
  const deletedAttRecords = await prisma.attendanceRecord.deleteMany({});
  console.log(`✓ Deleted ${deletedAttRecords.count} AttendanceRecords.`);

  const deletedDailyAtt = await prisma.dailyAttendanceSummary.deleteMany({});
  console.log(`✓ Deleted ${deletedDailyAtt.count} DailyAttendanceSummaries.`);

  // 3. Delete Reward Transactions
  const deletedRewards = await prisma.rewardTransaction.deleteMany({});
  console.log(`✓ Deleted ${deletedRewards.count} RewardTransactions.`);

  // 4. Delete Audit Logs and Integration Events
  const deletedAuditLogs = await prisma.auditLog.deleteMany({});
  console.log(`✓ Deleted ${deletedAuditLogs.count} AuditLogs.`);

  const deletedIntegrationEvents = await prisma.integrationEvent.deleteMany({});
  console.log(`✓ Deleted ${deletedIntegrationEvents.count} IntegrationEvents.`);

  // 5. Reset Dealer Purchase Totals & Rewards to 0
  const resetDealers = await prisma.dealer.updateMany({
    data: {
      totalPurchases: 0,
      availableRewards: 0,
      pendingPlumberRewards: 0
    }
  });
  console.log(`✓ Reset purchase and reward balances for ${resetDealers.count} Dealers to 0.`);

  // 6. Reset Employee Attendance status
  const resetEmployees = await prisma.employee.updateMany({
    data: {
      checkInStatus: 'CHECKED_OUT',
      lastCheckInTime: null,
      lastLocation: null,
      currentMonthSales: 0,
      activeOrdersCount: 0
    }
  });
  console.log(`✓ Reset checkInStatus and location for ${resetEmployees.count} Employees to clean CHECKED_OUT state.`);

  // 7. Reset Plumber Rewards
  const resetPlumbers = await prisma.plumber.updateMany({
    data: {
      totalAllocatedRewards: 0,
      rewardHistoryCount: 0
    }
  });
  console.log(`✓ Reset rewards for ${resetPlumbers.count} Plumbers to 0.`);

  console.log('✨ Cleanup complete! Database is 100% clean and ready for real live records.');
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
