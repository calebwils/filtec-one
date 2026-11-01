import { prisma } from './prisma';
import { getAttendanceRetentionCutoff } from '@/utils/attendanceRetention';

export { getAttendanceRetentionCutoff };

/**
 * Prunes attendance records older than 1 year (older than the 12th previous calendar month).
 * Safe and idempotent.
 */
export async function pruneExpiredAttendanceRecords(): Promise<{
  deletedRecords: number;
  deletedSummaries: number;
}> {
  try {
    const { cutoffDate, cutoffDateStr } = getAttendanceRetentionCutoff();

    const [recResult, sumResult] = await Promise.all([
      prisma.attendanceRecord.deleteMany({
        where: { timestamp: { lt: cutoffDate } }
      }),
      prisma.dailyAttendanceSummary.deleteMany({
        where: { date: { lt: cutoffDateStr } }
      })
    ]);

    return {
      deletedRecords: recResult.count,
      deletedSummaries: sumResult.count
    };
  } catch (err) {
    console.warn('Failed to prune expired attendance records:', err);
    return { deletedRecords: 0, deletedSummaries: 0 };
  }
}
