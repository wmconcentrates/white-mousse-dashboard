import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AlertCircle, Package, DollarSign, TrendingUp, Phone, Mail, MapPin, Zap } from 'lucide-react';
import './App.css';

// Initialize Supabase
const supabase = createClient(
  'https://nspmwcpvukehaqswaewt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zcG13Y3B2dWtlaGFxc3dhZXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NzE2NDQsImV4cCI6MjA3NzA0NzY0NH0.JGYZ4223nhgO_Er619DkB0tOXrIJzfldG9yNkaHCdtI'
);

function App() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(null);
  const [stats, setStats] = useState({ total: 0, urgent: 0, warning: 0 });

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    try {
      setLoading(true);
      
      // For now, load sample data
      // In phase 2, this will query real data from Supabase
      const sampleStores = generateSampleStores();
      
      setStores(sampleStores);
      
      // Calculate stats
      const urgent = sampleStores.filter(s => s.urgency === 'urgent').length;
      const warning = sampleStores.filter(s => s.urgency === 'warning').length;
      
      setStats({
        total: sampleStores.length,
        urgent,
        warning
      });
      
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateSampleStores() {
    const storeNames = [
      "Rocky Mountain High", "Green Solution", "The Green Room", "Lightshade",
      "Native Roots", "Starbuds", "Cannabis Station", "Medicine Man"
    ];
    
    return storeNames.map((name, i) => ({
      id: i + 1,
      name,
      city: ['Denver', 'Boulder', 'Aurora'][i % 3],
      lastOrder: Math.floor(Math.random() * 30) + 1,
      avgCycle: Math.floor(Math.random() * 10) + 12,
      revenue90d: Math.floor(Math.random() * 30000) + 10000,
      urgency: i < 3 ? 'urgent' : i < 6 ? 'warning' : 'good',
      phone: '(303) 555-' + String(1000 + i).padStart(4, '0'),
      email: name.toLowerCase().replace(/\s/g, '') + '@dispensary.com'
    }));
  }

  if (selectedStore) {
    return <StoreDetail store={selectedStore} onBack={() => setSelectedStore(null)} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🏔️ White Mousse Sales Dashboard</h1>
          <p>Real-time Intelligence • LeafLink Integration</p>
        </div>
      </header>

      <div className="container">
        <div className="stats-grid">
          <div className="stat-card red">
            <div className="stat-label">🔴 Urgent</div>
            <div className="stat-value">{stats.urgent}</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-label">🟡 Warning</div>
            <div className="stat-value">{stats.warning}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">🟢 Good</div>
            <div className="stat-value">{stats.total - stats.urgent - stats.warning}</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-label">💰 Total Stores</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading stores...</p>
          </div>
        ) : (
          <div className="stores-container">
            <div className="stores-header">
              <h2>Active Stores ({stores.length})</h2>
              <p>Sorted by urgency</p>
            </div>
            
            <div className="stores-list">
              {stores.map(store => (
                <StoreCard 
                  key={store.id} 
                  store={store} 
                  onClick={() => setSelectedStore(store)} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StoreCard({ store, onClick }) {
  const urgencyConfig = {
    urgent: { color: 'card-urgent', label: 'URGENT', icon: '🔴' },
    warning: { color: 'card-warning', label: 'FOLLOW UP', icon: '🟡' },
    good: { color: 'card-good', label: 'GOOD', icon: '🟢' }
  };
  
  const config = urgencyConfig[store.urgency];
  
  return (
    <div className={`store-card ${config.color}`} onClick={onClick}>
      <div className="store-card-header">
        <div>
          <h3>{config.icon} {store.name}</h3>
          <p className="store-location">📍 {store.city}</p>
        </div>
        <div className="store-revenue">
          <div className="revenue-amount">${store.revenue90d.toLocaleString()}</div>
          <div className="revenue-label">90-day revenue</div>
        </div>
      </div>
      
      <div className="store-card-body">
        <div className="store-alert">
          <AlertCircle size={18} />
          <span>Last order: {store.lastOrder} days ago (avg: {store.avgCycle} days)</span>
        </div>
      </div>
      
      <div className="store-card-footer">
        <span className={`urgency-badge ${store.urgency}`}>{config.label}</span>
        <button className="view-btn">View Details →</button>
      </div>
    </div>
  );
}

function StoreDetail({ store, onBack }) {
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <button onClick={onBack} className="back-btn">← Back to Dashboard</button>
          <h1>{store.name}</h1>
          <div className="store-contact">
            <span>📍 {store.city}</span>
            <span>📞 {store.phone}</span>
            <span>📧 {store.email}</span>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="detail-grid">
          <div className="detail-card">
            <h3>90-Day Revenue</h3>
            <div className="detail-value">${store.revenue90d.toLocaleString()}</div>
          </div>
          <div className="detail-card">
            <h3>Last Order</h3>
            <div className="detail-value">{store.lastOrder} days ago</div>
          </div>
          <div className="detail-card">
            <h3>Order Cycle</h3>
            <div className="detail-value">Every {store.avgCycle} days</div>
          </div>
        </div>

        <div className="alert-box">
          <AlertCircle size={24} />
          <div>
            <h4>Reorder Status</h4>
            <p>This store typically orders every {store.avgCycle} days. Last order was {store.lastOrder} days ago.</p>
            {store.lastOrder > store.avgCycle && (
              <p className="alert-urgent">⚠️ OVERDUE by {store.lastOrder - store.avgCycle} days</p>
            )}
          </div>
        </div>

        <div className="action-buttons">
          <button className="action-btn primary">📞 Call Store</button>
          <button className="action-btn secondary">📧 Send Email</button>
          <button className="action-btn secondary">📋 View Orders</button>
        </div>

        <div className="info-box">
          <h3>🚀 Coming Soon</h3>
          <ul>
            <li>✅ Order history from LeafLink</li>
            <li>✅ Live inventory via Metrc</li>
            <li>✅ Commission tracking</li>
            <li>✅ Product preferences</li>
            <li>✅ Auto-reorder predictions</li>
          </ul>
          <p>Phase 1: Basic dashboard ← <strong>YOU ARE HERE</strong></p>
          <p>Phase 2: LeafLink data integration (next week)</p>
          <p>Phase 3: QuickBooks commissions (week 3)</p>
        </div>
      </div>
    </div>
  );
}

export default App;
