import React, { useState, useEffect } from 'react';
import { AlertCircle, Package, DollarSign, TrendingUp, Phone, Mail, MapPin, Zap, RefreshCw } from 'lucide-react';
import './App.css';

// Your Railway API URL - UPDATE THIS!
const API_URL = process.env.REACT_APP_API_URL || 'https://your-app.railway.app';

function App() {
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data from Railway API
      const response = await fetch(`${API_URL}/api/dashboard`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load dashboard');
      }

      // Fetch stores
      const storesResponse = await fetch(`${API_URL}/api/stores`);
      const storesData = await storesResponse.json();

      // Fetch orders
      const ordersResponse = await fetch(`${API_URL}/api/orders`);
      const ordersData = await ordersResponse.json();

      setStats(data.stats);
      setStores(storesData.stores || []);
      setOrders(ordersData.orders || []);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function syncData() {
    try {
      setSyncing(true);
      const response = await fetch(`${API_URL}/api/sync`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Synced ${data.orders} orders and ${data.companies} stores!`);
        loadDashboard(); // Reload dashboard
      } else {
        alert('❌ Sync failed: ' + data.error);
      }
    } catch (error) {
      alert('❌ Sync failed: ' + error.message);
    } finally {
      setSyncing(false);
    }
  }

  // Group orders by store
  const storeStats = stores.map(store => {
    const storeOrders = orders.filter(o => o.buyer_name === store.name);
    const totalRevenue = storeOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const lastOrder = storeOrders.length > 0 
      ? storeOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date))[0]
      : null;

    return {
      ...store,
      orderCount: storeOrders.length,
      totalRevenue,
      lastOrder,
      lastOrderDays: lastOrder 
        ? Math.floor((new Date() - new Date(lastOrder.order_date)) / (1000 * 60 * 60 * 24))
        : null
    };
  });

  if (selectedStore) {
    const storeOrders = orders.filter(o => o.buyer_name === selectedStore.name);
    return <StoreDetail store={selectedStore} orders={storeOrders} onBack={() => setSelectedStore(null)} />;
  }

  if (error) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1>🍄 White Mousse Sales Dashboard</h1>
            <p>Error loading data</p>
          </div>
        </header>
        <div className="container">
          <div className="alert-box" style={{background: '#fee', border: '2px solid #fcc'}}>
            <AlertCircle size={24} />
            <div>
              <h4>Connection Error</h4>
              <p>{error}</p>
              <p><strong>Make sure your Railway API URL is configured correctly!</strong></p>
              <button onClick={loadDashboard} className="action-btn primary" style={{marginTop: '1rem'}}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>🍄 White Mousse Sales Dashboard</h1>
            <p>Real-time Intelligence • LeafLink Integration</p>
          </div>
          <button 
            onClick={syncData} 
            disabled={syncing}
            className="sync-btn"
            style={{
              padding: '0.75rem 1.5rem',
              background: syncing ? '#666' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem'
            }}
          >
            <RefreshCw size={18} className={syncing ? 'spinning' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </header>

      <div className="container">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-label">📦 Total Orders</div>
                <div className="stat-value">{stats?.total_orders || 0}</div>
              </div>
              <div className="stat-card green">
                <div className="stat-label">💰 Total Revenue</div>
                <div className="stat-value">${parseFloat(stats?.total_revenue || 0).toLocaleString()}</div>
              </div>
              <div className="stat-card yellow">
                <div className="stat-label">📊 Avg Order</div>
                <div className="stat-value">${parseFloat(stats?.avg_order_value || 0).toLocaleString()}</div>
              </div>
              <div className="stat-card red">
                <div className="stat-label">💵 Commissions (8%)</div>
                <div className="stat-value">${parseFloat(stats?.total_commission || 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="stores-container">
              <div className="stores-header">
                <h2>Active Stores ({stores.length})</h2>
                <p>Click to view details</p>
              </div>

              {storeStats.length === 0 ? (
                <div className="alert-box">
                  <AlertCircle size={24} />
                  <div>
                    <h4>No stores found</h4>
                    <p>Click "Sync Now" to fetch stores from LeafLink</p>
                  </div>
                </div>
              ) : (
                <div className="stores-list">
                  {storeStats.map(store => (
                    <StoreCardLive
                      key={store.id}
                      store={store}
                      onClick={() => setSelectedStore(store)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="orders-container" style={{marginTop: '2rem'}}>
              <div className="stores-header">
                <h2>Recent Orders ({orders.length})</h2>
                <p>Last 10 orders</p>
              </div>

              <div className="orders-table">
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{background: '#f5f5f5', textAlign: 'left'}}>
                      <th style={{padding: '1rem'}}>Order #</th>
                      <th style={{padding: '1rem'}}>Store</th>
                      <th style={{padding: '1rem'}}>Amount</th>
                      <th style={{padding: '1rem'}}>Status</th>
                      <th style={{padding: '1rem'}}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map(order => (
                      <tr key={order.id} style={{borderBottom: '1px solid #eee'}}>
                        <td style={{padding: '1rem'}}>{order.order_number}</td>
                        <td style={{padding: '1rem'}}>{order.buyer_name}</td>
                        <td style={{padding: '1rem', fontWeight: 'bold'}}>
                          ${parseFloat(order.total_amount || 0).toFixed(2)}
                        </td>
                        <td style={{padding: '1rem'}}>
                          <span className={`status-badge ${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{padding: '1rem'}}>
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StoreCardLive({ store, onClick }) {
  return (
    <div className="store-card card-good" onClick={onClick}>
      <div className="store-card-header">
        <div>
          <h3>🏪 {store.name}</h3>
          <p className="store-location">📍 {store.city}</p>
        </div>
        <div className="store-revenue">
          <div className="revenue-amount">${store.totalRevenue.toLocaleString()}</div>
          <div className="revenue-label">Total Revenue</div>
        </div>
      </div>

      <div className="store-card-body">
        <div className="store-alert">
          <Package size={18} />
          <span>{store.orderCount} orders</span>
        </div>
        {store.lastOrderDays !== null && (
          <div className="store-alert">
            <AlertCircle size={18} />
            <span>Last order: {store.lastOrderDays} days ago</span>
          </div>
        )}
      </div>

      <div className="store-card-footer">
        <span className="urgency-badge good">ACTIVE</span>
        <button className="view-btn">View Details →</button>
      </div>
    </div>
  );
}

function StoreDetail({ store, orders, onBack }) {
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <button onClick={onBack} className="back-btn">← Back to Dashboard</button>
          <h1>{store.name}</h1>
          <div className="store-contact">
            <span>📍 {store.city}</span>
            {store.buyer_phone && <span>📞 {store.buyer_phone}</span>}
            {store.buyer_email && <span>📧 {store.buyer_email}</span>}
          </div>
        </div>
      </header>

      <div className="container">
        <div className="detail-grid">
          <div className="detail-card">
            <h3>Total Revenue</h3>
            <div className="detail-value">${totalRevenue.toLocaleString()}</div>
          </div>
          <div className="detail-card">
            <h3>Total Orders</h3>
            <div className="detail-value">{orders.length}</div>
          </div>
          <div className="detail-card">
            <h3>Avg Order Value</h3>
            <div className="detail-value">${avgOrder.toFixed(2)}</div>
          </div>
        </div>

        <div className="orders-container" style={{marginTop: '2rem'}}>
          <h3>Order History</h3>
          <div className="orders-table">
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#f5f5f5', textAlign: 'left'}}>
                  <th style={{padding: '1rem'}}>Order #</th>
                  <th style={{padding: '1rem'}}>Amount</th>
                  <th style={{padding: '1rem'}}>Status</th>
                  <th style={{padding: '1rem'}}>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} style={{borderBottom: '1px solid #eee'}}>
                    <td style={{padding: '1rem'}}>{order.order_number}</td>
                    <td style={{padding: '1rem', fontWeight: 'bold'}}>
                      ${parseFloat(order.total_amount || 0).toFixed(2)}
                    </td>
                    <td style={{padding: '1rem'}}>
                      <span className={`status-badge ${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{padding: '1rem'}}>
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
