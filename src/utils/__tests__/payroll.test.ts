import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isWorkingDay,
  getWorkingDaysInMonth,
  calculateEmployeePayroll
} from '../payroll.ts';
import type { Employee, DailyAttendanceSummary } from '../../types/index.ts';

describe('Payroll Calculation Engine', () => {
  it('correctly identifies working days (Mon-Sat) vs Sunday', () => {
    // 2026-10-04 was a Sunday
    assert.equal(isWorkingDay('2026-10-04'), false);
    // 2026-10-05 was a Monday
    assert.equal(isWorkingDay('2026-10-05'), true);
    // 2026-10-10 was a Saturday
    assert.equal(isWorkingDay('2026-10-10'), true);
  });

  it('calculates calendar days and working days in a month', () => {
    const result = getWorkingDaysInMonth('2026-09');
    assert.equal(result.calendarDays, 30);
    assert.ok(result.totalWorkingDays >= 24 && result.totalWorkingDays <= 26);
  });

  it('calculates full month salary when employee is present all working days', () => {
    const mockEmployee: Employee = {
      id: 'emp-test-1',
      code: 'FPPL/OD-999',
      name: 'Rohan Sharma',
      phone: '+91 98765 43210',
      systemRole: 'EMPLOYEE',
      baseSalary: 30000,
      activeOrdersCount: 0,
      checkInStatus: 'CHECKED_OUT',
      currentMonthSales: 0,
      targetMonthly: 500000,
      allowedPages: [],
      assignedDealerIds: [],
      mustChangePassword: false
    };

    const monthInfo = getWorkingDaysInMonth('2026-09');
    const mockAttendance: DailyAttendanceSummary[] = monthInfo.workingDateStrings.map((date, idx) => ({
      id: `att-${idx}`,
      date,
      employeeId: mockEmployee.id,
      employeeCode: mockEmployee.code,
      employeeName: mockEmployee.name,
      territory: 'Bhubaneswar',
      phone: mockEmployee.phone,
      status: 'PRESENT',
      hoursWorked: 8,
      dealerVisitsCount: 3,
      ordersCount: 1
    }));

    const payroll = calculateEmployeePayroll(mockEmployee, '2026-09', mockAttendance, []);

    assert.equal(payroll.presentDays, monthInfo.totalWorkingDays);
    assert.equal(payroll.absentDays, 0);
    assert.equal(payroll.lossOfPayDeduction, 0);
    assert.equal(payroll.earnedBaseSalary, 30000);
    assert.equal(payroll.netPayableSalary, 30000);
  });

  it('deducts loss of pay proportionally for unexcused absences', () => {
    const mockEmployee: Employee = {
      id: 'emp-test-2',
      code: 'FPPL/OD-998',
      name: 'Amit Kumar',
      phone: '+91 98765 43211',
      systemRole: 'EMPLOYEE',
      baseSalary: 26000,
      activeOrdersCount: 0,
      checkInStatus: 'CHECKED_OUT',
      currentMonthSales: 0,
      targetMonthly: 400000,
      allowedPages: [],
      assignedDealerIds: [],
      mustChangePassword: false
    };

    // Employee attends only 10 days out of the working days
    const monthInfo = getWorkingDaysInMonth('2026-09');
    const mockAttendance: DailyAttendanceSummary[] = monthInfo.workingDateStrings.slice(0, 10).map((date, idx) => ({
      id: `att-${idx}`,
      date,
      employeeId: mockEmployee.id,
      employeeCode: mockEmployee.code,
      employeeName: mockEmployee.name,
      territory: 'Cuttack',
      phone: mockEmployee.phone,
      status: 'PRESENT',
      hoursWorked: 8,
      dealerVisitsCount: 2,
      ordersCount: 1
    }));

    const payroll = calculateEmployeePayroll(mockEmployee, '2026-09', mockAttendance, []);

    assert.equal(payroll.presentDays, 10);
    assert.ok(payroll.absentDays > 0);
    assert.ok(payroll.lossOfPayDeduction > 0);
    assert.ok(payroll.netPayableSalary < 26000);
    assert.equal(payroll.netPayableSalary, payroll.earnedBaseSalary);
  });
});
