import React from 'react';
import { Sparkles, ArrowDownRight, TrendingDown } from 'lucide-react';

export function PageHeader({ productCount = 100, observationCount = 8000, averageDiscount = 0 }) {
  return (
    <section className="editorial-lead-section">
      <div className="lead-meta-row">
        <span className="lead-section-tag">DAILY MARKET BRIEFING</span>
        <span className="lead-date-stamp">OCTOBER 2026 ARCHIVE · 80-DAY LONGITUDINAL FEED</span>
      </div>

      <div className="lead-headline-row">
        <h1 className="lead-editorial-title">
          Know when prices drop — before you pay retail.
        </h1>
        <p className="lead-editorial-dek">
          Longitudinal retail tracking across 100 indexed products with machine-learned next-day price
          forecasting and 7-day markdown probability scoring.
        </p>
      </div>
    </section>
  );
}
