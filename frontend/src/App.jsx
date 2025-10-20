import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">
          Commerce Central
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">
            Welcome to Your E-Commerce Command Center
          </h2>
          <p className="text-gray-600 mb-4">
            Connect and manage all your e-commerce stores in one place.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">🛍️</div>
              <h3 className="font-semibold">Shopify</h3>
              <p className="text-sm text-gray-500">Connect your store</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">📦</div>
              <h3 className="font-semibold">Walmart</h3>
              <p className="text-sm text-gray-500">Marketplace ready</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold">Amazon</h3>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;