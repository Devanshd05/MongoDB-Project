import React from 'react';

const formatMoney = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(val || 0));

export function ProductRow({ product, isSelected, onSelect }) {
  const currentPrice = Number(product.current_price || product.base_price || 0);
  const competitorPrice = Number(product.competitor_price || 0);
  const discountPct = Number(product.discount_pct || 0);
  const isCheaperThanCompetitor = competitorPrice > 0 && currentPrice < competitorPrice;
  const competitorDiff = competitorPrice - currentPrice;

  // Category specific CSS class
  const categorySlug = (product.category || 'other').toLowerCase();

  return (
    <button
      type="button"
      className={`ledger-item-btn ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onSelect(product)}
      aria-selected={isSelected}
      aria-label={`Select ${product.product_name}, priced at ${formatMoney(currentPrice)}`}
    >
      <div className="ledger-main-col">
        {/* Top line: Category Stamp + Retailer Badge */}
        <div className="ledger-header-line">
          <span className={`category-stamp stamp-${categorySlug}`}>
            {product.category}
          </span>
          <span className="store-stamp">{product.store}</span>
          {discountPct > 0 && (
            <span className="discount-tag">
              −{discountPct.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Product Name */}
        <span className="ledger-product-title" title={product.product_name}>
          {product.product_name}
        </span>

        {/* Micro-meta: Competitor comparison & ID */}
        <div className="ledger-meta-line">
          <span className="ledger-id-tag tabular-nums">{product.product_id}</span>
          {isCheaperThanCompetitor ? (
            <span className="market-delta-pill favorable tabular-nums">
              ₹{Math.round(competitorDiff)} under competitor
            </span>
          ) : competitorPrice > 0 ? (
            <span className="market-delta-pill neutral tabular-nums">
              Competitor: {formatMoney(competitorPrice)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Right Column: Prominent Price Figure */}
      <div className="ledger-price-col">
        <span className="ledger-price-figure tabular-nums">
          {formatMoney(currentPrice)}
        </span>
        <span className="ledger-cycle-tag tabular-nums">
          Day {product.day_index ?? 79}
        </span>
      </div>
    </button>
  );
}
