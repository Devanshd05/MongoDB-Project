import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, PackageSearch } from 'lucide-react';
import { ProductRow } from './ProductRow';

export function ProductCatalogue({
  products = [],
  filteredProducts = [],
  categories = [],
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  selectedProduct,
  onSelectProduct,
  sortBy,
  onSortChange,
}) {
  return (
    <section className="catalogue-dossier-panel" id="catalogue" aria-label="Product Catalogue & Search">
      {/* Panel Top Heading */}
      <div className="catalogue-header-row">
        <div>
          <span className="panel-kicker-text">CATALOGUE SURVEILLANCE</span>
          <h2 className="panel-title-text">Market Ledger</h2>
        </div>
        <span className="catalogue-count-tag tabular-nums">
          {filteredProducts.length} of {products.length} Goods
        </span>
      </div>

      {/* Category Filter Tabs (Single-click segmented control) */}
      <div className="category-tabs-bar" role="tablist" aria-label="Product categories">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          const count =
            cat === 'All categories'
              ? products.length
              : products.filter((p) => p.category === cat).length;

          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`category-tab-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => onCategoryChange(cat)}
            >
              <span>{cat === 'All categories' ? 'All Goods' : cat}</span>
              <span className="cat-count-sub tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input & Sort Row */}
      <div className="search-and-sort-bar">
        <div className="search-field-wrapper">
          <Search size={14} className="search-field-icon" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by product name or ID (e.g. Books, P0004)…"
            aria-label="Filter products by search query"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search input"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="sort-selector-wrapper">
          <SlidersHorizontal size={13} aria-hidden="true" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort product ledger"
          >
            <option value="default">Sort: Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="discount">Highest Discount</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      <div className="ledger-scroll-area" role="listbox" aria-label="Available products">
        {filteredProducts.map((product) => (
          <ProductRow
            key={product.product_id}
            product={product}
            isSelected={selectedProduct?.product_id === product.product_id}
            onSelect={onSelectProduct}
          />
        ))}

        {filteredProducts.length === 0 && (
          <div className="ledger-empty-state">
            <PackageSearch size={26} />
            <strong>No assets match your search criteria</strong>
            <p>Try resetting the category filter or searching for another keyword.</p>
            <button
              type="button"
              className="reset-filter-btn"
              onClick={() => {
                onSearchChange('');
                onCategoryChange('All categories');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Footnote */}
      <div className="catalogue-footer-bar">
        <span className="tabular-nums">
          Displaying {filteredProducts.length} assets
        </span>
        <span className="synthetic-pill">Daily Closing Quotes</span>
      </div>
    </section>
  );
}
