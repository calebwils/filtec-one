const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_NYIm60vrnwbp@ep-young-king-azasznxi.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  console.log("Connecting to Neon PostgreSQL...");

  // 1. Reset creditLimit to 0, outstandingBalance to 0, and assignedRepId to NULL for all dealers
  const res = await pool.query(`
    UPDATE "Dealer" 
    SET "creditLimit" = 0, 
        "outstandingBalance" = 0, 
        "assignedRepId" = NULL;
  `);

  console.log(`✅ Updated ${res.rowCount} dealers in Neon PostgreSQL (creditLimit=0, outstandingBalance=0, assignedRepId=NULL).`);

  // 2. Clear assignedDealerIds for all employees
  const empRes = await pool.query(`
    UPDATE "Employee"
    SET "assignedDealerIds" = '[]';
  `);
  console.log(`✅ Cleared assignedDealerIds for ${empRes.rowCount} employees.`);

  // 3. Verify sample
  const sample = await pool.query('SELECT code, name, phone, "creditLimit", "outstandingBalance", "assignedRepId" FROM "Dealer" ORDER BY code ASC LIMIT 5;');
  console.log("Sample records:");
  console.table(sample.rows);

  await pool.end();
}

main().catch(console.error);
