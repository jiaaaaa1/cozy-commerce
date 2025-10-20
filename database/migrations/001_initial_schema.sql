-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (YOUR customers)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  full_name VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  subscription_status VARCHAR(50) DEFAULT 'trial',
  trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days')
);

-- User sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Connected stores (multi-platform)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  store_name VARCHAR(255),
  store_url VARCHAR(500),
  external_store_id VARCHAR(255),
  credentials JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMP DEFAULT NOW(),
  last_synced_at TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, platform, external_store_id)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  sku VARCHAR(255),
  title VARCHAR(500),
  description TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  inventory_quantity INTEGER DEFAULT 0,
  status VARCHAR(50),
  tags TEXT[],
  images JSONB DEFAULT '[]',
  platform_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_synced_at TIMESTAMP,
  UNIQUE(store_id, external_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);