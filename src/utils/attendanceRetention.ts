/**
 * Attendance 1-Year Retention Policy:
 * Attendance records (both raw GPS punch AttendanceRecord and DailyAttendanceSummary)
 * remain available for 1 full year (12 calendar months).
 *
 * As each 13th month is entered, data older than 12 months starts deleting one month at a time.
 *
 * Example:
 * If current date is in November 2026:
 * The cutoff is 2025-11-01 (12 months before current month).
 * Records from November 2025 through November 2026 (1 full year + current month = 13 months) remain available.
 * Records before November 2025 (Month 14+) are deleted.
 * Next month (December 2026), records before December 2025 are deleted (deleting 1 month every 13th month).
 */
export function getAttendanceRetentionCutoff(): { cutoffDate: Date; cutoffDateStr: string } {
  const now = new Date();
  // First day of the month 12 months ago (1 full year)
  const cutoffDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 12, 1, 0, 0, 0, 0));
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
  return { cutoffDate, cutoffDateStr };
}

/**
 * Checks if a given timestamp or date string is within the 1-year retention window.
 */
export function isWithinRetentionWindow(dateOrTimestamp: string | Date | undefined | null): boolean {
  if (!dateOrTimestamp) return false;
  const { cutoffDateStr } = getAttendanceRetentionCutoff();
  const dateStr = typeof dateOrTimestamp === 'string'
    ? dateOrTimestamp.split('T')[0]
    : dateOrTimestamp.toISOString().split('T')[0];
  return dateStr >= cutoffDateStr;
}

