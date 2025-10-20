class BaseAdapter {
  constructor(credentials) {
    this.credentials = credentials;
  }
  
  // Must be implemented by each adapter
  async connect() {
    throw new Error('connect() must be implemented');
  }
  
  async testConnection() {
    throw new Error('testConnection() must be implemented');
  }
  
  async getProducts(options = {}) {
    throw new Error('getProducts() must be implemented');
  }
  
  async updateProduct(productId, data) {
    throw new Error('updateProduct() must be implemented');
  }
  
  // Normalize product data to our universal format
  normalizeProduct(platformProduct) {
    throw new Error('normalizeProduct() must be implemented');
  }
}

module.exports = BaseAdapter;