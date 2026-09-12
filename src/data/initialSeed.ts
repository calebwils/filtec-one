import {
  Dealer,
  Employee,
  Order,
  Plumber,
  RewardConfig,
  RewardTransaction,
  User,
  AuditLog,
  IntegrationEvent,
  DailyAttendanceSummary,
  WeeklyAttendanceSummary,
  MonthlyAttendanceSummary,
  LeaveRequest,
  AppSettings
} from '@/types';

export interface PageOption {
  path: string;
  label: string;
  category: string;
  description: string;
}

export const ADMIN_PAGE_OPTIONS: PageOption[] = [
  { path: '/admin', label: 'Control Center', category: 'Executive', description: 'Real-time overview, KPI cards & alerts' },
  { path: '/admin/orders', label: 'Order Approvals', category: 'Commercial', description: 'Pending dealer orders & pricing review' },
  { path: '/admin/attendance', label: 'Attendance & GPS', category: 'Workforce', description: 'Live location punch & field staff tracking' },
  { path: '/admin/catalogue', label: 'Catalogue & Stock', category: 'Inventory', description: 'F-1 to F-99 product master & availability' },
  { path: '/admin/dealers', label: 'Dealer Directory', category: 'Distribution', description: 'Distributor accounts, credit limits & aging' },
  { path: '/admin/employees', label: 'Staff & Leave Approvals', category: 'Workforce', description: 'Employee roster, targets & leave decisions' },
  { path: '/admin/rewards', label: 'Plumber Rewards', category: 'Loyalty', description: 'QR coupons, points balance & redemptions' },
  { path: '/admin/integrations', label: 'ERP & Integrations', category: 'Systems', description: 'Billing sync daemon & WhatsApp webhooks' },
  { path: '/admin/audit', label: 'Audit Trail', category: 'Compliance', description: 'Immutable operations ledger & logs' },
  { path: '/admin/settings', label: 'Operational Settings', category: 'Governance', description: 'Roles, plant profile, quotas & automations' }
];

export const EMPLOYEE_PAGE_OPTIONS: PageOption[] = [
  { path: '/employee', label: 'Today Dashboard', category: 'Field Ops', description: 'Daily agenda, quick actions & targets' },
  { path: '/employee/dealers', label: 'Dealer Directory', category: 'Field Ops', description: 'Assigned distributors & contact updates' },
  { path: '/employee/catalogue', label: 'Product Catalogue', category: 'Sales Tools', description: 'Browse specifications, prices & stock' },
  { path: '/employee/orders', label: 'Orders & Booking', category: 'Sales Tools', description: 'Create and track dealer wholesale orders' },
  { path: '/employee/attendance', label: 'GPS Punch & Leaves', category: 'Self-Service', description: 'Punch in/out with selfie & apply for leave' }
];

export const ALL_ADMIN_PAGES = ADMIN_PAGE_OPTIONS.map((p) => p.path);
export const ALL_EMPLOYEE_PAGES = EMPLOYEE_PAGE_OPTIONS.map((p) => p.path);

