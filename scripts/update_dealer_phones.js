const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_NYIm60vrnwbp@ep-young-king-azasznxi.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  console.log("Connecting to Neon PostgreSQL database...");
  const res = await pool.query('SELECT id, code, name, phone FROM "Dealer" ORDER BY code ASC;');
  console.log(`Found ${res.rows.length} dealers in database.`);

  let count = 0;
  for (const row of res.rows) {
    let p = (row.phone || '').trim();
    // Strip existing prefix if any
    p = p.replace(/^\+91[\s-]*/, '').replace(/^91(?=\d{10})/, '').trim();

    let formattedPhone = p;
    if (p && p !== '-') {
      formattedPhone = `+91 ${p}`;
    }

    if (formattedPhone !== row.phone) {
      await pool.query('UPDATE "Dealer" SET "phone" = $1 WHERE "id" = $2;', [formattedPhone, row.id]);
      count++;
    }
  }

  console.log(`✅ Successfully updated ${count} dealer phone numbers with '+91 ' prefix.`);

  const sample = await pool.query('SELECT code, name, phone, city FROM "Dealer" ORDER BY code ASC LIMIT 8;');
  console.log("Sample updated records:");
  console.table(sample.rows);

  await pool.end();
}

main().catch(console.error);
