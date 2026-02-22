import { Pool } from 'pg';

// Create a singleton pool to be used across the application
const globalForPg = global as unknown as { pgPool: Pool };

export const pool =
  globalForPg.pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add any necessary SSL config for Prod
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
