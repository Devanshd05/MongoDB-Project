import os
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient, UpdateOne
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, r2_score, mean_absolute_error

ROOT=Path(__file__).resolve().parent.parent; DATA=ROOT/"data"
URI=os.getenv("MONGODB_URI","mongodb://localhost:27017/"); DB="priceprawl_db"
NUM=["current_price","day_index","discount_pct","demand_index","competitor_price"]; FEATURES=NUM+["category"]
app=FastAPI(title="PricePrawl ML API",version="1.0")
app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:5173"],allow_methods=["*"],allow_headers=["*"])
reg=clf=None; metrics={}

def dbconn():
    c=MongoClient(URI,serverSelectionTimeoutMS=2500); c.admin.command("ping"); return c, c[DB]
def preprocess(scale):
    steps=[("imputer",SimpleImputer(strategy="median"))]
    if scale: steps.append(("scaler",StandardScaler()))
    return ColumnTransformer([("num",Pipeline(steps),NUM),("cat",OneHotEncoder(handle_unknown="ignore"),["category"])])
def train(df):
    v=df.dropna(subset=["next_day_price"]); a=v[v.day_index<=54]; b=v[v.day_index>=55]
    r=Pipeline([("prep",preprocess(True)),("model",LinearRegression())]).fit(a[FEATURES],a.next_day_price)
    rp=r.predict(b[FEATURES])
    c=Pipeline([("prep",preprocess(False)),("model",DecisionTreeClassifier(max_depth=7,min_samples_leaf=15,random_state=42,class_weight="balanced"))]).fit(a[FEATURES],a.price_drop_7d)
    cp=c.predict(b[FEATURES])
    m={"dataset":{"products":int(df.product_id.nunique()),"observations":len(df),"train_rows":len(a),"test_rows":len(b),"synthetic":True},
       "regression":{"model":"Linear Regression","r2_score":round(float(r2_score(b.next_day_price,rp)),4),"mae":round(float(mean_absolute_error(b.next_day_price,rp)),4)},
       "classification":{"model":"Decision Tree Classifier","accuracy":round(float(accuracy_score(b.price_drop_7d,cp)),4),"precision":round(float(precision_score(b.price_drop_7d,cp,zero_division=0)),4),"recall":round(float(recall_score(b.price_drop_7d,cp,zero_division=0)),4),"f1_score":round(float(f1_score(b.price_drop_7d,cp,zero_division=0)),4),"positive_class":"price_drop_7d = 1"}}
    return r,c,m
def seed(df):
    c,d=dbconn()
    p=pd.read_csv(DATA/"synthetic_products.csv").to_dict("records")
    d.products.bulk_write([UpdateOne({"product_id":x["product_id"]},{"$set":x},upsert=True) for x in p],ordered=False)
    ops=[]
    for x in df.to_dict("records"):
        x={k:(None if pd.isna(v) else v) for k,v in x.items()}
        ops.append(UpdateOne({"product_id":x["product_id"],"day_index":int(x["day_index"])},{"$set":x},upsert=True))
    d.price_history.bulk_write(ops,ordered=False); c.close()
@app.on_event("startup")
def startup():
    global reg,clf,metrics
    df=pd.read_csv(DATA/"synthetic_price_history.csv"); reg,clf,metrics=train(df)
    try: seed(df); print("MongoDB seeded.")
    except Exception as e: print("MongoDB unavailable; database endpoints require MongoDB:",e)
@app.get("/")
def home(): return {"name":"PricePrawl ML API","data_notice":"Bundled data are synthetic."}
@app.get("/api/health")
def health():
    try: c,d=dbconn(); c.close(); status="connected"
    except Exception: status="disconnected"
    return {"api":"ok","mongodb":status,"models_loaded":reg is not None}
@app.get("/api/metrics")
def get_metrics(): return metrics
@app.get("/api/summary")
def summary():
    try:
        c,d=dbconn(); out={"products":d.products.count_documents({}),"observations":d.price_history.count_documents({}),"categories":len(d.products.distinct("category"))}; c.close(); return out
    except Exception as e: raise HTTPException(503,detail=f"MongoDB unavailable: {e}")
