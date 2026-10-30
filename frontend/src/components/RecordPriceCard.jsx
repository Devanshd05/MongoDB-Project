import React from 'react';
import { PlusCircle, Database, Check } from 'lucide-react';

export function RecordPriceCard({
  selectedProduct,
  priceInput,
  onPriceInputChange,
  onSubmitPrice,
  busy,
}) {
  const currentPrice = Number(selectedProduct?.current_price || selectedProduct?.base_price || 0);

  // Quick preset helper
  const applyPreset = (multiplier, delta = 0) => {
    if (!currentPrice) return;
    const computed = Math.max(1, (currentPrice * multiplier) + delta);
    onPriceInputChange(computed.toFixed(2));
  };

  return (
    <section className="record-sighting-panel" aria-label="Log Price Sighting">
      <div className="sighting-head-row">
        <div>
          <span className="panel-kicker-text">LONGITUDINAL CONTRIBUTION</span>
          <h3 className="panel-title-text">Log Price Sighting</h3>
        </div>
        <span className="sighting-archive-badge">
          <Database size={12} /> MongoDB Persistence
        </span>
      </div>

      <p className="sighting-caption">
        Record a new daily quote for <strong>{selectedProduct?.product_name || 'selected asset'}</strong>.
        This appends a new time-series record to MongoDB and updates model history.
      </p>

      {/* Quick Price Preset Chips */}
      {selectedProduct && (
        <div className="price-presets-cluster">
          <span className="presets-label">Quick Adjust:</span>
          <button
            type="button"
            className="preset-chip"
            onClick={() => applyPreset(0.95)}
            disabled={busy}
          >
            −5% Drop
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => applyPreset(0.90)}
            disabled={busy}
          >
            −10% Drop
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => applyPreset(1, 0)}
            disabled={busy}
          >
            Current (₹{Math.round(currentPrice)})
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => applyPreset(1.05)}
            disabled={busy}
          >
            +5% Hike
          </button>
        </div>
      )}

      <form className="sighting-input-form" onSubmit={onSubmitPrice}>
        <div className="sighting-field-group">
          <label htmlFor="sighting-price-input" className="sighting-label">
            Observed Price Quote <span className="currency-tag">(INR)</span>
          </label>
          <div className="sighting-input-wrapper">
            <span className="currency-prefix" aria-hidden="true">₹</span>
            <input
              id="sighting-price-input"
              type="number"
              min="1"
              step="0.01"
              required
              value={priceInput}
              onChange={(e) => onPriceInputChange(e.target.value)}
              placeholder="e.g. 649.00"
              disabled={!selectedProduct || busy}
            />
          </div>
        </div>

        <button
          type="submit"
          className="commit-sighting-btn"
          disabled={!selectedProduct || busy || !priceInput}
        >
          <PlusCircle size={15} />
          <span>{busy ? 'Committing quote…' : 'Record Quote to MongoDB'}</span>
        </button>
      </form>
    </section>
  );
}