export const ALL_DEALER_PAGES = [
  '/dealer',
  '/dealer/catalogue',
  '/dealer/orders',
  '/dealer/rewards',
  '/dealer/plumbers',
  '/dealer/invoices'
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-samir',
    name: 'Samir',
    email: 'samir@filtec.in',
    phone: '+91 98000 12345',
    role: 'ADMIN',
    department: 'Operations Administrator',
    allowedPages: ALL_ADMIN_PAGES
  },
  {
    id: 'user-admin',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@filtec.in',
    phone: '+91 98250 11223',
    role: 'ADMIN',
    department: 'Operations & Sales Leadership',
    allowedPages: ALL_ADMIN_PAGES
  },
  {
    id: 'user-employee',
    name: 'Purna Chandra Nayak',
    email: 'purna.nayak@filtec.in',
    phone: '9437860619',
    role: 'EMPLOYEE',
    department: 'Sr. Marketing Executive',
    employeeCode: 'FPPL/OD-002',
    allowedPages: ALL_EMPLOYEE_PAGES
  },
  {
    id: 'user-dealer',
    name: 'Mukesh Agarwal',
    email: 'mukesh@shreebalajisanitary.com',
    phone: '+91 98980 99881',
    role: 'DEALER',
    dealerId: 'dlr-1',
    allowedPages: ALL_DEALER_PAGES
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-admin-samir',
    code: 'FPPL/ADM-001',
    name: 'Samir',
    designation: 'Operations Admin',
    systemRole: 'ADMIN',
    phone: '+91 98000 12345',
    email: 'samir@filtec.in',
    territory: 'All Hubs & Branches',
    targetMonthly: 0,
    currentMonthSales: 0,
    activeOrdersCount: 0,
    checkInStatus: 'CHECKED_IN',
    lastCheckInTime: '08:30 AM Today',
    lastLocation: 'Bhubaneswar Operations Center',
    remarks: 'Operations Administrator with Full System Privileges',
    allowedPages: ALL_ADMIN_PAGES
  },
  {
    id: 'emp-1',
    code: 'FPPL/OD-002',
    name: 'Purna Chandra Nayak',
    designation: 'Sr. Marketing Executive',
    systemRole: 'EMPLOYEE',
    phone: '9437860619',
    territory: '(-)',
    targetMonthly: 0,
    currentMonthSales: 0,
    activeOrdersCount: 0,
    checkInStatus: 'CHECKED_IN',
    lastCheckInTime: '09:15 AM Today',
    lastLocation: '(-)',
    remarks: '(-)',
    allowedPages: ALL_EMPLOYEE_PAGES
  },
  {
    id: 'emp-2',
    code: 'FPPL/OD-004',
    name: 'Ramesh sharma',
    designation: 'Sr. Office Executive',
    systemRole: 'EMPLOYEE',
    phone: '9437860479',
    territory: '(-)',
    targetMonthly: 0,
    currentMonthSales: 0,
    activeOrdersCount: 0,
    checkInStatus: 'CHECKED_IN',
    lastCheckInTime: '08:50 AM Today',
    lastLocation: '(-)',
    remarks: '(-)',
    allowedPages: ALL_EMPLOYEE_PAGES
  },
  {
    id: 'emp-3',
    code: 'FPPL/OD-005',
    name: 'Bajrang Seth',
    designation: 'Sr. Marketing Executive',
    systemRole: 'EMPLOYEE',
    phone: '9040776602',
    territory: '(-)',
    targetMonthly: 0,
    currentMonthSales: 0,
    activeOrdersCount: 0,
    checkInStatus: 'CHECKED_OUT',
    lastCheckInTime: '08:30 AM Today',
    lastLocation: '(-)',
    remarks: '(-)',
    allowedPages: ALL_EMPLOYEE_PAGES
  },
  {
    id: 'emp-4',
    code: 'FPPL/OD-008',
    name: 'Arun Kumar Sahoo',
    designation: 'Factory Head',
    systemRole: 'EMPLOYEE',
    phone: '9438374901',
    territory: '(-)',
    targetMonthly: 0,
    currentMonthSales: 0,
    activeOrdersCount: 0,
    checkInStatus: 'CHECKED_IN',
    lastCheckInTime: '07:45 AM Today',
    lastLocation: '(-)',
    remarks: '(-)',
    allowedPages: ALL_EMPLOYEE_PAGES
  },
  {
    id: 'emp-5',
    code: 'FPPL/OD-009',
    name: 'Subham Sahu',
    designation: 'Executive-Multitask',
    systemRole: 'EMPLOYEE',
    phone: '7788836041',
    territory: '(-)',
    targetMonthly: 0,
    currentMonthSales: 0,
    activeOrdersCount: 0,
    checkInStatus: 'CHECKED_OUT',
    lastCheckInTime: '(-)',
    lastLocation: '(-)',
    remarks: '(-)',
    allowedPages: ALL_EMPLOYEE_PAGES
  }
];

