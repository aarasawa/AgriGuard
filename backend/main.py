from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg
import os
from functools import lru_cache
import httpx
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
    product_name: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(100, le=500)
):
    query = """
        SELECT
            comtrs, applic_dt, lbs_prd_used,
            site_code, county_cd, prodno,
            product_name, year,
            cen_lat83, cen_long83
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
    if product_name:
        query += " AND product_name ILIKE %s"
        params.append(f"%{product_name}%")
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

@lru_cache(maxsize=500)
def fetch_pubchem_data(cas_number: str):
    try:
        # Step 1 — get CID from CAS
        cid_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{cas_number}/cids/JSON"
        r = httpx.get(cid_url, timeout=5)
        if r.status_code != 200:
            return None
        cid = r.json()["IdentifierList"]["CID"][0]

        # Step 2 — fetch Safety and Hazards section
        view_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON?heading=Safety+and+Hazards"
        r2 = httpx.get(view_url, timeout=10)
        if r2.status_code != 200:
            return None

        data = r2.json()
        result = {
            "cid": cid,
            "pubchem_url": f"https://pubchem.ncbi.nlm.nih.gov/compound/{cid}#section=Safety-and-Hazards",
            "signal_word": None,
            "pictograms": [],
            "hazard_statements": [],
            "symptoms": None,
            "exposure_routes": None,
            "target_organs": None,
            "short_term_effects": None,
            "long_term_effects": None,
            "first_aid": {}
        }

        def get_strings(info_list):
            return [
                s.get("String", "")
                for item in info_list
                for s in item.get("Value", {}).get("StringWithMarkup", [])
                if s.get("String", "").strip()
            ]

        def walk_sections(sections):
            for section in sections:
                heading = section.get("TOCHeading", "")
                info = section.get("Information", [])

                if heading == "GHS Classification":
                    for item in info:
                        name = item.get("Name", "")
                        strings = item.get("Value", {}).get("StringWithMarkup", [])
                        if name == "Signal":
                            result["signal_word"] = strings[0]["String"] if strings else None
                        elif name == "GHS Hazard Statements":
                            result["hazard_statements"] = [
                                s["String"] for s in strings if s.get("String", "").strip()
                            ]
                        elif name == "Pictogram(s)":
                            for s in strings:
                                for markup in s.get("Markup", []):
                                    if markup.get("Extra"):
                                        result["pictograms"].append(markup["Extra"])

                elif heading == "Health Hazards" and info:
                    texts = get_strings(info)
                    for text in texts:
                        if text.startswith("Exposure Routes:"):
                            result["exposure_routes"] = text.replace("Exposure Routes:", "").strip()
                        elif text.startswith("Symptoms:"):
                            result["symptoms"] = text.replace("Symptoms:", "").strip()
                        elif text.startswith("Target Organs:"):
                            result["target_organs"] = text.replace("Target Organs:", "").strip()

                elif heading == "Effects of Short Term Exposure" and info:
                    texts = get_strings(info)
                    if texts:
                        result["short_term_effects"] = texts[0]

                elif heading == "Effects of Long Term Exposure" and info:
                    texts = get_strings(info)
                    if texts:
                        result["long_term_effects"] = texts[0]

                elif heading == "First Aid Measures":
                    for item in info:
                        name = item.get("Name", "")
                        strings = item.get("Value", {}).get("StringWithMarkup", [])
                        text = strings[0]["String"] if strings else ""
                        if name and text:
                            result["first_aid"][name] = text

                # recurse into subsections
                if "Section" in section:
                    walk_sections(section["Section"])

        top_sections = data.get("Record", {}).get("Section", [])
        walk_sections(top_sections)

        return result
    except Exception as e:
        print(f"PubChem fetch error for {cas_number}: {e}")
        return None