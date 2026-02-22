const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL found. Skipping DB init.');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('Creating snippets table if it does not exist...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS snippets (
        id UUID PRIMARY KEY,
        path VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        ttl_seconds INT NOT NULL,
        is_one_time BOOLEAN DEFAULT FALSE,
        is_consumed BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create an index on path to speed up retrievals
    await pool.query(`
      CREATE INDEX IF NOT EXISTS snippets_path_idx ON snippets(path);
    `);

    // Create an index on expires_at for easier cleanup sweeps
    await pool.query(`
      CREATE INDEX IF NOT EXISTS snippets_expires_at_idx ON snippets(expires_at);
    `);

    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  } finally {
    await pool.end();
  }
}

initDb();