@app.get("/api/products")
def products(q:str="",category:str=""):
    try:
        c,d=dbconn(); query={}
        if category: query["category"]=category
        if q: query["$or"]=[{"product_name":{"$regex":q,"$options":"i"}},{"product_id":{"$regex":q,"$options":"i"}}]
        ps=list(d.products.find(query,{"_id":0}).sort("product_name",1).limit(300))
        for p in ps:
            h=d.price_history.find_one({"product_id":p["product_id"]},{"_id":0},sort=[("day_index",-1)])
            if h: p.update({k:h.get(k) for k in ["current_price","day_index","discount_pct","demand_index","competitor_price"]})
        c.close(); return {"products":ps,"total":len(ps)}
    except Exception as e: raise HTTPException(503,detail=f"MongoDB unavailable: {e}")
@app.get("/api/products/{pid}/history")
def history(pid:str):
    try:
        c,d=dbconn(); p=d.products.find_one({"product_id":pid},{"_id":0})
        if not p: raise HTTPException(404,detail="Product not found")
        hs=list(d.price_history.find({"product_id":pid},{"_id":0}).sort("day_index",1)); c.close()
        return {"product":p,"history":hs}
    except HTTPException: raise
    except Exception as e: raise HTTPException(503,detail=str(e))
@app.get("/api/products/{pid}/predict")
def predict(pid:str):
    try:
        c,d=dbconn(); p=d.products.find_one({"product_id":pid},{"_id":0}); h=d.price_history.find_one({"product_id":pid},{"_id":0},sort=[("day_index",-1)])
        if not p or not h: raise HTTPException(404,detail="Product not found")
        x=pd.DataFrame([{k:h[k] for k in NUM}|{"category":p["category"]}])
        price=max(0,float(reg.predict(x)[0])); drop=int(clf.predict(x)[0]); probs=clf.predict_proba(x)[0]
        classes=list(clf.named_steps["model"].classes_); prob=float(probs[classes.index(1)]) if 1 in classes else 0
        out={"product_id":pid,"predicted_next_day_price":round(price,2),"predicted_drop_within_7_days":bool(drop),"drop_probability":round(prob,4),"based_on_day_index":int(h["day_index"]),"is_synthetic_model":True,"created_at":datetime.now(timezone.utc)}
        d.predictions.insert_one(out); c.close(); out.pop("created_at", None); out.pop("_id", None); return out
    except HTTPException: raise
    except Exception as e: raise HTTPException(503,detail=f"Prediction failed: {e}")
class ProductIn(BaseModel):
    product_id:str=Field(min_length=2,max_length=40); product_name:str=Field(min_length=2,max_length=150)
    category:str; store:str="Manual entry"; current_price:float=Field(gt=0)
    discount_pct:float=Field(default=0,ge=0,le=100); demand_index:float=Field(default=50,ge=0,le=100); competitor_price:float=Field(gt=0)
@app.post("/api/products")
def add_product(p:ProductIn):
    try:
        c,d=dbconn()
        if d.products.find_one({"product_id":p.product_id}): raise HTTPException(409,detail="Product ID already exists")
        d.products.insert_one({"product_id":p.product_id,"product_name":p.product_name,"category":p.category,"store":p.store,"base_price":p.current_price,"is_synthetic":False})
        day=int(d.price_history.count_documents({}))
        d.price_history.insert_one({"product_id":p.product_id,"product_name":p.product_name,"category":p.category,"store":p.store,"day_index":day,"current_price":p.current_price,"discount_pct":p.discount_pct,"demand_index":p.demand_index,"competitor_price":p.competitor_price,"next_day_price":None,"price_drop_7d":0,"is_synthetic":False})
        c.close(); return {"message":"Product added","product_id":p.product_id}
    except HTTPException: raise
    except Exception as e: raise HTTPException(503,detail=str(e))
@app.post("/api/products/{pid}/price")
def add_price(pid:str,body:dict):
    try:
        price=float(body.get("price",0))
        if price<=0: raise HTTPException(422,detail="Price must be greater than zero")
        c,d=dbconn(); p=d.products.find_one({"product_id":pid})
        if not p: raise HTTPException(404,detail="Product not found")
        last=d.price_history.find_one({"product_id":pid},sort=[("day_index",-1)]); day=int(last["day_index"])+1
        d.price_history.insert_one({"product_id":pid,"product_name":p["product_name"],"category":p["category"],"store":p.get("store","Manual"),"day_index":day,"current_price":price,"discount_pct":float(body.get("discount_pct",0)),"demand_index":float(body.get("demand_index",50)),"competitor_price":float(body.get("competitor_price",price)),"next_day_price":None,"price_drop_7d":0,"is_synthetic":False,"recorded_at":datetime.now(timezone.utc)})
        c.close(); return {"message":"Price observation saved","day_index":day}
    except HTTPException: raise
    except Exception as e: raise HTTPException(503,detail=str(e))
