import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  LineChart as ChartIcon,
  ShieldCheck,
  TrendingDown,
  Activity,
} from 'lucide-react';

const formatMoney = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(val || 0));

function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const productPrice = payload.find((p) => p.dataKey === 'price')?.value;
  const competitorPrice = payload.find((p) => p.dataKey === 'competitor')?.value;
  const diff = competitorPrice !== undefined && productPrice !== undefined
    ? competitorPrice - productPrice
    : null;

  return (
    <div className="observatory-tooltip" role="tooltip">
      <div className="tooltip-head-line">
        <span className="tooltip-day-label">{label}</span>
        <span className="tooltip-badge">Recorded Quote</span>
      </div>

      <div className="tooltip-rows-group">
        {productPrice !== undefined && (
          <div className="tooltip-row-item item-product">
            <span className="row-key">Product Price:</span>
            <strong className="row-val tabular-nums">{formatMoney(productPrice)}</strong>
          </div>
        )}

        {competitorPrice !== undefined && (
          <div className="tooltip-row-item item-competitor">
            <span className="row-key">Competitor Benchmark:</span>
            <strong className="row-val tabular-nums">{formatMoney(competitorPrice)}</strong>
          </div>
        )}

        {diff !== null && (
          <div className="tooltip-diff-line tabular-nums">
            {diff >= 0 ? (
              <span className="diff-favorable">₹{Math.abs(diff).toFixed(2)} below competitor</span>
            ) : (
              <span className="diff-unfavorable">₹{Math.abs(diff).toFixed(2)} above competitor</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PriceHistoryChart({ product, history = [] }) {
  const [timeRange, setTimeRange] = useState('all'); // 'all' (80d), '30d', '14d'

  // Filter history based on selected time range
  const visibleHistory = useMemo(() => {
    if (!history.length) return [];
    if (timeRange === '14d') return history.slice(-14);
    if (timeRange === '30d') return history.slice(-30);
    return history;
  }, [history, timeRange]);

  const chartData = useMemo(() => {
    return visibleHistory.map((item) => ({
      day: `Day ${item.day_index}`,
      price: Number(item.current_price),
      competitor: Number(item.competitor_price),
    }));
  }, [visibleHistory]);

  const latest = history && history.length > 0 ? history[history.length - 1] : null;
  const latestPrice = Number(latest?.current_price ?? product?.current_price ?? product?.base_price ?? 0);
  const competitorPrice = Number(latest?.competitor_price ?? product?.competitor_price ?? 0);

  // Price range analytics across the entire 80-day archive
  const prices = history.map((item) => Number(item.current_price)).filter(Boolean);
  const historicalLow = prices.length ? Math.min(...prices) : 0;
  const historicalHigh = prices.length ? Math.max(...prices) : 0;

  // Position between all-time low and all-time high
  const priceRangeSpread = historicalHigh - historicalLow;
  const positionPct = priceRangeSpread > 0
    ? Math.max(0, Math.min(100, ((latestPrice - historicalLow) / priceRangeSpread) * 100))
    : 50;

  // Period change (first visible observation to latest)
  const initialPrice = visibleHistory.length > 0 ? Number(visibleHistory[0].current_price) : 0;
  const periodDiff = latestPrice - initialPrice;
  const trendPercent =
    visibleHistory.length > 1 && initialPrice > 0
      ? (periodDiff / initialPrice) * 100
      : 0;
  const isTrendDown = trendPercent <= 0;

  // Competitor spread
  const competitorDelta = competitorPrice - latestPrice;
  const competitorDeltaPct = competitorPrice > 0 ? (competitorDelta / competitorPrice) * 100 : 0;

  // Category slug
  const categorySlug = (product?.category || 'other').toLowerCase();

  return (
    <section className="observatory-panel" id="analytics" aria-label="Price History Observatory">
      {/* 1. Product Dossier Header */}
      <div className="observatory-head">
        <div className="dossier-headline-block">
          <div className="dossier-meta-tags">
            <span className={`category-stamp stamp-${categorySlug}`}>
              {product?.category || 'Catalogue Item'}
            </span>
            <span className="store-stamp">{product?.store || 'Retailer'}</span>
            <span className="id-stamp tabular-nums">ID: {product?.product_id || '—'}</span>
            {Number(product?.discount_pct || 0) > 0 && (
              <span className="discount-tag">
                −{Number(product.discount_pct).toFixed(0)}% Markdown
              </span>
            )}
            {product?.demand_index !== undefined && (
              <span className="demand-index-tag tabular-nums">
                Demand Index: {Number(product.demand_index).toFixed(1)} / 100
              </span>
            )}
          </div>

          <h2 className="dossier-product-name">
            {product?.product_name || 'Select an item from the market ledger'}
          </h2>
        </div>

        {/* Timeframe Range Toggle */}
        <div className="timeframe-switch-group" role="group" aria-label="Chart time window">
          <button
            type="button"
            className={`timeframe-btn ${timeRange === 'all' ? 'is-active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All 80 Days
          </button>
          <button
            type="button"
            className={`timeframe-btn ${timeRange === '30d' ? 'is-active' : ''}`}
            onClick={() => setTimeRange('30d')}
          >
            Last 30d
          </button>
          <button
            type="button"
            className={`timeframe-btn ${timeRange === '14d' ? 'is-active' : ''}`}
            onClick={() => setTimeRange('14d')}
          >
            Last 14d
          </button>
        </div>
      </div>

      {/* 2. Key Price Diagnostics Ribbon */}
      <div className="observatory-diagnostics-ribbon">
        <div className="diag-cell">
          <span className="diag-label">Current Recorded Price</span>
          <span className="diag-figure price-accent tabular-nums">
            {formatMoney(latestPrice)}
          </span>
          <span className="diag-subtext">Day {latest?.day_index ?? 79} closing quote</span>
        </div>

        <div className="diag-cell">
          <span className="diag-label">Competitor Differential</span>
          <span
            className={`diag-figure tabular-nums ${
              competitorDelta >= 0 ? 'text-favorable' : 'text-caution'
            }`}
          >
            {competitorDelta >= 0 ? '−' : '+'}
            {formatMoney(Math.abs(competitorDelta))}
          </span>
          <span className="diag-subtext tabular-nums">
            {competitorDelta >= 0
              ? `${Math.abs(competitorDeltaPct).toFixed(1)}% cheaper than rival`
              : `${Math.abs(competitorDeltaPct).toFixed(1)}% above rival`}
          </span>
        </div>

        <div className="diag-cell">
          <span className="diag-label">Period Volatility ({timeRange === 'all' ? '80d' : timeRange})</span>
          <span
            className={`diag-figure tabular-nums ${
              isTrendDown ? 'text-favorable' : 'text-caution'
            }`}
          >
            {trendPercent > 0 ? '+' : ''}
            {trendPercent.toFixed(1)}%
            {isTrendDown ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}
          </span>
          <span className="diag-subtext tabular-nums">
            {periodDiff >= 0 ? `+${formatMoney(periodDiff)}` : `−${formatMoney(Math.abs(periodDiff))}`} net change
          </span>
        </div>
      </div>

      {/* 3. The Price Position Gauge (Where does current price sit in 80-day history?) */}
      {history.length > 0 && priceRangeSpread > 0 && (
        <div className="price-spectrum-card" aria-label="Historical price spectrum gauge">
          <div className="spectrum-head-line">
            <span className="spectrum-title">80-DAY HISTORICAL PRICE SPECTRUM</span>
            <span className="spectrum-verdict tabular-nums">
              {positionPct <= 25 ? (
                <span className="badge-spectrum-good">Near 80-Day Low (Prime Buying Range)</span>
              ) : positionPct >= 75 ? (
                <span className="badge-spectrum-high">Near Historical Peak</span>
              ) : (
                <span className="badge-spectrum-mid">Mid-Band Historical Valuation</span>
              )}
            </span>
          </div>

          <div className="spectrum-bar-track">
            <div className="spectrum-bar-gradient" />
            <div
              className="spectrum-indicator-pin"
              style={{ left: `${positionPct}%` }}
              title={`Current: ${formatMoney(latestPrice)}`}
            >
              <span className="pin-point" />
              <span className="pin-tag tabular-nums">{formatMoney(latestPrice)}</span>
            </div>
          </div>

          <div className="spectrum-labels-row tabular-nums">
            <span>All-Time Low: <strong>{formatMoney(historicalLow)}</strong></span>
            <span>All-Time High: <strong>{formatMoney(historicalHigh)}</strong></span>
          </div>
        </div>
      )}

      {/* 4. Main Chart Canvas */}
      <div className="observatory-chart-canvas">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={chartData} margin={{ top: 14, right: 14, left: 6, bottom: 2 }}>
              <defs>
                <linearGradient id="editorialForestGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E4731" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#1E4731" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#E6E2D8" strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="day"
                tick={{ fill: '#626B5E', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#E2DDD2' }}
                tickLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
              />

              <YAxis
                tick={{ fill: '#626B5E', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                width={62}
                domain={['auto', 'auto']}
                tickFormatter={(val) => `₹${Math.round(val).toLocaleString('en-IN')}`}
              />

              <Tooltip content={<CustomChartTooltip />} />

              {/* Reference line for All-Time Low */}
              {historicalLow > 0 && (
                <ReferenceLine
                  y={historicalLow}
                  stroke="#2D7A51"
                  strokeDasharray="4 4"
                  strokeWidth={1.2}
                  label={{
                    value: `All-Time Low: ₹${Math.round(historicalLow)}`,
                    fill: '#24593C',
                    fontSize: 9,
                    position: 'insideBottomRight',
                    fontFamily: 'JetBrains Mono',
                  }}
                />
              )}

              {/* Product Recorded Price Area */}
              <Area
                type="monotone"
                dataKey="price"
                name="Product Recorded Quote"
                stroke="#1E4731"
                strokeWidth={2.4}
                fill="url(#editorialForestGradient)"
                activeDot={{ r: 4.5, fill: '#1E4731', stroke: '#FFFFFF', strokeWidth: 2 }}
              />

              {/* Synthetic Competitor Benchmark Line */}
              <Line
                type="monotone"
                dataKey="competitor"
                name="Competitor Price Benchmark"
                stroke="#7B8476"
                strokeWidth={1.6}
                strokeDasharray="4 3"
                dot={false}
                activeDot={{ r: 3.5, fill: '#7B8476' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty-placeholder">
            <ChartIcon size={34} />
            <strong>No longitudinal price history selected</strong>
            <p>Select a product from the market ledger to inspect its 80-day trajectory.</p>
          </div>
        )}
      </div>

      {/* 5. Chart Legend & Annotation Footer */}
      <div className="observatory-chart-footer">
        <div className="legend-items-cluster">
          <div className="legend-entry">
            <span className="legend-line-solid" aria-hidden="true" />
            <span>Product Daily Closing Quote</span>
          </div>
          <div className="legend-entry">
            <span className="legend-line-dashed" aria-hidden="true" />
            <span>Synthetic Competitor Benchmark</span>
          </div>
        </div>

        <span className="chart-meta-note tabular-nums">
          Showing {visibleHistory.length} of {history.length} longitudinal cycles
        </span>
      </div>
    </section>
  );
}
