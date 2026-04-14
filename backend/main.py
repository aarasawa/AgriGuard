from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg
import os
from dotenv import load_dotenv
from typing import Optional

# load .env file from root
load_dotenv()

# instantiate FastAPI app
app = FastAPI(title="AgriGuard API")

# configure allowed origins, HTTP methods, and headers for requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"]
)

# establish a connection to PG db
def get_conn():
    return psycopg.connect(os.getenv("DATABASE_URL"))

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/records")
def get_records(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_km: float = Query(5.0, le=10.0),
):
    query = """
        SELECT
            comtrs, applic_dt, lbs_prd_used,
            site_code, county_cd, prodno,
            cen_lat83, cen_long83,
            ROUND((
                6371 * acos(
                    LEAST(1.0,
                        cos(radians(%s))
                        * cos(radians(cen_lat83))
                        * cos(radians(cen_long83) - radians(%s))
                        + sin(radians(%s))
                        * sin(radians(cen_lat83))
                    )
                )
            )::numeric, 2) AS distance_km
        FROM pur_applications
        WHERE cen_lat83 BETWEEN %s - (%s / 111.0) AND %s + (%s / 111.0)
        AND cen_long83 BETWEEN %s - (%s / 111.0) AND %s + (%s / 111.0)
        AND (
            6371 * acos(
                LEAST(1.0,
                    cos(radians(%s))
                    * cos(radians(cen_lat83))
                    * cos(radians(cen_long83) - radians(%s))
                    + sin(radians(%s))
                    * sin(radians(cen_lat83))
                )
            )
        ) <= %s
        ORDER BY distance_km
    """
    params = [
        lat, lon, lat, 
        lat, radius_km, lat, radius_km, 
        lon, radius_km, lon, radius_km, 
        lat, lon, lat, radius_km
    ]

    with get_conn() as conn:
        with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()

    features = []
    for row in rows:
        lat_val = row.get("cen_lat83")
        lon_val = row.get("cen_long83")
        if lat_val and lon_val:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(lon_val), float(lat_val)]
                },
                "properties": {
                    "comtrs": row.get("comtrs"),
                    "applic_dt": row.get("applic_dt"),
                    "lbs_prd_used": row.get("lbs_prd_used"),
                    "site_code": row.get("site_code"),
                    "county_cd": row.get("county_cd"),
                    "prodno": row.get("prodno"),
                    "distance_km": float(row.get("distance_km", 0))
                }
            })

    return {
        "type": "FeatureCollection",
        "features": features,
        "meta": {
            "center": {"lat": lat, "lon": lon},
            "radius_km": radius_km,
            "count": len(features)
        }
    }
    
@app.get("/chemicals")
def get_chemicals(
    county_cd: Optional[int] = Query(None)
):
    query = "SELECT DISTINCT prodno FROM pur_data WHERE ag_ind = 'A'"
    params = []
    if county_cd is not None:
        query += " AND county_cd = %s"
        params.append(county_cd)
    
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            prodnos = sorted([row[0] for row in cur.fetchall() if row[0]])
    
    return {"chemicals": prodnos}

@app.get("/search")
def search_records(
    county_cd: Optional[int] = Query(None),
    prodno: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(100, le=500)
):
    query = """
        SELECT
            comtrs, applic_dt, lbs_prd_used,
            site_code, county_cd, prodno, year
        FROM pur_applications
        WHERE cen_lat83 IS NOT NULL
    """
    params = []

    if county_cd is not None:
        query += " AND county_cd = %s"
        params.append(county_cd)
    if prodno is not None:
        query += " AND prodno = %s"
        params.append(prodno)
    if start_date:
        query += " AND TO_DATE(applic_dt, 'DD-MON-YYYY') >= TO_DATE(%s, 'YYYY-MM-DD')"
        params.append(start_date)
    if end_date:
        query += " AND TO_DATE(applic_dt, 'DD-MON-YYYY') <= TO_DATE(%s, 'YYYY-MM-DD')"
        params.append(end_date)

    query += " ORDER BY applic_dt DESC LIMIT %s"
    params.append(limit)

    with get_conn() as conn:
        with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()

    return {
        "results": [dict(row) for row in rows],
        "count": len(rows)
    }