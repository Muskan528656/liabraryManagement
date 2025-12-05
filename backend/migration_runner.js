/**
 * Migration Runner for adding phone_number column to company table
 * Run this script: node migration_runner.js
 */

const fs = require("fs");
const path = require("path");
const db = require("./app/models/db.js");

async function runMigration() {
  try {
    console.log("🚀 Starting migration: Add phone_number column to company table...\n");


    const migrationPath = path.join(__dirname, "./schemas/migration_add_phone_number_to_company.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");


    const result = await db.query(migrationSQL);

    console.log("✅ Migration completed successfully!");
    console.log("\n📋 Changes applied:");
    console.log("   - Added 'phone_number' column (VARCHAR(20)) to public.company table");
    console.log("   - Column allows NULL values");
    console.log("   - Added column comment for documentation");

    console.log("\n✅ You can now use the phone_number field in the Company component!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed!");
    console.error("Error:", error.message);
    console.error("\n⚠️  If the column already exists, you can safely ignore this error.");
    console.error("\n💡 Alternative: Run this SQL directly in your database:");
    console.error("   ALTER TABLE public.company ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);");
    process.exit(1);
  }
}


runMigration();