export const INITIAL_DAILY_ATTENDANCE: DailyAttendanceSummary[] = [
  {
    id: 'att-sum-1',
    date: '2026-09-11',
    employeeId: 'emp-1',
    employeeCode: 'FPPL/OD-002',
    employeeName: 'Purna Chandra Nayak',
    territory: '(-)',
    phone: '9437860619',
    status: 'ACTIVE_ON_FIELD',
    checkIn: {
      timestamp: '2026-09-11T09:15:00Z',
      time: '09:15 AM',
      latitude: 20.296059,
      longitude: 85.824540,
      locationName: 'Bhubaneswar Commercial Complex',
      photoUrl: '/brand/filtec-logo.jpg',
      verified: true
    },
    hoursWorked: 3.8,
    dealerVisitsCount: 0,
    ordersCount: 0,
    notes: 'Field duty in progress'
  },
  {
    id: 'att-sum-2',
    date: '2026-09-11',
    employeeId: 'emp-2',
    employeeCode: 'FPPL/OD-004',
    employeeName: 'Ramesh sharma',
    territory: '(-)',
    phone: '9437860479',
    status: 'ACTIVE_ON_FIELD',
    checkIn: {
      timestamp: '2026-09-11T08:50:00Z',
      time: '08:50 AM',
      latitude: 20.462521,
      longitude: 85.882988,
      locationName: 'Odisha Central Office',
      photoUrl: '/brand/filtec-logo.jpg',
      verified: true
    },
    hoursWorked: 4.2,
    dealerVisitsCount: 0,
    ordersCount: 0,
    notes: 'Office operations & coordination'
  },
  {
    id: 'att-sum-3',
    date: '2026-09-11',
    employeeId: 'emp-3',
    employeeCode: 'FPPL/OD-005',
    employeeName: 'Bajrang Seth',
    territory: '(-)',
    phone: '9040776602',
    status: 'CHECKED_OUT',
    checkIn: {
      timestamp: '2026-09-11T08:30:00Z',
      time: '08:30 AM',
      latitude: 21.466870,
      longitude: 83.981160,
      locationName: 'Sambalpur Industrial Depot',
      photoUrl: '/brand/filtec-logo.jpg',
      verified: true
    },
    checkOut: {
      timestamp: '2026-09-11T12:45:00Z',
      time: '12:45 PM',
      latitude: 21.470210,
      longitude: 83.974510,
      locationName: 'Sambalpur City Market',
      photoUrl: '/brand/filtec-logo.jpg',
      verified: true
    },
    hoursWorked: 4.25,
    dealerVisitsCount: 0,
    ordersCount: 0,
    notes: 'Morning shift completed'
  },
  {
    id: 'att-sum-4',
    date: '2026-09-11',
    employeeId: 'emp-4',
    employeeCode: 'FPPL/OD-008',
    employeeName: 'Arun Kumar Sahoo',
    territory: '(-)',
    phone: '9438374901',
    status: 'ACTIVE_ON_FIELD',
    checkIn: {
      timestamp: '2026-09-11T07:45:00Z',
      time: '07:45 AM',
      latitude: 20.301240,
      longitude: 85.814230,
      locationName: 'FILTEC Manufacturing Plant',
      photoUrl: '/brand/filtec-logo.jpg',
      verified: true
    },
    hoursWorked: 5.5,
    dealerVisitsCount: 0,
    ordersCount: 0,
    notes: 'Factory production & extrusion lines inspection'
  },
  {
    id: 'att-sum-5',
    date: '2026-09-11',
    employeeId: 'emp-5',
    employeeCode: 'FPPL/OD-009',
    employeeName: 'Subham Sahu',
    territory: '(-)',
    phone: '7788836041',
    status: 'CHECKED_OUT',
    hoursWorked: 4.0,
    dealerVisitsCount: 0,
    ordersCount: 0,
    notes: 'Multitask administrative operations'
  }
];

