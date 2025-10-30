import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Phone, Mail, MapPin, TrendingUp, TrendingDown, 
  Package, Clock, Calendar, DollarSign, RefreshCw, ChevronRight,
  BarChart3, PieChart, Activity, Target, ArrowLeft, X
} from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://white-mousse-backend-production.up.railway.app';

function App() {
  const [storeIntelligence, setStoreIntelligence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSalesIntelligence();
  }, []);

  async function loadSalesIntelligence() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/sales-intelligence`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load sales intelligence');
      }

      setStoreIntelligence(data.stores || []);

    } catch (error) {
      console.error('Error loading sales intelligence:', error);
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
        alert(`✅ Synced!\n\n${data.orders} orders\n${data.lineItems} products\n${data.companies} stores`);
        loadSalesIntelligence();
      } else {
        alert('❌ Sync failed: ' + data.error);
      }
    } catch (error) {
      alert('❌ Sync failed: ' + error.message);
    } finally {
      setSyncing(false);
    }
  }

  // Filter and sort stores
  const filteredStores = storeIntelligence
    .filter(store => {
      if (filterUrgency !== 'all' && store.urgency !== filterUrgency) return false;
      if (searchTerm && !store.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const urgencyOrder = { urgent: 0, warning: 1, good: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return b.daysSinceLastOrder - a.daysSinceLastOrder;
    });

  const urgentCount = storeIntelligence.filter(s => s.urgency === 'urgent').length;
  const warningCount = storeIntelligence.filter(s => s.urgency === 'warning').length;
  const goodCount = storeIntelligence.filter(s => s.urgency === 'good').length;

  if (selectedStore) {
    return <StoreDetailPage store={selectedStore} onBack={() => setSelectedStore(null)} />;
  }

  if (error) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1>🍄 White Mousse Sales Intelligence</h1>
            <p>Connection Error</p>
          </div>
        </header>
        <div className="container">
          <div style={{
            background: '#fee',
            border: '2px solid #fcc',
            borderRadius: '12px',
            padding: '2rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'start'
          }}>
            <AlertCircle size={32} color="#dc2626" />
            <div style={{flex: 1}}>
              <h3 style={{margin: '0 0 0.5rem 0', color: '#dc2626'}}>API Connection Error</h3>
              <p style={{margin: '0 0 1rem 0'}}>{error}</p>
              <p style={{fontSize: '0.9rem', color: '#666'}}>
                Make sure:<br/>
                • Backend is deployed to Railway<br/>
                • Environment variable REACT_APP_API_URL is set in Vercel<br/>
                • Database schema is created in Supabase
              </p>
              <button 
                onClick={loadSalesIntelligence}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
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
            <h1>🍄 White Mousse Sales Intelligence</h1>
            <p>Product Analytics • Reorder Tracking • Strain Insights</p>
          </div>
          <button 
            onClick={syncData} 
            disabled={syncing}
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
            <p>Loading sales intelligence...</p>
          </div>
        ) : (
          <>
            {/* Priority Action Cards */}
            <div className="stats-grid">
              <div 
                className="stat-card red" 
                style={{cursor: 'pointer'}} 
                onClick={() => setFilterUrgency(filterUrgency === 'urgent' ? 'all' : 'urgent')}
              >
                <div className="stat-label">🔥 URGENT - Call Today</div>
                <div className="stat-value">{urgentCount}</div>
                <div className="stat-sublabel">Stores overdue for reorder</div>
              </div>
              <div 
                className="stat-card yellow" 
                style={{cursor: 'pointer'}} 
                onClick={() => setFilterUrgency(filterUrgency === 'warning' ? 'all' : 'warning')}
              >
                <div className="stat-label">⚠️ Warning - Follow Up</div>
                <div className="stat-value">{warningCount}</div>
                <div className="stat-sublabel">Approaching reorder time</div>
              </div>
              <div 
                className="stat-card green" 
                style={{cursor: 'pointer'}} 
                onClick={() => setFilterUrgency(filterUrgency === 'good' ? 'all' : 'good')}
              >
                <div className="stat-label">✅ Good - On Schedule</div>
                <div className="stat-value">{goodCount}</div>
                <div className="stat-sublabel">Not due yet</div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <input
                type="text"
                placeholder="🔍 Search stores by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                <FilterButton 
                  active={filterUrgency === 'all'}
                  onClick={() => setFilterUrgency('all')}
                  color="#3b82f6"
                >
                  All ({storeIntelligence.length})
                </FilterButton>
                <FilterButton 
                  active={filterUrgency === 'urgent'}
                  onClick={() => setFilterUrgency('urgent')}
                  color="#ef4444"
                  bgColor="#fee2e2"
                >
                  🔥 Urgent ({urgentCount})
                </FilterButton>
                <FilterButton 
                  active={filterUrgency === 'warning'}
                  onClick={() => setFilterUrgency('warning')}
                  color="#f59e0b"
                  bgColor="#fef3c7"
                >
                  ⚠️ Warning ({warningCount})
                </FilterButton>
              </div>
            </div>

            {/* Store Intelligence Cards */}
            <div className="stores-container">
              <div className="stores-header">
                <h2>🎯 Store Intelligence ({filteredStores.length} stores)</h2>
                <p>Sorted by urgency • Click for full product intelligence & contact actions</p>
              </div>

              {filteredStores.length === 0 ? (
                <div style={{
                  background: 'white',
                  padding: '3rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <AlertCircle size={48} color="#9ca3af" style={{margin: '0 auto 1rem'}} />
                  <h3 style={{color: '#6b7280', margin: '0 0 0.5rem 0'}}>No stores match your filters</h3>
                  <p style={{color: '#9ca3af', margin: 0}}>Try adjusting your search or filter settings</p>
                </div>
              ) : (
                <div className="stores-list">
                  {filteredStores.map(store => (
                    <StoreIntelCard
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

function FilterButton({ active, onClick, color, bgColor, children }) {
  return (
    <button 
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '6px',
        background: active ? color : (bgColor || '#e5e7eb'),
        color: active ? 'white' : color,
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.875rem',
        transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  );
}

function StoreIntelCard({ store, onClick }) {
  const urgencyConfig = {
    urgent: { 
      color: '#fee2e2', 
      border: '#ef4444',
      label: '🔥 URGENT - CALL NOW', 
      textColor: '#dc2626'
    },
    warning: { 
      color: '#fef3c7', 
      border: '#f59e0b',
      label: '⚠️ FOLLOW UP SOON',
      textColor: '#d97706'
    },
    good: { 
      color: '#f0fdf4', 
      border: '#22c55e',
      label: '✅ ON SCHEDULE',
      textColor: '#16a34a'
    }
  };

  const config = urgencyConfig[store.urgency];
  const topProducts = store.topProducts?.slice(0, 3) || [];
  
  // Calculate strain percentages
  const totalStrainRevenue = store.strainTypeBreakdown.indica + 
                             store.strainTypeBreakdown.sativa + 
                             store.strainTypeBreakdown.hybrid;
  
  const indicaPct = totalStrainRevenue > 0 
    ? Math.round((store.strainTypeBreakdown.indica / totalStrainRevenue) * 100) 
    : 0;
  const sativaPct = totalStrainRevenue > 0 
    ? Math.round((store.strainTypeBreakdown.sativa / totalStrainRevenue) * 100) 
    : 0;
  const hybridPct = totalStrainRevenue > 0 
    ? Math.round((store.strainTypeBreakdown.hybrid / totalStrainRevenue) * 100) 
    : 0;

  return (
    <div 
      onClick={onClick}
      style={{
        background: config.color,
        border: `3px solid ${config.border}`,
        borderRadius: '12px',
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      {/* Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem'}}>
        <div style={{flex: 1}}>
          <h3 style={{margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: '700'}}>
            {store.name}
          </h3>
          <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#6b7280'}}>
            <span>📍 {store.city}</span>
            {store.buyer_name && <span>👤 {store.buyer_name}</span>}
          </div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: config.textColor}}>
            ${(store.totalRevenue / 1000).toFixed(1)}K
          </div>
          <div style={{fontSize: '0.75rem', color: '#6b7280'}}>
            {store.orderCount} orders
          </div>
        </div>
      </div>

      {/* Urgency Alert */}
      <div style={{
        background: 'white',
        padding: '0.75rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: `2px solid ${config.border}`
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem'}}>
          <Clock size={16} color={config.textColor} />
          <span style={{fontWeight: '600', color: config.textColor}}>
            Last order: {store.daysSinceLastOrder} days ago
          </span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280'}}>
          <Calendar size={14} />
          <span>Typical cycle: Every {store.avgCycle} days</span>
        </div>
        {store.daysSinceLastOrder > store.avgCycle && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: config.border,
            color: 'white',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '700',
            textAlign: 'center'
          }}>
            ⚠️ {store.daysSinceLastOrder - store.avgCycle} DAYS OVERDUE!
          </div>
        )}
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div style={{marginBottom: '1rem'}}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            color: '#6b7280',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            📦 Top Products
          </div>
          {topProducts.map((product, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem',
                background: 'white',
                borderRadius: '6px',
                marginBottom: '0.25rem',
                fontSize: '0.875rem'
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <span style={{fontWeight: '700', color: '#9ca3af'}}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </span>
                <span style={{fontWeight: '500'}}>
                  {product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name}
                </span>
                {product.strain_type && (
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '4px',
                    background: product.strain_type.toLowerCase().includes('indica') ? '#e9d5ff' :
                                product.strain_type.toLowerCase().includes('sativa') ? '#d1fae5' : '#fef3c7',
                    color: product.strain_type.toLowerCase().includes('indica') ? '#7c3aed' :
                           product.strain_type.toLowerCase().includes('sativa') ? '#059669' : '#d97706',
                    fontWeight: '600'
                  }}>
                    {product.strain_type.toLowerCase().includes('indica') ? '🟣 I' :
                     product.strain_type.toLowerCase().includes('sativa') ? '🟢 S' : '🟡 H'}
                  </span>
                )}
              </div>
              <span style={{fontWeight: '600', color: '#6b7280'}}>
                {product.quantity} units
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Strain Preference */}
      {totalStrainRevenue > 0 && (
        <div style={{marginBottom: '1rem'}}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            color: '#6b7280',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            🌿 Strain Preference
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {indicaPct > 0 && (
              <div style={{
                flex: indicaPct,
                background: '#7c3aed',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                🟣 {indicaPct}%
              </div>
            )}
            {sativaPct > 0 && (
              <div style={{
                flex: sativaPct,
                background: '#059669',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                🟢 {sativaPct}%
              </div>
            )}
            {hybridPct > 0 && (
              <div style={{
                flex: hybridPct,
                background: '#d97706',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                🟡 {hybridPct}%
              </div>
            )}
          </div>
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#6b7280',
            display: 'flex',
            justifyContent: 'space-around'
          }}>
            {indicaPct > 0 && <span>Indica</span>}
            {sativaPct > 0 && <span>Sativa</span>}
            {hybridPct > 0 && <span>Hybrid</span>}
          </div>
        </div>
      )}

      {/* Footer with Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '1rem',
        borderTop: '2px solid rgba(0,0,0,0.1)'
      }}>
        <div style={{
          padding: '0.5rem 1rem',
          background: config.textColor,
          color: 'white',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: '700'
        }}>
          {config.label}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: config.textColor,
          fontWeight: '600',
          fontSize: '0.875rem'
        }}>
          {store.buyer_phone && (
            <Phone size={16} />
          )}
          <span>View Full Intel</span>
          <ChevronRight size={20} />
        </div>
      </div>
    </div>
  );
}

function StoreDetailPage({ store, onBack }) {
  const topProducts = store.topProducts || [];
  const categories = Object.entries(store.categoryBreakdown || {}).sort((a, b) => b[1] - a[1]);
  
  const totalStrainRevenue = store.strainTypeBreakdown.indica + 
                             store.strainTypeBreakdown.sativa + 
                             store.strainTypeBreakdown.hybrid;
  
  const indicaPct = totalStrainRevenue > 0 
    ? ((store.strainTypeBreakdown.indica / totalStrainRevenue) * 100).toFixed(1)
    : 0;
  const sativaPct = totalStrainRevenue > 0 
    ? ((store.strainTypeBreakdown.sativa / totalStrainRevenue) * 100).toFixed(1)
    : 0;
  const hybridPct = totalStrainRevenue > 0 
    ? ((store.strainTypeBreakdown.hybrid / totalStrainRevenue) * 100).toFixed(1)
    : 0;

  const avgOrder = store.orderCount > 0 ? store.totalRevenue / store.orderCount : 0;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button 
            onClick={onBack}
            style={{
              padding: '0.5rem 1rem',
              background: 'white',
              color: '#6366f1',
              border: '2px solid #6366f1',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          <div style={{flex: 1, textAlign: 'center'}}>
            <h1 style={{margin: '0 0 0.25rem 0'}}>{store.name}</h1>
            <div style={{display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.875rem'}}>
              <span>📍 {store.city}{store.state ? `, ${store.state}` : ''}</span>
              {store.buyer_name && <span>👤 {store.buyer_name}</span>}
              {store.buyer_phone && <span>📞 {store.buyer_phone}</span>}
              {store.buyer_email && <span>📧 {store.buyer_email}</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Action Buttons */}
        <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap'}}>
          {store.buyer_phone && (
            <a 
              href={`tel:${store.buyer_phone}`}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '1rem',
                background: '#22c55e',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: '700',
                fontSize: '1rem'
              }}
            >
              <Phone size={20} />
              Call {store.buyer_name || 'Store'}
            </a>
          )}
          {store.buyer_email && (
            <a 
              href={`mailto:${store.buyer_email}`}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '1rem',
                background: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: '700',
                fontSize: '1rem'
              }}
            >
              <Mail size={20} />
              Email {store.buyer_name || 'Store'}
            </a>
          )}
        </div>

        {/* Urgency Alert */}
        {store.daysSinceLastOrder > store.avgCycle && (
          <div style={{
            background: '#fee2e2',
            border: '3px solid #ef4444',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'start'
          }}>
            <AlertCircle size={32} color="#dc2626" />
            <div style={{flex: 1}}>
              <h3 style={{margin: '0 0 0.5rem 0', color: '#dc2626', fontSize: '1.25rem'}}>
                🔥 REORDER OVERDUE - CALL TODAY!
              </h3>
              <p style={{margin: '0 0 0.5rem 0', fontSize: '1rem'}}>
                This store typically orders every <strong>{store.avgCycle} days</strong>.
                Last order was <strong>{store.daysSinceLastOrder} days ago</strong>.
              </p>
              <p style={{margin: 0, fontWeight: '700', fontSize: '1rem', color: '#dc2626'}}>
                📞 OVERDUE BY {store.daysSinceLastOrder - store.avgCycle} DAYS
              </p>
            </div>
          </div>
        )}

        {/* Store Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <StatCard 
            icon="💰"
            label="Total Revenue"
            value={`$${store.totalRevenue.toLocaleString()}`}
            sublabel={`${store.orderCount} orders total`}
          />
          <StatCard 
            icon="📦"
            label="Total Orders"
            value={store.orderCount}
            sublabel={`Avg: $${avgOrder.toFixed(2)}`}
          />
          <StatCard 
            icon="📅"
            label="Last Order"
            value={`${store.daysSinceLastOrder} days ago`}
            sublabel={`Cycle: ${store.avgCycle} days`}
            alert={store.daysSinceLastOrder > store.avgCycle}
          />
          <StatCard 
            icon="🎯"
            label="Next Expected"
            value={store.daysSinceLastOrder > store.avgCycle ? 'OVERDUE' : `${store.avgCycle - store.daysSinceLastOrder} days`}
            sublabel={new Date(store.nextExpectedOrder).toLocaleDateString()}
          />
        </div>

        {/* Top 10 Products */}
        {topProducts.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Package size={24} />
              Top 10 Products They Buy
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              {topProducts.slice(0, 10).map((product, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${idx < 3 ? '#6366f1' : '#e5e7eb'}`
                  }}
                >
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem'}}>
                      <span style={{fontSize: '1.25rem', fontWeight: '700', color: '#9ca3af', minWidth: '2rem'}}>
                        #{idx + 1}
                      </span>
                      <span style={{fontWeight: '600', fontSize: '1rem'}}>
                        {product.name}
                      </span>
                      {product.strain_type && (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontWeight: '700',
                          background: product.strain_type.toLowerCase().includes('indica') ? '#e9d5ff' :
                                      product.strain_type.toLowerCase().includes('sativa') ? '#d1fae5' : '#fef3c7',
                          color: product.strain_type.toLowerCase().includes('indica') ? '#7c3aed' :
                                 product.strain_type.toLowerCase().includes('sativa') ? '#059669' : '#d97706'
                        }}>
                          {product.strain_type.toLowerCase().includes('indica') ? '🟣 Indica' :
                           product.strain_type.toLowerCase().includes('sativa') ? '🟢 Sativa' : '🟡 Hybrid'}
                        </span>
                      )}
                    </div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280', paddingLeft: '2.75rem'}}>
                      {product.category && `${product.category} • `}
                      {product.orders} order{product.orders !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: '1.25rem', fontWeight: '700', color: '#6366f1'}}>
                      {product.quantity} units
                    </div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                      ${product.revenue.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strain Preferences */}
        {totalStrainRevenue > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <PieChart size={24} />
              Strain Preferences
            </h3>
            
            {/* Visual Bar */}
            <div style={{
              height: '60px',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              marginBottom: '1rem'
            }}>
              {parseFloat(indicaPct) > 0 && (
                <div style={{
                  flex: parseFloat(indicaPct),
                  background: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.25rem'
                }}>
                  {indicaPct}%
                </div>
              )}
              {parseFloat(sativaPct) > 0 && (
                <div style={{
                  flex: parseFloat(sativaPct),
                  background: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.25rem'
                }}>
                  {sativaPct}%
                </div>
              )}
              {parseFloat(hybridPct) > 0 && (
                <div style={{
                  flex: parseFloat(hybridPct),
                  background: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.25rem'
                }}>
                  {hybridPct}%
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
              {parseFloat(indicaPct) > 0 && (
                <div style={{padding: '1rem', background: '#f3f4f6', borderRadius: '8px'}}>
                  <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>🟣</div>
                  <div style={{fontWeight: '700', fontSize: '1.25rem', color: '#7c3aed'}}>
                    {indicaPct}% Indica
                  </div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                    ${store.strainTypeBreakdown.indica.toLocaleString()}
                  </div>
                </div>
              )}
              {parseFloat(sativaPct) > 0 && (
                <div style={{padding: '1rem', background: '#f3f4f6', borderRadius: '8px'}}>
                  <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>🟢</div>
                  <div style={{fontWeight: '700', fontSize: '1.25rem', color: '#059669'}}>
                    {sativaPct}% Sativa
                  </div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                    ${store.strainTypeBreakdown.sativa.toLocaleString()}
                  </div>
                </div>
              )}
              {parseFloat(hybridPct) > 0 && (
                <div style={{padding: '1rem', background: '#f3f4f6', borderRadius: '8px'}}>
                  <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>🟡</div>
                  <div style={{fontWeight: '700', fontSize: '1.25rem', color: '#d97706'}}>
                    {hybridPct}% Hybrid
                  </div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                    ${store.strainTypeBreakdown.hybrid.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Smart Insight */}
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#eff6ff',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <Activity size={24} color="#3b82f6" />
              <div>
                <div style={{fontWeight: '700', color: '#1e40af', marginBottom: '0.25rem'}}>
                  💡 Smart Insight
                </div>
                <div style={{fontSize: '0.875rem', color: '#1e40af'}}>
                  {parseFloat(indicaPct) > 50 && 'Strong Indica preference! Recommend new Indica products.'}
                  {parseFloat(sativaPct) > 50 && 'Strong Sativa preference! Focus on Sativa products.'}
                  {parseFloat(hybridPct) > 40 && 'They love Hybrids! Push hybrid product line.'}
                  {parseFloat(indicaPct) <= 50 && parseFloat(sativaPct) <= 50 && parseFloat(hybridPct) <= 40 && 
                    'Balanced preferences - offer variety across all strain types.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {categories.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <BarChart3 size={24} />
              Category Breakdown
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              {categories.map(([category, revenue]) => {
                const pct = ((revenue / store.totalRevenue) * 100).toFixed(1);
                return (
                  <div key={category}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{fontWeight: '600'}}>{category}</span>
                      <span style={{color: '#6b7280'}}>${revenue.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: '#6366f1',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sublabel, alert }) {
  return (
    <div style={{
      background: alert ? '#fee2e2' : 'white',
      border: alert ? '2px solid #ef4444' : '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>{icon}</div>
      <div style={{fontSize: '0.75rem', color: '#6b7280', fontWeight: '600', marginBottom: '0.25rem'}}>
        {label}
      </div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: alert ? '#dc2626' : '#111827',
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      {sublabel && (
        <div style={{fontSize: '0.75rem', color: '#6b7280'}}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

export default App;
