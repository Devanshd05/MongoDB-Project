import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { TopNavbar } from './components/TopNavbar';
import { PageHeader } from './components/PageHeader';
import { SummaryMetrics } from './components/SummaryMetrics';
import { ProductCatalogue } from './components/ProductCatalogue';
import { PriceHistoryChart } from './components/PriceHistoryChart';
import { PredictionPanel } from './components/PredictionPanel';
import { RecordPriceCard } from './components/RecordPriceCard';
import { ModelMetrics } from './components/ModelMetrics';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [sortBy, setSortBy] = useState('default');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mongoStatus, setMongoStatus] = useState('connected');
  const [activeSection, setActiveSection] = useState('overview');

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.detail || 'Request failed');
    return body;
  }

  async function choose(product) {
    setSelected(product);
    setPrediction(null);
    setError('');
    try {
      const result = await request(`/api/products/${product.product_id}/history`);
      setHistory(result.history || []);
    } catch (err) {
      setHistory([]);
      setError(err.message);
    }
  }

  async function load() {
    setError('');
    setLoading(true);
    try {
      const [productResult, summaryResult, metricsResult, healthResult] = await Promise.all([
        request('/api/products'),
        request('/api/summary'),
        request('/api/metrics'),
        request('/api/health').catch(() => ({ mongodb: 'disconnected' })),
      ]);

      const list = productResult.products || [];
      setProducts(list);
      setSummary(summaryResult || {});
      setMetrics(metricsResult || null);
      setMongoStatus(healthResult?.mongodb || 'connected');

      if (list.length) {
        const current =
          list.find((product) => product.product_id === selected?.product_id) || list[0];
        setSelected(current);
        const result = await request(`/api/products/${current.product_id}/history`);
        setHistory(result.history || []);
      } else {
        setSelected(null);
        setHistory([]);
      }
    } catch (err) {
      setMongoStatus('disconnected');
      setError(`${err.message}. Check that MongoDB and the FastAPI backend are running.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(
    () => ['All categories', ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchCat = category === 'All categories' || product.category === category;
      const matchSearch =
        `${product.product_name} ${product.product_id}`.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });

    // Apply sorting
    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => Number(a.current_price || a.base_price) - Number(b.current_price || b.base_price));
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => Number(b.current_price || b.base_price) - Number(a.current_price || a.base_price));
    } else if (sortBy === 'discount') {
      result = [...result].sort((a, b) => Number(b.discount_pct || 0) - Number(a.discount_pct || 0));
    } else if (sortBy === 'name') {
      result = [...result].sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
    }

    return result;
  }, [products, category, search, sortBy]);

  async function predict() {
    if (!selected) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const pred = await request(`/api/products/${selected.product_id}/predict`);
      setPrediction(pred);
      setNotice(`Prediction model executed for ${selected.product_name}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function savePrice(event) {
    event.preventDefault();
    if (!selected || !price) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await request(`/api/products/${selected.product_id}/price`, {
        method: 'POST',
        body: JSON.stringify({ price: Number(price) }),
      });
      setNotice(`New observation of ₹${Number(price).toLocaleString('en-IN')} committed to MongoDB.`);
      setPrice('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <TopNavbar
        currentSection={activeSection}
        onNavigate={setActiveSection}
        mongoStatus={mongoStatus}
        loading={loading}
        onRefresh={load}
        totalProducts={products.length}
        totalObservations={summary.observations}
      />

      <main className="app-main" id="overview">
        <PageHeader
          productCount={products.length}
          observationCount={summary.observations}
        />

        {error && (
          <div className="notice-strip notice-error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="notice-strip notice-success" role="status">
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{notice}</span>
          </div>
        )}

        <SummaryMetrics summary={summary} metrics={metrics} products={products} />

        <div className="workspace-grid">
          <ProductCatalogue
            products={products}
            filteredProducts={filteredProducts}
            categories={categories}
            selectedCategory={category}
            onCategoryChange={setCategory}
            searchQuery={search}
            onSearchChange={setSearch}
            selectedProduct={selected}
            onSelectProduct={choose}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          <div className="analytics-column">
            <PriceHistoryChart product={selected} history={history} />

            <PredictionPanel
              selectedProduct={selected}
              prediction={prediction}
              busy={busy}
              onGeneratePrediction={predict}
            />

            <RecordPriceCard
              selectedProduct={selected}
              priceInput={price}
              onPriceInputChange={setPrice}
              onSubmitPrice={savePrice}
              busy={busy}
            />
          </div>
        </div>

        <ModelMetrics metrics={metrics} />

        <footer className="editorial-footer">
          <div className="footer-lead-text">
            <strong>PricePrawl ML — Academic Price Surveillance &amp; Forecasting Architecture</strong>
            <p>
              Engineered with FastAPI, MongoDB, scikit-learn, React 19, and Recharts. Bundled time-series observations are synthetically generated for benchmark evaluation.
            </p>
          </div>
          <div className="footer-credits">
            <span>Holdout Validation Days 55–79</span>
            <span>•</span>
            <span>Longitudinal Horizon: 80 Cycles</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('PricePrawl render error caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 24px', maxWidth: '640px', margin: '60px auto', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ color: '#A3342E', marginBottom: '8px' }}>Interface Load Error</h2>
          <p style={{ color: '#52594F', lineHeight: '1.5' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '10px 18px',
              backgroundColor: '#1F4530',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Reload Interface
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
