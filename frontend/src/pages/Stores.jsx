import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShoppingBag, RefreshCw, X, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [credentials, setCredentials] = useState({});
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState({});
  const { logout } = useAuthStore();

  const platforms = [
    {
      id: 'shopify',
      name: 'Shopify',
      color: 'bg-green-500',
      description: 'Connect your Shopify store'
    }
  ];

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data);
    } catch (error) {
      toast.error('Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStore = async (e) => {
    e.preventDefault();
    setConnecting(true);

    try {
      await api.post('/stores/connect', {
        platform: selectedPlatform,
        credentials
      });
      
      toast.success('Store connected successfully!');
      setShowConnectModal(false);
      setSelectedPlatform(null);
      setCredentials({});
      fetchStores();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to connect store');
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncStore = async (storeId) => {
    setSyncing(prev => ({ ...prev, [storeId]: true }));
    
    try {
      const response = await api.post(`/stores/${storeId}/sync`);
      toast.success(`Synced ${response.data.products_synced} products`);
      fetchStores();
    } catch (error) {
      toast.error('Failed to sync store');
    } finally {
      setSyncing(prev => ({ ...prev, [storeId]: false }));
    }
  };

  const renderConnectionForm = () => {
    if (selectedPlatform === 'shopify') {
      return (
        <form onSubmit={handleConnectStore} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Store URL</label>
            <input
              type="text"
              placeholder="yourstore.myshopify.com"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={credentials.store_url || ''}
              onChange={(e) => setCredentials({
                ...credentials,
                store_url: e.target.value.replace('https://', '').replace('http://', '')
              })}
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              Enter your Shopify store URL without https://
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Access Token</label>
            <input
              type="password"
              placeholder="shpat_xxxxxxxxxxxxx"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={credentials.access_token || ''}
              onChange={(e) => setCredentials({
                ...credentials,
                access_token: e.target.value
              })}
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              Create a private app in your Shopify admin to get an access token
            </p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">How to get your access token:</h4>
            <ol className="text-xs space-y-1">
              <li>1. Go to your Shopify Admin → Settings → Apps and sales channels</li>
              <li>2. Click "Develop apps" → "Create an app"</li>
              <li>3. Configure Admin API scopes (read_products, write_products)</li>
              <li>4. Install the app and copy the Admin API access token</li>
            </ol>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedPlatform(null);
                setCredentials({});
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={connecting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {connecting ? 'Connecting...' : 'Connect Store'}
            </button>
          </div>
        </form>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to="/" className="mr-4">
                <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <ShoppingBag className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowConnectModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Connect Store
              </button>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Connect Store Modal */}
          {showConnectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {selectedPlatform ? `Connect ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}` : 'Choose Platform'}
                  </h2>
                  <button onClick={() => {
                    setShowConnectModal(false);
                    setSelectedPlatform(null);
                    setCredentials({});
                  }}>
                    <X size={24} />
                  </button>
                </div>
                
                {!selectedPlatform ? (
                  <div className="space-y-3">
                    {platforms.map(platform => (
                      <button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        className="w-full p-4 border rounded-lg hover:shadow-lg transition-all text-left"
                      >
                        <div className={`w-12 h-12 ${platform.color} rounded-lg mb-3`}></div>
                        <h3 className="font-semibold">{platform.name}</h3>
                        <p className="text-sm text-gray-600">{platform.description}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  renderConnectionForm()
                )}
              </div>
            </div>
          )}

          {/* Stores List */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
              <p className="mt-2 text-gray-600">Loading stores...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stores connected</h3>
              <p className="text-gray-600 mb-4">Connect your first store to get started</p>
              <button
                onClick={() => setShowConnectModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Connect Your First Store
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map(store => (
                <div key={store.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{store.store_name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{store.platform}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      store.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {store.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <p>Products: {store.product_count || 0}</p>
                    <p>Last Sync: {store.last_synced_at 
                      ? new Date(store.last_synced_at).toLocaleDateString()
                      : 'Never'}</p>
                    <p>Status: <span className="capitalize">{store.sync_status || 'pending'}</span></p>
                  </div>
                  
                  <button
                    onClick={() => handleSyncStore(store.id)}
                    disabled={syncing[store.id]}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={syncing[store.id] ? 'animate-spin' : ''} />
                    {syncing[store.id] ? 'Syncing...' : 'Sync Products'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Stores;