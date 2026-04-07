from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

app = FastAPI(title="AgriGuard API")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_methods=["GET"],
  allow_headers=["*"],
)

supabase = create_client(
  os.getenv("VITE_SUPABASE_URL"),
  os.getenv("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY")
)

@app.get("/records")
def get_records(
    county_cd: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    min_lat: Optional[float] = Query(None),
    max_lat: Optional[float] = Query(None),
    min_lon: Optional[float] = Query(None),
    max_lon: Optional[float] = Query(None),
    limit: int = Query(500, le=2000)
):
    params = {"p_limit": limit}
    
    if county_cd is not None:
        params["p_county_cd"] = county_cd
    if year is not None:
        params["p_year"] = year
    if min_lat is not None:
        params["p_min_lat"] = min_lat
    if max_lat is not None:
        params["p_max_lat"] = max_lat
    if min_lon is not None:
        params["p_min_lon"] = min_lon
    if max_lon is not None:
        params["p_max_lon"] = max_lon

    result = supabase.rpc("get_records_with_coords", params).execute()

    features = []
    for row in result.data:
        lat = row.get("cen_lat83")
        lon = row.get("cen_long83")
        if lat and lon:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(lon), float(lat)]
                },
                "properties": {
                    "comtrs": row.get("comtrs"),
                    "applic_dt": row.get("applic_dt"),
                    "lbs_prd_used": row.get("lbs_prd_used"),
                    "site_code": row.get("site_code"),
                    "county_cd": row.get("county_cd"),
                    "prodno": row.get("prodno")
                }
            })

    # result = supabase.rpc("get_records_with_coords", params).execute()
    # print("PARAMS:", params)
    # print("DATA:", result.data)
    # print("COUNT:", len(result.data) if result.data else 0)

    return {"type": "FeatureCollection", "features": features}

@app.get("/chemicals")
def get_chemicals(county_cd: Optional[str] = Query(None)):
    query = supabase.table("pur_2023") \
        .select("prodno") \
        .eq("ag_ind", "A") \
        .limit(1000)
    
    if county_cd:
        query = query.eq("county_cd", county_cd)
    
    result = query.execute()
    prodnos = sorted(set(r["prodno"] for r in result.data if r.get("prodno")))
    return {"chemicals": prodnos}

""" @app.get("/debug")
def debug():
    try:
        result = supabase.rpc("get_records_with_coords", {
            "p_county_cd": 42,
            "p_limit": 5
        }).execute()
        return {
            "data": result.data,
            "count": len(result.data) if result.data else 0
        }
    except Exception as e:
        return {"error": str(e)} """
    
""" @app.get("/debug2")
def debug2():
    try:
        result = supabase.table("test_data") \
            .select("comtrs, county_cd, ag_ind") \
            .eq("county_cd", 42) \
            .eq("ag_ind", "A") \
            .limit(5) \
            .execute()
        return {"data": result.data, "count": len(result.data)}
    except Exception as e:
        return {"error": str(e)} """