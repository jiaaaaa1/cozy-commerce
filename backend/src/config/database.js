const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://postgres:password@localhost:5432/commerce_central',
  ssl: process.env.NODE_ENV === 'production' ? 
    { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};