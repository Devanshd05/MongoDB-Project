# PricePrawl ML — Product Price Prediction and Tracker

Full-stack academic project using **React + Vite**, **FastAPI**, **MongoDB + PyMongo**, and **scikit-learn**.

> **Synthetic-data notice:** all bundled price observations and competitor prices are generated for demonstration. They are not live retailer prices or real market histories.

## Features
- Product catalogue, search and category filter.
- Historical price chart and synthetic competitor-price comparison.
- MongoDB persistence for products, price history and predictions.
- Linear Regression predicts the next-day price.
- Decision Tree predicts a price drop of at least 5% within the next 7 days.
- Regression metrics: R² score and MAE.
- Classification metrics: accuracy, precision, recall and F1-score.
- Add price observations from the dashboard.

## Dataset
- `data/synthetic_products.csv`: 100 synthetic product definitions.
- `data/synthetic_price_history.csv`: 8,000 observations (100 products × 80 day indices).
- `data/sample_metrics.json`: evaluation results from the included synthetic dataset.
- `Project_Report.docx`: formatted report.

## Requirements
Python 3.10+, Node.js 18+, npm, and MongoDB Community Server or MongoDB Atlas.

## Run the project

### 1. Start MongoDB
Default URI: `mongodb://localhost:27017/`. If using Atlas, set `MONGODB_URI` to your connection string. Never commit credentials.

PowerShell:
```powershell
$env:MONGODB_URI="mongodb://localhost:27017/"
```
macOS/Linux:
```bash
export MONGODB_URI="mongodb://localhost:27017/"
```

### 2. Backend
From the project root:
```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```
On startup, the API trains both models and attempts to upsert the synthetic records into MongoDB. If MongoDB is unavailable, `/api/metrics` can still work, but product/history/prediction routes need MongoDB running.

API documentation: http://127.0.0.1:8000/docs

### 3. Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. Optional: set `VITE_API_URL` if the API runs at a different address.

## API routes
- `GET /api/health` — API and MongoDB status.
- `GET /api/summary` — product and observation counts.
- `GET /api/metrics` — all evaluation metrics.
- `GET /api/products` — catalogue (optional `q` and `category` filters).
- `GET /api/products/{pid}/history` — historical observations.
- `GET /api/products/{pid}/predict` — next-day price and seven-day drop prediction; saves prediction.
- `POST /api/products` — add a product.
- `POST /api/products/{pid}/price` — append a price observation.

## ML design
The regression target `next_day_price` is the next observed price. The classification label `price_drop_7d` is 1 when any price in the next seven observations is at least 5% below the current price. Features are current price, day index, discount percentage, demand index, competitor price and category. The last day per product has no next-day target and is excluded from regression.

A chronological holdout is used: day indices 0–54 for training and 55–78 for testing where the next-day target exists. This reduces the risk of testing on earlier records than the training data. Pipelines impute missing numeric features, one-hot encode categories, and standardize numeric features for Linear Regression.

## Sample evaluation results
- Accuracy: 0.5658
- Precision: 0.5108
- Recall: 0.892
- F1-score: 0.6496
- R² score: 0.9964
- MAE: INR 183.7589

The backend recomputes these values at startup. Results demonstrate the workflow only; synthetic-data performance is not evidence of real-world forecasting accuracy.

## Limitations and future scope
The dataset is synthetic and the day index is not a calendar date. A real deployment would need sourced price histories, time-aware validation, baseline comparisons, monitoring, uncertainty estimates, and respect for retailer access terms. Predictions are estimates, not guarantees.
