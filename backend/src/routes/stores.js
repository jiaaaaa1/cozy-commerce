const express = require('express');
const storeService = require('../services/store.service');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// List user's connected stores
router.get('/', async (req, res) => {
  try {
    const stores = await storeService.listStores(req.user.id);
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect a new store
router.post('/connect', async (req, res) => {
  try {
    const { platform, credentials } = req.body;
    
    if (!platform || !credentials) {
      return res.status(400).json({ error: 'Platform and credentials are required' });
    }
    
    const store = await storeService.connectStore(req.user.id, platform, credentials);
    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sync store products
router.post('/:storeId/sync', async (req, res) => {
  try {
    const { storeId } = req.params;
    const result = await storeService.syncStore(storeId, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;