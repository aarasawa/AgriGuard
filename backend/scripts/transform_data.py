import csv

PUR_FILE = r"C:\Users\aarasawa\Downloads\pur2023\pur2023\pur_data\PUR2023.txt"
PLSS_FILE = r"C:\Users\aarasawa\Projects\AgriGuard\test_data\plss_lookup_statewide_rows.csv"
OUTPUT_FILE = r"C:\Users\aarasawa\Projects\AgriGuard\test_data\pur_joined.csv"

# Step 1 — load PLSS lookup into memory as a dict
print("Loading PLSS lookup...")
plss = {}
with open(PLSS_FILE, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        key = row['CO_MTRS'].strip()
        plss[key] = (row['CEN_LAT83'], row['CEN_LONG83'])

print(f"PLSS lookup loaded: {len(plss):,} sections")

# Step 2 — stream PUR file, filter to ag, join, write output
print("Processing PUR2023.txt...")
total = 0
skipped_nonag = 0
skipped_nojoin = 0

with open(PUR_FILE, 'r') as infile, open(OUTPUT_FILE, 'w', newline='') as outfile:
    reader = csv.DictReader(infile)
    
    fieldnames = [
        'year', 'use_no', 'record_id', 'ag_ind', 'prodno',
        'lbs_prd_used', 'amt_prd_used', 'unit_of_meas',
        'acre_planted', 'unit_planted', 'acre_treated', 'unit_treated',
        'applic_cnt', 'applic_dt', 'applic_time', 'county_cd',
        'base_ln_mer', 'township', 'tship_dir', 'range', 'range_dir',
        'section', 'comtrs', 'grower_id', 'site_loc_id', 'license_no',
        'site_code', 'qualify_cd', 'planting_seq', 'aer_gnd_ind',
        'fume_cd', 'pre_plant', 'error_flag',
        'cen_lat83', 'cen_long83'  # joined columns
    ]
    
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()
    
    for row in reader:
        # skip non-ag
        if row.get('ag_ind', '').strip() != 'A':
            skipped_nonag += 1
            continue
        
        # skip if no comtrs match
        comtrs = row.get('comtrs', '').strip()
        if not comtrs or comtrs not in plss:
            skipped_nojoin += 1
            continue
        
        lat, lon = plss[comtrs]
        
        writer.writerow({
            'year': row['year'],
            'use_no': row['use_no'],
            'record_id': row['record_id'],
            'ag_ind': row['ag_ind'],
            'prodno': row['prodno'],
            'lbs_prd_used': row['lbs_prd_used'],
            'amt_prd_used': row['amt_prd_used'],
            'unit_of_meas': row['unit_of_meas'],
            'acre_planted': row['acre_planted'],
            'unit_planted': row['unit_planted'],
            'acre_treated': row['acre_treated'],
            'unit_treated': row['unit_treated'],
            'applic_cnt': row['applic_cnt'],
            'applic_dt': row['applic_dt'],
            'applic_time': row['applic_time'],
            'county_cd': row['county_cd'],
            'base_ln_mer': row['base_ln_mer'],
            'township': row['township'],
            'tship_dir': row['tship_dir'],
            'range': row['range'],
            'range_dir': row['range_dir'],
            'section': row['section'],
            'comtrs': comtrs,
            'grower_id': row['grower_id'],
            'site_loc_id': row['site_loc_id'],
            'license_no': row['license_no'],
            'site_code': row['site_code'],
            'qualify_cd': row['qualify_cd'],
            'planting_seq': row['planting_seq'],
            'aer_gnd_ind': row['aer_gnd_ind'],
            'fume_cd': row['fume_cd'],
            'pre_plant': row['pre_plant'],
            'error_flag': row['error_flag'],
            'cen_lat83': lat,
            'cen_long83': lon
        })
        
        total += 1
        if total % 100000 == 0:
            print(f"  {total:,} records written...")

print(f"\nDone.")
print(f"  Records written: {total:,}")
print(f"  Non-ag skipped: {skipped_nonag:,}")
print(f"  No join match: {skipped_nojoin:,}")
print(f"  Output: {OUTPUT_FILE}")