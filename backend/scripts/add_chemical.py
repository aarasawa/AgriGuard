import psycopg2
import csv
import io
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
BASE = r"C:\Users\aarasawa\Projects\AgriGuard\test_data\lookup_tables"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# ── Load CHEMICAL lookup ───────────────────────────────────────
print("Loading chemical lookup...")
cur.execute("DROP TABLE IF EXISTS chem_lookup;")
cur.execute("""
    CREATE TABLE chem_lookup (
        chem_code bigint PRIMARY KEY,
        chemname text
    );
""")

buf = io.StringIO()
with open(f"{BASE}\\CHEMICAL.txt", 'r', encoding='latin-1') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            code = int(row['chem_code'])
            name = row['chemname'].strip().replace('\t', ' ')
            buf.write(f"{code}\t{name}\n")
        except:
            continue

buf.seek(0)
cur.copy_from(buf, 'chem_lookup', sep='\t', columns=('chem_code', 'chemname'))
conn.commit()
cur.execute("SELECT COUNT(*) FROM chem_lookup")
print(f"  Chemicals loaded: {cur.fetchone()[0]:,}")

# ── Load CHEM_CAS lookup ───────────────────────────────────────
print("Loading CAS number lookup...")
cur.execute("DROP TABLE IF EXISTS chem_cas_lookup;")
cur.execute("""
    CREATE TABLE chem_cas_lookup (
        chem_code bigint,
        cas_number text
    );
""")

buf = io.StringIO()
with open(f"{BASE}\\CHEM_CAS.txt", 'r', encoding='latin-1') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            code = int(row['chem_code'])
            cas = row['cas_number'].strip()
            buf.write(f"{code}\t{cas}\n")
        except:
            continue

buf.seek(0)
cur.copy_from(buf, 'chem_cas_lookup', sep='\t', columns=('chem_code', 'cas_number'))
conn.commit()
cur.execute("SELECT COUNT(*) FROM chem_cas_lookup")
print(f"  CAS numbers loaded: {cur.fetchone()[0]:,}")

# ── Load PROD_CHEM lookup ──────────────────────────────────────
print("Loading product-chemical lookup...")
cur.execute("DROP TABLE IF EXISTS prod_chem_lookup;")
cur.execute("""
    CREATE TABLE prod_chem_lookup (
        prodno bigint,
        chem_code bigint,
        prodchem_pct float
    );
""")

buf = io.StringIO()
with open(f"{BASE}\\PROD_CHEM.txt", 'r', encoding='latin-1') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            prodno = int(row['prodno'])
            chem_code = int(row['chem_code'])
            pct = float(row['prodchem_pct']) if row['prodchem_pct'].strip() else 0
            buf.write(f"{prodno}\t{chem_code}\t{pct}\n")
        except:
            continue

buf.seek(0)
cur.copy_from(buf, 'prod_chem_lookup', sep='\t', columns=('prodno', 'chem_code', 'prodchem_pct'))
conn.commit()
cur.execute("SELECT COUNT(*) FROM prod_chem_lookup")
print(f"  Product-chemical links loaded: {cur.fetchone()[0]:,}")

# ── Add columns to pur_applications ───────────────────────────
print("Adding chemname and cas_number columns...")
cur.execute("ALTER TABLE pur_applications ADD COLUMN IF NOT EXISTS chemname text;")
cur.execute("ALTER TABLE pur_applications ADD COLUMN IF NOT EXISTS cas_number text;")
conn.commit()

# ── Update with primary active ingredient ─────────────────────
# Use the chemical with highest percentage per product
print("Updating pur_applications with chemical info...")
cur.execute("""
    UPDATE pur_applications a
    SET 
        chemname = cl.chemname,
        cas_number = cc.cas_number
    FROM (
        SELECT DISTINCT ON (prodno)
            prodno,
            chem_code
        FROM prod_chem_lookup
        WHERE chem_code != 0
        ORDER BY prodno, prodchem_pct DESC
    ) pc
    JOIN chem_lookup cl ON pc.chem_code = cl.chem_code
    LEFT JOIN chem_cas_lookup cc ON pc.chem_code = cc.chem_code
    WHERE a.prodno = pc.prodno;
""")
conn.commit()

cur.execute("SELECT COUNT(*) FROM pur_applications WHERE chemname IS NOT NULL")
print(f"Rows updated with chemical name: {cur.fetchone()[0]:,}")

cur.execute("SELECT COUNT(*) FROM pur_applications WHERE cas_number IS NOT NULL")
print(f"Rows updated with CAS number: {cur.fetchone()[0]:,}")

# ── Sample check ───────────────────────────────────────────────
cur.execute("""
    SELECT product_name, chemname, cas_number 
    FROM pur_applications 
    WHERE cas_number IS NOT NULL 
    LIMIT 5
""")
print("\nSample rows:")
for row in cur.fetchall():
    print(f"  {row[0]} → {row[1]} (CAS: {row[2]})")

# ── Cleanup temp tables ────────────────────────────────────────
cur.execute("DROP TABLE IF EXISTS chem_lookup;")
cur.execute("DROP TABLE IF EXISTS chem_cas_lookup;")
cur.execute("DROP TABLE IF EXISTS prod_chem_lookup;")
conn.commit()

cur.close()
conn.close()
print("\nDone.")