export const INITIAL_WEEKLY_ATTENDANCE: WeeklyAttendanceSummary[] = [
  {
    employeeId: 'emp-1',
    employeeName: 'Purna Chandra Nayak',
    employeeCode: 'FPPL/OD-002',
    territory: '(-)',
    days: [
      { date: '2026-09-07', dayName: 'Mon', status: 'CHECKED_OUT', hours: 8.5, checkInLocation: 'Bhubaneswar', checkOutLocation: 'Cuttack' },
      { date: '2026-09-08', dayName: 'Tue', status: 'CHECKED_OUT', hours: 8.2, checkInLocation: 'Bhubaneswar', checkOutLocation: 'Puri Road' },
      { date: '2026-09-09', dayName: 'Wed', status: 'CHECKED_OUT', hours: 8.8, checkInLocation: 'Bhubaneswar', checkOutLocation: 'Khandagiri' },
      { date: '2026-09-10', dayName: 'Thu', status: 'CHECKED_OUT', hours: 8.0, checkInLocation: 'Cuttack', checkOutLocation: 'Choudwar' },
      { date: '2026-09-11', dayName: 'Fri', status: 'ACTIVE_ON_FIELD', hours: 4.0, checkInLocation: 'Bhubaneswar Commercial Complex' }
    ],
    totalPresent: 5,
    totalAbsent: 0,
    totalHours: 37.5,
    attendancePercentage: 100
  },
  {
    employeeId: 'emp-2',
    employeeName: 'Ramesh sharma',
    employeeCode: 'FPPL/OD-004',
    territory: '(-)',
    days: [
      { date: '2026-09-07', dayName: 'Mon', status: 'CHECKED_OUT', hours: 8.0, checkInLocation: 'Central Office', checkOutLocation: 'Central Office' },
      { date: '2026-09-08', dayName: 'Tue', status: 'CHECKED_OUT', hours: 8.5, checkInLocation: 'Central Office', checkOutLocation: 'Central Office' },
      { date: '2026-09-09', dayName: 'Wed', status: 'CHECKED_OUT', hours: 7.8, checkInLocation: 'Central Office', checkOutLocation: 'Central Office' },
      { date: '2026-09-10', dayName: 'Thu', status: 'CHECKED_OUT', hours: 8.2, checkInLocation: 'Central Office', checkOutLocation: 'Central Office' },
      { date: '2026-09-11', dayName: 'Fri', status: 'ACTIVE_ON_FIELD', hours: 4.2, checkInLocation: 'Odisha Central Office' }
    ],
    totalPresent: 5,
    totalAbsent: 0,
    totalHours: 36.7,
    attendancePercentage: 100
  },
  {
    employeeId: 'emp-3',
    employeeName: 'Bajrang Seth',
    employeeCode: 'FPPL/OD-005',
    territory: '(-)',
    days: [
      { date: '2026-09-07', dayName: 'Mon', status: 'CHECKED_OUT', hours: 8.0, checkInLocation: 'Sambalpur', checkOutLocation: 'Burla' },
      { date: '2026-09-08', dayName: 'Tue', status: 'CHECKED_OUT', hours: 8.2, checkInLocation: 'Sambalpur', checkOutLocation: 'Bargarh' },
      { date: '2026-09-09', dayName: 'Wed', status: 'CHECKED_OUT', hours: 8.0, checkInLocation: 'Sambalpur', checkOutLocation: 'Jharsuguda' },
      { date: '2026-09-10', dayName: 'Thu', status: 'CHECKED_OUT', hours: 8.5, checkInLocation: 'Sambalpur', checkOutLocation: 'Rengali' },
      { date: '2026-09-11', dayName: 'Fri', status: 'CHECKED_OUT', hours: 4.25, checkInLocation: 'Sambalpur Industrial Depot', checkOutLocation: 'Sambalpur City Market' }
    ],
    totalPresent: 5,
    totalAbsent: 0,
    totalHours: 36.95,
    attendancePercentage: 100
  },
  {
    employeeId: 'emp-4',
    employeeName: 'Arun Kumar Sahoo',
    employeeCode: 'FPPL/OD-008',
    territory: '(-)',
    days: [
      { date: '2026-09-07', dayName: 'Mon', status: 'CHECKED_OUT', hours: 9.0, checkInLocation: 'Plant', checkOutLocation: 'Plant' },
      { date: '2026-09-08', dayName: 'Tue', status: 'CHECKED_OUT', hours: 9.0, checkInLocation: 'Plant', checkOutLocation: 'Plant' },
      { date: '2026-09-09', dayName: 'Wed', status: 'CHECKED_OUT', hours: 8.5, checkInLocation: 'Plant', checkOutLocation: 'Plant' },
      { date: '2026-09-10', dayName: 'Thu', status: 'CHECKED_OUT', hours: 9.0, checkInLocation: 'Plant', checkOutLocation: 'Plant' },
      { date: '2026-09-11', dayName: 'Fri', status: 'ACTIVE_ON_FIELD', hours: 5.5, checkInLocation: 'FILTEC Manufacturing Plant' }
    ],
    totalPresent: 5,
    totalAbsent: 0,
    totalHours: 41.0,
    attendancePercentage: 100
  },
  {
    employeeId: 'emp-5',
    employeeName: 'Subham Sahu',
    employeeCode: 'FPPL/OD-009',
    territory: '(-)',
    days: [
      { date: '2026-09-07', dayName: 'Mon', status: 'CHECKED_OUT', hours: 8.0, checkInLocation: 'Office', checkOutLocation: 'Office' },
      { date: '2026-09-08', dayName: 'Tue', status: 'CHECKED_OUT', hours: 8.0, checkInLocation: 'Office', checkOutLocation: 'Office' },
      { date: '2026-09-09', dayName: 'Wed', status: 'CHECKED_OUT', hours: 8.0, checkInLocation: 'Office', checkOutLocation: 'Office' },
      { date: '2026-09-10', dayName: 'Thu', status: 'CHECKED_OUT', hours: 8.0, checkInLocation: 'Office', checkOutLocation: 'Office' },
      { date: '2026-09-11', dayName: 'Fri', status: 'CHECKED_OUT', hours: 4.0, checkInLocation: 'Office' }
    ],
    totalPresent: 5,
    totalAbsent: 0,
    totalHours: 36.0,
    attendancePercentage: 100
  }
];

