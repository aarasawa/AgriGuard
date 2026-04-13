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
    county_cd: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    min_lat: Optional[float] = Query(None),
    max_lat: Optional[float] = Query(None),
    min_lon: Optional[float] = Query(None),
    max_lon: Optional[float] = Query(None),
    limit: int = Query(200, le=2000)
):
    query = """
        SELECT
            comtrs, applic_dt, lbs_prd_used,
            site_code, county_cd, prodno,
            cen_lat83, cen_long83
        FROM pur_applications
        WHERE cen_lat83 IS NOT NULL
        AND cen_long83 IS NOT NULL
    """
    params = []

    if county_cd is not None:
        query += " AND county_cd = %s"
        params.append(county_cd)
    if year is not None:
        query += " AND year = %s"
        params.append(year)
    if min_lat is not None:
        query += " AND cen_lat83 >= %s"
        params.append(min_lat)
    if max_lat is not None:
        query += " AND cen_lat83 <= %s"
        params.append(max_lat)
    if min_lon is not None:
        query += " AND cen_long83 >= %s"
        params.append(min_lon)
    if max_lon is not None:
        query += " AND cen_long83 <= %s"
        params.append(max_lon)

    query += " LIMIT %s"
    params.append(limit)

    with get_conn() as conn:
        with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()

    features = []
    for row in rows:
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

    return {"type": "FeatureCollection", "features": features}
    
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