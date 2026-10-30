import React from 'react';
import {
  Sparkles,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  HelpCircle,
} from 'lucide-react';

const formatMoney = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(val || 0));

export function PredictionPanel({
  selectedProduct,
  prediction,
  busy,
  onGeneratePrediction,
}) {
  const currentPrice = Number(selectedProduct?.current_price || selectedProduct?.base_price || 0);
  const predictedPrice = prediction ? Number(prediction.predicted_next_day_price) : 0;
  const priceDiff = prediction ? predictedPrice - currentPrice : 0;
  const priceDiffPercent = currentPrice > 0 ? (priceDiff / currentPrice) * 100 : 0;

  const dropProbPercent = prediction ? Number(prediction.drop_probability || 0) * 100 : 0;
  const hasPredictedDrop = Boolean(prediction?.predicted_drop_within_7_days);

  return (
    <section className="foresight-panel" id="prediction" aria-label="Machine Learning Foresight & Advisory">
      {/* Panel Top Header */}
      <div className="foresight-panel-head">
        <div>
          <span className="panel-kicker-text">PREDICTIVE MACHINE LEARNING</span>
          <h2 className="panel-title-text">Algorithmic Purchase Advisory</h2>
        </div>
        <span className="engine-badge">
          <Cpu size={12} /> Scikit-Learn Pipeline
        </span>
      </div>

      {/* Model Descriptions */}
      <div className="foresight-model-pills-row">
        <div className="model-dossier-pill">
          <div className="pill-dot regression-dot" aria-hidden="true" />
          <div className="pill-text-wrap">
            <strong>Linear Regression (Continuous)</strong>
            <span>Estimates next-day price quote (Day t+1) based on lag indicators</span>
          </div>
        </div>

        <div className="model-dossier-pill">
          <div className="pill-dot classification-dot" aria-hidden="true" />
          <div className="pill-text-wrap">
            <strong>Decision Tree (Binary Classifier)</strong>
            <span>Evaluates probability of a markdown (≥ 5%) within 7 observation cycles</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="foresight-action-container">
        <button
          type="button"
          className="execute-forecast-btn"
          onClick={onGeneratePrediction}
          disabled={!selectedProduct || busy}
          title="Run Linear Regression and Decision Tree models on the latest product observation"
        >
          <Sparkles size={15} />
          <span>
            {busy
              ? 'Executing scikit-learn estimators…'
              : `Forecast Trajectory for ${selectedProduct?.product_name || 'Selected Item'}`}
          </span>
        </button>
      </div>

      {/* Prediction Output & Consumer Advisory */}
      {prediction && (
        <div className="prediction-dossier-card">
          {/* 1. Clear Consumer Verdict Banner */}
          <div
            className={`advisory-banner ${
              hasPredictedDrop ? 'advisory-hold' : 'advisory-proceed'
            }`}
          >
            <div className="advisory-icon-wrap" aria-hidden="true">
              {hasPredictedDrop ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div className="advisory-copy">
              <strong className="advisory-title">
                {hasPredictedDrop
                  ? 'RECOMMENDATION: HOLD PURCHASE — PROJECTED PRICE DROP AHEAD'
                  : 'RECOMMENDATION: STABLE VALUATION — NO IMMINENT MARKDOWN DETECTED'}
              </strong>
              <p className="advisory-body">
                {hasPredictedDrop
                  ? `The Decision Tree model detects a ${dropProbPercent.toFixed(
                      1
                    )}% probability of a significant price reduction (≥ 5%) within 7 cycles. Next-day quote is estimated at ${formatMoney(
                      predictedPrice
                    )} (${formatMoney(Math.abs(priceDiff))} lower). Delaying purchase is advisable.`
                  : `Model estimates next-day price will remain near current valuation at ${formatMoney(
                      predictedPrice
                    )} (${priceDiff >= 0 ? '+' : ''}${formatMoney(
                      priceDiff
                    )}). No promotional price cut is forecasted in the near term.`}
              </p>
            </div>
          </div>

          {/* 2. Side-by-Side Dual Engine Metrics */}
          <div className="dual-forecast-grid">
            {/* Linear Regression Forecast */}
            <div className="forecast-metric-card">
              <span className="forecast-card-lbl">24-HOUR TARGET ESTIMATE</span>
              <div className="forecast-primary-val tabular-nums">
                {formatMoney(predictedPrice)}
              </div>
              <div className="forecast-comparison-line tabular-nums">
                <span className="comp-basis">Current: {formatMoney(currentPrice)}</span>
                <span
                  className={`comp-delta ${
                    priceDiff <= 0 ? 'text-favorable' : 'text-caution'
                  }`}
                >
                  {priceDiff <= 0 ? '−' : '+'}
                  {formatMoney(Math.abs(priceDiff))} ({priceDiffPercent > 0 ? '+' : ''}
                  {priceDiffPercent.toFixed(1)}%)
                </span>
              </div>
              <span className="forecast-sub-meta">Computed via Linear Regression pipeline</span>
            </div>

            {/* Decision Tree Markdown Classifier */}
            <div className="forecast-metric-card">
              <span className="forecast-card-lbl">7-DAY MARKDOWN RISK (≥ 5% DROP)</span>
              <div className="forecast-primary-val tabular-nums">
                <span className={hasPredictedDrop ? 'text-favorable' : ''}>
                  {hasPredictedDrop ? 'Markdown Expected' : 'Unlikely to Drop'}
                </span>
              </div>

              {/* Probability Meter */}
              <div className="prob-meter-group">
                <div className="prob-meter-labels tabular-nums">
                  <span>Drop Likelihood:</span>
                  <strong>{dropProbPercent.toFixed(1)}%</strong>
                </div>
                <div className="prob-meter-track" aria-hidden="true">
                  <div
                    className="prob-meter-fill"
                    style={{ width: `${Math.min(100, Math.max(0, dropProbPercent))}%` }}
                  />
                </div>
              </div>
              <span className="forecast-sub-meta">Computed via Decision Tree (balanced weights)</span>
            </div>
          </div>

          {/* 3. Live Model Feature Vector (Educational Transparency) */}
          <div className="feature-vector-disclosure">
            <span className="disclosure-title">LIVE MODEL INPUT VECTOR (OBSERVATION DAY {prediction.based_on_day_index})</span>
            <div className="feature-vector-chips tabular-nums">
              <span>price: {formatMoney(currentPrice)}</span>
              <span>day_index: {prediction.based_on_day_index}</span>
              <span>discount: {Number(selectedProduct?.discount_pct || 0).toFixed(1)}%</span>
              <span>demand: {Number(selectedProduct?.demand_index || 0).toFixed(1)}</span>
              <span>competitor: {formatMoney(selectedProduct?.competitor_price || 0)}</span>
              <span>category: {selectedProduct?.category}</span>
            </div>
          </div>
        </div>
      )}

      {!prediction && (
        <div className="foresight-idle-prompt">
          <p>
            Select any item in the ledger and press <strong>Forecast Trajectory</strong> to dispatch
            the live feature vector to the scikit-learn models and evaluate buy/wait recommendations.
          </p>
        </div>
      )}
    </section>
  );
}