export const INITIAL_MONTHLY_ATTENDANCE: MonthlyAttendanceSummary[] = [
  {
    employeeId: 'emp-1',
    employeeName: 'Purna Chandra Nayak',
    employeeCode: 'FPPL/OD-002',
    territory: '(-)',
    monthName: 'September 2026',
    totalWorkingDays: 10,
    presentDays: 10,
    absentDays: 0,
    leaveDays: 0,
    attendancePercentage: 100,
    ordersBooked: 0,
    totalSalesAchieved: 0,
    baseSalary: 0,
    payableSalary: 0
  },
  {
    employeeId: 'emp-2',
    employeeName: 'Ramesh sharma',
    employeeCode: 'FPPL/OD-004',
    territory: '(-)',
    monthName: 'September 2026',
    totalWorkingDays: 10,
    presentDays: 10,
    absentDays: 0,
    leaveDays: 0,
    attendancePercentage: 100,
    ordersBooked: 0,
    totalSalesAchieved: 0,
    baseSalary: 0,
    payableSalary: 0
  },
  {
    employeeId: 'emp-3',
    employeeName: 'Bajrang Seth',
    employeeCode: 'FPPL/OD-005',
    territory: '(-)',
    monthName: 'September 2026',
    totalWorkingDays: 10,
    presentDays: 10,
    absentDays: 0,
    leaveDays: 0,
    attendancePercentage: 100,
    ordersBooked: 0,
    totalSalesAchieved: 0,
    baseSalary: 0,
    payableSalary: 0
  },
  {
    employeeId: 'emp-4',
    employeeName: 'Arun Kumar Sahoo',
    employeeCode: 'FPPL/OD-008',
    territory: '(-)',
    monthName: 'September 2026',
    totalWorkingDays: 10,
    presentDays: 10,
    absentDays: 0,
    leaveDays: 0,
    attendancePercentage: 100,
    ordersBooked: 0,
    totalSalesAchieved: 0,
    baseSalary: 0,
    payableSalary: 0
  },
  {
    employeeId: 'emp-5',
    employeeName: 'Subham Sahu',
    employeeCode: 'FPPL/OD-009',
    territory: '(-)',
    monthName: 'September 2026',
    totalWorkingDays: 10,
    presentDays: 10,
    absentDays: 0,
    leaveDays: 0,
    attendancePercentage: 100,
    ordersBooked: 0,
    totalSalesAchieved: 0,
    baseSalary: 0,
    payableSalary: 0
  }
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-1',
    employeeId: 'emp-1',
    employeeName: 'Purna Chandra Nayak',
    leaveType: 'CASUAL',
    startDate: '2026-09-18',
    endDate: '2026-09-19',
    daysCount: 2,
    reason: 'Family wedding event in Cuttack. Dealer follow-ups scheduled for Monday.',
    status: 'PENDING',
    contactNumber: '9437860619',
    createdAt: '2026-09-12T08:30:00Z'
  },
  {
    id: 'leave-2',
    employeeId: 'emp-5',
    employeeName: 'Subham Sahu',
    leaveType: 'CASUAL',
    startDate: '2026-09-15',
    endDate: '2026-09-15',
    daysCount: 1,
    reason: 'Personal family engagement',
    status: 'APPROVED',
    contactNumber: '9777123456',
    createdAt: '2026-09-10T16:00:00Z'
  },
  {
    id: 'leave-3',
    employeeId: 'emp-2',
    employeeName: 'Pradeep Kumar Mohanty',
    leaveType: 'SICK',
    startDate: '2026-09-08',
    endDate: '2026-09-09',
    daysCount: 2,
    reason: 'High seasonal fever and doctor recommended rest',
    status: 'APPROVED',
    contactNumber: '9437189012',
    createdAt: '2026-09-07T18:10:00Z'
  },
  {
    id: 'leave-4',
    employeeId: 'emp-3',
    employeeName: 'Debasish Jena',
    leaveType: 'PLANNED',
    startDate: '2026-09-05',
    endDate: '2026-09-06',
    daysCount: 2,
    reason: 'Leave without prior dealer visit coverage plan',
    status: 'REJECTED',
    rejectionReason: 'Critical distributor order dispatch scheduled in Sambalpur; please re-apply after Monday dispatch.',
    contactNumber: '9437298765',
    createdAt: '2026-09-03T11:20:00Z'
  }
];

