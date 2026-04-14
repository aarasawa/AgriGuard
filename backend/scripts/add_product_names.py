import psycopg2
import csv
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
PRODUCT_FILE = os.getenv("PRODUCT_FILE")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Add column
print("Adding product_name column...")
cur.execute("ALTER TABLE pur_applications ADD COLUMN IF NOT EXISTS product_name text;")
conn.commit()

# Create temp lookup table
print("Creating temp product table...")
cur.execute("DROP TABLE IF EXISTS product_lookup;")
cur.execute("""
    CREATE TABLE product_lookup (
        prodno bigint PRIMARY KEY,
        product_name text
    );
""")
conn.commit()

# Load all products into temp table using copy_from
print("Loading products into temp table...")
import io
buf = io.StringIO()
with open(PRODUCT_FILE, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            prodno = int(row['prodno'])
            name = row['product_name'].strip().strip('"').replace('\t', ' ')
            buf.write(f"{prodno}\t{name}\n")
        except:
            continue

buf.seek(0)
cur.copy_from(buf, 'product_lookup', sep='\t', columns=('prodno', 'product_name'))
conn.commit()

cur.execute("SELECT COUNT(*) FROM product_lookup;")
print(f"Products loaded: {cur.fetchone()[0]:,}")

# Single SQL UPDATE joining both tables
print("Updating pur_applications — this may take a few minutes...")
cur.execute("""
    UPDATE pur_applications a
    SET product_name = p.product_name
    FROM product_lookup p
    WHERE a.prodno = p.prodno;
""")
conn.commit()

cur.execute("SELECT COUNT(*) FROM pur_applications WHERE product_name IS NOT NULL;")
print(f"Rows updated: {cur.fetchone()[0]:,}")

# Clean up temp table
cur.execute("DROP TABLE IF EXISTS product_lookup;")
conn.commit()

cur.close()
conn.close()
print("Done.")