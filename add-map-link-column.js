import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

async function addMapLinkColumn() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Adding map_link column to events table...');
    await pool.query('ALTER TABLE events ADD COLUMN IF NOT EXISTS map_link text;');
    console.log('✅ Column added successfully!');
  } catch (error) {
    console.error('❌ Error adding column:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

addMapLinkColumn();
