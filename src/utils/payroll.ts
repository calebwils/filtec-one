import { Employee, DailyAttendanceSummary, LeaveRequest } from '@/types';

export interface EmployeePayrollCalculation {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  territory: string;
  phone: string;
  month: string; // YYYY-MM
  monthLabel: string; // e.g. "September 2026"
  calendarDays: number;
  totalWorkingDays: number; // Mon-Sat working days in month
  elapsedWorkingDays: number;
  presentDays: number; // Days punched
  approvedLeaves: number; // Approved leave days
  payableDays: number; // min(totalWorkingDays, presentDays + approvedLeaves)
  absentDays: number; // max(0, totalWorkingDays - payableDays)
  attendancePercentage: number;
  baseSalary: number; // Monthly Base Salary Rate (₹)
  perDayRate: number; // baseSalary / totalWorkingDays
  earnedBaseSalary: number; // Math.round(perDayRate * payableDays)
  lossOfPayDeduction: number; // Math.round(perDayRate * absentDays)
  fieldAllowance: number; // Optional allowance
  grossEarnings: number;
  totalDeductions: number;
  netPayableSalary: number;
  amountInWords: string;
}

/**
 * Check if a date (YYYY-MM-DD) is a standard working day (Mon–Sat, excluding Sunday)
 */
export function isWorkingDay(dateStr: string): boolean {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  return dow >= 1 && dow <= 6; // Mon=1 … Sat=6
}

/**
 * Get total working days in a given YYYY-MM month
 */
export function getWorkingDaysInMonth(yyyyMM: string): {
  totalWorkingDays: number;
  calendarDays: number;
  workingDateStrings: string[];
} {
  const [yearStr, monthStr] = yyyyMM.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const calendarDays = new Date(year, month, 0).getDate();

  const workingDateStrings: string[] = [];
  for (let day = 1; day <= calendarDays; day++) {
    const dStr = `${yyyyMM}-${String(day).padStart(2, '0')}`;
    if (isWorkingDay(dStr)) {
      workingDateStrings.push(dStr);
    }
  }

  return {
    totalWorkingDays: workingDateStrings.length,
    calendarDays,
    workingDateStrings
  };
}

/**
 * Format YYYY-MM to human-readable month name e.g. "September 2026"
 */
export function formatMonthLabel(yyyyMM: string): string {
  try {
    const [year, month] = yyyyMM.split('-');
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } catch {
    return yyyyMM;
  }
}

/**
 * Convert numerical INR amount to Indian Currency Words
 * e.g. 28500 -> "Twenty-Eight Thousand Five Hundred Rupees Only"
 */
export function numberToWordsINR(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  if (num < 0) return 'Minus ' + numberToWordsINR(-num);

  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        ' Hundred' +
        (n % 100 === 0 ? '' : ' and ' + inWords(n % 100))
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '')
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        ' Lakh' +
        (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '')
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      ' Crore' +
      (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '')
    );
  }

  const rounded = Math.round(num);
  return `${inWords(rounded).trim()} Rupees Only`;
}

/**
 * Calculate complete monthly payroll for an employee based on GPS attendance & approved leaves
 */
export function calculateEmployeePayroll(
  emp: Employee,
  monthYYYYMM: string,
  dailyAttendance: DailyAttendanceSummary[],
  leaveRequests: LeaveRequest[] = []
): EmployeePayrollCalculation {
  const { totalWorkingDays, calendarDays, workingDateStrings } = getWorkingDaysInMonth(monthYYYYMM);
  const todayStr = new Date().toISOString().split('T')[0];

  const monthAttendance = dailyAttendance.filter(
    (d) =>
      d.date.startsWith(monthYYYYMM) &&
      (d.employeeCode === emp.code || d.employeeId === emp.id || d.employeeName === emp.name)
  );

  const attMap = new Map<string, DailyAttendanceSummary>();
  for (const r of monthAttendance) {
    attMap.set(r.date, r);
  }

  // Count approved paid leaves in this month
  const approvedLeavesList = leaveRequests.filter(
    (l) =>
      l.status === 'APPROVED' &&
      (l.employeeId === emp.id || l.employeeName === emp.name) &&
      (l.startDate.startsWith(monthYYYYMM) || l.endDate.startsWith(monthYYYYMM))
  );

  let approvedLeaveDaysInMonth = 0;
  for (const leave of approvedLeavesList) {
    // Count days of this leave that fall on working days of this month
    const startD = new Date(leave.startDate + 'T00:00:00');
    const endD = new Date(leave.endDate + 'T00:00:00');
    const cur = new Date(startD);
    while (cur <= endD) {
      const dStr = cur.toISOString().split('T')[0];
      if (dStr.startsWith(monthYYYYMM) && isWorkingDay(dStr)) {
        approvedLeaveDaysInMonth++;
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  let presentDays = 0;
  let elapsedWorkingDays = 0;

  for (const wDate of workingDateStrings) {
    if (wDate <= todayStr) {
      elapsedWorkingDays++;
    }
    const rec = attMap.get(wDate);
    if (rec && (rec.status === 'ACTIVE_ON_FIELD' || rec.status === 'CHECKED_OUT' || rec.status === 'PRESENT')) {
      presentDays++;
    }
  }

  // Cap payable days to total working days
  const payableDays = Math.min(totalWorkingDays, presentDays + approvedLeaveDaysInMonth);
  const absentDays = Math.max(0, totalWorkingDays - payableDays);

  const attendancePercentage = totalWorkingDays > 0 ? Math.round((payableDays / totalWorkingDays) * 100) : 0;

  const baseSalary = Number(emp.baseSalary) || 0;
  const perDayRate = totalWorkingDays > 0 ? baseSalary / totalWorkingDays : 0;
  const earnedBaseSalary = baseSalary > 0 ? Math.round(perDayRate * payableDays) : 0;
  const lossOfPayDeduction = baseSalary > 0 ? Math.round(perDayRate * absentDays) : 0;

  const fieldAllowance = 0; // Configurable per diem if needed
  const grossEarnings = baseSalary;
  const totalDeductions = lossOfPayDeduction;
  const netPayableSalary = earnedBaseSalary + fieldAllowance;

  return {
    employeeId: emp.id,
    employeeCode: emp.code,
    employeeName: emp.name,
    designation: emp.designation || 'Field Representative',
    territory: emp.territory || 'Central Operations',
    phone: emp.phone,
    month: monthYYYYMM,
    monthLabel: formatMonthLabel(monthYYYYMM),
    calendarDays,
    totalWorkingDays,
    elapsedWorkingDays,
    presentDays,
    approvedLeaves: approvedLeaveDaysInMonth,
    payableDays,
    absentDays,
    attendancePercentage,
    baseSalary,
    perDayRate: Math.round(perDayRate),
    earnedBaseSalary,
    lossOfPayDeduction,
    fieldAllowance,
    grossEarnings,
    totalDeductions,
    netPayableSalary,
    amountInWords: numberToWordsINR(netPayableSalary)
  };
}
