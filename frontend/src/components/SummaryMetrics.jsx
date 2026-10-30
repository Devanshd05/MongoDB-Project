import React from 'react';
import { ArrowDownRight, Layers, Target, Activity } from 'lucide-react';

const formatNum = (val) =>
  val === undefined || val === null || Number.isNaN(Number(val))
    ? '—'
    : Number(val).toLocaleString('en-IN');

const formatFixed = (val, digits = 3) =>
  val === undefined || val === null || Number.isNaN(Number(val))
    ? '—'
    : Number(val).toFixed(digits);

const formatMoney = (val) =>
  val === undefined || val === null || Number.isNaN(Number(val))
    ? '—'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 1,
      }).format(Number(val));

export function SummaryMetrics({ summary = {}, metrics = null, products = [] }) {
  const reg = metrics?.regression;
  const clf = metrics?.classification;

  // Compute live deal stats from genuine product dataset
  const discountedCount = products.filter((p) => Number(p.discount_pct || 0) > 0).length;
  const underCompetitorCount = products.filter(
    (p) => Number(p.current_price || 0) < Number(p.competitor_price || 0)
  ).length;

  return (
    <section className="market-brief-ribbon" aria-label="Market pulse and holdout accuracy summary">
      {/* 1. Left Lead: Dataset Coverage & Opportunity Signals */}
      <div className="brief-cell brief-cell-lead">
        <div className="brief-cell-tag">MARKET OVERVIEW · DAY 79 CYCLE</div>
        <div className="brief-stat-main">
          <span className="figure-large tabular-nums">{formatNum(summary.products || 100)}</span>
          <span className="figure-label">Indexed Retail Goods</span>
        </div>
        <p className="brief-description">
          Active surveillance across <strong>{summary.categories || 5} categories</strong> with{' '}
          <strong>{formatNum(summary.observations || 8000)} observations</strong> in MongoDB.
        </p>

        <div className="brief-deal-radar-row">
          <div className="deal-radar-chip">
            <span className="radar-num tabular-nums">{discountedCount || '—'}</span>
            <span className="radar-lbl">Active Retail Markdowns</span>
          </div>
          <div className="deal-radar-chip">
            <span className="radar-num tabular-nums">{underCompetitorCount || '—'}</span>
            <span className="radar-lbl">Below Competitor Benchmark</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Metric: Regression Accuracy */}
      <div className="brief-cell">
        <div className="brief-cell-tag">NEXT-DAY FORECASTER · OLS</div>
        <div className="brief-stat-pair">
          <div>
            <span className="metric-headline tabular-nums">{formatFixed(reg?.r2_score, 4)}</span>
            <span className="metric-caption">R² Score (Holdout)</span>
          </div>
          <div className="metric-sub-item">
            <span className="sub-num tabular-nums">{formatMoney(reg?.mae)}</span>
            <span className="sub-lbl">Mean Absolute Error</span>
          </div>
        </div>
        <div className="brief-micro-note">
          Evaluated strictly on held-out days 55–79 to avoid temporal leakage.
        </div>
      </div>

      {/* 3. Right Metric: Classification Accuracy */}
      <div className="brief-cell">
        <div className="brief-cell-tag">7-DAY DROP CLASSIFIER · TREE</div>
        <div className="brief-stat-pair">
          <div>
            <span className="metric-headline tabular-nums">{formatFixed(clf?.f1_score, 4)}</span>
            <span className="metric-caption">Drop F1-Score</span>
          </div>
          <div className="metric-sub-item">
            <span className="sub-num tabular-nums">
              {clf?.precision ? `${(Number(clf.precision) * 100).toFixed(1)}%` : '—'}
            </span>
            <span className="sub-lbl">Drop Precision</span>
          </div>
        </div>
        <div className="brief-micro-note">
          Trained with balanced class weighting to flag ≥ 5% price reductions.
        </div>
      </div>
    </section>
  );
}
