const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      // Check if migration was already run
      const result = await db.query(
        'SELECT id FROM migrations WHERE filename = $1',
        [file]
      );

      if (result.rows.length === 0) {
        console.log(`Running migration: ${file}`);
        
        // Read and execute migration
        const sql = fs.readFileSync(
          path.join(migrationsDir, file),
          'utf8'
        );
        
        await db.query(sql);
        
        // Record migration
        await db.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        
        console.log(`✅ Migration ${file} completed`);
      }
    }

    console.log('✅ All migrations completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();