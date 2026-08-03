/**
 * Export Waitlist Data to CSV
 * 
 * Run this BEFORE deleting the old schema or running new migrations.
 * Requires the old DATABASE_URL to be set in .env or passed as an argument.
 * 
 * Usage: node scripts/export-waitlist.mjs [DATABASE_URL]
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ No DATABASE_URL provided.');
  console.error('Usage: node scripts/export-waitlist.mjs <DATABASE_URL>');
  console.error('   or: set DATABASE_URL in environment');
  process.exit(1);
}

async function exportWaitlist() {
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Connecting to database...');
    
    // Check if waitlist table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'waitlist'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  No waitlist table found. Nothing to export.');
      return;
    }

    const result = await pool.query('SELECT * FROM waitlist ORDER BY id ASC');
    const rows = result.rows;

    if (rows.length === 0) {
      console.log('⚠️  Waitlist table is empty. Nothing to export.');
      return;
    }

    // Build CSV
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ),
    ];

    const outputPath = path.join(__dirname, '..', `waitlist-export-${new Date().toISOString().slice(0, 10)}.csv`);
    fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');

    console.log(`✅ Exported ${rows.length} waitlist entries to:`);
    console.log(`   ${outputPath}`);
  } catch (err) {
    console.error('❌ Export failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

exportWaitlist();
