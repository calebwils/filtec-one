import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually
const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
}

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/filtec_pretech1';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const del = await prisma.dailyAttendanceSummary.deleteMany({});
  const delR = await prisma.attendanceRecord.deleteMany({});
  console.log('✅ Deleted dailyAttendanceSummary rows:', del.count);
  console.log('✅ Deleted attendanceRecord rows:', delR.count);
  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