export const INITIAL_DEALERS: Dealer[] = [
  {
    id: 'dlr-1',
    code: 'DLR-301',
    name: 'Shree Balaji Sanitary & Hardware',
    ownerName: 'Mukesh Agarwal',
    phone: '+91 98980 99881',
    city: 'Ahmedabad',
    state: 'Gujarat',
    address: 'Shop 14-16, Ashoka Chambers, Mithakhali Six Roads, Navrangpura',
    creditLimit: 500000,
    outstandingBalance: 142500,
    tier: 'Platinum',
    totalPurchases: 1845000,
    availableRewards: 13850,
    plumbersCount: 8
  },
  {
    id: 'dlr-2',
    code: 'DLR-302',
    name: 'Kalinga Hardware Mart',
    ownerName: 'Deepak Dash',
    phone: '+91 94378 12345',
    city: 'Surat',
    state: 'Gujarat',
    address: '42, Ring Road Commercial Complex, Majura Gate',
    creditLimit: 750000,
    outstandingBalance: 88000,
    tier: 'Platinum',
    totalPurchases: 2410000,
    availableRewards: 18075,
    plumbersCount: 12
  },
  {
    id: 'dlr-3',
    code: 'DLR-303',
    name: 'Agarwal Sanitation & Pipes',
    ownerName: 'Sanjay Agarwal',
    phone: '+91 98254 77610',
    city: 'Vadodara',
    state: 'Gujarat',
    address: 'Plot 7, GIDC Industrial Estate, Makarpura',
    creditLimit: 400000,
    outstandingBalance: 215000,
    tier: 'Gold',
    totalPurchases: 980000,
    availableRewards: 7350,
    plumbersCount: 5
  },
  {
    id: 'dlr-4',
    code: 'DLR-304',
    name: 'Royal Pipe Traders',
    ownerName: 'Harish Mehta',
    phone: '+91 99798 44321',
    city: 'Rajkot',
    state: 'Gujarat',
    address: 'Opposite Bhaktinagar Station, Dhebar Road',
    creditLimit: 600000,
    outstandingBalance: 45000,
    tier: 'Gold',
    totalPurchases: 1320000,
    availableRewards: 9900,
    plumbersCount: 6
  },
  {
    id: 'dlr-5',
    code: 'DLR-305',
    name: 'Maruti Sanitary World',
    ownerName: 'Pravin Solanki',
    phone: '+91 98791 22334',
    city: 'Bhavnagar',
    state: 'Gujarat',
    address: 'Kalanala Market, Near City Bus Stop',
    creditLimit: 350000,
    outstandingBalance: 12000,
    tier: 'Silver',
    totalPurchases: 650000,
    availableRewards: 4875,
    plumbersCount: 4
  }
];

export const INITIAL_PLUMBERS: Plumber[] = [
  {
    id: 'plumb-1',
    dealerId: 'dlr-1',
    dealerName: 'Shree Balaji Sanitary & Hardware',
    name: 'Kailash Solanki',
    phone: '+91 98240 12001',
    status: 'ACTIVE',
    totalAllocatedRewards: 3200,
    rewardHistoryCount: 4,
    dateAdded: '2026-05-10'
  },
  {
    id: 'plumb-2',
    dealerId: 'dlr-1',
    dealerName: 'Shree Balaji Sanitary & Hardware',
    name: 'Manoj Parmar',
    phone: '+91 98240 12002',
    status: 'ACTIVE',
    totalAllocatedRewards: 2500,
    rewardHistoryCount: 3,
    dateAdded: '2026-06-12'
  },
  {
    id: 'plumb-3',
    dealerId: 'dlr-1',
    dealerName: 'Shree Balaji Sanitary & Hardware',
    name: 'Gopal Prajapati',
    phone: '+91 98240 12003',
    status: 'ACTIVE',
    totalAllocatedRewards: 1800,
    rewardHistoryCount: 2,
    dateAdded: '2026-07-01'
  },
  {
    id: 'plumb-4',
    dealerId: 'dlr-2',
    dealerName: 'Kalinga Hardware Mart',
    name: 'Dinesh Vaghela',
    phone: '+91 98240 12004',
    status: 'ACTIVE',
    totalAllocatedRewards: 4100,
    rewardHistoryCount: 6,
    dateAdded: '2026-04-18'
  },
  {
    id: 'plumb-5',
    dealerId: 'dlr-2',
    dealerName: 'Kalinga Hardware Mart',
    name: 'Suresh Chauhan',
    phone: '+91 98240 12005',
    status: 'ACTIVE',
    totalAllocatedRewards: 3450,
    rewardHistoryCount: 5,
    dateAdded: '2026-05-20'
  }
];

