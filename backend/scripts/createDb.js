const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

async function createDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password', // Change this to your postgres password
    database: 'postgres' // Connect to default database first
  });

  try {
    await client.connect();
    
    // Check if database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'commerce_central'"
    );
    
    if (res.rows.length === 0) {
      // Create database
      await client.query('CREATE DATABASE commerce_central');
      console.log('✅ Database "commerce_central" created successfully!');
    } else {
      console.log('ℹ️  Database "commerce_central" already exists');
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
  } finally {
    await client.end();
  }
}

createDatabase();