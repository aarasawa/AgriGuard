"""
One-time script to load PUR data and PLSS lookup into Railway PostgreSQL.
Run from the backend/ directory with venv activated:
    python load_data.py
"""

import psycopg2
import csv
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# ── Create tables ──────────────────────────────────────────────────────────────

print("Creating tables...")

cur.execute("DROP TABLE IF EXISTS pur_data CASCADE;")
cur.execute("""
CREATE TABLE pur_data (
    year            bigint,
    use_no          bigint,
    record_id       text,
    ag_ind          text,
    prodno          bigint,
    lbs_prd_used    double precision,
    amt_prd_used    double precision,
    unit_of_meas    text,
    acre_planted    text,
    unit_planted    text,
    acre_treated    text,
    unit_treated    text,
    applic_cnt      bigint,
    applic_dt       text,
    applic_time     bigint,
    county_cd       bigint,
    base_ln_mer     text,
    township        text,
    tship_dir       text,
    range           text,
    range_dir       text,
    section         bigint,
    comtrs          text,
    grower_id       text,
    site_loc_id     text,
    license_no      text,
    site_code       bigint,
    qualify_cd      bigint,
    planting_seq    bigint,
    aer_gnd_ind     text,
    fume_cd         bigint,
    pre_plant       text,
    error_flag      text
);
""")

# cur.execute("DROP TABLE IF EXISTS plss_lookup CASCADE;")
# cur.execute("""
# CREATE TABLE plss_lookup (
#     id          serial PRIMARY KEY,
#     co_mtrs     text,
#     county_cd   text,
#     base_ln_me  text,
#     township    text,
#     range       text,
#     section     text,
#     cen_lat83   double precision,
#     cen_long83  double precision,
#     source_id   text
# );
# """)

conn.commit()
print("Tables created.")

# ── Load PLSS lookup ───────────────────────────────────────────────────────────

# print("Loading plss_lookup...")
# plss_path = os.path.join(os.path.dirname(__file__), '..', 'test_data', 'plss_lookup_statewide_rows.csv')

# with open(plss_path, 'r') as f:
#     next(f)  # skip header
#     cur.copy_from(
#         f,
#         'plss_lookup',
#         sep=',',
#         columns=('co_mtrs', 'county_cd', 'base_ln_me', 'township', 'range', 'section', 'cen_lat83', 'cen_long83', 'source_id'),
#         null=''
#     )

# conn.commit()
# print("plss_lookup loaded.")

# ── Load PUR data ──────────────────────────────────────────────────────────────

print("Loading pur_data...")

PUR_FILE = r"C:\Users\aarasawa\Downloads\pur2023\pur2023\pur_data\PUR2023.txt"

def safe_int(val):
    try:
        return int(float(val)) if val and val.strip() and val.strip().lower() != 'null' else None
    except:
        return None

def safe_float(val):
    try:
        return float(val) if val and val.strip() and val.strip().lower() != 'null' else None
    except:
        return None

def safe_str(val):
    if not val or val.strip().lower() == 'null' or val.strip() == '':
        return None
    return val.strip()

total = 0
skipped = 0
batch = []
BATCH_SIZE = 5000

with open(PUR_FILE, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('ag_ind', '').strip() != 'A':
            skipped += 1
            continue

        batch.append((
            safe_int(row['year']),
            safe_int(row['use_no']),
            safe_str(row['record_id']),
            safe_str(row['ag_ind']),
            safe_int(row['prodno']),
            safe_float(row['lbs_prd_used']),
            safe_float(row['amt_prd_used']),
            safe_str(row['unit_of_meas']),
            safe_str(row['acre_planted']),
            safe_str(row['unit_planted']),
            safe_str(row['acre_treated']),
            safe_str(row['unit_treated']),
            safe_int(row['applic_cnt']),
            safe_str(row['applic_dt']),
            safe_int(row['applic_time']),
            safe_int(row['county_cd']),
            safe_str(row['base_ln_mer']),
            safe_str(row['township']),
            safe_str(row['tship_dir']),
            safe_str(row['range']),
            safe_str(row['range_dir']),
            safe_int(row['section']),
            safe_str(row['comtrs']),
            safe_str(row['grower_id']),
            safe_str(row['site_loc_id']),
            safe_str(row['license_no']),
            safe_int(row['site_code']),
            safe_int(row['qualify_cd']),
            safe_int(row['planting_seq']),
            safe_str(row['aer_gnd_ind']),
            safe_int(row['fume_cd']),
            safe_str(row['pre_plant']),
            safe_str(row['error_flag']),
        ))

        if len(batch) >= BATCH_SIZE:
            cur.executemany("""
                INSERT INTO pur_data VALUES (
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
                )
            """, batch)
            conn.commit()
            total += len(batch)
            batch = []
            print(f"  {total:,} ag records inserted, {skipped:,} non-ag skipped...")

    if batch:
        cur.executemany("""
            INSERT INTO pur_data VALUES (
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
            )
        """, batch)
        conn.commit()
        total += len(batch)

print(f"\nDone. {total:,} ag records loaded, {skipped:,} non-ag skipped.")

# ── Indexes ────────────────────────────────────────────────────────────────────

print("Creating indexes...")
cur.execute("CREATE INDEX idx_pur_comtrs ON pur_data(comtrs);")
cur.execute("CREATE INDEX idx_pur_county_ag ON pur_data(county_cd, ag_ind);")
conn.commit()
print("Indexes created.")

# ── Stored function ────────────────────────────────────────────────────────────

print("Creating stored function...")
cur.execute("""
CREATE OR REPLACE FUNCTION get_records_with_coords(
    p_county_cd bigint DEFAULT NULL,
    p_year bigint DEFAULT NULL,
    p_min_lat float DEFAULT NULL,
    p_max_lat float DEFAULT NULL,
    p_min_lon float DEFAULT NULL,
    p_max_lon float DEFAULT NULL,
    p_limit int DEFAULT 200
)
RETURNS TABLE (
    comtrs text,
    applic_dt text,
    lbs_prd_used float,
    site_code bigint,
    county_cd bigint,
    prodno bigint,
    cen_lat83 float,
    cen_long83 float
)
LANGUAGE sql
AS $$
    SELECT
        td.comtrs,
        td.applic_dt,
        td.lbs_prd_used,
        td.site_code,
        td.county_cd,
        td.prodno,
        pl.cen_lat83,
        pl.cen_long83
    FROM pur_data td
    JOIN plss_lookup pl ON td.comtrs = pl.co_mtrs
    WHERE td.ag_ind = 'A'
        AND td.comtrs IS NOT NULL
        AND td.county_cd = p_county_cd
    LIMIT p_limit;
$$;
""")
conn.commit()

cur.close()
conn.close()
print("Done. Database ready.")