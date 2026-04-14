"""
Load pre-joined PUR + PLSS data into Railway PostgreSQL.
Run after transform_data.py has generated pur_joined.csv.
"""

import psycopg2
import csv
import io
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
JOINED_FILE = r"C:\Users\aarasawa\Projects\AgriGuard\test_data\pur_joined.csv"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# ── Create table ───────────────────────────────────────────────────────────────

print("Creating pur_applications table...")
cur.execute("DROP TABLE IF EXISTS pur_applications CASCADE;")
cur.execute("""
CREATE TABLE pur_applications (
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
    error_flag      text,
    cen_lat83       double precision,
    cen_long83      double precision
);
""")
conn.commit()
print("Table created.")

# ── Load with copy_from ────────────────────────────────────────────────────────

print("Loading pur_joined.csv...")

import io

def clean_csv_to_tsv(filepath):
    """Convert CSV with quoted fields to tab-separated for copy_from"""
    buf = io.StringIO()
    with open(filepath, 'r') as f:
        reader = csv.reader(f)
        next(reader)  # skip header
        for row in reader:
            # replace any tabs in values, join with tab separator
            cleaned = [field.replace('\t', ' ').replace('\n', ' ') if field.lower() != 'null' else '' for field in row]
            buf.write('\t'.join(cleaned) + '\n')
    buf.seek(0)
    return buf

buf = clean_csv_to_tsv(JOINED_FILE)

cur.copy_from(
    buf,
    'pur_applications',
    sep='\t',
    columns=(
        'year', 'use_no', 'record_id', 'ag_ind', 'prodno',
        'lbs_prd_used', 'amt_prd_used', 'unit_of_meas',
        'acre_planted', 'unit_planted', 'acre_treated', 'unit_treated',
        'applic_cnt', 'applic_dt', 'applic_time', 'county_cd',
        'base_ln_mer', 'township', 'tship_dir', 'range', 'range_dir',
        'section', 'comtrs', 'grower_id', 'site_loc_id', 'license_no',
        'site_code', 'qualify_cd', 'planting_seq', 'aer_gnd_ind',
        'fume_cd', 'pre_plant', 'error_flag',
        'cen_lat83', 'cen_long83'
    ),
    null=''
)

conn.commit()
print("Data loaded.")

# ── Indexes ────────────────────────────────────────────────────────────────────

print("Creating indexes...")
cur.execute("CREATE INDEX idx_app_county ON pur_applications(county_cd);")
cur.execute("CREATE INDEX idx_app_comtrs ON pur_applications(comtrs);")
cur.execute("CREATE INDEX idx_app_year ON pur_applications(year);")
cur.execute("CREATE INDEX idx_app_location ON pur_applications(cen_lat83, cen_long83);")
conn.commit()
print("Indexes created.")

# ── Verify ─────────────────────────────────────────────────────────────────────

cur.execute("SELECT COUNT(*) FROM pur_applications;")
count = cur.fetchone()[0]
print(f"\nTotal rows loaded: {count:,}")

cur.execute("""
    SELECT county_cd, COUNT(*) as records
    FROM pur_applications
    GROUP BY county_cd
    ORDER BY records DESC
    LIMIT 10;
""")
print("\nTop 10 counties by record count:")
for row in cur.fetchall():
    print(f"  County {row[0]}: {row[1]:,} records")

cur.close()
conn.close()
print("\nAll complete.")