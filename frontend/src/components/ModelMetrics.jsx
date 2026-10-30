import React from 'react';
import { Activity, CheckCircle2, ShieldCheck, Scale, FileText } from 'lucide-react';

const formatFixed = (val, digits = 4) =>
  val === undefined || val === null || Number.isNaN(Number(val))
    ? '—'
    : Number(val).toFixed(digits);

const formatPercent = (val) =>
  val === undefined || val === null || Number.isNaN(Number(val))
    ? '—'
    : `${(Number(val) * 100).toFixed(2)}%`;

const formatMoney = (val) =>
  val === undefined || val === null || Number.isNaN(Number(val))
    ? '—'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(Number(val));

export function ModelMetrics({ metrics }) {
  const reg = metrics?.regression;
  const clf = metrics?.classification;
  const dataset = metrics?.dataset;

  return (
    <section className="validation-matrix-panel" id="evaluation" aria-label="Model Performance & Evaluation Matrix">
      {/* Panel Top Header */}
      <div className="validation-header-row">
        <div>
          <span className="panel-kicker-text">EMPIRICAL BENCHMARK</span>
          <h2 className="panel-title-text">Model Validation &amp; Integrity Matrix</h2>
        </div>
        <div className="holdout-protocol-tag">
          <Activity size={12} />
          <span>70 / 30 Chronological Split Protocol</span>
        </div>
      </div>

      <p className="validation-lead-text">
        To prevent temporal data leakage, models were trained exclusively on early observation cycles
        (<strong>Days 0–54</strong>, {dataset?.train_rows ? Number(dataset.train_rows).toLocaleString('en-IN') : '5,500'} rows)
        and evaluated on unseen subsequent cycles (<strong>Days 55–79</strong>, {dataset?.test_rows ? Number(dataset.test_rows).toLocaleString('en-IN') : '2,500'} rows).
      </p>

      {/* Side-by-Side Architectural Audit */}
      <div className="validation-columns-grid">
        {/* Model 1: Linear Regression (Next-Day Price) */}
        <div className="audit-pillar-card">
          <div className="pillar-header-row">
            <div>
              <span className="pillar-family-tag">REGRESSION PIPELINE</span>
              <h3 className="pillar-title">Linear Regression</h3>
            </div>
            <span className="target-pill">Target: next_day_price (Day t+1)</span>
          </div>

          <p className="pillar-synopsis">
            Continuously estimates the absolute rupee price for the upcoming day using standard scaled
            lag pricing, demand indices, and one-hot encoded product category vectors.
          </p>

          <div className="pillar-metrics-stack">
            <div className="audit-metric-row">
              <div className="metric-info-col">
                <strong className="metric-name">R² Coefficient of Determination</strong>
                <span className="metric-interpretation">
                  Proportion of time-series variance explained by the model vs. a naive mean baseline.
                </span>
              </div>
              <span className="metric-score-pill tabular-nums">
                {formatFixed(reg?.r2_score, 4)}
              </span>
            </div>

            <div className="audit-metric-row">
              <div className="metric-info-col">
                <strong className="metric-name">Mean Absolute Error (MAE)</strong>
                <span className="metric-interpretation">
                  Average rupee deviation between forecasted target price and actual recorded price.
                </span>
              </div>
              <span className="metric-score-pill tabular-nums">
                {formatMoney(reg?.mae)}
              </span>
            </div>
          </div>
        </div>

        {/* Model 2: Decision Tree Classifier (7-Day Drop) */}
        <div className="audit-pillar-card">
          <div className="pillar-header-row">
            <div>
              <span className="pillar-family-tag">CLASSIFICATION PIPELINE</span>
              <h3 className="pillar-title">Decision Tree Classifier</h3>
            </div>
            <span className="target-pill">Target: price_drop_7d (≥ 5%)</span>
          </div>

          <p className="pillar-synopsis">
            Classifies whether an asset will experience a price decrease of 5% or more within the next
            7 observation days. Evaluated with balanced class weighting to counter class imbalance.
          </p>

          <div className="pillar-metrics-stack">
            <div className="audit-metric-row">
              <div className="metric-info-col">
                <strong className="metric-name">Accuracy</strong>
                <span className="metric-interpretation">
                  Overall proportion of holdout cases correctly classified (drop vs. no drop).
                </span>
              </div>
              <span className="metric-score-pill tabular-nums">
                {formatPercent(clf?.accuracy)}
              </span>
            </div>

            <div className="audit-metric-row">
              <div className="metric-info-col">
                <strong className="metric-name">Precision (Reliability)</strong>
                <span className="metric-interpretation">
                  When the model flags a 7-day drop, how often does a genuine markdown occur?
                </span>
              </div>
              <span className="metric-score-pill tabular-nums">
                {formatPercent(clf?.precision)}
              </span>
            </div>

            <div className="audit-metric-row">
              <div className="metric-info-col">
                <strong className="metric-name">Recall (Coverage)</strong>
                <span className="metric-interpretation">
                  What fraction of all actual retail price drops does the classifier catch?
                </span>
              </div>
              <span className="metric-score-pill tabular-nums">
                {formatPercent(clf?.recall)}
              </span>
            </div>

            <div className="audit-metric-row">
              <div className="metric-info-col">
                <strong className="metric-name">F1-Score (Harmonic Mean)</strong>
                <span className="metric-interpretation">
                  Optimal balance between precision and recall on imbalanced holdout data.
                </span>
              </div>
              <span className="metric-score-pill tabular-nums">
                {formatFixed(clf?.f1_score, 4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology Footnote */}
      <div className="validation-footer-bar">
        <span className="methodology-note">
          <strong>Methodological Note:</strong> Time-series holdout evaluation simulates live forward deployment.
          Randomized K-fold cross-validation is intentionally avoided to prevent lookahead bias.
        </span>
        <span className="synthetic-disclaimer">
          Synthetic dataset generated for academic and portfolio demonstration.
        </span>
      </div>
    </section>
  );
}
