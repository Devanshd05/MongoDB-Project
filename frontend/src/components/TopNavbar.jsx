import React from 'react';
import { RefreshCw, Database } from 'lucide-react';

export function TopNavbar({
  currentSection,
  onNavigate,
  mongoStatus = 'connected',
  loading,
  onRefresh,
  totalProducts = 100,
  totalObservations = 8000,
}) {
  const navItems = [
    { id: 'overview', label: 'Market Ledger' },
    { id: 'catalogue', label: 'Product Explorer' },
    { id: 'analytics', label: 'Price Observatory' },
    { id: 'prediction', label: 'ML Foresight' },
    { id: 'evaluation', label: 'Model Validation' },
  ];

  return (
    <header className="masthead-container" aria-label="Application masthead and navigation">
      {/* 1. Top Utility / Market Status Ticker */}
      <div className="masthead-utility-bar">
        <div className="utility-bar-inner">
          <div className="utility-market-stamp">
            <span className="ticker-badge">INDEX CYCLE 79</span>
            <span className="ticker-divider">/</span>
            <span>{totalProducts} GOODS MONITORED</span>
            <span className="ticker-divider">/</span>
            <span>{Number(totalObservations).toLocaleString('en-IN')} LONGITUDINAL RECORDS</span>
          </div>

          <div className="utility-status-group">
            <div className="db-heartbeat">
              <span
                className={`pulse-dot ${mongoStatus === 'connected' ? 'active' : 'inactive'}`}
                aria-hidden="true"
              />
              <span className="db-status-label">
                {mongoStatus === 'connected' ? 'MongoDB Synced' : 'MongoDB Offline'}
              </span>
            </div>
            <span className="utility-pill-synthetic">SYNTHETIC RESEARCH BENCHMARK</span>
          </div>
        </div>
      </div>

      {/* 2. Main Editorial Masthead */}
      <div className="masthead-main-bar">
        <div className="masthead-main-inner">
          {/* Typographic Brand Identity */}
          <a
            className="masthead-brand"
            href="#overview"
            onClick={() => onNavigate?.('overview')}
            aria-label="PricePrawl ML Home"
          >
            <div className="brand-crest" aria-hidden="true">
              <span>PP</span>
            </div>
            <div className="brand-headline-wrap">
              <span className="brand-title-serif">PricePrawl</span>
              <span className="brand-rubric">Price Intelligence &amp; Markdown Radar</span>
            </div>
          </a>

          {/* Minimalist Editorial Navigation */}
          <nav className="masthead-nav" aria-label="Section navigation">
            {navItems.map((item) => {
              const isActive = currentSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`masthead-nav-link ${isActive ? 'is-active' : ''}`}
                  onClick={() => onNavigate?.(item.id)}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Action / Fast Sync */}
          <div className="masthead-actions">
            <button
              type="button"
              className="sync-action-btn"
              onClick={onRefresh}
              disabled={loading}
              title="Sync dataset from MongoDB and recalculate holdout metrics"
            >
              <RefreshCw size={13} className={loading ? 'is-spinning' : ''} />
              <span>{loading ? 'Syncing…' : 'Sync Archive'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
