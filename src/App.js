import React, { useState, useEffect } from 'react';
import { AlertCircle, Package, DollarSign, TrendingUp, Phone, Mail, MapPin, RefreshCw, Calendar, Clock } from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://white-mousse-backend-production.up.railway.app';

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

      const [dashboardRes, storesRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard`),
        fetch(`${API_URL}/api/stores`),
        fetch(`${API_URL}/api/orders`)
      ]);

      const dashboardData = await dashboardRes.json();
      const storesData = await storesRes.json();
      const ordersData = await ordersRes.json();

      if (!dashboardData.success) throw new Error(dashboardData.error);

      setStats(dashboardData.stats);
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
      const response = await fetch(`${API_URL}/api/sync`, { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Synced ${data.orders} orders and ${data.companies} stores!`);
        loadDashboard();
      } else {
        alert('❌ Sync failed: ' + data.error);
      }
    } catch (error) {
      alert('❌ Sync failed: ' + error.message);
    } finally {
      setSyncing(false);
    }
  }

  // Calculate store intelligence with reorder urgency
  const storeIntelligence = stores.map(store => {
    const storeOrders = orders.filter(o => 
      o.buyer_name?.toLowerCase().includes(store.name.toLowerCase()) ||
      store.name.toLowerCase().includes(o.buyer_name?.toLowerCase())
    );

    // Sort by date
    const sortedOrders = storeOrders.sort((a, b) => 
      new Date(b.order_date) - new Date(a.order_date)
    );

    const totalRevenue = storeOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const lastOrder = sortedOrders[0];
    
    // Calculate days since last order
    const daysSinceLastOrder = lastOrder 
      ? Math.floor((new Date() - new Date(lastOrder.order_date)) / (1000 * 60 * 60 * 24))
      : 999;

    // Calculate average order cycle (days between orders)
    let avgCycle = 14; // default
    if (sortedOrders.length >= 2) {
      const cycles = [];
      for (let i = 0; i < sortedOrders.length - 1; i++) {
        const days = Math.floor(
          (new Date(sortedOrders[i].order_date) - new Date(sortedOrders[i + 1].order_date)) / (1000 * 60 * 60 * 24)
        );
        if (days > 0 && days < 90) cycles.push(days); // filter outliers
      }
      if (cycles.length > 0) {
        avgCycle = Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);
      }
    }

    // Calculate urgency
    let urgency = 'good';
    let urgencyScore = 0;
    
    if (daysSinceLastOrder > avgCycle * 1.5) {
      urgency = 'urgent';
      urgencyScore = daysSinceLastOrder - avgCycle;
    } else if (daysSinceLastOrder > avgCycle * 1.2) {
      urgency = 'warning';
      urgencyScore = daysSinceLastOrder - avgCycle;
    }

    return {
      ...store,
      orderCount: storeOrders.length,
      totalRevenue,
      lastOrder,
      daysSinceLastOrder,
      avgCycle,
      urgency,
      urgencyScore,
      revenue90d: storeOrders
        .filter(o => new Date(o.order_date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
    };
  });

  // Sort by urgency score (highest first)
  const sortedStores = storeIntelligence.sort((a, b) => {
    if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
    if (a.urgency !== 'urgent' && b.urgency === 'urgent') return 1;
    if (a.urgency === 'warning' && b.urgency === 'good') return -1;
    if (a.urgency === 'good' && b.urgency === 'warning') return 1;
    return b.urgencyScore - a.urgencyScore;
  });

  const urgentCount = sortedStores.filter(s => s.urgency === 'urgent').length;
  const warningCount = sortedStores.filter(s => s.urgency === 'warning').length;

  if (selectedStore) {
    const storeOrders = orders.filter(o => 
      o.buyer_name?.toLowerCase().includes(selectedStore.name.toLowerCase()) ||
      selectedStore.name.toLowerCase().includes(o.buyer_name?.toLowerCase())
    );
    return <StoreDetail store={selectedStore} orders={storeOrders} onBack={() => setSelectedStore(null)} />;
  }

  if (error) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1>🍄 White Mousse Sales Dashboard</h1>
            <p>Connection Error</p>
          </div>
        </header>
        <div className="container">
          <div className="alert-box" style={{background: '#fee', border: '2px solid #fcc'}}>
            <AlertCircle size={24} />
            <div>
              <h4>API Connection Error</h4>
              <p>{error}</p>
              <button onClick={loadDashboard} className="action-btn primary" style={{marginTop: '1rem'}}>
                Retry Connection
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
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            <RefreshCw size={18} className={syncing ? 'spinning' : ''} />
            {syncing ? 'Syncing...' : 'Sync LeafLink'}
          </button>
        </div>
      </header>

      <div className="container">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading intelligence data...</p>
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="stats-grid">
              <div className="stat-card red">
                <div className="stat-label">🔥 Urgent Follow-Up</div>
                <div className="stat-value">{urgentCount}</div>
                <div className="stat-sublabel">Overdue for reorder</div>
              </div>
              <div className="stat-card yellow">
                <div className="stat-label">⚠️ Warning</div>
                <div className="stat-value">{warningCount}</div>
                <div className="stat-sublabel">Due soon</div>
              </div>
              <div className="stat-card green">
                <div className="stat-label">✅ Good</div>
                <div className="stat-value">{sortedStores.length - urgentCount - warningCount}</div>
                <div className="stat-sublabel">On schedule</div>
              </div>
              <div className="stat-card blue">
                <div className="stat-label">💰 Revenue</div>
                <div className="stat-value">${(parseFloat(stats?.total_revenue || 0) / 1000).toFixed(0)}K</div>
                <div className="stat-sublabel">{stats?.total_orders} orders • ${parseFloat(stats?.avg_order_value || 0).toLocaleString()} avg</div>
              </div>
            </div>

            {/* Commission Tracker */}
            <div className="commission-banner" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{margin: 0, fontSize: '1.2rem'}}>💵 Total Commissions (8%)</h3>
                <p style={{margin: '0.5rem 0 0 0', opacity: 0.9}}>Based on {stats?.total_orders} orders</p>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '2.5rem', fontWeight: 'bold'}}>
                  ${parseFloat(stats?.total_commission || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Store Intelligence List */}
            <div className="stores-container">
              <div className="stores-header">
                <h2>🎯 Store Intelligence ({sortedStores.length} stores)</h2>
                <p>Sorted by reorder urgency • Click for details & contact info</p>
              </div>

              {sortedStores.length === 0 ? (
                <div className="alert-box">
                  <AlertCircle size={24} />
                  <div>
                    <h4>No stores found</h4>
                    <p>Click "Sync LeafLink" to fetch your stores and orders</p>
                  </div>
                </div>
              ) : (
                <div className="stores-list">
                  {sortedStores.map(store => (
                    <StoreCardEnhanced
                      key={store.id}
                      store={store}
                      onClick={() => setSelectedStore(store)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StoreCardEnhanced({ store, onClick }) {
  const urgencyConfig = {
    urgent: { 
      color: 'card-urgent', 
      label: 'URGENT - CALL NOW', 
      icon: '🔥',
      bg: '#fee'
    },
    warning: { 
      color: 'card-warning', 
      label: 'FOLLOW UP SOON', 
      icon: '⚠️',
      bg: '#fffbeb'
    },
    good: { 
      color: 'card-good', 
      label: 'ON SCHEDULE', 
      icon: '✅',
      bg: '#f0fdf4'
    }
  };

  const config = urgencyConfig[store.urgency];

  return (
    <div 
      className={`store-card ${config.color}`} 
      onClick={onClick}
      style={{background: config.bg, cursor: 'pointer'}}
    >
      <div className="store-card-header">
        <div>
          <h3>{config.icon} {store.name}</h3>
          <p className="store-location">📍 {store.city}</p>
          {store.buyer_name && (
            <p className="store-location" style={{fontSize: '0.85rem', marginTop: '0.25rem'}}>
              👤 {store.buyer_name}
            </p>
          )}
        </div>
        <div className="store-revenue">
          <div className="revenue-amount">${store.revenue90d.toLocaleString()}</div>
          <div className="revenue-label">90-day revenue</div>
          <div className="revenue-label" style={{marginTop: '0.25rem'}}>
            {store.orderCount} orders total
          </div>
        </div>
      </div>

      <div className="store-card-body">
        <div className="store-alert">
          <Clock size={18} />
          <span>
            <strong>Last order: {store.daysSinceLastOrder} days ago</strong>
            {store.daysSinceLastOrder > store.avgCycle && (
              <span style={{color: '#dc2626', marginLeft: '0.5rem'}}>
                ({store.daysSinceLastOrder - store.avgCycle} days overdue!)
              </span>
            )}
          </span>
        </div>
        <div className="store-alert">
          <Calendar size={18} />
          <span>Typical reorder cycle: Every {store.avgCycle} days</span>
        </div>
      </div>

      <div className="store-card-footer">
        <span className={`urgency-badge ${store.urgency}`}>{config.label}</span>
        <button className="view-btn">
          {store.buyer_phone ? `📞 ${store.buyer_phone}` : 'View Details →'}
        </button>
      </div>
    </div>
  );
}

function StoreDetail({ store, orders, onBack }) {
  const sortedOrders = orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;
  const commission = totalRevenue * 0.08;

  const lastOrder = sortedOrders[0];
  const daysSinceLastOrder = lastOrder 
    ? Math.floor((new Date() - new Date(lastOrder.order_date)) / (1000 * 60 * 60 * 24))
    : null;

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
            {store.buyer_name && <span>👤 {store.buyer_name}</span>}
          </div>
        </div>
      </header>

      <div className="container">
        {/* Key Metrics */}
        <div className="detail-grid">
          <div className="detail-card">
            <h3>💰 Total Revenue</h3>
            <div className="detail-value">${totalRevenue.toLocaleString()}</div>
            <p style={{fontSize: '0.9rem', color: '#666', margin: '0.5rem 0 0 0'}}>
              Commission: ${commission.toFixed(2)}
            </p>
          </div>
          <div className="detail-card">
            <h3>📦 Total Orders</h3>
            <div className="detail-value">{orders.length}</div>
            <p style={{fontSize: '0.9rem', color: '#666', margin: '0.5rem 0 0 0'}}>
              Avg: ${avgOrder.toFixed(2)}
            </p>
          </div>
          <div className="detail-card">
            <h3>📅 Last Order</h3>
            <div className="detail-value">
              {daysSinceLastOrder !== null ? `${daysSinceLastOrder} days ago` : 'No orders'}
            </div>
            {store.avgCycle && daysSinceLastOrder > store.avgCycle && (
              <p style={{fontSize: '0.9rem', color: '#dc2626', margin: '0.5rem 0 0 0', fontWeight: 'bold'}}>
                ⚠️ {daysSinceLastOrder - store.avgCycle} days overdue
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons" style={{marginTop: '2rem'}}>
          {store.buyer_phone && (
            <a href={`tel:${store.buyer_phone}`} className="action-btn primary">
              📞 Call {store.buyer_name || 'Store'}
            </a>
          )}
          {store.buyer_email && (
            <a href={`mailto:${store.buyer_email}`} className="action-btn secondary">
              📧 Email {store.buyer_name || 'Store'}
            </a>
          )}
          <button className="action-btn secondary" onClick={() => alert('SMS feature coming soon!')}>
            💬 Send SMS
          </button>
        </div>

        {/* Reorder Alert */}
        {daysSinceLastOrder > store.avgCycle && (
          <div className="alert-box" style={{background: '#fee', border: '2px solid #fcc', marginTop: '2rem'}}>
            <AlertCircle size={24} color="#dc2626" />
            <div>
              <h4 style={{color: '#dc2626'}}>🔥 REORDER OVERDUE</h4>
              <p>
                This store typically orders every <strong>{store.avgCycle} days</strong>.
                Last order was <strong>{daysSinceLastOrder} days ago</strong>.
              </p>
              <p style={{fontWeight: 'bold', marginTop: '1rem'}}>
                📞 ACTION: Call today to check inventory and take new order!
              </p>
            </div>
          </div>
        )}

        {/* Order History */}
        <div className="orders-container" style={{marginTop: '2rem'}}>
          <h3>📋 Order History ({orders.length} orders)</h3>
          <div className="orders-table" style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#f5f5f5', textAlign: 'left'}}>
                  <th style={{padding: '1rem'}}>Date</th>
                  <th style={{padding: '1rem'}}>Order #</th>
                  <th style={{padding: '1rem'}}>Amount</th>
                  <th style={{padding: '1rem'}}>Status</th>
                  <th style={{padding: '1rem'}}>Commission</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map(order => (
                  <tr key={order.id} style={{borderBottom: '1px solid #eee'}}>
                    <td style={{padding: '1rem'}}>
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td style={{padding: '1rem', fontFamily: 'monospace'}}>
                      {order.order_number?.slice(0, 8)}
                    </td>
                    <td style={{padding: '1rem', fontWeight: 'bold'}}>
                      ${parseFloat(order.total_amount || 0).toFixed(2)}
                    </td>
                    <td style={{padding: '1rem'}}>
                      <span className={`status-badge ${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{padding: '1rem', color: '#16a34a'}}>
                      ${(parseFloat(order.total_amount || 0) * 0.08).toFixed(2)}
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
