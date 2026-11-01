/**
 * Helper to identify Samir's administrator identity with high security.
 *
 * Strict requirements:
 * 1. Must have role: 'ADMIN' (even if an employee is granted permission to the attendance page,
 *    their role remains 'EMPLOYEE', so they will NOT pass this check).
 * 2. Identity matches Samir via name, ID, email, employee code, or phone.
 */

export interface MinimalUserOrSession {
  role?: string;
  systemRole?: string;
  name?: string;
  userId?: string;
  id?: string;
  employeeCode?: string;
  phone?: string;
  email?: string;
}

export function isSamirUser(user: MinimalUserOrSession | null | undefined): boolean {
  if (!user) return false;

  const role = (user.role || user.systemRole || '').toUpperCase();
  if (role !== 'ADMIN') {
    return false;
  }

  const name = (user.name || '').trim().toLowerCase();
  const id = (user.userId || user.id || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  const phone = (user.phone || '').replace(/\D/g, '');
  const code = (user.employeeCode || '').toUpperCase();

  return (
    name.includes('samir') ||
    id.includes('samir') ||
    email.includes('samir') ||
    code === 'FPPL/ADM-001' ||
    phone.endsWith('05814')
  );
}

