// node scripts/migrate-draft.mjs
// One-time migration: adds draft_content column to page_content table for existing DBs.

import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres:NWfitness@2026@db.llmyrauorwaxleqxcgpc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
})

await client.connect()
console.log('✓ Connected to Supabase')

await client.query(`
  ALTER TABLE page_content ADD COLUMN IF NOT EXISTS draft_content jsonb;
`)
console.log('✓ draft_content column added (or already existed)')

await client.end()
console.log('Done.')