export const INITIAL_REWARD_CONFIG: RewardConfig = {
  ratePercent: 1.0,
  dealerSharePercent: 75,
  plumberSharePercent: 25
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1041',
    orderNumber: 'ORD-2026-1041',
    employeeId: 'emp-1',
    employeeName: 'Purna Chandra Nayak',
    dealerId: 'dlr-1',
    dealerName: 'Shree Balaji Sanitary & Hardware',
    dealerPhone: '+91 98980 99881',
    dealerCity: 'Ahmedabad',
    items: [
      {
        id: 'item-1',
        productId: 'f-3',
        productCode: 'F-3',
        productName: '25 MM (1") uPVC Pipe SCH-40',
        variantId: 'f-3-3m',
        variantDescription: '3 Mtr (30 Pcs)',
        unitPrice: 323.65,
        quantity: 30,
        packingQty: 30,
        packingUnit: 'Pcs',
        totalAmount: 9709.50
      },
      {
        id: 'item-2',
        productId: 'f-42',
        productCode: 'F-42',
        productName: '25 MM (1") CPVC Pipe SDR-11',
        variantId: 'f-42-3m',
        variantDescription: '3 Mtr (30 Pcs)',
        unitPrice: 540.79,
        quantity: 30,
        packingQty: 30,
        packingUnit: 'Bundle',
        totalAmount: 16223.70
      },
      {
        id: 'item-3',
        productId: 'f-70',
        productCode: 'F-70',
        productName: '25 MM (1") uPVC Ball Valve',
        variantId: 'f-70-std',
        variantDescription: 'Box (6 Pcs)',
        unitPrice: 190.00,
        quantity: 12,
        packingQty: 6,
        packingUnit: 'Box',
        totalAmount: 2280.00
      }
    ],
    subtotal: 28213.20,
    gstAmount: 5078.38,
    totalAmount: 33291.58,
    status: 'PENDING_ADMIN_APPROVAL',
    notes: 'Urgent delivery requested for project installation near Mithakhali.',
    rewardEstimated: 332.92,
    rewardDealerShare: 249.69,
    rewardPlumberShare: 83.23,
    createdAt: '2026-09-11T10:45:00Z',
    submittedAt: '2026-09-11T10:50:00Z'
  },
  {
    id: 'ord-1040',
    orderNumber: 'ORD-2026-1040',
    employeeId: 'emp-3',
    employeeName: 'Bajrang Seth',
    dealerId: 'dlr-2',
    dealerName: 'Kalinga Hardware Mart',
    dealerPhone: '+91 94378 12345',
    dealerCity: 'Surat',
    items: [
      {
        id: 'item-4',
        productId: 'f-1',
        productCode: 'F-1',
        productName: '15 MM (1/2") uPVC Pipe SCH-40',
        variantId: 'f-1-3m',
        variantDescription: '3 Mtr (50 Pcs)',
        unitPrice: 188.65,
        quantity: 100,
        packingQty: 50,
        packingUnit: 'Pcs',
        totalAmount: 18865.00
      },
      {
        id: 'item-5',
        productId: 'f-77',
        productCode: 'F-77',
        productName: 'FILTEC Heavy Duty uPVC Solvent Cement',
        variantId: 'f-77-118',
        variantDescription: '118 ML Tin (24 Tin/Box)',
        unitPrice: 175.00,
        quantity: 48,
        packingQty: 24,
        packingUnit: 'Tin',
        totalAmount: 8400.00
      }
    ],
    subtotal: 27265.00,
    gstAmount: 4907.70,
    totalAmount: 32172.70,
    status: 'CONFIRMED',
    rewardEstimated: 321.73,
    rewardDealerShare: 241.30,
    rewardPlumberShare: 80.43,
    createdAt: '2026-09-10T14:20:00Z',
    submittedAt: '2026-09-10T14:30:00Z',
    approvedAt: '2026-09-10T15:10:00Z',
    erpSyncAt: '2026-09-10T15:11:00Z',
    confirmedAt: '2026-09-10T16:00:00Z',
    invoicedAt: '2026-09-10T16:15:00Z',
    invoiceNumber: 'INV-FIL-2026-8821'
  }
];

