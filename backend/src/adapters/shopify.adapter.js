const axios = require('axios');
const BaseAdapter = require('./base.adapter');

class ShopifyAdapter extends BaseAdapter {
  constructor(credentials) {
    super(credentials);
    this.baseUrl = `https://${credentials.store_url}/admin/api/2024-01`;
    this.headers = {
      'X-Shopify-Access-Token': credentials.access_token,
      'Content-Type': 'application/json'
    };
  }
  
  async connect() {
    try {
      const response = await axios.get(`${this.baseUrl}/shop.json`, {
        headers: this.headers
      });
      
      return {
        success: true,
        shop: response.data.shop,
        external_store_id: response.data.shop.id.toString(),
        store_name: response.data.shop.name,
        store_url: response.data.shop.domain
      };
    } catch (error) {
      throw new Error(`Shopify connection failed: ${error.message}`);
    }
  }
  
  async testConnection() {
    try {
      await axios.get(`${this.baseUrl}/shop.json`, {
        headers: this.headers,
        timeout: 5000
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getProducts(options = {}) {
    const { limit = 250, status = 'any' } = options;
    let allProducts = [];
    let nextPageUrl = `${this.baseUrl}/products.json?limit=${limit}&status=${status}`;
    
    while (nextPageUrl) {
      try {
        const response = await axios.get(nextPageUrl, {
          headers: this.headers
        });
        
        const products = response.data.products.map(p => this.normalizeProduct(p));
        allProducts = [...allProducts, ...products];
        
        // Check for pagination
        const linkHeader = response.headers.link;
        nextPageUrl = this.getNextPageUrl(linkHeader);
        
        // Prevent infinite loops - max 1000 products per sync
        if (allProducts.length >= 1000) break;
        
      } catch (error) {
        console.error('Error fetching products:', error);
        break;
      }
    }
    
    return allProducts;
  }
  
  async updateProduct(productId, data) {
    try {
      const updateData = {
        product: {
          id: productId,
          tags: data.tags ? data.tags.join(', ') : undefined
        }
      };
      
      const response = await axios.put(
        `${this.baseUrl}/products/${productId}.json`,
        updateData,
        { headers: this.headers }
      );
      
      return this.normalizeProduct(response.data.product);
    } catch (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }
  
  normalizeProduct(shopifyProduct) {
    return {
      external_id: shopifyProduct.id.toString(),
      sku: shopifyProduct.variants?.[0]?.sku || '',
      title: shopifyProduct.title,
      description: shopifyProduct.body_html || '',
      price: parseFloat(shopifyProduct.variants?.[0]?.price || 0),
      inventory_quantity: shopifyProduct.variants?.[0]?.inventory_quantity || 0,
      status: shopifyProduct.status,
      tags: shopifyProduct.tags ? shopifyProduct.tags.split(',').map(t => t.trim()) : [],
      images: shopifyProduct.images?.map(img => ({
        url: img.src,
        alt: img.alt
      })) || [],
      platform_data: {
        handle: shopifyProduct.handle,
        vendor: shopifyProduct.vendor,
        product_type: shopifyProduct.product_type,
        published_at: shopifyProduct.published_at,
        variants_count: shopifyProduct.variants?.length || 0
      }
    };
  }
  
  getNextPageUrl(linkHeader) {
    if (!linkHeader) return null;
    const links = linkHeader.split(',');
    for (const link of links) {
      const [url, rel] = link.split(';');
      if (rel?.includes('next')) {
        return url.trim().slice(1, -1);
      }
    }
    return null;
  }
}

module.exports = ShopifyAdapter;