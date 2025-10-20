const db = require('../config/database');
const ShopifyAdapter = require('../adapters/shopify.adapter');
const crypto = require('crypto');

class StoreService {
  constructor() {
    this.adapters = {
      shopify: ShopifyAdapter
    };
  }
  
  async connectStore(userId, platform, credentials) {
    // Validate platform
    if (!this.adapters[platform]) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    
    // Encrypt credentials
    const encryptedCredentials = this.encryptCredentials(credentials);
    
    // Initialize adapter
    const AdapterClass = this.adapters[platform];
    const adapter = new AdapterClass(credentials);
    
    // Test connection
    const connectionResult = await adapter.connect();
    
    if (!connectionResult.success) {
      throw new Error(`Failed to connect to ${platform}`);
    }
    
    // Save store to database
    const result = await db.query(
      `INSERT INTO stores (
        user_id, platform, store_name, store_url, 
        external_store_id, credentials, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (user_id, platform, external_store_id) 
      DO UPDATE SET 
        store_name = EXCLUDED.store_name,
        credentials = EXCLUDED.credentials,
        is_active = true,
        connected_at = NOW()
      RETURNING *`,
      [
        userId,
        platform,
        connectionResult.store_name,
        connectionResult.store_url,
        connectionResult.external_store_id,
        encryptedCredentials
      ]
    );
    
    const store = result.rows[0];
    
    // Log activity
    await this.logActivity(userId, store.id, 'store_connected', {
      platform,
      store_name: store.store_name
    });
    
    return {
      id: store.id,
      platform: store.platform,
      store_name: store.store_name,
      connected_at: store.connected_at,
      status: 'connected'
    };
  }
  
  async listStores(userId) {
    const result = await db.query(
      `SELECT id, platform, store_name, store_url, is_active, 
              connected_at, last_synced_at, sync_status
       FROM stores 
       WHERE user_id = $1 AND is_active = true
       ORDER BY connected_at DESC`,
      [userId]
    );
    
    // Get product counts for each store
    for (const store of result.rows) {
      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM products WHERE store_id = $1',
        [store.id]
      );
      store.product_count = parseInt(countResult.rows[0].count);
    }
    
    return result.rows;
  }
  
  async syncStore(storeId, userId) {
    // Get store details
    const storeResult = await db.query(
      'SELECT * FROM stores WHERE id = $1 AND user_id = $2',
      [storeId, userId]
    );
    
    if (storeResult.rows.length === 0) {
      throw new Error('Store not found');
    }
    
    const store = storeResult.rows[0];
    const credentials = this.decryptCredentials(store.credentials);
    
    // Initialize adapter
    const AdapterClass = this.adapters[store.platform];
    const adapter = new AdapterClass(credentials);
    
    // Update sync status
    await db.query(
      'UPDATE stores SET sync_status = $1 WHERE id = $2',
      ['syncing', storeId]
    );
    
    try {
      // Fetch products from platform
      const products = await adapter.getProducts();
      
      // Upsert products to database
      for (const product of products) {
        await db.query(
          `INSERT INTO products (
            store_id, external_id, sku, title, description,
            price, inventory_quantity, status, tags, images, platform_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (store_id, external_id)
          DO UPDATE SET
            sku = EXCLUDED.sku,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            inventory_quantity = EXCLUDED.inventory_quantity,
            status = EXCLUDED.status,
            tags = EXCLUDED.tags,
            images = EXCLUDED.images,
            platform_data = EXCLUDED.platform_data,
            updated_at = NOW(),
            last_synced_at = NOW()`,
          [
            storeId,
            product.external_id,
            product.sku,
            product.title,
            product.description,
            product.price,
            product.inventory_quantity,
            product.status,
            product.tags,
            JSON.stringify(product.images),
            JSON.stringify(product.platform_data)
          ]
        );
      }
      
      // Update store sync status
      await db.query(
        `UPDATE stores 
         SET sync_status = 'completed', last_synced_at = NOW() 
         WHERE id = $1`,
        [storeId]
      );
      
      // Log activity
      await this.logActivity(userId, storeId, 'sync_completed', {
        products_synced: products.length
      });
      
      return {
        success: true,
        products_synced: products.length
      };
      
    } catch (error) {
      // Update sync status to failed
      await db.query(
        'UPDATE stores SET sync_status = $1 WHERE id = $2',
        ['failed', storeId]
      );
      
      throw error;
    }
  }
  
  encryptCredentials(credentials) {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-byte-encryption-key-here!', 'utf8');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      authTag: authTag.toString('hex'),
      iv: iv.toString('hex')
    });
  }
  
  decryptCredentials(encryptedData) {
    const data = JSON.parse(encryptedData);
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-byte-encryption-key-here!', 'utf8');
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(data.iv, 'hex'));
    
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
  
  async logActivity(userId, storeId, action, details = {}) {
    await db.query(
      'INSERT INTO activity_logs (user_id, store_id, action, details) VALUES ($1, $2, $3, $4)',
      [userId, storeId, action, JSON.stringify(details)]
    );
  }
}

module.exports = new StoreService();