export const INITIAL_REWARD_LEDGER: RewardTransaction[] = [
  {
    id: 'rew-1',
    dealerId: 'dlr-1',
    orderId: 'ord-1039',
    orderNumber: 'ORD-2026-1039',
    type: 'CREDIT_ORDER',
    amount: 10500,
    balanceAfter: 15350,
    description: '1% Reward generated from Order #1039 (₹1,050,000 sales)',
    createdAt: '2026-09-08T11:30:00Z'
  },
  {
    id: 'rew-2',
    dealerId: 'dlr-1',
    plumberId: 'plumb-1',
    plumberName: 'Kailash Solanki',
    type: 'DEBIT_PLUMBER_ALLOCATION',
    amount: -1500,
    balanceAfter: 13850,
    description: 'Reward allocated to Plumber Kailash Solanki',
    createdAt: '2026-09-09T16:15:00Z'
  },
  {
    id: 'rew-3',
    dealerId: 'dlr-2',
    orderId: 'ord-1038',
    orderNumber: 'ORD-2026-1038',
    type: 'CREDIT_ORDER',
    amount: 18075,
    balanceAfter: 18075,
    description: '1% Reward generated from Order #1038 (₹1,807,500 sales)',
    createdAt: '2026-09-07T09:40:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    userId: 'user-admin',
    userName: 'Rajesh Sharma',
    role: 'ADMIN',
    action: 'ORDER_APPROVED',
    entityType: 'ORDER',
    entityId: 'ord-1040',
    details: 'Admin approved order ORD-2026-1040 for Kalinga Hardware Mart (₹32,172.70)',
    timestamp: '2026-09-10T15:10:00Z'
  },
  {
    id: 'aud-2',
    userId: 'system',
    userName: 'ERP Integration Daemon',
    role: 'ADMIN',
    action: 'ERP_SYNC_COMPLETED',
    entityType: 'ORDER',
    entityId: 'ord-1040',
    details: 'Synchronized with ERP Billing authority. Invoiced as INV-FIL-2026-8821',
    timestamp: '2026-09-10T15:11:00Z'
  },
  {
    id: 'aud-3',
    userId: 'user-employee',
    userName: 'Purna Chandra Nayak',
    role: 'EMPLOYEE',
    action: 'ORDER_SUBMITTED',
    entityType: 'ORDER',
    entityId: 'ord-1041',
    details: 'Field order created for Shree Balaji Sanitary (3 items, ₹33,291.58)',
    timestamp: '2026-09-11T10:50:00Z'
  }
];

export const INITIAL_INTEGRATION_EVENTS: IntegrationEvent[] = [
  {
    id: 'int-1',
    type: 'ERP_SYNC',
    title: 'Billing & Invoice Sync',
    targetId: 'ord-1040',
    status: 'SUCCESS',
    payloadSummary: 'Order #1040 synced -> ERP ID #ERP-8841 (Latency: 142ms)',
    timestamp: '2026-09-10T15:11:00Z',
    latencyMs: 142
  },
  {
    id: 'int-2',
    type: 'WHATSAPP_DISPATCH',
    title: 'Order Status Notification',
    targetId: 'dlr-2',
    status: 'SUCCESS',
    payloadSummary: 'Sent template order_confirmation to +91 94378 12345 (Kalinga Hardware)',
    timestamp: '2026-09-10T15:11:30Z',
    latencyMs: 85
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  company: {
    legalName: 'FILTEC Polyplast Pvt Ltd',
    brandName: 'FILTEC ONE',
    plantAddress: 'Plot No. 42/B, Mancheswar Industrial Estate, Sector-A, Bhubaneswar, Odisha 751010',
    supportWhatsApp: '+91 94370 12345',
    supportEmail: 'operations@filtec.in',
    gstin: '21AABCF9842K1ZK',
    defaultGstPercent: 18,
    currency: '₹ INR',
    timezone: 'Asia/Kolkata (IST)'
  },
  permissions: {
    admin: {
      canApproveOrders: true,
      canOverridePricing: true,
      canManageStaff: true,
      canManageDealers: true,
      canApproveLeave: true,
      canAccessIntegrations: true
    },
    employee: {
      canCreateOrders: true,
      canViewDealers: true,
      canEditDealerContact: true,
      canApplyLeave: true,
      canViewAttendanceHistory: true
    },
    dealer: {
      canCreateDirectOrders: true,
      canAllocatePlumberRewards: true,
      canViewInvoices: true,
      canManagePlumbers: true
    },
    pageAccess: {
      adminPages: ALL_ADMIN_PAGES,
      employeePages: ALL_EMPLOYEE_PAGES,
      dealerPages: ALL_DEALER_PAGES
    }
  },
  policy: {
    monthlyCasualLeaveQuota: 2,
    annualLeaveQuota: 18,
    workDayHours: 9,
    checkInGraceMinutes: 15,
    requirePhotoSelfie: true,
    creditLimitWarningPercent: 80
  },
  notifications: {
    whatsappOrderUpdates: true,
    whatsappLeaveUpdates: true,
    whatsappPaymentReceipts: true,
    erpSyncAutomated: true
  }
};

